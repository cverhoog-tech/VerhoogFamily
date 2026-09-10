'use strict';
// ============================================================
// FINANCE HOUSEHOLD REPOSITORY v1.0.0
// STEP 8 canonical finance persistence boundary.
//
// Source of truth: families/{householdId}/finance
// Identity authority: HouseholdContext (UID + household + revision)
// Legacy migration authority: same-household shared/finance only.
// Generic globals/AppState/local storage are never migration authority.
// ============================================================
(function(){
  if(window.FinanceHouseholdRepository)return;

  var VERSION='1.0.0';
  var CACHE_PREFIX='familyapp_finance_v3_';
  var subscribers=[];
  var contextUnsubscribe=null;
  var attachTimer=null;
  var active=null;
  var bindGeneration=0;
  var current=null;
  var lastMeta={source:'idle',ready:false,error:null,migration:'none',uid:null,householdId:null};

  function now(){return Date.now();}
  function clone(v){if(v===undefined)return undefined;try{return JSON.parse(JSON.stringify(v));}catch(e){return v;}}
  function db(){try{return window.fbDb||(window.firebase&&window.firebase.database&&window.firebase.database())||null;}catch(e){return null;}}
  function snapshot(){try{return window.HouseholdContext&&HouseholdContext.snapshot?HouseholdContext.snapshot():null;}catch(e){return null;}}
  function capture(){try{return window.HouseholdContext&&HouseholdContext.capture?HouseholdContext.capture():null;}catch(e){return null;}}
  function isCurrent(token){try{return !!(window.HouseholdContext&&HouseholdContext.isCurrent&&HouseholdContext.isCurrent(token));}catch(e){return false;}}
  function validContext(ctx){return !!(ctx&&ctx.ready===true&&ctx.uid&&ctx.householdId);}
  function hasObjectData(v){return !!(v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).length);}
  function cacheKey(uid,householdId){return CACHE_PREFIX+String(uid||'unresolved-user')+'_'+String(householdId||'unresolved-household');}
  function readCache(uid,householdId){if(!uid||!householdId)return null;try{var raw=localStorage.getItem(cacheKey(uid,householdId));return raw?JSON.parse(raw):null;}catch(e){return null;}}
  function writeCache(uid,householdId,value){if(!uid||!householdId||!hasObjectData(value))return;try{localStorage.setItem(cacheKey(uid,householdId),JSON.stringify(value));}catch(e){}}

  function emit(value,meta){
    current=hasObjectData(value)?clone(value):null;
    lastMeta=Object.assign({source:'unknown',ready:!!active,error:null,migration:'none',uid:null,householdId:null},meta||{});
    if(current&&lastMeta.uid&&lastMeta.householdId)writeCache(lastMeta.uid,lastMeta.householdId,current);
    subscribers.slice().forEach(function(fn){try{fn(clone(current),clone(lastMeta));}catch(e){console.warn('[FinanceHouseholdRepository] subscriber failed',e);}});
    try{window.dispatchEvent(new CustomEvent('familyapp:finance-repository',{detail:{state:clone(current),meta:clone(lastMeta)}}));}catch(e){}
  }

  function subscribe(fn){
    if(typeof fn!=='function')return function(){};
    subscribers.push(fn);
    try{fn(clone(current),clone(lastMeta));}catch(e){}
    return function(){var i=subscribers.indexOf(fn);if(i>=0)subscribers.splice(i,1);};
  }

  function bindingCurrent(binding){return !!(binding&&active===binding&&binding.generation===bindGeneration&&isCurrent(binding.token));}
  function unbind(reason,clearProjection){
    if(active&&active.ref&&active.handler){try{active.ref.off('value',active.handler);}catch(e){}}
    active=null;
    bindGeneration++;
    if(clearProjection!==false)emit(null,{source:reason||'unbound',ready:false,error:null,migration:'none',uid:null,householdId:null});
  }

  function publish(binding,value,source,migration){
    if(!bindingCurrent(binding))return;
    emit(value,{source:source||'firebase',ready:true,error:null,migration:migration||binding.migrationState||'none',uid:binding.context.uid,householdId:binding.context.householdId,revision:binding.context.revision});
  }

  function legacyForCanonical(value,ctx){
    if(!hasObjectData(value))return null;
    var next=clone(value)||{};
    next.meta=Object.assign({},next.meta||{}, {migratedAt:now(),migratedByUid:ctx.uid,migratedFrom:'shared/finance'});
    return next;
  }

  function finishMigration(binding,strategy,canonicalFallback){
    if(!bindingCurrent(binding))return Promise.resolve(null);
    var markerRef=binding.db.ref('families/'+binding.context.householdId+'/financeMigrations/v3SharedToCanonical');
    return markerRef.set({status:'complete',source:'shared/finance',strategy:strategy,completedAt:now(),byUid:binding.context.uid}).then(function(){
      if(!bindingCurrent(binding))return null;
      binding.migrationChecked=true;
      binding.migrationInFlight=false;
      binding.migrationState='complete';
      return binding.ref.once('value').then(function(latest){
        if(!bindingCurrent(binding))return null;
        var value=latest&&latest.val?latest.val():canonicalFallback;
        publish(binding,value,hasObjectData(value)?'firebase':'firebase-empty','complete');
        return value;
      });
    });
  }

  function ensureMigrated(binding,canonicalValue){
    if(!bindingCurrent(binding)||binding.migrationChecked||binding.migrationInFlight)return;
    binding.migrationInFlight=true;
    binding.migrationState='checking-migration-marker';
    var markerRef=binding.db.ref('families/'+binding.context.householdId+'/financeMigrations/v3SharedToCanonical');
    var legacyRef=binding.db.ref('families/'+binding.context.householdId+'/shared/finance');

    markerRef.once('value').then(function(s){
      if(!bindingCurrent(binding))return null;
      var marker=s&&s.val?s.val():null;
      if(marker&&marker.status==='complete'){
        binding.migrationChecked=true;
        binding.migrationInFlight=false;
        binding.migrationState='complete';
        return binding.ref.once('value').then(function(latest){
          if(bindingCurrent(binding))publish(binding,latest&&latest.val?latest.val():canonicalValue,hasObjectData(latest&&latest.val?latest.val():canonicalValue)?'firebase':'firebase-empty','complete');
          return null;
        });
      }
      if(hasObjectData(canonicalValue))return finishMigration(binding,'canonical-present',canonicalValue);
      return legacyRef.once('value').then(function(legacySnap){
        if(!bindingCurrent(binding))return null;
        var legacy=legacySnap&&legacySnap.val?legacySnap.val():null;
        if(!hasObjectData(legacy))return finishMigration(binding,'no-legacy-data',canonicalValue);
        var seed=legacyForCanonical(legacy,binding.context);
        binding.migrationState='migrating-same-household-finance';
        return new Promise(function(resolve,reject){
          binding.ref.transaction(function(server){
            if(!bindingCurrent(binding))return;
            if(hasObjectData(server))return server;
            return seed;
          },function(error,committed,snap){
            if(error){reject(error);return;}
            if(!bindingCurrent(binding)){resolve(null);return;}
            var value=snap&&snap.val?snap.val():canonicalValue;
            resolve(finishMigration(binding,committed?'same-household-migrated':'canonical-won',value));
          },false);
        });
      });
    }).catch(function(error){
      if(!bindingCurrent(binding))return;
      binding.migrationChecked=true;
      binding.migrationInFlight=false;
      binding.migrationState='legacy-migration-failed';
      publish(binding,canonicalValue,'firebase','legacy-migration-failed');
      console.warn('[FinanceHouseholdRepository] legacy migration failed',error);
    });
  }

  function bind(ctx){
    unbind('context-rebind',false);
    if(!validContext(ctx)){emit(null,{source:'context-not-ready',ready:false,uid:ctx&&ctx.uid||null,householdId:ctx&&ctx.householdId||null,migration:'none'});return false;}
    var database=db();
    var cached=readCache(ctx.uid,ctx.householdId);
    if(!database){emit(cached,{source:cached?'household-cache-no-db':'no-db',ready:false,uid:ctx.uid,householdId:ctx.householdId,revision:ctx.revision,error:'FIREBASE_DATABASE_UNAVAILABLE',migration:'none'});return false;}
    var token=capture();if(!token||!isCurrent(token))return false;
    var generation=++bindGeneration;
    var ref=database.ref('families/'+ctx.householdId+'/finance');
    var binding={generation:generation,context:{uid:ctx.uid,householdId:ctx.householdId,revision:ctx.revision},token:token,db:database,ref:ref,handler:null,migrationChecked:false,migrationInFlight:false,migrationState:'none'};
    active=binding;
    emit(cached,{source:cached?'household-cache':'binding',ready:false,uid:ctx.uid,householdId:ctx.householdId,revision:ctx.revision,migration:'none'});
    binding.handler=function(s){
      if(!bindingCurrent(binding))return;
      var value=s&&s.val?s.val():null;
      if(!binding.migrationChecked){ensureMigrated(binding,value);return;}
      publish(binding,value,hasObjectData(value)?'firebase':'firebase-empty',binding.migrationState);
    };
    ref.on('value',binding.handler,function(error){
      if(!bindingCurrent(binding))return;
      emit(readCache(ctx.uid,ctx.householdId),{source:'firebase-error-cache',ready:false,uid:ctx.uid,householdId:ctx.householdId,revision:ctx.revision,migration:binding.migrationState,error:error&&error.message||String(error||'FINANCE_LISTENER_ERROR')});
    });
    return true;
  }

  function handleContext(ctx){
    if(!validContext(ctx)){unbind('context-cleared',true);return;}
    if(active&&active.context.uid===ctx.uid&&active.context.householdId===ctx.householdId&&active.context.revision===ctx.revision)return;
    bind(ctx);
  }

  function start(){
    if(!contextUnsubscribe&&window.HouseholdContext&&typeof HouseholdContext.subscribe==='function')contextUnsubscribe=HouseholdContext.subscribe(handleContext);
    var ctx=snapshot();if(validContext(ctx))handleContext(ctx);
    if(!validContext(ctx)&&!attachTimer){
      var tries=0;
      attachTimer=setInterval(function(){
        tries++;var next=snapshot();
        if(validContext(next)){clearInterval(attachTimer);attachTimer=null;handleContext(next);}
        else if(tries>300){clearInterval(attachTimer);attachTimer=null;}
      },100);
    }
    return true;
  }

  function ready(){
    start();
    if(active&&bindingCurrent(active)&&lastMeta.ready===true)return Promise.resolve(true);
    return new Promise(function(resolve){
      var settled=false,off=function(){};
      var timer=setTimeout(function(){if(settled)return;settled=true;off();resolve(false);},10000);
      off=subscribe(function(value,meta){
        if(settled)return;
        if(meta&&meta.ready===true&&active&&bindingCurrent(active)){
          settled=true;clearTimeout(timer);off();resolve(true);
        }
      });
    });
  }

  function requireBinding(){
    var ctx=snapshot();
    if(!validContext(ctx))throw new Error('Finance household context is not ready');
    if(!active||active.context.uid!==ctx.uid||active.context.householdId!==ctx.householdId||active.context.revision!==ctx.revision)bind(ctx);
    if(!active||!bindingCurrent(active))throw new Error('Finance household binding is stale');
    return active;
  }

  function replace(value){
    var binding;try{binding=requireBinding();}catch(e){return Promise.reject(e);}
    var token=binding.token,next=clone(value);
    return binding.ref.set(next).then(function(){
      if(!bindingCurrent(binding)||!isCurrent(token))throw new Error('Finance context changed during replace');
      publish(binding,next,'mutation-ack',binding.migrationState);
      return clone(next);
    });
  }

  function childRef(ref,path){
    var out=ref;
    (Array.isArray(path)?path:[]).forEach(function(part){out=out.child(String(part));});
    return out;
  }

  function transact(path,updater,fallback){
    var binding;try{binding=requireBinding();}catch(e){return Promise.reject(e);}
    if(typeof updater!=='function')return Promise.reject(new Error('Finance transaction updater required'));
    var token=binding.token,ref=childRef(binding.ref,path);
    return new Promise(function(resolve,reject){
      ref.transaction(function(server){
        if(!bindingCurrent(binding)||!isCurrent(token))return;
        var base=server===null||server===undefined?clone(fallback):clone(server);
        return updater(base);
      },function(error,committed,snap){
        if(error){reject(error);return;}
        if(!committed||!bindingCurrent(binding)||!isCurrent(token)){reject(new Error('Finance transaction cancelled by context switch'));return;}
        var value=snap&&snap.val?snap.val():null;
        binding.ref.once('value').then(function(rootSnap){
          if(bindingCurrent(binding)&&isCurrent(token))publish(binding,rootSnap&&rootSnap.val?rootSnap.val():null,'mutation-ack',binding.migrationState);
          resolve({value:clone(value),committed:true});
        }).catch(function(){resolve({value:clone(value),committed:true});});
      },false);
    });
  }

  function stop(){
    if(contextUnsubscribe){try{contextUnsubscribe();}catch(e){}contextUnsubscribe=null;}
    if(attachTimer){clearInterval(attachTimer);attachTimer=null;}
    unbind('stopped',true);
  }

  function status(){
    var ctx=snapshot();
    return {version:VERSION,ready:!!(active&&bindingCurrent(active)&&lastMeta.ready),uid:ctx&&ctx.uid||null,householdId:ctx&&ctx.householdId||null,source:lastMeta.source,migration:lastMeta.migration,error:lastMeta.error||null};
  }

  window.FinanceHouseholdRepository={version:VERSION,start:start,stop:stop,ready:ready,get:function(){return clone(current);},subscribe:subscribe,replace:replace,transact:transact,status:status};
  start();
})();
