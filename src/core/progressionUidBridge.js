'use strict';
(function(){
  if(window.__progressionUidBridgeV1)return;
  window.__progressionUidBridgeV1=true;
  var ref=null,baseAward=null,bridged=false,lastUid=null,lastHid=null;
  function db(){try{return window.fbDb||(window.firebase&&firebase.database&&firebase.database())||null;}catch(e){return null;}}
  function uid(){try{var u=window.fbUser||(window.firebase&&firebase.auth&&firebase.auth().currentUser);return u&&u.uid||null;}catch(e){return null;}}
  function hid(){return window.fbFamilyId||null;}
  function localXp(){var n=Number(window.myXP);return isFinite(n)?Math.max(0,Math.round(n)):0;}
  function applyXp(value){var n=Math.max(0,Math.round(Number(value)||0));window.myXP=n;try{if(typeof myXP!=='undefined')myXP=n;}catch(e){}try{localStorage.setItem('fam_myxp_v1',String(n));}catch(e){}try{window.dispatchEvent(new CustomEvent('familyapp:progression-updated',{detail:{uid:uid(),xp:n}}));}catch(e){}}
  function attach(){var d=db(),me=uid(),family=hid();if(!d||!me||!family)return false;if(ref&&lastUid===me&&lastHid===family)return true;if(ref)try{ref.off();}catch(e){}lastUid=me;lastHid=family;ref=d.ref('families/'+family+'/members/'+me+'/xp');ref.on('value',function(s){var v=s.val();if(v===null||v===undefined){ref.set(localXp());return;}applyXp(v);});return true;}
  function bridgeAward(){if(bridged)return true;if(typeof window.awardXP!=='function')return false;baseAward=window.awardXP;window.awardXP=function(amount,reason){var delta=Math.max(0,Math.round(Number(amount)||0)),result=baseAward.apply(this,arguments);var d=db(),me=uid(),family=hid();if(delta&&d&&me&&family){d.ref('families/'+family+'/members/'+me+'/xp').set(firebase.database.ServerValue.increment(delta));}return result;};window.awardXP.__uidProgression=true;bridged=true;return true;}
  function rewardXp(task){if(!task)return 4;var n=Number(task.rewardXp||task.xpAmount);if(isFinite(n)&&n>0)return Math.round(n);var m=String(task.xpReward||task.xp||'').match(/(\d+)/);return m?Math.max(1,parseInt(m[1],10)):4;}
  function boot(){attach();bridgeAward();}
  window.ProgressionUidBridge={start:function(){boot();return !!ref;},xp:localXp,rewardXp:rewardXp,status:function(){return{uid:uid(),householdId:hid(),xp:localXp(),attached:!!ref,awardBridged:bridged};}};
  window.addEventListener('familyapp:household-identity-synced',boot);window.addEventListener('familyapp:household-changed',boot);window.addEventListener('load',boot);var n=0,t=setInterval(function(){n++;boot();if(n>120&&ref&&bridged)clearInterval(t);},250);setTimeout(boot,0);
})();
