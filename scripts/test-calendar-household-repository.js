'use strict';
const fs=require('fs');
const assert=require('assert');
const vm=require('vm');

function read(path){return fs.readFileSync(path,'utf8');}
function tick(){return new Promise(resolve=>setTimeout(resolve,0));}
function snap(value){return{val(){return value;}};}
function clone(v){return v===undefined?undefined:JSON.parse(JSON.stringify(v));}

const repoSource=read('src/modules/calendar/calendarEventHouseholdRepository.js');
const facadeSource=read('src/modules/calendar/calendarSharedLive.js');
const bootstrapSource=read('src/modules/calendar/calendar.js');
const mealIntegrationSource=read('src/modules/calendar/calendarMealPlanIntegration.js');
const rules=JSON.parse(read('database.rules.json'));

// Static architecture contract.
assert.ok(repoSource.includes("families/'+ctx.householdId+'/calendarEvents"),'canonical agenda path must be families/{householdId}/calendarEvents');
assert.ok(repoSource.includes('HouseholdContext.capture'),'agenda repository must capture HouseholdContext');
assert.ok(repoSource.includes('HouseholdContext.isCurrent'),'agenda repository must reject stale HouseholdContext work');
assert.ok(repoSource.includes("active.ref.off('value',active.handler)"),'agenda repository must detach the exact prior Firebase listener');
assert.ok(repoSource.includes("families/'+binding.context.householdId+'/shared/calendar"),'same-household shared/calendar must be an allowed legacy source');
assert.ok(repoSource.includes("families/'+binding.context.householdId+'/cal"),'same-household historical root calendar must be an allowed legacy source');
assert.ok(repoSource.includes('calendarMigrations/v2LegacyToCanonical'),'agenda migration must use a household marker');
assert.ok(repoSource.includes("source:'mutation-ack'"),'successful mutations must update the canonical in-memory projection without waiting for listener timing');
assert.ok(!repoSource.includes('AppState.set('),'generic AppState calendar data must never seed canonical households');
assert.ok(!repoSource.includes('window.calData'),'canonical agenda repository must not read legacy in-memory calendar state');
assert.ok(!repoSource.includes('FamilyDataStore'),'canonical agenda repository must own Firebase directly');
assert.ok(facadeSource.includes('CalendarEventHouseholdRepository'),'CalendarSharedLive must be a facade over the canonical repository');
assert.ok(!facadeSource.includes('FamilyDataStore'),'CalendarSharedLive must not own the old generic family store');
assert.ok(!facadeSource.includes('fbFamilyId'),'CalendarSharedLive must not derive household identity from fbFamilyId');
assert.ok(facadeSource.includes("'familyapp:calendar-local-mutation'"),'local mutation event contract must remain for per-user Google sync');
assert.ok(facadeSource.includes('submitCalendarSheet'),'calendar facade must own the final add-sheet submit path');
assert.ok(facadeSource.includes('button.onclick=function(ev)'),'calendar primary button must bind directly to canonical submit logic');
assert.ok(facadeSource.includes('selectedCalendarDate'),'calendar create flow must preserve selected-day prefill');
assert.ok(mealIntegrationSource.includes('Projects MealPlanStore data into Agenda without duplicating records'),'meals must remain a virtual agenda projection');
assert.ok(!mealIntegrationSource.includes('CalendarSharedLive.create'),'meal integration must not duplicate meals into calendar events');

const legacyIndex=bootstrapSource.indexOf('calendarLegacy.js?v=3');
const repoIndex=bootstrapSource.indexOf('calendarEventHouseholdRepository.js?v=2');
const premiumIndex=bootstrapSource.indexOf('calendarPremiumUi.js?v=3');
const facadeIndex=bootstrapSource.indexOf('calendarSharedLive.js?v=6');
const mealsIndex=bootstrapSource.indexOf('calendarMealPlanIntegration.js?v=1');
const googleIndex=bootstrapSource.indexOf('calendarGoogleSync.js?v=1');
assert.ok(legacyIndex>=0&&repoIndex>legacyIndex&&premiumIndex>repoIndex&&facadeIndex>premiumIndex&&mealsIndex>facadeIndex&&googleIndex>mealsIndex,'calendar runtime order must be legacy UI -> repository -> premium decoration -> canonical facade -> meals -> Google sync');
assert.ok(rules.rules.families.$familyId.$sharedData,'family wildcard rules must protect canonical calendarEvents child');
assert.ok(String(rules.rules.families.$familyId.$sharedData['.write']).includes("members').child(auth.uid).child('status').val() === 'active'"),'canonical calendar writes must require active household membership');

function makeStorage(){const map=new Map();return{getItem(k){return map.has(k)?map.get(k):null;},setItem(k,v){map.set(k,String(v));},removeItem(k){map.delete(k);},keys(){return Array.from(map.keys());}};}
function makeDb(initial){
  const data=Object.assign({},initial||{}),refs={},writes=[];
  function ref(path){
    if(refs[path])return refs[path];
    const handlers=[],offCalls=[];
    const node={path,handlers,offCalls,
      on(event,handler,errorHandler){assert.strictEqual(event,'value');handlers.push(handler);node.errorHandler=errorHandler;},
      off(event,handler){offCalls.push({event,handler});const i=handlers.indexOf(handler);if(i>=0)handlers.splice(i,1);},
      once(event){assert.strictEqual(event,'value');return Promise.resolve(snap(data[path]===undefined?null:clone(data[path])));},
      child(key){return ref(path+'/'+String(key));},
      set(value){writes.push({path,value:clone(value)});data[path]=clone(value);return Promise.resolve();},
      transaction(updater,done){const current=data[path]===undefined?null:clone(data[path]);let next;try{next=updater(current);}catch(error){done(error,false,snap(current));return;}if(next===undefined){done(null,false,snap(current));return;}data[path]=clone(next);writes.push({path,value:clone(next)});done(null,true,snap(clone(next)));},
      emit(value){data[path]=clone(value);handlers.slice().forEach(handler=>handler(snap(clone(value))));}
    };
    refs[path]=node;return node;
  }
  return{ref,refs,data,writes};
}

(async function(){
  let current={ready:true,uid:'uA',householdId:'A',revision:1};
  const contextListeners=[];
  const storage=makeStorage();
  const db=makeDb({
    'families/A/calendarMigrations/v2LegacyToCanonical':{status:'complete'},
    'families/B/calendarMigrations/v2LegacyToCanonical':{status:'complete'},
    'families/A/calendarEvents':{id_a:{id:'a',title:'A afspraak',date:'2026-08-24',time:'09:00',householdId:'A',schemaVersion:2,createdByUid:'uA',createdAt:1,updatedAt:1}},
    'families/B/calendarEvents':{id_b:{id:'b',title:'B afspraak',date:'2026-08-25',time:'10:00',householdId:'B',schemaVersion:2,createdByUid:'uB',createdAt:2,updatedAt:2}}
  });
  const HouseholdContext={
    snapshot(){return clone(current);},
    capture(){return clone(current);},
    isCurrent(token){return !!token&&token.uid===current.uid&&token.householdId===current.householdId&&token.revision===current.revision;},
    subscribe(fn){contextListeners.push(fn);fn(clone(current));return()=>{};}
  };
  function CustomEvent(type,opts){this.type=type;this.detail=opts&&opts.detail;}
  const window={HouseholdContext,fbDb:db,dispatchEvent(){},addEventListener(){}};
  const sandbox={window,HouseholdContext,localStorage:storage,CustomEvent,console,setInterval,clearInterval,setTimeout,clearTimeout,Promise,Date,Math,JSON,Object,String,Number,Array};
  vm.createContext(sandbox);vm.runInContext(repoSource,sandbox,{filename:'calendarEventHouseholdRepository.js'});
  const repo=window.CalendarEventHouseholdRepository;
  assert.ok(repo,'CalendarEventHouseholdRepository must register');

  const aRef=db.ref('families/A/calendarEvents');
  assert.strictEqual(aRef.handlers.length,1,'household A must have one realtime listener');
  const staleAHandler=aRef.handlers[0];
  aRef.emit(db.data['families/A/calendarEvents']);
  await tick();await tick();
  assert.deepStrictEqual(repo.list().map(x=>x.id),['a'],'A projection must contain only household A');

  current={ready:true,uid:'uB',householdId:'B',revision:2};
  contextListeners.forEach(fn=>fn(clone(current)));
  assert.ok(aRef.offCalls.length>=1,'switching households must detach household A listener');
  const bRef=db.ref('families/B/calendarEvents');
  assert.strictEqual(bRef.handlers.length,1,'household B must have one realtime listener');
  bRef.emit(db.data['families/B/calendarEvents']);
  await tick();await tick();
  assert.deepStrictEqual(repo.list().map(x=>x.id),['b'],'B projection must contain only household B');

  // A stale callback from the previous binding must not repopulate A data.
  staleAHandler(snap({id_leak:{id:'leak',title:'LEAK',date:'2026-08-26',schemaVersion:2}}));
  await tick();
  assert.deepStrictEqual(repo.list().map(x=>x.id),['b'],'stale household A callback must be ignored after switch to B');

  const created=await repo.create({title:'B nieuw',date:'2026-08-27',time:'18:30'});
  assert.strictEqual(created.householdId,'B','created agenda event must be sealed to active household B');
  assert.strictEqual(created.createdByUid,'uB','created agenda event must use active UID');
  assert.ok(db.writes.some(w=>w.path.indexOf('families/B/calendarEvents/')===0&&w.value&&w.value.title==='B nieuw'),'create must write only under household B');
  assert.ok(!db.writes.some(w=>w.path.indexOf('families/A/calendarEvents/')===0&&w.value&&w.value.title==='B nieuw'),'create must never write new B event under A');
  assert.strictEqual(repo.get(created.id).title,'B nieuw','create acknowledgement must immediately project the new event before a Firebase listener callback');

  const createdUpdated=await repo.updateOne(created.id,{title:'B nieuw direct gewijzigd'});
  assert.strictEqual(createdUpdated.title,'B nieuw direct gewijzigd','a just-created event must be editable before another listener callback');
  assert.strictEqual(repo.get(created.id).title,'B nieuw direct gewijzigd','update acknowledgement must immediately refresh repository projection');
  const createdRemoved=await repo.remove(created.id);
  assert.strictEqual(createdRemoved,true,'a just-created event must be removable before another listener callback');
  assert.strictEqual(repo.get(created.id),null,'delete acknowledgement must immediately remove the event from repository projection');

  const updated=await repo.updateOne('b',{title:'B gewijzigd',householdId:'A',createdByUid:'evil',schemaVersion:99});
  assert.strictEqual(updated.title,'B gewijzigd','edit must update mutable fields');
  assert.strictEqual(updated.householdId,'B','edit must not move an event to another household');
  assert.strictEqual(updated.createdByUid,'uB','edit must preserve creator authority');
  assert.strictEqual(updated.schemaVersion,2,'edit must preserve canonical schema authority');
  assert.ok(db.writes.some(w=>w.path==='families/B/calendarEvents/id_b'&&w.value&&w.value.title==='B gewijzigd'),'edit must transact the B event record');

  const removed=await repo.remove('b');
  assert.strictEqual(removed,true,'delete must resolve true for existing B event');
  assert.ok(db.writes.some(w=>w.path==='families/B/calendarEvents/id_b'&&w.value===null),'delete must remove only the B event record');
  assert.strictEqual(repo.get('b'),null,'delete acknowledgement must remove existing events from projection immediately');

  const cacheKeys=storage.keys();
  assert.ok(cacheKeys.some(k=>k.includes('uA_A')),'A cache must be UID + household scoped');
  assert.ok(cacheKeys.some(k=>k.includes('uB_B')),'B cache must be UID + household scoped');

  console.log('STEP 6 calendar household repository contract: PASS');
})().catch(error=>{console.error(error);process.exit(1);});
