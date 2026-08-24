'use strict';
// ============================================================
// HOUSEHOLD ONBOARDING BRIDGE v1.0.0
// Deterministically connects legacy auth entrypoints to FamilyHousehold before
// AuthenticatedSessionController starts. This removes load-order races and
// turns stale/inaccessible household pointers into explicit re-onboarding.
// ============================================================
(function(){
  if(window.__familyHouseholdOnboardingBridgeV1)return;
  window.__familyHouseholdOnboardingBridgeV1=true;

  var platform=window.FamilyHousehold;
  if(!platform||typeof platform.resolve!=='function'){
    console.error('[HouseholdOnboardingBridge] FamilyHousehold is niet beschikbaar');
    return;
  }

  function accessError(error){
    var code=String(error&&(error.code||error.name)||'');
    var message=String(error&&error.message||'');
    return /PERMISSION_DENIED|permission denied/i.test(code+' '+message);
  }

  function normalizeResolveError(error){
    if(!accessError(error))return error;
    var normalized=new Error('HOUSEHOLD_ACCESS_REQUIRED');
    normalized.originalError=error;
    return normalized;
  }

  function resolveHousehold(){
    return Promise.resolve().then(function(){return platform.resolve();}).catch(function(error){
      throw normalizeResolveError(error);
    });
  }
  resolveHousehold.__householdV1=true;

  function createHousehold(name){
    var clean=String(name||'').trim();
    return platform.create(clean?{name:clean+' Family'}:{});
  }
  createHousehold.__householdV1=true;

  function showHouseholdOnboarding(){
    return platform.showOnboarding();
  }
  showHouseholdOnboarding.__householdV1=true;

  window.loadUserFamily=resolveHousehold;
  window.setupNewFamily=createHousehold;
  window.showNameSetupStep=showHouseholdOnboarding;
  try{loadUserFamily=resolveHousehold;}catch(e){}
  try{setupNewFamily=createHousehold;}catch(e){}
  try{showNameSetupStep=showHouseholdOnboarding;}catch(e){}
})();
