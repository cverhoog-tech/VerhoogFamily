'use strict';
// ============================================================
// FAMILYAPP CLEANING DOMAIN v0.3.0
// Contract-first Cleaning models + pure invariants + path helpers.
// Household path keys are validated, never rewritten, so an invalid context
// can never be silently redirected to another Firebase household key.
// ============================================================
(function(){
  if(window.CleaningDomain)return;

  var VERSION='0.3.0';
  var PRIORITIES=Object.freeze(['BASIC','NORMAL','EXTRA']);
  var ASSIGNMENT_MODES=Object.freeze(['FAIR_TIME','FIXED_PERSON']);
  var PLAN_STATUSES=Object.freeze(['DRAFT','ACTIVE','COMPLETED','CANCELLED']);
  var OCCURRENCE_STATUSES=Object.freeze(['FLEXIBLE','SCHEDULED','COMPLETED','SKIPPED','CANCELLED']);
  var ASSIGNMENT_STATUSES=Object.freeze(['PROPOSED','ACTIVE','COMPLETED','SKIPPED']);
  var INVENTORY_STATUSES=Object.freeze(['IN_STOCK','LOW','OUT']);
  var FIREBASE_KEY_INVALID=/[.#$\[\]\/\u0000-\u001F\u007F]/;

  function clone(value){
    if(value===undefined)return undefined;
    try{return JSON.parse(JSON.stringify(value));}catch(error){return value;}
  }
  function freeze(value){
    if(!value||typeof value!=='object'||Object.isFrozen(value))return value;
    Object.keys(value).forEach(function(key){freeze(value[key]);});
    return Object.freeze(value);
  }
  function now(){return Date.now();}
  function safeId(value){
    return String(value==null?'':value).trim().replace(/[.#$\[\]\/]/g,'_');
  }
  function firebaseKey(value){
    if(value==null)return'';
    var raw=String(value);
    if(!raw||raw!==raw.trim()||FIREBASE_KEY_INVALID.test(raw))return'';
    return raw;
  }
  function text(value){return String(value==null?'':value).trim();}
  function positiveNumber(value,fallback){
    var number=Number(value);
    return Number.isFinite(number)&&number>0?number:fallback;
  }
  function nonNegativeNumber(value,fallback){
    var number=Number(value);
    return Number.isFinite(number)&&number>=0?number:fallback;
  }
  function enumValue(value,allowed,fallback){
    var candidate=text(value).toUpperCase();
    return allowed.indexOf(candidate)>=0?candidate:fallback;
  }
  function uniqueIds(values){
    var seen={};var result=[];
    (Array.isArray(values)?values:[]).forEach(function(value){
      var id=text(value);if(!id||seen[id])return;seen[id]=true;result.push(id);
    });
    return result;
  }
  function normalizeTimestamp(value,fallback){
    var number=Number(value);
    return Number.isFinite(number)&&number>0?number:fallback;
  }
  function metadata(input,ctx){
    input=input||{};ctx=ctx||{};
    var timestamp=normalizeTimestamp(ctx.timestamp,now());
    var actor=text(ctx.uid||input.updatedByUid||input.createdByUid)||null;
    return{
      createdAt:normalizeTimestamp(input.createdAt,timestamp),
      createdByUid:text(input.createdByUid)||actor,
      updatedAt:timestamp,
      updatedByUid:actor
    };
  }

  function cleaningRoom(input,ctx){
    input=input||{};ctx=ctx||{};
    var id=safeId(input.id);if(!id)throw new Error('CLEANING_ROOM_ID_REQUIRED');
    var meta=metadata(input,ctx);
    return freeze({
      id:id,
      householdId:text(ctx.householdId||input.householdId),
      name:text(input.name)||'Ruimte',
      type:text(input.type)||'custom',
      active:input.active!==false,
      assignmentMode:enumValue(input.assignmentMode,ASSIGNMENT_MODES,'FAIR_TIME'),
      fixedAssigneeUid:text(input.fixedAssigneeUid)||null,
      sortOrder:nonNegativeNumber(input.sortOrder,0),
      createdAt:meta.createdAt,createdByUid:meta.createdByUid,updatedAt:meta.updatedAt,updatedByUid:meta.updatedByUid,
      schemaVersion:2
    });
  }

  function cleaningRoutineItem(input,ctx){
    input=input||{};ctx=ctx||{};
    var id=safeId(input.id);if(!id)throw new Error('CLEANING_ROUTINE_ID_REQUIRED');
    var roomId=safeId(input.roomId);if(!roomId)throw new Error('CLEANING_ROUTINE_ROOM_REQUIRED');
    var meta=metadata(input,ctx);
    var assignmentMode=enumValue(input.assignmentMode,ASSIGNMENT_MODES,'FAIR_TIME');
    return freeze({
      id:id,
      householdId:text(ctx.householdId||input.householdId),
      roomId:roomId,
      title:text(input.title)||'Schoonmaakroutine',
      intervalDays:Math.max(1,Math.round(positiveNumber(input.intervalDays,7))),
      estimatedMinutes:Math.max(1,Math.round(positiveNumber(input.estimatedMinutes,15))),
      priority:enumValue(input.priority,PRIORITIES,'NORMAL'),
      active:input.active!==false,
      paused:input.paused===true,
      pausedUntil:normalizeTimestamp(input.pausedUntil,null),
      nextDueAt:normalizeTimestamp(input.nextDueAt,null),
      lastCompletedAt:normalizeTimestamp(input.lastCompletedAt,null),
      assignmentMode:assignmentMode,
      preferredAssigneeUid:assignmentMode==='FIXED_PERSON'?(text(input.preferredAssigneeUid)||null):null,
      supplyIds:uniqueIds(input.supplyIds),
      createdAt:meta.createdAt,createdByUid:meta.createdByUid,updatedAt:meta.updatedAt,updatedByUid:meta.updatedByUid,
      schemaVersion:2
    });
  }

  function cleaningPlan(input,ctx){
    input=input||{};ctx=ctx||{};
    var id=safeId(input.id);if(!id)throw new Error('CLEANING_PLAN_ID_REQUIRED');
    var meta=metadata(input,ctx);
    var start=normalizeTimestamp(input.windowStartAt,null);
    var end=normalizeTimestamp(input.windowEndAt,null);
    if(start&&end&&end<=start)throw new Error('CLEANING_PLAN_WINDOW_INVALID');
    return freeze({
      id:id,
      householdId:text(ctx.householdId||input.householdId),
      status:enumValue(input.status,PLAN_STATUSES,'DRAFT'),
      windowStartAt:start,
      windowEndAt:end,
      occurrenceIds:uniqueIds(input.occurrenceIds),
      approvedAt:normalizeTimestamp(input.approvedAt,null),
      approvedByUid:text(input.approvedByUid)||null,
      createdAt:meta.createdAt,createdByUid:meta.createdByUid,updatedAt:meta.updatedAt,updatedByUid:meta.updatedByUid,
      schemaVersion:2
    });
  }

  function cleaningOccurrence(input,ctx){
    input=input||{};ctx=ctx||{};
    var id=safeId(input.id);if(!id)throw new Error('CLEANING_OCCURRENCE_ID_REQUIRED');
    var meta=metadata(input,ctx);
    var status=enumValue(input.status,OCCURRENCE_STATUSES,'FLEXIBLE');
    var assignmentStatus=enumValue(input.assignmentStatus,ASSIGNMENT_STATUSES,status==='COMPLETED'?'COMPLETED':'PROPOSED');
    return freeze({
      id:id,
      householdId:text(ctx.householdId||input.householdId),
      planId:safeId(input.planId)||null,
      roomId:safeId(input.roomId),
      routineItemIds:uniqueIds(input.routineItemIds),
      assignmentUids:uniqueIds(input.assignmentUids),
      assignmentStatus:assignmentStatus,
      status:status,
      estimatedMinutes:Math.max(0,Math.round(nonNegativeNumber(input.estimatedMinutes,0))),
      scheduledStartAt:normalizeTimestamp(input.scheduledStartAt,null),
      scheduledEndAt:normalizeTimestamp(input.scheduledEndAt,null),
      flexibleWindow:input.flexibleWindow?freeze(clone(input.flexibleWindow)):null,
      projections:freeze(Object.assign({taskId:null,calendarEventId:null},clone(input.projections||{}))),
      createdAt:meta.createdAt,createdByUid:meta.createdByUid,updatedAt:meta.updatedAt,updatedByUid:meta.updatedByUid,
      schemaVersion:2
    });
  }

  function cleaningCompletionLog(input,ctx){
    input=input||{};ctx=ctx||{};
    var id=safeId(input.id);if(!id)throw new Error('CLEANING_LOG_ID_REQUIRED');
    var meta=metadata(input,ctx);
    return freeze({
      id:id,
      householdId:text(ctx.householdId||input.householdId),
      occurrenceId:safeId(input.occurrenceId),
      planId:safeId(input.planId)||null,
      roomId:safeId(input.roomId),
      routineItemIds:uniqueIds(input.routineItemIds),
      completedByUid:text(input.completedByUid||ctx.uid)||null,
      completedAt:normalizeTimestamp(input.completedAt,meta.updatedAt),
      estimatedMinutes:Math.max(0,Math.round(nonNegativeNumber(input.estimatedMinutes,0))),
      actualMinutes:Math.max(0,Math.round(nonNegativeNumber(input.actualMinutes,input.estimatedMinutes||0))),
      source:text(input.source)||'cleaning',
      createdAt:meta.createdAt,createdByUid:meta.createdByUid,updatedAt:meta.updatedAt,updatedByUid:meta.updatedByUid,
      schemaVersion:2
    });
  }

  function cleaningSupply(input,ctx){
    input=input||{};ctx=ctx||{};
    var id=safeId(input.id);if(!id)throw new Error('CLEANING_SUPPLY_ID_REQUIRED');
    var meta=metadata(input,ctx);
    return freeze({
      id:id,
      householdId:text(ctx.householdId||input.householdId),
      name:text(input.name)||'Benodigd item',
      category:text(input.category)||null,
      active:input.active!==false,
      createdAt:meta.createdAt,createdByUid:meta.createdByUid,updatedAt:meta.updatedAt,updatedByUid:meta.updatedByUid,
      schemaVersion:2
    });
  }

  function cleaningInventoryItem(input,ctx){
    input=input||{};ctx=ctx||{};
    var supplyId=safeId(input.supplyId||input.id);if(!supplyId)throw new Error('CLEANING_INVENTORY_SUPPLY_REQUIRED');
    var meta=metadata(input,ctx);
    return freeze({
      id:supplyId,
      supplyId:supplyId,
      householdId:text(ctx.householdId||input.householdId),
      status:enumValue(input.status,INVENTORY_STATUSES,'IN_STOCK'),
      note:text(input.note)||null,
      createdAt:meta.createdAt,createdByUid:meta.createdByUid,updatedAt:meta.updatedAt,updatedByUid:meta.updatedByUid,
      schemaVersion:2
    });
  }

  function recurrenceAdvance(previousAt,intervalDays,completedAt){
    var interval=Math.max(1,Math.round(positiveNumber(intervalDays,7)))*24*60*60*1000;
    var base=normalizeTimestamp(previousAt,normalizeTimestamp(completedAt,now()));
    var floor=normalizeTimestamp(completedAt,base);
    var next=base;
    do{next+=interval;}while(next<=floor);
    return next;
  }

  function basePath(householdId){
    var key=firebaseKey(householdId);
    return key?'families/'+key+'/cleaning':null;
  }
  function pathFor(householdId,collection,id){
    var base=basePath(householdId);if(!base)return null;
    var cleanCollection=safeId(collection);if(!cleanCollection)return null;
    var cleanId=id==null?'':safeId(id);
    return cleanId?base+'/'+cleanCollection+'/'+cleanId:base+'/'+cleanCollection;
  }

  window.CleaningDomain=Object.freeze({
    version:VERSION,
    enums:Object.freeze({PRIORITIES:PRIORITIES,ASSIGNMENT_MODES:ASSIGNMENT_MODES,PLAN_STATUSES:PLAN_STATUSES,OCCURRENCE_STATUSES:OCCURRENCE_STATUSES,ASSIGNMENT_STATUSES:ASSIGNMENT_STATUSES,INVENTORY_STATUSES:INVENTORY_STATUSES}),
    safeId:safeId,
    firebaseKey:firebaseKey,
    basePath:basePath,
    pathFor:pathFor,
    CleaningRoom:cleaningRoom,
    CleaningRoutineItem:cleaningRoutineItem,
    CleaningPlan:cleaningPlan,
    CleaningOccurrence:cleaningOccurrence,
    CleaningCompletionLog:cleaningCompletionLog,
    CleaningSupply:cleaningSupply,
    CleaningInventoryItem:cleaningInventoryItem,
    recurrenceAdvance:recurrenceAdvance,
    clone:clone
  });
})();
