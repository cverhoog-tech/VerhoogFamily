'use strict';
const fs=require('fs');
const assert=require('assert');
const vm=require('vm');

const runtimeSource=fs.readFileSync('src/core/progressionRuntime.js','utf8');
const bridgeSource=fs.readFileSync('src/core/progressionProducerBridge.js','utf8');
const loaderSource=fs.readFileSync('api/app.js','utf8');

function tick(){return new Promise(resolve=>setTimeout(resolve,0));}

(async function(){
  let xp=10;
  const rewards={};
  const ProgressionStore={
    getCurrentXp(){return xp;},
    status(){return{uid:'userA',householdId:'houseA',attached:true,xp};},
    hasReward(key){return !!rewards[key];},
    hasAchievement(){return false;},
    awardOnce(key,amount,meta){
      if(rewards[key])return Promise.resolve({awarded:false,key,amount:0,xp});
      rewards[key]={amount,meta};xp+=amount;window.myXP=xp;
      return Promise.resolve({awarded:true,key,amount,xp});
    },
    unlockAchievementOnce(){return Promise.resolve({unlocked:false,awarded:false,xp});}
  };

  let liked=false;
  let postSeq=0;
  let recipeSeq=0;
  const window={
    ProgressionStore,
    myXP:xp,
    unlockedBadges:{},newBadges:{},BADGES:[],taskData:[],noteData:[],feedData:[],recurData:[],tradesCount:0,visitedScreens:new Set(),
    getLevel(){return 1;},
    updateHomeXP(){},showXPPopup(){},showAchievementToast(){},
    awardXP(){throw new Error('legacy awardXP must be replaced');},
    checkAchievements(){},
    activeNoteId:null,
    noteNextId:5,
    saveNote(){
      if(!window.activeNoteId){
        const id=window.noteNextId++;
        window.activeNoteId=id;
        return window.awardXP(4,'Notitie');
      }
    },
    FeedSharedData:{
      createPost(){postSeq++;return Promise.resolve({id:'post_'+postSeq});},
      toggleReaction(){liked=!liked;return Promise.resolve({liked});}
    },
    RecipeStore:{
      create(){recipeSeq++;return Promise.resolve({recipe:{id:'recipe_'+recipeSeq}});}
    },
    taskTemplates:[{id:7,name:'Schoonmaak',tasks:['A','B']}],
    taskNextId:200,
    activateTemplate(id){
      const tmpl=window.taskTemplates.find(t=>String(t.id)===String(id));
      if(!tmpl)return;
      tmpl.tasks.forEach(title=>window.taskData.unshift({id:window.taskNextId++,title}));
      return window.awardXP(5,'Template');
    },
    addEventListener(){},dispatchEvent(){}
  };
  const document={readyState:'complete',getElementById(){return null;}};
  const sandbox={window,document,console,setTimeout,clearTimeout,Promise,Date,Math,JSON,Object,String,Number,Array,Set,isFinite};
  vm.createContext(sandbox);
  vm.runInContext(runtimeSource,sandbox,{filename:'progressionRuntime.js'});
  vm.runInContext(bridgeSource,sandbox,{filename:'progressionProducerBridge.js'});

  const bridge=window.ProgressionProducerBridge;
  assert.ok(bridge);
  assert.strictEqual(bridge.version,'1.1.1');
  const bridgeStatus=bridge.status();
  assert.strictEqual(bridgeStatus.notes,true);
  assert.strictEqual(bridgeStatus.feedPost,true);
  assert.strictEqual(bridgeStatus.feedLike,true);
  assert.strictEqual(bridgeStatus.recipe,true);
  assert.strictEqual(bridgeStatus.taskTemplates,true);
  assert.strictEqual(window.ProgressionRuntime.status().fallbackRewardCount,0);

  // New note: the id known before insertion becomes the stable reward key.
  const noteResult=await window.saveNote();
  await tick();
  assert.strictEqual(noteResult.awarded,true);
  assert.ok(rewards['note:5']);
  assert.strictEqual(rewards['note:5'].meta.source,'note');
  const xpAfterNote=xp;
  await window.saveNote(); // edit/save existing note -> no new XP
  assert.strictEqual(xp,xpAfterNote);

  // Manual Feed post gets its Firebase/entity id before the legacy UI awards XP.
  const created=await window.FeedSharedData.createPost({text:'Hallo'});
  const postReward=await window.awardXP(3,'Post');
  assert.strictEqual(created.id,'post_1');
  assert.strictEqual(postReward.key,'feedPost:post_1');
  assert.ok(rewards['feedPost:post_1']);

  // Like -> unlike -> like again reuses the same per-user/per-post key.
  let reaction=await window.FeedSharedData.toggleReaction('post_1');
  assert.strictEqual(reaction.liked,true);
  const like1=await window.awardXP(1,'Like');
  assert.strictEqual(like1.key,'feedLike:post_1');
  await window.FeedSharedData.toggleReaction('post_1'); // unlike: no UI awardXP call
  reaction=await window.FeedSharedData.toggleReaction('post_1');
  assert.strictEqual(reaction.liked,true);
  const like2=await window.awardXP(1,'Like');
  assert.strictEqual(like2.key,'feedLike:post_1');
  assert.strictEqual(like2.awarded,false,'re-like must not farm XP');

  // Manual RecipeStore create queues the existing `Recept aangemaakt` context.
  const recipeResult=await window.RecipeStore.create({name:'Pasta',sourceProvider:'manual'});
  const recipeReward=await window.awardXP(4,'Recept aangemaakt');
  assert.strictEqual(recipeResult.recipe.id,'recipe_1');
  assert.strictEqual(recipeReward.key,'recipe:recipe_1');
  assert.ok(rewards['recipe:recipe_1']);

  // Link/import creates use the same store but must NOT queue the manual-create
  // reason. Their importer awards directly with the saved recipe id.
  const pendingBeforeImport=window.ProgressionRuntime.status().pendingRewardCount;
  const imported=await window.RecipeStore.create({name:'Import',sourceUrl:'https://example.com/recept',sourceProvider:'generic'});
  assert.strictEqual(imported.recipe.id,'recipe_2');
  assert.strictEqual(window.ProgressionRuntime.status().pendingRewardCount,pendingBeforeImport,'imported recipe must not leave a manual Recept aangemaakt context');
  const importReward=await window.awardXP(5,'Recept geïmporteerd',{key:'recipe:'+imported.recipe.id,source:'recipe-import',sourceId:imported.recipe.id});
  assert.strictEqual(importReward.key,'recipe:recipe_2');
  assert.ok(rewards['recipe:recipe_2']);

  // A task-template activation is a distinct batch identified by the first task
  // id allocated to that activation. Re-activating later creates a new batch/key.
  const template1=await window.activateTemplate(7);
  assert.strictEqual(template1.key,'taskTemplate:7:activation:200');
  assert.ok(rewards['taskTemplate:7:activation:200']);
  const template2=await window.activateTemplate(7);
  assert.strictEqual(template2.key,'taskTemplate:7:activation:202');
  assert.ok(rewards['taskTemplate:7:activation:202']);

  assert.strictEqual(window.ProgressionRuntime.status().fallbackRewardCount,0,'all bridged entity/batch producers must remain deterministic');
  assert.strictEqual(window.ProgressionRuntime.status().pendingRewardCount,0,'all queued producer contexts must be consumed');

  if(loaderSource.includes('progressionProducerBridge.js')){
    const runtimeIdx=loaderSource.indexOf('src/core/progressionRuntime.js?v=2');
    const bridgeIdx=loaderSource.indexOf('src/core/progressionProducerBridge.js?v=3');
    assert.ok(runtimeIdx>-1&&bridgeIdx>runtimeIdx,'producer bridge must be served after ProgressionRuntime v1.1');
  }

  console.log('STEP 9 feed/recipe/note/template progression producer contract: PASS');
})().catch(error=>{console.error(error);process.exit(1);});
