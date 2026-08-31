'use strict';
// ============================================================
// UI SCALE / AUTH ISOLATION — contract + runtime regression test
//
// Bewijst:
//   - #login-screen staat structureel BUITEN #family-app-root (index.html).
//   - #family-app-root krijgt geen position/transform/filter/perspective/
//     contain/backdrop-filter/will-change die het containing block van
//     fixed/absolute nakomelingen zou kunnen veranderen (familyAppRootScale.css).
//   - FamilyUiScale.apply() schrijft NOOIT zoom op document.body — voor elke
//     opgeslagen waarde (90/100/110/120), voor een ongeldige waarde, én in
//     het defensieve pad waarin #family-app-root (nog) niet bestaat.
//   - FamilyUiScale.apply() schrijft de gekozen scale wél op #family-app-root.
//
// Dat #login-screen nooit een nakomeling van een gezoomde ancestor is (vóór
// login, na login, na logout) volgt direct uit de eerste twee bewijzen samen
// met de derde: er is geen enkel codepad meer dat zoom op body of op een
// ancestor van #login-screen zet. Dat maakt losse "vóór/na login"-simulatie
// overbodig op contract-testniveau — de echte iPhone/Safari/PWA-acceptatie
// (90/100/110/120, browser én installed PWA) blijft het gate hiervoor.
// ============================================================
const fs = require('fs');
const assert = require('assert');
const vm = require('vm');

const html = fs.readFileSync('index.html', 'utf8');
const css = fs.readFileSync('src/styles/familyAppRootScale.css', 'utf8');
const fullSource = fs.readFileSync('src/core/profile.legacy.js', 'utf8');

// profile.legacy.js contains several independent top-level IIFEs (UI scale,
// PWA install helper, avatar identity bootstrap, ...). Only the UI-scale one
// is in scope here, and it is fully self-contained (no navigator/setTimeout/
// import() dependencies), so it is extracted and run in isolation rather than
// stubbing out unrelated browser globals just to satisfy the rest of the file.
const iifeStart = fullSource.indexOf('(function bootstrapFamilyUiScale(){');
const iifeEnd = fullSource.indexOf('\n})();', iifeStart);
assert.ok(iifeStart > -1 && iifeEnd > iifeStart,
  'bootstrapFamilyUiScale IIFE must be present and intact in profile.legacy.js');
const scaleSource = fullSource.slice(iifeStart, iifeEnd + '\n})();'.length);

// ── 1. Structurele scheiding in index.html ──────────────────────────────
function testHtmlStructure(){
  const loginOpenIdx = html.indexOf('id="login-screen"');
  const loginEndIdx = html.indexOf('<!-- end login-screen -->');
  const rootOpenIdx = html.indexOf('<div id="family-app-root">');
  const rootEndIdx = html.indexOf('<!-- end family-app-root -->');
  const homeScreenIdx = html.indexOf('id="screen-home"');
  const bottomNavIdx = html.indexOf('id="bottom-nav"');
  const firstScriptIdx = html.indexOf('<script src="task-image-hashtags.js">');

  assert.ok(loginOpenIdx > -1, 'index.html must still contain #login-screen');
  assert.ok(loginEndIdx > loginOpenIdx, 'login-screen close marker must exist after its opening tag');
  assert.ok(rootOpenIdx > -1, 'index.html must contain #family-app-root');
  assert.ok(rootEndIdx > rootOpenIdx, 'family-app-root close marker must exist after its opening tag');

  assert.ok(rootOpenIdx > loginEndIdx,
    '#family-app-root must open only after #login-screen has fully closed — login must never be a descendant of the scaled root');
  assert.ok(homeScreenIdx > rootOpenIdx && homeScreenIdx < rootEndIdx,
    '#screen-home must live inside #family-app-root');
  assert.ok(bottomNavIdx > rootOpenIdx && bottomNavIdx < rootEndIdx,
    '#bottom-nav must live inside #family-app-root');
  assert.ok(firstScriptIdx > rootEndIdx,
    'module scripts must load after #family-app-root has closed (unchanged load order)');

  console.log('  HTML structure: #login-screen strictly outside #family-app-root — PASS');
}
testHtmlStructure();

// ── 2. #family-app-root mag geen containing-block-brekende properties krijgen ──
function testAppRootCssIsInert(){
  assert.ok(html.includes('src/styles/familyAppRootScale.css'),
    'index.html must load the dedicated family-app-root stylesheet');
  const match = css.match(/#family-app-root\s*\{([^}]*)\}/);
  assert.ok(match, '#family-app-root must have a dedicated CSS rule');
  const body = match[1];
  const forbidden = ['transform', 'filter', 'perspective', 'contain', 'backdrop-filter', 'will-change', 'position:fixed', 'position: fixed'];
  forbidden.forEach(function(prop){
    assert.ok(!body.toLowerCase().includes(prop),
      '#family-app-root must not declare "' + prop + '" — it would change the containing block of fixed/absolute descendants (bottom nav, sheets, overlays) and can reintroduce the same class of bug this fix removes');
  });
  console.log('  CSS: #family-app-root has no containing-block side effects — PASS');
}
testAppRootCssIsInert();

// ── 3. FamilyUiScale runtime gedrag (vm sandbox, zelfde patroon als overige rebuild-tests) ──
function makeEl(){
  return { style: {}, dataset: {} };
}

function runScaleScenario(rootPresent){
  const bodyEl = makeEl();
  const rootEl = rootPresent ? makeEl() : null;
  const htmlProps = {};
  const documentElement = {
    style: { setProperty(k, v){ htmlProps[k] = v; } },
    dataset: {}
  };
  const listeners = {};
  const localStorageStore = {};
  const localStorage = {
    getItem(k){ return Object.prototype.hasOwnProperty.call(localStorageStore, k) ? localStorageStore[k] : null; },
    setItem(k, v){ localStorageStore[k] = String(v); },
    removeItem(k){ delete localStorageStore[k]; }
  };
  const document = {
    body: bodyEl,
    documentElement: documentElement,
    getElementById(id){ return id === 'family-app-root' ? rootEl : null; },
    readyState: 'complete',
    addEventListener(evt, fn){ listeners[evt] = fn; }
  };
  const dispatched = [];
  const window = {
    addEventListener(evt, fn){ listeners['window:' + evt] = fn; },
    dispatchEvent(evt){ dispatched.push(evt); }
  };
  const sandbox = {
    window, document, localStorage,
    CustomEvent: function(name, opts){ this.type = name; this.detail = opts && opts.detail; },
    console
  };
  vm.createContext(sandbox);
  vm.runInContext(scaleSource, sandbox, { filename: 'profile.legacy.js' });

  return { window, bodyEl, rootEl, documentElement, htmlProps, localStorageStore, dispatched };
}

function testAllStoredScaleOptions(){
  [90, 100, 110, 120].forEach(function(percent){
    const ctx = runScaleScenario(true);
    const applied = ctx.window.FamilyUiScale.apply(percent);
    assert.strictEqual(applied, percent);
    assert.strictEqual(ctx.rootEl.style.zoom, String(percent / 100),
      'family-app-root must receive zoom for stored value ' + percent);
    assert.strictEqual(ctx.rootEl.dataset.uiScale, String(percent));
    assert.strictEqual(ctx.bodyEl.style.zoom, undefined,
      'document.body.style.zoom must NEVER be set (regression guard) for stored value ' + percent);
    assert.strictEqual(ctx.htmlProps['--family-ui-scale'], String(percent / 100));
  });
  console.log('  FamilyUiScale.apply(): 90/100/110/120 scale #family-app-root only — PASS');
}
testAllStoredScaleOptions();

function testInvalidValueFallsBackTo100(){
  const ctx = runScaleScenario(true);
  ctx.window.FamilyUiScale.apply(77);
  assert.strictEqual(ctx.rootEl.style.zoom, '1');
  assert.strictEqual(ctx.rootEl.dataset.uiScale, '100');
  assert.strictEqual(ctx.bodyEl.style.zoom, undefined);
  console.log('  FamilyUiScale.apply(): invalid stored value normalizes to 100% — PASS');
}
testInvalidValueFallsBackTo100();

function testMissingRootNeverFallsBackToBody(){
  const ctx = runScaleScenario(false);
  assert.doesNotThrow(function(){ ctx.window.FamilyUiScale.apply(120); },
    'apply() must not throw when #family-app-root is not yet in the DOM');
  assert.strictEqual(ctx.bodyEl.style.zoom, undefined,
    'even with no app root present, document.body.style.zoom must never be set — there must be no fallback to body');
  console.log('  FamilyUiScale.apply(): missing #family-app-root never falls back to document.body — PASS');
}
testMissingRootNeverFallsBackToBody();

function testSetPersistsAndReapplies(){
  const ctx = runScaleScenario(true);
  const result = ctx.window.FamilyUiScale.set(110);
  assert.strictEqual(result, 110);
  assert.strictEqual(ctx.localStorageStore['familyapp-ui-scale-v1'], '110');
  assert.strictEqual(ctx.rootEl.style.zoom, '1.1');
  assert.strictEqual(ctx.bodyEl.style.zoom, undefined);
  console.log('  FamilyUiScale.set(): persists + re-applies to family-app-root, never body — PASS');
}
testSetPersistsAndReapplies();

function testResetReturnsTo100(){
  const ctx = runScaleScenario(true);
  ctx.window.FamilyUiScale.set(120);
  ctx.window.FamilyUiScale.reset();
  assert.strictEqual(ctx.localStorageStore['familyapp-ui-scale-v1'], undefined);
  assert.strictEqual(ctx.rootEl.style.zoom, '1');
  assert.strictEqual(ctx.bodyEl.style.zoom, undefined);
  console.log('  FamilyUiScale.reset(): clears storage and returns family-app-root to 100% — PASS');
}
testResetReturnsTo100();

// ── 4. Statische broncode-garantie: de letterlijke regressiestring mag nooit meer voorkomen ──
function testSourceNeverReferencesBodyZoom(){
  assert.ok(!fullSource.includes('document.body.style.zoom'),
    'src/core/profile.legacy.js must never contain document.body.style.zoom again (checked across the whole file, not just the extracted IIFE)');
  assert.ok(scaleSource.includes("getElementById('family-app-root')"),
    'FamilyUiScale must target #family-app-root explicitly');
  console.log('  Source guard: document.body.style.zoom absent from profile.legacy.js — PASS');
}
testSourceNeverReferencesBodyZoom();

console.log('UI scale / auth isolation contract: PASS');
