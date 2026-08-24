'use strict';
// ============================================================
// TASK SWAP NOTIFICATION PROJECTOR v2.0.0 — STEP 10
// Read-only observer over taskSwapRequests with HouseholdContext lifecycle and
// stale-callback protection. Notification persistence remains NotificationStore.
// ============================================================
(function(){
  if(window.TaskSwapNotificationProjector)return;

  var VERSION='2.0.0';
  var active=null,contextUnsubscribe=null,bindGeneration=0,snapshot={},initialized=false;

  function db(){try{return window.fbDb||(window.firebase&&window.firebase.database&&window.firebase.database())||null;}catch(e){return null;}}
  function context(){try{return window.HouseholdContext&&HouseholdContext.snapshot?HouseholdContext.snapshot():null;}catch(e){return null;}}
  function capture(){try{return window.HouseholdContext&&HouseholdContext.capture?HouseholdContext.capture():null;}catch(e){return null;}}
  function isCurrent(token){try{return !!(window.HouseholdContext&&HouseholdContext.isCurrent&&HouseholdContext.isCurrent(token));}catch(e){return false;}}
  function validContext(c){return !!(c&&c.ready===true&&c.uid&&c.householdId);}
  function task(id){return (window.taskData||[]).find(function(t){return String(t.id||t._key)===String(id);})||{id:String(id||''),title:'Taak'};}
  function map(value){var out={};Object.keys(value||{}).forEach(function(k){var r=value[k];if(r)out[k]=Object.assign({id:r.id||k},r);});return out;}
  function safe(p){if(p&&typeof p.catch==='function')p.catch(function(e){console.warn('[TaskSwapNotificationProjector]',e);});}
  function bindingCurrent(binding){return !!(binding&&active===binding&&binding.generation===bindGeneration&&isCurrent(binding.token));}

  function project(next,binding){
    if(!bindingCurrent(binding))return;
    var me=binding.context.uid;
    if(!initialized){snapshot=next;initialized=true;return;}
    Object.keys(next).forEach(function(k){
      var row=next[k],prev=snapshot[k]||null;
      if(!row||!window.NotificationEvents)return;
      if(!prev&&row.status==='pending'&&String(row.requesterUid||'')===String(me)){
        safe(NotificationEvents.taskSwapRequested(task(row.taskId),row.targetUid,row));
        return;
      }
      if(!prev||prev.status===row.status)return;
      if(String(row.targetUid||'')!==String(me))return;
      if(row.status==='accepted')safe(NotificationEvents.taskSwapResolved(task(row.taskId),row.requesterUid,true,row));
      else if(row.status==='declined')safe(NotificationEvents.taskSwapResolved(task(row.taskId),row.requesterUid,false,row));
    });
    snapshot=next;
  }

  function unbind(){
    if(active&&active.ref&&active.handler)try{active.ref.off('value',active.handler);}catch(e){}
    active=null;bindGeneration++;snapshot={};initialized=false;
  }

  function bind(c){
    unbind();
    if(!validContext(c))return false;
    var database=db(),token=capture();
    if(!database||!token||!isCurrent(token))return false;
    var generation=++bindGeneration;
    var binding={generation:generation,token:token,context:{uid:c.uid,householdId:c.householdId,revision:c.revision},ref:database.ref('families/'+c.householdId+'/taskSwapRequests'),handler:null};
    active=binding;
    binding.handler=function(s){if(bindingCurrent(binding))project(map(s&&s.val?s.val():{}),binding);};
    binding.ref.on('value',binding.handler,function(e){if(bindingCurrent(binding))console.warn('[TaskSwapNotificationProjector] listener failed',e);});
    return true;
  }

  function handleContext(c){
    if(!validContext(c)){unbind();return;}
    if(active&&active.context.uid===c.uid&&active.context.householdId===c.householdId&&active.context.revision===c.revision)return;
    bind(c);
  }

  function start(){
    if(!contextUnsubscribe&&window.HouseholdContext&&typeof HouseholdContext.subscribe==='function')contextUnsubscribe=HouseholdContext.subscribe(handleContext);
    var c=context();if(validContext(c))handleContext(c);
    return true;
  }

  function stop(){if(contextUnsubscribe){try{contextUnsubscribe();}catch(e){}contextUnsubscribe=null;}unbind();}

  window.TaskSwapNotificationProjector={version:VERSION,start:start,stop:stop,status:function(){return{version:VERSION,started:!!active,uid:active&&active.context.uid||null,householdId:active&&active.context.householdId||null,tracked:Object.keys(snapshot).length};}};
  start();
})();
