'use strict';
const fs=require('fs');
const vm=require('vm');
const assert=require('assert');

const source=fs.readFileSync('src/core/authTimingDiagnostics.js','utf8');
const google=fs.readFileSync('src/core/googleAuthMobileFix.js','utf8');
const controller=fs.readFileSync('src/core/authenticatedSessionController.js','utf8');
const household=fs.readFileSync('src/core/householdPlatform.js','utf8');

// 1. The diagnostics module must never reference tokens/credentials/PII, even in comments,
// since its console output is expected to be pasted back for real-device debugging.
['accesstoken','idtoken','refreshtoken','password','privatekey','fcmtoken','devicetoken'].forEach((term)=>{
  assert.strictEqual(source.toLowerCase().includes(term),false,'auth timing diagnostics must never reference '+term);
});

// 2. Every stage required by fix #7's diagnosis plan (T0-T13) is actually instrumented in the
// real login critical path files, not just present in the diagnostics module itself.
const requiredGoogleMarks=['T0-login-tap','T1-before-signInWithPopup','T2-popup-call-issued','T3-popup-promise-resolved','T4-popup-user-received','T5-acceptAuthenticatedUser-called'];
requiredGoogleMarks.forEach((label)=>assert.ok(google.includes(label),'googleAuthMobileFix.js must mark '+label));

const requiredControllerMarks=['T6-onAuthStateChanged-fired','T7-bootstrap-started','T8-loadUserFamily-started','T11-loadUserFamily-resolved','T12-revealApp-started','T13-home-visible'];
requiredControllerMarks.forEach((label)=>assert.ok(controller.includes(label),'authenticatedSessionController.js must mark '+label));

const requiredHouseholdMarks=['T9-household-read-started','T10-household-read-finished'];
requiredHouseholdMarks.forEach((label)=>assert.ok(household.includes(label),'householdPlatform.js must mark '+label));

// 3. T13 must be captured after Home's critical-path calls but before the non-blocking
// secondary syncs (startFirebaseSync/NotificationStore/push), so a slow secondary subsystem
// cannot be mistaken for the Home-reveal freeze itself (Scenario C from the fix #7 brief).
const revealIdx=controller.indexOf('function revealApp');
const showScreenIdx=controller.indexOf("showScreen('home')",revealIdx);
const t13Idx=controller.indexOf('T13-home-visible',revealIdx);
const syncIdx=controller.indexOf('startFirebaseSync',revealIdx);
assert.ok(revealIdx>=0&&showScreenIdx>revealIdx&&t13Idx>showScreenIdx&&syncIdx>t13Idx,'T13 must be marked after Home is shown but before non-critical secondary syncs start');

// 4. Loader must serve the diagnostics module and revealApp must finish the timing attempt so
// repeated login attempts each produce a clean single summary.
assert.ok(controller.includes("finishTiming('reveal')"),'revealApp must close out the timing summary once Home is shown');
assert.ok(controller.includes("finishTiming('recoverableError')"),'a recoverable startup failure must also close out the timing summary');

// 5. Behavioral smoke test of the diagnostics module in isolation, using a minimal
// window/document/performance shim (no network/DOM required beyond that).
function scriptsAppLoader(){
  return require('../api/app.js');
}
(async function(){
  const appHandler=scriptsAppLoader();
  let body='';
  const res={setHeader(){},status(){return this;},send(value){body=String(value);return this;}};
  await appHandler({},res);
  assert.ok(body.includes('src/core/authTimingDiagnostics.js?v=1'),'runtime loader must serve authTimingDiagnostics.js');

  const logs=[];
  const listeners={};
  const window={addEventListener(evt,fn){(listeners[evt]=listeners[evt]||[]).push(fn);}};
  const document={visibilityState:'visible',hasFocus(){return true;}};
  const perf={now(){return Date.now();}};
  const sandbox={window,document,console:{log(msg){logs.push(msg);},error(){}},performance:perf,Math,Date};
  vm.runInNewContext(source,sandbox,{filename:'authTimingDiagnostics.js'});

  assert.strictEqual(typeof window.__familyAuthTiming.begin,'function','diagnostics must expose begin()');
  const id=window.__familyAuthTiming.begin('T0-login-tap');
  assert.ok(id,'begin() must return an attempt id');
  window.__familyAuthTiming.mark('T1-before-signInWithPopup');
  window.__familyAuthTiming.mark('T13-summary-end:reveal');
  const inProgress=window.getFamilyAppAuthTiming();
  assert.ok(inProgress&&inProgress.inProgress===true,'getFamilyAppAuthTiming must expose the in-progress attempt');
  assert.strictEqual(inProgress.marks.length,3,'all marks recorded before finish() must be present');

  window.__familyAuthTiming.finish('reveal');
  const finished=window.getFamilyAppAuthTiming();
  assert.ok(finished&&!finished.inProgress,'getFamilyAppAuthTiming must return the completed attempt after finish()');
  assert.ok(logs.some((l)=>String(l).indexOf('[AuthTiming]')===0),'diagnostics must log with the [AuthTiming] prefix for real-device debugging');
  assert.ok(logs.some((l)=>String(l).indexOf('SUMMARY')>=0),'finish() must emit a compact timing summary line');

  // A second attempt must not leak marks from the first (begin() always starts fresh).
  window.__familyAuthTiming.begin('T0-login-tap');
  const fresh=window.getFamilyAppAuthTiming();
  assert.strictEqual(fresh.marks.length,1,'a new attempt must start with a clean mark list');

  console.log('auth timing diagnostics contract: PASS');
})().catch((error)=>{console.error(error);process.exit(1);});
