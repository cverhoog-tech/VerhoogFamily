'use strict';
(function(){
  if(window.__achievementUidBridgeV1)return;
  window.__achievementUidBridgeV1=true;
  var ready=false,ref=null,rawCheck=null,lastUid=null,lastHid=null;
  function db(){try{return window.fbDb||(window.firebase&&firebase.database&&firebase.database())||null;}catch(e){return null;}}
  function uid(){try{var u=window.fbUser||(window.firebase&&firebase.auth&&firebase.auth().currentUser);return u&&u.uid||null;}catch(e){return null;}}
  function hid(){return window.fbFamilyId||null;}
  function xpRef(){var d=db(),me=uid(),family=hid();return d&&me&&family?d.ref('families/'+family+'/members/'+me+'/xp'):null;}
  function badgeRef(id){var d=db(),me=uid(),family=hid();return d&&me&&family?d.ref('families/'+family+'/members/'+me+'/achievements/'+id):null;}
  function install(){
    if(rawCheck||typeof window.checkAchievements!=='function')return !!rawCheck;
    rawCheck=window.checkAchievements;
    window.checkAchievements=function(){
      if(!ready)return;
      var beforeXp=Number(window.myXP||0),before={};
      Object.keys(window.unlockedBadges||{}).forEach(function(k){if(window.unlockedBadges[k])before[k]=true;});
      var result=rawCheck.apply(this,arguments);
      var afterXp=Number(window.myXP||0),delta=Math.max(0,Math.round(afterXp-beforeXp));
      var newly=[];Object.keys(window.unlockedBadges||{}).forEach(function(k){if(window.unlockedBadges[k]&&!before[k])newly.push(k);});
      newly.forEach(function(id){var b=(window.BADGES||[]).find(function(x){return x.id===id;});var r=badgeRef(id);if(r)r.set({unlocked:true,unlockedAt:firebase.database.ServerValue.TIMESTAMP,xp:Number(b&&b.xp||0)});});
      if(delta){try{localStorage.setItem('fam_myxp_v1',String(Math.round(afterXp)));}catch(e){}var xr=xpRef();if(xr)xr.set(firebase.database.ServerValue.increment(delta));}
      return result;
    };
    window.checkAchievements.__uidBridge=true;
    return true;
  }
  function attach(){
    var d=db(),me=uid(),family=hid();if(!d||!me||!family)return false;
    install();
    if(ref&&lastUid===me&&lastHid===family)return true;
    if(ref)try{ref.off();}catch(e){}
    lastUid=me;lastHid=family;ready=false;
    ref=d.ref('families/'+family+'/members/'+me+'/achievements');
    ref.on('value',function(s){var rows=s.val()||{};window.unlockedBadges=window.unlockedBadges||{};Object.keys(rows).forEach(function(k){if(rows[k]&&rows[k].unlocked!==false)window.unlockedBadges[k]=true;});ready=true;try{if(typeof window.renderAch==='function'&&document.getElementById('screen-achievements')&&document.getElementById('screen-achievements').classList.contains('active'))window.renderAch();}catch(e){}try{window.checkAchievements();}catch(e){}});
    return true;
  }
  window.addEventListener('familyapp:household-identity-synced',attach);
  window.addEventListener('familyapp:household-changed',attach);
  window.addEventListener('familyapp:progression-updated',function(){try{if(typeof window.renderAch==='function'&&document.getElementById('screen-achievements')&&document.getElementById('screen-achievements').classList.contains('active'))window.renderAch();}catch(e){}});
  var n=0,t=setInterval(function(){n++;install();if(attach()&&n>8)clearInterval(t);if(n>120)clearInterval(t);},250);
  setTimeout(function(){install();attach();},0);
  window.AchievementUidBridge={start:attach,status:function(){return{ready:ready,uid:uid(),householdId:hid(),attached:!!ref};}};
})();
