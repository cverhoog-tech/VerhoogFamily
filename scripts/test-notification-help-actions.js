'use strict';
const assert=require('assert');
const fs=require('fs');
const vm=require('vm');

const source=fs.readFileSync('src/core/notificationActions.js','utf8');

let activeUid='member-a';
let task=null;
let cleaningRoot={occurrences:{}};
const readIds=[];
const joinedEvents=[];
const cleaningCalls=[];

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
const cleaningHouseholdRepository={snapshot(){return{ready:true,data:cleaningRoot};}};
const cleaningExceptionRuntime={
  respondToHelpRequest(id,action){
    cleaningCalls.push({id:String(id),action:String(action),uid:activeUid});
    const occurrence=cleaningRoot.occurrences[String(id)];
    assert.ok(occurrence,'Cleaning occurrence must exist');
    assert.strictEqual(occurrence.helpRequest.status,'PENDING');
    assert.strictEqual(occurrence.helpRequest.toUid,activeUid);
    if(action==='ACCEPT_HELP'){
      occurrence.helpRequest.status='ACCEPTED';
      occurrence.assignmentUids=Array.from(new Set([...(occurrence.assignmentUids||[]),activeUid]));
    }else if(action==='DECLINE_HELP'){
      occurrence.helpRequest.status='DECLINED';
    }else throw new Error('Unexpected Cleaning help action '+action);
    return Promise.resolve({action,occurrenceIds:[String(id)]});
  }
};
const window={
  HouseholdContext:householdContext,
  TaskSharedData:taskSharedData,
  NotificationStore:notificationStore,
  NotificationEvents:notificationEvents,
  CleaningHouseholdRepository:cleaningHouseholdRepository,
  CleaningExceptionRuntime:cleaningExceptionRuntime,
  taskData:[],
  showToast(){}
};
const sandbox={window,HouseholdContext:householdContext,TaskSharedData:taskSharedData,NotificationStore:notificationStore,NotificationEvents:notificationEvents,CleaningHouseholdRepository:cleaningHouseholdRepository,CleaningExceptionRuntime:cleaningExceptionRuntime,console,Promise,Date};
vm.createContext(sandbox);
vm.runInContext(source,sandbox,{filename:'notificationActions.js'});
const actions=window.NotificationActions;

function setTask(next){task=next;window.taskData=[task];}
function event(id,occurrence){return{id,type:'task.help.requested',title:'Hulp gevraagd',body:'Owner vraagt hulp.',data:{taskId:'task-1',occurrence:String(occurrence)},entity:{type:'task',id:'task-1'}};}
function cleaningEvent(id='notif-cleaning'){return{id,type:'cleaning.help.requested',title:'Hulp gevraagd bij schoonmaken',body:'Owner vraagt of je wilt meehelpen.',data:{occurrenceId:'clean-1',requesterUid:'owner'},entity:{type:'cleaningOccurrence',id:'clean-1'}};}
function labels(state){return Array.from(state.actions||[],a=>String(a.label));}
function pendingCleaningRequest(toUid='member-a'){
  cleaningRoot={occurrences:{'clean-1':{id:'clean-1',assignmentUids:['owner'],helpRequest:{fromUid:'owner',toUid,status:'PENDING',requestedAt:500}}}};
}

(async function(){
  assert.strictEqual(actions.version,'3.2.0');
  assert.strictEqual(typeof actions.declineTaskHelp,'function');
  assert.strictEqual(typeof actions.respondCleaningHelp,'function');

  // Targeted Task invitation exposes accept + explicit decline and stays resolved.
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

  // Household Task broadcast opt-out is local to one UID; another UID can still help.
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

  // A stale Task notification never becomes actionable against a later request.
  activeUid='member-a';
  setTask({id:'task-1',title:'Keuken',createdByUid:'owner',assignedToUids:{owner:true},helpers:[],helpRequested:true,helpAudience:'household',helpRequestedForUid:null,helpRequestedByUid:'owner',helpRequestedAt:300,helpDeclinedByUids:{'member-a':'200'}});
  state=actions.describeStatus(household);
  assert.strictEqual(state.statusLabel,'Niet meer actief');
  assert.strictEqual(state.actions.length,0);
  await assert.rejects(()=>actions.run(household,'accept'),/niet meer actief/);

  // Cleaning help notification is directly actionable for the intended recipient.
  activeUid='member-a';
  pendingCleaningRequest();
  const cleaningAccept=cleaningEvent('notif-cleaning-accept');
  assert.strictEqual(actions.isActionable(cleaningAccept),true);
  state=actions.describeStatus(cleaningAccept);
  assert.strictEqual(state.statusLabel,'Wacht op jouw reactie');
  assert.deepStrictEqual(labels(state),['Accepteren','Afwijzen']);
  await actions.run(cleaningAccept,'accept');
  assert.deepStrictEqual(cleaningCalls.at(-1),{id:'clean-1',action:'ACCEPT_HELP',uid:'member-a'});
  assert.deepStrictEqual(cleaningRoot.occurrences['clean-1'].assignmentUids,['owner','member-a']);
  assert.strictEqual(cleaningRoot.occurrences['clean-1'].helpRequest.status,'ACCEPTED');
  assert.ok(readIds.includes('notif-cleaning-accept'));
  state=actions.describeStatus(cleaningAccept);
  assert.strictEqual(state.statusLabel,'Geaccepteerd ✓');
  assert.strictEqual(state.actions.length,0);

  // Decline uses the same canonical runtime but never changes assignment.
  pendingCleaningRequest();
  const cleaningDecline=cleaningEvent('notif-cleaning-decline');
  state=actions.describeStatus(cleaningDecline);
  assert.deepStrictEqual(labels(state),['Accepteren','Afwijzen']);
  await actions.run(cleaningDecline,'decline');
  assert.deepStrictEqual(cleaningCalls.at(-1),{id:'clean-1',action:'DECLINE_HELP',uid:'member-a'});
  assert.deepStrictEqual(cleaningRoot.occurrences['clean-1'].assignmentUids,['owner']);
  assert.strictEqual(cleaningRoot.occurrences['clean-1'].helpRequest.status,'DECLINED');
  assert.ok(readIds.includes('notif-cleaning-decline'));

  // Wrong recipient and stale Cleaning requests never expose action buttons.
  pendingCleaningRequest('member-b');
  state=actions.describeStatus(cleaningEvent('notif-cleaning-other'));
  assert.strictEqual(state.statusLabel,'Niet voor jou');
  assert.strictEqual(state.actions.length,0);
  cleaningRoot.occurrences={};
  state=actions.describeStatus(cleaningEvent('notif-cleaning-stale'));
  assert.strictEqual(state.statusLabel,'Niet meer actief');
  assert.strictEqual(state.actions.length,0);

  console.log('Notification task-help + Cleaning-help accept/decline actions contract: PASS');
})().catch(error=>{console.error(error);process.exit(1);});
