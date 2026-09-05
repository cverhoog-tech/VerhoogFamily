'use strict';
const assert=require('assert');
const fs=require('fs');
const path=require('path');
const vm=require('vm');

const domainSource=fs.readFileSync(path.join(__dirname,'..','src','modules','cleaning','cleaningDomain.js'),'utf8');
const repositorySource=fs.readFileSync(path.join(__dirname,'..','src','modules','cleaning','cleaningHouseholdRepository.js'),'utf8');

let root={rooms:{seed:{id:'seed',name:'Bestaand',type:'custom',active:true}},routines:{}};
let roomPushes=0;
let routinePushes=0;
let failRoomOnce=true;
let failRoutineOnce=true;
let idCounter=0;

function snapshot(value){return{val:()=>value,exists:()=>value!==undefined&&value!==null};}
function childWriteRef(kind,id){
  return{
    key:id,
    set(value){
      if(kind==='room'&&failRoomOnce){failRoomOnce=false;return Promise.reject(new Error('NETWORK_AMBIGUOUS'));}
      if(kind==='routine'&&failRoutineOnce){failRoutineOnce=false;return Promise.reject(new Error('NETWORK_AMBIGUOUS'));}
      if(kind==='room')root.rooms[id]=JSON.parse(JSON.stringify(value));
      else root.routines[id]=JSON.parse(JSON.stringify(value));
      return Promise.resolve();
    },
    update(){return Promise.resolve();},
    transaction(fn){const current=kind==='room'?root.rooms[id]:root.routines[id];const next=fn(current);if(next!==undefined){if(kind==='room')root.rooms[id]=next;else root.routines[id]=next;}return Promise.resolve({committed:next!==undefined,snapshot:snapshot(next)});}
  };
}
function ref(pathName){
  if(pathName==='families/hh1/cleaning'){
    return{
      on(event,handler){if(event==='value')handler(snapshot(root));},
      off(){},
      transaction(){throw new Error('not needed');}
    };
  }
  if(pathName==='families/hh1/cleaning/rooms'){
    return{push(){roomPushes++;const id='room_'+(++idCounter);return childWriteRef('room',id);}};
  }
  if(pathName==='families/hh1/cleaning/routines'){
    return{push(){routinePushes++;const id='routine_'+(++idCounter);return childWriteRef('routine',id);}};
  }
  if(pathName.startsWith('families/hh1/cleaning/rooms/'))return childWriteRef('room',pathName.split('/').pop());
  if(pathName.startsWith('families/hh1/cleaning/routines/'))return childWriteRef('routine',pathName.split('/').pop());
  return{set:()=>Promise.resolve(),update:()=>Promise.resolve(),on:()=>{},off:()=>{}};
}

const household={ready:true,uid:'u1',householdId:'hh1',revision:1};
const token={uid:'u1',householdId:'hh1',revision:1};
const sandbox={
  window:{},console,Date,JSON,Math,Object,Array,String,Number,Promise,
  CustomEvent:function(name,options){this.type=name;this.detail=options&&options.detail;},
  addEventListener:()=>{},dispatchEvent:()=>{},
  HouseholdContext:{
    snapshot:()=>Object.assign({},household),
    capture:()=>Object.assign({},token),
    isCurrent:(candidate)=>!!candidate&&candidate.uid===token.uid&&candidate.householdId===token.householdId&&candidate.revision===token.revision,
    subscribe:(fn)=>{fn(Object.assign({},household));return()=>{};}
  },
  fbDb:{ref},
  CleaningRepositoryContract:null,
  CleaningPlanPersistenceContract:null
};
sandbox.window=sandbox;
vm.runInNewContext(domainSource,sandbox,{filename:'cleaningDomain.js'});
vm.runInNewContext(repositorySource,sandbox,{filename:'cleaningHouseholdRepository.js'});
const repo=sandbox.CleaningHouseholdRepository;
assert.ok(repo,'CleaningHouseholdRepository must register');

(async function(){
  const roomInput={name:'Netwerkkamer',type:'custom'};
  let failed=false;
  try{await repo.createRoom(roomInput);}catch(error){failed=error.message==='NETWORK_AMBIGUOUS';}
  assert.strictEqual(failed,true,'fixture must simulate an ambiguous first room write');
  assert.strictEqual(roomPushes,1,'first room attempt allocates one Firebase push key');
  const roomRetry=await repo.createRoom(roomInput);
  assert.strictEqual(roomPushes,1,'retry with same create payload must reuse the same push ref/key');
  assert.strictEqual(roomRetry.id,'room_1');
  assert.ok(root.rooms.room_1,'retry must materialize the originally allocated room id');

  const deliberateDuplicate=await repo.createRoom(roomInput);
  assert.strictEqual(roomPushes,2,'after confirmed success an intentional identical create may allocate a new key');
  assert.notStrictEqual(deliberateDuplicate.id,roomRetry.id);

  const routineInput={roomId:'seed',title:'Retry routine',intervalDays:7,estimatedMinutes:10,priority:'NORMAL'};
  failed=false;
  try{await repo.createRoutineItem(routineInput);}catch(error){failed=error.message==='NETWORK_AMBIGUOUS';}
  assert.strictEqual(failed,true,'fixture must simulate an ambiguous first routine write');
  assert.strictEqual(routinePushes,1,'first routine attempt allocates one Firebase push key');
  const routineRetry=await repo.createRoutineItem(routineInput);
  assert.strictEqual(routinePushes,1,'routine retry must reuse the same push ref/key');
  assert.ok(root.routines[routineRetry.id]);

  const deliberateRoutineDuplicate=await repo.createRoutineItem(routineInput);
  assert.strictEqual(routinePushes,2,'after confirmed routine success a deliberate duplicate may allocate a fresh key');
  assert.notStrictEqual(deliberateRoutineDuplicate.id,routineRetry.id);

  assert.ok(repositorySource.includes('createRetryHandles={room:{},routine:{}}'));
  assert.ok(repositorySource.includes("releaseCreateHandle('room'"));
  assert.ok(repositorySource.includes("releaseCreateHandle('routine'"));
  assert.ok(repositorySource.includes('clearCreateRetries()'),'context changes must not carry retry refs into another household');
  assert.ok(!repositorySource.includes("ref('families/'+write.ctx.householdId).transaction"),'create retry hardening may not introduce family-parent transactions');

  console.log('cleaning room/routine create retry idempotency: ok');
})().catch((error)=>{console.error(error);process.exitCode=1;});
