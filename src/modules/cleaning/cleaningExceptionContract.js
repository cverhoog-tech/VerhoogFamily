'use strict';
// ============================================================
// CLEANING EXCEPTION CONTRACT v0.1.1
// Pure canonical transitions for a Cleaning task that cannot be fully finished.
// No Firebase, repositories or DOM. CleaningOccurrence remains source of truth.
// ============================================================
(function(){
  if(window.CleaningExceptionContract)return;

  var VERSION='0.1.1';
  var DAY_MS=86400000;
  var INVALID_KEY=/[.#$\[\]\/\u0000-\u001F\u007F]/g;

  function clone(value){if(value===undefined)return undefined;try{return JSON.parse(JSON.stringify(value));}catch(error){return value;}}
  function text(value){return String(value==null?'':value).trim();}
  function safe(value){return text(value).replace(INVALID_KEY,'_');}
  function unique(values){var seen={},out=[];(Array.isArray(values)?values:[]).forEach(function(value){var id=text(value);if(id&&!seen[id]){seen[id]=true;out.push(id);}});return out;}
  function isIsoDate(value){return /^\d{4}-\d{2}-\d{2}$/.test(text(value));}
  function isTime(value){return value===''||/^([01]\d|2[0-3]):[0-5]\d$/.test(text(value));}
  function localParts(dateValue,timeValue){
    var date=text(dateValue),time=text(timeValue);if(!isIsoDate(date))throw new Error('CLEANING_EXCEPTION_DATE_INVALID');if(!isTime(time))throw new Error('CLEANING_EXCEPTION_TIME_INVALID');
    var dp=date.split('-').map(Number),tp=time?time.split(':').map(Number):[0,0],value=new Date(dp[0],dp[1]-1,dp[2],tp[0],tp[1],0,0),day=new Date(dp[0],dp[1]-1,dp[2],0,0,0,0),nextDay=new Date(dp[0],dp[1]-1,dp[2]+1,0,0,0,0);
    if(value.getFullYear()!==dp[0]||value.getMonth()!==dp[1]-1||value.getDate()!==dp[2])throw new Error('CLEANING_EXCEPTION_DATE_INVALID');
    return{date:date,time:time,startAt:value.getTime(),dayStartAt:day.getTime(),dayEndAt:nextDay.getTime()};
  }
  function ensureRoot(value){var root=value&&typeof value==='object'?clone(value):{};['rooms','routines','plans','occurrences','completionLogs'].forEach(function(key){if(!root[key]||typeof root[key]!=='object')root[key]={};});return root;}
  function unfinishedItems(row){return (Array.isArray(row&&row.checklist)?row.checklist:[]).filter(function(item){return !item||item.completed!==true;});}
  function finishedItems(row){return (Array.isArray(row&&row.checklist)?row.checklist:[]).filter(function(item){return item&&item.completed===true;});}
  function occurrence(root,id,householdId){var row=root.occurrences[id];if(!row||typeof row!=='object')throw new Error('CLEANING_EXCEPTION_OCCURRENCE_NOT_FOUND');if(row.householdId&&text(row.householdId)!==text(householdId))throw new Error('CLEANING_EXCEPTION_HOUSEHOLD_CONFLICT');return row;}
  function planFor(root,row){var plan=root.plans[text(row&&row.planId)];if(!plan||typeof plan!=='object')throw new Error('CLEANING_EXCEPTION_PLAN_NOT_FOUND');return plan;}
  function logId(id,timestamp,outcome){return 'exception_'+safe(id)+'_'+text(outcome).toLowerCase()+'_'+Math.floor(timestamp);}
  function routineId(item){return text(item&&(item.routineItemId||item.sourceRoutineItemId||item.id));}
  function startOfLocalDay(value){var d=new Date(Number(value)||Date.now());d.setHours(0,0,0,0);return d.getTime();}

  function nextCycleAfter(dueAt,interval,timestamp){
    var next=Number(dueAt)||Number(timestamp)||Date.now(),step=Math.max(DAY_MS,Number(interval)||DAY_MS),today=startOfLocalDay(timestamp);
    next+=step;
    // A deeply overdue routine must never create a stack of historical work
    // after an explicit carry/skip choice. Preserve cadence but jump forward.
    var guard=0;while(next<today&&guard<400){next+=step;guard++;}
    return next<today?today:next;
  }

  function advanceRemainingRoutines(root,row,remaining,timestamp,actorUid,outcome){
    remaining.forEach(function(item){
      var id=routineId(item),routine=root.routines[id];if(!id||!routine||routine.active===false)return;
      var dueAt=Number(item&&item.dueAt)||Number(row.earliestDueAt)||timestamp,interval=Math.max(1,parseInt(routine.intervalDays,10)||7)*DAY_MS,next=nextCycleAfter(dueAt,interval,timestamp);
      if(!Number(routine.nextDueAt)||Number(routine.nextDueAt)<next)routine.nextDueAt=next;
      routine.lastExceptionAt=timestamp;routine.lastExceptionOutcome=outcome;routine.updatedAt=timestamp;routine.updatedByUid=actorUid;
    });
  }

  function finalize(root,id,row,householdId,actorUid,timestamp,outcome){
    var remaining=unfinishedItems(row),finished=finishedItems(row);if(!remaining.length)throw new Error('CLEANING_EXCEPTION_NOTHING_REMAINING');
    var lid=logId(id,timestamp,outcome);
    root.completionLogs[lid]={
      id:lid,householdId:householdId,occurrenceId:id,planId:row.planId||null,roomId:row.roomId||null,
      assignmentUids:Array.isArray(row.assignmentUids)?row.assignmentUids.slice():[],checklist:clone(row.checklist||[]),
      completedRoutineItemIds:finished.map(routineId).filter(Boolean),remainingRoutineItemIds:remaining.map(routineId).filter(Boolean),
      estimatedMinutes:Number(row.estimatedMinutes)||0,status:finished.length?'PARTIAL':'SKIPPED',outcome:outcome,source:'TASK_EXCEPTION',
      finalizedAt:timestamp,finalizedByUid:actorUid,createdAt:timestamp,createdByUid:actorUid,schemaVersion:1
    };
    advanceRemainingRoutines(root,row,remaining,timestamp,actorUid,outcome);
    row.status='SKIPPED';row.assignmentStatus='SKIPPED';row.skippedAt=timestamp;row.skippedByUid=actorUid;row.skipReason=outcome;row.exceptionOutcome=outcome;row.exceptionLogId=lid;row.updatedAt=timestamp;row.updatedByUid=actorUid;row.lastExecutionSource='TASK_EXCEPTION';
    if(outcome==='CARRY_FORWARD'){row.carriedForwardAt=timestamp;row.carriedForwardByUid=actorUid;}
    return lid;
  }

  function reschedule(root,id,row,householdId,actorUid,timestamp,options){
    var plan=planFor(root,row),parts=localParts(options&&options.date,options&&options.time||'');
    if(parts.dayStartAt<Number(plan.windowStartAt)||parts.dayStartAt>=Number(plan.windowEndAt))throw new Error('CLEANING_EXCEPTION_DATE_OUTSIDE_PLAN');
    if(!unfinishedItems(row).length)throw new Error('CLEANING_EXCEPTION_NOTHING_REMAINING');
    row.scheduledDate=parts.date;row.scheduledTime=parts.time;row.scheduledStartAt=parts.time?parts.startAt:null;row.scheduledEndAt=parts.time?parts.startAt+(Math.max(0,Number(row.estimatedMinutes)||0)*60000):null;row.scheduledWindow={startAt:parts.dayStartAt,endAt:parts.dayEndAt};
    row.status=parts.time?'SCHEDULED':'FLEXIBLE';row.assignmentStatus='ACTIVE';row.rescheduledAt=timestamp;row.rescheduledByUid=actorUid;row.exceptionOutcome='RESCHEDULED';row.updatedAt=timestamp;row.updatedByUid=actorUid;row.lastExecutionSource='TASK_EXCEPTION';
    return parts;
  }

  function apply(input){
    var source=input||{},root=ensureRoot(source.cleaning),ids=unique(source.occurrenceIds),householdId=text(source.householdId),actorUid=text(source.actorUid),timestamp=Number(source.timestamp)||Date.now(),action=text(source.action).toUpperCase(),options=source.options||{};
    if(!householdId||!actorUid)throw new Error('CLEANING_EXCEPTION_CONTEXT_REQUIRED');if(!ids.length)throw new Error('CLEANING_EXCEPTION_OCCURRENCE_REQUIRED');if(['RESCHEDULE','CARRY_FORWARD','SKIP'].indexOf(action)<0)throw new Error('CLEANING_EXCEPTION_ACTION_INVALID');
    var planIds=[],logIds=[],schedule=null,handled=[];
    ids.forEach(function(id){var row=occurrence(root,id,householdId),status=text(row.status).toUpperCase(),assignment=text(row.assignmentStatus).toUpperCase();if(status==='COMPLETED'||assignment==='COMPLETED'||status==='CANCELLED'||status==='SKIPPED')return;if(planIds.indexOf(text(row.planId))<0)planIds.push(text(row.planId));if(action==='RESCHEDULE')schedule=reschedule(root,id,row,householdId,actorUid,timestamp,options);else logIds.push(finalize(root,id,row,householdId,actorUid,timestamp,action==='CARRY_FORWARD'?'CARRY_FORWARD':'SKIP'));handled.push(id);});
    if(!handled.length)throw new Error('CLEANING_EXCEPTION_NO_ACTIVE_OCCURRENCES');
    return{cleaning:root,action:action,occurrenceIds:handled,planIds:planIds.filter(Boolean),logIds:logIds,schedule:schedule};
  }

  function userMessage(error){var code=text(error&&error.message||error);if(code.indexOf('DATE_OUTSIDE_PLAN')>=0)return'Kies een dag binnen deze schoonmaakweek.';if(code.indexOf('DATE_INVALID')>=0)return'Kies een geldige datum.';if(code.indexOf('TIME_INVALID')>=0)return'Kies een geldige tijd.';if(code.indexOf('NOTHING_REMAINING')>=0)return'Alle schoonmaakstappen zijn al afgerond.';if(code.indexOf('CONTEXT')>=0||code.indexOf('HOUSEHOLD')>=0)return'Het actieve huishouden veranderde. Probeer opnieuw.';return code||'Deze schoonmaakactie kon niet worden opgeslagen.';}

  window.CleaningExceptionContract=Object.freeze({version:VERSION,apply:apply,userMessage:userMessage,_localParts:localParts,_unfinishedItems:unfinishedItems,_logId:logId,_nextCycleAfter:nextCycleAfter});
})();