'use strict';
// Canonical FamilyApp app identity + compatibility layer.
// The installed PWA icon is fixed deliberately: iOS/Android cache install icons
// and do not reliably support per-user runtime icon changes.

var FAMILYAPP_APP_ICONS = Object.freeze({
  favicon: '/assets/app-icons/icon-32.png',
  appleTouch: '/assets/app-icons/apple-touch-icon.png',
  preview: '/assets/app-icons/icon-192.png'
});

function ensureHeadLink(id, rel, href, sizes) {
  var el = document.getElementById(id);
  if (!el) {
    el = document.createElement('link');
    el.id = id;
    el.rel = rel;
    if (sizes) el.setAttribute('sizes', sizes);
    document.head.appendChild(el);
  }
  el.href = href;
  return el;
}

function ensureScaleFix() {
  if (document.getElementById('familyapp-scale-fix')) return;
  var link = document.createElement('link');
  link.id = 'familyapp-scale-fix';
  link.rel = 'stylesheet';
  link.href = '/src/styles/scale-fix.css?v=1';
  document.head.appendChild(link);
}

function applyAppIcon() {
  ensureHeadLink('apple-touch-icon', 'apple-touch-icon', FAMILYAPP_APP_ICONS.appleTouch, '180x180');
  ensureHeadLink('favicon', 'icon', FAMILYAPP_APP_ICONS.favicon, '32x32');

  var prev = document.getElementById('icon-preview');
  if (prev) {
    prev.innerHTML = '<img src="' + FAMILYAPP_APP_ICONS.preview + '" alt="FamilieApp huis-icoon" style="width:100%;height:100%;display:block;object-fit:cover">';
  }

  var loginLogo = document.getElementById('login-logo');
  if (loginLogo) {
    loginLogo.innerHTML = '<img src="' + FAMILYAPP_APP_ICONS.preview + '" alt="FamilieApp" style="width:56px;height:56px;display:block;border-radius:14px">';
  }
}

// Legacy callbacks remain available so old profile markup cannot throw.
function setAppIcon() { applyAppIcon(); }
function setIconColor() { applyAppIcon(); }
function saveAppIconToLink() {
  applyAppIcon();
  var st = document.getElementById('icon-save-status');
  if (st) st.innerHTML = '<span style="color:#16a34a">✓ FamilieApp gebruikt nu het vaste huis-icoon.</span>';
  if (typeof showToast === 'function') showToast('FamilieApp huis-icoon actief ✓');
}

(function initCanonicalAppIdentity() {
  try {
    localStorage.removeItem('familie_icon_emoji');
    localStorage.removeItem('familie_icon_color');
    localStorage.removeItem('familie_icon_photo');
  } catch (e) {}
  ensureScaleFix();
  applyAppIcon();
})();
