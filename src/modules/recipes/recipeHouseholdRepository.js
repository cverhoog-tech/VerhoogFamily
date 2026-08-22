'use strict';
// ============================================================
// RECIPE HOUSEHOLD REPOSITORY v1.0.0
// STEP 4 canonical recipe persistence boundary.
//
// Source of truth: families/{householdId}/recipes/{recipeKey}
// Identity authority: HouseholdContext (UID + household + revision)
// Local cache is UID + household scoped presentation fallback only.
// Generic legacy localStorage recipe keys are NEVER migration authority.
// ============================================================
(function(){
  if(window.RecipeHouseholdRepository)return;

  var VERSION='1.0.0';
  var SCHEMA_VERSION=3;
  var CACHE_PREFIX='familyapp_recipes_v3_';
  var subscribers=[];
  var contextUnsubscribe=null;
  var attachTimer=null;
  var active=null;
  var bindGeneration=0;
  var currentRecipes=[];
  var lastMeta={source:'idle',ready:false,error:null,migration:'none'};

  var IMMUTABLE={
    _key:true,
    id:true,
    householdId:true,
    createdByUid:true,
    createdAt:true,
    schemaVersion:true
  };

  function now(){return Date.now();}
  function clone(value){
    if(value===undefined)return undefined;
    try{return JSON.parse(JSON.stringify(value));}catch(e){return value;}
  }
  function safeKey(value){
    return 'id_'+String(value===undefined||value===null?'recipe_'+now():value).replace(/[.#$\[\]\/]/g,'_');
  }
  function makeId(){return 'recipe_'+now().toString(36)+'_'+Math.random().toString(36).slice(2,9);}
  function db(){
    try{
      if(window.fbDb)return window.fbDb;
      if(window.firebase&&window.firebase.database)return window.firebase.database();
    }catch(e){}
    return null;
  }
  function context(){
    try{return window.HouseholdContext&&typeof window.HouseholdContext.snapshot==='function'?window.HouseholdContext.snapshot():null;}catch(e){return null;}
  }
  function capture(){
    try{return window.HouseholdContext&&typeof window.HouseholdContext.capture==='function'?window.HouseholdContext.capture():null;}catch(e){return null;}
  }
  function isCurrent(token){
    try{return !!(window.HouseholdContext&&typeof window.HouseholdContext.isCurrent==='function'&&window.HouseholdContext.isCurrent(token));}catch(e){return false;}
  }
  function validContext(ctx){return !!(ctx&&ctx.ready===true&&ctx.uid&&ctx.householdId);}
  function cacheKey(userId,householdId){return CACHE_PREFIX+String(userId||'unresolved-user')+'_'+String(householdId||'unresolved-household');}
  function readCache(userId,householdId){
    if(!userId||!householdId)return [];
    try{
      var raw=localStorage.getItem(cacheKey(userId,householdId));
      var parsed=raw?JSON.parse(raw):[];
      return Array.isArray(parsed)?parsed:[];
    }catch(e){return [];}
  }
  function writeCache(userId,householdId,recipes){
    if(!userId||!householdId)return;
    try{localStorage.setItem(cacheKey(userId,householdId),JSON.stringify(Array.isArray(recipes)?recipes:[]));}catch(e){}
  }
  function rawRows(value){
    if(!value)return [];
    var source=value;
    // Legacy RecipeStore v2 wrote a wrapper at shared/recipes:
    // {schemaVersion:2, initialized:true, items:{...}}
    if(source&&source.items&&typeof source.items==='object'&&!Array.isArray(source.items))source=source.items;
    if(Array.isArray(source)){
      return source.map(function(row,index){
        if(!row)return null;
        return {key:(row&&row._key)||safeKey(row&&row.id!==undefined?row.id:index),value:row};
      }).filter(Boolean);
    }
    if(typeof source!=='object')return [];
    return Object.keys(source).map(function(key){
      if(key==='schemaVersion'||key==='initialized'||key==='migratedAt'||key==='migratedFrom'||key==='updatedAt'||key==='updatedBy')return null;
      var row=source[key];
      if(!row||typeof row!=='object'||Array.isArray(row))return null;
      return {key:key,value:row};
    }).filter(Boolean);
  }
  function recipeIdentity(entry){
    var row=entry&&entry.value||{};
    if(row.id!==undefined&&row.id!==null&&row.id!=='')return String(row.id);
    if(row._key)return String(row._key);
    return String(entry&&entry.key||'');
  }
  function normalizeExisting(recipe,key,ctx){
    var out=clone(recipe||{})||{};
    var id=out.id!==undefined&&out.id!==null&&out.id!==''?String(out.id):String(key||makeId()).replace(/^id_/, '');
    out.id=id;
    out._key=key||out._key||safeKey(id);
    out.householdId=ctx.householdId;
    out.createdByUid=out.createdByUid||out.createdBy||ctx.uid;
    out.createdAt=Number(out.createdAt)||now();
    out.updatedByUid=out.updatedByUid||out.updatedBy||out.createdByUid||ctx.uid;
    out.updatedAt=Number(out.updatedAt)||out.createdAt||now();
    out.schemaVersion=SCHEMA_VERSION;
    if(!Array.isArray(out.ingredients))out.ingredients=[];
    if(!Array.isArray(out.steps))out.steps=[];
    return out;
  }
  function normalizeCreate(recipe,key,ctx){
    var out=normalizeExisting(recipe,key,ctx);
    out.id=String(recipe&&recipe.id||out.id||makeId());
    out._key=key||safeKey(out.id);
    out.householdId=ctx.householdId;
    out.createdByUid=ctx.uid;
    out.createdAt=Number(recipe&&recipe.createdAt)||now();
    out.updatedByUid=ctx.uid;
    out.updatedAt=now();
    out.schemaVersion=SCHEMA_VERSION;
    return out;
  }
  function sealMutation(server,changed,key,ctx){
    var base=normalizeExisting(server||{},key,ctx);
    var next=clone(base)||{};
    var patch=changed&&typeof changed==='object'?changed:{};
    Object.keys(patch).forEach(function(prop){if(!IMMUTABLE[prop])next[prop]=clone(patch[prop]);});
    next._key=key;
    next.id=base.id;
    next.householdId=ctx.householdId;
    next.createdByUid=base.createdByUid||ctx.uid;
    next.createdAt=Number(base.createdAt)||now();
    next.updatedByUid=ctx.uid;
    next.updatedAt=now();
    next.schemaVersion=SCHEMA_VERSION;
    if(!Array.isArray(next.ingredients))next.ingredients=[];
    if(!Array.isArray(next.steps))next.steps=[];
    return next;
  }
  function listFromValue(value,ctx){
    return rawRows(value).map(function(entry){return normalizeExisting(entry.value,entry.key,ctx);}).sort(function(a,b){return Number(b.updatedAt||b.createdAt||0)-Number(a.updatedAt||a.createdAt||0);});
  }
  function emit(recipes,meta){
    currentRecipes=Array.isArray(recipes)?recipes.map(clone):[];
    lastMeta=Object.assign({source:'unknown',ready:!!active,error:null,migration:'none'},meta||{});
    if(lastMeta.uid&&lastMeta.householdId)writeCache(lastMeta.uid,lastMeta.householdId,currentRecipes);
    subscribers.slice().forEach(function(fn){try{fn(currentRecipes.map(clone),clone(lastMeta));}catch(e){console.warn('[RecipeHouseholdRepository] subscriber failed',e);}});
    try{window.dispatchEvent(new CustomEvent('familyapp:recipe-repository',{detail:{recipes:currentRecipes.map(clone),meta:clone(lastMeta)}}));}catch(e){}
  }
  function subscribe(fn){
    if(typeof fn!=='function')return function(){};
    subscribers.push(fn);
    try{fn(currentRecipes.map(clone),clone(lastMeta));}catch(e){}
    return function(){var i=subscribers.indexOf(fn);if(i>=0)subscribers.splice(i,1);};
  }
  function bindingCurrent(binding){return !!(binding&&active===binding&&binding.generation===bindGeneration&&isCurrent(binding.token));}
  function unbind(reason,clearProjection){
    if(active&&active.ref&&active.handler){try{active.ref.off('value',active.handler);}catch(e){}}
    active=null;
    bindGeneration++;
    if(clearProjection!==false)emit([],{source:reason||'unbound',ready:false,householdId:null,uid:null,migration:'none'});
  }
  function publishCanonical(binding,value,source,migration){
    if(!bindingCurrent(binding))return;
    emit(listFromValue(value,binding.context),{
      source:source||'firebase',
      ready:true,
      uid:binding.context.uid,
      householdId:binding.context.householdId,
      revision:binding.context.revision,
      migration:migration||binding.migrationState||'none'
    });
  }

  // Canonical v3 root records always win. For pre-v3 conflicts, the old
  // authoritative shared/recipes store wins over historical root copies.
  function reconcileLegacyMap(currentValue,legacySharedValue,ctx){
    var currentEntries=rawRows(currentValue);
    var sharedEntries=rawRows(legacySharedValue);
    var result={};
    var canonicalByIdentity={};
    var rootKeyByIdentity={};
    var takenByShared={};

    currentEntries.forEach(function(entry){
      var identity=recipeIdentity(entry);
      if(identity)rootKeyByIdentity[identity]=entry.key;
      if(Number(entry.value&&entry.value.schemaVersion||0)>=SCHEMA_VERSION){
        var canonical=normalizeExisting(entry.value,entry.key,ctx);
        result[entry.key]=canonical;
        if(identity)canonicalByIdentity[identity]=entry.key;
      }
    });

    sharedEntries.forEach(function(entry,index){
      var identity=recipeIdentity(entry)||String(index);
      if(canonicalByIdentity[identity])return;
      var key=rootKeyByIdentity[identity]||entry.key||safeKey(identity);
      if(result[key]&&recipeIdentity({key:key,value:result[key]})!==identity)key=safeKey(identity)+'_shared';
      var row=normalizeExisting(entry.value,key,ctx);
      row.migratedFrom='shared/recipes';
      row.migratedAt=now();
      row.updatedByUid=ctx.uid;
      result[key]=row;
      takenByShared[identity]=true;
    });

    currentEntries.forEach(function(entry,index){
      var identity=recipeIdentity(entry)||String(index);
      if(canonicalByIdentity[identity]||takenByShared[identity])return;
      var key=entry.key||safeKey(identity);
      if(result[key])key=safeKey(identity)+'_root';
      var row=normalizeExisting(entry.value,key,ctx);
      row.migratedFrom='recipes-root-legacy';
      row.migratedAt=now();
      row.updatedByUid=ctx.uid;
      result[key]=row;
    });
    return result;
  }

  function ensureLegacyReconciled(binding,canonicalValue){
    if(!bindingCurrent(binding)||binding.migrationChecked||binding.migrationInFlight)return;
    binding.migrationInFlight=true;
    binding.migrationState='checking-migration-marker';
    var markerRef=binding.db.ref('families/'+binding.context.householdId+'/recipeMigrations/v3SharedToCanonical');
    var legacyRef=binding.db.ref('families/'+binding.context.householdId+'/shared/recipes');

    markerRef.once('value').then(function(markerSnapshot){
      if(!bindingCurrent(binding))return null;
      var marker=markerSnapshot&&markerSnapshot.val?markerSnapshot.val():null;
      if(marker&&marker.status==='complete'){
        binding.migrationChecked=true;
        binding.migrationInFlight=false;
        binding.migrationState='complete';
        return binding.ref.once('value').then(function(latestSnapshot){
          if(!bindingCurrent(binding))return null;
          publishCanonical(binding,latestSnapshot&&latestSnapshot.val?latestSnapshot.val():null,'firebase','legacy-reconciled');
          return null;
        });
      }
      binding.migrationState='checking-legacy-shared';
      return legacyRef.once('value').then(function(legacySnapshot){
        if(!bindingCurrent(binding))return null;
        var legacyValue=legacySnapshot&&legacySnapshot.val?legacySnapshot.val():null;
        binding.migrationState='reconciling-legacy-recipes';
        return new Promise(function(resolve,reject){
          binding.ref.transaction(function(current){
            if(!bindingCurrent(binding))return;
            return reconcileLegacyMap(current,legacyValue,binding.context);
          },function(error,committed,snapshot){
            if(error){reject(error);return;}
            if(!bindingCurrent(binding)){resolve(null);return;}
            resolve({value:snapshot&&snapshot.val?snapshot.val():canonicalValue,source:committed?'same-household-reconciled':'canonical-unchanged'});
          },false);
        });
      });
    }).then(function(result){
      if(!result||!bindingCurrent(binding)||binding.migrationChecked)return null;
      binding.migrationState='writing-migration-marker';
      return markerRef.set({status:'complete',source:'shared/recipes + recipes-root-legacy',strategy:result.source,completedAt:now(),byUid:binding.context.uid}).then(function(){
        if(!bindingCurrent(binding))return null;
        binding.migrationChecked=true;
        binding.migrationInFlight=false;
        binding.migrationState='complete';
        return binding.ref.once('value').then(function(latestSnapshot){
          if(!bindingCurrent(binding))return;
          publishCanonical(binding,latestSnapshot&&latestSnapshot.val?latestSnapshot.val():null,'firebase','legacy-reconciled');
        });
      });
    }).catch(function(error){
      if(!bindingCurrent(binding))return;
      binding.migrationInFlight=false;
      binding.migrationChecked=true;
      binding.migrationState='legacy-reconcile-failed';
      publishCanonical(binding,canonicalValue,'firebase','legacy-reconcile-failed');
      console.warn('[RecipeHouseholdRepository] legacy recipe reconciliation failed',error);
    });
  }

  function bind(ctx,reason){
    unbind('context-rebind',false);
    if(!validContext(ctx)){
      emit([],{source:'context-not-ready',ready:false,uid:ctx&&ctx.uid||null,householdId:ctx&&ctx.householdId||null,migration:'none'});
      return false;
    }
    var database=db();
    if(!database){
      var cachedNoDb=readCache(ctx.uid,ctx.householdId);
      emit(cachedNoDb,{source:'cache-no-db',ready:false,uid:ctx.uid,householdId:ctx.householdId,revision:ctx.revision,migration:'none',error:'FIREBASE_DATABASE_UNAVAILABLE'});
      return false;
    }
    var token=capture();
    if(!token||!isCurrent(token))return false;
    var generation=++bindGeneration;
    var ref=database.ref('families/'+ctx.householdId+'/recipes');
    var binding={
      generation:generation,
      context:{uid:ctx.uid,householdId:ctx.householdId,revision:ctx.revision},
      token:token,
      db:database,
      ref:ref,
      handler:null,
      migrationChecked:false,
      migrationInFlight:false,
      migrationState:'none'
    };
    active=binding;
    var cached=readCache(ctx.uid,ctx.householdId);
    if(cached.length)emit(cached,{source:'household-cache',ready:true,uid:ctx.uid,householdId:ctx.householdId,revision:ctx.revision,migration:'none'});
    else emit([],{source:'binding',ready:true,uid:ctx.uid,householdId:ctx.householdId,revision:ctx.revision,migration:'none'});
    binding.handler=function(snapshot){
      if(!bindingCurrent(binding))return;
      var value=snapshot&&snapshot.val?snapshot.val():null;
      if(!binding.migrationChecked){ensureLegacyReconciled(binding,value);return;}
      publishCanonical(binding,value,rawRows(value).length?'firebase':'firebase-empty',binding.migrationState);
    };
    ref.on('value',binding.handler,function(error){
      if(!bindingCurrent(binding))return;
      emit(readCache(ctx.uid,ctx.householdId),{source:'firebase-error-cache',ready:true,uid:ctx.uid,householdId:ctx.householdId,revision:ctx.revision,migration:binding.migrationState,error:error&&error.message||String(error||'RECIPE_LISTENER_ERROR')});
    });
    return true;
  }
  function handleContext(ctx,reason){
    if(!validContext(ctx)){
      if(active||currentRecipes.length)unbind('context-cleared',true);
      return;
    }
    if(active&&active.context.uid===ctx.uid&&active.context.householdId===ctx.householdId&&active.context.revision===ctx.revision)return;
    bind(ctx,reason||'context-change');
  }
  function attachContext(){
    if(contextUnsubscribe)return true;
    if(!window.HouseholdContext||typeof window.HouseholdContext.subscribe!=='function')return false;
    contextUnsubscribe=window.HouseholdContext.subscribe(handleContext);
    return true;
  }
  function start(){
    if(attachContext())return true;
    if(!attachTimer){
      var tries=0;
      attachTimer=setInterval(function(){
        tries++;
        if(attachContext()||tries>200){clearInterval(attachTimer);attachTimer=null;}
      },50);
    }
    return false;
  }
  function stop(){
    if(attachTimer){clearInterval(attachTimer);attachTimer=null;}
    if(contextUnsubscribe){try{contextUnsubscribe();}catch(e){}contextUnsubscribe=null;}
    unbind('stopped',true);
  }
  function requireBinding(){
    start();
    var ctx=context();
    if(validContext(ctx)&&(!active||active.context.uid!==ctx.uid||active.context.householdId!==ctx.householdId||active.context.revision!==ctx.revision))bind(ctx,'mutation-bind');
    if(!active||!bindingCurrent(active))throw new Error('ACTIVE_RECIPE_HOUSEHOLD_REQUIRED');
    return active;
  }
  function rejectOffline(){
    try{return !!(window.offlineMode||(window.navigator&&window.navigator.onLine===false));}catch(e){return false;}
  }
  function assertWritable(binding){
    if(!bindingCurrent(binding))throw new Error('STALE_RECIPE_CONTEXT');
    if(rejectOffline())throw new Error('RECIPE_REPOSITORY_OFFLINE');
    return binding;
  }
  function findLocal(id){
    var wanted=String(id||'');
    return currentRecipes.find(function(recipe){return String(recipe&&recipe.id)===wanted||String(recipe&&recipe._key)===wanted;})||null;
  }
  function keyFor(id){
    if(id&&typeof id==='object')return id._key||safeKey(id.id);
    var local=findLocal(id);
    return local&&local._key?local._key:safeKey(id);
  }
  function create(recipe){
    var binding=assertWritable(requireBinding());
    var id=String(recipe&&recipe.id||makeId());
    var key=(recipe&&recipe._key)||safeKey(id);
    var input=Object.assign({},recipe||{},{id:id});
    var row=normalizeCreate(input,key,binding.context);
    return binding.ref.child(key).set(row).then(function(){
      if(!bindingCurrent(binding))throw new Error('STALE_RECIPE_CONTEXT');
      return clone(row);
    });
  }
  function mutateOne(id,mutator){
    var binding=assertWritable(requireBinding());
    var key=keyFor(id);
    var ref=binding.ref.child(key);
    return new Promise(function(resolve,reject){
      var mutatorError=null;
      ref.transaction(function(server){
        if(!bindingCurrent(binding))return;
        var base=server&&typeof server==='object'?normalizeExisting(server,key,binding.context):null;
        if(!base)return;
        var changed;
        try{changed=mutator(clone(base));}catch(error){mutatorError=error;return;}
        if(changed===undefined)return;
        return sealMutation(base,changed,key,binding.context);
      },function(error,committed,snapshot){
        if(mutatorError){reject(mutatorError);return;}
        if(error){reject(error);return;}
        if(!committed){reject(new Error(bindingCurrent(binding)?'RECIPE_NOT_FOUND_OR_ABORTED':'STALE_RECIPE_CONTEXT'));return;}
        if(!bindingCurrent(binding)){reject(new Error('STALE_RECIPE_CONTEXT'));return;}
        resolve(normalizeExisting(snapshot.val(),key,binding.context));
      },false);
    });
  }
  function updateOne(id,patch){
    patch=patch&&typeof patch==='object'?patch:{};
    return mutateOne(id,function(current){
      var next=clone(current)||{};
      Object.keys(patch).forEach(function(prop){if(!IMMUTABLE[prop])next[prop]=clone(patch[prop]);});
      return next;
    });
  }
  function remove(id){
    var binding=assertWritable(requireBinding());
    var key=keyFor(id);
    return binding.ref.child(key).set(null).then(function(){
      if(!bindingCurrent(binding))throw new Error('STALE_RECIPE_CONTEXT');
      return true;
    });
  }
  function list(){return currentRecipes.map(clone);}
  function get(id){var found=findLocal(id);return found?clone(found):null;}
  function status(){
    var ctx=context();
    return {
      version:VERSION,
      schemaVersion:SCHEMA_VERSION,
      ready:!!(active&&bindingCurrent(active)),
      uid:ctx&&ctx.uid||null,
      householdId:ctx&&ctx.householdId||null,
      revision:ctx&&ctx.revision||0,
      count:currentRecipes.length,
      source:lastMeta.source||'idle',
      migration:lastMeta.migration||'none',
      activeRecipeListener:!!(active&&active.handler),
      canonicalPath:ctx&&ctx.householdId?'families/'+ctx.householdId+'/recipes':null
    };
  }

  var api={
    version:VERSION,
    schemaVersion:SCHEMA_VERSION,
    start:start,
    stop:stop,
    list:list,
    get:get,
    subscribe:subscribe,
    create:create,
    updateOne:updateOne,
    mutateOne:mutateOne,
    remove:remove,
    status:status,
    _handleContext:handleContext,
    _keyFor:keyFor,
    _reconcileLegacyMap:reconcileLegacyMap
  };
  window.RecipeHouseholdRepository=api;
  window.RecipeRepository=api;

  window.addEventListener('familyapp:household-context',function(){start();});
  window.addEventListener('familyapp:session-state',function(){start();});
  window.addEventListener('load',function(){start();},{once:true});
  start();
})();
