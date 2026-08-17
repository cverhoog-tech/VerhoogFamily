'use strict';
const fs = require('fs');
const assert = require('assert');
const { JSDOM } = require('jsdom');

const LOGIN_HTML = `<!DOCTYPE html><html><body>
<div id="login-screen" style="display:flex">
  <div id="login-step-1">
    <button onclick="signInWithGoogle()" id="google-btn" disabled aria-busy="true">
      <span id="google-btn-text">Inloggen voorbereiden…</span>
    </button>
  </div>
  <div id="login-step-2" style="display:none"></div>
  <div id="auth-error" style="display:none"></div>
</div>
<div id="screen-home"></div>
<div id="prelogin-css"></div>
</body></html>`;

// Builds a fresh, isolated window+document each time (both files use
// idempotency guards keyed on the window object, so scenarios must not
// share a window). Optionally installs firebase/fbAuth BEFORE the scripts
// run, to simulate the "already ready at load time" vs "becomes ready
// later" cases.
function createEnv(opts){
  opts = opts || {};
  const dom = new JSDOM(LOGIN_HTML, { url: opts.url || 'https://agent-preview-branch.vercel.app/', pretendToBeVisual: true, runScripts: 'outside-only' });
  const window = dom.window;
  const document = window.document;

  // Deterministic, fully-controlled fake timers. Real 15s/250ms/500ms waits
  // must never actually elapse in a test run.
  let timerSeq = 1;
  const timeouts = new Map();
  const intervals = new Map();
  window.setTimeout = function(fn, ms){ const id = timerSeq++; timeouts.set(id, { fn, ms }); return id; };
  window.clearTimeout = function(id){ timeouts.delete(id); };
  window.setInterval = function(fn, ms){ const id = timerSeq++; intervals.set(id, { fn, ms }); return id; };
  window.clearInterval = function(id){ intervals.delete(id); };

  function fireTimeoutsWithDelay(ms){
    const due = [...timeouts.entries()].filter(([, t]) => t.ms === ms);
    due.forEach(([id, t]) => { timeouts.delete(id); t.fn(); });
    return due.length;
  }
  function fireAllIntervalsOnce(){
    [...intervals.values()].forEach(t => t.fn());
  }

  const signInWithRedirectCalls = [];
  const signInWithPopupCalls = [];
  let popupBehavior = opts.popupBehavior || (() => Promise.resolve({ user: { uid: 'u1' } }));
  let redirectBehavior = opts.redirectBehavior || (() => undefined);

  function installFirebase(){
    let listenerFn = null;
    window.firebase = {
      auth: function(){
        return window.fbAuth;
      }
    };
    window.firebase.auth.GoogleAuthProvider = function(){ this.scopes = []; };
    window.firebase.auth.GoogleAuthProvider.prototype.addScope = function(s){ this.scopes.push(s); };
    window.firebase.auth.GoogleAuthProvider.prototype.setCustomParameters = function(){};
    window.fbAuth = {
      onAuthStateChanged: function(fn){ listenerFn = fn; },
      signInWithRedirect: function(provider){
        signInWithRedirectCalls.push(provider);
        const result = redirectBehavior();
        return result === undefined ? undefined : result;
      },
      signInWithPopup: function(provider){
        signInWithPopupCalls.push(provider);
        return popupBehavior();
      },
      signOut: function(){ return Promise.resolve(); }
    };
    return function emitAuthChanged(user){ if(listenerFn) listenerFn(user); };
  }

  if(opts.firebaseReadyAtLoad) installFirebase();

  const vmContext = dom.getInternalVMContext();
  const vm = require('vm');
  vm.runInContext(fs.readFileSync('src/core/authSessionBootstrap.js', 'utf8'), vmContext, { filename: 'authSessionBootstrap.js' });
  vm.runInContext(fs.readFileSync('src/core/authStartupReadinessGate.js', 'utf8'), vmContext, { filename: 'authStartupReadinessGate.js' });

  // Minimal stand-in for the real duoQuests.js signInWithGoogle — mirrors
  // the patched gate-integration exactly (requestLaunch/releaseLock/
  // markSuccess call sites), without pulling in the rest of that module's
  // unrelated globals.
  window.showAuthError = function(msg){
    const e = document.getElementById('auth-error');
    if(e){ e.textContent = msg; e.style.display = 'block'; }
  };
  window.translateFbError = function(e){ return (e && e.message) || 'Google-login mislukt'; };
  window.signInWithGoogle = function(){
    const gate = window.AuthStartupReadinessGate;
    if(gate && !gate.requestLaunch()) return;
    if(!window.fbAuth){
      window.showAuthError('Firebase niet verbonden.');
      if(gate) gate.releaseLock();
      return;
    }
    const provider = new window.firebase.auth.GoogleAuthProvider();
    provider.addScope('profile'); provider.addScope('email');
    const isMobile = opts.mobile === true;
    if(isMobile){
      let redirectPromise;
      try { redirectPromise = window.fbAuth.signInWithRedirect(provider); }
      catch(e){ window.showAuthError(window.translateFbError(e)); if(gate) gate.releaseLock(); return; }
      if(redirectPromise && typeof redirectPromise.catch === 'function'){
        redirectPromise.catch(function(e){ window.showAuthError(window.translateFbError(e)); if(gate) gate.releaseLock(); });
      }
    } else {
      window.fbAuth.signInWithPopup(provider).then(function(result){
        window.fbUser = result.user;
        if(gate) gate.markSuccess();
      }).catch(function(e){
        window.showAuthError(window.translateFbError(e));
        if(gate) gate.releaseLock();
      });
    }
  };

  return { window, document, dom, timeouts, intervals, fireTimeoutsWithDelay, fireAllIntervalsOnce, installFirebase, signInWithRedirectCalls, signInWithPopupCalls };
}

function btn(document){ return document.getElementById('google-btn'); }
function btnText(document){ return document.getElementById('google-btn-text').textContent; }

async function run(){
  // 1. Button disabled before Firebase is ready at all.
  {
    const env = createEnv({});
    assert.equal(btn(env.document).disabled, true, 'button must be disabled before Firebase is ready');
    assert.equal(btnText(env.document), 'Inloggen voorbereiden…');
  }

  // 2. fbAuth ready but AuthSessionBootstrap listener not yet ready -> disabled.
  {
    const env = createEnv({});
    // Simulate firebase SDK + fbAuth present, but do NOT let
    // AuthSessionBootstrap's canonical listener attach (no onAuthStateChanged
    // available yet from its perspective) by only partially installing.
    env.window.firebase = { auth: function(){ return undefined; } };
    env.window.firebase.auth.GoogleAuthProvider = function(){};
    // Re-run readiness evaluation the same way a lifecycle event would.
    env.window.dispatchEvent(new env.window.Event('pageshow'));
    assert.equal(btn(env.document).disabled, true, 'must stay disabled without the canonical listener');
  }

  // 3. Canonical listener ready -> enabled.
  {
    const env = createEnv({ firebaseReadyAtLoad: true });
    assert.equal(btn(env.document).disabled, false, 'button must enable once Firebase + canonical listener are ready');
    assert.equal(btnText(env.document), 'Inloggen met Google');
  }

  // 4. Fast tap before ready -> signInWithRedirect NOT called, no crash.
  {
    const env = createEnv({ mobile: true });
    env.window.signInWithGoogle();
    assert.equal(env.signInWithRedirectCalls.length, 0, 'redirect must not fire before readiness');
  }

  // 5. Double click after ready -> at most one auth launch.
  {
    const env = createEnv({ firebaseReadyAtLoad: true, mobile: true });
    env.window.signInWithGoogle();
    env.window.signInWithGoogle();
    assert.equal(env.signInWithRedirectCalls.length, 1, 'second rapid tap must be ignored');
    assert.equal(btnText(env.document), 'Bezig met inloggen…');
  }

  // 6. Mobile + ready -> exactly one signInWithRedirect.
  {
    const env = createEnv({ firebaseReadyAtLoad: true, mobile: true });
    env.window.signInWithGoogle();
    assert.equal(env.signInWithRedirectCalls.length, 1);
    assert.equal(env.signInWithPopupCalls.length, 0);
  }

  // 7. Desktop + ready -> exactly one signInWithPopup.
  {
    const env = createEnv({ firebaseReadyAtLoad: true, mobile: false });
    env.window.signInWithGoogle();
    assert.equal(env.signInWithPopupCalls.length, 1);
    assert.equal(env.signInWithRedirectCalls.length, 0);
  }

  // 8. Popup failure -> button available again (lock released).
  {
    const env = createEnv({
      firebaseReadyAtLoad: true,
      mobile: false,
      popupBehavior: () => Promise.reject({ code: 'auth/popup-closed-by-user', message: 'closed' })
    });
    env.window.signInWithGoogle();
    await Promise.resolve(); await Promise.resolve(); await Promise.resolve();
    assert.equal(btn(env.document).disabled, false, 'button must recover after popup failure');
    assert.equal(env.window.AuthStartupReadinessGate.isLaunching(), false);
  }

  // 9. pageshow / BFCache resume re-evaluates readiness without starting login.
  // Readiness is flipped WITHOUT emitting the 'listener-ready' event, so this
  // specifically exercises the pageshow fallback recheck path, not the
  // event-driven primary path.
  {
    const env = createEnv({});
    assert.equal(btn(env.document).disabled, true);
    env.installFirebase();
    env.window.__familyAuthSessionBootstrapListenerInstalled = true;
    const evt = new env.window.Event('pageshow');
    Object.defineProperty(evt, 'persisted', { value: true });
    env.window.dispatchEvent(evt);
    assert.equal(btn(env.document).disabled, false, 'pageshow/BFCache must re-sync readiness');
    assert.equal(env.signInWithRedirectCalls.length, 0, 'lifecycle recheck must never itself start login');
    assert.equal(env.signInWithPopupCalls.length, 0);
  }

  // 10. visibilitychange -> visible re-evaluates readiness (same fallback path).
  {
    const env = createEnv({});
    assert.equal(btn(env.document).disabled, true);
    env.installFirebase();
    env.window.__familyAuthSessionBootstrapListenerInstalled = true;
    Object.defineProperty(env.document, 'visibilityState', { value: 'visible', configurable: true });
    env.document.dispatchEvent(new env.window.Event('visibilitychange'));
    assert.equal(btn(env.document).disabled, false, 'visibility-visible must re-sync readiness');
  }

  // 11. Timeout -> visible retry state, and retry only restarts the check.
  {
    const env = createEnv({}); // never installs firebase -> never becomes ready
    const fired = env.fireTimeoutsWithDelay(15000);
    assert.equal(fired, 1, 'the 15s readiness timeout must have been scheduled exactly once');
    const err = env.document.getElementById('auth-error');
    assert.equal(err.style.display, 'block');
    assert.equal(err.textContent, 'Inloggen kon niet worden voorbereid. Probeer opnieuw.');
    const retryBtn = env.document.getElementById('auth-gate-retry-btn');
    assert(retryBtn, 'a retry button must be rendered');
    // Retry must only restart the readiness check, never start auth itself.
    env.installFirebase();
    env.window.__familyAuthSessionBootstrapListenerInstalled = true;
    retryBtn.onclick();
    assert.equal(btn(env.document).disabled, false, 'retry must re-run readiness and succeed once firebase is present');
    assert.equal(env.signInWithRedirectCalls.length, 0);
    assert.equal(env.signInWithPopupCalls.length, 0);
  }

  // 12. Preview authTestReset -> signOut + login screen visible again.
  {
    const dom = new JSDOM(LOGIN_HTML, { url: 'https://agent-preview-branch.vercel.app/?authTestReset=1', pretendToBeVisual: true, runScripts: 'outside-only' });
    const window = dom.window, document = window.document;
    window.setTimeout = () => 0; window.clearTimeout = () => {}; window.setInterval = () => 0; window.clearInterval = () => {};
    let signOutCalled = false;
    window.firebase = { auth: function(){ return window.fbAuth; } };
    window.firebase.auth.GoogleAuthProvider = function(){};
    window.fbAuth = {
      onAuthStateChanged: function(fn){ fn(null); },
      signOut: function(){ signOutCalled = true; return Promise.resolve(); }
    };
    document.body.classList.add('logged-in');
    document.getElementById('login-screen').style.display = 'none';
    window._appStarted = true;
    const vm = require('vm');
    vm.runInContext(fs.readFileSync('src/core/authSessionBootstrap.js', 'utf8'), dom.getInternalVMContext(), { filename: 'authSessionBootstrap.js' });
    vm.runInContext(fs.readFileSync('src/core/authStartupReadinessGate.js', 'utf8'), dom.getInternalVMContext(), { filename: 'authStartupReadinessGate.js' });
    assert.equal(signOutCalled, true, 'preview authTestReset must sign out');
    assert.equal(document.getElementById('login-screen').style.display, 'flex', 'login screen must be visible again');
    assert.equal(window._appStarted, false);
  }

  // 13. Production authTestReset -> fully ignored, no side effects.
  {
    const dom = new JSDOM(LOGIN_HTML, { url: 'https://verhoog-family.vercel.app/?authTestReset=1', pretendToBeVisual: true, runScripts: 'outside-only' });
    const window = dom.window, document = window.document;
    window.setTimeout = () => 0; window.clearTimeout = () => {}; window.setInterval = () => 0; window.clearInterval = () => {};
    let signOutCalled = false;
    window.firebase = { auth: function(){ return window.fbAuth; } };
    window.firebase.auth.GoogleAuthProvider = function(){};
    window.fbAuth = {
      onAuthStateChanged: function(fn){ fn({ uid: 'prod-user' }); },
      signOut: function(){ signOutCalled = true; return Promise.resolve(); }
    };
    document.body.classList.add('logged-in');
    document.getElementById('login-screen').style.display = 'none';
    window._appStarted = true;
    window.renderNav = function(){}; window.showScreen = function(){ document.getElementById('screen-home').classList.add('active'); };
    window.renderHome = function(){}; window.renderNotifs = function(){}; window.updateHomeXP = function(){};
    const vm = require('vm');
    vm.runInContext(fs.readFileSync('src/core/authSessionBootstrap.js', 'utf8'), dom.getInternalVMContext(), { filename: 'authSessionBootstrap.js' });
    vm.runInContext(fs.readFileSync('src/core/authStartupReadinessGate.js', 'utf8'), dom.getInternalVMContext(), { filename: 'authStartupReadinessGate.js' });
    assert.equal(signOutCalled, false, 'production must ignore authTestReset entirely');
    assert.equal(document.getElementById('login-screen').style.display, 'none', 'production session state must be untouched');
    assert.equal(window._appStarted, true);
  }

  // 14. authTestReset never touches household/profile localStorage data.
  {
    const dom = new JSDOM(LOGIN_HTML, { url: 'https://agent-preview-branch.vercel.app/?authTestReset=1', pretendToBeVisual: true, runScripts: 'outside-only' });
    const window = dom.window, document = window.document;
    window.setTimeout = () => 0; window.clearTimeout = () => {}; window.setInterval = () => 0; window.clearInterval = () => {};
    window.localStorage.setItem('familyapp-profile-name-v1', 'Shane');
    window.localStorage.setItem('familyapp-partner-name-v1', 'Esra');
    window.firebase = { auth: function(){ return window.fbAuth; } };
    window.firebase.auth.GoogleAuthProvider = function(){};
    window.fbAuth = { onAuthStateChanged: function(fn){ fn(null); }, signOut: function(){ return Promise.resolve(); } };
    const vm = require('vm');
    vm.runInContext(fs.readFileSync('src/core/authSessionBootstrap.js', 'utf8'), dom.getInternalVMContext(), { filename: 'authSessionBootstrap.js' });
    vm.runInContext(fs.readFileSync('src/core/authStartupReadinessGate.js', 'utf8'), dom.getInternalVMContext(), { filename: 'authStartupReadinessGate.js' });
    assert.equal(window.localStorage.getItem('familyapp-profile-name-v1'), 'Shane', 'profile data must survive authTestReset');
    assert.equal(window.localStorage.getItem('familyapp-partner-name-v1'), 'Esra', 'partner data must survive authTestReset');
  }

  console.log('auth-startup-readiness-gate: PASS');
}

run().catch(err => { console.error(err); process.exit(1); });
