'use strict';
(function(){
  if(window.__familyStartupTraceEarlyV1) return;
  window.__familyStartupTraceEarlyV1=true;
  var PROD='verhoog-family.vercel.app';
  try{ if((window.location.hostname||'')===PROD) return; }catch(e){}
  var enabled=false;
  try{ enabled=/[?&]startupTrace=1(?:&|$)/.test((window.location.search||'')); }catch(e){}
  var KEY='familyapp-startup-trace-early-v1';
  var started=Date.now();
  var events=[];
  try{ var prior=JSON.parse(sessionStorage.getItem(KEY)||'[]'); if(Array.isArray(prior)) events=prior.slice(-80); }catch(e){}
  function save(){ try{ sessionStorage.setItem(KEY,JSON.stringify(events.slice(-120))); }catch(e){} }
  function add(name,info){
    info=info||{};
    var x={event:String(name),t:Date.now()-started};
    if(info.type)x.type=String(info.type).slice(0,80);
    if(info.message)x.message=String(info.message).slice(0,180);
    events.push(x); if(events.length>120)events.shift(); save(); render();
  }
  window.__familyStartupTraceEarly=events;
  window.addEventListener('error',function(e){add('early:window-error',{type:e&&e.error&&e.error.name||'Error',message:e&&e.message});});
  window.addEventListener('unhandledrejection',function(e){var r=e&&e.reason;add('early:unhandledrejection',{type:r&&r.name||'PromiseRejection',message:r&&r.message||r});});
  add('early:script-loaded');
  var box=null,list=null,open=false;
  function ensure(){
    if(!enabled||box||!document.body)return;
    box=document.createElement('div');
    box.id='family-startup-trace-early-panel';
    box.style.cssText='position:fixed;right:10px;bottom:10px;width:min(92vw,390px);z-index:2147483647;background:#11131b;color:#fff;border-radius:12px;box-shadow:0 6px 30px rgba(0,0,0,.4);overflow:hidden;font:11px/1.35 -apple-system,Menlo,monospace';
    var h=document.createElement('button');h.type='button';h.style.cssText='width:100%;border:0;background:#191c27;color:#fff;padding:10px 12px;text-align:left;font-weight:700';h.innerHTML='🧭 Early startup trace <span style="float:right">Open</span>';
    h.onclick=function(){open=!open;h.querySelector('span').textContent=open?'Sluit':'Open';render();};
    list=document.createElement('div');list.style.cssText='display:none;max-height:38vh;overflow:auto;padding:8px 10px 12px;-webkit-user-select:text;user-select:text';
    box.appendChild(h);box.appendChild(list);document.body.appendChild(box);render();
  }
  function esc(s){return String(s).replace(/[&<>]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;'}[c];});}
  function render(){ if(!enabled)return; ensure(); if(!list)return; list.style.display=open?'block':'none'; if(!open)return; list.innerHTML=events.map(function(e){return '<div>+'+e.t+'ms '+esc(e.event)+(e.type?' '+esc(e.type):'')+(e.message?' — '+esc(e.message):'')+'</div>';}).join(''); list.scrollTop=list.scrollHeight; }
  function bodyReady(){add('early:dom-ready');ensure();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bodyReady);else bodyReady();
  window.addEventListener('pageshow',function(e){add('early:pageshow',{type:e&&e.persisted?'bfcache':'normal'});ensure();});
  window.addEventListener('pagehide',function(){add('early:pagehide');});
})();
