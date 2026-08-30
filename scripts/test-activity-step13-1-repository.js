'use strict';
const fs=require('fs');
const vm=require('vm');
const assert=require('assert');
const source=fs.readFileSync('src/platform/activity/activityHouseholdRepository.js','utf8');

function tick(){return new Promise(r=>setTimeout(r,0));}
function makeHarness(){
  const data={}; const listeners={}; const offCalls=[]; let txCalls=0;
  function get(path){return path.split('/').filter(Boolean).reduce((o,k)=>o&&o[k],data);}
  function set(path,value){const parts=path.split('/').filter(Boolean);let o=data;parts.forEach((k,i)=>{if(i===parts.length-1){if(value==null)delete o[k];else o[k]=value;}else{o[k]=o[k]||{};o=o[k];}});Object.keys(listeners).filter(k=>path.startsWith(k)||k.startsWith(path)).forEach(k=>(listeners[k]||[]).forEach(fn=>fn({val:()=>get(k)})));}
  function ref(path){return{path,child(k){return ref(path+'/'+k);},on(evt,fn){assert.equal(evt,'value');listeners[path]=listeners[path]||[];listeners[path].push(fn);fn({val:()=>get(path)});},off(evt,fn){offCalls.push(path);listeners[path]=(listeners[path]||[]).filter(x=>x!==fn);},transaction(update,done){txCalls++;const before=get(path);const next=update(before);if(next===undefined){done(null,false,{val:()=>before});return;}if(before==null)set(path,next);done(null,before==null,{val:()=>get(path)});}};}
  let ctx={uid:'u1',householdId:'h1',ready:true,revision:1}; const ctxListeners=[];
  const HouseholdContext={snapshot:()=>({...ctx}),capture:()=>({uid:ctx.uid,householdId:ctx.householdId,revision:ctx.revision}),isCurrent:t=>!!t&&t.uid===ctx.uid&&t.householdId===ctx.householdId&&t.revision===ctx.revision,subscribe(fn){ctxListeners.push(fn);fn({...ctx},'subscribe');return()=>{const i=ctxListeners.indexOf(fn);if(i>=0)ctxListeners.splice(i,1);};}};
  const local={};
  const sandbox={console,Promise,setInterval,clearInterval,CustomEvent:function(n,o){this.type=n;this.detail=o&&o.detail;},localStorage:{getItem:k=>local[k]||null,setItem:(k,v)=>{local[k]=v;}},window:{fbDb:{ref},HouseholdContext,dispatchEvent(){},addEventListener(){}}};sandbox.window.window=sandbox.window;sandbox.window.localStorage=sandbox.localStorage;sandbox.HouseholdContext=HouseholdContext;sandbox.window.CustomEvent=sandbox.CustomEvent;
  vm.runInNewContext(source,sandbox,{filename:'activityHouseholdRepository.js'});
  function switchContext(next){ctx={...next};ctxListeners.slice().forEach(fn=>fn({...ctx},'test-switch'));}
  return{repo:sandbox.window.ActivityHouseholdRepository,data,get,set,offCalls,switchContext,txCalls:()=>txCalls};
}

(async function(){
  const h=makeHarness(); const r=h.repo;
  assert.equal(r.status().canonicalPath,'families/h1/activityEvents');
  const input={type:'task.completed',occurrenceKey:'task:t1:completion:123',occurredAt:123,payload:{taskTitle:'Keuken'},source:{module:'tasks'}};
  const first=await r.appendOnce(input);assert.equal(first.event.householdId,'h1');assert.equal(first.event.actorUid,'u1');assert.equal(first.event.id,r.eventIdFor(input.occurrenceKey));assert.equal(first.created,true);
  const originalCreated=first.event.createdAt;
  const second=await r.appendOnce({...input,payload:{taskTitle:'MAG NIET OVERSCHRIJVEN'},createdAt:999});
  assert.equal(second.event.payload.taskTitle,'Keuken','appendOnce must preserve existing immutable event');assert.equal(second.event.createdAt,originalCreated);assert.equal(second.duplicate,true);assert.equal(h.txCalls(),2);

  let latest=r.list();assert.equal(latest.length,1);assert.equal(latest[0].householdId,'h1');
  h.switchContext({uid:'u2',householdId:'h2',ready:true,revision:2});await tick();
  assert(h.offCalls.includes('families/h1/activityEvents'),'old household listener must be detached');assert.equal(r.status().canonicalPath,'families/h2/activityEvents');assert.equal(r.list().length,0,'old household projection must not leak into new household');
  await r.appendOnce({type:'meal.planned',occurrenceKey:'meal:m1:planned:456',occurredAt:456,payload:{mealName:'Soep'}});
  assert.equal(h.get('families/h2/activityEvents')[r.eventIdFor('meal:m1:planned:456')].householdId,'h2');
  assert.equal(h.get('families/h1/activityEvents')[r.eventIdFor(input.occurrenceKey)].householdId,'h1');

  h.switchContext({uid:null,householdId:null,ready:false,revision:3});await tick();assert.equal(r.list().length,0);assert.equal(r.status().ready,false);
  let rejected=false;try{await r.appendOnce({type:'task.created',occurrenceKey:'x'});}catch(e){rejected=true;assert.equal(e.message,'ACTIVE_HOUSEHOLD_REQUIRED');}assert(rejected);

  r.stop();
  console.log('activity STEP 13.1 repository lifecycle/idempotency: PASS');
})().catch(err=>{console.error(err);process.exit(1);});
