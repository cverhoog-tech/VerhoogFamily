'use strict';
const assert=require('assert');
const fs=require('fs');
const path=require('path');
const vm=require('vm');

function loadContract(){
  const window={};
  const sandbox={window,Object,String,Number,Error,Array,Math};
  vm.createContext(sandbox);
  const source=fs.readFileSync(path.join(__dirname,'../src/modules/cleaning/cleaningPlannerContract.js'),'utf8');
  vm.runInContext(source,sandbox,{filename:'cleaningPlannerContract.js'});
  return window.CleaningPlannerContract;
}

(function(){
  const planner=loadContract();
  const day=planner.DAY_MS;
  const window={startAt:100*day,endAt:107*day};
  const rooms={
    bathroom:{name:'Badkamer',type:'bathroom',active:true},
    kitchen:{name:'Keuken',type:'kitchen',active:true},
    archived:{name:'Oude kamer',active:false}
  };
  const routines={
    shower:{roomId:'bathroom',title:'Douche',nextDueAt:window.startAt-day,estimatedMinutes:20,priority:'EXTRA'},
    sink:{roomId:'bathroom',title:'Wastafel',nextDueAt:window.startAt+day,estimatedMinutes:10,priority:'NORMAL'},
    counter:{roomId:'kitchen',title:'Aanrecht',nextDueAt:window.startAt+(2*day),estimatedMinutes:15,priority:'BASIC'},
    future:{roomId:'kitchen',title:'Kastjes',nextDueAt:window.endAt,estimatedMinutes:30},
    old:{roomId:'archived',title:'Plank',nextDueAt:window.startAt,estimatedMinutes:5}
  };
  const members={
    'member-b':{uid:'stale-embedded-uid',displayName:'B',status:'active',joinedAt:1},
    'member-a':{displayName:'A',status:'active',joinedAt:2},
    'member-c':{displayName:'C',status:'inactive',joinedAt:3}
  };
  const input={window,rooms,routines,members};
  const before=JSON.stringify(input);
  const plan=planner.generateConceptPlan(input);

  assert.strictEqual(planner.version,'0.5.0');
  assert.strictEqual(JSON.stringify(input),before,'concept generation must not mutate canonical snapshots');
  assert.strictEqual(plan.kind,planner.PLAN_KIND.CONCEPT);
  assert.strictEqual(plan.status,planner.PLAN_STATUS.DRAFT);
  assert.strictEqual(plan.id,null,'an in-memory concept has no persisted plan id');
  assert.strictEqual(plan.persisted,false);
  assert.strictEqual(Object.prototype.hasOwnProperty.call(plan,'createdAt'),false,'write metadata belongs to the persistence boundary');
  assert.deepStrictEqual(Array.from(plan.occurrenceDrafts,x=>x.roomId),['bathroom','kitchen']);

  const bathroom=plan.occurrenceDrafts[0];
  assert.strictEqual(bathroom.draftKey,'room:bathroom');
  assert.strictEqual(bathroom.occurrenceId,null,'occurrence ids are assigned only at the later write boundary');
  assert.strictEqual(bathroom.planId,null);
  assert.strictEqual(bathroom.estimatedMinutes,30);
  assert.strictEqual(bathroom.routineCount,2);
  assert.deepStrictEqual(Array.from(bathroom.routineItemIds),['shower','sink']);
  assert.deepStrictEqual(Array.from(bathroom.proposedAssignmentUids),['member-b']);
  assert.strictEqual(bathroom.scheduledStartAt,null);
  assert.strictEqual(bathroom.flexibleWindow,null);
  assert.strictEqual(Object.prototype.hasOwnProperty.call(bathroom,'projections'),false,'concept generation creates no Task or Agenda projection');

  assert.strictEqual(plan.summary.occurrenceCount,2);
  assert.strictEqual(plan.summary.routineCount,3);
  assert.strictEqual(plan.summary.overdueOccurrenceCount,1);
  assert.strictEqual(plan.summary.dueInWindowOccurrenceCount,1);
  assert.strictEqual(plan.summary.totalEstimatedMinutes,45);
  assert.strictEqual(plan.summary.imbalanceMinutes,15);
  assert.deepStrictEqual(Array.from(plan.summary.memberLoads,x=>[x.uid,x.estimatedMinutes]),[['member-b',30],['member-a',15]]);
  assert.strictEqual(plan.diagnostics.excludedRoutines.length,2);
  assert.strictEqual(plan.diagnostics.excludedMembers.length,1);
  assert.strictEqual(JSON.stringify(planner.generateConceptPlan(input)),JSON.stringify(plan),'the same snapshots must produce the same concept');
  assert.strictEqual(Object.isFrozen(plan),true);
  assert.strictEqual(Object.isFrozen(plan.occurrenceDrafts),true);
  assert.strictEqual(Object.isFrozen(bathroom),true);
  assert.strictEqual(Object.isFrozen(bathroom.checklist),true);
  assert.strictEqual(Object.isFrozen(bathroom.checklist[0]),true);
  assert.strictEqual(Object.isFrozen(plan.summary),true);

  const empty=planner.generateConceptPlan({window,rooms:{},routines:{},members:{}});
  assert.strictEqual(empty.summary.occurrenceCount,0,'an empty due window remains a valid deterministic draft');
  assert.strictEqual(empty.summary.totalEstimatedMinutes,0);
  assert.deepStrictEqual(Array.from(empty.occurrenceDrafts),[]);

  assert.throws(()=>planner.generateConceptPlan({window,rooms:{bathroom:rooms.bathroom},routines:{sink:routines.sink},members:{}}),/CLEANING_PLANNER_ACTIVE_MEMBER_REQUIRED/);

  console.log('cleaning-planner-concept-plan-contract: ok');
})();
