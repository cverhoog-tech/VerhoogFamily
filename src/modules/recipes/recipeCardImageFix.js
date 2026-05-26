'use strict';
// ============================================================
// RECIPE CARD IMAGE FIX v0.273
// Fixes broken overview card backgrounds caused by quoted inline
// background-image strings in recipes.js renderGrid output.
// ============================================================

(function(){
  var FALLBACKS = [
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80',
    'https://images.unsplash.com/photo-1498579397066-22750a3cb424?w=800&q=80',
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80',
    'https://images.unsplash.com/photo-1529042410759-befb1204b468?w=800&q=80'
  ];

  function pickFallback(name){
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

  function applyRecipeCardImages(){
    var grid = document.getElementById('rg');
    if(!grid) return;

    grid.querySelectorAll('.rc').forEach(function(card){
      var img = card.querySelector('.rc-img');
      if(!img) return;

      var id = String(card.id || '').replace(/^rc-/, '');
      var recipe = findRecipeById(id);
      if(!recipe) return;

      var photo = recipe.photo || pickFallback(recipe.name);
      if(!photo) return;

      img.style.backgroundImage = cssUrl(photo);
      img.style.backgroundSize = 'cover';
      img.style.backgroundPosition = 'center';
      img.style.backgroundRepeat = 'no-repeat';
    });
  }

  function wrapRenderGrid(){
    if(typeof window.renderRecipeGrid !== 'function') return false;
    if(window.renderRecipeGrid.__recipeCardImageFix) return true;

    var original = window.renderRecipeGrid;
    var wrapped = function(){
      var result = original.apply(this, arguments);
      setTimeout(applyRecipeCardImages, 0);
      requestAnimationFrame(applyRecipeCardImages);
      return result;
    };
    wrapped.__recipeCardImageFix = true;
    window.renderRecipeGrid = wrapped;
    return true;
  }

  function boot(){
    wrapRenderGrid();
    applyRecipeCardImages();

    var screen = document.getElementById('screen-recipes');
    if(screen && !screen.__recipeCardImageObserver){
      screen.__recipeCardImageObserver = true;
      new MutationObserver(function(){ applyRecipeCardImages(); }).observe(screen, { childList:true, subtree:true });
    }
  }

  var tries = 0;
  var timer = setInterval(function(){
    tries++;
    boot();
    if((typeof window.renderRecipeGrid === 'function' && document.getElementById('rg')) || tries > 20){
      clearInterval(timer);
    }
  }, 150);

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  window.RecipeCardImageFix = { apply: applyRecipeCardImages, boot: boot };
})();
