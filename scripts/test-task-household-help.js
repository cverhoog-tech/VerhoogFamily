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
  assert.strictEqual(w.TaskSharedData.version,'2.1.0');
  assert.strictEqual(typeof w.TaskSharedData.requestHouseholdHelp,'function');

  await w.TaskSharedData.requestHouseholdHelp('task-1');
  let row=w.getTask();
  assert.strictEqual(row.helpRequested,true);
  assert.strictEqual(row.helpAudience,'household');
  assert.strictEqual(row.helpRequestedByUid,'owner');
  assert.strictEqual(row.helpRequestedForUid,null);

  w.setActiveUid('member-a');
  await w.TaskSharedData.joinHelp('task-1');
  row=w.getTask();
  assert.strictEqual(row.helpRequested,true,'household request stays open after first helper joins');
  assert.strictEqual(row.helpAudience,'household');
  assert.ok(row.helpers.some(h=>h.uid==='member-a'));

  w.setActiveUid('member-b');
  await w.TaskSharedData.joinHelp('task-1');
  row=w.getTask();
  assert.strictEqual(row.helpRequested,true,'household request stays open for additional helpers');
  assert.deepStrictEqual(row.helpers.map(h=>h.uid).sort(),['member-a','member-b']);
  assert.ok(row.helpAcceptedByUids['member-a']);
  assert.ok(row.helpAcceptedByUids['member-b']);

  await w.TaskSharedData.joinHelp('task-1');
  row=w.getTask();
  assert.strictEqual(row.helpers.filter(h=>h.uid==='member-b').length,1,'same helper is not duplicated');

  w.setActiveUid('owner');
  await assert.rejects(()=>w.TaskSharedData.joinHelp('task-1'),/neemt al deel/);
  await w.TaskSharedData.retractHelp('task-1');
  row=w.getTask();
  assert.strictEqual(row.helpRequested,false);
  assert.strictEqual(row.helpAudience,null);
  assert.strictEqual(row.helpers.length,2,'retract closes request but keeps accepted helpers');

  // Targeted help keeps the old one-recipient semantics and closes on accept.
  w.setTask({id:'task-1',title:'Keuken opruimen',createdByUid:'owner',assignedToUids:{owner:true},helpers:[],helpRequested:false});
  await w.TaskSharedData.requestHelp('task-1','member-a');
  row=w.getTask();assert.strictEqual(row.helpAudience,'uid');assert.strictEqual(row.helpRequestedForUid,'member-a');
  w.setActiveUid('member-a');await w.TaskSharedData.joinHelp('task-1');row=w.getTask();
  assert.strictEqual(row.helpRequested,false);assert.strictEqual(row.helpAudience,null);assert.ok(row.helpers.some(h=>h.uid==='member-a'));

  // UI and notification contracts: one explicit household option, actionable
  // broadcast recipients, and null-target events fan out to other members.
  assert.ok(uiSource.includes('Heel het gezin'));
  assert.ok(uiSource.includes('requestHouseholdHelp'));
  assert.ok(uiSource.includes('data-household-help-join'));
  assert.ok(uiSource.includes('invitee-household'));
  assert.ok(eventsSource.includes("targetUid?[String(targetUid)]:otherMemberUids()"));
  assert.ok(eventsSource.includes("targetUid||'household'"));
  assert.ok(appSource.includes('taskSharedData.js?v=4'));
  assert.ok(appSource.includes('taskHouseholdHelpUi.js?v=1'));

  console.log('Task household-wide help request contract: PASS');
})().catch(error=>{console.error(error);process.exit(1);});
