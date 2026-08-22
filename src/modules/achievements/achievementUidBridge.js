'use strict';
// ============================================================
// ACHIEVEMENT PROGRESSION BRIDGE v2.0
// Achievement unlocks and XP are persisted by FamilyProgression.
// No direct Firebase member writes. No polling.
// ============================================================
(function(){
  if(window.__achievementUidBridgeV2)return;
  window.__achievementUidBridgeV2=true;
  var installed=false,rawCheck=null,hydrating=false;

  function svc(){return window.FamilyProgression||null;}
  function badgeById(id){return (window.BADGES||[]).find(function(b){return b.id===id;})||null;}
  function hydrate(){
    var s=svc(),st=s&&s.getState&&s.getState();if(!st)return false;
    window.unlockedBadges=window.unlockedBadges||{};
    Object.keys(st.achievements||{}).forEach(function(id){window.unlockedBadges[id]=true;});
    return true;
  }
  function importLegacyUnlocks(){
    var s=svc();if(!s||!s.isReady||!s.isReady()||hydrating)return;hydrating=true;
    Object.keys(window.unlockedBadges||{}).forEach(function(id){var st=s.getState();if(st&&st.achievements&&st.achievements[id])return;s.unlockAchievement(id,0,{source:'legacy-achievement-import',eventId:'achievement:'+id+':legacy-import'});});
    hydrating=false;
  }
  function install(){
    if(installed)return true;
    if(typeof window.checkAchievements!=='function')return false;
    rawCheck=window.checkAchievements;
    window.checkAchievements=function(){
      var s=svc();if(!s||!s.isReady||!s.isReady())return false;
      hydrate();
      var canonical=s.getState(),canonicalXp=canonical?canonical.totalXp:0,before={};
      Object.keys(window.unlockedBadges||{}).forEach(function(id){if(window.unlockedBadges[id])before[id]=true;});
      window.myXP=canonicalXp;try{if(typeof myXP!=='undefined')myXP=canonicalXp;}catch(e){}
      var result=rawCheck.apply(this,arguments),newly=[];
      Object.keys(window.unlockedBadges||{}).forEach(function(id){if(window.unlockedBadges[id]&&!before[id])newly.push(id);});
      window.myXP=canonicalXp;try{if(typeof myXP!=='undefined')myXP=canonicalXp;}catch(e){}
      newly.forEach(function(id){var b=badgeById(id);s.unlockAchievement(id,Number(b&&b.xp)||0,{source:'achievement-check',eventId:'achievement:'+id+':v1'});});
      hydrate();
      return result;
    };
    window.checkAchievements.__centralProgression=true;installed=true;importLegacyUnlocks();return true;
  }
  function renderIfOpen(){try{var el=document.getElementById('screen-achievements');if(el&&el.classList.contains('active')&&typeof window.renderAch==='function')window.renderAch();}catch(e){}}
  function start(){hydrate();install();importLegacyUnlocks();renderIfOpen();}
  window.AchievementUidBridge={version:'2.0.0',start:start,status:function(){var s=svc();return{ready:!!(s&&s.isReady&&s.isReady()),installed:installed,storage:'uid-private-progression'};}};
  window.addEventListener('familyapp:progression:ready',start);window.addEventListener('familyapp:progression:updated',function(){hydrate();renderIfOpen();});window.addEventListener('load',start,{once:true});
  if(document.readyState==='complete')start();else Promise.resolve().then(start);
})();
