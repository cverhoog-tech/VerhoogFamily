'use strict';
// ============================================================
// RECIPE ADD BUTTON BRIDGE v0.358
// Replaces legacy recipe add button with a deterministic BottomSheet flow.
// ============================================================

(function(){
  var VERSION = '0.358';
  var loadingPromise = null;

  function loadScriptOnce(id, src, ready){
    return new Promise(function(resolve){
      if(ready && ready()) return resolve();
      if(document.getElementById(id)){
        var tries = 0;
        var wait = setInterval(function(){
          tries++;
          if(!ready || ready() || tries > 50){ clearInterval(wait); resolve(); }
        }, 40);
        return;
      }
      var script = document.createElement('script');
      script.id = id;
      script.src = src;
      script.onload = function(){ resolve(); };
      script.onerror = function(){ console.warn('[RecipeAddButtonBridge] failed to load', src); resolve(); };
      document.body.appendChild(script);
    });
  }

  function ensureRecipeStack(){
    if(loadingPromise) return loadingPromise;
    loadingPromise = Promise.resolve()
      .then(function(){ return loadScriptOnce('modal-manager-js', 'src/core/modalManager.js', function(){ return !!window.ModalManager; }); })
      .then(function(){ return loadScriptOnce('bottom-sheet-js', 'src/core/bottomSheet.js', function(){ return !!window.BottomSheet; }); })
      .then(function(){ return loadScriptOnce('recipe-bottom-sheet-bridge-js', 'src/modules/recipes/recipeBottomSheetBridge.js', function(){ return !!window.RecipeBottomSheetBridge; }); });
    return loadingPromise;
  }

  function openRecipeAdd(){
    ensureRecipeStack().then(function(){
      if(window.RecipeBottomSheetBridge && typeof window.RecipeBottomSheetBridge.openRecipeSheet === 'function'){
        window.RecipeBottomSheetBridge.openRecipeSheet(null);
      } else if(typeof window.openAdd === 'function') {
        window.openAdd('recipe');
      }
    });
    return false;
  }

  function replaceButton(){
    var screen = document.getElementById('screen-recipes');
    if(!screen) return;
    var header = screen.querySelector('.list-header');
    if(!header) return;

    var btn = header.querySelector('.add-btn');
    if(btn && btn.__recipeAddButtonBridge) return;

    if(!btn){
      btn = document.createElement('button');
      btn.className = 'add-btn';
      header.appendChild(btn);
    }

    btn.textContent = '+ Recept';
    btn.setAttribute('onclick','return openRecipeAdd()');
    btn.onclick = function(e){
      if(e) e.preventDefault();
      return openRecipeAdd();
    };
    btn.style.pointerEvents = 'auto';
    btn.__recipeAddButtonBridge = true;
  }

  function boot(){
    ensureRecipeStack();
    replaceButton();
    [100,300,800,1500,2500,4000].forEach(function(delay){ setTimeout(replaceButton, delay); });
    window.addEventListener('familyapp:food:recipes-updated', replaceButton);
  }

  window.openRecipeAdd = openRecipeAdd;
  window.RecipeAddButtonBridge = { version: VERSION, boot: boot, replaceButton: replaceButton, openRecipeAdd: openRecipeAdd };

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
