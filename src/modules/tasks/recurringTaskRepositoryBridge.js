'use strict';
// ============================================================
// RECURRING TASK REPOSITORY BRIDGE v0.335
// Persists legacy recurData through HouseholdRepository without rewriting
// the recurring task UI yet.
// ============================================================

(function(){
  var VERSION = '0.335';
  var COLLECTION = 'recurringTasks';
  var wrapped = false;

  function repoReady(){
    return !!(window.HouseholdRepository && typeof window.HouseholdRepository.write === 'function');
  }

  function persist(operation, id){
    var data = Array.isArray(window.recurData) ? window.recurData : [];
    if(repoReady()){
      window.HouseholdRepository.write(COLLECTION, data, {
        operation: operation || 'recurringTaskMutation',
        id: id || null,
        source: 'recurringTaskRepositoryBridge',
        version: VERSION
      });
    }
    try {
      window.dispatchEvent(new CustomEvent('familyapp:recurring-tasks-updated', {
        detail: { operation: operation || 'recurringTaskMutation', id: id || null, items: data }
      }));
    } catch(error) {}
  }

  function hydrateFromRepository(){
    if(!repoReady()) return;
    var stored = window.HouseholdRepository.read(COLLECTION, null);
    if(!Array.isArray(stored) || !stored.length) return;
    if(Array.isArray(window.recurData)){
      window.recurData.length = 0;
      stored.forEach(function(item){ window.recurData.push(item); });
    } else {
      window.recurData = stored;
    }
  }

  function wrap(){
    if(wrapped) return;
    if(typeof window.toggleRec !== 'function' || typeof window.toggleRecDay !== 'function' || typeof window.resetRec !== 'function') return;

    var originalToggleRec = window.toggleRec;
    var originalToggleRecDay = window.toggleRecDay;
    var originalResetRec = window.resetRec;

    window.toggleRec = function(id){
      var result = originalToggleRec.apply(this, arguments);
      persist('toggleRec', id);
      return result;
    };

    window.toggleRecDay = function(id, day){
      var result = originalToggleRecDay.apply(this, arguments);
      persist('toggleRecDay', id + ':' + day);
      return result;
    };

    window.resetRec = function(){
      var result = originalResetRec.apply(this, arguments);
      persist('resetRec', null);
      return result;
    };

    wrapped = true;
    try {
      window.dispatchEvent(new CustomEvent('familyapp:recurring-task-bridge-ready', { detail: { version: VERSION } }));
    } catch(error) {}
  }

  function boot(){
    hydrateFromRepository();
    wrap();
    [100, 300, 800, 1500].forEach(function(delay){
      setTimeout(function(){ hydrateFromRepository(); wrap(); }, delay);
    });
  }

  window.RecurringTaskRepositoryBridge = {
    version: VERSION,
    boot: boot,
    persist: persist,
    hydrateFromRepository: hydrateFromRepository
  };

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
