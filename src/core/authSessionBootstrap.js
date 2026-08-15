'use strict';
// ============================================================
// AUTH SESSION BOOTSTRAP v1.0
// Single defensive transition from Firebase auth -> household -> visible app.
// Prevents mobile redirect flows from hiding login before the app can render.
// ============================================================
(function(){
  if(window.__familyAuthSessionBootstrapV1) return;
  window.__familyAuthSessionBootstrapV1 = true;

  var booting = false;
  var bootedUid = null;

  function currentUser(){
    try {
      return window.fbUser || (window.fbAuth && window.fbAuth.currentUser) ||
        (window.firebase && firebase.auth && firebase.auth().currentUser) || null;
    } catch(e){ return null; }
  }

  function showLoginError(message){
    var screen = document.getElementById('login-screen');
    var error = document.getElementById('auth-error');
    if(screen) screen.style.display = 'flex';
    if(error){
      error.textContent = message || 'De app kon na het inloggen niet worden geladen.';
      error.style.display = 'block';
    }
  }

  function safeCall(name, fn){
    try {
      if(typeof fn === 'function') fn();
      return true;
    } catch(e){
      console.error('[AuthSessionBootstrap] '+name+' failed', e);
      return false;
    }
  }

  function revealApp(user){
    var rendered = false;

    safeCall('renderNav', window.renderNav);

    if(typeof window.showScreen === 'function') {
      rendered = safeCall('showScreen(home)', function(){ window.showScreen('home'); });
    }
    if(!rendered && typeof window.renderHome === 'function') {
      rendered = safeCall('renderHome', window.renderHome);
    } else {
      safeCall('renderHome refresh', window.renderHome);
    }

    safeCall('renderNotifs', window.renderNotifs);
    safeCall('updateHomeXP', window.updateHomeXP);

    var home = document.getElementById('screen-home');
    if(home){
      home.classList.add('active');
      rendered = true;
    }

    if(!rendered) throw new Error('HOME_RENDER_FAILED');

    document.body.classList.add('logged-in');
    var preloginCss = document.getElementById('prelogin-css');
    if(preloginCss) preloginCss.remove();
    var login = document.getElementById('login-screen');
    if(login) login.style.display = 'none';

    window._appStarted = true;
    bootedUid = user && user.uid || null;

    safeCall('startFirebaseSync', window.startFirebaseSync);
    safeCall('notification subscription', function(){
      if(window.NotificationStore && typeof NotificationStore.ensureSubscription === 'function') {
        NotificationStore.ensureSubscription();
      }
    });
    safeCall('push notifications', window.setupPushNotifications);
    safeCall('welcome toast', function(){
      if(typeof window.showToast === 'function' && !window.__familyAuthWelcomeShown) {
        window.__familyAuthWelcomeShown = true;
        window.showToast('👋 Welkom '+(window.myName || (user && user.displayName) || '')+'!');
      }
    });
  }

  function bootAuthenticatedSession(user){
    user = user || currentUser();
    if(!user || booting) return Promise.resolve(false);
    if(window._appStarted && bootedUid === user.uid) {
      try {
        var login = document.getElementById('login-screen');
        if(login) login.style.display = 'none';
      } catch(e){}
      return Promise.resolve(true);
    }

    booting = true;
    window.fbUser = user;

    var load = typeof window.loadUserFamily === 'function'
      ? Promise.resolve().then(function(){ return window.loadUserFamily(); })
      : Promise.resolve();

    return load.then(function(){
      revealApp(user);
      return true;
    }).catch(function(error){
      console.error('[AuthSessionBootstrap] session boot failed', error);
      var code = error && error.code;
      if(code === 'HOUSEHOLD_REQUIRED' && typeof window.showNameSetupStep === 'function') {
        try {
          window.showNameSetupStep(user);
          var login = document.getElementById('login-screen');
          if(login) login.style.display = 'flex';
          return false;
        } catch(e){}
      }
      showLoginError('Inloggen gelukt, maar de app kon niet worden geopend. Vernieuw de pagina en probeer opnieuw.');
      return false;
    }).finally(function(){ booting = false; });
  }

  // Replace the legacy post-auth transition. The old auth listeners may still
  // detect Firebase state, but only this function decides when the app is revealed.
  window.onLoggedIn = function(){ return bootAuthenticatedSession(currentUser()); };
  try { onLoggedIn = window.onLoggedIn; } catch(e){}

  function recoverAuthenticatedRedirect(){
    var user = currentUser();
    if(user && !window._appStarted) bootAuthenticatedSession(user);
  }

  // Firebase redirect completion and auth-state restoration can race script load
  // on mobile Safari. A short deferred recovery makes the transition idempotent.
  setTimeout(recoverAuthenticatedRedirect, 0);
  setTimeout(recoverAuthenticatedRedirect, 500);
  window.addEventListener('pageshow', recoverAuthenticatedRedirect);
  window.addEventListener('focus', function(){
    if(currentUser() && !window._appStarted) recoverAuthenticatedRedirect();
  });

  window.AuthSessionBootstrap = {
    version: '1.0.0',
    boot: bootAuthenticatedSession,
    status: function(){
      var user = currentUser();
      return {booting:booting, started:!!window._appStarted, uid:user&&user.uid||null, bootedUid:bootedUid};
    }
  };
})();
