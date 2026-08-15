'use strict';
const fs=require('fs');
const vm=require('vm');
const assert=require('assert');

let current={uid:'alpha-user',householdId:'alpha-household',ready:true};
const events={};
const subscriptions=[];
const fds={
  makeId:()=> 'task_1',
  subscribeShared:(collection,cb)=>{const sub={collection,cb,off:false,context:Object.assign({},current)};subscriptions.push(sub);return()=>{sub.off=true;};},
  writeSharedRecord:()=>Promise.resolve(),
  mutateSharedRecord:()=>Promise.resolve({value:null})
};
const localStorage={setItem(){},getItem(){return null;}};
const document={readyState:'complete'};
const window={
  HouseholdContext:{
    current:()=>Object.assign({},current),
    requireUser:()=>current.uid,
    requireHousehold:()=>current.householdId,
    assertContext:({uid,householdId,requireReady})=>{if(uid!==current.uid||householdId!==current.householdId||(requireReady&&!current.ready))throw new Error('bad context');},
    isCurrent:t=>!!t&&t.uid===current.uid&&t.householdId===current.householdId
  },
  FamilyDataStore:fds,
  HouseholdIdentityFirebaseBridge:{getMembers:()=>[]},
  taskData:[],
  addEventListener:(name,fn)=>{(events[name]||(events[name]=[])).push(fn);},
  dispatchEvent(){},
  AppState:null
};
const context={window,document,localStorage,console,Promise,JSON,Date,Math,Object,Array,String,CustomEvent:function(){},setTimeout:(fn)=>fn(),clearTimeout:()=>{}};
vm.createContext(context);
vm.runInContext(fs.readFileSync('src/modules/tasks/taskSharedData.js','utf8'),context,{filename:'taskSharedData.js'});

assert.equal(subscriptions.length,1,'alpha subscription should start');
const alpha=subscriptions[0];
alpha.cb({a:{id:'a',title:'Alpha task'}});
assert.equal(window.taskData[0].title,'Alpha task');

current={uid:'beta-user',householdId:'beta-household',ready:true};
(events['familyapp:household-context-changed']||[]).forEach(fn=>fn());
assert.equal(alpha.off,true,'alpha subscription must detach on context switch');
assert.equal(subscriptions.length,2,'beta subscription should bind');
const beta=subscriptions[1];
assert.equal(beta.context.householdId,'beta-household');

alpha.cb({stale:{id:'stale',title:'STALE ALPHA'}});
assert.notEqual((window.taskData[0]||{}).title,'STALE ALPHA','stale alpha callback must be ignored');
beta.cb({b:{id:'b',title:'Beta task'}});
assert.equal(window.taskData[0].title,'Beta task');

const source=fs.readFileSync('src/modules/tasks/taskSharedData.js','utf8');
assert(!source.includes('attachLegacyRootGuard'),'legacy root guard must be removed');
assert(!source.includes("ref.on('value',legacyRootHandler)"),'legacy root family value listener must be absent');
console.log('task-shared-context-rebind: PASS');
