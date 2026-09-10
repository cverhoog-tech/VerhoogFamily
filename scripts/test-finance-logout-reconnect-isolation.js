'use strict';
const fs=require('fs');
const assert=require('assert');
const vm=require('vm');

const repoSource=fs.readFileSync('src/modules/finance/financeHouseholdRepository.js','utf8');
const storeSource=fs.readFileSync('src/modules/finance/financeStore.js','utf8');

function clone(v){return v===undefined?undefined:JSON.parse(JSON.stringify(v));}
function snap(v){return{val(){return clone(v);}};}
function tick(){return new Promise(r=>setTimeout(r,0));}
function parts(path){return String(path||'').split('/').filter(Boolean);}
function getAt(root,path){let cur=root;for(const p of parts(path)){if(!cur||typeof cur!=='object'||!(p in cur))return null;cur=cur[p];}return clone(cur);}
function setAt(root,path,value){const ps=parts(path);let cur=root;for(let i=0;i<ps.length-1;i++){const p=ps[i];if(!cur[p]||typeof cur[p]!=='object')cur[p]={};cur=cur[p];}const leaf=ps[ps.length-1];if(value===null||value===undefined){if(leaf)delete cur[leaf];}else cur[leaf]=clone(value);}
function makeStorage(){const m=new Map();return{getItem(k){return m.has(k)?m.get(k):null;},setItem(k,v){m.set(k,String(v));},removeItem(k){m.delete(k);}};}
function makeDb(initial){
  const tree=clone(initial||{}),refs={};
  function ref(path){
    if(refs[path])return refs[path];
    const handlers=[],offCalls=[];
    const node={path,handlers,offCalls,
      on(event,handler,errorHandler){assert.strictEqual(event,'value');handlers.push(handler);node.errorHandler=errorHandler;},
      off(event,handler){offCalls.push({event,handler});const i=handlers.indexOf(handler);if(i>=0)handlers.splice(i,1);},
      once(event){assert.strictEqual(event,'value');return Promise.resolve(snap(getAt(tree,path)));},
      child(key){return ref(path+'/'+String(key));},
      set(value){setAt(tree,path,value);return Promise.resolve();},
      transaction(updater,done){const cur=getAt(tree,path);let next;try{next=updater(clone(cur));}catch(e){done(e,false,snap(cur));return;}if(next===undefined){done(null,false,snap(cur));return;}setAt(tree,path,next);done(null,true,snap(next));},
      emit(){const value=getAt(tree,path);handlers.slice().forEach(h=>h(snap(value)));},
      emitValue(value){setAt(tree,path,value);handlers.slice().forEach(h=>h(snap(value)));}
    };
    refs[path]=node;return node;
  }
  return{tree,refs,ref,get(path){return getAt(tree,path);}};
}

(async function(){
  let current={ready:true,uid:'userA',householdId:'houseA',revision:1};
  const listeners=[];
  const db=makeDb({families:{
    houseA:{financeMigrations:{v3SharedToCanonical:{status:'complete'}},finance:{schemaVersion:3,initialized:true,income:{primary:{label:'A',amount:1000},partner:{label:'',amount:0}},samenBetaler:'Beiden',vasteLasten:[],transactions:[{id:'a1',name:'A SECRET',amount:-10,date:'2026-08-23'}],extraIncome:[],savingsGoals:[],meta:{}}},
    houseB:{financeMigrations:{v3SharedToCanonical:{status:'complete'}},finance:{schemaVersion:3,initialized:true,income:{primary:{label:'B',amount:2000},partner:{label:'',amount:0}},samenBetaler:'Beiden',vasteLasten:[],transactions:[{id:'b1',name:'B ONLY',amount:-20,date:'2026-08-23'}],extraIncome:[],savingsGoals:[],meta:{}}}
  }});
  const HouseholdContext={
    snapshot(){return clone(current);},
    capture(){return clone(current);},
    isCurrent(token){return !!token&&token.ready===current.ready&&token.uid===current.uid&&token.householdId===current.householdId&&token.revision===current.revision;},
    subscribe(fn){listeners.push(fn);fn(clone(current));return()=>{const i=listeners.indexOf(fn);if(i>=0)listeners.splice(i,1);};}
  };
  function publishContext(next){current=clone(next);listeners.slice().forEach(fn=>fn(clone(current)));}
  function CustomEvent(type,opts){this.type=type;this.detail=opts&&opts.detail;}
  const document={readyState:'complete',getElementById(){return null;},addEventListener(){}};
  const window={HouseholdContext,fbDb:db,dispatchEvent(){},addEventListener(){},renderFinance(){}};
  const sandbox={window,document,HouseholdContext,localStorage:makeStorage(),CustomEvent,console,setInterval,clearInterval,setTimeout,clearTimeout,Promise,Date,Math,JSON,Object,String,Number,Array,confirm(){return false;}};
  vm.createContext(sandbox);
  vm.runInContext(repoSource,sandbox,{filename:'financeHouseholdRepository.js'});
  vm.runInContext(storeSource,sandbox,{filename:'financeStore.js'});

  const repo=window.FinanceHouseholdRepository;
  const store=window.FinanceStore;
  const aRef=db.ref('families/houseA/finance');
  const staleA=aRef.handlers[0];
  aRef.emit();await tick();await tick();
  assert.strictEqual(store.get().transactions[0].name,'A SECRET','A must load only A finance');

  // Logout / cleared authenticated household context must detach the active listener
  // and immediately clear the compatibility projection.
  publishContext({ready:false,uid:null,householdId:null,revision:2});
  await tick();
  assert.ok(aRef.offCalls.length>=1,'logout must detach the previous household finance listener');
  assert.strictEqual(store.get().transactions.length,0,'logout must clear prior household transactions immediately');
  assert.strictEqual(Number(store.get().income.primary.amount||0),0,'logout must clear prior household income immediately');
  await assert.rejects(repo.replace({schemaVersion:3,initialized:true}),/context is not ready|binding is stale/i,'writes while logged out must be rejected');

  // A callback that was captured before logout may still fire asynchronously; it
  // must never repopulate the logged-out projection.
  staleA(snap({schemaVersion:3,initialized:true,transactions:[{id:'leak',name:'A LEAK'}]}));
  await tick();
  assert.strictEqual(store.get().transactions.length,0,'stale pre-logout callback must not restore A finance');

  // Login/reconnect into a different household must bind only that household.
  publishContext({ready:true,uid:'userB',householdId:'houseB',revision:3});
  const bRef=db.ref('families/houseB/finance');
  bRef.emit();await tick();await tick();
  assert.strictEqual(store.get().transactions.length,1);
  assert.strictEqual(store.get().transactions[0].name,'B ONLY','reconnect as B must expose only B finance');
  assert.strictEqual(Number(store.get().income.primary.amount),2000,'reconnect as B must expose B income');

  // Even after B is live, another stale A callback must be ignored.
  staleA(snap({schemaVersion:3,initialized:true,transactions:[{id:'leak2',name:'A SECOND LEAK'}]}));
  await tick();
  assert.strictEqual(store.get().transactions[0].name,'B ONLY','stale A callback after reconnect must not overwrite B');

  await store.addTransaction({name:'B WRITE',amount:-33,date:'2026-08-23'});
  const bTx=db.get('families/houseB/finance/transactions')||[];
  const aTx=db.get('families/houseA/finance/transactions')||[];
  assert.ok(bTx.some(t=>t.name==='B WRITE'),'post-reconnect mutation must write into B');
  assert.ok(!aTx.some(t=>t.name==='B WRITE'),'post-reconnect mutation must never write into A');

  console.log('STEP 8 finance logout/reconnect isolation contract: PASS');
})().catch(error=>{console.error(error);process.exit(1);});
