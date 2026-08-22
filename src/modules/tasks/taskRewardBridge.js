'use strict';
// ============================================================
// TASK REWARD BRIDGE v3.0
// Task completion -> canonical FamilyProgression account + skill XP.
// ============================================================
(function(){
  if(window.__taskRewardBridgeV3)return;
  window.__taskRewardBridgeV3=true;
  var currentTask=null,wrappedToggle=false,wrappedAward=false;
  function taskById(id){return (window.taskData||[]).find(function(t){return String(t.id)===String(id);})||null;}
  function rewardXp(task){try{if(window.FamilyProgression&&typeof FamilyProgression.rewardXp==='function')return FamilyProgression.rewardXp(task);}catch(e){}if(!task)return 4;var n=Number(task.rewardXp||task.xpAmount);if(isFinite(n)&&n>0)return Math.round(n);var m=String(task.xpReward||task.xp||'').match(/(\d+)/);return m?Math.max(1,parseInt(m[1],10)):4;}
  function install(){
    if(typeof window.awardXP==='function'&&!wrappedAward){
      var oldAward=window.awardXP;
      window.awardXP=function(amount,reason){
        if(currentTask&&String(reason||'').toLowerCase()==='taak'&&window.FamilyProgression){
          var result=FamilyProgression.awardTaskCompletion(currentTask,{xp:rewardXp(currentTask),source:'task-complete'});
          if(result&&result.account&&typeof FamilyProgression.presentAward==='function')FamilyProgression.presentAward(result.account,'Taak');
          try{if(typeof window.checkAchievements==='function')setTimeout(function(){window.checkAchievements();},0);}catch(e){}
          return result;
        }
        return oldAward.apply(this,arguments);
      };
      window.awardXP.__taskRewardBridge=true;wrappedAward=true;
    }
    if(typeof window.toggleTask==='function'&&!wrappedToggle){
      var oldToggle=window.toggleTask;
      window.toggleTask=function(id){currentTask=taskById(id);try{return oldToggle.apply(this,arguments);}finally{currentTask=null;}};
      window.toggleTask.__taskRewardBridge=true;wrappedToggle=true;
    }
    return wrappedAward&&wrappedToggle;
  }
  window.TaskRewardBridge={version:'3.0.0',install:install,rewardXp:rewardXp,status:function(){return{awardWrapped:wrappedAward,toggleWrapped:wrappedToggle,central:!!window.FamilyProgression};}};
  window.addEventListener('familyapp:progression:ready',install);window.addEventListener('familyapp:tasks-updated',install);window.addEventListener('load',install,{once:true});
  if(document.readyState==='complete')install();else Promise.resolve().then(install);
})();
