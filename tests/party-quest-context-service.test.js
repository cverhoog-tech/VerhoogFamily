'use strict';
const fs=require('fs');
const vm=require('vm');
const assert=require('assert');

let current={uid:'alpha-user',householdId:'alpha-household',ready:true};
const listeners={};
const writes=[];
let deferredResolve=null;
const store={
  makeId:()=> 'partyquest_1',
  subscribeShared:(collection,cb)=>{assert.equal(collection,'partyQuests');store._cb=cb;return()=>{store._off=true;};},
  writeSharedRecord:(collection,id,value)=>new Promise(resolve=>{writes.push({collection,id,value,uid:current.uid,householdId:current.householdId});deferredResolve=resolve;}),
  mutateSharedRecord:()=>Promise.resolve({value:null})
};
const taskSharedData={members:()=>[{uid:'alpha-user',displayName:'Alpha'},{uid:'beta-user',displayName:'Beta'},{uid:'member-2',displayName:'Member Two'}]};
const window={
  HouseholdContext:{
    current:()=>Object.assign({},current),
    requireUser:()=>{if(!current.uid)throw new Error('AUTH_REQUIRED');return current.uid;},
    requireHousehold:()=>{if(!current.householdId)throw new Error('HOUSEHOLD_REQUIRED');return current.householdId;},
    assertContext:({uid,householdId,requireReady})=>{if(uid!==current.uid||householdId!==current.householdId||(requireReady&&!current.ready))throw new Error('CONTEXT_INVALID');return current;},
    isCurrent:t=>!!t&&t.uid===current.uid&&t.householdId===current.householdId
  },
  FamilyDataStore:store,
  FamilyDataContract:{shared:name=>{assert.equal(name,'partyQuests');return{path:'families/'+current.householdId+'/shared/partyQuests'};}},
  TaskSharedData:taskSharedData,
  taskData:[{id:'task-1',title:'Quest',createdByUid:'alpha-user'}],
  addEventListener:(name,fn)=>{(listeners[name]||(listeners[name]=[])).push(fn);},
  dispatchEvent:()=>{}
};
const context={window,TaskSharedData:taskSharedData,console,Promise,JSON,Date,Math,Object,Array,String,CustomEvent:function(){}};
vm.createContext(context);
vm.runInContext(fs.readFileSync('src/modules/tasks/partyQuestContextService.js','utf8'),context,{filename:'partyQuestContextService.js'});
const svc=window.PartyQuestContextService;

(async()=>{
  assert.equal(svc.start(),true);
  const pending=svc.createInvites('task-1',['member-2']);
  assert.equal(writes.length,1);
  assert.equal(writes[0].householdId,'alpha-household');

  current={uid:'beta-user',householdId:'beta-household',ready:true};
  (listeners['familyapp:household-context-changed']||[]).forEach(fn=>fn());
  deferredResolve();
  let err=null;
  try{await pending;}catch(e){err=e;}
  assert(err,'old household mutation must reject after context switch');
  assert.equal(err.code,'PARTY_QUEST_CONTEXT_CHANGED');
  assert.equal(writes.length,1,'no second write may be redirected into beta');
  assert.equal(writes[0].householdId,'alpha-household');
  assert.equal(store._off,true,'old party quest subscription must be detached');

  console.log('party-quest-context-service: PASS');
})().catch(e=>{console.error(e);process.exit(1);});
