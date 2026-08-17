'use strict';
// Preview-only, privacy-safe startup diagnostics. No production behavior.
(function(){
  if(window.__familyStartupTraceV2) return;
  window.__familyStartupTraceV2 = true;

  var PRODUCTION_HOSTNAME = 'verhoog-family.vercel.app';
  var startedAt = Date.now();
  var buffer = [];
  var MAX_EVENTS = 500;
  var panelEl = null, listEl = null, panelEnabled = false, expanded = false;

  function isProductionHost(){
    try { return (window.location.hostname || '') === PRODUCTION_HOSTNAME; } catch(e){ return false; }
  }
  if(isProductionHost()) return;

  // The normal ?startupTrace=1 crash-capture path is now owned by the tiny
  // head-loaded startupTraceEarly.js probe. Keep this heavier wrapper/panel
  // completely inert during that run so diagnostics cannot amplify a Safari
  // crash through function wrapping, polling or repeated DOM rendering.
  try {
    if(/[?&](?:startupTrace|startupTraceReport)=1(?:&|$)/.test((window.location && window.location.search) || '')) return;
  } catch(e){}

  try { panelEnabled = /[?&]startupTraceLegacy=1(?:&|$)/.test((window.location && window.location.search) || ''); } catch(e){}

  function clean(value, max){
    if(value === undefined || value === null) return undefined;
    return String(value).slice(0, max || 120);
  }

  function trace(event, info){
    info = info || {};
    var entry = { event:String(event), t:Date.now()-startedAt };
    ['fnType','reason','authState','wasStarted','listenerReady','generation','errorName','errorMessage'].forEach(function(k){
      if(info[k] !== undefined) entry[k] = clean(info[k], k === 'errorMessage' ? 200 : 120);
    });
    buffer.push(entry);
    if(buffer.length > MAX_EVENTS) buffer.shift();
    try { renderPanel(); } catch(e){}
    return entry;
  }

  function traceDomSnapshot(label){
    try {
      var login = document.getElementById('login-screen');
      var visible = login ? login.style.display !== 'none' : null;
      trace('dom:'+label,{fnType:visible===true?'login-visible':visible===false?'login-hidden':'login-screen-missing'});
      trace('state:'+label,{fnType:(document.body&&document.body.classList.contains('logged-in')?'logged-in-class-set':'logged-in-class-absent')+'/'+(window._appStarted?'appStarted-true':'appStarted-false')});
    } catch(e){}
  }

  function wrapGlobal(name){
    var existing = window[name];
    if(typeof existing !== 'function') { trace('fn-check:'+name,{fnType:'missing'}); return; }
    trace('fn-check:'+name,{fnType:'available'});
    if(existing.__familyStartupTraceWrapped) return;
    var wrapped = function(){
      trace('reveal:'+name+':start');
      try {
        var result = existing.apply(this, arguments);
        trace('reveal:'+name+':ok');
        return result;
      } catch(e){
        trace('reveal:'+name+':error',{errorName:e&&e.name,errorMessage:e&&e.message});
        throw e;
      }
    };
    wrapped.__familyStartupTraceWrapped = true;
    try { window[name] = wrapped; } catch(e){}
  }

  ['renderNav','renderHome','updateHomeXP','checkAchievements','checkDailyBonus','showScreen','_renderScreen','hideLoginScreen','useOfflineMode'].forEach(wrapGlobal);

  (function traceRenderNotifsAvailability(){
    if(typeof window.renderNotifs === 'function') { wrapGlobal('renderNotifs'); return; }
    trace('fn-check:renderNotifs',{fnType:'missing'});
    var tries = 0;
    var timer = setInterval(function(){
      tries++;
      if(typeof window.renderNotifs === 'function'){
        clearInterval(timer);
        trace('fn-became-available:renderNotifs',{fnType:'available'});
        wrapGlobal('renderNotifs');
      } else if(tries > 40){
        clearInterval(timer);
        trace('fn-check:renderNotifs:gave-up-waiting');
      }
    },250);
  })();

  if(typeof window.signInWithGoogle === 'function'){
    var origGoogle = window.signInWithGoogle;
    window.signInWithGoogle = function(){ trace('login-action:google'); return origGoogle.apply(this,arguments); };
    try { signInWithGoogle = window.signInWithGoogle; } catch(e){}
  }

  ['start','ready','listener-ready'].forEach(function(name){
    window.addEventListener('familyapp:auth-bootstrap:'+name,function(e){
      trace('boot:'+name,{generation:e&&e.detail&&e.detail.generation});
      if(name==='ready') { traceDomSnapshot('after-auth-reveal'); trace('reveal:complete'); }
    });
  });

  window.addEventListener('familyapp:auth-bootstrap:reset',function(e){
    var detail = e && e.detail || {};
    var userPresent = false;
    try { userPresent = !!(window.fbUser || (window.fbAuth && window.fbAuth.currentUser) || (window.firebase&&window.firebase.auth&&window.firebase.auth().currentUser)); } catch(err){}
    trace('boot:reset',{
      reason: detail.reason || 'unknown',
      authState: userPresent ? 'user-present' : 'user-null',
      wasStarted: !!window._appStarted,
      listenerReady: !!window.__familyAuthSessionBootstrapListenerInstalled,
      generation: window.AuthSessionBootstrap && window.AuthSessionBootstrap.status ? window.AuthSessionBootstrap.status().generation : undefined
    });
    traceDomSnapshot('after-reset');
  });

  (function installAuthObserver(tries){
    var auth = null;
    try { auth = window.fbAuth || (window.firebase&&window.firebase.auth&&window.firebase.auth()); } catch(e){}
    if(auth && typeof auth.onAuthStateChanged === 'function'){
      try {
        auth.onAuthStateChanged(function(user){ trace('auth:event',{authState:user?'user-present':'user-null'}); });
        trace('auth:observer-installed');
      } catch(e){ trace('auth:observer-error',{errorName:e&&e.name,errorMessage:e&&e.message}); }
      return;
    }
    if(tries < 120) setTimeout(function(){ installAuthObserver(tries+1); },250);
    else trace('auth:observer-timeout');
  })(0);

  trace('reveal:trace-installed');
  traceDomSnapshot('at-trace-install');

  function ensurePanel(){
    if(panelEl || !panelEnabled) return;
    panelEl = document.createElement('div');
    panelEl.id = 'family-startup-trace-panel';
    panelEl.style.cssText = 'position:fixed;right:10px;bottom:10px;width:min(92vw,380px);background:rgba(10,10,20,.96);color:#d1fae5;font:11px/1.35 -apple-system,Menlo,monospace;z-index:2147483647;border-radius:12px;box-shadow:0 6px 30px rgba(0,0,0,.45);overflow:hidden';
    var header = document.createElement('button');
    header.type = 'button';
    header.style.cssText = 'width:100%;display:flex;align-items:center;justify-content:space-between;background:#151522;color:#fff;border:0;padding:9px 11px;font:700 12px -apple-system,sans-serif;text-align:left';
    header.innerHTML = '<span>⚙️ Startup trace</span><span id="family-trace-toggle">Open</span>';
    header.onclick = function(){ expanded=!expanded; renderPanel(); };
    listEl = document.createElement('div');
    listEl.style.cssText = 'display:none;max-height:35vh;overflow:auto;padding:8px 10px 12px;-webkit-user-select:text;user-select:text';
    panelEl.appendChild(header); panelEl.appendChild(listEl);
    (document.body||document.documentElement).appendChild(panelEl);
  }

  function esc(s){ return String(s).replace(/[&<>]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;'}[c];}); }
  function renderPanel(){
    if(!panelEnabled) return;
    ensurePanel();
    if(!panelEl || !listEl) return;
    var toggle = panelEl.querySelector('#family-trace-toggle');
    if(toggle) toggle.textContent = expanded ? 'Sluit' : 'Open';
    listEl.style.display = expanded ? 'block' : 'none';
    if(!expanded) return;
    listEl.innerHTML = buffer.map(function(e){
      var color=/error/.test(e.event)?'#fca5a5':/missing|timeout|gave-up/.test(e.event)?'#fde68a':'#a7f3d0';
      var extra='';
      ['fnType','reason','authState','wasStarted','listenerReady','generation'].forEach(function(k){if(e[k]!==undefined) extra+=' '+k+'='+esc(e[k]);});
      if(e.errorName) extra+=' '+esc(e.errorName)+(e.errorMessage?': '+esc(e.errorMessage):'');
      return '<div style="color:'+color+'">+'+e.t+'ms '+esc(e.event)+extra+'</div>';
    }).join('');
    listEl.scrollTop = listEl.scrollHeight;
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',function(){ensurePanel();renderPanel();});
  else { ensurePanel(); renderPanel(); }

  window.__familyStartupTrace = buffer;
  window.__familyStartupTraceExport = function(){ var json=JSON.stringify(buffer,null,2); console.log('[__familyStartupTrace]',json); return json; };
})();
