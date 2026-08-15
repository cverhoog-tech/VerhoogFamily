'use strict';
// ============================================================
// TASK CONTEXT BOUNDARY v1.0
// Enforces authenticated household context for every public task mutation.
// ============================================================
(function(){
  if(window.TaskContextBoundary) return;

  var MUTATIONS=['create','update','remove','requestHelp','joinHelp','leaveHelp','retractHelp'];
  var originals={};

  function context(){
    var ctx=window.HouseholdContext;
    if(!ctx) throw new Error('HouseholdContext is niet beschikbaar');
    return ctx;
  }
  function assertReady(){
    var ctx=context();
    var uid=ctx.requireUser();
    var householdId=ctx.requireHousehold();
    ctx.assertContext({uid:uid,householdId:householdId,requireReady:true});
    return {uid:uid,householdId:householdId};
  }
  function staleError(){
    var err=new Error('Taakactie geannuleerd omdat gebruiker of gezin is gewijzigd');
    err.code='TASK_CONTEXT_CHANGED';
    return err;
  }
  function wrap(name){
    var shared=window.TaskSharedData;
    if(!shared||typeof shared[name]!=='function') return false;
    if(shared[name].__taskContextBoundary) return true;
    var original=shared[name].bind(shared);
    originals[name]=original;
    function guarded(){
      var token=assertReady();
      var args=arguments;
      return Promise.resolve().then(function(){
        if(!context().isCurrent(token)) throw staleError();
        return original.apply(shared,args);
      }).then(function(result){
        if(!context().isCurrent(token)) throw staleError();
        return result;
      });
    }
    guarded.__taskContextBoundary=true;
    guarded.__original=original;
    shared[name]=guarded;
    return true;
  }
  function install(){
    var shared=window.TaskSharedData;
    if(!shared) return false;
    MUTATIONS.forEach(wrap);
    return true;
  }
  function status(){
    var shared=window.TaskSharedData||{};
    var guarded={};
    MUTATIONS.forEach(function(name){guarded[name]=!!(shared[name]&&shared[name].__taskContextBoundary);});
    var current=null;
    try{current=context().current();}catch(e){}
    return {version:'1.0.0',installed:install(),guarded:guarded,context:current};
  }

  window.TaskContextBoundary={version:'1.0.0',install:install,status:status,assertReady:assertReady};
  install();
  window.addEventListener('familyapp:household-context-changed',install);
})();
