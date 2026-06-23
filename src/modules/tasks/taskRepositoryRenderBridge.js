'use strict';
// ============================================================
// TASK REPOSITORY RENDER BRIDGE v0.336
// Converts repository events into safe debounced UI refreshes.
// This prepares the app for realtime sync without creating render loops.
// ============================================================

(function(){
  var VERSION = '0.336';
  var timer = null;
  var lastReason = '';

  function isTasksVisible(){
    var screen = document.getElementById('screen-tasks');
    return !!(screen && screen.classList.contains('active'));
  }

  function refresh(reason){
    lastReason = reason || 'repository-update';
    if(timer) clearTimeout(timer);
    timer = setTimeout(function(){
      timer = null;
      try {
        if(window.TaskRepositoryAdapter && typeof window.TaskRepositoryAdapter.syncGlobalsFromRepository === 'function') {
          window.TaskRepositoryAdapter.syncGlobalsFromRepository();
        }
        if(window.RecurringTaskRepositoryBridge && typeof window.RecurringTaskRepositoryBridge.hydrateFromRepository === 'function') {
          window.RecurringTaskRepositoryBridge.hydrateFromRepository();
        }
        if(isTasksVisible() && typeof window.renderTasks === 'function') window.renderTasks();
        if(typeof window.updateStats === 'function') window.updateStats();
        window.dispatchEvent(new CustomEvent('familyapp:tasks-render-bridge-refreshed', {
          detail: { version: VERSION, reason: lastReason }
        }));
      } catch(error) {
        console.warn('[TaskRepositoryRenderBridge] refresh failed', error);
      }
    }, 80);
  }

  function boot(){
    window.addEventListener('familyapp:tasks-updated', function(){ refresh('tasks-updated'); });
    window.addEventListener('familyapp:recurring-tasks-updated', function(){ refresh('recurring-tasks-updated'); });
    window.addEventListener('familyapp:repo:tasks', function(){ refresh('repo-tasks'); });
    window.addEventListener('familyapp:repo:recurringTasks', function(){ refresh('repo-recurringTasks'); });
    window.TaskRepositoryRenderBridge = { version: VERSION, refresh: refresh };
    try { window.dispatchEvent(new CustomEvent('familyapp:tasks-render-bridge-ready', { detail: { version: VERSION } })); } catch(error) {}
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
