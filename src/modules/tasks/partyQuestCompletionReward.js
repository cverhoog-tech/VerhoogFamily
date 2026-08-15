'use strict';
(function(){
  if(window.__partyQuestCompletionRewardV3)return;
  window.__partyQuestCompletionRewardV3=true;
  var pendingEnd={},rewarding={};
  function taskById(id){return (window.taskData||[]).find(function(t){return String(t.id)===String(id);})||null;}
  function active(){try{return window.PartyQuestActiveView&&PartyQuestActiveView.list?PartyQuestActiveView.list()||[]:[];}catch(e){return[];}}
  function rewardXp(task){try{if(window.ProgressionUidBridge&&typeof ProgressionUidBridge.rewardXp==='function')return ProgressionUidBridge.rewardXp(task);}catch(e){}try{if(window.TaskRewardBridge&&typeof TaskRewardBridge.rewardXp==='function')return TaskRewardBridge.rewardXp(task);}catch(e){}return 4;}
  function reward(q,t){var svc=window.PartyQuestContextService;if(!svc||rewarding[q.id])return Promise.resolve(false);rewarding[q.id]=true;var xp=rewardXp(t);return svc.claimReward(q.id,xp).then(function(result){var value=result&&result.value!==undefined?result.value:result;if(value&&value.xp===xp){try{if(typeof window.awardXP==='function')window.awardXP(xp,'Party Quest voltooid');}catch(e){}try{if(typeof window.addActivity==='function')window.addActivity('🏆','#efe9fb','Party Quest voltooid: “'+(q.questTitle||'Quest')+'”');}catch(e){}try{if(typeof window.showToast==='function')window.showToast('Party Quest voltooid! +'+xp+' XP');}catch(e){}rewarding[q.id]=false;return true;}rewarding[q.id]=false;return false;}).catch(function(){rewarding[q.id]=false;return false;});}
  function finish(q,t){if(!q||pendingEnd[q.id])return;pendingEnd[q.id]=true;reward(q,t).finally(function(){setTimeout(function(){try{if(window.PartyQuestActiveView&&typeof PartyQuestActiveView.endQuest==='function'){Promise.resolve(PartyQuestActiveView.endQuest(q)).finally(function(){delete pendingEnd[q.id];});}else delete pendingEnd[q.id];}catch(e){delete pendingEnd[q.id];}},250);});}
  function scan(){active().forEach(function(q){var t=taskById(q.questId);if(t&&t.done)finish(q,t);});}
  window.addEventListener('familyapp:tasks-updated',function(){setTimeout(scan,0);});
  window.addEventListener('familyapp:progression-updated',function(){setTimeout(scan,0);});
  window.addEventListener('familyapp:party-quests-updated',function(){setTimeout(scan,0);});
  setTimeout(scan,600);
  window.PartyQuestCompletionReward={version:'3.0-context',scan:scan,rewardXp:function(task){return rewardXp(task);}};
})();