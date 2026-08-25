'use strict';
const assert=require('assert');
const fs=require('fs');
const vm=require('vm');

const sharedSource=fs.readFileSync('src/modules/tasks/taskSharedData.js','utf8');
const uiSource=fs.readFileSync('src/modules/tasks/taskHouseholdHelpUi.js','utf8');
const eventsSource=fs.readFileSync('src/core/notificationEvents.js','utf8');
const appSource=fs.readFileSync('api/app.js','utf8');

function clone(v){return JSON.parse(JSON.stringify(v));}
function makeHarness(){
  let activeUid='owner';
  let task={
    id:'task-1',title:'Keuken opruimen',createdByUid:'owner',assignedToUids:{owner:true},helpers:[],helpRequested:false
  };
  const memberRows=[
    {uid:'owner',displayName:'Owner',status:'active'},
    {uid:'member-a',displayName:'Alex',status:'active'},
    {uid:'member-b',displayName:'Bo',status:'active'},
    {uid:'inactive',displayName:'Inactief',status:'inactive'}
  ];
  const repo={
    start(){},
    subscribe(){return function(){};},
    status(){return{ready:true};},
    updateOne(id,patch){assert.strictEqual(id,'task-1');task=Object.assign({},task,clone(patch));sandbox.window.taskData[0]=clone(task);return Promise.resolve(clone(task));},
    mutateOne(id,mutator){assert.strictEqual(id,'task-1');const next=mutator(clone(task));if(next)task=clone(next);sandbox.window.taskData[0]=clone(task);return Promise.resolve(clone(task));}
  };
  const window={
    HouseholdContext:{snapshot(){return{ready:true,uid:activeUid,householdId:'house-1',revision:1};}},
    HouseholdIdentityFirebaseBridge:{getMembers(){return clone(memberRows);}},
    TaskHouseholdRepository:repo,
    taskData:[clone(task)],
    addEventListener(){},dispatchEvent(){},
    setActiveUid(uid){activeUid=uid;},
    getTask(){return clone(task);},
    setTask(next){task=clone(next);this.taskData[0]=clone(task);}
  };
  const sandbox={window,console,Promise,setInterval(){return 1;},clearInterval(){},Date,Math,JSON,CustomEvent:function(){}};
  vm.createContext(sandbox);vm.runInContext(sharedSource,sandbox,{filename:'taskSharedData.js'});
  return sandbox.window;
}

(async function(){
  const w=makeHarness();
  assert.strictEqual(w.TaskSharedData.version,'2.2.0');
  assert.strictEqual(typeof w.TaskSharedData.requestHouseholdHelp,'function');
  assert.strictEqual(typeof w.TaskSharedData.declineHelp,'function');

  // Household-wide opt-out is UID-local: it persists for this occurrence while
  // the request remains open for other eligible family members.
  await w.TaskSharedData.requestHouseholdHelp('task-1');
  let row=w.getTask();
  assert.strictEqual(row.helpRequested,true);
  assert.strictEqual(row.helpAudience,'household');
  assert.strictEqual(row.helpRequestedByUid,'owner');
  assert.strictEqual(row.helpRequestedForUid,null);
  const householdOccurrence=String(row.helpRequestedAt);

  w.setActiveUid('member-a');
  await w.TaskSharedData.declineHelp('task-1');
  row=w.getTask();
  assert.strictEqual(row.helpRequested,true,'one opt-out must not close the household request');
  assert.strictEqual(row.helpAudience,'household');
  assert.strictEqual(String(row.helpDeclinedByUids['member-a']),householdOccurrence);
  assert.strictEqual(row.helpers.length,0);
  assert.throws(()=>w.TaskSharedData.joinHelp('task-1'),/niet voor jou/,'same UID cannot accept the same occurrence after opting out');

  w.setActiveUid('member-b');
  await w.TaskSharedData.joinHelp('task-1');
  row=w.getTask();
  assert.strictEqual(row.helpRequested,true,'household request stays open after another helper joins');
  assert.ok(row.helpers.some(h=>h.uid==='member-b'));
  assert.ok(row.helpAcceptedByUids['member-b']);

  // Starting a later help cycle clears the previous UID opt-out decision.
  w.setActiveUid('owner');
  await w.TaskSharedData.retractHelp('task-1');
  await w.TaskSharedData.requestHouseholdHelp('task-1');
  row=w.getTask();
  assert.deepStrictEqual(row.helpDeclinedByUids,{});
  w.setActiveUid('member-a');
  await w.TaskSharedData.joinHelp('task-1');
  row=w.getTask();
  assert.ok(row.helpers.some(h=>h.uid==='member-a'),'member can help again in a later occurrence');

  // Targeted help decline closes only that invitation and records the recipient
  // plus occurrence so the notification remains resolved across reloads.
  w.setTask({id:'task-1',title:'Keuken opruimen',createdByUid:'owner',assignedToUids:{owner:true},helpers:[],helpRequested:false});
  w.setActiveUid('owner');
  await w.TaskSharedData.requestHelp('task-1','member-a');
  row=w.getTask();
  const targetedOccurrence=String(row.helpRequestedAt);
  assert.strictEqual(row.helpAudience,'uid');
  assert.strictEqual(row.helpRequestedForUid,'member-a');
  w.setActiveUid('member-a');
  await w.TaskSharedData.declineHelp('task-1');
  row=w.getTask();
  assert.strictEqual(row.helpRequested,false);
  assert.strictEqual(row.helpAudience,null);
  assert.strictEqual(row.helpDeclinedByUid,'member-a');
  assert.strictEqual(String(row.helpDeclinedOccurrence),targetedOccurrence);
  assert.strictEqual(row.helpers.length,0);

  // A new targeted invitation resets old decline state and can be accepted.
  w.setActiveUid('owner');
  await w.TaskSharedData.requestHelp('task-1','member-a');
  row=w.getTask();
  assert.strictEqual(row.helpDeclinedByUid,null);
  assert.deepStrictEqual(row.helpDeclinedByUids,{});
  w.setActiveUid('member-a');
  await w.TaskSharedData.joinHelp('task-1');
  row=w.getTask();
  assert.strictEqual(row.helpRequested,false);
  assert.strictEqual(row.helpAudience,null);
  assert.ok(row.helpers.some(h=>h.uid==='member-a'));

  // UI and notification contracts: household choice, accept/opt-out controls,
  // deterministic occurrence data, and cache bumps for the served runtime.
  assert.ok(uiSource.includes('Heel het gezin'));
  assert.ok(uiSource.includes('requestHouseholdHelp'));
  assert.ok(uiSource.includes('data-household-help-join'));
  assert.ok(uiSource.includes('data-household-help-decline'));
  assert.ok(uiSource.includes('Niet voor mij'));
  assert.ok(eventsSource.includes("targetUid?[String(targetUid)]:otherMemberUids()"));
  assert.ok(eventsSource.includes("targetUid||'household'"));
  assert.ok(eventsSource.includes('occurrence:String(occurrence)'));
  assert.ok(appSource.includes('taskSharedData.js?v=5'));
  assert.ok(appSource.includes('taskHouseholdHelpUi.js?v=2'));
  assert.ok(appSource.includes('notificationActions.js?v=4'));

  console.log('Task help accept/decline lifecycle contract: PASS');
})().catch(error=>{console.error(error);process.exit(1);});