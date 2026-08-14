'use strict';
// ============================================================
// FINANCE STORE v1.0.0
// Household-scoped source of truth for FamilyApp finance.
// Mirrors the legacy finance globals so the existing UI can migrate
// without maintaining a second persistence model.
// ============================================================
(function(){
  if(window.FinanceStore)return;
  var VERSION='1.0.0',COLLECTION='finance',booted=false,sub=null,state=null,wrapping=false;
  function store(){return window.FamilyDataStore;}
  function status(){return store()&&store().status?store().status():{};}
  function ready(){var s=status();return !!(s.userId&&s.familyId);}
  function uid(){return status().userId||'unknown';}
  function now(){return Date.now();}
  function clone(v){return JSON.parse(JSON.stringify(v));}
  function arr(v){return Array.isArray(v)?clone(v):[];}
  function today(){var d=new Date(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');return d.getFullYear()+'-'+m+'-'+day;}
  function emptyState(){return{schemaVersion:1,initialized:true,vasteLasten:[],income:{primary:{label:'Salaris',amount:0},partner:{label:'Salaris',amount:0}},transactions:[],extraIncome:[],savingsGoals:[],meta:{resetAt:null,updatedAt:now(),updatedBy:uid()}};}
  function fromGlobals(){return{schemaVersion:1,initialized:true,vasteLasten:arr(window.vasteLasten),income:{primary:clone(window.inkomenShane||{label:'Salaris',amount:0}),partner:clone(window.inkomenEsra||{label:'Salaris',amount:0})},transactions:arr(window.transData),extraIncome:arr(window.extraIncome),savingsGoals:arr(window.savingsGoals),meta:{migratedAt:now(),updatedAt:now(),updatedBy:uid()}};}
  function normalize(v){v=v&&typeof v==='object'?clone(v):emptyState();v.schemaVersion=1;v.initialized=true;v.vasteLasten=arr(v.vasteLasten);v.transactions=arr(v.transactions);v.extraIncome=arr(v.extraIncome);v.savingsGoals=arr(v.savingsGoals);v.income=v.income||{};v.income.primary=v.income.primary||{label:'Salaris',amount:0};v.income.partner=v.income.partner||{label:'Salaris',amount:0};v.meta=v.meta||{};return v;}
  function apply(v){state=normalize(v);window.vasteLasten=arr(state.vasteLasten);window.inkomenShane=clone(state.income.primary);window.inkomenEsra=clone(state.income.partner);window.transData=arr(state.transactions);window.extraIncome=arr(state.extraIncome);window.savingsGoals=arr(state.savingsGoals);window.vlNextId=Math.max.apply(null,window.vasteLasten.map(function(x){var n=String(x.id||'').replace(/\D/g,'');return Number(n)||0;}).concat([0]))+1;window.transNextId=Math.max.apply(null,window.transData.map(function(x){return Number(x.id)||0;}).concat([0]))+1;window.extraIncNextId=Math.max.apply(null,window.extraIncome.map(function(x){return Number(x.id)||0;}).concat([0]))+1;window.savingsNextId=Math.max.apply(null,window.savingsGoals.map(function(x){return Number(x.id)||0;}).concat([0]))+1;render();try{window.dispatchEvent(new CustomEvent('familyapp:finance:changed',{detail:{state:clone(state)}}));}catch(e){}}
  function render(){try{if(typeof window.renderFinance==='function')window.renderFinance();}catch(e){}try{if(window.FinanceNativeTabs&&typeof FinanceNativeTabs.activate==='function')FinanceNativeTabs.activate();}catch(e){}try{if(typeof window.renderSparen==='function'&&window._currentScreen==='finance')window.renderSparen();}catch(e){}}
  function write(next){next=normalize(next);next.meta.updatedAt=now();next.meta.updatedBy=uid();state=next;apply(next);return store().writeShared(COLLECTION,next);}
  function saveLegacy(){if(!ready())return Promise.resolve(false);var next=fromGlobals();if(state&&state.meta)next.meta=Object.assign({},state.meta,next.meta);return write(next);}
  function transactionKey(sourceType,sourceId){return String(sourceType||'manual')+':'+String(sourceId||'');}
  function upsertSourceTransaction(o){o=o||{};if(!o.sourceType||!o.sourceId)return Promise.reject(new Error('source required'));var next=normalize(state||emptyState()),key=transactionKey(o.sourceType,o.sourceId),idx=next.transactions.findIndex(function(t){return t&&t.sourceKey===key;});var old=idx>=0?next.transactions[idx]:null,record=Object.assign({},old||{},o.transaction||{}, {id:(old&&old.id)||('fin_'+now().toString(36)+'_'+Math.random().toString(36).slice(2,7)),sourceType:o.sourceType,sourceId:String(o.sourceId),sourceKey:key,updatedAt:now(),updatedBy:uid()});if(!record.date)record.date=today();if(idx>=0)next.transactions[idx]=record;else next.transactions.unshift(record);return write(next).then(function(){return clone(record);});}
  function resetAll(){var next=emptyState();next.meta.resetAt=now();next.meta.resetBy=uid();return write(next);}
  function initialize(){if(!ready()||!store())return Promise.resolve(false);return store().readShared(COLLECTION,null).then(function(existing){if(existing&&existing.initialized)return existing;var first=fromGlobals();return store().writeShared(COLLECTION,first).then(function(){return first;});}).then(function(initial){apply(initial);if(sub)sub();sub=store().subscribeShared(COLLECTION,function(v){if(v&&v.initialized)apply(v);},emptyState());return true;});}
  function wrapLegacySave(){if(wrapping||typeof window.saveItem!=='function')return;wrapping=true;var original=window.saveItem;if(original.__financeStoreWrapped)return;var wrapped=function(){var type=window.currentAddType,result=original.apply(this,arguments);if(['trans','extraincome','vastlast','savings_tx','savings_goal','spaar_vanuit_budget'].indexOf(type)>=0)setTimeout(saveLegacy,0);return result;};wrapped.__financeStoreWrapped=true;window.saveItem=wrapped;}
  function boot(){if(booted)return true;if(!ready()||!store())return false;booted=true;initialize();wrapLegacySave();return true;}
  function bootWhenReady(){if(boot())return;var tries=0,t=setInterval(function(){tries++;if(boot()||tries>300)clearInterval(t);},100);}
  window.FinanceStore={version:VERSION,boot:boot,get:function(){return clone(state||emptyState());},saveLegacy:saveLegacy,upsertSourceTransaction:upsertSourceTransaction,resetAll:resetAll};
  window.addEventListener('familyapp:household-members-updated',function(){if(!booted)bootWhenReady();});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bootWhenReady);else bootWhenReady();
})();