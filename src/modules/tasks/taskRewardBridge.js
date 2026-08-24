'use strict';
// ============================================================
// TASK REWARD BRIDGE v3.0.0 — STEP 9 deterministic task rewards
// ============================================================
(function(){
  if(window.__taskRewardBridgeV3)return;
  window.__taskRewardBridgeV3=true;

  var currentTask=null;

  function taskById(id){return (window.taskData||[]).find(function(t){return String(t.id)===String(id);})||null;}
  function rewardXp(task){
    try{if(window.ProgressionUidBridge&&typeof ProgressionUidBridge.rewardXp==='function')return ProgressionUidBridge.rewardXp(task);}catch(e){}
    if(!task)return 4;
    var n=Number(task.rewardXp||task.xpAmount);
    if(isFinite(n)&&n>0)return Math.round(n);
    var m=String(task.xpReward||task.xp||'').match(/(\d+)/);
    return m?Math.max(1,parseInt(m[1],10)):4;
  }
  function mergeOptions(base,extra){
    var out={};
    if(base&&typeof base==='object')Object.keys(base).forEach(function(k){out[k]=base[k];});
    Object.keys(extra||{}).forEach(function(k){if(out[k]==null||out[k]==='')out[k]=extra[k];});
    return out;
  }
  function installAward(){
    if(typeof window.awardXP!=='function')return false;
    if(window.awardXP.__taskRewardBridgeV3)return true;
    var oldAward=window.awardXP;
    var wrapped=function(amount,reason,options){
      if(currentTask&&String(reason||'').toLowerCase()==='taak'){
        amount=rewardXp(currentTask);
        options=mergeOptions(options,{
          key:'task:'+String(currentTask.id),
          source:'task',
          sourceId:String(currentTask.id)
        });
      }
      return oldAward.call(this,amount,reason,options);
    };
    wrapped.__taskRewardBridgeV3=true;
    wrapped.__wrappedAward=oldAward;
    window.awardXP=wrapped;
    return true;
  }
  function installToggle(){
    if(typeof window.toggleTask!=='function')return false;
    if(window.toggleTask.__taskRewardBridgeV3)return true;
    var oldToggle=window.toggleTask;
    var wrapped=function(id){
      currentTask=taskById(id);
      try{return oldToggle.apply(this,arguments);}finally{currentTask=null;}
    };
    wrapped.__taskRewardBridgeV3=true;
    wrapped.__wrappedToggle=oldToggle;
    window.toggleTask=wrapped;
    return true;
  }
  function install(){return installAward()&&installToggle();}
  function ensure(){install();}

  window.TaskRewardBridge={
    version:'3.0.0',
    install:install,
    rewardXp:rewardXp,
    status:function(){return{
      awardWrapped:!!(window.awardXP&&window.awardXP.__taskRewardBridgeV3),
      toggleWrapped:!!(window.toggleTask&&window.toggleTask.__taskRewardBridgeV3),
      currentTaskId:currentTask&&currentTask.id!=null?String(currentTask.id):null
    };}
  };

  window.addEventListener('familyapp:tasks-updated',ensure);
  window.addEventListener('familyapp:progression-updated',ensure);
  window.addEventListener('familyapp:household-context',ensure);
  window.addEventListener('load',ensure,{once:true});
  if(document.readyState==='complete')ensure();else Promise.resolve().then(ensure);
})();
