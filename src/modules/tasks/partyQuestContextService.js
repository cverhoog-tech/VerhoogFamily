'use strict';
(function(){
  if(window.PartyQuestContextService)return;
  var COLLECTION='partyQuests',unsubscribe=null,boundToken=null,rowsById={};
  function ctx(){if(!window.HouseholdContext)throw new Error('HOUSEHOLD_CONTEXT_UNAVAILABLE');return window.HouseholdContext;}
  function store(){if(!window.FamilyDataStore)throw new Error('FAMILY_DATA_STORE_UNAVAILABLE');return window.FamilyDataStore;}
  function contract(){if(!window.FamilyDataContract)throw new Error('FAMILY_DATA_CONTRACT_UNAVAILABLE');return window.FamilyDataContract;}
  function captureReady(){var c=ctx(),uid=c.requireUser(),householdId=c.requireHousehold();c.assertContext({uid:uid,householdId:householdId,requireReady:true});return{uid:uid,householdId:householdId};}
  function assertToken(t){if(!ctx().isCurrent(t)){var e=new Error('PARTY_QUEST_CONTEXT_CHANGED');e.code='PARTY_QUEST_CONTEXT_CHANGED';throw e;}return t;}
  function clone(v){try{return JSON.parse(JSON.stringify(v));}catch(e){return v;}}
  function now(){return Date.now();}
  function rows(v){return v&&typeof v==='object'?v:{};}
  function members(){try{return window.TaskSharedData&&TaskSharedData.members?TaskSharedData.members()||[]:[];}catch(e){return[];}}
  function member(uid){return members().find(function(m){return String(m.uid||m.id)===String(uid);})||null;}
  function nameOf(uid){var m=member(uid);return String((m&&(m.displayName||m.name))||'Gezinslid');}
  function taskById(id){return (window.taskData||[]).find(function(t){return String(t&&t.id)===String(id);})||null;}
  function isCreator(t,uid){return !!(t&&uid&&String(t.createdByUid||t.ownerUid||'')===String(uid));}
  function invitees(q){return q&&q.invitees&&typeof q.invitees==='object'?q.invitees:{};}
  function live(q){return q&&q.status!=='cancelled'&&q.status!=='completed';}
  function key(){return store().makeId?store().makeId('partyquest'):'partyquest_'+now().toString(36)+'_'+Math.random().toString(36).slice(2,8);}
  function blockedForTask(taskId,source){var blocked={},task=taskById(taskId);if(task){if(task.assignedToUids)Object.keys(task.assignedToUids).forEach(function(id){if(task.assignedToUids[id])blocked[String(id)]=true;});if(task.assignedToUid)blocked[String(task.assignedToUid)]=true;var owner=task.createdByUid||task.ownerUid;if(owner)blocked[String(owner)]=true;}Object.values(source||{}).forEach(function(q){if(!live(q)||String(q.questId||'')!==String(taskId))return;if(q.inviterUid)blocked[String(q.inviterUid)]=true;Object.keys(invitees(q)).forEach(function(id){var x=invitees(q)[id];if(x&&(x.status==='pending'||x.status==='active'))blocked[String(id)]=true;});});return blocked;}
  function emit(token){try{window.dispatchEvent(new CustomEvent('familyapp:party-quests-updated',{detail:{uid:token.uid,householdId:token.householdId,count:Object.keys(rowsById).length}}));}catch(e){}}
  function stop(){if(unsubscribe)try{unsubscribe();}catch(e){}unsubscribe=null;boundToken=null;rowsById={};}
  function start(){var token;try{token=captureReady();}catch(e){stop();return false;}if(boundToken&&ctx().isCurrent(boundToken)&&unsubscribe)return true;stop();boundToken=token;contract().shared('partyQuests');unsubscribe=store().subscribeShared(COLLECTION,function(v){if(!ctx().isCurrent(token))return;rowsById=rows(v);emit(token);},{});return true;}
  function list(){assertToken(captureReady());return Object.keys(rowsById).map(function(k){var q=clone(rowsById[k]);if(q&&!q.id)q.id=k;return q;}).filter(Boolean);}
  function get(id){var q=rowsById&&rowsById[id];if(!q)return null;q=clone(q);if(!q.id)q.id=id;return q;}
  function relevant(){var token=captureReady();return list().filter(function(q){return String(q.inviterUid)===String(token.uid)||!!invitees(q)[token.uid];});}
  function pending(){var token=captureReady();return relevant().filter(function(q){var x=invitees(q)[token.uid];return x&&x.status==='pending'&&live(q);});}
  function mutate(id,fn){var token=captureReady();assertToken(token);return store().mutateSharedRecord(COLLECTION,String(id),function(server){assertToken(token);var q=server&&typeof server==='object'?clone(server):null;if(!q)return;var next=fn(q,token);if(!next)return;next.updatedAt=now();return next;},get(id)).then(function(r){assertToken(token);return r&&r.value?r.value:r;});}
  function createInvites(taskId,targetUids){var token=captureReady(),task=taskById(taskId);if(!task||!isCreator(task,token.uid))return Promise.reject(new Error('Alleen de maker kan deelnemers uitnodigen'));var blocked=blockedForTask(taskId,rowsById),inv={};(targetUids||[]).forEach(function(id){id=String(id);if(id===String(token.uid)||blocked[id])return;if(member(id))inv[id]={uid:id,name:nameOf(id),status:'pending'};});if(!Object.keys(inv).length)return Promise.reject(new Error('Geen beschikbare deelnemers'));var id=key(),row={id:id,title:'Party Quest',questId:String(task.id),questTitle:String(task.title||'Naamloze quest'),status:'pending',inviterUid:token.uid,inviterName:nameOf(token.uid),invitees:inv,createdAt:now(),updatedAt:now()};assertToken(token);return store().writeSharedRecord(COLLECTION,id,row).then(function(){assertToken(token);return row;});}
  function respond(id,status){return mutate(id,function(q,t){var mine=invitees(q)[t.uid];if(!live(q)||!mine||mine.status!=='pending')return;mine.status=status;mine.respondedAt=now();if(status==='active')q.status='active';return q;});}
  function revokeInvite(id,targetUid){return mutate(id,function(q,t){if(String(q.inviterUid)!==String(t.uid))return;var x=invitees(q)[targetUid];if(!x||x.status!=='pending')return;x.status='revoked';x.revokedAt=now();var vals=Object.values(invitees(q));q.status=vals.some(function(v){return v&&v.status==='active';})?'active':(vals.some(function(v){return v&&v.status==='pending';})?'pending':'cancelled');return q;});}
  function leave(id){return mutate(id,function(q,t){var mine=invitees(q)[t.uid];if(!mine||mine.status!=='active')return;mine.status='declined';mine.respondedAt=now();q.lastEvent={id:String(now())+'-'+t.uid,actorUid:t.uid,message:(mine.name||'Een gezinslid')+' heeft “'+(q.questTitle||'Party Quest')+'” verlaten',time:now()};return q;});}
  function end(id,status){return mutate(id,function(q,t){if(String(q.inviterUid)!==String(t.uid))return;q.status=status;q.endedAt=now();q.lastEvent={id:String(now())+'-'+t.uid,actorUid:t.uid,message:(q.inviterName||'De maker')+' heeft “'+(q.questTitle||'Party Quest')+'” beëindigd',time:now()};return q;});}
  function claimReward(id,xp){var token=captureReady();assertToken(token);return store().transactSharedPath(COLLECTION,[String(id),'rewardsClaimed',token.uid],function(cur){if(cur)return cur;return{xp:Number(xp||0),claimedAt:now()};},null).then(function(r){assertToken(token);return r;});}
  window.PartyQuestContextService={version:'1.1.0',start:start,stop:stop,list:list,get:get,relevant:relevant,pending:pending,createInvites:createInvites,respond:respond,revokeInvite:revokeInvite,leave:leave,end:end,claimReward:claimReward,status:function(){var c=null;try{c=ctx().current();}catch(e){}return{bound:!!unsubscribe,context:c,count:Object.keys(rowsById).length};}};
  window.addEventListener('familyapp:household-context-changed',function(){stop();start();});
  window.addEventListener('familyapp:session:cleared',stop);
  Promise.resolve().then(start);
})();