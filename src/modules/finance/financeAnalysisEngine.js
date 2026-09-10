'use strict';
// ============================================================
// FINANCE ANALYSIS ENGINE v1.0.0
// Pure period-based finance analysis shared by UI and report export.
// Does not mutate FinanceStore or canonical household finance state.
// ============================================================
(function(root){
  var VERSION='1.0.0';
  if(root.FinanceAnalysisEngine&&root.FinanceAnalysisEngine.version===VERSION)return;

  function clone(v){if(v===undefined)return undefined;try{return JSON.parse(JSON.stringify(v));}catch(e){return v;}}
  function list(v){return Array.isArray(v)?v:[];}
  function number(v){v=Number(v);return Number.isFinite(v)?v:0;}
  function pad2(v){return String(v).padStart(2,'0');}
  function isoDate(d){return d.getUTCFullYear()+'-'+pad2(d.getUTCMonth()+1)+'-'+pad2(d.getUTCDate());}
  function parseDate(v){
    if(typeof v!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(v))return null;
    var p=v.split('-').map(Number),d=new Date(Date.UTC(p[0],p[1]-1,p[2]));
    if(d.getUTCFullYear()!==p[0]||d.getUTCMonth()!==p[1]-1||d.getUTCDate()!==p[2])return null;
    return d;
  }
  function addDays(v,days){var d=v instanceof Date?new Date(v.getTime()):parseDate(v);if(!d)return null;d.setUTCDate(d.getUTCDate()+Number(days||0));return d;}
  function dayCount(range){var s=parseDate(range&&range.start),e=parseDate(range&&range.end);if(!s||!e)return 0;return Math.floor((e-s)/86400000)+1;}
  function normalizeRange(range){
    var s=parseDate(range&&range.start),e=parseDate(range&&range.end);
    if(!s||!e)throw new Error('Analysis range requires valid YYYY-MM-DD start and end dates');
    if(s>e){var t=s;s=e;e=t;}
    return{start:isoDate(s),end:isoDate(e),days:Math.floor((e-s)/86400000)+1};
  }
  function calendarMonthRange(reference){
    var d=parseDate(reference)||new Date(),y=d.getUTCFullYear?d.getUTCFullYear():d.getFullYear(),m=d.getUTCMonth?d.getUTCMonth():d.getMonth();
    var first=new Date(Date.UTC(y,m,1)),last=new Date(Date.UTC(y,m+1,0));
    return normalizeRange({start:isoDate(first),end:isoDate(last)});
  }
  function previousEqualRange(range){
    range=normalizeRange(range);var prevEnd=addDays(range.start,-1),prevStart=addDays(prevEnd,-(range.days-1));
    return normalizeRange({start:isoDate(prevStart),end:isoDate(prevEnd)});
  }
  function inRange(date,range){return typeof date==='string'&&date>=range.start&&date<=range.end;}
  function monthDay(year,monthIndex,day){var last=new Date(Date.UTC(year,monthIndex+1,0)).getUTCDate();return new Date(Date.UTC(year,monthIndex,Math.min(Math.max(Number(day)||1,1),last)));}
  function cycleDates(range,cycleStartDay){
    range=normalizeRange(range);var out=[],s=parseDate(range.start),e=parseDate(range.end),y=s.getUTCFullYear(),m=s.getUTCMonth();
    var guard=0;
    while(guard++<240){
      var d=monthDay(y,m,cycleStartDay);
      if(d>e)break;
      if(d>=s)out.push(isoDate(d));
      m++;if(m>11){m=0;y++;}
    }
    return out;
  }
  function categoryName(v,fallback){v=String(v||'').trim();return v||fallback||'Overig';}
  function isSavingsBudgetMirror(entry){return !!(entry&&(entry._savingsBudgetRef||entry.savingsBudgetRef||entry.sourceType==='savingsBudgetMirror'));}
  function pushFlow(flows,date,type,amount,meta){amount=Math.abs(number(amount));if(!amount||!date)return;flows.push(Object.assign({date:date,type:type,amount:amount},meta||{}));}
  function savingsEntries(state,range){
    var rows=[];
    list(state.savingsGoals).forEach(function(goal){
      list(goal&&goal.log).forEach(function(entry){
        if(entry&&inRange(entry.date,range))rows.push({goalId:goal.id,goalName:goal.name||'Spaardoel',goalIcon:goal.icon||'🎯',id:entry.id,date:entry.date,type:entry.type==='withdrawal'?'withdrawal':'deposit',amount:Math.abs(number(entry.amount)),note:entry.note||'',who:entry.who||''});
      });
    });
    return rows;
  }
  function buildFlows(state,range,options){
    state=state||{};range=normalizeRange(range);options=options||{};
    var cycleStartDay=Math.min(31,Math.max(1,Number(options.cycleStartDay)||1));
    var flows=[],transactions=list(state.transactions).filter(function(t){return t&&inRange(t.date,range);});
    var extra=list(state.extraIncome).filter(function(t){return t&&inRange(t.date,range);});

    transactions.forEach(function(t){
      var amount=number(t.amount);if(!amount)return;
      if(amount>0)pushFlow(flows,t.date,'income',amount,{source:'transaction',sourceId:t.id,category:categoryName(t.cat,'Inkomen'),name:t.name||'Inkomen'});
      else pushFlow(flows,t.date,'expense',amount,{source:'transaction',sourceId:t.id,category:categoryName(t.cat,'Overig'),name:t.name||'Uitgave',receipt:t.sourceType==='shoppingReceipt'});
    });
    extra.forEach(function(t){
      var amount=number(t.amount);if(!amount)return;
      if(amount>0)pushFlow(flows,t.date,'income',amount,{source:'extraIncome',sourceId:t.id,category:categoryName(t.cat,'Extra inkomen'),name:t.name||'Extra inkomen'});
      else if(!isSavingsBudgetMirror(t))pushFlow(flows,t.date,'expense',amount,{source:'extraIncome',sourceId:t.id,category:categoryName(t.cat,'Overig'),name:t.name||'Eenmalige uitgave'});
    });

    var recurringDates=cycleDates(range,cycleStartDay);
    var salary=number(state.income&&state.income.primary&&state.income.primary.amount)+number(state.income&&state.income.partner&&state.income.partner.amount);
    var fixed=list(state.vasteLasten);
    recurringDates.forEach(function(date){
      if(salary>0)pushFlow(flows,date,'income',salary,{source:'configuredSalary',category:'Salaris',name:'Salaris'});
      fixed.forEach(function(item){var amount=Math.abs(number(item&&item.amount));if(amount)pushFlow(flows,date,'expense',amount,{source:'fixed',sourceId:item.id,category:categoryName(item.cat,'Vaste lasten'),name:item.name||item.label||'Vaste last',fixed:true});});
    });

    savingsEntries(state,range).forEach(function(entry){pushFlow(flows,entry.date,entry.type==='withdrawal'?'savingsWithdrawal':'savingsDeposit',entry.amount,{source:'savings',sourceId:entry.id,goalId:entry.goalId,goalName:entry.goalName,name:entry.note||entry.goalName});});
    return flows.sort(function(a,b){return a.date===b.date?String(a.type).localeCompare(String(b.type)):a.date.localeCompare(b.date);});
  }
  function sumType(flows,type){return flows.filter(function(f){return f.type===type;}).reduce(function(s,f){return s+f.amount;},0);}
  function categoryRows(flows,totalExpenses){
    var map={};
    flows.filter(function(f){return f.type==='expense';}).forEach(function(f){var key=categoryName(f.category,'Overig');if(!map[key])map[key]={category:key,amount:0,fixed:0,variable:0,count:0};map[key].amount+=f.amount;map[key].count++;if(f.fixed)map[key].fixed+=f.amount;else map[key].variable+=f.amount;});
    return Object.keys(map).map(function(key){var row=map[key];row.share=totalExpenses?row.amount/totalExpenses*100:0;return row;}).sort(function(a,b){return b.amount-a.amount;});
  }
  function receiptStats(state,range){
    var receipts=list(state.transactions).filter(function(t){return t&&t.sourceType==='shoppingReceipt'&&inRange(t.date,range);});
    var total=receipts.reduce(function(s,t){return s+Math.abs(number(t.amount));},0),items=receipts.reduce(function(s,t){return s+Number(t.shoppingItemCount||list(t.shoppingItemsSnapshot).length||0);},0);
    return{count:receipts.length,total:total,average:receipts.length?total/receipts.length:0,itemCount:items,transactions:clone(receipts)};
  }
  function savingsStats(state,range){
    var entries=savingsEntries(state,range),deposits=entries.filter(function(e){return e.type==='deposit';}).reduce(function(s,e){return s+e.amount;},0),withdrawals=entries.filter(function(e){return e.type==='withdrawal';}).reduce(function(s,e){return s+e.amount;},0);
    var current=list(state.savingsGoals).reduce(function(s,g){return s+Math.max(0,number(g&&g.saved));},0),target=list(state.savingsGoals).reduce(function(s,g){return s+Math.max(0,number(g&&g.target));},0);
    return{deposits:deposits,withdrawals:withdrawals,net:deposits-withdrawals,currentSaved:current,target:target,goalProgress:target?current/target*100:0,entries:entries};
  }
  function bucketMode(days){if(days<=62)return'day';if(days<=240)return'week';return'month';}
  function bucketKey(date,mode,range){
    if(mode==='month')return date.slice(0,7)+'-01';
    if(mode==='week'){var d=parseDate(date),start=parseDate(range.start),diff=Math.floor((d-start)/86400000),offset=Math.floor(diff/7)*7;return isoDate(addDays(start,offset));}
    return date;
  }
  function trendRows(flows,range){
    var mode=bucketMode(range.days),map={};
    flows.forEach(function(f){var key=bucketKey(f.date,mode,range);if(!map[key])map[key]={date:key,income:0,expenses:0,savings:0};if(f.type==='income')map[key].income+=f.amount;else if(f.type==='expense')map[key].expenses+=f.amount;else if(f.type==='savingsDeposit')map[key].savings+=f.amount;else if(f.type==='savingsWithdrawal')map[key].savings-=f.amount;});
    return{mode:mode,rows:Object.keys(map).sort().map(function(k){return map[k];})};
  }
  function analysePeriod(state,options){
    options=options||{};var range=normalizeRange(options.range),cycleStartDay=Math.min(31,Math.max(1,Number(options.cycleStartDay)||1)),flows=buildFlows(state,range,{cycleStartDay:cycleStartDay});
    var income=sumType(flows,'income'),expenses=sumType(flows,'expense'),savings=savingsStats(state,range),fixed=flows.filter(function(f){return f.type==='expense'&&f.fixed;}).reduce(function(s,f){return s+f.amount;},0),variable=expenses-fixed;
    var result=income-expenses-savings.net,categories=categoryRows(flows,expenses),receipts=receiptStats(state,range),trend=trendRows(flows,range);
    return{version:VERSION,range:range,cycleStartDay:cycleStartDay,cycleDates:cycleDates(range,cycleStartDay),metrics:{income:income,expenses:expenses,fixedExpenses:fixed,variableExpenses:variable,savingsDeposits:savings.deposits,savingsWithdrawals:savings.withdrawals,netSavings:savings.net,result:result,disposableBeforeSavings:income-expenses,savingsRate:income?(savings.net/income*100):0,transactionCount:flows.filter(function(f){return f.source==='transaction'&&f.type!=='income';}).length},categories:categories,savings:savings,receipts:receipts,trend:trend,flows:clone(flows)};
  }
  function delta(current,previous){current=number(current);previous=number(previous);return{absolute:current-previous,percent:previous?((current-previous)/Math.abs(previous)*100):(current===0?0:null)};}
  function compareCategories(primary,comparison){
    var map={};primary.categories.forEach(function(r){map[r.category]={category:r.category,current:r.amount,previous:0};});comparison.categories.forEach(function(r){if(!map[r.category])map[r.category]={category:r.category,current:0,previous:0};map[r.category].previous=r.amount;});
    return Object.keys(map).map(function(k){var r=map[k];r.delta=r.current-r.previous;r.deltaPercent=r.previous?(r.delta/Math.abs(r.previous)*100):(r.current?null:0);return r;}).sort(function(a,b){return Math.abs(b.delta)-Math.abs(a.delta);});
  }
  function insightRows(primary,comparison){
    var categories=compareCategories(primary,comparison),out=[];
    var increase=categories.filter(function(r){return r.delta>0;}).sort(function(a,b){return b.delta-a.delta;})[0];
    var decrease=categories.filter(function(r){return r.delta<0;}).sort(function(a,b){return a.delta-b.delta;})[0];
    if(increase)out.push({type:'increase',title:'Grootste stijging',category:increase.category,amount:increase.delta});
    if(decrease)out.push({type:'decrease',title:'Grootste daling',category:decrease.category,amount:Math.abs(decrease.delta)});
    if(primary.metrics.netSavings>0)out.push({type:'savings',title:'Netto gespaard',amount:primary.metrics.netSavings,rate:primary.metrics.savingsRate});
    if(primary.receipts.count)out.push({type:'receipts',title:'Boodschappenritten',count:primary.receipts.count,amount:primary.receipts.total,itemCount:primary.receipts.itemCount});
    return out;
  }
  function comparePeriods(state,options){
    options=options||{};var range=normalizeRange(options.range),compareRange=normalizeRange(options.compareRange||previousEqualRange(range)),cycleStartDay=Math.min(31,Math.max(1,Number(options.cycleStartDay)||1));
    var primary=analysePeriod(state,{range:range,cycleStartDay:cycleStartDay}),comparison=analysePeriod(state,{range:compareRange,cycleStartDay:cycleStartDay});
    var keys=['income','expenses','fixedExpenses','variableExpenses','netSavings','result','disposableBeforeSavings'];var deltas={};keys.forEach(function(k){deltas[k]=delta(primary.metrics[k],comparison.metrics[k]);});
    return{version:VERSION,primary:primary,comparison:comparison,deltas:deltas,categories:compareCategories(primary,comparison),insights:insightRows(primary,comparison)};
  }
  function salaryCycleRange(reference,cycleStartDay){
    var ref=parseDate(reference)||new Date(),day=Math.min(31,Math.max(1,Number(cycleStartDay)||1)),y=ref.getUTCFullYear?ref.getUTCFullYear():ref.getFullYear(),m=ref.getUTCMonth?ref.getUTCMonth():ref.getMonth(),candidate=monthDay(y,m,day);
    if(candidate>ref){m--;if(m<0){m=11;y--;}candidate=monthDay(y,m,day);}
    var nextM=m+1,nextY=y;if(nextM>11){nextM=0;nextY++;}
    var next=monthDay(nextY,nextM,day),end=addDays(next,-1);
    return normalizeRange({start:isoDate(candidate),end:isoDate(end)});
  }

  root.FinanceAnalysisEngine={version:VERSION,normalizeRange:normalizeRange,calendarMonthRange:calendarMonthRange,previousEqualRange:previousEqualRange,salaryCycleRange:salaryCycleRange,cycleDates:cycleDates,buildFlows:buildFlows,analysePeriod:analysePeriod,comparePeriods:comparePeriods,isSavingsBudgetMirror:isSavingsBudgetMirror,dayCount:dayCount};
})(typeof window!=='undefined'?window:globalThis);
