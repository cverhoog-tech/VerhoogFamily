'use strict';
// ============================================================
// PERSON HERO BACKGROUND ASSET BRIDGE v1.1
// ============================================================
// Makes the fixed Shane/Esra fantasy assets available to the existing
// personTabPremium hero resolver without changing its layout.
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
      if(localStorage.getItem(key)) return false;
      localStorage.setItem(key, value);
      return true;
    } catch(e) {
      console.warn('[PersonHeroBackgroundAssets] kon achtergrond niet cachen voor', id, e);
      return false;
    }
  }

  function refreshPersonTab(){
    var page = document.querySelector('.task-person-page');
    var target = document.getElementById('task-content');
    if(!page || !target) return;
    try {
      if(window.PersonTabPremium && typeof window.PersonTabPremium.render === 'function') {
        window.PersonTabPremium.render(target);
      } else if(typeof window.renderTasksPersoon === 'function') {
        window.renderTasksPersoon(target);
      }
    } catch(e) {
      console.warn('[PersonHeroBackgroundAssets] kon Persoon-tab niet verversen', e);
    }
  }

  function sync(){
    var changed = false;
    changed = seed('shane', window.HERO_BG_SHANE) || changed;
    changed = seed('esra', window.HERO_BG_ESRA) || changed;

    // De assets worden via AppModules later geladen dan personTabPremium.
    // Daarom expliciet een render triggeren zodra de data beschikbaar is;
    // anders blijft de reeds gerenderde CSS-gradient zichtbaar tot handmatige refresh.
    if(changed){
      try { window.dispatchEvent(new CustomEvent('familyapp:hero-backgrounds-ready')); } catch(e) {}
      setTimeout(refreshPersonTab, 0);
    }
  }

  sync();
  window.addEventListener('familyapp:modules:ready', function(){
    sync();
    setTimeout(refreshPersonTab, 0);
  });
  window.PersonHeroBackgroundAssets = { sync: sync, refresh: refreshPersonTab, version: '1.1' };
})();