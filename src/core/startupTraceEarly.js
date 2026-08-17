'use strict';
(function(){
  if(window.__familyStartupTraceEarlyV2) return;
  window.__familyStartupTraceEarlyV2=true;
  var PROD='verhoog-family.vercel.app';
  try{ if((window.location.hostname||'')===PROD) return; }catch(e){}

  var search='';
  try{ search=window.location.search||''; }catch(e){}
  var collect=/[?&]startupTrace=1(?:&|$)/.test(search);
  var report=/[?&]startupTraceReport=1(?:&|$)/.test(search);
  if(!collect && !report) return;

  var KEY='familyapp-startup-trace-early-v2';
  var started=Date.now();
  var events=[];
  try{ var prior=JSON.parse(sessionStorage.getItem(KEY)||'[]'); if(Array.isArray(prior)) events=prior.slice(-100); }catch(e){}

  function save(){ try{ sessionStorage.setItem(KEY,JSON.stringify(events.slice(-120))); }catch(e){} }
  function add(name,info){
    if(!collect) return;
    info=info||{};
    var x={event:String(name),t:Date.now()-started};
    if(info.type)x.type=String(info.type).slice(0,80);
    if(info.message)x.message=String(info.message).slice(0,180);
    if(info.reason)x.reason=String(info.reason).slice(0,80);
    events.push(x); if(events.length>120)events.shift(); save();
  }

  window.__familyStartupTraceEarly=events;

  if(collect){
    add('early:script-loaded');
    window.addEventListener('error',function(e){add('early:window-error',{type:e&&e.error&&e.error.name||'Error',message:e&&e.message});});
    window.addEventListener('unhandledrejection',function(e){var r=e&&e.reason;add('early:unhandledrejection',{type:r&&r.name||'PromiseRejection',message:r&&r.message||r});});
    ['start','ready','listener-ready','reset'].forEach(function(name){
      window.addEventListener('familyapp:auth-bootstrap:'+name,function(e){
        var d=e&&e.detail||{};
        add('boot:'+name,{reason:d.reason||'',type:d.generation!==undefined?'generation-'+d.generation:''});
      });
    });
    if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',function(){add('early:dom-ready');});
    else add('early:dom-ready');
    window.addEventListener('pageshow',function(e){add('early:pageshow',{type:e&&e.persisted?'bfcache':'normal'});});
    window.addEventListener('pagehide',function(){add('early:pagehide');});
    document.addEventListener('visibilitychange',function(){add('early:visibility',{type:document.visibilityState||'unknown'});});
  }

  // Report mode is intentionally separate from collection mode. During the
  // failing login run this script performs NO live DOM rendering at all.
  if(report){
    function esc(s){return String(s).replace(/[&<>]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;'}[c];});}
    function show(){
      if(!document.body) return;
      var box=document.createElement('div');
      box.style.cssText='position:fixed;inset:0;z-index:2147483647;background:#0d0f16;color:#d1fae5;padding:18px;overflow:auto;font:12px/1.45 -apple-system,Menlo,monospace;-webkit-user-select:text;user-select:text';
      box.innerHTML='<div style="font:700 16px -apple-system,sans-serif;color:#fff;margin-bottom:12px">🧭 Bewaarde startup trace</div>'+
        (events.length?events.map(function(e){return '<div>+'+esc(e.t)+'ms '+esc(e.event)+(e.type?' '+esc(e.type):'')+(e.reason?' reason='+esc(e.reason):'')+(e.message?' — '+esc(e.message):'')+'</div>';}).join(''):'<div>Geen bewaarde events gevonden.</div>');
      document.body.appendChild(box);
    }
    if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',show); else show();
  }
})();
