'use strict';
// ============================================================
// RECIPE IMAGE FALLBACK BRIDGE v0.366
// Assigns premium fallback images to existing recipes without overwriting
// custom/user-provided photos.
// ============================================================

(function(){
  var VERSION = '0.366';
  var STORAGE_KEY = 'familyapp_food_recipes_v001';
  var IMAGE_BASE = 'https://images.unsplash.com/';

  var NAME_IMAGES = [
    { key:'lasagne', photo:IMAGE_BASE+'photo-1619895092538-128341789043?auto=format&fit=crop&w=1200&q=85' },
    { key:'shakshuka', photo:IMAGE_BASE+'photo-1525351484163-7529414344d8?auto=format&fit=crop&w=1200&q=85' },
    { key:'bananenbrood', photo:IMAGE_BASE+'photo-1605286978633-2dec93ff88a2?auto=format&fit=crop&w=1200&q=85' },
    { key:'pasta pesto', photo:IMAGE_BASE+'photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=1200&q=85' },
    { key:'carbonara', photo:IMAGE_BASE+'photo-1612874742237-6526221588e3?auto=format&fit=crop&w=1200&q=85' },
    { key:'pizza', photo:IMAGE_BASE+'photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1200&q=85' },
    { key:'risotto', photo:IMAGE_BASE+'photo-1476124369491-e7addf5db371?auto=format&fit=crop&w=1200&q=85' },
    { key:'kebab', photo:IMAGE_BASE+'photo-1529042410759-befb1204b468?auto=format&fit=crop&w=1200&q=85' },
    { key:'soep', photo:IMAGE_BASE+'photo-1547592166-23ac45744acd?auto=format&fit=crop&w=1200&q=85' },
    { key:'stamppot', photo:IMAGE_BASE+'photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1200&q=85' }
  ];

  var CAT_IMAGES = {
    Ontbijt: IMAGE_BASE+'photo-1484723091739-30a097e8f929?auto=format&fit=crop&w=1200&q=85',
    Lunch: IMAGE_BASE+'photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1200&q=85',
    Diner: IMAGE_BASE+'photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=85',
    Snack: IMAGE_BASE+'photo-1601050690597-df0568f70950?auto=format&fit=crop&w=1200&q=85',
    Dessert: IMAGE_BASE+'photo-1551024506-0bccd828d307?auto=format&fit=crop&w=1200&q=85',
    Bakken: IMAGE_BASE+'photo-1621743478914-cc8a86d7e9f2?auto=format&fit=crop&w=1200&q=85'
  };

  function normalize(v){ return String(v || '').toLowerCase(); }

  function pickPhoto(recipe){
    var name = normalize(recipe.name);
    var match = NAME_IMAGES.find(function(item){ return name.indexOf(item.key) > -1; });
    if(match) return match.photo;
    return CAT_IMAGES[recipe.cat] || CAT_IMAGES.Diner;
  }

  function persist(){
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(window.recipesData || [])); } catch(e) {}
    if(window.HouseholdRepository && typeof window.HouseholdRepository.write === 'function'){
      window.HouseholdRepository.write('recipes', window.recipesData || [], { source:'recipeImageFallbackBridge', operation:'assignFallbackImages', version:VERSION });
    }
    try { window.dispatchEvent(new CustomEvent('familyapp:food:recipes-updated', { detail:{ recipes:window.recipesData || [], version:VERSION } })); } catch(e) {}
  }

  function apply(){
    if(!Array.isArray(window.recipesData)) return 0;
    var changed = 0;
    window.recipesData.forEach(function(recipe){
      if(!recipe.photo){
        recipe.photo = pickPhoto(recipe);
        recipe.photoFallback = true;
        recipe.photoFallbackVersion = VERSION;
        changed++;
      }
    });
    if(changed){
      persist();
      if(typeof window.renderRecipes === 'function') setTimeout(window.renderRecipes, 50);
    }
    return changed;
  }

  function boot(){
    apply();
    [200,800,1600,3000].forEach(function(delay){ setTimeout(apply, delay); });
  }

  window.RecipeImageFallbackBridge = { version:VERSION, apply:apply, pickPhoto:pickPhoto };
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
