'use strict';
// ============================================================
// RECIPE STANDALONE ADD BUTTON v0.359
// Hard replaces the legacy recipe add button with a standalone button that
// loads ModalManager, BottomSheet and RecipeBottomSheetBridge deterministically.
// ============================================================

(function(){
  var VERSION = '0.359';
  var loadingPromise = null;
  var STYLE_ID = 'recipe-standalone-add-button-style';

  function ensureStyles(){
    if(document.getElementById(STYLE_ID)) return;
    var style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = [
      '.recipe-add-native-btn{background:var(--c-primary)!important;color:#fff!important;border:0!important;border-radius:999px!important;padding:9px 16px!important;font-size:13px!important;font-weight:900!important;box-shadow:0 8px 18px rgba(63,127,47,.18)!important;cursor:pointer!important}',
      '.recipe-add-native-btn:active{transform:scale(.97)!important}'
    ].join('\n');
    document.head.appendChild(style);
  }

  function loadScriptOnce(id, src, ready){
    return new Promise(function(resolve){
      if(ready && ready()) return resolve();
      if(document.getElementById(id)){
        var tries = 0;
        var wait = setInterval(function(){
          tries++;
          if(!ready || ready() || tries > 60){ clearInterval(wait); resolve(); }
        }, 40);
        return;
      }
      var script = document.createElement('script');
      script.id = id;
      script.src = src;
      script.onload = function(){ resolve(); };
      script.onerror = function(){ console.warn('[RecipeStandaloneAddButton] failed to load', src); resolve(); };
      document.body.appendChild(script);
    });
  }

  function ensureRecipeStack(){
    if(loadingPromise) return loadingPromise;
    loadingPromise = Promise.resolve()
      .then(function(){ return loadScriptOnce('modal-manager-js','src/core/modalManager.js',function(){ return !!window.ModalManager; }); })
      .then(function(){ return loadScriptOnce('bottom-sheet-js','src/core/bottomSheet.js',function(){ return !!window.BottomSheet; }); })
      .then(function(){ return loadScriptOnce('recipe-bottom-sheet-bridge-js','src/modules/recipes/recipeBottomSheetBridge.js',function(){ return !!window.RecipeBottomSheetBridge; }); });
    return loadingPromise;
  }

  function open(){
    ensureRecipeStack().then(function(){
      if(window.RecipeBottomSheetBridge && typeof window.RecipeBottomSheetBridge.openRecipeSheet === 'function'){
        window.RecipeBottomSheetBridge.openRecipeSheet(null);
      } else if(window.BottomSheet){
        window.BottomSheet.open({ title:'🍳 Nieuw recept', html:'<div style="padding:12px;color:var(--c-text2)">Receptformulier kon niet geladen worden.</div>', actions:[{label:'Sluiten'}] });
      }
    });
    return false;
  }

  function install(){
    ensureStyles();
    var screen = document.getElementById('screen-recipes');
    if(!screen) return;
    var header = screen.querySelector('.list-header');
    if(!header) return;

    header.querySelectorAll('.add-btn').forEach(function(old){
      if(!old.classList.contains('recipe-add-native-btn')) old.style.display = 'none';
    });

    var btn = document.getElementById('recipe-add-native-btn');
    if(!btn){
      btn = document.createElement('button');
      btn.id = 'recipe-add-native-btn';
      btn.className = 'recipe-add-native-btn';
      btn.type = 'button';
      btn.textContent = '+ Recept';
      header.appendChild(btn);
    }
    btn.onclick = function(e){ if(e) e.preventDefault(); return open(); };
  }

  function boot(){
    ensureRecipeStack();
    install();
    [100,300,700,1200,2000,3500,5000].forEach(function(delay){ setTimeout(install, delay); });
    window.addEventListener('familyapp:food:recipes-updated', install);
  }

  window.RecipeStandaloneAddButton = { version:VERSION, open:open, install:install, boot:boot };
  window.openRecipeAdd = open;
  window.openRecipeAddDirect = open;

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
