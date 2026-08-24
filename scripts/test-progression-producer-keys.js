'use strict';
const fs=require('fs');
const assert=require('assert');
const vm=require('vm');

const dailySource=fs.readFileSync('src/core/dailyBonus.js','utf8');
const partySource=fs.readFileSync('src/modules/tasks/partyQuestCompletionReward.js','utf8');
const loaderSource=fs.readFileSync('api/app.js','utf8');

function tick(){return new Promise(resolve=>setTimeout(resolve,0));}
function storage(){const m=new Map();return{getItem(k){return m.has(k)?m.get(k):null;},setItem(k,v){m.set(k,String(v));},dump(){return Object.fromEntries(m.entries());}};}

async function testDaily(){
  const localStorage=storage();
  const overlay={style:{display:'flex'},_pendingXP:9};
  const st={textContent:''},xpEl={textContent:''};
  const calls=[];
  const seen={};
  const document={getElementById(id){return id==='daily-bonus-overlay'?overlay:id==='daily-bonus-streak'?st:id==='daily-bonus-xp'?xpEl:null;}};
  function awardXP(amount,reason,options){
    calls.push({amount,reason,options});
    if(seen[options.key])return Promise.resolve({awarded:false,key:options.key,amount:0,xp:9});
    seen[options.key]=true;
    return Promise.resolve({awarded:true,key:options.key,amount,xp:9});
  }
  let toastCount=0,confettiCount=0;
  const sandbox={
    window:{},document,localStorage,console,Promise,Date,Math,JSON,
    todayStr(){return'2026-08-24';},
    awardXP,
    showToast(){toastCount++;},
    spawnConfetti(){confettiCount++;}
  };
  vm.createContext(sandbox);
  vm.runInContext(dailySource,sandbox,{filename:'dailyBonus.js'});

  sandbox.claimDailyBonus();
  await tick();await tick();
  assert.strictEqual(calls.length,1);
  assert.strictEqual(calls[0].options.key,'daily:2026-08-24','daily reward key must be calendar-date deterministic');
  assert.strictEqual(calls[0].options.source,'daily-bonus');
  assert.strictEqual(JSON.parse(localStorage.getItem('familie_daily_bonus')).lastClaim,'2026-08-24','local claim marker may persist after canonical reward settles');
  assert.strictEqual(overlay.style.display,'none');
  assert.strictEqual(confettiCount,1);

  // Even if the handler is invoked again manually, the same date key must be
  // reused so the canonical store can reject the duplicate XP.
  overlay.style.display='flex';
  sandbox.claimDailyBonus();
  await tick();await tick();
  assert.strictEqual(calls.length,2);
  assert.strictEqual(calls[1].options.key,'daily:2026-08-24');
  assert.strictEqual(calls[1].amount,9);
  assert.ok(toastCount>=2);
}

async function testPartyQuest(){
  const claims={};
  const awardKeys={};
  const awardCalls=[];
  let endCount=0;
  let activeQuest={id:'q1',questId:'t1',questTitle:'Samen opruimen'};
  let failReward=false;

  function makeSnapshot(v){return{val(){return v;}};}
  const fbDb={ref(path){
    return{transaction(updater){
      const current=claims[path]||null;
      const next=updater(current);
      if(next===undefined)return Promise.resolve({committed:false,snapshot:makeSnapshot(current)});
      claims[path]=next;
      return Promise.resolve({committed:true,snapshot:makeSnapshot(next)});
    }};
  }};

  const window={
    fbUser:{uid:'u1'},fbFamilyId:'h1',fbDb,
    taskData:[{id:'t1',done:true,rewardXp:6},{id:'t2',done:true,rewardXp:8}],
    ProgressionUidBridge:{rewardXp(task){return task.rewardXp||4;}},
    PartyQuestActiveView:{
      list(){return activeQuest?[activeQuest]:[];},
      endQuest(){endCount++;activeQuest=null;return Promise.resolve();}
    },
    awardXP(amount,reason,options){
      awardCalls.push({amount,reason,options});
      if(failReward)return Promise.resolve({awarded:false,key:options.key,error:'WRITE_FAILED'});
      if(awardKeys[options.key])return Promise.resolve({awarded:false,key:options.key,amount:0});
      awardKeys[options.key]=true;
      return Promise.resolve({awarded:true,key:options.key,amount});
    },
    addActivity(){},showToast(){},addEventListener(){}
  };
  const firebase={
    auth(){return{currentUser:window.fbUser};},
    database(){return fbDb;}
  };
  firebase.database.ServerValue={TIMESTAMP:123};
  function scheduled(fn,ms){if(ms===600)return 1;Promise.resolve().then(fn);return 1;}
  // Browser scripts can reference window properties through bare global names.
  // Mirror those bindings explicitly in Node's vm test context.
  const sandbox={
    window,firebase,console,Promise,Date,Math,JSON,Object,String,Number,Array,
    setTimeout:scheduled,clearTimeout(){},
    PartyQuestActiveView:window.PartyQuestActiveView,
    ProgressionUidBridge:window.ProgressionUidBridge,
    awardXP:window.awardXP,
    addActivity:window.addActivity,
    showToast:window.showToast
  };
  vm.createContext(sandbox);
  vm.runInContext(partySource,sandbox,{filename:'partyQuestCompletionReward.js'});

  assert.strictEqual(window.PartyQuestCompletionReward.version,'3.0.0');
  window.PartyQuestCompletionReward.scan();
  await tick();await tick();await tick();await tick();
  assert.strictEqual(awardCalls.length,1);
  assert.strictEqual(awardCalls[0].options.key,'partyQuest:q1','party quest reward key must be stable per quest');
  assert.strictEqual(awardCalls[0].options.source,'party-quest');
  assert.strictEqual(endCount,1,'quest may end after claim and canonical XP settle successfully');

  // Existing Firebase claim + already-awarded canonical key is still settled;
  // replaying q1 must not create extra XP but may safely close a recovered view.
  activeQuest={id:'q1',questId:'t1',questTitle:'Samen opruimen'};
  window.PartyQuestCompletionReward.scan();
  await tick();await tick();await tick();await tick();
  assert.strictEqual(awardCalls.length,2);
  assert.strictEqual(awardCalls[1].options.key,'partyQuest:q1');
  assert.strictEqual(Object.keys(awardKeys).length,1,'duplicate party quest replay must reuse canonical reward key');
  assert.strictEqual(endCount,2,'already-settled replay may close the recovered quest view');

  // New claim with canonical XP write error must stay active so a later scan can
  // retry and repair the reward instead of permanently losing XP.
  activeQuest={id:'q2',questId:'t2',questTitle:'Grote schoonmaak'};
  failReward=true;
  window.PartyQuestCompletionReward.scan();
  await tick();await tick();await tick();await tick();
  assert.strictEqual(awardCalls[2].options.key,'partyQuest:q2');
  assert.strictEqual(endCount,2,'failed canonical XP write must not end the party quest');
  assert.ok(activeQuest&&activeQuest.id==='q2','failed reward must remain recoverable');
}

(async function(){
  assert.ok(loaderSource.includes('src/core/dailyBonus.js?v=2'),'served daily bonus cache must be bumped');
  assert.ok(loaderSource.includes('src/modules/tasks/partyQuestCompletionReward.js?v=3'),'served party quest reward cache must be bumped');
  await testDaily();
  await testPartyQuest();
  console.log('STEP 9 deterministic progression producer contract: PASS');
})().catch(error=>{console.error(error);process.exit(1);});
