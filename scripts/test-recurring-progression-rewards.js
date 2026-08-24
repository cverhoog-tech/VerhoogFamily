'use strict';
const fs=require('fs');
const assert=require('assert');
const vm=require('vm');

const source=fs.readFileSync('src/modules/tasks/recurringTaskRewardBridge.js','utf8');
const loaderSource=fs.readFileSync('api/app.js','utf8');

(async function(){
  let canonicalXp=100;
  const rewards={};
  const calls=[];
  const storage=new Map();
  const recurData=[
    {id:'r1',title:'Stofzuigen',freq:'weekly',days:['maandag','vrijdag'],doneWeek:{},streak:0,who:['A']},
    {id:'r2',title:'Badkamer',freq:'monthly1',days:[],doneDates:{},streak:0,who:['A']}
  ];
  const WEEK='2026-W35',MONTH='2026-08';

  const window={
    recurData,
    myXP:canonicalXp,
    getWk(){return WEEK;},
    getMk(){return MONTH;},
    ProgressionStore:{getCurrentXp(){return canonicalXp;}},
    awardXP(amount,reason,options){
      calls.push({amount,reason,options});
      if(rewards[options.key])return Promise.resolve({awarded:false,key:options.key,amount:0,xp:canonicalXp});
      rewards[options.key]={amount,reason,options};
      canonicalXp+=amount;
      window.myXP=canonicalXp;
      return Promise.resolve({awarded:true,key:options.key,amount,xp:canonicalXp});
    },
    toggleRec(id){
      const r=recurData.find(x=>String(x.id)===String(id));
      if(r.freq==='weekly'){
        const allDone=r.days.every(d=>(r.doneWeek[WEEK]||[]).includes(d));
        if(allDone)r.doneWeek[WEEK]=[];
        else{r.doneWeek[WEEK]=r.days.slice();r.streak++;window.awardXP(6,'Vaste taak');}
      }else{
        if(r.doneDates[MONTH])delete r.doneDates[MONTH];
        else{r.doneDates[MONTH]=true;r.streak++;window.awardXP(6,'Vaste taak');}
      }
    },
    toggleRecDay(id,day){
      const r=recurData.find(x=>String(x.id)===String(id));
      if(!r.doneWeek[WEEK])r.doneWeek[WEEK]=[];
      const idx=r.doneWeek[WEEK].indexOf(day);
      if(idx>-1)r.doneWeek[WEEK].splice(idx,1);
      else{r.doneWeek[WEEK].push(day);window.myXP+=2;}
    },
    addEventListener(){}
  };
  const localStorage={getItem(k){return storage.has(k)?storage.get(k):null;},setItem(k,v){storage.set(k,String(v));}};
  const document={readyState:'complete'};
  const sandbox={window,document,localStorage,console,Promise,Date,Math,JSON,Object,String,Number,Array,setTimeout,clearTimeout};
  vm.createContext(sandbox);
  vm.runInContext(source,sandbox,{filename:'recurringTaskRewardBridge.js'});

  assert.strictEqual(window.RecurringTaskRewardBridge.version,'1.0.1');
  assert.strictEqual(window.RecurringTaskRewardBridge.status().toggleInstalled,true);
  assert.strictEqual(window.RecurringTaskRewardBridge.status().dayInstalled,true);

  // Weekly complete -> off -> complete again: one canonical completion reward.
  window.toggleRec('r1');
  await Promise.resolve();
  assert.ok(rewards['recurring:r1:week:2026-W35:complete']);
  assert.strictEqual(rewards['recurring:r1:week:2026-W35:complete'].amount,6);
  assert.strictEqual(canonicalXp,106);
  window.toggleRec('r1');
  window.toggleRec('r1');
  await Promise.resolve();
  assert.strictEqual(canonicalXp,106,'same weekly occurrence may not award twice');
  assert.strictEqual(calls.filter(c=>c.options&&c.options.key==='recurring:r1:week:2026-W35:complete').length,2,'replay must reuse the same occurrence key');

  // Monthly complete uses a month-scoped occurrence key and is idempotent.
  window.toggleRec('r2');
  await Promise.resolve();
  assert.ok(rewards['recurring:r2:month:2026-08:complete']);
  assert.strictEqual(canonicalXp,112);
  window.toggleRec('r2');
  window.toggleRec('r2');
  await Promise.resolve();
  assert.strictEqual(canonicalXp,112,'same monthly occurrence may not award twice');

  // Reset weekly state so the day-path can be tested independently.
  recurData[0].doneWeek[WEEK]=[];
  const xpBeforeDay=canonicalXp;
  window.toggleRecDay('r1','maandag');
  await Promise.resolve();
  assert.ok(rewards['recurring:r1:week:2026-W35:day:maandag']);
  assert.strictEqual(canonicalXp,xpBeforeDay+2,'day reward must be canonical');
  assert.strictEqual(window.myXP,canonicalXp,'legacy direct myXP mutation must be restored to canonical projection before reward');
  assert.strictEqual(localStorage.getItem('fam_myxp_v1'),String(xpBeforeDay),'bridge must overwrite the transient legacy direct increment before canonical projection updates');

  window.toggleRecDay('r1','maandag'); // off, no XP
  window.toggleRecDay('r1','maandag'); // on again, same key
  await Promise.resolve();
  assert.strictEqual(canonicalXp,xpBeforeDay+2,'same recurring day occurrence may not farm XP');

  if(loaderSource.includes('recurringTaskRewardBridge.js')){
    assert.ok(loaderSource.includes('src/modules/tasks/recurringTaskRewardBridge.js?v=1'));
    assert.ok(loaderSource.indexOf('src/core/progressionRuntime.js?v=2')<loaderSource.indexOf('src/modules/tasks/recurringTaskRewardBridge.js?v=1'),'recurring bridge must load after canonical runtime v1.1');
  }

  console.log('STEP 9 recurring task progression reward contract: PASS');
})().catch(error=>{console.error(error);process.exit(1);});
