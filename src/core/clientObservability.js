'use strict';
(function(){
  if(window.__familyClientObservabilityV1) return;
  window.__familyClientObservabilityV1=true;

  var VERSION='1.0.1';
  var MAX_EVENTS=80;
  var events=[];
  var sessionId='obs_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,8);
  var blockedKeys=/^(name|displayName|email|phone|address|body|text|messageBody|description|amount|price|value|note|notes|ingredients|content|photoURL|avatarUrl|token|fcmToken)$/i;

  function hash(value){
    value=String(value||'');
    var h=2166136261;
    for(var i=0;i<value.length;i++){h^=value.charCodeAt(i);h+=(h<<1)+(h<<4)+(h<<7)+(h<<8)+(h<<24);}
    return (h>>>0).toString(36);
  }
  function isIdentityKey(key){
    key=String(key||'');
    return /uid$/i.test(key)||/householdid$/i.test(key)||/familyid$/i.test(key);
  }
  function scrubScalar(key,value){
    if(blockedKeys.test(key||'')) return '[redacted]';
    if(isIdentityKey(key)) return value?hash(value):null;
    if(typeof value==='string') return value.slice(0,120).replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/ig,'[email]').replace(/https?:\/\/[^\s]+/ig,'[url]');
    if(typeof value==='number'||typeof value==='boolean'||value==null) return value;
    return String(value).slice(0,120);
  }
  function scrub(input){
    if(!input||typeof input!=='object') return {};
    var out={};
    Object.keys(input).slice(0,30).forEach(function(key){
      if(blockedKeys.test(key)) return;
      var value=input[key];
      if(value&&typeof value==='object'&&!Array.isArray(value)){
        var nested={};
        Object.keys(value).slice(0,20).forEach(function(k){nested[k]=scrubScalar(k,value[k]);});
        out[key]=nested;
      } else if(Array.isArray(value)) {
        out[key]='[array:'+value.length+']';
      } else out[key]=scrubScalar(key,value);
    });
    return out;
  }
  function snapshotContext(){
    var c={online:navigator.onLine!==false,visibility:document.visibilityState||'unknown'};
    try{
      if(window.HouseholdContext&&typeof window.HouseholdContext.current==='function'){
        var hc=window.HouseholdContext.current();
        c.uid=hc&&hc.uid;
        c.householdId=hc&&hc.householdId;
        c.role=hc&&hc.role;
      } else {
        c.uid=window.fbUser&&window.fbUser.uid;
        c.householdId=window.fbFamilyId||null;
      }
    }catch(e){}
    try{if(window.AuthSessionBootstrap&&typeof window.AuthSessionBootstrap.status==='function')c.auth=window.AuthSessionBootstrap.status();}catch(e){}
    return scrub(c);
  }
  function record(type,detail){
    var item={ts:Date.now(),type:String(type||'event').slice(0,80),context:snapshotContext(),detail:scrub(detail||{})};
    events.push(item);if(events.length>MAX_EVENTS)events.splice(0,events.length-MAX_EVENTS);
    try{window.dispatchEvent(new CustomEvent('familyapp:observability:event',{detail:item}));}catch(e){}
    return item;
  }
  function recordError(error,meta){
    error=error||{};
    return record('error',Object.assign({},meta||{}, {code:error.code||null,type:error.name||'Error',module:(meta&&meta.module)||null,message:'[redacted]'}));
  }
  function diagnosticSnapshot(){
    return {version:VERSION,sessionId:sessionId,generatedAt:Date.now(),context:snapshotContext(),events:events.slice()};
  }
  function clear(){events.length=0;}

  window.addEventListener('error',function(e){recordError(e&&e.error||{}, {module:'window',code:e&&e.error&&e.error.code||'UNCAUGHT_ERROR'});});
  window.addEventListener('unhandledrejection',function(e){recordError(e&&e.reason||{}, {module:'promise',code:e&&e.reason&&e.reason.code||'UNHANDLED_REJECTION'});});
  ['online','offline','pageshow','pagehide','focus','blur'].forEach(function(name){window.addEventListener(name,function(e){record('lifecycle',{event:name,status:e&&e.persisted===true?'persisted':null});});});
  document.addEventListener('visibilitychange',function(){record('lifecycle',{event:'visibilitychange',visibility:document.visibilityState});});
  window.addEventListener('familyapp:household-context-changed',function(e){record('household-context',{event:'changed',reason:e&&e.detail&&e.detail.reason});});
  window.addEventListener('familyapp:session:cleared',function(e){record('session',{event:'cleared',reason:e&&e.detail&&e.detail.reason});});
  window.addEventListener('familyapp:auth-bootstrap:start',function(){record('auth',{event:'boot-start'});});
  window.addEventListener('familyapp:auth-bootstrap:ready',function(){record('auth',{event:'boot-ready'});});
  window.addEventListener('familyapp:auth-bootstrap:reset',function(e){record('auth',{event:'boot-reset',reason:e&&e.detail&&e.detail.reason});});

  record('observability',{event:'initialized',version:VERSION});
  window.FamilyObservability={version:VERSION,record:record,error:recordError,snapshot:diagnosticSnapshot,clear:clear};
})();
