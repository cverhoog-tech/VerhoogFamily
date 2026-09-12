'use strict';
// ============================================================
// ACTION INBOX REGISTRY v1.1.0
//
// This file is the ONLY place that knows how to (a) find open, actionable
// requests for the current user in a domain's canonical source, and
// (b) route an Inbox action back to that domain's existing runtime.
//
// Hard rules this file must never break:
// - Presence in the Inbox is ALWAYS computed from the canonical domain
//   state (taskData, TaskSwapRequests, PartyQuestInvites,
//   CleaningHouseholdRepository) — never from NotificationStore.
// - No adapter ever writes directly to Firebase. Every action() call
//   delegates to an existing domain runtime function.
// - No new canonical request state is stored anywhere by this file.
// ============================================================
(function(){
  if(window.ActionInboxRegistry)return;

  var VERSION='1.1.0';

  function context(){try{return window.HouseholdContext&&HouseholdContext.snapshot?HouseholdContext.snapshot():null;}catch(e){return null;}}
  function currentUid(){var c=context();return c&&c.ready&&c.uid||null;}
  function members(){try{return window.TaskSharedData&&TaskSharedData.members?TaskSharedData.members()||[]:[];}catch(e){return[];}}
  function memberName(uid){
    if(!uid)return'Gezinslid';
    var found=members().find(function(m){return String(m.uid||m.id)===String(uid);});
    if(found)return String(found.displayName||found.name||'Gezinslid');
    try{
      var bridge=window.HouseholdIdentityFirebaseBridge,rows=bridge&&bridge.getMembers?bridge.getMembers():[];
      var row=(Array.isArray(rows)?rows:[]).find(function(r){return String(r&&(r.uid||r.id))===String(uid);});
      if(row)return String(row.displayName||row.name)||'Gezinslid';
    }catch(e){}
    return'Gezinslid';
  }
  function findNotificationId(matcher){
    try{
      if(!window.NotificationStore||typeof NotificationStore.list!=='function')return null;
      var found=NotificationStore.list().find(matcher);
      return found?found.id:null;
    }catch(e){return null;}
  }

  // ---------------------------------------------------------
  // Adapter: Task-hulp (targeted + household), read from taskData.
  // ---------------------------------------------------------
  function taskId(t){return String(t&&(t.id||t._key)||'');}
  function taskHelpEvent(t,notifId){return{id:notifId||undefined,type:'task.help.requested',data:{taskId:taskId(t),occurrence:String(t&&t.helpRequestedAt||'')}};}
  function taskHelpStatus(t){
    if(!window.NotificationActions||typeof NotificationActions.describeStatus!=='function')return null;
    try{return NotificationActions.describeStatus(taskHelpEvent(t));}catch(e){return null;}
  }
  var taskHelpAdapter={
    domain:'tasks',type:'task.help',
    findById:function(id){return (window.taskData||[]).find(function(t){return taskId(t)===String(id);})||null;},
    list:function(){
      if(!currentUid())return[];
      return (window.taskData||[]).filter(function(t){
        if(!t||!t.helpRequested)return false;
        var status=taskHelpStatus(t);
        return !!(status&&status.actions&&status.actions.length);
      });
    },
    toItem:function(t){
      var status=taskHelpStatus(t)||{detail:'',actions:[]};
      var requesterUid=t.helpRequestedByUid||t.createdByUid||null;
      return{
        rawId:taskId(t),
        title:String(t.title||t.name||'Taak'),
        body:status.detail||'Er is hulp gevraagd voor deze taak.',
        actorName:memberName(requesterUid),
        createdAt:Number(t.helpRequestedAt)||Number(t.updatedAt)||0,
        actions:(status.actions||[]).map(function(a){return{id:a.action,label:a.label};})
      };
    },
    action:function(t,actionId){
      if(!window.NotificationActions)return Promise.reject(new Error('Taakhulp is nog niet beschikbaar'));
      var notifId=findNotificationId(function(e){
        return e&&e.type==='task.help.requested'&&e.data&&String(e.data.taskId)===taskId(t)&&(!t.helpRequestedAt||String(e.data.occurrence||'')===String(t.helpRequestedAt));
      });
      var event=taskHelpEvent(t,notifId);
      return actionId==='decline'?NotificationActions.declineTaskHelp(event):NotificationActions.acceptTaskHelp(event);
    }
  };

  // ---------------------------------------------------------
  // Adapter: Task-overdracht (swap), canonical TaskSwapRequests.
  // ---------------------------------------------------------
  var taskSwapAdapter={
    domain:'tasks',type:'task.swap',
    findById:function(id){try{return window.TaskSwapRequests&&TaskSwapRequests.pending?TaskSwapRequests.pending().find(function(r){return String(r.id)===String(id);})||null:null;}catch(e){return null;}},
    list:function(){try{return window.TaskSwapRequests&&TaskSwapRequests.pending?TaskSwapRequests.pending():[];}catch(e){return[];}},
    toItem:function(r){
      var requesterName=String(r.requesterName||memberName(r.requesterUid));
      return{
        rawId:String(r.id),
        title:String(r.taskTitle||'Taak'),
        body:requesterName+' vraagt of jij deze taak overneemt.',
        actorName:requesterName,
        createdAt:Number(r.createdAt)||0,
        actions:[{id:'accept',label:'Accepteren'},{id:'decline',label:'Weigeren'}]
      };
    },
    action:function(r,actionId){
      if(!window.TaskSwapRequests)return Promise.reject(new Error('Ruilverzoeken zijn nog niet beschikbaar'));
      return actionId==='decline'?TaskSwapRequests.declineRequest(r.id):TaskSwapRequests.acceptRequest(r.id);
    }
  };

  // ---------------------------------------------------------
  // Adapter: Party Quest invite.
  // ---------------------------------------------------------
  var partyQuestAdapter={
    domain:'quests',type:'partyQuest.invite',
    findById:function(id){try{return window.PartyQuestInvites&&PartyQuestInvites.getById?PartyQuestInvites.getById(id):null;}catch(e){return null;}},
    list:function(){try{return window.PartyQuestInvites&&PartyQuestInvites.pending?PartyQuestInvites.pending():[];}catch(e){return[];}},
    toItem:function(q){
      var inviterName=String(q.inviterName||memberName(q.inviterUid));
      return{
        rawId:String(q.id||q._key),
        title:String(q.questTitle||'Party Quest'),
        body:inviterName+' nodigt je uit voor deze quest.',
        actorName:inviterName,
        createdAt:Number(q.updatedAt||q.createdAt)||0,
        actions:[{id:'accept',label:'Accepteren'},{id:'decline',label:'Weigeren'}]
      };
    },
    action:function(q,actionId){
      if(!window.PartyQuestInvites)return Promise.reject(new Error('Party Quest is nog niet beschikbaar'));
      return PartyQuestInvites.respond(q,actionId==='decline'?'declined':'active');
    }
  };

  // ---------------------------------------------------------
  // Cleaning V2.1 adapters. These derive decisions straight from
  // CleaningOccurrence transferRequest/helpRequest state. They never write;
  // all decisions route to CleaningCollaborationV21, which owns the one
  // occurrence-level collaboration transaction path.
  // ---------------------------------------------------------
  function cleaningData(){try{var repo=window.CleaningHouseholdRepository,snap=repo&&repo.snapshot?repo.snapshot():null;return (snap&&snap.data)||null;}catch(e){return null;}}
  function cleaningEntries(){var data=cleaningData(),occ=data&&data.occurrences||{};return Object.keys(occ).map(function(id){return{occurrence:Object.assign({id:id},occ[id]||{}),data:data};});}
  function cleaningRoomName(data,roomId){var room=data&&data.rooms&&data.rooms[roomId];return room&&room.name?String(room.name):'Ruimte';}
  function cleaningAction(occurrenceId,actionId){
    if(!window.CleaningCollaborationV21||typeof CleaningCollaborationV21.handleInboxAction!=='function')return Promise.reject(new Error('Schoonmaken is nog niet beschikbaar'));
    return CleaningCollaborationV21.handleInboxAction(occurrenceId,actionId);
  }

  var cleaningHelpAdapter={
    domain:'cleaning',type:'cleaning.help',
    findById:function(id){return this.list().find(function(e){return String(e.occurrence.id)===String(id);})||null;},
    list:function(){var me=currentUid();if(!me)return[];return cleaningEntries().filter(function(entry){var req=entry.occurrence.helpRequest||{};return String(req.status||'').toUpperCase()==='PENDING'&&String(req.toUid||'')===String(me);});},
    toItem:function(entry){var occurrence=entry.occurrence,request=occurrence.helpRequest||{},fromName=memberName(request.fromUid);return{rawId:String(occurrence.id),title:'Hulp bij '+cleaningRoomName(entry.data,occurrence.roomId),body:fromName+' vraagt jouw hulp bij deze schoonmaakbeurt.',actorName:fromName,createdAt:Number(request.requestedAt)||Number(occurrence.updatedAt)||0,actions:[{id:'accept-help',label:'Helpen'},{id:'decline-help',label:'Afwijzen'}]};},
    action:function(entry,actionId){return cleaningAction(entry.occurrence.id,actionId);}
  };

  var cleaningTransferAdapter={
    domain:'cleaning',type:'cleaning.occurrence.transfer',
    findById:function(id){return this.list().find(function(e){return String(e.occurrence.id)===String(id);})||null;},
    list:function(){var me=currentUid();if(!me)return[];return cleaningEntries().filter(function(entry){var req=entry.occurrence.transferRequest||{};return String(req.status||'').toUpperCase()==='PENDING'&&String(req.toUid||'')===String(me);});},
    toItem:function(entry){var occurrence=entry.occurrence,request=occurrence.transferRequest||{},fromName=memberName(request.fromUid);return{rawId:String(occurrence.id),title:'Overdracht · '+cleaningRoomName(entry.data,occurrence.roomId),body:fromName+' vraagt of jij deze schoonmaakbeurt overneemt.',actorName:fromName,createdAt:Number(request.requestedAt)||Number(occurrence.updatedAt)||0,actions:[{id:'accept',label:'Accepteren'},{id:'decline',label:'Weigeren'},{id:'counter',label:'Ander voorstel',secondary:true}]};},
    action:function(entry,actionId){return cleaningAction(entry.occurrence.id,actionId);}
  };

  var cleaningCounterAdapter={
    domain:'cleaning',type:'cleaning.occurrence.counter',
    findById:function(id){return this.list().find(function(e){return String(e.occurrence.id)===String(id);})||null;},
    list:function(){var me=currentUid();if(!me)return[];return cleaningEntries().filter(function(entry){var req=entry.occurrence.transferRequest||{},counter=req.counterProposal||{};return String(req.status||'').toUpperCase()==='COUNTER_PROPOSED'&&String(counter.status||'').toUpperCase()==='PENDING'&&String(req.fromUid||'')===String(me);});},
    toItem:function(entry){var occurrence=entry.occurrence,request=occurrence.transferRequest||{},counter=request.counterProposal||{},fromName=memberName(counter.fromUid),targetName=memberName(counter.assigneeUid),when=counter.scheduledDate?(' op '+counter.scheduledDate+(counter.scheduledTime?' om '+counter.scheduledTime:'')):'';return{rawId:String(occurrence.id),title:'Tegenvoorstel · '+cleaningRoomName(entry.data,occurrence.roomId),body:fromName+' stelt '+targetName+when+' voor.',actorName:fromName,createdAt:Number(counter.proposedAt)||Number(occurrence.updatedAt)||0,actions:[{id:'accept-counter',label:'Accepteren'},{id:'decline-counter',label:'Weigeren'}]};},
    action:function(entry,actionId){return cleaningAction(entry.occurrence.id,actionId);}
  };

  var ADAPTERS=[taskHelpAdapter,taskSwapAdapter,partyQuestAdapter,cleaningHelpAdapter,cleaningTransferAdapter,cleaningCounterAdapter];
  var SEP='::';

  function itemId(adapter,rawId){return adapter.type+SEP+rawId;}
  function parseItemId(id){var s=String(id||''),i=s.indexOf(SEP);if(i<0)return null;return{type:s.slice(0,i),rawId:s.slice(i+SEP.length)};}
  function adapterForType(type){return ADAPTERS.find(function(a){return a.type===type;})||null;}

  function collect(){
    if(!currentUid())return[];
    var items=[];
    ADAPTERS.forEach(function(adapter){
      var rows;
      try{rows=adapter.list()||[];}catch(e){console.warn('[ActionInboxRegistry] list() failed for '+adapter.type,e);rows=[];}
      rows.forEach(function(raw){
        var projected;
        try{projected=adapter.toItem(raw);}catch(e){console.warn('[ActionInboxRegistry] toItem() failed for '+adapter.type,e);return;}
        if(!projected||!projected.actions||!projected.actions.length)return;
        items.push({id:itemId(adapter,projected.rawId),type:adapter.type,domain:adapter.domain,title:projected.title,body:projected.body,actor:projected.actorName,createdAt:projected.createdAt||0,actions:projected.actions});
      });
    });
    items.sort(function(a,b){return(Number(b.createdAt)||0)-(Number(a.createdAt)||0);});
    return items;
  }

  function runAction(id,actionId){
    var parsed=parseItemId(id),adapter=parsed&&adapterForType(parsed.type);if(!adapter)return Promise.reject(new Error('Onbekend inbox-item'));
    var raw;try{raw=adapter.findById(parsed.rawId);}catch(e){raw=null;}if(!raw)return Promise.reject(new Error('Dit verzoek is niet meer actief'));
    return Promise.resolve().then(function(){return adapter.action(raw,actionId);});
  }

  window.ActionInboxRegistry={version:VERSION,collect:collect,runAction:runAction,_adapters:ADAPTERS};
})();