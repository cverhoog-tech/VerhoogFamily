'use strict';
// ============================================================
// STARTUP TRACE v1 — DIAGNOSTIC ONLY, NO FUNCTIONAL CHANGES
//
// Purpose: give visible, privacy-safe evidence of exactly where the
// login/setup -> first-render -> reveal pipeline stops on a real device
// (specifically iPhone Safari), without changing any reveal behavior.
//
// Every wrapper below is a strict passthrough: call the original
// function, record what happened, and either return its result or
// re-throw the exact same error it threw. Nothing here suppresses,
// delays, retries, or alters any existing code path. This is
// intentionally NOT a fix — see the accompanying report for analysis.
//
// Privacy: only records event names, elapsed milliseconds, a coarse
// "available"/"missing" flag for functions, and error.name/error.message
// for JS errors thrown by our own code (e.g. "ReferenceError: renderNotifs
// is not defined" — generic JS error text, never user data). Never records
// uid, householdId, names, emails, financial data, household data, tokens,
// or any free-text app content.
// ============================================================
(function(){
  if(window.__familyStartupTraceV1) return;
  window.__familyStartupTraceV1 = true;

  var PRODUCTION_HOSTNAME = 'verhoog-family.vercel.app';
  var startedAt = Date.now();
  var buffer = [];
  var MAX_EVENTS = 500;

  function isProductionHost(){
    var host = '';
    try { host = window.location.hostname || ''; } catch(e){}
    return host === PRODUCTION_HOSTNAME;
  }
  // Entirely inert on production, regardless of query params. This check
  // gates BOTH the trace buffer and the debug panel below.
  if(isProductionHost()) return;

  function trace(event, info){
    info = info || {};
    var entry = {
      event: String(event),
      t: Date.now() - startedAt
    };
    if(info.fnType) entry.fnType = info.fnType; // 'available' | 'missing'
    if(info.errorName) entry.errorName = info.errorName;
    if(info.errorMessage) entry.errorMessage = String(info.errorMessage).slice(0, 200);
    buffer.push(entry);
    if(buffer.length > MAX_EVENTS) buffer.shift();
    try { renderPanel(); } catch(e){}
    return entry;
  }

  // ---- Wrap a global function by name with a strict start/ok/error
  // passthrough. Never installs a function that doesn't already exist —
  // that would change ReferenceError behavior for callers that reference
  // it as a bare (unqualified) identifier, which is exactly the behavior
  // we need unmodified evidence of.
  function wrapGlobal(name, label){
    var existing = window[name];
    if(typeof existing !== 'function'){
      trace('fn-check:' + (label || name), { fnType: 'missing' });
      return;
    }
    trace('fn-check:' + (label || name), { fnType: 'available' });
    var wrapped = function(){
      trace('reveal:' + (label || name) + ':start');
      try {
        var result = existing.apply(this, arguments);
        trace('reveal:' + (label || name) + ':ok');
        return result;
      } catch(e){
        trace('reveal:' + (label || name) + ':error', {
          errorName: e && e.name,
          errorMessage: e && e.message
        });
        throw e; // preserve exact original failure behavior
      }
    };
    wrapped.__familyStartupTraceWrapped = true;
    try { window[name] = wrapped; } catch(e){}
  }

  // Snapshot DOM/state that the reveal pipeline is expected to change.
  function traceDomSnapshot(label){
    try {
      var login = document.getElementById('login-screen');
      var loginVisible = login ? (login.style.display !== 'none') : null;
      var loggedIn = document.body ? document.body.classList.contains('logged-in') : null;
      var appStarted = !!window._appStarted;
      trace('dom:' + label, {
        fnType: (loginVisible === false ? 'login-hidden' : loginVisible === true ? 'login-visible' : 'login-screen-missing')
      });
      trace('state:' + label, {
        fnType: (loggedIn ? 'logged-in-class-set' : 'logged-in-class-absent') + '/' + (appStarted ? 'appStarted-true' : 'appStarted-false')
      });
    } catch(e){}
  }

  // ---- Install wrappers around the functions the reveal pipeline calls.
  // These are all statically-loaded, always-present-by-this-point functions
  // (this script loads last, after every synchronous <script> tag), so
  // wrapping them cannot itself change availability timing.
  ['renderNav','renderHome','updateHomeXP','checkAchievements','checkDailyBonus',
   'showScreen','_renderScreen','hideLoginScreen','useOfflineMode'
  ].forEach(function(name){ wrapGlobal(name); });

  // renderNotifs is loaded asynchronously via a multi-hop dynamic
  // script-injection chain (swipe.js -> familyDataStore.js -> notificationStore.js
  // -> notificationEvents.js -> notificationActions.js -> notificationCenter.js).
  // It is very likely NOT yet defined when this script runs. We deliberately
  // do NOT create window.renderNotifs if it's missing (that would silently
  // fix the exact crash we're trying to observe). We only record whether it
  // exists right now, and poll (briefly, diagnostic-only, preview-gated) for
  // when it actually becomes available, so we can see the real race window.
  (function traceRenderNotifsAvailability(){
    var already = typeof window.renderNotifs === 'function';
    trace('fn-check:renderNotifs', { fnType: already ? 'available' : 'missing' });
    if(already){ wrapGlobal('renderNotifs'); return; }
    var tries = 0;
    var timer = setInterval(function(){
      tries++;
      if(typeof window.renderNotifs === 'function'){
        clearInterval(timer);
        trace('fn-became-available:renderNotifs', { t: Date.now() - startedAt });
        wrapGlobal('renderNotifs');
        return;
      }
      if(tries > 40){ clearInterval(timer); trace('fn-check:renderNotifs:gave-up-waiting'); }
    }, 250);
  })();

  // ---- Login action entry points (offline / google) — envelope only.
  (function wrapLoginActions(){
    if(typeof window.useOfflineMode === 'function'){
      var origOffline = window.useOfflineMode;
      window.useOfflineMode = function(){
        trace('login-action:offline');
        traceDomSnapshot('before-offline');
        try {
          var r = origOffline.apply(this, arguments);
          traceDomSnapshot('after-offline');
          trace('reveal:offline-complete');
          return r;
        } catch(e){
          traceDomSnapshot('after-offline-error');
          trace('reveal:offline-error', { errorName: e && e.name, errorMessage: e && e.message });
          throw e;
        }
      };
      try { useOfflineMode = window.useOfflineMode; } catch(e){}
    }
    if(typeof window.signInWithGoogle === 'function'){
      var origGoogle = window.signInWithGoogle;
      window.signInWithGoogle = function(){
        trace('login-action:google');
        return origGoogle.apply(this, arguments);
      };
      try { signInWithGoogle = window.signInWithGoogle; } catch(e){}
    }
  })();

  // ---- AuthSessionBootstrap already emits lifecycle events on window —
  // listen only, zero risk, zero duplication of its own logic.
  ['start','ready','reset','listener-ready'].forEach(function(name){
    window.addEventListener('familyapp:auth-bootstrap:' + name, function(){
      trace('boot:' + name);
      if(name === 'ready'){
        traceDomSnapshot('after-auth-reveal');
        trace('reveal:complete');
      }
    });
  });

  trace('reveal:trace-installed');
  traceDomSnapshot('at-trace-install');

  // ---- Preview-only visible debug panel (?startupTrace=1). Stays fixed +
  // very high z-index so it remains visible even if the rest of the app is
  // a blank white screen. Never rendered on production (already returned
  // above for that case).
  var panelEl = null, listEl = null, panelEnabled = false;
  (function maybeEnablePanel(){
    try {
      var search = (window.location && window.location.search) || '';
      panelEnabled = /[?&]startupTrace=1(?:&|$)/.test(search);
    } catch(e){ panelEnabled = false; }
  })();

  function ensurePanel(){
    if(panelEl || !panelEnabled) return;
    panelEl = document.createElement('div');
    panelEl.id = 'family-startup-trace-panel';
    panelEl.style.cssText = 'position:fixed;left:0;right:0;bottom:0;max-height:45vh;overflow-y:auto;'
      + 'background:rgba(10,10,20,.94);color:#d1fae5;font:11px/1.4 -apple-system,Menlo,monospace;'
      + 'padding:8px 10px 24px;z-index:2147483647;box-shadow:0 -4px 20px rgba(0,0,0,.4);'
      + '-webkit-user-select:text;user-select:text';
    var header = document.createElement('div');
    header.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;font-weight:700;color:#fff';
    header.textContent = '⚙️ Startup trace (preview only)';
    var copyBtn = document.createElement('button');
    copyBtn.textContent = 'Log naar console';
    copyBtn.style.cssText = 'background:#2d5a27;color:#fff;border:none;border-radius:6px;padding:4px 8px;font-size:10px;margin-left:8px';
    copyBtn.onclick = function(){ console.log('[__familyStartupTrace]', JSON.stringify(buffer, null, 2)); };
    header.appendChild(copyBtn);
    listEl = document.createElement('div');
    panelEl.appendChild(header);
    panelEl.appendChild(listEl);
    (document.body || document.documentElement).appendChild(panelEl);
  }

  function renderPanel(){
    if(!panelEnabled) return;
    ensurePanel();
    if(!listEl) return;
    listEl.innerHTML = buffer.map(function(e){
      var color = /error/.test(e.event) ? '#fca5a5' : /missing|gave-up/.test(e.event) ? '#fde68a' : '#a7f3d0';
      var extra = '';
      if(e.fnType) extra += ' [' + e.fnType + ']';
      if(e.errorName) extra += ' — ' + e.errorName + (e.errorMessage ? ': ' + e.errorMessage : '');
      return '<div style="color:' + color + '">+' + e.t + 'ms &nbsp;' + e.event + extra + '</div>';
    }).join('');
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', function(){ ensurePanel(); renderPanel(); });
  } else {
    ensurePanel(); renderPanel();
  }

  window.__familyStartupTrace = buffer;
  window.__familyStartupTraceExport = function(){
    var json = JSON.stringify(buffer, null, 2);
    console.log('[__familyStartupTrace]', json);
    return json;
  };
})();
