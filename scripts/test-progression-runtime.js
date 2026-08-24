'use strict';
const fs=require('fs');
const assert=require('assert');
const vm=require('vm');

const runtimeSource=fs.readFileSync('src/core/progressionRuntime.js','utf8');
const uidBridgeSource=fs.readFileSync('src/core/progressionUidBridge.js','utf8');
const achievementBridgeSource=fs.readFileSync('src/modules/achievements/achievementUidBridge.js','utf8');
const taskBridgeSource=fs.readFileSync('src/modules/tasks/taskRewardBridge.js','utf8');
const loaderSource=fs.readFileSync('api/app.js','utf8');

function tick(){return new Promise(resolve=>setTimeout(resolve,0));}

(async function(){
  // Static authority checks: compatibility bridges must no longer own Firebase
  // XP/achievement listeners or localStorage migration.
  assert.ok(uidBridgeSource.includes("version:'3.0.0'"),'ProgressionUidBridge v3 must be active');
  assert.ok(!uidBridgeSource.includes("d.ref('families/"),'ProgressionUidBridge must not own member Firebase refs anymore');
  assert.ok(!uidBridgeSource.includes("fam_myxp_v1"),'ProgressionUidBridge must not seed/read legacy XP cache');
  assert.ok(achievementBridgeSource.includes("version:'2.0.0'"),'AchievementUidBridge v2 must be active');
  assert.ok(!achievementBridgeSource.includes("/achievements/'"),'AchievementUidBridge must not own legacy achievement Firebase path');
  assert.ok(!achievementBridgeSource.includes('ServerValue.increment'),'AchievementUidBridge must not mutate legacy XP');

  // Served loader must activate canonical store/runtime after HouseholdContext and
  // use cache-busted compatibility bridge versions.
  const hIdx=loaderSource.indexOf('src/core/householdContext.js?v=1');
  const sIdx=loaderSource.indexOf('src/core/progressionStore.js?v=1');
  const rIdx=loaderSource.indexOf('src/core/progressionRuntime.js?v=1');
  assert.ok(hIdx>-1&&sIdx>hIdx&&rIdx>sIdx,'loader order must be HouseholdContext -> ProgressionStore -> ProgressionRuntime');
  assert.ok(loaderSource.includes('src/core/progressionUidBridge.js?v=3'));
  assert.ok(loaderSource.includes('src/modules/achievements/achievementUidBridge.js?v=2'));
  assert.ok(loaderSource.includes('src/modules/tasks/taskRewardBridge.js?v=3'));

  let xp=100;
  const rewards={};
  const achievements={};
  const calls={legacyAward:0,legacyCheck:0,popup:0,levelup:0,achievementToast:0,home:0};

  const ProgressionStore={
    getCurrentXp(){return xp;},
    status(){return{uid:'userA',householdId:'houseA',attached:true,xp};},
    hasReward(key){return !!rewards[key];},
    hasAchievement(id){return !!achievements[id];},
    awardOnce(key,amount,meta){
      if(rewards[key])return Promise.resolve({awarded:false,key,amount:0,xp});
      rewards[key]={amount,meta};xp+=amount;
      window.myXP=xp;
      return Promise.resolve({awarded:true,key,amount,xp});
    },
    unlockAchievementOnce(id,amount,meta){
      if(achievements[id])return Promise.resolve({unlocked:false,awarded:false,badgeId:id,amount:0,xp});
      achievements[id]={amount,meta};
      const key='achievement:'+id;
      if(!rewards[key]&&amount>0){rewards[key]={amount,meta};xp+=amount;}
      window.myXP=xp;
      window.unlockedBadges[id]=true;
      return Promise.resolve({unlocked:true,awarded:amount>0,badgeId:id,amount,xp});
    }
  };

  const doneTasks=Array.from({length:10},(_,i)=>({id:i+1,done:true}));
  const window={
    ProgressionStore,
    myXP:100,
    unlockedBadges:{},
    newBadges:{},
    BADGES:[
      {id:'task_10',name:'Taak-atleet',xp:15},
      {id:'always',name:'Altijd',xp:5,check(){return true;}}
    ],
    taskData:doneTasks,
    noteData:[],feedData:[],recurData:[],tradesCount:0,
    visitedScreens:new Set(),
    awardXP(){calls.legacyAward++;},
    checkAchievements(){calls.legacyCheck++;},
    getLevel(value){return value>=120?2:1;},
    showXPPopup(){calls.popup++;},
    showLevelUp(){calls.levelup++;},
    showAchievementToast(){calls.achievementToast++;},
    updateHomeXP(){calls.home++;},
    addEventListener(){},
    dispatchEvent(){}
  };
  const document={readyState:'loading',getElementById(){return null;}};
  const sandbox={window,document,console,setTimeout,clearTimeout,Promise,Date,Math,JSON,Object,String,Number,Array,Set,isFinite};
  vm.createContext(sandbox);
  vm.runInContext(runtimeSource,sandbox,{filename:'progressionRuntime.js'});

  assert.ok(window.ProgressionRuntime,'ProgressionRuntime must install');
  assert.strictEqual(window.ProgressionRuntime.version,'1.0.0');
  assert.strictEqual(window.awardXP.__canonicalProgression,true,'global awardXP must be canonicalized');
  assert.strictEqual(window.checkAchievements.__canonicalProgression,true,'global checkAchievements must be canonicalized');

  // One deterministic source event awards once. Achievement evaluation runs on
  // canonical state and unlocks eligible badges once without invoking the old
  // mutating achievement function.
  const first=await window.awardXP(4,'Taak',{key:'manual:test',source:'test',sourceId:'1'});
  await tick();
  assert.strictEqual(first.awarded,true);
  assert.strictEqual(calls.legacyAward,0,'legacy awardXP implementation must never mutate canonical XP');
  assert.strictEqual(calls.legacyCheck,0,'legacy checkAchievements implementation must never mutate canonical XP');
  assert.strictEqual(calls.popup,1,'visible XP popup should happen for the actual reward');
  assert.strictEqual(achievements.task_10.amount,15,'dynamic task achievement must be projected canonically');
  assert.strictEqual(achievements.always.amount,5,'existing badge check functions must still be honored');
  assert.strictEqual(calls.achievementToast,2,'each newly unlocked achievement should toast once');
  assert.strictEqual(xp,124,'4 XP + 15 + 5 achievement XP must be canonical');

  const duplicate=await window.awardXP(4,'Taak',{key:'manual:test',source:'test',sourceId:'1'});
  await tick();
  assert.strictEqual(duplicate.awarded,false,'same deterministic source event may not award twice');
  assert.strictEqual(xp,124,'duplicate reward/achievement checks must not change XP');
  assert.strictEqual(calls.popup,1,'duplicate reward must not show a second XP popup');
  assert.strictEqual(calls.achievementToast,2,'already unlocked badges must not toast twice');

  // Transitional callers without a deterministic key stay canonical but are
  // explicitly counted so STEP 9 can drive that number to zero before freeze.
  const beforeFallback=window.ProgressionRuntime.status().fallbackRewardCount;
  const fallback=await window.awardXP(2,'Legacy actie');
  assert.strictEqual(fallback.awarded,true);
  assert.strictEqual(window.ProgressionRuntime.status().fallbackRewardCount,beforeFallback+1);
  assert.ok(fallback.key.startsWith('legacy:userA:houseA:legacy-actie:'),'fallback key must be visibly transitional and identity-scoped');

  // TaskRewardBridge must add a deterministic task key and the task-specific
  // configured XP while preserving the canonical runtime underneath.
  window.taskData=[{id:42,done:false,rewardXp:7}];
  window.toggleTask=function(id){
    const task=window.taskData.find(t=>String(t.id)===String(id));
    task.done=!task.done;
    if(task.done)return window.awardXP(4,'Taak');
  };
  document.readyState='complete';
  vm.runInContext(taskBridgeSource,sandbox,{filename:'taskRewardBridge.js'});
  await tick();
  const taskResult=await window.toggleTask(42);
  await tick();
  assert.strictEqual(taskResult.awarded,true);
  assert.ok(rewards['task:42'],'task bridge must use deterministic task reward key');
  assert.strictEqual(rewards['task:42'].amount,7,'task bridge must preserve configured task reward XP');
  const taskXpAfterFirst=xp;
  window.toggleTask(42); // reopen, no reward
  const secondTask=await window.toggleTask(42); // complete again, same key
  await tick();
  assert.strictEqual(secondTask.awarded,false,'re-completing same one-off task may not farm XP');
  assert.strictEqual(xp,taskXpAfterFirst,'re-completing same one-off task must not increment XP');

  console.log('STEP 9 canonical progression runtime contract: PASS');
})().catch(error=>{console.error(error);process.exit(1);});
