'use strict';
const assert=require('assert');
const fs=require('fs');
const path=require('path');
const vm=require('vm');

const context={console,Date};
context.window=context;
['cleaningPlannerContract.js','cleaningPlanPersistenceContract.js','cleaningRecurringPlanContract.js'].forEach((name)=>{
  const source=fs.readFileSync(path.join(__dirname,'..','src','modules','cleaning',name),'utf8');
  vm.runInNewContext(source,context,{filename:name});
});

const recurring=context.CleaningRecurringPlanContract;
const DAY=recurring.DAY_MS;
const start=1704067200000; // Monday 1 Jan 2024 00:00 UTC
const end=start+(7*DAY);
const rooms={kitchen:{id:'kitchen',name:'Keuken',type:'kitchen',active:true,distributionMode:'FAIR_TIME'}};
const members=[{uid:'u1',displayName:'Shane',status:'active'},{uid:'u2',displayName:'Esra',status:'active'}];
const routines={
  worktop:{id:'worktop',roomId:'kitchen',title:'Werkblad',intervalDays:2,estimatedMinutes:10,priority:'NORMAL',active:true,createdAt:start}
};

const concept=context.CleaningPlannerContract.generateConceptPlan({window:{startAt:start,endAt:end},rooms,routines,members});
assert.strictEqual(context.CleaningPlannerContract.version,'0.7.0');
assert.strictEqual(context.CleaningPlanPersistenceContract.version,'0.2.1');
assert.strictEqual(recurring.version,'0.2.0');
assert.strictEqual(concept.occurrenceDrafts.length,4,'every-two-days routine should occur on Mon/Wed/Fri/Sun');
assert.deepStrictEqual(Array.from(concept.occurrenceDrafts).map((row)=>row.slotAt),[start,start+2*DAY,start+4*DAY,start+6*DAY]);
assert.strictEqual(concept.summary.routineCount,4,'routine count should include each concrete recurrence');
assert.strictEqual(concept.summary.totalEstimatedMinutes,40);

const persisted=context.CleaningPlanPersistenceContract.materializeDraft({
  conceptPlan:concept,
  householdId:'family-1',
  actorUid:'u1',
  timestamp:start+1234,
  existingData:{}
});
assert.strictEqual(persisted.plan.occurrenceIds.length,4);
assert.strictEqual(new Set(Array.from(persisted.plan.occurrenceIds)).size,4,'recurrences require stable distinct occurrence ids');
assert.ok(Array.from(persisted.plan.occurrenceIds).every((id)=>id.includes('__slot_')));
assert.deepStrictEqual(Array.from(persisted.plan.occurrenceIds).map((id)=>persisted.occurrences[id].slotAt),[start,start+2*DAY,start+4*DAY,start+6*DAY]);

const addedMidweek=recurring.expandRoutineSlots({
  window:{startAt:start,endAt:end},
  rooms:{office:{id:'office',name:'Kantoor',active:true}},
  routines:{desk:{id:'desk',roomId:'office',title:'Bureau',intervalDays:2,estimatedMinutes:5,active:true,createdAt:start+3*DAY+(12*60*60*1000)}}
});
assert.deepStrictEqual(Array.from(addedMidweek.candidates).map((row)=>row.slotAt),[start+3*DAY,start+5*DAY],
  'a routine added midweek should start that day and repeat inside the same week');

// Future weeks preserve the interval cadence instead of adding an artificial Monday carry-over.
const nextWeek=recurring.expandRoutineSlots({
  window:{startAt:end,endAt:end+7*DAY},rooms,routines,carryOverOverdue:false
});
assert.deepStrictEqual(Array.from(nextWeek.candidates).map((row)=>row.slotAt),[end+DAY,end+3*DAY,end+5*DAY],
  'Mon/Wed/Fri/Sun continues as Tue/Thu/Sat in the following week');

const thisWeekOnly=recurring.expandRoutineSlots({
  window:{startAt:end,endAt:end+7*DAY},rooms,
  routines:{once:{id:'once',roomId:'kitchen',title:'Eenmalig',intervalDays:1,estimatedMinutes:5,active:true,createdAt:start,repeatScope:'THIS_WEEK',repeatScopeWeekStartAt:start,repeatScopeWeekEndAt:end}},
  carryOverOverdue:false
});
assert.strictEqual(thisWeekOnly.candidates.length,0,'THIS_WEEK routines must not enter later weeks');
assert.strictEqual(thisWeekOnly.excluded[0].reason,'SCOPE_THIS_WEEK_ONLY');

const fixed=context.CleaningPlannerContract.generateConceptPlan({
  window:{startAt:start,endAt:end},rooms,
  routines:{mine:{id:'mine',roomId:'kitchen',title:'Vast voor Esra',intervalDays:7,estimatedMinutes:10,active:true,createdAt:start,assignmentMode:'FIXED_PERSON',assignmentRequestStatus:'ACCEPTED',preferredAssigneeUid:'u2'}},
  members
});
assert.strictEqual(fixed.occurrenceDrafts[0].proposedAssignmentUids[0],'u2','accepted fixed-person choice must survive plan generation');

console.log('cleaning recurring plan contract: ok');
