'use strict';
const fs=require('fs');
const assert=require('assert');
const vm=require('vm');

const interaction=fs.readFileSync('src/modules/finance/financeSavingsInteraction.js','utf8');
const addSheet=fs.readFileSync('src/core/addSheet.js','utf8');
const bootstrap=fs.readFileSync('src/modules/calendar/calendar.js','utf8');

assert.ok(interaction.includes("savings_tx:'saveSavingsTransaction'"),'special savings transaction save route must be explicit');
assert.ok(interaction.includes("spaar_vanuit_budget:'saveSparenVanuitBudget'"),'budget-to-savings save route must be explicit');
assert.ok(interaction.includes('canonicalGoalId'),'legacy numeric savings ids must resolve back to canonical ids');
assert.ok(interaction.includes("String(g.id)"),'presentation savings ids must normalize to strings for data-* controls');
assert.ok(addSheet.indexOf("if(!val){closeAdd();return;}")<addSheet.indexOf("currentAddType==='savings_tx'"),'legacy generic f1 guard exists before special finance routing and therefore needs the final interaction owner');
const calIdx=bootstrap.indexOf('calendarSharedLive.js?v=6');
const savingsIdx=bootstrap.indexOf('financeSavingsInteraction.js?v=1');
assert.ok(calIdx>=0&&savingsIdx>calIdx,'finance savings interaction must load after CalendarSharedLive final add-sheet ownership');

let genericCalls=0,specialCalls=0,capturedGoal=null;
const state={savingsGoals:[{id:1,name:'Legacy numeric goal',saved:20,target:100,log:[{id:7,amount:20,type:'deposit'}]}]};
const FinanceStore={
  get(){return JSON.parse(JSON.stringify(state));},
  addSavingsTransaction(goalId){capturedGoal=goalId;return Promise.resolve({id:'newlog'});},
  updateSavingsGoal(){return Promise.resolve();},deleteSavingsGoal(){return Promise.resolve();},deleteSavingsLogEntry(){return Promise.resolve();}
};
const listeners={};
const window={
  FinanceStore,
  currentAddType:'spaar_vanuit_budget',
  savingsGoals:JSON.parse(JSON.stringify(state.savingsGoals)),
  extraIncome:[],finTab:'maandplan',
  saveItem(){genericCalls++;return'generic';},
  saveSavingsTransaction(){specialCalls++;return'savings';},
  saveSparenVanuitBudget(){specialCalls++;return'budget';},
  addEventListener(type,fn){(listeners[type]||(listeners[type]=[])).push(fn);},
  showToast(){},
};
const sandbox={window,console,JSON,String,Array,Object,Promise,setTimeout(fn){fn();return 1;},setInterval(fn){fn();return 1;},clearInterval(){}};
vm.createContext(sandbox);
vm.runInContext(interaction,sandbox,{filename:'financeSavingsInteraction.js'});

assert.strictEqual(window.savingsGoals[0].id,'1','presentation projection must convert legacy numeric goal id to string');
assert.strictEqual(window.savingsGoals[0].log[0].id,'7','presentation projection must convert legacy numeric log id to string');
window.saveItem();
assert.strictEqual(specialCalls,1,'special budget-to-savings save must run directly');
assert.strictEqual(genericCalls,0,'generic add-sheet f1 validation must be bypassed for special savings sheets');

Promise.resolve(window.FinanceStore.addSavingsTransaction('1',{amount:5})).then(function(){
  assert.strictEqual(capturedGoal,1,'string UI goal id must resolve to original canonical numeric id');
  console.log('STEP 8 finance savings interaction regression: PASS');
}).catch(function(error){console.error(error);process.exit(1);});
