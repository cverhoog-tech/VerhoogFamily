'use strict';
// ============================================================
// TASK REPOSITORY ADAPTER v0.334
// Compatibility bridge between legacy global taskData/AppState and
// HouseholdRepository. This lets us migrate persistence without rewriting
// the entire task UI at once.
// v0.334: saveTasks now syncs window.taskData immediately after save so
// legacy renderTasks sees newly created quests.
// ============================================================

(function(){
  var VERSION = '0.334';
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

  function writeGlobals(tasks){
    var nextTasks = Array.isArray(tasks) ? tasks : [];
    if(Array.isArray(window.taskData)){
      window.taskData.length = 0;
      nextTasks.forEach(function(task){ window.taskData.push(task); });
    } else {
      window.taskData = nextTasks.slice();
    }
    return window.taskData;
  }

  function emitTasksUpdated(tasks, meta){
    try {
      window.dispatchEvent(new CustomEvent('familyapp:tasks-updated', {
        detail: Object.assign({ tasks: tasks || [] }, meta || {})
      }));
    } catch(error) {}
  }

  function saveTasks(tasks, meta){
    var nextTasks = Array.isArray(tasks) ? tasks : [];
    var saved = nextTasks;
    if(repoReady()) saved = window.HouseholdRepository.saveTasks(nextTasks, meta || { source: 'TaskRepositoryAdapter' }) || nextTasks;
    else localStorage.setItem('fam_tasks_v023', JSON.stringify(nextTasks));

    if(!Array.isArray(saved)) saved = nextTasks;
    writeGlobals(saved);
    try { localStorage.setItem('fam_tasks_v023', JSON.stringify(saved)); } catch(error) {}
    emitTasksUpdated(saved, Object.assign({ source:'TaskRepositoryAdapter', version: VERSION }, meta || {}));
    return saved;
  }

  function syncGlobalsFromRepository(){
    var tasks = listTasks();
    writeGlobals(tasks);
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
