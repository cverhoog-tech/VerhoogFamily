'use strict';
// ============================================================
// FAMILY DATA STORE v1.1
// Shared/private/offline persistence boundary with record-level mutations.
// ============================================================
(function(){
  if(window.FamilyDataStore && window.FamilyDataStore.version === '1.1.0') return;

  var VERSION = '1.1.0';
  var CACHE_PREFIX = 'familyapp_data_v1_';
  var listeners = {};
  var subscriptions = {};

  var SHARED = { shoppingLists:'shoppingLists', recipes:'recipes', notes:'notes', notifications:'notifications' };
  var PRIVATE = { shoppingLists:'shoppingLists', notes:'notes', progression:'progression', preferences:'preferences' };

  function now(){ return Date.now(); }
  function safeParse(raw,fallback){ try{return raw?JSON.parse(raw):fallback;}catch(e){return fallback;} }
  function currentUser(){
    try{
      if(window.fbUser) return window.fbUser;
      if(window.firebase&&firebase.auth&&firebase.auth().currentUser) return firebase.auth().currentUser;
    }catch(e){}
    return null;
  }
  function uid(){ var u=currentUser(); return u&&u.uid?u.uid:null; }
  function familyId(){
    if(window.fbFamilyId) return window.fbFamilyId;
    try{
      var meta=window.HouseholdRepository&&window.HouseholdRepository.getMeta?window.HouseholdRepository.getMeta():null;
      if(meta&&meta.householdId&&meta.householdId!=='household-local') return meta.householdId;
    }catch(e){}
    return null;
  }
  function db(){
    try{
      if(window.fbDb) return window.fbDb;
      if(window.firebase&&firebase.database) return firebase.database();
    }catch(e){}
    return null;
  }
  function onlineReady(){ return !!(db()&&uid()&&familyId()&&!window.offlineMode); }

  function cacheKey(scope,collection){
    var owner=scope==='shared'?(familyId()||'local-household'):(uid()||'local-user');
    return CACHE_PREFIX+scope+'_'+owner+'_'+collection;
  }
  function readCache(scope,collection,fallback){
    try{return safeParse(localStorage.getItem(cacheKey(scope,collection)),fallback);}catch(e){return fallback;}
  }
  function writeCache(scope,collection,value){
    try{localStorage.setItem(cacheKey(scope,collection),JSON.stringify(value));}catch(e){}
    return value;
  }
  function emit(scope,collection,value,source){
    var key=scope+':'+collection;
    var payload={scope:scope,collection:collection,value:value,source:source||'local',at:now()};
    (listeners[key]||[]).slice().forEach(function(fn){try{fn(payload);}catch(e){}});
    try{window.dispatchEvent(new CustomEvent('familyapp:data:'+key,{detail:payload}));}catch(e){}
  }
  function on(scope,collection,callback){
    var key=scope+':'+collection;
    if(!listeners[key])listeners[key]=[];
    listeners[key].push(callback);
    return function(){listeners[key]=(listeners[key]||[]).filter(function(fn){return fn!==callback;});};
  }
  function rootRef(scope,collection){
    var database=db();
    if(!database)return null;
    if(scope==='shared'){
      var fid=familyId();
      return fid?database.ref('families/'+fid+'/shared/'+collection):null;
    }
    var userId=uid();
    return userId?database.ref('users/'+userId+'/private/'+collection):null;
  }

  function read(scope,collection,fallback){
    var cached=readCache(scope,collection,fallback);
    var ref=rootRef(scope,collection);
    if(!ref||!onlineReady())return Promise.resolve(cached);
    return ref.once('value').then(function(snap){
      var value=snap.val();
      if(value===null||value===undefined)return cached;
      writeCache(scope,collection,value);emit(scope,collection,value,'firebase');return value;
    }).catch(function(err){console.warn('[FamilyDataStore] read fallback',scope,collection,err&&err.code);return cached;});
  }

  function pendingKey(){return CACHE_PREFIX+'pending_writes';}
  function pendingWrites(){try{return safeParse(localStorage.getItem(pendingKey()),[]);}catch(e){return[];}}
  function pendingIdentity(item){return [item.scope,item.collection,item.recordId||'*'].join(':');}
  function markPending(scope,collection,value,recordId){
    var identity=[scope,collection,recordId||'*'].join(':');
    var list=pendingWrites().filter(function(x){return pendingIdentity(x)!==identity;});
    list.push({scope:scope,collection:collection,recordId:recordId||null,value:value,at:now()});
    try{localStorage.setItem(pendingKey(),JSON.stringify(list));}catch(e){}
  }

  function write(scope,collection,value,options){
    options=options||{};
    writeCache(scope,collection,value);emit(scope,collection,value,'local');
    var ref=rootRef(scope,collection);
    if(!ref||!onlineReady()||options.localOnly)return Promise.resolve({mode:'local',value:value});
    return ref.set(value).then(function(){emit(scope,collection,value,'firebase-write');return{mode:'firebase',value:value};})
      .catch(function(err){markPending(scope,collection,value,null);return{mode:'local-pending',value:value,error:err};});
  }

  function writeRecord(scope,collection,recordId,value,options){
    options=options||{};
    var current=readCache(scope,collection,{})||{};
    if(Array.isArray(current))current={};
    var next=Object.assign({},current);
    if(value===null||value===undefined)delete next[recordId]; else next[recordId]=value;
    writeCache(scope,collection,next);emit(scope,collection,next,'local-record');
    var root=rootRef(scope,collection), ref=root&&root.child(recordId);
    if(!ref||!onlineReady()||options.localOnly)return Promise.resolve({mode:'local',value:value});
    return ref.set(value===undefined?null:value).then(function(){return{mode:'firebase',value:value};})
      .catch(function(err){markPending(scope,collection,value,recordId);return{mode:'local-pending',value:value,error:err};});
  }

  function mutateRecord(scope,collection,recordId,updater,fallback){
    var currentCollection=readCache(scope,collection,{})||{};
    var localCurrent=currentCollection[recordId]!==undefined?currentCollection[recordId]:fallback;
    var localNext=updater(localCurrent?JSON.parse(JSON.stringify(localCurrent)):localCurrent);
    writeRecord(scope,collection,recordId,localNext,{localOnly:true});

    var root=rootRef(scope,collection), ref=root&&root.child(recordId);
    if(!ref||!onlineReady()){
      markPending(scope,collection,localNext,recordId);
      return Promise.resolve({mode:'local-pending',value:localNext});
    }
    return new Promise(function(resolve){
      ref.transaction(function(serverCurrent){
        var base=serverCurrent===null||serverCurrent===undefined?fallback:serverCurrent;
        return updater(base?JSON.parse(JSON.stringify(base)):base);
      },function(error,committed,snap){
        if(error||!committed){markPending(scope,collection,localNext,recordId);resolve({mode:'local-pending',value:localNext,error:error});return;}
        var value=snap.val();
        var latest=readCache(scope,collection,{})||{}; latest[recordId]=value;
        writeCache(scope,collection,latest);emit(scope,collection,latest,'firebase-transaction');
        resolve({mode:'firebase',value:value});
      },false);
    });
  }

  function flushPending(){
    if(!onlineReady())return Promise.resolve({flushed:0,remaining:pendingWrites().length});
    var list=pendingWrites(),remaining=[],flushed=0,chain=Promise.resolve();
    list.forEach(function(item){
      chain=chain.then(function(){
        var root=rootRef(item.scope,item.collection),ref=root&&(item.recordId?root.child(item.recordId):root);
        if(!ref){remaining.push(item);return;}
        return ref.set(item.value===undefined?null:item.value).then(function(){flushed++;}).catch(function(){remaining.push(item);});
      });
    });
    return chain.then(function(){try{localStorage.setItem(pendingKey(),JSON.stringify(remaining));}catch(e){}return{flushed:flushed,remaining:remaining.length};});
  }

  function subscribe(scope,collection,callback,fallback){
    var key=scope+':'+collection;
    if(subscriptions[key])subscriptions[key]();
    var offLocal=on(scope,collection,function(payload){callback(payload.value,payload);});
    var ref=rootRef(scope,collection);
    if(!ref||!onlineReady()){
      Promise.resolve().then(function(){callback(readCache(scope,collection,fallback),{scope:scope,collection:collection,source:'cache'});});
      subscriptions[key]=offLocal;return offLocal;
    }
    var handler=function(snap){
      var value=snap.val(); if(value===null||value===undefined)value=fallback;
      writeCache(scope,collection,value);callback(value,{scope:scope,collection:collection,source:'firebase',at:now()});
    };
    ref.on('value',handler,function(err){console.warn('[FamilyDataStore] subscribe',scope,collection,err&&err.code);});
    var off=function(){offLocal();try{ref.off('value',handler);}catch(e){}delete subscriptions[key];};
    subscriptions[key]=off;return off;
  }

  function makeId(prefix){return(prefix||'item')+'_'+now().toString(36)+'_'+Math.random().toString(36).slice(2,8);}
  function defaultShoppingList(items){
    return{id:'household_default',name:'Gezinslijst',icon:'🛒',category:'groceries',visibility:'household',ownerUid:uid(),createdBy:uid(),createdAt:now(),updatedAt:now(),items:Array.isArray(items)?items:[]};
  }
  function migrateLegacyShopping(){
    var legacy=Array.isArray(window.shopData)?window.shopData.slice():[];
    return read('shared',SHARED.shoppingLists,{}).then(function(existing){
      if(existing&&Object.keys(existing).length)return{migrated:false,reason:'already-exists'};
      if(!legacy.length)return{migrated:false,reason:'no-legacy-items'};
      var list=defaultShoppingList(legacy);
      return writeRecord('shared',SHARED.shoppingLists,list.id,list).then(function(result){
        try{localStorage.setItem('familyapp_migration_shopping_lists_v1','done');}catch(e){}
        return{migrated:true,list:list,result:result};
      });
    });
  }
  function status(){return{version:VERSION,onlineReady:onlineReady(),userId:uid(),familyId:familyId(),pendingWrites:pendingWrites().length,sharedCollections:Object.keys(SHARED),privateCollections:Object.keys(PRIVATE)};}

  window.FamilyDataStore={
    version:VERSION,sharedCollections:SHARED,privateCollections:PRIVATE,status:status,makeId:makeId,
    readShared:function(c,f){return read('shared',c,f);},writeShared:function(c,v,o){return write('shared',c,v,o);},subscribeShared:function(c,cb,f){return subscribe('shared',c,cb,f);},
    readPrivate:function(c,f){return read('private',c,f);},writePrivate:function(c,v,o){return write('private',c,v,o);},subscribePrivate:function(c,cb,f){return subscribe('private',c,cb,f);},
    writeSharedRecord:function(c,id,v,o){return writeRecord('shared',c,id,v,o);},writePrivateRecord:function(c,id,v,o){return writeRecord('private',c,id,v,o);},
    mutateSharedRecord:function(c,id,u,f){return mutateRecord('shared',c,id,u,f);},mutatePrivateRecord:function(c,id,u,f){return mutateRecord('private',c,id,u,f);},
    flushPending:flushPending,migrateLegacyShopping:migrateLegacyShopping,defaultShoppingList:defaultShoppingList
  };

  window.addEventListener('online',function(){setTimeout(flushPending,250);});
  window.addEventListener('familyapp:household-members-updated',function(){setTimeout(flushPending,250);});
})();
