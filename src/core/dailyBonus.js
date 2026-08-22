'use strict';
// ============================================================
// DAILY LOGIN BONUS + PROGRESSION RUNTIME BOOTSTRAP
// ============================================================
var dailyBonusData={lastClaim:'',streak:0};
try{var _db2=localStorage.getItem('familie_daily_bonus');if(_db2)dailyBonusData=JSON.parse(_db2);}catch(e){}
function checkDailyBonus(){
  var today=todayStr();
  if(dailyBonusData.lastClaim===today)return;
  var y=new Date();y.setDate(y.getDate()-1);var yStr=y.toISOString().split('T')[0];
  dailyBonusData.streak=dailyBonusData.lastClaim===yStr?(dailyBonusData.streak||0)+1:1;
  var xp=Math.min(5+(dailyBonusData.streak-1)*2,25);
  var ov=document.getElementById('daily-bonus-overlay');
  var st=document.getElementById('daily-bonus-streak');
  var xpEl=document.getElementById('daily-bonus-xp');
  if(ov)ov.style.display='flex';
  if(st)st.textContent=dailyBonusData.streak>1?'🔥 '+dailyBonusData.streak+' dagen op rij!':'Welkom terug!';
  if(xpEl)xpEl.textContent='+'+xp+' XP';
  if(ov)ov._pendingXP=xp;
}
function claimDailyBonus(){
  var ov=document.getElementById('daily-bonus-overlay');if(!ov)return;
  var xp=ov._pendingXP||5,today=todayStr();
  dailyBonusData.lastClaim=today;
  localStorage.setItem('familie_daily_bonus',JSON.stringify(dailyBonusData));
  ov.style.display='none';
  if(window.FamilyProgression&&typeof FamilyProgression.recordStreak==='function'){
    var result=FamilyProgression.recordStreak(dailyBonusData.streak,{xp:xp,date:today,source:'daily-login-bonus',eventId:'daily-login:'+today});
    if(typeof FamilyProgression.presentAward==='function')FamilyProgression.presentAward(result,'Dagelijkse bonus');
  }else awardXP(xp,'Dagelijkse bonus');
  showToast('🎁 +'+xp+' XP dagelijkse bonus!');
  spawnConfetti();
}

// The app has two entry paths (direct index and /api/app). Keep the canonical
// progression runtime reachable from both without polling or duplicating state.
(function loadCanonicalProgressionRuntime(){
  if(window.__canonicalProgressionRuntimeLoader)return;window.__canonicalProgressionRuntimeLoader=true;
  function load(src,flag,next){if(window[flag]){if(next)next();return;}var s=document.createElement('script');s.src=src;s.async=false;s.defer=true;s.onload=function(){if(next)next();};document.head.appendChild(s);}
  function loadBridges(){
    load('src/core/progressionUidBridge.js?v=3','__progressionUidBridgeV3');
    load('src/modules/tasks/taskRewardBridge.js?v=3','__taskRewardBridgeV3');
    load('src/modules/achievements/achievementUidBridge.js?v=2','__achievementUidBridgeV2');
    load('src/modules/skills/skillsProgressionBridge.js?v=1','__skillsProgressionBridgeV1');
  }
  function loadEngine(){load('src/core/progressionEngine.js?v=2','FamilyProgression',loadBridges);}
  if(window.FamilyDataStore)loadEngine();else load('src/core/familyDataStore.js?v=2','FamilyDataStore',loadEngine);
})();
