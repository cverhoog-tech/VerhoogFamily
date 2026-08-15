'use strict';
// ============================================================
// FINANCE STORE v3.1.0
// Sole household-scoped source of truth for FamilyApp finance.
// Firebase (families/{id}/shared/finance) is the source of truth;
// localStorage (via FamilyDataStore) is cache/offline fallback only.
// ============================================================
(function(){
  var VERSION = '3.1.0', COLLECTION = 'finance';
  if(window.FinanceStore && window.FinanceStore.version === VERSION) return;

  var booted = false, readyPromise = null, sub = null, state = null;

  function store(){ return window.FamilyDataStore; }
  function status(){ return store() && store().status ? store().status() : {}; }
  function identityKnown(){ var s = status(); return !!(s.userId && s.familyId); }
  function uid(){ return status().userId || 'unknown'; }
  function now(){ return Date.now(); }
  function clone(v){ return JSON.parse(JSON.stringify(v)); }
  function arr(v){ return Array.isArray(v) ? clone(v) : []; }
  function todayStr(){var d=new Date(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');return d.getFullYear()+'-'+m+'-'+day;}
  function makeId(prefix){return (store()&&store().makeId)?store().makeId(prefix):(prefix+'_'+now().toString(36)+'_'+Math.random().toString(36).slice(2,8));}

  function emptyState(){
    return {schemaVersion:2,initialized:true,income:{primary:{label:'Salaris',amount:0},partner:{label:'Salaris',amount:0}},samenBetaler:'Beiden',vasteLasten:[],transactions:[],extraIncome:[],savingsGoals:[],meta:{resetAt:null,updatedAt:now(),updatedBy:uid()}};
  }
  function fromLegacyGlobals(){
    return {schemaVersion:2,initialized:true,income:{primary:clone(window.inkomenShane||{label:'Salaris',amount:0}),partner:clone(window.inkomenEsra||{label:'Salaris',amount:0})},samenBetaler:window.samenBetaler||'Beiden',vasteLasten:arr(window.vasteLasten),transactions:arr(window.transData),extraIncome:arr(window.extraIncome),savingsGoals:arr(window.savingsGoals),meta:{migratedAt:now(),updatedAt:now(),updatedBy:uid()}};
  }
  function normalize(v){
    v=(v&&typeof v==='object')?clone(v):emptyState();v.schemaVersion=2;v.initialized=true;v.income=v.income||{};v.income.primary=v.income.primary||{label:'Salaris',amount:0};v.income.partner=v.income.partner||{label:'Salaris',amount:0};v.samenBetaler=v.samenBetaler||'Beiden';v.vasteLasten=arr(v.vasteLasten);v.transactions=arr(v.transactions);v.extraIncome=arr(v.extraIncome);v.savingsGoals=arr(v.savingsGoals).map(function(g){g=g||{};g.log=arr(g.log);return g;});v.meta=v.meta||{};return v;
  }
  function sortByDateThenStamp(list){return (list||[]).slice().sort(function(a,b){var ad=(a&&a.date)||'',bd=(b&&b.date)||'';if(ad!==bd)return ad<bd?1:-1;var au=(a&&a.updatedAt)||0,bu=(b&&b.updatedAt)||0;if(au!==bu)return bu-au;var ac=(a&&a.createdAt)||0,bc=(b&&b.createdAt)||0;return bc-ac;});}

  function apply(v){
    state=normalize(v);window.inkomenShane=clone(state.income.primary);window.inkomenEsra=clone(state.income.partner);window.samenBetaler=state.samenBetaler;window.vasteLasten=arr(state.vasteLasten);window.transData=sortByDateThenStamp(state.transactions);window.extraIncome=sortByDateThenStamp(state.extraIncome);window.savingsGoals=arr(state.savingsGoals).map(function(g){g=clone(g);g.log=sortByDateThenStamp(g.log);return g;});render();try{window.dispatchEvent(new CustomEvent('familyapp:finance:changed',{detail:{state:clone(state)}}));}catch(e){}
  }
  function render(){try{if(typeof window.renderFinance==='function')window.renderFinance();}catch(e){}}
  function readShared(){return store().readShared(COLLECTION,null);}
  function writeShared(v){return store().writeShared(COLLECTION,v);}
  function subscribe(){if(sub)sub();sub=store().subscribeShared(COLLECTION,function(v){if(v&&v.initialized)apply(v);},emptyState());}
  function initializeOnce(){
    return readShared().then(function(existing){
      if(existing&&existing.initialized===true)return existing;
      if(existing&&typeof existing==='object'&&Object.keys(existing).length){var adopted=normalize(existing);adopted.meta.adoptedAt=now();return writeShared(adopted).then(function(){return adopted;});}
      var seed=fromLegacyGlobals();return writeShared(seed).then(function(){return seed;});
    }).then(function(initial){apply(initial);subscribe();return true;});
  }
  function ready(){
    if(readyPromise)return readyPromise;
    readyPromise=new Promise(function(resolve){(function poll(tries){if(!store()||!identityKnown()){if(tries>300)return resolve(false);return setTimeout(function(){poll(tries+1);},100);}initializeOnce().then(function(){resolve(true);}).catch(function(){resolve(false);});})(0);});return readyPromise;
  }
  function boot(){if(booted)return;booted=true;ready();}

  function mutateList(field,updater){return ready().then(function(){var fallback=(state&&state[field])||[];return store().transactSharedPath(COLLECTION,[field],function(list){return updater(Array.isArray(list)?list:[]);},fallback);}).then(function(result){return(result&&Array.isArray(result.value))?result.value:[];});}
  function mutateField(path,updater){return ready().then(function(){var cur=state||emptyState(),fallback=cur;for(var i=0;i<path.length;i++)fallback=fallback==null?undefined:fallback[path[i]];return store().transactSharedPath(COLLECTION,path,updater,fallback);}).then(function(result){return result?result.value:undefined;});}
  function stampNew(rec,actor,ts){rec.id=rec.id||makeId('fin');rec.createdAt=rec.createdAt||ts;rec.createdBy=rec.createdBy||actor;rec.updatedAt=ts;rec.updatedBy=actor;if(!rec.date)rec.date=todayStr();return rec;}

  // Canonical month summary. All spendable-income views must consume this,
  // rather than reimplementing a subset of finance fields in presentation code.
  function monthKey(year,month){
    if(typeof year==='string'&&/^\d{4}-\d{2}$/.test(year))return year;
    var d=new Date(),y=Number.isFinite(Number(year))?Number(year):d.getFullYear(),m=Number.isFinite(Number(month))?Number(month):d.getMonth();
    return y+'-'+String(m+1).padStart(2,'0');
  }
  function monthlySummary(year,month){
    var s=normalize(state||emptyState()),key=monthKey(year,month);
    var tx=s.transactions.filter(function(t){return String(t&&t.date||'').slice(0,7)===key;});
    var extra=s.extraIncome.filter(function(t){return String(t&&t.date||'').slice(0,7)===key;});
    var transactionIncome=tx.filter(function(t){return Number(t&&t.amount)>0;}).reduce(function(sum,t){return sum+Number(t.amount||0);},0);
    var transactionExpenses=tx.filter(function(t){return Number(t&&t.amount)<0;}).reduce(function(sum,t){return sum+Math.abs(Number(t.amount||0));},0);
    var extraIncomeTotal=extra.filter(function(t){return Number(t&&t.amount)>0;}).reduce(function(sum,t){return sum+Number(t.amount||0);},0);
    var extraExpenses=extra.filter(function(t){return Number(t&&t.amount)<0;}).reduce(function(sum,t){return sum+Math.abs(Number(t.amount||0));},0);
    var fixedExpenses=s.vasteLasten.reduce(function(sum,t){return sum+Math.abs(Number(t&&t.amount)||0);},0);
    var savingsDeposits=s.savingsGoals.reduce(function(sum,g){return sum+(g.log||[]).filter(function(l){return String(l&&l.date||'').slice(0,7)===key&&l.type==='deposit';}).reduce(function(x,l){return x+Math.abs(Number(l.amount)||0);},0);},0);
    var salaryIncome=Number(s.income.primary&&s.income.primary.amount||0)+Number(s.income.partner&&s.income.partner.amount||0);
    var totalIncome=salaryIncome+extraIncomeTotal+transactionIncome;
    var totalExpenses=fixedExpenses+extraExpenses+transactionExpenses+savingsDeposits;
    return {month:key,salaryIncome:salaryIncome,extraIncome:extraIncomeTotal,transactionIncome:transactionIncome,fixedExpenses:fixedExpenses,extraExpenses:extraExpenses,transactionExpenses:transactionExpenses,savingsDeposits:savingsDeposits,totalIncome:totalIncome,totalExpenses:totalExpenses,disposable:totalIncome-totalExpenses,transactionCount:tx.length,transactions:clone(tx)};
  }

  function addTransaction(data){var actor=uid(),ts=now(),rec=stampNew(Object.assign({},data),actor,ts);rec.sourceType=rec.sourceType||'manual';return mutateList('transactions',function(list){list=list.slice();list.unshift(rec);return list;}).then(function(){return rec;});}
  function updateTransaction(id,patch){var actor=uid(),ts=now();return mutateList('transactions',function(list){return list.map(function(t){if(t&&t.id===id)return Object.assign({},t,patch,{updatedAt:ts,updatedBy:actor});return t;});});}
  function deleteTransaction(id){return mutateList('transactions',function(list){return list.filter(function(t){return!t||t.id!==id;});});}
  function transactionKey(sourceType,sourceId){return String(sourceType||'manual')+':'+String(sourceId||'');}
  function upsertSourceTransaction(o){
    o=o||{};if(!o.sourceType||!o.sourceId)return Promise.reject(new Error('source required'));var key=transactionKey(o.sourceType,o.sourceId),incoming=clone(o.transaction||{}),actor=uid(),ts=now();
    return mutateList('transactions',function(list){list=list.slice();var idx=list.findIndex(function(t){return t&&t.sourceKey===key;}),old=idx>=0?list[idx]:null;var record=Object.assign({},old||{},incoming,{id:(old&&old.id)||makeId('fin'),sourceType:o.sourceType,sourceId:String(o.sourceId),sourceKey:key,createdAt:(old&&old.createdAt)||ts,createdBy:(old&&old.createdBy)||actor,updatedAt:ts,updatedBy:actor});if(!record.date)record.date=todayStr();if(idx>=0)list[idx]=record;else list.unshift(record);return list;}).then(function(list){var record=list.find(function(t){return t&&t.sourceKey===key;})||null;return record?clone(record):null;});
  }
  function addExtraIncome(data){var actor=uid(),ts=now(),rec=stampNew(Object.assign({},data),actor,ts);return mutateList('extraIncome',function(list){list=list.slice();list.unshift(rec);return list;}).then(function(){return rec;});}
  function deleteExtraIncome(id){var removed=null;return mutateList('extraIncome',function(list){removed=list.find(function(e){return e&&e.id===id;})||null;return list.filter(function(e){return!e||e.id!==id;});}).then(function(){return removed;});}
  function addVasteLast(data){var actor=uid(),ts=now(),rec=Object.assign({paid:{}},data);rec.id=rec.id||makeId('vl');rec.createdAt=ts;rec.createdBy=actor;rec.updatedAt=ts;rec.updatedBy=actor;return mutateList('vasteLasten',function(list){list=list.slice();list.push(rec);return list;}).then(function(){return rec;});}
  function deleteVasteLast(id){return mutateList('vasteLasten',function(list){return list.filter(function(l){return!l||l.id!==id;});});}
  function toggleVasteLastPaid(id,ym){var actor=uid(),ts=now();return mutateList('vasteLasten',function(list){return list.map(function(l){if(!l||l.id!==id)return l;var next=Object.assign({},l,{paid:Object.assign({},l.paid||{})});if(next.paid[ym])delete next.paid[ym];else next.paid[ym]=true;next.updatedAt=ts;next.updatedBy=actor;return next;});});}
  function setIncome(person,patch){var actor=uid(),ts=now();return mutateField(['income',person],function(cur){return Object.assign({},cur||{label:'Salaris',amount:0},patch,{updatedAt:ts,updatedBy:actor});});}
  function setSamenBetaler(v){return mutateField(['samenBetaler'],function(){return v;});}
  function addSavingsGoal(data){var actor=uid(),ts=now(),rec=Object.assign({saved:0,log:[]},data);rec.id=rec.id||makeId('goal');rec.createdAt=ts;rec.createdBy=actor;rec.updatedAt=ts;rec.updatedBy=actor;return mutateList('savingsGoals',function(list){list=list.slice();list.push(rec);return list;}).then(function(){return rec;});}
  function updateSavingsGoal(id,patch){var actor=uid(),ts=now();return mutateList('savingsGoals',function(list){return list.map(function(g){if(g&&g.id===id)return Object.assign({},g,patch,{updatedAt:ts,updatedBy:actor});return g;});});}
  function deleteSavingsGoal(id){return mutateList('savingsGoals',function(list){return list.filter(function(g){return!g||g.id!==id;});});}
  function addSavingsTransaction(goalId,entry){var actor=uid(),ts=now(),logEntry=Object.assign({id:makeId('savingslog'),createdAt:ts,createdBy:actor,updatedAt:ts,updatedBy:actor},entry);if(!logEntry.date)logEntry.date=todayStr();return mutateList('savingsGoals',function(list){return list.map(function(g){if(!g||g.id!==goalId)return g;var log=(g.log||[]).slice();log.push(logEntry);var delta=logEntry.type==='deposit'?logEntry.amount:-logEntry.amount;var saved=Math.max(0,(g.saved||0)+delta);return Object.assign({},g,{log:log,saved:saved,updatedAt:ts,updatedBy:actor});});}).then(function(){return logEntry;});}
  function deleteSavingsLogEntry(goalId,logId){var actor=uid(),ts=now();return mutateList('savingsGoals',function(list){return list.map(function(g){if(!g||g.id!==goalId)return g;var entry=(g.log||[]).find(function(l){return l.id===logId;});if(!entry)return g;var log=(g.log||[]).filter(function(l){return l.id!==logId;});var delta=entry.type==='deposit'?-entry.amount:entry.amount;var saved=Math.max(0,(g.saved||0)+delta);return Object.assign({},g,{log:log,saved:saved,updatedAt:ts,updatedBy:actor});});});}
  function resetAll(){var actor=uid(),ts=now(),next=emptyState();next.meta.resetAt=ts;next.meta.resetBy=actor;return ready().then(function(){return writeShared(next);}).then(function(){apply(next);return true;});}
  function wireResetButton(){if(typeof document==='undefined')return;var btn=document.getElementById('fin-reset-btn');if(!btn||btn._financeResetWired)return;btn._financeResetWired=true;btn.onclick=function(){var confirmed=confirm('Alle financiële gegevens van dit gezin wissen (maandplan, vaste lasten, transacties, spaardoelen)? Taken, agenda, recepten, boodschappen en voortgang blijven behouden.');if(!confirmed)return;resetAll().then(function(){if(window.showToast)showToast('Financiën zijn opnieuw gestart ✓');});};}

  window.FinanceStore={version:VERSION,ready:ready,boot:boot,get:function(){return clone(state||emptyState());},sortTransactions:sortByDateThenStamp,monthlySummary:monthlySummary,addTransaction:addTransaction,updateTransaction:updateTransaction,deleteTransaction:deleteTransaction,upsertSourceTransaction:upsertSourceTransaction,addExtraIncome:addExtraIncome,deleteExtraIncome:deleteExtraIncome,addVasteLast:addVasteLast,deleteVasteLast:deleteVasteLast,toggleVasteLastPaid:toggleVasteLastPaid,setIncome:setIncome,setSamenBetaler:setSamenBetaler,addSavingsGoal:addSavingsGoal,updateSavingsGoal:updateSavingsGoal,deleteSavingsGoal:deleteSavingsGoal,addSavingsTransaction:addSavingsTransaction,deleteSavingsLogEntry:deleteSavingsLogEntry,resetAll:resetAll};
  window.addEventListener('familyapp:household-members-updated',function(){ready();});wireResetButton();boot();
})();