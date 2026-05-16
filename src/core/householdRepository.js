'use strict';
// ============================================================
// HOUSEHOLD REPOSITORY v0.330
// Shared persistence boundary for local prototype and future backend sync.
// Feature modules should gradually move through this layer instead of
// direct localStorage access.
// ============================================================

(function(){
  var VERSION = '0.330';
  var PREFIX = 'familyapp_repo_';
  var META_KEY = PREFIX + 'meta_v001';
  var listeners = {};

  var COLLECTIONS = {
    household: 'household',
    members: 'members',
    groupQuests: 'groupQuests',
    tasks: 'tasks',
    progression: 'progression',
    activity: 'activity',
    abilities: 'abilities',
    titles: 'titles',
    recipes: 'recipes',
    meals: 'meals',
    groceries: 'groceries',
    notes: 'notes'
  };

  var LEGACY_KEYS = {
    groupQuests: ['fam_group_quests_v001', 'groupQuests', 'family_group_quests'],
    members: ['familyapp_household_members_v001', 'fam_group_quest_members_v001', 'fam_members', 'family_members'],
    tasks: ['fam_tasks_v023', 'fam_tasks_v022', 'fam_tasks_v021', 'fam_tasks', 'tasks'],
    recipes: ['fam_recipes', 'recipes'],
    meals: ['fam_meals', 'meals'],
    groceries: ['fam_groceries', 'groceries'],
    notes: ['fam_notes', 'notes']
  };

  function nowIso(){ return new Date().toISOString(); }
  function key(collection){ return PREFIX + collection + '_v001'; }

  function safeParse(raw, fallback){
    try { return raw ? JSON.parse(raw) : fallback; }
    catch(e){ return fallback; }
  }

  function emit(channel, payload){
    (listeners[channel] || []).forEach(function(fn){
      try { fn(payload); } catch(e){ console.warn('[HouseholdRepository] listener failed', channel, e); }
    });
    (listeners['*'] || []).forEach(function(fn){
      try { fn({ channel: channel, payload: payload }); } catch(e){}
    });
    try { window.dispatchEvent(new CustomEvent('familyapp:repo:' + channel, { detail: payload })); } catch(e) {}
  }

  function on(channel, callback){
    if(!listeners[channel]) listeners[channel] = [];
    listeners[channel].push(callback);
    return function(){ listeners[channel] = (listeners[channel] || []).filter(function(fn){ return fn !== callback; }); };
  }

  function getMeta(){
    return safeParse(localStorage.getItem(META_KEY), {
      version: VERSION,
      mode: 'local',
      backendProvider: null,
      householdId: 'household-local',
      createdAt: nowIso(),
      updatedAt: nowIso(),
      lastSyncAt: null
    });
  }

  function saveMeta(meta){
    var next = Object.assign({}, getMeta(), meta || {}, { version: VERSION, updatedAt: nowIso() });
    localStorage.setItem(META_KEY, JSON.stringify(next));
    emit('meta', next);
    return next;
  }

  function readLegacy(collection){
    var keys = LEGACY_KEYS[collection] || [];
    for(var i=0;i<keys.length;i++){
      var value = safeParse(localStorage.getItem(keys[i]), null);
      if(value && (Array.isArray(value) ? value.length : true)) return value;
    }
    return null;
  }

  function read(collection, fallback){
    var stored = safeParse(localStorage.getItem(key(collection)), null);
    if(stored !== null) return stored;
    var legacy = readLegacy(collection);
    if(legacy !== null){
      write(collection, legacy, { silent: true, migratedFromLegacy: true });
      return legacy;
    }
    return fallback !== undefined ? fallback : [];
  }

  function write(collection, value, options){
    var payload = {
      collection: collection,
      value: value,
      mode: getMeta().mode,
      at: nowIso(),
      migratedFromLegacy: !!(options && options.migratedFromLegacy)
    };
    localStorage.setItem(key(collection), JSON.stringify(value));
    saveMeta({ lastWriteAt: payload.at });
    if(!options || !options.silent) emit('write', payload);
    if(!options || !options.silent) emit(collection, payload);
    return value;
  }

  function patch(collection, updater, fallback){
    var current = read(collection, fallback || []);
    var next = updater ? updater(Array.isArray(current) ? current.slice() : Object.assign({}, current)) : current;
    return write(collection, next);
  }

  function listTasks(){
    return read(COLLECTIONS.tasks, []);
  }

  function saveTasks(tasks, options){
    var next = Array.isArray(tasks) ? tasks : [];
    write(COLLECTIONS.tasks, next, options || {});
    try { window.dispatchEvent(new CustomEvent('familyapp:tasks-updated', { detail: { tasks: next } })); } catch(e) {}
    return next;
  }

  function getTaskId(task){
    return Array.isArray(task) ? task[0] : task && task.id;
  }

  function upsertTask(task){
    var tasks = listTasks();
    var id = getTaskId(task) || ('task-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7));
    if(Array.isArray(task)) task[0] = id;
    else task = Object.assign({}, task || {}, { id: id });

    var index = tasks.findIndex(function(item){ return getTaskId(item) === id; });
    if(index >= 0) tasks[index] = task;
    else tasks.push(task);
    saveTasks(tasks, { operation: 'upsertTask', id: id });
    return task;
  }

  function removeTask(id){
    var tasks = listTasks().filter(function(task){ return getTaskId(task) !== id; });
    saveTasks(tasks, { operation: 'removeTask', id: id });
    return true;
  }

  function appendActivity(event){
    var activity = read(COLLECTIONS.activity, []);
    var item = Object.assign({ id: 'act-' + Date.now(), at: nowIso() }, event || {});
    activity.unshift(item);
    write(COLLECTIONS.activity, activity.slice(0, 100));
    return item;
  }

  function exportSnapshot(){
    var data = { meta: getMeta(), exportedAt: nowIso(), collections: {} };
    Object.keys(COLLECTIONS).forEach(function(name){
      data.collections[name] = read(COLLECTIONS[name], name === 'household' ? {} : []);
    });
    return data;
  }

  function importSnapshot(snapshot){
    if(!snapshot || !snapshot.collections) return false;
    Object.keys(snapshot.collections).forEach(function(name){
      write(name, snapshot.collections[name], { silent: true });
    });
    saveMeta(Object.assign({}, snapshot.meta || {}, { importedAt: nowIso() }));
    emit('import', exportSnapshot());
    return true;
  }

  function backendStatus(){
    var supabaseStatus = window.SupabaseAdapter && window.SupabaseAdapter.status ? window.SupabaseAdapter.status() : null;
    return {
      provider: getMeta().backendProvider,
      mode: getMeta().mode,
      connected: !!(supabaseStatus && supabaseStatus.connected),
      realtime: !!(supabaseStatus && supabaseStatus.realtime),
      supabase: supabaseStatus,
      reason: supabaseStatus ? null : 'Backend adapter not connected yet'
    };
  }

  window.HouseholdRepository = {
    version: VERSION,
    collections: COLLECTIONS,
    getMeta: getMeta,
    saveMeta: saveMeta,
    read: read,
    write: write,
    patch: patch,
    on: on,
    emit: emit,
    listTasks: listTasks,
    saveTasks: saveTasks,
    upsertTask: upsertTask,
    removeTask: removeTask,
    appendActivity: appendActivity,
    exportSnapshot: exportSnapshot,
    importSnapshot: importSnapshot,
    backendStatus: backendStatus
  };
})();
