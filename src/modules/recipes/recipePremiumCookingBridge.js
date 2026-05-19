'use strict';
// ============================================================
// RECIPE PREMIUM COOKING BRIDGE v0.375
// Restores premium cooking checklists for ingredients + preparation steps.
// Robustly detects the active recipe detail container.
// ============================================================

(function(){
  var VERSION = '0.375';
  var STYLE_ID = 'recipe-premium-cooking-style';
  var loadingPromise = null;
  var checkedSteps = window.checkedRecipeSteps || {};
  window.checkedRecipeSteps = checkedSteps;

  function esc(v){
    return String(v == null ? '' : v)
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;')
      .replace(/'/g,'&#039;');
  }

  function ensureStyles(){
    if(document.getElementById(STYLE_ID)) return;
    var style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = [
      '.recipe-add-native-btn{background:var(--c-primary)!important;color:#fff!important;border:0!important;border-radius:999px!important;padding:9px 16px!important;font-size:13px!important;font-weight:950!important;box-shadow:0 8px 18px rgba(63,127,47,.18)!important;cursor:pointer!important}',
      '.recipe-add-native-btn:active{transform:scale(.97)!important}',
      '.recipe-ing-label,.recipe-step-check-row{display:flex!important;align-items:flex-start!important;gap:12px!important;padding:12px 0!important;cursor:pointer!important;border-bottom:1px solid rgba(17,24,39,.055)!important}',
      '.recipe-ing-label:last-child,.recipe-step-check-row:last-child{border-bottom:0!important}',
      '.recipe-ing-circle,.recipe-step-circle{width:26px!important;height:26px!important;min-width:26px!important;border-radius:50%!important;border:2px solid var(--c-border,#d8dfd6)!important;background:var(--c-surface,#fff)!important;display:flex!important;align-items:center!important;justify-content:center!important;transition:all .18s cubic-bezier(.2,.8,.2,1)!important;box-shadow:0 2px 8px rgba(17,24,39,.04)!important}',
      '.recipe-ing-circle.done,.recipe-step-circle.done{border-color:var(--c-primary,#3f7f2f)!important;background:var(--c-primary,#3f7f2f)!important;box-shadow:0 7px 18px rgba(63,127,47,.22)!important;transform:scale(1.04)!important}',
      '.recipe-ing-text,.recipe-step-check-text{font-size:15px!important;line-height:1.45!important;color:var(--c-text,#111827)!important;font-weight:650!important;transition:all .18s ease!important}',
      '.recipe-ing-text.done,.recipe-step-check-text.done{color:var(--c-text3,#9aa3af)!important;text-decoration:line-through!important;text-decoration-thickness:2px!important}',
      '.recipe-step-check-row{background:var(--c-surface,#fff)!important;border:1px solid var(--c-border,#edf0ec)!important;border-radius:16px!important;margin-bottom:8px!important;padding:12px!important;box-shadow:0 4px 14px rgba(17,24,39,.035)!important}',
      '.recipe-step-num-premium{width:28px;height:28px;border-radius:10px;background:var(--c-surface2,#f4f7f2);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:950;color:var(--c-text2,#667085);flex:0 0 auto}',
      '.recipe-steps-wrap,.recipe-ings-wrap{background:var(--c-surface,#fff)!important;border-radius:22px!important;margin:12px 16px!important;padding:16px!important;box-shadow:0 6px 20px rgba(17,24,39,.05)!important;border:1px solid var(--c-border,#edf0ec)!important}',
      '.recipe-manage-row-inline{display:flex!important;gap:9px!important;flex-wrap:wrap!important;margin:14px 16px 4px!important}',
      '.recipe-manage-row-inline button{border:0!important;border-radius:999px!important;padding:10px 13px!important;font-size:12px!important;font-weight:950!important;background:var(--c-surface2,#f4f7f2)!important;color:var(--c-text,#111827)!important}',
      '.recipe-manage-row-inline button.primary{background:var(--c-primary,#3f7f2f)!important;color:#fff!important}',
      '.recipe-manage-row-inline button.danger{background:#fff1f1!important;color:#c23333!important}',
      '.recipe-hero-img-premium{width:100%;height:210px;object-fit:cover;display:block}',
      '.recipe-hero-premium{width:100%;height:210px;overflow:hidden;position:relative;background:var(--c-surface2,#f4f7f2);display:flex;align-items:center;justify-content:center;font-size:60px}'
    ].join('\n');
    document.head.appendChild(style);
  }

  function loadScriptOnce(id, src, ready){
    return new Promise(function(resolve){
      if(ready && ready()) return resolve();
      if(document.getElementById(id)){
        var tries = 0;
        var wait = setInterval(function(){
          tries++;
          if(!ready || ready() || tries > 60){ clearInterval(wait); resolve(); }
        }, 40);
        return;
      }
      var script = document.createElement('script');
      script.id = id;
      script.src = src;
      script.onload = function(){ resolve(); };
      script.onerror = function(){ console.warn('[RecipePremiumCookingBridge] failed to load', src); resolve(); };
      document.body.appendChild(script);
    });
  }

  function ensureRecipeStack(){
    if(loadingPromise) return loadingPromise;
    loadingPromise = Promise.resolve()
      .then(function(){ return loadScriptOnce('modal-manager-js','src/core/modalManager.js',function(){ return !!window.ModalManager; }); })
      .then(function(){ return loadScriptOnce('bottom-sheet-js','src/core/bottomSheet.js',function(){ return !!window.BottomSheet; }); })
      .then(function(){ return loadScriptOnce('recipe-bottom-sheet-bridge-js','src/modules/recipes/recipeBottomSheetBridge.js',function(){ return !!window.RecipeBottomSheetBridge; }); });
    return loadingPromise;
  }

  function openRecipeAdd(){
    ensureRecipeStack().then(function(){
      if(window.RecipeBottomSheetBridge && typeof window.RecipeBottomSheetBridge.openRecipeSheet === 'function'){
        window.RecipeBottomSheetBridge.openRecipeSheet(null);
      } else if(window.BottomSheet){
        window.BottomSheet.open({ title:'🍳 Nieuw recept', html:'<div style="padding:12px;color:var(--c-text2)">Receptformulier kon niet geladen worden.</div>', actions:[{label:'Sluiten'}] });
      }
    });
    return false;
  }

  function installAddButton(){
    ensureStyles();
    var screen = document.getElementById('screen-recipes');
    if(!screen) return;
    var header = screen.querySelector('.list-header');
    if(!header) return;
    header.querySelectorAll('.add-btn').forEach(function(old){ old.style.display = 'none'; old.onclick = null; old.removeAttribute('onclick'); });
    var btn = document.getElementById('recipe-add-native-btn');
    if(!btn){
      btn = document.createElement('button');
      btn.id = 'recipe-add-native-btn';
      btn.className = 'recipe-add-native-btn';
      btn.type = 'button';
      btn.textContent = '+ Recept';
      header.appendChild(btn);
    }
    btn.onclick = function(e){ if(e) e.preventDefault(); return openRecipeAdd(); };
  }

  function checkedSet(bucket, id){
    if(!bucket[id]) bucket[id] = [];
    if(Array.isArray(bucket[id])) bucket[id] = new Set(bucket[id]);
    return bucket[id];
  }

  function findRecipe(id){
    if(!Array.isArray(window.recipesData)) return null;
    return window.recipesData.find(function(x){ return Number(x.id) === Number(id); }) || null;
  }

  function findDetailContainer(recipe){
    var dc = document.getElementById('recipe-detail-content');
    if(dc) return dc;
    var screen = document.getElementById('screen-recipes');
    if(!screen) return null;
    var title = recipe && recipe.name ? Array.prototype.find.call(screen.querySelectorAll('h1,h2,h3,.recipe-title'), function(el){ return String(el.textContent || '').indexOf(recipe.name) > -1; }) : null;
    if(title){
      var card = title.closest('.recipe-detail-card,.recipe-detail,.card,.content-card');
      if(card) return card;
      var parent = title.parentElement;
      while(parent && parent !== screen){
        if(String(parent.textContent || '').indexOf('Ingrediënten') > -1) return parent;
        parent = parent.parentElement;
      }
    }
    var candidates = Array.prototype.slice.call(screen.querySelectorAll('.recipe-detail-card,.recipe-detail,.card,.content-card,.detail-card'));
    for(var i=0;i<candidates.length;i++){
      if(String(candidates[i].textContent || '').indexOf('Ingrediënten') > -1) return candidates[i];
    }
    return screen.querySelector('.recipe-detail-view') || null;
  }

  function rerenderPremiumDetail(){
    var id = window.currentRecipeId;
    if(!id || !Array.isArray(window.recipesData)) return false;
    var r = findRecipe(id);
    var dc = findDetailContainer(r);
    if(!r || !dc) return false;
    if(!Array.isArray(r.ingredients)) r.ingredients = [];
    if(!Array.isArray(r.steps)) r.steps = [];
    window.checkedIngredients = window.checkedIngredients || {};
    var ingChecked = checkedSet(window.checkedIngredients, r.id);
    var stepChecked = checkedSet(checkedSteps, r.id);
    window.checkedIngredients[r.id] = ingChecked;
    checkedSteps[r.id] = stepChecked;

    var catEmoji = (window.CAT_EMOJIS && window.CAT_EMOJIS[r.cat]) || r.emoji || '🍴';
    var heroHtml = r.photo
      ? '<div class="recipe-hero-premium"><img class="recipe-hero-img-premium" src="'+esc(r.photo)+'"><button id="recipe-photo-btn" style="position:absolute;bottom:10px;right:10px;background:rgba(0,0,0,.6);color:#fff;border:none;border-radius:20px;padding:6px 14px;font-size:12px;font-weight:800">📷 Wijzigen</button></div>'
      : '<div class="recipe-hero-premium"><span>'+esc(catEmoji)+'</span><button id="recipe-photo-btn" style="position:absolute;bottom:10px;right:10px;background:rgba(0,0,0,.45);color:#fff;border:none;border-radius:20px;padding:6px 14px;font-size:12px;font-weight:800">📷 Foto</button></div>';

    var manageHtml = '<div class="recipe-manage-row-inline"><button class="primary" id="recipe-manage-edit">✏️ Bewerken</button><button id="recipe-manage-photo">🖼️ Foto</button><button class="danger" id="recipe-manage-delete">🗑️ Verwijderen</button></div>';

    var ingsHtml = r.ingredients.length ? r.ingredients.map(function(ing, i){
      var done = ingChecked.has(i);
      return '<label class="recipe-ing-label" data-ing-idx="'+i+'"><div class="recipe-ing-circle '+(done?'done':'')+'">'+(done?'<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.5"><polyline points="20 6 9 17 4 12"/></svg>':'')+'</div><span class="recipe-ing-text '+(done?'done':'')+'">'+esc(ing)+'</span></label>';
    }).join('') : '<p class="recipe-ing-text" style="padding:10px 0">Geen ingrediënten opgegeven</p>';

    var stepsHtml = r.steps.length ? r.steps.map(function(step, i){
      var done = stepChecked.has(i);
      return '<label class="recipe-step-check-row" data-step-idx="'+i+'"><div class="recipe-step-circle '+(done?'done':'')+'">'+(done?'<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.5"><polyline points="20 6 9 17 4 12"/></svg>':'')+'</div><div class="recipe-step-num-premium">'+(i+1)+'</div><div class="recipe-step-check-text '+(done?'done':'')+'">'+esc(step)+'</div></label>';
    }).join('') : '<p class="recipe-step-check-text" style="padding:10px 0">Geen bereidingsstappen opgegeven</p>';

    dc.innerHTML = heroHtml
      + '<div class="recipe-title-area" style="padding:22px 16px 8px"><h2>'+esc(r.name)+'</h2><div style="display:flex;gap:8px;flex-wrap:wrap"><span class="recipe-tag">📂 '+esc(r.cat || 'Diner')+'</span><span class="recipe-tag">⏱ '+esc(r.time || 20)+' min</span><span class="recipe-tag">👥 '+esc(r.persons || 4)+' pers</span></div></div>'
      + manageHtml
      + '<div class="recipe-ings-wrap"><div class="recipe-section-header">Ingrediënten</div>'+ingsHtml+'<button class="recipe-shop-btn" id="to-shop-btn">🛒 Zet alles op boodschappenlijst</button></div>'
      + '<div class="recipe-steps-wrap"><div class="recipe-section-header">Bereiding</div>'+stepsHtml+'</div>'
      + (r.notes ? '<div class="recipe-notes-wrap"><div class="recipe-notes-label">💡 Notities</div><div class="recipe-notes-body">'+esc(r.notes)+'</div></div>' : '')
      + '<div style="height:40px"></div>';

    dc.querySelectorAll('[data-ing-idx]').forEach(function(row){
      row.onclick = function(){
        var idx = parseInt(row.getAttribute('data-ing-idx'),10);
        if(ingChecked.has(idx)) ingChecked.delete(idx); else ingChecked.add(idx);
        rerenderPremiumDetail();
      };
    });
    dc.querySelectorAll('[data-step-idx]').forEach(function(row){
      row.onclick = function(){
        var idx = parseInt(row.getAttribute('data-step-idx'),10);
        if(stepChecked.has(idx)) stepChecked.delete(idx); else stepChecked.add(idx);
        rerenderPremiumDetail();
      };
    });

    var pBtn = dc.querySelector('#recipe-photo-btn');
    var edit = dc.querySelector('#recipe-manage-edit');
    var photo = dc.querySelector('#recipe-manage-photo');
    var del = dc.querySelector('#recipe-manage-delete');
    if(pBtn && typeof window.openRecipePhotoSheet === 'function') pBtn.onclick = function(){ window.openRecipePhotoSheet(r.id); };
    if(edit && typeof window.openRecipeEditSheet === 'function') edit.onclick = function(){ window.openRecipeEditSheet(r.id); };
    if(photo && typeof window.openRecipePhotoSheet === 'function') photo.onclick = function(){ window.openRecipePhotoSheet(r.id); };
    if(del && typeof window.deleteRecipeManaged === 'function') del.onclick = function(){ window.deleteRecipeManaged(r.id); };
    var sBtn = dc.querySelector('#to-shop-btn');
    if(sBtn && typeof window.addRecipeToShop === 'function') sBtn.onclick = function(){ window.addRecipeToShop(r.id); };
    return true;
  }

  function wrapDetail(){
    if(typeof window.openRecipeDetail !== 'function' || window.openRecipeDetail.__premiumCookingWrappedV375) return;
    var original = window.openRecipeDetail;
    window.openRecipeDetail = function(id){
      var result = original.apply(this, arguments);
      window.currentRecipeId = id;
      [30,120,300,700].forEach(function(delay){ setTimeout(rerenderPremiumDetail, delay); });
      return result;
    };
    window.openRecipeDetail.__premiumCookingWrappedV375 = true;
  }

  function boot(){
    ensureStyles();
    ensureRecipeStack();
    installAddButton();
    wrapDetail();
    [100,300,800,1500,2500,4000].forEach(function(delay){ setTimeout(function(){ installAddButton(); wrapDetail(); rerenderPremiumDetail(); }, delay); });
    window.addEventListener('familyapp:food:recipes-updated', function(){ installAddButton(); rerenderPremiumDetail(); });
  }

  window.RecipePremiumCookingBridge = { version:VERSION, boot:boot, openRecipeAdd:openRecipeAdd, installAddButton:installAddButton, rerenderPremiumDetail:rerenderPremiumDetail };
  window.openRecipeAdd = openRecipeAdd;
  window.openRecipeAddDirect = openRecipeAdd;

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
