'use strict';
// ============================================================
// PARTY QUEST SERVICE v1.0.0
// STEP 11.2 domain state machine for invites/join responses.
//
// Persistence authority: PartyQuestRepository only.
// Identity authority: HouseholdContext only.
// Task ownership/eligibility authority: frozen TaskSharedData/task projection.
// ============================================================
(function(){
  if(window.PartyQuestService)return;

  var VERSION='1.0.0';

  function now(){return Date.now();}
  function clone(value){try{return JSON.parse(JSON.stringify(value));}catch(e){return value;}}
  function context(){try{return window.HouseholdContext&&typeof HouseholdContext.snapshot==='function'?HouseholdContext.snapshot():null;}catch(e){return null;}}
  function capture(){try{return window.HouseholdContext&&typeof HouseholdContext.capture==='function'?HouseholdContext.capture():null;}catch(e){return null;}}
  function isCurrent(token){try{return !!(window.HouseholdContext&&typeof HouseholdContext.isCurrent==='function'&&HouseholdContext.isCurrent(token));}catch(e){return false;}}
  function validContext(ctx){return !!(ctx&&ctx.ready===true&&ctx.uid&&ctx.householdId);}
  function repo(){return window.PartyQuestRepository||null;}
  function taskApi(){return window.TaskSharedData||null;}
  function tasks(){return Array.isArray(window.taskData)?window.taskData:[];}
  function members(){try{return taskApi()&&typeof TaskSharedData.members==='function'?TaskSharedData.members()||[]:[];}catch(e){return[];}}
  function memberId(m){return m&&(m.uid||m.id)||null;}
  function memberName(m){return String(m&&(m.displayName||m.name)||'Gezinslid');}
  function uniqueIds(values){var seen={};return (Array.isArray(values)?values:[]).map(function(v){return String(v||'');}).filter(function(v){if(!v||seen[v])return false;seen[v]=true;return true;});}
  function error(code,message){var e=new Error(message||code);e.code=code;return e;}
  function requireContext(){
    var ctx=context(),token=capture();
    if(!validContext(ctx)||!token||!isCurrent(token))throw error('ACTIVE_PARTY_QUEST_HOUSEHOLD_REQUIRED','Party Quest household is not ready');
    return {ctx:ctx,token:token};
  }
  function assertToken(token){if(!isCurrent(token))throw error('STALE_PARTY_QUEST_CONTEXT','STALE_PARTY_QUEST_CONTEXT');}
  function requireRepo(){var r=repo();if(!r||typeof r.mutateOne!=='function'||typeof r.mutateCollection!=='function'||typeof r.allocateId!=='function')throw error('PARTY_QUEST_REPOSITORY_NOT_READY','Party Quest repository is not ready');return r;}
  function taskById(id){var wanted=String(id||'');return tasks().find(function(t){return String(t&&(t.id||t._key)||'')===wanted;})||null;}
  function isTaskCreator(task,uid){var api=taskApi();if(api&&typeof api.isTaskCreator==='function')return !!api.isTaskCreator(task,uid);return !!(task&&uid&&String(task.createdByUid||task.ownerUid||'')===String(uid));}
  function isTaskOpen(task){var status=String(task&&task.status||'').toLowerCase();return !!(task&&(task.id||task._key)&&!task.done&&!task.completed&&status!=='done'&&status!=='completed');}
  function isAssigned(task,uid){var id=String(uid||'');return !!(id&&task&&((task.assignedToUids&&task.assignedToUids[id])||String(task.assignedToUid||'')===id));}
  function memberByUid(uid){var wanted=String(uid||'');return members().find(function(m){return String(memberId(m)||'')===wanted;})||null;}
  function activeMember(uid){var m=memberByUid(uid);return !!(m&&(!m.status||m.status==='active'));}
  function invitees(q){return q&&q.invitees&&typeof q.invitees==='object'&&!Array.isArray(q.invitees)?q.invitees:{};}
  function liveQuest(q){return !!(q&&q.status!=='cancelled'&&q.status!=='completed');}
  function recomputeQuestStatus(q){
    var values=Object.keys(invitees(q)).map(function(uid){return invitees(q)[uid];});
    if(values.some(function(x){return x&&x.status==='active';}))return'active';
    if(values.some(function(x){return x&&x.status==='pending';}))return'pending';
    return'cancelled';
  }
  function blockedForTask(taskId,rows,task){
    var blocked={};
    var owner=task&&(task.createdByUid||task.ownerUid);if(owner)blocked[String(owner)]=true;
    if(task&&task.assignedToUid)blocked[String(task.assignedToUid)]=true;
    if(task&&task.assignedToUids&&typeof task.assignedToUids==='object')Object.keys(task.assignedToUids).forEach(function(uid){if(task.assignedToUids[uid])blocked[String(uid)]=true;});
    Object.keys(rows||{}).forEach(function(key){
      var q=rows[key];if(!liveQuest(q)||String(q.questId||'')!==String(taskId))return;
      if(q.inviterUid)blocked[String(q.inviterUid)]=true;
      Object.keys(invitees(q)).forEach(function(uid){var inv=invitees(q)[uid];if(inv&&(inv.status==='pending'||inv.status==='active'))blocked[String(uid)]=true;});
    });
    return blocked;
  }
  function nextInviteVersion(rows,taskId,inviterUid,targetUid){
    var max=0;
    Object.keys(rows||{}).forEach(function(key){
      var q=rows[key];if(!q||String(q.questId||'')!==String(taskId)||String(q.inviterUid||'')!==String(inviterUid))return;
      var inv=invitees(q)[targetUid];if(!inv)return;
      max=Math.max(max,Number(inv.inviteVersion||1)||1);
    });
    return max+1;
  }
  function creatorName(uid){var m=memberByUid(uid);return m?memberName(m):'Gezinslid';}

  function createInvites(questIds,targetUids){
    var auth=requireContext(),r=requireRepo(),me=String(auth.ctx.uid),questList=uniqueIds(questIds),targets=uniqueIds(targetUids);
    if(!questList.length) return Promise.reject(error('PARTY_QUEST_TASK_REQUIRED','Kies minstens een quest'));
    if(!targets.length) return Promise.reject(error('PARTY_QUEST_INVITEE_REQUIRED','Kies minstens een gezinslid'));
    var reserved={};
    questList.forEach(function(taskId){reserved[taskId]=r.allocateId();});
    return r.mutateCollection(function(rows){
      assertToken(auth.token);
      var next=clone(rows)||{},created=0,totalTargets=0,denied=0,skipped=0,createdIds=[];
      questList.forEach(function(taskId){
        var task=taskById(taskId);
        if(!task||!isTaskOpen(task)||!isTaskCreator(task,me)){denied++;return;}
        var blocked=blockedForTask(taskId,next,task),newInvitees={};
        targets.forEach(function(targetUid){
          var target=String(targetUid);
          if(target===me||blocked[target]||isAssigned(task,target)||!activeMember(target)){skipped++;return;}
          var version=nextInviteVersion(next,taskId,me,target);
          var id=reserved[taskId];
          newInvitees[target]={
            uid:target,
            name:memberName(memberByUid(target)),
            status:'pending',
            inviteVersion:version,
            inviteOccurrenceId:String(id)+':'+target+':v'+version,
            invitedAt:now(),
            respondedAt:null,
            revokedAt:null
          };
          blocked[target]=true;
          totalTargets++;
        });
        var invited=Object.keys(newInvitees);if(!invited.length)return;
        var id=reserved[taskId];
        next[id]={
          id:id,
          schemaVersion:2,
          title:'Party Quest',
          questId:String(task.id||task._key),
          questTitle:String(task.title||task.name||'Naamloze quest'),
          status:'pending',
          inviterUid:me,
          createdByUid:me,
          inviterName:creatorName(me),
          invitees:newInvitees,
          helpRequests:{},
          rewardSettlements:{},
          completion:null,
          createdAt:now(),
          updatedAt:now()
        };
        created++;createdIds.push(id);
      });
      if(!created)throw error(denied?'PARTY_QUEST_NOT_TASK_OWNER':'PARTY_QUEST_NO_ELIGIBLE_INVITEES',denied?'Alleen de maker van een open quest kan deelnemers uitnodigen':'De gekozen deelnemers doen al mee, zijn toegewezen of zijn niet beschikbaar');
      return {rows:next,result:{created:created,totalTargets:totalTargets,denied:denied,skipped:skipped,questIds:createdIds}};
    }).then(function(outcome){assertToken(auth.token);return outcome&&outcome.result?outcome.result:outcome;});
  }

  function respond(questOrId,status){
    var auth=requireContext(),r=requireRepo(),me=String(auth.ctx.uid),id=String(questOrId&&typeof questOrId==='object'?(questOrId._key||questOrId.id):questOrId||'');
    if(status!=='active'&&status!=='declined')return Promise.reject(error('PARTY_QUEST_RESPONSE_INVALID','Ongeldige uitnodigingsreactie'));
    if(!id)return Promise.reject(error('PARTY_QUEST_ID_REQUIRED','Uitnodiging ontbreekt'));
    return r.mutateOne(id,function(q){
      assertToken(auth.token);
      if(!q||q.status==='cancelled'||q.status==='completed')throw error('PARTY_QUEST_INVITE_NOT_ACTIVE','Deze uitnodiging is niet meer actief');
      var inv=invitees(q)[me];
      if(!inv)throw error('PARTY_QUEST_INVITE_WRONG_RECIPIENT','Deze uitnodiging is voor een ander gezinslid');
      if(inv.status!=='pending')throw error('PARTY_QUEST_INVITE_NOT_PENDING','Deze uitnodiging is al afgehandeld');
      q.invitees=clone(invitees(q));
      q.invitees[me]=Object.assign({},inv,{status:status,respondedAt:now()});
      q.status=recomputeQuestStatus(q);
      return q;
    }).then(function(saved){assertToken(auth.token);return saved;});
  }

  function revokeInvite(questId,targetUid){
    var auth=requireContext(),r=requireRepo(),me=String(auth.ctx.uid),id=String(questId||''),target=String(targetUid||'');
    if(!id||!target)return Promise.reject(error('PARTY_QUEST_INVITE_REQUIRED','Uitnodiging ontbreekt'));
    return r.mutateOne(id,function(q){
      assertToken(auth.token);
      if(!q||String(q.inviterUid||'')!==me)throw error('PARTY_QUEST_NOT_INVITER','Alleen de maker kan deze uitnodiging intrekken');
      if(q.status==='cancelled'||q.status==='completed')throw error('PARTY_QUEST_INVITE_NOT_ACTIVE','Deze uitnodiging is niet meer actief');
      var inv=invitees(q)[target];
      if(!inv||inv.status!=='pending')throw error('PARTY_QUEST_INVITE_NOT_PENDING','Deze uitnodiging kan niet meer worden ingetrokken');
      q.invitees=clone(invitees(q));
      q.invitees[target]=Object.assign({},inv,{status:'revoked',revokedAt:now()});
      q.status=recomputeQuestStatus(q);
      return q;
    }).then(function(saved){assertToken(auth.token);return saved;});
  }

  function cancelQuest(questId){
    var auth=requireContext(),r=requireRepo(),me=String(auth.ctx.uid),id=String(questId||'');
    if(!id)return Promise.reject(error('PARTY_QUEST_ID_REQUIRED','Party Quest ontbreekt'));
    return r.mutateOne(id,function(q){
      assertToken(auth.token);
      if(!q||String(q.inviterUid||'')!==me)throw error('PARTY_QUEST_NOT_INVITER','Alleen de maker kan deze Party Quest beeindigen');
      if(q.status==='completed')throw error('PARTY_QUEST_ALREADY_COMPLETED','Een voltooide Party Quest kan niet worden geannuleerd');
      if(q.status==='cancelled')throw error('PARTY_QUEST_ALREADY_CANCELLED','Deze Party Quest is al beeindigd');
      q.invitees=clone(invitees(q));
      Object.keys(q.invitees).forEach(function(uid){var inv=q.invitees[uid];if(inv&&inv.status==='pending')q.invitees[uid]=Object.assign({},inv,{status:'revoked',revokedAt:now()});});
      q.status='cancelled';
      q.endedAt=now();
      q.endedByUid=me;
      return q;
    }).then(function(saved){assertToken(auth.token);return saved;});
  }

  function getById(id){var r=repo();return r&&typeof r.getById==='function'?r.getById(id):null;}
  function status(){var c=context(),r=repo();return{version:VERSION,ready:!!(validContext(c)&&r),uid:c&&c.uid||null,householdId:c&&c.householdId||null,repository:r&&r.version||null};}

  window.PartyQuestService={
    version:VERSION,
    createInvites:createInvites,
    respond:respond,
    revokeInvite:revokeInvite,
    cancelQuest:cancelQuest,
    getById:getById,
    status:status
  };
})();
