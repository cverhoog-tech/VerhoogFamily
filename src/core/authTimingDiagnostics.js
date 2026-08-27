'use strict';
// ============================================================
// AUTH TIMING DIAGNOSTICS v1.0 — temporary/dev-safe instrumentation for the
// Google login -> Home reveal critical path (fix #7: real-device 5-10s
// post-login freeze on iPhone/PWA).
//
// Logs "[AuthTiming][id] label +NNNms" marks with deltas so a real iPhone/PWA
// session can show exactly which stage the time is lost in. Also tracks
// document lifecycle transitions (visibilitychange/pageshow/pagehide/focus/
// blur) that happen while returning from the Google account chooser.
//
// Never logs tokens, Firebase credentials, or personal data — only stage
// labels and millisecond deltas.
// ============================================================
(function(){
  if(window.__familyAuthTimingV1)return;
  window.__familyAuthTimingV1=true;

  function now(){try{return performance.now();}catch(e){return Date.now();}}
  function newId(){return Math.random().toString(36).slice(2,8);}

  var current=null;
  var history=[];

  function begin(label){
    var t0=now();
    current={id:newId(),t0:t0,marks:[]};
    mark(label||'T0-login-tap');
    return current.id;
  }

  function mark(label,id){
    if(!current)return null;
    if(id&&id!==current.id)return null;
    var t=now();
    var fromStart=Math.round(t-current.t0);
    var prevT=current.marks.length?current.marks[current.marks.length-1].t:current.t0;
    var fromPrev=Math.round(t-prevT);
    current.marks.push({label:label,t:t,fromStartMs:fromStart,fromPrevMs:fromPrev});
    try{console.log('[AuthTiming]['+current.id+'] '+label+' +'+fromStart+'ms (\u0394'+fromPrev+'ms)');}catch(e){}
    return current.id;
  }

  function lifecycleMark(name){
    return function(){
      if(!current)return;
      var vis='unknown';
      try{vis=(typeof document!=='undefined'&&document.visibilityState)||'unknown';}catch(e){}
      var focused='n/a';
      try{focused=(typeof document!=='undefined'&&typeof document.hasFocus==='function')?document.hasFocus():'n/a';}catch(e){}
      mark('lifecycle:'+name+' visibility='+vis+' hasFocus='+focused);
    };
  }
  try{
    ['visibilitychange','pageshow','pagehide','focus','blur'].forEach(function(evt){
      window.addEventListener(evt,lifecycleMark(evt),true);
    });
  }catch(e){}

  function finish(reason){
    if(!current)return null;
    mark('T13-summary-end:'+(reason||'reveal'));
    var line=current.marks.map(function(m){return m.label+' +'+m.fromStartMs+'ms';}).join(' | ');
    try{console.log('[AuthTiming]['+current.id+'] SUMMARY '+line);}catch(e){}
    history.unshift({id:current.id,marks:current.marks.map(function(m){return{label:m.label,fromStartMs:m.fromStartMs,fromPrevMs:m.fromPrevMs};})});
    if(history.length>5)history.length=5;
    var finishedId=current.id;
    current=null;
    return finishedId;
  }

  function currentId(){return current?current.id:null;}

  window.__familyAuthTiming={begin:begin,mark:mark,finish:finish,currentId:currentId};

  // Dev-only real-device debuggability (no secrets/tokens/PII):
  // window.getFamilyAppAuthTiming() returns the most recent completed timing,
  // or the in-progress attempt if one is still running.
  window.getFamilyAppAuthTiming=function(){
    if(current){
      return{id:current.id,inProgress:true,marks:current.marks.map(function(m){return{label:m.label,fromStartMs:m.fromStartMs,fromPrevMs:m.fromPrevMs};})};
    }
    return history[0]||null;
  };
  window.getFamilyAppAuthTimingHistory=function(){return history.slice();};
})();
