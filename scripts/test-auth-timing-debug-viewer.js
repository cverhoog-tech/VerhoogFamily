'use strict';
const fs=require('fs');
const assert=require('assert');

const source=fs.readFileSync('src/core/authTimingDebugViewer.js','utf8');
const loader=fs.readFileSync('api/app.js','utf8');

// 1. The panel must be strictly opt-in via ?authdebug=1 and return immediately otherwise —
// normal users must never load or see any of this behavior.
assert.ok(/authdebug=1/.test(source),'debug viewer must gate on the authdebug=1 query flag');
const flagFnMatch=source.match(/function flagEnabled\(\)\{[\s\S]*?\n  \}/);
assert.ok(flagFnMatch,'debug viewer must expose a single flag-check function');
assert.ok(/if\(!flagEnabled\(\)\)return;/.test(source),'module must bail out immediately when the debug flag is absent');

// 2. Loader wiring: served, and loaded before the Google adapter so it can catch T0.
assert.ok(loader.includes('authTimingDebugViewer.js?v=1'),'runtime loader must serve the debug viewer');
const loaderDiagIdx=loader.indexOf('authTimingDiagnostics.js?v=1');
const loaderViewerIdx=loader.indexOf('authTimingDebugViewer.js?v=1');
const loaderGoogleIdx=loader.indexOf('googleAuthMobileFix.js?v=3');
assert.ok(loaderDiagIdx>=0&&loaderDiagIdx<loaderViewerIdx,'diagnostics module must be injected before the debug viewer');
assert.ok(loaderViewerIdx<loaderGoogleIdx,'debug viewer must be injected before the Google adapter');

// 3. No second auth/session/household authority: the viewer must be a pure read-only reader of
// window.getFamilyAppAuthTiming() and must never touch Firebase, auth state, or household
// resolution itself.
['.onAuthStateChanged(','a.signInWithPopup(','window.loadUserFamily(','firebase.auth()','FamilyHousehold.','AuthenticatedSessionController.'].forEach((forbidden)=>{
  assert.strictEqual(source.includes(forbidden),false,'debug viewer must not introduce a second auth/household authority via '+forbidden);
});
assert.ok(source.includes('getFamilyAppAuthTiming'),'debug viewer must read timings via the existing diagnostics accessor');

// 4. Privacy: no identifiers, credentials or tokens may ever be *used* by this module (comments
// describing the privacy guarantee itself are fine and expected). Strip comments before scanning
// so documentation prose doesn't produce false positives.
const codeOnly=source.replace(/\/\/.*$/gm,'').replace(/\/\*[\s\S]*?\*\//g,'');
['.uid','.email','photourl','fbfamilyid','householdid','accesstoken','idtoken','password','credential','displayname'].forEach((term)=>{
  assert.strictEqual(codeOnly.toLowerCase().includes(term.toLowerCase()),false,'debug viewer must never reference '+term+' outside of documentation comments');
});

// 5. Required UX: a copy affordance and a total must be present.
assert.ok(/Kopieer timings/.test(source),'debug viewer must expose a "Kopieer timings" action');
assert.ok(/clipboard/i.test(source),'debug viewer must use the Clipboard API (with a document.execCommand fallback for older iOS PWA WebKit)');
assert.ok(/execCommand\('copy'\)/.test(source),'debug viewer must fall back to execCommand copy when navigator.clipboard is unavailable');
assert.ok(/TOTAAL/.test(source),'debug viewer must render a total duration line');
assert.ok(/LIFECYCLE EVENTS/.test(source),'debug viewer must render lifecycle events (blur/focus/visibilitychange/pageshow/pagehide) alongside the T-marks');

console.log('auth timing debug viewer contract: PASS');
