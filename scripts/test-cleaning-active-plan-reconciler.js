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

load('cleaningPlannerContract.js');
load('cleaningPlanPersistenceContract.js');
load('cleaningRecurringPlanContract.js');
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
  recurringContract:context.CleaningRecurringPlanContract
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

// A room and routine created after activation must be folded into this week.
root.rooms.office={id:'office',name:'Kantoor',type:'custom',active:true,distributionMode:'FAIR_TIME',createdAt:start+3*DAY};
root.routines.desk={id:'desk',roomId:'office',title:'Bureau afnemen',intervalDays:2,estimatedMinutes:5,priority:'NORMAL',active:true,createdAt:start+3*DAY+(12*60*60*1000),createdByUid:'u2'};
result=reconciler._reconcileRoot({
  root,planId,householdId,actorUid:'u1',timestamp:start+3*DAY+(12*60*60*1000),members,
  recurringContract:context.CleaningRecurringPlanContract
});
assert.strictEqual(result.changed,true);
assert.strictEqual(result.addedOccurrenceIds.length,2,'new midweek routine should occur on its creation day and two days later');
root=result.root;
assert.strictEqual(root.plans[planId].occurrenceIds.length,6);
assert.strictEqual(root.plans[planId].status,'PARTIALLY_ACCEPTED');
assert.strictEqual(root.approvals.u1[planId].status,'ACCEPTED');
assert.strictEqual(root.approvals.u2[planId].status,'PENDING');
assert.strictEqual(root.approvals.u2[planId].occurrenceIds.length,2);
assert.ok(root.approvals.u2[planId].occurrenceIds.every((id)=>root.occurrences[id].roomId==='office'));

const again=reconciler._reconcileRoot({
  root,planId,householdId,actorUid:'u2',timestamp:start+3*DAY+(13*60*60*1000),members,
  recurringContract:context.CleaningRecurringPlanContract
});
assert.strictEqual(again.changed,false,'reconciliation must be idempotent');
assert.strictEqual(again.reason,'ALREADY_CURRENT');

root=context.CleaningPlanApprovalUi.acceptRoot(root,planId,'u2',householdId,start+3*DAY+(14*60*60*1000));
assert.strictEqual(root.plans[planId].status,'ACTIVE');

const projection=context.CleaningProjectionService._buildProjectionUpdates({
  family:{cleaning:root,tasks:{},calendarEvents:{}},
  planId,householdId,actorUid:'u1',timestamp:start+3*DAY+(15*60*60*1000),members
});
assert.strictEqual(projection.createdTasks,5,'legacy task already exists conceptually; five new concrete tasks are required');
assert.strictEqual(projection.createdCalendarEvents,5,'five new calendar entries are required');
const eventDates=Object.keys(projection.updates).filter((key)=>key.startsWith('calendarEvents/')).map((key)=>projection.updates[key].date).sort();
assert.strictEqual(eventDates.length,5);
assert.ok(eventDates.some((date)=>date==='2024-01-03'));
assert.ok(eventDates.some((date)=>date==='2024-01-04'));
assert.ok(eventDates.some((date)=>date==='2024-01-05'));
assert.ok(eventDates.some((date)=>date==='2024-01-06'));
assert.ok(eventDates.some((date)=>date==='2024-01-07'));

console.log('cleaning active plan reconciler: ok');
