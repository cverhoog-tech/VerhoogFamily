'use strict';
const fs=require('fs');
const vm=require('vm');
const assert=require('assert');

function storage(){const m=new Map();return{getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k)};}
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
  dispatchEvent(){}
};
const context={window,localStorage,console,CustomEvent:function(){},setTimeout:(fn)=>fn(),clearTimeout,Promise,JSON,Date,Math,Object,Array,String};
context.firebase={auth:()=>({currentUser:window.fbUser}),database:()=>window.fbDb};
context.firebase.database=context.firebase.database;
context.firebase.database.ServerValue={TIMESTAMP:Date.now()};
vm.createContext(context);
vm.runInContext(fs.readFileSync('src/core/familyDataStore.js','utf8'),context,{filename:'familyDataStore.js'});
const store=window.FamilyDataStore;

const contexts=[
  {uid:'alpha-user',householdId:'alpha-household',label:'alpha'},
  {uid:'beta-user',householdId:'beta-household',label:'beta'},
  {uid:'gamma-user',householdId:'gamma-household',label:'gamma'}
];

function select(c){window.fbUser={uid:c.uid};window.fbFamilyId=c.householdId;}
function pending(){return JSON.parse(localStorage.getItem('familyapp_data_v1_pending_writes')||'[]');}

(async()=>{
  for(const c of contexts){
    select(c);
    await store.writeSharedRecord('recipes','same-id',{owner:c.label});
    await store.writePrivateRecord('preferences','same-id',{owner:c.label});
  }

  let queue=pending();
  assert.equal(queue.length,6,'all three contexts must retain their own pending shared/private writes');
  for(const c of contexts){
    assert.equal(queue.filter(x=>x.uid===c.uid&&x.familyId===c.householdId).length,1,'each household must own exactly one queued shared write');
    assert.equal(queue.filter(x=>x.uid===c.uid&&x.scope==='private').length,1,'each UID must own exactly one queued private write');
  }

  window.offlineMode=false;
  for(let i=0;i<contexts.length;i++){
    const current=contexts[i];
    select(current);
    writes.length=0;
    const result=await store.flushPending();
    assert.equal(result.flushed,2,'only the current UID/household pair may flush');
    assert.equal(result.remaining,(contexts.length-i-1)*2);
    assert(writes.some(w=>w.path.includes(`families/${current.householdId}/shared/recipes/same-id`)));
    assert(writes.some(w=>w.path.includes(`users/${current.uid}/private/preferences/same-id`)));
    for(const other of contexts.filter(x=>x!==current)){
      assert(writes.every(w=>!w.path.includes(other.householdId)),`must not flush ${other.householdId} data while ${current.householdId} is active`);
      assert(writes.every(w=>!w.path.includes(`/users/${other.uid}/`)),`must not flush ${other.uid} private data while ${current.uid} is active`);
    }
  }

  assert.equal(pending().length,0,'queue must be empty only after all three original contexts have flushed themselves');
  console.log('family-data-store-three-household-switch: PASS');
})().catch(err=>{console.error(err);process.exit(1);});