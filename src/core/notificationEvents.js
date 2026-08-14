'use strict';
// ============================================================
// NOTIFICATION DOMAIN EVENTS v1.2.0
// Stable domain API for notification-worthy FamilyApp events.
// Domain modules never construct Firebase paths or audience structures.
// ============================================================
(function(){
  if(window.NotificationEvents)return;

  var VERSION='1.2.0';

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

  function taskHelpRequested(task,targetUid){
    if(!task)return Promise.reject(new Error('Taak ontbreekt'));
    var recipients=targetUid?[String(targetUid)]:otherMemberUids();
    recipients=recipients.filter(function(id){return id&&id!==currentUid();});
    return publishTo('task.help.requested',recipients,{
      icon:'👥',bg:'#dbeafe',tone:'action',title:'Hulp gevraagd',
      body:(window.myName||'Een gezinslid')+' vraagt hulp bij “'+String(task.title||task.name||'taak')+'”.',
      entity:entity('task',task.id||task._key),
      data:{taskId:String(task.id||''),taskKey:String(task._key||''),targetUid:targetUid?String(targetUid):'',action:'help'}
    });
  }
  function taskHelpJoined(task,requesterUid){
    if(!task)return Promise.reject(new Error('Taak ontbreekt'));
    var recipients=requesterUid?[String(requesterUid)]:taskAssigneeUids(task).filter(function(id){return id!==currentUid();});
    return publishTo('task.help.joined',recipients,{
      icon:'🤝',bg:'#dcfce7',tone:'success',title:'Hulp onderweg',
      body:(window.myName||'Een gezinslid')+' helpt mee met “'+String(task.title||task.name||'taak')+'”.',
      entity:entity('task',task.id||task._key),
      data:{taskId:String(task.id||''),taskKey:String(task._key||''),requesterUid:requesterUid?String(requesterUid):'',action:'helpJoined'}
    });
  }
  function taskSwapRequested(task,targetUid){
    if(!targetUid)return Promise.reject(new Error('Ontvanger ontbreekt'));
    return publishTo('task.swap.requested',[targetUid],{
      icon:'🔄',bg:'#ede9fe',tone:'action',title:'Ruilverzoek',
      body:(window.myName||'Een gezinslid')+' wil “'+String(task&&(task.title||task.name)||'taak')+'” met je ruilen.',
      entity:entity('task',task&&(task.id||task._key)),
      data:{taskId:String(task&&task.id||''),taskKey:String(task&&task._key||''),action:'swapRequested',targetUid:String(targetUid)}
    });
  }
  function taskSwapResolved(task,requesterUid,accepted){
    if(!requesterUid)return Promise.resolve(null);
    return publishTo(accepted?'task.swap.accepted':'task.swap.declined',[requesterUid],{
      icon:accepted?'✅':'↩️',bg:accepted?'#dcfce7':'#f1f5f9',tone:accepted?'success':'neutral',title:accepted?'Ruil geaccepteerd':'Ruil afgewezen',
      body:(window.myName||'Een gezinslid')+(accepted?' accepteerde ':' wees ')+'het ruilverzoek voor “'+String(task&&(task.title||task.name)||'taak')+'”'+(accepted?' toe.':' af.'),
      entity:entity('task',task&&(task.id||task._key)),
      data:{taskId:String(task&&task.id||''),taskKey:String(task&&task._key||''),action:accepted?'swapAccepted':'swapDeclined'}
    });
  }
  function partyQuestCreated(quest,targetUids){
    var recipients=Array.isArray(targetUids)&&targetUids.length?targetUids:otherMemberUids();
    recipients=recipients.filter(function(id){return id&&String(id)!==String(currentUid());});
    return publishTo('partyQuest.created',recipients,{
      icon:'⚔️',bg:'#ede9fe',tone:'action',title:'Nieuwe Party Quest',
      body:(window.myName||'Een gezinslid')+' nodigt je uit voor “'+questLabel(quest)+'”.',
      entity:entity('partyQuest',quest&&(quest.id||quest._key)),data:{questId:String(quest&&quest.id||''),questTaskId:String(quest&&quest.questId||''),action:'created'}
    });
  }
  function partyQuestJoined(quest,ownerUid){
    return publishTo('partyQuest.joined',ownerUid?[ownerUid]:[],{
      icon:'🛡️',bg:'#dbeafe',tone:'success',title:'Party-lid aangesloten',
      body:(window.myName||'Een gezinslid')+' doet mee met “'+questLabel(quest)+'”.',
      entity:entity('partyQuest',quest&&(quest.id||quest._key)),data:{questId:String(quest&&quest.id||''),questTaskId:String(quest&&quest.questId||''),action:'joined'}
    });
  }
  function partyQuestCompleted(quest){
    return publishHousehold('partyQuest.completed',{
      icon:'🏆',bg:'#fef3c7',tone:'celebration',title:'Party Quest voltooid!',
      body:'“'+questLabel(quest)+'” is samen voltooid.',
      entity:entity('partyQuest',quest&&(quest.id||quest._key)),data:{questId:String(quest&&quest.id||''),questTaskId:String(quest&&quest.questId||''),action:'completed'}
    });
  }

  window.NotificationEvents={
    version:VERSION,
    members:activeMembers,
    otherMemberUids:otherMemberUids,
    taskAssigneeUids:taskAssigneeUids,
    taskHelpRequested:taskHelpRequested,
    taskHelpJoined:taskHelpJoined,
    taskSwapRequested:taskSwapRequested,
    taskSwapResolved:taskSwapResolved,
    partyQuestCreated:partyQuestCreated,
    partyQuestJoined:partyQuestJoined,
    partyQuestCompleted:partyQuestCompleted
  };
})();