'use strict';
// ============================================================
// CANONICAL LEGACY SYNC GUARD v3.1.0
// STEP 3 + STEP 6 + STEP 7 boundary: migrated modules must never be read or
// written by the old family-root compatibility sync.
//
// Canonical owners fenced here:
// - TaskHouseholdRepository -> taskData
// - CalendarEventHouseholdRepository -> calData
// - ShoppingListHouseholdRepository -> shopping lists / shopData
//
// Remaining legacy family-root ownership is intentionally limited to recurData.
// Crucially, unrelated family-root snapshots must NOT rebuild the active screen:
// a shopping write also changes the family root and used to flash Home/Shopping.
// ============================================================
(function(){
  if(window.__canonicalLegacySyncGuardV31)return;
  window.__canonicalLegacySyncGuardV31=true;

  var lastRecurSignature=null;
  var lastMemberSignature=null;

  function toArray(value){if(typeof window.objToArr==='function')return window.objToArr(value);if(Array.isArray(value))return value;if(!value)return[];return Object.keys(value).map(function(key){return value[key];});}
  function toObject(value){if(typeof window.arrToObj==='function')return window.arrToObj(value);var out={};(Array.isArray(value)?value:[]).forEach(function(item,index){if(!item)return;out[item.id!==undefined?'id_'+item.id:'i_'+index]=item;});return out;}
  function signature(value){try{return JSON.stringify(value||null);}catch(e){return String(value||'');}}

  function projectRecurring(data){
    var incoming=data&&data.recurData?data.recurData:null;
    var nextSignature=signature(incoming);
    if(nextSignature===lastRecurSignature)return false;
    lastRecurSignature=nextSignature;
    if(incoming)window.recurData=toArray(incoming);else window.recurData=[];
    try{window.dispatchEvent(new CustomEvent('familyapp:legacy-recur-updated',{detail:{count:window.recurData.length}}));}catch(e){}
    // recurData only belongs to the Tasks surface. Never rebuild Home, Shopping,
    // Agenda, Recipes, etc. because an unrelated family child changed.
    if(window._currentScreen==='tasks'){
      try{if(typeof window._renderScreen==='function')window._renderScreen('tasks');}catch(e){}
    }
    return true;
  }

  function projectMembers(data){
    var incoming=data&&data.members?data.members:null;
    var nextSignature=signature(incoming);
    if(nextSignature===lastMemberSignature)return false;
    lastMemberSignature=nextSignature;
    if(incoming){Object.keys(incoming).forEach(function(key){var member=incoming[key];if(!member)return;if(member.name!==window.myName){window.partnerName=member.name;window.partnerXPStore=member.xp||0;}else window.myXP=member.xp||window.myXP;});}
    try{if(typeof window.updateHomeXP==='function')window.updateHomeXP();}catch(e){}
    return true;
  }

  window.startFirebaseSync=function(){
    if(!window.fbDb||!window.fbFamilyId||window.offlineMode||window._fbSyncActive)return;
    window._fbSyncActive=true;window._fbSyncRef=window.fbDb.ref('families/'+window.fbFamilyId);
    window._fbSyncHandler=function(snapshot){
      var data=snapshot&&snapshot.val?snapshot.val():null;if(!data)return;
      // Deliberately no taskData, calData or shopData reads here.
      projectRecurring(data);
      projectMembers(data);
    };
    window._fbSyncRef.on('value',window._fbSyncHandler);
    if(window.AuthenticatedSessionController&&typeof window.AuthenticatedSessionController.addCleanup==='function'&&typeof window.stopFirebaseSync==='function')window.AuthenticatedSessionController.addCleanup(window.stopFirebaseSync);
  };
  window.startFirebaseSync.__canonicalRepositoryGuard=true;

  window.syncToFirebase=function(){
    if(!window.fbDb||!window.fbFamilyId||window.offlineMode)return;
    clearTimeout(window._syncTimer);window._syncTimer=setTimeout(function(){var currentUid=window.fbUser&&window.fbUser.uid||'anon';var payload={recurData:toObject(window.recurData)};
      // Deliberately no tasks/cal/shop payload. Canonical repositories own them.
      window.fbDb.ref('families/'+window.fbFamilyId).update(payload);
      window.fbDb.ref('families/'+window.fbFamilyId+'/members/'+currentUid).update({xp:Number(window.myXP||0),name:window.myName||'Gezinslid',lastSeen:Date.now()});
    },800);
  };
  window.syncToFirebase.__canonicalRepositoryGuard=true;
})();
