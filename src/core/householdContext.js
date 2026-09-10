'use strict';
(function(){
  if(window.HouseholdContext)return;

  var revision=0;
  var listeners=[];
  var sessionUnsubscribe=null;
  var state={
    uid:null,
    householdId:null,
    ready:false,
    sessionState:'idle',
    sessionGeneration:0,
    revision:0
  };

  function clone(){
    return {
      uid:state.uid,
      householdId:state.householdId,
      ready:state.ready,
      sessionState:state.sessionState,
      sessionGeneration:state.sessionGeneration,
      revision:state.revision
    };
  }

  function freeze(value){
    try{return Object.freeze(value);}catch(e){return value;}
  }

  function snapshot(){return freeze(clone());}

  function emit(reason){
    var snap=snapshot();
    listeners.slice().forEach(function(fn){try{fn(snap,reason||'update');}catch(e){console.warn('[HouseholdContext] subscriber failed',e);}});
    try{window.dispatchEvent(new CustomEvent('familyapp:household-context',{detail:{reason:reason||'update',context:snap}}));}catch(e){}
  }

  function normalizeSession(session){
    session=session||{};
    var uid=session.uid||(session.user&&session.user.uid)||null;
    var householdId=session.householdId||null;
    var ready=session.ready===true&&!!uid&&!!householdId;
    return {
      uid:uid,
      householdId:householdId,
      ready:ready,
      sessionState:session.state||'unknown',
      sessionGeneration:Number(session.generation||0)
    };
  }

  function applySession(session){
    var next=normalizeSession(session);
    var identityChanged=next.uid!==state.uid||next.householdId!==state.householdId;
    var readinessChanged=next.ready!==state.ready;
    var sessionChanged=next.sessionState!==state.sessionState||next.sessionGeneration!==state.sessionGeneration;
    if(identityChanged||readinessChanged||sessionChanged){
      revision++;
      state={
        uid:next.uid,
        householdId:next.householdId,
        ready:next.ready,
        sessionState:next.sessionState,
        sessionGeneration:next.sessionGeneration,
        revision:revision
      };
      emit(identityChanged?'identity-change':(readinessChanged?'readiness-change':'session-change'));
    }
    return snapshot();
  }

  function subscribe(fn){
    if(typeof fn!=='function')return function(){};
    listeners.push(fn);
    try{fn(snapshot(),'subscribe');}catch(e){}
    return function(){var i=listeners.indexOf(fn);if(i>=0)listeners.splice(i,1);};
  }

  function capture(){
    return freeze({uid:state.uid,householdId:state.householdId,revision:state.revision});
  }

  function isCurrent(token){
    return !!token&&token.uid===state.uid&&token.householdId===state.householdId&&token.revision===state.revision;
  }

  function requireUser(){
    if(!state.uid)throw new Error('AUTHENTICATED_USER_REQUIRED');
    return state.uid;
  }

  function requireHousehold(){
    if(!state.ready||!state.householdId)throw new Error('ACTIVE_HOUSEHOLD_REQUIRED');
    return state.householdId;
  }

  function cleanRelative(path){return String(path||'').replace(/^\/+|\/+$/g,'');}
  function householdPath(path){var base='families/'+requireHousehold();var rel=cleanRelative(path);return rel?base+'/'+rel:base;}
  function sharedPath(path){var base=householdPath('shared');var rel=cleanRelative(path);return rel?base+'/'+rel:base;}
  function memberPath(uid,path){var memberUid=uid||requireUser();var base=householdPath('members/'+memberUid);var rel=cleanRelative(path);return rel?base+'/'+rel:base;}
  function userPath(path){var base='users/'+requireUser();var rel=cleanRelative(path);return rel?base+'/'+rel:base;}

  function bindSession(controller){
    if(sessionUnsubscribe)return true;
    controller=controller||window.AuthenticatedSessionController;
    if(!controller||typeof controller.subscribe!=='function')return false;
    sessionUnsubscribe=controller.subscribe(function(session){applySession(session);});
    return true;
  }

  function stop(){
    if(sessionUnsubscribe){try{sessionUnsubscribe();}catch(e){}sessionUnsubscribe=null;}
    applySession({state:'stopped',generation:state.sessionGeneration+1,user:null,uid:null,householdId:null,ready:false});
  }

  window.HouseholdContext={
    version:'1.0',
    snapshot:snapshot,
    subscribe:subscribe,
    capture:capture,
    isCurrent:isCurrent,
    requireUser:requireUser,
    requireHousehold:requireHousehold,
    householdPath:householdPath,
    sharedPath:sharedPath,
    memberPath:memberPath,
    userPath:userPath,
    bindSession:bindSession,
    stop:stop,
    _applySession:applySession
  };

  if(!bindSession()){
    window.addEventListener('familyapp:session-state',function(e){applySession(e&&e.detail||{});});
  }
})();
