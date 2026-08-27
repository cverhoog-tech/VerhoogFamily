'use strict';
// ============================================================
// AUTH TIMING DEBUG VIEWER v1.0 — preview/debug-only panel for fix #7
// (Google login post-auth handoff freeze). Renders the AuthTiming marks
// captured by authTimingDiagnostics.js as a small on-screen panel with a
// copy button, so timings can be read directly on a standalone iPhone PWA
// where there is no console to open.
//
// Only ever active when the page URL contains ?authdebug=1 (or &authdebug=1).
// Normal users never see or load any of this panel's behavior — the whole
// module returns immediately when the flag is absent.
//
// This module never starts a second Firebase auth observer, never resolves
// household data itself, and never introduces a second session authority —
// it only reads window.getFamilyAppAuthTiming(), which authTimingDiagnostics.js
// already exposes from local, in-memory marks.
//
// No UID, e-mail, display name, household id, Firebase/access tokens or
// credentials are ever rendered or copied — only stage labels, relative
// millisecond deltas, a total, and lifecycle event names.
// ============================================================
(function(){
  if(window.__familyAuthTimingDebugViewerV1)return;
  window.__familyAuthTimingDebugViewerV1=true;

  function flagEnabled(){
    try{return /(^|[?&])authdebug=1(&|$)/.test(window.location.search||'');}catch(e){return false;}
  }
  if(!flagEnabled())return;

  var LABELS={
    'T0-login-tap':'T0 login tap',
    'T1-before-signInWithPopup':'T1 popup call started',
    'T2-popup-call-issued(proxy-for-chooser-open)':'T2 popup call issued',
    'T3-popup-promise-resolved':'T3 popup resolved',
    'T4-popup-user-received':'T4 popup user received',
    'T5-acceptAuthenticatedUser-called':'T5 controller handoff',
    'T6-onAuthStateChanged-fired':'T6 auth observer',
    'T7-bootstrap-started':'T7 bootstrap started',
    'T8-loadUserFamily-started':'T8 household read call',
    'T9-household-read-started':'T9 household read start',
    'T10-household-read-finished':'T10 household done',
    'T11-loadUserFamily-resolved':'T11 loadUserFamily done',
    'T12-revealApp-started':'T12 revealApp',
    'T13-home-visible':'T13 Home painted'
  };

  function friendlyLabel(label){
    if(LABELS[label])return LABELS[label];
    if(label.indexOf('T13-summary-end:')===0)return 'SUMMARY end ('+label.slice('T13-summary-end:'.length)+')';
    return label;
  }
  function parseLifecycle(label){
    var m=/^lifecycle:(\S+)\s+visibility=(\S+)\s+hasFocus=(\S+)/.exec(label);
    if(!m)return null;
    var evt=m[1],vis=m[2];
    if(evt==='visibilitychange')return 'visibility '+vis;
    return evt;
  }
  function isLifecycle(label){return String(label||'').indexOf('lifecycle:')===0;}

  function fmtMs(ms){return ms<=0?(Math.abs(ms)+' ms'):('+'+ms+' ms');}
  function fmtTotal(ms){return (ms/1000).toFixed(2)+' s';}

  function buildText(timing){
    if(!timing||!timing.marks||!timing.marks.length){
      return 'AUTH LOGIN TIMING\n\nNog geen login-poging gemeten.\nTik op "Inloggen met Google" om te starten.';
    }
    var tRows=[],lRows=[],total=0;
    timing.marks.forEach(function(m){
      if(isLifecycle(m.label)){
        var lc=parseLifecycle(m.label);
        if(lc)lRows.push(lc+'  ('+fmtMs(m.fromStartMs)+')');
        return;
      }
      tRows.push({label:friendlyLabel(m.label),ms:m.fromStartMs});
      if(String(m.label).indexOf('T13-summary-end:')!==0)total=Math.max(total,m.fromStartMs);
    });
    var maxLabelLen=tRows.reduce(function(n,r){return Math.max(n,r.label.length);},0);
    var lines=['AUTH LOGIN TIMING',''];
    tRows.forEach(function(r){
      var pad=Math.max(maxLabelLen-r.label.length,0);
      lines.push(r.label+new Array(pad+3).join(' ')+fmtMs(r.ms));
    });
    lines.push('');
    lines.push('TOTAAL: '+fmtTotal(total));
    if(timing.inProgress)lines.push('(meting nog bezig...)');
    if(lRows.length){
      lines.push('');
      lines.push('LIFECYCLE EVENTS');
      lRows.forEach(function(r){lines.push(r);});
    }
    return lines.join('\n');
  }

  var pre=null,copyBtn=null,statusEl=null,lastText='';

  function css(){
    if(document.getElementById('auth-timing-debug-css'))return;
    var s=document.createElement('style');
    s.id='auth-timing-debug-css';
    s.textContent='#auth-timing-debug{position:fixed;left:10px;right:10px;bottom:10px;z-index:99999;background:rgba(10,10,18,.94);color:#e8e8f0;border:1px solid rgba(255,255,255,.15);border-radius:14px;padding:10px 12px;font:11px/1.5 -apple-system,Menlo,monospace;max-height:46vh;overflow:auto;box-shadow:0 10px 30px rgba(0,0,0,.5)}#auth-timing-debug pre{white-space:pre-wrap;margin:6px 0;font:11px/1.5 Menlo,monospace}#auth-timing-debug .atd-row{display:flex;gap:8px;align-items:center;justify-content:space-between}#auth-timing-debug button{background:#7c3aed;color:#fff;border:0;border-radius:8px;padding:8px 12px;font-size:12px;font-weight:700}#auth-timing-debug .atd-status{font-size:10px;color:#a9a9c0;min-height:14px}';
    document.head.appendChild(s);
  }

  function copyText(text){
    try{
      if(navigator.clipboard&&navigator.clipboard.writeText)return navigator.clipboard.writeText(text);
    }catch(e){}
    try{
      var ta=document.createElement('textarea');
      ta.value=text;ta.style.position='fixed';ta.style.opacity='0';
      document.body.appendChild(ta);ta.focus();ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      return Promise.resolve();
    }catch(e){return Promise.reject(e);}
  }

  function render(){
    var timing=(typeof window.getFamilyAppAuthTiming==='function')?window.getFamilyAppAuthTiming():null;
    var text=buildText(timing);
    if(text===lastText)return;
    lastText=text;
    if(pre)pre.textContent=text;
  }

  function build(){
    css();
    var panel=document.createElement('div');
    panel.id='auth-timing-debug';
    var title=document.createElement('div');
    title.className='atd-row';
    title.innerHTML='<b>Auth Timing Debug</b>';
    pre=document.createElement('pre');
    pre.textContent=buildText(null);
    var actions=document.createElement('div');
    actions.className='atd-row';
    copyBtn=document.createElement('button');
    copyBtn.textContent='Kopieer timings';
    statusEl=document.createElement('div');
    statusEl.className='atd-status';
    copyBtn.addEventListener('click',function(){
      copyText(lastText).then(function(){statusEl.textContent='Gekopieerd \u2713';},function(){statusEl.textContent='Kopieren mislukt \u2014 selecteer handmatig.';});
    });
    actions.appendChild(copyBtn);
    panel.appendChild(title);
    panel.appendChild(pre);
    panel.appendChild(actions);
    panel.appendChild(statusEl);
    document.body.appendChild(panel);
    render();
    setInterval(render,300);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',build,{once:true});
  else build();
})();
