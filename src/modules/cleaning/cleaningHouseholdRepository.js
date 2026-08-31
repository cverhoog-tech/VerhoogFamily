'use strict';
// ============================================================
// CLEANING HOUSEHOLD REPOSITORY v0.1.0
// Read-only foundation: HouseholdContext + Firebase read lifecycle.
// No canonical writes are enabled in this checkpoint.
// ============================================================
(function(){
  if(window.CleaningHouseholdRepository)return;

  var VERSION='0.1.0';
  var subscribers=[];
  var contextUnsubscribe=null;
  var active=null;
  var bindGeneration=0;

  var COLLECTIONS=[
    'rooms',
    'routines',
    'supplies',
    'inventory',
    'plans',
    'occurrences',
    'approvals',
    'completionLogs',
    'availability',
    'preferences'
  ];

  function clone(value){
    if(value===undefined)return undefined;
    try{return JSON.parse(JSON.stringify(value));}catch(e){return value;}
  }

  function emptyData(){
    var out={};
    COLLECTIONS.forEach(function(name){out[name]={};});
    return out;
  }

  var current={
    version:VERSION,
    ready:false,
    source:'idle',
    uid:null,
    householdId:null,
    revision:0,
    data:emptyData(),
    error:null
  };

  function deepFreeze(value){
    if(!value||typeof value!=='object'||Object.isFrozen(value))return value;
    Object.keys(value).forEach(function(key){deepFreeze(value[key]);});
    try{return Object.freeze(value);}catch(e){return value;}
  }

  function snapshot(){
    return deepFreeze(clone(current));
  }

  function emit(next){
    current=Object.assign({
      version:VERSION,
      ready:false,
      source:'unknown',
      uid:null,
      householdId:null,
      revision:0,
      data:emptyData(),
      error:null
    },next||{});
    if(!current.data||typeof current.data!=='object')current.data=emptyData();
    COLLECTIONS.forEach(function(name){
      if(!current.data[name]||typeof current.data[name]!=='object')current.data[name]={};
    });
    var snap=snapshot();
    subscribers.slice().forEach(function(fn){
      try{fn(snap);}catch(e){console.warn('[CleaningHouseholdRepository] subscriber failed',e);}
    });
    try{window.dispatchEvent(new CustomEvent('familyapp:cleaning-repository',{detail:snap}));}catch(e){}
  }

  function subscribe(fn){
    if(typeof fn!=='function')return function(){};
    subscribers.push(fn);
    try{fn(snapshot());}catch(e){}
    return function(){
      var index=subscribers.indexOf(fn);
      if(index>=0)subscribers.splice(index,1);
    };
  }

  function firebaseDb(){
    try{
      if(window.fbDb)return window.fbDb;
      if(window.firebase&&typeof window.firebase.database==='function')return window.firebase.database();
    }catch(e){}
    return null;
  }

  function contextSnapshot(){
    try{
      return window.HouseholdContext&&typeof window.HouseholdContext.snapshot==='function'
        ? window.HouseholdContext.snapshot()
        : null;
    }catch(e){return null;}
  }

  function captureContext(){
    try{
      return window.HouseholdContext&&typeof window.HouseholdContext.capture==='function'
        ? window.HouseholdContext.capture()
        : null;
    }catch(e){return null;}
  }

  function isCurrent(token){
    try{
      return !!(window.HouseholdContext&&typeof window.HouseholdContext.isCurrent==='function'&&window.HouseholdContext.isCurrent(token));
    }catch(e){return false;}
  }

  function validContext(ctx){
    return !!(ctx&&ctx.ready===true&&ctx.uid&&ctx.householdId);
  }

  function normalizeRoot(value){
    var source=value&&typeof value==='object'?value:{};
    var out=emptyData();
    COLLECTIONS.forEach(function(name){
      var collection=source[name];
      out[name]=collection&&typeof collection==='object'?clone(collection):{};
    });
    return out;
  }

  function activeIsCurrent(binding){
    return !!(
      binding&&
      active===binding&&
      binding.generation===bindGeneration&&
      isCurrent(binding.token)
    );
  }

  function detachActive(){
    if(active&&active.ref&&active.handler){
      try{active.ref.off('value',active.handler);}catch(e){}
    }
    active=null;
    bindGeneration++;
  }

  function unbind(reason){
    detachActive();
    emit({
      ready:false,
      source:reason||'unbound',
      uid:null,
      householdId:null,
      revision:0,
      data:emptyData(),
      error:null
    });
  }

  function bind(ctx){
    ctx=ctx||contextSnapshot();
    detachActive();

    if(!validContext(ctx)){
      emit({
        ready:false,
        source:'context-not-ready',
        uid:ctx&&ctx.uid||null,
        householdId:ctx&&ctx.householdId||null,
        revision:ctx&&ctx.revision||0,
        data:emptyData(),
        error:null
      });
      return false;
    }

    var db=firebaseDb();
    if(!db){
      emit({
        ready:false,
        source:'firebase-unavailable',
        uid:ctx.uid,
        householdId:ctx.householdId,
        revision:ctx.revision,
        data:emptyData(),
        error:'FIREBASE_DATABASE_UNAVAILABLE'
      });
      return false;
    }

    var token=captureContext();
    if(!token||!isCurrent(token))return false;

    var domain=window.CleaningDomain;
    var path=domain&&typeof domain.basePath==='function'
      ? domain.basePath(ctx.householdId)
      : 'families/'+String(ctx.householdId)+'/cleaning';
    if(!path)return false;

    var generation=++bindGeneration;
    var ref=db.ref(path);
    var binding={
      generation:generation,
      token:token,
      uid:ctx.uid,
      householdId:ctx.householdId,
      revision:ctx.revision,
      ref:ref,
      handler:null
    };
    active=binding;

    emit({
      ready:false,
      source:'binding',
      uid:ctx.uid,
      householdId:ctx.householdId,
      revision:ctx.revision,
      data:emptyData(),
      error:null
    });

    binding.handler=function(firebaseSnapshot){
      if(!activeIsCurrent(binding))return;
      var value=firebaseSnapshot&&typeof firebaseSnapshot.val==='function'?firebaseSnapshot.val():null;
      emit({
        ready:true,
        source:value?'firebase':'firebase-empty',
        uid:binding.uid,
        householdId:binding.householdId,
        revision:binding.revision,
        data:normalizeRoot(value),
        error:null
      });
    };

    ref.on('value',binding.handler,function(error){
      if(!activeIsCurrent(binding))return;
      emit({
        ready:false,
        source:'firebase-error',
        uid:binding.uid,
        householdId:binding.householdId,
        revision:binding.revision,
        data:emptyData(),
        error:error&&error.message?error.message:String(error||'CLEANING_READ_ERROR')
      });
    });
    return true;
  }

  function handleContext(ctx){
    if(!validContext(ctx)){
      if(active||current.ready||current.householdId)unbind('context-cleared');
      return;
    }
    if(
      active&&
      active.uid===ctx.uid&&
      active.householdId===ctx.householdId&&
      active.revision===ctx.revision
    )return;
    bind(ctx);
  }

  function attach(){
    if(contextUnsubscribe)return true;
    var context=window.HouseholdContext;
    if(!context||typeof context.subscribe!=='function')return false;
    contextUnsubscribe=context.subscribe(handleContext);
    return true;
  }

  function stop(){
    if(contextUnsubscribe){
      try{contextUnsubscribe();}catch(e){}
      contextUnsubscribe=null;
    }
    unbind('stopped');
  }

  function readOnlyWrite(){
    return Promise.reject(new Error('CLEANING_WRITES_NOT_ENABLED_IN_READ_FOUNDATION'));
  }

  function getOccurrence(id){
    var occurrenceId=String(id||'');
    var occurrences=current.data&&current.data.occurrences||{};
    return clone(occurrences[occurrenceId]||null);
  }

  window.CleaningHouseholdRepository={
    version:VERSION,
    bind:bind,
    unbind:unbind,
    subscribe:subscribe,
    snapshot:snapshot,
    createRoom:readOnlyWrite,
    updateRoom:readOnlyWrite,
    removeRoom:readOnlyWrite,
    createRoutineItem:readOnlyWrite,
    updateRoutineItem:readOnlyWrite,
    removeRoutineItem:readOnlyWrite,
    createOccurrence:readOnlyWrite,
    updateOccurrence:readOnlyWrite,
    getOccurrence:getOccurrence,
    setUserPreferences:readOnlyWrite,
    attach:attach,
    stop:stop
  };

  if(window.CleaningRepositoryContract&&typeof window.CleaningRepositoryContract.validateImplementation==='function'){
    var validation=window.CleaningRepositoryContract.validateImplementation(window.CleaningHouseholdRepository);
    if(!validation.valid)console.error('[CleaningHouseholdRepository] contract mismatch',validation.missing);
  }

  if(!attach()){
    window.addEventListener('familyapp:household-context',function(){attach();},{once:true});
  }
})();
