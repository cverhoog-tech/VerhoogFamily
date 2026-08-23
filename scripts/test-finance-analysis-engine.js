'use strict';
const fs=require('fs');
const assert=require('assert');
const vm=require('vm');

const engineSource=fs.readFileSync('src/modules/finance/financeAnalysisEngine.js','utf8');
const uiSource=fs.readFileSync('src/modules/finance/financeAnalysisUi.js','utf8');
const nativeTabs=fs.readFileSync('src/modules/finance/financeNativeTabs.js','utf8');
const bootstrap=fs.readFileSync('src/modules/calendar/calendar.js','utf8');
const sandbox={console,JSON,String,Array,Object,Number,Math,Date,Intl,globalThis:{}};
vm.createContext(sandbox);
vm.runInContext(engineSource,sandbox,{filename:'financeAnalysisEngine.js'});
new vm.Script(uiSource,{filename:'financeAnalysisUi.js'});
new vm.Script(nativeTabs,{filename:'financeNativeTabs.js'});
const E=sandbox.globalThis.FinanceAnalysisEngine;

assert.ok(E,'analysis engine must register globally');
assert.strictEqual(E.version,'1.0.0');
assert.deepStrictEqual(JSON.parse(JSON.stringify(E.normalizeRange({start:'2026-08-24',end:'2026-07-25'}))),{start:'2026-07-25',end:'2026-08-24',days:31});
assert.deepStrictEqual(JSON.parse(JSON.stringify(E.previousEqualRange({start:'2026-07-25',end:'2026-08-24'}))),{start:'2026-06-24',end:'2026-07-24',days:31});
assert.deepStrictEqual(JSON.parse(JSON.stringify(E.salaryCycleRange('2026-08-23',25))),{start:'2026-07-25',end:'2026-08-24',days:31});

const state={
  income:{primary:{amount:3000},partner:{amount:2000}},
  vasteLasten:[{id:'rent',name:'Huur',amount:1000,cat:'Wonen'}],
  transactions:[
    {id:'receipt',date:'2026-08-02',amount:-120,cat:'Boodschappen',sourceType:'shoppingReceipt',shoppingItemCount:5},
    {id:'fun',date:'2026-08-10',amount:-50,cat:'Uitjes'},
    {id:'bonus',date:'2026-08-12',amount:100,cat:'Inkomen'}
  ],
  extraIncome:[
    {id:'refund',date:'2026-08-05',amount:30,cat:'Teruggave'},
    {id:'savings-mirror',date:'2026-08-15',amount:-200,cat:'Sparen',_savingsBudgetRef:'goal_1'}
  ],
  savingsGoals:[{id:'goal_1',name:'Vakantie',saved:500,target:2000,log:[{id:'s1',date:'2026-08-15',amount:200,type:'deposit'}]}]
};

const result=E.analysePeriod(state,{range:{start:'2026-07-25',end:'2026-08-24'},cycleStartDay:25});
assert.strictEqual(result.metrics.income,5130,'configured salary cycle plus real positive income must be counted');
assert.strictEqual(result.metrics.expenses,1170,'fixed and ordinary expenses must exclude the savings mirror');
assert.strictEqual(result.metrics.netSavings,200,'savings must be its own flow');
assert.strictEqual(result.metrics.result,3760,'savings may be subtracted only once');
assert.strictEqual(result.metrics.fixedExpenses,1000);
assert.strictEqual(result.metrics.variableExpenses,170);
assert.strictEqual(result.receipts.count,1);
assert.strictEqual(result.receipts.itemCount,5);
assert.ok(result.categories.some(x=>x.category==='Boodschappen'&&x.amount===120));
assert.ok(!result.categories.some(x=>x.category==='Sparen'),'budget-to-savings mirror must never become an expense category');

const comparison=E.comparePeriods(state,{range:{start:'2026-07-25',end:'2026-08-24'},cycleStartDay:25});
assert.strictEqual(comparison.comparison.range.days,31,'default comparison period must be equal length');
assert.ok(comparison.deltas.expenses,'metric deltas must be available to UI/export consumers');
assert.ok(Array.isArray(comparison.categories));
assert.ok(Array.isArray(comparison.insights));

assert.ok(uiSource.includes("VERSION='1.1.0'"),'freeze-safe analysis UI version must be installed');
assert.ok(uiSource.includes("data-fa-mode=\"salary\""),'UI must offer salary-cycle analysis');
assert.ok(uiSource.includes("data-fa-mode=\"custom\""),'UI must offer a custom date range');
assert.ok(uiSource.includes('Vorige even lange periode'),'UI must offer equal-length comparison');
assert.ok(uiSource.includes('Geldstroom'),'UI must render trend analysis');
assert.ok(uiSource.includes('Waar ging het geld heen?'),'UI must render category analysis');
assert.ok(uiSource.includes('Vast versus variabel'),'UI must separate fixed and variable spending');
assert.ok(uiSource.includes('Boodschappenbonnen'),'UI must consume retained receipt history');
assert.ok(uiSource.includes('if(rendering){pending=true;return false;}'),'analysis rendering must have a re-entry guard');
assert.ok(!/new\s+(?:window\.)?MutationObserver\s*\(/.test(uiSource),'analysis UI must not create a DOM MutationObserver');

const analysisBranch=nativeTabs.slice(nativeTabs.indexOf("if(activeTab === 'analyse')"),nativeTabs.indexOf("if(activeTab === 'sparen')"));
assert.ok(analysisBranch.includes('FinanceAnalysisUI.render()'),'native tabs must call the canonical analysis renderer directly');
assert.ok(!analysisBranch.includes('renderFinance()'),'legacy renderFinance must never execute before canonical analysis');
assert.ok(nativeTabs.includes("window.finTab = activeTab"),'native tab state must stay aligned with legacy finance state');

const engineIdx=bootstrap.indexOf('financeAnalysisEngine.js?v=1');
const uiIdx=bootstrap.indexOf('financeAnalysisUi.js?v=2');
assert.ok(engineIdx>=0&&uiIdx>engineIdx,'analysis engine must load before analysis UI');
assert.ok(bootstrap.indexOf('financeStore.js?v=4')<engineIdx,'canonical FinanceStore must load before analysis');

console.log('STEP 8 finance period analysis regression: PASS');
