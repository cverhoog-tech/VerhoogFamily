'use strict';
const fs=require('fs');
const vm=require('vm');
const assert=require('assert');

let current={uid:'alpha-user',householdId:'alpha-household',ready:true};
const listeners={};
const subscriptions=[];
const store={
  itemMap:v=>v&&typeof v==='object'?v:{},
  makeId:p=>p+'_1',
  migrateLegacyShopping:()=>Promise.resolve(false),
  readShared:()=>Promise.resolve({alphaList:{id:'alphaList',name:'Alpha',items:{a:{id:'a',name:'Melk',done:false}}}}),
  readPrivate:()=>Promise.resolve({}),
  writeSharedRecord:()=>Promise.resolve(),writePrivateRecord:()=>Promise.resolve(),
  writeSharedPath:()=>Promise.resolve(),writePrivatePath:()=>Promise.resolve(),
  transactSharedPath:()=>Promise.resolve(),transactPrivatePath:()=>Promise.resolve(),
  subscribeShared:(c,cb)=>{const s={scope:'shared',cb,off:false};subscriptions.push(s);return()=>{s.off=true;};},
  subscribePrivate:(c,cb)=>{const s={scope:'private',cb,off:false};subscriptions.push(s);return()=>{s.off=true;};},
  defaultShoppingList:()=>({id:'default',name:'Default',items:{}})
};
const document={readyState:'complete',getElementById:()=>null,createElement:()=>({style:{},appendChild(){},set textContent(v){this._t=v;},get textContent(){return this._t;}}),head:{appendChild(){}},body:{}};
const local={};
const window={
  FamilyDataStore:store,
  HouseholdContext:{requireUser:()=>current.uid,requireHousehold:()=>current.householdId,assertContext:()=>current,isCurrent:t=>!!t&&t.uid===current.uid&&t.householdId===current.householdId},
  addEventListener:(n,fn)=>{(listeners[n]||(listeners[n]=[])).push(fn);},
  dispatchEvent:()=>{},shopData:[],_currentScreen:'home'
};
const context={window,document,localStorage:{getItem:k=>local[k]||null,setItem:(k,v)=>{local[k]=v;}},console,Promise,JSON,Date,Math,Object,Array,String,CustomEvent:function(){},setInterval:()=>0,clearInterval:()=>{},setTimeout:fn=>{fn();return 0;}};
vm.createContext(context);
vm.runInContext(fs.readFileSync('src/modules/shop/shoppingLists.js','utf8'),context,{filename:'shoppingLists.js'});

async function until(predicate,label,limit=40){
  for(let i=0;i<limit;i++){
    if(predicate())return;
    await new Promise(resolve=>setImmediate(resolve));
  }
  throw new Error('Timeout waiting for '+label);
}

(async()=>{
  await until(()=>subscriptions.length>=2,'alpha shopping subscriptions');
  assert.equal(window.ShoppingLists.status().context.householdId,'alpha-household');
  const alphaShared=subscriptions.find(s=>s.scope==='shared');
  alphaShared.cb({alphaList:{id:'alphaList',name:'Alpha',items:{a:{id:'a',name:'Melk',done:false}}}});
  assert.equal(window.shopData[0].name,'Melk');

  current={uid:'beta-user',householdId:'beta-household',ready:true};
  (listeners['familyapp:household-context-changed']||[]).forEach(fn=>fn());
  await until(()=>alphaShared.off===true,'alpha shopping detach');
  await until(()=>window.ShoppingLists.status().context&&window.ShoppingLists.status().context.householdId==='beta-household','beta shopping rebind');
  await until(()=>subscriptions.length>=4,'beta shopping subscriptions');
  assert.equal(alphaShared.off,true,'alpha subscription must detach');
  assert.equal(window.ShoppingLists.status().context.householdId,'beta-household');

  alphaShared.cb({alphaList:{id:'alphaList',name:'Alpha stale',items:{x:{id:'x',name:'ALPHA-LEAK',done:false}}}});
  assert(!window.shopData.some(x=>x.name==='ALPHA-LEAK'),'stale alpha callback must not project into beta');
  assert(Object.keys(local).some(k=>k.includes('alpha-user:alpha-household')),'preference must be context scoped');

  console.log('shopping-context-rebind: PASS');
})().catch(e=>{console.error(e);process.exit(1);});
