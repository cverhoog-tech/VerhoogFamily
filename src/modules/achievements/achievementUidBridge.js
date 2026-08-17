'use strict';
// ============================================================
// ACHIEVEMENT UID BRIDGE v2.0.0
// Compatibility adapter over UID-private ProgressionStore.
// ============================================================
(function(){
  if(window.AchievementUidBridge&&window.AchievementUidBridge.version==='2.0.0')return;
  var rawCheck=null,installed=false;
  function store(){return window.ProgressionStore||null;}
  function install(){
    if(installed)return true;
    if(typeof window.checkAchievements!=='function')return false;
    rawCheck=window.checkAchievements;
    window.checkAchievements=function(){
      if(!store())return rawCheck.apply(this,arguments);
      var before={};
      Object.keys(window.unlockedBadges||{}).forEach(function(k){if(window.unlockedBadges[k])before[k]=true;});
      var result=rawCheck.apply(this,arguments);
      var after={};Object.keys(window.unlockedBadges||{}).forEach(function(k){if(window.unlockedBadges[k])after[k]=true;});
      Object.keys(after).forEach(function(id){if(before[id])return;var b=(window.BADGES||[]).find(function(x){return x.id===id;})||{};store().unlockAchievement(id,{name:b.name||id,icon:b.icon||'',xp:Number(b.xp||0)||0,rarity:b.rarity||''}).catch(function(){});});
      return result;
    };
    window.checkAchievements.__uidBridge=true;installed=true;return true;
  }
  function start(){if(store())store().ready();install();return!!store();}
  window.AchievementUidBridge={version:'2.0.0',start:start,status:function(){return{ready:!!store(),installed:installed,progression:store()&&store().status?store().status():null};}};
  window.addEventListener('familyapp:progression-updated',function(){install();try{if(typeof window.renderAch==='function')window.renderAch();}catch(e){}});window.addEventListener('familyapp:household-context-changed',start);if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
