'use strict';
(function(){
  if(window.__partyQuestCompletionRewardV1)return;
  window.__partyQuestCompletionRewardV1=true;

  var pendingEnd={};
  var REWARD_XP=4;

  function uid(){try{var u=window.fbUser||(window.fbAuth&&window.fbAuth.currentUser)||firebase.auth().currentUser;return u&&u.uid||null;}catch(e){return null;}}
  function hid(){return window.fbFamilyId||'';}
  function taskById(id){return (window.taskData||[]).find(function(t){return String(t.id)===String(id);})||null;}
  function active(){try{return window.PartyQuestActiveView&&PartyQuestActiveView.list?PartyQuestActiveView.list()||[]:[];}catch(e){return[];}}
  function claimKey(q){return 'partyquest_task_reward_v1_'+hid()+'_'+String(q.id)+'_'+String(uid()||'');}
  function claimed(q){try{return localStorage.getItem(claimKey(q))==='1';}catch(e){return false;}}
  function markClaimed(q){try{localStorage.setItem(claimKey(q),'1');}catch(e){}}
  function reward(q){
    if(claimed(q))return;
    markClaimed(q);
    try{if(typeof window.awardXP==='function')window.awardXP(REWARD_XP,'Party Quest voltooid');}catch(e){}
    try{if(typeof window.addActivity==='function')window.addActivity('🏆','#efe9fb','Party Quest voltooid: “'+(q.questTitle||'Quest')+'”');}catch(e){}
    try{if(typeof window.showToast==='function')window.showToast('Party Quest voltooid! +'+REWARD_XP+' XP');}catch(e){}
  }
  function finish(q){
    if(!q||pendingEnd[q.id])return;
    pendingEnd[q.id]=true;
    reward(q);
    setTimeout(function(){
      try{
        if(window.PartyQuestActiveView&&typeof PartyQuestActiveView.endQuest==='function'){
          Promise.resolve(PartyQuestActiveView.endQuest(q)).finally(function(){delete pendingEnd[q.id];});
        }else delete pendingEnd[q.id];
      }catch(e){delete pendingEnd[q.id];}
    },350);
  }
  function scan(){
    active().forEach(function(q){
      var t=taskById(q.questId);
      if(t&&t.done)finish(q);
    });
  }
  window.addEventListener('familyapp:tasks-updated',function(){setTimeout(scan,0);});
  setInterval(scan,700);
  window.PartyQuestCompletionReward={scan:scan,rewardXp:REWARD_XP};
})();
