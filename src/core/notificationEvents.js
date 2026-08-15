'use strict';
// ============================================================
// NOTIFICATION DOMAIN EVENTS v1.4.0
// Stable domain API for notification-worthy FamilyApp events.
// Domain modules never construct Firebase paths or audience structures.
// ============================================================
(function(){
  if(window.NotificationEvents)return;

  var VERSION='1.4.0';

  function currentUid(){try{return (window.fbUser||(window.firebase&&firebase.auth&&firebase.auth().currentUser)||{}).uid||null;}catch(e){return null;}}
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
  function otherMemberUids(){var me=currentUid();return activeMembers().map(memberUid).filter(function(id){return id&&id!==me;});}
  function taskAssigneeUids(task){
    var out=[];
    if(task&&task.assignedToUids&&typeof task.assignedToUids==='object')Object.keys(task.assignedToUids).forEach(function(id){if(task.assignedToUids[id])out.push(id);});
    if(task&&task.assignedToUid)out.push(task.assignedToUid);
    return Array.from(new Set(out.filter(Boolean).map(String)));
  }
  function entity(type,id){return{type:type,id:String(id==null?'':id)};}
  function requireStore(){if(!window.NotificationStore)throw new Error('NotificationStore niet beschikbaar');return NotificationStore;}
  function publishTo(type,uids,payload){
    uids=Array.from(new Set((uids||[]).filter(Boolean).map(String)));
    if(!uids.length)return Promise.resolve(null);
    return requireStore().publishToUids(type,uids,payload);
  }
  function publishHousehold(type,payload){return requireStore().publishHousehold(type,payload);}
  function questLabel(quest){return String(quest&&(quest.questTitle||quest.title||quest.name)||'Party Quest');}

  // Registered here so older NotificationStore builds can consume the new event
  // without coupling the store to a particular domain release.
  try{if(window.NotificationStore&&NotificationStore.registerType)NotificationStore.registerType('partyQuest.invitation.sent');}catch(e){}

  function taskHelpRequested(task,targetUid){
    if(!task)return Promise.reject(new Error('Taak ontbreekt'));
    var recipients=targetUid?[String(targetUid)]:otherMemberUids();
    recipients=recipients.filter(function(id){return id&&id!==currentUid();});
    return publishTo('task.help.requested',recipients,{
      icon:'help',bg:'#dbeafe',tone:'action',title:'Hulp gevraagd',
      body:(window.myName||'Een gezinslid')+' vraagt hulp bij “'+String(task.title||task.name||'taak')+'”.',
      entity:entity('task',task.id||task._key),
      data:{taskId:String(task.id||''),taskKey:String(task._key||''),targetUid:targetUid?String(targetUid):'',action:'help'}
    });
  }
  function taskHelpJoined(task,requesterUid){
    if(!task)return Promise.reject(new Error('Taak ontbreekt'));
    var recipients=requesterUid?[String(requesterUid)]:taskAssigneeUids(task).filter(function(id){return id!==currentUid();});
    return publishTo('task.help.joined',recipients,{
      icon:'party',bg:'#dcfce7',tone:'success',title:'Hulp onderweg',
      body:(window.myName||'Een gezinslid')+' helpt mee met “'+String(task.title||task.name||'taak')+'”.',
      entity:entity('task',task.id||task._key),
      data:{taskId:String(task.id||''),taskKey:String(task._key||''),requesterUid:requesterUid?String(requesterUid):'',action:'helpJoined'}
    });
  }
  function taskSwapRequested(task,targetUid){
    if(!targetUid)return Promise.reject(new Error('Ontvanger ontbreekt'));
    return publishTo('task.swap.requested',[targetUid],{
      icon:'undo',bg:'#ede9fe',tone:'action',title:'Ruilverzoek',
      body:(window.myName||'Een gezinslid')+' wil “'+String(task&&(task.title||task.name)||'taak')+'” met je ruilen.',
      entity:entity('task',task&&(task.id||task._key)),
      data:{taskId:String(task&&task.id||''),taskKey:String(task&&task._key||''),action:'swapRequested',targetUid:String(targetUid)}
    });
  }
  function taskSwapResolved(task,requesterUid,accepted){
    if(!requesterUid)return Promise.resolve(null);
    return publishTo(accepted?'task.swap.accepted':'task.swap.declined',[requesterUid],{
      icon:accepted?'tasks':'undo',bg:accepted?'#dcfce7':'#f1f5f9',tone:accepted?'success':'neutral',title:accepted?'Ruil geaccepteerd':'Ruil afgewezen',
      body:(window.myName||'Een gezinslid')+(accepted?' accepteerde ':' wees ')+'het ruilverzoek voor “'+String(task&&(task.title||task.name)||'taak')+'”'+(accepted?' toe.':' af.'),
      entity:entity('task',task&&(task.id||task._key)),data:{taskId:String(task&&task.id||''),taskKey:String(task&&task._key||''),action:accepted?'swapAccepted':'swapDeclined'}
    });
  }
  function partyQuestCreated(quest,targetUids){
    var recipients=Array.isArray(targetUids)&&targetUids.length?targetUids:otherMemberUids();
    recipients=recipients.filter(function(id){return id&&String(id)!==String(currentUid());});
    return publishTo('partyQuest.created',recipients,{
      icon:'party',bg:'#ede9fe',tone:'action',title:'Nieuwe Party Quest',
      body:(window.myName||'Een gezinslid')+' nodigt je uit voor “'+questLabel(quest)+'”.',
      entity:entity('partyQuest',quest&&(quest.id||quest._key)),data:{questId:String(quest&&quest.id||''),questTaskId:String(quest&&quest.questId||''),action:'created'}
    });
  }
  function partyQuestInvitationSent(quest,targetUid){
    var owner=String(quest&&quest.inviterUid||currentUid()||'');
    if(!owner||!targetUid)return Promise.resolve(null);
    return publishTo('partyQuest.invitation.sent',[owner],{
      icon:'party',bg:'#fef3c7',tone:'action',title:'Uitnodiging verstuurd',
      body:memberName(targetUid)+' is uitgenodigd voor “'+questLabel(quest)+'”.',
      entity:entity('partyQuest',quest&&(quest.id||quest._key)),
      data:{questId:String(quest&&quest.id||''),questTaskId:String(quest&&quest.questId||''),inviteeUid:String(targetUid),action:'revokeInvitation'}
    });
  }
  function partyQuestJoined(quest,ownerUid){
    return publishTo('partyQuest.joined',ownerUid?[ownerUid]:[],{
      icon:'party',bg:'#dbeafe',tone:'success',title:'Party-lid aangesloten',
      body:(window.myName||'Een gezinslid')+' doet mee met “'+questLabel(quest)+'”.',
      entity:entity('partyQuest',quest&&(quest.id||quest._key)),data:{questId:String(quest&&quest.id||''),questTaskId:String(quest&&quest.questId||''),action:'joined'}
    });
  }
  function partyQuestCompleted(quest){
    return publishHousehold('partyQuest.completed',{
      icon:'party',bg:'#fef3c7',tone:'celebration',title:'Party Quest voltooid!',
      body:'“'+questLabel(quest)+'” is samen voltooid.',
      entity:entity('partyQuest',quest&&(quest.id||quest._key)),data:{questId:String(quest&&quest.id||''),questTaskId:String(quest&&quest.questId||''),action:'completed'}
    });
  }
  function financeSavingsUpdated(goal,transaction){
    if(!goal)return Promise.reject(new Error('Spaardoel ontbreekt'));
    transaction=transaction||{};
    var type=transaction.type==='withdrawal'?'withdrawal':'deposit';
    var amount=Math.abs(Number(transaction.amount)||0);
    var who=transaction.who||window.myName||'Een gezinslid';
    var recipients=otherMemberUids();
    return publishTo('finance.savings.updated',recipients,{
      icon:'tasks',bg:'#dbeafe',tone:'finance',title:String(goal.icon||'🎯')+' '+String(goal.name||'Spaardoel'),
      body:String(who)+' '+(type==='deposit'?'zette € ':'nam € ')+amount.toFixed(0)+(type==='deposit'?' opzij':' op')+(transaction.note?' — '+String(transaction.note):''),
      entity:entity('savingsGoal',goal.id),
      data:{goalId:String(goal.id||''),transactionType:type,amount:amount,who:String(who),date:String(transaction.date||''),note:String(transaction.note||'')}
    });
  }

  window.NotificationEvents={
    version:VERSION,members:activeMembers,otherMemberUids:otherMemberUids,taskAssigneeUids:taskAssigneeUids,
    taskHelpRequested:taskHelpRequested,taskHelpJoined:taskHelpJoined,taskSwapRequested:taskSwapRequested,taskSwapResolved:taskSwapResolved,
    partyQuestCreated:partyQuestCreated,partyQuestInvitationSent:partyQuestInvitationSent,partyQuestJoined:partyQuestJoined,partyQuestCompleted:partyQuestCompleted,
    financeSavingsUpdated:financeSavingsUpdated
  };
})();