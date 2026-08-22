'use strict';
// ============================================================
// FAMILYAPP FOOD ICON RESOLVER v1.0.0
// Semantic icon boundary for Shopping / Recipes / Meals.
// UI callers request a food meaning; this resolver returns a canonical
// FamilyApp icon key/rendering. Legacy emoji may remain in persisted data as
// compatibility metadata, but are never required as the visible UI fallback.
// ============================================================
(function(){
  if(window.FamilyAppFoodIconResolver)return;

  var VERSION='1.0.0';
  var CATEGORY_KEYS=Object.freeze({
    'Ontbijt':'utilityBread',
    'Lunch':'utilityLunch',
    'Diner':'utilityDinner',
    'Snack':'utilitySnacks',
    'Dessert':'utilitySnacks',
    'Bakken':'utilitySnacks'
  });
  var MEAL_TYPE_KEYS=Object.freeze({
    'breakfast':'utilityBread',
    'lunch':'utilityLunch',
    'dinner':'utilityDinner'
  });

  function categoryKey(category){
    return CATEGORY_KEYS[String(category||'')]||'utilityRecipe';
  }
  function mealTypeKey(type){
    return MEAL_TYPE_KEYS[String(type||'').toLowerCase()]||'utilityMeal';
  }
  function recipeKey(recipe){
    return categoryKey(recipe&&recipe.cat);
  }
  function renderKey(key,opts){
    var renderer=window.FamilyAppIconRenderer;
    if(!renderer||typeof renderer.render!=='function')return'';
    return renderer.render(key,Object.assign({label:false,size:'sm',className:'fa-utility-icon'},opts||{}));
  }
  function renderCategory(category,opts){return renderKey(categoryKey(category),opts);}
  function renderRecipe(recipe,opts){return renderKey(recipeKey(recipe),opts);}
  function renderMealType(type,opts){return renderKey(mealTypeKey(type),opts);}

  window.FamilyAppFoodIconResolver={
    version:VERSION,
    categoryKey:categoryKey,
    mealTypeKey:mealTypeKey,
    recipeKey:recipeKey,
    renderKey:renderKey,
    renderCategory:renderCategory,
    renderRecipe:renderRecipe,
    renderMealType:renderMealType,
    categoryMap:CATEGORY_KEYS,
    mealTypeMap:MEAL_TYPE_KEYS
  };
})();
