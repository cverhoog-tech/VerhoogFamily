const fs=require('fs');
const vm=require('vm');
const assert=require('assert');
const source=fs.readFileSync('src/modules/finance/financeStore.js','utf8');

let ctx={uid:'alpha-user',householdId:'alpha-household'};
let subs=[];
let pendingResolve=null;
const listeners={};
const db={finance:null};

function blank(h,u){
  return {
    schemaVersion:3,initialized:true,householdId:h,
    income:{primary:{label:'Salaris',amount:3000},partner:{label:'Salaris',amount:2000}},
    samenBetaler:'Beiden',vasteLasten:[],transactions:[],extraIncome:[],savingsGoals:[],
    meta:{updatedBy:u}
  };
}
db.finance=blank(ctx.householdId,ctx.uid);

const HouseholdContext={
  requireUser:()=>ctx.uid,
  requireHousehold:()=>ctx.householdId,
  assertContext:t=>{
    if(t.uid!==ctx.uid||t.householdId!==ctx.householdId){
      const e=new Error('changed');e.code='FINANCE_CONTEXT_CHANGED';throw e;
    }
  },
  isCurrent:t=>!!t&&t.uid===ctx.uid&&t.householdId===ctx.householdId
};

const FamilyDataStore={
  makeId:p=>p+'_1',
  readShared:()=>Promise.resolve(JSON.parse(JSON.stringify(db.finance))),
  writeShared:(c,v)=>{db.finance=JSON.parse(JSON.stringify(v));return Promise.resolve();},
  subscribeShared:(c,cb)=>{
    subs.push(cb);
    cb(JSON.parse(JSON.stringify(db.finance)),{source:'test'});
    return()=>{subs=subs.filter(x=>x!==cb);};
  },
  transactSharedPath:(c,path,updater,fallback)=>new Promise(resolve=>{
    pendingResolve=()=>{
      const list=db.finance[path[0]]||fallback;
      const value=updater(JSON.parse(JSON.stringify(list)));
      db.finance[path[0]]=JSON.parse(JSON.stringify(value));
      resolve({value});
    };
  })
};

const sandbox={
  console,setTimeout,clearTimeout,Promise,Date,Math,
  CustomEvent:function(n,o){this.type=n;this.detail=o&&o.detail;},
  document:{},
  window:{
    addEventListener:(n,f)=>{(listeners[n]||(listeners[n]=[])).push(f);},
    dispatchEvent:()=>{},
    HouseholdContext,
    FamilyDataStore
  }
};
sandbox.window.window=sandbox.window;
sandbox.window.document=sandbox.document;
sandbox.window.CustomEvent=sandbox.CustomEvent;
vm.createContext(sandbox);
vm.runInContext(source,sandbox);
const store=sandbox.window.FinanceStore;

async function waitForPending(){
  for(let i=0;i<20&&!pendingResolve;i++)await new Promise(r=>setTimeout(r,0));
  assert.strictEqual(typeof pendingResolve,'function','finance transaction should be pending before context switch');
}

(async()=>{
  await store.ready();
  const before=store.monthlySummary('2026-08').disposable;
  const p=store.upsertSourceTransaction({
    sourceType:'shoppingReceipt',sourceId:'alpha-household:list1',
    transaction:{name:'Boodschappen',amount:-125,date:'2026-08-15'}
  });
  await waitForPending();

  ctx={uid:'beta-user',householdId:'beta-household'};
  (listeners['familyapp:household-context-changed']||[]).forEach(f=>f());
  pendingResolve();

  let rejected=false;
  try{await p;}catch(e){rejected=e&&e.code==='FINANCE_CONTEXT_CHANGED';}
  assert.ok(rejected,'stale Alpha finance mutation must reject after switch');

  db.finance=blank(ctx.householdId,ctx.uid);
  await store.rebind();
  FamilyDataStore.transactSharedPath=(c,path,updater,fallback)=>{
    const value=updater(JSON.parse(JSON.stringify(db.finance[path[0]]||fallback)));
    db.finance[path[0]]=JSON.parse(JSON.stringify(value));
    subs.slice().forEach(cb=>cb(JSON.parse(JSON.stringify(db.finance)),{source:'test'}));
    return Promise.resolve({value});
  };

  await store.upsertSourceTransaction({
    sourceType:'shoppingReceipt',sourceId:'beta-household:list2',
    transaction:{name:'Boodschappen',amount:-80,date:'2026-08-15'}
  });
  const after=store.monthlySummary('2026-08');
  assert.strictEqual(after.transactionExpenses,80,'receipt must count as transaction expense');
  assert.strictEqual(after.disposable,4920,'receipt must reduce disposable income');
  assert.strictEqual(before,5000,'baseline disposable should equal salary income');
  console.log('finance context rebind OK');
})().catch(e=>{console.error(e);process.exit(1);});
