'use strict';
// ============================================================
// CLEANING DERIVED CLEANUP v0.1.0
// Removes only non-completed Task / Calendar projections whose canonical
// CleaningOccurrences were cancelled/removed from the active Cleaning model.
// User-created Tasks and Agenda entries are never candidates.
// Completed Cleaning projections are deliberately kept as history.
// ============================================================
(function(){
  if(window.CleaningDerivedCleanup)return;

  var VERSION='0.1.0';
  var state={unsubscribe:null,attachTimer:null,queued:false,inFlight:false,lastResult:null,lastError:null};

  function clone(value){if(value===undefined)return undefined;try{return JSON.parse(JSON.stringify(value));}catch(error){return value;}}
  function text(value){return String(value==null?'':value).trim();}
  function unique(values){var seen={},out=[];(Array.isArray(values)?values:[]).forEach(function(value){var id=text(value);if(id&&!seen[id]){seen[id]=true;out.push(id);}});return out;}
  function repository(){return window.CleaningHouseholdRepository||null;}
  function context(){try{return window.HouseholdContext&&window.HouseholdContext.snapshot?window.HouseholdContext.snapshot():null;}catch(error){return null;}}
  function capture(){try{return window.HouseholdContext&&window.HouseholdContext.capture?window.HouseholdContext.capture():null;}catch(error){return null;}}
  function current(token){try{return !!(window.HouseholdContext&&window.HouseholdContext.isCurrent&&window.HouseholdContext.isCurrent(token));}catch(error){return false;}}
  function database(){try{return window.fbDb||(window.firebase&&window.firebase.database&&window.firebase.database())||null;}catch(error){return null;}}
  function validContext(ctx){return !!(ctx&&ctx.ready===true&&ctx.uid&&ctx.householdId);}

  function managed(row){return !!(row&&(row.projectionManaged===true||text(row.sourceType).indexOf('cleaning-occurrence')===0));}
  function occurrenceIds(row){return unique([].concat(
    Array.isArray(row&&row.cleaningOccurrenceIds)?row.cleaningOccurrenceIds:[],
    Array.isArray(row&&row.sourceIds)?row.sourceIds:[],
    [row&&row.cleaningOccurrenceId,row&&row.sourceId]
  ));}
  function roomIsActive(cleaning,roomId){var room=cleaning&&cleaning.rooms&&cleaning.rooms[text(roomId)];return !!(room&&typeof room==='object'&&room.active!==false);}
  function occurrenceIsRetained(cleaning,id){
    var occurrence=cleaning&&cleaning.occurrences&&cleaning.occurrences[id];if(!occurrence||typeof occurrence!=='object')return false;
    var status=text(occurrence.status).toUpperCase();
    if(status==='COMPLETED')return true;
    if(status==='CANCELLED'||status==='SKIPPED')return false;
    return roomIsActive(cleaning,occurrence.roomId);
  }
  function recordIsCompleted(row,kind){
    if(kind==='calendar')return !!(row&&row.completed===true);
    var status=text(row&&row.status).toUpperCase();return !!(row&&row.done===true)||status==='DONE'||status==='COMPLETED';
  }
  function shouldRemove(cleaning,row,kind){
    if(!managed(row)||recordIsCompleted(row,kind))return false;
    var ids=occurrenceIds(row);if(!ids.length)return false;
    var existing=ids.filter(function(id){return !!(cleaning&&cleaning.occurrences&&cleaning.occurrences[id]);});
    // Do not guess when every canonical record is missing: legacy data without
    // a canonical occurrence is left alone rather than risking user history.
    if(!existing.length)return false;
    return !existing.some(function(id){return occurrenceIsRetained(cleaning,id);});
  }

  function cleanupUpdates(input){
    var source=input||{},cleaning=source.cleaning&&typeof source.cleaning==='object'?source.cleaning:{},tasks=source.tasks&&typeof source.tasks==='object'?source.tasks:{},events=source.calendarEvents&&typeof source.calendarEvents==='object'?source.calendarEvents:{},updates={},removedTasks=[],removedEvents=[];
    Object.keys(tasks).forEach(function(key){var row=tasks[key];if(shouldRemove(cleaning,row,'task')){updates['tasks/'+key]=null;removedTasks.push(key);}});
    Object.keys(events).forEach(function(key){var row=events[key];if(shouldRemove(cleaning,row,'calendar')){updates['calendarEvents/'+key]=null;removedEvents.push(key);}});
    return{updates:updates,removedTaskKeys:removedTasks,removedCalendarKeys:removedEvents,removedCount:removedTasks.length+removedEvents.length};
  }

  function emit(detail){state.lastResult=clone(detail||{});state.lastError=detail&&detail.error||null;try{window.dispatchEvent(new CustomEvent('familyapp:cleaning-derived-cleanup',{detail:clone(detail||{})}));}catch(error){}}
  function reconcile(snapshot){
    if(state.inFlight)return Promise.resolve(null);var ctx=context(),db=database(),token=capture();if(!snapshot||snapshot.ready!==true||!validContext(ctx)||!db||!token||!current(token))return Promise.resolve(null);
    var familyRef=db.ref('families/'+ctx.householdId);state.inFlight=true;
    return Promise.all([familyRef.child('tasks').once('value'),familyRef.child('calendarEvents').once('value')]).then(function(snaps){
      if(!current(token))throw new Error('CLEANING_DERIVED_CLEANUP_CONTEXT_CHANGED');
      var result=cleanupUpdates({cleaning:snapshot.data||{},tasks:snaps[0]&&snaps[0].val?snaps[0].val():{},calendarEvents:snaps[1]&&snaps[1].val?snaps[1].val():{}}),keys=Object.keys(result.updates);
      if(!keys.length){emit(Object.assign({status:'clean'},result));return result;}
      return familyRef.update(result.updates).then(function(){if(!current(token))throw new Error('CLEANING_DERIVED_CLEANUP_CONTEXT_CHANGED_AFTER_WRITE');emit(Object.assign({status:'cleaned'},result));return result;});
    }).catch(function(error){emit({status:'error',error:error&&error.message||String(error)});throw error;}).finally(function(){state.inFlight=false;});
  }
  function queue(snapshot){if(state.queued)return;state.queued=true;window.setTimeout(function(){state.queued=false;var repo=repository(),latest=snapshot;try{latest=repo&&repo.snapshot?repo.snapshot():snapshot;}catch(error){}reconcile(latest).catch(function(){});},0);}
  function attach(){var repo=repository();if(!repo||typeof repo.subscribe!=='function')return false;if(state.unsubscribe)return true;state.unsubscribe=repo.subscribe(function(snapshot){if(snapshot&&snapshot.ready===true)queue(snapshot);});try{var initial=repo.snapshot&&repo.snapshot();if(initial&&initial.ready===true)queue(initial);}catch(error){}return true;}
  function start(){if(attach())return true;if(state.attachTimer)return false;var tries=0;state.attachTimer=window.setInterval(function(){tries++;if(attach()||tries>240){window.clearInterval(state.attachTimer);state.attachTimer=null;}},100);return false;}
  function stop(){if(state.unsubscribe){try{state.unsubscribe();}catch(error){}state.unsubscribe=null;}if(state.attachTimer){window.clearInterval(state.attachTimer);state.attachTimer=null;}state.queued=false;state.inFlight=false;}

  window.CleaningDerivedCleanup={version:VERSION,start:start,stop:stop,reconcile:reconcile,status:function(){return clone({version:VERSION,inFlight:state.inFlight,lastResult:state.lastResult,lastError:state.lastError});},_occurrenceIds:occurrenceIds,_shouldRemove:shouldRemove,_cleanupUpdates:cleanupUpdates};
  window.addEventListener('familyapp:household-context',start);start();
})();
