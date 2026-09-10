'use strict';
// ============================================================
// PROGRESSION UID BRIDGE v3.0.0 — STEP 9 compatibility adapter
//
// ProgressionStore is the canonical authority. This bridge intentionally owns
// no Firebase listener, no localStorage migration and no awardXP mutation.
// It remains only because existing task/achievement presentation code asks it
// for reward values/current XP.
// ============================================================
(function(){
  if(window.__progressionUidBridgeV3)return;
  window.__progressionUidBridgeV3=true;

  function store(){return window.ProgressionStore||null;}
  function currentXp(){
    var s=store();
    try{if(s&&typeof s.getCurrentXp==='function')return Math.max(0,Math.round(Number(s.getCurrentXp())||0));}catch(e){}
    var n=Number(window.myXP);return isFinite(n)?Math.max(0,Math.round(n)):0;
  }
  function rewardXp(task){
    if(!task)return 4;
    var n=Number(task.rewardXp||task.xpAmount);
    if(isFinite(n)&&n>0)return Math.round(n);
    var m=String(task.xpReward||task.xp||'').match(/(\d+)/);
    return m?Math.max(1,parseInt(m[1],10)):4;
  }
  function start(){
    var s=store();
    try{if(s&&typeof s.start==='function')s.start();}catch(e){}
    return !!s;
  }

  window.ProgressionUidBridge={
    version:'3.0.0',
    start:start,
    xp:currentXp,
    getCurrentXp:currentXp,
    rewardXp:rewardXp,
    status:function(){
      var s=store(),status=null;
      try{status=s&&typeof s.status==='function'?s.status():null;}catch(e){}
      return{
        authority:s?'ProgressionStore':'legacy-projection',
        uid:status&&status.uid||null,
        householdId:status&&status.householdId||null,
        xp:currentXp(),
        attached:!!(status&&status.attached),
        awardBridged:false
      };
    }
  };

  window.addEventListener('familyapp:progression-updated',start);
})();
