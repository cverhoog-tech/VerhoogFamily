'use strict';
const fs=require('fs');
const vm=require('vm');
const assert=require('assert');

let current={uid:'alpha-user',householdId:'alpha-household'};
const listeners={};
const subscriptions=[];
const writes=[];
const store={
  readShared:()=>Promise.resolve({schemaVersion:2,initialized:true,items:{}}),
  writeShared:(c,v)=>{writes.push({c,v,context:Object.assign({},current)});return Promise.resolve(v);},
  subscribeShared:(c,cb)=>{const row={c,cb,off:false};subscriptions.push(row);return()=>{row.off=true;};}
};
const document={readyState:'complete',getElementById:()=>null,querySelector:()=>null,createElement:()=>({}),body:{},head:{appendChild(){}}};
const window={
  FamilyDataStore:store,
  HouseholdContext:{requireUser:()=>current.uid,requireHousehold:()=>current.householdId,assertContext:()=>current,isCurrent:t=>!!t&&t.uid===current.uid&&t.householdId===current.householdId},
  calData:[],addEventListener:(n,fn)=>{(listeners[n]||(listeners[n]=[])).push(fn);},dispatchEvent:()=>{},renderCal:()=>{},updateStats:()=>{},_currentScreen:'home'
};
const context={window,document,console,Promise,Date,Math,Object,Array,String,JSON,CustomEvent:function(){},setInterval:()=>0,clearInterval:()=>{},setTimeout:(fn)=>{fn();return 0;}};
vm.createContext(context);
vm.runInContext(fs.readFileSync('src/modules/calendar/calendarSharedLive.js','utf8'),context,{filename:'calendarSharedLive.js'});

async function waitFor(fn){for(let i=0;i<30;i++){if(fn())return;await Promise.resolve();}throw new Error('condition timeout');}

(async()=>{
  window.CalendarSharedLive.sync();
  await waitFor(()=>subscriptions.length>=1);
  assert.equal(window.CalendarSharedLive.status().context.householdId,'alpha-household');
  const alpha=subscriptions[0];
  alpha.cb({schemaVersion:2,initialized:true,items:{x:{id:'x',title:'Alpha afspraak'}}});
  assert.equal(window.calData[0].title,'Alpha afspraak');

  current={uid:'beta-user',householdId:'beta-household'};
  (listeners['familyapp:household-context-changed']||[]).forEach(fn=>fn());
  await waitFor(()=>subscriptions.length>=2);
  assert.equal(alpha.off,true,'old calendar subscription must detach');
  assert.equal(window.CalendarSharedLive.status().context.householdId,'beta-household');

  alpha.cb({schemaVersion:2,initialized:true,items:{leak:{id:'leak',title:'ALPHA-LEAK'}}});
  assert(!window.calData.some(e=>e.title==='ALPHA-LEAK'),'stale alpha callback must not project into beta');

  window.calData=[{id:'b1',title:'Beta afspraak'}];
  await window.CalendarSharedLive.save();
  assert.equal(writes[writes.length-1].v.householdId,'beta-household');
  assert.equal(writes[writes.length-1].v.updatedBy,'beta-user');
  console.log('calendar-context-rebind: PASS');
})().catch(e=>{console.error(e);process.exit(1);});
