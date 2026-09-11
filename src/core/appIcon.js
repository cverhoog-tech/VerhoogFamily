'use strict';
// Canonical FamilyApp app identity + compatibility layer.
// The installed PWA icon is fixed deliberately: iOS/Android cache install icons
// and do not reliably support per-user runtime icon changes.

var FAMILYAPP_APP_ICONS = Object.freeze({
  version: '7',
  favicon: '/src/assets/brand/v6/familyapp-icon-192.png?v=7',
  appleTouch: '/src/assets/brand/v6/familyapp-icon-192.png?v=7',
  preview: '/src/assets/brand/v6/familyapp-icon-192.png?v=7',
  login: '/src/assets/brand/v6/familyapp-icon-192.png?v=7'
});

function ensureHeadLink(id, rel, href, sizes) {
  var el = document.getElementById(id);
  if (!el) {
    el = document.createElement('link');
    el.id = id;
    el.rel = rel;
    document.head.appendChild(el);
  }
  if (sizes) el.setAttribute('sizes', sizes);
  el.href = href;
  return el;
}

function ensureBrandV7Shell() {
  var manifest = document.querySelector('link[rel="manifest"]');
  if (manifest) manifest.href = '/manifest.json?v=7';
  var theme = document.querySelector('meta[name="theme-color"]');
  if (theme) theme.setAttribute('content', '#0b3428');
  var status = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
  if (status) status.setAttribute('content', 'black-translucent');
}

function ensureLoginBrandV7() {
  if (!document.getElementById('familyapp-login-brand-v7-style')) {
    var style = document.createElement('link');
    style.id = 'familyapp-login-brand-v7-style';
    style.rel = 'stylesheet';
    style.href = '/src/styles/loginBrandV7.css?v=1';
    document.head.appendChild(style);
  }
  if (!window.FamilyAppLoginBrandV7 && !document.querySelector('script[data-familyapp-login-brand-v7]')) {
    var script = document.createElement('script');
    script.src = '/src/core/loginBrandV7.js?v=1';
    script.async = false;
    script.setAttribute('data-familyapp-login-brand-v7', '1');
    script.onerror = function(){ console.error('[FamilyApp] login brand v7 kon niet worden geladen'); };
    document.head.appendChild(script);
  }
}

function ensureScaleFix() {
  if (document.getElementById('familyapp-scale-fix')) return;
  var link = document.createElement('link');
  link.id = 'familyapp-scale-fix';
  link.rel = 'stylesheet';
  link.href = '/src/styles/scale-fix.css?v=1';
  document.head.appendChild(link);
}

function prepareReturningSessionSurface() {
  var hasLocalProfile = false;
  try { hasLocalProfile = !!localStorage.getItem('familyapp-profile-name-v1'); } catch (e) {}
  if (!hasLocalProfile) return;

  var root = document && document.documentElement;
  if (root && root.classList) root.classList.add('familyapp-session-pending');
  var login = document.getElementById('login-screen');
  if (login) {
    login.style.visibility = 'hidden';
    login.style.pointerEvents = 'none';
    login.style.transition = 'none';
  }
}

function ensureCloudinaryPreconnect() {
  if (document.querySelector('link[data-familyapp-cloudinary-preconnect]')) return;
  var preconnect = document.createElement('link');
  preconnect.rel = 'preconnect';
  preconnect.href = 'https://res.cloudinary.com';
  preconnect.crossOrigin = 'anonymous';
  preconnect.setAttribute('data-familyapp-cloudinary-preconnect', '1');
  document.head.appendChild(preconnect);
}

// Round 2/3 JavaScript used to start eagerly here. Those adapters both set up
// observers and attempted to warm/render Cleaning during app startup. Their CSS
// can stay cheap and declarative; their JS is now loaded lazily by round 4 only
// when the user actually opens Cleaning.
function ensureFeedbackStyleCascade() {
  var premiumId = 'cleaning-room-premium-stylesheet';
  var feedbackId = 'familyapp-feedback-round2-runtime';
  var observer = null;

  function placeFeedbackAfterPremium() {
    var premium = document.getElementById(premiumId);
    if (!premium || !premium.parentNode) return false;
    var feedback = document.getElementById(feedbackId);
    if (!feedback) {
      feedback = document.createElement('link');
      feedback.id = feedbackId;
      feedback.rel = 'stylesheet';
      feedback.href = '/src/styles/familyapp-feedback-round2.css?v=20260907-3';
    }
    if (premium.nextElementSibling !== feedback) premium.parentNode.insertBefore(feedback, premium.nextSibling);
    return true;
  }

  if (placeFeedbackAfterPremium()) return;
  if (typeof MutationObserver !== 'function' || !document.head) return;
  observer = new MutationObserver(function(){
    if (placeFeedbackAfterPremium() && observer) {
      observer.disconnect();
      observer = null;
    }
  });
  observer.observe(document.head, {childList:true});
}

function ensureFeedbackRound3Styles() {
  var styleId = 'familyapp-feedback-round3-runtime';
  var observer = null;

  function placeRound3Last() {
    var round2 = document.getElementById('familyapp-feedback-round2-runtime');
    var premium = document.getElementById('cleaning-room-premium-stylesheet');
    var anchor = round2 || premium;
    var style = document.getElementById(styleId);
    if (!style) {
      style = document.createElement('link');
      style.id = styleId;
      style.rel = 'stylesheet';
      style.href = '/src/styles/familyapp-feedback-round3.css?v=20260907-3';
    }
    if (anchor && anchor.parentNode) {
      if (anchor.nextElementSibling !== style) anchor.parentNode.insertBefore(style, anchor.nextSibling);
      return !!round2;
    }
    if (!style.parentNode && document.head) document.head.appendChild(style);
    return false;
  }

  var settled = placeRound3Last();
  if (settled || typeof MutationObserver !== 'function' || !document.head) return;
  observer = new MutationObserver(function(){
    if (placeRound3Last() && observer) {
      observer.disconnect();
      observer = null;
    }
  });
  observer.observe(document.head, {childList:true});
}

function ensureFeedbackRound4() {
  ensureCloudinaryPreconnect();
  if (!window.__familyAppFeedbackRound4 && !document.querySelector('script[data-familyapp-feedback-round4]')) {
    var script = document.createElement('script');
    script.src = '/src/core/familyappFeedbackRound4.js?v=20260907-4';
    script.async = false;
    script.setAttribute('data-familyapp-feedback-round4', '1');
    script.onerror = function(){ console.error('[FamilyApp] feedback ronde 4 kon niet worden geladen'); };
    document.head.appendChild(script);
  }

  var styleId = 'familyapp-feedback-round4-runtime';
  var observer = null;
  function placeRound4Last() {
    var round3 = document.getElementById('familyapp-feedback-round3-runtime');
    var round2 = document.getElementById('familyapp-feedback-round2-runtime');
    var premium = document.getElementById('cleaning-room-premium-stylesheet');
    var anchor = round3 || round2 || premium;
    var style = document.getElementById(styleId);
    if (!style) {
      style = document.createElement('link');
      style.id = styleId;
      style.rel = 'stylesheet';
      style.href = '/src/styles/familyapp-feedback-round4.css?v=20260907-4';
    }
    if (anchor && anchor.parentNode) {
      if (anchor.nextElementSibling !== style) anchor.parentNode.insertBefore(style, anchor.nextSibling);
      return !!round3;
    }
    if (!style.parentNode && document.head) document.head.appendChild(style);
    return false;
  }

  var settled = placeRound4Last();
  if (settled || typeof MutationObserver !== 'function' || !document.head) return;
  observer = new MutationObserver(function(){
    if (placeRound4Last() && observer) {
      observer.disconnect();
      observer = null;
    }
  });
  observer.observe(document.head, {childList:true});
}

function ensureFeedbackRound5Styles() {
  var styleId = 'familyapp-feedback-round5-runtime';
  var observer = null;

  function placeRound5Last() {
    var round4 = document.getElementById('familyapp-feedback-round4-runtime');
    var round3 = document.getElementById('familyapp-feedback-round3-runtime');
    var anchor = round4 || round3 || document.getElementById('familyapp-feedback-round2-runtime') || document.getElementById('cleaning-room-premium-stylesheet');
    var style = document.getElementById(styleId);
    if (!style) {
      style = document.createElement('link');
      style.id = styleId;
      style.rel = 'stylesheet';
      style.href = '/src/styles/familyapp-feedback-round5.css?v=20260907-2';
    }
    if (anchor && anchor.parentNode) {
      if (anchor.nextElementSibling !== style) anchor.parentNode.insertBefore(style, anchor.nextSibling);
      return !!round4;
    }
    if (!style.parentNode && document.head) document.head.appendChild(style);
    return false;
  }

  var settled = placeRound5Last();
  if (settled || typeof MutationObserver !== 'function' || !document.head) return;
  observer = new MutationObserver(function(){
    if (placeRound5Last() && observer) {
      observer.disconnect();
      observer = null;
    }
  });
  observer.observe(document.head, {childList:true});
}

function applyAppIcon() {
  ensureBrandV7Shell();
  ensureHeadLink('apple-touch-icon', 'apple-touch-icon', FAMILYAPP_APP_ICONS.appleTouch, '192x192');
  ensureHeadLink('favicon', 'icon', FAMILYAPP_APP_ICONS.favicon, '192x192');

  var prev = document.getElementById('icon-preview');
  if (prev) {
    prev.innerHTML = '<img src="' + FAMILYAPP_APP_ICONS.preview + '" alt="FamilyApp app-icoon" style="width:100%;height:100%;display:block;object-fit:cover">';
  }

  var loginLogo = document.getElementById('login-logo');
  if (loginLogo) {
    loginLogo.style.background = 'transparent';
    loginLogo.style.border = '0';
    loginLogo.style.boxShadow = 'none';
    loginLogo.style.overflow = 'visible';
    loginLogo.innerHTML = '<img src="' + FAMILYAPP_APP_ICONS.login + '" alt="FamilyApp" style="width:100%;height:100%;display:block;object-fit:cover;background:transparent;border:0;border-radius:22%;box-shadow:none">';
  }
}

// Legacy callbacks remain available so old profile markup cannot throw.
function setAppIcon() { applyAppIcon(); }
function setIconColor() { applyAppIcon(); }
function saveAppIconToLink() {
  applyAppIcon();
  var st = document.getElementById('icon-save-status');
  if (st) st.innerHTML = '<span style="color:#16a34a">✓ FamilyApp gebruikt nu het vaste app-icoon.</span>';
  if (typeof showToast === 'function') showToast('FamilyApp app-icoon actief ✓');
}

(function initCanonicalAppIdentity() {
  try {
    localStorage.removeItem('familie_icon_emoji');
    localStorage.removeItem('familie_icon_color');
    localStorage.removeItem('familie_icon_photo');
  } catch (e) {}
  prepareReturningSessionSurface();
  ensureBrandV7Shell();
  ensureLoginBrandV7();
  ensureScaleFix();
  ensureCloudinaryPreconnect();
  ensureFeedbackStyleCascade();
  ensureFeedbackRound3Styles();
  ensureFeedbackRound4();
  ensureFeedbackRound5Styles();
  applyAppIcon();
})();