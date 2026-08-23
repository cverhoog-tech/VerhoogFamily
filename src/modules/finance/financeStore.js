'use strict';
// ============================================================
// FINANCE STORE v4.0.0
// Business/compatibility facade over FinanceHouseholdRepository.
// Canonical source of truth: families/{householdId}/finance.
// Legacy finance globals are presentation projections only.
// ============================================================
(function(){
  var VERSION='4.0.0';
  if(window.FinanceStore&&window.FinanceStore.version===VERSION)return;

  var booted=false,repoSub=null,state=null,readyPromise=null,readyKey=null,projectionScope=null;

  function repo(){return window.FinanceHouseholdRepository;}
  function ctx(){try{return window.HouseholdContext&&HouseholdContext.snapshot?HouseholdContext.snapshot():null;}catch(e){return null;}}
  function validContext(c){return !!(c&&c.ready===true&&c.uid&&c.householdId);}
  function uid(){var c=ctx();return c&&c.uid||'unknown';}
  function now(){return Date.now();}
  function clone(v){if(v===undefined)return undefined;try{return JSON.parse(JSON.stringify(v));}catch(e){return v;}}
  function arr(v){return Array.isArray(v)?clone(v):[];}
  function todayStr(){var d=new Date(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');return d.getFullYear()+'-'+m+'-'+day;}
  function makeId(prefix){return prefix+'_'+now().toString(36)+'_'+Math.random().toString(36).slice(2,9);}

  function emptyState(){return{schemaVersion:3,initialized:true,income:{primary:{label:'Salaris',amount:0},partner:{label:'Salaris',amount:0}},samenBetaler:'Beiden',vasteLasten:[],transactions:[],extraIncome:[],savingsGoals:[],meta:{resetAt:null,updatedAt:now(),updatedByUid:uid(),updatedBy:uid()}};}

  function normalize(v){
    v=(v&&typeof v==='object')?clone(v):emptyState();
    v.schemaVersion=3;v.initialized=true;v.income=v.income||{};
    v.income.primary=v.income.primary||{label:'Salaris',amount:0};
    v.income.partner=v.income.partner||{label:'Salaris',amount:0};
    v.samenBetaler=v.samenBetaler||'Beiden';
    v.vasteLasten=arr(v.vasteLasten);v.transactions=arr(v.transactions);v.extraIncome=arr(v.extraIncome);
    v.savingsGoals=arr(v.savingsGoals).map(function(g){g=g||{};g.log=arr(g.log);return g;});
    v.meta=v.meta||{};
    return v;
  }

  function sortByDateThenStamp(list){return(list||[]).slice().sort(function(a,b){var ad=(a&&a.date)||'',bd=(b&&b.date)||'';if(ad!==bd)return ad<bd?1:-1;var au=(a&&a.updatedAt)||0,bu=(b&&b.updatedAt)||0;if(au!==bu)return bu-au;var ac=(a&&a.createdAt)||0,bc=(b&&b.createdAt)||0;return bc-ac;});}
  function render(){try{if(typeof window.renderFinance==='function')window.renderFinance();}catch(e){}}

  function apply(v){
    state=normalize(v);
    // Compatibility projection only. These globals are never read as authority.
    window.inkomenShane=clone(state.income.primary);window.inkomenEsra=clone(state.income.partner);window.samenBetaler=state.samenBetaler;
    window.vasteLasten=arr(state.vasteLasten);window.transData=sortByDateThenStamp(state.transactions);window.extraIncome=sortByDateThenStamp(state.extraIncome);
    window.savingsGoals=arr(state.savingsGoals).map(function(g){g=clone(g);g.log=sortByDateThenStamp(g.log);return g;});
    render();
    try{window.dispatchEvent(new CustomEvent('familyapp:finance:changed',{detail:{state:clone(state)}}));}catch(e){}
  }

  function clearProjection(scope){projectionScope=scope||null;apply(emptyState());}

  function ensureSubscription(){
    if(repoSub||!repo()||typeof repo().subscribe!=='function')return;
    repoSub=repo().subscribe(function(value,meta){
      var scope=meta&&meta.uid&&meta.householdId?String(meta.uid)+'|'+String(meta.householdId):null;
      if(meta&&meta.ready===false&&(!meta.uid||!meta.householdId)){
        readyPromise=null;readyKey=null;clearProjection(null);return;
      }
      if(scope&&projectionScope!==scope){
        projectionScope=scope;
        if(!(value&&typeof value==='object'))clearProjection(scope);
      }
      if(value&&typeof value==='object'){projectionScope=scope||projectionScope;apply(value);}
      else if(meta&&meta.ready===true)clearProjection(scope);
    });
  }

  function contextKey(){var c=ctx();return validContext(c)?[c.uid,c.householdId,c.revision].join('|'):null;}

  function initializeOnce(){
    if(!repo())return Promise.resolve(false);
    ensureSubscription();
    return repo().ready().then(function(ok){
      if(!ok)return false;
      var current=repo().get();
      if(current&&typeof current==='object'&&Object.keys(current).length){
        var adopted=normalize(current);
        apply(adopted);
        if(Number(current.schemaVersion||0)!==3||current.initialized!==true){
          adopted.meta=Object.assign({},adopted.meta||{}, {adoptedAt:now(),updatedAt:now(),updatedByUid:uid()});
          return repo().replace(adopted).then(function(){return true;});
        }
        return true;
      }
      var seed=emptyState();
      return repo().replace(seed).then(function(){apply(seed);return true;});
    });
  }

  function ready(){
    if(!repo())return Promise.resolve(false);
    var key=contextKey();
    if(key&&readyPromise&&readyKey===key)return readyPromise;
    readyKey=key;
    readyPromise=initializeOnce().catch(function(error){console.warn('[FinanceStore] ready failed',error);return false;});
    return readyPromise;
  }

  function boot(){if(booted)return;booted=true;ensureSubscription();ready();}

  function mutateList(field,updater){
    return ready().then(function(ok){if(!ok)throw new Error('Finance store is not ready');var fallback=(state&&state[field])||[];return repo().transact([field],function(list){return updater(Array.isArray(list)?list:[]);},fallback);}).then(function(result){return(result&&Array.isArray(result.value))?result.value:[];});
  }

  function mutateField(path,updater){
    return ready().then(function(ok){
      if(!ok)throw new Error('Finance store is not ready');var cur=state||emptyState(),fallback=cur;
      for(var i=0;i<path.length;i++)fallback=fallback==null?undefined:fallback[path[i]];
      return repo().transact(path,updater,fallback);
    }).then(function(result){return result?result.value:undefined;});
  }

  function stampNew(rec,actor,ts){rec.id=rec.id||makeId('fin');rec.createdAt=rec.createdAt||ts;rec.createdByUid=rec.createdByUid||rec.createdBy||actor;rec.createdBy=rec.createdBy||rec.createdByUid;rec.updatedAt=ts;rec.updatedByUid=actor;rec.updatedBy=actor;if(!rec.date)rec.date=todayStr();return rec;}

  function monthKey(year,month){if(typeof year==='string'&&/^\d{4}-\d{2}$/.test(year))return year;var d=new Date(),y=Number.isFinite(Number(year))?Number(year):d.getFullYear(),m=Number.isFinite(Number(month))?Number(month):d.getMonth();return y+'-'+String(m+1).padStart(2,'0');}
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
    return{month:key,salaryIncome:salaryIncome,extraIncome:extraIncomeTotal,transactionIncome:transactionIncome,fixedExpenses:fixedExpenses,extraExpenses:extraExpenses,transactionExpenses:transactionExpenses,savingsDeposits:savingsDeposits,totalIncome:totalIncome,totalExpenses:totalExpenses,disposable:totalIncome-totalExpenses,transactionCount:tx.length,transactions:clone(tx)};
  }

  function addTransaction(data){var actor=uid(),ts=now(),rec=stampNew(Object.assign({},data),actor,ts);rec.sourceType=rec.sourceType||'manual';return mutateList('transactions',function(list){list=list.slice();list.unshift(rec);return list;}).then(function(){return rec;});}
  function updateTransaction(id,patch){var actor=uid(),ts=now();return mutateList('transactions',function(list){return list.map(function(t){if(t&&t.id===id)return Object.assign({},t,patch,{updatedAt:ts,updatedByUid:actor,updatedBy:actor});return t;});});}
  function deleteTransaction(id){return mutateList('transactions',function(list){return list.filter(function(t){return!t||t.id!==id;});});}
  function transactionKey(sourceType,sourceId){return String(sourceType||'manual')+':'+String(sourceId||'');}
  function upsertSourceTransaction(o){
    o=o||{};if(!o.sourceType||!o.sourceId)return Promise.reject(new Error('source required'));
    var key=transactionKey(o.sourceType,o.sourceId),incoming=clone(o.transaction||{}),actor=uid(),ts=now();
    return mutateList('transactions',function(list){
      list=list.slice();var idx=list.findIndex(function(t){return t&&t.sourceKey===key;}),old=idx>=0?list[idx]:null;
      var record=Object.assign({},old||{},incoming,{id:(old&&old.id)||makeId('fin'),sourceType:o.sourceType,sourceId:String(o.sourceId),sourceKey:key,createdAt:(old&&old.createdAt)||ts,createdByUid:(old&&(old.createdByUid||old.createdBy))||actor,createdBy:(old&&(old.createdBy||old.createdByUid))||actor,updatedAt:ts,updatedByUid:actor,updatedBy:actor});
      if(!record.date)record.date=todayStr();if(idx>=0)list[idx]=record;else list.unshift(record);return list;
    }).then(function(list){var record=list.find(function(t){return t&&t.sourceKey===key;})||null;return record?clone(record):null;});
  }
  function addExtraIncome(data){var actor=uid(),ts=now(),rec=stampNew(Object.assign({},data),actor,ts);return mutateList('extraIncome',function(list){list=list.slice();list.unshift(rec);return list;}).then(function(){return rec;});}
  function deleteExtraIncome(id){var removed=null;return mutateList('extraIncome',function(list){removed=list.find(function(e){return e&&e.id===id;})||null;return list.filter(function(e){return!e||e.id!==id;});}).then(function(){return removed;});}
  function addVasteLast(data){var actor=uid(),ts=now(),rec=Object.assign({paid:{}},data);rec.id=rec.id||makeId('vl');rec.createdAt=ts;rec.createdByUid=actor;rec.createdBy=actor;rec.updatedAt=ts;rec.updatedByUid=actor;rec.updatedBy=actor;return mutateList('vasteLasten',function(list){list=list.slice();list.push(rec);return list;}).then(function(){return rec;});}
  function deleteVasteLast(id){return mutateList('vasteLasten',function(list){return list.filter(function(l){return!l||l.id!==id;});});}
  function toggleVasteLastPaid(id,ym){var actor=uid(),ts=now();return mutateList('vasteLasten',function(list){return list.map(function(l){if(!l||l.id!==id)return l;var next=Object.assign({},l,{paid:Object.assign({},l.paid||{})});if(next.paid[ym])delete next.paid[ym];else next.paid[ym]=true;next.updatedAt=ts;next.updatedByUid=actor;return next;});});}
  function setIncome(person,patch){var actor=uid(),ts=now();return mutateField(['income',person],function(cur){return Object.assign({},cur||{label:'Salaris',amount:0},patch,{updatedAt:ts,updatedByUid:actor,updatedBy:actor});});}
  function setSamenBetaler(v){return mutateField(['samenBetaler'],function(){return v;});}
  function addSavingsGoal(data){var actor=uid(),ts=now(),rec=Object.assign({saved:0,log:[]},data);rec.id=rec.id||makeId('goal');rec.createdAt=ts;rec.createdByUid=actor;rec.createdBy=actor;rec.updatedAt=ts;rec.updatedByUid=actor;rec.updatedBy=actor;return mutateList('savingsGoals',function(list){list=list.slice();list.push(rec);return list;}).then(function(){return rec;});}
  function updateSavingsGoal(id,patch){var actor=uid(),ts=now();return mutateList('savingsGoals',function(list){return list.map(function(g){if(g&&g.id===id)return Object.assign({},g,patch,{updatedAt:ts,updatedByUid:actor,updatedBy:actor});return g;});});}
  function deleteSavingsGoal(id){return mutateList('savingsGoals',function(list){return list.filter(function(g){return!g||g.id!==id;});});}
  function addSavingsTransaction(goalId,entry){var actor=uid(),ts=now(),logEntry=Object.assign({id:makeId('savingslog'),createdAt:ts,createdByUid:actor,createdBy:actor,updatedAt:ts,updatedByUid:actor,updatedBy:actor},entry);if(!logEntry.date)logEntry.date=todayStr();return mutateList('savingsGoals',function(list){return list.map(function(g){if(!g||g.id!==goalId)return g;var log=(g.log||[]).slice();log.push(logEntry);var delta=logEntry.type==='deposit'?logEntry.amount:-logEntry.amount;var saved=Math.max(0,(g.saved||0)+delta);return Object.assign({},g,{log:log,saved:saved,updatedAt:ts,updatedByUid:actor});});}).then(function(){return logEntry;});}
  function deleteSavingsLogEntry(goalId,logId){var actor=uid(),ts=now();return mutateList('savingsGoals',function(list){return list.map(function(g){if(!g||g.id!==goalId)return g;var entry=(g.log||[]).find(function(l){return l.id===logId;});if(!entry)return g;var log=(g.log||[]).filter(function(l){return l.id!==logId;});var delta=entry.type==='deposit'?-entry.amount:entry.amount;var saved=Math.max(0,(g.saved||0)+delta);return Object.assign({},g,{log:log,saved:saved,updatedAt:ts,updatedByUid:actor});});});}
  function resetAll(){var actor=uid(),ts=now(),next=emptyState();next.meta.resetAt=ts;next.meta.resetByUid=actor;next.meta.resetBy=actor;next.meta.updatedAt=ts;next.meta.updatedByUid=actor;next.meta.updatedBy=actor;return ready().then(function(ok){if(!ok)throw new Error('Finance store is not ready');return repo().replace(next);}).then(function(){apply(next);return true;});}
  function wireResetButton(){if(typeof document==='undefined')return;var btn=document.getElementById('fin-reset-btn');if(!btn||btn._financeResetWired)return;btn._financeResetWired=true;btn.onclick=function(){var confirmed=confirm('Alle financiele gegevens van dit gezin wissen (maandplan, vaste lasten, transacties, spaardoelen)? Taken, agenda, recepten, boodschappen en voortgang blijven behouden.');if(!confirmed)return;resetAll().then(function(){if(window.showToast)showToast('Financien zijn opnieuw gestart');});};}
  function stop(){if(repoSub){try{repoSub();}catch(e){}repoSub=null;}readyPromise=null;readyKey=null;booted=false;if(repo()&&repo().stop)repo().stop();}

  window.FinanceStore={version:VERSION,ready:ready,boot:boot,stop:stop,get:function(){return clone(state||emptyState());},sortTransactions:sortByDateThenStamp,monthlySummary:monthlySummary,addTransaction:addTransaction,updateTransaction:updateTransaction,deleteTransaction:deleteTransaction,upsertSourceTransaction:upsertSourceTransaction,addExtraIncome:addExtraIncome,deleteExtraIncome:deleteExtraIncome,addVasteLast:addVasteLast,deleteVasteLast:deleteVasteLast,toggleVasteLastPaid:toggleVasteLastPaid,setIncome:setIncome,setSamenBetaler:setSamenBetaler,addSavingsGoal:addSavingsGoal,updateSavingsGoal:updateSavingsGoal,deleteSavingsGoal:deleteSavingsGoal,addSavingsTransaction:addSavingsTransaction,deleteSavingsLogEntry:deleteSavingsLogEntry,resetAll:resetAll,wireResetButton:wireResetButton};
  window.addEventListener('familyapp:household-members-updated',function(){ready();});if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){boot();wireResetButton();});else{boot();wireResetButton();}
})();
