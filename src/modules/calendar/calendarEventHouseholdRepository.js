'use strict';
// ============================================================
// CALENDAR EVENT HOUSEHOLD REPOSITORY v1.0.1
// STEP 6 canonical agenda persistence boundary.
//
// Source of truth: families/{householdId}/calendarEvents/{eventKey}
// Identity authority: HouseholdContext (UID + household + revision)
// Local/AppState calendar data is presentation fallback only and is NEVER
// migration authority for a newly resolved household.
// ============================================================
(function(){
  if(window.CalendarEventHouseholdRepository)return;

  var VERSION='1.0.1';
  var SCHEMA_VERSION=2;
  var CACHE_PREFIX='familyapp_calendar_events_v2_';
  var subscribers=[];
  var contextUnsubscribe=null;
  var attachTimer=null;
  var active=null;
  var bindGeneration=0;
  var currentEvents=[];
  var lastMeta={source:'idle',ready:false,error:null,migration:'none'};

  var IMMUTABLE={_key:true,id:true,householdId:true,createdByUid:true,createdAt:true,schemaVersion:true};

  function now(){return Date.now();}
  function clone(v){if(v===undefined)return undefined;try{return JSON.parse(JSON.stringify(v));}catch(e){return v;}}
  function safeKey(v){return'id_'+String(v==null?'cal_'+now():v).replace(/[.#$\[\]\/]/g,'_');}
  function makeId(){return'cal_'+now().toString(36)+'_'+Math.random().toString(36).slice(2,9);}
  function db(){try{return window.fbDb||(window.firebase&&window.firebase.database&&window.firebase.database())||null;}catch(e){return null;}}
  function snapshot(){try{return window.HouseholdContext&&HouseholdContext.snapshot?HouseholdContext.snapshot():null;}catch(e){return null;}}
  function capture(){try{return window.HouseholdContext&&HouseholdContext.capture?HouseholdContext.capture():null;}catch(e){return null;}}
  function isCurrent(token){try{return !!(window.HouseholdContext&&HouseholdContext.isCurrent&&HouseholdContext.isCurrent(token));}catch(e){return false;}}
  function validContext(ctx){return !!(ctx&&ctx.ready===true&&ctx.uid&&ctx.householdId);}
  function cacheKey(uid,householdId){return CACHE_PREFIX+String(uid||'unresolved-user')+'_'+String(householdId||'unresolved-household');}
  function readCache(uid,householdId){if(!uid||!householdId)return[];try{var raw=localStorage.getItem(cacheKey(uid,householdId)),parsed=raw?JSON.parse(raw):[];return Array.isArray(parsed)?parsed:[];}catch(e){return[];}}
  function writeCache(uid,householdId,rows){if(!uid||!householdId)return;try{localStorage.setItem(cacheKey(uid,householdId),JSON.stringify(Array.isArray(rows)?rows:[]));}catch(e){}}

  function rawRows(value){
    if(!value)return[];
    var source=value;
    if(source&&source.items&&typeof source.items==='object'&&!Array.isArray(source.items))source=source.items;
    if(Array.isArray(source))return source.map(function(row,index){return row?{key:row._key||safeKey(row.id!=null?row.id:index),value:row}:null;}).filter(Boolean);
    if(typeof source!=='object')return[];
    return Object.keys(source).map(function(key){
      if(key==='schemaVersion'||key==='initialized'||key==='migratedAt'||key==='migratedFrom'||key==='updatedAt'||key==='updatedBy')return null;
      var row=source[key];
      return row&&typeof row==='object'&&!Array.isArray(row)?{key:key,value:row}:null;
    }).filter(Boolean);
  }
  function identity(entry){
    var row=entry&&entry.value||{};
    if(row.id!==undefined&&row.id!==null&&row.id!=='')return String(row.id);
    return [String(row.title||''),String(row.date||''),String(row.time||'')].join('|');
  }
  function normalizeExisting(input,key,ctx){
    var row=clone(input||{})||{};
    var id=row.id!==undefined&&row.id!==null&&row.id!==''?String(row.id):String(key||makeId()).replace(/^id_/,'');
    row.id=id;
    row._key=key||row._key||safeKey(id);
    row.householdId=ctx.householdId;
    row.title=String(row.title||'Afspraak');
    row.date=String(row.date||'');
    row.time=String(row.time||'');
    row.description=String(row.description||'');
    row.color=String(row.color||'#2d5a27');
    row.who=row.who==null?null:String(row.who);
    row._imported=!!row._imported;
    if(row.googleSync&&typeof row.googleSync!=='object')delete row.googleSync;
    row.createdByUid=row.createdByUid||row.createdBy||ctx.uid;
    row.createdAt=Number(row.createdAt)||now();
    row.updatedByUid=row.updatedByUid||row.updatedBy||row.createdByUid||ctx.uid;
    row.updatedAt=Number(row.updatedAt)||row.createdAt||now();
    row.schemaVersion=SCHEMA_VERSION;
    return row;
  }
  function normalizeCreate(input,key,ctx){
    input=clone(input||{})||{};
    var id=String(input.id||makeId()),row=normalizeExisting(input,key||safeKey(id),ctx);
    row.id=id;row._key=key||safeKey(id);row.householdId=ctx.householdId;
    row.createdByUid=ctx.uid;row.createdAt=Number(input.createdAt)||now();row.updatedByUid=ctx.uid;row.updatedAt=now();row.schemaVersion=SCHEMA_VERSION;
    return row;
  }
  function sealMutation(server,patch,key,ctx){
    var base=normalizeExisting(server||{},key,ctx),next=clone(base)||{},changed=patch&&typeof patch==='object'?patch:{};
    Object.keys(changed).forEach(function(prop){if(!IMMUTABLE[prop])next[prop]=clone(changed[prop]);});
    next._key=key;next.id=base.id;next.householdId=ctx.householdId;next.createdByUid=base.createdByUid||ctx.uid;next.createdAt=Number(base.createdAt)||now();next.updatedByUid=ctx.uid;next.updatedAt=now();next.schemaVersion=SCHEMA_VERSION;
    next.title=String(next.title||'Afspraak');next.date=String(next.date||'');next.time=String(next.time||'');next.description=String(next.description||'');next.color=String(next.color||'#2d5a27');next.who=next.who==null?null:String(next.who);next._imported=!!next._imported;
    if(next.googleSync&&typeof next.googleSync!=='object')delete next.googleSync;
    return next;
  }
  function listFromValue(value,ctx){return rawRows(value).map(function(entry){return normalizeExisting(entry.value,entry.key,ctx);}).filter(function(row){return row.date;}).sort(function(a,b){var d=String(a.date).localeCompare(String(b.date));return d||String(a.time||'').localeCompare(String(b.time||''));});}
  function emit(rows,meta){
    currentEvents=Array.isArray(rows)?rows.map(clone):[];
    lastMeta=Object.assign({source:'unknown',ready:!!active,error:null,migration:'none'},meta||{});
    if(lastMeta.uid&&lastMeta.householdId)writeCache(lastMeta.uid,lastMeta.householdId,currentEvents);
    subscribers.slice().forEach(function(fn){try{fn(currentEvents.map(clone),clone(lastMeta));}catch(e){console.warn('[CalendarEventHouseholdRepository] subscriber failed',e);}});
    try{window.dispatchEvent(new CustomEvent('familyapp:calendar-repository',{detail:{events:currentEvents.map(clone),meta:clone(lastMeta)}}));}catch(e){}
  }
  function eventIdentity(row){return String(row&&row.id!=null?row.id:row&&row._key!=null?row._key:'');}
  function acknowledge(binding,type,row){
    if(!bindingCurrent(binding)||!row)return;
    var wanted=eventIdentity(row),next=currentEvents.map(clone);
    if(type==='delete'){
      next=next.filter(function(item){return eventIdentity(item)!==wanted;});
    }else{
      var replaced=false;
      next=next.map(function(item){if(eventIdentity(item)!==wanted)return item;replaced=true;return clone(row);});
      if(!replaced)next.push(clone(row));
      next.sort(function(a,b){var d=String(a&&a.date||'').localeCompare(String(b&&b.date||''));return d||String(a&&a.time||'').localeCompare(String(b&&b.time||''));});
    }
    emit(next,{source:'mutation-ack',ready:true,uid:binding.context.uid,householdId:binding.context.householdId,revision:binding.context.revision,migration:binding.migrationState||'none'});
  }
  function subscribe(fn){if(typeof fn!=='function')return function(){};subscribers.push(fn);try{fn(currentEvents.map(clone),clone(lastMeta));}catch(e){}return function(){var i=subscribers.indexOf(fn);if(i>=0)subscribers.splice(i,1);};}
  function bindingCurrent(binding){return !!(binding&&active===binding&&binding.generation===bindGeneration&&isCurrent(binding.token));}
  function unbind(reason,clearProjection){if(active&&active.ref&&active.handler){try{active.ref.off('value',active.handler);}catch(e){}}active=null;bindGeneration++;if(clearProjection!==false)emit([],{source:reason||'unbound',ready:false,uid:null,householdId:null,migration:'none'});}
  function publish(binding,value,source,migration){if(!bindingCurrent(binding))return;emit(listFromValue(value,binding.context),{source:source||'firebase',ready:true,uid:binding.context.uid,householdId:binding.context.householdId,revision:binding.context.revision,migration:migration||binding.migrationState||'none'});}

  // Canonical schema-v2 rows always win. For pre-v2 conflicts, shared/calendar
  // wins over the older families/{householdId}/cal copy.
  function reconcile(currentValue,sharedValue,rootLegacyValue,ctx){
    var result={},canonicalByIdentity={},rootKeyByIdentity={},takenByShared={};
    rawRows(currentValue).forEach(function(entry){var id=identity(entry);if(id)rootKeyByIdentity[id]=entry.key;if(Number(entry.value&&entry.value.schemaVersion||0)>=SCHEMA_VERSION){var row=normalizeExisting(entry.value,entry.key,ctx);result[entry.key]=row;if(id)canonicalByIdentity[id]=entry.key;}});
    rawRows(sharedValue).forEach(function(entry,index){var id=identity(entry)||String(index);if(canonicalByIdentity[id])return;var key=rootKeyByIdentity[id]||entry.key||safeKey(id),row=normalizeExisting(entry.value,key,ctx);row.migratedFrom='shared/calendar';row.migratedAt=now();row.updatedByUid=ctx.uid;result[key]=row;takenByShared[id]=true;});
    rawRows(rootLegacyValue).forEach(function(entry,index){var id=identity(entry)||String(index);if(canonicalByIdentity[id]||takenByShared[id])return;var key=rootKeyByIdentity[id]||entry.key||safeKey(id);if(result[key])key=safeKey(id)+'_legacy';var row=normalizeExisting(entry.value,key,ctx);row.migratedFrom='families/{householdId}/cal';row.migratedAt=now();row.updatedByUid=ctx.uid;result[key]=row;});
    rawRows(currentValue).forEach(function(entry,index){var id=identity(entry)||String(index);if(canonicalByIdentity[id]||takenByShared[id]||Object.keys(result).some(function(k){return identity({key:k,value:result[k]})===id;}))return;var key=entry.key||safeKey(id);if(result[key])key=safeKey(id)+'_root';result[key]=normalizeExisting(entry.value,key,ctx);});
    return result;
  }
  function ensureMigrated(binding,canonicalValue){
    if(!bindingCurrent(binding)||binding.migrationChecked||binding.migrationInFlight)return;
    binding.migrationInFlight=true;binding.migrationState='checking-migration-marker';
    var markerRef=binding.db.ref('families/'+binding.context.householdId+'/calendarMigrations/v2LegacyToCanonical');
    var sharedRef=binding.db.ref('families/'+binding.context.householdId+'/shared/calendar');
    var rootLegacyRef=binding.db.ref('families/'+binding.context.householdId+'/cal');
    markerRef.once('value').then(function(s){
      if(!bindingCurrent(binding))return null;
      var marker=s&&s.val?s.val():null;
      if(marker&&marker.status==='complete'){
        binding.migrationChecked=true;binding.migrationInFlight=false;binding.migrationState='complete';
        return binding.ref.once('value').then(function(latest){if(bindingCurrent(binding))publish(binding,latest&&latest.val?latest.val():null,'firebase','legacy-reconciled');});
      }
      return Promise.all([sharedRef.once('value'),rootLegacyRef.once('value')]).then(function(values){
        if(!bindingCurrent(binding))return null;
        var shared=values[0]&&values[0].val?values[0].val():null,rootLegacy=values[1]&&values[1].val?values[1].val():null;
        binding.migrationState='reconciling-legacy-calendar';
        return new Promise(function(resolve,reject){
          binding.ref.transaction(function(current){if(!bindingCurrent(binding))return;return reconcile(current,shared,rootLegacy,binding.context);},function(error,committed,snap){if(error){reject(error);return;}if(!bindingCurrent(binding)){resolve(null);return;}resolve({strategy:committed?'same-household-reconciled':'canonical-unchanged',value:snap&&snap.val?snap.val():canonicalValue});},false);
        });
      });
    }).then(function(result){
      if(!result||!bindingCurrent(binding)||binding.migrationChecked)return null;
      return markerRef.set({status:'complete',source:'shared/calendar + families/{householdId}/cal',strategy:result.strategy,completedAt:now(),byUid:binding.context.uid}).then(function(){
        if(!bindingCurrent(binding))return;
        binding.migrationChecked=true;binding.migrationInFlight=false;binding.migrationState='complete';
        return binding.ref.once('value').then(function(latest){if(bindingCurrent(binding))publish(binding,latest&&latest.val?latest.val():null,'firebase','legacy-reconciled');});
      });
    }).catch(function(error){if(!bindingCurrent(binding))return;binding.migrationChecked=true;binding.migrationInFlight=false;binding.migrationState='legacy-reconcile-failed';publish(binding,canonicalValue,'firebase','legacy-reconcile-failed');console.warn('[CalendarEventHouseholdRepository] legacy reconciliation failed',error);});
  }
  function bind(ctx){
    unbind('context-rebind',false);
    if(!validContext(ctx)){emit([],{source:'context-not-ready',ready:false,uid:ctx&&ctx.uid||null,householdId:ctx&&ctx.householdId||null,migration:'none'});return false;}
    var database=db();if(!database){emit(readCache(ctx.uid,ctx.householdId),{source:'cache-no-db',ready:false,uid:ctx.uid,householdId:ctx.householdId,revision:ctx.revision,error:'FIREBASE_DATABASE_UNAVAILABLE'});return false;}
    var token=capture();if(!token||!isCurrent(token))return false;
    var generation=++bindGeneration,ref=database.ref('families/'+ctx.householdId+'/calendarEvents');
    var binding={generation:generation,context:{uid:ctx.uid,householdId:ctx.householdId,revision:ctx.revision},token:token,db:database,ref:ref,handler:null,migrationChecked:false,migrationInFlight:false,migrationState:'none'};active=binding;
    var cached=readCache(ctx.uid,ctx.householdId);emit(cached,{source:cached.length?'household-cache':'binding',ready:true,uid:ctx.uid,householdId:ctx.householdId,revision:ctx.revision,migration:'none'});
    binding.handler=function(s){if(!bindingCurrent(binding))return;var value=s&&s.val?s.val():null;if(!binding.migrationChecked){ensureMigrated(binding,value);return;}publish(binding,value,rawRows(value).length?'firebase':'firebase-empty',binding.migrationState);};
    ref.on('value',binding.handler,function(error){if(!bindingCurrent(binding))return;emit(readCache(ctx.uid,ctx.householdId),{source:'firebase-error-cache',ready:true,uid:ctx.uid,householdId:ctx.householdId,revision:ctx.revision,migration:binding.migrationState,error:error&&error.message||String(error||'CALENDAR_LISTENER_ERROR')});});
    return true;
  }
  function handleContext(ctx){if(!validContext(ctx)){unbind('context-cleared',true);return;}if(active&&active.context.uid===ctx.uid&&active.context.householdId===ctx.householdId&&active.context.revision===ctx.revision)return;bind(ctx);}
  function start(){
    if(!contextUnsubscribe&&window.HouseholdContext&&typeof HouseholdContext.subscribe==='function')contextUnsubscribe=HouseholdContext.subscribe(handleContext);
    var ctx=snapshot();if(validContext(ctx))handleContext(ctx);
    if(!validContext(ctx)&&!attachTimer){var tries=0;attachTimer=setInterval(function(){tries++;var next=snapshot();if(validContext(next)){clearInterval(attachTimer);attachTimer=null;handleContext(next);}else if(tries>300){clearInterval(attachTimer);attachTimer=null;}},100);}
    return true;
  }
  function requireBinding(){var ctx=snapshot();if(!validContext(ctx))throw new Error('Agenda household context is not ready');if(!active||active.context.uid!==ctx.uid||active.context.householdId!==ctx.householdId||active.context.revision!==ctx.revision)bind(ctx);if(!active||!bindingCurrent(active))throw new Error('Agenda household binding is stale');return active;}
  function findById(id){var wanted=String(id||'');return currentEvents.find(function(row){return String(row.id)===wanted||String(row._key)===wanted;})||null;}
  function create(input){
    var binding;try{binding=requireBinding();}catch(e){return Promise.reject(e);}var row=normalizeCreate(input,null,binding.context);if(!row.title.trim()||!row.date){return Promise.reject(new Error('Titel en datum zijn verplicht'));}var key=row._key,ref=binding.ref.child(key),token=binding.token;
    return ref.set(row).then(function(){if(!bindingCurrent(binding)||!isCurrent(token))throw new Error('Agenda context changed during create');acknowledge(binding,'create',row);return clone(row);});
  }
  function updateOne(id,patch){
    var binding;try{binding=requireBinding();}catch(e){return Promise.reject(e);}var existing=findById(id);if(!existing)return Promise.reject(new Error('Afspraak niet gevonden'));var key=existing._key||safeKey(existing.id),ref=binding.ref.child(key),token=binding.token;
    return new Promise(function(resolve,reject){ref.transaction(function(server){if(!bindingCurrent(binding)||!isCurrent(token))return;return sealMutation(server||existing,patch,key,binding.context);},function(error,committed,snap){if(error){reject(error);return;}if(!committed||!bindingCurrent(binding)||!isCurrent(token)){reject(new Error('Agenda update geannuleerd door contextwissel'));return;}var updated=normalizeExisting(snap&&snap.val?snap.val():existing,key,binding.context);acknowledge(binding,'update',updated);resolve(updated);},false);});
  }
  function remove(id){
    var binding;try{binding=requireBinding();}catch(e){return Promise.reject(e);}var existing=findById(id);if(!existing)return Promise.resolve(false);var key=existing._key||safeKey(existing.id),token=binding.token;
    return binding.ref.child(key).set(null).then(function(){if(!bindingCurrent(binding)||!isCurrent(token))throw new Error('Agenda context changed during delete');acknowledge(binding,'delete',existing);return true;});
  }
  function stop(){if(contextUnsubscribe){try{contextUnsubscribe();}catch(e){}contextUnsubscribe=null;}if(attachTimer){clearInterval(attachTimer);attachTimer=null;}unbind('stopped',true);}
  function status(){var ctx=snapshot();return{version:VERSION,schemaVersion:SCHEMA_VERSION,ready:!!(active&&bindingCurrent(active)),uid:ctx&&ctx.uid||null,householdId:ctx&&ctx.householdId||null,count:currentEvents.length,source:lastMeta.source,migration:lastMeta.migration,error:lastMeta.error||null};}

  window.CalendarEventHouseholdRepository={version:VERSION,start:start,stop:stop,list:function(){return currentEvents.map(clone);},get:function(id){var row=findById(id);return row?clone(row):null;},subscribe:subscribe,create:create,updateOne:updateOne,remove:remove,status:status};
  window.CalendarEventRepository=window.CalendarEventHouseholdRepository;
  start();
})();
