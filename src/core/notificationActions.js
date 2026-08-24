'use strict';
// ============================================================
// NOTIFICATION ACTIONS v3.0.0 — STEP 10
// Presentation-agnostic action service for actionable notification events.
// Identity is owned by HouseholdContext; domain mutations remain delegated to
// the accepted TaskSharedData / PartyQuestInvites services.
// ============================================================
(function(){
  if(window.NotificationActions)return;
  var VERSION='3.0.0';

  function context(){try{return window.HouseholdContext&&HouseholdContext.snapshot?HouseholdContext.snapshot():null;}catch(e){return null;}}
  function currentUid(){var c=context();return c&&c.ready&&c.uid||null;}
  function taskByEvent(event){var id=event&&event.data&&(event.data.taskId||event.data.taskKey)||(event&&event.entity&&event.entity.id)||'';return (window.taskData||[]).find(function(t){return String(t.id||t._key)===String(id);})||null;}
  function isActionable(event){return !!(event&&(event.type==='task.help.requested'||event.type==='partyQuest.invitation.sent'||event.type==='partyQuest.created'));}
  function actionLabel(event){if(!event)return'';if(event.type==='task.help.requested')return'Hulp bieden';if(event.type==='partyQuest.invitation.sent')return'Uitnodiging intrekken';return'Openen';}
  function markRead(event){return window.NotificationStore&&event&&event.id?NotificationStore.markRead(event.id):Promise.resolve();}

  function acceptTaskHelp(event){
    var me=currentUid(),task=taskByEvent(event);
    if(!me)return Promise.reject(new Error('Niet ingelogd'));
    if(!task)return Promise.reject(new Error('Taak niet gevonden'));
    if(!window.TaskSharedData||typeof TaskSharedData.joinHelp!=='function')return Promise.reject(new Error('Taakdata is nog niet klaar'));
    var existed=Array.isArray(task.helpers)&&task.helpers.some(function(h){return String(h&&(h.uid||h.memberId||h.id)||'')===String(me);});
    return TaskSharedData.joinHelp(task.id||task._key).then(function(saved){
      var requester=task.helpRequestedByUid||task.createdByUid||null;
      if(!existed&&window.NotificationEvents&&NotificationEvents.taskHelpJoined)NotificationEvents.taskHelpJoined(saved||task,requester).catch(function(){});
      return markRead(event).then(function(){if(typeof window.showToast==='function')window.showToast(existed?'Je helpt al mee ✓':'Je bent aan de quest toegevoegd 🤝');return saved;});
    });
  }

  function revokePartyInvitation(event){
    var questId=event&&event.data&&event.data.questId,inviteeUid=event&&event.data&&event.data.inviteeUid;
    if(!questId||!inviteeUid)return Promise.reject(new Error('Uitnodigingsgegevens ontbreken'));
    if(!window.PartyQuestInvites||typeof PartyQuestInvites.revokeInvite!=='function')return Promise.reject(new Error('Party Quest service is nog niet klaar'));
    return PartyQuestInvites.revokeInvite(questId,inviteeUid).then(function(){return markRead(event);});
  }

  function respondPartyQuestInvite(event,status){
    var questId=event&&event.data&&event.data.questId;
    if(!questId)return Promise.reject(new Error('Uitnodigingsgegevens ontbreken'));
    if(!window.PartyQuestInvites||typeof PartyQuestInvites.getById!=='function'||typeof PartyQuestInvites.respond!=='function')return Promise.reject(new Error('Party Quest service is nog niet klaar'));
    var quest=PartyQuestInvites.getById(questId);
    if(!quest)return Promise.reject(new Error('Uitnodiging is niet meer actief'));
    return PartyQuestInvites.respond(quest,status).then(function(){return markRead(event);});
  }

  function run(event,action){
    if(!event)return Promise.resolve(false);
    if(!currentUid())return Promise.reject(new Error('Niet ingelogd'));
    if(event.type==='task.help.requested')return acceptTaskHelp(event).then(function(){return true;});
    if(event.type==='partyQuest.invitation.sent')return revokePartyInvitation(event).then(function(){return true;});
    if(event.type==='partyQuest.created')return respondPartyQuestInvite(event,action==='decline'?'declined':'active').then(function(){return true;});
    return markRead(event).then(function(){return false;});
  }
  function byId(id){if(!window.NotificationStore)return null;return NotificationStore.list().find(function(n){return String(n.id)===String(id);})||null;}

  function describeStatus(event){
    if(!event)return{statusLabel:'',detail:'',actions:[]};
    if(event.type==='task.help.requested'){
      var task=taskByEvent(event),me=currentUid();
      if(!task)return{statusLabel:'Taak niet gevonden',detail:'Deze taak bestaat niet meer.',actions:[]};
      var already=Array.isArray(task.helpers)&&task.helpers.some(function(h){return String(h&&(h.uid||h.memberId||h.id)||'')===String(me);});
      if(already)return{statusLabel:'Je helpt al mee',detail:'Je bent al toegevoegd aan “'+String(task.title||task.name||'deze taak')+'”.',actions:[]};
      var stillOpen=!!task.helpRequested&&String(task.helpRequestedForUid||'')===String(me);
      if(stillOpen)return{statusLabel:'Open — wacht op jouw reactie',detail:event.body||'Er is hulp gevraagd.',actions:[{label:'Hulp geven',action:'run',cls:''}]};
      return{statusLabel:'Niet meer actief',detail:'Deze hulpvraag is ingetrokken, of is al door iemand anders opgepakt.',actions:[]};
    }
    if(event.type==='partyQuest.created'){
      var questId=event.data&&event.data.questId,me2=currentUid();
      var q=window.PartyQuestInvites&&PartyQuestInvites.getById?PartyQuestInvites.getById(questId):null;
      var inv=q&&q.invitees&&q.invitees[me2];
      if(!q||!inv)return{statusLabel:'Niet meer beschikbaar',detail:'Deze uitnodiging bestaat niet meer.',actions:[]};
      if(inv.status==='pending')return{statusLabel:'Open — wacht op jouw reactie',detail:event.body||'Je bent uitgenodigd voor een Party Quest.',actions:[{label:'Accepteren',action:'accept',cls:''},{label:'Weigeren',action:'decline',cls:'is-danger'}]};
      if(inv.status==='active')return{statusLabel:'Geaccepteerd ✓',detail:'Je doet mee aan deze Party Quest.',actions:[]};
      if(inv.status==='declined')return{statusLabel:'Geweigerd',detail:'Je hebt deze uitnodiging geweigerd.',actions:[]};
      if(inv.status==='revoked')return{statusLabel:'Ingetrokken',detail:'De maker heeft deze uitnodiging ingetrokken.',actions:[]};
      return{statusLabel:'',detail:event.body||'',actions:[]};
    }
    if(event.type==='partyQuest.invitation.sent'){
      var questId2=event.data&&event.data.questId,targetUid=event.data&&event.data.inviteeUid;
      var q2=window.PartyQuestInvites&&PartyQuestInvites.getById?PartyQuestInvites.getById(questId2):null;
      var inv2=q2&&q2.invitees&&targetUid&&q2.invitees[targetUid];
      if(!q2||!inv2)return{statusLabel:'Niet meer beschikbaar',detail:'Deze uitnodiging bestaat niet meer.',actions:[]};
      if(inv2.status==='pending')return{statusLabel:'Wacht op reactie',detail:event.body||'',actions:[{label:'Uitnodiging intrekken',action:'run',cls:'is-danger'}]};
      if(inv2.status==='active')return{statusLabel:'Geaccepteerd ✓',detail:'',actions:[]};
      if(inv2.status==='declined')return{statusLabel:'Geweigerd',detail:'',actions:[]};
      if(inv2.status==='revoked')return{statusLabel:'Al ingetrokken',detail:'',actions:[]};
      return{statusLabel:'',detail:'',actions:[]};
    }
    return{statusLabel:'',detail:event.body||'',actions:[]};
  }

  window.NotificationActions={version:VERSION,isActionable:isActionable,actionLabel:actionLabel,run:run,acceptTaskHelp:acceptTaskHelp,revokePartyInvitation:revokePartyInvitation,respondPartyQuestInvite:respondPartyQuestInvite,describeStatus:describeStatus,byId:byId,currentUid:currentUid};
})();
