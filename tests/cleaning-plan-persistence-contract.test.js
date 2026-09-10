'use strict';
const assert=require('assert');
const fs=require('fs');
const path=require('path');
const vm=require('vm');

function loadContracts(){
  const window={};
  const sandbox={window,Object,String,Number,Error,Array,Math,JSON,RegExp};
  vm.createContext(sandbox);
  ['cleaningPlannerContract.js','cleaningPlanPersistenceContract.js'].forEach((file) => {
    const source=fs.readFileSync(path.join(__dirname,'../src/modules/cleaning',file),'utf8');
    vm.runInContext(source,sandbox,{filename:file});
  });
  return {planner:window.CleaningPlannerContract,persistence:window.CleaningPlanPersistenceContract};
}

(function(){
  const {planner,persistence}=loadContracts();
  const day=planner.DAY_MS;
  const window={startAt:100*day,endAt:107*day};
  const rooms={
    bathroom:{name:'Badkamer',active:true},
    kitchen:{name:'Keuken',active:true}
  };
  const routines={
    shower:{roomId:'bathroom',title:'Douche',nextDueAt:window.startAt-day,estimatedMinutes:20},
    counter:{roomId:'kitchen',title:'Aanrecht',nextDueAt:window.startAt+day,estimatedMinutes:15}
  };
  const members={
    memberA:{displayName:'A',status:'active',joinedAt:1},
    memberB:{displayName:'B',status:'active',joinedAt:2}
  };
  const concept=planner.generateConceptPlan({window,rooms,routines,members});
  const timestamp=200*day;
  const input={conceptPlan:concept,householdId:'household-1',actorUid:'memberA',timestamp,existingData:{}};
  const before=JSON.stringify(input);
  const first=persistence.materializeDraft(input);

  assert.strictEqual(JSON.stringify(input),before,'materialization must not mutate concept or existing data');
  assert.strictEqual(first.planId,persistence.planIdForWindow(window));
  assert.strictEqual(first.plan.status,'DRAFT');
  assert.strictEqual(first.plan.householdId,'household-1');
  assert.strictEqual(first.plan.occurrenceIds.length,2);
  assert.strictEqual(first.plan.generationRevision,1);
  assert.strictEqual(first.plan.summary.totalEstimatedMinutes,35);
  assert.strictEqual(Object.prototype.hasOwnProperty.call(first.plan,'checklist'),false,'plan stores no duplicate checklist authority');
  assert.strictEqual(Object.prototype.hasOwnProperty.call(first.plan,'occurrenceDrafts'),false);

  const bathroomId=persistence.occurrenceIdFor(first.planId,'bathroom');
  const kitchenId=persistence.occurrenceIdFor(first.planId,'kitchen');
  const bathroom=first.occurrences[bathroomId];
  assert.strictEqual(bathroom.status,'DRAFT');
  assert.strictEqual(bathroom.planId,first.planId);
  assert.strictEqual(bathroom.roomId,'bathroom');
  assert.deepStrictEqual(Array.from(bathroom.routineItemIds),['shower']);
  assert.strictEqual(bathroom.checklist[0].title,'Douche');
  assert.deepStrictEqual(Array.from(bathroom.assignmentUids),['memberA']);
  assert.deepStrictEqual(JSON.parse(JSON.stringify(bathroom.projections)),{taskId:null,calendarEventId:null});
  assert.strictEqual(Object.isFrozen(first),true);
  assert.strictEqual(Object.isFrozen(first.plan),true);
  assert.strictEqual(Object.isFrozen(bathroom.checklist),true);

  const existingData={plans:{[first.planId]:JSON.parse(JSON.stringify(first.plan))},occurrences:JSON.parse(JSON.stringify(first.occurrences))};
  const retry=persistence.materializeDraft({conceptPlan:concept,householdId:'household-1',actorUid:'memberA',timestamp:timestamp+100,existingData});
  assert.strictEqual(retry.planId,first.planId,'same week must reuse the same plan id');
  assert.deepStrictEqual(Array.from(retry.plan.occurrenceIds),Array.from(first.plan.occurrenceIds),'same room bundles must reuse occurrence ids');
  assert.strictEqual(retry.plan.createdAt,first.plan.createdAt,'regeneration preserves immutable creation metadata');
  assert.strictEqual(retry.occurrences[bathroomId].createdAt,bathroom.createdAt);
  assert.strictEqual(retry.plan.generationRevision,2);

  const lessWork=planner.generateConceptPlan({
    window,
    rooms,
    routines:{shower:routines.shower,counter:Object.assign({},routines.counter,{nextDueAt:window.endAt})},
    members
  });
  const reduced=persistence.materializeDraft({conceptPlan:lessWork,householdId:'household-1',actorUid:'memberB',timestamp:timestamp+200,existingData});
  assert.deepStrictEqual(Array.from(reduced.plan.occurrenceIds),[bathroomId]);
  assert.strictEqual(reduced.occurrences[kitchenId].status,'CANCELLED','a removed draft reference is cancelled atomically');
  assert.strictEqual(reduced.occurrences[kitchenId].cancelledByUid,'memberB');

  const activePlan=JSON.parse(JSON.stringify(existingData));
  activePlan.plans[first.planId].status='PROPOSED';
  assert.throws(()=>persistence.materializeDraft({conceptPlan:concept,householdId:'household-1',actorUid:'memberA',timestamp:timestamp+300,existingData:activePlan}),/CLEANING_PLAN_NOT_DRAFT/);

  const invalidConcept=JSON.parse(JSON.stringify(concept));
  invalidConcept.occurrenceDrafts[0].roomId='bad/room';
  assert.throws(()=>persistence.materializeDraft({conceptPlan:invalidConcept,householdId:'household-1',actorUid:'memberA',timestamp:timestamp+400,existingData:{}}),/CLEANING_PLAN_OCCURRENCE_DRAFT_INVALID/);

  const invalidControlKey=JSON.parse(JSON.stringify(concept));
  invalidControlKey.occurrenceDrafts[0].roomId='bad\u0001room';
  assert.throws(()=>persistence.materializeDraft({conceptPlan:invalidControlKey,householdId:'household-1',actorUid:'memberA',timestamp:timestamp+450,existingData:{}}),/CLEANING_PLAN_OCCURRENCE_DRAFT_INVALID/,'Firebase control characters are never normalized into a different room identity');

  const invalidDue=JSON.parse(JSON.stringify(concept));
  invalidDue.occurrenceDrafts[0].checklist[0].dueAt=null;
  assert.throws(()=>persistence.materializeDraft({conceptPlan:invalidDue,householdId:'household-1',actorUid:'memberA',timestamp:timestamp+500,existingData:{}}),/CLEANING_PLAN_CHECKLIST_INVALID/,'persistence rejects incomplete canonical due data');

  const invalidAssignmentSummary=JSON.parse(JSON.stringify(concept));
  const firstMinutes=invalidAssignmentSummary.summary.memberLoads[0].estimatedMinutes;
  invalidAssignmentSummary.summary.memberLoads[0].estimatedMinutes=invalidAssignmentSummary.summary.memberLoads[1].estimatedMinutes;
  invalidAssignmentSummary.summary.memberLoads[1].estimatedMinutes=firstMinutes;
  assert.throws(()=>persistence.materializeDraft({conceptPlan:invalidAssignmentSummary,householdId:'household-1',actorUid:'memberA',timestamp:timestamp+600,existingData:{}}),/CLEANING_PLAN_ASSIGNMENT_SUMMARY_MISMATCH/,'member load summaries must match occurrence assignments');

  console.log('cleaning-plan-persistence-contract: ok');
})();
