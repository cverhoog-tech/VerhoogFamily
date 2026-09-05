'use strict';
// ============================================================
// NOTIFICATION ACTIONS v3.2.0 — STEP 10
// Presentation-agnostic action service for actionable notification events.
// Identity is owned by HouseholdContext; domain mutations remain delegated to
// the accepted TaskSharedData / PartyQuestInvites / CleaningExceptionRuntime services.
// v3.1 adds occurrence-safe accept/decline actions for targeted and household
// task-help notifications.
// v3.2 makes Cleaning help notifications actionable through the existing
// rules-safe CleaningExceptionRuntime; no second Cleaning writer is introduced.
// ============================================================
(function(){
  if(window.NotificationActions)return;
  var VERSION='3.2.0';

  function context(){try{return window.HouseholdContext&&HouseholdContext.snapshot?HouseholdContext.snapshot():null;}catch(e){return null;}}
  function currentUid(){var c=context();return c&&c.ready&&c.uid||null;}
  function taskByEvent(event){var id=event&&event.data&&(event.data.taskId||event.data.taskKey)||(event&&event.entity&&event.entity.id)||'';return (window.taskData||[]).find(function(t){return String(t.id||t._key)===String(id);})||null;}
  function eventOccurrence(event){return String(event&&event.data&&event.data.occurrence||'');}
  function taskOccurrence(task){return String(task&&task.helpRequestedAt||'');}
  function sameHelpOccurrence(event,task){var expected=eventOccurrence(event),live=taskOccurrence(task);return expected?!!live&&expected===live:true;}
  function helperUid(h){return String(h&&(h.uid||h.memberId||h.id)||'');}
  function isHelper(task,uid){return (Array.isArray(task&&task.helpers)?task.helpers:[]).some(function(h){return helperUid(h)===String(uid||'');});}
  function isOwner(task,uid){return String(task&&(task.createdByUid||task.ownerUid)||'')===String(uid||'');}
  function isAssigned(task,uid){var id=String(uid||'');return !!(id&&task&&((task.assignedToUids&&task.assignedToUids[id])||String(task.assignedToUid||'')===id));}
  function householdDeclinedForEvent(task,event,uid){var map=task&&task.helpDeclinedByUids;return !!(map&&typeof map==='object'&&eventOccurrence(event)&&String(map[String(uid||'')]||'')===eventOccurrence(event));}
  function targetedDeclinedForEvent(task,event,uid){return !!(task&&eventOccurrence(event)&&String(task.helpDeclinedByUid||'')===String(uid||'')&&String(task.helpDeclinedOccurrence||'')===eventOccurrence(event));}
  function cleaningOccurrenceId(event){return String(event&&event.data&&event.data.occurrenceId||'');}
  function cleaningOccurrenceByEvent(event){
    var id=cleaningOccurrenceId(event);if(!id)return null;
    try{var repo=window.CleaningHouseholdRepository,snap=repo&&typeof repo.snapshot==='function'?repo.snapshot():null,data=snap&&snap.ready===true?snap.data:null;return data&&data.occurrences&&data.occurrences[id]||null;}catch(e){return null;}
  }
  function isActionable(event){return !!(event&&(event.type==='task.help.requested'||event.type==='cleaning.help.requested'||event.type==='partyQuest.invitation.sent'||event.type==='partyQuest.created'));}
  function actionLabel(event){if(!event)return'';if(event.type==='task.help.requested')return'Hulp bieden';if(event.type==='cleaning.help.requested')return'Reageren';if(event.type==='partyQuest.invitation.sent')return'Uitnodiging intrekken';return'Openen';}
  function markRead(event){return window.NotificationStore&&event&&event.id?NotificationStore.markRead(event.id):Promise.resolve();}

  function acceptTaskHelp(event){
    var me=currentUid(),task=taskByEvent(event);
    if(!me)return Promise.reject(new Error('Niet ingelogd'));
    if(!task)return Promise.reject(new Error('Taak niet gevonden'));
    if(!sameHelpOccurrence(event,task))return Promise.reject(new Error('Deze hulpvraag is niet meer actief'));
    if(!window.TaskSharedData||typeof TaskSharedData.joinHelp!=='function')return Promise.reject(new Error('Taakdata is nog niet klaar'));
    var existed=isHelper(task,me);
    return TaskSharedData.joinHelp(task.id||task._key).then(function(saved){
      var requester=task.helpRequestedByUid||task.createdByUid||null;
      if(!existed&&window.NotificationEvents&&NotificationEvents.taskHelpJoined)NotificationEvents.taskHelpJoined(saved||task,requester).catch(function(){});
      return markRead(event).then(function(){if(typeof window.showToast==='function')window.showToast(existed?'Je helpt al mee ✓':'Je bent aan de quest toegevoegd 🤝');return saved;});
    });
  }

  function declineTaskHelp(event){
    var me=currentUid(),task=taskByEvent(event),household=task&&task.helpAudience==='household'&&!task.helpRequestedForUid;
    if(!me)return Promise.reject(new Error('Niet ingelogd'));
    if(!task)return Promise.reject(new Error('Taak niet gevonden'));
    if(!sameHelpOccurrence(event,task))return Promise.reject(new Error('Deze hulpvraag is niet meer actief'));
    if(!window.TaskSharedData||typeof TaskSharedData.declineHelp!=='function')return Promise.reject(new Error('Taakdata is nog niet klaar'));
    return TaskSharedData.declineHelp(task.id||task._key).then(function(saved){
      return markRead(event).then(function(){if(typeof window.showToast==='function')window.showToast(household?'Deze hulpvraag is niet meer voor jou':'Hulpvraag afgewezen');return saved;});
    });
  }

  function respondCleaningHelp(event,action){
    var me=currentUid(),id=cleaningOccurrenceId(event),occurrence=cleaningOccurrenceByEvent(event),request=occurrence&&occurrence.helpRequest;
    if(!me)return Promise.reject(new Error('Niet ingelogd'));
    if(!id||!occurrence||!request)return Promise.reject(new Error('Deze schoonmaakhulpvraag is niet meer actief'));
    if(String(request.status||'').toUpperCase()!=='PENDING')return Promise.reject(new Error('Deze schoonmaakhulpvraag is al afgehandeld'));
    if(String(request.toUid||'')!==String(me))return Promise.reject(new Error('Deze schoonmaakhulpvraag is niet voor jou'));
    if(!window.CleaningExceptionRuntime||typeof CleaningExceptionRuntime.respondToHelpRequest!=='function')return Promise.reject(new Error('Schoonmaakhulp is nog niet beschikbaar'));
    var runtimeAction=action==='decline'?'DECLINE_HELP':'ACCEPT_HELP';
    return CleaningExceptionRuntime.respondToHelpRequest(id,runtimeAction).then(function(saved){
      return markRead(event).then(function(){if(typeof window.showToast==='function')window.showToast(runtimeAction==='ACCEPT_HELP'?'Je helpt mee ✓':'Hulpvraag afgewezen');return saved;});
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
    if(event.type==='task.help.requested')return (action==='decline'?declineTaskHelp(event):acceptTaskHelp(event)).then(function(){return true;});
    if(event.type==='cleaning.help.requested')return respondCleaningHelp(event,action).then(function(){return true;});
    if(event.type==='partyQuest.invitation.sent')return revokePartyInvitation(event).then(function(){return true;});
    if(event.type==='partyQuest.created')return respondPartyQuestInvite(event,action==='decline'?'declined':'active').then(function(){return true;});
    return markRead(event).then(function(){return false;});
  }
  function byId(id){if(!window.NotificationStore)return null;return NotificationStore.list().find(function(n){return String(n.id)===String(id);})||null;}

  function describeStatus(event){
    if(!event)return{statusLabel:'',detail:'',actions:[]};
    if(event.type==='cleaning.help.requested'){
      var occurrence=cleaningOccurrenceByEvent(event),me0=currentUid(),request=occurrence&&occurrence.helpRequest,status=String(request&&request.status||'').toUpperCase();
      if(!occurrence||!request)return{statusLabel:'Niet meer actief',detail:'Deze schoonmaakhulpvraag bestaat niet meer.',actions:[]};
      if(status==='ACCEPTED')return{statusLabel:'Geaccepteerd ✓',detail:'Je hebt deze hulpvraag geaccepteerd.',actions:[]};
      if(status==='DECLINED')return{statusLabel:'Afgewezen',detail:'Je hebt deze hulpvraag afgewezen.',actions:[]};
      if(status!=='PENDING')return{statusLabel:'Niet meer actief',detail:'Deze schoonmaakhulpvraag is al afgehandeld.',actions:[]};
      if(String(request.toUid||'')!==String(me0||''))return{statusLabel:'Niet voor jou',detail:'Deze hulpvraag is voor een ander gezinslid.',actions:[]};
      return{statusLabel:'Wacht op jouw reactie',detail:event.body||'Er is hulp gevraagd bij een schoonmaakbeurt.',actions:[{label:'Accepteren',action:'accept',cls:''},{label:'Afwijzen',action:'decline',cls:'is-danger'}]};
    }
    if(event.type==='task.help.requested'){
      var task=taskByEvent(event),me=currentUid();
      if(!task)return{statusLabel:'Taak niet gevonden',detail:'Deze taak bestaat niet meer.',actions:[]};
      if(!sameHelpOccurrence(event,task))return{statusLabel:'Niet meer actief',detail:'Deze melding hoort bij een eerdere hulpvraag.',actions:[]};
      if(isHelper(task,me))return{statusLabel:'Je helpt al mee',detail:'Je bent al toegevoegd aan “'+String(task.title||task.name||'deze taak')+'”.',actions:[]};
      if(targetedDeclinedForEvent(task,event,me))return{statusLabel:'Afgewezen',detail:'Je hebt deze hulpvraag afgewezen.',actions:[]};
      if(householdDeclinedForEvent(task,event,me))return{statusLabel:'Niet voor mij',detail:'Je hebt aangegeven dat deze hulpvraag niet voor jou is. Andere gezinsleden kunnen nog steeds helpen.',actions:[]};
      var householdOpen=!!task.helpRequested&&task.helpAudience==='household'&&!task.helpRequestedForUid;
      if(householdOpen){
        if(isOwner(task,me)||isAssigned(task,me))return{statusLabel:'Je neemt al deel',detail:'Je bent al betrokken bij deze taak.',actions:[]};
        return{statusLabel:'Open — voor het gezin',detail:event.body||'Het gezin is om hulp gevraagd.',actions:[{label:'Hulp geven',action:'accept',cls:''},{label:'Niet voor mij',action:'decline',cls:'is-danger'}]};
      }
      var targetedOpen=!!task.helpRequested&&task.helpAudience==='uid'&&String(task.helpRequestedForUid||'')===String(me);
      if(targetedOpen)return{statusLabel:'Open — wacht op jouw reactie',detail:event.body||'Er is hulp gevraagd.',actions:[{label:'Hulp geven',action:'accept',cls:''},{label:'Afwijzen',action:'decline',cls:'is-danger'}]};
      return{statusLabel:'Niet meer actief',detail:'Deze hulpvraag is ingetrokken, afgehandeld of niet meer voor jou bestemd.',actions:[]};
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

  window.NotificationActions={version:VERSION,isActionable:isActionable,actionLabel:actionLabel,run:run,acceptTaskHelp:acceptTaskHelp,declineTaskHelp:declineTaskHelp,respondCleaningHelp:respondCleaningHelp,revokePartyInvitation:revokePartyInvitation,respondPartyQuestInvite:respondPartyQuestInvite,describeStatus:describeStatus,byId:byId,currentUid:currentUid};
})();
