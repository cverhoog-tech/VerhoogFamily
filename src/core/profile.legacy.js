'use strict';
// ============================================================
// PROFIEL BRIDGE
// Koppelt de oude renderProfile()-aanroep vanuit navigation.js
// aan de nieuwe ProfileScreen.target.js module.
// ============================================================

var _profileMounted = false;

// ============================================================
// GLOBAL UI SCALE
// Eén centrale schaalinstelling voor de volledige app. De instelling wordt
// lokaal bewaard en bij iedere appstart opnieuw toegepast. CSS `zoom` schaalt
// zowel typografie als kaarten, iconen, controls en spacing als één geheel.
// ============================================================
(function bootstrapFamilyUiScale(){
  var STORAGE_KEY = 'familyapp-ui-scale-v1';
  var OPTIONS = [90, 100, 110, 120];

  function normalize(value){
    var parsed = parseInt(value, 10);
    return OPTIONS.indexOf(parsed) !== -1 ? parsed : 100;
  }

  function get(){
    return normalize(localStorage.getItem(STORAGE_KEY));
  }

  function apply(value){
    var percent = normalize(value);
    var factor = percent / 100;
    if(document.body){
      document.body.style.zoom = String(factor);
      document.body.dataset.uiScale = String(percent);
    }
    document.documentElement.style.setProperty('--family-ui-scale', String(factor));
    document.documentElement.dataset.uiScale = String(percent);
    return percent;
  }

  function set(value){
    var percent = normalize(value);
    localStorage.setItem(STORAGE_KEY, String(percent));
    apply(percent);
    try {
      window.dispatchEvent(new CustomEvent('familyapp:ui-scale-changed', { detail: { scale: percent } }));
    } catch(e){}
    return percent;
  }

  window.FamilyUiScale = {
    options: OPTIONS.slice(),
    get: get,
    set: set,
    apply: apply,
    reset: function(){ localStorage.removeItem(STORAGE_KEY); return apply(100); }
  };

  function initialApply(){ apply(get()); }
  if(document.body) initialApply();
  else document.addEventListener('DOMContentLoaded', initialApply, { once: true });
})();

// ============================================================
// PWA INSTALL HELPER
// Eén centrale bron voor install-status en browser-specifiek gedrag.
// Android/Chromium gebruikt beforeinstallprompt; iOS toont instructies.
// ============================================================
(function bootstrapFamilyAppInstall(){
  var deferredPrompt = null;

  function isStandalone(){
    return !!(
      (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
      window.navigator.standalone === true
    );
  }

  function isIOS(){
    var ua = navigator.userAgent || '';
    var classicIOS = /iPad|iPhone|iPod/i.test(ua);
    var ipadDesktopMode = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
    return classicIOS || ipadDesktopMode;
  }

  function getState(){
    if(isStandalone()) return { status: 'installed', installed: true, ios: isIOS(), canPrompt: false };
    if(deferredPrompt) return { status: 'ready', installed: false, ios: isIOS(), canPrompt: true };
    if(isIOS()) return { status: 'ios', installed: false, ios: true, canPrompt: false };
    return { status: 'browser', installed: false, ios: false, canPrompt: false };
  }

  function notify(){
    try {
      window.dispatchEvent(new CustomEvent('familyapp:pwa-install-state', { detail: getState() }));
    } catch(e){}
  }

  async function install(){
    if(isStandalone()) return { outcome: 'installed', method: 'standalone' };
    if(isIOS()) return { outcome: 'instructions', method: 'ios' };
    if(!deferredPrompt) return { outcome: 'instructions', method: 'browser' };

    var promptEvent = deferredPrompt;
    deferredPrompt = null;
    try {
      await promptEvent.prompt();
      var choice = await promptEvent.userChoice;
      notify();
      return {
        outcome: choice && choice.outcome ? choice.outcome : 'dismissed',
        method: 'prompt'
      };
    } catch(err){
      notify();
      return { outcome: 'instructions', method: 'browser', error: err };
    }
  }

  window.addEventListener('beforeinstallprompt', function(event){
    event.preventDefault();
    deferredPrompt = event;
    notify();
  });

  window.addEventListener('appinstalled', function(){
    deferredPrompt = null;
    notify();
  });

  window.FamilyAppInstall = {
    getState: getState,
    install: install,
    isStandalone: isStandalone,
    isIOS: isIOS
  };

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', notify, { once: true });
  else setTimeout(notify, 0);
})();

// Identity/avatar bootstrap. HouseholdIdentity remains a compatibility layer;
// Firebase household identity is read through householdIdentityFirebaseBridge.
(function bootstrapAvatarIdentity(){
  function load(src, done){
    var base=src.split('?')[0];
    var existing=[].slice.call(document.scripts||[]).find(function(s){ return (s.getAttribute('src')||'').split('?')[0]===base; });
    if(existing){ if(done) done(); return; }
    var s=document.createElement('script'); s.src=src; s.async=false;
    s.onload=function(){ if(done) done(); };
    s.onerror=function(){ console.warn('[AvatarIdentity] Kon script niet laden:',src); if(done) done(); };
    document.head.appendChild(s);
  }
  function loadFirebaseIdentity(){
    load('/src/core/householdIdentityFirebaseBridge.js?v=2',function(){
      try { if(window.HouseholdIdentityFirebaseBridge) window.HouseholdIdentityFirebaseBridge.sync(); } catch(e){}
    });
  }
  function loadBridge(){ load('/src/core/avatarIdentityBridge.js',loadFirebaseIdentity); }
  if(window.HouseholdIdentity) loadBridge(); else load('/src/core/householdIdentity.js',loadBridge);
})();

function mountHouseholdLeave(container){
  import('/src/modules/profile/householdLeaveService.js?v=1').then(function(mod){
    if(mod && typeof mod.mountHouseholdLeave === 'function') mod.mountHouseholdLeave(container);
  }).catch(function(err){ console.warn('[ProfileBridge] Gezin verlaten kon niet worden geladen:',err); });
}

function renderProfile(){
  var container=document.getElementById('screen-profile');
  if(!container) return;
  if(!document.querySelector('link[href*="profile.target.css"]')){
    var link=document.createElement('link'); link.rel='stylesheet'; link.href='/src/modules/profile/profile.target.css'; document.head.appendChild(link);
  }
  import('/src/modules/profile/ProfileScreen.target.js?v=account3').then(function(mod){
    mod.renderProfileScreen(container); _profileMounted=true; mountHouseholdLeave(container); if(window.FamilyAvatarIdentity) window.FamilyAvatarIdentity.sync();
  }).catch(function(err){ console.error('[ProfileBridge] Kon nieuwe profielmodule niet laden:',err); });
}

function updateHeaderAvatar(){
  var av=document.getElementById('hdr-avatar'); if(!av) return;
  if(window.HouseholdIdentity && typeof window.HouseholdIdentity.getActiveAvatar === 'function'){
    var centralUrl=window.HouseholdIdentity.getActiveAvatar();
    if(centralUrl){ av.innerHTML='<img src="'+centralUrl+'" style="width:100%;height:100%;object-fit:cover;border-radius:50%" onerror="this.style.display=\'none\'">'; return; }
  }
  import('/src/modules/profile/avatarStore.js?v=profile2').then(function(store){
    var url=store.getCurrentAvatarUrl();
    if(url) av.innerHTML='<img src="'+url+'" style="width:100%;height:100%;object-fit:cover;border-radius:50%">';
    else av.textContent=(typeof myInitials!=='undefined')?myInitials:'?';
  }).catch(function(){ av.textContent=(typeof myInitials!=='undefined')?myInitials:'?'; });
}

window.addEventListener('familyapp:avatar-updated',function(){
  updateHeaderAvatar();
  if(window.FamilyAvatarIdentity) window.FamilyAvatarIdentity.sync();
  if(_profileMounted){
    var container=document.getElementById('screen-profile');
    if(container && container.classList.contains('active')) import('/src/modules/profile/ProfileScreen.target.js?v=account3').then(function(mod){ mod.renderProfileScreen(container); mountHouseholdLeave(container); });
  }
});