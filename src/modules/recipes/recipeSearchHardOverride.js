'use strict';
// ============================================================
// RECIPE SEARCH HARD OVERRIDE v0.380
// Replaces broken/legacy recipe list behavior:
// - removes Pasta Pesto featured glitch
// - creates a fresh stable search bar
// - renders recipe grid directly from recipesData
// - keeps existing category chips working
// ============================================================

(function(){
  var VERSION = '0.380';
  var STYLE_ID = 'recipe-search-hard-override-style';
  var search = '';
  var booted = false;

  function esc(v){
    return String(v == null ? '' : v)
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;')
      .replace(/'/g,'&#039;');
  }

  function norm(v){ return String(v || '').toLowerCase().trim(); }

  function ensureStyles(){
    if(document.getElementById(STYLE_ID)) return;
    var style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = [
      '.recipe-legacy-featured-force-hidden{display:none!important;height:0!important;overflow:hidden!important;margin:0!important;padding:0!important}',
      '.recipe-search-hard-wrap{padding:0 16px 14px!important;margin-top:0!important}',
      '.recipe-search-hard-box{height:48px!important;border-radius:18px!important;background:#fff!important;border:1px solid var(--c-border,#edf0ec)!important;display:flex!important;align-items:center!important;gap:10px!important;padding:0 14px!important;box-shadow:0 8px 24px rgba(17,24,39,.055)!important}',
      '.recipe-search-hard-box span{font-size:18px!important;opacity:.85!important}',
      '.recipe-search-hard-box input{border:0!important;outline:0!important;background:transparent!important;flex:1!important;min-width:0!important;font-size:15px!important;font-weight:850!important;color:var(--c-text,#111827)!important}',
      '.recipe-search-hard-box input::placeholder{color:var(--c-text2,#667085)!important}',
      '#recipe-grid.recipe-hard-grid{display:grid!important;grid-template-columns:1fr 1fr!important;gap:12px!important;padding:0 16px 120px!important}',
      '#recipe-grid.recipe-hard-grid .recipe-card{border-radius:22px!important;overflow:hidden!important;background:#fff!important;box-shadow:0 8px 22px rgba(17,24,39,.07)!important;border:1px solid rgba(17,24,39,.055)!important}',
      '#recipe-grid.recipe-hard-grid .recipe-card-thumb{height:132px!important;background:#f4f7f2!important;display:flex!important;align-items:center!important;justify-content:center!important;overflow:hidden!important}',
      '#recipe-grid.recipe-hard-grid .recipe-card-thumb img{width:100%!important;height:100%!important;object-fit:cover!important;display:block!important}',
      '#recipe-grid.recipe-hard-grid .recipe-card-body{padding:12px!important}',
      '#recipe-grid.recipe-hard-grid .recipe-card-name{font-size:18px!important;line-height:1.12!important;font-weight:950!important;color:var(--c-text,#111827)!important;margin-bottom:8px!important}',
      '#recipe-grid.recipe-hard-grid .recipe-card-meta{display:flex!important;gap:8px!important;align-items:center!important;flex-wrap:wrap!important;font-size:12px!important;font-weight:850!important;color:var(--c-text2,#667085)!important}',
      '#recipe-grid.recipe-hard-grid .recipe-cat-badge{background:var(--c-surface2,#f4f7f2)!important;border-radius:999px!important;padding:4px 8px!important}',
      '.recipe-hard-empty{grid-column:1/-1;text-align:center;padding:42px 20px;color:var(--c-text2,#667085);font-weight:850}'
    ].join('\n');
    document.head.appendChild(style);
  }

  function getRecipes(){
    if(Array.isArray(window.recipesData)) return window.recipesData;
    try { if(Array.isArray(recipesData)) return recipesData; } catch(e) {}
    return [];
  }

  function setRecipes(arr){
    window.recipesData = arr;
    try { recipesData = arr; } catch(e) {}
  }

  var IMG = 'https://images.unsplash.com/';
  var FALLBACKS = [
    IMG+'photo-1529042410759-befb1204b468?auto=format&fit=crop&w=1200&q=85',
    IMG+'photo-1498579397066-22750a3cb424?auto=format&fit=crop&w=1200&q=85',
    IMG+'photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=1200&q=85',
    IMG+'photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=85',
    IMG+'photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=1200&q=85',
    IMG+'photo-1547592166-23ac45744acd?auto=format&fit=crop&w=1200&q=85'
  ];

  function fallback(r){ return r.photo || FALLBACKS[(Number(r.id)||0) % FALLBACKS.length]; }

  function hideLegacyFeatured(){
    var screen = document.getElementById('screen-recipes');
    if(!screen) return;
    Array.prototype.slice.call(screen.children || []).forEach(function(el){
      if(el.id === 'recipe-list-view' || el.id === 'recipe-detail-view' || el.id === 'recipe-editor-view' || el.id === 'recipe-import-view') return;
      var text = norm(el.textContent);
      if(text.indexOf('pasta pesto') > -1 && (text.indexOf('20 min') > -1 || text.indexOf('makkelijk') > -1)){
        el.classList.add('recipe-legacy-featured-force-hidden');
      }
    });
    var list = document.getElementById('recipe-list-view');
    if(list){
      Array.prototype.slice.call(list.children || []).forEach(function(el){
        if(el.id === 'recipe-grid' || el.id === 'recipe-search-hard-wrap' || el.classList.contains('recipe-cat-row')) return;
        var text = norm(el.textContent);
        if(text.indexOf('pasta pesto') > -1 && (text.indexOf('20 min') > -1 || text.indexOf('makkelijk') > -1)){
          el.classList.add('recipe-legacy-featured-force-hidden');
        }
      });
    }
  }

  function normalizeData(){
    var arr = getRecipes();
    arr.forEach(function(r, i){
      if(!r.id) r.id = i + 1;
      if(!Array.isArray(r.ingredients)) r.ingredients = String(r.ingredients || '').split(/\n|;|\u2022|\s\-\s/g).map(function(x){ return x.trim(); }).filter(Boolean);
      if(!Array.isArray(r.steps)) r.steps = String(r.steps || '').split(/\n|;|\u2022/g).map(function(x){ return x.trim(); }).filter(Boolean);
      if(!r.photo) r.photo = fallback(r);
    });
    setRecipes(arr);
  }

  function currentCat(){
    try { if(typeof window.recipeCatFilter !== 'undefined') return window.recipeCatFilter || 'all'; } catch(e) {}
    try { if(typeof recipeCatFilter !== 'undefined') return recipeCatFilter || 'all'; } catch(e) {}
    return 'all';
  }

  function setCat(cat){
    window.recipeCatFilter = cat || 'all';
    try { recipeCatFilter = cat || 'all'; } catch(e) {}
  }

  function installSearch(){
    var grid = document.getElementById('recipe-grid');
    if(!grid || !grid.parentNode) return;
    var old = document.getElementById('recipe-search-direct');
    if(old && old.parentNode) old.parentNode.removeChild(old);
    var wrap = document.getElementById('recipe-search-hard-wrap');
    if(!wrap){
      wrap = document.createElement('div');
      wrap.id = 'recipe-search-hard-wrap';
      wrap.className = 'recipe-search-hard-wrap';
      grid.parentNode.insertBefore(wrap, grid);
    }
    wrap.innerHTML = '<div class="recipe-search-hard-box"><span>🔎</span><input id="recipe-search-hard-input" placeholder="Zoek recept, ingrediënt of keuken" value="'+esc(search)+'"></div>';
    var input = document.getElementById('recipe-search-hard-input');
    if(input){
      input.oninput = function(){ search = input.value || ''; renderGrid(); };
    }
  }

  function patchCategoryChips(){
    document.querySelectorAll('.recipe-cat-chip,[data-recipe-cat],.recipe-category-chip').forEach(function(chip){
      if(chip.__recipeHardPatched) return;
      chip.__recipeHardPatched = true;
      chip.addEventListener('click', function(){
        var cat = chip.getAttribute('data-cat') || chip.getAttribute('data-recipe-cat') || chip.textContent || 'all';
        cat = cat.replace(/[\u{1F300}-\u{1FAFF}]/gu,'').trim();
        if(/^alle$/i.test(cat)) cat = 'all';
        setTimeout(function(){ setCat(cat); renderGrid(); }, 10);
      });
    });
  }

  function recipeMatches(r){
    var cat = currentCat();
    var catOk = cat === 'all' || !cat || norm(r.cat) === norm(cat);
    var q = norm(search);
    var hay = norm([r.name, r.cat, r.cuisine, r.notes, (r.ingredients||[]).join(' ')].join(' '));
    return catOk && (!q || hay.indexOf(q) > -1);
  }

  function cardHtml(r){
    var photo = fallback(r);
    return '<article class="recipe-card" data-rid="'+esc(r.id)+'">'
      + '<div class="recipe-card-thumb"><img src="'+esc(photo)+'" onerror="this.style.display=\'none\';this.parentNode.innerHTML=\'<span style=&quot;font-size:42px&quot;>🍽️</span>\'"></div>'
      + '<div class="recipe-card-body"><div class="recipe-card-name">'+esc(r.name)+'</div>'
      + '<div class="recipe-card-meta"><span class="recipe-cat-badge">'+esc(r.cat || 'Diner')+'</span><span>⏱ '+esc(r.time || 20)+'m</span><span>👥 '+esc(r.persons || 4)+'p</span></div></div>'
      + '</article>';
  }

  function renderGrid(){
    ensureStyles();
    normalizeData();
    hideLegacyFeatured();
    installSearch();
    patchCategoryChips();
    var grid = document.getElementById('recipe-grid');
    if(!grid) return false;
    var data = getRecipes().filter(recipeMatches);
    grid.classList.add('recipe-hard-grid');
    if(!data.length){
      grid.innerHTML = '<div class="recipe-hard-empty">Geen recepten gevonden.</div>';
      return true;
    }
    grid.innerHTML = data.map(cardHtml).join('');
    grid.querySelectorAll('[data-rid]').forEach(function(card){
      card.onclick = function(){
        var id = parseInt(card.getAttribute('data-rid'),10);
        if(typeof window.openRecipeDetail === 'function') window.openRecipeDetail(id);
      };
    });
    return true;
  }

  function overrideRender(){
    window.renderRecipeGrid = renderGrid;
    try { renderRecipeGrid = renderGrid; } catch(e) {}
  }

  function boot(){
    ensureStyles();
    overrideRender();
    normalizeData();
    hideLegacyFeatured();
    renderGrid();
    if(booted) return;
    booted = true;
    [100,300,700,1200,2200,4000].forEach(function(delay){
      setTimeout(function(){ overrideRender(); hideLegacyFeatured(); renderGrid(); }, delay);
    });
  }

  window.RecipeSearchHardOverride = { version:VERSION, boot:boot, renderGrid:renderGrid, hideLegacyFeatured:hideLegacyFeatured };
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
