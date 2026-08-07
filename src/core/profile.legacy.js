'use strict';
// ============================================================
// PROFIEL BRIDGE
// Koppelt de oude renderProfile()-aanroep vanuit navigation.js
// aan de nieuwe ProfileScreen.target.js module.
// ============================================================

var _profileMounted = false;

// Identity/avatar bootstrap. Keep this here because profile.legacy.js is loaded
// early by index.html on every app start. The bridge itself remains additive,
// so existing screens can keep their current renderers while sharing one avatar source.
(function bootstrapAvatarIdentity(){
  function load(src, done){
    if(document.querySelector('script[src="' + src + '"]')) { if(done) done(); return; }
    var s = document.createElement('script');
    s.src = src;
    s.onload = function(){ if(done) done(); };
    s.onerror = function(){ console.warn('[AvatarIdentity] Kon script niet laden:', src); };
    document.head.appendChild(s);
  }
  function loadBridge(){ load('/src/core/avatarIdentityBridge.js'); }
  if(window.HouseholdIdentity) loadBridge();
  else load('/src/core/householdIdentity.js', loadBridge);
})();

function renderProfile() {
  // Zoek de legacy container op in de HTML
  var container = document.getElementById('screen-profile');
  if (!container) return;

  // Laad CSS éénmalig
  if (!document.querySelector('link[href*="profile.target.css"]')) {
    var link = document.createElement('link');
    link.rel  = 'stylesheet';
    link.href = '/src/modules/profile/profile.target.css';
    document.head.appendChild(link);
  }

  // Importeer en render de nieuwe module
  import('/src/modules/profile/ProfileScreen.target.js')
    .then(function(mod) {
      mod.renderProfileScreen(container);
      _profileMounted = true;
      if(window.FamilyAvatarIdentity) window.FamilyAvatarIdentity.sync();
    })
    .catch(function(err) {
      console.error('[ProfileBridge] Kon nieuwe profielmodule niet laden:', err);
    });
}

// Header avatar — wordt aangeroepen vanuit saveName() in het oude systeem
function updateHeaderAvatar() {
  var av = document.getElementById('hdr-avatar');
  if (!av) return;

  // Prefer the central identity resolver once it is available.
  if(window.HouseholdIdentity && typeof window.HouseholdIdentity.getActiveAvatar === 'function') {
    var centralUrl = window.HouseholdIdentity.getActiveAvatar();
    if(centralUrl) {
      av.innerHTML = '<img src="' + centralUrl + '" style="width:100%;height:100%;object-fit:cover;border-radius:50%" onerror="this.style.display=\'none\'">';
      return;
    }
  }

  // Legacy fallback while the identity scripts are still loading.
  import('/src/modules/profile/avatarStore.js')
    .then(function(store) {
      var url = store.getCurrentAvatarUrl();
      if (url) {
        av.innerHTML = '<img src="' + url + '" style="width:100%;height:100%;object-fit:cover;border-radius:50%">';
      } else {
        av.textContent = (typeof myInitials !== 'undefined') ? myInitials : '?';
      }
    })
    .catch(function() {
      av.textContent = (typeof myInitials !== 'undefined') ? myInitials : '?';
    });
}

// Luister naar avatar-wijzigingen vanuit de nieuwe module
window.addEventListener('familyapp:avatar-updated', function(e) {
  updateHeaderAvatar();
  if(window.FamilyAvatarIdentity) window.FamilyAvatarIdentity.sync();
  // Als het profielscherm open is, re-render het
  if (_profileMounted) {
    var container = document.getElementById('screen-profile');
    if (container && container.classList.contains('active')) {
      import('/src/modules/profile/ProfileScreen.target.js')
        .then(function(mod) { mod.renderProfileScreen(container); });
    }
  }
});
