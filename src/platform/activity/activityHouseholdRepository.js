'use strict';
// ============================================================
// ACTIVITY HOUSEHOLD REPOSITORY v1.0.0
// STEP 13.1 canonical immutable household activity boundary.
//
// Source of truth: families/{householdId}/activityEvents/{eventId}
// Identity/lifecycle authority: HouseholdContext.
// Writes are append-once: an existing event ID is never overwritten.
// ============================================================
(function(){
  if(window.ActivityHouseholdRepository)return;

  var VERSION='1.0.0';
  var SCHEMA_VERSION=1;
  var CACHE_PREFIX='familyapp_activity_events_v1_';
  var MAX_EVENTS=120;
  var subscribers=[];
  var contextUnsubscribe=null;
  var attachTimer=null;
  var active=null;
  var bindGeneration=0;
  var currentEvents=[];
  var lastMeta={source:'idle',ready:false,error:null};

  function now(){return Date.now();}
  function clone(v){if(v===undefined)return undefined;try{return JSON.parse(JSON.stringify(v));}catch(e){return v;}}
  function db(){try{return window.fbDb||(window.firebase&&window.firebase.database&&window.firebase.database())||null;}catch(e){return null;}}
  function snapshot(){try{return window.HouseholdContext&&HouseholdContext.snapshot?HouseholdContext.snapshot():null;}catch(e){return null;}}
  function capture(){try{return window.HouseholdContext&&HouseholdContext.capture?HouseholdContext.capture():null;}catch(e){return null;}}
  function isCurrent(token){try{return !!(window.HouseholdContext&&HouseholdContext.isCurrent&&HouseholdContext.isCurrent(token));}catch(e){return false;}}
  function validContext(ctx){return !!(ctx&&ctx.ready===true&&ctx.uid&&ctx.householdId);}
  function safeSegment(value){return String(value==null?'':value).replace(/[.#$\[\]\/]/g,'_').replace(/[^a-zA-Z0-9:_-]/g,'_').slice(0,220);}
  function eventIdFor(occurrenceKey){var safe=safeSegment(occurrenceKey);if(!safe)throw new Error('ACTIVITY_OCCURRENCE_KEY_REQUIRED');return 'evt_'+safe;}
  function cacheKey(uid,householdId){return CACHE_PREFIX+String(uid||'unresolved-user')+'_'+String(householdId||'unresolved-household');}
  function readCache(uid,householdId){if(!uid||!householdId)return[];try{var raw=localStorage.getItem(cacheKey(uid,householdId));var parsed=raw?JSON.parse(raw):[];return Array.isArray(parsed)?parsed:[];}catch(e){return[];}}
  function writeCache(uid,householdId,rows){if(!uid||!householdId)return;try{localStorage.setItem(cacheKey(uid,householdId),JSON.stringify(Array.isArray(rows)?rows.slice(0,MAX_EVENTS):[]));}catch(e){}}
  function rawRows(value){if(!value||typeof value!=='object')return[];return Object.keys(value).map(function(key){var row=value[key];if(!row||typeof row!=='object'||Array.isArray(row))return null;var out=clone(row)||{};out.id=String(out.id||key);return out;}).filter(Boolean);}
  function normalizeExisting(row,key,ctx){row=clone(row||{})||{};row.id=String(row.id||key||'');row.schemaVersion=Number(row.schemaVersion)||SCHEMA_VERSION;row.householdId=String(row.householdId||ctx.householdId);row.type=String(row.type||'');row.actorUid=row.actorUid==null?null:String(row.actorUid);row.occurredAt=Number(row.occurredAt)||Number(row.createdAt)||0;row.createdAt=Number(row.createdAt)||row.occurredAt||0;row.visibility='household';row.occurrenceKey=String(row.occurrenceKey||row.dedupeKey||row.id||'');row.source=clone(row.source||{});row.payload=clone(row.payload||{});row.presentation=clone(row.presentation||{});return row;}
  function listFromValue(value,ctx){return rawRows(value).map(function(row){return normalizeExisting(row,row.id,ctx);}).filter(function(row){return row.id&&row.type&&row.householdId===String(ctx.householdId);}).sort(function(a,b){return Number(b.occurredAt||0)-Number(a.occurredAt||0);}).slice(0,MAX_EVENTS);}
  function emit(rows,meta){currentEvents=Array.isArray(rows)?rows.map(clone):[];lastMeta=Object.assign({source:'unknown',ready:!!active,error:null},meta||{});if(lastMeta.uid&&lastMeta.householdId)writeCache(lastMeta.uid,lastMeta.householdId,currentEvents);subscribers.slice().forEach(function(fn){try{fn(currentEvents.map(clone),clone(lastMeta));}catch(e){console.warn('[ActivityHouseholdRepository] subscriber failed',e);}});try{window.dispatchEvent(new CustomEvent('familyapp:activity-repository',{detail:{events:currentEvents.map(clone),meta:clone(lastMeta)}}));}catch(e){}}
  function subscribe(fn){if(typeof fn!=='function')return function(){};subscribers.push(fn);try{fn(currentEvents.map(clone),clone(lastMeta));}catch(e){}return function(){var i=subscribers.indexOf(fn);if(i>=0)subscribers.splice(i,1);};}
  function bindingCurrent(binding){return !!(binding&&active===binding&&binding.generation===bindGeneration&&isCurrent(binding.token));}
  function unbind(reason,clearProjection){if(active&&active.ref&&active.handler){try{active.ref.off('value',active.handler);}catch(e){}}active=null;bindGeneration++;if(clearProjection!==false)emit([],{source:reason||'unbound',ready:false,uid:null,householdId:null,error:null});}
  function bind(ctx){
    unbind('context-rebind',false);
    if(!validContext(ctx)){emit([],{source:'context-not-ready',ready:false,uid:ctx&&ctx.uid||null,householdId:ctx&&ctx.householdId||null,error:null});return false;}
    var database=db();
    if(!database){emit(readCache(ctx.uid,ctx.householdId),{source:'cache-no-db',ready:false,uid:ctx.uid,householdId:ctx.householdId,revision:ctx.revision,error:'FIREBASE_DATABASE_UNAVAILABLE'});return false;}
    var token=capture();if(!token||!isCurrent(token))return false;
    var generation=++bindGeneration;
    var ref=database.ref('families/'+ctx.householdId+'/activityEvents');
    var binding={generation:generation,context:{uid:ctx.uid,householdId:ctx.householdId,revision:ctx.revision},token:token,ref:ref,handler:null};
    active=binding;
    var cached=readCache(ctx.uid,ctx.householdId);
    emit(cached,{source:cached.length?'household-cache':'binding',ready:true,uid:ctx.uid,householdId:ctx.householdId,revision:ctx.revision,error:null});
    binding.handler=function(s){if(!bindingCurrent(binding))return;var value=s&&s.val?s.val():null;emit(listFromValue(value,binding.context),{source:value?'firebase':'firebase-empty',ready:true,uid:binding.context.uid,householdId:binding.context.householdId,revision:binding.context.revision,error:null});};
    ref.on('value',binding.handler,function(error){if(!bindingCurrent(binding))return;emit(readCache(ctx.uid,ctx.householdId),{source:'firebase-error-cache',ready:true,uid:ctx.uid,householdId:ctx.householdId,revision:ctx.revision,error:error&&error.message||String(error||'ACTIVITY_LISTENER_ERROR')});});
    return true;
  }
  function handleContext(ctx){if(!validContext(ctx)){unbind('context-cleared',true);return;}if(active&&active.context.uid===ctx.uid&&active.context.householdId===ctx.householdId&&active.context.revision===ctx.revision)return;bind(ctx);}
  function start(){
    if(!contextUnsubscribe&&window.HouseholdContext&&typeof HouseholdContext.subscribe==='function')contextUnsubscribe=HouseholdContext.subscribe(handleContext);
    var ctx=snapshot();if(validContext(ctx))handleContext(ctx);
    if(!validContext(ctx)&&!attachTimer){var tries=0;attachTimer=setInterval(function(){tries++;var next=snapshot();if(validContext(next)){clearInterval(attachTimer);attachTimer=null;handleContext(next);}else if(tries>300){clearInterval(attachTimer);attachTimer=null;}},100);}
    return true;
  }
  function requireBinding(){var ctx=snapshot();if(!validContext(ctx))throw new Error('ACTIVE_HOUSEHOLD_REQUIRED');if(!active||active.context.uid!==ctx.uid||active.context.householdId!==ctx.householdId||active.context.revision!==ctx.revision)bind(ctx);if(!active)throw new Error('ACTIVITY_REPOSITORY_UNAVAILABLE');var token=capture();if(!token||!isCurrent(token))throw new Error('STALE_HOUSEHOLD_CONTEXT');return{binding:active,token:token,context:ctx};}
  function normalizeCreate(input,ctx){
    input=clone(input||{})||{};
    var occurrenceKey=String(input.occurrenceKey||input.dedupeKey||'').trim();if(!occurrenceKey)throw new Error('ACTIVITY_OCCURRENCE_KEY_REQUIRED');
    var type=String(input.type||'').trim();if(!type)throw new Error('ACTIVITY_TYPE_REQUIRED');
    var id=String(input.id||eventIdFor(occurrenceKey));
    if(id!==eventIdFor(occurrenceKey))throw new Error('ACTIVITY_EVENT_ID_MUST_MATCH_OCCURRENCE_KEY');
    var occurredAt=Number(input.occurredAt)||now();
    return {id:id,schemaVersion:SCHEMA_VERSION,householdId:String(ctx.householdId),type:type,actorUid:input.actorUid==null?String(ctx.uid):String(input.actorUid),occurredAt:occurredAt,createdAt:Number(input.createdAt)||now(),visibility:'household',occurrenceKey:occurrenceKey,source:clone(input.source||{}),payload:clone(input.payload||{}),presentation:clone(input.presentation||{})};
  }
  function appendOnce(input){
    var guard;try{guard=requireBinding();}catch(e){return Promise.reject(e);}
    var event;try{event=normalizeCreate(input,guard.context);}catch(e){return Promise.reject(e);}
    var ref=guard.binding.ref.child(event.id);
    return new Promise(function(resolve,reject){
      ref.transaction(function(server){if(!isCurrent(guard.token))return;if(server!=null)return server;return event;},function(error,committed,snap){
        if(error){reject(error);return;}
        if(!isCurrent(guard.token)){reject(new Error('STALE_HOUSEHOLD_CONTEXT'));return;}
        var value=snap&&snap.val?snap.val():null;if(!value){reject(new Error('ACTIVITY_APPEND_NOT_COMMITTED'));return;}
        var existing=normalizeExisting(value,event.id,guard.context);
        resolve({event:clone(existing),created:!!committed&&String(existing.occurrenceKey)===String(event.occurrenceKey)&&Number(existing.createdAt)===Number(event.createdAt),duplicate:!committed||Number(existing.createdAt)!==Number(event.createdAt)});
      },false);
    });
  }
  function list(){return currentEvents.map(clone);}
  function get(id){var wanted=String(id||'');var row=currentEvents.find(function(e){return String(e.id)===wanted;});return row?clone(row):null;}
  function status(){var ctx=snapshot();return{version:VERSION,schemaVersion:SCHEMA_VERSION,ready:!!active,uid:ctx&&ctx.uid||null,householdId:ctx&&ctx.householdId||null,count:currentEvents.length,canonicalPath:ctx&&ctx.householdId?'families/'+ctx.householdId+'/activityEvents':null,source:lastMeta.source,error:lastMeta.error||null};}
  function stop(){if(contextUnsubscribe){try{contextUnsubscribe();}catch(e){}contextUnsubscribe=null;}if(attachTimer){clearInterval(attachTimer);attachTimer=null;}unbind('stopped',true);}

  window.ActivityHouseholdRepository={version:VERSION,schemaVersion:SCHEMA_VERSION,start:start,stop:stop,subscribe:subscribe,list:list,get:get,appendOnce:appendOnce,eventIdFor:eventIdFor,status:status};
  start();
})();
