'use strict';
// ============================================================
// CANONICAL LEGACY SYNC GUARD v2.0.0
// STEP 3 + STEP 6 boundary: the legacy family-root sync may continue to serve
// modules that have not migrated yet, but it must never read/write state that
// already has a canonical household repository.
//
// Canonical owners fenced here:
// - TaskHouseholdRepository -> taskData
// - CalendarEventHouseholdRepository -> calData
//
// Remaining legacy family-root ownership is intentionally limited to modules
// that have not yet crossed their rebuild gate (currently shop + recurData).
// ============================================================
(function(){
  if(window.__canonicalLegacySyncGuardV2)return;
  window.__canonicalLegacySyncGuardV2=true;

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

      // Deliberately no taskData/calData reads here.
      // STEP 3 and STEP 6 canonical repositories own those projections.
      if(data.shop&&toArray(data.shop).length)window.shopData=toArray(data.shop);
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
  window.startFirebaseSync.__canonicalRepositoryGuard=true;

  window.syncToFirebase=function(){
    if(!window.fbDb||!window.fbFamilyId||window.offlineMode)return;
    clearTimeout(window._syncTimer);
    window._syncTimer=setTimeout(function(){
      var currentUid=window.fbUser&&window.fbUser.uid||'anon';
      var payload={
        shop:toObject(window.shopData),
        recurData:toObject(window.recurData)
      };
      // Deliberately no tasks/cal payload. Canonical repositories own them.
      window.fbDb.ref('families/'+window.fbFamilyId).update(payload);
      window.fbDb.ref('families/'+window.fbFamilyId+'/members/'+currentUid).update({xp:Number(window.myXP||0),name:window.myName||'Gezinslid',lastSeen:Date.now()});
    },800);
  };
  window.syncToFirebase.__canonicalRepositoryGuard=true;
})();
