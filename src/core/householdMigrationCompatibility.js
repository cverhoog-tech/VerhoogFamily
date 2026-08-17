'use strict';
// Explicit migration-only compatibility boundary for pre-HouseholdPlatform families.
// It never decides modern household membership and never weakens the hardened loader.
(function(){
  if(window.__householdMigrationCompatibilityV1) return;
  window.__householdMigrationCompatibilityV1=true;

  var hardenedLoad=window.loadUserFamily;
  if(typeof hardenedLoad!=='function') return;

  function db(){
    try{return window.fbDb||(window.firebase&&window.firebase.database&&window.firebase.database())||null;}catch(e){return null;}
  }
  function currentUser(){
    try{return window.fbUser||(window.fbAuth&&window.fbAuth.currentUser)||(window.firebase&&window.firebase.auth&&window.firebase.auth().currentUser)||null;}catch(e){return null;}
  }

  function guardedLoad(){
    var d=db(),u=currentUser();
    if(!d||!u) return Promise.reject(new Error('Niet ingelogd'));

    return d.ref('users/'+u.uid).once('value').then(function(userSnap){
      var data=userSnap.val()||{};
      var householdId=data.activeHouseholdId||data.familyId;

      // No pointer: keep canonical hardened behavior unchanged.
      if(!householdId) return hardenedLoad();

      return d.ref('families/'+householdId+'/meta').once('value').then(function(metaSnap){
        // Only genuinely pre-platform households may invoke the migration resolver.
        // Modern households, including removed/inactive members, always continue
        // through HouseholdSessionHardening's membership checks.
        if(!metaSnap.exists()&&window.FamilyHousehold&&typeof window.FamilyHousehold.resolve==='function'){
          return window.FamilyHousehold.resolve();
        }
        return hardenedLoad();
      });
    });
  }

  // Same explicit contract as HouseholdSessionHardening's strictLoad: this
  // wrapper is a deliberate, known member of the loadUserFamily ownership
  // chain, not a second bootstrap owner. It only adds a one-time legacy ->
  // HouseholdPlatform migration fallback around the hardened loader; it never
  // decides membership itself and never performs render/reveal.
  guardedLoad.__familyHouseholdLoadOwner=true;
  guardedLoad.__householdHardening=true;
  guardedLoad.__migrationCompatibility=true;
  window.loadUserFamily=guardedLoad;
  try{loadUserFamily=guardedLoad;}catch(e){}

  window.HouseholdMigrationCompatibility={version:'1.0.0'};
})();
