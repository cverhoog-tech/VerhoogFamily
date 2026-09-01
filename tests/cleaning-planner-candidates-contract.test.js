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
  const window={startAt:20*day,endAt:27*day};
  const input={
    window,
    rooms:{
      activeRoom:{id:'stale-room-id',name:'Badkamer',active:true},
      deletedRoom:{name:'Berging',active:false}
    },
    routines:{
      normalDue:{roomId:'activeRoom',title:'Spiegel',nextDueAt:window.startAt+day,estimatedMinutes:5,priority:'NORMAL'},
      basicDue:{id:'stale-routine-id',roomId:'activeRoom',title:'Toilet',nextDueAt:window.startAt+day,estimatedMinutes:10,priority:'BASIC'},
      overdue:{roomId:'activeRoom',title:'Douche',nextDueAt:window.startAt-day,estimatedMinutes:15,priority:'EXTRA'},
      firstRun:{roomId:'activeRoom',title:'Wastafel'},
      future:{roomId:'activeRoom',title:'Kastjes',nextDueAt:window.endAt},
      inactive:{roomId:'activeRoom',title:'Plafond',active:false},
      paused:{roomId:'activeRoom',title:'Voegen',paused:true},
      missingRoom:{roomId:'unknownRoom',title:'Onbekend',nextDueAt:window.startAt},
      deletedRoomRoutine:{roomId:'deletedRoom',title:'Opslag',nextDueAt:window.startAt},
      noRoom:{title:'Los',nextDueAt:window.startAt}
    }
  };
  const before=JSON.stringify(input);
  const result=planner.selectDueRoutineItems(input);

  assert.strictEqual(JSON.stringify(input),before,'candidate selection must not mutate repository input');
  assert.deepStrictEqual(Array.from(result.candidates,x=>x.routineId),['overdue','firstRun','basicDue','normalDue']);
  assert.strictEqual(result.candidates[0].dueState,planner.DUE_STATE.OVERDUE);
  assert.strictEqual(result.candidates[1].dueSource,planner.DUE_SOURCE.FIRST_WINDOW);
  assert.strictEqual(result.candidates[2].estimatedMinutes,10);
  assert.strictEqual(result.candidates[2].routineId,'basicDue','Firebase map key must win over a stale embedded id');
  assert.strictEqual(result.candidates[2].priority,'BASIC','priority is a stable tie-breaker after dueAt');

  const reasons=Object.fromEntries(Array.from(result.excluded,x=>[x.routineId,x.reason]));
  assert.strictEqual(reasons.future,planner.EXCLUSION_REASON.NOT_DUE);
  assert.strictEqual(reasons.inactive,planner.EXCLUSION_REASON.INACTIVE);
  assert.strictEqual(reasons.paused,planner.EXCLUSION_REASON.PAUSED);
  assert.strictEqual(reasons.missingRoom,planner.EXCLUSION_REASON.ROOM_NOT_FOUND);
  assert.strictEqual(reasons.deletedRoomRoutine,planner.EXCLUSION_REASON.ROOM_INACTIVE);
  assert.strictEqual(reasons.noRoom,planner.EXCLUSION_REASON.ROOM_REQUIRED);
  assert.strictEqual(Object.isFrozen(result.candidates),true);
  assert.strictEqual(Object.isFrozen(result.candidates[0]),true);

  console.log('cleaning-planner-candidates-contract: ok');
})();
