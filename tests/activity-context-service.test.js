'use strict';
const fs=require('fs');const vm=require('vm');const assert=require('assert');
const code=fs.readFileSync('src/platform/activity/householdActivity.js','utf8');
let ctx={uid:'alpha-user',householdId:'alpha-household'};const listeners={};const subscriptions=[];const db={activity:{},activityEvents:{}};
const window={
  HouseholdContext:{requireUser:()=>ctx.uid,requireHousehold:()=>ctx.householdId,assertContext(t){assert.equal(t.uid,ctx.uid);assert.equal(t.householdId,ctx.householdId);},isCurrent:t=>!!t&&t.uid===ctx.uid&&t.householdId===ctx.householdId},
  FamilyDataStore:{
    readShared:(c,f)=>Promise.resolve(db[c]||f),
    writeSharedRecord:(c,id,v)=>{db[c]=db[c]||{};if(v==null)delete db[c][id];else db[c][id]=v;return Promise.resolve(v);},
    mutateSharedRecord:(c,id,fn,fallback)=>{db[c]=db[c]||{};const next=fn(db[c][id]===undefined?fallback:db[c][id]);if(next!==undefined)db[c][id]=next;return Promise.resolve({value:db[c][id]});},
    subscribeShared:(c,cb)=>{const sub={c,cb,closed:false};subscriptions.push(sub);return()=>{sub.closed=true;};}
  },
  addEventListener:(n,fn)=>{(listeners[n]=listeners[n]||[]).push(fn);},
  dispatchEvent:()=>{},
  CustomEvent:function(name,opts){this.type=name;this.detail=opts&&opts.detail;}
};
const sandbox={window,document:{readyState:'loading',addEventListener:()=>{}},console,Promise,setTimeout,clearTimeout,CustomEvent:window.CustomEvent};vm.createContext(sandbox);vm.runInContext(code,sandbox);
(async()=>{
  const svc=window.ActivityService;assert(svc);await svc.start();assert.equal(svc.status().context.householdId,'alpha-household');
  const first=await svc.publish({type:'task.created',module:'tasks',entityType:'task',entityId:'task-1',idempotencyKey:'task:task-1:created',payload:{taskTitle:'Afwas'}});
  const second=await svc.publish({type:'task.created',module:'tasks',entityType:'task',entityId:'task-1',idempotencyKey:'task:task-1:created',payload:{taskTitle:'Andere titel'}});
  assert.equal(first.id,second.id);assert.equal(Object.keys(db.activity).length,1);assert.equal(db.activity[first.id].householdId,'alpha-household');assert.equal(db.activity[first.id].actorUid,'alpha-user');assert.equal(db.activity[first.id].payload.taskTitle,'Afwas');
  const alphaSub=subscriptions.filter(s=>s.c==='activity').slice(-1)[0];assert(alphaSub&&!alphaSub.closed);
  ctx={uid:'beta-user',householdId:'beta-household'};(listeners['familyapp:household-context-changed']||[]).forEach(fn=>fn());await Promise.resolve();await Promise.resolve();assert(alphaSub.closed,'old activity subscription must be detached');
  await svc.start();assert.equal(svc.status().context.householdId,'beta-household');
  alphaSub.cb({leak:{id:'leak',type:'task.created',householdId:'alpha-household',occurredAt:1}});assert.equal(svc.getEvents().some(e=>e.id==='leak'),false,'stale callback leaked into current household');
  const receipt=await svc.publish({type:'grocery.receipt_uploaded',module:'shop',entityType:'shoppingReceipt',entityId:'receipt-1',idempotencyKey:'receipt:1',payload:{shoppingListName:'Week',itemCount:4,amount:91.25,total:91.25}});assert.equal(receipt.householdId,'beta-household');assert.equal(receipt.actorUid,'beta-user');assert.equal('amount' in receipt.payload,false);assert.equal('total' in receipt.payload,false);
  console.log('activity-context-service: ok');
})().catch(e=>{console.error(e);process.exit(1);});
