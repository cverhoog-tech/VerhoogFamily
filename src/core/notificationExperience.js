'use strict';
// ============================================================
// FAMILYAPP NOTIFICATION EXPERIENCE v1.1.1 — STEP 11.6
// Presentation-only layer for canonical notifications.
// Does not own delivery, Firebase paths, tokens or push transport.
// v1.1 adds cross-user task completion and Party Quest completion/reward
// presentation while keeping NotificationStore as the only inbox authority.
// v1.1.1 keeps the trusted publisher as event actor while naming the original
// task completer in delayed/offline Party Quest reward presentation.
// ============================================================
(function(){
  if(window.NotificationExperience)return;

  var VERSION='1.1.1';

  function context(){try{return window.HouseholdContext&&HouseholdContext.snapshot?HouseholdContext.snapshot():null;}catch(e){return null;}}
  function currentUid(){var c=context();return c&&c.ready&&c.uid||null;}
  function members(){
    try{
      if(window.TaskSharedData&&typeof TaskSharedData.members==='function'){
        var a=TaskSharedData.members()||[];if(a.length)return a;
      }
      if(window.HouseholdIdentityFirebaseBridge&&typeof HouseholdIdentityFirebaseBridge.getMembers==='function'){
        var b=HouseholdIdentityFirebaseBridge.getMembers()||[];if(b.length)return b;
      }
      if(window.HouseholdIdentity&&typeof HouseholdIdentity.getMembers==='function')return HouseholdIdentity.getMembers()||[];
    }catch(e){}
    return[];
  }
  function memberUid(m){return m&&(m.uid||m.id)||null;}
  function memberName(uid,fallback){var m=members().find(function(x){return String(memberUid(x))===String(uid);});return m&&(m.displayName||m.name)||fallback||'Gezinslid';}
  function actorName(){return String(window.myName||memberName(currentUid(),'Een gezinslid'));}
  function unique(values){var seen={};return (values||[]).filter(Boolean).map(String).filter(function(id){if(seen[id])return false;seen[id]=true;return true;});}
  function withoutSelf(values){var me=String(currentUid()||'');return unique(values).filter(function(id){return String(id)!==me;});}
  function otherMemberUids(){var me=currentUid();return members().filter(function(m){return memberUid(m)&&m.status!=='inactive'&&m.status!=='removed';}).map(memberUid).filter(function(id){return String(id)!==String(me);});}
  function assignees(task){var out=[];if(task&&task.assignedToUids&&typeof task.assignedToUids==='object')Object.keys(task.assignedToUids).forEach(function(id){if(task.assignedToUids[id])out.push(String(id));});if(task&&task.assignedToUid)out.push(String(task.assignedToUid));return Array.from(new Set(out));}
  function clean(v){return String(v==null?'':v).trim()||'unknown';}
  function key(){return Array.prototype.slice.call(arguments).map(clean).join(':');}
  function taskId(task){return clean(task&&(task.id||task._key));}
  function questId(q){return clean(q&&(q.id||q._key));}
  function entity(type,id){return{type:type,id:String(id==null?'':id)};}
  function store(type){if(!window.NotificationStore)throw new Error('NotificationStore niet beschikbaar');if(NotificationStore.registerType)NotificationStore.registerType(type);return NotificationStore;}
  function publishTo(eventKey,type,uids,payload){uids=unique(uids);if(!uids.length)return Promise.resolve(null);return store(type).publishToUidsOnce(eventKey,type,uids,payload);}
  function publishHousehold(eventKey,type,payload){return store(type).publishHouseholdOnce(eventKey,type,payload);}
  function taskLabel(task){return String(task&&(task.title||task.name)||'taak');}
  function questLabel(q){return String(q&&(q.questTitle||q.title||q.name)||'Party Quest');}
  function mealLabel(row){return String(row&&(row.title||row.recipeTitleSnapshot)||'Maaltijd');}
  function dayLabel(date){
    var s=String(date||'');if(!s)return'deze dag';
    try{var d=new Date(s+'T12:00:00');if(!isNaN(d.getTime()))return new Intl.DateTimeFormat('nl-NL',{weekday:'long'}).format(d);}catch(e){}
    return s;
  }
  function calendarWhen(row){var date=String(row&&row.date||''),time=String(row&&row.time||'');if(!date)return time||'';try{var d=new Date(date+'T12:00:00');var label=new Intl.DateTimeFormat('nl-NL',{weekday:'short',day:'numeric',month:'short'}).format(d);return label+(time?' · '+time:'');}catch(e){return date+(time?' · '+time:'');}}

  function taskHelpRequested(task,targetUid){
    var recipients=targetUid?[String(targetUid)]:otherMemberUids();recipients=recipients.filter(function(id){return String(id)!==String(currentUid());});
    var occurrence=task&&task.helpRequestedAt||task&&task.updatedAt||task&&task.createdAt||'legacy';
    return publishTo(key('task.help.requested',taskId(task),occurrence,targetUid||'household'),'task.help.requested',recipients,{
      icon:'help',bg:'#dbeafe',tone:'action',title:actorName()+' heeft je hulp nodig',body:'Kun je helpen met “'+taskLabel(task)+'”?',entity:entity('task',task&&(task.id||task._key)),data:{taskId:String(task&&task.id||''),taskKey:String(task&&task._key||''),targetUid:targetUid?String(targetUid):'',action:'help',occurrence:String(occurrence)}
    });
  }
  function taskHelpJoined(task,requesterUid){
    var recipients=requesterUid?[String(requesterUid)]:assignees(task).filter(function(id){return String(id)!==String(currentUid());});
    var occurrence=task&&task.helpAcceptedAt||task&&task.updatedAt||'legacy';
    return publishTo(key('task.help.joined',taskId(task),occurrence,currentUid()||'helper',requesterUid||'requester'),'task.help.joined',recipients,{
      icon:'party',bg:'#dcfce7',tone:'success',title:actorName()+' helpt mee',body:'Bij “'+taskLabel(task)+'”.',entity:entity('task',task&&(task.id||task._key)),data:{taskId:String(task&&task.id||''),taskKey:String(task&&task._key||''),requesterUid:requesterUid?String(requesterUid):'',action:'helpJoined',occurrence:String(occurrence)}
    });
  }
  function taskSwapRequested(task,targetUid,request){request=request||{};if(!targetUid)return Promise.reject(new Error('Ontvanger ontbreekt'));var requestId=request.id||request._key||key(taskId(task),request.createdAt||'legacy',currentUid()||'requester',targetUid);return publishTo(key('task.swap.requested',requestId),'task.swap.requested',[targetUid],{
    icon:'undo',bg:'#ede9fe',tone:'action',title:'Nieuw ruilverzoek',body:actorName()+' wil “'+taskLabel(task)+'” met je ruilen.',entity:entity('task',task&&(task.id||task._key)),data:{taskId:String(task&&task.id||''),taskKey:String(task&&task._key||''),swapRequestId:String(request.id||''),action:'swapRequested',targetUid:String(targetUid)}
  });}
  function taskSwapResolved(task,requesterUid,accepted,request){request=request||{};if(!requesterUid)return Promise.resolve(null);var requestId=request.id||request._key||key(taskId(task),request.createdAt||'legacy',requesterUid,request.targetUid||currentUid()||'target'),type=accepted?'task.swap.accepted':'task.swap.declined';return publishTo(key(type,requestId),type,[requesterUid],{
    icon:accepted?'tasks':'undo',bg:accepted?'#dcfce7':'#f1f5f9',tone:accepted?'success':'neutral',title:actorName()+(accepted?' accepteerde je ruilverzoek':' wees je ruilverzoek af'),body:accepted?'“'+taskLabel(task)+'” is geruild.':'Voor “'+taskLabel(task)+'”.',entity:entity('task',task&&(task.id||task._key)),data:{taskId:String(task&&task.id||''),taskKey:String(task&&task._key||''),swapRequestId:String(request.id||''),action:accepted?'swapAccepted':'swapDeclined'}
  });}
  function taskCompleted(task,targetUids,options){
    options=options||{};
    var recipients=withoutSelf(targetUids||[]);if(!recipients.length)return Promise.resolve(null);
    var occurrence=options.occurrence||task&&task.completedAt||task&&task.updatedAt||'legacy',type='task.completed.involved';
    return publishTo(key(type,taskId(task),occurrence,options.completedByUid||currentUid()||'actor'),type,recipients,{
      icon:'tasks',bg:'#dcfce7',tone:'success',title:actorName()+' voltooide “'+taskLabel(task)+'”',body:'Je was bij deze taak betrokken.',entity:entity('task',task&&(task.id||task._key)),data:{taskId:String(task&&task.id||''),taskKey:String(task&&task._key||''),completedByUid:String(options.completedByUid||currentUid()||''),occurrence:String(occurrence),action:'completed'}
    });
  }
  function partyQuestCreated(q,targetUids){var recipients=Array.isArray(targetUids)&&targetUids.length?targetUids:otherMemberUids();recipients=recipients.filter(function(id){return String(id)!==String(currentUid());});return publishTo(key('partyQuest.created',questId(q)),'partyQuest.created',recipients,{
    icon:'party',bg:'#ede9fe',tone:'action',title:actorName()+' nodigt je uit',body:'Party Quest · “'+questLabel(q)+'”',entity:entity('partyQuest',q&&(q.id||q._key)),data:{questId:String(q&&q.id||''),questTaskId:String(q&&q.questId||''),action:'created'}
  });}
  function partyQuestInvitationSent(q,targetUid){var owner=String(q&&q.inviterUid||currentUid()||'');if(!owner||!targetUid)return Promise.resolve(null);return publishTo(key('partyQuest.invitation.sent',questId(q),targetUid),'partyQuest.invitation.sent',[owner],{
    icon:'party',bg:'#fef3c7',tone:'action',title:'Uitnodiging verzonden',body:memberName(targetUid)+' is uitgenodigd voor “'+questLabel(q)+'”.',channels:['inApp'],entity:entity('partyQuest',q&&(q.id||q._key)),data:{questId:String(q&&q.id||''),questTaskId:String(q&&q.questId||''),inviteeUid:String(targetUid),action:'revokeInvitation'}
  });}
  function partyQuestJoined(q,ownerUid){return publishTo(key('partyQuest.joined',questId(q),currentUid()||'member'),'partyQuest.joined',ownerUid?[ownerUid]:[],{
    icon:'party',bg:'#dbeafe',tone:'success',title:actorName()+' doet mee',body:'Aan Party Quest “'+questLabel(q)+'”.',entity:entity('partyQuest',q&&(q.id||q._key)),data:{questId:String(q&&q.id||''),questTaskId:String(q&&q.questId||''),action:'joined'}
  });}
  function partyQuestCompleted(q,targetUids,options){
    options=options||{};
    var completion=q&&q.completion||{},fallback=Array.isArray(completion.participantUids)?completion.participantUids:otherMemberUids(),recipients=withoutSelf(Array.isArray(targetUids)?targetUids:fallback);
    if(!recipients.length)return Promise.resolve(null);
    var xp=Math.max(0,Math.round(Number(options.xp!=null?options.xp:completion.xpPerParticipant)||0));
    var occurrence=options.occurrence||completion.occurrenceId||q&&q.endedAt||'completed';
    var completedByUid=String(options.completedByUid||completion.taskCompletedByUid||currentUid()||'');
    var completedByName=memberName(completedByUid,actorName());
    var body='Party Quest “'+questLabel(q)+'” is voltooid.'+(xp?' Jij verdiende +'+xp+' XP.':'');
    return publishTo(key('partyQuest.completed',questId(q)),'partyQuest.completed',recipients,{
      icon:'party',bg:'#fef3c7',tone:'celebration',title:completedByName+' voltooide “'+questLabel(q)+'”',body:body,entity:entity('partyQuest',q&&(q.id||q._key)),data:{questId:String(q&&q.id||''),questTaskId:String(q&&q.questId||''),completedByUid:completedByUid,xp:xp,occurrence:String(occurrence),action:'completed'}
    });
  }

  function shoppingItemsAdded(items,occurrence){items=(items||[]).filter(Boolean);if(!items.length)return Promise.resolve(null);var type='shopping.items.added',names=items.map(function(x){return String(x.name||x.title||x.label||'Boodschap');});return publishTo(key(type,occurrence||items.map(function(x){return x.id||x._key||x.createdAt;}).join(',')),type,otherMemberUids(),{
    icon:'tasks',bg:'#ecfdf5',tone:'success',title:items.length===1?actorName()+' heeft iets toegevoegd':actorName()+' heeft boodschappen toegevoegd',body:items.length===1?'“'+names[0]+'” staat nu op de boodschappenlijst.':items.length+' nieuwe items staan op de lijst.',entity:entity('shoppingList','household'),data:{count:items.length,itemIds:items.map(function(x){return String(x.id||x._key||'');})}
  });}
  function mealPlanned(row){var type='meal.planned';return publishTo(key(type,row&&row.id||row&&row._key,row&&row.createdAt),type,otherMemberUids(),{
    icon:'tasks',bg:'#fff7ed',tone:'meal',title:'Het eten voor '+dayLabel(row&&row.date)+' is gepland',body:actorName()+' heeft “'+mealLabel(row)+'” toegevoegd.',entity:entity('meal',row&&(row.id||row._key)),data:{mealId:String(row&&row.id||''),date:String(row&&row.date||''),mealType:String(row&&row.mealType||'')}
  });}
  function mealUpdated(row){var type='meal.updated';return publishTo(key(type,row&&row.id||row&&row._key,row&&row.updatedAt),type,otherMemberUids(),{
    icon:'tasks',bg:'#fff7ed',tone:'meal',title:'Het eten voor '+dayLabel(row&&row.date)+' is gewijzigd',body:actorName()+' veranderde het naar “'+mealLabel(row)+'”.',entity:entity('meal',row&&(row.id||row._key)),data:{mealId:String(row&&row.id||''),date:String(row&&row.date||''),mealType:String(row&&row.mealType||'')}
  });}
  function taskAssigned(task,targetUids){targetUids=(targetUids||[]).filter(function(id){return id&&String(id)!==String(currentUid());});if(!targetUids.length)return Promise.resolve(null);var type='task.assigned';return publishTo(key(type,taskId(task),task&&task.updatedAt||task&&task.createdAt,targetUids.join(',')),type,targetUids,{
    icon:'tasks',bg:'#ede9fe',tone:'action',title:'Nieuwe taak voor jou',body:actorName()+' heeft “'+taskLabel(task)+'” aan jou toegewezen.',entity:entity('task',task&&(task.id||task._key)),data:{taskId:String(task&&task.id||''),taskKey:String(task&&task._key||'')}
  });}
  function calendarCreated(row){var type='calendar.event.created',when=calendarWhen(row);return publishTo(key(type,row&&row.id||row&&row._key,row&&row.createdAt),type,otherMemberUids(),{
    icon:'bell',bg:'#eef2ff',tone:'calendar',title:actorName()+' heeft iets gepland',body:'“'+String(row&&row.title||'Afspraak')+'”'+(when?' · '+when:''),entity:entity('calendarEvent',row&&(row.id||row._key)),data:{eventId:String(row&&row.id||''),date:String(row&&row.date||''),time:String(row&&row.time||'')}
  });}
  function calendarUpdated(row){var type='calendar.event.updated',when=calendarWhen(row);return publishTo(key(type,row&&row.id||row&&row._key,row&&row.updatedAt),type,otherMemberUids(),{
    icon:'bell',bg:'#eef2ff',tone:'calendar',title:'Afspraak gewijzigd',body:actorName()+' wijzigde “'+String(row&&row.title||'Afspraak')+'”'+(when?' · '+when:'')+'.',entity:entity('calendarEvent',row&&(row.id||row._key)),data:{eventId:String(row&&row.id||''),date:String(row&&row.date||''),time:String(row&&row.time||'')}
  });}
  function householdMemberJoined(member){var uid=memberUid(member),name=String(member&&(member.displayName||member.name)||'Een gezinslid'),type='household.member.joined';return publishHousehold(key(type,uid,member&&member.joinedAt||member&&member.createdAt||'joined'),type,{
    icon:'party',bg:'#ecfdf5',tone:'celebration',title:name+' is erbij! 👋',body:name+' is lid geworden van jullie gezin.',entity:entity('householdMember',uid),data:{memberUid:String(uid||'')}
  });}
  function householdMemberLeft(member,occurrence){var uid=memberUid(member),name=String(member&&(member.displayName||member.name)||'Een gezinslid'),type='household.member.left';return publishHousehold(key(type,uid,occurrence||member&&member.updatedAt||Date.now()),type,{
    icon:'party',bg:'#f1f5f9',tone:'neutral',title:name+' heeft het gezin verlaten',body:name+' maakt geen deel meer uit van dit gezin.',entity:entity('householdMember',uid),data:{memberUid:String(uid||'')}
  });}

  var events=window.NotificationEvents=window.NotificationEvents||{};
  events.taskHelpRequested=taskHelpRequested;
  events.taskHelpJoined=taskHelpJoined;
  events.taskSwapRequested=taskSwapRequested;
  events.taskSwapResolved=taskSwapResolved;
  events.taskCompleted=taskCompleted;
  events.partyQuestCreated=partyQuestCreated;
  events.partyQuestInvitationSent=partyQuestInvitationSent;
  events.partyQuestJoined=partyQuestJoined;
  events.partyQuestCompleted=partyQuestCompleted;
  events.shoppingItemsAdded=shoppingItemsAdded;
  events.mealPlanned=mealPlanned;
  events.mealUpdated=mealUpdated;
  events.taskAssigned=taskAssigned;
  events.calendarCreated=calendarCreated;
  events.calendarUpdated=calendarUpdated;
  events.householdMemberJoined=householdMemberJoined;
  events.householdMemberLeft=householdMemberLeft;

  ['task.completed.involved','shopping.items.added','meal.planned','meal.updated','task.assigned','calendar.event.created','calendar.event.updated','household.member.joined','household.member.left'].forEach(function(type){try{store(type);}catch(e){}});

  window.NotificationExperience={version:VERSION,dayLabel:dayLabel,calendarWhen:calendarWhen};
})();
