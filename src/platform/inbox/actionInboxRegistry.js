'use strict';
// ============================================================
// ACTION INBOX REGISTRY v1.0.0
//
// This file is the ONLY place that knows how to (a) find open, actionable
// requests for the current user in a domain's canonical source, and
// (b) route an Inbox action back to that domain's existing runtime.
//
// Hard rules this file must never break:
// - Presence in the Inbox is ALWAYS computed from the canonical domain
//   state (taskData, TaskSwapRequests, PartyQuestInvites,
//   CleaningHouseholdRepository) — never from NotificationStore. A
//   notification that was never created/delivered must not hide an open
//   request, and a stale/resolved notification must never resurrect one.
// - No adapter ever writes directly to Firebase. Every action() call
//   delegates to an existing, already-accepted domain runtime function.
// - No new canonical request state is stored anywhere by this file.
//
// Adding a future module to the Inbox means adding one adapter here with
// {domain, type, findById, list, toItem, action} — nothing else in the
// platform/inbox layer needs to change.
// ============================================================
(function(){
  if(window.ActionInboxRegistry)return;

  var VERSION='1.0.0';

  function context(){try{return window.HouseholdContext&&HouseholdContext.snapshot?HouseholdContext.snapshot():null;}catch(e){return null;}}
  function currentUid(){var c=context();return c&&c.ready&&c.uid||null;}
  function members(){try{return window.TaskSharedData&&TaskSharedData.members?TaskSharedData.members()||[]:[];}catch(e){return[];}}
  function memberName(uid){
    if(!uid)return'Gezinslid';
    var found=members().find(function(m){return String(m.uid||m.id)===String(uid);});
    if(found)return String(found.displayName||found.name||'Gezinslid');
    try{
      var bridge=window.HouseholdIdentityFirebaseBridge,rows=bridge&&bridge.getMembers?bridge.getMembers():[];
      var row=(Array.isArray(rows)?rows:[]).find(function(r){return String(r&&r.uid)===String(uid);});
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
  // Shared status/action semantics are reused from NotificationActions,
  // which itself reads taskData live — no notification-record dependency.
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
  // Adapter: Task-overdracht (swap), read from TaskSwapRequests' own
  // canonical list (already filtered to "pending, targeted at me").
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
  // Adapter: Party Quest invite, read from PartyQuestInvites' own
  // canonical pending list (already filtered to "pending, invited me").
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
  // Cleaning adapters — all read straight from
  // CleaningHouseholdRepository.snapshot().data, the single canonical
  // Cleaning source, exactly like CleaningHelpRequestUi already does for
  // occurrence help requests.
  // ---------------------------------------------------------
  function cleaningData(){try{var repo=window.CleaningHouseholdRepository,snap=repo&&repo.snapshot?repo.snapshot():null;return (snap&&snap.data)||null;}catch(e){return null;}}
  function cleaningRoomName(data,roomId){var room=data&&data.rooms&&data.rooms[roomId];return room&&room.name?String(room.name):'Ruimte';}
  function cleaningRoutines(){var data=cleaningData();return (data&&data.routines)||{};}

  var cleaningHelpAdapter={
    domain:'cleaning',type:'cleaning.help',
    findById:function(id){var entries=this.list();return entries.find(function(e){return String(e.occurrence.id)===String(id);})||null;},
    list:function(){
      try{
        if(!window.CleaningHelpRequestUi||typeof CleaningHelpRequestUi._pendingRequestsForMe!=='function')return[];
        return CleaningHelpRequestUi._pendingRequestsForMe();
      }catch(e){return[];}
    },
    toItem:function(entry){
      var occurrence=entry.occurrence,data=entry.data,request=occurrence.helpRequest||{};
      var fromName=memberName(request.fromUid);
      return{
        rawId:String(occurrence.id),
        title:'Hulp bij '+cleaningRoomName(data,occurrence.roomId),
        body:fromName+' vraagt jouw hulp bij deze schoonmaakbeurt.',
        actorName:fromName,
        createdAt:Number(request.requestedAt)||Number(occurrence.updatedAt)||0,
        actions:[{id:'accept',label:'Accepteren'},{id:'decline',label:'Afwijzen'}]
      };
    },
    action:function(entry,actionId){
      if(!window.CleaningExceptionRuntime||typeof CleaningExceptionRuntime.respondToHelpRequest!=='function')return Promise.reject(new Error('Schoonmaken is nog niet beschikbaar'));
      return CleaningExceptionRuntime.respondToHelpRequest(entry.occurrence.id,actionId==='decline'?'DECLINE_HELP':'ACCEPT_HELP');
    }
  };

  var cleaningRoutineTransferAdapter={
    domain:'cleaning',type:'cleaning.routine.transfer',
    findById:function(id){var row=cleaningRoutines()[id];return row?Object.assign({id:id},row):null;},
    list:function(){
      var me=currentUid();if(!me)return[];
      var routines=cleaningRoutines();
      return Object.keys(routines).map(function(id){return Object.assign({id:id},routines[id]||{});}).filter(function(routine){
        return routine&&routine.active!==false&&routine.assignmentRequestStatus==='PENDING'&&String(routine.preferredAssigneeUid||'')===String(me);
      });
    },
    toItem:function(routine){
      var requesterName=memberName(routine.assignmentRequestedByUid);
      return{
        rawId:String(routine.id),
        title:String(routine.title||'Schoonmaakroutine'),
        body:requesterName+' vraagt of jij deze routine overneemt.',
        actorName:requesterName,
        createdAt:Number(routine.assignmentRequestedAt)||0,
        actions:[{id:'accept',label:'Accepteren'},{id:'decline',label:'Afwijzen'}]
      };
    },
    action:function(routine,actionId){
      if(!window.CleaningRoutineExperience||typeof CleaningRoutineExperience.resolveRequest!=='function')return Promise.reject(new Error('Schoonmaken is nog niet beschikbaar'));
      return CleaningRoutineExperience.resolveRequest(routine.id,actionId!=='decline');
    }
  };

  var cleaningRoutineCounterAdapter={
    domain:'cleaning',type:'cleaning.routine.counter',
    findById:function(id){var row=cleaningRoutines()[id];return row?Object.assign({id:id},row):null;},
    list:function(){
      var me=currentUid();if(!me)return[];
      var routines=cleaningRoutines();
      return Object.keys(routines).map(function(id){return Object.assign({id:id},routines[id]||{});}).filter(function(routine){
        return routine&&routine.active!==false&&routine.assignmentRequestStatus==='COUNTER_PROPOSED'&&String(routine.assignmentRequestedByUid||'')===String(me);
      });
    },
    toItem:function(routine){
      var counterByName=memberName(routine.assignmentCounterProposedByUid);
      var counterTargetName=memberName(routine.assignmentCounterProposedUid);
      return{
        rawId:String(routine.id),
        title:String(routine.title||'Schoonmaakroutine'),
        body:counterByName+' stelt voor dat '+counterTargetName+' deze routine overneemt.',
        actorName:counterByName,
        createdAt:Number(routine.assignmentCounterProposedAt)||0,
        actions:[{id:'accept',label:'Accepteren'},{id:'decline',label:'Afwijzen'},{id:'detail',label:'Ander voorstel',secondary:true}]
      };
    },
    action:function(routine,actionId){
      if(actionId==='detail'){if(typeof window.showScreen==='function')window.showScreen('cleaning');return Promise.resolve(true);}
      if(!window.CleaningRoutineExperience||typeof CleaningRoutineExperience.resolveCounter!=='function')return Promise.reject(new Error('Schoonmaken is nog niet beschikbaar'));
      return CleaningRoutineExperience.resolveCounter(routine.id,actionId!=='decline');
    }
  };

  var ADAPTERS=[taskHelpAdapter,taskSwapAdapter,partyQuestAdapter,cleaningHelpAdapter,cleaningRoutineTransferAdapter,cleaningRoutineCounterAdapter];
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
        items.push({
          id:itemId(adapter,projected.rawId),
          type:adapter.type,
          domain:adapter.domain,
          title:projected.title,
          body:projected.body,
          actor:projected.actorName,
          createdAt:projected.createdAt||0,
          actions:projected.actions
        });
      });
    });
    items.sort(function(a,b){return(Number(b.createdAt)||0)-(Number(a.createdAt)||0);});
    return items;
  }

  function runAction(id,actionId){
    var parsed=parseItemId(id);
    var adapter=parsed&&adapterForType(parsed.type);
    if(!adapter)return Promise.reject(new Error('Onbekend inbox-item'));
    var raw;
    try{raw=adapter.findById(parsed.rawId);}catch(e){raw=null;}
    if(!raw)return Promise.reject(new Error('Dit verzoek is niet meer actief'));
    return Promise.resolve().then(function(){return adapter.action(raw,actionId);});
  }

  window.ActionInboxRegistry={version:VERSION,collect:collect,runAction:runAction,_adapters:ADAPTERS};
})();
