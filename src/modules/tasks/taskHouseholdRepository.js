'use strict';
// ============================================================
// TASK HOUSEHOLD REPOSITORY v1.0.0
// STEP 3 canonical task persistence boundary.
//
// Source of truth: families/{householdId}/tasks/{taskKey}
// Identity authority: HouseholdContext (UID + household + revision)
// Local cache is UID + household scoped presentation fallback only.
// Generic legacy localStorage task keys are never used as identity/data authority.
// ============================================================
(function(){
  if(window.TaskHouseholdRepository)return;

  var VERSION='1.0.0';
  var CACHE_PREFIX='familyapp_tasks_v2_';
  var subscribers=[];
  var contextUnsubscribe=null;
  var attachTimer=null;
  var active=null;
  var bindGeneration=0;
  var currentTasks=[];
  var lastMeta={source:'idle',ready:false,error:null,migration:'none'};

  var IMMUTABLE={
    _key:true,
    householdId:true,
    createdByUid:true,
    createdAt:true
  };

  function now(){return Date.now();}
  function clone(value){
    if(value===undefined)return undefined;
    try{return JSON.parse(JSON.stringify(value));}catch(e){return value;}
  }
  function safeKey(value){
    return String(value===undefined||value===null?'task_'+now():value).replace(/[.#$\[\]\/]/g,'_');
  }
  function makeKey(){return 'task_'+now().toString(36)+'_'+Math.random().toString(36).slice(2,9);}
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
  function writeCache(userId,householdId,tasks){
    if(!userId||!householdId)return;
    try{localStorage.setItem(cacheKey(userId,householdId),JSON.stringify(Array.isArray(tasks)?tasks:[]));}catch(e){}
  }
  function rows(value){
    if(!value)return [];
    if(Array.isArray(value)){
      return value.map(function(row,index){
        if(!row)return null;
        return {key:(row&&row._key)||safeKey(row&&row.id!==undefined?row.id:index),value:row};
      }).filter(Boolean);
    }
    if(typeof value!=='object')return [];
    return Object.keys(value).map(function(key){
      var row=value[key];
      if(!row)return null;
      return {key:key,value:row};
    }).filter(Boolean);
  }
  function asObject(task,key){
    var originalId=Array.isArray(task)?task[0]:null;
    var out;
    if(Array.isArray(task)&&window.TaskModel&&typeof window.TaskModel.toObject==='function')out=window.TaskModel.toObject(task);
    else out=clone(task||{})||{};
    if(originalId!==undefined&&originalId!==null)out.id=originalId;
    if(out.id===undefined||out.id===null||out.id==='')out.id=key;
    out._key=key||out._key||safeKey(out.id);
    return out;
  }
  function normalizeExisting(task,key,ctx){
    var out=asObject(task,key);
    out._key=key||out._key||safeKey(out.id);
    if(out.id===undefined||out.id===null||out.id==='')out.id=out._key;
    out.householdId=ctx.householdId;
    if(!Array.isArray(out.helpers))out.helpers=[];
    if(out.assignedToUids&&typeof out.assignedToUids!=='object')delete out.assignedToUids;
    if(!out.schemaVersion||Number(out.schemaVersion)<2)out.schemaVersion=2;
    return out;
  }
  function normalizeCreate(task,key,ctx){
    var out=normalizeExisting(task,key,ctx);
    out.createdByUid=ctx.uid;
    out.createdAt=Number(out.createdAt)||now();
    out.updatedByUid=ctx.uid;
    out.updatedAt=now();
    return out;
  }
  function sealMutation(server,changed,key,ctx){
    var base=normalizeExisting(server||{},key,ctx);
    var next=clone(base)||{};
    var patch=changed&&typeof changed==='object'?changed:{};
    Object.keys(patch).forEach(function(prop){if(!IMMUTABLE[prop])next[prop]=clone(patch[prop]);});
    next._key=key;
    next.householdId=ctx.householdId;
    next.createdByUid=base.createdByUid||ctx.uid;
    next.createdAt=Number(base.createdAt)||now();
    next.updatedByUid=ctx.uid;
    next.updatedAt=now();
    next.schemaVersion=2;
    if(!Array.isArray(next.helpers))next.helpers=[];
    return next;
  }
  function listFromValue(value,ctx){
    return rows(value).map(function(entry){return normalizeExisting(entry.value,entry.key,ctx);});
  }
  function mapFromTasks(tasks,ctx,imported){
    var out={};
    (Array.isArray(tasks)?tasks:[]).forEach(function(task,index){
      if(!task)return;
      var key=(task&&task._key)||safeKey(task&&task.id!==undefined?task.id:'item_'+index);
      var row=normalizeExisting(task,key,ctx);
      if(imported&&!row.createdByUid)row.createdByUid=ctx.uid;
      if(imported&&!row.createdAt)row.createdAt=now();
      row.updatedByUid=ctx.uid;
      row.updatedAt=now();
      row.schemaVersion=2;
      out[key]=row;
    });
    return out;
  }
  function emit(tasks,meta){
    currentTasks=Array.isArray(tasks)?tasks.map(clone):[];
    lastMeta=Object.assign({source:'unknown',ready:!!active,error:null,migration:'none'},meta||{});
    if(lastMeta.uid&&lastMeta.householdId)writeCache(lastMeta.uid,lastMeta.householdId,currentTasks);
    subscribers.slice().forEach(function(fn){try{fn(currentTasks.map(clone),clone(lastMeta));}catch(e){console.warn('[TaskHouseholdRepository] subscriber failed',e);}});
    try{window.dispatchEvent(new CustomEvent('familyapp:task-repository',{detail:{tasks:currentTasks.map(clone),meta:clone(lastMeta)}}));}catch(e){}
  }
  function subscribe(fn){
    if(typeof fn!=='function')return function(){};
    subscribers.push(fn);
    try{fn(currentTasks.map(clone),clone(lastMeta));}catch(e){}
    return function(){var i=subscribers.indexOf(fn);if(i>=0)subscribers.splice(i,1);};
  }
  function bindingCurrent(binding){
    return !!(binding&&active===binding&&binding.generation===bindGeneration&&isCurrent(binding.token));
  }
  function unbind(reason,clearProjection){
    if(active&&active.ref&&active.handler){try{active.ref.off('value',active.handler);}catch(e){}}
    active=null;
    bindGeneration++;
    if(clearProjection!==false)emit([],{source:reason||'unbound',ready:false,householdId:null,uid:null,migration:'none'});
  }
  function publishCanonical(binding,value,source,migration){
    if(!bindingCurrent(binding))return;
    var tasks=listFromValue(value,binding.context);
    emit(tasks,{
      source:source||'firebase',
      ready:true,
      uid:binding.context.uid,
      householdId:binding.context.householdId,
      revision:binding.context.revision,
      migration:migration||binding.migrationState||'none'
    });
  }
  function taskIdentity(entry){
    var row=entry&&entry.value||{};
    if(row.id!==undefined&&row.id!==null&&row.id!=='')return String(row.id);
    if(row._key)return String(row._key);
    return String(entry&&entry.key||'');
  }
  function reconcileLegacyMap(currentValue,legacyValue,ctx){
    var currentEntries=rows(currentValue);
    var legacyEntries=rows(legacyValue);
    if(!legacyEntries.length)return clone(currentValue)||{};

    var result={};
    var currentKeyByIdentity={};
    var canonicalKeyByIdentity={};
    currentEntries.forEach(function(entry){
      var identity=taskIdentity(entry);
      if(identity)currentKeyByIdentity[identity]=entry.key;
      if(Number(entry.value&&entry.value.schemaVersion||0)>=2){
        var canonical=normalizeExisting(entry.value,entry.key,ctx);
        result[entry.key]=canonical;
        if(identity)canonicalKeyByIdentity[identity]=entry.key;
      }
    });

    legacyEntries.forEach(function(entry,index){
      var identity=taskIdentity(entry)||String(index);
      if(canonicalKeyByIdentity[identity])return;
      var key=currentKeyByIdentity[identity]||entry.key||safeKey(identity);
      if(result[key]&&taskIdentity({key:key,value:result[key]})!==identity)key=safeKey(identity)+'_legacy';
      var row=normalizeExisting(entry.value,key,ctx);
      if(!row.createdByUid)row.createdByUid=ctx.uid;
      if(!row.createdAt)row.createdAt=now();
      row.schemaVersion=2;
      row.migratedFrom='shared/tasks';
      row.migratedAt=now();
      result[key]=row;
    });
    return result;
  }
  function ensureLegacyReconciled(binding,canonicalValue){
    if(!bindingCurrent(binding)||binding.migrationChecked||binding.migrationInFlight)return;
    binding.migrationInFlight=true;
    binding.migrationState='checking-migration-marker';
    var markerRef=binding.db.ref('families/'+binding.context.householdId+'/taskMigrations/v2SharedToCanonical');
    var legacyRef=binding.db.ref('families/'+binding.context.householdId+'/shared/tasks');

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
        var legacyEntries=rows(legacyValue);
        if(!legacyEntries.length){
          return {value:canonicalValue,source:'no-shared-data'};
        }
        binding.migrationState='reconciling-legacy-shared';
        return new Promise(function(resolve,reject){
          binding.ref.transaction(function(current){
            if(!bindingCurrent(binding))return;
            return reconcileLegacyMap(current,legacyValue,binding.context);
          },function(error,committed,snapshot){
            if(error){reject(error);return;}
            if(!bindingCurrent(binding)){resolve(null);return;}
            resolve({value:snapshot&&snapshot.val?snapshot.val():canonicalValue,source:committed?'shared-reconciled':'canonical-unchanged'});
          },false);
        });
      });
    }).then(function(result){
      if(!result||!bindingCurrent(binding)||binding.migrationChecked)return null;
      binding.migrationState='writing-migration-marker';
      return markerRef.set({status:'complete',source:'shared/tasks',strategy:result.source,completedAt:now(),byUid:binding.context.uid}).then(function(){
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
      console.warn('[TaskHouseholdRepository] legacy task reconciliation failed',error);
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
    var ref=database.ref('families/'+ctx.householdId+'/tasks');
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
      publishCanonical(binding,value,rows(value).length?'firebase':'firebase-empty',binding.migrationState);
    };
    ref.on('value',binding.handler,function(error){
      if(!bindingCurrent(binding))return;
      emit(readCache(ctx.uid,ctx.householdId),{source:'firebase-error-cache',ready:true,uid:ctx.uid,householdId:ctx.householdId,revision:ctx.revision,migration:binding.migrationState,error:error&&error.message||String(error||'TASK_LISTENER_ERROR')});
    });
    return true;
  }
  function handleContext(ctx,reason){
    if(!validContext(ctx)){
      if(active||currentTasks.length)unbind('context-cleared',true);
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
    if(!active||!bindingCurrent(active))throw new Error('ACTIVE_TASK_HOUSEHOLD_REQUIRED');
    return active;
  }
  function rejectOffline(){
    try{return !!(window.offlineMode||(window.navigator&&window.navigator.onLine===false));}catch(e){return false;}
  }
  function assertWritable(binding){
    if(!bindingCurrent(binding))throw new Error('STALE_TASK_CONTEXT');
    if(rejectOffline())throw new Error('TASK_REPOSITORY_OFFLINE');
    return binding;
  }
  function findLocal(id){
    var wanted=String(id);
    return currentTasks.find(function(task){return String(task&&task.id)===wanted||String(task&&task._key)===wanted;})||null;
  }
  function keyFor(id){
    if(id&&typeof id==='object')return id._key||safeKey(id.id);
    var local=findLocal(id);
    return local&&local._key?local._key:safeKey(id);
  }
  function create(task){
    var binding=assertWritable(requireBinding());
    var key=(task&&task._key)||makeKey();
    var row=normalizeCreate(task,key,binding.context);
    return binding.ref.child(key).set(row).then(function(){
      if(!bindingCurrent(binding))throw new Error('STALE_TASK_CONTEXT');
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
        if(!committed){reject(new Error(bindingCurrent(binding)?'TASK_NOT_FOUND_OR_ABORTED':'STALE_TASK_CONTEXT'));return;}
        if(!bindingCurrent(binding)){reject(new Error('STALE_TASK_CONTEXT'));return;}
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
      if(!bindingCurrent(binding))throw new Error('STALE_TASK_CONTEXT');
      return true;
    });
  }
  function saveAll(tasks){
    var binding=assertWritable(requireBinding());
    var map=mapFromTasks(Array.isArray(tasks)?tasks:[],binding.context,false);
    Object.keys(map).forEach(function(key){
      var row=map[key];
      if(!row.createdByUid)row.createdByUid=binding.context.uid;
      if(!row.createdAt)row.createdAt=now();
    });
    return binding.ref.set(map).then(function(){
      if(!bindingCurrent(binding))throw new Error('STALE_TASK_CONTEXT');
      return Object.keys(map).map(function(key){return clone(map[key]);});
    });
  }
  function list(){return currentTasks.map(clone);}
  function status(){
    var ctx=context();
    return {
      version:VERSION,
      ready:!!(active&&bindingCurrent(active)),
      uid:ctx&&ctx.uid||null,
      householdId:ctx&&ctx.householdId||null,
      revision:ctx&&ctx.revision||0,
      count:currentTasks.length,
      source:lastMeta.source||'idle',
      migration:lastMeta.migration||'none',
      activeTaskListener:!!(active&&active.handler),
      canonicalPath:ctx&&ctx.householdId?'families/'+ctx.householdId+'/tasks':null
    };
  }

  var api={
    version:VERSION,
    start:start,
    stop:stop,
    list:list,
    subscribe:subscribe,
    create:create,
    updateOne:updateOne,
    mutateOne:mutateOne,
    remove:remove,
    saveAll:saveAll,
    status:status,
    _handleContext:handleContext,
    _keyFor:keyFor
  };
  window.TaskHouseholdRepository=api;
  window.TaskRepository=api;

  window.addEventListener('familyapp:household-context',function(){start();});
  window.addEventListener('familyapp:session-state',function(){start();});
  window.addEventListener('load',function(){start();},{once:true});
  start();
})();
