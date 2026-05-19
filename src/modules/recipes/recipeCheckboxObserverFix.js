'use strict';
// ============================================================
// RECIPE CHECKBOX OBSERVER FIX v0.382
// MutationObserver-based fallback. It does not depend on render order.
// Whenever the legacy detail renderer outputs plain ingredient rows,
// this converts them into premium checkbox rows.
// ============================================================

(function(){
  var VERSION = '0.382';
  var STYLE_ID = 'recipe-checkbox-observer-style';
  var observer = null;
  var busy = false;

  function css(){
    if(document.getElementById(STYLE_ID)) return;
    var s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = [
      '.recipe-ing-label{display:flex!important;align-items:flex-start!important;gap:12px!important;padding:12px 0!important;border-bottom:1px solid rgba(17,24,39,.07)!important;cursor:pointer!important}',
      '.recipe-ing-label:last-child{border-bottom:0!important}',
      '.recipe-ing-label input{display:none!important}',
      '.recipe-ing-circle{width:28px!important;height:28px!important;min-width:28px!important;border-radius:50%!important;border:2px solid var(--c-border,#d8dfd6)!important;background:#fff!important;display:flex!important;align-items:center!important;justify-content:center!important;color:#fff!important;font-size:16px!important;font-weight:950!important;box-shadow:0 2px 8px rgba(17,24,39,.04)!important}',
      '.recipe-ing-circle.done{background:var(--c-primary,#3f7f2f)!important;border-color:var(--c-primary,#3f7f2f)!important}',
      '.recipe-ing-text{font-size:16px!important;line-height:1.45!important;font-weight:650!important;color:var(--c-text,#111827)!important;flex:1!important}',
      '.recipe-ing-text.done{text-decoration:line-through!important;text-decoration-thickness:2px!important;color:var(--c-text3,#9aa3af)!important}',
      '.recipe-step-check-label{display:flex!important;align-items:flex-start!important;gap:12px!important;background:#fff!important;border:1px solid var(--c-border,#edf0ec)!important;border-radius:16px!important;margin-bottom:8px!important;padding:12px!important;cursor:pointer!important}',
      '.recipe-step-check-label input{display:none!important}',
      '.recipe-step-check-circle{width:28px!important;height:28px!important;min-width:28px!important;border-radius:50%!important;border:2px solid var(--c-border,#d8dfd6)!important;background:#fff!important;display:flex!important;align-items:center!important;justify-content:center!important;color:#fff!important;font-size:16px!important;font-weight:950!important}',
      '.recipe-step-check-circle.done{background:var(--c-primary,#3f7f2f)!important;border-color:var(--c-primary,#3f7f2f)!important}',
      '.recipe-step-check-text{font-size:15px!important;line-height:1.45!important;font-weight:650!important;color:var(--c-text,#111827)!important;flex:1!important}',
      '.recipe-step-check-text.done{text-decoration:line-through!important;text-decoration-thickness:2px!important;color:var(--c-text3,#9aa3af)!important}'
    ].join('\n');
    document.head.appendChild(s);
  }

  function getCurrentId(){
    if(window.currentRecipeId) return window.currentRecipeId;
    try { if(typeof currentRecipeId !== 'undefined') return currentRecipeId; } catch(e) {}
    var dc = document.getElementById('recipe-detail-content');
    if(!dc) return null;
    var title = dc.querySelector('h2');
    var name = title ? String(title.textContent || '').trim() : '';
    var list = getRecipes();
    var found = list.find(function(r){ return String(r.name || '').trim() === name; });
    return found ? found.id : null;
  }

  function getRecipes(){
    if(Array.isArray(window.recipesData)) return window.recipesData;
    try { if(Array.isArray(recipesData)) return recipesData; } catch(e) {}
    return [];
  }

  function getRecipe(id){
    return getRecipes().find(function(r){ return Number(r.id) === Number(id); });
  }

  function toList(value){
    if(Array.isArray(value)) return value.map(function(v){ return String(v || '').trim(); }).filter(Boolean);
    return String(value || '').split(/\n|\r|;|\u2022|\s\-\s/g).map(function(v){ return v.trim(); }).filter(Boolean);
  }

  function ensureSets(id){
    window.checkedIngredients = window.checkedIngredients || {};
    window.checkedRecipeSteps = window.checkedRecipeSteps || {};
    if(!window.checkedIngredients[id]) window.checkedIngredients[id] = new Set();
    if(!window.checkedRecipeSteps[id]) window.checkedRecipeSteps[id] = new Set();
    if(Array.isArray(window.checkedIngredients[id])) window.checkedIngredients[id] = new Set(window.checkedIngredients[id]);
    if(Array.isArray(window.checkedRecipeSteps[id])) window.checkedRecipeSteps[id] = new Set(window.checkedRecipeSteps[id]);
  }

  function checkedMark(done){ return done ? '✓' : ''; }

  function ingredientHtml(id, ingredients){
    ensureSets(id);
    var set = window.checkedIngredients[id];
    return ingredients.map(function(ing, idx){
      var done = set.has(idx);
      return '<label class="recipe-ing-label" data-obs-ing="'+idx+'">'
        + '<input type="checkbox" '+(done?'checked':'')+'>'
        + '<span class="recipe-ing-circle '+(done?'done':'')+'">'+checkedMark(done)+'</span>'
        + '<span class="recipe-ing-text '+(done?'done':'')+'">'+escapeHtml(ing)+'</span>'
        + '</label>';
    }).join('');
  }

  function stepHtml(id, steps){
    ensureSets(id);
    var set = window.checkedRecipeSteps[id];
    return steps.map(function(step, idx){
      var done = set.has(idx);
      return '<label class="recipe-step-check-label" data-obs-step="'+idx+'">'
        + '<input type="checkbox" '+(done?'checked':'')+'>'
        + '<span class="recipe-step-check-circle '+(done?'done':'')+'">'+checkedMark(done)+'</span>'
        + '<span class="recipe-step-check-text '+(done?'done':'')+'">'+escapeHtml((idx+1)+'. '+step)+'</span>'
        + '</label>';
    }).join('');
  }

  function escapeHtml(v){
    return String(v == null ? '' : v)
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;')
      .replace(/'/g,'&#039;');
  }

  function extractPlainLines(wrap){
    var nodes = Array.prototype.slice.call(wrap.childNodes || []);
    return nodes.filter(function(node){
      if(node.nodeType !== 1) return false;
      if(node.classList.contains('recipe-section-header')) return false;
      if(node.id === 'to-shop-btn' || node.classList.contains('recipe-shop-btn')) return false;
      if(node.classList.contains('recipe-ing-label') || node.classList.contains('recipe-step-check-label')) return false;
      var txt = String(node.textContent || '').trim();
      return !!txt;
    }).map(function(node){ return String(node.textContent || '').trim(); });
  }

  function patchIngredients(dc, id, recipe){
    var wrap = dc.querySelector('.recipe-ings-wrap');
    if(!wrap) return false;
    var hasCheckbox = !!wrap.querySelector('.recipe-ing-label[data-obs-ing], .recipe-ing-label input[type="checkbox"]');
    if(hasCheckbox) return false;
    var ingredients = recipe ? toList(recipe.ingredients) : extractPlainLines(wrap);
    if(!ingredients.length) return false;
    if(recipe) recipe.ingredients = ingredients;
    var shopBtn = wrap.querySelector('#to-shop-btn,.recipe-shop-btn');
    wrap.innerHTML = '<div class="recipe-section-header">Ingrediënten</div>' + ingredientHtml(id, ingredients);
    if(shopBtn) wrap.appendChild(shopBtn);
    else wrap.insertAdjacentHTML('beforeend','<button class="recipe-shop-btn" id="to-shop-btn">🛒 Zet alles op boodschappenlijst</button>');
    wrap.querySelectorAll('[data-obs-ing]').forEach(function(row){
      row.onclick = function(){
        var idx = parseInt(row.getAttribute('data-obs-ing'),10);
        var set = window.checkedIngredients[id];
        if(set.has(idx)) set.delete(idx); else set.add(idx);
        refreshRow(row, set.has(idx), 'ingredient');
      };
    });
    var btn = wrap.querySelector('#to-shop-btn');
    if(btn && typeof window.addRecipeToShop === 'function') btn.onclick = function(){ window.addRecipeToShop(id); };
    return true;
  }

  function patchSteps(dc, id, recipe){
    var wrap = dc.querySelector('.recipe-steps-wrap');
    if(!wrap) return false;
    var hasCheckbox = !!wrap.querySelector('.recipe-step-check-label');
    if(hasCheckbox) return false;
    var steps = recipe ? toList(recipe.steps) : extractPlainLines(wrap).map(function(x){ return x.replace(/^\d+\.?\s*/, ''); });
    if(!steps.length) return false;
    if(recipe) recipe.steps = steps;
    wrap.innerHTML = '<div class="recipe-section-header">Bereiding</div>' + stepHtml(id, steps);
    wrap.querySelectorAll('[data-obs-step]').forEach(function(row){
      row.onclick = function(){
        var idx = parseInt(row.getAttribute('data-obs-step'),10);
        var set = window.checkedRecipeSteps[id];
        if(set.has(idx)) set.delete(idx); else set.add(idx);
        refreshRow(row, set.has(idx), 'step');
      };
    });
    return true;
  }

  function refreshRow(row, done, type){
    row.classList.toggle('done', done);
    var circle = row.querySelector(type === 'step' ? '.recipe-step-check-circle' : '.recipe-ing-circle');
    var text = row.querySelector(type === 'step' ? '.recipe-step-check-text' : '.recipe-ing-text');
    var input = row.querySelector('input');
    if(circle){ circle.classList.toggle('done', done); circle.textContent = checkedMark(done); }
    if(text) text.classList.toggle('done', done);
    if(input) input.checked = done;
  }

  function patch(){
    if(busy) return false;
    busy = true;
    try {
      css();
      var dc = document.getElementById('recipe-detail-content');
      var detail = document.getElementById('recipe-detail-view');
      if(!dc || (detail && detail.style.display === 'none')) return false;
      var id = getCurrentId();
      if(!id) return false;
      var recipe = getRecipe(id);
      ensureSets(id);
      var changed = false;
      changed = patchIngredients(dc, id, recipe) || changed;
      changed = patchSteps(dc, id, recipe) || changed;
      return changed;
    } finally {
      busy = false;
    }
  }

  function startObserver(){
    if(observer) return;
    var root = document.getElementById('screen-recipes') || document.body;
    observer = new MutationObserver(function(){ setTimeout(patch, 0); });
    observer.observe(root, { childList:true, subtree:true });
  }

  function boot(){
    css();
    startObserver();
    [50,150,350,800,1500,3000,5000].forEach(function(delay){ setTimeout(patch, delay); });
  }

  window.RecipeCheckboxObserverFix = { version:VERSION, boot:boot, patch:patch };
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
