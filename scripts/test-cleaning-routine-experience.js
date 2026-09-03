'use strict';
const assert=require('assert');
const fs=require('fs');
const path=require('path');
const vm=require('vm');

const context={
  console,Date,
  setTimeout:(fn)=>{fn();return 1;},clearTimeout:()=>{},requestAnimationFrame:(fn)=>{fn();return 1;},
  addEventListener:()=>{},dispatchEvent:()=>{},
  MutationObserver:function(cb){this.observe=()=>{};this.disconnect=()=>{};this.callback=cb;},
  HouseholdContext:{snapshot:()=>({ready:true,uid:'u1',householdId:'family-1'})},
  HouseholdIdentityFirebaseBridge:{getMembers:()=>[{uid:'u1',displayName:'Shane',status:'active'},{uid:'u2',displayName:'Esra',status:'active'}]},
  CleaningDomain:{basePath:(id)=>'families/'+id+'/cleaning'},
  document:{
    documentElement:{},head:{appendChild:()=>{}},getElementById:()=>null,
    createElement:()=>({id:'',textContent:'',className:'',setAttribute:()=>{},appendChild:()=>{},querySelector:()=>null,querySelectorAll:()=>[]}),
    querySelector:()=>null,querySelectorAll:()=>[],addEventListener:()=>{}
  }
};
context.window=context;
function load(name){const source=fs.readFileSync(path.join(__dirname,'..','src','modules','cleaning',name),'utf8');vm.runInNewContext(source,context,{filename:name});return source;}
load('cleaningPlannerContract.js');
load('cleaningPlanPersistenceContract.js');
load('cleaningRecurringPlanContract.js');
const source=load('cleaningRoutineExperience.js');
const experience=context.CleaningRoutineExperience;
assert.strictEqual(experience.version,'0.3.1');

const request=experience._assignmentPatch({assignee:'u2',repeatScope:'ONGOING'},null);
assert.strictEqual(request.assignmentMode,'REQUESTED');
assert.strictEqual(request.assignmentRequestStatus,'PENDING');
assert.strictEqual(request.preferredAssigneeUid,'u2');
assert.strictEqual(request.paused,true,'requested routine stays out of planning until the recipient accepts');
assert.strictEqual(request.repeatScope,'ONGOING');

const self=experience._assignmentPatch({assignee:'u1',repeatScope:'THIS_WEEK'},null);
assert.strictEqual(self.assignmentMode,'FIXED_PERSON');
assert.strictEqual(self.assignmentRequestStatus,'ACCEPTED');
assert.strictEqual(self.paused,false);
assert.strictEqual(self.repeatScope,'THIS_WEEK');
assert.ok(Number(self.repeatScopeWeekStartAt)>0);
assert.ok(Number(self.repeatScopeWeekEndAt)>Number(self.repeatScopeWeekStartAt));

const acceptedExisting=experience._assignmentPatch({assignee:'u2',repeatScope:'ONGOING'},{preferredAssigneeUid:'u2',assignmentRequestStatus:'ACCEPTED',assignmentAcceptedAt:123});
assert.strictEqual(acceptedExisting.assignmentRequestStatus,'ACCEPTED','editing an accepted assignment must not silently request it again');
assert.strictEqual(acceptedExisting.assignmentAcceptedAt,123);

// Accepting a transfer removes the same future routine from the old assignee,
// places every remaining occurrence with the recipient and refreshes plan data.
const DAY=context.CleaningRecurringPlanContract.DAY_MS;
const start=1704067200000;
const end=start+7*DAY;
const planId='week_'+start+'_'+end;
const oldDeskSlot=start+2*DAY;
const root={
  rooms:{kitchen:{id:'kitchen',name:'Keuken',active:true},office:{id:'office',name:'Kantoor',active:true}},
  routines:{desk:{id:'desk',roomId:'office',title:'Bureau afnemen',intervalDays:2,estimatedMinutes:5,priority:'NORMAL',active:true,createdAt:start+2*DAY+(12*60*60*1000),repeatScope:'ONGOING',assignmentMode:'FIXED_PERSON',assignmentRequestStatus:'ACCEPTED',preferredAssigneeUid:'u2'}},
  plans:{[planId]:{id:planId,householdId:'family-1',status:'ACTIVE',approvalState:'APPROVED',approvalRound:1,windowStartAt:start,windowEndAt:end,occurrenceIds:['existing','old-desk'],summary:{occurrenceCount:2,routineCount:2,totalEstimatedMinutes:15}}},
  occurrences:{
    existing:{id:'existing',householdId:'family-1',planId,roomId:'kitchen',slotAt:start,status:'FLEXIBLE',assignmentStatus:'ACTIVE',assignmentUids:['u1'],estimatedMinutes:10,dueState:'DUE_IN_WINDOW',checklist:[{id:'sink',routineItemId:'sink',title:'Spoelbak',estimatedMinutes:10,dueAt:start,dueState:'DUE_IN_WINDOW',completed:false}],routineItemIds:['sink']},
    'old-desk':{id:'old-desk',householdId:'family-1',planId,roomId:'office',slotAt:oldDeskSlot,status:'FLEXIBLE',assignmentStatus:'ACTIVE',assignmentUids:['u1'],estimatedMinutes:5,dueState:'DUE_IN_WINDOW',checklist:[{id:'desk',routineItemId:'desk',title:'Bureau afnemen',estimatedMinutes:5,dueAt:oldDeskSlot,dueState:'DUE_IN_WINDOW',completed:false}],routineItemIds:['desk'],projections:{taskId:'old-task',calendarEventId:'old-event'}}
  },
  approvals:{u1:{[planId]:{id:planId+'__u1',householdId:'family-1',planId,uid:'u1',status:'ACCEPTED',occurrenceIds:['existing','old-desk'],acceptedAt:start}}}
};
const plan=experience._injectAcceptedRoutine(root,'desk','u2',start+2*DAY+(13*60*60*1000));
assert.ok(plan);
assert.strictEqual(root.occurrences['old-desk'].status,'CANCELLED','old assignee occurrence must be retired after accepted transfer');
assert.strictEqual(root.occurrences['old-desk'].assignmentStatus,'SKIPPED');
const activeIds=plan.occurrenceIds.filter((id)=>root.occurrences[id]&&root.occurrences[id].status!=='CANCELLED');
const activeDeskIds=activeIds.filter((id)=>Array.isArray(root.occurrences[id].routineItemIds)&&root.occurrences[id].routineItemIds.includes('desk'));
assert.strictEqual(activeDeskIds.length,3,'recipient should receive the remaining Wed/Fri/Sun occurrences exactly once');
assert.ok(activeDeskIds.every((id)=>root.occurrences[id].assignmentUids[0]==='u2'));
assert.strictEqual(plan.summary.occurrenceCount,activeIds.length);
assert.strictEqual(plan.summary.routineCount,4);
assert.strictEqual(plan.summary.totalEstimatedMinutes,25);
assert.deepStrictEqual(Array.from(plan.requiredApprovalUids),['u1','u2']);
assert.deepStrictEqual(Array.from(plan.acceptedApprovalUids),['u1','u2']);
assert.strictEqual(plan.approvalSummary.pendingCount,0);
assert.strictEqual(root.approvals.u2[planId].status,'ACCEPTED');
assert.strictEqual(root.approvals.u2[planId].standingRoutineConsent,true);
assert.deepStrictEqual(Array.from(root.approvals.u2[planId].occurrenceIds).sort(),activeDeskIds.slice().sort());
assert.deepStrictEqual(Array.from(root.approvals.u1[planId].occurrenceIds),['existing']);

assert.ok(source.includes('.cleaning-room-card:not(.is-expanded)'));
assert.ok(source.includes('data-cleaning-room-expand'));
assert.ok(source.includes('data-cleaning-routine-assign'));
assert.ok(source.includes('Wie doet deze routine?'));
assert.ok(source.includes('vier weken vooruit'));
assert.ok(source.includes('data-cleaning-routine-request-accept'));
assert.ok(source.includes('data-cleaning-routine-request-decline'));
assert.ok(source.includes("scrollIntoView({behavior:'smooth',block:'start'})"));
assert.ok(source.includes("input&&input.templateKey?{assignee:'AUTO',repeatScope:'ONGOING'}"),'one-tap templates must not inherit a different open routine form');
assert.ok(source.includes('contextIsCurrent(write.token)'),'routine writes must remain scoped to the captured HouseholdContext');
assert.ok(source.includes('removeRoutineFromOtherAssignments'),'accepted transfers must remove duplicate future work');

console.log('cleaning compact rooms, edit scroll and duplicate-free routine request transfer: ok');
