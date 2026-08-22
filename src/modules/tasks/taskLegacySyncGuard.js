'use strict';
// ============================================================
// TASK LEGACY SYNC GUARD v1.0.0
// STEP 3 boundary: the legacy family-root sync may continue to serve modules
// that have not migrated yet, but it must never read/write taskData.
// TaskHouseholdRepository exclusively owns task persistence + task projection.
// ============================================================
(function(){
  if(window.__taskLegacySyncGuardV1)return;
  window.__taskLegacySyncGuardV1=true;

  function toArray(value){
    if(typeof window.objToArr==='function')return window.objToArr(value);
    if(Array.isArray(value))return value;
    if(!value)return [];
    return Object.keys(value).map(function(key){return value[key];});
  }
  function toObject(value){
    if(typeof window.arrToObj==='function')return window.arrToObj(value);
    var out={};
    (Array.isArray(value)?value:[]).forEach(function(item,index){
      if(!item)return;
      out[item.id!==undefined?'id_'+item.id:'i_'+index]=item;
    });
    return out;
  }

  window.startFirebaseSync=function(){
    if(!window.fbDb||!window.fbFamilyId||window.offlineMode||window._fbSyncActive)return;
    window._fbSyncActive=true;
    window._fbSyncRef=window.fbDb.ref('families/'+window.fbFamilyId);
    window._fbSyncHandler=function(snapshot){
      var data=snapshot&&snapshot.val?snapshot.val():null;
      if(!data)return;

      // Deliberately no taskData read here. STEP 3 repository owns tasks.
      if(data.shop&&toArray(data.shop).length)window.shopData=toArray(data.shop);
      if(data.cal&&toArray(data.cal).length)window.calData=toArray(data.cal);
      if(data.recurData&&toArray(data.recurData).length)window.recurData=toArray(data.recurData);
      if(data.members){
        Object.keys(data.members).forEach(function(key){
          var member=data.members[key];
          if(!member)return;
          if(member.name!==window.myName){window.partnerName=member.name;window.partnerXPStore=member.xp||0;}
          else window.myXP=member.xp||window.myXP;
        });
      }
      try{if(typeof window._renderScreen==='function')window._renderScreen(window._currentScreen);}catch(e){}
      try{if(typeof window.updateHomeXP==='function')window.updateHomeXP();}catch(e){}
    };
    window._fbSyncRef.on('value',window._fbSyncHandler);
    if(window.AuthenticatedSessionController&&typeof window.AuthenticatedSessionController.addCleanup==='function'&&typeof window.stopFirebaseSync==='function'){
      window.AuthenticatedSessionController.addCleanup(window.stopFirebaseSync);
    }
  };
  window.startFirebaseSync.__taskRepositoryGuard=true;

  window.syncToFirebase=function(){
    if(!window.fbDb||!window.fbFamilyId||window.offlineMode)return;
    clearTimeout(window._syncTimer);
    window._syncTimer=setTimeout(function(){
      var currentUid=window.fbUser&&window.fbUser.uid||'anon';
      var payload={
        shop:toObject(window.shopData),
        cal:toObject(window.calData),
        recurData:toObject(window.recurData)
      };
      // Deliberately no tasks payload. STEP 3 repository owns tasks.
      window.fbDb.ref('families/'+window.fbFamilyId).update(payload);
      window.fbDb.ref('families/'+window.fbFamilyId+'/members/'+currentUid).update({xp:Number(window.myXP||0),name:window.myName||'Gezinslid',lastSeen:Date.now()});
    },800);
  };
  window.syncToFirebase.__taskRepositoryGuard=true;
})();
