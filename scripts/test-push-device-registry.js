'use strict';
const fs=require('fs');
const assert=require('assert');
const vm=require('vm');

const source=fs.readFileSync('src/core/pushDeviceRegistry.js','utf8');
function clone(v){return v===undefined?undefined:JSON.parse(JSON.stringify(v));}
function parts(path){return String(path||'').split('/').filter(Boolean);}
function getAt(root,path){let cur=root;for(const p of parts(path)){if(!cur||typeof cur!=='object'||!(p in cur))return null;cur=cur[p];}return clone(cur);}
function setAt(root,path,value){const ps=parts(path);let cur=root;for(let i=0;i<ps.length-1;i++){if(!cur[ps[i]]||typeof cur[ps[i]]!=='object')cur[ps[i]]={};cur=cur[ps[i]];}if(ps.length){if(value===null)delete cur[ps[ps.length-1]];else cur[ps[ps.length-1]]=clone(value);}}
function mergeAt(root,path,patch){const current=getAt(root,path)||{};setAt(root,path,Object.assign({},current,clone(patch)));}

(async function(){
  let current={ready:true,uid:'userA',householdId:'houseA',revision:1};
  const tree={};
  const db={ref(path){return{
    set(value){setAt(tree,path,value);return Promise.resolve();},
    update(value){mergeAt(tree,path,value);return Promise.resolve();},
    remove(){setAt(tree,path,null);return Promise.resolve();}
  };}};
  const HouseholdContext={
    snapshot(){return clone(current);},
    capture(){return{uid:current.uid,householdId:current.householdId,revision:current.revision};},
    isCurrent(token){return !!token&&token.uid===current.uid&&token.householdId===current.householdId&&token.revision===current.revision;}
  };
  const storage={};
  const localStorage={getItem(k){return Object.prototype.hasOwnProperty.call(storage,k)?storage[k]:null;},setItem(k,v){storage[k]=String(v);},removeItem(k){delete storage[k];}};
  const navigator={userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 26_6 like Mac OS X)',platform:'iPhone',maxTouchPoints:5};
  const Notification={permission:'granted'};
  const window={HouseholdContext,fbDb:db,localStorage,navigator,Notification,crypto:{randomUUID(){return'device-fixed';}}};
  const sandbox={window,HouseholdContext,localStorage,navigator,Notification,console,Promise,Date,Math,JSON,Object,String,Number,Array};
  vm.createContext(sandbox);
  vm.runInContext(source,sandbox,{filename:'pushDeviceRegistry.js'});

  const registry=window.PushDeviceRegistry;
  assert.ok(registry);
  assert.strictEqual(registry.version,'1.0.0');
  assert.strictEqual(registry.getDeviceId(),'device-fixed');
  assert.strictEqual(registry.platform(),'web-ios');

  const a=await registry.upsert({provider:'fcm',token:'token-A',permission:'granted',serviceWorkerScope:'https://app.test/',appVersion:'test'});
  assert.strictEqual(a.uid,'userA');
  assert.strictEqual(a.enabled,true);
  assert.strictEqual(a.token,'token-A');
  assert.ok(getAt(tree,'users/userA/private/pushDevices/device-fixed'));
  assert.strictEqual(getAt(tree,'families/houseA/fcmTokens/userA'),null,'new registry must never write household-shared tokens');
  const status=registry.status();
  assert.strictEqual(status.registered,true);
  assert.ok(!Object.prototype.hasOwnProperty.call(status,'token'),'registry status must not expose the delivery token');

  await registry.disable('user-disabled');
  assert.strictEqual(getAt(tree,'users/userA/private/pushDevices/device-fixed/enabled'),false);
  assert.strictEqual(getAt(tree,'users/userA/private/pushDevices/device-fixed/disabledReason'),'user-disabled');

  // Same browser installation may be used by a different account, but the write
  // path must move to that UID's private branch rather than mutate user A.
  current={ready:true,uid:'userB',householdId:'houseA',revision:2};
  await registry.upsert({provider:'fcm',token:'token-B',permission:'granted',serviceWorkerScope:'https://app.test/'});
  assert.strictEqual(getAt(tree,'users/userB/private/pushDevices/device-fixed/token'),'token-B');
  assert.strictEqual(getAt(tree,'users/userA/private/pushDevices/device-fixed/token'),'token-A');

  current={ready:true,uid:'userC',householdId:'houseB',revision:3};
  await registry.upsert({provider:'fcm',token:'token-C',permission:'granted',serviceWorkerScope:'https://app.test/'});
  assert.strictEqual(getAt(tree,'users/userC/private/pushDevices/device-fixed/token'),'token-C');
  assert.strictEqual(getAt(tree,'users/userB/private/pushDevices/device-fixed/token'),'token-B','cross-household switch must not overwrite previous user registry');

  current={ready:false,uid:null,householdId:null,revision:4};
  await assert.rejects(()=>registry.upsert({token:'nope'}),/PUSH_CONTEXT_NOT_READY/);
  await assert.rejects(()=>registry.disable('logout'),/PUSH_CONTEXT_NOT_READY/);

  console.log('STEP 10 private push device registry isolation contract: PASS');
})().catch(error=>{console.error(error);process.exit(1);});
