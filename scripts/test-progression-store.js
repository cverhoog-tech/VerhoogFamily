'use strict';
const fs=require('fs');
const assert=require('assert');
const vm=require('vm');

const source=fs.readFileSync('src/core/progressionStore.js','utf8');

function clone(v){return v===undefined?undefined:JSON.parse(JSON.stringify(v));}
function snap(v){return{val(){return clone(v);}};}
function tick(){return new Promise(resolve=>setTimeout(resolve,0));}
function parts(path){return String(path||'').split('/').filter(Boolean);}
function getAt(root,path){let cur=root;for(const p of parts(path)){if(!cur||typeof cur!=='object'||!(p in cur))return null;cur=cur[p];}return clone(cur);}
function setAt(root,path,value){const ps=parts(path);if(!ps.length)return;let cur=root;for(let i=0;i<ps.length-1;i++){const p=ps[i];if(!cur[p]||typeof cur[p]!=='object')cur[p]={};cur=cur[p];}const leaf=ps[ps.length-1];if(value===null||value===undefined)delete cur[leaf];else cur[leaf]=clone(value);}

function makeStorage(initial){const m=new Map(Object.entries(initial||{}).map(([k,v])=>[k,String(v)]));return{getItem(k){return m.has(k)?m.get(k):null;},setItem(k,v){m.set(k,String(v));},removeItem(k){m.delete(k);},dump(){return Object.fromEntries(m.entries());}};}

function makeDb(initial){
  const tree=clone(initial||{}),refs={};
  function ref(path){
    if(refs[path])return refs[path];
    const handlers=[],offCalls=[];
    const node={
      path,handlers,offCalls,
      once(event){assert.strictEqual(event,'value');return Promise.resolve(snap(getAt(tree,path)));},
      on(event,handler,errorHandler){assert.strictEqual(event,'value');handlers.push(handler);node.errorHandler=errorHandler;},
      off(event,handler){offCalls.push({event,handler});if(!event){handlers.length=0;return;}const i=handlers.indexOf(handler);if(i>=0)handlers.splice(i,1);},
      set(value){setAt(tree,path,value);node.emit();return Promise.resolve();},
      transaction(updater){
        const current=getAt(tree,path);
        let next;
        try{next=updater(clone(current));}catch(error){return Promise.reject(error);}
        if(next===undefined)return Promise.resolve({committed:false,snapshot:snap(current)});
        setAt(tree,path,next);
        node.emit();
        return Promise.resolve({committed:true,snapshot:snap(next)});
      },
      emit(){const value=getAt(tree,path);handlers.slice().forEach(h=>h(snap(value)));},
      emitValue(value){setAt(tree,path,value);handlers.slice().forEach(h=>h(snap(value)));}
    };
    refs[path]=node;
    return node;
  }
  return{tree,refs,ref,get(path){return getAt(tree,path);}};
}

(async function(){
  let current={ready:true,uid:'userA',householdId:'houseA',revision:1};
  const contextListeners=[];
  const db=makeDb({families:{
    houseA:{members:{userA:{
      uid:'userA',name:'A',status:'active',xp:120,
      achievements:{task_5:{unlocked:true,xp:12,unlockedAt:111}}
    }}},
    houseB:{members:{userB:{
      uid:'userB',name:'B',status:'active',xp:7,
      achievements:{first_task:{unlocked:true,xp:3,unlockedAt:222}}
    }}}
  }});

  const HouseholdContext={
    snapshot(){return clone(current);},
    capture(){return{uid:current.uid,householdId:current.householdId,revision:current.revision};},
    isCurrent(token){return !!token&&token.uid===current.uid&&token.householdId===current.householdId&&token.revision===current.revision;},
    subscribe(fn){contextListeners.push(fn);fn(clone(current),'subscribe');return()=>{const i=contextListeners.indexOf(fn);if(i>=0)contextListeners.splice(i,1);};}
  };
  function publishContext(next,reason){current=clone(next);contextListeners.slice().forEach(fn=>fn(clone(current),reason||'test'));}

  function CustomEvent(type,opts){this.type=type;this.detail=opts&&opts.detail;}
  const events=[];
  const localStorage=makeStorage({fam_myxp_v1:'999'});
  const document={
    getElementById(){return null;}
  };
  const window={
    HouseholdContext,
    fbDb:db,
    myXP:999,
    unlockedBadges:{foreign_badge:true},
    dispatchEvent(event){events.push(event);},
    addEventListener(){},
    updateHomeXP(){}
  };
  const firebase={database:{ServerValue:{TIMESTAMP:777}}};
  const sandbox={window,HouseholdContext,document,localStorage,CustomEvent,firebase,console,setTimeout,clearTimeout,Promise,Date,Math,JSON,Object,String,Number,Array,encodeURIComponent};
  vm.createContext(sandbox);
  vm.runInContext(source,sandbox,{filename:'progressionStore.js'});

  const store=window.ProgressionStore;
  assert.ok(store,'ProgressionStore must install');
  assert.strictEqual(store.version,'1.0.0');

  // Initial canonical state must migrate from the active Firebase member only.
  // The deliberately wrong unscoped browser XP/cache must never seed user A.
  await tick();await tick();await tick();
  const aPath='families/houseA/members/userA/progression';
  const aCanonical=db.get(aPath);
  assert.ok(aCanonical,'canonical user A progression must be created');
  assert.strictEqual(aCanonical.xp,120,'migration must preserve active member XP');
  assert.notStrictEqual(aCanonical.xp,999,'unscoped browser XP must never become migration authority');
  assert.strictEqual(store.getCurrentXp(),120,'projection must show canonical A XP');
  assert.strictEqual(window.myXP,120,'legacy XP global is a projection of canonical state');
  assert.strictEqual(localStorage.getItem('fam_myxp_v1'),'120','legacy cache may mirror canonical XP after binding');
  assert.deepStrictEqual(Object.keys(window.unlockedBadges),['task_5'],'achievement projection must replace stale browser badges, not merge them');
  assert.strictEqual(store.hasAchievement('task_5'),true);
  assert.strictEqual(store.hasAchievement('foreign_badge'),false);
  assert.strictEqual(aCanonical.migration.source,'legacy-member');

  // A deterministic event key can grant XP only once, even if invoked twice.
  const r1=await store.awardOnce('task:42',4,{reason:'Taak',source:'task',sourceId:'42'});
  const r2=await store.awardOnce('task:42',4,{reason:'Taak',source:'task',sourceId:'42'});
  assert.strictEqual(r1.awarded,true,'first deterministic reward must award');
  assert.strictEqual(r2.awarded,false,'duplicate deterministic reward must not award');
  assert.strictEqual(store.getCurrentXp(),124,'duplicate reward must not increment XP twice');
  assert.strictEqual(db.get(aPath).xp,124);
  assert.strictEqual(store.hasReward('task:42'),true);

  // Achievement record + achievement XP must be one idempotent canonical mutation.
  const u1=await store.unlockAchievementOnce('task_10',15,{reason:'Takenmaster',source:'achievement'});
  const u2=await store.unlockAchievementOnce('task_10',15,{reason:'Takenmaster',source:'achievement'});
  assert.strictEqual(u1.unlocked,true);
  assert.strictEqual(u1.awarded,true);
  assert.strictEqual(u2.unlocked,false,'same achievement may not unlock twice');
  assert.strictEqual(u2.awarded,false,'same achievement may not award twice');
  assert.strictEqual(store.getCurrentXp(),139);
  assert.strictEqual(store.hasAchievement('task_10'),true);
  assert.strictEqual(db.get(aPath).xp,139);

  const aRef=db.ref(aPath);
  const staleA=aRef.handlers[0];
  assert.ok(staleA,'A listener must be attached');

  // Logout must detach and clear compatibility projections immediately.
  publishContext({ready:false,uid:null,householdId:null,revision:2},'logout');
  await tick();
  assert.ok(aRef.offCalls.length>=1,'logout must detach A progression listener');
  assert.strictEqual(store.getCurrentXp(),0,'logout must clear canonical projection');
  assert.strictEqual(window.myXP,0,'legacy XP projection must also clear on logout');
  assert.deepStrictEqual(Object.keys(window.unlockedBadges),[],'achievement projection must clear on logout');
  await assert.rejects(()=>store.awardOnce('logged-out',5,{source:'test'}),/CONTEXT_NOT_READY/i,'logged-out reward writes must be rejected');

  // A stale pre-logout callback must never repopulate user A after logout.
  staleA(snap({version:1,xp:9999,rewards:{},achievements:{leak:{unlocked:true}}}));
  await tick();
  assert.strictEqual(store.getCurrentXp(),0,'stale callback after logout must be ignored');
  assert.strictEqual(store.hasAchievement('leak'),false);

  // Reconnect to a different household/user: migrate only B member data and do
  // not carry A XP/rewards/achievements into B.
  publishContext({ready:true,uid:'userB',householdId:'houseB',revision:3},'login-b');
  await tick();await tick();await tick();
  const bPath='families/houseB/members/userB/progression';
  assert.strictEqual(store.getCurrentXp(),7,'B must load only B member XP');
  assert.strictEqual(store.hasAchievement('first_task'),true);
  assert.strictEqual(store.hasAchievement('task_5'),false,'A achievement must not leak into B');
  assert.strictEqual(store.hasReward('task:42'),false,'A reward ledger must not leak into B');
  assert.strictEqual(db.get(bPath).xp,7);

  const bReward=await store.awardOnce('note:n1',4,{reason:'Notitie',source:'note',sourceId:'n1'});
  assert.strictEqual(bReward.awarded,true);
  assert.strictEqual(db.get(bPath).xp,11,'B write must target B canonical progression');
  assert.strictEqual(db.get(aPath).xp,139,'B write must never mutate A canonical progression');

  // Even after B is live, old A listener callback remains stale.
  staleA(snap({version:1,xp:5000,rewards:{},achievements:{oldA:{unlocked:true}}}));
  await tick();
  assert.strictEqual(store.getCurrentXp(),11,'stale A callback after B reconnect must be ignored');
  assert.strictEqual(store.hasAchievement('oldA'),false);

  assert.ok(events.some(e=>e.type==='familyapp:progression-updated'),'store must publish progression projection events');
  console.log('STEP 9 canonical progression store contract: PASS');
})().catch(error=>{console.error(error);process.exit(1);});
