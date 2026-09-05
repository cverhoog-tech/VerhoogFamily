'use strict';
// ============================================================
// CLEANING AVAILABILITY CONTRACT v0.1.0
// Pure planning semantics for temporary member availability and a household
// busy-week mode. No Firebase, DOM, repository or global mutable state reads.
//
// Canonical persistence lives under cleaning/availability:
// - availability/{uid}: personal temporary unavailability
// - availability/__household__: temporary household planning mode
//
// Vacation / planning-pause cadence is intentionally NOT implemented here:
// those actions reuse the existing room/routine pause semantics so countdowns
// freeze and no missed-occurrence backlog is invented.
// ============================================================
(function(){
  if(window.CleaningAvailabilityContract)return;

  var VERSION='0.1.0';
  var HOUSEHOLD_KEY='__household__';
  var MEMBER_STATUS=Object.freeze({AVAILABLE:'AVAILABLE',UNAVAILABLE:'UNAVAILABLE'});
  var HOUSEHOLD_MODE=Object.freeze({NORMAL:'NORMAL',BUSY_WEEK:'BUSY_WEEK',VACATION:'VACATION',PLANNING_PAUSE:'PLANNING_PAUSE'});
  var REASON=Object.freeze({SICK:'SICK',TEMPORARY:'TEMPORARY',VACATION:'VACATION',OTHER:'OTHER'});

  function clone(value){if(value===undefined)return undefined;try{return JSON.parse(JSON.stringify(value));}catch(e){return value;}}
  function freeze(value){if(!value||typeof value!=='object'||Object.isFrozen(value))return value;Object.keys(value).forEach(function(key){freeze(value[key]);});return Object.freeze(value);}
  function text(value){return String(value==null?'':value).trim();}
  function positive(value){var n=Number(value);return Number.isFinite(n)&&n>0?n:null;}
  function windowValue(input){
    var row=input||{},startAt=positive(row.startAt||row.windowStartAt),endAt=positive(row.endAt||row.windowEndAt);
    if(!startAt||!endAt||endAt<=startAt)throw new Error('CLEANING_AVAILABILITY_WINDOW_INVALID');
    return{startAt:startAt,endAt:endAt};
  }
  function rows(value){return value&&typeof value==='object'?value:{};}
  function overlaps(startAt,endAt,window){
    var start=positive(startAt)||0,end=positive(endAt)||Number.MAX_SAFE_INTEGER;
    return start<window.endAt&&end>window.startAt;
  }
  function normalizeMemberRow(row,uid){
    var source=row&&typeof row==='object'?row:{},status=text(source.status).toUpperCase();
    if(status!==MEMBER_STATUS.UNAVAILABLE)status=MEMBER_STATUS.AVAILABLE;
    var reason=text(source.reason).toUpperCase();
    if(!Object.prototype.hasOwnProperty.call(REASON,reason))reason=reason||null;
    return freeze({
      scope:'MEMBER',uid:text(uid||source.uid),status:status,reason:reason,
      fromAt:positive(source.fromAt),untilAt:positive(source.untilAt),
      pausedRoutineIds:freeze((Array.isArray(source.pausedRoutineIds)?source.pausedRoutineIds:[]).map(text).filter(Boolean)),
      updatedAt:positive(source.updatedAt),updatedByUid:text(source.updatedByUid)||null
    });
  }
  function normalizeHouseholdRow(row){
    var source=row&&typeof row==='object'?row:{},mode=text(source.mode).toUpperCase();
    if(!Object.prototype.hasOwnProperty.call(HOUSEHOLD_MODE,mode))mode=HOUSEHOLD_MODE.NORMAL;
    return freeze({
      scope:'HOUSEHOLD',mode:mode,fromAt:positive(source.fromAt),untilAt:positive(source.untilAt),
      pausedRoomIds:freeze((Array.isArray(source.pausedRoomIds)?source.pausedRoomIds:[]).map(text).filter(Boolean)),
      updatedAt:positive(source.updatedAt),updatedByUid:text(source.updatedByUid)||null
    });
  }
  function memberUnavailableForWindow(availability,uid,inputWindow){
    uid=text(uid);if(!uid)return false;
    var window=windowValue(inputWindow),row=normalizeMemberRow(rows(availability)[uid],uid);
    if(row.status!==MEMBER_STATUS.UNAVAILABLE)return false;
    return overlaps(row.fromAt,row.untilAt,window);
  }
  function householdModeForWindow(availability,inputWindow){
    var window=windowValue(inputWindow),row=normalizeHouseholdRow(rows(availability)[HOUSEHOLD_KEY]);
    if(row.mode===HOUSEHOLD_MODE.NORMAL)return HOUSEHOLD_MODE.NORMAL;
    return overlaps(row.fromAt,row.untilAt,window)?row.mode:HOUSEHOLD_MODE.NORMAL;
  }
  function preparePlanningInput(input){
    var source=input||{},window=windowValue(source.window),availability=rows(source.availability),excluded=[];
    var members=(Array.isArray(source.members)?source.members:[]).filter(function(member){
      var uid=text(member&&(member.uid||member.id));
      if(!uid)return true;
      if(memberUnavailableForWindow(availability,uid,window)){excluded.push(uid);return false;}
      return true;
    }).map(clone);
    var mode=householdModeForWindow(availability,window),deferred=[];
    var routines={};
    var inputRoutines=source.routines&&typeof source.routines==='object'?source.routines:{};
    Object.keys(inputRoutines).forEach(function(id){
      var row=clone(inputRoutines[id]||{});
      if(mode===HOUSEHOLD_MODE.BUSY_WEEK&&text(row.priority).toUpperCase()==='EXTRA'&&row.active!==false){
        row.active=false;row.availabilityDeferredReason='BUSY_WEEK';deferred.push(id);
      }
      routines[id]=row;
    });
    return freeze({
      window:window,members:members,routines:routines,
      excludedMemberUids:excluded,deferredRoutineIds:deferred,householdMode:mode
    });
  }

  window.CleaningAvailabilityContract=Object.freeze({
    version:VERSION,HOUSEHOLD_KEY:HOUSEHOLD_KEY,MEMBER_STATUS:MEMBER_STATUS,
    HOUSEHOLD_MODE:HOUSEHOLD_MODE,REASON:REASON,
    normalizeMemberRow:normalizeMemberRow,normalizeHouseholdRow:normalizeHouseholdRow,
    memberUnavailableForWindow:memberUnavailableForWindow,householdModeForWindow:householdModeForWindow,
    preparePlanningInput:preparePlanningInput
  });
})();
