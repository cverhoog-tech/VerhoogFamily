'use strict';
const fs=require('fs');
const assert=require('assert');
const vm=require('vm');

function read(path){return fs.readFileSync(path,'utf8');}
function tick(){return new Promise(resolve=>setTimeout(resolve,0));}
function snapshot(value){return{val(){return value;}};}
function copy(value){return value===undefined?undefined:JSON.parse(JSON.stringify(value));}

const repoSource=read('src/modules/meals/mealPlanHouseholdRepository.js');
const facadeSource=read('src/modules/meals/mealPlanStore.js');
const bridgeSource=read('src/modules/meals/mealPlannerBottomSheetBridge.js');
const uiSource=read('src/modules/meals/meals.js');
const loaderSource=read('api/app.js');
const rules=JSON.parse(read('database.rules.json'));

// Static architecture contract.
assert.ok(repoSource.includes("families/'+ctx.householdId+'/mealPlans"),'canonical meals path must be families/{householdId}/mealPlans');
assert.ok(repoSource.includes('HouseholdContext.capture'),'meal repository must capture HouseholdContext');
assert.ok(repoSource.includes('HouseholdContext.isCurrent'),'meal repository must reject stale HouseholdContext work');
assert.ok(repoSource.includes("active.ref.off('value',active.handler)"),'meal repository must detach exact prior listener');
assert.ok(repoSource.includes("families/'+binding.context.householdId+'/shared/mealPlans"),'only same-household shared/mealPlans may be migration input');
assert.ok(repoSource.includes('mealPlanMigrations/v2SharedToCanonical'),'meal migration must persist a household marker');
assert.ok(!repoSource.includes('familyapp_food_meal_plan_v001'),'generic meal localStorage must never seed canonical household meals');
assert.ok(!repoSource.includes('FamilyDataStore'),'canonical meal repository must own Firebase directly');
assert.ok(facadeSource.includes('MealPlanHouseholdRepository'),'MealPlanStore must be a facade over canonical repository');
assert.ok(!facadeSource.includes('FamilyDataStore'),'MealPlanStore facade must not own generic family persistence');
assert.ok(!facadeSource.includes('familyapp_food_meal_plan_v001'),'MealPlanStore must not restore generic legacy migration authority');
assert.ok(uiSource.includes('recipeId'),'meal UI must resolve meals through stable recipe IDs');
assert.ok(bridgeSource.includes('recipeId:r?r.id:null'),'planner must persist recipe ID rather than recipe name as the relationship');
const repoIndex=loaderSource.indexOf('mealPlanHouseholdRepository.js?v=1');
const storeIndex=loaderSource.indexOf('mealPlanStore.js?v=2');
const bridgeIndex=loaderSource.indexOf('mealPlannerBottomSheetBridge.js?v=2');
const uiIndex=loaderSource.indexOf('meals.js?v=4');
assert.ok(repoIndex>=0&&storeIndex>repoIndex&&bridgeIndex>storeIndex&&uiIndex>bridgeIndex,'meal runtime must load repository -> facade -> planner -> UI');
assert.ok(rules.rules.families.$familyId.$sharedData,'family wildcard rules must protect canonical mealPlans child');
assert.ok(String(rules.rules.families.$familyId.$sharedData['.write']).includes("members').child(auth.uid).child('status').val() === 'active'"),'canonical meal writes must require active household membership');

function makeStorage(seed){const map=new Map(Object.entries(seed||{}));return{getItem(k){return map.has(k)?map.get(k):null;},setItem(k,v){map.set(k,String(v));},removeItem(k){map.delete(k);},dump(){return Object.fromEntries(map.entries());}};}
function makeDb(initial){
  const data=Object.assign({},initial||{}),refs={},writes=[];
  function ref(path){
    if(refs[path])return refs[path];
    const handlers=[],offCalls=[];
    const node={path,handlers,offCalls,
      on(event,handler,errorHandler){assert.strictEqual(event,'value');handlers.push(handler);node.errorHandler=errorHandler;},
      off(event,handler){offCalls.push({event,handler});const i=handlers.indexOf(handler);if(i>=0)handlers.splice(i,1);},
      once(event){assert.strictEqual(event,'value');return Promise.resolve(snapshot(data[path]===undefined?null:copy(data[path])));},
      child(key){return ref(path+'/'+String(key));},
      set(value){writes.push({path,value:copy(value)});data[path]=copy(value);return Promise.resolve();},
      transaction(updater,done){const current=data[path]===undefined?null:copy(data[path]);let next;try{next=updater(current);}catch(error){done(error,false,snapshot(current));return;}if(next===undefined){done(null,false,snapshot(current));return;}data[path]=copy(next);writes.push({path,value:copy(next)});done(null,true,snapshot(copy(next)));},
      emit(value){data[path]=copy(value);handlers.slice().forEach(handler=>handler(snapshot(copy(value))));}
    };
    refs[path]=node;return node;
  }
  return{ref,refs,writes,data};
}

(async function(){
  let contextState={uid:'uidA',householdId:'A',ready:true,revision:1};
  let contextSubscriber=null;
  const database=makeDb();
  const storage=makeStorage({familyapp_food_meal_plan_v001:JSON.stringify([{id:'leak',date:'2026-08-20',mealType:'dinner',title:'A local leak'}])});
  const sandbox={console,setTimeout,clearTimeout,setInterval,clearInterval,Promise,Date,Math,JSON,Object,Array,String,Number,Boolean,RegExp,Error,localStorage:storage,CustomEvent:function(type,init){this.type=type;this.detail=init&&init.detail;}};
  sandbox.window=sandbox;sandbox.fbDb=database;sandbox.window.dispatchEvent=function(){};
  sandbox.HouseholdContext={
    snapshot(){return Object.freeze(Object.assign({},contextState));},
    capture(){return Object.freeze({uid:contextState.uid,householdId:contextState.householdId,revision:contextState.revision});},
    isCurrent(token){return !!token&&token.uid===contextState.uid&&token.householdId===contextState.householdId&&token.revision===contextState.revision;},
    subscribe(fn){contextSubscriber=fn;fn(Object.freeze(Object.assign({},contextState)),'subscribe');return function(){if(contextSubscriber===fn)contextSubscriber=null;};}
  };
  sandbox.RecipeStore={get(id){
    const map={recipeA:{id:'recipeA',name:'Recipe A',householdId:'A'},recipeB:{id:'recipeB',name:'Recipe B',householdId:'B'},recipeC:{id:'recipeC',name:'Recipe C',householdId:'C'}};
    return map[String(id)]||null;
  }};

  vm.runInNewContext(repoSource,sandbox,{filename:'mealPlanHouseholdRepository.js'});
  const repo=sandbox.MealPlanHouseholdRepository;
  assert.ok(repo,'MealPlanHouseholdRepository must install globally');
  assert.strictEqual(repo.status().canonicalPath,'families/A/mealPlans');
  const aRef=database.refs['families/A/mealPlans'];
  assert.ok(aRef&&aRef.handlers.length===1,'household A must have exactly one meal listener');
  const staleAHandler=aRef.handlers[0];
  aRef.emit({id_a:{id:'a',date:'2026-08-22',mealType:'dinner',recipeId:'recipeA',title:'Recipe A',schemaVersion:2,createdByUid:'uidA',createdAt:1,updatedAt:2}});
  await tick();await tick();await tick();await tick();
  assert.deepStrictEqual(repo.list().map(r=>r.title),['Recipe A']);
  assert.strictEqual(repo.list()[0].recipeRef.id,'recipeA');
  assert.strictEqual(repo.list()[0].recipeRef.householdId,'A');

  // A -> B must detach exact listener and clear projection before B arrives.
  contextState={uid:'uidB',householdId:'B',ready:true,revision:2};
  contextSubscriber(Object.freeze(Object.assign({},contextState)),'identity-change');
  assert.strictEqual(aRef.offCalls.length,1,'old meal listener must detach once');
  assert.strictEqual(aRef.offCalls[0].handler,staleAHandler,'exact old meal handler must be detached');
  assert.strictEqual(repo.list().length,0,'A meals must clear immediately after switching to B');
  const bRef=database.refs['families/B/mealPlans'];
  assert.ok(bRef&&bRef.handlers.length===1,'household B must have one meal listener');
  staleAHandler(snapshot({id_stale:{id:'stale',date:'2026-08-23',mealType:'dinner',title:'STALE A'}}));
  assert.strictEqual(repo.list().length,0,'stale A callback must not repopulate B');

  // Empty B must not import hostile generic localStorage.
  bRef.emit(null);await tick();await tick();await tick();await tick();
  assert.strictEqual(repo.list().length,0,'empty B must remain empty without same-household legacy Firebase data');
  assert.ok(!database.writes.some(w=>w.path.startsWith('families/B/mealPlans')&&JSON.stringify(w.value).includes('A local leak')),'generic local meal storage must never migrate into B');

  // Stable recipe reference on create.
  const created=await repo.create({date:'2026-08-24',mealType:'dinner',recipeId:'recipeB',title:'Custom title',persons:4});
  assert.strictEqual(created.householdId,'B');
  assert.strictEqual(created.createdByUid,'uidB');
  assert.strictEqual(created.recipeId,'recipeB');
  assert.strictEqual(created.recipeRef.id,'recipeB');
  assert.strictEqual(created.recipeRef.householdId,'B');
  assert.strictEqual(created.recipeTitleSnapshot,'Recipe B');
  const createdWrite=database.writes.find(w=>w.path.startsWith('families/B/mealPlans/id_meal_')&&w.value&&w.value.recipeId==='recipeB');
  assert.ok(createdWrite,'create must write canonical B meal record');
  const createdId=created.id;

  // Edit must keep immutable identity and can change presentation fields.
  const updated=await repo.updateOne(createdId,{title:'Updated B',notes:'note',householdId:'A',createdByUid:'attacker',schemaVersion:999});
  assert.strictEqual(updated.title,'Updated B');
  assert.strictEqual(updated.notes,'note');
  assert.strictEqual(updated.householdId,'B');
  assert.strictEqual(updated.createdByUid,'uidB');
  assert.strictEqual(updated.schemaVersion,2);
  assert.strictEqual(updated.recipeRef.householdId,'B');

  // A recipe from another household must be rejected.
  let invalid=null;
  try{await repo.create({date:'2026-08-25',mealType:'dinner',recipeId:'recipeA',title:'Wrong household'});}catch(error){invalid=error;}
  assert.ok(invalid&&invalid.code==='MEAL_RECIPE_REFERENCE_INVALID','cross-household recipe reference must be rejected');

  // Delete stays under B only.
  await repo.remove(createdId);
  assert.ok(database.writes.some(w=>w.path===createdWrite.path&&w.value===null),'delete must remove the canonical B meal record');
  assert.ok(!database.writes.some(w=>w.path.startsWith('families/A/mealPlans')&&w.value&&w.value.title==='Updated B'),'B mutations must never write to A');
  assert.ok(Object.keys(storage.dump()).some(k=>k==='familyapp_mealplans_v2_uidB_B'),'meal cache must be UID + household scoped');

  // Same-household shared/mealPlans is the only migration source.
  contextState={uid:'uidC',householdId:'C',ready:true,revision:3};
  database.data['families/C/shared/mealPlans']={legacy_c:{id:'c',date:'2026-08-26',mealType:'lunch',recipeId:'recipeC',title:'Legacy C',createdAt:10,updatedAt:20}};
  contextSubscriber(Object.freeze(Object.assign({},contextState)),'identity-change');
  const cRef=database.refs['families/C/mealPlans'];cRef.emit(null);
  await tick();await tick();await tick();await tick();await tick();
  assert.deepStrictEqual(repo.list().map(r=>r.title),['Legacy C'],'same-household shared meal plan should migrate');
  assert.ok(repo.list().every(r=>r.householdId==='C'&&r.schemaVersion===2),'migrated meals must be sealed to C/schema v2');
  assert.ok(database.writes.some(w=>w.path==='families/C/mealPlanMigrations/v2SharedToCanonical'&&w.value&&w.value.status==='complete'),'meal migration marker must be written');

  console.log('meal plan household repository contract: PASS');
})().catch(error=>{console.error(error);process.exitCode=1;});
