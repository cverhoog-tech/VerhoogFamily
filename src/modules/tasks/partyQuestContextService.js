'use strict';
// ============================================================
// PARTY QUEST CONTEXT SERVICE v1.0
// Context-authoritative read/write boundary for household Party Quests.
// ============================================================
(function(){
  if(window.PartyQuestContextService) return;

  var COLLECTION='partyQuests';
  var unsubscribe=null,boundToken=null,rowsById={};

  function ctx(){if(!window.HouseholdContext)throw new Error('HOUSEHOLD_CONTEXT_UNAVAILABLE');return window.HouseholdContext;}
  function store(){if(!window.FamilyDataStore)throw new Error('FAMILY_DATA_STORE_UNAVAILABLE');return window.FamilyDataStore;}
  function contract(){if(!window.FamilyDataContract)throw new Error('FAMILY_DATA_CONTRACT_UNAVAILABLE');return window.FamilyDataContract;}
  function captureReady(){var c=ctx(),uid=c.requireUser(),householdId=c.requireHousehold();c.assertContext({uid:uid,householdId:householdId,requireReady:true});return{uid:uid,householdId:householdId};}
  function assertToken(token){if(!ctx().isCurrent(token)){var e=new Error('PARTY_QUEST_CONTEXT_CHANGED');e.code='PARTY_QUEST_CONTEXT_CHANGED';throw e;}return token;}
  function clone(v){try{return JSON.parse(JSON.stringify(v));}catch(e){return v;}}
  function now(){return Date.now();}
  function rows(value){return value&&typeof value==='object'?value:{};}
  function member(uid){try{var list=window.TaskSharedData&&TaskSharedData.members?TaskSharedData.members()||[]:[];return list.find(function(m){return String(m.uid||m.id)===String(uid);})||null;}catch(e){return null;}}
  function nameOf(uid){var m=member(uid);return String((m&&(m.displayName||m.name))||'Gezinslid');}
  function taskById(id){return (window.taskData||[]).find(function(t){return String(t&&t.id)===String(id);})||null;}
  function isCreator(task,uid){return !!(task&&uid&&String(task.createdByUid||task.ownerUid||'')===String(uid));}
  function invitees(q){return q&&q.invitees&&typeof q.invitees==='object'?q.invitees:{};}
  function isLive(q){return q&&q.status!=='cancelled'&&q.status!=='completed';}
  function blockedForTask(taskId,source){var blocked={},task=taskById(taskId);if(task){if(task.assignedToUids)Object.keys(task.assignedToUids).forEach(function(id){if(task.assignedToUids[id])blocked[String(id)]=true;});if(task.assignedToUid)blocked[String(task.assignedToUid)]=true;var owner=task.createdByUid||task.ownerUid;if(owner)blocked[String(owner)]=true;}(Object.values(source||{})).forEach(function(q){if(!isLive(q)||String(q.questId||'')!==String(taskId))return;if(q.inviterUid)blocked[String(q.inviterUid)]=true;Object.keys(invitees(q)).forEach(function(id){var x=invitees(q)[id];if(x&&(x.status==='pending'||x.status==='active'))blocked[String(id)]=true;});});return blocked;}
  function key(){var s=store();return typeof s.makeId==='function'?s.makeId('partyquest'):'partyquest_'+now().toString(36)+'_'+Math.random().toString(36).slice(2,8);}

  function stop(){if(unsubscribe)try{unsubscribe();}catch(e){}unsubscribe=null;boundToken=null;rowsById={};}
  function start(){var token;try{token=captureReady();}catch(e){stop();return false;}if(boundToken&&ctx().isCurrent(boundToken)&&unsubscribe)return true;stop();boundToken=token;contract().shared('partyQuests');unsubscribe=store().subscribeShared(COLLECTION,function(value){if(!ctx().isCurrent(token))return;rowsById=rows(value);try{window.dispatchEvent(new CustomEvent('familyapp:party-quests-updated',{detail:{uid:token.uid,householdId:token.householdId,count:Object.keys(rowsById).length}}));}catch(e){}},{});return true;}
  function list(){assertToken(captureReady());return Object.keys(rowsById).map(function(k){var q=clone(rowsById[k]);if(q&&!q.id)q.id=k;return q;}).filter(Boolean);}
  function get(id){var q=rowsById&&rowsById[id];if(!q)return null;q=clone(q);if(!q.id)q.id=id;return q;}
  function relevant(){var token=captureReady();return list().filter(function(q){return String(q.inviterUid)===String(token.uid)||!!invitees(q)[token.uid];});}
  function pending(){var token=captureReady();return relevant().filter(function(q){var x=invitees(q)[token.uid];return x&&x.status==='pending'&&isLive(q);});}

  function createInvites(taskId,targetUids){var token=captureReady(),task=taskById(taskId);if(!task||!isCreator(task,token.uid))return Promise.reject(new Error('Alleen de maker kan deelnemers uitnodigen'));var blocked=blockedForTask(taskId,rowsById),inv={};(targetUids||[]).forEach(function(id){id=String(id);if(id===String(token.uid)||blocked[id])return;var m=member(id);if(m)inv[id]={uid:id,name:nameOf(id),status:'pending'};});if(!Object.keys(inv).length)return Promise.reject(new Error('Geen beschikbare deelnemers'));var id=key(),row={id:id,title:'Party Quest',questId:String(task.id),questTitle:String(task.title||'Naamloze quest'),status:'pending',inviterUid:token.uid,inviterName:nameOf(token.uid),invitees:inv,createdAt:now(),updatedAt:now()};assertToken(token);return store().writeSharedRecord(COLLECTION,id,row).then(function(){assertToken(token);return row;});}
  function mutate(id,mutator){var token=captureReady();assertToken(token);return store().mutateSharedRecord(COLLECTION,String(id),function(server){assertToken(token);var row=server&&typeof server==='object'?clone(server):null;if(!row)return;var next=mutator(row,token);if(!next)return;next.updatedAt=now();return next;},get(id)).then(function(result){assertToken(token);return result&&result.value?result.value:result;});}
  function respond(id,status){return mutate(id,function(q,token){var mine=invitees(q)[token.uid];if(!isLive(q)||!mine||mine.status!=='pending')return;mine.status=status;mine.respondedAt=now();if(status==='active')q.status='active';return q;});}
  function revokeInvite(id,targetUid){return mutate(id,function(q,token){if(String(q.inviterUid)!==String(token.uid))return;var mine=invitees(q)[targetUid];if(!mine||mine.status!=='pending')return;mine.status='revoked';mine.revokedAt=now();var vals=Object.keys(invitees(q)).map(function(k){return q.invitees[k];});q.status=vals.some(function(x){return x&&x.status==='active';})?'active':(vals.some(function(x){return x&&x.status==='pending';})?'pending':'cancelled');return q;});}
  function end(id,status){return mutate(id,function(q,token){if(String(q.inviterUid)!==String(token.uid))return;q.status=status;q.endedAt=now();return q;});}

  window.PartyQuestContextService={version:'1.0.0',start:start,stop:stop,list:list,get:get,relevant:relevant,pending:pending,createInvites:createInvites,respond:respond,revokeInvite:revokeInvite,end:end,status:function(){var c=null;try{c=ctx().current();}catch(e){}return{bound:!!unsubscribe,context:c,count:Object.keys(rowsById).length};}};
  window.addEventListener('familyapp:household-context-changed',function(){stop();start();});
  window.addEventListener('familyapp:session:cleared',stop);
  Promise.resolve().then(start);
})();
