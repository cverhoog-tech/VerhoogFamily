'use strict';
(function(){
  if(window.__partyQuestCompletionRewardV2)return;
  window.__partyQuestCompletionRewardV2=true;

  var pendingEnd={},rewarding={};

  function uid(){try{var u=window.fbUser||(window.fbAuth&&window.fbAuth.currentUser)||firebase.auth().currentUser;return u&&u.uid||null;}catch(e){return null;}}
  function hid(){return window.fbFamilyId||'';}
  function db(){try{return window.fbDb||firebase.database();}catch(e){return null;}}
  function taskById(id){return (window.taskData||[]).find(function(t){return String(t.id)===String(id);})||null;}
  function active(){try{return window.PartyQuestActiveView&&PartyQuestActiveView.list?PartyQuestActiveView.list()||[]:[];}catch(e){return[];}}
  function rewardXp(task){try{if(window.ProgressionUidBridge&&typeof ProgressionUidBridge.rewardXp==='function')return ProgressionUidBridge.rewardXp(task);}catch(e){}try{if(window.TaskRewardBridge&&typeof TaskRewardBridge.rewardXp==='function')return TaskRewardBridge.rewardXp(task);}catch(e){}return 4;}
  function reward(q,t){
    var me=uid(),d=db();if(!me||!d||rewarding[q.id])return Promise.resolve(false);rewarding[q.id]=true;
    var xp=rewardXp(t),claim=d.ref('families/'+hid()+'/partyQuests/'+q.id+'/rewardsClaimed/'+me);
    return claim.transaction(function(current){if(current)return;return{xp:xp,claimedAt:firebase.database.ServerValue.TIMESTAMP};}).then(function(result){
      if(result&&result.committed){
        try{if(typeof window.awardXP==='function')window.awardXP(xp,'Party Quest voltooid');}catch(e){}
        try{if(typeof window.addActivity==='function')window.addActivity('🏆','#efe9fb','Party Quest voltooid: “'+(q.questTitle||'Quest')+'”');}catch(e){}
        try{if(typeof window.showToast==='function')window.showToast('Party Quest voltooid! +'+xp+' XP');}catch(e){}
      }
      rewarding[q.id]=false;return !!(result&&result.committed);
    }).catch(function(){rewarding[q.id]=false;return false;});
  }
  function finish(q,t){
    if(!q||pendingEnd[q.id])return;
    pendingEnd[q.id]=true;
    reward(q,t).finally(function(){
      setTimeout(function(){
        try{
          if(window.PartyQuestActiveView&&typeof PartyQuestActiveView.endQuest==='function'){
            Promise.resolve(PartyQuestActiveView.endQuest(q)).finally(function(){delete pendingEnd[q.id];});
          }else delete pendingEnd[q.id];
        }catch(e){delete pendingEnd[q.id];}
      },250);
    });
  }
  function scan(){active().forEach(function(q){var t=taskById(q.questId);if(t&&t.done)finish(q,t);});}
  window.addEventListener('familyapp:tasks-updated',function(){setTimeout(scan,0);});
  window.addEventListener('familyapp:progression-updated',function(){setTimeout(scan,0);});
  setTimeout(scan,600);
  window.PartyQuestCompletionReward={scan:scan,rewardXp:function(task){return rewardXp(task);}};
})();
