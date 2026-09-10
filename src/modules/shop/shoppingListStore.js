'use strict';
// ============================================================
// SHOPPING LIST HOUSEHOLD REPOSITORY v1.0.0
// STEP 7 canonical shopping persistence boundary.
//
// Shared:  families/{householdId}/shoppingLists/{listId}
// Private: users/{uid}/private/households/{householdId}/shoppingLists/{listId}
// Identity authority: HouseholdContext (UID + household + revision).
// Local cache is UID + household scoped presentation fallback only.
// Generic local/AppState shopping data is NEVER migration authority.
// ============================================================
(function(){
  if(window.ShoppingListHouseholdRepository)return;

  var VERSION='1.0.0';
  var SCHEMA_VERSION=2;
  var CACHE_PREFIX='familyapp_shopping_lists_v2_';
  var subscribers=[];
  var contextUnsubscribe=null;
  var attachTimer=null;
  var active=null;
  var bindGeneration=0;
  var projection={shared:{},private:{}};
  var lastMeta={source:'idle',ready:false,error:null,migration:'none'};

  function now(){return Date.now();}
  function clone(v){if(v===undefined)return undefined;try{return JSON.parse(JSON.stringify(v));}catch(e){return v;}}
  function db(){try{return window.fbDb||(window.firebase&&window.firebase.database&&window.firebase.database())||null;}catch(e){return null;}}
  function context(){try{return window.HouseholdContext&&HouseholdContext.snapshot?HouseholdContext.snapshot():null;}catch(e){return null;}}
  function capture(){try{return window.HouseholdContext&&HouseholdContext.capture?HouseholdContext.capture():null;}catch(e){return null;}}
  function isCurrent(token){try{return !!(window.HouseholdContext&&HouseholdContext.isCurrent&&HouseholdContext.isCurrent(token));}catch(e){return false;}}
  function validContext(ctx){return !!(ctx&&ctx.ready===true&&ctx.uid&&ctx.householdId);}
  function safeKey(v){return String(v==null?'':v).replace(/[.#$\[\]\/]/g,'_');}
  function makeId(prefix){return (prefix||'item')+'_'+now().toString(36)+'_'+Math.random().toString(36).slice(2,9);}
  function cacheKey(ctx){return CACHE_PREFIX+String(ctx.uid)+'_'+String(ctx.householdId);}
  function readCache(ctx){if(!validContext(ctx))return null;try{var raw=localStorage.getItem(cacheKey(ctx));var parsed=raw?JSON.parse(raw):null;return parsed&&typeof parsed==='object'?parsed:null;}catch(e){return null;}}
  function writeCache(ctx,value){if(!validContext(ctx))return;try{localStorage.setItem(cacheKey(ctx),JSON.stringify(value));}catch(e){}}
  function rawMap(value){if(!value)return{};if(Array.isArray(value)){var out={};value.forEach(function(row,index){if(!row)return;var key=safeKey(row.id||row._key||('row_'+index));out[key]=row;});return out;}return typeof value==='object'?value:{};}
  function itemMap(value){var src=rawMap(value),out={};Object.keys(src).forEach(function(key){if(src[key])out[key]=clone(src[key]);});return out;}
  function normalizeItem(raw,key,ctx){
    var out=clone(raw||{})||{};
    out._key=key||out._key||makeId('item');
    out.householdId=ctx.householdId;
    out.createdByUid=out.createdByUid||out.createdBy||ctx.uid;
    out.createdAt=Number(out.createdAt)||now();
    out.updatedByUid=out.updatedByUid||out.updatedBy||ctx.uid;
    out.updatedAt=Number(out.updatedAt)||out.createdAt;
    out.done=!!out.done;
    return out;
  }
  function normalizeList(raw,key,ctx,scope){
    var out=clone(raw||{})||{};
    var id=String(out.id||key||makeId('list'));
    out.id=id;
    out.householdId=ctx.householdId;
    out.visibility=scope==='private'?'private':'household';
    out.ownerUid=scope==='private'?ctx.uid:(out.ownerUid||ctx.uid);
    out.createdByUid=out.createdByUid||out.createdBy||out.ownerUid||ctx.uid;
    out.createdAt=Number(out.createdAt)||now();
    out.updatedByUid=out.updatedByUid||out.updatedBy||out.createdByUid||ctx.uid;
    out.updatedAt=Number(out.updatedAt)||out.createdAt;
    out.schemaVersion=SCHEMA_VERSION;
    var items=itemMap(out.items),nextItems={};
    Object.keys(items).forEach(function(itemKey){nextItems[itemKey]=normalizeItem(items[itemKey],itemKey,ctx);});
    out.items=nextItems;
    return out;
  }
  function normalizeMap(value,ctx,scope){var src=rawMap(value),out={};Object.keys(src).forEach(function(key){var row=src[key];if(row&&typeof row==='object')out[key]=normalizeList(row,key,ctx,scope);});return out;}
  function defaultListFromLegacyItems(value,ctx){
    var items=itemMap(value),normalized={};
    Object.keys(items).forEach(function(key){normalized[key]=normalizeItem(items[key],key,ctx);});
    if(!Object.keys(normalized).length)return null;
    return normalizeList({id:'household_default',name:'Gezinslijst',icon:'🛒',items:normalized,createdByUid:ctx.uid,createdAt:now()},'household_default',ctx,'shared');
  }
  function emit(next,meta){
    projection={shared:clone(next&&next.shared||{}),private:clone(next&&next.private||{})};
    lastMeta=Object.assign({source:'unknown',ready:!!active,error:null,migration:'none'},meta||{});
    var ctx=context();if(validContext(ctx))writeCache(ctx,projection);
    subscribers.slice().forEach(function(fn){try{fn(clone(projection),clone(lastMeta));}catch(e){console.warn('[ShoppingListHouseholdRepository] subscriber failed',e);}});
    try{window.dispatchEvent(new CustomEvent('familyapp:shopping-repository',{detail:{projection:clone(projection),meta:clone(lastMeta)}}));}catch(e){}
  }
  function subscribe(fn){if(typeof fn!=='function')return function(){};subscribers.push(fn);try{fn(clone(projection),clone(lastMeta));}catch(e){}return function(){var i=subscribers.indexOf(fn);if(i>=0)subscribers.splice(i,1);};}
  function bindingCurrent(binding){return !!(binding&&active===binding&&binding.generation===bindGeneration&&isCurrent(binding.token));}
  function unbind(reason,clear){
    if(active){
      if(active.sharedRef&&active.sharedHandler)try{active.sharedRef.off('value',active.sharedHandler);}catch(e){}
      if(active.privateRef&&active.privateHandler)try{active.privateRef.off('value',active.privateHandler);}catch(e){}
    }
    active=null;bindGeneration++;
    if(clear!==false)emit({shared:{},private:{}},{source:reason||'unbound',ready:false,uid:null,householdId:null,migration:'none'});
  }
  function publish(binding,source){
    if(!bindingCurrent(binding))return;
    emit({shared:normalizeMap(binding.sharedValue,binding.context,'shared'),private:normalizeMap(binding.privateValue,binding.context,'private')},{source:source||'firebase',ready:true,uid:binding.context.uid,householdId:binding.context.householdId,revision:binding.context.revision,migration:binding.migrationState||'none'});
  }
  function reconcileShared(currentValue,legacyListsValue,legacyShopValue,ctx){
    var result=normalizeMap(currentValue,ctx,'shared');
    var legacyLists=normalizeMap(legacyListsValue,ctx,'shared');
    Object.keys(legacyLists).forEach(function(key){if(!result[key]){var row=legacyLists[key];row.migratedFrom='shared/shoppingLists';row.migratedAt=now();row.updatedByUid=ctx.uid;result[key]=row;}});
    if(!Object.keys(result).length){var fallback=defaultListFromLegacyItems(legacyShopValue,ctx);if(fallback){fallback.migratedFrom='shop';fallback.migratedAt=now();result[fallback.id]=fallback;}}
    return result;
  }
  function ensureMigration(binding,canonicalValue){
    if(!bindingCurrent(binding)||binding.migrationChecked||binding.migrationInFlight)return;
    binding.migrationInFlight=true;binding.migrationState='checking-migration-marker';
    var markerRef=binding.database.ref('families/'+binding.context.householdId+'/shoppingMigrations/v2SharedToCanonical');
    var legacyListsRef=binding.database.ref('families/'+binding.context.householdId+'/shared/shoppingLists');
    var legacyShopRef=binding.database.ref('families/'+binding.context.householdId+'/shop');
    markerRef.once('value').then(function(markerSnap){
      if(!bindingCurrent(binding))return null;
      var marker=markerSnap&&markerSnap.val?markerSnap.val():null;
      if(marker&&marker.status==='complete'){
        binding.migrationChecked=true;binding.migrationInFlight=false;binding.migrationState='complete';
        binding.sharedValue=canonicalValue;publish(binding,'firebase');return null;
      }
      binding.migrationState='reading-same-household-legacy';
      return Promise.all([legacyListsRef.once('value'),legacyShopRef.once('value')]).then(function(snaps){
        if(!bindingCurrent(binding))return null;
        var legacyLists=snaps[0]&&snaps[0].val?snaps[0].val():null;
        var legacyShop=snaps[1]&&snaps[1].val?snaps[1].val():null;
        binding.migrationState='reconciling';
        return new Promise(function(resolve,reject){
          binding.sharedRef.transaction(function(current){if(!bindingCurrent(binding))return;return reconcileShared(current,legacyLists,legacyShop,binding.context);},function(error,committed,snapshot){if(error){reject(error);return;}if(!bindingCurrent(binding)){resolve(null);return;}resolve(snapshot&&snapshot.val?snapshot.val():canonicalValue);},false);
        });
      });
    }).then(function(value){
      if(value===null||value===undefined||!bindingCurrent(binding)||binding.migrationChecked)return null;
      return markerRef.set({status:'complete',source:'shared/shoppingLists + shop',completedAt:now(),byUid:binding.context.uid}).then(function(){
        if(!bindingCurrent(binding))return;
        binding.migrationChecked=true;binding.migrationInFlight=false;binding.migrationState='complete';binding.sharedValue=value;publish(binding,'firebase-migrated');
      });
    }).catch(function(error){
      if(!bindingCurrent(binding))return;
      binding.migrationChecked=true;binding.migrationInFlight=false;binding.migrationState='migration-failed';binding.sharedValue=canonicalValue;publish(binding,'firebase-migration-fallback');
      console.warn('[ShoppingListHouseholdRepository] migration failed',error);
    });
  }
  function bind(ctx){
    unbind('context-rebind',false);
    if(!validContext(ctx)){emit({shared:{},private:{}},{source:'context-not-ready',ready:false,uid:ctx&&ctx.uid||null,householdId:ctx&&ctx.householdId||null,migration:'none'});return false;}
    var database=db();if(!database){var cached=readCache(ctx)||{shared:{},private:{}};emit(cached,{source:'cache-no-db',ready:false,uid:ctx.uid,householdId:ctx.householdId,revision:ctx.revision,error:'FIREBASE_DATABASE_UNAVAILABLE'});return false;}
    var token=capture();if(!token||!isCurrent(token))return false;
    var generation=++bindGeneration;
    var binding={generation:generation,token:token,context:{uid:ctx.uid,householdId:ctx.householdId,revision:ctx.revision},database:database,sharedRef:database.ref('families/'+ctx.householdId+'/shoppingLists'),privateRef:database.ref('users/'+ctx.uid+'/private/households/'+ctx.householdId+'/shoppingLists'),sharedHandler:null,privateHandler:null,sharedValue:null,privateValue:null,migrationChecked:false,migrationInFlight:false,migrationState:'none'};
    active=binding;
    var cached=readCache(ctx);if(cached)emit(cached,{source:'household-cache',ready:true,uid:ctx.uid,householdId:ctx.householdId,revision:ctx.revision,migration:'none'});else emit({shared:{},private:{}},{source:'binding',ready:true,uid:ctx.uid,householdId:ctx.householdId,revision:ctx.revision,migration:'none'});
    binding.sharedHandler=function(snapshot){if(!bindingCurrent(binding))return;var value=snapshot&&snapshot.val?snapshot.val():null;binding.sharedValue=value;if(!binding.migrationChecked){ensureMigration(binding,value);return;}publish(binding,'firebase-shared');};
    binding.privateHandler=function(snapshot){if(!bindingCurrent(binding))return;binding.privateValue=snapshot&&snapshot.val?snapshot.val():null;publish(binding,'firebase-private');};
    binding.sharedRef.on('value',binding.sharedHandler,function(error){if(bindingCurrent(binding))emit(projection,{source:'firebase-shared-error',ready:true,uid:ctx.uid,householdId:ctx.householdId,error:error&&error.message||String(error)});});
    binding.privateRef.on('value',binding.privateHandler,function(error){if(bindingCurrent(binding))emit(projection,{source:'firebase-private-error',ready:true,uid:ctx.uid,householdId:ctx.householdId,error:error&&error.message||String(error)});});
    return true;
  }
  function handleContext(ctx){if(!validContext(ctx)){unbind('context-not-ready');return;}if(active&&active.context.uid===ctx.uid&&active.context.householdId===ctx.householdId&&active.context.revision===ctx.revision)return;bind(ctx);}
  function attachContext(){
    if(contextUnsubscribe)return true;
    if(!window.HouseholdContext||typeof HouseholdContext.subscribe!=='function')return false;
    contextUnsubscribe=HouseholdContext.subscribe(function(ctx){handleContext(ctx);});return true;
  }
  function start(){if(attachContext())return true;if(attachTimer)return false;var tries=0;attachTimer=setInterval(function(){tries++;if(attachContext()||tries>300){clearInterval(attachTimer);attachTimer=null;}},50);return false;}
  function mutationBinding(){var binding=active;if(!bindingCurrent(binding))throw new Error('ACTIVE_HOUSEHOLD_REQUIRED');return binding;}
  function assertOnline(){if(typeof navigator!=='undefined'&&navigator.onLine===false){var e=new Error('Geen netwerkverbinding');e.confirmed=false;throw e;}}
  function mapForScope(scope){return scope==='private'?projection.private:projection.shared;}
  function get(scope,id){var row=mapForScope(scope)[String(id||'')];return row?clone(row):null;}
  function refForScope(binding,scope){return scope==='private'?binding.privateRef:binding.sharedRef;}
  function ackList(scope,list,source){var next=clone(projection),map=scope==='private'?next.private:next.shared;map[list.id]=clone(list);emit(next,{source:source||'mutation-ack',ready:true,uid:active&&active.context.uid,householdId:active&&active.context.householdId,migration:active&&active.migrationState||'none'});}
  function createList(input){
    input=input||{};var binding;try{binding=mutationBinding();assertOnline();}catch(e){return Promise.reject(e);}var token=capture(),scope=input.visibility==='private'?'private':'shared',id=safeKey(input.id||makeId('list'));
    var list=normalizeList({id:id,name:String(input.name||'Winkellijst').trim()||'Winkellijst',icon:input.icon||'🛒',visibility:scope==='private'?'private':'household',ownerUid:binding.context.uid,createdByUid:binding.context.uid,createdAt:now(),updatedAt:now(),items:{}},id,binding.context,scope);
    return refForScope(binding,scope).child(id).set(list).then(function(){if(!isCurrent(token))throw new Error('STALE_HOUSEHOLD_CONTEXT');ackList(scope,list,'create-ack');return clone(list);});
  }
  function addItems(scope,listId,records){
    var binding;try{binding=mutationBinding();assertOnline();}catch(e){return Promise.reject(e);}scope=scope==='private'?'private':'shared';listId=String(listId||'');var current=get(scope,listId);if(!current)return Promise.reject(new Error('Winkellijst niet gevonden'));var token=capture(),stamp=now(),patch={updatedAt:stamp,updatedByUid:binding.context.uid},added=[];
    (Array.isArray(records)?records:[]).forEach(function(raw){if(!raw)return;var key=safeKey(raw._key||makeId('item')),item=normalizeItem(Object.assign({},raw,{createdByUid:raw.createdByUid||binding.context.uid,createdAt:Number(raw.createdAt)||stamp,updatedByUid:binding.context.uid,updatedAt:stamp}),key,binding.context);patch['items/'+key]=item;added.push(item);});
    if(!added.length)return Promise.resolve([]);
    return refForScope(binding,scope).child(listId).update(patch).then(function(){if(!isCurrent(token))throw new Error('STALE_HOUSEHOLD_CONTEXT');var next=get(scope,listId)||current;next.items=next.items||{};added.forEach(function(item){next.items[item._key]=clone(item);});next.updatedAt=stamp;next.updatedByUid=binding.context.uid;ackList(scope,next,'add-items-ack');return clone(added);});
  }
  function setItem(scope,listId,itemKey,item){
    var binding;try{binding=mutationBinding();assertOnline();}catch(e){return Promise.reject(e);}scope=scope==='private'?'private':'shared';listId=String(listId||'');itemKey=String(itemKey||'');var current=get(scope,listId);if(!current||!current.items||!current.items[itemKey])return Promise.reject(new Error('Item niet gevonden'));var token=capture(),stamp=now(),nextItem=normalizeItem(Object.assign({},current.items[itemKey],item||{},{_key:itemKey,updatedByUid:binding.context.uid,updatedAt:stamp}),itemKey,binding.context),patch={updatedAt:stamp,updatedByUid:binding.context.uid};patch['items/'+itemKey]=nextItem;
    return refForScope(binding,scope).child(listId).update(patch).then(function(){if(!isCurrent(token))throw new Error('STALE_HOUSEHOLD_CONTEXT');var next=get(scope,listId)||current;next.items=next.items||{};next.items[itemKey]=clone(nextItem);next.updatedAt=stamp;next.updatedByUid=binding.context.uid;ackList(scope,next,'set-item-ack');return clone(nextItem);});
  }
  function deleteItem(scope,listId,itemKey){
    var binding;try{binding=mutationBinding();assertOnline();}catch(e){return Promise.reject(e);}scope=scope==='private'?'private':'shared';listId=String(listId||'');itemKey=String(itemKey||'');var current=get(scope,listId);if(!current||!current.items||!current.items[itemKey])return Promise.reject(new Error('Item niet gevonden'));var token=capture(),stamp=now(),patch={updatedAt:stamp,updatedByUid:binding.context.uid};patch['items/'+itemKey]=null;
    return refForScope(binding,scope).child(listId).update(patch).then(function(){if(!isCurrent(token))throw new Error('STALE_HOUSEHOLD_CONTEXT');var next=get(scope,listId)||current;next.items=next.items||{};delete next.items[itemKey];next.updatedAt=stamp;next.updatedByUid=binding.context.uid;ackList(scope,next,'delete-item-ack');return true;});
  }
  function clearDone(scope,listId,itemKeys){
    var binding;try{binding=mutationBinding();assertOnline();}catch(e){return Promise.reject(e);}scope=scope==='private'?'private':'shared';listId=String(listId||'');var current=get(scope,listId);if(!current)return Promise.reject(new Error('Winkellijst niet gevonden'));var keys=(itemKeys||[]).map(String);if(!keys.length)return Promise.resolve(true);var token=capture(),stamp=now(),patch={updatedAt:stamp,updatedByUid:binding.context.uid};keys.forEach(function(key){patch['items/'+key]=null;});
    return refForScope(binding,scope).child(listId).update(patch).then(function(){if(!isCurrent(token))throw new Error('STALE_HOUSEHOLD_CONTEXT');var next=get(scope,listId)||current;next.items=next.items||{};keys.forEach(function(key){delete next.items[key];});next.updatedAt=stamp;next.updatedByUid=binding.context.uid;ackList(scope,next,'clear-done-ack');return true;});
  }
  function status(){var ctx=context();return{version:VERSION,schemaVersion:SCHEMA_VERSION,ready:!!(active&&validContext(ctx)),uid:ctx&&ctx.uid||null,householdId:ctx&&ctx.householdId||null,sharedPath:ctx&&ctx.householdId?'families/'+ctx.householdId+'/shoppingLists':null,privatePath:ctx&&ctx.uid&&ctx.householdId?'users/'+ctx.uid+'/private/households/'+ctx.householdId+'/shoppingLists':null,sharedCount:Object.keys(projection.shared||{}).length,privateCount:Object.keys(projection.private||{}).length,migration:lastMeta.migration||'none'};}
  function stop(){if(contextUnsubscribe){try{contextUnsubscribe();}catch(e){}contextUnsubscribe=null;}if(attachTimer){clearInterval(attachTimer);attachTimer=null;}unbind('stopped');}

  window.ShoppingListHouseholdRepository={version:VERSION,start:start,stop:stop,subscribe:subscribe,snapshot:function(){return clone(projection);},get:get,createList:createList,addItems:addItems,setItem:setItem,deleteItem:deleteItem,clearDone:clearDone,status:status,_rebind:function(){handleContext(context());}};
  start();
})();
// ============================================================
// SHOPPING LIST STORE v2.0.0
// STEP 7 compatibility/business facade over ShoppingListHouseholdRepository.
// Owns active-list selection, projections and recipe/meal ingredient mapping.
// It owns NO Firebase listener and performs NO direct persistence.
// ============================================================
(function(){
  if(window.ShoppingListStore&&window.ShoppingListStore.version==='2.0.0')return;

  var VERSION='2.0.0';
  var repoUnsubscribe=null;
  var shared={},priv={};
  var activeKey=null;
  var changeListeners=[];
  var lastMeta={source:'idle',ready:false};

  function clone(v){if(v===undefined)return undefined;try{return JSON.parse(JSON.stringify(v));}catch(e){return v;}}
  function repo(){return window.ShoppingListHouseholdRepository||null;}
  function context(){try{return window.HouseholdContext&&HouseholdContext.snapshot?HouseholdContext.snapshot():null;}catch(e){return null;}}
  function prefKey(){var c=context();return c&&c.uid&&c.householdId?'familyapp_active_shopping_list_v2_'+c.uid+'_'+c.householdId:null;}
  function loadPreference(){var key=prefKey();if(!key)return null;try{return localStorage.getItem(key)||null;}catch(e){return null;}}
  function savePreference(value){var key=prefKey();if(!key)return;try{if(value)localStorage.setItem(key,value);else localStorage.removeItem(key);}catch(e){}}
  function canonicalName(v){return String(v||'').trim().toLowerCase();}
  function itemArray(value){var out=[];Object.keys(value&&typeof value==='object'?value:{}).forEach(function(key){var item=value[key];if(item)out.push(Object.assign({},item,{_key:item._key||key}));});return out.sort(function(a,b){return Number(b.createdAt||0)-Number(a.createdAt||0);});}
  function rows(){var out=[];Object.keys(shared||{}).forEach(function(id){if(shared[id])out.push({scope:'shared',key:'shared:'+id,list:clone(shared[id])});});Object.keys(priv||{}).forEach(function(id){if(priv[id])out.push({scope:'private',key:'private:'+id,list:clone(priv[id])});});return out.sort(function(a,b){return Number(b.list.updatedAt||0)-Number(a.list.updatedAt||0);});}
  function findRow(key){return rows().find(function(row){return row.key===key;})||null;}
  function active(){var all=rows(),found=all.find(function(row){return row.key===activeKey;})||all.find(function(row){return row.scope==='shared';})||all[0]||null;if(found&&found.key!==activeKey){activeKey=found.key;savePreference(activeKey);}return found;}
  function projection(){var row=active();if(!row)return{key:null,name:null,scope:null,openItems:[],doneItems:[],openCount:0,doneCount:0};var items=itemArray(row.list.items),open=items.filter(function(i){return !i.done;}),done=items.filter(function(i){return i.done;});return{key:row.key,name:row.list.name,scope:row.scope,icon:row.list.icon,openItems:open,doneItems:done,openCount:open.length,doneCount:done.length};}
  function emitChange(){changeListeners.slice().forEach(function(fn){try{fn();}catch(e){console.warn('[ShoppingListStore] listener failed',e);}});try{window.dispatchEvent(new CustomEvent('familyapp:shopping:changed',{detail:{projection:projection(),meta:clone(lastMeta)}}));}catch(e){}}
  function publish(next,meta){shared=clone(next&&next.shared||{});priv=clone(next&&next.private||{});lastMeta=clone(meta||{})||{};var preferred=loadPreference();if(preferred&&findRow(preferred))activeKey=preferred;else if(activeKey&&!findRow(activeKey))activeKey=null;active();emitChange();}
  function boot(){var r=repo();if(!r)return false;if(typeof r.start==='function')r.start();if(!repoUnsubscribe&&typeof r.subscribe==='function')repoUnsubscribe=r.subscribe(publish);return true;}
  function requireRepo(method){var r=repo();if(!r||typeof r[method]!=='function')throw new Error('Boodschappenopslag is niet beschikbaar');return r;}
  function setActiveList(key){if(!findRow(key))return false;activeKey=key;savePreference(key);emitChange();return true;}
  function createList(options){options=options||{};var r;try{r=requireRepo('createList');}catch(e){return Promise.reject(e);}return r.createList(options).then(function(list){var scope=options.visibility==='private'?'private':'shared';activeKey=scope+':'+list.id;savePreference(activeKey);emitChange();return list;});}
  function normalizeItemInput(input){input=input||{};var name=String(input.name||'').trim();if(!name)return null;return{name:name,qty:String(input.qty||'1 st'),amount:input.amount!=null?input.amount:null,unit:input.unit||null,cat:input.cat||'Overig',who:input.who||(window.myName||'Gezin'),done:false,photo:input.photo==null?null:input.photo,source:input.source||null,sourceRecipeId:input.sourceRecipeId||null,sourceRecipeName:input.sourceRecipeName||null};}
  function addItems(listKey,items,options){
    options=options||{};var row=findRow(listKey||activeKey)||active();if(!row)return Promise.reject(new Error('Geen winkellijst beschikbaar'));var existing=row.list.items&&typeof row.list.items==='object'?row.list.items:{},existingNames={};Object.keys(existing).forEach(function(k){var x=existing[k];if(x&&!x.done)existingNames[canonicalName(x.name)]=true;});var addedInput=[],skipped=[];(Array.isArray(items)?items:[items]).forEach(function(input){var clean=normalizeItemInput(input);if(!clean)return;var n=canonicalName(clean.name);if(options.dedupe!==false&&existingNames[n]){skipped.push(clean);return;}existingNames[n]=true;addedInput.push(clean);});if(!addedInput.length)return Promise.resolve({listKey:row.key,added:[],skipped:skipped});var r;try{r=requireRepo('addItems');}catch(e){return Promise.reject(e);}return r.addItems(row.scope,row.list.id,addedInput).then(function(added){return{listKey:row.key,added:added||[],skipped:skipped};});
  }
  function addItem(item){return addItems(activeKey,[item],{dedupe:false}).then(function(result){if(!result.added.length)throw new Error('Item kon niet worden toegevoegd');return result.added[0];});}
  function ingredientText(ingredient){if(ingredient&&typeof ingredient==='object')return String(ingredient.rawText||ingredient.text||ingredient.name||'').trim();return String(ingredient||'').trim();}
  function classifyIngredient(text){var parser=window.GroceryInputParser,classifier=window.GroceryProductClassifier;var parsed=parser&&typeof parser.parse==='function'?parser.parse(text):{productName:text,amount:null,unit:null};var guess=classifier&&typeof classifier.classify==='function'?classifier.classify(parsed.productName):{category:'Overig',icon:null,qty:'1 st'};var unit=parsed.unit||(guess.qty?guess.qty.replace(/^[0-9.,]+\s*/,''):'st');var amount=parsed.amount!=null?parsed.amount:(guess.qty?parseFloat(guess.qty)||1:1);return{name:parsed.productName||text,amount:amount,unit:unit,qty:amount+' '+unit,cat:guess.category||'Overig',photo:guess.icon||null};}
  function appendRecipeIngredients(recipe,listKey){if(!recipe)return Promise.reject(new Error('Recept ontbreekt'));var items=(recipe.ingredients||[]).map(function(ingredient){var text=ingredientText(ingredient);if(!text)return null;return Object.assign(classifyIngredient(text),{source:'recipe',sourceRecipeId:recipe.id||null,sourceRecipeName:recipe.name||null});}).filter(Boolean);return addItems(listKey||activeKey,items,{dedupe:true});}
  function findItemKey(row,id){var items=row&&row.list&&row.list.items||{},candidate=String(id==null?'':id);if(candidate&&items[candidate])return candidate;var matches=Object.keys(items).filter(function(key){return items[key]&&String(items[key].id)===candidate;});return matches.length===1?matches[0]:null;}
  function toggleItem(id){var row=active();if(!row)return Promise.reject(new Error('Geen winkellijst actief'));var key=findItemKey(row,id);if(!key)return Promise.reject(new Error('Item niet gevonden'));var current=row.list.items[key],r;try{r=requireRepo('setItem');}catch(e){return Promise.reject(e);}return r.setItem(row.scope,row.list.id,key,Object.assign({},current,{done:!current.done}));}
  function deleteItem(id){var row=active();if(!row)return Promise.reject(new Error('Geen winkellijst actief'));var key=findItemKey(row,id);if(!key)return Promise.reject(new Error('Item niet gevonden'));var r;try{r=requireRepo('deleteItem');}catch(e){return Promise.reject(e);}return r.deleteItem(row.scope,row.list.id,key);}
  function clearDone(){var row=active();if(!row)return Promise.reject(new Error('Geen winkellijst actief'));var items=row.list.items||{},keys=Object.keys(items).filter(function(key){return items[key]&&items[key].done;});if(!keys.length)return Promise.resolve(true);var r;try{r=requireRepo('clearDone');}catch(e){return Promise.reject(e);}return r.clearDone(row.scope,row.list.id,keys);}
  function onChange(cb){if(typeof cb!=='function')return function(){};changeListeners.push(cb);return function(){changeListeners=changeListeners.filter(function(fn){return fn!==cb;});};}
  function rebind(){var r=repo();if(r&&typeof r._rebind==='function')r._rebind();return true;}
  function status(){var r=repo(),base=r&&typeof r.status==='function'?r.status():{};return Object.assign({version:VERSION,activeKey:activeKey,count:rows().length},base);}
  function stop(){if(repoUnsubscribe){try{repoUnsubscribe();}catch(e){}repoUnsubscribe=null;}shared={};priv={};activeKey=null;emitChange();}

  window.ShoppingListStore={version:VERSION,boot:boot,stop:stop,rebind:rebind,all:rows,active:active,projection:projection,setActiveList:setActiveList,createList:createList,addItem:addItem,addItems:addItems,appendRecipeIngredients:appendRecipeIngredients,toggleItem:toggleItem,deleteItem:deleteItem,clearDone:clearDone,onChange:onChange,status:status};
  if(!boot()){var tries=0,t=setInterval(function(){tries++;if(boot()||tries>240)clearInterval(t);},50);}
})();
