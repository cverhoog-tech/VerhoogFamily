'use strict';
// ============================================================
// RECIPE CHECKLIST PERSISTENCE v0.275
// Persists ingredient and step checkmarks per active household member.
// Works as a safe bridge around recipes.js v0.272 without reopening it.
// ============================================================

(function(){
  var STORE_KEY = 'fam_recipe_checks_v1';
  var SVG = '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
  var restoring = false;

  function getMemberId(){
    try {
      if(window.ReactiveHouseholdState && window.ReactiveHouseholdState.snapshot){
        var snap = window.ReactiveHouseholdState.snapshot();
        if(snap && snap.activeMember && snap.activeMember.id) return String(snap.activeMember.id);
      }
    } catch(e) {}
    try {
      if(window.HouseholdIdentity && window.HouseholdIdentity.getActiveMemberId) return String(window.HouseholdIdentity.getActiveMemberId());
    } catch(e) {}
    return String(window.myName || 'default');
  }

  function readStore(){
    try {
      var raw = localStorage.getItem(STORE_KEY);
      var parsed = raw ? JSON.parse(raw) : {};
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch(e) { return {}; }
  }

  function writeStore(data){
    try { localStorage.setItem(STORE_KEY, JSON.stringify(data || {})); } catch(e) {}
  }

  function findCurrentRecipe(){
    var title = document.querySelector('#recipe-detail-view .rd-info h2');
    var name = title ? title.textContent.trim() : '';
    var list = Array.isArray(window.recipesData) ? window.recipesData : [];
    if(!name || !list.length) return null;
    for(var i = 0; i < list.length; i++){
      if(String(list[i].name || '').trim() === name) return list[i];
    }
    return null;
  }

  function getRecipeState(recipeId){
    var store = readStore();
    var member = getMemberId();
    store[member] = store[member] || {};
    store[member][recipeId] = store[member][recipeId] || { ingredients: [], steps: [] };
    return { store: store, member: member, state: store[member][recipeId] };
  }

  function isOn(row, textClass){
    if(!row) return false;
    var text = row.querySelector(textClass);
    return !!(text && text.classList.contains('on'));
  }

  function readVisibleState(){
    var recipe = findCurrentRecipe();
    if(!recipe) return;
    var data = getRecipeState(recipe.id);
    var ingredients = [];
    var steps = [];

    document.querySelectorAll('#recipe-detail-view .rd-ing[id^="ri-"]').forEach(function(row){
      var idx = parseInt(String(row.id).replace('ri-', ''), 10);
      if(!isNaN(idx) && isOn(row, '.rd-ing-txt')) ingredients.push(idx);
    });

    document.querySelectorAll('#recipe-detail-view .rd-step[id^="rs-"]').forEach(function(row){
      var idx = parseInt(String(row.id).replace('rs-', ''), 10);
      if(!isNaN(idx) && isOn(row, '.rd-step-txt')) steps.push(idx);
    });

    data.state.ingredients = ingredients;
    data.state.steps = steps;
    writeStore(data.store);
  }

  function forceVisual(row, on, textSelector){
    if(!row) return;
    var dot = row.querySelector('.rd-dot');
    var text = row.querySelector(textSelector);
    if(dot){
      dot.className = 'rd-dot' + (on ? ' on' : '');
      dot.innerHTML = on ? SVG : '';
    }
    if(text) text.className = textSelector.replace('.', '') + (on ? ' on' : '');
  }

  function restoreState(){
    var recipe = findCurrentRecipe();
    if(!recipe) return;
    var data = getRecipeState(recipe.id);
    var wantedI = (data.state.ingredients || []).map(String);
    var wantedS = (data.state.steps || []).map(String);

    restoring = true;

    document.querySelectorAll('#recipe-detail-view .rd-ing[id^="ri-"]').forEach(function(row){
      var idx = String(row.id).replace('ri-', '');
      var shouldBeOn = wantedI.indexOf(idx) >= 0;
      if(shouldBeOn && !isOn(row, '.rd-ing-txt')) {
        try { row.click(); } catch(e) { forceVisual(row, true, '.rd-ing-txt'); }
      } else if(!shouldBeOn && isOn(row, '.rd-ing-txt')) {
        forceVisual(row, false, '.rd-ing-txt');
      }
    });

    document.querySelectorAll('#recipe-detail-view .rd-step[id^="rs-"]').forEach(function(row){
      var idx = String(row.id).replace('rs-', '');
      var shouldBeOn = wantedS.indexOf(idx) >= 0;
      if(shouldBeOn && !isOn(row, '.rd-step-txt')) {
        try { row.click(); } catch(e) { forceVisual(row, true, '.rd-step-txt'); }
      } else if(!shouldBeOn && isOn(row, '.rd-step-txt')) {
        forceVisual(row, false, '.rd-step-txt');
      }
    });

    restoring = false;
  }

  function scheduleRestore(){
    setTimeout(restoreState, 40);
    setTimeout(restoreState, 180);
  }

  function installClickCapture(){
    if(document.__recipeChecklistPersistenceClick) return;
    document.__recipeChecklistPersistenceClick = true;
    document.addEventListener('click', function(ev){
      var row = ev.target && ev.target.closest ? ev.target.closest('#recipe-detail-view .rd-ing, #recipe-detail-view .rd-step') : null;
      if(!row) return;
      setTimeout(function(){ if(!restoring) readVisibleState(); }, 0);
    }, true);
  }

  function wrapDetailOpen(){
    if(typeof window.openRecipeDetail !== 'function') return false;
    if(window.openRecipeDetail.__recipeChecklistPersistence) return true;
    var original = window.openRecipeDetail;
    var wrapped = function(){
      var result = original.apply(this, arguments);
      scheduleRestore();
      return result;
    };
    wrapped.__recipeChecklistPersistence = true;
    window.openRecipeDetail = wrapped;
    return true;
  }

  function boot(){
    installClickCapture();
    wrapDetailOpen();
    scheduleRestore();

    var screen = document.getElementById('screen-recipes');
    if(screen && !screen.__recipeChecklistPersistenceObserver){
      screen.__recipeChecklistPersistenceObserver = true;
      new MutationObserver(function(){ scheduleRestore(); }).observe(screen, { childList:true, subtree:true });
    }
  }

  var tries = 0;
  var timer = setInterval(function(){
    tries++;
    boot();
    if(document.getElementById('screen-recipes') || tries > 30) clearInterval(timer);
  }, 150);

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  window.RecipeChecklistPersistence = { boot: boot, restore: restoreState, save: readVisibleState };
})();
