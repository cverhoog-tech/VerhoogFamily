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
let resolveLoad=null;
let loadCalls=0,flushCalls=0,contextRefreshes=0,identitySyncs=0;
const window={
  fbUser:currentUser,
  fbAuth:{get currentUser(){return currentUser;}},
  _appStarted:false,
  addEventListener(name,fn){(winEvents[name]||(winEvents[name]=[])).push(fn);},
  dispatchEvent(){},
  renderNav(){},renderHome(){},renderNotifs(){},updateHomeXP(){},
  showScreen(){els['screen-home'].classList.add('active');},
  loadUserFamily(){loadCalls++;return new Promise(r=>{resolveLoad=r;});},
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

(async()=>{
  // Start Alpha boot, then switch UID before household resolution completes.
  const alphaBoot=window.AuthSessionBootstrap.boot(currentUser);
  assert.equal(loadCalls,1);
  currentUser={uid:'beta-user',displayName:'Beta'};window.fbUser=currentUser;
  const betaBoot=window.AuthSessionBootstrap.boot(currentUser);
  assert.equal(loadCalls,2,'new UID must start a new boot generation');
  resolveLoad();
  await Promise.resolve();
  // Resolve the second load explicitly by swapping loader to immediate success and recover.
  window.loadUserFamily=()=>Promise.resolve({id:'beta-household'});
  await window.AuthSessionBootstrap.recover('uid-switch-test');
  await alphaBoot;
  await betaBoot.catch(()=>false);
  assert.equal(window.AuthSessionBootstrap.status().uid,'beta-user');
  assert.equal(window.AuthSessionBootstrap.status().bootedUid,'beta-user');
  assert.equal(window._appStarted,true);
  assert.equal(els['login-screen'].style.display,'none');

  // Session clear must invalidate rendered state.
  (winEvents['familyapp:session:cleared']||[]).forEach(fn=>fn({}));
  assert.equal(window._appStarted,false);
  assert.equal(window.AuthSessionBootstrap.status().bootedUid,null);

  // Resume from BFCache must restart authenticated session.
  await (winEvents.pageshow||[])[0]({persisted:true});
  await Promise.resolve();
  assert.equal(window._appStarted,true);

  // Visible resume on started session should refresh context/identity and flush pending data.
  const refreshBefore=contextRefreshes, syncBefore=identitySyncs, flushBefore=flushCalls;
  (docEvents.visibilitychange||[]).forEach(fn=>fn());
  await Promise.resolve();
  assert(contextRefreshes>refreshBefore,'visible resume should refresh HouseholdContext');
  assert(identitySyncs>syncBefore,'visible resume should resync household identity');
  assert(flushCalls>flushBefore,'visible resume should flush pending writes when online');

  // Offline online transition: no flush while offline, flush after online recovery.
  window.offlineMode=true;
  const offlineBefore=flushCalls;
  await window.AuthSessionBootstrap.recover('offline-check');
  assert.equal(flushCalls,offlineBefore);
  window.offlineMode=false;
  (winEvents.online||[]).forEach(fn=>fn());
  await Promise.resolve();
  assert(flushCalls>offlineBefore);

  console.log('auth-session-bootstrap-lifecycle: PASS');
})().catch(err=>{console.error(err);process.exit(1);});