'use strict';
// ============================================================
// CLEANING EXCEPTION RUNTIME v0.2.0
// Rules-safe writer for explicit incomplete-cleaning choices from Tasks.
// Canonical write boundary is families/{householdId}/cleaning only.
// Task/Calendar rows are repaired afterwards by CleaningProjectionService.
//
// v0.2.0 adds respondToHelpRequest(), a separate entry point for the help
// recipient, who has no Task of their own for this occurrence yet (the
// occurrence's assignmentUids do not include them until they accept).
// apply() itself is unchanged and already forwards REQUEST_HELP generically
// to CleaningExceptionContract for the requester's own managed Task.
// ============================================================
(function(){
  if(window.CleaningExceptionRuntime)return;

  var VERSION='0.2.0';
  var state={inFlight:false,lastResult:null,lastError:null};

  function clone(value){if(value===undefined)return undefined;try{return JSON.parse(JSON.stringify(value));}catch(error){return value;}}
  function text(value){return String(value==null?'':value).trim();}
  function context(){try{return window.HouseholdContext&&window.HouseholdContext.snapshot?window.HouseholdContext.snapshot():null;}catch(error){return null;}}
  function capture(){try{return window.HouseholdContext&&window.HouseholdContext.capture?window.HouseholdContext.capture():null;}catch(error){return null;}}
  function current(token){try{return !!(window.HouseholdContext&&window.HouseholdContext.isCurrent&&window.HouseholdContext.isCurrent(token));}catch(error){return false;}}
  function database(){try{return window.fbDb||(window.firebase&&window.firebase.database&&window.firebase.database())||null;}catch(error){return null;}}
  function validContext(ctx){return !!(ctx&&ctx.ready===true&&ctx.uid&&ctx.householdId);}
  function taskOccurrenceIds(task){var contract=window.CleaningExecutionSync;return contract&&typeof contract._recordOccurrenceIds==='function'?contract._recordOccurrenceIds(task):[];}
  function isManaged(task){var contract=window.CleaningExecutionSync;return !!(contract&&typeof contract._isCleaningProjection==='function'&&contract._isCleaningProjection(task));}

  function writeContext(){var ctx=context(),db=database(),token=capture();if(!validContext(ctx))throw new Error('ACTIVE_HOUSEHOLD_REQUIRED');if(!db)throw new Error('FIREBASE_DATABASE_UNAVAILABLE');if(!token||!current(token))throw new Error('HOUSEHOLD_CONTEXT_CHANGED');return{ctx:ctx,db:db,token:token,cleaningPath:'families/'+ctx.householdId+'/cleaning'};}

  function repair(planIds){
    var projection=window.CleaningProjectionService,ids=Array.isArray(planIds)?planIds.filter(Boolean):[];
    if(!projection||typeof projection.reconcilePlan!=='function')return Promise.resolve([]);
    return ids.reduce(function(chain,id){return chain.then(function(results){return Promise.resolve(projection.reconcilePlan(id)).then(function(result){results.push(result);return results;});});},Promise.resolve([]));
  }

  function apply(input){
    input=input||{};if(state.inFlight)return Promise.reject(new Error('CLEANING_EXCEPTION_BUSY'));
    var task=input.task||null;if(!task||!isManaged(task))return Promise.reject(new Error('CLEANING_EXCEPTION_TASK_REQUIRED'));
    var ids=taskOccurrenceIds(task);if(!ids.length)return Promise.reject(new Error('CLEANING_EXCEPTION_OCCURRENCE_REQUIRED'));
    var contract=window.CleaningExceptionContract;if(!contract||typeof contract.apply!=='function')return Promise.reject(new Error('CLEANING_EXCEPTION_CONTRACT_UNAVAILABLE'));
    var write;try{write=writeContext();}catch(error){return Promise.reject(error);}var resultValue=null,transitionError=null,stamp=Date.now();state.inFlight=true;state.lastError=null;
    return write.db.ref(write.cleaningPath).transaction(function(serverCleaning){
      if(!current(write.token)){transitionError=new Error('HOUSEHOLD_CONTEXT_CHANGED');return;}
      try{resultValue=contract.apply({cleaning:serverCleaning||{},occurrenceIds:ids,householdId:write.ctx.householdId,actorUid:write.ctx.uid,timestamp:stamp,action:input.action,options:input.options||{}});transitionError=null;return resultValue.cleaning;}catch(error){transitionError=error;return;}
    }).then(function(transaction){
      if(transitionError)throw transitionError;if(!current(write.token))throw new Error('HOUSEHOLD_CONTEXT_CHANGED_AFTER_WRITE');if(!transaction||transaction.committed!==true)throw new Error('CLEANING_EXCEPTION_WRITE_NOT_COMMITTED');
      state.lastResult={action:resultValue.action,occurrenceIds:resultValue.occurrenceIds.slice(),planIds:resultValue.planIds.slice(),logIds:resultValue.logIds.slice(),schedule:clone(resultValue.schedule)};
      // Canonical Cleaning write has already succeeded. Projection repair is
      // intentionally best effort and may never invalidate that canonical save.
      return repair(resultValue.planIds).catch(function(error){try{console.warn('[CleaningExceptionRuntime] projection repair failed',error);}catch(ignore){}return[];}).then(function(){try{window.dispatchEvent(new CustomEvent('familyapp:cleaning-exception',{detail:clone(state.lastResult)}));}catch(error){}return clone(state.lastResult);});
    }).catch(function(error){state.lastError=error&&error.message||String(error);throw error;}).finally(function(){state.inFlight=false;});
  }

  function message(error){var contract=window.CleaningExceptionContract;if(contract&&typeof contract.userMessage==='function')return contract.userMessage(error);var code=text(error&&error.message||error);if(code.indexOf('BUSY')>=0)return'Er wordt al een schoonmaakactie opgeslagen.';return code||'Schoonmaakactie kon niet worden opgeslagen.';}

  function respondToHelpRequest(occurrenceId,action){
    var id=text(occurrenceId);
    if(!id)return Promise.reject(new Error('CLEANING_EXCEPTION_OCCURRENCE_REQUIRED'));
    if(['ACCEPT_HELP','DECLINE_HELP'].indexOf(text(action).toUpperCase())<0)return Promise.reject(new Error('CLEANING_EXCEPTION_ACTION_INVALID'));
    if(state.inFlight)return Promise.reject(new Error('CLEANING_EXCEPTION_BUSY'));
    var contract=window.CleaningExceptionContract;if(!contract||typeof contract.apply!=='function')return Promise.reject(new Error('CLEANING_EXCEPTION_CONTRACT_UNAVAILABLE'));
    var write;try{write=writeContext();}catch(error){return Promise.reject(error);}
    var resultValue=null,transitionError=null,stamp=Date.now();state.inFlight=true;state.lastError=null;
    return write.db.ref(write.cleaningPath).transaction(function(serverCleaning){
      if(!current(write.token)){transitionError=new Error('HOUSEHOLD_CONTEXT_CHANGED');return;}
      try{resultValue=contract.apply({cleaning:serverCleaning||{},occurrenceIds:[id],householdId:write.ctx.householdId,actorUid:write.ctx.uid,timestamp:stamp,action:text(action).toUpperCase(),options:{}});transitionError=null;return resultValue.cleaning;}catch(error){transitionError=error;return;}
    }).then(function(transaction){
      if(transitionError)throw transitionError;if(!current(write.token))throw new Error('HOUSEHOLD_CONTEXT_CHANGED_AFTER_WRITE');if(!transaction||transaction.committed!==true)throw new Error('CLEANING_EXCEPTION_WRITE_NOT_COMMITTED');
      state.lastResult={action:resultValue.action,occurrenceIds:resultValue.occurrenceIds.slice(),planIds:resultValue.planIds.slice(),logIds:resultValue.logIds.slice(),schedule:clone(resultValue.schedule),helpRequest:clone(resultValue.helpRequest)};
      return repair(resultValue.planIds).catch(function(error){try{console.warn('[CleaningExceptionRuntime] projection repair failed',error);}catch(ignore){}return[];}).then(function(){try{window.dispatchEvent(new CustomEvent('familyapp:cleaning-exception',{detail:clone(state.lastResult)}));}catch(error){}return clone(state.lastResult);});
    }).catch(function(error){state.lastError=error&&error.message||String(error);throw error;}).finally(function(){state.inFlight=false;});
  }

  window.CleaningExceptionRuntime={version:VERSION,apply:apply,respondToHelpRequest:respondToHelpRequest,userMessage:message,status:function(){return clone({version:VERSION,inFlight:state.inFlight,lastResult:state.lastResult,lastError:state.lastError});}};
})();
