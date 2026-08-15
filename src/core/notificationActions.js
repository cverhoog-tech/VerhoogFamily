'use strict';
// ============================================================
// NOTIFICATION ACTIONS v2.2.0
// Presentation-agnostic action service for actionable notification events.
// NotificationCenter and NotificationDelivery own all DOM and interaction UI.
// ============================================================
(function(){
  if(window.NotificationActions)return;
  var VERSION='2.2.0';

  function currentUid(){try{return (window.fbUser||(window.firebase&&firebase.auth&&firebase.auth().currentUser)||{}).uid||null;}catch(e){return null;}}
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

  // Accept/decline a received Party Quest invite from the notification
  // center. Reuses PartyQuestInvites.getById()/respond() — the same
  // transaction-backed domain action the auto-popup and Taken-overview
  // party card already use — so there is a single invitation state and a
  // single acceptance/decline code path regardless of which UI triggered it.
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
    if(event.type==='task.help.requested')return acceptTaskHelp(event).then(function(){return true;});
    if(event.type==='partyQuest.invitation.sent')return revokePartyInvitation(event).then(function(){return true;});
    if(event.type==='partyQuest.created')return respondPartyQuestInvite(event,action==='decline'?'declined':'active').then(function(){return true;});
    return markRead(event).then(function(){return false;});
  }
  function byId(id){if(!window.NotificationStore)return null;return NotificationStore.list().find(function(n){return String(n.id)===String(id);})||null;}

  // Resolves what a notification's *current* domain state actually is, so
  // a detail view can show "open / geaccepteerd / geweigerd / ingetrokken /
  // niet meer actief" instead of just read/unread, and only offer actions
  // that are still valid. Pure read of TaskSharedData/PartyQuestInvites
  // state — no separate invitation state is introduced here.
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
    // Informational types (task.help.joined, partyQuest.joined,
    // partyQuest.completed, task.swap.*, finance.savings.updated): no
    // status/action concept, just the existing body text.
    return{statusLabel:'',detail:event.body||'',actions:[]};
  }

  window.NotificationActions={version:VERSION,isActionable:isActionable,actionLabel:actionLabel,run:run,acceptTaskHelp:acceptTaskHelp,revokePartyInvitation:revokePartyInvitation,respondPartyQuestInvite:respondPartyQuestInvite,describeStatus:describeStatus,byId:byId};
})();