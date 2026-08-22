'use strict';
// ============================================================
// DAILY LOGIN BONUS + PROGRESSION RUNTIME BOOTSTRAP
// UID-private progression is authoritative; localStorage is a fallback mirror.
// ============================================================
var dailyBonusData={lastClaim:'',streak:0};
try{var _db2=localStorage.getItem('familie_daily_bonus');if(_db2)dailyBonusData=JSON.parse(_db2);}catch(e){}
function getCanonicalDailyState(){
  try{var s=window.FamilyProgression&&FamilyProgression.isReady&&FamilyProgression.isReady()&&FamilyProgression.getState&&FamilyProgression.getState();return s&&s.streaks?s.streaks:null;}catch(e){return null;}
}
function saveDailyBonusMirror(date,streak){
  dailyBonusData.lastClaim=date||dailyBonusData.lastClaim;dailyBonusData.streak=Math.max(0,Number(streak)||0);
  try{localStorage.setItem('familie_daily_bonus',JSON.stringify(dailyBonusData));}catch(e){}
}
function checkDailyBonus(){
  var today=todayStr(),canonical=getCanonicalDailyState();
  if(canonical&&canonical.lastActiveDate===today){saveDailyBonusMirror(today,canonical.current||0);return;}
  if(!canonical&&dailyBonusData.lastClaim===today)return;
  var y=new Date();y.setDate(y.getDate()-1);var yStr=y.toISOString().split('T')[0];
  var previousDate=canonical?canonical.lastActiveDate:dailyBonusData.lastClaim;
  var previousStreak=canonical?Number(canonical.current||0):Number(dailyBonusData.streak||0);
  var nextStreak=previousDate===yStr?previousStreak+1:1;
  var xp=Math.min(5+(nextStreak-1)*2,25);
  var ov=document.getElementById('daily-bonus-overlay');
  var st=document.getElementById('daily-bonus-streak');
  var xpEl=document.getElementById('daily-bonus-xp');
  if(ov)ov.style.display='flex';
  if(st)st.textContent=nextStreak>1?'🔥 '+nextStreak+' dagen op rij!':'Welkom terug!';
  if(xpEl)xpEl.textContent='+'+xp+' XP';
  if(ov){ov._pendingXP=xp;ov._pendingStreak=nextStreak;ov._pendingDate=today;}
}
function claimDailyBonus(){
  var ov=document.getElementById('daily-bonus-overlay');if(!ov)return;
  var xp=ov._pendingXP||5,today=ov._pendingDate||todayStr(),streak=ov._pendingStreak||1,result=null;
  ov.style.display='none';
  if(window.FamilyProgression&&typeof FamilyProgression.recordStreak==='function'){
    result=FamilyProgression.recordStreak(streak,{xp:xp,date:today,source:'daily-login-bonus',eventId:'daily-login:'+today});
    if(result&&result.duplicate){
      var current=getCanonicalDailyState();saveDailyBonusMirror(today,current&&current.current||streak);
      if(typeof window.showToast==='function')window.showToast('Dagelijkse bonus was vandaag al geclaimd.');
      return;
    }
    saveDailyBonusMirror(today,streak);
    if(typeof FamilyProgression.presentAward==='function')FamilyProgression.presentAward(result,'Dagelijkse bonus');
  }else{
    saveDailyBonusMirror(today,streak);awardXP(xp,'Dagelijkse bonus');
  }
  if(typeof window.showToast==='function')window.showToast('🎁 +'+xp+' XP dagelijkse bonus!');
  if(typeof window.spawnConfetti==='function')window.spawnConfetti();
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

window.addEventListener('familyapp:progression:ready',function(){try{checkDailyBonus();}catch(e){}});
