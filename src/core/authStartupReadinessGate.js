'use strict';
// ============================================================
// AUTH STARTUP READINESS GATE v1
// Prevents Google sign-in from being able to start before Firebase Auth AND
// the canonical AuthSessionBootstrap listener are actually ready. This is a
// PRE-auth gate only — it does not add a new post-auth action owner.
// AuthSessionBootstrap remains the sole owner of household load / first
// render / reveal; this module never calls loadUserFamily()/onLoggedIn() and
// never touches _appStarted or the login-screen reveal itself, except for
// the explicit preview-only ?authTestReset=1 UI reset (never on production,
// never touching household/profile data).
// ============================================================
(function(){
  if(window.__familyAuthStartupReadinessGateV1) return;
  window.__familyAuthStartupReadinessGateV1 = true;

  var READY_TIMEOUT_MS = 15000;
  var POLL_INTERVAL_MS = 500; // fallback safety net only; the event above is primary
  var PRODUCTION_HOSTNAME = 'verhoog-family.vercel.app';

  var ready = false;
  var launching = false;
  var timeoutTimer = null;
  var pollTimer = null;

  function btn(){ return document.getElementById('google-btn'); }
  function textEl(){ return document.getElementById('google-btn-text'); }
  function errEl(){ return document.getElementById('auth-error'); }

  function setButtonState(state){
    var b = btn(), t = textEl();
    if(!b) return;
    if(state === 'preparing'){
      b.disabled = true;
      b.style.cursor = 'not-allowed';
      b.style.opacity = '.6';
      b.setAttribute('aria-busy','true');
      if(t) t.textContent = 'Inloggen voorbereiden…';
    } else if(state === 'ready'){
      b.disabled = false;
      b.style.cursor = 'pointer';
      b.style.opacity = '1';
      b.removeAttribute('aria-busy');
      if(t) t.textContent = 'Inloggen met Google';
    } else if(state === 'launching'){
      b.disabled = true;
      b.style.cursor = 'not-allowed';
      b.style.opacity = '.85';
      b.setAttribute('aria-busy','true');
      if(t) t.textContent = 'Bezig met inloggen…';
    } else if(state === 'success'){
      b.disabled = true;
      b.style.opacity = '.85';
      if(t) t.textContent = '✅ Ingelogd';
    } else if(state === 'error'){
      b.disabled = true;
      b.style.cursor = 'not-allowed';
      b.style.opacity = '.6';
      b.removeAttribute('aria-busy');
      if(t) t.textContent = 'Inloggen niet beschikbaar';
    }
  }

  function firebaseSdkReady(){
    try { return typeof firebase !== 'undefined' && !!firebase.auth; } catch(e){ return false; }
  }
  function fbAuthReady(){
    try {
      var a = window.fbAuth || (window.firebase && window.firebase.auth && window.firebase.auth());
      return !!(a && typeof a.onAuthStateChanged === 'function');
    } catch(e){ return false; }
  }
  function bootstrapReady(){
    try {
      return !!(window.AuthSessionBootstrap && typeof window.AuthSessionBootstrap.listenerReady === 'function' && window.AuthSessionBootstrap.listenerReady());
    } catch(e){ return false; }
  }
  function computeReady(){
    return firebaseSdkReady() && fbAuthReady() && bootstrapReady();
  }

  function clearTimers(){
    if(timeoutTimer){ clearTimeout(timeoutTimer); timeoutTimer = null; }
    if(pollTimer){ clearInterval(pollTimer); pollTimer = null; }
  }

  function clearFailureUi(){
    var e = errEl();
    if(e && e.dataset && e.dataset.authGateError === '1'){
      e.textContent = '';
      e.style.display = 'none';
      delete e.dataset.authGateError;
    }
    var retry = document.getElementById('auth-gate-retry-btn');
    if(retry) retry.parentNode && retry.parentNode.removeChild(retry);
  }

  function markReady(){
    if(ready) return;
    ready = true;
    clearTimers();
    clearFailureUi();
    if(!launching) setButtonState('ready');
  }

  function evaluateReadiness(){
    if(ready) return true;
    if(computeReady()){ markReady(); return true; }
    return false;
  }

  function startTimeoutWatch(){
    if(timeoutTimer) return;
    timeoutTimer = setTimeout(function(){
      if(ready) return;
      showTimeoutFailure();
    }, READY_TIMEOUT_MS);
  }

  function startFallbackPoll(){
    // Fallback safety net only — the 'listener-ready' event from
    // AuthSessionBootstrap is the primary readiness signal. This just
    // covers the case where that event fired before this module attached
    // its listener (e.g. an unusually fast script-order edge case).
    if(pollTimer) return;
    pollTimer = setInterval(function(){
      if(ready){ clearTimers(); return; }
      evaluateReadiness();
    }, POLL_INTERVAL_MS);
  }

  function showTimeoutFailure(){
    setButtonState('error');
    var e = errEl();
    if(e){
      e.textContent = 'Inloggen kon niet worden voorbereid. Probeer opnieuw.';
      e.style.display = 'block';
      e.dataset.authGateError = '1';
      var retry = document.getElementById('auth-gate-retry-btn');
      if(!retry && e.parentNode){
        retry = document.createElement('button');
        retry.id = 'auth-gate-retry-btn';
        retry.type = 'button';
        retry.textContent = 'Opnieuw proberen';
        retry.style.cssText = 'margin-top:8px;width:100%;background:var(--c-primary,#2d5a27);color:#fff;border:none;border-radius:10px;padding:10px;font-size:13px;font-weight:700;cursor:pointer';
        e.parentNode.insertBefore(retry, e.nextSibling);
      }
      if(retry) retry.onclick = restartReadinessCheck;
    }
  }

  function restartReadinessCheck(){
    clearFailureUi();
    clearTimers();
    setButtonState('preparing');
    if(!evaluateReadiness()){
      startTimeoutWatch();
      startFallbackPoll();
    }
  }

  function showNotReadyMessage(){
    // Covers a fast tap / programmatic call that slips in before READY.
    // Never starts any auth flow — just makes the "not ready yet" state
    // visible, matching the disabled-button messaging.
    var e = errEl();
    if(e && !ready){
      e.textContent = 'Inloggen wordt voorbereid…';
      e.style.display = 'block';
    }
  }

  function isProductionHost(){
    var host = '';
    try { host = window.location.hostname || ''; } catch(e){}
    return host === PRODUCTION_HOSTNAME;
  }

  function maybeHandleAuthTestReset(){
    try{
      var search = (window.location && window.location.search) || '';
      if(!/[?&]authTestReset=1(?:&|$)/.test(search)) return;
      if(isProductionHost()) return; // fully ignored on production, no side effects

      var auth = window.fbAuth || (window.firebase && window.firebase.auth && window.firebase.auth());
      if(auth && typeof auth.signOut === 'function'){
        auth.signOut().catch(function(){});
      }

      // Local auth-test UI state only. Deliberately does NOT touch
      // household/profile/Firebase data, and does NOT broadly clear
      // localStorage.
      launching = false;
      ready = false;
      clearFailureUi();
      window._appStarted = false;
      try { document.body.classList.remove('logged-in'); } catch(e){}

      var login = document.getElementById('login-screen');
      if(login) login.style.display = 'flex';
      var s1 = document.getElementById('login-step-1');
      var s2 = document.getElementById('login-step-2');
      if(s1) s1.style.display = 'block';
      if(s2) s2.style.display = 'none';

      setButtonState('preparing');
      clearTimers();
      if(!evaluateReadiness()){
        startTimeoutWatch();
        startFallbackPoll();
      }
    }catch(e){ console.warn('[AuthStartupReadinessGate] authTestReset failed', e); }
  }

  function lifecycleRecheck(){
    // Lifecycle re-checks only ever sync the enabled/disabled visual state.
    // They must NEVER start a login attempt themselves.
    if(!ready) evaluateReadiness();
  }

  window.addEventListener('familyapp:auth-bootstrap:listener-ready', function(){ evaluateReadiness(); });
  document.addEventListener('DOMContentLoaded', lifecycleRecheck);
  window.addEventListener('pageshow', lifecycleRecheck);
  document.addEventListener('visibilitychange', function(){
    if(document.visibilityState === 'visible') lifecycleRecheck();
  });

  window.AuthStartupReadinessGate = {
    version: '1.0.0',
    isReady: function(){ return ready; },
    isLaunching: function(){ return launching; },
    // Called by signInWithGoogle before doing anything else. Returns true if
    // the caller may proceed; false if it must abort (a message is already
    // shown to the user in that case).
    requestLaunch: function(){
      if(!ready){ showNotReadyMessage(); return false; }
      if(launching) return false; // second tap ignored — no extra message
      launching = true;
      setButtonState('launching');
      return true;
    },
    // Called when a launched sign-in attempt fails in a way that does NOT
    // lead to navigation (popup closed/blocked, redirect call itself
    // rejected). Must NOT be called for a redirect flow that is genuinely
    // about to navigate away.
    releaseLock: function(){
      launching = false;
      if(ready) setButtonState('ready');
    },
    // Called on a successful popup sign-in. The lock intentionally stays
    // held — AuthSessionBootstrap is about to reveal the app / hide the
    // login screen via its own canonical listener.
    markSuccess: function(){
      setButtonState('success');
    },
    status: function(){ return {ready:ready, launching:launching}; }
  };

  // Initial boot: default to NOT ready. The button itself already ships
  // disabled in the HTML so there is no window at all — not even before
  // this script has run — where a fast tap could slip through.
  setButtonState('preparing');
  if(!evaluateReadiness()){
    startTimeoutWatch();
    startFallbackPoll();
  }
  maybeHandleAuthTestReset();
})();
