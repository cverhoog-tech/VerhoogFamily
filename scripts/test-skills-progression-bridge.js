'use strict';
const fs=require('fs');
const assert=require('assert');
const vm=require('vm');

const runtimeSource=fs.readFileSync('src/core/progressionRuntime.js','utf8');
const bridgeSource=fs.readFileSync('src/modules/skills/skillsProgressionBridge.js','utf8');
const loaderSource=fs.readFileSync('api/app.js','utf8');

function tick(){return new Promise(resolve=>setTimeout(resolve,0));}

(async function(){
  let canonicalXp=50;
  const rewards={};
  const ProgressionStore={
    getCurrentXp(){return canonicalXp;},
    status(){return{uid:'userA',householdId:'houseA',attached:true,xp:canonicalXp};},
    hasReward(key){return !!rewards[key];},
    hasAchievement(){return false;},
    awardOnce(key,amount,meta){
      if(rewards[key])return Promise.resolve({awarded:false,key,amount:0,xp:canonicalXp});
      rewards[key]={amount,meta};
      canonicalXp+=amount;
      sandbox.myXP=canonicalXp;
      return Promise.resolve({awarded:true,key,amount,xp:canonicalXp});
    },
    unlockAchievementOnce(){return Promise.resolve({unlocked:false,awarded:false,xp:canonicalXp});}
  };

  const storage=new Map();
  const sandbox={
    console,Promise,Date,Math,JSON,Object,String,Number,Array,Set,isFinite,
    setTimeout,clearTimeout,
    ProgressionStore,
    localStorage:{getItem(k){return storage.has(k)?storage.get(k):null;},setItem(k,v){storage.set(k,String(v));}},
    document:{readyState:'complete',getElementById(){return null;}},
    addEventListener(){},dispatchEvent(){},
    myXP:canonicalXp,
    unlockedBadges:{},newBadges:{},BADGES:[],taskData:[],noteData:[],feedData:[],recurData:[],tradesCount:0,visitedScreens:new Set(),
    getLevel(){return 1;},showXPPopup(){},updateHomeXP(){},showAchievementToast(){},
    awardXP(){throw new Error('legacy award must be replaced');},checkAchievements(){}
  };
  sandbox.window=sandbox;
  vm.createContext(sandbox);
  vm.runInContext(runtimeSource,sandbox,{filename:'progressionRuntime.js'});

  vm.runInContext(`
    var SKILL_DEFS=[{id:'vacuum',name:'Stofzuigen',xpPerDo:12}];
    var skillsData={Shane:{vacuum:{xp:0,log:[]}}};
    function logSkill(person,skillId){
      var def=SKILL_DEFS.find(function(d){return d.id===skillId;});
      var sk=skillsData[person][skillId];
      sk.xp+=def.xpPerDo;sk.log.push({date:'2026-08-24T12:00:00Z',xp:def.xpPerDo});
      return awardXP(Math.floor(def.xpPerDo/3),def.name);
    }
    function getWk(){return '2026-W35';}
    var ABILITIES=[
      {id:'questAbility',name:'Quest ability',type:'postpone'},
      {id:'copy',name:'Kopieer-kat',type:'copycat'},
      {id:'auto',name:'Auto-piloot',type:'auto_done'},
      {id:'triple',name:'Triple-XP',type:'triple_xp'}
    ];
    var myAbilities={questAbility:0,copy:1,auto:1,triple:1};
    var abilitiesUsed=0;
    var abilityEarnedThisWeek=true;
    function canEarnAbilityThisWeek(){return !abilityEarnedThisWeek;}
    function showQuestComplete(quest){
      if(!canEarnAbilityThisWeek())return awardXP(20,'Quest bonus');
    }
    function claimQuestReward(quest){
      if(!quest||quest.claimed)return;
      quest.claimed=true;
      if(!ability)return;
      if(!myAbilities[ability.id])myAbilities[ability.id]=0;
      myAbilities[ability.id]++;
      return awardXP(10,'Quest beloning');
    }
    var partnerName='Esra';
    var taskNextId=100;
    taskData=[{id:9,title:'Was',done:true,who:['Esra']},{id:42,title:'Badkamer',done:false,who:['Shane']}];
    function useAbility(abilityId,taskId){
      var ability=ABILITIES.find(function(a){return a.id===abilityId;});
      if(!ability||!myAbilities[abilityId])return;
      var task=taskData.find(function(t){return String(t.id)===String(taskId);});
      var result;
      if(ability.type==='copycat'){
        var source=taskData.find(function(t){return t.done&&t.who&&t.who.indexOf(partnerName)>-1;});
        if(source){
          var created={id:taskNextId++,title:source.title+' (gekopieerd)',done:true,who:['Shane']};
          taskData.unshift(created);
          result=awardXP(4,'Kopieer-kat');
        }
      }else if(ability.type==='auto_done'&&task){
        task.done=true;
        result=awardXP(4,'Auto-piloot');
      }else if(ability.type==='triple_xp'){
        myXP+=4;
      }
      myAbilities[abilityId]--;
      abilitiesUsed++;
      return result;
    }
  `,sandbox);

  vm.runInContext(bridgeSource,sandbox,{filename:'skillsProgressionBridge.js'});
  const bridge=sandbox.SkillsProgressionBridge;
  assert.ok(bridge);
  assert.strictEqual(bridge.version,'4.0.0');
  const status=bridge.status();
  assert.strictEqual(status.skillLog,true);
  assert.strictEqual(status.questComplete,true);
  assert.strictEqual(status.questClaim,true);
  assert.strictEqual(status.abilityUse,true);

  // Manual legacy skill log receives a stable sequence key from the local log.
  const skill1=await sandbox.logSkill('Shane','vacuum');
  assert.strictEqual(skill1.key,'skillLog:Shane:vacuum:1');
  assert.ok(rewards['skillLog:Shane:vacuum:1']);
  const skill2=await sandbox.logSkill('Shane','vacuum');
  assert.strictEqual(skill2.key,'skillLog:Shane:vacuum:2');
  assert.ok(rewards['skillLog:Shane:vacuum:2']);

  // Quest bonus is week + quest keyed and cannot be replay-farmed.
  const quest={id:'extra_2',abilityId:'questAbility'};
  const bonus1=await sandbox.showQuestComplete(quest);
  assert.strictEqual(bonus1.key,'weeklyQuestBonus:2026-W35:extra_2');
  const bonus2=await sandbox.showQuestComplete(quest);
  assert.strictEqual(bonus2.awarded,false);

  // Claim bridge repairs the legacy missing `ability` binding and keys the XP.
  const claim={id:'extra_3',abilityId:'questAbility',claimed:false};
  const claimResult=await sandbox.claimQuestReward(claim);
  assert.strictEqual(claim.claimed,true);
  assert.strictEqual(sandbox.myAbilities.questAbility,1,'quest ability should be granted');
  assert.strictEqual(claimResult.key,'weeklyQuestReward:2026-W35:extra_3');
  assert.ok(rewards['weeklyQuestReward:2026-W35:extra_3']);
  const claimXp=canonicalXp;
  const claimAgain=sandbox.claimQuestReward(claim);
  assert.strictEqual(claimAgain,undefined);
  assert.strictEqual(canonicalXp,claimXp,'claimed quest cannot grant reward twice');

  // Copycat key uses the actual new task id that the legacy function is about to create.
  const copyResult=await sandbox.useAbility('copy');
  assert.strictEqual(copyResult.key,'ability:copycat:task:100');
  assert.ok(rewards['ability:copycat:task:100']);
  assert.ok(sandbox.taskData.some(t=>t.id===100));

  // Auto-done uses the affected task id and cannot grant that ability reward twice.
  const autoResult=await sandbox.useAbility('auto',42);
  assert.strictEqual(autoResult.key,'ability:autoDone:42');
  assert.ok(rewards['ability:autoDone:42']);
  assert.strictEqual(sandbox.taskData.find(t=>t.id===42).done,true);

  // Triple-XP legacy direct mutation is removed, then the same hidden +4 is
  // written once through canonical progression without an extra UI popup.
  const beforeTriple=canonicalXp;
  const beforeFallback=sandbox.ProgressionRuntime.status().fallbackRewardCount;
  sandbox.useAbility('triple');
  await tick();await tick();
  assert.strictEqual(canonicalXp,beforeTriple+4);
  assert.strictEqual(sandbox.myXP,canonicalXp,'legacy direct myXP bump must not survive outside canonical projection');
  assert.ok(rewards['ability:triple:2026-W35:use:3']);
  assert.strictEqual(rewards['ability:triple:2026-W35:use:3'].amount,4);
  assert.strictEqual(sandbox.ProgressionRuntime.status().fallbackRewardCount,beforeFallback,'tested skills/quest/ability paths must not fall back to transient reward keys');
  assert.strictEqual(sandbox.ProgressionRuntime.status().pendingRewardCount,0);

  if(loaderSource.includes('skillsProgressionBridge.js')){
    const runtimeIdx=loaderSource.indexOf('src/core/progressionRuntime.js?v=2');
    const skillsIdx=loaderSource.indexOf('src/modules/skills/skillsProgressionBridge.js?v=4');
    assert.ok(runtimeIdx>-1&&skillsIdx>runtimeIdx,'skills bridge must load after canonical progression runtime');
  }

  console.log('STEP 9 skills/weekly-quest/ability progression contract: PASS');
})().catch(error=>{console.error(error);process.exit(1);});
