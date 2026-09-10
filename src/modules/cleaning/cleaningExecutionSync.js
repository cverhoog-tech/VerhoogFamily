'use strict';
// ============================================================
// CLEANING EXECUTION SYNC CONTRACT v0.2.0
// Pure translation contract. It contains no Firebase references, listeners,
// repository wrappers or DOM writes. CleaningExecutionWriteRuntime owns the
// rule-authorized runtime boundary around these deterministic transitions.
// ============================================================
(function(){
  if(window.CleaningExecutionSync&&window.CleaningExecutionSync.version==='0.2.0')return;

  var VERSION='0.2.0';
  var INVALID_KEY=/[.#$\[\]\/\u0000-\u001F\u007F]/g;
  var DAY_MS=86400000;

  function clone(value){if(value===undefined)return undefined;try{return JSON.parse(JSON.stringify(value));}catch(error){return value;}}
  function text(value){return String(value==null?'':value).trim();}
  function safeKey(value){return text(value).replace(INVALID_KEY,'_');}
  function isIsoDate(value){return /^\d{4}-\d{2}-\d{2}$/.test(text(value));}
  function isTime(value){return value===''||/^([01]\d|2[0-3]):[0-5]\d$/.test(text(value));}

  function recordOccurrenceIds(row){
    var ids=[];
    (Array.isArray(row&&row.cleaningOccurrenceIds)?row.cleaningOccurrenceIds:[]).forEach(function(value){var id=text(value);if(id&&ids.indexOf(id)<0)ids.push(id);});
    [row&&row.cleaningOccurrenceId,row&&row.sourceId].forEach(function(value){var id=text(value);if(id&&ids.indexOf(id)<0)ids.push(id);});
    return ids;
  }

  function isCleaningProjection(row){
    if(!row||typeof row!=='object')return false;
    if(row.projectionManaged===true&&recordOccurrenceIds(row).length)return true;
    return text(row.sourceType).indexOf('cleaning-occurrence')===0&&recordOccurrenceIds(row).length>0;
  }

  function findRecord(map,id){
    var source=map&&typeof map==='object'?map:{},wanted=text(id),keys=Object.keys(source);
    for(var i=0;i<keys.length;i++){
      var key=keys[i],row=source[key];
      if(!row||typeof row!=='object')continue;
      if(key===wanted||text(row.id)===wanted||text(row._key)===wanted)return{key:key,row:row};
    }
    return null;
  }

  function ensureFamily(input){
    var family=input&&typeof input==='object'?clone(input):{};
    if(!family.cleaning||typeof family.cleaning!=='object')family.cleaning={};
    if(!family.cleaning.occurrences||typeof family.cleaning.occurrences!=='object')family.cleaning.occurrences={};
    if(!family.cleaning.completionLogs||typeof family.cleaning.completionLogs!=='object')family.cleaning.completionLogs={};
    if(!family.tasks||typeof family.tasks!=='object')family.tasks={};
    if(!family.calendarEvents||typeof family.calendarEvents!=='object')family.calendarEvents={};
    return family;
  }

  function occurrenceRows(family,ids,householdId){
    var out=[];
    ids.forEach(function(id){
      var row=family.cleaning.occurrences[id];
      if(!row||typeof row!=='object')throw new Error('CLEANING_EXECUTION_OCCURRENCE_NOT_FOUND');
      if(row.householdId&&text(row.householdId)!==text(householdId))throw new Error('CLEANING_EXECUTION_HOUSEHOLD_CONFLICT');
      if(row.status==='CANCELLED'||row.status==='SKIPPED')throw new Error('CLEANING_EXECUTION_OCCURRENCE_INACTIVE');
      out.push({id:id,row:row});
    });
    return out;
  }

  function checklistIdentity(occurrenceId,item,index){
    var routineId=text(item&&(item.sourceRoutineItemId||item.routineItemId||item.id))||('item_'+index);
    return text(occurrenceId)+'|'+routineId;
  }

  function expectedChecklist(entries){
    var map={},order=[];
    entries.forEach(function(entry){
      (Array.isArray(entry.row.checklist)?entry.row.checklist:[]).forEach(function(item,index){
        var key=checklistIdentity(entry.id,item,index);
        if(map[key])throw new Error('CLEANING_EXECUTION_CHECKLIST_DUPLICATE');
        map[key]={entry:entry,item:item,index:index};order.push(key);
      });
    });
    return{map:map,order:order.sort()};
  }

  function suppliedChecklist(task,subtasks,entries){
    if(!Array.isArray(subtasks))throw new Error('CLEANING_EXECUTION_CHECKLIST_INVALID');
    var onlyOccurrence=entries.length===1?entries[0].id:null,map={},order=[];
    subtasks.forEach(function(item,index){
      var occurrenceId=text(item&&item.cleaningOccurrenceId)||onlyOccurrence;
      var key=checklistIdentity(occurrenceId,item,index);
      if(!occurrenceId||map[key])throw new Error('CLEANING_EXECUTION_CHECKLIST_STRUCTURE_LOCKED');
      map[key]=item;order.push(key);
    });
    return{map:map,order:order.sort()};
  }

  function arraysEqual(a,b){if(a.length!==b.length)return false;for(var i=0;i<a.length;i++)if(a[i]!==b[i])return false;return true;}

  function localDateParts(dateValue,timeValue){
    var date=text(dateValue),time=text(timeValue);
    if(!isIsoDate(date))throw new Error('CLEANING_EXECUTION_DATE_INVALID');
    if(!isTime(time))throw new Error('CLEANING_EXECUTION_TIME_INVALID');
    var dateParts=date.split('-').map(Number),timeParts=time?time.split(':').map(Number):[0,0];
    var value=new Date(dateParts[0],dateParts[1]-1,dateParts[2],timeParts[0],timeParts[1],0,0);
    if(value.getFullYear()!==dateParts[0]||value.getMonth()!==dateParts[1]-1||value.getDate()!==dateParts[2]||value.getHours()!==timeParts[0]||value.getMinutes()!==timeParts[1])throw new Error('CLEANING_EXECUTION_DATE_INVALID');
    var day=new Date(dateParts[0],dateParts[1]-1,dateParts[2],0,0,0,0);
    return{date:date,time:time,startAt:value.getTime(),dayStartAt:day.getTime(),dayEndAt:day.getTime()+DAY_MS};
  }

  function reopenStatus(row){return Number(row&&row.scheduledStartAt)>0?'SCHEDULED':'FLEXIBLE';}
  function completionLogId(occurrenceId,timestamp){return 'completion_'+safeKey(occurrenceId)+'_'+Math.floor(timestamp);}

  function updateOccurrenceCompletion(family,entry,actorUid,timestamp,source){
    var row=entry.row,checklist=Array.isArray(row.checklist)?row.checklist:[];
    var allDone=checklist.length>0&&checklist.every(function(item){return item&&item.completed===true;});
    var wasCompleted=row.status==='COMPLETED'||row.assignmentStatus==='COMPLETED';

    if(allDone&&!wasCompleted){
      var logId=completionLogId(entry.id,timestamp);
      row.status='COMPLETED';row.assignmentStatus='COMPLETED';row.completedAt=timestamp;row.completedByUid=actorUid;row.completionLogId=logId;
      family.cleaning.completionLogs[logId]={
        id:logId,householdId:row.householdId||null,occurrenceId:entry.id,planId:row.planId||null,roomId:row.roomId||null,
        assignmentUids:Array.isArray(row.assignmentUids)?row.assignmentUids.slice():[],checklist:clone(checklist),estimatedMinutes:Number(row.estimatedMinutes)||0,
        status:'COMPLETED',source:source||'TASK',completedAt:timestamp,completedByUid:actorUid,createdAt:timestamp,createdByUid:actorUid,schemaVersion:1
      };
      row.completionRevision=Math.max(0,Number(row.completionRevision)||0)+1;
    }else if(!allDone&&wasCompleted){
      var existingLogId=text(row.completionLogId);
      if(existingLogId&&family.cleaning.completionLogs[existingLogId]){
        family.cleaning.completionLogs[existingLogId].status='REOPENED';
        family.cleaning.completionLogs[existingLogId].reopenedAt=timestamp;
        family.cleaning.completionLogs[existingLogId].reopenedByUid=actorUid;
        family.cleaning.completionLogs[existingLogId].updatedAt=timestamp;
        family.cleaning.completionLogs[existingLogId].updatedByUid=actorUid;
      }
      row.status=reopenStatus(row);row.assignmentStatus='ACTIVE';row.reopenedAt=timestamp;row.reopenedByUid=actorUid;
      row.completedAt=null;row.completedByUid=null;row.completionLogId=null;
      row.completionRevision=Math.max(0,Number(row.completionRevision)||0)+1;
    }
    row.updatedAt=timestamp;row.updatedByUid=actorUid;row.lastExecutionSource=source||'TASK';
    return allDone;
  }

  function setItemCompleted(item,completed,actorUid,timestamp){
    var current=item.completed===true;
    if(current===completed)return false;
    item.completed=completed;
    item.completedAt=completed?timestamp:null;
    item.completedByUid=completed?actorUid:null;
    item.updatedAt=timestamp;
    item.updatedByUid=actorUid;
    return true;
  }

  function applySubtaskState(family,task,entries,patchSubtasks,actorUid,timestamp){
    var expected=expectedChecklist(entries),supplied=suppliedChecklist(task,patchSubtasks,entries);
    if(!arraysEqual(expected.order,supplied.order))throw new Error('CLEANING_EXECUTION_CHECKLIST_STRUCTURE_LOCKED');
    expected.order.forEach(function(key){
      var canonical=expected.map[key],submitted=supplied.map[key];
      setItemCompleted(canonical.item,!!(submitted&&(submitted.done===true||submitted.completed===true)),actorUid,timestamp);
    });
  }

  function applyAllCompletion(entries,completed,actorUid,timestamp){
    entries.forEach(function(entry){(Array.isArray(entry.row.checklist)?entry.row.checklist:[]).forEach(function(item){setItemCompleted(item,completed,actorUid,timestamp);});});
  }

  function applySchedule(entries,dateValue,timeValue,actorUid,timestamp,source){
    var schedule=localDateParts(dateValue,timeValue);
    entries.forEach(function(entry){
      var row=entry.row,completed=row.status==='COMPLETED'||row.assignmentStatus==='COMPLETED';
      row.scheduledDate=schedule.date;row.scheduledTime=schedule.time;
      row.scheduledStartAt=schedule.time?schedule.startAt:null;
      row.scheduledEndAt=schedule.time?schedule.startAt+(Math.max(0,Number(row.estimatedMinutes)||0)*60000):null;
      row.scheduledWindow={startAt:schedule.dayStartAt,endAt:schedule.dayEndAt};
      if(!completed){row.status=schedule.time?'SCHEDULED':'FLEXIBLE';row.assignmentStatus='ACTIVE';}
      row.rescheduledAt=timestamp;row.rescheduledByUid=actorUid;row.updatedAt=timestamp;row.updatedByUid=actorUid;row.lastExecutionSource=source;
    });
    return schedule;
  }

  function canonicalSubtaskState(entries){
    var map={};
    entries.forEach(function(entry){(Array.isArray(entry.row.checklist)?entry.row.checklist:[]).forEach(function(item,index){map[checklistIdentity(entry.id,item,index)]=item.completed===true;});});
    return map;
  }

  function refreshLinkedTask(row,entries,schedule,actorUid,timestamp,patchedSubtasks){
    var states=canonicalSubtaskState(entries),onlyOccurrence=entries.length===1?entries[0].id:null;
    var sourceSubtasks=Array.isArray(patchedSubtasks)?patchedSubtasks:(Array.isArray(row.subtasks)?row.subtasks:[]);
    row.subtasks=sourceSubtasks.map(function(item,index){
      var next=clone(item)||{},occurrenceId=text(next.cleaningOccurrenceId)||onlyOccurrence,key=checklistIdentity(occurrenceId,next,index);
      if(Object.prototype.hasOwnProperty.call(states,key)){next.cleaningOccurrenceId=occurrenceId;next.done=states[key];next.completed=states[key];}
      return next;
    });
    var doneCount=row.subtasks.filter(function(item){return item&&item.done===true;}).length;
    var allDone=row.subtasks.length>0&&doneCount===row.subtasks.length;
    row.progress=row.subtasks.length?Math.round(doneCount/row.subtasks.length*100):0;
    row.done=allDone;row.status=allDone?'done':'open';
    row.completedAt=allDone?(Number(row.completedAt)||timestamp):null;
    row.completedByUid=allDone?(text(row.completedByUid)||actorUid):null;
    if(schedule){row.date=schedule.date;row.dueDate=schedule.date;row.time=schedule.time;}
    row.updatedAt=timestamp;row.updatedByUid=actorUid;row.executionSyncVersion=1;
    return row;
  }

  function refreshLinkedEvent(row,entries,schedule,actorUid,timestamp){
    var allDone=entries.length>0&&entries.every(function(entry){return entry.row.status==='COMPLETED'||entry.row.assignmentStatus==='COMPLETED';});
    row.completed=allDone;
    if(schedule){row.date=schedule.date;row.time=schedule.time;row.flexible=!schedule.time;}
    row.updatedAt=timestamp;row.updatedByUid=actorUid;row.executionSyncVersion=1;
    return row;
  }

  function updateLinkedRows(family,occurrenceIds,entries,schedule,actorUid,timestamp,taskKey,patchedSubtasks){
    var lookup={};occurrenceIds.forEach(function(id){lookup[id]=true;});
    Object.keys(family.tasks).forEach(function(key){
      var row=family.tasks[key];if(!row||!recordOccurrenceIds(row).some(function(id){return lookup[id];}))return;
      refreshLinkedTask(row,entries,schedule,actorUid,timestamp,key===taskKey?patchedSubtasks:null);
    });
    Object.keys(family.calendarEvents).forEach(function(key){
      var row=family.calendarEvents[key];if(!row||!recordOccurrenceIds(row).some(function(id){return lookup[id];}))return;
      refreshLinkedEvent(row,entries,schedule,actorUid,timestamp);
    });
  }

  function mergeTaskLocalPatch(task,patch){
    var blocked={
      id:1,_key:1,householdId:1,createdAt:1,createdByUid:1,title:1,description:1,desc:1,category:1,type:1,
      date:1,dueDate:1,time:1,done:1,status:1,progress:1,subtasks:1,assignedToUid:1,assignedToUids:1,who:1,
      priority:1,prio:1,recurrence:1,repeat:1,sourceType:1,sourceId:1,sourceIds:1,cleaningOccurrenceId:1,
      cleaningOccurrenceIds:1,cleaningPlanId:1,projectionManaged:1,projectionGroupKey:1,projectionVersion:1,schemaVersion:1,
      completedAt:1,completedByUid:1
    };
    Object.keys(patch||{}).forEach(function(key){if(!blocked[key])task[key]=clone(patch[key]);});
  }

  function applyTaskPatchToFamily(input){
    var source=input||{},family=ensureFamily(source.family),taskId=text(source.taskId),patch=source.patch&&typeof source.patch==='object'?clone(source.patch):{},householdId=text(source.householdId),actorUid=text(source.actorUid),timestamp=Number(source.timestamp)||Date.now();
    var record=findRecord(family.tasks,taskId);
    if(!record||!isCleaningProjection(record.row))return{handled:false,family:family,task:null,occurrenceIds:[]};
    if(record.row.householdId&&text(record.row.householdId)!==householdId)throw new Error('CLEANING_EXECUTION_HOUSEHOLD_CONFLICT');
    var ids=recordOccurrenceIds(record.row),entries=occurrenceRows(family,ids,householdId),hasCompletion=false;

    if(Object.prototype.hasOwnProperty.call(patch,'subtasks')){applySubtaskState(family,record.row,entries,patch.subtasks,actorUid,timestamp);hasCompletion=true;}
    if(typeof patch.done==='boolean'){applyAllCompletion(entries,patch.done,actorUid,timestamp);hasCompletion=true;}
    if(hasCompletion)entries.forEach(function(entry){updateOccurrenceCompletion(family,entry,actorUid,timestamp,'TASK');});

    var schedule=null;
    if(Object.prototype.hasOwnProperty.call(patch,'date')||Object.prototype.hasOwnProperty.call(patch,'time')){
      var dateValue=Object.prototype.hasOwnProperty.call(patch,'date')?patch.date:record.row.date;
      var timeValue=Object.prototype.hasOwnProperty.call(patch,'time')?patch.time:record.row.time;
      schedule=applySchedule(entries,dateValue,timeValue,actorUid,timestamp,'TASK');
    }

    mergeTaskLocalPatch(record.row,patch);
    updateLinkedRows(family,ids,entries,schedule,actorUid,timestamp,record.key,Array.isArray(patch.subtasks)?patch.subtasks:null);
    return{handled:true,family:family,task:clone(family.tasks[record.key]),taskKey:record.key,occurrenceIds:ids.slice(),schedule:schedule};
  }

  function mergeCalendarLocalPatch(event,patch){
    var blocked={id:1,_key:1,householdId:1,createdAt:1,createdByUid:1,title:1,description:1,date:1,time:1,who:1,assignedToUid:1,flexible:1,completed:1,sourceType:1,sourceId:1,sourceIds:1,cleaningOccurrenceId:1,cleaningOccurrenceIds:1,cleaningPlanId:1,projectionManaged:1,projectionGroupKey:1,projectionVersion:1,schemaVersion:1};
    Object.keys(patch||{}).forEach(function(key){if(!blocked[key])event[key]=clone(patch[key]);});
  }

  function applyCalendarPatchToFamily(input){
    var source=input||{},family=ensureFamily(source.family),eventId=text(source.eventId),patch=source.patch&&typeof source.patch==='object'?clone(source.patch):{},householdId=text(source.householdId),actorUid=text(source.actorUid),timestamp=Number(source.timestamp)||Date.now();
    var record=findRecord(family.calendarEvents,eventId);
    if(!record||!isCleaningProjection(record.row))return{handled:false,family:family,event:null,occurrenceIds:[]};
    if(record.row.householdId&&text(record.row.householdId)!==householdId)throw new Error('CLEANING_EXECUTION_HOUSEHOLD_CONFLICT');
    var ids=recordOccurrenceIds(record.row),entries=occurrenceRows(family,ids,householdId),schedule=null;
    if(Object.prototype.hasOwnProperty.call(patch,'date')||Object.prototype.hasOwnProperty.call(patch,'time')){
      var dateValue=Object.prototype.hasOwnProperty.call(patch,'date')?patch.date:record.row.date;
      var timeValue=Object.prototype.hasOwnProperty.call(patch,'time')?patch.time:record.row.time;
      schedule=applySchedule(entries,dateValue,timeValue,actorUid,timestamp,'CALENDAR');
    }
    mergeCalendarLocalPatch(record.row,patch);
    updateLinkedRows(family,ids,entries,schedule,actorUid,timestamp,null,null);
    return{handled:true,family:family,event:clone(family.calendarEvents[record.key]),eventKey:record.key,occurrenceIds:ids.slice(),schedule:schedule};
  }

  function userMessage(error){
    var code=text(error&&error.message||error);
    if(code.indexOf('CHECKLIST_STRUCTURE_LOCKED')>=0)return'Schoonmaakstappen voeg je toe of verwijder je via Schoonmaken → Kamers.';
    if(code.indexOf('DATE_INVALID')>=0)return'Kies een geldige datum.';
    if(code.indexOf('TIME_INVALID')>=0)return'Kies een geldige tijd.';
    if(code.indexOf('PERMISSION_DENIED')>=0||code.toLowerCase().indexOf('permission')>=0)return'Deze schoonmaakwijziging is niet toegestaan voor het actieve huishouden.';
    return code||'Schoonmaakwijziging kon niet worden opgeslagen.';
  }

  window.CleaningExecutionSync=Object.freeze({
    version:VERSION,
    userMessage:userMessage,
    _isCleaningProjection:isCleaningProjection,
    _applyTaskPatchToFamily:applyTaskPatchToFamily,
    _applyCalendarPatchToFamily:applyCalendarPatchToFamily,
    _recordOccurrenceIds:recordOccurrenceIds,
    _localDateParts:localDateParts,
    _completionLogId:completionLogId
  });
})();
