'use strict';
const fs=require('fs');
const assert=require('assert');
const vm=require('vm');

function read(path){return fs.readFileSync(path,'utf8');}
function tick(){return new Promise(resolve=>setTimeout(resolve,0));}
function snapshot(value){return{val(){return value;}};}
function makeStorage(){const map=new Map();return{getItem(k){return map.has(k)?map.get(k):null;},setItem(k,v){map.set(k,String(v));},removeItem(k){map.delete(k);},keys(){return Array.from(map.keys());}};}
function makeDb(seed){
  const data=Object.assign({},seed||{}),refs={},writes=[];
  function ref(path){
    if(refs[path])return refs[path];
    const handlers=[],offCalls=[];
    const node={path,handlers,offCalls,
      child(key){return ref(path+'/'+String(key));},
      on(event,handler,error){assert.strictEqual(event,'value');handlers.push(handler);node.errorHandler=error;},
      off(event,handler){offCalls.push({event,handler});const i=handlers.indexOf(handler);if(i>=0)handlers.splice(i,1);},
      once(event){assert.strictEqual(event,'value');return Promise.resolve(snapshot(Object.prototype.hasOwnProperty.call(data,path)?data[path]:null));},
      set(value){writes.push({op:'set',path,value:JSON.parse(JSON.stringify(value))});data[path]=value;return Promise.resolve();},
      update(patch){writes.push({op:'update',path,value:JSON.parse(JSON.stringify(patch))});Object.keys(patch).forEach(key=>{data[path+'/'+key]=patch[key];});return Promise.resolve();},
      transaction(updater,done){let current=Object.prototype.hasOwnProperty.call(data,path)?data[path]:null,next;try{next=updater(current);}catch(error){done(error,false,snapshot(current));return;}if(next===undefined){done(null,false,snapshot(current));return;}data[path]=next;writes.push({op:'transaction',path,value:JSON.parse(JSON.stringify(next))});done(null,true,snapshot(next));},
      emit(value){data[path]=value;handlers.slice().forEach(handler=>handler(snapshot(value)));}
    };
    refs[path]=node;return node;
  }
  return{ref,refs,writes,data};
}

const combinedSource=read('src/modules/shop/shoppingListStore.js');
const repoSource=combinedSource;
const storeSource=combinedSource;
const guardSource=read('src/modules/tasks/taskLegacySyncGuard.js');

assert.ok(repoSource.includes("families/'+ctx.householdId+'/shoppingLists"),'shared canonical path must be household root shoppingLists');
assert.ok(repoSource.includes("users/'+ctx.uid+'/private/households/'+ctx.householdId+'/shoppingLists"),'private lists must be UID + household scoped');
assert.ok(repoSource.includes('HouseholdContext.capture'),'mutations must capture HouseholdContext');
assert.ok(repoSource.includes('HouseholdContext.isCurrent'),'mutations/listeners must reject stale HouseholdContext');
assert.ok(repoSource.includes("active.sharedRef.off('value',active.sharedHandler)"),'shared listener must detach exact handler');
assert.ok(repoSource.includes("active.privateRef.off('value',active.privateHandler)"),'private listener must detach exact handler');
assert.ok(repoSource.includes('/shared/shoppingLists'),'migration may read same-household legacy shared shopping lists');
assert.ok(repoSource.includes('/shop'),'migration may read same-household legacy root shop');
assert.ok(!repoSource.includes('familieapp_state_v024'),'repository must not use generic AppState shopping data as migration authority');
assert.ok(!repoSource.includes('window.shopData'),'repository must not use global shopData as migration authority');
assert.ok(!repoSource.includes('LEGACY_STATE_KEY'),'repository must not retain the old local migration key');
assert.ok(!storeSource.includes('FamilyDataStore'),'ShoppingListStore must not retain FamilyDataStore persistence ownership');
assert.ok(!storeSource.includes('familieapp_state_v024'),'ShoppingListStore must not migrate generic AppState shopping data');
assert.ok(!guardSource.includes('data.shop'),'legacy family-root sync must not project legacy shop data');
assert.ok(!/shop\s*:/.test(guardSource),'legacy family-root sync must not write a shop payload');

(async function(){
  let contextState={uid:'uidA',householdId:'A',ready:true,revision:1},contextSubscriber=null;
  const storage=makeStorage();
  const database=makeDb({
    'families/A/shoppingMigrations/v2SharedToCanonical':{status:'complete'},
    'families/B/shoppingMigrations/v2SharedToCanonical':{status:'complete'}
  });
  const sandbox={console,setTimeout,clearTimeout,setInterval,clearInterval,Promise,Date,Math,JSON,Object,Array,String,Number,Boolean,RegExp,Error,localStorage:storage,navigator:{onLine:true},CustomEvent:function(type,init){this.type=type;this.detail=init&&init.detail;}};
  sandbox.window=sandbox;sandbox.fbDb=database;sandbox.window.dispatchEvent=function(){};sandbox.window.addEventListener=function(){};
  sandbox.HouseholdContext={
    snapshot(){return Object.freeze(Object.assign({},contextState));},
    capture(){return Object.freeze({uid:contextState.uid,householdId:contextState.householdId,revision:contextState.revision});},
    isCurrent(token){return !!token&&token.uid===contextState.uid&&token.householdId===contextState.householdId&&token.revision===contextState.revision;},
    subscribe(fn){contextSubscriber=fn;fn(Object.freeze(Object.assign({},contextState)),'subscribe');return function(){if(contextSubscriber===fn)contextSubscriber=null;};}
  };

  vm.runInNewContext(repoSource,sandbox,{filename:'shoppingListHouseholdRepository.js'});
  const repo=sandbox.ShoppingListHouseholdRepository;
  assert.ok(repo,'repository must install globally');
  const aShared=database.refs['families/A/shoppingLists'];
  const aPrivate=database.refs['users/uidA/private/households/A/shoppingLists'];
  assert.ok(aShared&&aShared.handlers.length===1,'A shared listener must bind once');
  assert.ok(aPrivate&&aPrivate.handlers.length===1,'A private listener must bind once');
  const staleAShared=aShared.handlers[0],staleAPrivate=aPrivate.handlers[0];
  aShared.emit({weekly:{id:'weekly',name:'Week',items:{milk:{name:'Melk',done:false}}}});
  aPrivate.emit({mine:{id:'mine',name:'Mijn lijst',items:{}}});
  await tick();await tick();
  assert.strictEqual(repo.snapshot().shared.weekly.name,'Week');
  assert.strictEqual(repo.snapshot().private.mine.householdId,'A');

  contextState={uid:'uidB',householdId:'B',ready:true,revision:2};
  contextSubscriber(Object.freeze(Object.assign({},contextState)),'identity-change');
  assert.strictEqual(aShared.offCalls.length,1,'A shared listener must detach exactly once');
  assert.strictEqual(aShared.offCalls[0].handler,staleAShared,'exact A shared handler must detach');
  assert.strictEqual(aPrivate.offCalls.length,1,'A private listener must detach exactly once');
  assert.strictEqual(aPrivate.offCalls[0].handler,staleAPrivate,'exact A private handler must detach');
  staleAShared(snapshot({leak:{id:'leak',name:'A leak'}}));
  staleAPrivate(snapshot({leak:{id:'leak',name:'A private leak'}}));
  assert.strictEqual(Object.keys(repo.snapshot().shared).length,0,'stale A shared callback must be ignored');
  assert.strictEqual(Object.keys(repo.snapshot().private).length,0,'stale A private callback must be ignored');

  const bShared=database.refs['families/B/shoppingLists'];
  const bPrivate=database.refs['users/uidB/private/households/B/shoppingLists'];
  bShared.emit({base:{id:'base',name:'B basis',items:{}}});bPrivate.emit(null);await tick();await tick();
  const created=await repo.createList({name:'B gedeeld'});
  assert.strictEqual(created.householdId,'B');
  assert.ok(database.writes.some(w=>w.op==='set'&&w.path==='families/B/shoppingLists/'+created.id),'shared create must write only beneath household B canonical path');
  assert.ok(!database.writes.some(w=>w.path.startsWith('families/A/shoppingLists/')&&w.value&&w.value.name==='B gedeeld'),'B create must never write to A');
  const privateCreated=await repo.createList({name:'Privé B',visibility:'private'});
  assert.ok(database.writes.some(w=>w.op==='set'&&w.path==='users/uidB/private/households/B/shoppingLists/'+privateCreated.id),'private create must be UID + household scoped');
  const added=await repo.addItems('shared',created.id,[{name:'Brood',qty:'1 st'}]);
  assert.strictEqual(added.length,1);
  assert.ok(database.writes.some(w=>w.op==='update'&&w.path==='families/B/shoppingLists/'+created.id&&Object.keys(w.value).some(k=>k.indexOf('items/')===0)),'item add must stay under B list');
  assert.ok(storage.keys().includes('familyapp_shopping_lists_v2_uidB_B'),'cache must be scoped by UID + household');

  contextState={uid:'uidC',householdId:'C',ready:true,revision:3};
  database.data['families/C/shared/shoppingLists']={legacy:{id:'legacy',name:'Legacy C',items:{apple:{name:'Appels'}}}};
  contextSubscriber(Object.freeze(Object.assign({},contextState)),'identity-change');
  const cShared=database.refs['families/C/shoppingLists'];
  cShared.emit(null);
  await tick();await tick();await tick();await tick();
  const migration=database.writes.find(w=>w.op==='transaction'&&w.path==='families/C/shoppingLists');
  assert.ok(migration,'same-household shared/shoppingLists must reconcile into canonical C path');
  assert.strictEqual(migration.value.legacy.householdId,'C');
  assert.ok(database.writes.some(w=>w.op==='set'&&w.path==='families/C/shoppingMigrations/v2SharedToCanonical'&&w.value.status==='complete'),'migration marker must persist');

  console.log('shopping household repository contract: PASS');
})().catch(error=>{console.error(error);process.exitCode=1;});
