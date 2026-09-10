'use strict';
// ============================================================
// MEAL PROPOSAL REPOSITORY v1.1.0 — STEP 13.5
// Canonical workflow persistence only. Meal planning itself remains owned by
// MealPlanStore/MealPlanHouseholdRepository; shopping remains owned by
// ShoppingListStore/ShoppingListHouseholdRepository.
// Path: families/{householdId}/mealProposals/{proposalId}
// ============================================================
(function(){
  if(window.MealProposalRepository)return;

  var VERSION='1.1.0';
  var SCHEMA_VERSION=1;
  var active=null,unsubscribeContext=null,attachTimer=null,generation=0;
  var projection={},subscribers=[],lastMeta={ready:false,source:'idle'};

  function clone(v){if(v===undefined)return undefined;try{return JSON.parse(JSON.stringify(v));}catch(e){return v;}}
  function now(){return Date.now();}
  function db(){try{return window.fbDb||(window.firebase&&firebase.database&&firebase.database())||null;}catch(e){return null;}}
  function context(){try{return window.HouseholdContext&&HouseholdContext.snapshot?HouseholdContext.snapshot():null;}catch(e){return null;}}
  function capture(){try{return window.HouseholdContext&&HouseholdContext.capture?HouseholdContext.capture():null;}catch(e){return null;}}
  function isCurrent(token){try{return !!(window.HouseholdContext&&HouseholdContext.isCurrent&&HouseholdContext.isCurrent(token));}catch(e){return false;}}
  function valid(c){return !!(c&&c.ready===true&&c.uid&&c.householdId);}
  function safeKey(v){return String(v==null?'':v).replace(/[.#$\[\]\/]/g,'_');}
  function makeId(){return 'mealprop_'+now().toString(36)+'_'+Math.random().toString(36).slice(2,9);}
  function map(v){return v&&typeof v==='object'?v:{};}

  function normalize(raw,key,c){
    raw=clone(raw||{})||{};
    var id=safeKey(raw.id||key||makeId());
    return {
      id:id,
      schemaVersion:SCHEMA_VERSION,
      householdId:c.householdId,
      status:String(raw.status||'pending'),
      proposerUid:String(raw.proposerUid||c.uid),
      recipeId:raw.recipeId!=null?String(raw.recipeId):null,
      recipeTitle:String(raw.recipeTitle||raw.title||'Maaltijd'),
      recipePhoto:raw.recipePhoto||null,
      date:String(raw.date||''),
      mealType:String(raw.mealType||'dinner'),
      persons:Math.max(1,parseInt(raw.persons,10)||4),
      note:String(raw.note||''),
      targetUids:Array.isArray(raw.targetUids)?raw.targetUids.map(String):[],
      counterProposal:raw.counterProposal&&typeof raw.counterProposal==='object'?clone(raw.counterProposal):null,
      acceptingByUid:raw.acceptingByUid||null,
      acceptingAt:Number(raw.acceptingAt)||null,
      acceptedByUid:raw.acceptedByUid||null,
      acceptedAt:Number(raw.acceptedAt)||null,
      rejectedByUid:raw.rejectedByUid||null,
      rejectedAt:Number(raw.rejectedAt)||null,
      plannedMealId:raw.plannedMealId||null,
      shoppingResult:raw.shoppingResult||null,
      createdAt:Number(raw.createdAt)||now(),
      createdByUid:raw.createdByUid||raw.proposerUid||c.uid,
      updatedAt:Number(raw.updatedAt)||Number(raw.createdAt)||now(),
      updatedByUid:raw.updatedByUid||c.uid
    };
  }

  function emit(value,meta){
    projection={};var c=context();
    if(valid(c))Object.keys(map(value)).forEach(function(k){if(value[k])projection[k]=normalize(value[k],k,c);});
    lastMeta=Object.assign({ready:!!active,source:'unknown'},meta||{});
    subscribers.slice().forEach(function(fn){try{fn(list(),clone(lastMeta));}catch(e){console.warn('[MealProposalRepository] subscriber failed',e);}});
    try{window.dispatchEvent(new CustomEvent('familyapp:meal-proposals',{detail:{rows:list(),meta:clone(lastMeta)}}));}catch(e){}
  }
  function list(){return Object.keys(projection).map(function(k){return clone(projection[k]);}).sort(function(a,b){return(b.createdAt||0)-(a.createdAt||0);});}
  function get(id){var r=projection[String(id||'')];return r?clone(r):null;}
  function subscribe(fn){if(typeof fn!=='function')return function(){};subscribers.push(fn);try{fn(list(),clone(lastMeta));}catch(e){}return function(){var i=subscribers.indexOf(fn);if(i>=0)subscribers.splice(i,1);};}
  function bindingCurrent(b){return !!(b&&active===b&&b.generation===generation&&isCurrent(b.token));}
  function unbind(reason){if(active&&active.ref&&active.handler)try{active.ref.off('value',active.handler);}catch(e){}active=null;generation++;emit({}, {ready:false,source:reason||'unbound'});}
  function bind(c){
    unbind('rebind');if(!valid(c))return false;var database=db();if(!database){emit({}, {ready:false,source:'no-db'});return false;}var token=capture();if(!token||!isCurrent(token))return false;
    var b={generation:++generation,token:token,context:{uid:c.uid,householdId:c.householdId,revision:c.revision},ref:database.ref('families/'+c.householdId+'/mealProposals'),handler:null};active=b;
    b.handler=function(snap){if(!bindingCurrent(b))return;emit(snap&&snap.val?snap.val():{}, {ready:true,source:'firebase',uid:c.uid,householdId:c.householdId});};
    b.ref.on('value',b.handler,function(err){if(bindingCurrent(b))emit(projection,{ready:true,source:'firebase-error',error:err&&err.message||String(err)});});
    return true;
  }
  function handleContext(c){if(!valid(c)){unbind('context-not-ready');return;}if(active&&active.context.uid===c.uid&&active.context.householdId===c.householdId&&active.context.revision===c.revision)return;bind(c);}
  function attach(){if(unsubscribeContext)return true;if(!window.HouseholdContext||typeof HouseholdContext.subscribe!=='function')return false;unsubscribeContext=HouseholdContext.subscribe(handleContext);return true;}
  function start(){if(attach())return true;if(attachTimer)return false;var n=0;attachTimer=setInterval(function(){n++;if(attach()||n>240){clearInterval(attachTimer);attachTimer=null;}},50);return false;}
  function requireBinding(){var b=active;if(!bindingCurrent(b))throw new Error('ACTIVE_HOUSEHOLD_REQUIRED');return b;}

  function create(input){
    input=input||{};var b;try{b=requireBinding();}catch(e){return Promise.reject(e);}var id=safeKey(input.id||makeId()),stamp=now(),row=normalize(Object.assign({},input,{id:id,status:'pending',proposerUid:b.context.uid,createdAt:stamp,createdByUid:b.context.uid,updatedAt:stamp,updatedByUid:b.context.uid}),id,b.context),token=capture();
    return b.ref.child(id).set(row).then(function(){if(!isCurrent(token))throw new Error('STALE_HOUSEHOLD_CONTEXT');return clone(row);});
  }
  function update(id,patch){
    var b;try{b=requireBinding();}catch(e){return Promise.reject(e);}id=String(id||'');var current=get(id);if(!current)return Promise.reject(new Error('Voorstel niet gevonden'));var token=capture(),next=normalize(Object.assign({},current,patch||{},{id:id,updatedAt:now(),updatedByUid:b.context.uid}),id,b.context);
    return b.ref.child(id).set(next).then(function(){if(!isCurrent(token))throw new Error('STALE_HOUSEHOLD_CONTEXT');return clone(next);});
  }
  function transition(id,fromStatuses,patch){
    var b;try{b=requireBinding();}catch(e){return Promise.reject(e);}id=String(id||'');fromStatuses=Array.isArray(fromStatuses)?fromStatuses.map(String):[String(fromStatuses||'pending')];var token=capture(),ref=b.ref.child(id),committedValue=null;
    return new Promise(function(resolve,reject){
      ref.transaction(function(current){
        if(!current||fromStatuses.indexOf(String(current.status||'pending'))<0)return;
        var next=Object.assign({},current,patch||{},{id:id,updatedAt:now(),updatedByUid:b.context.uid});
        committedValue=next;return next;
      },function(error,committed,snapshot){
        if(error)return reject(error);
        if(!committed)return reject(new Error('PROPOSAL_STATE_CONFLICT'));
        if(!isCurrent(token))return reject(new Error('STALE_HOUSEHOLD_CONTEXT'));
        var raw=snapshot&&snapshot.val?snapshot.val():committedValue;
        resolve(normalize(raw,id,b.context));
      },false);
    });
  }
  function remove(id){var b;try{b=requireBinding();}catch(e){return Promise.reject(e);}return b.ref.child(String(id||'')).remove().then(function(){return true;});}
  function status(){var c=context();return{version:VERSION,schemaVersion:SCHEMA_VERSION,ready:!!(active&&valid(c)),uid:c&&c.uid||null,householdId:c&&c.householdId||null,count:list().length,path:c&&c.householdId?'families/'+c.householdId+'/mealProposals':null};}
  function stop(){if(unsubscribeContext){try{unsubscribeContext();}catch(e){}unsubscribeContext=null;}if(attachTimer){clearInterval(attachTimer);attachTimer=null;}unbind('stopped');}

  window.MealProposalRepository={version:VERSION,start:start,stop:stop,subscribe:subscribe,list:list,get:get,create:create,update:update,transition:transition,remove:remove,status:status};
  start();
})();
