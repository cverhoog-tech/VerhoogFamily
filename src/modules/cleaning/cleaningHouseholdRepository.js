'use strict';
// ============================================================
// CLEANING HOUSEHOLD REPOSITORY v0.6.0
// HouseholdContext-scoped Firebase read lifecycle.
// Canonical room CRUD + routine create/update/soft-delete.
// Routine -> room membership is stored only on routine.roomId.
// ============================================================
(function(){
  if(window.CleaningHouseholdRepository)return;

  var VERSION='0.6.0';
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

  var current={version:VERSION,ready:false,source:'idle',uid:null,householdId:null,revision:0,data:emptyData(),error:null};

  function deepFreeze(value){
    if(!value||typeof value!=='object'||Object.isFrozen(value))return value;
    Object.keys(value).forEach(function(key){deepFreeze(value[key]);});
    try{return Object.freeze(value);}catch(e){return value;}
  }

  function snapshot(){return deepFreeze(clone(current));}

  function emit(next){
    current=Object.assign({version:VERSION,ready:false,source:'unknown',uid:null,householdId:null,revision:0,data:emptyData(),error:null},next||{});
    if(!current.data||typeof current.data!=='object')current.data=emptyData();
    COLLECTIONS.forEach(function(name){if(!current.data[name]||typeof current.data[name]!=='object')current.data[name]={};});
    var snap=snapshot();
    subscribers.slice().forEach(function(fn){try{fn(snap);}catch(e){console.warn('[CleaningHouseholdRepository] subscriber failed',e);}});
    try{window.dispatchEvent(new CustomEvent('familyapp:cleaning-repository',{detail:snap}));}catch(e){}
  }

  function subscribe(fn){
    if(typeof fn!=='function')return function(){};
    subscribers.push(fn);
    try{fn(snapshot());}catch(e){}
    return function(){var index=subscribers.indexOf(fn);if(index>=0)subscribers.splice(index,1);};
  }

  function firebaseDb(){
    try{
      if(window.fbDb)return window.fbDb;
      if(window.firebase&&typeof window.firebase.database==='function')return window.firebase.database();
    }catch(e){}
    return null;
  }

  function contextSnapshot(){try{return window.HouseholdContext&&typeof window.HouseholdContext.snapshot==='function'?window.HouseholdContext.snapshot():null;}catch(e){return null;}}
  function captureContext(){try{return window.HouseholdContext&&typeof window.HouseholdContext.capture==='function'?window.HouseholdContext.capture():null;}catch(e){return null;}}
  function isCurrent(token){try{return !!(window.HouseholdContext&&typeof window.HouseholdContext.isCurrent==='function'&&window.HouseholdContext.isCurrent(token));}catch(e){return false;}}
  function validContext(ctx){return !!(ctx&&ctx.ready===true&&ctx.uid&&ctx.householdId);}

  function normalizeRoot(value){
    var source=value&&typeof value==='object'?value:{};
    var out=emptyData();
    COLLECTIONS.forEach(function(name){var collection=source[name];out[name]=collection&&typeof collection==='object'?clone(collection):{};});
    return out;
  }

  function activeIsCurrent(binding){return !!(binding&&active===binding&&binding.generation===bindGeneration&&isCurrent(binding.token));}
  function detachActive(){if(active&&active.ref&&active.handler){try{active.ref.off('value',active.handler);}catch(e){}}active=null;bindGeneration++;}
  function unbind(reason){detachActive();emit({ready:false,source:reason||'unbound',uid:null,householdId:null,revision:0,data:emptyData(),error:null});}

  function bind(ctx){
    ctx=ctx||contextSnapshot();
    detachActive();
    if(!validContext(ctx)){emit({ready:false,source:'context-not-ready',uid:ctx&&ctx.uid||null,householdId:ctx&&ctx.householdId||null,revision:ctx&&ctx.revision||0,data:emptyData(),error:null});return false;}
    var db=firebaseDb();
    if(!db){emit({ready:false,source:'firebase-unavailable',uid:ctx.uid,householdId:ctx.householdId,revision:ctx.revision,data:emptyData(),error:'FIREBASE_DATABASE_UNAVAILABLE'});return false;}
    var token=captureContext();
    if(!token||!isCurrent(token))return false;
    var domain=window.CleaningDomain;
    var path=domain&&typeof domain.basePath==='function'?domain.basePath(ctx.householdId):'families/'+String(ctx.householdId)+'/cleaning';
    if(!path)return false;
    var generation=++bindGeneration;
    var ref=db.ref(path);
    var binding={generation:generation,token:token,uid:ctx.uid,householdId:ctx.householdId,revision:ctx.revision,ref:ref,handler:null};
    active=binding;
    emit({ready:false,source:'binding',uid:ctx.uid,householdId:ctx.householdId,revision:ctx.revision,data:emptyData(),error:null});
    binding.handler=function(firebaseSnapshot){
      if(!activeIsCurrent(binding))return;
      var value=firebaseSnapshot&&typeof firebaseSnapshot.val==='function'?firebaseSnapshot.val():null;
      emit({ready:true,source:value?'firebase':'firebase-empty',uid:binding.uid,householdId:binding.householdId,revision:binding.revision,data:normalizeRoot(value),error:null});
    };
    ref.on('value',binding.handler,function(error){
      if(!activeIsCurrent(binding))return;
      emit({ready:false,source:'firebase-error',uid:binding.uid,householdId:binding.householdId,revision:binding.revision,data:emptyData(),error:error&&error.message?error.message:String(error||'CLEANING_READ_ERROR')});
    });
    return true;
  }

  function handleContext(ctx){
    if(!validContext(ctx)){if(active||current.ready||current.householdId)unbind('context-cleared');return;}
    if(active&&active.uid===ctx.uid&&active.householdId===ctx.householdId&&active.revision===ctx.revision)return;
    bind(ctx);
  }

  function attach(){if(contextUnsubscribe)return true;var context=window.HouseholdContext;if(!context||typeof context.subscribe!=='function')return false;contextUnsubscribe=context.subscribe(handleContext);return true;}
  function stop(){if(contextUnsubscribe){try{contextUnsubscribe();}catch(e){}contextUnsubscribe=null;}unbind('stopped');}
  function readOnlyWrite(){return Promise.reject(new Error('CLEANING_WRITE_NOT_ENABLED_YET'));}

  function requireWriteContext(){
    var ctx=contextSnapshot();
    if(!validContext(ctx))throw new Error('ACTIVE_HOUSEHOLD_REQUIRED');
    var db=firebaseDb();
    if(!db)throw new Error('FIREBASE_DATABASE_UNAVAILABLE');
    var token=captureContext();
    if(!token||!isCurrent(token))throw new Error('HOUSEHOLD_CONTEXT_CHANGED');
    return {ctx:ctx,db:db,token:token};
  }

  function requireDomain(){
    var domain=window.CleaningDomain;
    if(!domain||typeof domain.normalizeRoom!=='function'||typeof domain.normalizeRoutineItem!=='function'||typeof domain.basePath!=='function')throw new Error('CLEANING_DOMAIN_UNAVAILABLE');
    return domain;
  }

  function currentRoom(roomId){var rooms=current.data&&current.data.rooms||{};var room=rooms[roomId];return room&&typeof room==='object'?room:null;}
  function currentRoutine(routineId){var routines=current.data&&current.data.routines||{};var routine=routines[routineId];return routine&&typeof routine==='object'?routine:null;}

  function createRoom(input){
    var write,domain;
    try{write=requireWriteContext();domain=requireDomain();}catch(error){return Promise.reject(error);}
    var basePath=domain.basePath(write.ctx.householdId);
    if(!basePath)return Promise.reject(new Error('ACTIVE_HOUSEHOLD_REQUIRED'));
    var roomsRef=write.db.ref(basePath+'/rooms');
    var roomRef=roomsRef.push();
    var roomId=roomRef&&roomRef.key;
    if(!roomId)return Promise.reject(new Error('CLEANING_ROOM_ID_FAILED'));
    var room=domain.normalizeRoom(input||{},roomId);
    if(!room.name)return Promise.reject(new Error('CLEANING_ROOM_NAME_REQUIRED'));
    var timestamp=Date.now();
    room.id=roomId;room.householdId=write.ctx.householdId;room.createdByUid=write.ctx.uid;room.createdAt=timestamp;room.updatedByUid=write.ctx.uid;room.updatedAt=timestamp;room.schemaVersion=1;
    if(!isCurrent(write.token))return Promise.reject(new Error('HOUSEHOLD_CONTEXT_CHANGED'));
    return roomRef.set(room).then(function(){if(!isCurrent(write.token))throw new Error('HOUSEHOLD_CONTEXT_CHANGED_AFTER_WRITE');return deepFreeze(clone(room));});
  }

  function updateRoom(roomId,input){
    var write,domain;
    try{write=requireWriteContext();domain=requireDomain();}catch(error){return Promise.reject(error);}
    var id=domain.safeId?domain.safeId(roomId):String(roomId||'');
    if(!id)return Promise.reject(new Error('CLEANING_ROOM_ID_REQUIRED'));
    var existing=currentRoom(id);
    if(!existing)return Promise.reject(new Error('CLEANING_ROOM_NOT_FOUND'));
    if(existing.active===false)return Promise.reject(new Error('CLEANING_ROOM_INACTIVE'));
    var normalized=domain.normalizeRoom(Object.assign({},clone(existing),input||{}),id);
    if(!normalized.name)return Promise.reject(new Error('CLEANING_ROOM_NAME_REQUIRED'));
    var basePath=domain.basePath(write.ctx.householdId);
    if(!basePath)return Promise.reject(new Error('ACTIVE_HOUSEHOLD_REQUIRED'));
    var patch={name:normalized.name,type:normalized.type,updatedByUid:write.ctx.uid,updatedAt:Date.now()};
    if(!isCurrent(write.token))return Promise.reject(new Error('HOUSEHOLD_CONTEXT_CHANGED'));
    var roomRef=write.db.ref(basePath+'/rooms/'+id);
    return roomRef.update(patch).then(function(){if(!isCurrent(write.token))throw new Error('HOUSEHOLD_CONTEXT_CHANGED_AFTER_WRITE');return deepFreeze(Object.assign({},clone(existing),patch));});
  }

  function removeRoom(roomId){
    var write,domain;
    try{write=requireWriteContext();domain=requireDomain();}catch(error){return Promise.reject(error);}
    var id=domain.safeId?domain.safeId(roomId):String(roomId||'');
    if(!id)return Promise.reject(new Error('CLEANING_ROOM_ID_REQUIRED'));
    var existing=currentRoom(id);
    if(!existing)return Promise.reject(new Error('CLEANING_ROOM_NOT_FOUND'));
    var basePath=domain.basePath(write.ctx.householdId);
    if(!basePath)return Promise.reject(new Error('ACTIVE_HOUSEHOLD_REQUIRED'));
    if(!isCurrent(write.token))return Promise.reject(new Error('HOUSEHOLD_CONTEXT_CHANGED'));
    var roomRef=write.db.ref(basePath+'/rooms/'+id);
    var timestamp=Date.now();
    return roomRef.transaction(function(serverRoom){
      if(!serverRoom||typeof serverRoom!=='object')return;
      if(serverRoom.active===false)return serverRoom;
      serverRoom.active=false;serverRoom.deletedAt=serverRoom.deletedAt||timestamp;serverRoom.deletedByUid=serverRoom.deletedByUid||write.ctx.uid;serverRoom.updatedAt=timestamp;serverRoom.updatedByUid=write.ctx.uid;return serverRoom;
    }).then(function(result){if(!isCurrent(write.token))throw new Error('HOUSEHOLD_CONTEXT_CHANGED_AFTER_WRITE');if(!result||!result.snapshot||!result.snapshot.exists())throw new Error('CLEANING_ROOM_NOT_FOUND');return deepFreeze(clone(result.snapshot.val()));});
  }

  function createRoutineItem(input){
    var write,domain;
    try{write=requireWriteContext();domain=requireDomain();}catch(error){return Promise.reject(error);}
    var roomId=domain.safeId?domain.safeId(input&&input.roomId):String(input&&input.roomId||'');
    if(!roomId)return Promise.reject(new Error('CLEANING_ROUTINE_ROOM_REQUIRED'));
    var room=currentRoom(roomId);
    if(!room)return Promise.reject(new Error('CLEANING_ROOM_NOT_FOUND'));
    if(room.active===false)return Promise.reject(new Error('CLEANING_ROOM_INACTIVE'));
    var basePath=domain.basePath(write.ctx.householdId);
    if(!basePath)return Promise.reject(new Error('ACTIVE_HOUSEHOLD_REQUIRED'));
    var routinesRef=write.db.ref(basePath+'/routines');
    var routineRef=routinesRef.push();
    var routineId=routineRef&&routineRef.key;
    if(!routineId)return Promise.reject(new Error('CLEANING_ROUTINE_ID_FAILED'));
    var routine=domain.normalizeRoutineItem(Object.assign({},input||{},{roomId:roomId}),routineId);
    if(!routine.title)return Promise.reject(new Error('CLEANING_ROUTINE_TITLE_REQUIRED'));
    var timestamp=Date.now();
    routine.id=routineId;routine.roomId=roomId;routine.householdId=write.ctx.householdId;routine.createdByUid=write.ctx.uid;routine.createdAt=timestamp;routine.updatedByUid=write.ctx.uid;routine.updatedAt=timestamp;routine.schemaVersion=1;
    if(!isCurrent(write.token))return Promise.reject(new Error('HOUSEHOLD_CONTEXT_CHANGED'));
    return routineRef.set(routine).then(function(){if(!isCurrent(write.token))throw new Error('HOUSEHOLD_CONTEXT_CHANGED_AFTER_WRITE');return deepFreeze(clone(routine));});
  }

  function updateRoutineItem(routineId,input){
    var write,domain;
    try{write=requireWriteContext();domain=requireDomain();}catch(error){return Promise.reject(error);}
    var id=domain.safeId?domain.safeId(routineId):String(routineId||'');
    if(!id)return Promise.reject(new Error('CLEANING_ROUTINE_ID_REQUIRED'));
    var existing=currentRoutine(id);
    if(!existing)return Promise.reject(new Error('CLEANING_ROUTINE_NOT_FOUND'));
    if(existing.active===false)return Promise.reject(new Error('CLEANING_ROUTINE_INACTIVE'));
    var roomId=domain.safeId?domain.safeId(existing.roomId):String(existing.roomId||'');
    if(!roomId)return Promise.reject(new Error('CLEANING_ROUTINE_ROOM_REQUIRED'));
    var room=currentRoom(roomId);
    if(!room)return Promise.reject(new Error('CLEANING_ROOM_NOT_FOUND'));
    if(room.active===false)return Promise.reject(new Error('CLEANING_ROOM_INACTIVE'));
    var normalized=domain.normalizeRoutineItem(Object.assign({},clone(existing),input||{},{roomId:roomId}),id);
    if(!normalized.title)return Promise.reject(new Error('CLEANING_ROUTINE_TITLE_REQUIRED'));
    var basePath=domain.basePath(write.ctx.householdId);
    if(!basePath)return Promise.reject(new Error('ACTIVE_HOUSEHOLD_REQUIRED'));
    var patch={title:normalized.title,intervalDays:normalized.intervalDays,estimatedMinutes:normalized.estimatedMinutes,priority:normalized.priority,updatedByUid:write.ctx.uid,updatedAt:Date.now()};
    if(!isCurrent(write.token))return Promise.reject(new Error('HOUSEHOLD_CONTEXT_CHANGED'));
    var routineRef=write.db.ref(basePath+'/routines/'+id);
    return routineRef.update(patch).then(function(){if(!isCurrent(write.token))throw new Error('HOUSEHOLD_CONTEXT_CHANGED_AFTER_WRITE');return deepFreeze(Object.assign({},clone(existing),patch));});
  }

  function removeRoutineItem(routineId){
    var write,domain;
    try{write=requireWriteContext();domain=requireDomain();}catch(error){return Promise.reject(error);}
    var id=domain.safeId?domain.safeId(routineId):String(routineId||'');
    if(!id)return Promise.reject(new Error('CLEANING_ROUTINE_ID_REQUIRED'));
    var existing=currentRoutine(id);
    if(!existing)return Promise.reject(new Error('CLEANING_ROUTINE_NOT_FOUND'));
    var basePath=domain.basePath(write.ctx.householdId);
    if(!basePath)return Promise.reject(new Error('ACTIVE_HOUSEHOLD_REQUIRED'));
    if(!isCurrent(write.token))return Promise.reject(new Error('HOUSEHOLD_CONTEXT_CHANGED'));
    var routineRef=write.db.ref(basePath+'/routines/'+id);
    var timestamp=Date.now();
    return routineRef.transaction(function(serverRoutine){
      if(!serverRoutine||typeof serverRoutine!=='object')return;
      if(serverRoutine.active===false)return serverRoutine;
      serverRoutine.active=false;serverRoutine.deletedAt=serverRoutine.deletedAt||timestamp;serverRoutine.deletedByUid=serverRoutine.deletedByUid||write.ctx.uid;serverRoutine.updatedAt=timestamp;serverRoutine.updatedByUid=write.ctx.uid;return serverRoutine;
    }).then(function(result){if(!isCurrent(write.token))throw new Error('HOUSEHOLD_CONTEXT_CHANGED_AFTER_WRITE');if(!result||!result.snapshot||!result.snapshot.exists())throw new Error('CLEANING_ROUTINE_NOT_FOUND');return deepFreeze(clone(result.snapshot.val()));});
  }

  function getOccurrence(id){var occurrenceId=String(id||'');var occurrences=current.data&&current.data.occurrences||{};return clone(occurrences[occurrenceId]||null);}

  window.CleaningHouseholdRepository={version:VERSION,bind:bind,unbind:unbind,subscribe:subscribe,snapshot:snapshot,createRoom:createRoom,updateRoom:updateRoom,removeRoom:removeRoom,createRoutineItem:createRoutineItem,updateRoutineItem:updateRoutineItem,removeRoutineItem:removeRoutineItem,createOccurrence:readOnlyWrite,updateOccurrence:readOnlyWrite,getOccurrence:getOccurrence,setUserPreferences:readOnlyWrite,attach:attach,stop:stop};

  if(window.CleaningRepositoryContract&&typeof window.CleaningRepositoryContract.validateImplementation==='function'){
    var validation=window.CleaningRepositoryContract.validateImplementation(window.CleaningHouseholdRepository);
    if(!validation.valid)console.error('[CleaningHouseholdRepository] contract mismatch',validation.missing);
  }

  if(!attach())window.addEventListener('familyapp:household-context',function(){attach();},{once:true});
})();
