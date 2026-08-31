'use strict';
// ============================================================
// CLEANING HOUSEHOLD REPOSITORY CONTRACT v0.1.0
// Contract only. No Firebase reads/writes/listeners are started here.
// ============================================================
(function(){
  if(window.CleaningRepositoryContract)return;

  var VERSION='0.1.0';

  var COLLECTIONS=Object.freeze([
    'rooms',
    'routines',
    'supplies',
    'inventory',
    'plans',
    'occurrences',
    'approvals',
    'completionLogs',
    'availability',
    'preferences'
  ]);

  var REQUIRED_API=Object.freeze([
    'bind',
    'unbind',
    'subscribe',
    'snapshot',
    'createRoom',
    'updateRoom',
    'removeRoom',
    'createRoutineItem',
    'updateRoutineItem',
    'removeRoutineItem',
    'createOccurrence',
    'updateOccurrence',
    'getOccurrence',
    'setUserPreferences'
  ]);

  var INVARIANTS=Object.freeze([
    'HouseholdContext is the only identity/household authority.',
    'All canonical cleaning data lives below families/{householdId}/cleaning.',
    'CleaningOccurrence is the source of truth for one concrete clean.',
    'Task and Calendar records are projections referenced by occurrence.projections.',
    'Repository listeners must bind/unbind on HouseholdContext revision changes.',
    'LocalStorage may only be used as disposable household+uid scoped read cache.',
    'Writes must preserve household isolation and immutable creation metadata.',
    'Retryable mutations must be idempotent.',
    'No UI module may write Firebase cleaning paths directly.'
  ]);

  function validateImplementation(candidate){
    var missing=[];
    var repo=candidate||{};
    REQUIRED_API.forEach(function(name){
      if(typeof repo[name]!=='function')missing.push(name);
    });
    return Object.freeze({
      valid:missing.length===0,
      missing:Object.freeze(missing.slice())
    });
  }

  window.CleaningRepositoryContract=Object.freeze({
    version:VERSION,
    collections:COLLECTIONS,
    requiredApi:REQUIRED_API,
    invariants:INVARIANTS,
    validateImplementation:validateImplementation
  });
})();
