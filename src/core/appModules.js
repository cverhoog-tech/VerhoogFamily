'use strict';
// ============================================================
// APP MODULES v0.421
// ============================================================
(function(){
  var VERSION='0.421',loaded={},failed={},booting=false,booted=false;
  var registry=[
    {id:'remove-music-module-js',src:'src/core/removeMusicModule.js',group:'core',critical:false},
    {id:'mobile-viewport-lock-js',src:'src/core/mobileViewportLock.js',group:'core',critical:false},
    {id:'modal-manager-js',src:'src/core/modalManager.js',group:'core',critical:false},
    {id:'bottom-sheet-js',src:'src/core/bottomSheet.js',group:'core',critical:false},
    {id:'home-hero-card-background-loader-js',src:'src/core/homeHeroCardBackgroundLoader.js',group:'core',critical:false},
    {id:'food-modules-repair-js',src:'src/core/foodModulesRepair.js',group:'core',critical:false},
    {id:'food-add-bridge-js',src:'src/core/foodAddBridge.js',group:'core',critical:false},
    {id:'food-shop-sheet-repair-js',src:'src/core/foodShopSheetRepair.js',group:'core',critical:false},
    {id:'grocery-quick-add-modal-js',src:'src/core/groceryQuickAddModal.js',group:'food',critical:false},
    {id:'live-sync-adapter-js',src:'src/core/liveSyncAdapter.js',group:'core',critical:false},
    {id:'household-identity-js',src:'src/core/householdIdentity.js',group:'core',critical:false},
    {id:'household-repository-js',src:'src/core/householdRepository.js',group:'core',critical:false},
    {id:'household-account-recovery-js',src:'src/core/householdAccountRecovery.js',group:'core',critical:false},
    {id:'family-data-store-js',src:'src/core/familyDataStore.js',group:'core',critical:false},
    {id:'shopping-lists-js',src:'src/modules/shop/shoppingLists.js',group:'food',critical:false},
    {id:'reactive-household-state-js',src:'src/core/reactiveHouseholdState.js',group:'core',critical:false},
    {id:'quest-engine-js',src:'src/core/questEngine.js',group:'quests',critical:false},
    {id:'quest-adapter-js',src:'src/core/questAdapter.js',group:'quests',critical:false},
    {id:'epic-hero-backgrounds-js',src:'src/core/epicHeroBackgrounds.js',group:'rendering',critical:false},
    {id:'quest-renderer-js',src:'src/core/questRenderer.js',group:'rendering',critical:false},
    {id:'finance-native-tabs-js',src:'src/modules/finance/financeNativeTabs.js',group:'finance',critical:false},
    {id:'savings-bottom-sheet-bridge-js',src:'src/modules/finance/savingsBottomSheetBridge.js',group:'finance',critical:false},
    {id:'recipe-card-image-fix-js',src:'src/modules/recipes/recipeCardImageFix.js',group:'food',critical:false},
    {id:'recipe-checklist-persistence-js',src:'src/modules/recipes/recipeChecklistPersistence.js',group:'food',critical:false},
    {id:'recipe-link-import-js',src:'src/modules/recipes/recipeLinkImport.js',group:'food',critical:false},
    {id:'recipe-serverless-link-import-js',src:'src/modules/recipes/recipeServerlessLinkImport.js',group:'food',critical:false},
    {id:'recipe-grocery-parser-js',src:'src/modules/recipes/recipeGroceryParser.js',group:'food',critical:false},
    {id:'meal-planner-bottom-sheet-bridge-js',src:'src/modules/meals/mealPlannerBottomSheetBridge.js',group:'food',critical:false},
    {id:'task-model-js',src:'src/modules/tasks/taskModel.js',group:'tasks',critical:false},
    {id:'task-repository-adapter-js',src:'src/modules/tasks/taskRepositoryAdapter.js',group:'tasks',critical:false},
    {id:'task-mutation-repository-bridge-js',src:'src/modules/tasks/taskMutationRepositoryBridge.js',group:'tasks',critical:false},
    {id:'recurring-task-repository-bridge-js',src:'src/modules/tasks/recurringTaskRepositoryBridge.js',group:'tasks',critical:false},
    {id:'task-repository-render-bridge-js',src:'src/modules/tasks/taskRepositoryRenderBridge.js',group:'tasks',critical:false},
    {id:'task-nav-native-css-js',src:'src/modules/tasks/taskNavNativeCss.js',group:'tasks',critical:false},
    {id:'task-remove-group-complete-cta-js',src:'src/modules/tasks/taskRemoveGroupAndCompleteCta.js',group:'tasks',critical:false},
    {id:'task-detail-fullscreen-polish-js',src:'src/modules/tasks/taskDetailFullscreenPolish.js',group:'tasks',critical:false},
    {id:'household-sync-test-panel-js',src:'src/modules/tasks/householdSyncTestPanel.js',group:'tasks',critical:false}
  ];
  function emit(name,detail){try{window.dispatchEvent(new CustomEvent('familyapp:modules:'+name,{detail:detail||{}}));}catch(e){}}
  function loadScript(module){
    if(!module||!module.id||!module.src)return Promise.resolve(null);
    if(loaded[module.id]||document.getElementById(module.id)){loaded[module.id]=true;return Promise.resolve(module);}
    return new Promise(function(resolve){var script=document.createElement('script');script.id=module.id;script.src=module.src;script.defer=true;script.onload=function(){loaded[module.id]=true;emit('loaded',module);resolve(module);};script.onerror=function(){failed[module.id]=module;console.warn('[AppModules] failed to load',module.id,module.src);emit('failed',module);resolve(null);};document.body.appendChild(script);});
  }
  function boot(){
    if(booting||booted)return Promise.resolve(status());booting=true;var chain=Promise.resolve();
    registry.forEach(function(module){chain=chain.then(function(){return loadScript(module);});});
    return chain.then(function(){booting=false;booted=true;if(window.GroceryQuickAddModal&&typeof window.GroceryQuickAddModal.installButton==='function')window.GroceryQuickAddModal.installButton();if(window.ShoppingLists&&typeof window.ShoppingLists.boot==='function')window.ShoppingLists.boot();if(window.MealPlannerBottomSheetBridge&&typeof window.MealPlannerBottomSheetBridge.boot==='function')window.MealPlannerBottomSheetBridge.boot();emit('ready',status());return status();});
  }
  function status(){return{version:VERSION,registered:registry.length,loaded:Object.keys(loaded),failed:Object.keys(failed),registry:registry.slice()};}
  function register(module){if(!module||!module.id||!module.src)return false;if(!registry.some(function(item){return item.id===module.id;}))registry.push(module);return true;}
  window.AppModules={version:VERSION,register:register,boot:boot,loadScript:loadScript,status:status};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
