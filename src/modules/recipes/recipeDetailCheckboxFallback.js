'use strict';
// ============================================================
// RECIPE DETAIL CHECKBOX FALLBACK v0.379
// Last-mile patch for the active legacy recipes.js detail renderer.
// Converts visible ingredient and step rows into checkbox rows after render.
// ============================================================

(function(){
  var VERSION = '0.379';
  var STYLE_ID = 'recipe-detail-checkbox-fallback-style';
  var patchedOpen = false;

  function ensureStyles(){
    if(document.getElementById(STYLE_ID)) return;
    var style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = [
      '.recipe-cb-fallback-row{display:flex!important;align-items:flex-start!important;gap:12px!important;padding:12px 0!important;border-bottom:1px solid rgba(17,24,39,.07)!important;cursor:pointer!important}',
      '.recipe-cb-fallback-row:last-child{border-bottom:0!important}',
      '.recipe-cb-fallback-box{width:28px!important;height:28px!important;min-width:28px!important;border-radius:50%!important;border:2px solid var(--c-border,#d8dfd6)!important;background:#fff!important;display:flex!important;align-items:center!important;justify-content:center!important;font-weight:950!important;color:#fff!important;box-shadow:0 2px 8px rgba(17,24,39,.04)!important}',
      '.recipe-cb-fallback-row.done .recipe-cb-fallback-box{background:var(--c-primary,#3f7f2f)!important;border-color:var(--c-primary,#3f7f2f)!important}',
      '.recipe-cb-fallback-text{font-size:16px!important;line-height:1.45!important;font-weight:650!important;color:var(--c-text,#111827)!important}',
      '.recipe-cb-fallback-row.done .recipe-cb-fallback-text{text-decoration:line-through!important;text-decoration-thickness:2px!important;color:var(--c-text3,#9aa3af)!important}',
      '.recipe-steps-wrap .recipe-cb-fallback-row{background:#fff!important;border:1px solid var(--c-border,#edf0ec)!important;border-radius:16px!important;margin-bottom:8px!important;padding:12px!important}',
      '.recipe-manage-fallback-row{display:flex!important;gap:8px!important;flex-wrap:wrap!important;padding:0 16px 14px!important}',
      '.recipe-manage-fallback-row button{border:0!important;border-radius:999px!important;padding:10px 13px!important;font-size:12px!important;font-weight:950!important;background:var(--c-surface2,#f4f7f2)!important;color:var(--c-text,#111827)!important}',
      '.recipe-manage-fallback-row .primary{background:var(--c-primary,#3f7f2f)!important;color:#fff!important}',
      '.recipe-manage-fallback-row .danger{background:#fff1f1!important;color:#c23333!important}',
      '#recipe-list-view.recipe-patching{opacity:.35!important;pointer-events:none!important;transition:opacity .12s ease!important}'
    ].join('\n');
    document.head.appendChild(style);
  }

  function getRecipes(){
    if(Array.isArray(window.recipesData)) return window.recipesData;
    try { if(Array.isArray(recipesData)) return recipesData; } catch(e) {}
    return [];
  }

  function setRecipes(next){
    window.recipesData = next;
    try { recipesData = next; } catch(e) {}
  }

  function getRecipe(id){
    return getRecipes().find(function(r){ return Number(r.id) === Number(id); });
  }

  function normalizeList(value){
    if(Array.isArray(value)) return value.map(function(v){ return String(v || '').trim(); }).filter(Boolean);
    if(value == null) return [];
    return String(value).split(/\n|\r|;|\u2022|\s\-\s/g).map(function(v){ return v.trim(); }).filter(Boolean);
  }

  function normalizeRecipe(r){
    if(!r) return;
    r.ingredients = normalizeList(r.ingredients);
    r.steps = normalizeList(r.steps);
  }

  function persist(){
    try { localStorage.setItem('familyapp_food_recipes_v001', JSON.stringify(getRecipes())); } catch(e) {}
    try { window.dispatchEvent(new CustomEvent('familyapp:food:recipes-updated', { detail:{ recipes:getRecipes(), version:VERSION } })); } catch(e) {}
  }

  function ensureSets(id){
    window.checkedIngredients = window.checkedIngredients || {};
    window.checkedRecipeSteps = window.checkedRecipeSteps || {};
    if(!window.checkedIngredients[id]) window.checkedIngredients[id] = new Set();
    if(!window.checkedRecipeSteps[id]) window.checkedRecipeSteps[id] = new Set();
    if(Array.isArray(window.checkedIngredients[id])) window.checkedIngredients[id] = new Set(window.checkedIngredients[id]);
    if(Array.isArray(window.checkedRecipeSteps[id])) window.checkedRecipeSteps[id] = new Set(window.checkedRecipeSteps[id]);
  }

  function rowHtml(type, value, idx, done){
    return '<label class="recipe-cb-fallback-row '+(done?'done':'')+'" data-recipe-cb-type="'+type+'" data-recipe-cb-idx="'+idx+'">'
      + '<span class="recipe-cb-fallback-box">'+(done?'✓':'')+'</span>'
      + '<span class="recipe-cb-fallback-text">'+escapeHtml(value)+'</span>'
      + '</label>';
  }

  function escapeHtml(v){
    return String(v == null ? '' : v)
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;')
      .replace(/'/g,'&#039;');
  }

  function injectManageButtons(id){
    var dc = document.getElementById('recipe-detail-content');
    if(!dc || document.getElementById('recipe-manage-fallback-row')) return;
    var titleArea = dc.querySelector('.recipe-title-area');
    var row = document.createElement('div');
    row.id = 'recipe-manage-fallback-row';
    row.className = 'recipe-manage-fallback-row';
    row.innerHTML = '<button type="button" class="primary" id="recipe-fallback-edit">✏️ Bewerken</button><button type="button" id="recipe-fallback-photo">🖼️ Foto</button><button type="button" class="danger" id="recipe-fallback-delete">🗑️ Verwijderen</button>';
    if(titleArea && titleArea.parentNode) titleArea.parentNode.insertBefore(row, titleArea.nextSibling);
    else dc.insertBefore(row, dc.firstChild);

    var edit = document.getElementById('recipe-fallback-edit');
    var photo = document.getElementById('recipe-fallback-photo');
    var del = document.getElementById('recipe-fallback-delete');
    if(edit) edit.onclick = function(){ if(typeof window.openRecipeEditor === 'function') window.openRecipeEditor(id); };
    if(photo) photo.onclick = function(){ if(typeof window.openRecipePhotoSheet === 'function') window.openRecipePhotoSheet(id); };
    if(del) del.onclick = function(){
      var r = getRecipe(id);
      if(!r || !confirm('Recept "'+r.name+'" verwijderen?')) return;
      setRecipes(getRecipes().filter(function(x){ return Number(x.id) !== Number(id); }));
      persist();
      if(typeof window.showRecipeListView === 'function') window.showRecipeListView();
      if(typeof window.renderRecipeGrid === 'function') window.renderRecipeGrid();
    };
  }

  function patchDetail(){
    ensureStyles();
    var id = window.currentRecipeId;
    try { if(!id && typeof currentRecipeId !== 'undefined') id = currentRecipeId; } catch(e) {}
    if(!id) return false;
    var r = getRecipe(id);
    if(!r) return false;
    normalizeRecipe(r);
    ensureSets(id);
    var dc = document.getElementById('recipe-detail-content');
    if(!dc) return false;

    injectManageButtons(id);

    var ingWrap = dc.querySelector('.recipe-ings-wrap');
    if(ingWrap && r.ingredients.length){
      var header = ingWrap.querySelector('.recipe-section-header');
      var shopBtn = ingWrap.querySelector('#to-shop-btn,.recipe-shop-btn');
      var checked = window.checkedIngredients[id];
      ingWrap.innerHTML = '';
      if(header) ingWrap.appendChild(header);
      else ingWrap.insertAdjacentHTML('beforeend','<div class="recipe-section-header">Ingrediënten</div>');
      ingWrap.insertAdjacentHTML('beforeend', r.ingredients.map(function(ing, idx){ return rowHtml('ingredient', ing, idx, checked.has(idx)); }).join(''));
      if(shopBtn) ingWrap.appendChild(shopBtn);
      else ingWrap.insertAdjacentHTML('beforeend','<button class="recipe-shop-btn" id="to-shop-btn">🛒 Zet alles op boodschappenlijst</button>');
    }

    var stepsWrap = dc.querySelector('.recipe-steps-wrap');
    if(stepsWrap && r.steps.length){
      var stepsHeader = stepsWrap.querySelector('.recipe-section-header');
      var stepSet = window.checkedRecipeSteps[id];
      stepsWrap.innerHTML = '';
      if(stepsHeader) stepsWrap.appendChild(stepsHeader);
      else stepsWrap.insertAdjacentHTML('beforeend','<div class="recipe-section-header">Bereiding</div>');
      stepsWrap.insertAdjacentHTML('beforeend', r.steps.map(function(step, idx){ return rowHtml('step', (idx+1)+'. '+step, idx, stepSet.has(idx)); }).join(''));
    }

    dc.querySelectorAll('[data-recipe-cb-type]').forEach(function(row){
      row.onclick = function(){
        var type = row.getAttribute('data-recipe-cb-type');
        var idx = parseInt(row.getAttribute('data-recipe-cb-idx'),10);
        var set = type === 'step' ? window.checkedRecipeSteps[id] : window.checkedIngredients[id];
        if(set.has(idx)) set.delete(idx); else set.add(idx);
        patchDetail();
      };
    });

    var shop = dc.querySelector('#to-shop-btn');
    if(shop && typeof window.addRecipeToShop === 'function') shop.onclick = function(){ window.addRecipeToShop(id); };
    persist();
    return true;
  }

  function wrapOpenDetail(){
    if(patchedOpen || typeof window.openRecipeDetail !== 'function') return;
    var original = window.openRecipeDetail;
    window.openRecipeDetail = function(id){
      var list = document.getElementById('recipe-list-view');
      if(list) list.classList.add('recipe-patching');
      var result = original.apply(this, arguments);
      window.currentRecipeId = id;
      [30,100,220,450].forEach(function(delay){
        setTimeout(function(){ patchDetail(); if(list) list.classList.remove('recipe-patching'); }, delay);
      });
      return result;
    };
    try { openRecipeDetail = window.openRecipeDetail; } catch(e) {}
    patchedOpen = true;
  }

  function boot(){
    ensureStyles();
    wrapOpenDetail();
    patchDetail();
    [200,600,1200,2500,4000].forEach(function(delay){ setTimeout(function(){ wrapOpenDetail(); patchDetail(); }, delay); });
  }

  window.RecipeDetailCheckboxFallback = { version:VERSION, boot:boot, patchDetail:patchDetail };
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
