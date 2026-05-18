'use strict';
// ============================================================
// RECIPE SEARCH FILTER BRIDGE v0.369
// Neutralized safe mode.
// Removes unstable filter runtime and restores stable premium recipe rendering.
// ============================================================

(function(){
  var VERSION = '0.369';
  var booted = false;

  function cleanup(){
    var filter = document.getElementById('recipe-filter-wrap');
    if(filter && filter.parentNode) filter.parentNode.removeChild(filter);
  }

  function restore(){
    cleanup();
    try {
      if(window.RecipePremiumCardBridge && typeof window.RecipePremiumCardBridge.renderPremiumGrid === 'function'){
        window.RecipePremiumCardBridge.renderPremiumGrid();
        return true;
      }
      if(typeof window.renderRecipeGrid === 'function'){
        window.renderRecipeGrid();
        return true;
      }
      if(typeof window.renderRecipes === 'function'){
        window.renderRecipes();
        return true;
      }
    } catch(error){
      console.warn('[RecipeSearchFilterBridge] restore failed', error);
    }
    return false;
  }

  function boot(){
    if(booted) return;
    booted = true;
    cleanup();
    [80,300,900,1800].forEach(function(delay){ setTimeout(restore, delay); });
  }

  window.RecipeSearchFilterBridge = {
    version: VERSION,
    boot: boot,
    install: boot,
    renderGrid: restore,
    filteredRecipes: function(){ return Array.isArray(window.recipesData) ? window.recipesData.slice() : []; }
  };

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
