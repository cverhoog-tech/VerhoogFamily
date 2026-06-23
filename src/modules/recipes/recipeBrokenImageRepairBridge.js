'use strict';
// ============================================================
// RECIPE BROKEN IMAGE REPAIR BRIDGE v0.370
// Replaces known-broken recipe photo URLs and handles image load errors.
// ============================================================

(function(){
  var VERSION = '0.370';
  var STORAGE_KEY = 'familyapp_food_recipes_v001';
  var IMAGE_BASE = 'https://images.unsplash.com/';

  var REPAIRS = [
    { key:'lahmacun', photo:IMAGE_BASE+'photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=1200&q=85' },
    { key:'imam bayildi', photo:IMAGE_BASE+'photo-1625944228741-cf30983ecb78?auto=format&fit=crop&w=1200&q=85' },
    { key:'turkse pide', photo:IMAGE_BASE+'photo-1601050690117-94f5f6fa8bd7?auto=format&fit=crop&w=1200&q=85' },
    { key:'pide', photo:IMAGE_BASE+'photo-1601050690117-94f5f6fa8bd7?auto=format&fit=crop&w=1200&q=85' },
    { key:'appeltaart', photo:IMAGE_BASE+'photo-1621743478914-cc8a86d7e9f2?auto=format&fit=crop&w=1200&q=85' },
    { key:'poffertjes', photo:IMAGE_BASE+'photo-1528207776546-365bb710ee93?auto=format&fit=crop&w=1200&q=85' }
  ];

  var CUISINE_FALLBACKS = {
    Turks: IMAGE_BASE+'photo-1529042410759-befb1204b468?auto=format&fit=crop&w=1200&q=85',
    Italiaans: IMAGE_BASE+'photo-1498579397066-22750a3cb424?auto=format&fit=crop&w=1200&q=85',
    Nederlands: IMAGE_BASE+'photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1200&q=85',
    Surinaams: IMAGE_BASE+'photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=1200&q=85',
    Indonesisch: IMAGE_BASE+'photo-1512058564366-18510be2db19?auto=format&fit=crop&w=1200&q=85'
  };

  function normalize(v){ return String(v || '').toLowerCase(); }

  function pick(recipe){
    var name = normalize(recipe.name);
    var exact = REPAIRS.find(function(item){ return name.indexOf(item.key) > -1; });
    if(exact) return exact.photo;
    return CUISINE_FALLBACKS[recipe.cuisine] || (window.RecipeImageFallbackBridge && window.RecipeImageFallbackBridge.pickPhoto ? window.RecipeImageFallbackBridge.pickPhoto(recipe) : CUISINE_FALLBACKS.Italiaans);
  }

  function persist(){
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(window.recipesData || [])); } catch(e) {}
    if(window.HouseholdRepository && typeof window.HouseholdRepository.write === 'function'){
      window.HouseholdRepository.write('recipes', window.recipesData || [], { source:'recipeBrokenImageRepairBridge', operation:'repairBrokenRecipeImages', version:VERSION });
    }
    try { window.dispatchEvent(new CustomEvent('familyapp:food:recipes-updated', { detail:{ recipes:window.recipesData || [], version:VERSION } })); } catch(e) {}
  }

  function repairData(){
    if(!Array.isArray(window.recipesData)) return 0;
    var changed = 0;
    window.recipesData.forEach(function(recipe){
      if(!recipe) return;
      var name = normalize(recipe.name);
      var shouldRepair = !recipe.photo || REPAIRS.some(function(item){ return name.indexOf(item.key) > -1; });
      if(shouldRepair){
        var next = pick(recipe);
        if(next && recipe.photo !== next){
          recipe.photo = next;
          recipe.photoRepaired = true;
          recipe.photoRepairVersion = VERSION;
          changed++;
        }
      }
    });
    if(changed) persist();
    return changed;
  }

  function patchBrokenDomImages(){
    document.querySelectorAll('.recipe-premium-bg').forEach(function(bg){
      var img = new Image();
      var raw = bg.style.backgroundImage || '';
      var url = raw.replace(/^url\(["']?/, '').replace(/["']?\)$/, '');
      if(!url) return;
      img.onerror = function(){
        var card = bg.closest('[data-rid]');
        var id = card ? parseInt(card.getAttribute('data-rid'), 10) : null;
        var recipe = Array.isArray(window.recipesData) ? window.recipesData.find(function(r){ return Number(r.id) === Number(id); }) : null;
        var next = recipe ? pick(recipe) : CUISINE_FALLBACKS.Italiaans;
        if(recipe){ recipe.photo = next; recipe.photoRepaired = true; persist(); }
        bg.style.backgroundImage = "url('"+next+"')";
      };
      img.src = url;
    });
  }

  function apply(){
    var changed = repairData();
    if(changed && typeof window.renderRecipes === 'function') setTimeout(window.renderRecipes, 60);
    setTimeout(patchBrokenDomImages, 150);
    return changed;
  }

  function boot(){
    apply();
    [300,1000,2200,4000].forEach(function(delay){ setTimeout(apply, delay); });
  }

  window.RecipeBrokenImageRepairBridge = { version:VERSION, apply:apply, pick:pick };
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
