'use strict';
// ============================================================
// PARTY QUEST SERVICE v1.3.0
// STEP 11.2-11.5 domain state machine for invites, join/leave, help,
// task-driven completion and durable per-participant reward settlements.
//
// Persistence authority: PartyQuestRepository only.
// Identity authority: HouseholdContext only.
// Task ownership/completion authority: canonical TaskHouseholdRepository /
// frozen TaskSharedData projection.
// Progression mutation authority remains frozen ProgressionStore.
// ============================================================
(function(){
  if(window.PartyQuestService)return;

  var VERSION='1.3.0';

  function now(){return Date.now();}
  function clone(value){try{return JSON.parse(JSON.stringify(value));}catch(e){return value;}}
  function context(){try{return window.HouseholdContext&&typeof HouseholdContext.snapshot==='function'?HouseholdContext.snapshot():null;}catch(e){return null;}}
  function capture(){try{return window.HouseholdContext&&typeof HouseholdContext.capture==='function'?HouseholdContext.capture():null;}catch(e){return null;}}
  function isCurrent(token){try{return !!(window.HouseholdContext&&typeof HouseholdContext.isCurrent==='function'&&HouseholdContext.isCurrent(token));}catch(e){return false;}}
  function validContext(ctx){return !!(ctx&&ctx.ready===true&&ctx.uid&&ctx.householdId);}
  function repo(){return window.PartyQuestRepository||null;}
  function taskApi(){return window.TaskSharedData||null;}
  function taskRepo(){return window.TaskHouseholdRepository||window.TaskRepository||null;}
  function progression(){return window.ProgressionStore||null;}
  function tasks(){
    var r=taskRepo();
    try{if(r&&typeof r.list==='function')return r.list()||[];}catch(e){}
    return Array.isArray(window.taskData)?window.taskData:[];
  }
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
  function isTaskComplete(task){var status=String(task&&task.status||'').toLowerCase();return !!(task&&(task.done===true||task.completed===true||status==='done'||status==='completed'));}
  function taskRewardXp(task){
    if(!task)return 4;
    var n=Number(task.rewardXp||task.xpAmount);
    if(isFinite(n)&&n>0)return Math.round(n);
    var m=String(task.xpReward||task.xp||'').match(/(\d+)/);
    return m?Math.max(1,parseInt(m[1],10)):4;
  }
  function isAssigned(task,uid){var id=String(uid||'');return !!(id&&task&&((task.assignedToUids&&task.assignedToUids[id])||String(task.assignedToUid||'')===id));}
  function memberByUid(uid){var wanted=String(uid||'');return members().find(function(m){return String(memberId(m)||'')===wanted;})||null;}
  function activeMember(uid){var m=memberByUid(uid);return !!(m&&(!m.status||m.status==='active'));}
  function invitees(q){return q&&q.invitees&&typeof q.invitees==='object'&&!Array.isArray(q.invitees)?q.invitees:{};}
  function helpRequests(q){return q&&q.helpRequests&&typeof q.helpRequests==='object'&&!Array.isArray(q.helpRequests)?q.helpRequests:{};}
  function rewardSettlements(q){return q&&q.rewardSettlements&&typeof q.rewardSettlements==='object'&&!Array.isArray(q.rewardSettlements)?q.rewardSettlements:{};}
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
  function openHelpRequest(q){var map=helpRequests(q),keys=Object.keys(map);for(var i=0;i<keys.length;i++){var row=map[keys[i]];if(row&&row.status==='open')return row;}return null;}
  function helpResponded(request,uid){
    var id=String(uid||''),accepted=request&&request.acceptedByUids,declined=request&&request.declinedByUids;
    return !!(id&&((accepted&&typeof accepted==='object'&&Object.prototype.hasOwnProperty.call(accepted,id))||(declined&&typeof declined==='object'&&Object.prototype.hasOwnProperty.call(declined,id))));
  }
  function helpEligible(q,task,uid,requesterUid){
    var id=String(uid||''),me=String(requesterUid||''),inv=invitees(q)[id];
    if(!id||id===me||id===String(q&&q.inviterUid||''))return false;
    if(!activeMember(id)||isTaskCreator(task,id)||isAssigned(task,id))return false;
    if(inv&&(inv.status==='pending'||inv.status==='active'))return false;
    return true;
  }
  function closeOpenHelpRequests(q,actorUid,at,reason){
    q.helpRequests=clone(helpRequests(q));
    Object.keys(q.helpRequests).forEach(function(key){var request=q.helpRequests[key];if(!request||request.status!=='open')return;q.helpRequests[key]=Object.assign({},request,{status:'retracted',retractedAt:at,retractedByUid:actorUid,closedAt:at,closeReason:reason||'quest-ended'});});
    return q;
  }
  function completionOccurrenceId(q){return 'partyQuest:'+String(q&&(q.id||q._key)||'unknown')+':completion:v1';}
  function completionParticipantUids(q){
    var ids=[];
    if(q&&q.inviterUid)ids.push(String(q.inviterUid));
    Object.keys(invitees(q)).forEach(function(uid){var inv=invitees(q)[uid];if(inv&&inv.status==='active')ids.push(String(uid));});
    return uniqueIds(ids);
  }
  // Keep the STEP 9 reward key used by the old bridge. This makes the new
  // settlement worker migration-safe: a reward that really succeeded before
  // STEP 11.5 is detected by ProgressionStore and is never awarded twice.
  function completionRewardKey(q){return 'partyQuest:'+String(q&&(q.id||q._key)||'unknown');}

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
          newInvitees[target]={uid:target,name:memberName(memberByUid(target)),status:'pending',inviteVersion:version,inviteOccurrenceId:String(id)+':'+target+':v'+version,invitedAt:now(),respondedAt:null,revokedAt:null,leftAt:null};
          blocked[target]=true;totalTargets++;
        });
        var invited=Object.keys(newInvitees);if(!invited.length)return;
        var id=reserved[taskId];
        next[id]={id:id,schemaVersion:2,title:'Party Quest',questId:String(task.id||task._key),questTitle:String(task.title||task.name||'Naamloze quest'),status:'pending',inviterUid:me,createdByUid:me,inviterName:creatorName(me),invitees:newInvitees,helpRequests:{},rewardSettlements:{},completion:null,createdAt:now(),updatedAt:now()};
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
      q.invitees=clone(invitees(q));q.invitees[me]=Object.assign({},inv,{status:status,respondedAt:now()});q.status=recomputeQuestStatus(q);return q;
    }).then(function(saved){assertToken(auth.token);return saved;});
  }

  function leaveQuest(questId){
    var auth=requireContext(),r=requireRepo(),me=String(auth.ctx.uid),id=String(questId||'');
    if(!id)return Promise.reject(error('PARTY_QUEST_ID_REQUIRED','Party Quest ontbreekt'));
    return r.mutateOne(id,function(q){
      assertToken(auth.token);
      if(!q||q.status==='cancelled'||q.status==='completed')throw error('PARTY_QUEST_NOT_ACTIVE','Deze Party Quest is niet meer actief');
      if(String(q.inviterUid||'')===me)throw error('PARTY_QUEST_INVITER_CANNOT_LEAVE','De maker kan de Party Quest niet verlaten; beeindig hem in plaats daarvan');
      var inv=invitees(q)[me];
      if(!inv)throw error('PARTY_QUEST_NOT_PARTICIPANT','Je neemt niet deel aan deze Party Quest');
      if(inv.status!=='active')throw error('PARTY_QUEST_PARTICIPANT_NOT_ACTIVE','Je bent geen actieve deelnemer meer');
      var leftAt=now(),name=inv.name||creatorName(me),nextStatus;
      q.invitees=clone(invitees(q));q.invitees[me]=Object.assign({},inv,{status:'left',leftAt:leftAt});nextStatus=recomputeQuestStatus(q);q.status=nextStatus;
      if(nextStatus==='cancelled'&&!q.endedAt){q.endedAt=leftAt;q.endedByUid=me;q.endReason='no-active-or-pending-invitees';closeOpenHelpRequests(q,me,leftAt,'party-quest-no-participants');}
      q.lastEvent={id:'leave:'+id+':'+me+':'+leftAt,type:'partyQuest.participant.left',actorUid:me,message:name+' heeft “'+String(q.questTitle||'Party Quest')+'” verlaten',time:leftAt};
      return q;
    }).then(function(saved){assertToken(auth.token);return saved;});
  }

  function createHelpRequest(questId,targetUid,audience){
    var auth=requireContext(),r=requireRepo(),me=String(auth.ctx.uid),id=String(questId||''),target=targetUid===null?null:String(targetUid||''),kind=audience==='household'?'household':'uid';
    if(!id)return Promise.reject(error('PARTY_QUEST_ID_REQUIRED','Party Quest ontbreekt'));
    if(kind==='uid'&&!target)return Promise.reject(error('PARTY_QUEST_HELP_TARGET_REQUIRED','Kies iemand om hulp te vragen'));
    var occurrenceId='help:'+r.allocateId();
    return r.mutateOne(id,function(q){
      assertToken(auth.token);
      if(!q||q.status!=='active')throw error('PARTY_QUEST_HELP_REQUIRES_ACTIVE','Je kunt alleen vanuit een actieve Party Quest hulp vragen');
      if(String(q.inviterUid||'')!==me)throw error('PARTY_QUEST_HELP_NOT_INVITER','Alleen de maker kan extra hulp vragen');
      var task=taskById(q.questId);
      if(!task||!isTaskOpen(task))throw error('PARTY_QUEST_TASK_NOT_OPEN','De gekoppelde taak is niet meer open');
      if(openHelpRequest(q))throw error('PARTY_QUEST_HELP_ALREADY_OPEN','Er staat al een hulpvraag open voor deze Party Quest');
      if(kind==='uid'){
        if(!helpEligible(q,task,target,me))throw error('PARTY_QUEST_HELP_TARGET_NOT_ELIGIBLE','Dit gezinslid doet al mee, is toegewezen of is niet beschikbaar');
      }else{
        var available=members().some(function(m){return helpEligible(q,task,memberId(m),me);});
        if(!available)throw error('PARTY_QUEST_HELP_NO_ELIGIBLE_MEMBERS','Er is nu niemand extra beschikbaar om hulp te vragen');
      }
      var createdAt=now(),targetMember=target?memberByUid(target):null,request={id:occurrenceId,occurrenceId:occurrenceId,questId:String(q.id||q._key||id),status:'open',audience:kind,requesterUid:me,requesterName:creatorName(me),targetUid:target,targetName:targetMember?memberName(targetMember):null,createdAt:createdAt,acceptedByUids:{},declinedByUids:{},closedAt:null,retractedAt:null};
      q.helpRequests=clone(helpRequests(q));q.helpRequests[occurrenceId]=request;return q;
    }).then(function(saved){assertToken(auth.token);return {quest:saved,occurrenceId:occurrenceId,request:clone(helpRequests(saved)[occurrenceId]||null)};});
  }

  function requestHelp(questId,targetUid){return createHelpRequest(questId,targetUid,'uid');}
  function requestHouseholdHelp(questId){return createHelpRequest(questId,null,'household');}

  function respondHelp(questId,occurrenceId,status){
    var auth=requireContext(),r=requireRepo(),me=String(auth.ctx.uid),id=String(questId||''),occ=String(occurrenceId||'');
    if(status!=='active'&&status!=='declined')return Promise.reject(error('PARTY_QUEST_HELP_RESPONSE_INVALID','Ongeldige hulp-reactie'));
    if(!id||!occ)return Promise.reject(error('PARTY_QUEST_HELP_REQUEST_REQUIRED','Hulpvraag ontbreekt'));
    return r.mutateOne(id,function(q){
      assertToken(auth.token);
      if(!q||q.status!=='active')throw error('PARTY_QUEST_HELP_NOT_ACTIVE','Deze Party Quest is niet meer actief');
      var requests=helpRequests(q),request=requests[occ];
      if(!request||request.status!=='open')throw error('PARTY_QUEST_HELP_NOT_OPEN','Deze hulpvraag is niet meer open');
      if(String(request.requesterUid||'')===me)throw error('PARTY_QUEST_HELP_REQUESTER_CANNOT_RESPOND','Je kunt niet op je eigen hulpvraag reageren');
      var task=taskById(q.questId);
      if(!task||!isTaskOpen(task))throw error('PARTY_QUEST_TASK_NOT_OPEN','De gekoppelde taak is niet meer open');
      var targeted=request.audience==='uid';
      if(targeted&&String(request.targetUid||'')!==me)throw error('PARTY_QUEST_HELP_WRONG_RECIPIENT','Deze hulpvraag is voor een ander gezinslid');
      if(!targeted&&helpResponded(request,me))throw error('PARTY_QUEST_HELP_ALREADY_RESPONDED','Je hebt deze hulpvraag al afgehandeld');
      if(!helpEligible(q,task,me,request.requesterUid))throw error('PARTY_QUEST_HELP_NOT_ELIGIBLE','Je kunt niet meer aan deze hulpvraag deelnemen');
      var at=now();q.helpRequests=clone(requests);request=clone(request)||{};
      if(status==='declined'){
        if(targeted){request.status='declined';request.declinedByUid=me;request.declinedAt=at;request.closedAt=at;}
        else{request.declinedByUids=Object.assign({},request.declinedByUids||{});request.declinedByUids[me]=at;request.lastDeclinedByUid=me;request.lastDeclinedAt=at;}
        q.helpRequests[occ]=request;return q;
      }
      q.invitees=clone(invitees(q));
      var previous=q.invitees[me]||{};
      q.invitees[me]=Object.assign({},previous,{uid:me,name:creatorName(me),status:'active',respondedAt:at,joinedAt:at,joinedVia:'help',helpOccurrenceId:occ,leftAt:null,revokedAt:null});
      if(targeted){request.status='accepted';request.acceptedByUid=me;request.acceptedAt=at;request.closedAt=at;}
      else{request.acceptedByUids=Object.assign({},request.acceptedByUids||{});request.acceptedByUids[me]=at;request.lastAcceptedByUid=me;request.lastAcceptedAt=at;}
      q.helpRequests[occ]=request;q.status='active';return q;
    }).then(function(saved){assertToken(auth.token);return saved;});
  }

  function retractHelp(questId,occurrenceId){
    var auth=requireContext(),r=requireRepo(),me=String(auth.ctx.uid),id=String(questId||''),occ=String(occurrenceId||'');
    if(!id||!occ)return Promise.reject(error('PARTY_QUEST_HELP_REQUEST_REQUIRED','Hulpvraag ontbreekt'));
    return r.mutateOne(id,function(q){
      assertToken(auth.token);
      if(!q||String(q.inviterUid||'')!==me)throw error('PARTY_QUEST_HELP_NOT_INVITER','Alleen de maker kan deze hulpvraag intrekken');
      var requests=helpRequests(q),request=requests[occ];
      if(!request||request.status!=='open')throw error('PARTY_QUEST_HELP_NOT_OPEN','Deze hulpvraag is niet meer open');
      var at=now();q.helpRequests=clone(requests);q.helpRequests[occ]=Object.assign({},request,{status:'retracted',retractedAt:at,retractedByUid:me,closedAt:at});return q;
    }).then(function(saved){assertToken(auth.token);return saved;});
  }

  function revokeInvite(questId,targetUid){
    var auth=requireContext(),r=requireRepo(),me=String(auth.ctx.uid),id=String(questId||''),target=String(targetUid||'');
    if(!id||!target)return Promise.reject(error('PARTY_QUEST_INVITE_REQUIRED','Uitnodiging ontbreekt'));
    return r.mutateOne(id,function(q){
      assertToken(auth.token);
      if(!q||String(q.inviterUid||'')!==me)throw error('PARTY_QUEST_NOT_INVITER','Alleen de maker kan deze uitnodiging intrekken');
      if(q.status==='cancelled'||q.status==='completed')throw error('PARTY_QUEST_INVITE_NOT_ACTIVE','Deze uitnodiging is niet meer actief');
      var inv=invitees(q)[target];if(!inv||inv.status!=='pending')throw error('PARTY_QUEST_INVITE_NOT_PENDING','Deze uitnodiging kan niet meer worden ingetrokken');
      q.invitees=clone(invitees(q));q.invitees[target]=Object.assign({},inv,{status:'revoked',revokedAt:now()});q.status=recomputeQuestStatus(q);return q;
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
      var at=now();q.invitees=clone(invitees(q));Object.keys(q.invitees).forEach(function(uid){var inv=q.invitees[uid];if(inv&&inv.status==='pending')q.invitees[uid]=Object.assign({},inv,{status:'revoked',revokedAt:at});});
      closeOpenHelpRequests(q,me,at,'party-quest-cancelled');q.status='cancelled';q.endedAt=at;q.endedByUid=me;return q;
    }).then(function(saved){assertToken(auth.token);return saved;});
  }

  function completeFromTask(questId){
    var auth=requireContext(),r=requireRepo(),me=String(auth.ctx.uid),id=String(questId||'');
    if(!id)return Promise.reject(error('PARTY_QUEST_ID_REQUIRED','Party Quest ontbreekt'));
    return r.mutateOne(id,function(q){
      assertToken(auth.token);
      if(!q)throw error('PARTY_QUEST_NOT_FOUND','Party Quest ontbreekt');
      if(q.status==='cancelled')throw error('PARTY_QUEST_ALREADY_CANCELLED','Deze Party Quest is al beeindigd');
      if(q.status==='completed'&&q.completion&&q.completion.occurrenceId)return q;
      if(q.status!=='active')throw error('PARTY_QUEST_COMPLETION_REQUIRES_ACTIVE','Alleen een actieve Party Quest kan worden voltooid');
      var task=taskById(q.questId);
      if(!task||!isTaskComplete(task))throw error('PARTY_QUEST_TASK_NOT_COMPLETED','De gekoppelde taak is nog niet voltooid');

      var at=now(),occurrenceId=completionOccurrenceId(q),participants=completionParticipantUids(q),xp=taskRewardXp(task),rewardKey=completionRewardKey(q);
      if(participants.length<2)throw error('PARTY_QUEST_COMPLETION_REQUIRES_PARTICIPANT','Een Party Quest heeft minstens een actieve medespeler nodig');

      q.invitees=clone(invitees(q));
      Object.keys(q.invitees).forEach(function(uid){
        var inv=q.invitees[uid];
        if(inv&&inv.status==='pending')q.invitees[uid]=Object.assign({},inv,{status:'revoked',revokedAt:at,revokeReason:'party-quest-completed'});
      });
      closeOpenHelpRequests(q,me,at,'party-quest-completed');

      q.rewardSettlements=clone(rewardSettlements(q));
      participants.forEach(function(uid){
        var previous=q.rewardSettlements[uid];
        if(previous&&previous.occurrenceId===occurrenceId){
          q.rewardSettlements[uid]=Object.assign({},previous,{uid:uid,rewardKey:rewardKey,amount:xp,occurrenceId:occurrenceId});
          return;
        }
        q.rewardSettlements[uid]={uid:uid,occurrenceId:occurrenceId,rewardKey:rewardKey,amount:xp,status:'pending',createdAt:at,settledAt:null,settledByUid:null};
      });

      q.completion={
        occurrenceId:occurrenceId,
        taskId:String(q.questId||task.id||task._key||''),
        taskCompletedAt:task.completedAt==null?null:task.completedAt,
        taskCompletedByUid:task.completedByUid==null?null:String(task.completedByUid),
        finalizedAt:at,
        finalizedByUid:me,
        participantUids:participants,
        xpPerParticipant:xp
      };
      q.status='completed';
      q.endedAt=at;
      q.endedByUid=task.completedByUid?String(task.completedByUid):me;
      q.endReason='linked-task-completed';
      q.lastEvent={id:occurrenceId,type:'partyQuest.completed',actorUid:q.endedByUid,message:'Party Quest voltooid: “'+String(q.questTitle||'Quest')+'”',time:at};
      return q;
    }).then(function(saved){assertToken(auth.token);return saved;});
  }

  function markRewardSettled(questId,occurrenceId){
    var auth=requireContext(),r=requireRepo(),me=String(auth.ctx.uid),id=String(questId||''),occ=String(occurrenceId||'');
    if(!id||!occ)return Promise.reject(error('PARTY_QUEST_REWARD_SETTLEMENT_REQUIRED','Reward settlement ontbreekt'));
    return r.mutateOne(id,function(q){
      assertToken(auth.token);
      if(!q||q.status!=='completed'||!q.completion)throw error('PARTY_QUEST_NOT_COMPLETED','Deze Party Quest is nog niet voltooid');
      if(String(q.completion.occurrenceId||'')!==occ)throw error('PARTY_QUEST_REWARD_OCCURRENCE_MISMATCH','Reward occurrence komt niet overeen');
      var settlements=rewardSettlements(q),settlement=settlements[me];
      if(!settlement||String(settlement.occurrenceId||'')!==occ)throw error('PARTY_QUEST_REWARD_NOT_FOR_USER','Er staat geen Party Quest-beloning voor deze gebruiker klaar');
      if(settlement.status==='settled')return q;
      var p=progression();
      if(!p||typeof p.hasReward!=='function'||!p.hasReward(settlement.rewardKey))throw error('PARTY_QUEST_REWARD_NOT_CONFIRMED','De XP-beloning is nog niet canoniek bevestigd');
      var at=now();q.rewardSettlements=clone(settlements);q.rewardSettlements[me]=Object.assign({},settlement,{status:'settled',settledAt:at,settledByUid:me});return q;
    }).then(function(saved){assertToken(auth.token);return saved;});
  }

  function getById(id){var r=repo();return r&&typeof r.getById==='function'?r.getById(id):null;}
  function status(){var c=context(),r=repo();return{version:VERSION,ready:!!(validContext(c)&&r),uid:c&&c.uid||null,householdId:c&&c.householdId||null,repository:r&&r.version||null};}

  window.PartyQuestService={version:VERSION,createInvites:createInvites,respond:respond,leaveQuest:leaveQuest,requestHelp:requestHelp,requestHouseholdHelp:requestHouseholdHelp,respondHelp:respondHelp,retractHelp:retractHelp,revokeInvite:revokeInvite,cancelQuest:cancelQuest,completeFromTask:completeFromTask,markRewardSettled:markRewardSettled,getById:getById,status:status};
})();
