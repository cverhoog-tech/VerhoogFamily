'use strict';
// Canonical FamilyApp app identity + compatibility layer.
// The installed PWA icon is fixed deliberately: iOS/Android cache install icons
// and do not reliably support per-user runtime icon changes.
// Login uses a transparent presentation variant so the crest blends into the page.

var FAMILYAPP_APP_ICONS = Object.freeze({
  version: '5',
  favicon: '/api/brand-icon?variant=32&v=5',
  appleTouch: '/api/brand-icon?variant=180&v=5',
  preview: '/api/brand-icon?variant=192&v=5',
  login: '/api/brand-icon?variant=login&v=5-login1'
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
      style.href = '/src/styles/familyapp-feedback-round5.css?v=20260907-1';
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
  ensureHeadLink('apple-touch-icon', 'apple-touch-icon', FAMILYAPP_APP_ICONS.appleTouch, '180x180');
  ensureHeadLink('favicon', 'icon', FAMILYAPP_APP_ICONS.favicon, '32x32');

  var prev = document.getElementById('icon-preview');
  if (prev) {
    prev.innerHTML = '<img src="' + FAMILYAPP_APP_ICONS.preview + '" alt="FamilyApp familiewapen" style="width:100%;height:100%;display:block;object-fit:cover">';
  }

  var loginLogo = document.getElementById('login-logo');
  if (loginLogo) {
    loginLogo.style.background = 'transparent';
    loginLogo.style.border = '0';
    loginLogo.style.boxShadow = 'none';
    loginLogo.style.overflow = 'visible';
    loginLogo.innerHTML = '<img src="' + FAMILYAPP_APP_ICONS.login + '" alt="FamilyApp" style="width:100%;height:100%;display:block;object-fit:contain;background:transparent;border:0;border-radius:0;box-shadow:none;filter:drop-shadow(0 10px 18px rgba(72,22,126,.16)) drop-shadow(0 2px 5px rgba(214,160,55,.16))">';
  }
}

// Legacy callbacks remain available so old profile markup cannot throw.
function setAppIcon() { applyAppIcon(); }
function setIconColor() { applyAppIcon(); }
function saveAppIconToLink() {
  applyAppIcon();
  var st = document.getElementById('icon-save-status');
  if (st) st.innerHTML = '<span style="color:#16a34a">✓ FamilieApp gebruikt nu het vaste familiewapen.</span>';
  if (typeof showToast === 'function') showToast('FamilieApp familiewapen actief ✓');
}

(function initCanonicalAppIdentity() {
  try {
    localStorage.removeItem('familie_icon_emoji');
    localStorage.removeItem('familie_icon_color');
    localStorage.removeItem('familie_icon_photo');
  } catch (e) {}
  prepareReturningSessionSurface();
  ensureScaleFix();
  ensureCloudinaryPreconnect();
  ensureFeedbackStyleCascade();
  ensureFeedbackRound3Styles();
  ensureFeedbackRound4();
  ensureFeedbackRound5Styles();
  applyAppIcon();
})();