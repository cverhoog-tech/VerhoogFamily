'use strict';
// ============================================================
// CLEANING PROJECTION SERVICE v0.3.0
// Projects canonical CleaningOccurrences to canonical Tasks and Calendar.
// Occurrences for the same room, day and assignee share one projection card.
// Completed occurrences remain visible as completed projections; Task state is
// never read back as projection authority. CleaningOccurrence is the source.
// ============================================================
(function(){
  if(window.CleaningProjectionService)return;

  var VERSION='0.3.0';
  var state={unsubscribe:null,attachTimer:null,inFlight:{},lastError:null,lastResult:null};
  var INVALID_KEY=/[.#$\[\]\/\u0000-\u001F\u007F]/g;

  function clone(value){if(value===undefined)return undefined;try{return JSON.parse(JSON.stringify(value));}catch(e){return value;}}
  function text(value){return String(value==null?'':value).trim();}
  function safeKey(value){return text(value).replace(INVALID_KEY,'_');}
  function now(){return Date.now();}
  function contextSnapshot(){try{return window.HouseholdContext&&window.HouseholdContext.snapshot?window.HouseholdContext.snapshot():null;}catch(e){return null;}}
  function captureContext(){try{return window.HouseholdContext&&window.HouseholdContext.capture?window.HouseholdContext.capture():null;}catch(e){return null;}}
  function contextIsCurrent(token){try{return !!(window.HouseholdContext&&window.HouseholdContext.isCurrent&&window.HouseholdContext.isCurrent(token));}catch(e){return false;}}
  function firebaseDb(){try{return window.fbDb||(window.firebase&&window.firebase.database&&window.firebase.database())||null;}catch(e){return null;}}
  function repository(){return window.CleaningHouseholdRepository||null;}
  function validContext(value){return !!(value&&value.ready===true&&value.uid&&value.householdId);}

  function pad(value){return value<10?'0'+value:String(value);}
  function localDate(timestamp){var d=new Date(Number(timestamp)||now());return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());}
  function localTime(timestamp){var d=new Date(Number(timestamp)||now());return pad(d.getHours())+':'+pad(d.getMinutes());}
  function startOfLocalDay(timestamp){var d=new Date(Number(timestamp)||now());d.setHours(0,0,0,0);return d.getTime();}
  function clamp(value,min,max){return Math.max(min,Math.min(max,value));}
  function hashText(value){var h=2166136261;value=String(value||'');for(var i=0;i<value.length;i++){h^=value.charCodeAt(i);h=Math.imul(h,16777619);}return(h>>>0).toString(36);}

  function members(){
    try{var bridge=window.HouseholdIdentityFirebaseBridge;var rows=bridge&&bridge.getMembers?bridge.getMembers():[];return Array.isArray(rows)?rows.map(clone):[];}catch(e){return [];}
  }
  function memberName(uid,list){var wanted=String(uid||'');var found=(Array.isArray(list)?list:[]).find(function(row){return String(row&&(row.uid||row.id)||'')===wanted;});return found?String(found.displayName||found.name||'Gezinslid'):'Gezinslid';}
  function roomName(cleaning,roomId){var room=cleaning&&cleaning.rooms&&cleaning.rooms[roomId];return room&&room.name?String(room.name):'Schoonmaken';}
  function assignedUid(occurrence){var ids=occurrence&&Array.isArray(occurrence.assignmentUids)?occurrence.assignmentUids.filter(Boolean).map(String):[];if(ids.length!==1)throw new Error('CLEANING_PROJECTION_ASSIGNMENT_INVALID');return ids[0];}

  function projectionTaskId(occurrenceId){return 'cleaning_'+safeKey(occurrenceId);}
  function projectionCalendarId(occurrenceId){return 'cleaning_'+safeKey(occurrenceId);}
  function groupProjectionId(planId,roomId,date,uid){return 'cleaning_group_'+hashText([planId,roomId,date,uid].join('|'));}
  function calendarKey(id){return 'id_'+safeKey(id);}
  function taskIdentity(row,key){return String(row&&(row.id||row._key)||key||'');}
  function eventIdentity(row,key){return String(row&&(row.id||row._key)||key||'');}

  function occurrenceDateTime(plan,occurrence,timestamp){
    var scheduled=Number(occurrence.scheduledStartAt)||0;
    if(scheduled>0)return{date:localDate(scheduled),time:localTime(scheduled),flexible:false,anchorAt:scheduled};
    var windowStart=Number(plan.windowStartAt)||startOfLocalDay(timestamp),windowEnd=Number(plan.windowEndAt)||windowStart+7*86400000;
    var anchor=Number(occurrence.slotAt)||Number(occurrence.flexibleWindow&&occurrence.flexibleWindow.startAt)||Number(occurrence.earliestDueAt)||Number(occurrence.latestDueAt)||windowStart;
    anchor=clamp(anchor,windowStart,Math.max(windowStart,windowEnd-1));
    return{date:localDate(anchor),time:'',flexible:true,anchorAt:anchor};
  }

  function priorityForOccurrences(entries){
    var values=[];entries.forEach(function(entry){(Array.isArray(entry.occurrence.checklist)?entry.occurrence.checklist:[]).forEach(function(item){values.push(String(item&&item.priority||'NORMAL').toUpperCase());});});
    if(values.indexOf('EXTRA')>=0)return'hoog';if(values.indexOf('NORMAL')>=0)return'normaal';return'laag';
  }

  function recordOccurrenceIds(row){
    var ids=[];
    (Array.isArray(row&&row.cleaningOccurrenceIds)?row.cleaningOccurrenceIds:[]).forEach(function(value){var id=text(value);if(id&&ids.indexOf(id)<0)ids.push(id);});
    [row&&row.cleaningOccurrenceId,row&&row.sourceId].forEach(function(value){var id=text(value);if(id&&ids.indexOf(id)<0)ids.push(id);});
    return ids;
  }

  function intersects(values,lookup){return values.some(function(value){return !!lookup[value];});}
  function findLinkedRecords(map,occurrenceLookup,isCalendar){
    var source=map&&typeof map==='object'?map:{};
    return Object.keys(source).map(function(key){var row=source[key];if(!row||typeof row!=='object')return null;var ids=recordOccurrenceIds(row);return intersects(ids,occurrenceLookup)?{key:key,row:row,id:isCalendar?eventIdentity(row,key):taskIdentity(row,key),occurrenceIds:ids}:null;}).filter(Boolean);
  }

  function mergedSubtasks(entries){
    var seen={},out=[];
    entries.forEach(function(entry){
      (Array.isArray(entry.occurrence.checklist)?entry.occurrence.checklist:[]).forEach(function(item,index){
        var routineId=text(item&&(item.routineItemId||item.id))||('item_'+index),key=routineId;
        if(seen[key])key=entry.id+'__'+routineId;
        seen[key]=true;
        var completed=!!(item&&item.completed);
        out.push({id:safeKey(key),title:text(item&&item.title)||'Schoonmaakonderdeel',done:completed,completed:completed,sourceRoutineItemId:routineId,cleaningOccurrenceId:entry.id,estimatedMinutes:Number(item&&item.estimatedMinutes)||0,priority:text(item&&item.priority)||'NORMAL'});
      });
    });
    return out;
  }

  function selectTargetRecord(records,desiredId,desiredGroupKey){
    var exact=records.find(function(record){return record.id===desiredId||record.key===desiredId||record.key===calendarKey(desiredId);});if(exact)return exact;
    var grouped=records.find(function(record){return text(record.row&&record.row.projectionGroupKey)===desiredGroupKey;});if(grouped)return grouped;
    return records.length===1?records[0]:null;
  }

  function minCreatedAt(records,fallback){var values=records.map(function(record){return Number(record.row&&record.row.createdAt)||0;}).filter(function(value){return value>0;});return values.length?Math.min.apply(Math,values):fallback;}
  function firstCreatedBy(records,fallback){for(var i=0;i<records.length;i++){var uid=text(records[i].row&&records[i].row.createdByUid);if(uid)return uid;}return fallback;}

  function stableTask(row){
    return{title:row.title,description:row.description,date:row.date,dueDate:row.dueDate,time:row.time,assignedToUid:row.assignedToUid,assignedToUids:row.assignedToUids,who:row.who,priority:row.priority,prio:row.prio,subtasks:row.subtasks,done:row.done,status:row.status,progress:row.progress,cleaningOccurrenceIds:row.cleaningOccurrenceIds,projectionGroupKey:row.projectionGroupKey,projectionVersion:row.projectionVersion};
  }
  function stableEvent(row){return{title:row.title,date:row.date,time:row.time,description:row.description,who:row.who,assignedToUid:row.assignedToUid,flexible:row.flexible,completed:row.completed,cleaningOccurrenceIds:row.cleaningOccurrenceIds,projectionGroupKey:row.projectionGroupKey,projectionVersion:row.projectionVersion};}

  function desiredTask(group,target,records,householdId,actorUid,timestamp,memberRows,cleaning){
    var subtasks=mergedSubtasks(group.entries),allDone=subtasks.length>0&&subtasks.every(function(item){return item.done;}),doneCount=subtasks.filter(function(item){return item.done;}).length;
    var minutes=group.entries.reduce(function(sum,entry){return sum+(Number(entry.occurrence.estimatedMinutes)||0);},0),existing=target&&target.row||{};
    var id=target&&target.id||group.desiredId,key=target&&target.key||id,display=memberName(group.uid,memberRows),room=roomName(cleaning,group.roomId);
    return Object.assign({},clone(existing),{
      id:id,_key:key,householdId:householdId,type:'SIDE QUEST',category:'cleaning',title:'Schoonmaken · '+room,
      description:subtasks.length+' '+(subtasks.length===1?'routine':'routines')+' · '+minutes+' min',date:group.date,dueDate:group.date,time:group.time,
      assignedToUid:group.uid,assignedToUids:(function(){var out={};out[group.uid]=true;return out;})(),who:[display],xpReward:'+10 XP',xp:'+10 XP',
      priority:priorityForOccurrences(group.entries),prio:priorityForOccurrences(group.entries),recurrence:'once',repeat:'once',subtasks:subtasks,helpers:Array.isArray(existing.helpers)?existing.helpers:[],
      progress:subtasks.length?Math.round(doneCount/subtasks.length*100):0,done:allDone,status:allDone?'done':'open',
      sourceType:group.entries.length>1?'cleaning-occurrence-group':'cleaning-occurrence',sourceId:group.entries[0].id,sourceIds:group.ids.slice(),cleaningOccurrenceId:group.entries[0].id,cleaningOccurrenceIds:group.ids.slice(),
      cleaningPlanId:group.planId,projectionManaged:true,projectionGroupKey:group.key,projectionVersion:3,
      createdAt:Number(existing.createdAt)||minCreatedAt(records,timestamp),createdByUid:text(existing.createdByUid)||firstCreatedBy(records,actorUid),updatedAt:timestamp,updatedByUid:actorUid,schemaVersion:3
    });
  }

  function desiredEvent(group,target,records,householdId,actorUid,timestamp,memberRows,cleaning){
    var existing=target&&target.row||{},minutes=group.entries.reduce(function(sum,entry){return sum+(Number(entry.occurrence.estimatedMinutes)||0);},0),subtasks=mergedSubtasks(group.entries),titles=subtasks.map(function(item){return item.title;}),allDone=subtasks.length>0&&subtasks.every(function(item){return item.done;}),display=memberName(group.uid,memberRows),room=roomName(cleaning,group.roomId);
    var id=target&&target.id||group.desiredId,key=target&&target.key||calendarKey(id);
    return Object.assign({},clone(existing),{
      id:id,_key:key,householdId:householdId,title:'Schoonmaken · '+room,date:group.date,time:group.time,
      description:(allDone?'Afgerond. ':(group.flexible?'Flexibel. ':''))+minutes+' min'+(titles.length?' · '+titles.join(', '):''),color:existing.color||'#7c3aed',who:display,assignedToUid:group.uid,flexible:group.flexible,completed:allDone,_imported:false,
      sourceType:group.entries.length>1?'cleaning-occurrence-group':'cleaning-occurrence',sourceId:group.entries[0].id,sourceIds:group.ids.slice(),cleaningOccurrenceId:group.entries[0].id,cleaningOccurrenceIds:group.ids.slice(),
      cleaningPlanId:group.planId,projectionManaged:true,projectionGroupKey:group.key,projectionVersion:3,
      createdAt:Number(existing.createdAt)||minCreatedAt(records,timestamp),createdByUid:text(existing.createdByUid)||firstCreatedBy(records,actorUid),updatedAt:timestamp,updatedByUid:actorUid,schemaVersion:3
    });
  }

  function buildGroups(cleaning,plan,occurrenceIds,timestamp){
    var groups={};
    occurrenceIds.forEach(function(id){
      var occurrence=cleaning.occurrences&&cleaning.occurrences[id];
      if(!occurrence||typeof occurrence!=='object'||text(occurrence.planId)!==text(plan.id))throw new Error('CLEANING_PROJECTION_OCCURRENCE_NOT_FOUND');
      if(occurrence.status==='CANCELLED'||occurrence.status==='SKIPPED')return;
      if(occurrence.assignmentStatus!=='ACTIVE'&&occurrence.assignmentStatus!=='ACCEPTED'&&occurrence.assignmentStatus!=='COMPLETED')return;
      var uid=assignedUid(occurrence),when=occurrenceDateTime(plan,occurrence,timestamp),key=[plan.id,text(occurrence.roomId),when.date,uid].join('|');
      if(!groups[key])groups[key]={key:key,planId:text(plan.id),roomId:text(occurrence.roomId),uid:uid,date:when.date,time:when.time,flexible:when.flexible,entries:[],ids:[]};
      groups[key].entries.push({id:id,occurrence:occurrence,when:when});groups[key].ids.push(id);
      if(!groups[key].time&&when.time)groups[key].time=when.time;if(!when.flexible)groups[key].flexible=false;
    });
    return Object.keys(groups).sort().map(function(key){var group=groups[key];group.ids.sort();group.entries.sort(function(a,b){return a.id<b.id?-1:1;});group.desiredId=group.entries.length===1?projectionTaskId(group.entries[0].id):groupProjectionId(group.planId,group.roomId,group.date,group.uid);return group;});
  }

  function buildProjectionUpdates(input){
    var family=input&&input.family&&typeof input.family==='object'?input.family:{},cleaning=family.cleaning&&typeof family.cleaning==='object'?family.cleaning:{},tasks=family.tasks&&typeof family.tasks==='object'?family.tasks:{},calendarEvents=family.calendarEvents&&typeof family.calendarEvents==='object'?family.calendarEvents:{};
    var planId=text(input&&input.planId),plan=cleaning.plans&&cleaning.plans[planId],householdId=text(input&&input.householdId),actorUid=text(input&&input.actorUid),timestamp=Number(input&&input.timestamp)||now(),memberRows=Array.isArray(input&&input.members)?input.members:[];
    if(!plan||typeof plan!=='object'||plan.status!=='ACTIVE')return{updates:{},createdTasks:0,createdCalendarEvents:0,linkedOccurrences:0,expectedOccurrences:0,groupCount:0,complete:false};
    plan.id=plan.id||planId;if(plan.householdId&&text(plan.householdId)!==householdId)throw new Error('CLEANING_PROJECTION_HOUSEHOLD_CONFLICT');

    var occurrenceIds=Array.isArray(plan.occurrenceIds)?plan.occurrenceIds.map(String):[],groups=buildGroups(cleaning,plan,occurrenceIds,timestamp),updates={},createdTasks=0,createdCalendarEvents=0,linked=0,activeLookup={},desiredTaskKeys={},desiredEventKeys={};
    groups.forEach(function(group){group.ids.forEach(function(id){activeLookup[id]=true;});
      var occurrenceLookup={};group.ids.forEach(function(id){occurrenceLookup[id]=true;});
      var taskRecords=findLinkedRecords(tasks,occurrenceLookup,false),eventRecords=findLinkedRecords(calendarEvents,occurrenceLookup,true);
      var taskTarget=selectTargetRecord(taskRecords,group.desiredId,group.key),eventTarget=selectTargetRecord(eventRecords,group.desiredId,group.key);
      var task=desiredTask(group,taskTarget,taskRecords,householdId,actorUid,timestamp,memberRows,cleaning),event=desiredEvent(group,eventTarget,eventRecords,householdId,actorUid,timestamp,memberRows,cleaning);
      var taskKey=taskTarget?taskTarget.key:task._key,eventKey=eventTarget?eventTarget.key:event._key;desiredTaskKeys[taskKey]=true;desiredEventKeys[eventKey]=true;
      if(!taskTarget){updates['tasks/'+taskKey]=task;createdTasks++;}else if(JSON.stringify(stableTask(taskTarget.row))!==JSON.stringify(stableTask(task))){updates['tasks/'+taskKey]=task;}
      if(!eventTarget){updates['calendarEvents/'+eventKey]=event;createdCalendarEvents++;}else if(JSON.stringify(stableEvent(eventTarget.row))!==JSON.stringify(stableEvent(event))){updates['calendarEvents/'+eventKey]=event;}
      taskRecords.forEach(function(record){if(record.key!==taskKey&&(record.row.projectionManaged===true||text(record.row.sourceType).indexOf('cleaning-')===0))updates['tasks/'+record.key]=null;});
      eventRecords.forEach(function(record){if(record.key!==eventKey&&(record.row.projectionManaged===true||text(record.row.sourceType).indexOf('cleaning-')===0))updates['calendarEvents/'+record.key]=null;});
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

    var planOccurrenceLookup={};occurrenceIds.forEach(function(id){planOccurrenceLookup[id]=true;});
    Object.keys(tasks).forEach(function(key){var row=tasks[key];if(!row||desiredTaskKeys[key])return;var ids=recordOccurrenceIds(row);if(intersects(ids,planOccurrenceLookup)&&!intersects(ids,activeLookup)&&(row.projectionManaged===true||text(row.sourceType).indexOf('cleaning-')===0))updates['tasks/'+key]=null;});
    Object.keys(calendarEvents).forEach(function(key){var row=calendarEvents[key];if(!row||desiredEventKeys[key])return;var ids=recordOccurrenceIds(row);if(intersects(ids,planOccurrenceLookup)&&!intersects(ids,activeLookup)&&(row.projectionManaged===true||text(row.sourceType).indexOf('cleaning-')===0))updates['calendarEvents/'+key]=null;});

    return{updates:updates,createdTasks:createdTasks,createdCalendarEvents:createdCalendarEvents,linkedOccurrences:linked,expectedOccurrences:linked,groupCount:groups.length,complete:true};
  }

  function emit(detail){state.lastResult=clone(detail||{});state.lastError=detail&&detail.error||null;try{window.dispatchEvent(new CustomEvent('familyapp:cleaning-projections',{detail:clone(detail||{})}));}catch(e){}}

  function reconcilePlan(planId){
    planId=String(planId||'');if(!planId)return Promise.resolve(null);if(state.inFlight[planId])return state.inFlight[planId];
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
  function attach(){var repo=repository();if(!repo||typeof repo.subscribe!=='function')return false;if(state.unsubscribe)return true;state.unsubscribe=repo.subscribe(function(snapshot){reconcileSnapshot(snapshot);});try{if(repo.snapshot)reconcileSnapshot(repo.snapshot());}catch(e){}return true;}
  function start(){if(attach())return true;if(state.attachTimer)return false;var tries=0;state.attachTimer=setInterval(function(){tries++;if(attach()||tries>240){clearInterval(state.attachTimer);state.attachTimer=null;}},100);return false;}
  function stop(){if(state.unsubscribe){try{state.unsubscribe();}catch(e){}state.unsubscribe=null;}if(state.attachTimer){clearInterval(state.attachTimer);state.attachTimer=null;}state.inFlight={};}

  window.CleaningProjectionService={version:VERSION,start:start,stop:stop,reconcilePlan:reconcilePlan,status:function(){return clone({version:VERSION,lastError:state.lastError,lastResult:state.lastResult,inFlight:Object.keys(state.inFlight)});},_buildProjectionUpdates:buildProjectionUpdates,_taskIdForOccurrence:projectionTaskId,_calendarIdForOccurrence:projectionCalendarId,_groupProjectionId:groupProjectionId};
  window.addEventListener('familyapp:cleaning-repository',function(){start();try{var repo=repository();if(repo&&repo.snapshot)reconcileSnapshot(repo.snapshot());}catch(e){}});window.addEventListener('familyapp:household-context',start);start();
})();
