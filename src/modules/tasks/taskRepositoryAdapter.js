'use strict';
// ============================================================
// TASK REPOSITORY ADAPTER v0.333
// Compatibility bridge between legacy global taskData/AppState and
// HouseholdRepository. This lets us migrate persistence without rewriting
// the entire task UI at once.
// ============================================================

(function(){
  var VERSION = '0.333';
  var LEGACY_TASK_KEYS = ['fam_tasks_v023', 'fam_tasks_v022', 'fam_tasks_v021', 'fam_tasks', 'tasks'];
  var booted = false;

  function safeParse(raw, fallback){
    try { return raw ? JSON.parse(raw) : fallback; }
    catch(error){ return fallback; }
  }

  function readLegacyTasks(){
    for(var i = 0; i < LEGACY_TASK_KEYS.length; i++){
      var value = safeParse(localStorage.getItem(LEGACY_TASK_KEYS[i]), null);
      if(Array.isArray(value)) return value;
    }
    return [];
  }

  function repoReady(){
    return !!(window.HouseholdRepository && typeof window.HouseholdRepository.listTasks === 'function');
  }

  function listTasks(){
    if(repoReady()){
      var repoTasks = window.HouseholdRepository.listTasks();
      if(Array.isArray(repoTasks) && repoTasks.length) return repoTasks;
    }
    return readLegacyTasks();
  }

  function saveTasks(tasks, meta){
    var nextTasks = Array.isArray(tasks) ? tasks : [];
    if(repoReady()) return window.HouseholdRepository.saveTasks(nextTasks, meta || { source: 'TaskRepositoryAdapter' });
    localStorage.setItem('fam_tasks_v023', JSON.stringify(nextTasks));
    try { window.dispatchEvent(new CustomEvent('familyapp:tasks-updated', { detail: { tasks: nextTasks } })); } catch(error) {}
    return nextTasks;
  }

  function syncGlobalsFromRepository(){
    var tasks = listTasks();
    if(Array.isArray(window.taskData)){
      window.taskData.length = 0;
      tasks.forEach(function(task){ window.taskData.push(task); });
    } else {
      window.taskData = tasks;
    }
    return window.taskData;
  }

  function persistGlobals(meta){
    return saveTasks(Array.isArray(window.taskData) ? window.taskData : [], meta || { operation: 'persistGlobals' });
  }

  function wrapAppStateSave(){
    if(!window.AppState || typeof window.AppState.save !== 'function' || window.AppState.__repoAdapterWrapped) return;
    var originalSave = window.AppState.save;
    window.AppState.save = function(){
      var result = originalSave.apply(this, arguments);
      persistGlobals({ operation: 'AppState.save', source: 'legacy-wrap' });
      return result;
    };
    window.AppState.__repoAdapterWrapped = true;
  }

  function boot(){
    if(booted) return;
    booted = true;
    syncGlobalsFromRepository();
    wrapAppStateSave();
    try { window.dispatchEvent(new CustomEvent('familyapp:tasks-adapter-ready', { detail: { version: VERSION } })); } catch(error) {}
  }

  window.TaskRepositoryAdapter = {
    version: VERSION,
    listTasks: listTasks,
    saveTasks: saveTasks,
    syncGlobalsFromRepository: syncGlobalsFromRepository,
    persistGlobals: persistGlobals,
    boot: boot
  };

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function(){ setTimeout(boot, 0); });
  else setTimeout(boot, 0);
})();
