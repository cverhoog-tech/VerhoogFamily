'use strict';
// ============================================================
// LEGACY AUTHORITY RETIREMENT v1.0.1
// Runtime safety net for compatibility functions that still exist in legacy
// source files. Migrated domains may no longer write through family-root sync.
// Recurrence compatibility is intentionally left to its owning legacy path
// until that domain is migrated explicitly.
// ============================================================
(function(){
  if(window.LegacyAuthorityRetirement)return;
  var VERSION='1.0.1';
  function hc(){return window.HouseholdContext||null;}
  function token(){try{var c=hc(),cur=c&&c.current?c.current():null;return cur&&cur.uid&&cur.householdId?{uid:cur.uid,householdId:cur.householdId}:null;}catch(e){return null;}}
  function retireRootRead(){
    // Canonical stores now own tasks, shopping, calendar, finance, feed and progression.
    // Any previously attached family-root listener must be detached to prevent stale
    // legacy snapshots from overwriting those projections.
    try{if(window.HouseholdSessionHardening&&window.HouseholdSessionHardening.stopFirebaseSync)window.HouseholdSessionHardening.stopFirebaseSync();}catch(e){}
    var retired=function(){return false;};
    retired.__legacyAuthorityRetired=true;
    window.startFirebaseSync=retired;
    try{startFirebaseSync=retired;}catch(e){}
  }
  function retireRootWrite(){
    // Legacy callers can still invoke this symbol, but migrated domain writes must
    // go through their canonical services. A no-op is safer than replaying global
    // arrays to /families/{id}.
    var retired=function(){return false;};
    retired.__legacyAuthorityRetired=true;
    window.syncToFirebase=retired;
    try{syncToFirebase=retired;}catch(e){}
  }
  function clearGlobalIdentityKeys(){
    var t=token();if(!t)return;
    // UID-scoped profile-v2 mirrors remain allowed. Global v1 identity keys are
    // removed after HouseholdContext is ready so a later account cannot inherit them.
    try{
      localStorage.removeItem('familyapp-profile-name-v1');
      localStorage.removeItem('familyapp-partner-name-v1');
      localStorage.removeItem('familyapp-current-user-avatar-v1');
      localStorage.removeItem('familyapp-current-user-avatar-id-v1');
    }catch(e){}
  }
  function install(){retireRootRead();retireRootWrite();clearGlobalIdentityKeys();return true;}
  ['familyapp:household-context-changed','familyapp:household-identity-synced','familyapp:session:household-resolved'].forEach(function(ev){window.addEventListener(ev,install);});
  window.LegacyAuthorityRetirement={version:VERSION,install:install,status:function(){return{version:VERSION,context:token(),rootReadRetired:!!(window.startFirebaseSync&&window.startFirebaseSync.__legacyAuthorityRetired),rootWriteRetired:!!(window.syncToFirebase&&window.syncToFirebase.__legacyAuthorityRetired)};}};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
