'use strict';
// ============================================================
// CLEANING PROJECTION SERVICE v0.1.0
// One-way materialization of ACTIVE CleaningOccurrence records into the
// canonical Task and Calendar stores. CleaningOccurrence remains authority.
// Projection IDs are deterministic and stored back on each occurrence.
// ============================================================
(function(){
  if(window.CleaningProjectionService)return;

  var VERSION='0.1.0';
  var state={unsubscribe:null,attachTimer:null,inFlight:{},lastError:null,lastResult:null,uiObserver:null,uiQueued:false};
  var INVALID_KEY=/[.#$\[\]\/\u0000-\u001F\u007F]/g;

  function clone(value){if(value===undefined)return undefined;try{return JSON.parse(JSON.stringify(value));}catch(e){return value;}}
  function text(value){return String(value==null?'':value).trim();}
  function safeKey(value){return text(value).replace(INVALID_KEY,'_');}
  function now(){return Date.now();}
  function ctx(){try{return window.HouseholdContext&&typeof window.HouseholdContext.snapshot==='function'?window.HouseholdContext.snapshot():null;}catch(e){return null;}}
  function capture(){try{return window.HouseholdContext&&typeof window.HouseholdContext.capture==='function'?window.HouseholdContext.capture():null;}catch(e){return null;}}
  function isCurrent(token){try{return !!(window.HouseholdContext&&typeof window.HouseholdContext.isCurrent==='function'&&window.HouseholdContext.isCurrent(token));}catch(e){return false;}}
  function db(){try{return window.fbDb||(window.firebase&&window.firebase.database&&window.firebase.database())||null;}catch(e){return null;}}
  function repository(){return window.CleaningHouseholdRepository||null;}

  function validContext(value){return !!(value&&value.ready===true&&value.uid&&value.householdId);}
  function pad(value){return value<10?'0'+value:String(value);}
  function localDate(timestamp){var d=new Date(Number(timestamp)||now());return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());}
  function localTime(timestamp){var d=new Date(Number(timestamp)||now());return pad(d.getHours())+':'+pad(d.getMinutes());}
  function startOfLocalDay(timestamp){var d=new Date(Number(timestamp)||now());d.setHours(0,0,0,0);return d.getTime();}
  function clamp(value,min,max){return Math.max(min,Math.min(max,value));}

  function members(){
    try{
      var bridge=window.HouseholdIdentityFirebaseBridge;
      var rows=bridge&&typeof bridge.getMembers==='function'?bridge.getMembers():[];
      return Array.isArray(rows)?rows.map(clone):[];
    }catch(e){return [];}
  }
  function memberName(uid,list){
    var wanted=String(uid||'');
    var found=(Array.isArray(list)?list:[]).find(function(row){return String(row&&(row.uid||row.id)||'')===wanted;});
    return found?String(found.displayName||found.name||'Gezinslid'):'Gezinslid';
  }
  function roomName(cleaning,roomId){
    var room=cleaning&&cleaning.rooms&&cleaning.rooms[roomId];
    return room&&room.name?String(room.name):'Schoonmaken';
  }
  function assignedUid(occurrence){
    var ids=occurrence&&Array.isArray(occurrence.assignmentUids)?occurrence.assignmentUids.filter(Boolean).map(String):[];
    if(ids.length!==1)throw new Error('CLEANING_PROJECTION_ASSIGNMENT_INVALID');
    return ids[0];
  }
  function projectionTaskId(occurrenceId){return 'cleaning_'+safeKey(occurrenceId);}
  function projectionTaskKey(occurrenceId){return 'cleaning_'+safeKey(occurrenceId);}
  function projectionCalendarId(occurrenceId){return 'cleaning_'+safeKey(occurrenceId);}
  function projectionCalendarKey(occurrenceId){return 'id_'+projectionCalendarId(occurrenceId);}

  function taskIdentity(row,key){return String(row&&(row.id||row._key)||key||'');}
  function eventIdentity(row,key){return String(row&&(row.id||row._key)||key||'');}
  function findProjectionRecord(map,occurrenceId,preferredId,isCalendar){
    var source=map&&typeof map==='object'?map:{};
    var keys=Object.keys(source);
    var preferred=String(preferredId||'');
    for(var i=0;i<keys.length;i++){
      var key=keys[i],row=source[key];
      if(!row||typeof row!=='object')continue;
      var identity=isCalendar?eventIdentity(row,key):taskIdentity(row,key);
      if(preferred&&identity===preferred)return{key:key,row:row,id:identity};
      if(String(row.cleaningOccurrenceId||row.sourceId||'')===String(occurrenceId))return{key:key,row:row,id:identity};
    }
    return null;
  }

  function occurrenceDateTime(plan,occurrence,timestamp){
    var scheduled=Number(occurrence.scheduledStartAt)||0;
    if(scheduled>0)return{date:localDate(scheduled),time:localTime(scheduled),flexible:false,anchorAt:scheduled};
    var windowStart=Number(plan.windowStartAt)||startOfLocalDay(timestamp);
    var windowEnd=Number(plan.windowEndAt)||windowStart+7*86400000;
    var activeDay=startOfLocalDay(Number(plan.activatedAt)||timestamp);
    var minAt=Math.max(windowStart,activeDay);
    var maxAt=Math.max(minAt,windowEnd-1);
    var due=Number(occurrence.earliestDueAt)||Number(occurrence.latestDueAt)||minAt;
    var anchor=clamp(due,minAt,maxAt);
    return{date:localDate(anchor),time:'',flexible:true,anchorAt:anchor};
  }

  function priorityFor(occurrence){
    var values=(Array.isArray(occurrence&&occurrence.checklist)?occurrence.checklist:[]).map(function(item){return String(item&&item.priority||'NORMAL').toUpperCase();});
    if(values.indexOf('EXTRA')>=0)return'hoog';
    if(values.indexOf('NORMAL')>=0)return'normaal';
    return'laag';
  }

  function subtaskRows(occurrence){
    return (Array.isArray(occurrence&&occurrence.checklist)?occurrence.checklist:[]).map(function(item,index){
      var id=text(item&&(item.routineItemId||item.id))||('item_'+index);
      return{
        id:id,
        title:text(item&&item.title)||'Schoonmaakonderdeel',
        done:!!(item&&item.completed),
        completed:!!(item&&item.completed),
        sourceRoutineItemId:id,
        estimatedMinutes:Number(item&&item.estimatedMinutes)||0,
        priority:text(item&&item.priority)||'NORMAL'
      };
    });
  }

  function taskRecord(input){
    var plan=input.plan,occurrence=input.occurrence,occurrenceId=input.occurrenceId,householdId=input.householdId,actorUid=input.actorUid,timestamp=input.timestamp;
    var uid=assignedUid(occurrence),when=occurrenceDateTime(plan,occurrence,timestamp),room=input.roomName,display=memberName(uid,input.members);
    var id=projectionTaskId(occurrenceId),key=projectionTaskKey(occurrenceId),createdAt=Number(occurrence.activatedAt)||Number(plan.activatedAt)||timestamp,createdBy=text(plan.activatedByUid||plan.generatedByUid||actorUid)||actorUid;
    return{
      id:id,_key:key,householdId:householdId,
      type:'SIDE QUEST',category:'cleaning',title:'Schoonmaken · '+room,
      description:(when.flexible?'Flexibel deze week':'Gepland')+' · '+(Number(occurrence.estimatedMinutes)||0)+' min',
      date:when.date,dueDate:when.date,time:when.time,
      assignedToUid:uid,assignedToUids:(function(){var out={};out[uid]=true;return out;})(),who:[display],
      xpReward:'+10 XP',xp:'+10 XP',priority:priorityFor(occurrence),prio:priorityFor(occurrence),
      recurrence:'once',repeat:'once',subtasks:subtaskRows(occurrence),helpers:[],progress:0,done:false,status:'open',
      sourceType:'cleaning-occurrence',sourceId:occurrenceId,cleaningOccurrenceId:occurrenceId,cleaningPlanId:String(plan.id||''),projectionManaged:true,projectionVersion:1,
      createdAt:createdAt,createdByUid:createdBy,updatedAt:timestamp,updatedByUid:actorUid,schemaVersion:2
    };
  }

  function calendarRecord(input){
    var plan=input.plan,occurrence=input.occurrence,occurrenceId=input.occurrenceId,householdId=input.householdId,actorUid=input.actorUid,timestamp=input.timestamp;
    var uid=assignedUid(occurrence),when=occurrenceDateTime(plan,occurrence,timestamp),room=input.roomName,display=memberName(uid,input.members);
    var id=projectionCalendarId(occurrenceId),key=projectionCalendarKey(occurrenceId),createdAt=Number(occurrence.activatedAt)||Number(plan.activatedAt)||timestamp,createdBy=text(plan.activatedByUid||plan.generatedByUid||actorUid)||actorUid;
    var checklist=subtaskRows(occurrence).map(function(item){return item.title;});
    return{
      id:id,_key:key,householdId:householdId,title:'Schoonmaken · '+room,date:when.date,time:when.time,
      description:(when.flexible?'Flexibel deze week. ':'')+(Number(occurrence.estimatedMinutes)||0)+' min'+(checklist.length?' · '+checklist.join(', '):''),
      color:'#7c3aed',who:display,assignedToUid:uid,flexible:when.flexible,_imported:false,
      sourceType:'cleaning-occurrence',sourceId:occurrenceId,cleaningOccurrenceId:occurrenceId,cleaningPlanId:String(plan.id||''),projectionManaged:true,projectionVersion:1,
      createdAt:createdAt,createdByUid:createdBy,updatedAt:timestamp,updatedByUid:actorUid,schemaVersion:2
    };
  }

  function buildProjectionUpdates(input){
    var family=input&&input.family&&typeof input.family==='object'?input.family:{};
    var cleaning=family.cleaning&&typeof family.cleaning==='object'?family.cleaning:{};
    var tasks=family.tasks&&typeof family.tasks==='object'?family.tasks:{};
    var calendarEvents=family.calendarEvents&&typeof family.calendarEvents==='object'?family.calendarEvents:{};
    var planId=String(input&&input.planId||'');
    var plan=cleaning.plans&&cleaning.plans[planId];
    var householdId=String(input&&input.householdId||'');
    var actorUid=String(input&&input.actorUid||'');
    var timestamp=Number(input&&input.timestamp)||now();
    var memberRows=Array.isArray(input&&input.members)?input.members:[];
    if(!plan||typeof plan!=='object'||plan.status!=='ACTIVE')return{updates:{},createdTasks:0,createdCalendarEvents:0,linkedOccurrences:0,expectedOccurrences:0,complete:false};
    if(plan.householdId&&String(plan.householdId)!==householdId)throw new Error('CLEANING_PROJECTION_HOUSEHOLD_CONFLICT');

    var occurrenceIds=Array.isArray(plan.occurrenceIds)?plan.occurrenceIds.map(String):[];
    var updates={},createdTasks=0,createdCalendarEvents=0,linkedOccurrences=0,projectableOccurrences=0;
    occurrenceIds.forEach(function(occurrenceId){
      var occurrence=cleaning.occurrences&&cleaning.occurrences[occurrenceId];
      if(!occurrence||typeof occurrence!=='object')throw new Error('CLEANING_PROJECTION_OCCURRENCE_NOT_FOUND');
      if(String(occurrence.planId||'')!==planId)throw new Error('CLEANING_PROJECTION_PLAN_MISMATCH');
      if(occurrence.status==='CANCELLED'||occurrence.status==='COMPLETED'||occurrence.status==='SKIPPED')return;
      if(occurrence.assignmentStatus!=='ACTIVE'&&occurrence.assignmentStatus!=='ACCEPTED')return;
      projectableOccurrences++;

      var projections=occurrence.projections&&typeof occurrence.projections==='object'?occurrence.projections:{};
      var taskFound=findProjectionRecord(tasks,occurrenceId,projections.taskId,false);
      var calendarFound=findProjectionRecord(calendarEvents,occurrenceId,projections.calendarEventId,true);
      var room=roomName(cleaning,occurrence.roomId);

      if(!taskFound){
        var task=taskRecord({plan:plan,occurrence:occurrence,occurrenceId:occurrenceId,householdId:householdId,actorUid:actorUid,timestamp:timestamp,members:memberRows,roomName:room});
        updates['tasks/'+task._key]=task;
        taskFound={key:task._key,row:task,id:task.id};
        createdTasks++;
      }
      if(!calendarFound){
        var event=calendarRecord({plan:plan,occurrence:occurrence,occurrenceId:occurrenceId,householdId:householdId,actorUid:actorUid,timestamp:timestamp,members:memberRows,roomName:room});
        updates['calendarEvents/'+event._key]=event;
        calendarFound={key:event._key,row:event,id:event.id};
        createdCalendarEvents++;
      }

      var currentTaskId=text(projections.taskId),currentCalendarId=text(projections.calendarEventId);
      if(currentTaskId!==String(taskFound.id))updates['cleaning/occurrences/'+occurrenceId+'/projections/taskId']=String(taskFound.id);
      if(currentCalendarId!==String(calendarFound.id))updates['cleaning/occurrences/'+occurrenceId+'/projections/calendarEventId']=String(calendarFound.id);
      if(Number(projections.version)!==1)updates['cleaning/occurrences/'+occurrenceId+'/projections/version']=1;
      if(!Number(projections.projectedAt))updates['cleaning/occurrences/'+occurrenceId+'/projections/projectedAt']=timestamp;
      if(!text(projections.projectedByUid))updates['cleaning/occurrences/'+occurrenceId+'/projections/projectedByUid']=actorUid;
      linkedOccurrences++;
    });

    return{
      updates:updates,
      createdTasks:createdTasks,
      createdCalendarEvents:createdCalendarEvents,
      linkedOccurrences:linkedOccurrences,
      expectedOccurrences:projectableOccurrences,
      complete:linkedOccurrences===projectableOccurrences
    };
  }

  function setText(node,value){if(node&&node.textContent!==value)node.textContent=value;}
  function latestActivePlan(snapshot){
    var plans=snapshot&&snapshot.data&&snapshot.data.plans;
    if(!plans||typeof plans!=='object')return null;
    return Object.keys(plans).map(function(id){return Object.assign({id:id},plans[id]||{});}).filter(function(plan){return plan.status==='ACTIVE';}).sort(function(a,b){return Number(b.windowStartAt||0)-Number(a.windowStartAt||0);})[0]||null;
  }
  function projectionProgress(snapshot,plan){
    var occurrences=snapshot&&snapshot.data&&snapshot.data.occurrences||{},expected=0,linked=0;
    (Array.isArray(plan&&plan.occurrenceIds)?plan.occurrenceIds:[]).forEach(function(id){
      var row=occurrences[id];
      if(!row||row.status==='CANCELLED'||row.status==='COMPLETED'||row.status==='SKIPPED')return;
      expected++;
      var projections=row.projections&&typeof row.projections==='object'?row.projections:{};
      if(projections.taskId&&projections.calendarEventId)linked++;
    });
    return{expected:expected,linked:linked,complete:expected>0&&linked===expected};
  }
  function decorateProjectionUi(){
    state.uiQueued=false;
    if(typeof document==='undefined')return;
    var screen=document.getElementById('screen-cleaning');
    if(!screen||!screen.classList.contains('active'))return;
    var repo=repository(),snapshot=repo&&typeof repo.snapshot==='function'?repo.snapshot():null,plan=latestActivePlan(snapshot);
    if(!plan)return;
    var progress=projectionProgress(snapshot,plan),root=document.getElementById('cleaning-content');
    if(!root)return;
    var copy=root.querySelector('.cleaning-approval-copy');
    var heroCopy=root.querySelector('.cleaning-plan-actions > span');
    var count=root.querySelector('.cleaning-approval-count');
    var message=progress.complete
      ? 'Weekplan actief. Alle '+progress.linked+' schoonmaakbeurten staan nu gekoppeld in Taken en Agenda.'
      : 'Weekplan actief. Taken en Agenda worden gekoppeld… '+progress.linked+' van '+progress.expected+' klaar.';
    setText(copy,message);
    setText(heroCopy,progress.complete?'Actief · gekoppeld aan Taken en Agenda.':'Actief · Taken en Agenda worden gekoppeld…');
    if(progress.complete)setText(count,'Taken + Agenda ✓');
  }
  function queueUiDecorate(){
    if(state.uiQueued)return;
    state.uiQueued=true;
    var schedule=window.requestAnimationFrame||function(fn){return setTimeout(fn,0);};
    schedule(function(){schedule(decorateProjectionUi);});
  }
  function installUiObserver(){
    if(state.uiObserver||typeof MutationObserver==='undefined'||typeof document==='undefined')return;
    var target=document.getElementById('screen-cleaning')||document.documentElement;
    if(!target)return;
    state.uiObserver=new MutationObserver(queueUiDecorate);
    state.uiObserver.observe(target,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
  }

  function emit(detail){
    state.lastResult=clone(detail||{});
    state.lastError=detail&&detail.error||null;
    try{window.dispatchEvent(new CustomEvent('familyapp:cleaning-projections',{detail:clone(detail||{})}));}catch(e){}
    queueUiDecorate();
  }

  function reconcilePlan(planId){
    planId=String(planId||'');
    if(!planId)return Promise.resolve(null);
    if(state.inFlight[planId])return state.inFlight[planId];
    var context=ctx(),database=db(),token=capture();
    if(!validContext(context)||!database||!token||!isCurrent(token))return Promise.resolve(null);
    var familyRef=database.ref('families/'+context.householdId);
    var work=Promise.all([
      familyRef.child('cleaning').once('value'),
      familyRef.child('tasks').once('value'),
      familyRef.child('calendarEvents').once('value')
    ]).then(function(snaps){
      if(!isCurrent(token))throw new Error('CLEANING_PROJECTION_CONTEXT_CHANGED');
      var family={
        cleaning:snaps[0]&&snaps[0].val?snaps[0].val():{},
        tasks:snaps[1]&&snaps[1].val?snaps[1].val():{},
        calendarEvents:snaps[2]&&snaps[2].val?snaps[2].val():{}
      };
      var result=buildProjectionUpdates({family:family,planId:planId,householdId:context.householdId,actorUid:context.uid,timestamp:now(),members:members()});
      var keys=Object.keys(result.updates);
      if(!keys.length){emit(Object.assign({planId:planId,status:'synced'},result));return result;}
      return familyRef.update(result.updates).then(function(){
        if(!isCurrent(token))throw new Error('CLEANING_PROJECTION_CONTEXT_CHANGED_AFTER_WRITE');
        emit(Object.assign({planId:planId,status:'projected'},result));
        return result;
      });
    }).catch(function(error){
      emit({planId:planId,status:'error',error:error&&error.message||String(error)});
      throw error;
    }).finally(function(){delete state.inFlight[planId];});
    state.inFlight[planId]=work;
    return work;
  }

  function eligibleActivePlans(snapshot){
    var plans=snapshot&&snapshot.data&&snapshot.data.plans;
    if(!plans||typeof plans!=='object')return[];
    var cutoff=now()-86400000;
    return Object.keys(plans).filter(function(id){var plan=plans[id];return plan&&plan.status==='ACTIVE'&&Number(plan.windowEndAt||0)>=cutoff;});
  }

  function reconcileSnapshot(snapshot){
    eligibleActivePlans(snapshot).forEach(function(planId){reconcilePlan(planId).catch(function(){});});
  }

  function attach(){
    var repo=repository();
    if(!repo||typeof repo.subscribe!=='function')return false;
    if(state.unsubscribe)return true;
    state.unsubscribe=repo.subscribe(function(snapshot){reconcileSnapshot(snapshot);});
    try{if(typeof repo.snapshot==='function')reconcileSnapshot(repo.snapshot());}catch(e){}
    return true;
  }

  function start(){
    installUiObserver();
    queueUiDecorate();
    if(attach())return true;
    if(state.attachTimer)return false;
    var tries=0;
    state.attachTimer=setInterval(function(){tries++;if(attach()||tries>240){clearInterval(state.attachTimer);state.attachTimer=null;}},100);
    return false;
  }

  function stop(){
    if(state.unsubscribe){try{state.unsubscribe();}catch(e){}state.unsubscribe=null;}
    if(state.attachTimer){clearInterval(state.attachTimer);state.attachTimer=null;}
    if(state.uiObserver){try{state.uiObserver.disconnect();}catch(e){}state.uiObserver=null;}
    state.inFlight={};
  }

  window.CleaningProjectionService={
    version:VERSION,start:start,stop:stop,reconcilePlan:reconcilePlan,status:function(){return clone({version:VERSION,lastError:state.lastError,lastResult:state.lastResult,inFlight:Object.keys(state.inFlight)});},
    _buildProjectionUpdates:buildProjectionUpdates,
    _taskIdForOccurrence:projectionTaskId,
    _calendarIdForOccurrence:projectionCalendarId
  };

  window.addEventListener('familyapp:cleaning-repository',function(){start();try{var repo=repository();if(repo&&repo.snapshot)reconcileSnapshot(repo.snapshot());}catch(e){}});
  window.addEventListener('familyapp:household-context',start);
  window.addEventListener('familyapp:cleaning-projections',queueUiDecorate);
  start();
})();
