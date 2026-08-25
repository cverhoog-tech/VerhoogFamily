'use strict';
const assert=require('assert');
const fs=require('fs');
const vm=require('vm');

const source=fs.readFileSync('src/core/notificationActions.js','utf8');

let activeUid='member-a';
let task=null;
const readIds=[];
const joinedEvents=[];

const householdContext={snapshot(){return{ready:true,uid:activeUid,householdId:'house-1',revision:1};}};
const notificationStore={
  markRead(id){readIds.push(String(id));return Promise.resolve();},
  list(){return[];}
};
const notificationEvents={
  taskHelpJoined(saved,requesterUid){joinedEvents.push({requesterUid,taskId:saved&&saved.id});return Promise.resolve();}
};
function helper(uid){return{uid,memberId:uid,name:uid,joinedAt:Date.now()};}
const taskSharedData={
  joinHelp(id){
    assert.strictEqual(String(id),'task-1');
    const me=activeUid;
    task.helpers=Array.isArray(task.helpers)?task.helpers:[];
    if(!task.helpers.some(h=>String(h.uid||h.memberId||h.id)===String(me)))task.helpers.push(helper(me));
    if(task.helpAudience==='household'){
      task.helpRequested=true;
      task.lastHelpAcceptedByUid=me;
      task.lastHelpAcceptedAt=Date.now();
    }else{
      task.helpRequested=false;
      task.helpAcceptedByUid=me;
      task.helpAcceptedAt=Date.now();
      task.helpRequestedForUid=null;
      task.helpRequestedByUid=null;
      task.helpAudience=null;
    }
    return Promise.resolve(task);
  },
  declineHelp(id){
    assert.strictEqual(String(id),'task-1');
    const me=activeUid,occ=String(task.helpRequestedAt||'');
    if(task.helpAudience==='household'){
      task.helpDeclinedByUids=Object.assign({},task.helpDeclinedByUids||{}, {[me]:occ});
      task.lastHelpDeclinedByUid=me;
      task.lastHelpDeclinedAt=Date.now();
    }else{
      task.helpRequested=false;
      task.helpDeclinedByUid=me;
      task.helpDeclinedOccurrence=occ;
      task.helpDeclinedAt=Date.now();
      task.helpRequestedForUid=null;
      task.helpRequestedByUid=null;
      task.helpAudience=null;
    }
    return Promise.resolve(task);
  }
};
const window={
  HouseholdContext:householdContext,
  TaskSharedData:taskSharedData,
  NotificationStore:notificationStore,
  NotificationEvents:notificationEvents,
  taskData:[],
  showToast(){}
};
const sandbox={window,HouseholdContext:householdContext,TaskSharedData:taskSharedData,NotificationStore:notificationStore,NotificationEvents:notificationEvents,console,Promise,Date};
vm.createContext(sandbox);
vm.runInContext(source,sandbox,{filename:'notificationActions.js'});
const actions=window.NotificationActions;

function setTask(next){task=next;window.taskData=[task];}
function event(id,occurrence){return{id,type:'task.help.requested',title:'Hulp gevraagd',body:'Owner vraagt hulp.',data:{taskId:'task-1',occurrence:String(occurrence)},entity:{type:'task',id:'task-1'}};}
function labels(state){return (state.actions||[]).map(a=>String(a.label));}

(async function(){
  assert.strictEqual(actions.version,'3.1.0');
  assert.strictEqual(typeof actions.declineTaskHelp,'function');

  // Targeted invitation exposes accept + explicit decline and stays resolved.
  setTask({id:'task-1',title:'Keuken',createdByUid:'owner',assignedToUids:{owner:true},helpers:[],helpRequested:true,helpAudience:'uid',helpRequestedForUid:'member-a',helpRequestedByUid:'owner',helpRequestedAt:100});
  activeUid='member-a';
  const targeted=event('notif-targeted',100);
  let state=actions.describeStatus(targeted);
  assert.deepStrictEqual(labels(state),['Hulp geven','Afwijzen']);
  await actions.run(targeted,'decline');
  assert.strictEqual(task.helpRequested,false);
  assert.strictEqual(task.helpDeclinedByUid,'member-a');
  assert.strictEqual(task.helpDeclinedOccurrence,'100');
  state=actions.describeStatus(targeted);
  assert.strictEqual(state.statusLabel,'Afgewezen');
  assert.strictEqual(state.actions.length,0);
  assert.ok(readIds.includes('notif-targeted'));

  // Household broadcast opt-out is local to one UID; another UID can still help.
  setTask({id:'task-1',title:'Keuken',createdByUid:'owner',assignedToUids:{owner:true},helpers:[],helpRequested:true,helpAudience:'household',helpRequestedForUid:null,helpRequestedByUid:'owner',helpRequestedAt:200,helpDeclinedByUids:{}});
  const household=event('notif-household',200);
  activeUid='member-a';
  state=actions.describeStatus(household);
  assert.deepStrictEqual(labels(state),['Hulp geven','Niet voor mij']);
  await actions.run(household,'decline');
  assert.strictEqual(task.helpRequested,true,'opt-out does not close household request');
  assert.strictEqual(task.helpDeclinedByUids['member-a'],'200');
  state=actions.describeStatus(household);
  assert.strictEqual(state.statusLabel,'Niet voor mij');
  assert.strictEqual(state.actions.length,0);

  activeUid='member-b';
  state=actions.describeStatus(household);
  assert.deepStrictEqual(labels(state),['Hulp geven','Niet voor mij']);
  await actions.run(household,'accept');
  assert.ok(task.helpers.some(h=>h.uid==='member-b'));
  assert.strictEqual(task.helpRequested,true);
  assert.strictEqual(joinedEvents.length,1);
  assert.strictEqual(joinedEvents[0].requesterUid,'owner');

  // A stale notification from occurrence 200 never becomes actionable against
  // a later request on the same task, even if old decline metadata remains.
  activeUid='member-a';
  setTask({id:'task-1',title:'Keuken',createdByUid:'owner',assignedToUids:{owner:true},helpers:[],helpRequested:true,helpAudience:'household',helpRequestedForUid:null,helpRequestedByUid:'owner',helpRequestedAt:300,helpDeclinedByUids:{'member-a':'200'}});
  state=actions.describeStatus(household);
  assert.strictEqual(state.statusLabel,'Niet meer actief');
  assert.strictEqual(state.actions.length,0);
  await assert.rejects(()=>actions.run(household,'accept'),/niet meer actief/);

  console.log('Notification task-help accept/decline actions contract: PASS');
})().catch(error=>{console.error(error);process.exit(1);});