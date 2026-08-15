'use strict';
(function(){
  if(window.__legacyXpOverwriteGuardV1)return;
  window.__legacyXpOverwriteGuardV1=true;
  var timer=null;
  function uid(){try{return (window.fbUser||(window.firebase&&firebase.auth&&firebase.auth().currentUser)||{}).uid||null;}catch(e){return null;}}
  function arrToObj(arr){var out={};(arr||[]).forEach(function(item,i){if(item)out[(item.id!==undefined?'id_'+item.id:'i_'+i)]=item;});return out;}
  function install(){
    if(typeof window.syncToFirebase!=='function')return false;
    if(window.syncToFirebase.__xpGuarded)return true;
    window.syncToFirebase=function(){
      if(!window.fbDb||!window.fbFamilyId||window.offlineMode)return;
      clearTimeout(timer);
      timer=setTimeout(function(){
        var updatePayload={
          shop:arrToObj(window.shopData),
          cal:arrToObj(window.calData),
          recurData:arrToObj(window.recurData)
          // trans/savingsGoals/extraIncome/vasteLasten intentionally excluded
          // — owned exclusively by FinanceStore now.
          // feed intentionally excluded — owned exclusively by FeedSharedData
          // at shared/feedPosts now; this orphan families/{id}/feed path is
          // retired to stop it racing with the real Feed data.
        };
        window.fbDb.ref('families/'+window.fbFamilyId).update(updatePayload);
        var me=uid();
        if(me)window.fbDb.ref('families/'+window.fbFamilyId+'/members/'+me).update({name:window.myName||'Gezinslid',lastSeen:Date.now()});
      },800);
    };
    window.syncToFirebase.__sharedTasksOwnTasks=true;
    window.syncToFirebase.__xpGuarded=true;
    return true;
  }
  window.addEventListener('familyapp:household-identity-synced',install);
  window.addEventListener('load',install);
  var n=0,t=setInterval(function(){n++;if(install()||n>120)clearInterval(t);},250);
  setTimeout(install,0);
  window.LegacyXpOverwriteGuard={install:install};
})();
