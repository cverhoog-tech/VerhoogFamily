'use strict';
// ============================================================
// FAMILYAPP HOUSEHOLD CONTEXT v1.0
// Single runtime contract for authenticated user + household scope.
// ============================================================
(function(){
  if(window.HouseholdContext) return;

  var listeners=[];
  var snapshot=null;

  function authUser(){
    try{return window.fbUser||(window.firebase&&firebase.auth&&firebase.auth().currentUser)||null;}catch(e){return null;}
  }
  function householdId(){ return window.fbFamilyId||null; }
  function memberBridge(){ return window.HouseholdIdentityFirebaseBridge||null; }
  function memberFor(uid){
    try{
      var bridge=memberBridge();
      if(!bridge||typeof bridge.getMembers!=='function') return null;
      var members=bridge.getMembers()||[];
      for(var i=0;i<members.length;i++) if(members[i]&&members[i].uid===uid) return members[i];
    }catch(e){}
    return null;
  }
  function makeSnapshot(reason){
    var u=authUser(),hid=householdId(),member=u?memberFor(u.uid):null;
    return {
      version:'1.0.0',
      uid:u&&u.uid||null,
      householdId:hid||null,
      authenticated:!!u,
      householdResolved:!!hid,
      member:member||null,
      memberStatus:member&&member.status||null,
      memberRole:member&&member.role||null,
      ready:!!(u&&hid&&(!member||member.status==='active')),
      reason:reason||'read',
      at:Date.now()
    };
  }
  function same(a,b){
    return !!a&&!!b&&a.uid===b.uid&&a.householdId===b.householdId&&a.memberStatus===b.memberStatus&&a.memberRole===b.memberRole&&a.ready===b.ready;
  }
  function publish(reason){
    var next=makeSnapshot(reason);
    if(!same(snapshot,next)){
      snapshot=next;
      listeners.slice().forEach(function(fn){try{fn(Object.assign({},next));}catch(e){}});
      try{window.dispatchEvent(new CustomEvent('familyapp:household-context-changed',{detail:Object.assign({},next)}));}catch(e){}
    }else snapshot=next;
    return Object.assign({},snapshot);
  }
  function current(){ return publish('read'); }
  function requireUser(){
    var ctx=current();
    if(!ctx.uid){var e=new Error('AUTH_REQUIRED');e.code='AUTH_REQUIRED';throw e;}
    return ctx.uid;
  }
  function requireHousehold(){
    var ctx=current();
    if(!ctx.uid){var e1=new Error('AUTH_REQUIRED');e1.code='AUTH_REQUIRED';throw e1;}
    if(!ctx.householdId){var e2=new Error('HOUSEHOLD_REQUIRED');e2.code='HOUSEHOLD_REQUIRED';throw e2;}
    if(ctx.memberStatus&&ctx.memberStatus!=='active'){var e3=new Error('HOUSEHOLD_ACCESS_REVOKED');e3.code='HOUSEHOLD_ACCESS_REVOKED';throw e3;}
    return ctx.householdId;
  }
  function assertContext(expected){
    expected=expected||{};
    var ctx=current();
    if(expected.uid&&ctx.uid!==expected.uid){var e1=new Error('USER_CONTEXT_CHANGED');e1.code='USER_CONTEXT_CHANGED';throw e1;}
    if(expected.householdId&&ctx.householdId!==expected.householdId){var e2=new Error('HOUSEHOLD_CONTEXT_CHANGED');e2.code='HOUSEHOLD_CONTEXT_CHANGED';throw e2;}
    if(expected.requireReady&& !ctx.ready){var e3=new Error('HOUSEHOLD_CONTEXT_NOT_READY');e3.code='HOUSEHOLD_CONTEXT_NOT_READY';throw e3;}
    return ctx;
  }
  function capture(){
    var ctx=current();
    return {uid:ctx.uid,householdId:ctx.householdId};
  }
  function isCurrent(token){
    token=token||{};var ctx=current();
    return ctx.uid===token.uid&&ctx.householdId===token.householdId;
  }
  function subscribe(fn){
    if(typeof fn!=='function') return function(){};
    listeners.push(fn);try{fn(current());}catch(e){}
    return function(){listeners=listeners.filter(function(x){return x!==fn;});};
  }
  function sharedPath(collection){
    var hid=requireHousehold();
    if(!collection) throw new Error('COLLECTION_REQUIRED');
    return 'families/'+hid+'/shared/'+String(collection);
  }
  function privatePath(collection){
    var uid=requireUser();
    if(!collection) throw new Error('COLLECTION_REQUIRED');
    return 'users/'+uid+'/private/'+String(collection);
  }

  ['familyapp:household-identity-synced','familyapp:household-identity-detached','familyapp:session:cleared','online','focus'].forEach(function(name){
    window.addEventListener(name,function(){publish(name);});
  });
  try{
    if(window.firebase&&firebase.auth){
      firebase.auth().onAuthStateChanged(function(){publish('auth-state');});
    }
  }catch(e){}

  window.HouseholdContext={
    version:'1.0.0',
    current:current,
    capture:capture,
    isCurrent:isCurrent,
    requireUser:requireUser,
    requireHousehold:requireHousehold,
    assertContext:assertContext,
    sharedPath:sharedPath,
    privatePath:privatePath,
    subscribe:subscribe,
    refresh:publish
  };
  publish('boot');
})();
