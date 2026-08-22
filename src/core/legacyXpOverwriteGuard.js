'use strict';
// ============================================================
// LEGACY SHARED SYNC GUARD v2.0
// Keeps legacy sync away from UID-private progression. Event-driven only.
// ============================================================
(function(){
  if(window.__legacyXpOverwriteGuardV2)return;window.__legacyXpOverwriteGuardV2=true;
  var timer=null,installed=false;
  function uid(){try{return (window.fbUser||(window.firebase&&firebase.auth&&firebase.auth().currentUser)||{}).uid||null;}catch(e){return null;}}
  function arrToObj(arr){var out={};(arr||[]).forEach(function(item,i){if(item)out[(item.id!==undefined?'id_'+item.id:'i_'+i)]=item;});return out;}
  function install(){
    if(installed)return true;if(typeof window.syncToFirebase!=='function')return false;
    window.syncToFirebase=function(){
      if(!window.fbDb||!window.fbFamilyId||window.offlineMode)return;clearTimeout(timer);
      timer=setTimeout(function(){var updatePayload={shop:arrToObj(window.shopData),cal:arrToObj(window.calData),recurData:arrToObj(window.recurData)};window.fbDb.ref('families/'+window.fbFamilyId).update(updatePayload);var me=uid();if(me)window.fbDb.ref('families/'+window.fbFamilyId+'/members/'+me).update({name:window.myName||'Gezinslid',lastSeen:Date.now()});},800);
    };
    window.syncToFirebase.__sharedTasksOwnTasks=true;window.syncToFirebase.__xpGuarded=true;installed=true;return true;
  }
  window.LegacyXpOverwriteGuard={version:'2.0.0',install:install};
  window.addEventListener('familyapp:auth-ready',install);window.addEventListener('familyapp:household-identity-synced',install);window.addEventListener('load',install,{once:true});
  if(document.readyState==='complete')install();else Promise.resolve().then(install);
})();
