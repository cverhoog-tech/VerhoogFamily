'use strict';
const assert=require('assert');
const fs=require('fs');
const path=require('path');
const vm=require('vm');

function read(file){return fs.readFileSync(path.join(__dirname,'..',file),'utf8');}
function localAt(y,m,d,h=0,min=0){return new Date(y,m-1,d,h,min,0,0).getTime();}

const contractSource=read('src/modules/cleaning/cleaningExceptionContract.js');
const runtimeSource=read('src/modules/cleaning/cleaningExceptionRuntime.js');
const taskUiSource=read('src/modules/cleaning/cleaningExceptionTaskUi.js');
const pauseSource=read('src/modules/cleaning/cleaningPauseExperience.js');
const overviewSource=read('src/modules/cleaning/cleaningOverviewExperience.js');
const sanitizerSource=read('src/modules/cleaning/cleaningPlanSanitizer.js');
const templateSource=read('src/modules/cleaning/cleaningRoutineTemplates.js');
const calendarSource=read('src/modules/calendar/calendar.js');

const sandbox={window:{},console:console,Date:Date,JSON:JSON,Math:Math,Object:Object,Array:Array,String:String,Number:Number,RegExp:RegExp,Error:Error,Map:Map,Set:Set};
sandbox.window.window=sandbox.window;
vm.runInNewContext(contractSource,sandbox,{filename:'cleaningExceptionContract.js'});
const contract=sandbox.window.CleaningExceptionContract;
assert.ok(contract,'exception contract must register');
assert.strictEqual(contract.version,'0.1.1');

const windowStart=localAt(2026,9,1);
const windowEnd=localAt(2026,9,8);
const stamp=localAt(2026,9,3,12);
const base={
  rooms:{room1:{id:'room1',name:'Badkamer',active:true}},
  routines:{
    r1:{id:'r1',roomId:'room1',active:true,intervalDays:7,nextDueAt:localAt(2026,9,1)},
    r2:{id:'r2',roomId:'room1',active:true,intervalDays:7,nextDueAt:localAt(2026,8,1)}
  },
  plans:{p1:{id:'p1',householdId:'hh1',status:'ACTIVE',windowStartAt:windowStart,windowEndAt:windowEnd,occurrenceIds:['o1']}},
  occurrences:{o1:{
    id:'o1',householdId:'hh1',planId:'p1',roomId:'room1',status:'FLEXIBLE',assignmentStatus:'ACTIVE',assignmentUids:['u1'],estimatedMinutes:25,
    checklist:[
      {id:'r1',routineItemId:'r1',title:'Douche',estimatedMinutes:10,dueAt:localAt(2026,9,1),completed:true},
      {id:'r2',routineItemId:'r2',title:'Vloer',estimatedMinutes:15,dueAt:localAt(2026,8,1),completed:false}
    ]
  }},
  completionLogs:{}
};

const rescheduled=contract.apply({cleaning:base,occurrenceIds:['o1'],householdId:'hh1',actorUid:'u1',timestamp:stamp,action:'RESCHEDULE',options:{date:'2026-09-05',time:'10:30'}});
assert.strictEqual(rescheduled.action,'RESCHEDULE');
assert.strictEqual(rescheduled.cleaning.occurrences.o1.status,'SCHEDULED');
assert.strictEqual(rescheduled.cleaning.occurrences.o1.assignmentStatus,'ACTIVE');
assert.strictEqual(rescheduled.cleaning.occurrences.o1.scheduledDate,'2026-09-05');
assert.strictEqual(rescheduled.cleaning.occurrences.o1.scheduledTime,'10:30');
assert.strictEqual(rescheduled.cleaning.occurrences.o1.checklist[0].completed,true,'completed work must survive rescheduling');
assert.strictEqual(rescheduled.cleaning.occurrences.o1.checklist[1].completed,false);
assert.strictEqual(base.occurrences.o1.scheduledDate,undefined,'pure contract must not mutate caller input');
assert.ok(rescheduled.schedule.dayEndAt>rescheduled.schedule.dayStartAt,'local day window must be valid');

assert.throws(()=>contract.apply({cleaning:base,occurrenceIds:['o1'],householdId:'hh1',actorUid:'u1',timestamp:stamp,action:'RESCHEDULE',options:{date:'2026-09-09',time:''}}),/DATE_OUTSIDE_PLAN/);

const carried=contract.apply({cleaning:base,occurrenceIds:['o1'],householdId:'hh1',actorUid:'u1',timestamp:stamp,action:'CARRY_FORWARD'});
const carriedOccurrence=carried.cleaning.occurrences.o1;
assert.strictEqual(carriedOccurrence.status,'SKIPPED');
assert.strictEqual(carriedOccurrence.assignmentStatus,'SKIPPED');
assert.strictEqual(carriedOccurrence.exceptionOutcome,'CARRY_FORWARD');
assert.strictEqual(carried.logIds.length,1);
const carryLog=carried.cleaning.completionLogs[carried.logIds[0]];
assert.strictEqual(carryLog.status,'PARTIAL','a partly completed turn must be historical PARTIAL');
assert.strictEqual(carryLog.outcome,'CARRY_FORWARD');
assert.deepStrictEqual(Array.from(carryLog.completedRoutineItemIds),['r1']);
assert.deepStrictEqual(Array.from(carryLog.remainingRoutineItemIds),['r2']);
assert.ok(Number(carried.cleaning.routines.r2.nextDueAt)>=new Date(2026,8,3).setHours(0,0,0,0),'deeply overdue carry-forward may not create historical backlog');
assert.strictEqual(carried.cleaning.routines.r1.nextDueAt,base.routines.r1.nextDueAt,'already completed routine must not be pushed by the remaining-work choice');

const allOpen=JSON.parse(JSON.stringify(base));
allOpen.occurrences.o1.checklist.forEach(item=>{item.completed=false;});
const skipped=contract.apply({cleaning:allOpen,occurrenceIds:['o1'],householdId:'hh1',actorUid:'u1',timestamp:stamp,action:'SKIP'});
const skipLog=skipped.cleaning.completionLogs[skipped.logIds[0]];
assert.strictEqual(skipLog.status,'SKIPPED');
assert.strictEqual(skipLog.outcome,'SKIP');
assert.strictEqual(skipped.cleaning.occurrences.o1.skipReason,'SKIP');

const complete=JSON.parse(JSON.stringify(base));
complete.occurrences.o1.status='COMPLETED';complete.occurrences.o1.assignmentStatus='COMPLETED';
assert.throws(()=>contract.apply({cleaning:complete,occurrenceIds:['o1'],householdId:'hh1',actorUid:'u1',timestamp:stamp,action:'SKIP'}),/NO_ACTIVE_OCCURRENCES/);

// Runtime ownership / safety.
assert.ok(runtimeSource.includes("cleaningPath:'families/'+ctx.householdId+'/cleaning'"),'exception runtime must transact the authorized Cleaning root');
assert.ok(runtimeSource.includes("ref(write.cleaningPath).transaction"));
assert.ok(!runtimeSource.includes("ref('families/'+write.ctx.householdId).transaction"),'exception runtime may not transact the family parent');
assert.ok(runtimeSource.includes('CleaningProjectionService'),'derived projection repair must stay best effort after canonical commit');

// User-facing incomplete execution choices.
for(const label of ['RESCHEDULE','CARRY_FORWARD','SKIP'])assert.ok(taskUiSource.includes(label),'Task exception UI must expose '+label);
assert.ok(taskUiSource.includes('Niet alles gelukt?'));
assert.ok(taskUiSource.includes("state.confirmAction!==action"),'destructive exception choices need an explicit second tap');
assert.ok(!taskUiSource.includes('cleaning-approval-copy'),'Task exception UI may not own Planning approval copy');

// Pause semantics: a pause freezes the countdown to nextDueAt and preserves
// accepted assignment continuity, rather than stopping the recurrence chain.
assert.ok(pauseSource.includes("var VERSION='0.2.0'"));
assert.ok(pauseSource.includes("pausePatch(row,id,'ROUTINE'"));
assert.ok(pauseSource.includes("pausePatch(routine,routine.id,'ROOM'"));
assert.ok(pauseSource.includes('pauseCadenceStartedAt'));
assert.ok(pauseSource.includes('pauseCadenceNextDueAt'));
assert.ok(pauseSource.includes('continuityAssigneeUid'));
assert.ok(pauseSource.includes('ACCEPTED_PLAN_BEFORE_PAUSE'));
assert.ok(pauseSource.includes('nextDueOnResume'));
assert.ok(pauseSource.includes("roomIsPaused(text(row.roomId))"),'a routine may not auto-resume underneath a still-paused room');
assert.ok(!pauseSource.includes('cleaning-approval-copy'));
assert.ok(sanitizerSource.includes("row.paused!==true"),'live-plan sanitizer must treat paused routines as unavailable');
assert.ok(sanitizerSource.includes("row.status==='CANCELLED'||row.status==='SKIPPED'"),'explicitly skipped turns must leave the live plan');

// Overview/history is read-only presentation over canonical Cleaning data.
assert.ok(overviewSource.includes('completionLogs'));
assert.ok(overviewSource.includes('Recente geschiedenis'));
assert.ok(overviewSource.includes('data-cleaning-planned-room-list'));
assert.ok(!overviewSource.includes('.transaction('));
assert.ok(!overviewSource.includes('.update('));
assert.ok(!overviewSource.includes('cleaning-approval-copy'));

// Loading order: pause belongs to Cleaning room experience; task exception
// contract/runtime/UI belong after execution guard and before Task supply UI.
assert.ok(templateSource.includes("import './cleaningRoomWorkflowUx.js?v=2';"));
assert.ok(templateSource.includes("import './cleaningPauseExperience.js?v=2';"));
assert.ok(templateSource.includes("import './cleaningPlanSanitizer.js?v=2';"));
assert.ok(templateSource.includes("import './cleaningOverviewExperience.js?v=1';"));
assert.ok(templateSource.indexOf('cleaningRoomWorkflowUx.js?v=2')<templateSource.indexOf('cleaningPauseExperience.js?v=2'));
assert.ok(templateSource.indexOf('cleaningPlanSanitizer.js?v=2')<templateSource.indexOf('cleaningOverviewExperience.js?v=1'));

const executionGuardIndex=calendarSource.indexOf('cleaningExecutionUiGuard.js?v=1');
const exceptionContractIndex=calendarSource.indexOf('cleaningExceptionContract.js?v=1');
const exceptionRuntimeIndex=calendarSource.indexOf('cleaningExceptionRuntime.js?v=1');
const exceptionUiIndex=calendarSource.indexOf('cleaningExceptionTaskUi.js?v=1');
const supplyUiIndex=calendarSource.indexOf('cleaningTaskSupplyUi.js?v=1');
assert.ok(executionGuardIndex>=0&&executionGuardIndex<exceptionContractIndex);
assert.ok(exceptionContractIndex<exceptionRuntimeIndex&&exceptionRuntimeIndex<exceptionUiIndex);
assert.ok(exceptionUiIndex<supplyUiIndex);

console.log('cleaning incomplete execution + pause cadence + history contracts: ok');
