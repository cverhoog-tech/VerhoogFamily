'use strict';
// ============================================================
// MEAL PLAN HOUSEHOLD REPOSITORY v1.0.0
// STEP 5 canonical household meal-plan persistence boundary.
//
// Source of truth: families/{householdId}/mealPlans/{mealKey}
// Identity authority: HouseholdContext (UID + household + revision)
// Recipe links are stable IDs, never recipe names or array indexes.
// Generic legacy localStorage meal data is NEVER migration authority.
// ============================================================
(function(){
  if(window.MealPlanHouseholdRepository)return;

  var VERSION='1.0.0';
  var SCHEMA_VERSION=2;
  var CACHE_PREFIX='familyapp_mealplans_v2_';
  var subscribers=[];
  var contextUnsubscribe=null;
  var attachTimer=null;
  var active=null;
  var bindGeneration=0;
  var currentMeals=[];
  var lastMeta={source:'idle',ready:false,error:null,migration:'none'};

  var IMMUTABLE={_key:true,id:true,householdId:true,createdByUid:true,createdAt:true,schemaVersion:true};

  function now(){return Date.now();}
  function clone(v){if(v===undefined)return undefined;try{return JSON.parse(JSON.stringify(v));}catch(e){return v;}}
  function safeKey(v){return 'id_'+String(v==null?'meal_'+now():v).replace(/[.#$\[\]\/]/g,'_');}
  function makeId(){return 'meal_'+now().toString(36)+'_'+Math.random().toString(36).slice(2,9);}
  function db(){try{return window.fbDb||(window.firebase&&window.firebase.database&&window.firebase.database())||null;}catch(e){return null;}}
  function snapshot(){try{return window.HouseholdContext&&HouseholdContext.snapshot?HouseholdContext.snapshot():null;}catch(e){return null;}}
  function capture(){try{return window.HouseholdContext&&HouseholdContext.capture?HouseholdContext.capture():null;}catch(e){return null;}}
  function isCurrent(token){try{return !!(window.HouseholdContext&&HouseholdContext.isCurrent&&HouseholdContext.isCurrent(token));}catch(e){return false;}}
  function validContext(ctx){return !!(ctx&&ctx.ready===true&&ctx.uid&&ctx.householdId);}
  function cacheKey(uid,householdId){return CACHE_PREFIX+String(uid||'unresolved-user')+'_'+String(householdId||'unresolved-household');}
  function readCache(uid,householdId){if(!uid||!householdId)return[];try{var raw=localStorage.getItem(cacheKey(uid,householdId));var parsed=raw?JSON.parse(raw):[];return Array.isArray(parsed)?parsed:[];}catch(e){return[];}}
  function writeCache(uid,householdId,rows){if(!uid||!householdId)return;try{localStorage.setItem(cacheKey(uid,householdId),JSON.stringify(Array.isArray(rows)?rows:[]));}catch(e){}}
  function rawRows(value){
    if(!value)return[];
    var source=value;
    if(source&&source.items&&typeof source.items==='object'&&!Array.isArray(source.items))source=source.items;
    if(Array.isArray(source))return source.map(function(row,index){return row?{key:row._key||safeKey(row.id!=null?row.id:index),value:row}:null;}).filter(Boolean);
    if(typeof source!=='object')return[];
    return Object.keys(source).map(function(key){var row=source[key];if(!row||typeof row!=='object'||Array.isArray(row))return null;return{key:key,value:row};}).filter(Boolean);
  }
  function normalizeType(v){v=String(v||'dinner').toLowerCase();return v==='breakfast'||v==='lunch'||v==='dinner'?v:'dinner';}
  function normalizeExisting(row,key,ctx){
    row=clone(row||{})||{};
    var id=row.id!=null&&row.id!==''?String(row.id):String(key||makeId()).replace(/^id_/, '');
    var recipeId=row.recipeId==null||row.recipeId===''?null:String(row.recipeId);
    row.id=id;
    row._key=key||row._key||safeKey(id);
    row.householdId=ctx.householdId;
    row.date=String(row.date||'');
    row.mealType=normalizeType(row.mealType||row.slot);
    row.recipeId=recipeId;
    row.recipeRef=recipeId?{id:recipeId,householdId:ctx.householdId,schemaVersion:1}:null;
    row.title=String(row.title||row.recipeTitleSnapshot||'Maaltijd');
    row.recipeTitleSnapshot=String(row.recipeTitleSnapshot||row.title||'Maaltijd');
    row.persons=Math.max(1,parseInt(row.persons,10)||4);
    row.notes=String(row.notes||'');
    row.emoji=String(row.emoji||'🍽️');
    row.createdByUid=row.createdByUid||row.createdBy||row.who||ctx.uid;
    row.createdAt=Number(row.createdAt)||now();
    row.updatedByUid=row.updatedByUid||row.updatedBy||row.createdByUid||ctx.uid;
    row.updatedAt=Number(row.updatedAt)||row.createdAt||now();
    row.schemaVersion=SCHEMA_VERSION;
    return row;
  }
  function recipeForId(recipeId,ctx){
    if(recipeId==null||recipeId==='')return null;
    var store=window.RecipeStore;
    if(!store||typeof store.get!=='function')return null;
    var recipe=store.get(String(recipeId));
    if(!recipe)return null;
    if(recipe.householdId&&String(recipe.householdId)!==String(ctx.householdId))return null;
    return recipe;
  }
  function validateRecipeReference(recipeId,ctx,allowMissing){
    if(recipeId==null||recipeId==='')return null;
    var id=String(recipeId),store=window.RecipeStore;
    if(!store||typeof store.get!=='function')return id;
    var recipe=recipeForId(id,ctx);
    if(recipe)return id;
    if(allowMissing)return id;
    var err=new Error('Recept hoort niet bij het actieve gezin of bestaat niet');
    err.code='MEAL_RECIPE_REFERENCE_INVALID';
    throw err;
  }
  function normalizeCreate(input,key,ctx){
    input=clone(input||{})||{};
    var id=String(input.id||makeId());
    var recipeId=validateRecipeReference(input.recipeId,ctx,false);
    var recipe=recipeId?recipeForId(recipeId,ctx):null;
    input.id=id;
    input.recipeId=recipeId;
    input.title=String(input.title||(recipe&&recipe.name)||'Maaltijd');
    input.recipeTitleSnapshot=String((recipe&&recipe.name)||input.title||'Maaltijd');
    var row=normalizeExisting(input,key||safeKey(id),ctx);
    row.createdByUid=ctx.uid;row.createdAt=Number(input.createdAt)||now();row.updatedByUid=ctx.uid;row.updatedAt=now();
    return row;
  }
  function sealMutation(server,patch,key,ctx){
    var base=normalizeExisting(server||{},key,ctx),next=clone(base)||{},changed=patch&&typeof patch==='object'?patch:{};
    Object.keys(changed).forEach(function(prop){if(!IMMUTABLE[prop]&&prop!=='recipeRef'&&prop!=='recipeTitleSnapshot')next[prop]=clone(changed[prop]);});
    if(Object.prototype.hasOwnProperty.call(changed,'recipeId')){
      next.recipeId=validateRecipeReference(changed.recipeId,ctx,false);
      var recipe=next.recipeId?recipeForId(next.recipeId,ctx):null;
      if(recipe){next.recipeTitleSnapshot=String(recipe.name||next.title||'Maaltijd');if(!Object.prototype.hasOwnProperty.call(changed,'title'))next.title=next.recipeTitleSnapshot;}
      else if(!next.recipeId)next.recipeTitleSnapshot=String(next.title||'Maaltijd');
    }else{
      next.recipeId=validateRecipeReference(base.recipeId,ctx,true);
      next.recipeTitleSnapshot=base.recipeTitleSnapshot||base.title||'Maaltijd';
    }
    next._key=key;next.id=base.id;next.householdId=ctx.householdId;next.createdByUid=base.createdByUid||ctx.uid;next.createdAt=Number(base.createdAt)||now();next.updatedByUid=ctx.uid;next.updatedAt=now();next.schemaVersion=SCHEMA_VERSION;
    next.mealType=normalizeType(next.mealType);next.date=String(next.date||'');next.recipeRef=next.recipeId?{id:String(next.recipeId),householdId:ctx.householdId,schemaVersion:1}:null;next.title=String(next.title||next.recipeTitleSnapshot||'Maaltijd');next.recipeTitleSnapshot=String(next.recipeTitleSnapshot||next.title||'Maaltijd');next.persons=Math.max(1,parseInt(next.persons,10)||4);next.notes=String(next.notes||'');next.emoji=String(next.emoji||'🍽️');
    return next;
  }
  function listFromValue(value,ctx){return rawRows(value).map(function(entry){return normalizeExisting(entry.value,entry.key,ctx);}).filter(function(r){return r.date;}).sort(function(a,b){var d=String(a.date).localeCompare(String(b.date));return d||String(a.mealType).localeCompare(String(b.mealType));});}
  function emit(rows,meta){currentMeals=Array.isArray(rows)?rows.map(clone):[];lastMeta=Object.assign({source:'unknown',ready:!!active,error:null,migration:'none'},meta||{});if(lastMeta.uid&&lastMeta.householdId)writeCache(lastMeta.uid,lastMeta.householdId,currentMeals);subscribers.slice().forEach(function(fn){try{fn(currentMeals.map(clone),clone(lastMeta));}catch(e){console.warn('[MealPlanHouseholdRepository] subscriber failed',e);}});try{window.dispatchEvent(new CustomEvent('familyapp:meal-plan-repository',{detail:{meals:currentMeals.map(clone),meta:clone(lastMeta)}}));}catch(e){}}
  function subscribe(fn){if(typeof fn!=='function')return function(){};subscribers.push(fn);try{fn(currentMeals.map(clone),clone(lastMeta));}catch(e){}return function(){var i=subscribers.indexOf(fn);if(i>=0)subscribers.splice(i,1);};}
  function bindingCurrent(binding){return !!(binding&&active===binding&&binding.generation===bindGeneration&&isCurrent(binding.token));}
  function unbind(reason,clearProjection){if(active&&active.ref&&active.handler){try{active.ref.off('value',active.handler);}catch(e){}}active=null;bindGeneration++;if(clearProjection!==false)emit([],{source:reason||'unbound',ready:false,uid:null,householdId:null,migration:'none'});}
  function publish(binding,value,source,migration){if(!bindingCurrent(binding))return;emit(listFromValue(value,binding.context),{source:source||'firebase',ready:true,uid:binding.context.uid,householdId:binding.context.householdId,revision:binding.context.revision,migration:migration||binding.migrationState||'none'});}
  function reconcile(currentValue,legacyValue,ctx){
    var result={};
    rawRows(currentValue).forEach(function(entry){var row=normalizeExisting(entry.value,entry.key,ctx);result[entry.key]=row;});
    rawRows(legacyValue).forEach(function(entry,index){var identity=String(entry.value&&entry.value.id!=null?entry.value.id:entry.key||index),existingKey=Object.keys(result).find(function(k){return String(result[k].id)===identity;});if(existingKey&&Number(result[existingKey].schemaVersion||0)>=SCHEMA_VERSION)return;var key=existingKey||entry.key||safeKey(identity),row=normalizeExisting(entry.value,key,ctx);row.migratedFrom='shared/mealPlans';row.migratedAt=now();row.updatedByUid=ctx.uid;result[key]=row;});
    return result;
  }
  function ensureMigrated(binding,canonicalValue){
    if(!bindingCurrent(binding)||binding.migrationChecked||binding.migrationInFlight)return;
    binding.migrationInFlight=true;binding.migrationState='checking-migration-marker';
    var markerRef=binding.db.ref('families/'+binding.context.householdId+'/mealPlanMigrations/v2SharedToCanonical');
    var legacyRef=binding.db.ref('families/'+binding.context.householdId+'/shared/mealPlans');
    markerRef.once('value').then(function(s){if(!bindingCurrent(binding))return null;var marker=s&&s.val?s.val():null;if(marker&&marker.status==='complete'){binding.migrationChecked=true;binding.migrationInFlight=false;binding.migrationState='complete';return binding.ref.once('value').then(function(latest){if(bindingCurrent(binding))publish(binding,latest&&latest.val?latest.val():null,'firebase','legacy-reconciled');});}return legacyRef.once('value').then(function(ls){if(!bindingCurrent(binding))return null;var legacy=ls&&ls.val?ls.val():null;binding.migrationState='reconciling-legacy-meals';return new Promise(function(resolve,reject){binding.ref.transaction(function(current){if(!bindingCurrent(binding))return;return reconcile(current,legacy,binding.context);},function(error,committed,snap){if(error){reject(error);return;}if(!bindingCurrent(binding)){resolve(null);return;}resolve({value:snap&&snap.val?snap.val():canonicalValue,strategy:committed?'same-household-reconciled':'canonical-unchanged'});},false);});});}).then(function(result){if(!result||!bindingCurrent(binding)||binding.migrationChecked)return null;return markerRef.set({status:'complete',source:'shared/mealPlans',strategy:result.strategy,completedAt:now(),byUid:binding.context.uid}).then(function(){if(!bindingCurrent(binding))return;binding.migrationChecked=true;binding.migrationInFlight=false;binding.migrationState='complete';return binding.ref.once('value').then(function(latest){if(bindingCurrent(binding))publish(binding,latest&&latest.val?latest.val():null,'firebase','legacy-reconciled');});});}).catch(function(error){if(!bindingCurrent(binding))return;binding.migrationChecked=true;binding.migrationInFlight=false;binding.migrationState='legacy-reconcile-failed';publish(binding,canonicalValue,'firebase','legacy-reconcile-failed');console.warn('[MealPlanHouseholdRepository] legacy reconciliation failed',error);});
  }
  function bind(ctx){
    unbind('context-rebind',false);
    if(!validContext(ctx)){emit([],{source:'context-not-ready',ready:false,uid:ctx&&ctx.uid||null,householdId:ctx&&ctx.householdId||null,migration:'none'});return false;}
    var database=db();if(!database){emit(readCache(ctx.uid,ctx.householdId),{source:'cache-no-db',ready:false,uid:ctx.uid,householdId:ctx.householdId,revision:ctx.revision,error:'FIREBASE_DATABASE_UNAVAILABLE'});return false;}
    var token=capture();if(!token||!isCurrent(token))return false;
    var generation=++bindGeneration,ref=database.ref('families/'+ctx.householdId+'/mealPlans');
    var binding={generation:generation,context:{uid:ctx.uid,householdId:ctx.householdId,revision:ctx.revision},token:token,db:database,ref:ref,handler:null,migrationChecked:false,migrationInFlight:false,migrationState:'none'};active=binding;
    var cached=readCache(ctx.uid,ctx.householdId);emit(cached,{source:cached.length?'household-cache':'binding',ready:true,uid:ctx.uid,householdId:ctx.householdId,revision:ctx.revision,migration:'none'});
    binding.handler=function(s){if(!bindingCurrent(binding))return;var value=s&&s.val?s.val():null;if(!binding.migrationChecked){ensureMigrated(binding,value);return;}publish(binding,value,rawRows(value).length?'firebase':'firebase-empty',binding.migrationState);};
    ref.on('value',binding.handler,function(error){if(!bindingCurrent(binding))return;emit(readCache(ctx.uid,ctx.householdId),{source:'firebase-error-cache',ready:true,uid:ctx.uid,householdId:ctx.householdId,revision:ctx.revision,migration:binding.migrationState,error:error&&error.message||String(error||'MEAL_LISTENER_ERROR')});});
    return true;
  }
  function handleContext(ctx){if(!validContext(ctx)){unbind('context-cleared',true);return;}if(active&&active.context.uid===ctx.uid&&active.context.householdId===ctx.householdId&&active.context.revision===ctx.revision)return;bind(ctx);}
  function start(){
    if(!contextUnsubscribe&&window.HouseholdContext&&typeof HouseholdContext.subscribe==='function')contextUnsubscribe=HouseholdContext.subscribe(handleContext);
    var ctx=snapshot();if(validContext(ctx))handleContext(ctx);
    if(!validContext(ctx)&&!attachTimer){var tries=0;attachTimer=setInterval(function(){tries++;var next=snapshot();if(validContext(next)){clearInterval(attachTimer);attachTimer=null;handleContext(next);}else if(tries>300){clearInterval(attachTimer);attachTimer=null;}},100);}
    return true;
  }
  function requireBinding(){var ctx=snapshot();if(!validContext(ctx))throw new Error('Maaltijdopslag wacht op je gezinscontext');if(!active||active.context.uid!==ctx.uid||active.context.householdId!==ctx.householdId||active.context.revision!==ctx.revision)bind(ctx);if(!active)throw new Error('Maaltijdopslag is niet beschikbaar');var token=capture();if(!token||!isCurrent(token))throw new Error('Gezinscontext veranderde tijdens maaltijdactie');return{binding:active,token:token,context:ctx};}
  function keyForId(id){var wanted=String(id||'');var row=currentMeals.find(function(m){return String(m.id)===wanted||String(m._key)===wanted;});return row&&row._key||safeKey(wanted);}
  function create(input){var guard;try{guard=requireBinding();}catch(e){return Promise.reject(e);}var row;try{row=normalizeCreate(input,null,guard.context);}catch(e){return Promise.reject(e);}if(!row.date)return Promise.reject(new Error('Datum ontbreekt'));var key=safeKey(row.id),ref=guard.binding.ref.child(key);return ref.set(row).then(function(){if(!isCurrent(guard.token))throw new Error('Gezinscontext veranderde tijdens maaltijd opslaan');return clone(row);});}
  function updateOne(id,patch){var guard;try{guard=requireBinding();}catch(e){return Promise.reject(e);}var key=keyForId(id),ref=guard.binding.ref.child(key);return new Promise(function(resolve,reject){ref.transaction(function(server){if(!isCurrent(guard.token))return;var base=server||currentMeals.find(function(m){return String(m.id)===String(id);})||null;if(!base)return;try{return sealMutation(base,patch,key,guard.context);}catch(error){guard.validationError=error;return;}},function(error,committed,snap){if(guard.validationError){reject(guard.validationError);return;}if(error){reject(error);return;}if(!committed){reject(new Error('Maaltijd kon niet worden bijgewerkt'));return;}if(!isCurrent(guard.token)){reject(new Error('Gezinscontext veranderde tijdens maaltijd bewerken'));return;}resolve(normalizeExisting(snap.val(),key,guard.context));},false);});}
  function remove(id){var guard;try{guard=requireBinding();}catch(e){return Promise.reject(e);}var key=keyForId(id),ref=guard.binding.ref.child(key);return ref.set(null).then(function(){if(!isCurrent(guard.token))throw new Error('Gezinscontext veranderde tijdens maaltijd verwijderen');return true;});}
  function get(id){var wanted=String(id||'');var row=currentMeals.find(function(m){return String(m.id)===wanted||String(m._key)===wanted;});return row?clone(row):null;}
  function list(){return currentMeals.map(clone);}
  function status(){var ctx=snapshot();return{version:VERSION,schemaVersion:SCHEMA_VERSION,ready:!!active,uid:ctx&&ctx.uid||null,householdId:ctx&&ctx.householdId||null,count:currentMeals.length,canonicalPath:ctx&&ctx.householdId?'families/'+ctx.householdId+'/mealPlans':null,source:lastMeta.source,migration:lastMeta.migration,error:lastMeta.error||null};}
  function stop(){if(contextUnsubscribe){try{contextUnsubscribe();}catch(e){}contextUnsubscribe=null;}if(attachTimer){clearInterval(attachTimer);attachTimer=null;}unbind('stopped',true);}

  window.MealPlanHouseholdRepository={version:VERSION,start:start,stop:stop,list:list,get:get,subscribe:subscribe,create:create,updateOne:updateOne,remove:remove,status:status};
  window.MealPlanRepository=window.MealPlanHouseholdRepository;
  start();
})();
