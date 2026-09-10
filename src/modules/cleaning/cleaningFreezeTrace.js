'use strict';
// ============================================================
// CLEANING FREEZE TRACE v0.2.0 — TEMPORARY DIAGNOSTIC INSTRUMENTATION
// Purely additive, fully disabled by default. Traces the checkbox-write ->
// repository-event -> render/reconcile/observer cascade suspected of
// freezing the Cleaning turn popup on iPhone/PWA.
//
// Enable on a device without a new deploy or Web Inspector:
//   localStorage.setItem('familyapp_cleaning_trace','1'); location.reload();
// or open the app once with ?cleaningTrace=1 in the URL — this also mounts a
// small on-screen trace viewer (bottom-right "🐞 Trace" button) with Copy
// trace / Download trace / Clear buttons, so results can be captured
// directly on an iPhone without any developer tooling.
// Disable: localStorage.removeItem('familyapp_cleaning_trace').
//
// From the console (or via the on-screen viewer's Copy button):
//   window.CleaningFreezeTrace.status()  — counts + recent long tasks
//   window.CleaningFreezeTrace.dump()    — full ring buffer (last ~300 events)
//
// This file, and the corresponding trace.mark()/trace.time()/trace.noteInit()
// calls scattered across the Cleaning runtime files, are temporary. Safe to
// remove entirely once the root cause fix is confirmed on a real device.
// ============================================================
(function(){
  if(window.CleaningFreezeTrace)return;

  function enabled(){
    try{
      if(/[?&]cleaningTrace=1\b/.test(window.location.search))return true;
      return localStorage.getItem('familyapp_cleaning_trace')==='1';
    }catch(e){return false;}
  }

  var ON=enabled();
  var counts={};
  var lastAt={};
  var longTasks=[];
  var ring=[];
  var RING_MAX=300;
  var seq=0;
  var idCounters={};
  var initCounters={};
  var startedAt=Date.now();

  // Best-effort correlation: set by cleaningTurnExperience right before it
  // triggers a checkbox write, read (and captured into a local closure
  // variable, so it survives async .then() continuations correctly) by
  // cleaningExecutionWriteRuntime.transact(). Cleared after the write settles.
  var activeCorrelationId=null;
  // Best-effort link from a settled write to the repository emit(s) that
  // follow shortly after. Approximate by nature (Firebase's realtime
  // listener is a separate async callback with no direct call-chain back to
  // the write that triggered it) — always presented as "most recent known
  // write", not a guaranteed causal link.
  var lastWriteId=null;

  function now(){return (window.performance&&typeof performance.now==='function')?performance.now():Date.now();}
  function popupOpen(){try{return !!(window.CleaningTurnExperience&&window.CleaningTurnExperience.isOpen&&window.CleaningTurnExperience.isOpen());}catch(e){return null;}}

  function push(label,detail){
    seq++;
    var entry={seq:seq,t:Math.round(now()),iso:new Date().toISOString(),label:label,detail:detail||null,popupOpen:popupOpen()};
    ring.push(entry);
    if(ring.length>RING_MAX)ring.shift();
    return entry;
  }

  function mark(label,detail){
    if(!ON)return null;
    counts[label]=(counts[label]||0)+1;
    var t=now(),delta=lastAt[label]!=null?Math.round(t-lastAt[label]):null;
    lastAt[label]=t;
    var entry=push(label,detail);
    console.log('[CleaningFreezeTrace] #'+entry.seq+' '+label+' x'+counts[label]+(delta!==null?' (+'+delta+'ms)':'')+(detail?' '+JSON.stringify(detail):''));
    return entry;
  }

  function time(label,fn){
    if(!ON)return fn();
    var t0=now(),result;
    try{result=fn();}
    finally{
      var dt=Math.round(now()-t0);
      mark(label+'-duration',{ms:dt});
      if(dt>50)console.warn('[CleaningFreezeTrace] SLOW '+label+' took '+dt+'ms (main thread)');
    }
    return result;
  }

  function nextId(prefix){
    idCounters[prefix]=(idCounters[prefix]||0)+1;
    return prefix+'-'+idCounters[prefix];
  }

  // Checkbox-write correlation. Usage:
  //   var id = trace.beginWrite();      // in cleaningTurnExperience, once per toggle
  //   ... trace.mark('...', {correlationId:id}) at each step, using a LOCAL
  //   variable captured at the start of the async chain, not this global,
  //   so concurrent writes never cross-contaminate each other's marks.
  function beginWrite(){
    var id=nextId('write');
    activeCorrelationId=id;
    return id;
  }
  function endWrite(id){
    if(activeCorrelationId===id)activeCorrelationId=null;
  }
  function noteWriteSettled(id){
    lastWriteId=id;
  }

  function markEmit(detail){
    if(!ON)return null;
    var id=nextId('emit');
    var merged=Object.assign({emitId:id,lastWriteId:lastWriteId},detail||null);
    return mark('repository-emit',merged);
  }

  // Module double-init tracking: called as the very FIRST statement inside a
  // module's IIFE, before any "if(window.X)return" guard, so we see every
  // attempt to evaluate the module — including ones a guard silently blocks.
  // A guard blocking a second attempt is fine (expected); what matters is
  // whether we ever see attempt #2 at all, which points at the script/module
  // being loaded twice (e.g. two different cache-busted <script> tags, or a
  // duplicate dynamic import()).
  function noteInit(moduleName){
    initCounters[moduleName]=(initCounters[moduleName]||0)+1;
    var n=initCounters[moduleName];
    if(!ON)return n;
    var level=n>1?'warn':'log';
    console[level]('[CleaningFreezeTrace] module-init '+moduleName+' attempt #'+n+(n>1?' — POSSIBLE DOUBLE-INIT':''));
    push('module-init',{module:moduleName,attempt:n});
    return n;
  }

  function dump(){
    return{version:'0.2.0',enabled:ON,generatedAt:new Date().toISOString(),uptimeMs:Date.now()-startedAt,counts:JSON.parse(JSON.stringify(counts)),initCounters:JSON.parse(JSON.stringify(initCounters)),longTasks:longTasks.slice(-50),stalls:stalls.slice(-20),events:ring.slice()};
  }

  function status(){
    return{version:'0.2.0',enabled:ON,counts:JSON.parse(JSON.stringify(counts)),initCounters:JSON.parse(JSON.stringify(initCounters)),longTasks:longTasks.slice(-20),stalls:stalls.slice(-10),eventCount:ring.length};
  }

  // --- Long task observer (Safari/iOS support is limited, best-effort) ---
  if(ON&&typeof PerformanceObserver==='function'){
    try{
      var po=new PerformanceObserver(function(list){
        list.getEntries().forEach(function(entry){
          var e={name:entry.name,duration:Math.round(entry.duration),startedAt:Math.round(entry.startTime)};
          longTasks.push(e);
          if(longTasks.length>50)longTasks.shift();
          push('long-task',e);
          console.warn('[CleaningFreezeTrace] LONG TASK '+e.duration+'ms ('+e.name+')');
        });
      });
      po.observe({entryTypes:['longtask']});
    }catch(e){}
  }

  // --- Main-thread stall watchdog ---
  // A timer tick every ~300ms; if the ACTUAL gap since the last tick is much
  // larger than expected, the main thread was blocked (JS starvation,
  // synchronous loop, or a very long render/reconcile chain) for that long.
  // This classifies "something froze the thread" independent of *why*.
  var stalls=[];
  var lastHeartbeat=null;
  var HEARTBEAT_MS=300;
  var STALL_THRESHOLD_MS=1000;
  if(ON){
    lastHeartbeat=now();
    setInterval(function(){
      var t=now(),gap=t-lastHeartbeat;
      lastHeartbeat=t;
      if(gap>STALL_THRESHOLD_MS){
        var stall={
          seq:seq,
          t:Math.round(t),
          iso:new Date().toISOString(),
          stallMs:Math.round(gap),
          popupOpen:popupOpen(),
          lastEmitId:idCounters.emit?'emit-'+idCounters.emit:null,
          lastWriteId:lastWriteId,
          activeCorrelationId:activeCorrelationId,
          recentEvents:ring.slice(-20)
        };
        try{
          var writeRuntime=window.CleaningExecutionWriteRuntime;
          stall.pendingWrites=writeRuntime&&typeof writeRuntime.status==='function'?writeRuntime.status().inFlight:null;
        }catch(e){stall.pendingWrites=null;}
        try{
          var projectionService=window.CleaningProjectionService;
          stall.pendingReconciles=projectionService&&typeof projectionService.status==='function'?projectionService.status().inFlight:null;
        }catch(e){stall.pendingReconciles=null;}
        stalls.push(stall);
        if(stalls.length>20)stalls.shift();
        push('main-thread-stall',{stallMs:stall.stallMs,pendingWrites:stall.pendingWrites,pendingReconciles:stall.pendingReconciles});
        console.warn('[CleaningFreezeTrace] MAIN THREAD STALL '+stall.stallMs+'ms — popupOpen='+stall.popupOpen+' pendingWrites='+JSON.stringify(stall.pendingWrites)+' pendingReconciles='+JSON.stringify(stall.pendingReconciles));
      }
    },HEARTBEAT_MS);
  }

  // --- On-device trace viewer (no Web Inspector required) ---
  function traceText(){
    var d=dump();
    var lines=[];
    lines.push('CleaningFreezeTrace dump — '+d.generatedAt+' — uptime '+Math.round(d.uptimeMs/1000)+'s');
    lines.push('counts: '+JSON.stringify(d.counts));
    lines.push('initCounters: '+JSON.stringify(d.initCounters));
    lines.push('stalls: '+d.stalls.length);
    lines.push('longTasks: '+d.longTasks.length);
    lines.push('');
    d.events.forEach(function(e){
      lines.push('#'+e.seq+' t='+e.t+' popupOpen='+e.popupOpen+' '+e.label+(e.detail?' '+JSON.stringify(e.detail):''));
    });
    if(d.stalls.length){
      lines.push('');
      lines.push('=== STALLS ===');
      d.stalls.forEach(function(s){
        lines.push('STALL '+s.stallMs+'ms at '+s.iso+' popupOpen='+s.popupOpen+' pendingWrites='+JSON.stringify(s.pendingWrites)+' pendingReconciles='+JSON.stringify(s.pendingReconciles));
      });
    }
    return lines.join('\n');
  }

  function copyTrace(){
    var text=traceText();
    var done=function(ok){var btn=document.getElementById('cft-copy-btn');if(btn){var original=btn.textContent;btn.textContent=ok?'Copied ✓':'Copy failed';setTimeout(function(){btn.textContent=original;},1400);}};
    try{
      if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(text).then(function(){done(true);}).catch(function(){done(false);});return;}
    }catch(e){}
    try{
      var ta=document.createElement('textarea');ta.value=text;ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.focus();ta.select();
      var ok=document.execCommand('copy');document.body.removeChild(ta);done(ok);
    }catch(e){done(false);}
  }

  function downloadTrace(){
    try{
      var blob=new Blob([traceText()],{type:'text/plain'});
      var url=URL.createObjectURL(blob);
      var a=document.createElement('a');
      a.href=url;a.download='cleaning-freeze-trace-'+Date.now()+'.txt';
      document.body.appendChild(a);a.click();document.body.removeChild(a);
      setTimeout(function(){URL.revokeObjectURL(url);},2000);
    }catch(e){console.warn('[CleaningFreezeTrace] download failed',e);}
  }

  function clearTrace(){ring.length=0;counts={};stalls.length=0;longTasks.length=0;seq=0;refreshViewer();}

  var viewerEl=null,viewerExpanded=false;
  function refreshViewer(){
    if(!viewerEl)return;
    var summary=viewerEl.querySelector('[data-cft-summary]');
    if(summary)summary.textContent='events:'+ring.length+' stalls:'+stalls.length+' longTasks:'+longTasks.length;
  }
  function mountViewer(){
    if(viewerEl||!ON)return;
    try{
      var wrap=document.createElement('div');
      wrap.id='cleaning-freeze-trace-viewer';
      wrap.style.cssText='position:fixed;right:10px;bottom:calc(70px + env(safe-area-inset-bottom));z-index:999999;font-family:-apple-system,system-ui,sans-serif;font-size:11px;';
      wrap.innerHTML=''
        +'<button id="cft-toggle-btn" style="background:#111;color:#fff;border:none;border-radius:20px;padding:8px 12px;font-size:12px;font-weight:700;box-shadow:0 4px 14px rgba(0,0,0,.35);">🐞 Trace</button>'
        +'<div id="cft-panel" style="display:none;margin-top:8px;width:240px;background:#111;color:#eee;border-radius:12px;padding:10px;box-shadow:0 8px 24px rgba(0,0,0,.4);">'
          +'<div data-cft-summary style="font-size:10px;color:#9ad;margin-bottom:8px;">events:0 stalls:0 longTasks:0</div>'
          +'<div style="display:flex;gap:6px;flex-wrap:wrap;">'
            +'<button id="cft-copy-btn" style="flex:1;background:#2f9954;color:#fff;border:none;border-radius:8px;padding:7px;font-size:11px;font-weight:700;">Copy trace</button>'
            +'<button id="cft-download-btn" style="flex:1;background:#3b6fe0;color:#fff;border:none;border-radius:8px;padding:7px;font-size:11px;font-weight:700;">Download</button>'
          +'</div>'
          +'<button id="cft-clear-btn" style="width:100%;margin-top:6px;background:#7a2d2d;color:#fff;border:none;border-radius:8px;padding:6px;font-size:11px;font-weight:700;">Clear</button>'
        +'</div>';
      document.body.appendChild(wrap);
      viewerEl=wrap;
      wrap.querySelector('#cft-toggle-btn').addEventListener('click',function(){
        viewerExpanded=!viewerExpanded;
        wrap.querySelector('#cft-panel').style.display=viewerExpanded?'block':'none';
        refreshViewer();
      });
      wrap.querySelector('#cft-copy-btn').addEventListener('click',copyTrace);
      wrap.querySelector('#cft-download-btn').addEventListener('click',downloadTrace);
      wrap.querySelector('#cft-clear-btn').addEventListener('click',clearTrace);
      refreshViewer();
      setInterval(refreshViewer,1000);
    }catch(e){console.warn('[CleaningFreezeTrace] viewer mount failed',e);}
  }
  if(ON){
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mountViewer,{once:true});
    else mountViewer();
  }

  window.CleaningFreezeTrace={
    version:'0.2.0',enabled:ON,
    mark:mark,time:time,status:status,dump:dump,
    nextId:nextId,noteInit:noteInit,
    beginWrite:beginWrite,endWrite:endWrite,noteWriteSettled:noteWriteSettled,
    markEmit:markEmit,
    get activeCorrelationId(){return activeCorrelationId;},
    get lastWriteId(){return lastWriteId;}
  };
  if(ON)console.log('[CleaningFreezeTrace] instrumentation active — call window.CleaningFreezeTrace.status() or use the on-screen Trace button');
})();