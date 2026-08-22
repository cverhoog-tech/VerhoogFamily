'use strict';
const fs=require('fs');
const assert=require('assert');
const vm=require('vm');

function read(path){return fs.readFileSync(path,'utf8');}
function tick(){return new Promise(resolve=>setTimeout(resolve,0));}

const repoSource=read('src/modules/recipes/recipeHouseholdRepository.js');
const facadeSource=read('src/modules/recipes/recipeSharedLive.js');
const uiSource=read('src/modules/recipes/recipes.js');
const editorSource=read('src/modules/recipes/recipeEditorPopup.js');
const loaderSource=read('api/app.js');
const rules=JSON.parse(read('database.rules.json'));

// ============================================================
// PART 1 — static architecture contract
// ============================================================
assert.ok(repoSource.includes("families/'+ctx.householdId+'/recipes"),'canonical recipe path must be families/{householdId}/recipes');
assert.ok(repoSource.includes('HouseholdContext.capture'),'recipe repository must capture HouseholdContext');
assert.ok(repoSource.includes('HouseholdContext.isCurrent'),'recipe repository must reject stale HouseholdContext callbacks/mutations');
assert.ok(repoSource.includes("active.ref.off('value',active.handler)"),'recipe repository must detach the exact prior Firebase listener');
assert.ok(repoSource.includes("families/'+binding.context.householdId+'/shared/recipes"),'migration may only inspect same-household shared/recipes');
assert.ok(repoSource.includes('recipeMigrations/v3SharedToCanonical'),'recipe migration must persist a household-scoped marker');
assert.ok(!repoSource.includes('fam_recipes_v1'),'generic legacy local recipe storage must never seed canonical household recipes');
assert.ok(!repoSource.includes('FamilyDataStore'),'canonical recipe repository must own Firebase binding directly');
assert.ok(facadeSource.includes('RecipeHouseholdRepository'),'RecipeStore must be a compatibility facade over RecipeHouseholdRepository');
assert.ok(!facadeSource.includes('FamilyDataStore'),'RecipeStore facade must no longer use FamilyDataStore as persistence/listener owner');
assert.ok(!facadeSource.includes('fam_recipes_v1'),'RecipeStore facade must not restore the generic legacy recipe cache authority');
assert.ok(uiSource.includes('RecipeStore'),'existing recipe UI must remain routed through RecipeStore');
assert.ok(editorSource.includes('RecipeStore.create()/.upsert()'),'recipe editor must retain the RecipeStore mutation boundary');
const repoIndex=loaderSource.indexOf('recipeHouseholdRepository.js?v=1');
const facadeIndex=loaderSource.indexOf('recipeSharedLive.js?v=4');
assert.ok(repoIndex>=0&&facadeIndex>repoIndex,'runtime must load recipe repository before RecipeStore facade');
assert.ok(rules.rules.families.$familyId.$sharedData,'family wildcard rules must protect canonical recipes child');
assert.ok(String(rules.rules.families.$familyId.$sharedData['.write']).includes("members').child(auth.uid).child('status').val() === 'active'"),'canonical recipe writes must require active household membership');

// ============================================================
// PART 2 — dynamic lifecycle/isolation contract
// ============================================================
function makeStorage(seed){
  const map=new Map(Object.entries(seed||{}));
  return {
    getItem(key){return map.has(key)?map.get(key):null;},
    setItem(key,value){map.set(key,String(value));},
    removeItem(key){map.delete(key);},
    dump(){return Object.fromEntries(map.entries());}
  };
}
function snapshot(value){return {val(){return value;}};}
function copy(value){return value===undefined?undefined:JSON.parse(JSON.stringify(value));}
function makeDb(initial){
  const data=Object.assign({},initial||{});
  const refs={};
  const writes=[];
  function ref(path){
    if(refs[path])return refs[path];
    const handlers=[];
    const offCalls=[];
    const node={
      path,handlers,offCalls,
      on(event,handler,errorHandler){assert.strictEqual(event,'value');handlers.push(handler);node.errorHandler=errorHandler;},
      off(event,handler){offCalls.push({event,handler});const i=handlers.indexOf(handler);if(i>=0)handlers.splice(i,1);},
      once(event){assert.strictEqual(event,'value');return Promise.resolve(snapshot(data[path]===undefined?null:data[path]));},
      child(key){return ref(path+'/'+String(key));},
      set(value){writes.push({path,value:copy(value)});data[path]=copy(value);return Promise.resolve();},
      transaction(updater,done){
        const current=data[path]===undefined?null:copy(data[path]);
        let next;
        try{next=updater(current);}catch(error){done(error,false,snapshot(current));return;}
        if(next===undefined){done(null,false,snapshot(current));return;}
        data[path]=copy(next);writes.push({path,value:copy(next)});done(null,true,snapshot(copy(next)));
      },
      emit(value){data[path]=copy(value);handlers.slice().forEach(handler=>handler(snapshot(copy(value))));}
    };
    refs[path]=node;
    return node;
  }
  return {ref,refs,writes,data};
}

(async function(){
  let contextState={uid:'uidA',householdId:'A',ready:true,revision:1};
  let contextSubscriber=null;
  const database=makeDb();
  const storage=makeStorage({
    // Deliberately hostile unscoped legacy payload. It must never seed B.
    fam_recipes_v1:JSON.stringify([{id:'leak',name:'A-only local recipe'}])
  });
  const listeners={};
  const sandbox={
    console,
    setTimeout,clearTimeout,setInterval,clearInterval,
    Promise,Date,Math,JSON,Object,Array,String,Number,Boolean,RegExp,Error,
    localStorage:storage,
    CustomEvent:function(type,init){this.type=type;this.detail=init&&init.detail;}
  };
  sandbox.window=sandbox;
  sandbox.navigator={onLine:true};
  sandbox.fbDb=database;
  sandbox.window.addEventListener=function(type,fn){(listeners[type]||(listeners[type]=[])).push(fn);};
  sandbox.window.dispatchEvent=function(){};
  sandbox.HouseholdContext={
    snapshot(){return Object.freeze(Object.assign({},contextState));},
    capture(){return Object.freeze({uid:contextState.uid,householdId:contextState.householdId,revision:contextState.revision});},
    isCurrent(token){return !!token&&token.uid===contextState.uid&&token.householdId===contextState.householdId&&token.revision===contextState.revision;},
    subscribe(fn){contextSubscriber=fn;fn(Object.freeze(Object.assign({},contextState)),'subscribe');return function(){if(contextSubscriber===fn)contextSubscriber=null;};}
  };

  vm.runInNewContext(repoSource,sandbox,{filename:'recipeHouseholdRepository.js'});
  const repo=sandbox.RecipeHouseholdRepository;
  assert.ok(repo,'RecipeHouseholdRepository must install globally');
  assert.strictEqual(repo.status().canonicalPath,'families/A/recipes');
  const aRef=database.refs['families/A/recipes'];
  assert.ok(aRef&&aRef.handlers.length===1,'household A must have exactly one recipe listener');
  const staleAHandler=aRef.handlers[0];

  // A canonical recipe comes online and is normalized to schema v3.
  aRef.emit({id_a:{id:'a',name:'Recipe A',schemaVersion:3,createdByUid:'uidA',createdAt:1,updatedAt:2}});
  await tick();await tick();await tick();await tick();
  assert.deepStrictEqual(repo.list().map(r=>r.name),['Recipe A']);
  assert.ok(repo.list().every(r=>r.householdId==='A'&&r.schemaVersion===3),'A projection must be stamped to household A/schema v3');

  // Switch to B: exact A listener detached and A projection cleared immediately.
  contextState={uid:'uidB',householdId:'B',ready:true,revision:2};
  contextSubscriber(Object.freeze(Object.assign({},contextState)),'identity-change');
  assert.strictEqual(aRef.offCalls.length,1,'old household recipe listener must be detached once');
  assert.strictEqual(aRef.offCalls[0].handler,staleAHandler,'exact old recipe handler must be detached');
  assert.strictEqual(repo.list().length,0,'prior household recipes must clear immediately on switch');
  assert.strictEqual(repo.status().canonicalPath,'families/B/recipes');
  const bRef=database.refs['families/B/recipes'];
  assert.ok(bRef&&bRef.handlers.length===1,'household B must have exactly one recipe listener');

  // A raced callback cannot repopulate B.
  staleAHandler(snapshot({id_stale:{id:'stale',name:'STALE A',schemaVersion:3}}));
  assert.strictEqual(repo.list().length,0,'stale A callback must be ignored after switching to B');

  // Empty B must NOT be seeded from generic fam_recipes_v1.
  bRef.emit(null);
  await tick();await tick();await tick();await tick();
  assert.strictEqual(repo.list().length,0,'empty B must remain empty when same-household Firebase sources are empty');
  assert.ok(!database.writes.some(w=>w.path.startsWith('families/B/recipes')&&JSON.stringify(w.value).includes('A-only local recipe')),'generic local recipe cache must never migrate into B');

  // Create while bound to B writes only under B canonical recipes and seals audit identity.
  const created=await repo.create({name:'Created in B',cat:'Diner',ingredients:['tomaat']});
  assert.strictEqual(created.householdId,'B');
  assert.strictEqual(created.createdByUid,'uidB');
  assert.strictEqual(created.schemaVersion,3);
  assert.ok(database.writes.some(w=>w.path.startsWith('families/B/recipes/id_recipe_')&&w.value&&w.value.name==='Created in B'),'create must write under canonical B recipe path');
  assert.ok(!database.writes.some(w=>w.path.startsWith('families/A/recipes')&&w.value&&w.value.name==='Created in B'),'B create must never write to A');
  assert.ok(Object.keys(storage.dump()).some(k=>k==='familyapp_recipes_v3_uidB_B'),'recipe cache must be scoped by UID + household');

  // Same-household shared/recipes migration is allowed.
  contextState={uid:'uidC',householdId:'C',ready:true,revision:3};
  database.data['families/C/shared/recipes']={schemaVersion:2,initialized:true,items:{id_c:{id:'c',name:'Legacy shared C',createdAt:10,updatedAt:20}}};
  contextSubscriber(Object.freeze(Object.assign({},contextState)),'identity-change');
  const cRef=database.refs['families/C/recipes'];
  cRef.emit(null);
  await tick();await tick();await tick();await tick();await tick();
  assert.deepStrictEqual(repo.list().map(r=>r.name),['Legacy shared C'],'same-household shared/recipes should migrate into canonical recipes');
  assert.ok(repo.list().every(r=>r.householdId==='C'&&r.schemaVersion===3),'migrated shared recipes must be sealed to C/schema v3');
  assert.ok(database.writes.some(w=>w.path==='families/C/recipeMigrations/v3SharedToCanonical'&&w.value&&w.value.status==='complete'),'recipe migration must persist marker');

  // For pre-v3 duplicates, previously authoritative shared/recipes wins root legacy copy.
  contextState={uid:'uidD',householdId:'D',ready:true,revision:4};
  database.data['families/D/shared/recipes']={schemaVersion:2,initialized:true,items:{id_d:{id:'d',name:'Newer shared D',updatedAt:200,createdAt:10}}};
  contextSubscriber(Object.freeze(Object.assign({},contextState)),'identity-change');
  const dRef=database.refs['families/D/recipes'];
  dRef.emit({id_d:{id:'d',name:'Stale root D',schemaVersion:2,updatedAt:100,createdAt:10}});
  await tick();await tick();await tick();await tick();await tick();
  assert.deepStrictEqual(repo.list().map(r=>r.name),['Newer shared D'],'shared/recipes must win over a pre-v3 root duplicate during migration');

  // Canonical schema-v3 always wins over stale shared legacy data.
  contextState={uid:'uidE',householdId:'E',ready:true,revision:5};
  database.data['families/E/shared/recipes']={schemaVersion:2,initialized:true,items:{id_e:{id:'e',name:'Old shared E',updatedAt:100,createdAt:10}}};
  contextSubscriber(Object.freeze(Object.assign({},contextState)),'identity-change');
  const eRef=database.refs['families/E/recipes'];
  eRef.emit({id_e:{id:'e',name:'Canonical E',schemaVersion:3,updatedAt:300,createdAt:10,createdByUid:'uidE'}});
  await tick();await tick();await tick();await tick();await tick();
  assert.deepStrictEqual(repo.list().map(r=>r.name),['Canonical E'],'schema-v3 canonical recipe must win over stale shared data');

  console.log('recipe household repository contract: PASS');
})().catch(error=>{console.error(error);process.exitCode=1;});
