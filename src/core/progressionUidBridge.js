'use strict';
// ============================================================
// PROGRESSION UID BRIDGE v3.0
// Compatibility facade: legacy awardXP -> FamilyProgression.
// No household-member XP writes. No polling.
// ============================================================
(function(){
  if(window.__progressionUidBridgeV3)return;
  window.__progressionUidBridgeV3=true;

  var installed=false,legacyAward=null;
  function service(){return window.FamilyProgression||null;}
  function uid(){try{var u=window.fbUser||(window.firebase&&firebase.auth&&firebase.auth().currentUser);return u&&u.uid||null;}catch(e){return null;}}
  function inferType(reason){var s=String(reason||'').toLowerCase();if(s.indexOf('quest')>-1)return'quest';if(s.indexOf('streak')>-1)return'streak';if(s.indexOf('achievement')>-1||s.indexOf('badge')>-1)return'achievement';if(s.indexOf('taak')>-1)return'task';return'xp';}
  function currentStreak(){try{return (window.recurData||[]).reduce(function(m,r){return Math.max(m,Number(r&&r.streak)||0);},0);}catch(e){return 0;}}
  function install(){
    if(installed)return true;
    if(typeof window.awardXP!=='function')return false;
    legacyAward=window.awardXP;
    window.awardXP=function(amount,reason){
      var svc=service(),type=inferType(reason),result;
      if(!svc){return legacyAward.apply(this,arguments);}
      if(type==='streak'&&typeof svc.recordStreak==='function')result=svc.recordStreak(currentStreak(),{xp:amount,source:String(reason||'streak')});
      else result=svc.awardXp(amount,{type:type,source:String(reason||'legacy-award')});
      if(typeof svc.presentAward==='function')svc.presentAward(result,reason||'XP');
      try{if(typeof window.checkAchievements==='function')setTimeout(function(){window.checkAchievements();},0);}catch(e){}
      return result;
    };
    window.awardXP.__centralProgression=true;
    installed=true;
    return true;
  }
  function start(){try{if(service()&&typeof service().boot==='function')service().boot();}catch(e){}install();return !!service();}
  window.ProgressionUidBridge={version:'3.0.0',start:start,xp:function(){var s=service(),st=s&&s.getState&&s.getState();return st?st.totalXp:Number(window.myXP)||0;},rewardXp:function(task){var s=service();return s&&s.rewardXp?s.rewardXp(task):4;},status:function(){var s=service();return{uid:uid(),xp:this.xp(),attached:!!(s&&s.isReady&&s.isReady()),awardBridged:installed,storage:'uid-private'};}};
  window.addEventListener('familyapp:progression:ready',install);window.addEventListener('familyapp:auth-ready',start);window.addEventListener('familyapp:household-identity-synced',start);window.addEventListener('load',start,{once:true});
  if(document.readyState==='complete')start();else Promise.resolve().then(start);
})();
