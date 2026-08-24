'use strict';
// ============================================================
// NOTIFICATION DOMAIN EVENTS v2.0.0 — STEP 10
// Stable, deterministic domain API for notification-worthy FamilyApp events.
// Domain modules never construct Firebase paths or audience persistence.
// ============================================================
(function(){
  if(window.NotificationEvents)return;

  var VERSION='2.0.0';

  function context(){try{return window.HouseholdContext&&HouseholdContext.snapshot?HouseholdContext.snapshot():null;}catch(e){return null;}}
  function currentUid(){var c=context();return c&&c.ready&&c.uid||null;}
  function members(){
    try{
      if(window.TaskSharedData&&typeof TaskSharedData.members==='function'){
        var taskMembers=TaskSharedData.members()||[];if(taskMembers.length)return taskMembers;
      }
      if(window.HouseholdIdentityFirebaseBridge&&typeof HouseholdIdentityFirebaseBridge.getMembers==='function'){
        var bridged=HouseholdIdentityFirebaseBridge.getMembers()||[];if(bridged.length)return bridged;
      }
      if(window.HouseholdIdentity&&typeof HouseholdIdentity.getMembers==='function')return HouseholdIdentity.getMembers()||[];
    }catch(e){}
    return[];
  }
  function memberUid(m){return m&&(m.uid||m.id)||null;}
  function memberName(uid){var m=members().find(function(x){return String(memberUid(x))===String(uid);});return m&&(m.displayName||m.name)||'Gezinslid';}
  function activeMembers(){return members().filter(function(m){return memberUid(m)&&m.status!=='inactive'&&m.status!=='removed';});}
  function otherMemberUids(){var me=currentUid();return activeMembers().map(memberUid).filter(function(id){return id&&String(id)!==String(me);});}
  function taskAssigneeUids(task){
    var out=[];
    if(task&&task.assignedToUids&&typeof task.assignedToUids==='object')Object.keys(task.assignedToUids).forEach(function(id){if(task.assignedToUids[id])out.push(id);});
    if(task&&task.assignedToUid)out.push(task.assignedToUid);
    return Array.from(new Set(out.filter(Boolean).map(String)));
  }
  function entity(type,id){return{type:type,id:String(id==null?'':id)};}
  function requireStore(){if(!window.NotificationStore)throw new Error('NotificationStore niet beschikbaar');return NotificationStore;}
  function storeForType(type){var s=requireStore();if(s.registerType)s.registerType(type);return s;}
  function cleanPart(value){return String(value==null?'':value).trim()||'unknown';}
  function eventKey(){return Array.prototype.slice.call(arguments).map(cleanPart).join(':');}
  function taskId(task){return cleanPart(task&&(task.id||task._key));}
  function questId(quest){return cleanPart(quest&&(quest.id||quest._key));}
  function publishTo(key,type,uids,payload){
    uids=Array.from(new Set((uids||[]).filter(Boolean).map(String)));
    if(!uids.length)return Promise.resolve(null);
    return storeForType(type).publishToUidsOnce(key,type,uids,payload);
  }
  function publishHousehold(key,type,payload){return storeForType(type).publishHouseholdOnce(key,type,payload);}
  function questLabel(quest){return String(quest&&(quest.questTitle||quest.title||quest.name)||'Party Quest');}

  function taskHelpRequested(task,targetUid){
    if(!task)return Promise.reject(new Error('Taak ontbreekt'));
    var recipients=targetUid?[String(targetUid)]:otherMemberUids();
    recipients=recipients.filter(function(id){return id&&String(id)!==String(currentUid());});
    var occurrence=task.helpRequestedAt||task.updatedAt||task.createdAt||'legacy';
    var key=eventKey('task.help.requested',taskId(task),occurrence,targetUid||'household');
    return publishTo(key,'task.help.requested',recipients,{
      icon:'help',bg:'#dbeafe',tone:'action',title:'Hulp gevraagd',
      body:(window.myName||'Een gezinslid')+' vraagt hulp bij “'+String(task.title||task.name||'taak')+'”.',
      entity:entity('task',task.id||task._key),
      data:{taskId:String(task.id||''),taskKey:String(task._key||''),targetUid:targetUid?String(targetUid):'',action:'help',occurrence:String(occurrence)}
    });
  }

  function taskHelpJoined(task,requesterUid){
    if(!task)return Promise.reject(new Error('Taak ontbreekt'));
    var recipients=requesterUid?[String(requesterUid)]:taskAssigneeUids(task).filter(function(id){return String(id)!==String(currentUid());});
    var occurrence=task.helpAcceptedAt||task.updatedAt||'legacy';
    var key=eventKey('task.help.joined',taskId(task),occurrence,currentUid()||'helper',requesterUid||'requester');
    return publishTo(key,'task.help.joined',recipients,{
      icon:'party',bg:'#dcfce7',tone:'success',title:'Hulp onderweg',
      body:(window.myName||'Een gezinslid')+' helpt mee met “'+String(task.title||task.name||'taak')+'”.',
      entity:entity('task',task.id||task._key),
      data:{taskId:String(task.id||''),taskKey:String(task._key||''),requesterUid:requesterUid?String(requesterUid):'',action:'helpJoined',occurrence:String(occurrence)}
    });
  }

  function taskSwapRequested(task,targetUid,request){
    if(!targetUid)return Promise.reject(new Error('Ontvanger ontbreekt'));
    request=request||{};
    var requestId=request.id||request._key||eventKey(taskId(task),request.createdAt||'legacy',currentUid()||'requester',targetUid);
    var key=eventKey('task.swap.requested',requestId);
    return publishTo(key,'task.swap.requested',[targetUid],{
      icon:'undo',bg:'#ede9fe',tone:'action',title:'Ruilverzoek',
      body:(window.myName||'Een gezinslid')+' wil “'+String(task&&(task.title||task.name)||'taak')+'” met je ruilen.',
      entity:entity('task',task&&(task.id||task._key)),
      data:{taskId:String(task&&task.id||''),taskKey:String(task&&task._key||''),swapRequestId:String(request.id||''),action:'swapRequested',targetUid:String(targetUid)}
    });
  }

  function taskSwapResolved(task,requesterUid,accepted,request){
    if(!requesterUid)return Promise.resolve(null);
    request=request||{};
    var requestId=request.id||request._key||eventKey(taskId(task),request.createdAt||'legacy',requesterUid,request.targetUid||currentUid()||'target');
    var type=accepted?'task.swap.accepted':'task.swap.declined';
    var key=eventKey(type,requestId);
    return publishTo(key,type,[requesterUid],{
      icon:accepted?'tasks':'undo',bg:accepted?'#dcfce7':'#f1f5f9',tone:accepted?'success':'neutral',title:accepted?'Ruil geaccepteerd':'Ruil afgewezen',
      body:(window.myName||'Een gezinslid')+(accepted?' accepteerde ':' wees ')+'het ruilverzoek voor “'+String(task&&(task.title||task.name)||'taak')+'”'+(accepted?' toe.':' af.'),
      entity:entity('task',task&&(task.id||task._key)),
      data:{taskId:String(task&&task.id||''),taskKey:String(task&&task._key||''),swapRequestId:String(request.id||''),action:accepted?'swapAccepted':'swapDeclined'}
    });
  }

  function partyQuestCreated(quest,targetUids){
    var recipients=Array.isArray(targetUids)&&targetUids.length?targetUids:otherMemberUids();
    recipients=recipients.filter(function(id){return id&&String(id)!==String(currentUid());});
    var key=eventKey('partyQuest.created',questId(quest));
    return publishTo(key,'partyQuest.created',recipients,{
      icon:'party',bg:'#ede9fe',tone:'action',title:'Nieuwe Party Quest',
      body:(window.myName||'Een gezinslid')+' nodigt je uit voor “'+questLabel(quest)+'”.',
      entity:entity('partyQuest',quest&&(quest.id||quest._key)),
      data:{questId:String(quest&&quest.id||''),questTaskId:String(quest&&quest.questId||''),action:'created'}
    });
  }

  function partyQuestInvitationSent(quest,targetUid){
    var owner=String(quest&&quest.inviterUid||currentUid()||'');
    if(!owner||!targetUid)return Promise.resolve(null);
    var key=eventKey('partyQuest.invitation.sent',questId(quest),targetUid);
    return publishTo(key,'partyQuest.invitation.sent',[owner],{
      icon:'party',bg:'#fef3c7',tone:'action',title:'Uitnodiging verstuurd',
      body:memberName(targetUid)+' is uitgenodigd voor “'+questLabel(quest)+'”.',
      entity:entity('partyQuest',quest&&(quest.id||quest._key)),
      data:{questId:String(quest&&quest.id||''),questTaskId:String(quest&&quest.questId||''),inviteeUid:String(targetUid),action:'revokeInvitation'}
    });
  }

  function partyQuestJoined(quest,ownerUid){
    var key=eventKey('partyQuest.joined',questId(quest),currentUid()||'member');
    return publishTo(key,'partyQuest.joined',ownerUid?[ownerUid]:[],{
      icon:'party',bg:'#dbeafe',tone:'success',title:'Party-lid aangesloten',
      body:(window.myName||'Een gezinslid')+' doet mee met “'+questLabel(quest)+'”.',
      entity:entity('partyQuest',quest&&(quest.id||quest._key)),
      data:{questId:String(quest&&quest.id||''),questTaskId:String(quest&&quest.questId||''),action:'joined'}
    });
  }

  function partyQuestCompleted(quest){
    var key=eventKey('partyQuest.completed',questId(quest));
    return publishHousehold(key,'partyQuest.completed',{
      icon:'party',bg:'#fef3c7',tone:'celebration',title:'Party Quest voltooid!',
      body:'“'+questLabel(quest)+'” is samen voltooid.',
      entity:entity('partyQuest',quest&&(quest.id||quest._key)),
      data:{questId:String(quest&&quest.id||''),questTaskId:String(quest&&quest.questId||''),action:'completed'}
    });
  }

  function financeSavingsUpdated(goal,transaction){
    if(!goal)return Promise.reject(new Error('Spaardoel ontbreekt'));
    transaction=transaction||{};
    var type=transaction.type==='withdrawal'?'withdrawal':'deposit';
    var amount=Math.abs(Number(transaction.amount)||0);
    var who=transaction.who||window.myName||'Een gezinslid';
    var recipients=otherMemberUids();
    var transactionId=transaction.id||transaction._key||eventKey(transaction.date||'date',type,amount,who,transaction.note||'');
    var key=eventKey('finance.savings.updated',goal.id||'goal',transactionId);
    return publishTo(key,'finance.savings.updated',recipients,{
      icon:'tasks',bg:'#dbeafe',tone:'finance',title:String(goal.icon||'🎯')+' '+String(goal.name||'Spaardoel'),
      body:String(who)+' '+(type==='deposit'?'zette € ':'nam € ')+amount.toFixed(0)+(type==='deposit'?' opzij':' op')+(transaction.note?' — '+String(transaction.note):''),
      entity:entity('savingsGoal',goal.id),
      data:{goalId:String(goal.id||''),transactionId:String(transaction.id||transaction._key||''),transactionType:type,amount:amount,who:String(who),date:String(transaction.date||''),note:String(transaction.note||'')}
    });
  }

  window.NotificationEvents={
    version:VERSION,
    members:activeMembers,
    otherMemberUids:otherMemberUids,
    taskAssigneeUids:taskAssigneeUids,
    eventKey:eventKey,
    taskHelpRequested:taskHelpRequested,
    taskHelpJoined:taskHelpJoined,
    taskSwapRequested:taskSwapRequested,
    taskSwapResolved:taskSwapResolved,
    partyQuestCreated:partyQuestCreated,
    partyQuestInvitationSent:partyQuestInvitationSent,
    partyQuestJoined:partyQuestJoined,
    partyQuestCompleted:partyQuestCompleted,
    financeSavingsUpdated:financeSavingsUpdated
  };
})();
