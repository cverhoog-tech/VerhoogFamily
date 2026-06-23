'use strict';
// ============================================================
// LIVE SYNC ADAPTER v0.304
// Production-readiness foundation for future multi-user accounts.
// Current mode remains localStorage. Backend adapters can be plugged in
// later without rewriting every feature module.
// ============================================================

(function(){
  var VERSION = '0.304';
  var MODE_KEY = 'familyapp_sync_mode_v001';
  var HOUSEHOLD_KEY = 'familyapp_household_v001';
  var USER_KEY = 'familyapp_active_user_v001';
  var listeners = {};

  function nowIso(){ return new Date().toISOString(); }

  function safeParse(raw, fallback){
    try { return raw ? JSON.parse(raw) : fallback; }
    catch(e){ return fallback; }
  }

  function emit(channel, payload){
    (listeners[channel] || []).forEach(function(fn){
      try { fn(payload); } catch(e){ console.warn('[LiveSyncAdapter] listener failed', channel, e); }
    });
    window.dispatchEvent(new CustomEvent('familyapp:sync:'+channel, { detail: payload }));
  }

  function on(channel, callback){
    if(!listeners[channel]) listeners[channel] = [];
    listeners[channel].push(callback);
    return function(){
      listeners[channel] = (listeners[channel] || []).filter(function(fn){ return fn !== callback; });
    };
  }

  function getMode(){ return localStorage.getItem(MODE_KEY) || 'local'; }
  function setMode(mode){
    localStorage.setItem(MODE_KEY, mode || 'local');
    emit('mode', { mode: getMode(), at: nowIso() });
  }

  function getHousehold(){
    var existing = safeParse(localStorage.getItem(HOUSEHOLD_KEY), null);
    if(existing) return existing;
    var created = {
      id: 'household-local',
      name: 'Mijn gezin',
      mode: 'local',
      createdAt: nowIso(),
      updatedAt: nowIso(),
      memberIds: ['shane','esra']
    };
    localStorage.setItem(HOUSEHOLD_KEY, JSON.stringify(created));
    return created;
  }

  function saveHousehold(household){
    var next = Object.assign({}, household || {}, { updatedAt: nowIso() });
    localStorage.setItem(HOUSEHOLD_KEY, JSON.stringify(next));
    emit('household', next);
    return next;
  }

  function getActiveUser(){
    var existing = safeParse(localStorage.getItem(USER_KEY), null);
    if(existing) return existing;
    var fallbackId = typeof window.getActiveGroupQuestMemberId === 'function' ? window.getActiveGroupQuestMemberId() : 'shane';
    var user = {
      id: fallbackId,
      displayName: fallbackId === 'esra' ? 'Esra' : 'Shane',
      role: 'owner',
      avatar: '',
      createdAt: nowIso(),
      updatedAt: nowIso()
    };
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    return user;
  }

  function setActiveUser(user){
    var next = Object.assign({}, user || {}, { updatedAt: nowIso() });
    localStorage.setItem(USER_KEY, JSON.stringify(next));
    emit('user', next);
    return next;
  }

  function readCollection(key, fallback){
    return safeParse(localStorage.getItem(key), fallback || []);
  }

  function writeCollection(key, value, channel){
    localStorage.setItem(key, JSON.stringify(value || []));
    emit(channel || key, { key: key, value: value || [], at: nowIso(), mode: getMode() });
    return value || [];
  }

  function patchCollection(key, updater, channel){
    var current = readCollection(key, []);
    var next = updater ? updater(current.slice()) : current;
    return writeCollection(key, next, channel);
  }

  function syncStatus(){
    return {
      version: VERSION,
      mode: getMode(),
      household: getHousehold(),
      activeUser: getActiveUser(),
      backendReady: false,
      realtimeReady: false,
      localPrototype: true
    };
  }

  function createBackendPlaceholder(){
    return {
      signIn: function(){ throw new Error('Backend auth adapter is not connected yet.'); },
      signOut: function(){ throw new Error('Backend auth adapter is not connected yet.'); },
      subscribe: function(){ throw new Error('Realtime adapter is not connected yet.'); },
      write: function(){ throw new Error('Backend write adapter is not connected yet.'); }
    };
  }

  window.LiveSyncAdapter = {
    version: VERSION,
    getMode: getMode,
    setMode: setMode,
    getHousehold: getHousehold,
    saveHousehold: saveHousehold,
    getActiveUser: getActiveUser,
    setActiveUser: setActiveUser,
    readCollection: readCollection,
    writeCollection: writeCollection,
    patchCollection: patchCollection,
    on: on,
    emit: emit,
    status: syncStatus,
    backend: createBackendPlaceholder()
  };
})();
