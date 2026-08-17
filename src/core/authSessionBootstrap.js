'use strict';
// ============================================================
// AUTH SESSION BOOTSTRAP v1.2
// THE single canonical owner of:
//   authenticated user -> household resolution -> first render -> app reveal
// No other module may call loadUserFamily()/onLoggedIn(), flip _appStarted,
// or hide/reveal the login screen on the authenticated-boot path. Other
// modules (HouseholdSessionHardening, HouseholdContext) may keep their own
// onAuthStateChanged subscriptions ONLY for observation/session bookkeeping
// (cleanup, presence, context publishing) — never to drive household load or
// DOM reveal themselves.
// Resilient to redirect, BFCache resume, reconnect and auth context switches.
// ============================================================
(function(){
  if(window.__familyAuthSessionBootstrapV12) return;
  window.__familyAuthSessionBootstrapV12 = true;

  var booting = false;
  var bootedUid = null;
  var generation = 0;
  var activeBoot = null;

  function currentUser(){
    try {
      return window.fbUser || (window.fbAuth && window.fbAuth.currentUser) ||
        (window.firebase && window.firebase.auth && window.firebase.auth().currentUser) || null;
    } catch(e){ return null; }
  }

  function currentUid(){ var u=currentUser(); return u&&u.uid||null; }
  function emit(name,detail){ try{ window.dispatchEvent(new CustomEvent('familyapp:auth-bootstrap:'+name,{detail:detail||{}})); }catch(e){} }

  // Any bootstrap failure state must leave something VISIBLE — never a blank
  // screen. opts.retry, when given, renders a retry action so an authenticated
  // recovery/error UI is always actionable, not a dead end.
  function showLoginError(message, opts){
    opts = opts || {};
    var screen = document.getElementById('login-screen');
    var error = document.getElementById('auth-error');
    if(screen) screen.style.display = 'flex';
    if(error){
      error.textContent = message || 'De app kon na het inloggen niet worden geladen.';
      error.style.display = 'block';
      if(opts.retry){
        try{
          var btn = document.getElementById('auth-boot-retry-btn');
          if(!btn && error.parentNode){
            btn = document.createElement('button');
            btn.id = 'auth-boot-retry-btn';
            btn.type = 'button';
            btn.textContent = 'Opnieuw proberen';
            btn.style.cssText = 'margin-top:8px;width:100%;background:var(--c-primary,#2d5a27);color:#fff;border:none;border-radius:10px;padding:10px;font-size:13px;font-weight:700;cursor:pointer';
            error.parentNode.insertBefore(btn, error.nextSibling);
          }
          if(btn) btn.onclick = opts.retry;
        }catch(e){}
      }
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
    var wasStarted=!!window._appStarted;
    window._appStarted=false;
    // A reset (uid switch, household switch, signed out, session cleared)
    // must never leave the PREVIOUS user's revealed app on screen with
    // nothing to show it's stale. If the app was already revealed, fall back
    // to a visible state; the next successful boot (if any) will reveal
    // fresh content over it. This is what "household switch -> correcte
    // rebind zonder stale reveal" and "stale UID generation mag huidige UI
    // niet wijzigen" together require: the OLD owner may not leave the UI in
    // a state nobody currently owns.
    if(wasStarted){
      try{
        var login=document.getElementById('login-screen');
        if(login && login.style.display==='none') login.style.display='flex';
      }catch(e){}
      try{ document.body.classList.remove('logged-in'); }catch(e){}
    }
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
      if(window.NotificationStore && typeof window.NotificationStore.ensureSubscription === 'function') {
        window.NotificationStore.ensureSubscription();
      }
    });
    safeCall('push notifications', window.setupPushNotifications);
    // Daily login bonus has no other trigger anywhere in the app (unlike
    // checkAchievements, which re-runs on every awardXP() call, or
    // renderFeed/renderFinance, which their own realtime stores already
    // drive when their screen is active) — deferred slightly so DOM from the
    // reveal above has settled first.
    setTimeout(function(){ safeCall('checkDailyBonus', window.checkDailyBonus); }, 400);
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
      // A stale (superseded) generation cancels itself silently — but ONLY
      // because a newer generation already owns (or is about to own) the UI.
      // It must never be the reason the UI goes blank.
      if(error && error.code === 'AUTH_BOOT_CONTEXT_CHANGED') return false;
      console.error('[AuthSessionBootstrap] session boot failed', error);
      var code = error && error.code;
      var isCurrentGeneration = token.generation===generation && currentUid()===token.uid;

      if((code === 'HOUSEHOLD_REQUIRED' || code === 'HOUSEHOLD_ACCESS_REVOKED') && typeof window.showNameSetupStep === 'function') {
        try {
          assertCurrent(token);
          window.showNameSetupStep(user);
          var login = document.getElementById('login-screen');
          if(login) login.style.display = 'flex';
          return false;
        } catch(e){ if(e&&e.code==='AUTH_BOOT_CONTEXT_CHANGED') return false; }
      }

      if(isCurrentGeneration){
        var message = code === 'HOUSEHOLD_ACCESS_REVOKED'
          ? 'Je toegang tot dit gezin is niet meer actief. Maak een nieuw gezin aan of vraag een nieuwe uitnodiging.'
          : 'Inloggen gelukt, maar de app kon niet worden geopend.';
        showLoginError(message, {retry: function(){
          try{
            var errEl = document.getElementById('auth-error');
            if(errEl) errEl.style.display = 'none';
          }catch(e){}
          bootAuthenticatedSession(currentUser());
        }});
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

  // THE canonical Firebase auth subscription that actually drives household
  // load + first render + reveal. Every sign-in path (Google redirect,
  // Google popup, email/password, redirect return) funnels through this one
  // listener via Firebase's own auth state, instead of each sign-in method
  // separately racing to bootstrap the app.
  function installCanonicalAuthListener(){
    if(window.__familyAuthSessionBootstrapListenerInstalled) return;
    try{
      var authInstance = window.fbAuth || (window.firebase && window.firebase.auth && window.firebase.auth());
      if(!authInstance || typeof authInstance.onAuthStateChanged !== 'function') return;
      authInstance.onAuthStateChanged(function(user){
        if(user) bootAuthenticatedSession(user);
        else resetStartedState('auth-signed-out');
      });
      window.__familyAuthSessionBootstrapListenerInstalled = true;
      // Readiness signal ONLY — this does not add a new post-auth action
      // owner. It just lets pre-auth code (e.g. the Google-login readiness
      // gate) know the canonical listener is actually attached, instead of
      // guessing or polling internal state.
      emit('listener-ready',{});
    }catch(e){ console.error('[AuthSessionBootstrap] could not attach canonical auth listener', e); }
  }
  installCanonicalAuthListener();
  // Firebase itself (firebase.initializeApp/fbAuth) may not exist yet at
  // parse time depending on script order, so keep trying briefly.
  (function pollForAuthListener(tries){
    if(window.__familyAuthSessionBootstrapListenerInstalled || tries>120) return;
    setTimeout(function(){
      installCanonicalAuthListener();
      pollForAuthListener(tries+1);
    },250);
  })(0);

  function recoverAuthenticatedSession(reason){
    var user = currentUser();
    if(!user){
      if(window._appStarted || bootedUid) resetStartedState(reason||'auth-missing');
      return Promise.resolve(false);
    }
    if(bootedUid && bootedUid!==user.uid) resetStartedState(reason||'uid-changed');
    if(!window._appStarted) return bootAuthenticatedSession(user);
    try{
      if(window.HouseholdContext && typeof window.HouseholdContext.refresh==='function') window.HouseholdContext.refresh(reason||'lifecycle-recovery');
      if(window.HouseholdIdentityFirebaseBridge && typeof window.HouseholdIdentityFirebaseBridge.sync==='function') window.HouseholdIdentityFirebaseBridge.sync();
      if(window.FamilyDataStore && typeof window.FamilyDataStore.flushPending==='function' && window.offlineMode!==true) window.FamilyDataStore.flushPending().catch(function(){});
    }catch(e){
      console.warn('[AuthSessionBootstrap] lifecycle recovery hook failed',e);
    }
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
    version: '1.2.0',
    boot: bootAuthenticatedSession,
    recover: recoverAuthenticatedSession,
    reset: resetStartedState,
    // Readiness accessor for pre-auth gating code (e.g. the Google-login
    // readiness gate). Purely observational — does not participate in the
    // post-auth household-load/reveal chain above.
    listenerReady: function(){ return !!window.__familyAuthSessionBootstrapListenerInstalled; },
    status: function(){
      var user = currentUser();
      return {booting:booting, started:!!window._appStarted, uid:user&&user.uid||null, bootedUid:bootedUid,generation:generation,activeBootUid:activeBoot&&activeBoot.uid||null};
    }
  };
})();
