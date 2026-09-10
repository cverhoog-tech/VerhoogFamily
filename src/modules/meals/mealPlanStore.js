'use strict';
// ============================================================
// MEAL PLAN STORE COMPATIBILITY FACADE v2.0.0
// STEP 5: MealPlanHouseholdRepository is the only persistence/listener owner.
// Existing Meals UI keeps using MealPlanStore/window.mealPlanData.
// ============================================================
(function(){
  if(window.MealPlanStore&&window.MealPlanStore.version==='2.0.0')return;

  var VERSION='2.0.0';
  var repoUnsubscribe=null;
  var subscribers=[];
  var rows=[];
  var lastMeta={source:'idle',ready:false};

  function clone(v){try{return JSON.parse(JSON.stringify(v));}catch(e){return v;}}
  function repo(){return window.MealPlanHouseholdRepository||window.MealPlanRepository||null;}
  function mirror(next){rows=Array.isArray(next)?next.map(clone):[];window.mealPlanData=rows.map(clone);window.mealPlanNextId=rows.length+1;return window.mealPlanData;}
  function publish(next,meta){mirror(next);lastMeta=clone(meta||{})||{};subscribers.slice().forEach(function(fn){try{fn(rows.map(clone),clone(lastMeta));}catch(e){console.warn('[MealPlanStore] subscriber failed',e);}});try{window.dispatchEvent(new CustomEvent('familyapp:meals:changed',{detail:{source:'MealPlanStore',rows:rows.map(clone),meta:clone(lastMeta)}}));}catch(e){}}
  function list(){var r=repo();return r&&typeof r.list==='function'?r.list():rows.map(clone);}
  function get(id){var r=repo();if(r&&typeof r.get==='function')return r.get(id);var wanted=String(id||'');var row=rows.find(function(m){return String(m.id)===wanted||String(m._key)===wanted;});return row?clone(row):null;}
  function subscribe(fn){if(typeof fn!=='function')return function(){};subscribers.push(fn);try{fn(list(),clone(lastMeta));}catch(e){}return function(){var i=subscribers.indexOf(fn);if(i>=0)subscribers.splice(i,1);};}
  function boot(){
    var r=repo();if(!r)return false;
    if(typeof r.start==='function')r.start();
    if(!repoUnsubscribe&&typeof r.subscribe==='function')repoUnsubscribe=r.subscribe(publish);
    return true;
  }
  function requireRepo(method){var r=repo();if(!r||typeof r[method]!=='function')throw new Error('Maaltijdopslag is niet beschikbaar');return r;}
  function create(input){var r;try{r=requireRepo('create');}catch(e){return Promise.reject(e);}return r.create(input||{}).then(function(record){return{record:clone(record),result:{mode:'firebase',source:'meal-plan-household-repository'}};});}
  function upsert(input){input=input||{};var id=String(input.id||'');if(!id)return create(input);var r;try{r=requireRepo('updateOne');}catch(e){return Promise.reject(e);}return r.updateOne(id,input).then(function(record){return{record:clone(record),result:{mode:'firebase',source:'meal-plan-household-repository'}};});}
  function remove(id){var r;try{r=requireRepo('remove');}catch(e){return Promise.reject(e);}return r.remove(id);}
  function removeSlot(date,mealType){var row=list().find(function(x){return x&&x.date===String(date||'')&&x.mealType===String(mealType||'dinner');});return row?remove(row.id):Promise.resolve(false);}
  function replaceSlot(input){input=input||{};var date=String(input.date||''),mealType=String(input.mealType||'dinner'),existing=list().find(function(x){return x&&x.date===date&&x.mealType===mealType;});return existing?upsert(Object.assign({},input,{id:existing.id})):create(input);}
  function status(){var r=repo(),base=r&&typeof r.status==='function'?r.status():{};return Object.assign({version:VERSION,ready:!!(base&&base.ready),count:list().length},base);}
  function stop(){if(repoUnsubscribe){try{repoUnsubscribe();}catch(e){}repoUnsubscribe=null;}rows=[];window.mealPlanData=[];}

  window.MealPlanStore={version:VERSION,boot:boot,stop:stop,list:list,get:get,subscribe:subscribe,create:create,upsert:upsert,remove:remove,removeSlot:removeSlot,replaceSlot:replaceSlot,status:status};
  mirror([]);
  if(!boot()){var tries=0,t=setInterval(function(){tries++;if(boot()||tries>200)clearInterval(t);},50);}
})();
