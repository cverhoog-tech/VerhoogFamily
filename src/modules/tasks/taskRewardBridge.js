'use strict';
(function(){
  if(window.__taskRewardBridgeV1)return;
  window.__taskRewardBridgeV1=true;
  var currentTask=null,wrappedToggle=false,wrappedAward=false;
  function taskById(id){return (window.taskData||[]).find(function(t){return String(t.id)===String(id);})||null;}
  function rewardXp(task){try{if(window.ProgressionUidBridge&&typeof ProgressionUidBridge.rewardXp==='function')return ProgressionUidBridge.rewardXp(task);}catch(e){}if(!task)return 4;var n=Number(task.rewardXp||task.xpAmount);if(isFinite(n)&&n>0)return Math.round(n);var m=String(task.xpReward||task.xp||'').match(/(\d+)/);return m?Math.max(1,parseInt(m[1],10)):4;}
  function install(){
    if(typeof window.awardXP==='function'&&!wrappedAward){var oldAward=window.awardXP;window.awardXP=function(amount,reason){if(currentTask&&String(reason||'').toLowerCase()==='taak')amount=rewardXp(currentTask);return oldAward.call(this,amount,reason);};window.awardXP.__taskRewardBridge=true;wrappedAward=true;}
    if(typeof window.toggleTask==='function'&&!wrappedToggle){var oldToggle=window.toggleTask;window.toggleTask=function(id){currentTask=taskById(id);try{return oldToggle.apply(this,arguments);}finally{currentTask=null;}};window.toggleTask.__taskRewardBridge=true;wrappedToggle=true;}
    return wrappedAward&&wrappedToggle;
  }
  window.TaskRewardBridge={install:install,rewardXp:rewardXp};
  var n=0,t=setInterval(function(){n++;if(install()||n>120)clearInterval(t);},100);setTimeout(install,0);
})();
