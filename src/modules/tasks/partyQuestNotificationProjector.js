'use strict';
// ============================================================
// PARTY QUEST NOTIFICATION PROJECTOR v2.0.0 — STEP 10
// Read-only observer over partyQuests with HouseholdContext lifecycle and
// stale-callback protection. Typed events remain idempotent in NotificationStore.
// ============================================================
(function(){
  if(window.PartyQuestNotificationProjector)return;

  var VERSION='2.0.0';
  var active=null,contextUnsubscribe=null,bindGeneration=0,snapshot={},initialized=false;

  function db(){try{return window.fbDb||(window.firebase&&window.firebase.database&&window.firebase.database())||null;}catch(e){return null;}}
  function context(){try{return window.HouseholdContext&&HouseholdContext.snapshot?HouseholdContext.snapshot():null;}catch(e){return null;}}
  function capture(){try{return window.HouseholdContext&&HouseholdContext.capture?HouseholdContext.capture():null;}catch(e){return null;}}
  function isCurrent(token){try{return !!(window.HouseholdContext&&HouseholdContext.isCurrent&&HouseholdContext.isCurrent(token));}catch(e){return false;}}
  function validContext(c){return !!(c&&c.ready===true&&c.uid&&c.householdId);}
  function map(value){var out={};Object.keys(value||{}).forEach(function(k){var q=value[k];if(q)out[k]=Object.assign({id:q.id||k},q);});return out;}
  function invitees(q){return q&&q.invitees&&typeof q.invitees==='object'?q.invitees:{};}
  function safe(p){if(p&&typeof p.catch==='function')p.catch(function(e){console.warn('[PartyQuestNotificationProjector]',e);});}
  function bindingCurrent(binding){return !!(binding&&active===binding&&binding.generation===bindGeneration&&isCurrent(binding.token));}

  function publishReadModel(next,binding){
    if(!bindingCurrent(binding))return;
    try{window.dispatchEvent(new CustomEvent('familyapp:party-quests-updated',{detail:{source:'firebase',uid:binding.context.uid,householdId:binding.context.householdId,quests:Object.keys(next||{}).map(function(k){return next[k];})}}));}catch(e){}
  }

  function project(next,binding){
    if(!bindingCurrent(binding))return;
    var me=binding.context.uid;
    if(!initialized){snapshot=next;initialized=true;publishReadModel(next,binding);return;}
    Object.keys(next).forEach(function(k){
      var q=next[k],prev=snapshot[k]||null;
      if(!q||!window.NotificationEvents)return;

      if(!prev&&String(q.inviterUid||'')===String(me)){
        var targets=Object.keys(invitees(q)).filter(function(id){return invitees(q)[id]&&invitees(q)[id].status==='pending';});
        safe(NotificationEvents.partyQuestCreated(q,targets));
        targets.forEach(function(targetUid){if(NotificationEvents.partyQuestInvitationSent)safe(NotificationEvents.partyQuestInvitationSent(q,targetUid));});
      }

      if(prev){
        var beforeMine=invitees(prev)[me],afterMine=invitees(q)[me];
        if(afterMine&&String(q.inviterUid||'')!==String(me)&&(!beforeMine||beforeMine.status!==afterMine.status)&&afterMine.status==='active')safe(NotificationEvents.partyQuestJoined(q,q.inviterUid));
        if(prev.status!==q.status&&q.status==='completed'&&String(q.inviterUid||'')===String(me))safe(NotificationEvents.partyQuestCompleted(q));
      }
    });
    snapshot=next;
    publishReadModel(next,binding);
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
    var binding={generation:generation,token:token,context:{uid:c.uid,householdId:c.householdId,revision:c.revision},ref:database.ref('families/'+c.householdId+'/partyQuests'),handler:null};
    active=binding;
    binding.handler=function(s){if(bindingCurrent(binding))project(map(s&&s.val?s.val():{}),binding);};
    binding.ref.on('value',binding.handler,function(e){if(bindingCurrent(binding))console.warn('[PartyQuestNotificationProjector] listener failed',e);});
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

  window.PartyQuestNotificationProjector={version:VERSION,start:start,stop:stop,status:function(){return{version:VERSION,started:!!active,uid:active&&active.context.uid||null,householdId:active&&active.context.householdId||null,tracked:Object.keys(snapshot).length};}};
  start();
})();
