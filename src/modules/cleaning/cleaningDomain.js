'use strict';
// ============================================================
// CLEANING DOMAIN CONTRACT v0.2.0
// Pure domain contract only: no Firebase, no localStorage, no DOM writes.
// Source of truth for one concrete clean remains CleaningOccurrence.
// Routine -> room relationship is canonical through routine.roomId only.
// ============================================================
(function(){
  if(window.CleaningDomain)return;

  var VERSION='0.2.0';

  var PRIORITY=Object.freeze({
    BASIC:'BASIC',
    NORMAL:'NORMAL',
    EXTRA:'EXTRA'
  });

  var INVENTORY_STATUS=Object.freeze({
    IN_STOCK:'IN_STOCK',
    LOW:'LOW',
    OUT:'OUT'
  });

  var PLAN_STATUS=Object.freeze({
    DRAFT:'DRAFT',
    PROPOSED:'PROPOSED',
    PARTIALLY_ACCEPTED:'PARTIALLY_ACCEPTED',
    ACTIVE:'ACTIVE',
    COMPLETED:'COMPLETED',
    EXPIRED:'EXPIRED'
  });

  var ASSIGNMENT_STATUS=Object.freeze({
    PROPOSED:'PROPOSED',
    ACCEPTED:'ACCEPTED',
    ACTIVE:'ACTIVE',
    COMPLETED:'COMPLETED',
    DECLINED:'DECLINED',
    COUNTER_PROPOSED:'COUNTER_PROPOSED',
    SKIPPED:'SKIPPED',
    CARRIED_FORWARD:'CARRIED_FORWARD',
    RESCHEDULED:'RESCHEDULED'
  });

  var OCCURRENCE_STATUS=Object.freeze({
    DRAFT:'DRAFT',
    PROPOSED:'PROPOSED',
    SCHEDULED:'SCHEDULED',
    FLEXIBLE:'FLEXIBLE',
    IN_PROGRESS:'IN_PROGRESS',
    COMPLETED:'COMPLETED',
    SKIPPED:'SKIPPED',
    CARRIED_FORWARD:'CARRIED_FORWARD',
    CANCELLED:'CANCELLED'
  });

  var DISPLAY_MODE=Object.freeze({
    TIME:'TIME',
    COUNT:'COUNT',
    BOTH:'BOTH'
  });

  var DISTRIBUTION_MODE=Object.freeze({
    FAIR_TIME:'FAIR_TIME',
    ROUND_ROBIN:'ROUND_ROBIN',
    FIXED_PERSON:'FIXED_PERSON',
    MANUAL:'MANUAL'
  });

  function clone(value){
    if(value===undefined)return undefined;
    try{return JSON.parse(JSON.stringify(value));}catch(e){return value;}
  }

  function safeId(value,fallback){
    var raw=String(value===undefined||value===null||value===''?(fallback||''):value);
    return raw.replace(/[.#$\[\]\/]/g,'_');
  }

  function basePath(householdId){
    var id=safeId(householdId);
    return id?'families/'+id+'/cleaning':null;
  }

  function paths(householdId){
    var base=basePath(householdId);
    if(!base)return null;
    return Object.freeze({
      root:base,
      rooms:base+'/rooms',
      routines:base+'/routines',
      supplies:base+'/supplies',
      inventory:base+'/inventory',
      plans:base+'/plans',
      occurrences:base+'/occurrences',
      approvals:base+'/approvals',
      completionLogs:base+'/completionLogs',
      availability:base+'/availability',
      preferences:base+'/preferences'
    });
  }

  function normalizeRoom(input,id){
    var row=clone(input||{})||{};
    row.id=safeId(row.id||id);
    row.name=String(row.name||'').trim();
    row.type=String(row.type||'custom').trim()||'custom';
    row.active=row.active!==false;
    // Do not persist a second authoritative room -> routine relation.
    // Routine membership is derived exclusively from CleaningRoutineItem.roomId.
    delete row.routineIds;
    row.distributionMode=DISTRIBUTION_MODE[row.distributionMode]?row.distributionMode:DISTRIBUTION_MODE.FAIR_TIME;
    row.preferredWindow=row.preferredWindow||null;
    row.schemaVersion=1;
    return row;
  }

  function normalizeRoutineItem(input,id){
    var row=clone(input||{})||{};
    row.id=safeId(row.id||id);
    row.roomId=safeId(row.roomId);
    row.title=String(row.title||'').trim();
    row.intervalDays=Math.max(1,parseInt(row.intervalDays,10)||7);
    row.estimatedMinutes=Math.max(1,parseInt(row.estimatedMinutes,10)||10);
    row.priority=PRIORITY[row.priority]?row.priority:PRIORITY.NORMAL;
    row.supplyIds=Array.isArray(row.supplyIds)?row.supplyIds.map(function(v){return safeId(v);}).filter(Boolean):[];
    row.lastCompletedAt=Number(row.lastCompletedAt)||null;
    row.nextDueAt=Number(row.nextDueAt)||null;
    row.active=row.active!==false;
    row.paused=row.paused===true;
    row.schemaVersion=1;
    return row;
  }

  function normalizeOccurrence(input,id){
    var row=clone(input||{})||{};
    row.id=safeId(row.id||id);
    row.roomId=safeId(row.roomId);
    row.planId=safeId(row.planId);
    row.routineItemIds=Array.isArray(row.routineItemIds)?row.routineItemIds.map(function(v){return safeId(v);}).filter(Boolean):[];
    row.checklist=Array.isArray(row.checklist)?row.checklist.map(function(item,index){
      var entry=clone(item||{})||{};
      entry.id=safeId(entry.id,'item_'+index);
      entry.routineItemId=safeId(entry.routineItemId);
      entry.title=String(entry.title||'').trim();
      entry.completed=entry.completed===true;
      return entry;
    }):[];
    row.assignmentUids=Array.isArray(row.assignmentUids)?row.assignmentUids.map(String).filter(Boolean):[];
    row.assignmentStatus=ASSIGNMENT_STATUS[row.assignmentStatus]?row.assignmentStatus:ASSIGNMENT_STATUS.PROPOSED;
    row.status=OCCURRENCE_STATUS[row.status]?row.status:OCCURRENCE_STATUS.DRAFT;
    row.scheduledStartAt=Number(row.scheduledStartAt)||null;
    row.scheduledEndAt=Number(row.scheduledEndAt)||null;
    row.flexibleWindow=row.flexibleWindow||null;
    row.estimatedMinutes=Math.max(0,parseInt(row.estimatedMinutes,10)||0);
    row.projections=row.projections&&typeof row.projections==='object'?clone(row.projections):{};
    row.projections.taskId=row.projections.taskId?safeId(row.projections.taskId):null;
    row.projections.calendarEventId=row.projections.calendarEventId?safeId(row.projections.calendarEventId):null;
    row.createdAt=Number(row.createdAt)||null;
    row.createdByUid=row.createdByUid?String(row.createdByUid):null;
    row.updatedAt=Number(row.updatedAt)||null;
    row.updatedByUid=row.updatedByUid?String(row.updatedByUid):null;
    row.schemaVersion=1;
    return row;
  }

  function normalizeUserPreferences(input){
    var row=clone(input||{})||{};
    row.displayMode=DISPLAY_MODE[row.displayMode]?row.displayMode:DISPLAY_MODE.BOTH;
    row.schemaVersion=1;
    return row;
  }

  window.CleaningDomain=Object.freeze({
    version:VERSION,
    PRIORITY:PRIORITY,
    INVENTORY_STATUS:INVENTORY_STATUS,
    PLAN_STATUS:PLAN_STATUS,
    ASSIGNMENT_STATUS:ASSIGNMENT_STATUS,
    OCCURRENCE_STATUS:OCCURRENCE_STATUS,
    DISPLAY_MODE:DISPLAY_MODE,
    DISTRIBUTION_MODE:DISTRIBUTION_MODE,
    safeId:safeId,
    basePath:basePath,
    paths:paths,
    normalizeRoom:normalizeRoom,
    normalizeRoutineItem:normalizeRoutineItem,
    normalizeOccurrence:normalizeOccurrence,
    normalizeUserPreferences:normalizeUserPreferences
  });
})();
