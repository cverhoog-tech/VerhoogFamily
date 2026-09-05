'use strict';
const assert=require('assert');
const fs=require('fs');
const path=require('path');
const vm=require('vm');

const source=fs.readFileSync(path.join(__dirname,'..','src','modules','cleaning','cleaningNotificationProjector.js'),'utf8');
const calls=[];
const registered=[];
const now=Date.now();
const today=new Date(now);today.setHours(0,0,0,0);

const members=[
  {uid:'u1',displayName:'Shane',status:'active'},
  {uid:'u2',displayName:'Esra',status:'active'},
  {uid:'u3',displayName:'Alex',status:'active'}
];
const sandbox={
  console,
  Date,
  Promise,
  Number,
  String,
  Array,
  Object,
  Math,
  Map,
  Set,
  setInterval:()=>1,
  clearInterval:()=>{},
  HouseholdContext:{snapshot:()=>({ready:true,uid:'u1',householdId:'hh1',revision:1})},
  HouseholdIdentityFirebaseBridge:{getMembers:()=>members},
  CleaningHouseholdRepository:{subscribe:()=>()=>{}},
  NotificationStore:{
    registerType:(type)=>registered.push(type),
    publishToUidsOnce:(key,type,uids,payload)=>{calls.push({kind:'uids',key,type,uids:[...uids],payload});return Promise.resolve({id:key});},
    publishSelfOnce:(key,type,payload)=>{calls.push({kind:'self',key,type,uids:['u1'],payload});return Promise.resolve({id:key});}
  }
};
sandbox.window=sandbox;

vm.runInNewContext(source,sandbox,{filename:'cleaningNotificationProjector.js'});
const projector=sandbox.CleaningNotificationProjector;
assert.ok(projector,'notification projector must register');
assert.strictEqual(projector.version,'0.1.0');

async function flush(){await Promise.resolve();await Promise.resolve();}

(async function(){
  const snapshot={ready:true,data:{
    rooms:{bath:{id:'bath',name:'Badkamer'}},
    routines:{
      r1:{id:'r1',roomId:'bath',title:'Douche schoonmaken',active:true,assignmentRequestStatus:'PENDING',assignmentRequestedByUid:'u1',assignmentRequestedAt:now,preferredAssigneeUid:'u2'},
      r2:{id:'r2',roomId:'bath',title:'Vloer dweilen',active:true,assignmentRequestStatus:'COUNTER_PROPOSED',assignmentRequestedByUid:'u1',assignmentRequestedAt:now-1000,preferredAssigneeUid:'u2',assignmentCounterProposedUid:'u3',assignmentCounterProposedAt:now,assignmentCounterProposedByUid:'u2'}
    },
    occurrences:{
      o1:{id:'o1',roomId:'bath',status:'FLEXIBLE',assignmentStatus:'ACTIVE',assignmentUids:['u1'],earliestDueAt:today.getTime(),helpRequest:{fromUid:'u1',toUid:'u2',status:'PENDING',requestedAt:now}},
      o2:{id:'o2',roomId:'bath',status:'FLEXIBLE',assignmentStatus:'ACTIVE',assignmentUids:['u1'],earliestDueAt:today.getTime()-86400000}
    }
  }};
  projector.project(snapshot);await flush();

  assert.ok(registered.includes('cleaning.help.requested'));
  assert.ok(registered.includes('cleaning.assignment.requested'));
  assert.ok(registered.includes('cleaning.reminder.daily'));

  const help=calls.find((row)=>row.type==='cleaning.help.requested');
  assert.ok(help,'pending Cleaning help must create a notification');
  assert.deepStrictEqual(help.uids,['u2']);
  assert.strictEqual(help.payload.actor.uid,'u1');
  assert.ok(help.payload.body.includes('Open Schoonmaken'));

  const assignment=calls.find((row)=>row.type==='cleaning.assignment.requested');
  assert.ok(assignment,'pending fixed-routine request must create a notification');
  assert.deepStrictEqual(assignment.uids,['u2']);
  assert.strictEqual(assignment.payload.actor.uid,'u1');

  const counter=calls.find((row)=>row.type==='cleaning.assignment.countered');
  assert.ok(counter,'counterproposal must notify the original requester');
  assert.deepStrictEqual(counter.uids,['u1']);
  assert.strictEqual(counter.payload.actor.uid,'u2');
  assert.ok(counter.payload.body.includes('Alex'));

  const reminder=calls.find((row)=>row.type==='cleaning.reminder.daily');
  assert.ok(reminder,'today/overdue work must produce one bundled daily reminder');
  assert.strictEqual(reminder.kind,'self');
  assert.strictEqual(reminder.payload.data.todayCount,1);
  assert.strictEqual(reminder.payload.data.overdueCount,1);
  assert.strictEqual(reminder.payload.actor.uid,'system');

  const resolved=JSON.parse(JSON.stringify(snapshot));
  resolved.data.occurrences.o1.helpRequest.status='ACCEPTED';
  resolved.data.occurrences.o1.helpRequest.respondedAt=now+1;
  resolved.data.occurrences.o1.helpRequest.respondedByUid='u2';
  resolved.data.routines.r1.assignmentRequestStatus='ACCEPTED';
  resolved.data.routines.r1.assignmentAcceptedByUid='u2';
  resolved.data.routines.r1.assignmentLastRequestOutcome='ACCEPTED';
  resolved.data.routines.r1.assignmentLastRequestResolvedAt=now+2;
  resolved.data.routines.r1.assignmentLastRequestResolvedByUid='u2';
  projector.project(resolved);await flush();

  const helpResolved=calls.find((row)=>row.type==='cleaning.help.resolved');
  assert.ok(helpResolved,'help response must notify requester');
  assert.deepStrictEqual(helpResolved.uids,['u1']);
  assert.strictEqual(helpResolved.payload.actor.uid,'u2');

  const assignmentResolved=calls.find((row)=>row.type==='cleaning.assignment.resolved');
  assert.ok(assignmentResolved,'assignment response must notify requester');
  assert.deepStrictEqual(assignmentResolved.uids,['u1']);
  assert.strictEqual(assignmentResolved.payload.actor.uid,'u2');

  assert.ok(!source.includes('.transaction('),'notification projector may not mutate Cleaning');
  assert.ok(!source.includes(".ref("),'notification projector may not write Firebase directly');
  assert.ok(source.includes('publishToUidsOnce'),'collaboration events must use canonical NotificationStore exactly-once publishing');
  assert.ok(source.includes('publishSelfOnce'),'daily reminder must use canonical NotificationStore exactly-once publishing');
  assert.ok(source.includes("eventKey('cleaning.reminder.daily',uid,todayKey)"),'daily reminder key must be stable per user/local day');

  console.log('cleaning collaboration notifications + bundled daily reminder: ok');
})().catch((error)=>{console.error(error);process.exitCode=1;});
