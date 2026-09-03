'use strict';
// ============================================================
// CLEANING PROJECTION SERVICE v0.3.1
// Projects canonical CleaningOccurrences to canonical Tasks and Calendar.
// One room + day + assignee becomes one Task/Agenda card with a checklist.
// Completion and scheduling always come from CleaningOccurrence.
// ============================================================
(function(){
  if(window.CleaningProjectionService)return;

  var VERSION='0.3.1';
  var state={unsubscribe:null,attachTimer:null,inFlight:{},lastError:null,lastResult:null};
  var INVALID_KEY=/[.#$\[\]\/\u0000-\u001F\u007F]/g;

  function clone(value){if(value===undefined)return undefined;try{return JSON.parse(JSON.stringify(value));}catch(error){return value;}}
  function text(value){return String(value==null?'':value).trim();}
  function safeKey(value){return text(value).replace(INVALID_KEY,'_');}
  function now(){return Date.now();}
  function contextSnapshot(){try{return window.HouseholdContext&&window.HouseholdContext.snapshot?window.HouseholdContext.snapshot():null;}catch(error){return null;}}
  function captureContext(){try{return window.HouseholdContext&&window.HouseholdContext.capture?window.HouseholdContext.capture():null;}catch(error){return null;}}
  function contextIsCurrent(token){try{return !!(window.HouseholdContext&&window.HouseholdContext.isCurrent&&window.HouseholdContext.isCurrent(token));}catch(error){return false;}}
  function firebaseDb(){try{return window.fbDb||(window.firebase&&window.firebase.database&&window.firebase.database())||null;}catch(error){return null;}}
  function repository(){return window.CleaningHouseholdRepository||null;}
  function validContext(value){return !!(value&&value.ready===true&&value.uid&&value.householdId);}
  function isIsoDate(value){return /^\d{4}-\d{2}-\d{2}$/.test(text(value));}

  function pad(value){return value<10?'0'+value:String(value);}
  function localDate(timestamp){var d=new Date(Number(timestamp)||now());return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());}
  function localTime(timestamp){var d=new Date(Number(timestamp)||now());return pad(d.getHours())+':'+pad(d.getMinutes());}
  function startOfLocalDay(timestamp){var d=new Date(Number(timestamp)||now());d.setHours(0,0,0,0);return d.getTime();}
  function clamp(value,min,max){return Math.max(min,Math.min(max,value));}
  function hashText(value){var h=2166136261;value=String(value||'');for(var i=0;i<value.length;i++){h^=value.charCodeAt(i);h=Math.imul(h,16777619);}return(h>>>0).toString(36);}

  function members(){
    try{var bridge=window.HouseholdIdentityFirebaseBridge;var rows=bridge&&bridge.getMembers?bridge.getMembers():[];return Array.isArray(rows)?rows.map(clone):[];}catch(error){return [];}
  }
  function memberName(uid,list){var wanted=text(uid),found=(Array.isArray(list)?list:[]).find(function(row){return text(row&&(row.uid||row.id))===wanted;});return found?text(found.displayName||found.name)||'Gezinslid':'Gezinslid';}
  function roomName(cleaning,roomId){var room=cleaning&&cleaning.rooms&&cleaning.rooms[roomId];return room&&room.name?String(room.name):'Schoonmaken';}
  function assignedUid(occurrence){var ids=occurrence&&Array.isArray(occurrence.assignmentUids)?occurrence.assignmentUids.filter(Boolean).map(String):[];if(ids.length!==1)throw new Error('CLEANING_PROJECTION_ASSIGNMENT_INVALID');return ids[0];}

  function projectionTaskId(occurrenceId){return 'cleaning_'+safeKey(occurrenceId);}
  function projectionCalendarId(occurrenceId){return 'cleaning_'+safeKey(occurrenceId);}
  function groupProjectionId(planId,roomId,date,uid){return 'cleaning_group_'+hashText([planId,roomId,date,uid].join('|'));}
  function calendarKey(id){return 'id_'+safeKey(id);}
  function taskIdentity(row,key){return text(row&&(row.id||row._key)||key);}
  function eventIdentity(row,key){return text(row&&(row.id||row._key)||key);}

  function occurrenceDateTime(plan,occurrence,timestamp){
    var explicitDate=text(occurrence&&occurrence.scheduledDate);
    var explicitTime=text(occurrence&&occurrence.scheduledTime);
    var scheduled=Number(occurrence&&occurrence.scheduledStartAt)||0;
    if(isIsoDate(explicitDate)){
      return{date:explicitDate,time:explicitTime||(scheduled?localTime(scheduled):''),flexible:!explicitTime&&!scheduled,anchorAt:scheduled||Number(occurrence&&occurrence.scheduledWindow&&occurrence.scheduledWindow.startAt)||0};
    }
    if(scheduled>0)return{date:localDate(scheduled),time:localTime(scheduled),flexible:false,anchorAt:scheduled};
    var windowStart=Number(plan.windowStartAt)||startOfLocalDay(timestamp),windowEnd=Number(plan.windowEndAt)||windowStart+7*86400000;
    var anchor=Number(occurrence.slotAt)||Number(occurrence.flexibleWindow&&occurrence.flexibleWindow.startAt)||Number(occurrence.earliestDueAt)||Number(occurrence.latestDueAt)||windowStart;
    anchor=clamp(anchor,windowStart,Math.max(windowStart,windowEnd-1));
    return{date:localDate(anchor),time:'',flexible:true,anchorAt:anchor};
  }

  function priorityForOccurrences(entries){
    var values=[];entries.forEach(function(entry){(Array.isArray(entry.occurrence.checklist)?entry.occurrence.checklist:[]).forEach(function(item){values.push(text(item&&item.priority||'NORMAL').toUpperCase());});});
    if(values.indexOf('EXTRA')>=0)return'hoog';if(values.indexOf('NORMAL')>=0)return'normaal';return'laag';
  }

  function recordOccurrenceIds(row){
    var ids=[];
    (Array.isArray(row&&row.cleaningOccurrenceIds)?row.cleaningOccurrenceIds:[]).forEach(function(value){var id=text(value);if(id&&ids.indexOf(id)<0)ids.push(id);});
    [row&&row.cleaningOccurrenceId,row&&row.sourceId].forEach(function(value){var id=text(value);if(id&&ids.indexOf(id)<0)ids.push(id);});
    return ids;
  }

  function intersects(values,lookup){return values.some(function(value){return !!lookup[value];});}
  function linkedRecords(map,occurrenceLookup,isCalendar){
    var source=map&&typeof map==='object'?map:{};
    return Object.keys(source).map(function(key){var row=source[key];if(!row||typeof row!=='object')return null;var ids=recordOccurrenceIds(row);return intersects(ids,occurrenceLookup)?{key:key,row:row,id:isCalendar?eventIdentity(row,key):taskIdentity(row,key),occurrenceIds:ids}:null;}).filter(Boolean);
  }

  function presentationLookup(records){
    var byPair={},byRoutine={};
    records.forEach(function(record){
      var row=record.row||{},only=recordOccurrenceIds(row).length===1?recordOccurrenceIds(row)[0]:null;
      (Array.isArray(row.subtasks)?row.subtasks:[]).forEach(function(item){
        var routineId=text(item&&(item.sourceRoutineItemId||item.routineItemId||item.id));if(!routineId)return;
        var occurrenceId=text(item&&item.cleaningOccurrenceId)||only;
        var presentation={};if(item&&item.icon)presentation.icon=item.icon;
        if(occurrenceId)byPair[occurrenceId+'|'+routineId]=presentation;
        if(!byRoutine[routineId])byRoutine[routineId]=presentation;
      });
    });
    return{byPair:byPair,byRoutine:byRoutine};
  }

  function mergedSubtasks(entries,records){
    var presentation=presentationLookup(records||[]),seen={},out=[];
    entries.forEach(function(entry){
      (Array.isArray(entry.occurrence.checklist)?entry.occurrence.checklist:[]).forEach(function(item,index){
        var routineId=text(item&&(item.routineItemId||item.id))||('item_'+index),key=routineId;
        if(seen[key])key=entry.id+'__'+routineId;seen[key]=true;
        var completed=!!(item&&item.completed),cosmetic=presentation.byPair[entry.id+'|'+routineId]||presentation.byRoutine[routineId]||{};
        out.push(Object.assign({
          id:safeKey(key),title:text(item&&item.title)||'Schoonmaakonderdeel',done:completed,completed:completed,
          sourceRoutineItemId:routineId,cleaningOccurrenceId:entry.id,estimatedMinutes:Number(item&&item.estimatedMinutes)||0,priority:text(item&&item.priority)||'NORMAL'
        },clone(cosmetic)));
      });
    });
    return out;
  }

  function selectTarget(records,desiredId,desiredGroupKey,claimed){
    var available=records.filter(function(record){return !claimed[record.key];});
    var exact=available.find(function(record){return record.id===desiredId||record.key===desiredId||record.key===calendarKey(desiredId);});if(exact)return exact;
    var grouped=available.find(function(record){return text(record.row&&record.row.projectionGroupKey)===desiredGroupKey;});if(grouped)return grouped;
    return available.length===1?available[0]:null;
  }

  function minCreatedAt(records,entries,fallback){
    var values=records.map(function(record){return Number(record.row&&record.row.createdAt)||0;});
    entries.forEach(function(entry){values.push(Number(entry.occurrence&&entry.occurrence.createdAt)||0);});
    values=values.filter(function(value){return value>0;});return values.length?Math.min.apply(Math,values):fallback;
  }
  function firstCreatedBy(records,entries,fallback){
    var i,uid;for(i=0;i<records.length;i++){uid=text(records[i].row&&records[i].row.createdByUid);if(uid)return uid;}
    for(i=0;i<entries.length;i++){uid=text(entries[i].occurrence&&entries[i].occurrence.createdByUid);if(uid)return uid;}
    return fallback;
  }

  function stableTask(row){return{title:row.title,description:row.description,date:row.date,dueDate:row.dueDate,time:row.time,assignedToUid:row.assignedToUid,assignedToUids:row.assignedToUids,who:row.who,priority:row.priority,prio:row.prio,subtasks:row.subtasks,done:row.done,status:row.status,progress:row.progress,completedAt:row.completedAt,completedByUid:row.completedByUid,cleaningOccurrenceIds:row.cleaningOccurrenceIds,projectionGroupKey:row.projectionGroupKey,projectionVersion:row.projectionVersion};}
  function stableEvent(row){return{title:row.title,date:row.date,time:row.time,description:row.description,who:row.who,assignedToUid:row.assignedToUid,flexible:row.flexible,completed:row.completed,cleaningOccurrenceIds:row.cleaningOccurrenceIds,projectionGroupKey:row.projectionGroupKey,projectionVersion:row.projectionVersion};}

  function groupCompletion(entries){
    var values=entries.map(function(entry){return Number(entry.occurrence&&entry.occurrence.completedAt)||0;}).filter(function(value){return value>0;});
    var all=entries.length>0&&entries.every(function(entry){return entry.occurrence.status==='COMPLETED'||entry.occurrence.assignmentStatus==='COMPLETED';});
    return{done:all,completedAt:all&&values.length?Math.max.apply(Math,values):null,completedByUid:all?text(entries[entries.length-1].occurrence.completedByUid)||null:null};
  }

  function desiredTask(group,target,records,householdId,actorUid,timestamp,memberRows,cleaning){
    var subtasks=mergedSubtasks(group.entries,records),doneCount=subtasks.filter(function(item){return item.done;}).length,completion=groupCompletion(group.entries);
    var minutes=group.entries.reduce(function(sum,entry){return sum+(Number(entry.occurrence.estimatedMinutes)||0);},0),existing=target&&target.row||{};
    var id=target&&target.id||group.desiredId,key=target&&target.key||id,display=memberName(group.uid,memberRows),room=roomName(cleaning,group.roomId);
    return Object.assign({},clone(existing),{
      id:id,_key:key,householdId:householdId,type:'SIDE QUEST',category:'cleaning',title:'Schoonmaken · '+room,
      description:subtasks.length+' '+(subtasks.length===1?'routine':'routines')+' · '+minutes+' min',date:group.date,dueDate:group.date,time:group.time,
      assignedToUid:group.uid,assignedToUids:(function(){var out={};out[group.uid]=true;return out;})(),who:[display],xpReward:'+10 XP',xp:'+10 XP',
      priority:priorityForOccurrences(group.entries),prio:priorityForOccurrences(group.entries),recurrence:'once',repeat:'once',subtasks:subtasks,helpers:Array.isArray(existing.helpers)?existing.helpers:[],
      progress:subtasks.length?Math.round(doneCount/subtasks.length*100):0,done:completion.done,status:completion.done?'done':'open',completedAt:completion.completedAt,completedByUid:completion.completedByUid,
      sourceType:group.entries.length>1?'cleaning-occurrence-group':'cleaning-occurrence',sourceId:group.entries[0].id,sourceIds:group.ids.slice(),cleaningOccurrenceId:group.entries[0].id,cleaningOccurrenceIds:group.ids.slice(),
      cleaningPlanId:group.planId,projectionManaged:true,projectionGroupKey:group.key,projectionVersion:3,
      createdAt:Number(existing.createdAt)||minCreatedAt(records,group.entries,timestamp),createdByUid:text(existing.createdByUid)||firstCreatedBy(records,group.entries,actorUid),updatedAt:timestamp,updatedByUid:actorUid,schemaVersion:3
    });
  }

  function desiredEvent(group,target,records,householdId,actorUid,timestamp,memberRows,cleaning){
    var existing=target&&target.row||{},minutes=group.entries.reduce(function(sum,entry){return sum+(Number(entry.occurrence.estimatedMinutes)||0);},0),subtasks=mergedSubtasks(group.entries,[]),titles=subtasks.map(function(item){return item.title;}),completion=groupCompletion(group.entries),display=memberName(group.uid,memberRows),room=roomName(cleaning,group.roomId);
    var id=target&&target.id||group.desiredId,key=target&&target.key||calendarKey(id);
    return Object.assign({},clone(existing),{
      id:id,_key:key,householdId:householdId,title:'Schoonmaken · '+room,date:group.date,time:group.time,
      description:(completion.done?'Afgerond. ':(group.flexible?'Flexibel. ':''))+minutes+' min'+(titles.length?' · '+titles.join(', '):''),color:existing.color||'#7c3aed',who:display,assignedToUid:group.uid,flexible:group.flexible,completed:completion.done,_imported:false,
      sourceType:group.entries.length>1?'cleaning-occurrence-group':'cleaning-occurrence',sourceId:group.entries[0].id,sourceIds:group.ids.slice(),cleaningOccurrenceId:group.entries[0].id,cleaningOccurrenceIds:group.ids.slice(),
      cleaningPlanId:group.planId,projectionManaged:true,projectionGroupKey:group.key,projectionVersion:3,
      createdAt:Number(existing.createdAt)||minCreatedAt(records,group.entries,timestamp),createdByUid:text(existing.createdByUid)||firstCreatedBy(records,group.entries,actorUid),updatedAt:timestamp,updatedByUid:actorUid,schemaVersion:3
    });
  }

  function buildGroups(cleaning,plan,occurrenceIds,timestamp){
    var groups={};
    occurrenceIds.forEach(function(id){
      var occurrence=cleaning.occurrences&&cleaning.occurrences[id];
      if(!occurrence||typeof occurrence!=='object'||text(occurrence.planId)!==text(plan.id))throw new Error('CLEANING_PROJECTION_OCCURRENCE_NOT_FOUND');
      if(occurrence.status==='CANCELLED'||occurrence.status==='SKIPPED')return;
      if(['ACTIVE','ACCEPTED','COMPLETED'].indexOf(text(occurrence.assignmentStatus))<0)return;
      var uid=assignedUid(occurrence),when=occurrenceDateTime(plan,occurrence,timestamp),key=[plan.id,text(occurrence.roomId),when.date,uid].join('|');
      if(!groups[key])groups[key]={key:key,planId:text(plan.id),roomId:text(occurrence.roomId),uid:uid,date:when.date,time:when.time,flexible:when.flexible,entries:[],ids:[]};
      groups[key].entries.push({id:id,occurrence:occurrence,when:when});groups[key].ids.push(id);
      if(!groups[key].time&&when.time)groups[key].time=when.time;if(!when.flexible)groups[key].flexible=false;
    });
    return Object.keys(groups).sort().map(function(key){var group=groups[key];group.ids.sort();group.entries.sort(function(a,b){return a.id<b.id?-1:1;});group.desiredId=group.entries.length===1?projectionTaskId(group.entries[0].id):groupProjectionId(group.planId,group.roomId,group.date,group.uid);return group;});
  }

  function managedCleaningRecord(row){return !!(row&&(row.projectionManaged===true||text(row.sourceType).indexOf('cleaning-occurrence')===0));}

  function buildProjectionUpdates(input){
    var family=input&&input.family&&typeof input.family==='object'?input.family:{},cleaning=family.cleaning&&typeof family.cleaning==='object'?family.cleaning:{},tasks=family.tasks&&typeof family.tasks==='object'?family.tasks:{},calendarEvents=family.calendarEvents&&typeof family.calendarEvents==='object'?family.calendarEvents:{};
    var planId=text(input&&input.planId),plan=cleaning.plans&&cleaning.plans[planId],householdId=text(input&&input.householdId),actorUid=text(input&&input.actorUid),timestamp=Number(input&&input.timestamp)||now(),memberRows=Array.isArray(input&&input.members)?input.members:[];
    if(!plan||typeof plan!=='object'||plan.status!=='ACTIVE')return{updates:{},createdTasks:0,createdCalendarEvents:0,linkedOccurrences:0,expectedOccurrences:0,groupCount:0,complete:false};
    plan.id=plan.id||planId;if(plan.householdId&&text(plan.householdId)!==householdId)throw new Error('CLEANING_PROJECTION_HOUSEHOLD_CONFLICT');

    var occurrenceIds=Array.isArray(plan.occurrenceIds)?plan.occurrenceIds.map(String):[],groups=buildGroups(cleaning,plan,occurrenceIds,timestamp),updates={},createdTasks=0,createdCalendarEvents=0,linked=0,activeLookup={},desiredTaskKeys={},desiredEventKeys={},claimedTaskKeys={},claimedEventKeys={};

    groups.forEach(function(group){
      group.ids.forEach(function(id){activeLookup[id]=true;});
      var occurrenceLookup={};group.ids.forEach(function(id){occurrenceLookup[id]=true;});
      var taskRecords=linkedRecords(tasks,occurrenceLookup,false),eventRecords=linkedRecords(calendarEvents,occurrenceLookup,true);
      var taskTarget=selectTarget(taskRecords,group.desiredId,group.key,claimedTaskKeys),eventTarget=selectTarget(eventRecords,group.desiredId,group.key,claimedEventKeys);
      var task=desiredTask(group,taskTarget,taskRecords,householdId,actorUid,timestamp,memberRows,cleaning),event=desiredEvent(group,eventTarget,eventRecords,householdId,actorUid,timestamp,memberRows,cleaning);
      var taskKey=taskTarget?taskTarget.key:task._key,eventKey=eventTarget?eventTarget.key:event._key;
      claimedTaskKeys[taskKey]=true;claimedEventKeys[eventKey]=true;desiredTaskKeys[taskKey]=true;desiredEventKeys[eventKey]=true;

      if(!taskTarget){updates['tasks/'+taskKey]=task;createdTasks++;}else if(JSON.stringify(stableTask(taskTarget.row))!==JSON.stringify(stableTask(task))){updates['tasks/'+taskKey]=task;}
      if(!eventTarget){updates['calendarEvents/'+eventKey]=event;createdCalendarEvents++;}else if(JSON.stringify(stableEvent(eventTarget.row))!==JSON.stringify(stableEvent(event))){updates['calendarEvents/'+eventKey]=event;}

      group.entries.forEach(function(entry){
        var projections=entry.occurrence.projections&&typeof entry.occurrence.projections==='object'?entry.occurrence.projections:{};
        if(text(projections.taskId)!==text(task.id))updates['cleaning/occurrences/'+entry.id+'/projections/taskId']=text(task.id);
        if(text(projections.calendarEventId)!==text(event.id))updates['cleaning/occurrences/'+entry.id+'/projections/calendarEventId']=text(event.id);
        if(Number(projections.version)!==3)updates['cleaning/occurrences/'+entry.id+'/projections/version']=3;
        if(text(projections.groupKey)!==group.key)updates['cleaning/occurrences/'+entry.id+'/projections/groupKey']=group.key;
        if(!Number(projections.projectedAt))updates['cleaning/occurrences/'+entry.id+'/projections/projectedAt']=timestamp;
        if(!text(projections.projectedByUid))updates['cleaning/occurrences/'+entry.id+'/projections/projectedByUid']=actorUid;
        linked++;
      });
    });

    var planLookup={};occurrenceIds.forEach(function(id){planLookup[id]=true;});
    Object.keys(tasks).forEach(function(key){var row=tasks[key];if(!row||desiredTaskKeys[key]||!managedCleaningRecord(row))return;var ids=recordOccurrenceIds(row);if(intersects(ids,planLookup))updates['tasks/'+key]=null;});
    Object.keys(calendarEvents).forEach(function(key){var row=calendarEvents[key];if(!row||desiredEventKeys[key]||!managedCleaningRecord(row))return;var ids=recordOccurrenceIds(row);if(intersects(ids,planLookup))updates['calendarEvents/'+key]=null;});

    return{updates:updates,createdTasks:createdTasks,createdCalendarEvents:createdCalendarEvents,linkedOccurrences:linked,expectedOccurrences:linked,groupCount:groups.length,complete:true};
  }

  function emit(detail){state.lastResult=clone(detail||{});state.lastError=detail&&detail.error||null;try{window.dispatchEvent(new CustomEvent('familyapp:cleaning-projections',{detail:clone(detail||{})}));}catch(error){}}

  function reconcilePlan(planId){
    planId=text(planId);if(!planId)return Promise.resolve(null);if(state.inFlight[planId])return state.inFlight[planId];
    var ctx=contextSnapshot(),database=firebaseDb(),token=captureContext();if(!validContext(ctx)||!database||!token||!contextIsCurrent(token))return Promise.resolve(null);
    var familyRef=database.ref('families/'+ctx.householdId);
    var work=Promise.all([familyRef.child('cleaning').once('value'),familyRef.child('tasks').once('value'),familyRef.child('calendarEvents').once('value')]).then(function(snaps){
      if(!contextIsCurrent(token))throw new Error('CLEANING_PROJECTION_CONTEXT_CHANGED');
      var family={cleaning:snaps[0]&&snaps[0].val?snaps[0].val():{},tasks:snaps[1]&&snaps[1].val?snaps[1].val():{},calendarEvents:snaps[2]&&snaps[2].val?snaps[2].val():{}};
      var result=buildProjectionUpdates({family:family,planId:planId,householdId:ctx.householdId,actorUid:ctx.uid,timestamp:now(),members:members()}),keys=Object.keys(result.updates);
      if(!keys.length){emit(Object.assign({planId:planId,status:'synced'},result));return result;}
      return familyRef.update(result.updates).then(function(){if(!contextIsCurrent(token))throw new Error('CLEANING_PROJECTION_CONTEXT_CHANGED_AFTER_WRITE');emit(Object.assign({planId:planId,status:'projected'},result));return result;});
    }).catch(function(error){emit({planId:planId,status:'error',error:error&&error.message||String(error)});throw error;}).finally(function(){delete state.inFlight[planId];});
    state.inFlight[planId]=work;return work;
  }

  function eligibleActivePlans(snapshot){var plans=snapshot&&snapshot.data&&snapshot.data.plans;if(!plans||typeof plans!=='object')return[];var cutoff=now()-86400000;return Object.keys(plans).filter(function(id){var plan=plans[id];return plan&&plan.status==='ACTIVE'&&Number(plan.windowEndAt||0)>=cutoff;});}
  function reconcileSnapshot(snapshot){eligibleActivePlans(snapshot).forEach(function(planId){reconcilePlan(planId).catch(function(){});});}
  function attach(){var repo=repository();if(!repo||typeof repo.subscribe!=='function')return false;if(state.unsubscribe)return true;state.unsubscribe=repo.subscribe(function(snapshot){reconcileSnapshot(snapshot);});try{if(repo.snapshot)reconcileSnapshot(repo.snapshot());}catch(error){}return true;}
  function start(){if(attach())return true;if(state.attachTimer)return false;var tries=0;state.attachTimer=setInterval(function(){tries++;if(attach()||tries>240){clearInterval(state.attachTimer);state.attachTimer=null;}},100);return false;}
  function stop(){if(state.unsubscribe){try{state.unsubscribe();}catch(error){}state.unsubscribe=null;}if(state.attachTimer){clearInterval(state.attachTimer);state.attachTimer=null;}state.inFlight={};}

  window.CleaningProjectionService={
    version:VERSION,start:start,stop:stop,reconcilePlan:reconcilePlan,
    status:function(){return clone({version:VERSION,lastError:state.lastError,lastResult:state.lastResult,inFlight:Object.keys(state.inFlight)});},
    _buildProjectionUpdates:buildProjectionUpdates,_taskIdForOccurrence:projectionTaskId,_calendarIdForOccurrence:projectionCalendarId,_groupProjectionId:groupProjectionId,_occurrenceDateTime:occurrenceDateTime
  };
  window.addEventListener('familyapp:cleaning-repository',function(){start();try{var repo=repository();if(repo&&repo.snapshot)reconcileSnapshot(repo.snapshot());}catch(error){}});
  window.addEventListener('familyapp:household-context',start);
  start();
})();
