'use strict';
const fs=require('fs');
const assert=require('assert');
const vm=require('vm');

const dailySource=fs.readFileSync('src/core/dailyBonus.js','utf8');
const partySource=fs.readFileSync('src/modules/tasks/partyQuestCompletionReward.js','utf8');
const loaderSource=fs.readFileSync('api/app.js','utf8');

function tick(){return new Promise(resolve=>setTimeout(resolve,0));}
function storage(){const m=new Map();return{getItem(k){return m.has(k)?m.get(k):null;},setItem(k,v){m.set(k,String(v));},dump(){return Object.fromEntries(m.entries());}};}
function clone(v){return v===undefined?undefined:JSON.parse(JSON.stringify(v));}

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
  let state={uid:'u1',householdId:'h1',ready:true,revision:1};
  let failReward=false;
  const awardKeys={};
  const awardCalls=[];
  const marks=[];
  let rows={q1:{
    id:'q1',questId:'t1',questTitle:'Samen opruimen',status:'completed',inviterUid:'u1',
    completion:{occurrenceId:'partyQuest:q1:completion:v1',participantUids:['u1'],xpPerParticipant:6},
    rewardSettlements:{u1:{uid:'u1',occurrenceId:'partyQuest:q1:completion:v1',rewardKey:'partyQuest:q1',amount:6,status:'pending'}}
  }};

  const repository={
    list(){return Object.values(clone(rows));},
    subscribe(){return function(){};}
  };
  const progression={
    awardOnce(key,amount,options){
      awardCalls.push({key,amount,options});
      if(failReward)return Promise.reject(new Error('WRITE_FAILED'));
      if(awardKeys[key])return Promise.resolve({awarded:false,key,amount:0});
      awardKeys[key]=true;
      return Promise.resolve({awarded:true,key,amount});
    },
    hasReward(key){return !!awardKeys[key];}
  };
  const service={
    completeFromTask(){return Promise.resolve();},
    markRewardSettled(id,occurrenceId){
      marks.push({id,occurrenceId});
      if(rows[id]&&rows[id].rewardSettlements&&rows[id].rewardSettlements[state.uid])rows[id].rewardSettlements[state.uid].status='settled';
      return Promise.resolve(clone(rows[id]));
    }
  };
  const listeners={};
  const sandbox={
    window:null,console,Promise,Date,Math,JSON,Object,String,Number,Array,Boolean,RegExp,Error,
    setTimeout(){return 1;},clearTimeout(){},
    addEventListener(type,fn){listeners[type]=fn;},dispatchEvent(){},
    showToast(){},addActivity(){},taskData:[]
  };
  sandbox.window=sandbox;
  sandbox.HouseholdContext={
    snapshot(){return clone(state);},
    capture(){return Object.freeze({uid:state.uid,householdId:state.householdId,revision:state.revision});},
    isCurrent(token){return !!token&&token.uid===state.uid&&token.householdId===state.householdId&&token.revision===state.revision;}
  };
  sandbox.PartyQuestRepository=repository;
  sandbox.PartyQuestService=service;
  sandbox.ProgressionStore=progression;
  sandbox.TaskHouseholdRepository={list(){return[];}};
  vm.createContext(sandbox);
  vm.runInContext(partySource,sandbox,{filename:'partyQuestCompletionReward.js'});

  assert.strictEqual(sandbox.PartyQuestCompletionReward.version,'4.0.0');
  await sandbox.PartyQuestCompletionReward.scan();
  assert.strictEqual(awardCalls.length,1);
  assert.strictEqual(awardCalls[0].key,'partyQuest:q1','party quest reward key must remain stable per quest');
  assert.strictEqual(awardCalls[0].options.source,'party-quest');
  assert.strictEqual(marks.length,1,'settlement acknowledgement follows canonical XP success');

  // Simulate a crash after canonical XP but before the Party Quest settlement
  // acknowledgement: restoring pending must reuse the same deterministic key.
  rows.q1.rewardSettlements.u1.status='pending';
  await sandbox.PartyQuestCompletionReward.scan();
  assert.strictEqual(awardCalls.length,2);
  assert.strictEqual(awardCalls[1].key,'partyQuest:q1');
  assert.strictEqual(Object.keys(awardKeys).length,1,'duplicate Party Quest replay must reuse one canonical reward key');
  assert.strictEqual(marks.length,2,'already-awarded pending settlement may converge safely');

  // A new Party Quest whose canonical XP write fails must stay pending; there is
  // no preclaim that could permanently suppress the retry.
  rows={q2:{
    id:'q2',questId:'t2',questTitle:'Grote schoonmaak',status:'completed',inviterUid:'u1',
    completion:{occurrenceId:'partyQuest:q2:completion:v1',participantUids:['u1'],xpPerParticipant:8},
    rewardSettlements:{u1:{uid:'u1',occurrenceId:'partyQuest:q2:completion:v1',rewardKey:'partyQuest:q2',amount:8,status:'pending'}}
  }};
  failReward=true;
  await sandbox.PartyQuestCompletionReward.scan();
  assert.strictEqual(awardCalls[2].key,'partyQuest:q2');
  assert.strictEqual(marks.length,2,'failed canonical XP write must not acknowledge settlement');
  assert.strictEqual(rows.q2.rewardSettlements.u1.status,'pending','failed reward must remain recoverable');
}

(async function(){
  assert.ok(loaderSource.includes('src/core/dailyBonus.js?v=2'),'served daily bonus cache must be bumped');
  assert.ok(loaderSource.includes('src/modules/tasks/partyQuestCompletionReward.js?v=4'),'served Party Quest reward cache must be STEP 11.5 v4');
  await testDaily();
  await testPartyQuest();
  console.log('STEP 9 deterministic progression producer contract: PASS');
})().catch(error=>{console.error(error);process.exit(1);});
