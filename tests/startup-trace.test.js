'use strict';
const fs = require('fs');
const assert = require('assert');
const { JSDOM } = require('jsdom');

const BASE_HTML = `<!DOCTYPE html><html><body>
<div id="login-screen" style="display:flex"></div>
<div id="screen-home"></div>
</body></html>`;

function createEnv(url){
  const dom = new JSDOM(BASE_HTML, { url, pretendToBeVisual: true, runScripts: 'outside-only' });
  const window = dom.window, document = window.document;
  window.setTimeout = (fn) => { fn(); return 0; }; // run "soon" timers immediately, deterministic
  window.clearTimeout = () => {};
  window.setInterval = () => 0; // never actually fire the renderNotifs poll in these tests
  window.clearInterval = () => {};
  return { dom, window, document };
}

function loadTrace(env){
  const vm = require('vm');
  vm.runInContext(fs.readFileSync('src/core/startupTrace.js', 'utf8'), env.dom.getInternalVMContext(), { filename: 'startupTrace.js' });
}

(function run(){
  // 1. Production hostname -> entirely inert, no globals created, no panel.
  {
    const env = createEnv('https://verhoog-family.vercel.app/?startupTrace=1');
    loadTrace(env);
    assert.equal(typeof env.window.__familyStartupTrace, 'undefined', 'production must not expose a trace buffer');
    assert.equal(env.document.getElementById('family-startup-trace-panel'), null, 'production must never render the debug panel');
  }

  // 2. Preview hostname, renderNotifs missing -> must NOT be created (no functional fix).
  {
    const env = createEnv('https://agent-preview-branch.vercel.app/');
    // renderNav/renderHome exist and succeed; hideLoginScreen mirrors the real
    // offline path and crashes on the bare, undefined renderNotifs reference —
    // exactly like the real app today.
    env.window.renderNav = function(){};
    env.window.renderHome = function(){};
    env.window.updateHomeXP = function(){};
    env.window.checkAchievements = function(){};
    env.window.checkDailyBonus = function(){};
    env.window.hideLoginScreen = function(){
      env.window.renderNav();
      env.window.renderHome();
      renderNotifs(); // eslint-disable-line no-undef -- intentionally mirrors real bug
    };
    env.window.useOfflineMode = function(){ env.window.hideLoginScreen(); };

    loadTrace(env);
    assert.equal(typeof env.window.renderNotifs, 'undefined', 'trace must not define renderNotifs when it is missing');

    let threw = null;
    try { env.window.useOfflineMode(); } catch(e){ threw = e; }
    assert(threw, 'the original crash must still occur — instrumentation must not swallow it');
    assert.equal(threw.name, 'ReferenceError');

    const events = env.window.__familyStartupTrace.map(e => e.event);
    assert(events.includes('login-action:offline'), 'offline login action must be traced');
    assert(events.includes('reveal:renderNav:start'));
    assert(events.includes('reveal:renderNav:ok'));
    assert(events.includes('reveal:renderHome:start'));
    assert(events.includes('reveal:renderHome:ok'));
    assert(events.includes('fn-check:renderNotifs'), 'renderNotifs availability must be recorded');
    assert(events.includes('reveal:offline-error'), 'the crash must be recorded on the outer envelope');
    assert(!events.includes('reveal:offline-complete'), 'offline-complete must NOT be recorded when the flow actually crashed');

    const errEvent = env.window.__familyStartupTrace.find(e => e.event === 'reveal:offline-error');
    assert.equal(errEvent.errorName, 'ReferenceError');
    assert(/renderNotifs/.test(errEvent.errorMessage));
  }

  // 3. Preview hostname, renderNotifs already available -> wrapped normally, no crash.
  {
    const env = createEnv('https://agent-preview-branch.vercel.app/');
    env.window.renderNav = function(){};
    env.window.renderHome = function(){};
    env.window.updateHomeXP = function(){};
    env.window.checkAchievements = function(){};
    env.window.checkDailyBonus = function(){};
    env.window.renderNotifs = function(){};
    env.window.hideLoginScreen = function(){
      env.window.renderNav(); env.window.renderHome(); env.window.renderNotifs(); env.window.updateHomeXP();
    };
    env.window.useOfflineMode = function(){ env.window.hideLoginScreen(); };

    loadTrace(env);
    assert.equal(typeof env.window.renderNotifs, 'function');
    env.window.useOfflineMode();
    const events = env.window.__familyStartupTrace.map(e => e.event);
    assert(events.includes('reveal:offline-complete'), 'a clean run must reach offline-complete');
    assert(!events.some(e => e.includes('error')), 'a clean run must record no error events');
  }

  // 4. Preview hostname without ?startupTrace=1 -> trace buffer active, but no visible panel.
  {
    const env = createEnv('https://agent-preview-branch.vercel.app/');
    loadTrace(env);
    assert(Array.isArray(env.window.__familyStartupTrace), 'trace buffer must exist on any non-production host');
    assert.equal(env.document.getElementById('family-startup-trace-panel'), null, 'panel must stay hidden without the query flag');
  }

  // 5. Preview hostname WITH ?startupTrace=1 -> panel is rendered and stays in the DOM.
  {
    const env = createEnv('https://agent-preview-branch.vercel.app/?startupTrace=1');
    loadTrace(env);
    env.document.dispatchEvent(new env.window.Event('DOMContentLoaded'));
    const panel = env.document.getElementById('family-startup-trace-panel');
    assert(panel, 'panel must render when the query flag is present on a preview host');
    assert(/position:\s*fixed/.test(panel.style.cssText || panel.getAttribute('style') || ''));
  }

  console.log('startup-trace: PASS');
})();
