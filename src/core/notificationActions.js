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
  function isActionable(event){return !!(event&&(event.type==='task.help.requested'||event.type==='partyQuest.invitation.sent'));}
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

  function run(event){
    if(!event)return Promise.resolve(false);
    if(event.type==='task.help.requested')return acceptTaskHelp(event).then(function(){return true;});
    if(event.type==='partyQuest.invitation.sent')return revokePartyInvitation(event).then(function(){return true;});
    return markRead(event).then(function(){return false;});
  }
  function byId(id){if(!window.NotificationStore)return null;return NotificationStore.list().find(function(n){return String(n.id)===String(id);})||null;}

  window.NotificationActions={version:VERSION,isActionable:isActionable,actionLabel:actionLabel,run:run,acceptTaskHelp:acceptTaskHelp,revokePartyInvitation:revokePartyInvitation,byId:byId};
})();