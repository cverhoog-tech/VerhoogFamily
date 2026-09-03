'use strict';
// ============================================================
// CLEANING EXECUTION WRITE RUNTIME v0.1.0
// Replaces the first execution-sync repository wrappers with a rules-safe
// two-phase boundary:
//   1. transaction at families/{householdId}/cleaning (canonical authority)
//   2. atomic multi-location update of Task/Calendar projections
// The projection phase is repairable and never becomes cleaning authority.
// ============================================================
(function(){
  if(window.CleaningExecutionWriteRuntime)return;

  var VERSION='0.1.0';
  var state={installTimer:null,taskInstalled:false,calendarInstalled:false,inFlight:{},lastResult:null,lastError:null};

  function clone(value){if(value===undefined)return undefined;try{return JSON.parse(JSON.stringify(value));}catch(error){return value;}}
  function text(value){return String(value==null?'':value).trim();}
  function now(){return Date.now();}
  function contextSnapshot(){try{return window.HouseholdContext&&window.HouseholdContext.snapshot?window.HouseholdContext.snapshot():null;}catch(error){return null;}}
  function captureContext(){try{return window.HouseholdContext&&window.HouseholdContext.capture?window.HouseholdContext.capture():null;}catch(error){return null;}}
  function contextIsCurrent(token){try{return !!(window.HouseholdContext&&window.HouseholdContext.isCurrent&&window.HouseholdContext.isCurrent(token));}catch(error){return false;}}
  function firebaseDb(){try{return window.fbDb||(window.firebase&&window.firebase.database&&window.firebase.database())||null;}catch(error){return null;}}
  function baseSync(){return window.CleaningExecutionSync||null;}
  function taskRepository(){return window.TaskHouseholdRepository||window.TaskRepository||null;}
  function calendarRepository(){return window.CalendarEventHouseholdRepository||window.CalendarEventRepository||null;}
  function validContext(value){return !!(value&&value.ready===true&&value.uid&&value.householdId);}

  function unwrap(fn){
    var current=fn,seen=[];
    while(current&&current.__raw&&seen.indexOf(current)<0){seen.push(current);current=current.__raw;}
    return current;
  }

  function localTaskRecord(id){
    var repo=taskRepository(),wanted=text(id),rows=[];
    try{rows=repo&&repo.list?repo.list():(window.taskData||[]);}catch(error){rows=[];}
    for(var i=0;i<rows.length;i++){
      var row=rows[i];
      if(!row)continue;
      if(text(row.id)===wanted||text(row._key)===wanted)return{key:text(row._key)||text(row.id),row:clone(row)};
    }
    return null;
  }

  function localCalendarRecord(id){
    var repo=calendarRepository(),wanted=text(id),row=null;
    try{row=repo&&repo.get?repo.get(id):null;}catch(error){row=null;}
    if(row)return{key:text(row._key)||text(row.id)||wanted,row:clone(row)};
    try{
      var rows=repo&&repo.list?repo.list():[];
      for(var i=0;i<rows.length;i++)if(text(rows[i]&&rows[i].id)===wanted||text(rows[i]&&rows[i]._key)===wanted)return{key:text(rows[i]._key)||text(rows[i].id),row:clone(rows[i])};
    }catch(error){}
    return null;
  }

  function sourceRecord(kind,id){return kind==='task'?localTaskRecord(id):localCalendarRecord(id);}

  function requireWriteContext(){
    var ctx=contextSnapshot(),database=firebaseDb(),token=captureContext();
    if(!validContext(ctx))throw new Error('ACTIVE_HOUSEHOLD_REQUIRED');
    if(!database)throw new Error('FIREBASE_DATABASE_UNAVAILABLE');
    if(!token||!contextIsCurrent(token))throw new Error('HOUSEHOLD_CONTEXT_CHANGED');
    return{ctx:ctx,database:database,token:token,familyPath:'families/'+ctx.householdId,cleaningPath:'families/'+ctx.householdId+'/cleaning'};
  }

  function subtaskKey(item,index,onlyOccurrenceId){
    var occurrenceId=text(item&&item.cleaningOccurrenceId)||text(onlyOccurrenceId);
    var routineId=text(item&&(item.sourceRoutineItemId||item.routineItemId||item.id))||('item_'+index);
    return occurrenceId+'|'+routineId;
  }

  function canonicalChecklistStates(cleaning,occurrenceIds){
    var out={},occurrences=cleaning&&cleaning.occurrences||{};
    occurrenceIds.forEach(function(occurrenceId){
      var row=occurrences[occurrenceId];
      (Array.isArray(row&&row.checklist)?row.checklist:[]).forEach(function(item,index){
        var routineId=text(item&&(item.routineItemId||item.id))||('item_'+index);
        out[occurrenceId+'|'+routineId]=item&&item.completed===true;
      });
    });
    return out;
  }

  function checkboxState(item){return !!(item&&(item.done===true||item.completed===true));}

  function transactionPatch(kind,sourceRow,patch,serverCleaning,occurrenceIds){
    var next=clone(patch||{})||{};
    if(kind!=='task'||!Array.isArray(next.subtasks)||!Array.isArray(sourceRow&&sourceRow.subtasks))return next;

    var onlyOccurrence=occurrenceIds.length===1?occurrenceIds[0]:null;
    var before={},canonical=canonicalChecklistStates(serverCleaning,occurrenceIds);
    sourceRow.subtasks.forEach(function(item,index){before[subtaskKey(item,index,onlyOccurrence)]=checkboxState(item);});

    next.subtasks=next.subtasks.map(function(item,index){
      var copy=clone(item)||{},key=subtaskKey(copy,index,onlyOccurrence);
      // Preserve another device's newer canonical value for checklist entries
      // that this user did not actually toggle. Cosmetic changes such as an
      // icon still remain in the submitted Task projection.
      if(Object.prototype.hasOwnProperty.call(before,key)&&before[key]===checkboxState(copy)&&Object.prototype.hasOwnProperty.call(canonical,key)){
        copy.done=canonical[key];copy.completed=canonical[key];
      }
      return copy;
    });
    return next;
  }

  function seedFamily(kind,cleaning,record){
    var family={cleaning:clone(cleaning)||{},tasks:{},calendarEvents:{}};
    if(kind==='task')family.tasks[record.key]=clone(record.row);
    else family.calendarEvents[record.key]=clone(record.row);
    return family;
  }

  function applyTransition(kind,cleaning,record,patch,write,timestamp){
    var sync=baseSync();
    if(!sync||typeof sync._isCleaningProjection!=='function'||typeof sync._recordOccurrenceIds!=='function')throw new Error('CLEANING_EXECUTION_RUNTIME_NOT_READY');
    if(!sync._isCleaningProjection(record.row))throw new Error('CLEANING_EXECUTION_PROJECTION_NOT_FOUND');
    var occurrenceIds=sync._recordOccurrenceIds(record.row),safePatch=transactionPatch(kind,record.row,patch,cleaning,occurrenceIds);
    var family=seedFamily(kind,cleaning,record);
    var result=kind==='task'
      ?sync._applyTaskPatchToFamily({family:family,taskId:record.row.id||record.key,patch:safePatch,householdId:write.ctx.householdId,actorUid:write.ctx.uid,timestamp:timestamp})
      :sync._applyCalendarPatchToFamily({family:family,eventId:record.row.id||record.key,patch:safePatch,householdId:write.ctx.householdId,actorUid:write.ctx.uid,timestamp:timestamp});
    if(!result||result.handled!==true)throw new Error('CLEANING_EXECUTION_PROJECTION_NOT_FOUND');
    result.safePatch=safePatch;
    return result;
  }

  function onceValue(ref){return ref.once('value').then(function(snapshot){return snapshot&&snapshot.val?snapshot.val():null;});}

  function rowTouches(sync,row,occurrenceLookup){
    return !!(row&&sync._recordOccurrenceIds(row).some(function(id){return !!occurrenceLookup[id];}));
  }

  function projectionUpdates(before,after,occurrenceIds){
    var sync=baseSync(),lookup={},updates={};
    occurrenceIds.forEach(function(id){lookup[id]=true;});
    ['tasks','calendarEvents'].forEach(function(collection){
      var oldMap=before[collection]&&typeof before[collection]==='object'?before[collection]:{};
      var newMap=after[collection]&&typeof after[collection]==='object'?after[collection]:{};
      Object.keys(newMap).forEach(function(key){
        var row=newMap[key];
        if(!rowTouches(sync,row,lookup))return;
        if(JSON.stringify(oldMap[key]||null)!==JSON.stringify(row))updates[collection+'/'+key]=row;
      });
    });
    return updates;
  }

  function ensureRecordInMap(kind,map,record){
    var source=map&&typeof map==='object'?map:{};
    var found=false,wanted=text(record.row&&record.row.id)||record.key;
    Object.keys(source).forEach(function(key){var row=source[key];if(key===record.key||text(row&&row.id)===wanted||text(row&&row._key)===wanted)found=true;});
    if(!found)source[record.key]=clone(record.row);
    return source;
  }

  function rebuildDerived(kind,record,patch,write,timestamp,cleaning){
    var familyRef=write.database.ref(write.familyPath);
    return Promise.all([onceValue(familyRef.child('tasks')),onceValue(familyRef.child('calendarEvents'))]).then(function(values){
      if(!contextIsCurrent(write.token))throw new Error('HOUSEHOLD_CONTEXT_CHANGED_AFTER_WRITE');
      var before={tasks:values[0]&&typeof values[0]==='object'?values[0]:{},calendarEvents:values[1]&&typeof values[1]==='object'?values[1]:{}};
      before.tasks=ensureRecordInMap(kind==='task'?'task':'none',before.tasks,kind==='task'?record:{key:'',row:null});
      before.calendarEvents=ensureRecordInMap(kind==='calendar'?'calendar':'none',before.calendarEvents,kind==='calendar'?record:{key:'',row:null});
      if(kind!=='task'&&before.tasks[''])delete before.tasks[''];
      if(kind!=='calendar'&&before.calendarEvents[''])delete before.calendarEvents[''];

      var family={cleaning:clone(cleaning)||{},tasks:clone(before.tasks)||{},calendarEvents:clone(before.calendarEvents)||{}};
      var sync=baseSync(),occurrenceIds=sync._recordOccurrenceIds(record.row),safePatch=transactionPatch(kind,record.row,patch,cleaning,occurrenceIds);
      var result=kind==='task'
        ?sync._applyTaskPatchToFamily({family:family,taskId:record.row.id||record.key,patch:safePatch,householdId:write.ctx.householdId,actorUid:write.ctx.uid,timestamp:timestamp})
        :sync._applyCalendarPatchToFamily({family:family,eventId:record.row.id||record.key,patch:safePatch,householdId:write.ctx.householdId,actorUid:write.ctx.uid,timestamp:timestamp});
      if(!result||result.handled!==true)throw new Error('CLEANING_EXECUTION_PROJECTION_NOT_FOUND');
      var updates=projectionUpdates(before,result.family,occurrenceIds),keys=Object.keys(updates);
      return (keys.length?familyRef.update(updates):Promise.resolve()).then(function(){
        return{saved:kind==='task'?result.task:result.event,occurrenceIds:occurrenceIds,updates:updates};
      });
    });
  }

  function planIdsFor(cleaning,occurrenceIds){
    var out=[],occurrences=cleaning&&cleaning.occurrences||{};
    occurrenceIds.forEach(function(id){var planId=text(occurrences[id]&&occurrences[id].planId);if(planId&&out.indexOf(planId)<0)out.push(planId);});
    return out;
  }

  function scheduleProjectionRepair(planIds){
    var service=window.CleaningProjectionService;
    if(!service||typeof service.reconcilePlan!=='function')return;
    window.setTimeout(function(){
      planIds.forEach(function(planId){
        Promise.resolve(service.reconcilePlan(planId)).then(function(){return service.reconcilePlan(planId);}).catch(function(error){try{console.warn('[CleaningExecutionWriteRuntime] projection repair failed',error);}catch(ignore){}});
      });
    },0);
  }

  function emit(detail){
    state.lastResult=clone(detail||{});state.lastError=null;
    try{window.dispatchEvent(new CustomEvent('familyapp:cleaning-execution-synced',{detail:clone(detail||{})}));}catch(error){}
  }

  function transact(kind,id,patch){
    var write;
    try{write=requireWriteContext();}catch(error){return Promise.reject(error);}
    var sync=baseSync(),record=sourceRecord(kind,id);
    if(!sync||!record||!sync._isCleaningProjection(record.row))return Promise.reject(new Error('CLEANING_EXECUTION_PROJECTION_NOT_FOUND'));

    var key=kind+'|'+text(id);
    if(state.inFlight[key])return state.inFlight[key];
    var timestamp=now(),transition=null,transitionError=null;
    var cleaningRef=write.database.ref(write.cleaningPath);

    var work=cleaningRef.transaction(function(serverCleaning){
      if(!contextIsCurrent(write.token)){transitionError=new Error('HOUSEHOLD_CONTEXT_CHANGED');return;}
      try{
        transitionError=null;
        transition=applyTransition(kind,serverCleaning||{},record,patch||{},write,timestamp);
        return transition.family.cleaning;
      }catch(error){transitionError=error;return;}
    }).then(function(result){
      if(transitionError)throw transitionError;
      if(!contextIsCurrent(write.token))throw new Error('HOUSEHOLD_CONTEXT_CHANGED_AFTER_WRITE');
      if(!result||result.committed!==true||!transition)throw new Error('CLEANING_EXECUTION_WRITE_NOT_COMMITTED');
      var cleaning=result.snapshot&&result.snapshot.val?result.snapshot.val():transition.family.cleaning;
      var occurrenceIds=sync._recordOccurrenceIds(record.row),planIds=planIdsFor(cleaning,occurrenceIds);
      return rebuildDerived(kind,record,patch||{},write,timestamp,cleaning).then(function(derived){
        scheduleProjectionRepair(planIds);
        var detail={kind:kind,id:text(id),occurrenceIds:occurrenceIds,planIds:planIds,timestamp:timestamp,projectionState:'updated'};
        emit(detail);
        return derived.saved||(kind==='task'?transition.task:transition.event);
      }).catch(function(projectionError){
        // Canonical cleaning state has already committed. Do not claim the user
        // action failed solely because a derived view needs repair.
        scheduleProjectionRepair(planIds);
        state.lastError='PROJECTION_REPAIR_PENDING: '+text(projectionError&&projectionError.message||projectionError);
        var detail={kind:kind,id:text(id),occurrenceIds:occurrenceIds,planIds:planIds,timestamp:timestamp,projectionState:'repair-pending'};
        try{window.dispatchEvent(new CustomEvent('familyapp:cleaning-execution-synced',{detail:clone(detail)}));}catch(error){}
        return kind==='task'?transition.task:transition.event;
      });
    }).catch(function(error){state.lastError=text(error&&error.message||error);throw error;}).finally(function(){delete state.inFlight[key];});

    state.inFlight[key]=work;
    return work;
  }

  function userMessage(error){
    var sync=baseSync();
    return sync&&typeof sync.userMessage==='function'?sync.userMessage(error):text(error&&error.message||error)||'Schoonmaakwijziging kon niet worden opgeslagen.';
  }

  function installTaskRepository(){
    var repo=taskRepository();
    if(!repo||typeof repo.updateOne!=='function'||typeof repo.remove!=='function')return false;
    if(repo.updateOne.__cleaningExecutionWriteRuntime){state.taskInstalled=true;return true;}
    var rawUpdate=unwrap(repo.updateOne),rawRemove=unwrap(repo.remove);
    var wrappedUpdate=function(id,patch){var record=localTaskRecord(id),sync=baseSync();if(!record||!sync||!sync._isCleaningProjection(record.row))return rawUpdate.call(repo,id,patch||{});return transact('task',id,patch||{}).catch(function(error){throw new Error(userMessage(error));});};
    wrappedUpdate.__cleaningExecutionWriteRuntime=true;wrappedUpdate.__cleaningExecutionSync=true;wrappedUpdate.__raw=rawUpdate;repo.updateOne=wrappedUpdate;
    var wrappedRemove=function(id){var record=localTaskRecord(id),sync=baseSync();if(!record||!sync||!sync._isCleaningProjection(record.row))return rawRemove.call(repo,id);if(typeof window.showToast==='function')window.showToast('Schoonmaaktaak verwijderen kan niet via Taken. Pas de routine aan bij Schoonmaken.');return Promise.resolve(false);};
    wrappedRemove.__cleaningExecutionWriteRuntime=true;wrappedRemove.__cleaningExecutionSync=true;wrappedRemove.__raw=rawRemove;repo.remove=wrappedRemove;
    state.taskInstalled=true;return true;
  }

  function installCalendarRepository(){
    var repo=calendarRepository();
    if(!repo||typeof repo.updateOne!=='function'||typeof repo.remove!=='function')return false;
    if(repo.updateOne.__cleaningExecutionWriteRuntime){state.calendarInstalled=true;return true;}
    var rawUpdate=unwrap(repo.updateOne),rawRemove=unwrap(repo.remove);
    var wrappedUpdate=function(id,patch){var record=localCalendarRecord(id),sync=baseSync();if(!record||!sync||!sync._isCleaningProjection(record.row))return rawUpdate.call(repo,id,patch||{});return transact('calendar',id,patch||{}).catch(function(error){throw new Error(userMessage(error));});};
    wrappedUpdate.__cleaningExecutionWriteRuntime=true;wrappedUpdate.__cleaningExecutionSync=true;wrappedUpdate.__raw=rawUpdate;repo.updateOne=wrappedUpdate;
    var wrappedRemove=function(id){var record=localCalendarRecord(id),sync=baseSync();if(!record||!sync||!sync._isCleaningProjection(record.row))return rawRemove.call(repo,id);return Promise.reject(new Error('Schoonmaakafspraak verwijderen kan niet via Agenda. Pas de routine of planning aan bij Schoonmaken.'));};
    wrappedRemove.__cleaningExecutionWriteRuntime=true;wrappedRemove.__cleaningExecutionSync=true;wrappedRemove.__raw=rawRemove;repo.remove=wrappedRemove;
    state.calendarInstalled=true;return true;
  }

  function install(){installTaskRepository();installCalendarRepository();return state.taskInstalled&&state.calendarInstalled;}

  function start(){
    if(install())return true;
    if(state.installTimer)return false;
    var tries=0;state.installTimer=window.setInterval(function(){tries++;if(install()||tries>600){window.clearInterval(state.installTimer);state.installTimer=null;}},100);
    return false;
  }

  function stop(){if(state.installTimer){window.clearInterval(state.installTimer);state.installTimer=null;}state.inFlight={};}

  window.CleaningExecutionWriteRuntime={
    version:VERSION,start:start,stop:stop,transact:transact,
    status:function(){return clone({version:VERSION,taskInstalled:state.taskInstalled,calendarInstalled:state.calendarInstalled,inFlight:Object.keys(state.inFlight),lastResult:state.lastResult,lastError:state.lastError});},
    _transactionPatch:transactionPatch,_projectionUpdates:projectionUpdates,_cleaningPath:function(householdId){return'families/'+householdId+'/cleaning';}
  };
  window.addEventListener('familyapp:task-repository',install);
  window.addEventListener('familyapp:calendar-repository',install);
  window.addEventListener('familyapp:household-context',install);
  start();
})();
