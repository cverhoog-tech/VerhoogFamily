'use strict';
// Small additive UX fixes: grocery add feedback + recipe overview thumbnails.
(function(){
  if(window.__familyMobileUxFixes) return;
  window.__familyMobileUxFixes = true;

  var style = document.createElement('style');
  style.textContent = '.shop-item.family-just-added,.shop-row.family-just-added,[data-shop-id].family-just-added{animation:familyShopAdded .7s cubic-bezier(.2,.8,.2,1)}@keyframes familyShopAdded{0%{opacity:.2;transform:translateY(-10px) scale(.98);box-shadow:0 0 0 0 rgba(91,141,81,.28)}55%{opacity:1;transform:translateY(0) scale(1.015);box-shadow:0 0 0 8px rgba(91,141,81,.10)}100%{transform:none;box-shadow:none}}.recipe-premium-bg.family-thumb-fixed{background-image:none!important}.recipe-premium-bg>.family-recipe-thumb{width:100%;height:100%;display:block;object-fit:cover;position:absolute;inset:0;z-index:0}.recipe-premium-bg>*:not(.family-recipe-thumb){position:relative;z-index:1}#tdp-overlay .tdp-help-row{display:grid!important;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;column-gap:10px;row-gap:8px;flex-wrap:unset!important}#tdp-overlay .tdp-help-crest{grid-column:1;grid-row:1}#tdp-overlay .tdp-help-text{grid-column:2;grid-row:1;min-width:0}#tdp-overlay .tdp-help-btn{grid-column:3;grid-row:1;align-self:center}#tdp-overlay .tdp-member-pick{grid-column:1/-1;margin-top:0}#tdp-overlay .tdp-help-status{grid-column:1/-1;margin-top:0;padding:7px 9px;border-radius:9px;background:rgba(124,58,237,.08);line-height:1.3}@media(max-width:430px){#tdp-overlay .tdp-help-row{grid-template-columns:auto minmax(0,1fr)}#tdp-overlay .tdp-help-btn{grid-column:2;grid-row:2;justify-self:start}#tdp-overlay .tdp-help-sub{font-size:11px;line-height:1.35}#tdp-overlay .tdp-help-title{font-size:9.5px}#tdp-overlay .tdp-help-status{grid-column:1/-1}}@media(max-width:340px){#tdp-overlay .tdp-help-row{grid-template-columns:1fr}#tdp-overlay .tdp-help-crest{grid-column:1;grid-row:1}#tdp-overlay .tdp-help-text{grid-column:1;grid-row:2}#tdp-overlay .tdp-help-btn{grid-column:1;grid-row:3}#tdp-overlay .tdp-help-status{grid-column:1}}'
    +'.family-login-visible{overflow:hidden!important}.family-login-visible #login-screen{position:fixed!important;inset:0!important;top:0!important;right:0!important;bottom:0!important;left:0!important;width:100vw!important;height:100vh!important;height:100dvh!important;min-height:100vh!important;max-width:none!important;z-index:2147483000!important;background:#fff!important;pointer-events:auto!important;isolation:isolate!important;transform:none!important;visibility:visible!important;opacity:1!important;overflow-y:auto!important;-webkit-overflow-scrolling:touch!important}.family-login-visible body>.app-header,.family-login-visible body>.bottom-nav,.family-login-visible body>.more-menu,.family-login-visible body>.screen,.family-login-visible body>.add-overlay,.family-login-visible body>.nav-config-overlay{visibility:hidden!important;pointer-events:none!important}.family-login-visible #login-screen,.family-login-visible #login-screen *{pointer-events:auto!important}.family-login-visible #login-screen button,.family-login-visible #login-screen input{touch-action:manipulation!important;-webkit-user-select:auto!important;user-select:auto!important}';
  document.head.appendChild(style);

  function syncLoginShell(){
    var el=document.getElementById('login-screen');
    if(!el)return;
    var cs=window.getComputedStyle?getComputedStyle(el):null;
    var on=el.style.display!=='none'&&(!cs||cs.display!=='none');
    document.documentElement.classList.toggle('family-login-visible',on);
    if(document.body)document.body.classList.toggle('family-login-visible',on);
    el.setAttribute('aria-hidden',on?'false':'true');
    if(on)el.style.pointerEvents='auto';
  }

  var previousShopIds = null;
  function shopIds(){
    return Array.isArray(window.shopData) ? window.shopData.map(function(x){return String(x.id);}) : [];
  }
  function highlightNewShopItem(){
    var ids = shopIds();
    if(previousShopIds){
      var added = ids.find(function(id){return previousShopIds.indexOf(id) === -1;});
      if(added){
        requestAnimationFrame(function(){
          var el = document.querySelector('[data-id="'+added+'"],[data-shop-id="'+added+'"]');
          if(!el){
            var screen=document.getElementById('screen-shop');
            if(screen) el=screen.querySelector('.shop-item,.shop-row');
          }
          if(el){el.classList.remove('family-just-added');void el.offsetWidth;el.classList.add('family-just-added');setTimeout(function(){el.classList.remove('family-just-added');},800);}
        });
      }
    }
    previousShopIds = ids;
  }
  previousShopIds = shopIds();
  window.addEventListener('familyapp:food:grocery-updated',function(){setTimeout(highlightNewShopItem,30);});

  function recipeForCard(card){
    var id = card && card.getAttribute('data-rid');
    if(!id || !Array.isArray(window.recipesData)) return null;
    return window.recipesData.find(function(r){return String(r.id)===String(id);}) || null;
  }
  function extractBackgroundUrl(bg){
    var raw=(bg.style.backgroundImage||getComputedStyle(bg).backgroundImage||'');
    var match=raw.match(/url\(["']?(.*?)["']?\)/);
    return match ? match[1] : '';
  }
  function repairRecipeThumbs(){
    document.querySelectorAll('.recipe-premium-bg').forEach(function(bg){
      if(bg.querySelector('.family-recipe-thumb')) return;
      var card=bg.closest('[data-rid]');
      var recipe=recipeForCard(card);
      var src=(recipe&&recipe.photo)||extractBackgroundUrl(bg);
      if(!src) return;
      var img=document.createElement('img');
      img.className='family-recipe-thumb';
      img.alt='';
      img.loading='lazy';
      img.decoding='async';
      img.src=src;
      img.onerror=function(){
        if(window.RecipeBrokenImageRepairBridge&&recipe){img.src=window.RecipeBrokenImageRepairBridge.pick(recipe);img.onerror=null;}
      };
      bg.classList.add('family-thumb-fixed');
      bg.insertBefore(img,bg.firstChild);
    });
  }
  var observer=new MutationObserver(function(){repairRecipeThumbs();});
  function boot(){
    repairRecipeThumbs();
    syncLoginShell();
    var login=document.getElementById('login-screen');
    if(login)new MutationObserver(syncLoginShell).observe(login,{attributes:true,attributeFilter:['style','class']});
    window.addEventListener('familyapp:session-state',function(){setTimeout(syncLoginShell,0);});
    window.addEventListener('pageshow',syncLoginShell);
    var screen=document.getElementById('screen-recipes');
    if(screen)observer.observe(screen,{childList:true,subtree:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
