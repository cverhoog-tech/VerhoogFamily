'use strict';
// ============================================================
// APP ICOON — losgeknipt uit theme.js
// ============================================================

var appIconEmoji    = localStorage.getItem('familie_icon_emoji') || '🏠';
var appIconColor    = localStorage.getItem('familie_icon_color') || '#2d5a27';
var appIconPhotoData = localStorage.getItem('familie_icon_photo') || null;

var BUILTIN_VISUALS = {
  whiteDashboard:       'familieapp_white_assets/familyapp_white_dashboard.webp',
  whiteDashboardMobile: 'familieapp_white_assets/familyapp_white_dashboard_mobile.webp',
  appIcon:              'familieapp_white_assets/familyapp_app_icon.png',
  iconSheet:            'familieapp_white_assets/familyapp_icon_sheet.webp',
};

function buildIconSvg(emoji, color) {
  var enc = encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">'
    + '<rect width="100" height="100" rx="22" fill="' + color + '"/>'
    + '<text y="68" x="50" text-anchor="middle" font-size="58">' + emoji + '</text>'
    + '</svg>'
  );
  return 'data:image/svg+xml,' + enc;
}

function applyAppIcon() {
  var src;
  if (appIconPhotoData) {
    src = appIconPhotoData;
  } else if (typeof BUILTIN_VISUALS !== 'undefined' && BUILTIN_VISUALS.appIcon) {
    src = BUILTIN_VISUALS.appIcon;
  } else {
    src = buildIconSvg(appIconEmoji, appIconColor);
  }

  var ati = document.getElementById('apple-touch-icon');
  var fav = document.getElementById('favicon');
  if (ati) ati.href = src;
  if (fav) fav.href = src;

  var prev = document.getElementById('icon-preview');
  if (prev) {
    if (appIconPhotoData) {
      prev.innerHTML = '<img src="' + appIconPhotoData + '" style="width:100%;height:100%;object-fit:cover">';
    } else {
      prev.style.background = appIconColor;
      prev.textContent = appIconEmoji;
    }
  }
}

function setAppIcon(type, value) {
  if (type === 'emoji') {
    appIconEmoji = value;
    appIconPhotoData = null;
    localStorage.removeItem('familie_icon_photo');
    document.querySelectorAll('.icon-pick-btn').forEach(function(b) {
      b.classList.toggle('selected', b.textContent === value);
    });
  }
  applyAppIcon();
}

function setIconColor(color) {
  appIconColor = color;
  appIconPhotoData = null;
  localStorage.removeItem('familie_icon_photo');
  localStorage.setItem('familie_icon_color', color);
  document.querySelectorAll('.icon-color-btn').forEach(function(b) {
    b.style.borderColor = b.style.background === color ? '#333' : 'transparent';
  });
  applyAppIcon();
}

function saveAppIconToLink() {
  localStorage.setItem('familie_icon_emoji', appIconEmoji);
  localStorage.setItem('familie_icon_color', appIconColor);
  applyAppIcon();
  var st = document.getElementById('icon-save-status');
  if (st) st.innerHTML = '<span style="color:#16a34a">✓ Opgeslagen! Voeg de app toe aan je beginscherm om het nieuwe icoon te zien.</span>';
  if (typeof showToast === 'function') showToast('App icoon opgeslagen ✓');
}

// Laad opgeslagen waardes + initialiseer
(function() {
  var savedEmoji  = localStorage.getItem('familie_icon_emoji');
  var savedColor  = localStorage.getItem('familie_icon_color');
  var savedPhoto  = localStorage.getItem('familie_icon_photo');
  if (savedEmoji) appIconEmoji     = savedEmoji;
  if (savedColor) appIconColor     = savedColor;
  if (savedPhoto) appIconPhotoData = savedPhoto;
  setTimeout(applyAppIcon, 100);
})();
