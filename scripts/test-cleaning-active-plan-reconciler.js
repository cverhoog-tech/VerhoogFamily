'use strict';
const assert=require('assert');
const fs=require('fs');
const path=require('path');
const vm=require('vm');

const listeners={};
const context={
  console,
  setInterval:()=>1,
  clearInterval:()=>{},
  setTimeout:()=>1,
  requestAnimationFrame:(callback)=>callback(),
  addEventListener:(name,callback)=>{listeners[name]=callback;},
  dispatchEvent:()=>{},
  CustomEvent:function CustomEvent(name,options){this.type=name;this.detail=options&&options.detail;},
  MutationObserver:function MutationObserver(){this.observe=()=>{};this.disconnect=()=>{};},
  document:{
    documentElement:{},
    head:{appendChild:()=>{}},
    getElementById:()=>null,
    createElement:()=>({id:'',textContent:'',appendChild:()=>{},setAttribute:()=>{}})
  },
  CleaningDomain:{basePath:(householdId)=>'families/'+householdId+'/cleaning'}
};
context.window=context;

function load(name){
  const source=fs.readFileSync(path.join(__dirname,'..','src','modules','cleaning',name),'utf8');
  vm.runInNewContext(source,context,{filename:name});
}
function setPath(root,pathName,value){
  const parts=pathName.split('/');
  let cursor=root;
  for(let i=0;i<parts.length-1;i++){
    if(!cursor[parts[i]]||typeof cursor[parts[i]]!=='object')cursor[parts[i]]={};
    cursor=cursor[parts[i]];
  }
  cursor[parts[parts.length-1]]=JSON.parse(JSON.stringify(value));
}
function applyUpdates(root,updates){Object.keys(updates).forEach((key)=>setPath(root,key,updates[key]));}

load('cleaningPlannerContract.js');
load('cleaningPlanPersistenceContract.js');
load('cleaningRecurringPlanContract.js');
load('cleaningAvailabilityContract.js');
load('cleaningActivePlanReconciler.js');
load('cleaningPlanApprovalUi.js');
load('cleaningProjectionService.js');

const DAY=context.CleaningRecurringPlanContract.DAY_MS;
const start=1704067200000;
const end=start+(7*DAY);
const planId='week_1704067200000_1704672000000';
const householdId='family-1';
const members=[
  {uid:'u1',displayName:'Shane',status:'active'},
  {uid:'u2',displayName:'Esra',status:'active'}
];

let root={
  rooms:{kitchen:{id:'kitchen',name:'Keuken',type:'kitchen',active:true,distributionMode:'FAIR_TIME'}},
  routines:{worktop:{id:'worktop',roomId:'kitchen',title:'Werkblad',intervalDays:2,estimatedMinutes:10,priority:'NORMAL',active:true,createdAt:start,createdByUid:'u1'}},
  plans:{[planId]:{
    id:planId,householdId,status:'ACTIVE',approvalState:'APPROVED',approvalRound:1,
    windowStartAt:start,windowEndAt:end,occurrenceIds:['legacy-kitchen'],
    requiredApprovalUids:['u1'],acceptedApprovalUids:['u1'],declinedApprovalUids:[],
    summary:{occurrenceCount:1,routineCount:1,totalEstimatedMinutes:10},createdByUid:'u1'
  }},
  occurrences:{
    'legacy-kitchen':{
      id:'legacy-kitchen',householdId,planId,roomId:'kitchen',status:'FLEXIBLE',assignmentStatus:'ACTIVE',assignmentUids:['u1'],
      earliestDueAt:start,latestDueAt:start,estimatedMinutes:10,routineItemIds:['worktop'],
      checklist:[{id:'worktop',routineItemId:'worktop',title:'Werkblad',estimatedMinutes:10,priority:'NORMAL',dueAt:start,dueState:'DUE_IN_WINDOW',completed:false}],
      projections:{taskId:'cleaning_legacy-kitchen',calendarEventId:'cleaning_legacy-kitchen'}
    }
  },
  approvals:{u1:{[planId]:{id:planId+'__u1',householdId,planId,uid:'u1',status:'ACCEPTED',occurrenceIds:['legacy-kitchen'],round:1,createdAt:start,createdByUid:'u1'}}}
};

const reconciler=context.CleaningActivePlanReconciler;
let result=reconciler._reconcileRoot({
  root,planId,householdId,actorUid:'u1',timestamp:start+2*DAY+(12*60*60*1000),members,
  recurringContract:context.CleaningRecurringPlanContract,
  availabilityContract:context.CleaningAvailabilityContract
});
assert.strictEqual(result.changed,true);
assert.strictEqual(result.addedOccurrenceIds.length,3,'future Wed/Fri/Sun recurrences should be added to the active plan');
root=result.root;
assert.strictEqual(root.plans[planId].occurrenceIds.length,4);
assert.strictEqual(root.plans[planId].status,'PROPOSED');
assert.strictEqual(root.approvals.u1[planId].status,'PENDING','new workload must be personally approved');
assert.deepStrictEqual(Array.from(root.plans[planId].occurrenceIds).map((id)=>root.occurrences[id].earliestDueAt),[
  start,start+2*DAY,start+4*DAY,start+6*DAY
]);

root=context.CleaningPlanApprovalUi.acceptRoot(root,planId,'u1',householdId,start+2*DAY+(13*60*60*1000));
assert.strictEqual(root.plans[planId].status,'ACTIVE');

let family={
  cleaning:root,
  tasks:{legacyTask:{id:'cleaning_legacy-kitchen',cleaningOccurrenceId:'legacy-kitchen',sourceId:'legacy-kitchen',title:'Schoonmaken · Keuken'}},
  calendarEvents:{legacyEvent:{id:'cleaning_legacy-kitchen',cleaningOccurrenceId:'legacy-kitchen',sourceId:'legacy-kitchen',title:'Schoonmaken · Keuken',date:'2024-01-01'}}
};
let projection=context.CleaningProjectionService._buildProjectionUpdates({
  family,planId,householdId,actorUid:'u1',timestamp:start+2*DAY+(14*60*60*1000),members
});
assert.strictEqual(projection.createdTasks,3);
assert.strictEqual(projection.createdCalendarEvents,3);
applyUpdates(family,projection.updates);
root=family.cleaning;

// A room and routine created after activation must be folded into this week.
root.rooms.office={id:'office',name:'Kantoor',type:'custom',active:true,distributionMode:'FAIR_TIME',createdAt:start+3*DAY};
root.routines.desk={id:'desk',roomId:'office',title:'Bureau afnemen',intervalDays:2,estimatedMinutes:5,priority:'NORMAL',active:true,createdAt:start+3*DAY+(12*60*60*1000),createdByUid:'u2'};
result=reconciler._reconcileRoot({
  root,planId,householdId,actorUid:'u1',timestamp:start+3*DAY+(12*60*60*1000),members,
  recurringContract:context.CleaningRecurringPlanContract,
  availabilityContract:context.CleaningAvailabilityContract
});
assert.strictEqual(result.changed,true);
assert.strictEqual(result.addedOccurrenceIds.length,2,'new midweek routine should occur on its creation day and two days later');
root=result.root;
family.cleaning=root;
assert.strictEqual(root.plans[planId].occurrenceIds.length,6);
assert.strictEqual(root.plans[planId].status,'PARTIALLY_ACCEPTED');
assert.strictEqual(root.approvals.u1[planId].status,'ACCEPTED');
assert.strictEqual(root.approvals.u2[planId].status,'PENDING');
assert.strictEqual(root.approvals.u2[planId].occurrenceIds.length,2);
assert.ok(root.approvals.u2[planId].occurrenceIds.every((id)=>root.occurrences[id].roomId==='office'));

const again=reconciler._reconcileRoot({
  root,planId,householdId,actorUid:'u2',timestamp:start+3*DAY+(13*60*60*1000),members,
  recurringContract:context.CleaningRecurringPlanContract,
  availabilityContract:context.CleaningAvailabilityContract
});
assert.strictEqual(again.changed,false,'reconciliation must be idempotent');
assert.strictEqual(again.reason,'ALREADY_CURRENT');

root=context.CleaningPlanApprovalUi.acceptRoot(root,planId,'u2',householdId,start+3*DAY+(14*60*60*1000));
assert.strictEqual(root.plans[planId].status,'ACTIVE');
family.cleaning=root;

projection=context.CleaningProjectionService._buildProjectionUpdates({
  family,planId,householdId,actorUid:'u1',timestamp:start+3*DAY+(15*60*60*1000),members
});
assert.strictEqual(projection.createdTasks,2,'the newly added room needs two concrete tasks');
assert.strictEqual(projection.createdCalendarEvents,2,'the newly added room needs two concrete calendar entries');
applyUpdates(family,projection.updates);

const eventDates=Object.keys(family.calendarEvents).map((key)=>family.calendarEvents[key].date).sort();
assert.deepStrictEqual(eventDates,['2024-01-01','2024-01-03','2024-01-04','2024-01-05','2024-01-06','2024-01-07']);

const finalProjection=context.CleaningProjectionService._buildProjectionUpdates({
  family,planId,householdId,actorUid:'u2',timestamp:start+3*DAY+(16*60*60*1000),members
});
assert.strictEqual(finalProjection.createdTasks,0);
assert.strictEqual(finalProjection.createdCalendarEvents,0);
assert.strictEqual(Object.keys(finalProjection.updates).length,0,'repeat projection must remain idempotent');

// Availability is prospective: existing accepted u2 work stays assigned, but
// a new supplemental routine created while u2 is unavailable must go to u1.
root.availability={
  u2:{scope:'MEMBER',uid:'u2',status:'UNAVAILABLE',reason:'TEMPORARY',fromAt:start+4*DAY,untilAt:end}
};
const existingU2OccurrenceIds=root.plans[planId].occurrenceIds.filter((id)=>Array.isArray(root.occurrences[id].assignmentUids)&&root.occurrences[id].assignmentUids[0]==='u2');
assert.ok(existingU2OccurrenceIds.length>0,'fixture must already contain accepted u2 work');
root.rooms.study={id:'study',name:'Studeerkamer',type:'custom',active:true,distributionMode:'FAIR_TIME',createdAt:start+4*DAY};
root.routines.studyDust={id:'studyDust',roomId:'study',title:'Studeerkamer afstoffen',intervalDays:7,estimatedMinutes:8,priority:'NORMAL',active:true,createdAt:start+4*DAY+(12*60*60*1000),createdByUid:'u2'};
const unavailableResult=reconciler._reconcileRoot({
  root,planId,householdId,actorUid:'u1',timestamp:start+4*DAY+(12*60*60*1000),members,
  recurringContract:context.CleaningRecurringPlanContract,
  availabilityContract:context.CleaningAvailabilityContract
});
assert.strictEqual(unavailableResult.changed,true,'new eligible work must still reconcile while one member is unavailable');
assert.strictEqual(unavailableResult.addedOccurrenceIds.length,1);
assert.ok(unavailableResult.addedOccurrenceIds.every((id)=>unavailableResult.root.occurrences[id].assignmentUids[0]==='u1'),'supplemental work may not be assigned to an unavailable member');
existingU2OccurrenceIds.forEach((id)=>assert.strictEqual(unavailableResult.root.occurrences[id].assignmentUids[0],'u2','availability may not silently rewrite existing occurrence ownership'));
root=unavailableResult.root;

// Busy week is also prospective: EXTRA routines newly introduced while the
// mode overlaps this plan are deferred rather than written into the live plan.
root.availability.__household__={scope:'HOUSEHOLD',mode:'BUSY_WEEK',fromAt:start+5*DAY,untilAt:end};
root.rooms.garage={id:'garage',name:'Garage',type:'custom',active:true,distributionMode:'FAIR_TIME',createdAt:start+5*DAY};
root.routines.garageDeep={id:'garageDeep',roomId:'garage',title:'Garage grondig',intervalDays:7,estimatedMinutes:30,priority:'EXTRA',active:true,createdAt:start+5*DAY+(10*60*60*1000),createdByUid:'u1'};
const busyResult=reconciler._reconcileRoot({
  root,planId,householdId,actorUid:'u1',timestamp:start+5*DAY+(10*60*60*1000),members,
  recurringContract:context.CleaningRecurringPlanContract,
  availabilityContract:context.CleaningAvailabilityContract
});
assert.strictEqual(busyResult.changed,false,'busy week EXTRA work must not create a supplemental occurrence');
assert.strictEqual(busyResult.reason,'ALREADY_CURRENT');
assert.ok(!busyResult.root.plans[planId].occurrenceIds.some((id)=>Array.isArray(busyResult.root.occurrences[id].routineItemIds)&&busyResult.root.occurrences[id].routineItemIds.includes('garageDeep')));

console.log('cleaning active plan reconciler + availability: ok');
