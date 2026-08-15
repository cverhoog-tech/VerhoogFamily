'use strict';
// Explicit compatibility boundary for pre-HouseholdPlatform families.
(function(){
  if(window.__householdLegacyMigrationGuardV1) return;
  window.__householdLegacyMigrationGuardV1=true;

  var hardenedLoad=window.loadUserFamily;
  if(typeof hardenedLoad!=='function') return;

  function db(){try{return window.fbDb||(window.firebase&&firebase.database&&firebase.database())||null;}catch(e){return null;}}
  function user(){try{return window.fbUser||(window.fbAuth&&fbAuth.currentUser)||(window.firebase&&firebase.auth&&firebase.auth().currentUser)||null;}catch(e){return null;}}

  function guardedLoad(){
    var d=db(),u=user();
    if(!d||!u) return Promise.reject(new Error('Niet ingelogd'));
    return d.ref('users/'+u.uid).once('value').then(function(snap){
      var data=snap.val()||{},hid=data.activeHouseholdId||data.familyId;
      if(!hid) return hardenedLoad();
      return d.ref('families/'+hid+'/meta').once('value').then(function(metaSnap){
        // Only genuinely pre-platform households may invoke HouseholdPlatform's
        // migration resolver. A modern household with a missing/removed member
        // still goes through the hardened active-membership gate.
        if(!metaSnap.exists() && window.FamilyHousehold && typeof FamilyHousehold.resolve==='function'){
          return FamilyHousehold.resolve();
        }
        return hardenedLoad();
      });
    });
  }

  guardedLoad.__householdV1=true;
  guardedLoad.__householdHardening=true;
  guardedLoad.__legacyMigrationGuard=true;
  window.loadUserFamily=guardedLoad;
  try{loadUserFamily=guardedLoad;}catch(e){}
})();
