'use strict';
// ============================================================
// DAILY LOGIN BONUS
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
  var xp=ov._pendingXP||5;
  var day=todayStr();
  var reward;
  try{
    reward=awardXP(xp,'Dagelijkse bonus',{
      key:'daily:'+day,
      source:'daily-bonus',
      sourceId:day
    });
  }catch(error){
    console.error('[DailyBonus] reward failed',error);
    showToast('Dagelijkse bonus kon niet worden opgeslagen. Probeer opnieuw.');
    return;
  }
  Promise.resolve(reward).then(function(result){
    if(result&&result.error){
      showToast('Dagelijkse bonus kon niet worden opgeslagen. Probeer opnieuw.');
      return;
    }
    dailyBonusData.lastClaim=day;
    localStorage.setItem('familie_daily_bonus',JSON.stringify(dailyBonusData));
    ov.style.display='none';
    if(!result||result.awarded!==false)showToast('🎁 +'+xp+' XP dagelijkse bonus!');
    else showToast('🎁 Dagelijkse bonus was al geclaimd');
    spawnConfetti();
  });
}

