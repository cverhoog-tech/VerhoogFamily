'use strict';
// ============================================================
// RECIPE SHARED LIVE v1.0
// Household-scoped Firebase recipes via FamilyDataStore.
// Firebase is authoritative; fam_recipes_v1 remains cache/legacy compatibility.
// ============================================================
(function(){
  if(window.__recipeSharedLiveV1) return;
  window.__recipeSharedLiveV1 = true;

  var COLLECTION = 'recipes';
  var STORE_KEY = 'fam_recipes_v1';
  var SEED_KEY = 'fam_recipes_seeded_v1';
  var state = { attached:false, applying:false, unsubscribe:null, repoOff:null, bootTimer:null };

  function now(){ return Date.now(); }
  function currentUser(){
    try { return window.fbUser || (window.firebase && firebase.auth && firebase.auth().currentUser) || null; }
    catch(e){ return null; }
  }
  function familyId(){ return window.fbFamilyId || null; }
  function ready(){
    return !!(window.FamilyDataStore && typeof window.FamilyDataStore.subscribeShared === 'function' && familyId() && currentUser() && Array.isArray(window.recipesData));
  }
  function clone(v){ try { return JSON.parse(JSON.stringify(v)); } catch(e){ return []; } }
  function recipeKey(id, index){
    var raw = id == null || id === '' ? ('legacy_' + index) : String(id);
    return 'id_' + raw.replace(/[.#$\[\]\/]/g,'_');
  }
  function ensureIds(recipes){
    var uid = currentUser() && currentUser().uid ? currentUser().uid : 'legacy';
    return (recipes || []).filter(Boolean).map(function(recipe, index){
      var r = Object.assign({}, recipe);
      if(r.id == null || r.id === '') r.id = 'r_' + uid.replace(/[^a-zA-Z0-9_-]/g,'').slice(0,20) + '_' + now().toString(36) + '_' + index;
      return r;
    });
  }
  function itemsFromArray(recipes){
    var out = {};
    ensureIds(recipes).forEach(function(recipe, index){ out[recipeKey(recipe.id, index)] = recipe; });
    return out;
  }
  function arrayFromValue(value){
    if(Array.isArray(value)) return ensureIds(value);
    var items = value && value.items && typeof value.items === 'object' ? value.items : {};
    return ensureIds(Object.keys(items).map(function(key){ return items[key]; }).filter(Boolean));
  }
  function payload(recipes, meta){
    var u = currentUser();
    var out = {
      schemaVersion:1,
      initialized:true,
      items:itemsFromArray(recipes),
      updatedAt:now(),
      updatedBy:u && u.uid ? u.uid : 'unknown'
    };
    if(meta) Object.keys(meta).forEach(function(k){ out[k] = meta[k]; });
    return out;
  }
  function writeLegacyCache(recipes){
    var list = ensureIds(recipes);
    try { localStorage.setItem(STORE_KEY, JSON.stringify(list)); } catch(e){}
    // Once household data exists, never let per-device seed state append recipes again.
    try { localStorage.setItem(SEED_KEY, '1'); } catch(e){}
    try {
      if(window.HouseholdRepository && typeof window.HouseholdRepository.write === 'function'){
        window.HouseholdRepository.write('recipes', list, { silent:true, source:'recipeSharedLive' });
      }
    } catch(e){}
    window.recipesData = list;
    return list;
  }
  function renderIfActive(){
    var screen = document.getElementById('screen-recipes');
    if(!screen) return;
    var active = screen.classList.contains('active') || screen.style.display === 'block' || screen.offsetParent !== null;
    if(active && typeof window.renderRecipes === 'function'){
      try { window.renderRecipes(); } catch(e){ console.warn('[RecipeSharedLive] render failed', e); }
    }
  }
  function write(recipes, meta){
    if(state.applying || !ready()) return Promise.resolve(false);
    var list = ensureIds(Array.isArray(recipes) ? recipes : window.recipesData || []);
    writeLegacyCache(list);
    return window.FamilyDataStore.writeShared(COLLECTION, payload(list, meta)).then(function(result){ return result; });
  }
  function legacyFirebaseRead(){
    try {
      var db = window.fbDb || (window.firebase && firebase.database && firebase.database());
      var fid = familyId();
      if(!db || !fid) return Promise.resolve([]);
      return db.ref('families/' + fid + '/recipes').once('value').then(function(snapshot){
        var raw = snapshot.val();
        if(!raw) return [];
        if(Array.isArray(raw)) return raw.filter(Boolean);
        if(raw.items && typeof raw.items === 'object') return Object.keys(raw.items).map(function(k){ return raw.items[k]; }).filter(Boolean);
        if(typeof raw === 'object') return Object.keys(raw).map(function(k){ return raw[k]; }).filter(function(v){ return v && typeof v === 'object'; });
        return [];
      }).catch(function(){ return []; });
    } catch(e){ return Promise.resolve([]); }
  }
  function seedSource(){
    if(Array.isArray(window.recipesData) && window.recipesData.length) return clone(window.recipesData);
    try {
      var raw = localStorage.getItem(STORE_KEY), parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch(e){ return []; }
  }
  function initializeAndSubscribe(){
    if(state.attached || !ready()) return false;
    state.attached = true;
    window.FamilyDataStore.readShared(COLLECTION, null).then(function(existing){
      if(existing && existing.initialized) return existing;
      // Support a short-lived/shared array shape if an earlier bridge already wrote one.
      if(Array.isArray(existing) && existing.length){
        var migratedArray = payload(existing, { migratedAt:now(), migratedFrom:'shared-recipes-array' });
        return window.FamilyDataStore.writeShared(COLLECTION, migratedArray).then(function(){ return migratedArray; });
      }
      return legacyFirebaseRead().then(function(legacy){
        var local = seedSource();
        var seed = legacy.length ? legacy : local;
        var first = payload(seed, {
          migratedAt:now(),
          migratedFrom:legacy.length ? 'families/{householdId}/recipes' : (local.length ? 'fam_recipes_v1' : 'empty')
        });
        return window.FamilyDataStore.writeShared(COLLECTION, first).then(function(){ return first; });
      });
    }).then(function(){
      state.unsubscribe = window.FamilyDataStore.subscribeShared(COLLECTION, function(value){
        if(!value || (!value.initialized && !Array.isArray(value))) return;
        state.applying = true;
        var list = arrayFromValue(value);
        writeLegacyCache(list);
        state.applying = false;
        renderIfActive();
        try { window.dispatchEvent(new CustomEvent('familyapp:recipes-synced', { detail:{ familyId:familyId(), recipes:list.slice() } })); } catch(e){}
      }, {schemaVersion:1,initialized:true,items:{}});
    }).catch(function(err){
      state.attached = false;
      console.error('[RecipeSharedLive] init failed', err);
    });
    return true;
  }
  function attachLegacyWriteBridge(){
    if(state.repoOff || !window.HouseholdRepository || typeof window.HouseholdRepository.on !== 'function') return false;
    state.repoOff = window.HouseholdRepository.on('recipes', function(event){
      if(state.applying) return;
      var value = event && event.value;
      if(!Array.isArray(value)) return;
      write(value, { source:'recipes-ui' }).catch(function(err){ console.error('[RecipeSharedLive] write failed', err); });
    });
    return true;
  }
  function boot(){
    if(state.bootTimer) return;
    var tries = 0;
    state.bootTimer = setInterval(function(){
      tries++;
      attachLegacyWriteBridge();
      initializeAndSubscribe();
      if((state.attached && state.repoOff) || tries > 240){ clearInterval(state.bootTimer); state.bootTimer = null; }
    },250);
    attachLegacyWriteBridge();
    initializeAndSubscribe();
  }

  window.addEventListener('focus', initializeAndSubscribe);
  window.addEventListener('online', initializeAndSubscribe);
  window.addEventListener('familyapp:household-members-updated', initializeAndSubscribe);
  window.RecipeSharedLive = {
    version:'1.0.0',
    sync:initializeAndSubscribe,
    save:function(){ return write(window.recipesData || [], { source:'manual' }); },
    status:function(){ return { attached:state.attached, familyId:familyId(), count:Array.isArray(window.recipesData) ? window.recipesData.length : 0 }; }
  };

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
