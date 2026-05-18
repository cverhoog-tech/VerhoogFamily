'use strict';
// ============================================================
// RECIPE SEARCH FILTER BRIDGE v0.368
// Safe search + cuisine/category filters.
// Never mutates window.recipesData during render.
// ============================================================

(function(){
  var VERSION = '0.368';
  var STYLE_ID = 'recipe-search-filter-style';
  var state = { query:'', filter:'all' };
  var rendering = false;

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
      '.recipe-filter-wrap{padding:0 16px 14px!important;margin-top:-4px!important}',
      '.recipe-search-box{height:46px!important;border-radius:18px!important;background:var(--c-surface,#fff)!important;border:1px solid var(--c-border,#edf0ec)!important;display:flex!important;align-items:center!important;gap:10px!important;padding:0 14px!important;box-shadow:0 8px 22px rgba(17,24,39,.045)!important}',
      '.recipe-search-box span{font-size:18px!important;opacity:.8!important}',
      '.recipe-search-box input{border:0!important;outline:none!important;background:transparent!important;flex:1!important;font-size:15px!important;font-weight:750!important;color:var(--c-text,#111827)!important;min-width:0!important}',
      '.recipe-search-box input::placeholder{color:var(--c-text2,#667085)!important;font-weight:700!important}',
      '.recipe-filter-row{display:flex!important;gap:8px!important;overflow-x:auto!important;scrollbar-width:none!important;-webkit-overflow-scrolling:touch!important;padding:10px 0 2px!important}',
      '.recipe-filter-row::-webkit-scrollbar{display:none!important}',
      '.recipe-filter-chip{border:0!important;border-radius:999px!important;padding:9px 13px!important;background:var(--c-surface2,#f4f7f2)!important;color:var(--c-text2,#667085)!important;font-size:12px!important;font-weight:950!important;white-space:nowrap!important;cursor:pointer!important}',
      '.recipe-filter-chip.active{background:var(--c-primary,#3f7f2f)!important;color:#fff!important;box-shadow:0 8px 18px rgba(63,127,47,.18)!important}',
      '.recipe-filter-empty{grid-column:1/-1;text-align:center;padding:42px 22px;color:var(--c-text2,#667085);font-weight:800}',
      '.recipe-legacy-featured-hidden{display:none!important}',
      '#recipe-grid.recipe-premium-grid{display:grid!important;grid-template-columns:1fr 1fr!important;gap:14px!important;padding:0 16px 120px!important}'
    ].join('\n');
    document.head.appendChild(style);
  }

  function normalize(v){ return String(v || '').toLowerCase().trim(); }

  function hideLegacyFeatured(){
    var screen = document.getElementById('screen-recipes');
    if(!screen) return;
    Array.prototype.slice.call(screen.querySelectorAll('*')).forEach(function(node){
      if(node.id === 'recipe-grid' || node.id === 'recipe-filter-wrap') return;
      if(node.querySelector && node.querySelector('#recipe-grid,.recipe-premium-card,.recipe-card')) return;
      var text = normalize(node.textContent);
      if(text.indexOf('pasta pesto') > -1 && (text.indexOf('20 min') > -1 || text.indexOf('makkelijk') > -1)){
        node.classList.add('recipe-legacy-featured-hidden');
      }
    });
  }

  function matchesFilter(recipe){
    var f = state.filter;
    if(f === 'all') return true;
    if(['Ontbijt','Lunch','Diner','Snack','Dessert','Bakken'].indexOf(f) > -1) return recipe.cat === f;
    return normalize(recipe.cuisine) === normalize(f);
  }

  function matchesSearch(recipe){
    var q = normalize(state.query);
    if(!q) return true;
    var hay = [recipe.name, recipe.cat, recipe.cuisine, recipe.notes, (recipe.ingredients || []).join(' ')].join(' ').toLowerCase();
    return hay.indexOf(q) > -1;
  }

  function filteredRecipes(){
    if(!Array.isArray(window.recipesData)) return [];
    return window.recipesData.filter(function(r){ return r && matchesFilter(r) && matchesSearch(r); });
  }

  function fallbackEmoji(r){
    return (r && (r.emoji || (window.CAT_EMOJIS && window.CAT_EMOJIS[r.cat]))) || '🍴';
  }

  function cardHtml(r){
    var emoji = fallbackEmoji(r);
    var photo = r.photo || '';
    var bg = photo
      ? '<div class="recipe-premium-bg" style="background-image:url(\''+esc(photo)+'\')"></div>'
      : '<div class="recipe-premium-emoji-fallback">'+esc(emoji)+'</div>';
    return '<article class="recipe-premium-card" data-rid="'+esc(r.id)+'">'
      + bg
      + '<div class="recipe-premium-overlay"></div>'
      + '<div class="recipe-premium-cuisine">'+esc(r.cuisine || r.cat || 'Recept')+'</div>'
      + '<div class="recipe-premium-time">⏱ '+esc(r.time || 20)+'m</div>'
      + '<div class="recipe-premium-body">'
      + '<div class="recipe-premium-title">'+esc(r.name)+'</div>'
      + '<div class="recipe-premium-meta"><span class="recipe-premium-pill">'+esc(emoji)+' '+esc(r.cat || 'Diner')+'</span><span class="recipe-premium-pill">👥 '+esc(r.persons || 4)+'p</span></div>'
      + '</div></article>';
  }

  function renderGrid(){
    if(rendering) return false;
    var grid = document.getElementById('recipe-grid');
    if(!grid) return false;
    rendering = true;
    try {
      ensureStyles();
      hideLegacyFeatured();
      var data = filteredRecipes();
      grid.classList.add('recipe-premium-grid');
      if(!data.length){
        grid.innerHTML = '<div class="recipe-filter-empty">Geen recepten gevonden. Probeer een andere zoekterm of filter.</div>';
      } else {
        grid.innerHTML = data.map(cardHtml).join('');
        grid.querySelectorAll('[data-rid]').forEach(function(card){
          card.onclick = function(){
            var id = parseInt(card.getAttribute('data-rid'),10);
            if(typeof window.openRecipeDetail === 'function') window.openRecipeDetail(id);
          };
        });
      }
      return true;
    } catch(error){
      console.warn('[RecipeSearchFilterBridge] render failed', error);
      if(typeof window.renderRecipeGrid === 'function') {
        try { window.renderRecipeGrid(); } catch(e) {}
      }
      return false;
    } finally {
      rendering = false;
    }
  }

  function chips(){
    var filters = [
      ['all','Alle'], ['Diner','Diner'], ['Turks','🇹🇷 Turks'], ['Italiaans','🇮🇹 Italiaans'], ['Nederlands','🇳🇱 Nederlands'], ['Surinaams','🇸🇷 Surinaams'], ['Indonesisch','🇮🇩 Indonesisch'], ['Lunch','Lunch'], ['Ontbijt','Ontbijt'], ['Snack','Snack'], ['Dessert','Dessert'], ['Bakken','Bakken']
    ];
    return filters.map(function(item){ return '<button type="button" class="recipe-filter-chip '+(state.filter===item[0]?'active':'')+'" data-recipe-filter="'+esc(item[0])+'">'+esc(item[1])+'</button>'; }).join('');
  }

  function install(){
    ensureStyles();
    hideLegacyFeatured();
    var grid = document.getElementById('recipe-grid');
    if(!grid || !grid.parentNode) return;
    var wrap = document.getElementById('recipe-filter-wrap');
    if(!wrap){
      wrap = document.createElement('div');
      wrap.id = 'recipe-filter-wrap';
      wrap.className = 'recipe-filter-wrap';
      grid.parentNode.insertBefore(wrap, grid);
    }
    wrap.innerHTML = '<div class="recipe-search-box"><span>🔎</span><input id="recipe-search-input" placeholder="Zoek op gerecht, ingrediënt of keuken" value="'+esc(state.query)+'"></div><div class="recipe-filter-row">'+chips()+'</div>';
    var input = wrap.querySelector('#recipe-search-input');
    if(input){ input.oninput = function(){ state.query = input.value || ''; renderGrid(); }; }
    wrap.querySelectorAll('[data-recipe-filter]').forEach(function(btn){
      btn.onclick = function(){ state.filter = btn.getAttribute('data-recipe-filter') || 'all'; install(); renderGrid(); };
    });
    renderGrid();
  }

  function boot(){
    install();
    [120,400,900,1600,2600,4200].forEach(function(delay){ setTimeout(install, delay); });
    window.addEventListener('familyapp:food:recipes-updated', function(){ setTimeout(install, 80); });
  }

  window.RecipeSearchFilterBridge = { version:VERSION, boot:boot, install:install, renderGrid:renderGrid, filteredRecipes:filteredRecipes };
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
