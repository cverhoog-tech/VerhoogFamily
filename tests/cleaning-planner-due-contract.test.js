'use strict';
const assert=require('assert');
const fs=require('fs');
const path=require('path');
const vm=require('vm');

function loadContract(){
  const window={};
  const sandbox={window,Object,String,Number,Error};
  vm.createContext(sandbox);
  const source=fs.readFileSync(path.join(__dirname,'../src/modules/cleaning/cleaningPlannerContract.js'),'utf8');
  vm.runInContext(source,sandbox,{filename:'cleaningPlannerContract.js'});
  return window.CleaningPlannerContract;
}

(function(){
  const planner=loadContract();
  const day=planner.DAY_MS;
  const start=10*day;
  const end=17*day;
  const window={startAt:start,endAt:end};

  assert(planner,'CleaningPlannerContract should be installed');
  assert.throws(()=>planner.planningWindow({startAt:end,endAt:start}),/CLEANING_PLANNING_WINDOW_INVALID/);

  const inactive=planner.evaluateRoutineDue({roomId:'room-a',active:false},window);
  assert.strictEqual(inactive.state,planner.DUE_STATE.EXCLUDED);
  assert.strictEqual(inactive.reason,planner.EXCLUSION_REASON.INACTIVE);

  const paused=planner.evaluateRoutineDue({roomId:'room-a',paused:true},window);
  assert.strictEqual(paused.reason,planner.EXCLUSION_REASON.PAUSED);

  const missingRoom=planner.evaluateRoutineDue({nextDueAt:start},window);
  assert.strictEqual(missingRoom.reason,planner.EXCLUSION_REASON.ROOM_REQUIRED);

  const overdue=planner.evaluateRoutineDue({roomId:'room-a',nextDueAt:start-1},window);
  assert.strictEqual(overdue.state,planner.DUE_STATE.OVERDUE);
  assert.strictEqual(overdue.dueThisWindow,true);
  assert.strictEqual(overdue.dueSource,planner.DUE_SOURCE.NEXT_DUE_AT);

  const atStart=planner.evaluateRoutineDue({roomId:'room-a',nextDueAt:start},window);
  assert.strictEqual(atStart.state,planner.DUE_STATE.DUE_IN_WINDOW);

  const beforeEnd=planner.evaluateRoutineDue({roomId:'room-a',nextDueAt:end-1},window);
  assert.strictEqual(beforeEnd.state,planner.DUE_STATE.DUE_IN_WINDOW);

  const atEnd=planner.evaluateRoutineDue({roomId:'room-a',nextDueAt:end},window);
  assert.strictEqual(atEnd.state,planner.DUE_STATE.FUTURE,'exclusive end prevents the same routine entering two adjacent weeks');
  assert.strictEqual(atEnd.dueThisWindow,false);

  const derived=planner.evaluateRoutineDue({roomId:'room-a',lastCompletedAt:start-(6*day),intervalDays:7},window);
  assert.strictEqual(derived.dueAt,start+day);
  assert.strictEqual(derived.dueSource,planner.DUE_SOURCE.LAST_COMPLETED_AT);

  const firstWithCreatedAt=planner.evaluateRoutineDue({roomId:'room-a',createdAt:start+day},window);
  assert.strictEqual(firstWithCreatedAt.dueAt,start+day);
  assert.strictEqual(firstWithCreatedAt.dueSource,planner.DUE_SOURCE.CREATED_AT);

  const firstWithoutHistory=planner.evaluateRoutineDue({roomId:'room-a'},window);
  assert.strictEqual(firstWithoutHistory.dueAt,start);
  assert.strictEqual(firstWithoutHistory.state,planner.DUE_STATE.DUE_IN_WINDOW);
  assert.strictEqual(firstWithoutHistory.dueSource,planner.DUE_SOURCE.FIRST_WINDOW);

  console.log('cleaning-planner-due-contract: ok');
})();
