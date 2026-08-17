'use strict';
const fs=require('fs');
const vm=require('vm');
const assert=require('assert');

function element(id){return{id,style:{display:id==='login-screen'?'flex':'none'},classList:{items:new Set(),add(v){this.items.add(v);},contains(v){return this.items.has(v);}},remove(){this.removed=true;}};}
const els={
  'login-screen':element('login-screen'),
  'auth-error':element('auth-error'),
  'screen-home':element('screen-home'),
  'prelogin-css':element('prelogin-css')
};
const winEvents={},docEvents={};
let currentUser={uid:'alpha-user',displayName:'Alpha'};
let loadCalls=0,flushCalls=0,contextRefreshes=0,identitySyncs=0;
const pendingLoads=[];
const window={
  fbUser:currentUser,
  fbAuth:{get currentUser(){return currentUser;}},
  _appStarted:false,
  addEventListener(name,fn){(winEvents[name]||(winEvents[name]=[])).push(fn);},
  dispatchEvent(){},
  renderNav(){},renderHome(){},renderNotifs(){},updateHomeXP(){},
  showScreen(){els['screen-home'].classList.add('active');},
  loadUserFamily(){
    const uid=window.fbUser&&window.fbUser.uid;
    loadCalls++;
    return new Promise(resolve=>pendingLoads.push({uid,resolve}));
  },
  HouseholdContext:{refresh(){contextRefreshes++;}},
  HouseholdIdentityFirebaseBridge:{sync(){identitySyncs++;}},
  FamilyDataStore:{flushPending(){flushCalls++;return Promise.resolve({});}},
  offlineMode:false
};
const document={
  body:{classList:{items:new Set(),add(v){this.items.add(v);},contains(v){return this.items.has(v);}}},
  visibilityState:'visible',
  getElementById(id){return els[id]||null;},
  addEventListener(name,fn){(docEvents[name]||(docEvents[name]=[])).push(fn);},
  readyState:'complete'
};
const timers=[];
const context={window,document,console,CustomEvent:function(name,init){this.type=name;this.detail=init&&init.detail;},setTimeout(fn){timers.push(fn);return timers.length;},clearTimeout(){},Promise,Date,JSON,Object,Array,String,Math};
context.firebase={auth:()=>({get currentUser(){return currentUser;}})};
vm.createContext(context);
vm.runInContext(fs.readFileSync('src/core/authSessionBootstrap.js','utf8'),context,{filename:'authSessionBootstrap.js'});

function resolvePending(uid,value){
  const index=pendingLoads.findIndex(x=>x.uid===uid);
  assert(index>=0,'expected pending load for '+uid);
  const entry=pendingLoads.splice(index,1)[0];
  entry.resolve(value||{id:uid.replace('-user','-household')});
}

(async()=>{
  // Start Alpha boot. loadUserFamily is scheduled in a Promise microtask.
  const alphaBoot=window.AuthSessionBootstrap.boot(currentUser);
  await Promise.resolve();
  assert.equal(loadCalls,1);
  assert.equal(pendingLoads[0].uid,'alpha-user');

  // Switch UID before Alpha household resolution completes.
  currentUser={uid:'beta-user',displayName:'Beta'};
  window.fbUser=currentUser;
  const betaBoot=window.AuthSessionBootstrap.boot(currentUser);
  await Promise.resolve();
  assert.equal(loadCalls,2,'new UID must start a new boot generation');
  assert(pendingLoads.some(x=>x.uid==='beta-user'));

  // Resolve stale Alpha first. It must not render or mark the app started for Alpha.
  resolvePending('alpha-user',{id:'alpha-household'});
  await alphaBoot;
  assert.equal(window.AuthSessionBootstrap.status().uid,'beta-user');
  assert.notEqual(window.AuthSessionBootstrap.status().bootedUid,'alpha-user');
  assert.equal(window._appStarted,false,'stale Alpha boot must not reveal the app');

  // Resolve Beta. Only the current generation may reveal the app.
  resolvePending('beta-user',{id:'beta-household'});
  await betaBoot;
  assert.equal(window.AuthSessionBootstrap.status().uid,'beta-user');
  assert.equal(window.AuthSessionBootstrap.status().bootedUid,'beta-user');
  assert.equal(window._appStarted,true);
  assert.equal(els['login-screen'].style.display,'none');

  // Session clear must invalidate rendered state.
  (winEvents['familyapp:session:cleared']||[]).forEach(fn=>fn({}));
  assert.equal(window._appStarted,false);
  assert.equal(window.AuthSessionBootstrap.status().bootedUid,null);

  // Resume from BFCache must restart authenticated session. Trigger the real
  // pageshow handler, then await the idempotent recovery promise explicitly.
  window.loadUserFamily=()=>Promise.resolve({id:'beta-household'});
  const pageShowHandler=(winEvents.pageshow||[])[0];
  assert.equal(typeof pageShowHandler,'function');
  pageShowHandler({persisted:true});
  await window.AuthSessionBootstrap.recover('pageshow-bfcache-test');
  assert.equal(window._appStarted,true);
  assert.equal(window.AuthSessionBootstrap.status().bootedUid,'beta-user');

  // Visible resume on started session should refresh context/identity and flush pending data.
  const refreshBefore=contextRefreshes, syncBefore=identitySyncs, flushBefore=flushCalls;
  (docEvents.visibilitychange||[]).forEach(fn=>fn());
  await window.AuthSessionBootstrap.recover('visibility-visible-test');
  assert(contextRefreshes>refreshBefore,'visible resume should refresh HouseholdContext');
  assert(identitySyncs>syncBefore,'visible resume should resync household identity');
  assert(flushCalls>flushBefore,'visible resume should flush pending writes when online');

  // Offline recovery must not flush; online recovery must flush again.
  window.offlineMode=true;
  const offlineBefore=flushCalls;
  await window.AuthSessionBootstrap.recover('offline-check');
  assert.equal(flushCalls,offlineBefore);
  window.offlineMode=false;
  (winEvents.online||[]).forEach(fn=>fn());
  await window.AuthSessionBootstrap.recover('online-test');
  assert(flushCalls>offlineBefore);

  console.log('auth-session-bootstrap-lifecycle: PASS');
})().catch(err=>{console.error(err);process.exit(1);});