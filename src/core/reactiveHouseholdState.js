'use strict';
// ============================================================
// REACTIVE HOUSEHOLD STATE v0.307
// Central reactive state bridge for household members, quests and UI.
// Keeps local prototype working while preparing realtime sync.
// ============================================================

(function(){
  var VERSION = '0.307';
  var subscribers = {};
  var state = {
    version: VERSION,
    ready: false,
    updatedAt: new Date().toISOString(),
    household: null,
    activeMember: null,
    members: [],
    groupQuests: [],
    presence: {}
  };

  function nowIso(){ return new Date().toISOString(); }

  function safeCall(fn, payload){
    try { fn(payload); } catch(e){ console.warn('[ReactiveHouseholdState] subscriber failed', e); }
  }

  function emit(channel, payload){
    (subscribers[channel] || []).forEach(function(fn){ safeCall(fn, payload); });
    (subscribers['*'] || []).forEach(function(fn){ safeCall(fn, { channel: channel, payload: payload }); });
    try { window.dispatchEvent(new CustomEvent('familyapp:state:' + channel, { detail: payload })); } catch(e) {}
  }

  function subscribe(channel, callback){
    if(!subscribers[channel]) subscribers[channel] = [];
    subscribers[channel].push(callback);
    return function(){
      subscribers[channel] = (subscribers[channel] || []).filter(function(fn){ return fn !== callback; });
    };
  }

  function snapshot(){
    return JSON.parse(JSON.stringify(state));
  }

  function getMembers(){
    if(window.HouseholdIdentity && typeof window.HouseholdIdentity.getMembers === 'function') return window.HouseholdIdentity.getMembers();
    return [];
  }

  function getActiveMember(){
    if(window.HouseholdIdentity && typeof window.HouseholdIdentity.getActiveMember === 'function') return window.HouseholdIdentity.getActiveMember();
    return null;
  }

  function getHousehold(){
    if(window.LiveSyncAdapter && typeof window.LiveSyncAdapter.getHousehold === 'function') return window.LiveSyncAdapter.getHousehold();
    return null;
  }

  function getGroupQuests(){
    if(typeof window.loadGroupQuests === 'function') return window.loadGroupQuests();
    return [];
  }

  function refresh(reason){
    state.household = getHousehold();
    state.members = getMembers();
    state.activeMember = getActiveMember();
    state.groupQuests = getGroupQuests();
    state.ready = true;
    state.updatedAt = nowIso();
    state.reason = reason || 'refresh';
    emit('updated', snapshot());
    if(reason) emit(reason, snapshot());
    return snapshot();
  }

  function setPresence(memberId, patch){
    if(!memberId) return snapshot();
    state.presence[memberId] = Object.assign({}, state.presence[memberId] || {}, patch || {}, { updatedAt: nowIso() });
    emit('presence', { memberId: memberId, presence: state.presence[memberId], state: snapshot() });
    return snapshot();
  }

  function setActiveMember(memberId){
    if(window.HouseholdIdentity && typeof window.HouseholdIdentity.setActiveMember === 'function'){
      window.HouseholdIdentity.setActiveMember(memberId);
    }
    return refresh('active-member');
  }

  function updateMembers(updater){
    if(!window.HouseholdIdentity || typeof window.HouseholdIdentity.saveMembers !== 'function') return refresh('members');
    var current = getMembers();
    var next = updater ? updater(current.slice()) : current;
    window.HouseholdIdentity.saveMembers(next);
    return refresh('members');
  }

  function updateGroupQuests(updater){
    if(typeof window.loadGroupQuests !== 'function' || typeof window.saveGroupQuests !== 'function') return refresh('group-quests');
    var current = window.loadGroupQuests();
    var next = updater ? updater(current.slice()) : current;
    window.saveGroupQuests(next);
    emit('group-quests', { groupQuests: next, state: refresh('group-quests') });
    return snapshot();
  }

  function announceQuestEvent(type, quest, extra){
    var payload = Object.assign({ type: type, quest: quest || null, at: nowIso(), state: snapshot() }, extra || {});
    emit('quest-event', payload);
    return payload;
  }

  function installBridgeListeners(){
    window.addEventListener('familyapp:household-members-updated', function(){ refresh('members'); });
    window.addEventListener('familyapp:active-member-updated', function(){ refresh('active-member'); });
    window.addEventListener('familyapp:group-quests-updated', function(){ refresh('group-quests'); });
    window.addEventListener('storage', function(ev){
      if(!ev || !ev.key) return;
      if(ev.key.indexOf('familyapp_') === 0 || ev.key.indexOf('fam_') === 0) refresh('storage');
    });
  }

  function boot(){
    installBridgeListeners();
    refresh('boot');
    var active = state.activeMember;
    if(active) setPresence(active.id, { onlineStatus: 'online', currentScreen: 'app' });
  }

  window.ReactiveHouseholdState = {
    version: VERSION,
    subscribe: subscribe,
    on: subscribe,
    emit: emit,
    refresh: refresh,
    snapshot: snapshot,
    setPresence: setPresence,
    setActiveMember: setActiveMember,
    updateMembers: updateMembers,
    updateGroupQuests: updateGroupQuests,
    announceQuestEvent: announceQuestEvent
  };

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
