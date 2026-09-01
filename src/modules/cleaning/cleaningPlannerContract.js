'use strict';
// ============================================================
// CLEANING PLANNER CONTRACT v0.1.0
// Pure due semantics only: no Firebase, localStorage or DOM work.
// A planning window is half-open: [startAt, endAt).
// ============================================================
(function(){
  if(window.CleaningPlannerContract)return;

  var VERSION='0.1.0';
  var DAY_MS=24*60*60*1000;

  var DUE_STATE=Object.freeze({
    EXCLUDED:'EXCLUDED',
    OVERDUE:'OVERDUE',
    DUE_IN_WINDOW:'DUE_IN_WINDOW',
    FUTURE:'FUTURE'
  });

  var DUE_SOURCE=Object.freeze({
    NEXT_DUE_AT:'NEXT_DUE_AT',
    LAST_COMPLETED_AT:'LAST_COMPLETED_AT',
    CREATED_AT:'CREATED_AT',
    FIRST_WINDOW:'FIRST_WINDOW'
  });

  var EXCLUSION_REASON=Object.freeze({
    INACTIVE:'INACTIVE',
    PAUSED:'PAUSED',
    ROOM_REQUIRED:'ROOM_REQUIRED'
  });

  function finiteTimestamp(value){
    var number=Number(value);
    return Number.isFinite(number)&&number>0?number:null;
  }

  function planningWindow(input){
    var source=input||{};
    var startAt=finiteTimestamp(source.startAt);
    var endAt=finiteTimestamp(source.endAt);
    if(!startAt||!endAt||endAt<=startAt)throw new Error('CLEANING_PLANNING_WINDOW_INVALID');
    return Object.freeze({startAt:startAt,endAt:endAt});
  }

  function deriveDue(routine,windowStartAt){
    var row=routine||{};
    var explicit=finiteTimestamp(row.nextDueAt);
    if(explicit)return{dueAt:explicit,source:DUE_SOURCE.NEXT_DUE_AT};

    var completed=finiteTimestamp(row.lastCompletedAt);
    if(completed){
      var intervalDays=Math.max(1,parseInt(row.intervalDays,10)||7);
      return{dueAt:completed+(intervalDays*DAY_MS),source:DUE_SOURCE.LAST_COMPLETED_AT};
    }

    var created=finiteTimestamp(row.createdAt);
    if(created)return{dueAt:created,source:DUE_SOURCE.CREATED_AT};

    return{dueAt:windowStartAt,source:DUE_SOURCE.FIRST_WINDOW};
  }

  function excluded(reason,window){
    return Object.freeze({
      eligible:false,
      dueThisWindow:false,
      state:DUE_STATE.EXCLUDED,
      reason:reason,
      dueAt:null,
      dueSource:null,
      window:window
    });
  }

  function evaluateRoutineDue(routine,inputWindow){
    var window=planningWindow(inputWindow);
    var row=routine||{};
    if(row.active===false)return excluded(EXCLUSION_REASON.INACTIVE,window);
    if(row.paused===true)return excluded(EXCLUSION_REASON.PAUSED,window);
    if(!String(row.roomId||'').trim())return excluded(EXCLUSION_REASON.ROOM_REQUIRED,window);

    var due=deriveDue(row,window.startAt);
    var state=due.dueAt<window.startAt?DUE_STATE.OVERDUE:(due.dueAt<window.endAt?DUE_STATE.DUE_IN_WINDOW:DUE_STATE.FUTURE);
    return Object.freeze({
      eligible:true,
      dueThisWindow:state===DUE_STATE.OVERDUE||state===DUE_STATE.DUE_IN_WINDOW,
      state:state,
      reason:null,
      dueAt:due.dueAt,
      dueSource:due.source,
      window:window
    });
  }

  window.CleaningPlannerContract=Object.freeze({
    version:VERSION,
    DAY_MS:DAY_MS,
    DUE_STATE:DUE_STATE,
    DUE_SOURCE:DUE_SOURCE,
    EXCLUSION_REASON:EXCLUSION_REASON,
    planningWindow:planningWindow,
    evaluateRoutineDue:evaluateRoutineDue
  });
})();
