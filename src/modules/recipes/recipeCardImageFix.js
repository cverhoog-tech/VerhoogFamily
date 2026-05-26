'use strict';
// ============================================================
// RECIPE CARD IMAGE FIX v0.274
// Fixes recipe overview card backgrounds and falls back when a
// configured recipe photo fails to load.
// ============================================================

(function(){
  var FALLBACKS = [
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80',
    'https://images.unsplash.com/photo-1498579397066-22750a3cb424?w=800&q=80',
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80',
    'https://images.unsplash.com/photo-1529042410759-befb1204b468?w=800&q=80',
    'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800&q=80',
    'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=800&q=80'
  ];

  var VERIFIED = {};
  var BROKEN = {};

  var KNOWN_GOOD = {
    'appeltaart': 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=800&q=80',
    'lahmacun': 'https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=800&q=80'
  };

  function normalizeName(name){
    return String(name || '').toLowerCase().trim();
  }

  function pickFallback(name){
    var key = normalizeName(name);
    if(KNOWN_GOOD[key]) return KNOWN_GOOD[key];
    return FALLBACKS[Math.abs(String(name || '').length) % FALLBACKS.length];
  }

  function cssUrl(url){
    return 'url("' + String(url || '').replace(/"/g, '%22') + '")';
  }

  function findRecipeById(id){
    var list = Array.isArray(window.recipesData) ? window.recipesData : [];
    for(var i = 0; i < list.length; i++){
      if(String(list[i].id) === String(id)) return list[i];
    }
    return null;
  }

  function setImage(img, url){
    if(!img || !url) return;
    img.style.backgroundImage = cssUrl(url);
    img.style.backgroundSize = 'cover';
    img.style.backgroundPosition = 'center';
    img.style.backgroundRepeat = 'no-repeat';
  }

  function ensureImage(img, preferredUrl, fallbackUrl){
    if(!img) return;
    var url = preferredUrl || fallbackUrl;
    if(!url) return;

    if(BROKEN[url]){
      setImage(img, fallbackUrl);
      return;
    }

    setImage(img, url);

    if(VERIFIED[url]) return;

    var probe = new Image();
    probe.onload = function(){ VERIFIED[url] = true; };
    probe.onerror = function(){
      BROKEN[url] = true;
      if(fallbackUrl && fallbackUrl !== url) setImage(img, fallbackUrl);
    };
    probe.src = url;
  }

  function applyRecipeCardImages(){
    var grid = document.getElementById('rg');
    if(!grid) return;

    grid.querySelectorAll('.rc').forEach(function(card){
      var img = card.querySelector('.rc-img');
      if(!img) return;

      var id = String(card.id || '').replace(/^rc-/, '');
      var recipe = findRecipeById(id);
      if(!recipe) return;

      var fallback = pickFallback(recipe.name);
      var preferred = recipe.photo || fallback;
      ensureImage(img, preferred, fallback);
    });
  }

  function wrapRenderGrid(){
    if(typeof window.renderRecipeGrid !== 'function') return false;
    if(window.renderRecipeGrid.__recipeCardImageFix) return true;

    var original = window.renderRecipeGrid;
    var wrapped = function(){
      var result = original.apply(this, arguments);
      setTimeout(applyRecipeCardImages, 0);
      setTimeout(applyRecipeCardImages, 250);
      requestAnimationFrame(applyRecipeCardImages);
      return result;
    };
    wrapped.__recipeCardImageFix = true;
    window.renderRecipeGrid = wrapped;
    return true;
  }

  function patchDetailImageFallback(){
    var detail = document.getElementById('recipe-detail-view');
    if(!detail) return;
    detail.querySelectorAll('#rd-hero img').forEach(function(img){
      if(img.__recipeFallbackPatched) return;
      img.__recipeFallbackPatched = true;
      img.onerror = function(){
        var title = detail.querySelector('.rd-info h2');
        var fallback = pickFallback(title ? title.textContent : 'food');
        img.src = fallback;
      };
    });
  }

  function boot(){
    wrapRenderGrid();
    applyRecipeCardImages();
    patchDetailImageFallback();

    var screen = document.getElementById('screen-recipes');
    if(screen && !screen.__recipeCardImageObserver){
      screen.__recipeCardImageObserver = true;
      new MutationObserver(function(){
        applyRecipeCardImages();
        patchDetailImageFallback();
      }).observe(screen, { childList:true, subtree:true });
    }
  }

  var tries = 0;
  var timer = setInterval(function(){
    tries++;
    boot();
    if((typeof window.renderRecipeGrid === 'function' && document.getElementById('rg')) || tries > 30){
      clearInterval(timer);
    }
  }, 150);

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  window.RecipeCardImageFix = { apply: applyRecipeCardImages, boot: boot };
})();
