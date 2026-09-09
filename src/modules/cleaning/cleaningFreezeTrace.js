'use strict';
// ============================================================
// CLEANING FREEZE TRACE v0.1.0 — TEMPORARY DIAGNOSTIC INSTRUMENTATION
// Purely additive, disabled by default. Traces the checkbox-write ->
// repository-event -> render/reconcile cascade suspected of freezing the
// Cleaning turn popup on iPhone/PWA (see FAMILYAPP-FIX-LIST.md, fix #7-adjacent
// investigation: "Schoonmaken turn popup freeze").
//
// Enable on a device without a new deploy:
//   localStorage.setItem('familyapp_cleaning_trace','1'); location.reload();
// or open the app once with ?cleaningTrace=1 in the URL.
// Disable: localStorage.removeItem('familyapp_cleaning_trace').
// Read results in the browser console (filter on "CleaningFreezeTrace"), or
// call window.CleaningFreezeTrace.status() from the console for a summary.
//
// This file is temporary. Safe to delete entirely, together with the small
// additive trace.mark()/trace.time() calls in cleaningHouseholdRepository.js,
// cleaningExecutionWriteRuntime.js and cleaningProjectionService.js, once the
// root cause fix is confirmed on a real device.
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

  function now(){return (window.performance&&typeof performance.now==='function')?performance.now():Date.now();}

  function mark(label,detail){
    if(!ON)return;
    counts[label]=(counts[label]||0)+1;
    var t=now(),delta=lastAt[label]!=null?Math.round(t-lastAt[label]):null;
    lastAt[label]=t;
    console.log('[CleaningFreezeTrace] '+label+' #'+counts[label]+(delta!==null?' (+'+delta+'ms since last)':'')+(detail?' '+JSON.stringify(detail):''));
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

  function status(){
    return{version:'0.1.0',enabled:ON,counts:JSON.parse(JSON.stringify(counts)),longTasks:longTasks.slice(-20)};
  }

  if(ON&&typeof PerformanceObserver==='function'){
    try{
      var po=new PerformanceObserver(function(list){
        list.getEntries().forEach(function(entry){
          longTasks.push({name:entry.name,duration:Math.round(entry.duration),startedAt:Math.round(entry.startTime)});
          if(longTasks.length>50)longTasks.shift();
          console.warn('[CleaningFreezeTrace] LONG TASK '+Math.round(entry.duration)+'ms ('+entry.name+')');
        });
      });
      po.observe({entryTypes:['longtask']});
    }catch(e){}
  }

  window.CleaningFreezeTrace={version:'0.1.0',enabled:ON,mark:mark,time:time,status:status};
  if(ON)console.log('[CleaningFreezeTrace] instrumentation active — call window.CleaningFreezeTrace.status() for a summary');
})();