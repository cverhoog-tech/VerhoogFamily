'use strict';
const assert=require('assert');
const fs=require('fs');
const path=require('path');
const vm=require('vm');

function loadContract(){
  const window={};
  const sandbox={window,Object,String,Number,Error,Array};
  vm.createContext(sandbox);
  const source=fs.readFileSync(path.join(__dirname,'../src/modules/cleaning/cleaningPlannerContract.js'),'utf8');
  vm.runInContext(source,sandbox,{filename:'cleaningPlannerContract.js'});
  return window.CleaningPlannerContract;
}

(function(){
  const planner=loadContract();
  const day=planner.DAY_MS;
  const planningWindow={startAt:30*day,endAt:37*day};
  const rooms={
    bathroom:{name:'Badkamer',type:'bathroom',active:true},
    kitchen:{name:'Keuken',type:'kitchen',active:true}
  };
  const routines={
    sink:{roomId:'bathroom',title:'Wastafel',nextDueAt:planningWindow.startAt+day,estimatedMinutes:10,priority:'NORMAL'},
    shower:{roomId:'bathroom',title:'Douche',nextDueAt:planningWindow.startAt-day,estimatedMinutes:15,priority:'EXTRA'},
    mirror:{roomId:'bathroom',title:'Spiegel',nextDueAt:planningWindow.startAt+day,estimatedMinutes:5,priority:'BASIC'},
    counter:{roomId:'kitchen',title:'Aanrecht',nextDueAt:planningWindow.startAt-2*day,estimatedMinutes:8,priority:'BASIC'}
  };
  const selection=planner.selectDueRoutineItems({window:planningWindow,rooms,routines});
  const before=JSON.stringify({rooms,candidates:selection.candidates});
  const result=planner.bundleCandidatesByRoom({rooms,candidates:selection.candidates});

  assert.strictEqual(JSON.stringify({rooms,candidates:selection.candidates}),before,'bundling must not mutate rooms or candidates');
  assert.strictEqual(result.bundles.length,2,'one conceptual clean is created per room');
  assert.deepStrictEqual(Array.from(result.bundles,x=>x.roomId),['kitchen','bathroom']);

  const bathroom=result.bundles[1];
  assert.strictEqual(bathroom.bundleKey,'room:bathroom');
  assert.strictEqual(bathroom.roomName,'Badkamer');
  assert.strictEqual(bathroom.routineCount,3);
  assert.strictEqual(bathroom.estimatedMinutes,30,'room load is the sum of checklist estimates');
  assert.strictEqual(bathroom.dueState,planner.DUE_STATE.OVERDUE,'one overdue item makes the room bundle overdue');
  assert.strictEqual(bathroom.earliestDueAt,planningWindow.startAt-day);
  assert.strictEqual(bathroom.latestDueAt,planningWindow.startAt+day);
  assert.deepStrictEqual(Array.from(bathroom.routineItemIds),['shower','mirror','sink']);
  assert.deepStrictEqual(Array.from(bathroom.checklist,x=>x.title),['Douche','Spiegel','Wastafel']);
  assert.strictEqual(bathroom.checklist.every(x=>x.completed===false),true);
  assert.strictEqual(Object.isFrozen(result.bundles),true);
  assert.strictEqual(Object.isFrozen(bathroom.checklist),true);
  assert.strictEqual(Object.isFrozen(bathroom.checklist[0]),true);

  assert.throws(()=>planner.bundleCandidatesByRoom({rooms,candidates:[selection.candidates[0],selection.candidates[0]]}),/CLEANING_PLANNER_DUPLICATE_ROUTINE_CANDIDATE/);
  assert.throws(()=>planner.bundleCandidatesByRoom({rooms:{},candidates:[selection.candidates[0]]}),/CLEANING_PLANNER_BUNDLE_ROOM_NOT_FOUND/);
  assert.throws(()=>planner.bundleCandidatesByRoom({rooms:{kitchen:{active:false}},candidates:[selection.candidates[0]]}),/CLEANING_PLANNER_BUNDLE_ROOM_INACTIVE/);
  assert.throws(()=>planner.bundleCandidatesByRoom({rooms,candidates:[Object.assign({},selection.candidates[0],{dueState:planner.DUE_STATE.FUTURE})]}),/CLEANING_PLANNER_CANDIDATE_NOT_DUE/);

  console.log('cleaning-planner-bundles-contract: ok');
})();
