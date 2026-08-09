'use strict';
// ============================================================
// PERSON HERO BACKGROUND ASSET BRIDGE v1
// ============================================================
// Makes the fixed Shane/Esra fantasy assets available to the existing
// personTabPremium hero resolver without touching the renderer or DOM.
// Existing per-person backgrounds always win: we only seed a fallback
// key when no background has already been stored for that member.
// ============================================================
(function(){
  if(window.__personHeroBackgroundAssets) return;
  window.__personHeroBackgroundAssets = true;

  function seed(id, value){
    if(!id || !value) return false;
    try {
      var key = 'familyapp-hero-bg-' + String(id).toLowerCase();
      if(!localStorage.getItem(key)) localStorage.setItem(key, value);
      return true;
    } catch(e) {
      console.warn('[PersonHeroBackgroundAssets] kon achtergrond niet cachen voor', id, e);
      return false;
    }
  }

  function sync(){
    var changed = false;
    changed = seed('shane', window.HERO_BG_SHANE) || changed;
    changed = seed('esra', window.HERO_BG_ESRA) || changed;
    if(changed){
      try { window.dispatchEvent(new CustomEvent('familyapp:hero-backgrounds-ready')); } catch(e) {}
    }
  }

  sync();
  window.addEventListener('familyapp:modules:ready', sync);
  window.PersonHeroBackgroundAssets = { sync: sync, version: '1.0' };
})();