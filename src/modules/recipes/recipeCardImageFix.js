'use strict';
// ============================================================
// RECIPE CARD IMAGE COMPAT v0.275
// Random external fallbacks are retired. Recipe visuals are owned by
// recipes.js: custom photo first, otherwise the FamilyApp category hero.
// ============================================================
(function(){
  function apply(){
    // Intentionally no DOM/image mutation here. Kept as a compatibility API
    // for older callers that still invoke RecipeCardImageFix.apply().
    return true;
  }
  function boot(){ return true; }
  window.RecipeCardImageFix={version:'0.275',apply:apply,boot:boot};
})();
