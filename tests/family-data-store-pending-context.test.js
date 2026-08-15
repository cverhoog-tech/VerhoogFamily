'use strict';
const fs=require('fs');
const vm=require('vm');
const assert=require('assert');

function storage(){const m=new Map();return{getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),dump:()=>Object.fromEntries(m)};}
function refFactory(writes,path=''){return{child(seg){return refFactory(writes,path+'/'+seg);},set(value){writes.push({path,value});return Promise.resolve();},once(){return Promise.resolve({val:()=>null});},on(){},off(){},transaction(){throw new Error('not used');}};}

const writes=[];
const localStorage=storage();
const events={};
const window={
  localStorage,
  offlineMode:true,
  fbUser:{uid:'alpha-user'},
  fbFamilyId:'alpha-household',
  fbDb:{ref(path){return refFactory(writes,path||'');}},
  addEventListener(name,fn){(events[name]||(events[name]=[])).push(fn);},
  dispatchEvent(){},
};
const context={window,localStorage,console,CustomEvent:function(){},setTimeout:(fn)=>fn(),clearTimeout,Promise,JSON,Date,Math,Object,Array,String};
context.firebase={auth:()=>({currentUser:window.fbUser}),database:()=>window.fbDb};
context.firebase.database=context.firebase.database;
context.firebase.database.ServerValue={TIMESTAMP:Date.now()};
vm.createContext(context);
vm.runInContext(fs.readFileSync('src/core/familyDataStore.js','utf8'),context,{filename:'familyDataStore.js'});
const store=window.FamilyDataStore;

(async()=>{
  await store.writeSharedRecord('recipes','same-id',{owner:'alpha'});
  await store.writePrivateRecord('preferences','same-id',{owner:'alpha'});

  window.fbUser={uid:'beta-user'};
  window.fbFamilyId='beta-household';
  await store.writeSharedRecord('recipes','same-id',{owner:'beta'});
  await store.writePrivateRecord('preferences','same-id',{owner:'beta'});

  let pending=JSON.parse(localStorage.getItem('familyapp_data_v1_pending_writes'));
  assert.equal(pending.length,4,'pending queue must retain same-path writes for both contexts');
  assert.equal(pending.filter(x=>x.uid==='alpha-user').length,2);
  assert.equal(pending.filter(x=>x.uid==='beta-user').length,2);

  window.offlineMode=false;
  let result=await store.flushPending();
  assert.equal(result.flushed,2);
  assert.equal(result.remaining,2);
  assert(writes.every(w=>!w.path.includes('alpha-household')&&!w.path.includes('alpha-user')),'Beta reconnect must not flush Alpha writes');
  assert(writes.some(w=>w.path.includes('families/beta-household/shared/recipes/same-id')));
  assert(writes.some(w=>w.path.includes('users/beta-user/private/preferences/same-id')));

  writes.length=0;
  window.fbUser={uid:'alpha-user'};
  window.fbFamilyId='alpha-household';
  result=await store.flushPending();
  assert.equal(result.flushed,2);
  assert.equal(result.remaining,0);
  assert(writes.some(w=>w.path.includes('families/alpha-household/shared/recipes/same-id')));
  assert(writes.some(w=>w.path.includes('users/alpha-user/private/preferences/same-id')));
  assert(writes.every(w=>!w.path.includes('beta-household')&&!w.path.includes('beta-user')));

  localStorage.setItem('familyapp_data_v1_pending_writes',JSON.stringify([
    {scope:'private',collection:'preferences',path:['legacy'],value:{secret:true},uid:null,familyId:null,at:1},
    {scope:'shared',collection:'recipes',path:['legacy'],value:{secret:true},uid:'alpha-user',familyId:null,at:1}
  ]));
  writes.length=0;
  result=await store.flushPending();
  assert.equal(result.flushed,0);
  assert.equal(result.droppedUnsafe,2);
  assert.equal(result.remaining,0);
  assert.equal(writes.length,0);

  window.offlineMode=true;
  window.fbUser=null;
  window.fbFamilyId=null;
  await store.writePrivateRecord('preferences','unresolved',{secret:true});
  await store.writeSharedRecord('recipes','unresolved',{secret:true});
  pending=JSON.parse(localStorage.getItem('familyapp_data_v1_pending_writes'));
  assert.equal(pending.length,0);

  console.log('family-data-store-pending-context: PASS');
})().catch(err=>{console.error(err);process.exit(1);});