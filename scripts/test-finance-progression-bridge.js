'use strict';
const fs=require('fs');
const assert=require('assert');
const vm=require('vm');

const runtimeSource=fs.readFileSync('src/core/progressionRuntime.js','utf8');
const bridgeSource=fs.readFileSync('src/modules/finance/financeProgressionBridge.js','utf8');
const loaderSource=fs.readFileSync('api/app.js','utf8');

(async function(){
  let xp=30;
  const rewards={};
  const ProgressionStore={
    getCurrentXp(){return xp;},
    status(){return{uid:'userA',householdId:'houseA',attached:true,xp};},
    hasReward(key){return !!rewards[key];},
    hasAchievement(){return false;},
    awardOnce(key,amount,meta){
      if(rewards[key])return Promise.resolve({awarded:false,key,amount:0,xp});
      rewards[key]={amount,meta};xp+=amount;sandbox.myXP=xp;
      return Promise.resolve({awarded:true,key,amount,xp});
    },
    unlockAchievementOnce(){return Promise.resolve({unlocked:false,awarded:false,xp});}
  };

  let snapshot={savingsGoals:[{id:'g1',saved:90,target:100,log:[]}]};
  let logSeq=0,goalSeq=1,extraSeq=0,incomeStamp=1000;
  const FinanceStore={
    get(){return JSON.parse(JSON.stringify(snapshot));},
    addSavingsTransaction(goalId,entry){
      logSeq++;const row={id:'log'+logSeq,...entry};
      const goal=snapshot.savingsGoals.find(g=>String(g.id)===String(goalId));
      if(goal){goal.log.push(row);goal.saved=Math.max(0,goal.saved+(entry.type==='deposit'?entry.amount:-entry.amount));}
      return Promise.resolve(row);
    },
    addSavingsGoal(data){goalSeq++;const goal={id:'g'+goalSeq,saved:0,log:[],...data};snapshot.savingsGoals.push(goal);return Promise.resolve(goal);},
    addExtraIncome(data){extraSeq++;return Promise.resolve({id:'ex'+extraSeq,...data});},
    setIncome(slot,patch){incomeStamp++;return Promise.resolve({label:patch.label||'Salaris',amount:patch.amount||0,updatedAt:incomeStamp});}
  };

  const sandbox={
    console,Promise,Date,Math,JSON,Object,String,Number,Array,Set,isFinite,setTimeout,clearTimeout,
    ProgressionStore,FinanceStore,currentAddType:'eenmalig',
    myXP:xp,unlockedBadges:{},newBadges:{},BADGES:[],taskData:[],noteData:[],feedData:[],recurData:[],tradesCount:0,visitedScreens:new Set(),
    getLevel(){return 1;},showXPPopup(){},updateHomeXP(){},showAchievementToast(){},
    awardXP(){throw new Error('legacy award must be replaced');},checkAchievements(){},
    addEventListener(){},dispatchEvent(){},
    document:{readyState:'complete',getElementById(){return null;}}
  };
  sandbox.window=sandbox;
  vm.createContext(sandbox);
  vm.runInContext(runtimeSource,sandbox,{filename:'progressionRuntime.js'});
  vm.runInContext(bridgeSource,sandbox,{filename:'financeProgressionBridge.js'});

  assert.strictEqual(sandbox.FinanceProgressionBridge.version,'1.0.1');
  const status=sandbox.FinanceProgressionBridge.status();
  assert.strictEqual(status.savingsTransaction,true);
  assert.strictEqual(status.savingsGoal,true);
  assert.strictEqual(status.extraIncome,true);
  assert.strictEqual(status.income,true);

  // Manual savings transaction knows its stable Finance log id before the two
  // existing UI awardXP calls run.
  const log1=await sandbox.FinanceStore.addSavingsTransaction('g1',{amount:15,type:'deposit',who:'A',date:'2026-08-24'});
  const reached=await sandbox.awardXP(25,'Spaardoel bereikt');
  const savingsTx=await sandbox.awardXP(2,'Spaartransactie');
  assert.strictEqual(log1.id,'log1');
  assert.strictEqual(reached.key,'finance:savingsGoalReached:g1');
  assert.strictEqual(savingsTx.key,'finance:savingsTx:g1:log1');
  assert.ok(rewards['finance:savingsGoalReached:g1']);
  assert.ok(rewards['finance:savingsTx:g1:log1']);

  // Later deposits may trigger the legacy reached UI branch again, but the goal
  // reward itself remains one-time while each real savings log may earn its own 2 XP.
  const log2=await sandbox.FinanceStore.addSavingsTransaction('g1',{amount:5,type:'deposit',who:'A',date:'2026-08-24'});
  const reachedAgain=await sandbox.awardXP(25,'Spaardoel bereikt');
  const savingsTx2=await sandbox.awardXP(2,'Spaartransactie');
  assert.strictEqual(reachedAgain.awarded,false);
  assert.strictEqual(savingsTx2.key,'finance:savingsTx:g1:log2');

  // Maandplan -> savings uses an internal budget-linked log. It has an existing
  // goal-reached side reward but deliberately no Spaartransactie reward.
  const beforePending=sandbox.ProgressionRuntime.status().pendingRewardCount;
  const budgetLog=await sandbox.FinanceStore.addSavingsTransaction('g1',{amount:10,type:'deposit',_fromBudget:true});
  const budgetReached=await sandbox.awardXP(25,'Spaardoel bereikt');
  assert.strictEqual(budgetLog.id,'log3');
  assert.strictEqual(budgetReached.key,'finance:savingsGoalReached:g1');
  assert.strictEqual(sandbox.ProgressionRuntime.status().pendingRewardCount,beforePending,'budget path must not leave a Spaartransactie context behind');

  const goal=await sandbox.FinanceStore.addSavingsGoal({name:'Vakantie',target:500});
  const goalReward=await sandbox.awardXP(5,'Spaardoel aangemaakt');
  assert.strictEqual(goalReward.key,'finance:savingsGoalCreated:'+goal.id);

  // Current Maandplan one-off flow labels this reward 'Eenmalig'.
  sandbox.currentAddType='eenmalig';
  const extra=await sandbox.FinanceStore.addExtraIncome({name:'Bonus',amount:100});
  const extraReward=await sandbox.awardXP(2,'Eenmalig');
  assert.strictEqual(extraReward.key,'finance:extraIncome:'+extra.id);

  // Generic add-sheet extra-income entry point uses the older label
  // 'Extra inkomen' but must resolve to the same stable Finance record scheme.
  sandbox.currentAddType='extraincome';
  const genericExtra=await sandbox.FinanceStore.addExtraIncome({name:'Vakantiegeld',amount:500});
  const genericReward=await sandbox.awardXP(3,'Extra inkomen');
  assert.strictEqual(genericReward.key,'finance:extraIncome:'+genericExtra.id);

  // Internal linked extra-income record has no corresponding legacy XP call and
  // must therefore not poison a later manual context.
  const pendingBeforeInternal=sandbox.ProgressionRuntime.status().pendingRewardCount;
  await sandbox.FinanceStore.addExtraIncome({name:'Sparen',amount:-10,_savingsBudgetRef:'log3'});
  assert.strictEqual(sandbox.ProgressionRuntime.status().pendingRewardCount,pendingBeforeInternal);

  const income=await sandbox.FinanceStore.setIncome('primary',{amount:3000});
  const incomeReward=await sandbox.awardXP(2,'Inkomen bijgesteld');
  assert.strictEqual(incomeReward.key,'finance:income:primary:'+income.updatedAt);

  assert.strictEqual(sandbox.ProgressionRuntime.status().fallbackRewardCount,0,'tested Finance side rewards must all use deterministic keys');
  assert.strictEqual(sandbox.ProgressionRuntime.status().pendingRewardCount,0,'Finance contexts must all be consumed');

  if(loaderSource.includes('financeProgressionBridge.js')){
    const runtimeIdx=loaderSource.indexOf('src/core/progressionRuntime.js?v=2');
    const bridgeIdx=loaderSource.indexOf('src/modules/finance/financeProgressionBridge.js?v=1');
    assert.ok(runtimeIdx>-1&&bridgeIdx>runtimeIdx,'Finance XP adapter must load after canonical progression runtime');
  }

  console.log('STEP 9 deterministic Finance side reward contract: PASS');
})().catch(error=>{console.error(error);process.exit(1);});
