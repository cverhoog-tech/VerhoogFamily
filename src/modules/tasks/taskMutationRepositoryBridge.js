'use strict';
// ============================================================
// TASK MUTATION REPOSITORY BRIDGE v0.334
// Small compatibility layer: keeps legacy task UI intact while ensuring
// core task mutations persist through TaskRepositoryAdapter.
// ============================================================

(function(){
  var VERSION = '0.334';
  var wrapped = false;

  function persist(operation, id){
    if(window.TaskRepositoryAdapter && typeof window.TaskRepositoryAdapter.persistGlobals === 'function'){
      window.TaskRepositoryAdapter.persistGlobals({
        operation: operation || 'taskMutation',
        id: id || null,
        source: 'taskMutationRepositoryBridge',
        version: VERSION
      });
    }
  }

  function wrap(){
    if(wrapped) return;
    if(typeof window.toggleTask !== 'function' || typeof window.deleteTask !== 'function') return;

    var originalToggleTask = window.toggleTask;
    var originalDeleteTask = window.deleteTask;

    window.toggleTask = function(id){
      var result = originalToggleTask.apply(this, arguments);
      persist('toggleTask', id);
      return result;
    };

    window.deleteTask = function(id){
      var result = originalDeleteTask.apply(this, arguments);
      persist('deleteTask', id);
      return result;
    };

    wrapped = true;
    try {
      window.dispatchEvent(new CustomEvent('familyapp:tasks-mutation-bridge-ready', {
        detail: { version: VERSION }
      }));
    } catch(error) {}
  }

  function boot(){
    wrap();
    [100, 300, 800, 1500].forEach(function(delay){ setTimeout(wrap, delay); });
  }

  window.TaskMutationRepositoryBridge = {
    version: VERSION,
    boot: boot,
    persist: persist
  };

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
