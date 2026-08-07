'use strict';
// ============================================================
// FAMILY DATA STORE v1
// Beta 1 persistence boundary for household-shared, user-private and
// offline/degraded data. Feature modules should use this layer instead of
// choosing Firebase/localStorage paths themselves.
// ============================================================
(function(){
  if(window.FamilyDataStore) return;

  var VERSION = '1.0.0';
  var CACHE_PREFIX = 'familyapp_data_v1_';
  var listeners = {};
  var subscriptions = {};

  var SHARED = {
    shoppingLists: 'shoppingLists',
    recipes: 'recipes',
    notes: 'notes',
    notifications: 'notifications'
  };
  var PRIVATE = {
    shoppingLists: 'shoppingLists',
    notes: 'notes',
    progression: 'progression',
    preferences: 'preferences'
  };

  function now(){ return Date.now(); }
  function safeParse(raw, fallback){
    try { return raw ? JSON.parse(raw) : fallback; } catch(e){ return fallback; }
  }
  function currentUser(){
    try {
      if(window.fbUser) return window.fbUser;
      if(window.firebase && firebase.auth && firebase.auth().currentUser) return firebase.auth().currentUser;
    } catch(e){}
    return null;
  }
  function uid(){ var u=currentUser(); return u && u.uid ? u.uid : null; }
  function familyId(){
    if(window.fbFamilyId) return window.fbFamilyId;
    try {
      var meta = window.HouseholdRepository && window.HouseholdRepository.getMeta ? window.HouseholdRepository.getMeta() : null;
      if(meta && meta.householdId && meta.householdId !== 'household-local') return meta.householdId;
    } catch(e){}
    return null;
  }
  function db(){
    try {
      if(window.fbDb) return window.fbDb;
      if(window.firebase && firebase.database) return firebase.database();
    } catch(e){}
    return null;
  }
  function onlineReady(){ return !!(db() && uid() && familyId() && !window.offlineMode); }

  function cacheKey(scope, collection){
    var owner = scope === 'shared' ? (familyId() || 'local-household') : (uid() || 'local-user');
    return CACHE_PREFIX + scope + '_' + owner + '_' + collection;
  }
  function readCache(scope, collection, fallback){
    try { return safeParse(localStorage.getItem(cacheKey(scope, collection)), fallback); }
    catch(e){ return fallback; }
  }
  function writeCache(scope, collection, value){
    try { localStorage.setItem(cacheKey(scope, collection), JSON.stringify(value)); } catch(e){}
    return value;
  }
  function emit(scope, collection, value, source){
    var key = scope + ':' + collection;
    var payload = { scope:scope, collection:collection, value:value, source:source || 'local', at:now() };
    (listeners[key] || []).slice().forEach(function(fn){ try{ fn(payload); }catch(e){} });
    try { window.dispatchEvent(new CustomEvent('familyapp:data:' + key, { detail:payload })); } catch(e){}
  }
  function on(scope, collection, callback){
    var key=scope+':'+collection;
    if(!listeners[key]) listeners[key]=[];
    listeners[key].push(callback);
    return function(){ listeners[key]=(listeners[key]||[]).filter(function(fn){return fn!==callback;}); };
  }

  function sharedRef(collection){
    var database=db(), fid=familyId();
    return database && fid ? database.ref('families/'+fid+'/shared/'+collection) : null;
  }
  function privateRef(collection){
    var database=db(), userId=uid();
    return database && userId ? database.ref('users/'+userId+'/private/'+collection) : null;
  }

  function read(scope, collection, fallback){
    var cached=readCache(scope,collection,fallback);
    var ref=scope==='shared'?sharedRef(collection):privateRef(collection);
    if(!ref || !onlineReady()) return Promise.resolve(cached);
    return ref.once('value').then(function(snap){
      var value=snap.val();
      if(value===null || value===undefined) return cached;
      writeCache(scope,collection,value);
      emit(scope,collection,value,'firebase');
      return value;
    }).catch(function(err){
      console.warn('[FamilyDataStore] read fallback',scope,collection,err && err.code);
      return cached;
    });
  }

  function write(scope, collection, value, options){
    options=options||{};
    writeCache(scope,collection,value);
    emit(scope,collection,value,'local');
    var ref=scope==='shared'?sharedRef(collection):privateRef(collection);
    if(!ref || !onlineReady() || options.localOnly) return Promise.resolve({mode:'local',value:value});
    return ref.set(value).then(function(){
      emit(scope,collection,value,'firebase-write');
      return {mode:'firebase',value:value};
    }).catch(function(err){
      console.warn('[FamilyDataStore] write queued locally',scope,collection,err && err.code);
      markPending(scope,collection,value);
      return {mode:'local-pending',value:value,error:err};
    });
  }

  function pendingKey(){ return CACHE_PREFIX+'pending_writes'; }
  function pendingWrites(){
    try { return safeParse(localStorage.getItem(pendingKey()),[]); } catch(e){ return []; }
  }
  function markPending(scope,collection,value){
    var list=pendingWrites().filter(function(x){return !(x.scope===scope&&x.collection===collection);});
    list.push({scope:scope,collection:collection,value:value,at:now()});
    try { localStorage.setItem(pendingKey(),JSON.stringify(list)); } catch(e){}
  }
  function flushPending(){
    if(!onlineReady()) return Promise.resolve({flushed:0,remaining:pendingWrites().length});
    var list=pendingWrites(), flushed=0;
    var chain=Promise.resolve();
    var remaining=[];
    list.forEach(function(item){
      chain=chain.then(function(){
        var ref=item.scope==='shared'?sharedRef(item.collection):privateRef(item.collection);
        if(!ref){remaining.push(item);return;}
        return ref.set(item.value).then(function(){flushed++;}).catch(function(){remaining.push(item);});
      });
    });
    return chain.then(function(){
      try { localStorage.setItem(pendingKey(),JSON.stringify(remaining)); } catch(e){}
      return {flushed:flushed,remaining:remaining.length};
    });
  }

  function subscribe(scope, collection, callback, fallback){
    var key=scope+':'+collection;
    if(subscriptions[key]) subscriptions[key]();
    var offLocal=on(scope,collection,function(payload){ callback(payload.value,payload); });
    var ref=scope==='shared'?sharedRef(collection):privateRef(collection);
    if(!ref || !onlineReady()){
      Promise.resolve().then(function(){ callback(readCache(scope,collection,fallback),{scope:scope,collection:collection,source:'cache'}); });
      subscriptions[key]=offLocal;
      return offLocal;
    }
    var handler=function(snap){
      var value=snap.val();
      if(value===null || value===undefined) value=fallback;
      writeCache(scope,collection,value);
      callback(value,{scope:scope,collection:collection,source:'firebase',at:now()});
    };
    ref.on('value',handler,function(err){ console.warn('[FamilyDataStore] subscribe',scope,collection,err && err.code); });
    var off=function(){ offLocal(); try{ref.off('value',handler);}catch(e){} delete subscriptions[key]; };
    subscriptions[key]=off;
    return off;
  }

  function makeId(prefix){
    return (prefix||'item')+'_'+now().toString(36)+'_'+Math.random().toString(36).slice(2,8);
  }
  function defaultShoppingList(items){
    var user=currentUser();
    return {
      id:'household_default',
      name:'Gezinslijst',
      icon:'shopping-cart',
      category:'groceries',
      visibility:'household',
      ownerUid:uid(),
      createdBy:uid(),
      createdAt:now(),
      updatedAt:now(),
      items:Array.isArray(items)?items:[]
    };
  }

  // One-time, non-destructive migration helper. It only creates the new
  // shared list when the target collection is empty. Existing shopData remains
  // untouched until the Winkelen UI is switched to the new model.
  function migrateLegacyShopping(){
    var legacy=Array.isArray(window.shopData)?window.shopData.slice():[];
    return read('shared',SHARED.shoppingLists,{}).then(function(existing){
      if(existing && Object.keys(existing).length) return {migrated:false,reason:'already-exists'};
      if(!legacy.length) return {migrated:false,reason:'no-legacy-items'};
      var list=defaultShoppingList(legacy);
      var payload={}; payload[list.id]=list;
      return write('shared',SHARED.shoppingLists,payload).then(function(result){
        try { localStorage.setItem('familyapp_migration_shopping_lists_v1','done'); } catch(e){}
        return {migrated:true,list:list,result:result};
      });
    });
  }

  function status(){
    return {
      version:VERSION,
      onlineReady:onlineReady(),
      userId:uid(),
      familyId:familyId(),
      pendingWrites:pendingWrites().length,
      sharedCollections:Object.keys(SHARED),
      privateCollections:Object.keys(PRIVATE)
    };
  }

  window.FamilyDataStore={
    version:VERSION,
    sharedCollections:SHARED,
    privateCollections:PRIVATE,
    status:status,
    makeId:makeId,
    readShared:function(collection,fallback){return read('shared',collection,fallback);},
    writeShared:function(collection,value,options){return write('shared',collection,value,options);},
    subscribeShared:function(collection,callback,fallback){return subscribe('shared',collection,callback,fallback);},
    readPrivate:function(collection,fallback){return read('private',collection,fallback);},
    writePrivate:function(collection,value,options){return write('private',collection,value,options);},
    subscribePrivate:function(collection,callback,fallback){return subscribe('private',collection,callback,fallback);},
    flushPending:flushPending,
    migrateLegacyShopping:migrateLegacyShopping,
    defaultShoppingList:defaultShoppingList
  };

  window.addEventListener('online',function(){ setTimeout(flushPending,250); });
  window.addEventListener('familyapp:household-members-updated',function(){ setTimeout(flushPending,250); });
})();
