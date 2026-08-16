'use strict';
// ============================================================
// AUTH SESSION BOOTSTRAP v1.1
// Single defensive transition from Firebase auth -> household -> visible app.
// Resilient to redirect, BFCache resume, reconnect and auth context switches.
// ============================================================
(function(){
  if(window.__familyAuthSessionBootstrapV11) return;
  window.__familyAuthSessionBootstrapV11 = true;

  var booting = false;
  var bootedUid = null;
  var generation = 0;
  var activeBoot = null;

  function currentUser(){
    try {
      return window.fbUser || (window.fbAuth && window.fbAuth.currentUser) ||
        (window.firebase && firebase.auth && firebase.auth().currentUser) || null;
    } catch(e){ return null; }
  }

  function currentUid(){ var u=currentUser(); return u&&u.uid||null; }
  function emit(name,detail){ try{ window.dispatchEvent(new CustomEvent('familyapp:auth-bootstrap:'+name,{detail:detail||{}})); }catch(e){} }

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

  function assertCurrent(token){
    var uid=currentUid();
    if(!token || token.generation!==generation || uid!==token.uid){
      var e=new Error('AUTH_BOOT_CONTEXT_CHANGED');
      e.code='AUTH_BOOT_CONTEXT_CHANGED';
      throw e;
    }
  }

  function resetStartedState(reason){
    generation++;
    booting=false;
    activeBoot=null;
    bootedUid=null;
    window._appStarted=false;
    emit('reset',{reason:reason||'context-changed',uid:currentUid()});
  }

  function revealApp(user,token){
    assertCurrent(token);
    var rendered = false;

    safeCall('renderNav', window.renderNav);
    assertCurrent(token);

    if(typeof window.showScreen === 'function') {
      rendered = safeCall('showScreen(home)', function(){ window.showScreen('home'); });
    }
    if(!rendered && typeof window.renderHome === 'function') {
      rendered = safeCall('renderHome', window.renderHome);
    } else {
      safeCall('renderHome refresh', window.renderHome);
    }
    assertCurrent(token);

    safeCall('renderNotifs', window.renderNotifs);
    safeCall('updateHomeXP', window.updateHomeXP);

    var home = document.getElementById('screen-home');
    if(home){
      home.classList.add('active');
      rendered = true;
    }

    if(!rendered) throw new Error('HOME_RENDER_FAILED');
    assertCurrent(token);

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
    emit('ready',{uid:bootedUid});
  }

  function bootAuthenticatedSession(user){
    user = user || currentUser();
    if(!user) return Promise.resolve(false);

    if(window._appStarted && bootedUid && bootedUid !== user.uid) resetStartedState('uid-switch');
    if(window._appStarted && bootedUid === user.uid) {
      try {
        var login = document.getElementById('login-screen');
        if(login) login.style.display = 'none';
      } catch(e){}
      return Promise.resolve(true);
    }

    if(activeBoot && activeBoot.uid===user.uid) return activeBoot.promise;

    var token={uid:user.uid,generation:++generation};
    booting = true;
    window.fbUser = user;
    emit('start',{uid:user.uid,generation:token.generation});

    var load = typeof window.loadUserFamily === 'function'
      ? Promise.resolve().then(function(){ assertCurrent(token); return window.loadUserFamily(); })
      : Promise.resolve();

    var promise = load.then(function(){
      assertCurrent(token);
      revealApp(user,token);
      return true;
    }).catch(function(error){
      if(error && error.code === 'AUTH_BOOT_CONTEXT_CHANGED') return false;
      console.error('[AuthSessionBootstrap] session boot failed', error);
      var code = error && error.code;
      if(code === 'HOUSEHOLD_REQUIRED' && typeof window.showNameSetupStep === 'function') {
        try {
          assertCurrent(token);
          window.showNameSetupStep(user);
          var login = document.getElementById('login-screen');
          if(login) login.style.display = 'flex';
          return false;
        } catch(e){ if(e&&e.code==='AUTH_BOOT_CONTEXT_CHANGED') return false; }
      }
      if(token.generation===generation && currentUid()===token.uid){
        showLoginError('Inloggen gelukt, maar de app kon niet worden geopend. Vernieuw de pagina en probeer opnieuw.');
      }
      return false;
    }).finally(function(){
      if(activeBoot && activeBoot.generation===token.generation) activeBoot=null;
      if(token.generation===generation) booting=false;
    });

    activeBoot={uid:user.uid,generation:token.generation,promise:promise};
    return promise;
  }

  window.onLoggedIn = function(){ return bootAuthenticatedSession(currentUser()); };
  try { onLoggedIn = window.onLoggedIn; } catch(e){}

  function recoverAuthenticatedSession(reason){
    var user = currentUser();
    if(!user){
      if(window._appStarted || bootedUid) resetStartedState(reason||'auth-missing');
      return Promise.resolve(false);
    }
    if(bootedUid && bootedUid!==user.uid) resetStartedState(reason||'uid-changed');
    if(!window._appStarted) return bootAuthenticatedSession(user);
    try{
      if(window.HouseholdContext && typeof HouseholdContext.refresh==='function') HouseholdContext.refresh(reason||'lifecycle-recovery');
      if(window.HouseholdIdentityFirebaseBridge && typeof HouseholdIdentityFirebaseBridge.sync==='function') HouseholdIdentityFirebaseBridge.sync();
      if(window.FamilyDataStore && typeof FamilyDataStore.flushPending==='function' && window.offlineMode!==true) FamilyDataStore.flushPending().catch(function(){});
    }catch(e){}
    return Promise.resolve(true);
  }

  setTimeout(function(){recoverAuthenticatedSession('deferred-0');}, 0);
  setTimeout(function(){recoverAuthenticatedSession('deferred-500');}, 500);
  window.addEventListener('pageshow', function(e){ recoverAuthenticatedSession(e&&e.persisted?'pageshow-bfcache':'pageshow'); });
  window.addEventListener('focus', function(){ recoverAuthenticatedSession('focus'); });
  window.addEventListener('online', function(){ recoverAuthenticatedSession('online'); });
  document.addEventListener('visibilitychange', function(){
    if(document.visibilityState==='visible') recoverAuthenticatedSession('visibility-visible');
  });
  window.addEventListener('familyapp:session:cleared', function(){ resetStartedState('session-cleared'); });

  window.AuthSessionBootstrap = {
    version: '1.1.0',
    boot: bootAuthenticatedSession,
    recover: recoverAuthenticatedSession,
    reset: resetStartedState,
    status: function(){
      var user = currentUser();
      return {booting:booting, started:!!window._appStarted, uid:user&&user.uid||null, bootedUid:bootedUid,generation:generation,activeBootUid:activeBoot&&activeBoot.uid||null};
    }
  };
})();
