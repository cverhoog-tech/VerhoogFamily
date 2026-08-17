'use strict';
// ============================================================
// PROGRESSION UID BRIDGE v3.0.0
// Compatibility facade over UID-private ProgressionStore.
// ============================================================
(function(){
  if(window.ProgressionUidBridge&&window.ProgressionUidBridge.version==='3.0.0')return;
  var baseAward=null,bridged=false;
  function store(){return window.ProgressionStore||null;}
  function localXp(){var s=store();return s?s.get().xp:Math.max(0,Math.round(Number(window.myXP)||0));}
  function bridgeAward(){
    if(bridged)return true;
    if(typeof window.awardXP!=='function')return false;
    baseAward=window.awardXP;
    window.awardXP=function(amount,reason,meta){
      var delta=Math.max(0,Math.round(Number(amount)||0));
      var result;
      try{result=baseAward.apply(this,arguments);}catch(e){result=undefined;}
      if(delta&&store())store().awardXP(delta,reason,meta).catch(function(){});
      return result;
    };
    window.awardXP.__uidProgression=true;bridged=true;return true;
  }
  function rewardXp(task){if(!task)return 4;var n=Number(task.rewardXp||task.xpAmount);if(isFinite(n)&&n>0)return Math.round(n);var m=String(task.xpReward||task.xp||'').match(/(\d+)/);return m?Math.max(1,parseInt(m[1],10)):4;}
  function boot(){if(store())store().ready();bridgeAward();}
  window.ProgressionUidBridge={version:'3.0.0',start:function(){boot();return!!store();},xp:localXp,rewardXp:rewardXp,status:function(){var s=store();return{xp:localXp(),attached:!!s,store:s&&s.status?s.status():null,awardBridged:bridged};}};
  window.addEventListener('familyapp:progression-updated',bridgeAward);window.addEventListener('familyapp:household-context-changed',boot);window.addEventListener('load',boot,{once:true});if(document.readyState==='complete')boot();else Promise.resolve().then(boot);
})();
