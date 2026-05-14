'use strict';
// ============================================================
// PROFIEL BRIDGE
// Koppelt de oude renderProfile()-aanroep vanuit navigation.js
// aan de nieuwe ProfileScreen.target.js module.
// ============================================================

var _profileMounted = false;

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
    })
    .catch(function(err) {
      console.error('[ProfileBridge] Kon nieuwe profielmodule niet laden:', err);
    });
}

// Header avatar — wordt aangeroepen vanuit saveName() in het oude systeem
function updateHeaderAvatar() {
  // Haal de huidige avatar-url op via avatarStore als die beschikbaar is
  var av = document.getElementById('hdr-avatar');
  if (!av) return;

  import('/src/modules/profile/avatarStore.js')
    .then(function(store) {
      var url = store.getCurrentAvatarUrl();
      if (url && url.startsWith('data:')) {
        av.innerHTML = '<img src="' + url + '" style="width:100%;height:100%;object-fit:cover;border-radius:50%">';
      } else if (url) {
        av.innerHTML = '<img src="' + url + '" style="width:100%;height:100%;object-fit:cover;border-radius:50%">';
      } else {
        av.textContent = (typeof myInitials !== 'undefined') ? myInitials : '?';
      }
    })
    .catch(function() {
      // Fallback: initialen
      av.textContent = (typeof myInitials !== 'undefined') ? myInitials : '?';
    });
}

// Luister naar avatar-wijzigingen vanuit de nieuwe module
window.addEventListener('familyapp:avatar-updated', function(e) {
  updateHeaderAvatar();
  // Als het profielscherm open is, re-render het
  if (_profileMounted) {
    var container = document.getElementById('screen-profile');
    if (container && container.classList.contains('active')) {
      import('/src/modules/profile/ProfileScreen.target.js')
        .then(function(mod) { mod.renderProfileScreen(container); });
    }
  }
});
