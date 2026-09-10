'use strict';
// ============================================================
// ACTION INBOX STORE v1.0.0
//
// Aggregates ActionInboxRegistry.collect() into a live list for the current
// UID/household and exposes openActionCount — the ONLY number allowed to
// drive the Inbox envelope badge (see actionInboxHeaderBridge.js). This
// store owns no domain state of its own: every recompute re-derives the
// list from the canonical adapters in the registry, so a resolved/stale
// request disappears immediately and a wrong-user request is never shown.
//
// Refresh triggers:
// - HouseholdContext (login/logout/household switch resets everything)
// - familyapp:tasks-updated (task help + swap-accept mutate taskData)
// - familyapp:cleaning-repository / familyapp:cleaning-exception
// - a dedicated read-only watcher on families/{id}/taskSwapRequests,
//   mirroring the existing TaskSwapNotificationProjector pattern (a second
//   read-only listener on that path already exists for notifications; this
//   is the same accepted pattern, not a second writer)
// - PartyQuestRepository.subscribe(), the same multi-subscriber repository
//   PartyQuestInvites itself is built on
// ============================================================
(function(){
  if(window.ActionInboxStore)return;

  var VERSION='1.0.0';
  var listeners=[];
  var items=[];
  var identityKey=null;
  var swapWatcher=null;
  var partyQuestUnsubscribe=null;
  var refreshQueued=false;

  function context(){try{return window.HouseholdContext&&HouseholdContext.snapshot?HouseholdContext.snapshot():null;}catch(e){return null;}}
  function capture(){try{return window.HouseholdContext&&HouseholdContext.capture?HouseholdContext.capture():null;}catch(e){return null;}}
  function isCurrent(token){try{return !!(window.HouseholdContext&&HouseholdContext.isCurrent&&HouseholdContext.isCurrent(token));}catch(e){return false;}}
  function validContext(ctx){return !!(ctx&&ctx.ready===true&&ctx.uid&&ctx.householdId);}
  function db(){try{return window.fbDb||(window.firebase&&window.firebase.database&&window.firebase.database())||null;}catch(e){return null;}}
  function currentKey(ctx){return ctx&&ctx.uid&&ctx.householdId?[String(ctx.uid),String(ctx.householdId)].join('|'):null;}

  function emit(){
    var snap=items.slice();
    var openActionCount=snap.length;
    listeners.slice().forEach(function(fn){try{fn(snap,openActionCount);}catch(e){console.warn('[ActionInboxStore] listener failed',e);}});
    try{window.dispatchEvent(new CustomEvent('familyapp:action-inbox-changed',{detail:{items:snap,openActionCount:openActionCount}}));}catch(e){}
  }

  function recompute(){
    var ctx=context();
    if(!validContext(ctx)){if(items.length){items=[];emit();}return;}
    var next=[];
    try{next=(window.ActionInboxRegistry&&ActionInboxRegistry.collect)?ActionInboxRegistry.collect():[];}catch(e){console.warn('[ActionInboxStore] collect failed',e);next=[];}
    items=next;
    emit();
  }

  function queueRecompute(){
    if(refreshQueued)return;
    refreshQueued=true;
    (window.requestAnimationFrame||function(fn){setTimeout(fn,0);})(function(){refreshQueued=false;recompute();});
  }

  function unbindSwapWatcher(){if(swapWatcher&&swapWatcher.ref&&swapWatcher.handler){try{swapWatcher.ref.off('value',swapWatcher.handler);}catch(e){}}swapWatcher=null;}
  function bindSwapWatcher(ctx){
    unbindSwapWatcher();
    var database=db();if(!database||!validContext(ctx))return;
    var token=capture();if(!token)return;
    var ref=database.ref('families/'+ctx.householdId+'/taskSwapRequests');
    var handler=function(){if(isCurrent(token))queueRecompute();};
    swapWatcher={ref:ref,handler:handler,token:token};
    ref.on('value',handler,function(){/* read-only watcher; errors are non-fatal for the badge */});
  }

  function unbindPartyQuestWatcher(){if(partyQuestUnsubscribe){try{partyQuestUnsubscribe();}catch(e){}partyQuestUnsubscribe=null;}}
  function bindPartyQuestWatcher(){
    if(partyQuestUnsubscribe)return;
    if(!window.PartyQuestRepository||typeof PartyQuestRepository.subscribe!=='function')return;
    partyQuestUnsubscribe=PartyQuestRepository.subscribe(function(){queueRecompute();});
  }

  function handleContext(ctx){
    var key=currentKey(ctx);
    if(key===identityKey){if(validContext(ctx))queueRecompute();return;}
    identityKey=key;
    unbindSwapWatcher();
    unbindPartyQuestWatcher();
    if(!validContext(ctx)){items=[];emit();return;}
    bindSwapWatcher(ctx);
    bindPartyQuestWatcher();
    if(window.ActionInboxBootstrap&&typeof ActionInboxBootstrap.ready==='function')ActionInboxBootstrap.ready(queueRecompute);
    queueRecompute();
  }

  function start(){
    if(window.HouseholdContext&&typeof HouseholdContext.subscribe==='function'){
      HouseholdContext.subscribe(handleContext);
    }else{
      handleContext(context());
      window.addEventListener('familyapp:household-context',function(e){handleContext((e&&e.detail&&e.detail.context)||context());});
    }
    window.addEventListener('familyapp:tasks-updated',queueRecompute);
    window.addEventListener('familyapp:cleaning-repository',queueRecompute);
    window.addEventListener('familyapp:cleaning-exception',queueRecompute);
    window.addEventListener('familyapp:household-members-updated',queueRecompute);
    return true;
  }

  function subscribe(fn){
    if(typeof fn!=='function')return function(){};
    listeners.push(fn);
    try{fn(items.slice(),items.length);}catch(e){}
    return function(){var i=listeners.indexOf(fn);if(i>=0)listeners.splice(i,1);};
  }

  function list(){return items.slice();}
  function count(){return items.length;}
  function runAction(id,actionId){
    if(!window.ActionInboxRegistry||typeof ActionInboxRegistry.runAction!=='function')return Promise.reject(new Error('Inbox is nog niet beschikbaar'));
    return ActionInboxRegistry.runAction(id,actionId).then(function(result){queueRecompute();return result;}).catch(function(error){queueRecompute();throw error;});
  }

  window.ActionInboxStore={version:VERSION,start:start,subscribe:subscribe,list:list,count:count,runAction:runAction,refresh:queueRecompute};

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
