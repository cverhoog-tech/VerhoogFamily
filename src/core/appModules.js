'use strict';
// ============================================================
// APP MODULES v0.382
// Stable bootstrap modules.
// Recipe checkbox observer is now explicitly loaded.
// ============================================================

(function(){
  var VERSION = '0.382';
  var loaded = {};
  var failed = {};
  var booting = false;
  var booted = false;

  var registry = [
    { id: 'remove-music-module-js', src: 'src/core/removeMusicModule.js', group: 'core', critical: false },
    { id: 'mobile-viewport-lock-js', src: 'src/core/mobileViewportLock.js', group: 'core', critical: false },
    { id: 'modal-manager-js', src: 'src/core/modalManager.js', group: 'core', critical: false },
    { id: 'bottom-sheet-js', src: 'src/core/bottomSheet.js', group: 'core', critical: false },
    { id: 'food-modules-repair-js', src: 'src/core/foodModulesRepair.js', group: 'core', critical: false },
    { id: 'food-add-bridge-js', src: 'src/core/foodAddBridge.js', group: 'core', critical: false },
    { id: 'food-shop-sheet-repair-js', src: 'src/core/foodShopSheetRepair.js', group: 'core', critical: false },
    { id: 'grocery-quick-add-modal-js', src: 'src/core/groceryQuickAddModal.js', group: 'food', critical: false },
    { id: 'live-sync-adapter-js', src: 'src/core/liveSyncAdapter.js', group: 'core', critical: false },
    { id: 'household-identity-js', src: 'src/core/householdIdentity.js', group: 'core', critical: false },
    { id: 'household-repository-js', src: 'src/core/householdRepository.js', group: 'core', critical: false },
    { id: 'reactive-household-state-js', src: 'src/core/reactiveHouseholdState.js', group: 'core', critical: false },
    { id: 'quest-engine-js', src: 'src/core/questEngine.js', group: 'quests', critical: false },
    { id: 'quest-adapter-js', src: 'src/core/questAdapter.js', group: 'quests', critical: false },
    { id: 'epic-hero-backgrounds-js', src: 'src/core/epicHeroBackgrounds.js', group: 'rendering', critical: false },
    { id: 'quest-renderer-js', src: 'src/core/questRenderer.js', group: 'rendering', critical: false },

    { id: 'finance-native-tabs-js', src: 'src/modules/finance/financeNativeTabs.js', group: 'finance', critical: false },
    { id: 'savings-bottom-sheet-bridge-js', src: 'src/modules/finance/savingsBottomSheetBridge.js', group: 'finance', critical: false },

    { id: 'recipe-bottom-sheet-bridge-js', src: 'src/modules/recipes/recipeBottomSheetBridge.js', group: 'food', critical: false },
    { id: 'recipe-culture-seed-data-js', src: 'src/modules/recipes/recipeCultureSeedData.js', group: 'food', critical: false },
    { id: 'recipe-dutch-seed-data-js', src: 'src/modules/recipes/recipeDutchSeedData.js', group: 'food', critical: false },
    { id: 'recipe-snack-seed-data-js', src: 'src/modules/recipes/recipeSnackSeedData.js', group: 'food', critical: false },
    { id: 'recipe-image-fallback-bridge-js', src: 'src/modules/recipes/recipeImageFallbackBridge.js', group: 'food', critical: false },
    { id: 'recipe-broken-image-repair-bridge-js', src: 'src/modules/recipes/recipeBrokenImageRepairBridge.js', group: 'food', critical: false },
    { id: 'recipe-premium-card-bridge-js', src: 'src/modules/recipes/recipePremiumCardBridge.js', group: 'food', critical: false },
    { id: 'recipe-standalone-add-button-js', src: 'src/modules/recipes/recipeStandaloneAddButton.js', group: 'food', critical: false },
    { id: 'recipe-add-button-bridge-js', src: 'src/modules/recipes/recipeAddButtonBridge.js', group: 'food', critical: false },
    { id: 'recipe-premium-cooking-bridge-js', src: 'src/modules/recipes/recipePremiumCookingBridge.js', group: 'food', critical: false },
    { id: 'recipe-manage-image-bridge-js', src: 'src/modules/recipes/recipeManageAndImageBridge.js', group: 'food', critical: false },
    { id: 'recipe-direct-stable-patch-js', src: 'src/modules/recipes/recipeDirectStablePatch.js', group: 'food', critical: false },
    { id: 'recipe-ingredient-checkbox-seed-booster-js', src: 'src/modules/recipes/recipeIngredientCheckboxSeedBooster.js', group: 'food', critical: false },
    { id: 'recipe-detail-checkbox-fallback-js', src: 'src/modules/recipes/recipeDetailCheckboxFallback.js', group: 'food', critical: false },
    { id: 'recipe-checkbox-observer-fix-js', src: 'src/modules/recipes/recipeCheckboxObserverFix.js', group: 'food', critical: false },

    { id: 'meal-planner-bottom-sheet-bridge-js', src: 'src/modules/meals/mealPlannerBottomSheetBridge.js', group: 'food', critical: false },

    { id: 'task-repository-adapter-js', src: 'src/modules/tasks/taskRepositoryAdapter.js', group: 'tasks', critical: false },
    { id: 'task-mutation-repository-bridge-js', src: 'src/modules/tasks/taskMutationRepositoryBridge.js', group: 'tasks', critical: false },
    { id: 'recurring-task-repository-bridge-js', src: 'src/modules/tasks/recurringTaskRepositoryBridge.js', group: 'tasks', critical: false },
    { id: 'task-repository-render-bridge-js', src: 'src/modules/tasks/taskRepositoryRenderBridge.js', group: 'tasks', critical: false },
    { id: 'task-nav-native-css-js', src: 'src/modules/tasks/taskNavNativeCss.js', group: 'tasks', critical: false },
    { id: 'quest-renderer-preview-js', src: 'src/modules/tasks/questRendererPreview.js', group: 'tasks', critical: false },
    { id: 'group-quest-premium-js', src: 'src/modules/tasks/groupQuestPremium.js', group: 'tasks', critical: false },
    { id: 'group-quest-layout-fix-js', src: 'src/modules/tasks/groupQuestLayoutFix.js', group: 'tasks', critical: false },
    { id: 'raid-card-polish-js', src: 'src/modules/tasks/raidCardPolish.js', group: 'tasks', critical: false },
    { id: 'group-quest-editor-js', src: 'src/modules/tasks/groupQuestEditor.js', group: 'tasks', critical: false },
    { id: 'group-quest-editor-compact-polish-js', src: 'src/modules/tasks/groupQuestEditorCompactPolish.js', group: 'tasks', critical: false }
  ];

  function emit(name, detail){
    try { window.dispatchEvent(new CustomEvent('familyapp:modules:' + name, { detail: detail || {} })); } catch(e) {}
  }

  function loadScript(module){
    if(!module || !module.id || !module.src) return Promise.resolve(null);
    if(loaded[module.id] || document.getElementById(module.id)){
      loaded[module.id] = true;
      return Promise.resolve(module);
    }
    return new Promise(function(resolve){
      var script = document.createElement('script');
      script.id = module.id;
      script.src = module.src;
      script.defer = true;
      script.onload = function(){ loaded[module.id] = true; emit('loaded', module); resolve(module); };
      script.onerror = function(){ failed[module.id] = module; console.warn('[AppModules] failed to load', module.id, module.src); emit('failed', module); resolve(null); };
      document.body.appendChild(script);
    });
  }

  function boot(){
    if(booting || booted) return Promise.resolve(status());
    booting = true;
    var chain = Promise.resolve();
    registry.forEach(function(module){ chain = chain.then(function(){ return loadScript(module); }); });
    return chain.then(function(){
      booting = false;
      booted = true;
      var oldCarousel = document.getElementById('group-quest-hero-carousel');
      if(oldCarousel && oldCarousel.parentNode) oldCarousel.parentNode.removeChild(oldCarousel);
      var oldFilter = document.getElementById('recipe-dom-filter-wrap') || document.getElementById('recipe-filter-wrap') || document.getElementById('recipe-search-hard-wrap');
      if(oldFilter && oldFilter.parentNode) oldFilter.parentNode.removeChild(oldFilter);
      if(window.GroceryQuickAddModal && typeof window.GroceryQuickAddModal.installButton === 'function') window.GroceryQuickAddModal.installButton();
      if(window.RecipeCultureSeedData && typeof window.RecipeCultureSeedData.seed === 'function') window.RecipeCultureSeedData.seed(false);
      if(window.RecipeDutchSeedData && typeof window.RecipeDutchSeedData.seed === 'function') window.RecipeDutchSeedData.seed(false);
      if(window.RecipeSnackSeedData && typeof window.RecipeSnackSeedData.seed === 'function') window.RecipeSnackSeedData.seed(false);
      if(window.RecipeIngredientCheckboxSeedBooster && typeof window.RecipeIngredientCheckboxSeedBooster.boot === 'function') window.RecipeIngredientCheckboxSeedBooster.boot();
      if(window.RecipeImageFallbackBridge && typeof window.RecipeImageFallbackBridge.apply === 'function') window.RecipeImageFallbackBridge.apply();
      if(window.RecipeBrokenImageRepairBridge && typeof window.RecipeBrokenImageRepairBridge.apply === 'function') window.RecipeBrokenImageRepairBridge.apply();
      if(window.RecipePremiumCardBridge && typeof window.RecipePremiumCardBridge.boot === 'function') window.RecipePremiumCardBridge.boot();
      if(window.RecipePremiumCookingBridge && typeof window.RecipePremiumCookingBridge.boot === 'function') window.RecipePremiumCookingBridge.boot();
      if(window.RecipeManageAndImageBridge && typeof window.RecipeManageAndImageBridge.boot === 'function') window.RecipeManageAndImageBridge.boot();
      if(window.RecipeDirectStablePatch && typeof window.RecipeDirectStablePatch.patch === 'function') window.RecipeDirectStablePatch.patch();
      if(window.RecipeDetailCheckboxFallback && typeof window.RecipeDetailCheckboxFallback.boot === 'function') window.RecipeDetailCheckboxFallback.boot();
      if(window.RecipeCheckboxObserverFix && typeof window.RecipeCheckboxObserverFix.boot === 'function') window.RecipeCheckboxObserverFix.boot();
      if(window.RecipeStandaloneAddButton && typeof window.RecipeStandaloneAddButton.install === 'function') window.RecipeStandaloneAddButton.install();
      if(window.MealPlannerBottomSheetBridge && typeof window.MealPlannerBottomSheetBridge.boot === 'function') window.MealPlannerBottomSheetBridge.boot();
      if(typeof window.renderRecipes === 'function') window.renderRecipes();
      setTimeout(function(){
        if(window.RecipeIngredientCheckboxSeedBooster && typeof window.RecipeIngredientCheckboxSeedBooster.boot === 'function') window.RecipeIngredientCheckboxSeedBooster.boot();
        if(window.RecipeDirectStablePatch && typeof window.RecipeDirectStablePatch.patch === 'function') window.RecipeDirectStablePatch.patch();
        if(window.RecipeDetailCheckboxFallback && typeof window.RecipeDetailCheckboxFallback.patchDetail === 'function') window.RecipeDetailCheckboxFallback.patchDetail();
        if(window.RecipeCheckboxObserverFix && typeof window.RecipeCheckboxObserverFix.patch === 'function') window.RecipeCheckboxObserverFix.patch();
      }, 180);
      emit('ready', status());
      return status();
    });
  }

  function status(){ return { version: VERSION, registered: registry.length, loaded: Object.keys(loaded), failed: Object.keys(failed), registry: registry.slice() }; }
  function register(module){ if(!module || !module.id || !module.src) return false; if(!registry.some(function(item){ return item.id === module.id; })) registry.push(module); return true; }

  window.AppModules = { version: VERSION, register: register, boot: boot, loadScript: loadScript, status: status };

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();