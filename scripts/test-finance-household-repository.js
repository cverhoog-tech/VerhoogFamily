'use strict';
const fs=require('fs');
const assert=require('assert');
const vm=require('vm');

const repoSource=fs.readFileSync('src/modules/finance/financeHouseholdRepository.js','utf8');
const storeSource=fs.readFileSync('src/modules/finance/financeStore.js','utf8');
const bootstrapSource=fs.readFileSync('src/modules/calendar/calendar.js','utf8');
const rules=JSON.parse(fs.readFileSync('database.rules.json','utf8'));
function clone(v){return v===undefined?undefined:JSON.parse(JSON.stringify(v));}
function snap(v){return{val(){return clone(v);}};}
function tick(){return new Promise(r=>setTimeout(r,0));}

assert.ok(repoSource.includes("families/'+ctx.householdId+'/finance"));
assert.ok(repoSource.includes('HouseholdContext.capture'));
assert.ok(repoSource.includes('HouseholdContext.isCurrent'));
assert.ok(repoSource.includes("active.ref.off('value',active.handler)"));
assert.ok(repoSource.includes("families/'+binding.context.householdId+'/shared/finance"));
assert.ok(repoSource.includes('financeMigrations/v3SharedToCanonical'));
assert.ok(repoSource.includes("CACHE_PREFIX='familyapp_finance_v3_'"));
assert.ok(!repoSource.includes('FamilyDataStore'));
assert.ok(!repoSource.includes('window.inkomenShane'));
assert.ok(!repoSource.includes('window.transData'));
assert.ok(!storeSource.includes('fromLegacyGlobals'));
assert.ok(!storeSource.includes('FamilyDataStore'));
assert.ok(storeSource.includes('FinanceHouseholdRepository'));
assert.ok(storeSource.includes('createdByUid'));
assert.ok(bootstrapSource.indexOf('financeHouseholdRepository.js?v=1')>=0,'finance repository must be loaded by runtime');
assert.ok(bootstrapSource.indexOf('financeStore.js?v=4')>bootstrapSource.indexOf('financeHouseholdRepository.js?v=1'),'FinanceStore must load after repository');
assert.ok(bootstrapSource.indexOf('calendarLegacy.js?v=3')>bootstrapSource.indexOf('financeStore.js?v=4'),'canonical finance must load before legacy finance/calendar runtime');
assert.ok(rules.rules.families.$familyId.$sharedData,'family wildcard rules must cover canonical finance child');
assert.ok(String(rules.rules.families.$familyId.$sharedData['.write']).includes("members').child(auth.uid).child('status').val() === 'active'"),'finance writes must still require active household membership');

function makeStorage(){const m=new Map();return{getItem(k){return m.has(k)?m.get(k):null;},setItem(k,v){m.set(k,String(v));},removeItem(k){m.delete(k);},keys(){return Array.from(m.keys());}};}
function parts(path){return String(path||'').split('/').filter(Boolean);}
function getAt(root,path){let cur=root;for(const p of parts(path)){if(!cur||typeof cur!=='object'||!(p in cur))return null;cur=cur[p];}return clone(cur);}
function setAt(root,path,value){const ps=parts(path);let cur=root;for(let i=0;i<ps.length-1;i++){const p=ps[i];if(!cur[p]||typeof cur[p]!=='object')cur[p]={};cur=cur[p];}const leaf=ps[ps.length-1];if(value===null||value===undefined){if(leaf)delete cur[leaf];}else cur[leaf]=clone(value);}
function makeDb(initial){
  const tree=clone(initial||{}),refs={},writes=[];
  function ref(path){
    if(refs[path])return refs[path];
    const handlers=[],offCalls=[];
    const node={path,handlers,offCalls,
      on(event,handler,errorHandler){assert.strictEqual(event,'value');handlers.push(handler);node.errorHandler=errorHandler;},
      off(event,handler){offCalls.push({event,handler});const i=handlers.indexOf(handler);if(i>=0)handlers.splice(i,1);},
      once(event){assert.strictEqual(event,'value');return Promise.resolve(snap(getAt(tree,path)));},
      child(key){return ref(path+'/'+String(key));},
      set(value){writes.push({path,value:clone(value)});setAt(tree,path,value);return Promise.resolve();},
      transaction(updater,done){const cur=getAt(tree,path);let next;try{next=updater(clone(cur));}catch(e){done(e,false,snap(cur));return;}if(next===undefined){done(null,false,snap(cur));return;}setAt(tree,path,next);writes.push({path,value:clone(next)});done(null,true,snap(next));},
      emit(){const value=getAt(tree,path);handlers.slice().forEach(h=>h(snap(value)));},
      emitValue(value){setAt(tree,path,value);handlers.slice().forEach(h=>h(snap(value)));}
    };refs[path]=node;return node;
  }
  return{tree,refs,writes,ref,get(path){return getAt(tree,path);}};
}

(async function(){
  let current={ready:true,uid:'uA',householdId:'A',revision:1};
  const contextListeners=[];
  const storage=makeStorage();
  const db=makeDb({families:{
    A:{financeMigrations:{v3SharedToCanonical:{status:'complete'}},finance:{schemaVersion:3,initialized:true,income:{primary:{label:'Salaris',amount:100},partner:{label:'Salaris',amount:200}},samenBetaler:'Beiden',vasteLasten:[],transactions:[{id:'a1',name:'A only',amount:-1,date:'2026-08-23'}],extraIncome:[],savingsGoals:[],meta:{}}},
    B:{financeMigrations:{v3SharedToCanonical:{status:'complete'}},finance:{schemaVersion:3,initialized:true,income:{primary:{label:'Salaris',amount:300},partner:{label:'Salaris',amount:400}},samenBetaler:'Beiden',vasteLasten:[],transactions:[{id:'b1',name:'B only',amount:-2,date:'2026-08-23'}],extraIncome:[],savingsGoals:[],meta:{}}},
    C:{shared:{finance:{schemaVersion:2,initialized:true,income:{primary:{label:'Legacy C',amount:777},partner:{label:'Salaris',amount:0}},samenBetaler:'Beiden',vasteLasten:[],transactions:[],extraIncome:[],savingsGoals:[],meta:{}}}},
    D:{}
  }});
  const HouseholdContext={
    snapshot(){return clone(current);},capture(){return clone(current);},
    isCurrent(token){return !!token&&token.uid===current.uid&&token.householdId===current.householdId&&token.revision===current.revision;},
    subscribe(fn){contextListeners.push(fn);fn(clone(current));return()=>{const i=contextListeners.indexOf(fn);if(i>=0)contextListeners.splice(i,1);};}
  };
  function CustomEvent(type,opts){this.type=type;this.detail=opts&&opts.detail;}
  const document={readyState:'complete',getElementById(){return null;},addEventListener(){}};
  const window={HouseholdContext,fbDb:db,dispatchEvent(){},addEventListener(){},renderFinance(){}};
  window.inkomenShane={label:'LEAK',amount:999999};window.transData=[{id:'leak'}];window.savingsGoals=[{id:'leak'}];
  const sandbox={window,document,HouseholdContext,localStorage:storage,CustomEvent,console,setInterval,clearInterval,setTimeout,clearTimeout,Promise,Date,Math,JSON,Object,String,Number,Array,confirm(){return false;}};
  vm.createContext(sandbox);
  vm.runInContext(repoSource,sandbox,{filename:'financeHouseholdRepository.js'});
  vm.runInContext(storeSource,sandbox,{filename:'financeStore.js'});
  const repo=window.FinanceHouseholdRepository,store=window.FinanceStore;
  const aRef=db.ref('families/A/finance');
  const staleA=aRef.handlers[0];
  aRef.emit();await tick();await tick();
  assert.strictEqual(store.get().transactions[0].name,'A only');

  current={ready:true,uid:'uB',householdId:'B',revision:2};contextListeners.slice().forEach(fn=>fn(clone(current)));
  assert.ok(aRef.offCalls.length>=1,'A listener must detach exactly on switch');
  assert.strictEqual(store.get().transactions.length,0,'switching to uncached B must clear A projection immediately before Firebase responds');
  const bRef=db.ref('families/B/finance');bRef.emit();await tick();await tick();
  assert.strictEqual(store.get().transactions[0].name,'B only');
  staleA(snap({schemaVersion:3,initialized:true,transactions:[{id:'leak',name:'LEAK'}]}));await tick();
  assert.strictEqual(store.get().transactions[0].name,'B only','stale A callback must be ignored');

  const tx=await store.addTransaction({name:'B nieuw',amount:-12,date:'2026-08-23'});
  assert.strictEqual(tx.createdByUid,'uB');
  assert.ok((db.get('families/B/finance/transactions')||[]).some(x=>x.name==='B nieuw'));
  assert.ok(!(db.get('families/A/finance/transactions')||[]).some(x=>x.name==='B nieuw'));

  const r1=await store.upsertSourceTransaction({sourceType:'shoppingReceipt',sourceId:'list-1',transaction:{name:'Bon',amount:-25,date:'2026-08-23'}});
  const r2=await store.upsertSourceTransaction({sourceType:'shoppingReceipt',sourceId:'list-1',transaction:{name:'Bon aangepast',amount:-30,date:'2026-08-23'}});
  assert.strictEqual(r1.id,r2.id,'shopping receipt upsert must remain idempotent');
  assert.strictEqual((db.get('families/B/finance/transactions')||[]).filter(x=>x.sourceKey==='shoppingReceipt:list-1').length,1);

  current={ready:true,uid:'uC',householdId:'C',revision:3};contextListeners.slice().forEach(fn=>fn(clone(current)));
  db.ref('families/C/finance').emit();await tick();await tick();await tick();
  assert.strictEqual(db.get('families/C/finance').income.primary.amount,777,'same-household shared finance must migrate');
  assert.strictEqual(db.get('families/C/finance').meta.migratedFrom,'shared/finance');
  assert.strictEqual(db.get('families/C/financeMigrations/v3SharedToCanonical').status,'complete');

  current={ready:true,uid:'uD',householdId:'D',revision:4};contextListeners.slice().forEach(fn=>fn(clone(current)));
  db.ref('families/D/finance').emit();await tick();await tick();await tick();await tick();
  await store.ready();
  const dState=db.get('families/D/finance');
  assert.strictEqual(dState.income.primary.amount,0,'new household must not inherit legacy global salary');
  assert.strictEqual((dState.transactions||[]).length,0,'new household must not inherit legacy global transactions');
  assert.strictEqual((dState.savingsGoals||[]).length,0,'new household must not inherit legacy global savings');
  assert.ok(storage.keys().some(k=>k.includes('uA_A')));
  assert.ok(storage.keys().some(k=>k.includes('uB_B')));
  assert.ok(storage.keys().some(k=>k.includes('uC_C')));
  assert.ok(storage.keys().some(k=>k.includes('uD_D')));

  await store.addTransaction({name:'D only',amount:-4,date:'2026-08-23'});
  await store.resetAll();
  assert.strictEqual((db.get('families/D/finance/transactions')||[]).length,0,'reset must clear active household D only');
  assert.ok((db.get('families/B/finance/transactions')||[]).length>=2,'reset must not clear prior household B');

  console.log('STEP 8 finance household repository contract: PASS');
})().catch(e=>{console.error(e);process.exit(1);});
