'use strict';
const assert=require('assert');
const fs=require('fs');
const path=require('path');
const vm=require('vm');

const source=fs.readFileSync(path.join(__dirname,'..','src','modules','cleaning','cleaningActivityProjector.js'),'utf8');
const calls=[];
const sandbox={
  console,Date,Math,JSON,Promise,Object,Array,String,Number,Map,Set,
  setInterval:()=>1,clearInterval:()=>{},
  CleaningHouseholdRepository:{subscribe:()=>()=>{}},
  HouseholdActivity:{
    TYPES:{CLEANING_COMPLETED:'cleaning.completed'},
    publish:(event)=>{calls.push(JSON.parse(JSON.stringify(event)));return Promise.resolve(event);}
  }
};
sandbox.window=sandbox;
vm.runInNewContext(source,sandbox,{filename:'cleaningActivityProjector.js'});

const projector=sandbox.CleaningActivityProjector;
assert.ok(projector,'CleaningActivityProjector must register');
assert.strictEqual(projector.version,'0.1.0');

const now=Date.now();
const data={
  rooms:{bath:{id:'bath',name:'Badkamer'}},
  completionLogs:{
    done:{id:'done',roomId:'bath',status:'COMPLETED',outcome:'COMPLETED',completedAt:now,completedByUid:'u2',actualMinutes:24,checklist:[{routineItemId:'shower',completed:true},{routineItemId:'floor',completed:true}]},
    partial:{id:'partial',roomId:'bath',status:'PARTIAL',outcome:'CARRY_FORWARD',completedAt:now-1,completedByUid:'u1',checklist:[{routineItemId:'mirror',completed:true},{routineItemId:'toilet',completed:false}]},
    skipped:{id:'skipped',roomId:'bath',status:'SKIPPED',outcome:'SKIP',completedAt:now-2,completedByUid:'u1',routineItemIds:['toilet']},
    reopened:{id:'reopened',roomId:'bath',status:'REOPENED',outcome:'REOPENED',completedAt:now-3,completedByUid:'u1',routineItemIds:['floor']}
  }
};

(async function(){
  await projector.project({ready:true,data});
  await Promise.resolve();
  assert.strictEqual(calls.length,1,'only fully completed Cleaning logs belong in the household progress feed');
  const event=calls[0];
  assert.strictEqual(event.type,'cleaning.completed');
  assert.strictEqual(event.occurrenceKey,'cleaning:completion:done','activity dedupe must be deterministic per completion log');
  assert.strictEqual(event.actorUid,'u2');
  assert.strictEqual(event.occurredAt,now);
  assert.strictEqual(event.payload.title,'Badkamer schoongemaakt');
  assert.strictEqual(event.payload.message,'Schoonmaak afgerond in Badkamer');
  assert.strictEqual(event.payload.detail,'2 routines · 24 min');
  assert.strictEqual(event.payload.roomId,'bath');
  assert.strictEqual(event.payload.routineCount,2);
  assert.strictEqual(event.payload.actualMinutes,24);
  assert.strictEqual(event.source.module,'cleaning');

  await projector.project({ready:true,data});
  await Promise.resolve();
  assert.strictEqual(calls.length,1,'same runtime may not republish an already confirmed completion event');

  assert.strictEqual(projector._completed(data.completionLogs.done),true);
  assert.strictEqual(projector._completed(data.completionLogs.partial),false);
  assert.strictEqual(projector._completed(data.completionLogs.skipped),false);
  assert.strictEqual(projector._completed(data.completionLogs.reopened),false);

  const fallback=projector._eventFor({rooms:{}},'x',{status:'COMPLETED',completedAt:now,completedByUid:'u1',roomId:'missing',routineItemIds:['a'],estimatedMinutes:10});
  assert.strictEqual(fallback.payload.title,'Ruimte schoongemaakt');
  assert.strictEqual(fallback.payload.detail,'1 routine · 10 min');

  assert.ok(source.includes('HouseholdActivity'),'Cleaning activity must use the shared household activity system');
  assert.ok(source.includes("occurrenceKey:'cleaning:completion:'"),'exact-once key must be explicit');
  assert.ok(!source.includes('.transaction('),'activity projection may never mutate Cleaning');
  assert.ok(!source.includes('.update('),'activity projection may never mutate Cleaning');
  assert.ok(!source.includes('.set('),'activity projection may never mutate Cleaning');
  assert.ok(!source.includes('.ref('),'activity projection may not create a second Firebase path');

  console.log('cleaning completed-work shared activity projection: ok');
})().catch((error)=>{console.error(error);process.exitCode=1;});
