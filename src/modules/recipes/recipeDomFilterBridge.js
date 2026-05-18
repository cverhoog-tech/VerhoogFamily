'use strict';
// ============================================================
// RECIPE DOM FILTER BRIDGE v0.371
// Safe search/filter layer. Does not rerender, does not mutate recipesData.
// Only hides/shows existing recipe cards in the DOM.
// ============================================================

(function(){
  var VERSION = '0.371';
  var STYLE_ID = 'recipe-dom-filter-style';
  var state = { query:'', filter:'all' };

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
      '.recipe-dom-filter-wrap{padding:0 16px 14px!important;margin-top:0!important}',
      '.recipe-dom-search{height:46px!important;border-radius:18px!important;background:var(--c-surface,#fff)!important;border:1px solid var(--c-border,#edf0ec)!important;display:flex!important;align-items:center!important;gap:10px!important;padding:0 14px!important;box-shadow:0 8px 22px rgba(17,24,39,.045)!important}',
      '.recipe-dom-search input{border:0!important;outline:0!important;background:transparent!important;flex:1!important;min-width:0!important;font-size:15px!important;font-weight:800!important;color:var(--c-text,#111827)!important}',
      '.recipe-dom-filter-row{display:flex!important;gap:8px!important;overflow-x:auto!important;scrollbar-width:none!important;-webkit-overflow-scrolling:touch!important;padding:10px 0 2px!important}',
      '.recipe-dom-filter-row::-webkit-scrollbar{display:none!important}',
      '.recipe-dom-chip{border:0!important;border-radius:999px!important;padding:9px 13px!important;background:var(--c-surface2,#f4f7f2)!important;color:var(--c-text2,#667085)!important;font-size:12px!important;font-weight:950!important;white-space:nowrap!important;cursor:pointer!important}',
      '.recipe-dom-chip.active{background:var(--c-primary,#3f7f2f)!important;color:#fff!important;box-shadow:0 8px 18px rgba(63,127,47,.18)!important}',
      '.recipe-dom-hidden{display:none!important}',
      '.recipe-dom-empty{grid-column:1/-1;text-align:center;padding:42px 20px;color:var(--c-text2,#667085);font-weight:850}',
      '.recipe-legacy-featured-hidden{display:none!important}'
    ].join('\n');
    document.head.appendChild(style);
  }

  function recipesById(){
    var map = {};
    if(Array.isArray(window.recipesData)){
      window.recipesData.forEach(function(r){ if(r && r.id != null) map[String(r.id)] = r; });
    }
    return map;
  }

  function cardText(card, recipe){
    return norm([
      recipe && recipe.name,
      recipe && recipe.cat,
      recipe && recipe.cuisine,
      recipe && recipe.notes,
      recipe && Array.isArray(recipe.ingredients) ? recipe.ingredients.join(' ') : '',
      card ? card.textContent : ''
    ].join(' '));
  }

  function matches(recipe, card){
    var q = norm(state.query);
    var f = state.filter;
    if(f !== 'all'){
      if(['Ontbijt','Lunch','Diner','Snack','Dessert','Bakken'].indexOf(f) > -1){
        if(!recipe || recipe.cat !== f) return false;
      } else {
        if(!recipe || norm(recipe.cuisine) !== norm(f)) return false;
      }
    }
    if(q && cardText(card, recipe).indexOf(q) === -1) return false;
    return true;
  }

  function hideLegacyFeatured(){
    var screen = document.getElementById('screen-recipes');
    if(!screen) return;
    Array.prototype.slice.call(screen.children || []).forEach(function(child){
      if(child.id === 'recipe-grid' || child.id === 'recipe-dom-filter-wrap') return;
      if(child.querySelector && child.querySelector('#recipe-grid,.recipe-premium-card,.recipe-card')) return;
      var txt = norm(child.textContent);
      if(txt.indexOf('pasta pesto') > -1 && (txt.indexOf('20 min') > -1 || txt.indexOf('makkelijk') > -1)){
        child.classList.add('recipe-legacy-featured-hidden');
      }
    });
  }

  function filterCards(){
    var grid = document.getElementById('recipe-grid');
    if(!grid) return;
    var map = recipesById();
    var cards = Array.prototype.slice.call(grid.querySelectorAll('[data-rid]'));
    var visible = 0;
    cards.forEach(function(card){
      var id = card.getAttribute('data-rid');
      var recipe = map[String(id)];
      var ok = matches(recipe, card);
      card.classList.toggle('recipe-dom-hidden', !ok);
      if(ok) visible++;
    });
    var empty = document.getElementById('recipe-dom-empty');
    if(!empty){
      empty = document.createElement('div');
      empty.id = 'recipe-dom-empty';
      empty.className = 'recipe-dom-empty recipe-dom-hidden';
      empty.textContent = 'Geen recepten gevonden. Probeer een andere zoekterm of filter.';
      grid.appendChild(empty);
    }
    empty.classList.toggle('recipe-dom-hidden', visible !== 0);
  }

  function chips(){
    var filters = [
      ['all','Alle'],
      ['Diner','Diner'],
      ['Turks','🇹🇷 Turks'],
      ['Italiaans','🇮🇹 Italiaans'],
      ['Nederlands','🇳🇱 Nederlands'],
      ['Surinaams','🇸🇷 Surinaams'],
      ['Indonesisch','🇮🇩 Indonesisch'],
      ['Lunch','Lunch'],
      ['Ontbijt','Ontbijt'],
      ['Snack','Snack'],
      ['Dessert','Dessert'],
      ['Bakken','Bakken']
    ];
    return filters.map(function(item){
      return '<button type="button" class="recipe-dom-chip '+(state.filter===item[0]?'active':'')+'" data-recipe-dom-filter="'+esc(item[0])+'">'+esc(item[1])+'</button>';
    }).join('');
  }

  function install(){
    ensureStyles();
    hideLegacyFeatured();
    var grid = document.getElementById('recipe-grid');
    if(!grid || !grid.parentNode) return;
    var wrap = document.getElementById('recipe-dom-filter-wrap');
    if(!wrap){
      wrap = document.createElement('div');
      wrap.id = 'recipe-dom-filter-wrap';
      wrap.className = 'recipe-dom-filter-wrap';
      grid.parentNode.insertBefore(wrap, grid);
    }
    wrap.innerHTML = '<div class="recipe-dom-search"><span>🔎</span><input id="recipe-dom-search-input" placeholder="Zoek op gerecht, ingrediënt of keuken" value="'+esc(state.query)+'"></div><div class="recipe-dom-filter-row">'+chips()+'</div>';
    var input = wrap.querySelector('#recipe-dom-search-input');
    if(input){
      input.oninput = function(){ state.query = input.value || ''; filterCards(); };
    }
    wrap.querySelectorAll('[data-recipe-dom-filter]').forEach(function(btn){
      btn.onclick = function(){
        state.filter = btn.getAttribute('data-recipe-dom-filter') || 'all';
        install();
        filterCards();
      };
    });
    setTimeout(filterCards, 40);
  }

  function boot(){
    install();
    [150,500,1000,1800,3200].forEach(function(delay){ setTimeout(function(){ install(); filterCards(); }, delay); });
    window.addEventListener('familyapp:food:recipes-updated', function(){ setTimeout(function(){ install(); filterCards(); }, 120); });
  }

  window.RecipeDomFilterBridge = { version:VERSION, boot:boot, install:install, filterCards:filterCards };
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
