'use strict';
// ============================================================
// RECIPE NATIVE SEARCH + CHECKBOX FIX v0.383
// Small safe patch:
// - does NOT rerender the recipe grid globally
// - adds a DOM-only search input that hides/shows existing cards
// - replaces openRecipeDetail with a native checkbox detail renderer
// ============================================================

(function(){
  var VERSION = '0.383';
  var STYLE_ID = 'recipe-native-search-checkbox-style';
  var query = '';

  function ensureStyles(){
    if(document.getElementById(STYLE_ID)) return;
    var s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = [
      '.recipe-native-search{padding:0 16px 12px!important}',
      '.recipe-native-search input{width:100%!important;height:46px!important;border-radius:18px!important;border:1px solid var(--c-border,#edf0ec)!important;background:#fff!important;padding:0 14px!important;font-size:15px!important;font-weight:800!important;box-shadow:0 8px 22px rgba(17,24,39,.045)!important}',
      '.recipe-native-hidden{display:none!important}',
      '.recipe-check-row{display:flex!important;align-items:flex-start!important;gap:12px!important;padding:12px 0!important;border-bottom:1px solid rgba(17,24,39,.07)!important;cursor:pointer!important}',
      '.recipe-check-row:last-child{border-bottom:0!important}',
      '.recipe-check-dot{width:28px!important;height:28px!important;min-width:28px!important;border-radius:50%!important;border:2px solid var(--c-border,#d8dfd6)!important;background:#fff!important;display:flex!important;align-items:center!important;justify-content:center!important;color:#fff!important;font-size:16px!important;font-weight:950!important}',
      '.recipe-check-row.done .recipe-check-dot{background:var(--c-primary,#3f7f2f)!important;border-color:var(--c-primary,#3f7f2f)!important}',
      '.recipe-check-text{font-size:16px!important;line-height:1.45!important;font-weight:650!important;color:var(--c-text,#111827)!important;flex:1!important}',
      '.recipe-check-row.done .recipe-check-text{text-decoration:line-through!important;text-decoration-thickness:2px!important;color:var(--c-text3,#9aa3af)!important}',
      '.recipe-step-check-card{background:#fff!important;border:1px solid var(--c-border,#edf0ec)!important;border-radius:16px!important;margin-bottom:8px!important;padding:12px!important}',
      '.recipe-native-actions{display:flex!important;gap:8px!important;flex-wrap:wrap!important;padding:0 16px 14px!important}',
      '.recipe-native-actions button{border:0!important;border-radius:999px!important;padding:10px 13px!important;font-size:12px!important;font-weight:950!important;background:var(--c-surface2,#f4f7f2)!important;color:var(--c-text,#111827)!important}',
      '.recipe-native-actions .primary{background:var(--c-primary,#3f7f2f)!important;color:#fff!important}',
      '.recipe-native-actions .danger{background:#fff1f1!important;color:#c23333!important}'
    ].join('\n');
    document.head.appendChild(s);
  }

  function getRecipes(){
    if(Array.isArray(window.recipesData)) return window.recipesData;
    try { if(Array.isArray(recipesData)) return recipesData; } catch(e) {}
    return [];
  }

  function getRecipe(id){ return getRecipes().find(function(r){ return Number(r.id) === Number(id); }); }
  function esc(v){ return String(v == null ? '' : v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;'); }
  function norm(v){ return String(v || '').toLowerCase().trim(); }
  function toList(v){ return Array.isArray(v) ? v.map(function(x){ return String(x||'').trim(); }).filter(Boolean) : String(v||'').split(/\n|\r|;|\u2022|\s\-\s/g).map(function(x){ return x.trim(); }).filter(Boolean); }

  function ensureSets(id){
    window.checkedIngredients = window.checkedIngredients || {};
    window.checkedRecipeSteps = window.checkedRecipeSteps || {};
    if(!window.checkedIngredients[id]) window.checkedIngredients[id] = new Set();
    if(!window.checkedRecipeSteps[id]) window.checkedRecipeSteps[id] = new Set();
    if(Array.isArray(window.checkedIngredients[id])) window.checkedIngredients[id] = new Set(window.checkedIngredients[id]);
    if(Array.isArray(window.checkedRecipeSteps[id])) window.checkedRecipeSteps[id] = new Set(window.checkedRecipeSteps[id]);
  }

  function checkRows(id, type, items){
    ensureSets(id);
    var set = type === 'step' ? window.checkedRecipeSteps[id] : window.checkedIngredients[id];
    return items.map(function(item, idx){
      var done = set.has(idx);
      var label = type === 'step' ? (idx+1)+'. '+item : item;
      return '<label class="recipe-check-row '+(type==='step'?'recipe-step-check-card ':'')+(done?'done':'')+'" data-recipe-check-type="'+type+'" data-recipe-check-idx="'+idx+'">'
        + '<span class="recipe-check-dot">'+(done?'✓':'')+'</span>'
        + '<span class="recipe-check-text">'+esc(label)+'</span>'
        + '</label>';
    }).join('');
  }

  function renderDetail(id){
    ensureStyles();
    var r = getRecipe(id);
    if(!r) return false;
    window.currentRecipeId = id;
    try { currentRecipeId = id; } catch(e) {}
    r.ingredients = toList(r.ingredients);
    r.steps = toList(r.steps);
    ensureSets(id);

    var listView = document.getElementById('recipe-list-view');
    var detailView = document.getElementById('recipe-detail-view');
    var editorView = document.getElementById('recipe-editor-view');
    var importView = document.getElementById('recipe-import-view');
    if(listView) listView.style.display = 'none';
    if(detailView) detailView.style.display = 'block';
    if(editorView) editorView.style.display = 'none';
    if(importView) importView.style.display = 'none';

    var dc = document.getElementById('recipe-detail-content');
    if(!dc) return false;
    var emoji = (window.CAT_EMOJIS && window.CAT_EMOJIS[r.cat]) || (typeof CAT_EMOJIS !== 'undefined' && CAT_EMOJIS[r.cat]) || '🍴';
    var hero = r.photo
      ? '<div class="recipe-hero-wrap" style="width:100%;height:210px;overflow:hidden;position:relative"><img src="'+esc(r.photo)+'" style="width:100%;height:100%;object-fit:cover"><button id="recipe-photo-btn" style="position:absolute;bottom:10px;right:10px;background:rgba(0,0,0,.6);color:#fff;border:none;border-radius:20px;padding:6px 14px;font-size:12px;font-weight:800">📷 Wijzigen</button></div>'
      : '<div class="recipe-hero-wrap" style="text-align:center;padding:28px 16px 12px;position:relative"><div style="font-size:64px;line-height:1">'+esc(emoji)+'</div><button id="recipe-photo-btn" style="margin-top:10px;background:var(--c-surface);color:var(--c-text2);border:1px solid var(--c-border);border-radius:20px;padding:6px 14px;font-size:11px;font-weight:700">📷 Foto toevoegen</button></div>';

    dc.innerHTML = hero
      + '<div class="recipe-title-area"><h2>'+esc(r.name)+'</h2><div style="display:flex;gap:8px;flex-wrap:wrap"><span class="recipe-tag">📂 '+esc(r.cat||'Diner')+'</span><span class="recipe-tag">⏱ '+esc(r.time||20)+' min</span><span class="recipe-tag">👥 '+esc(r.persons||4)+' pers</span></div></div>'
      + '<div class="recipe-native-actions"><button class="primary" id="recipe-native-edit">✏️ Bewerken</button><button id="recipe-native-photo">🖼️ Foto</button><button class="danger" id="recipe-native-delete">🗑️ Verwijderen</button></div>'
      + '<div class="recipe-ings-wrap"><div class="recipe-section-header">Ingrediënten</div>'+(r.ingredients.length ? checkRows(id,'ingredient',r.ingredients) : '<p class="recipe-ing-text" style="padding:10px 0">Geen ingrediënten opgegeven</p>')+'<button class="recipe-shop-btn" id="to-shop-btn">🛒 Zet alles op boodschappenlijst</button></div>'
      + '<div class="recipe-steps-wrap"><div class="recipe-section-header">Bereiding</div>'+(r.steps.length ? checkRows(id,'step',r.steps) : '<p class="recipe-step-text" style="padding:10px 0">Geen bereidingsstappen opgegeven</p>')+'</div>'
      + (r.notes ? '<div class="recipe-notes-wrap"><div class="recipe-notes-label">💡 Notities</div><div class="recipe-notes-body">'+esc(r.notes)+'</div></div>' : '')
      + '<div style="height:40px"></div>';

    dc.querySelectorAll('[data-recipe-check-type]').forEach(function(row){
      row.onclick = function(){
        var type = row.getAttribute('data-recipe-check-type');
        var idx = parseInt(row.getAttribute('data-recipe-check-idx'),10);
        var set = type === 'step' ? window.checkedRecipeSteps[id] : window.checkedIngredients[id];
        if(set.has(idx)) set.delete(idx); else set.add(idx);
        row.classList.toggle('done', set.has(idx));
        var dot = row.querySelector('.recipe-check-dot');
        if(dot) dot.textContent = set.has(idx) ? '✓' : '';
      };
    });

    var p = document.getElementById('recipe-photo-btn');
    var ph = document.getElementById('recipe-native-photo');
    [p,ph].forEach(function(btn){ if(btn) btn.onclick = function(){ if(typeof window.openRecipePhotoSheet === 'function') window.openRecipePhotoSheet(id); }; });
    var edit = document.getElementById('recipe-native-edit');
    if(edit) edit.onclick = function(){ if(typeof window.openRecipeEditor === 'function') window.openRecipeEditor(id); };
    var del = document.getElementById('recipe-native-delete');
    if(del) del.onclick = function(){
      if(!confirm('Recept "'+r.name+'" verwijderen?')) return;
      var next = getRecipes().filter(function(x){ return Number(x.id) !== Number(id); });
      window.recipesData = next;
      try { recipesData = next; } catch(e) {}
      if(typeof window.showRecipeListView === 'function') window.showRecipeListView();
      if(typeof window.renderRecipeGrid === 'function') window.renderRecipeGrid();
    };
    var shop = document.getElementById('to-shop-btn');
    if(shop && typeof window.addRecipeToShop === 'function') shop.onclick = function(){ window.addRecipeToShop(id); };
    return true;
  }

  function patchDetailFunction(){
    window.openRecipeDetail = renderDetail;
    try { openRecipeDetail = renderDetail; } catch(e) {}
  }

  function installSearch(){
    ensureStyles();
    var grid = document.getElementById('recipe-grid');
    if(!grid || !grid.parentNode || document.getElementById('recipe-native-search')) return;
    var wrap = document.createElement('div');
    wrap.id = 'recipe-native-search';
    wrap.className = 'recipe-native-search';
    wrap.innerHTML = '<input id="recipe-native-search-input" placeholder="🔎 Zoek recept" value="'+esc(query)+'">';
    grid.parentNode.insertBefore(wrap, grid);
    var input = document.getElementById('recipe-native-search-input');
    input.oninput = function(){ query = input.value || ''; filterCards(); };
  }

  function filterCards(){
    var q = norm(query);
    var cards = Array.prototype.slice.call(document.querySelectorAll('#recipe-grid [data-rid]'));
    var list = getRecipes();
    cards.forEach(function(card){
      var id = card.getAttribute('data-rid');
      var r = list.find(function(x){ return String(x.id) === String(id); });
      var text = norm([card.textContent, r && r.name, r && r.cat, r && r.cuisine, r && (r.ingredients||[]).join(' ')].join(' '));
      card.classList.toggle('recipe-native-hidden', !!q && text.indexOf(q) === -1);
    });
  }

  function patchGridClicks(){
    document.querySelectorAll('#recipe-grid [data-rid]').forEach(function(card){
      card.onclick = function(){ renderDetail(parseInt(card.getAttribute('data-rid'),10)); };
    });
  }

  function boot(){
    ensureStyles();
    patchDetailFunction();
    installSearch();
    patchGridClicks();
    [120,400,900,1800,3200].forEach(function(delay){ setTimeout(function(){ patchDetailFunction(); installSearch(); patchGridClicks(); filterCards(); }, delay); });
  }

  window.RecipeNativeSearchAndCheckboxFix = { version:VERSION, boot:boot, renderDetail:renderDetail, filterCards:filterCards };
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
