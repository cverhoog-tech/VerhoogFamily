'use strict';
// ============================================================
// MEAL PLAN STORE v1.0
// Shared household meal planning on top of FamilyDataStore.
// Firebase is authoritative; window.mealPlanData is compatibility only.
// ============================================================
(function(){
  if(window.MealPlanStore)return;
  var VERSION='1.0.0',COLLECTION='mealPlans',LEGACY_KEY='familyapp_food_meal_plan_v001';
  var records={},listeners=[],booted=false,unsub=null,migrated=false;

  function store(){return window.FamilyDataStore||null;}
  function status(){return store()&&store().status?store().status():{};}
  function ready(){var s=status();return !!(s.userId&&s.familyId);}
  function now(){return Date.now();}
  function uid(){return status().userId||null;}
  function parse(v,f){try{return v?JSON.parse(v):f;}catch(e){return f;}}
  function normalize(x,id){
    x=x||{};var mealType=String(x.mealType||x.slot||'dinner').toLowerCase();
    if(mealType!=='breakfast'&&mealType!=='lunch'&&mealType!=='dinner')mealType='dinner';
    return {
      id:String(x.id||id||''),date:String(x.date||''),mealType:mealType,
      recipeId:x.recipeId==null?null:String(x.recipeId),title:String(x.title||'Maaltijd'),
      persons:parseInt(x.persons,10)||4,notes:String(x.notes||''),emoji:String(x.emoji||'🍽️'),
      createdBy:x.createdBy||x.who||null,createdAt:Number(x.createdAt)||now(),
      updatedBy:x.updatedBy||x.createdBy||null,updatedAt:Number(x.updatedAt)||Number(x.createdAt)||now()
    };
  }
  function list(){return Object.keys(records).map(function(k){return normalize(records[k],k);}).filter(function(x){return x.date;}).sort(function(a,b){var d=String(a.date).localeCompare(String(b.date));return d||String(a.mealType).localeCompare(String(b.mealType));});}
  function mirror(){window.mealPlanData=list();window.mealPlanNextId=window.mealPlanData.length+1;return window.mealPlanData;}
  function emit(){var rows=mirror();listeners.slice().forEach(function(fn){try{fn(rows.slice());}catch(e){}});try{window.dispatchEvent(new CustomEvent('familyapp:meals:changed',{detail:{source:'MealPlanStore',rows:rows.slice()}}));}catch(e){}}
  function get(id){return records[String(id)]?normalize(records[String(id)],String(id)):null;}
  function subscribe(fn){if(typeof fn!=='function')return function(){};listeners.push(fn);Promise.resolve().then(function(){fn(list());});return function(){listeners=listeners.filter(function(x){return x!==fn;});};}
  function create(input){var s=store();if(!s)return Promise.reject(new Error('Maaltijdopslag niet beschikbaar'));var id=s.makeId('meal'),t=now(),record=normalize(Object.assign({},input,{id:id,createdBy:uid(),createdAt:t,updatedBy:uid(),updatedAt:t}),id);records[id]=record;emit();return s.writeSharedRecord(COLLECTION,id,record).then(function(result){return{record:record,result:result};});}
  function upsert(input){var s=store(),id=String(input&&input.id||'');if(!s||!id)return Promise.reject(new Error('Maaltijd ontbreekt'));var prev=get(id)||{},record=normalize(Object.assign({},prev,input,{id:id,createdBy:prev.createdBy||uid(),createdAt:prev.createdAt||now(),updatedBy:uid(),updatedAt:now()}),id);records[id]=record;emit();return s.writeSharedRecord(COLLECTION,id,record).then(function(result){return{record:record,result:result};});}
  function remove(id){var s=store(),key=String(id||'');if(!s||!key)return Promise.reject(new Error('Maaltijd ontbreekt'));delete records[key];emit();return s.writeSharedRecord(COLLECTION,key,null);}
  function removeSlot(date,mealType){var row=list().find(function(x){return x.date===date&&x.mealType===mealType;});return row?remove(row.id):Promise.resolve(false);}
  function replaceSlot(input){var date=String(input&&input.date||''),mealType=String(input&&input.mealType||'dinner'),existing=list().find(function(x){return x.date===date&&x.mealType===mealType;});return existing?upsert(Object.assign({},input,{id:existing.id})):create(input);}
  function migrateLegacy(){if(migrated||!ready()||!store())return Promise.resolve(false);migrated=true;return store().readShared(COLLECTION,{}).then(function(existing){if(existing&&Object.keys(existing).length)return false;var legacy=[];try{legacy=parse(localStorage.getItem(LEGACY_KEY),[]);}catch(e){}if(!Array.isArray(legacy)||!legacy.length)return false;var jobs=legacy.filter(function(x){return x&&x.date;}).map(function(x){return create(x);});return Promise.all(jobs).then(function(){return jobs.length>0;});});}
  function boot(){if(booted||!store()||!ready())return false;booted=true;migrateLegacy().then(function(){if(unsub)unsub();unsub=store().subscribeShared(COLLECTION,function(value){records=value&&typeof value==='object'?value:{};emit();},{});});return true;}
  function bootWhenReady(){if(boot())return;var tries=0,t=setInterval(function(){tries++;if(boot()||tries>300)clearInterval(t);},100);}

  window.MealPlanStore={version:VERSION,boot:boot,list:list,get:get,subscribe:subscribe,create:create,upsert:upsert,remove:remove,removeSlot:removeSlot,replaceSlot:replaceSlot,status:function(){return{ready:booted,count:list().length,householdReady:ready()};}};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bootWhenReady);else bootWhenReady();
})();
