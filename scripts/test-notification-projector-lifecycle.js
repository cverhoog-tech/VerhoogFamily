'use strict';
const fs=require('fs');
const assert=require('assert');
const vm=require('vm');

const taskSource=fs.readFileSync('src/modules/tasks/taskNotificationProjector.js','utf8');
const swapSource=fs.readFileSync('src/modules/tasks/taskSwapNotificationProjector.js','utf8');
const partySource=fs.readFileSync('src/modules/tasks/partyQuestNotificationProjector.js','utf8');

function clone(v){return v===undefined?undefined:JSON.parse(JSON.stringify(v));}
function snap(v){return{val(){return clone(v);}};}
function tick(){return new Promise(resolve=>setTimeout(resolve,0));}
function parts(path){return String(path||'').split('/').filter(Boolean);}
function getAt(root,path){let cur=root;for(const p of parts(path)){if(!cur||typeof cur!=='object'||!(p in cur))return null;cur=cur[p];}return clone(cur);}
function setAt(root,path,value){const ps=parts(path);let cur=root;for(let i=0;i<ps.length-1;i++){if(!cur[ps[i]]||typeof cur[ps[i]]!=='object')cur[ps[i]]={};cur=cur[ps[i]];}if(ps.length)cur[ps[ps.length-1]]=clone(value);}
function makeDb(initial){
  const tree=clone(initial||{}),refs={};
  function ref(path){
    path=String(path);if(refs[path])return refs[path];
    const handlers=[],offCalls=[];
    const node={path,handlers,offCalls,
      on(event,handler,errorHandler){assert.strictEqual(event,'value');handlers.push(handler);node.errorHandler=errorHandler;Promise.resolve().then(()=>handler(snap(getAt(tree,path))));},
      off(event,handler){offCalls.push({event,handler});const i=handlers.indexOf(handler);if(i>=0)handlers.splice(i,1);},
      emitValue(value){setAt(tree,path,value);handlers.slice().forEach(h=>h(snap(value)));}
    };
    refs[path]=node;return node;
  }
  return{ref,refs,get(path){return getAt(tree,path);}};
}

(async function(){
  let current={ready:true,uid:'userA',householdId:'houseA',revision:1};
  const contextListeners=[];
  const windowListeners={};
  const db=makeDb({families:{houseA:{taskSwapRequests:{},partyQuests:{}},houseB:{taskSwapRequests:{},partyQuests:{}}}});

  const HouseholdContext={
    snapshot(){return clone(current);},
    capture(){return{uid:current.uid,householdId:current.householdId,revision:current.revision};},
    isCurrent(token){return !!token&&token.uid===current.uid&&token.householdId===current.householdId&&token.revision===current.revision;},
    subscribe(fn){contextListeners.push(fn);fn(clone(current),'subscribe');return()=>{const i=contextListeners.indexOf(fn);if(i>=0)contextListeners.splice(i,1);};}
  };
  function publishContext(next){current=clone(next);contextListeners.slice().forEach(fn=>fn(clone(current),'test-switch'));}
  function addEventListener(type,fn){(windowListeners[type]||(windowListeners[type]=[])).push(fn);}
  function removeEventListener(type,fn){const list=windowListeners[type]||[];const i=list.indexOf(fn);if(i>=0)list.splice(i,1);}
  function dispatchEvent(event){(windowListeners[event.type]||[]).slice().forEach(fn=>fn(event));}
  function CustomEvent(type,opts){this.type=type;this.detail=opts&&opts.detail;}

  const calls=[];
  const NotificationEvents={
    taskHelpRequested(task,target){calls.push({kind:'helpRequested',uid:current.uid,taskId:String(task.id||task._key),target});return Promise.resolve();},
    taskHelpJoined(task,requester){calls.push({kind:'helpJoined',uid:current.uid,taskId:String(task.id||task._key),requester});return Promise.resolve();},
    taskSwapRequested(task,target,row){calls.push({kind:'swapRequested',uid:current.uid,taskId:String(task.id||task._key),target,rowId:row&&row.id});return Promise.resolve();},
    taskSwapResolved(task,requester,accepted,row){calls.push({kind:accepted?'swapAccepted':'swapDeclined',uid:current.uid,taskId:String(task.id||task._key),requester,rowId:row&&row.id});return Promise.resolve();},
    partyQuestCreated(q,targets){calls.push({kind:'partyCreated',uid:current.uid,questId:q.id,targets:clone(targets)});return Promise.resolve();},
    partyQuestInvitationSent(q,target){calls.push({kind:'partySent',uid:current.uid,questId:q.id,target});return Promise.resolve();},
    partyQuestJoined(q,owner){calls.push({kind:'partyJoined',uid:current.uid,questId:q.id,owner});return Promise.resolve();},
    partyQuestCompleted(q){calls.push({kind:'partyCompleted',uid:current.uid,questId:q.id});return Promise.resolve();}
  };

  const window={
    HouseholdContext,NotificationEvents,fbDb:db,
    taskData:[{id:'task1',title:'Badkamer',helpRequested:false,createdByUid:'userA'}],
    addEventListener,removeEventListener,dispatchEvent
  };
  const document={readyState:'complete'};
  const sandbox={window,HouseholdContext,NotificationEvents,document,CustomEvent,console,Promise,Date,Math,JSON,Object,String,Number,Array,Set};
  vm.createContext(sandbox);
  vm.runInContext(taskSource,sandbox,{filename:'taskNotificationProjector.js'});
  vm.runInContext(swapSource,sandbox,{filename:'taskSwapNotificationProjector.js'});
  vm.runInContext(partySource,sandbox,{filename:'partyQuestNotificationProjector.js'});

  await tick();await tick();
  const taskProjector=window.TaskNotificationProjector;
  const swapProjector=window.TaskSwapNotificationProjector;
  const partyProjector=window.PartyQuestNotificationProjector;
  assert.strictEqual(taskProjector.version,'2.0.0');
  assert.strictEqual(swapProjector.version,'2.0.0');
  assert.strictEqual(partyProjector.version,'3.0.1');

  const swapA=db.ref('families/houseA/taskSwapRequests');
  const partyA=db.ref('families/houseA/partyQuests');
  const staleSwapA=swapA.handlers[0],stalePartyA=partyA.handlers[0];
  assert.ok(staleSwapA&&stalePartyA,'A projector listeners must attach');

  // Task projector: first event after start is baseline, second transition emits.
  dispatchEvent(new CustomEvent('familyapp:tasks-updated',{detail:{}}));
  window.taskData=[{id:'task1',title:'Badkamer',helpRequested:true,helpRequestedByUid:'userA',helpRequestedForUid:'userB',helpRequestedAt:111,updatedAt:111,createdByUid:'userA'}];
  dispatchEvent(new CustomEvent('familyapp:tasks-updated',{detail:{}}));
  assert.strictEqual(calls.filter(x=>x.kind==='helpRequested'&&x.uid==='userA').length,1);

  // Swap and Party Quest transitions for user A.
  swapA.emitValue({swap1:{id:'swap1',taskId:'task1',requesterUid:'userA',targetUid:'userB',status:'pending',createdAt:120}});
  partyA.emitValue({q1:{id:'q1',questId:'task1',questTitle:'Badkamer',inviterUid:'userA',status:'pending',invitees:{userB:{uid:'userB',status:'pending'}}}});
  assert.ok(calls.some(x=>x.kind==='swapRequested'&&x.rowId==='swap1'&&x.uid==='userA'));
  assert.ok(calls.some(x=>x.kind==='partyCreated'&&x.questId==='q1'&&x.uid==='userA'));
  assert.ok(calls.some(x=>x.kind==='partySent'&&x.questId==='q1'&&x.target==='userB'));

  const beforeSwitch=calls.length;
  publishContext({ready:true,uid:'userB',householdId:'houseA',revision:2});
  await tick();await tick();
  assert.ok(swapA.offCalls.length>=1,'same-household UID switch must detach old swap listener');
  assert.ok(partyA.offCalls.length>=1,'same-household UID switch must detach old party listener');
  assert.strictEqual(swapProjector.status().uid,'userB');
  assert.strictEqual(partyProjector.status().uid,'userB');

  // Manually invoke captured stale A callbacks: they must be ignored completely.
  staleSwapA(snap({stale:{id:'stale',taskId:'task1',requesterUid:'userA',targetUid:'userB',status:'pending'}}));
  stalePartyA(snap({staleQ:{id:'staleQ',inviterUid:'userA',status:'pending',invitees:{userB:{status:'pending'}}}}));
  assert.strictEqual(calls.length,beforeSwitch,'stale pre-switch callbacks may not publish notifications');

  // Task projector also resets its transition baseline on identity change.
  dispatchEvent(new CustomEvent('familyapp:tasks-updated',{detail:{}}));
  assert.strictEqual(calls.length,beforeSwitch,'first task snapshot after identity switch must be baseline only');
  window.taskData=[
    {id:'task1',title:'Badkamer',helpRequested:true,helpRequestedByUid:'userA',helpRequestedForUid:'userB',helpRequestedAt:111,updatedAt:111,createdByUid:'userA'},
    {id:'task2',title:'Keuken',helpRequested:true,helpRequestedByUid:'userB',helpRequestedForUid:'userA',helpRequestedAt:222,updatedAt:222,createdByUid:'userB'}
  ];
  dispatchEvent(new CustomEvent('familyapp:tasks-updated',{detail:{}}));
  assert.ok(calls.some(x=>x.kind==='helpRequested'&&x.uid==='userB'&&x.taskId==='task2'));

  const swapHandlerB=swapA.handlers[0],partyHandlerB=partyA.handlers[0];
  assert.ok(swapHandlerB&&partyHandlerB,'B listeners must attach');
  swapA.emitValue({swap1:{id:'swap1',taskId:'task1',requesterUid:'userA',targetUid:'userB',status:'pending'},swap2:{id:'swap2',taskId:'task2',requesterUid:'userB',targetUid:'userA',status:'pending'}});
  partyA.emitValue({q1:{id:'q1',inviterUid:'userA',status:'pending',invitees:{userB:{status:'pending'}}},q2:{id:'q2',questId:'task2',questTitle:'Keuken',inviterUid:'userB',status:'pending',invitees:{userA:{status:'pending'}}}});
  assert.ok(calls.some(x=>x.kind==='swapRequested'&&x.uid==='userB'&&x.rowId==='swap2'));
  assert.ok(calls.some(x=>x.kind==='partyCreated'&&x.uid==='userB'&&x.questId==='q2'));

  // Logout tears down listeners and stale callbacks after logout do nothing.
  const countBeforeLogout=calls.length;
  publishContext({ready:false,uid:null,householdId:null,revision:3});
  await tick();
  assert.strictEqual(swapProjector.status().started,false);
  assert.strictEqual(partyProjector.status().started,false);
  swapHandlerB(snap({leak:{id:'leak',taskId:'task2',requesterUid:'userB',targetUid:'userA',status:'pending'}}));
  partyHandlerB(snap({leakQ:{id:'leakQ',inviterUid:'userB',status:'pending',invitees:{userA:{status:'pending'}}}}));
  dispatchEvent(new CustomEvent('familyapp:tasks-updated',{detail:{}}));
  assert.strictEqual(calls.length,countBeforeLogout,'logout/stale callbacks may not publish notifications');

  console.log('STEP 10 notification projector HouseholdContext lifecycle contract: PASS');
})().catch(error=>{console.error(error);process.exit(1);});
