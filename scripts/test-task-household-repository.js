'use strict';
const fs=require('fs');
const assert=require('assert');
const vm=require('vm');

function read(path){return fs.readFileSync(path,'utf8');}
function tick(){return new Promise(resolve=>setTimeout(resolve,0));}

const repoSource=read('src/modules/tasks/taskHouseholdRepository.js');
const facadeSource=read('src/modules/tasks/taskSharedData.js');
const guardSource=read('src/modules/tasks/taskLegacySyncGuard.js');
const loaderSource=read('api/app.js');
const rules=JSON.parse(read('database.rules.json'));

// Static architecture contract.
assert.ok(repoSource.includes("families/'+ctx.householdId+'/tasks"),'canonical task path must be families/{householdId}/tasks');
assert.ok(repoSource.includes('HouseholdContext.capture'),'task repository must capture household context before binding/mutations');
assert.ok(repoSource.includes('HouseholdContext.isCurrent'),'task repository must reject stale household context');
assert.ok(repoSource.includes("active.ref.off('value',active.handler)"),'task repository must detach the exact previous Firebase listener');
assert.ok(repoSource.includes("families/'+binding.context.householdId+'/shared/tasks"),'migration may only read the same household legacy shared/tasks path');
assert.ok(!/fam_tasks_v0|familieapp_state_v024/.test(repoSource),'canonical repository must never seed from generic legacy local task storage');
assert.ok(!repoSource.includes('FamilyDataStore'),'canonical task repository must own its Firebase listener directly');
assert.ok(facadeSource.includes('TaskHouseholdRepository'),'TaskSharedData must be a compatibility facade over the canonical repository');
assert.ok(!facadeSource.includes('subscribeShared'),'TaskSharedData must not create its own shared Firebase listener');
assert.ok(!facadeSource.includes('FamilyDataStore'),'TaskSharedData must not retain the old persistence owner');
assert.ok(!guardSource.includes('data.tasks'),'legacy family-root sync must not project tasks');
assert.ok(!/tasks\s*:/.test(guardSource),'legacy family-root sync must not write a tasks payload');
const repoIndex=loaderSource.indexOf('taskHouseholdRepository.js?v=1');
const facadeIndex=loaderSource.indexOf('taskSharedData.js?v=3');
const guardIndex=loaderSource.indexOf('taskLegacySyncGuard.js?v=1');
const sessionIndex=loaderSource.indexOf('authenticatedSessionController.js?v=1');
assert.ok(repoIndex>=0&&facadeIndex>repoIndex,'runtime must load task repository before TaskSharedData');
assert.ok(guardIndex>=0&&sessionIndex>guardIndex,'legacy task sync guard must load before session bootstrap');
assert.ok(rules.rules.families.$familyId.$sharedData,'family rules must protect canonical task child through active-member family wildcard');
assert.ok(String(rules.rules.families.$familyId.$sharedData['.write']).includes("members').child(auth.uid).child('status').val() === 'active'"),'canonical task writes must require active household membership');

// Dynamic lifecycle/isolation contract.
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
      set(value){writes.push({path,value:JSON.parse(JSON.stringify(value))});data[path]=value;return Promise.resolve();},
      transaction(updater,done){
        let current=data[path]===undefined?null:data[path];
        let next;
        try{next=updater(current);}catch(error){done(error,false,snapshot(current));return;}
        if(next===undefined){done(null,false,snapshot(current));return;}
        data[path]=next;writes.push({path,value:JSON.parse(JSON.stringify(next))});done(null,true,snapshot(next));
      },
      emit(value){data[path]=value;handlers.slice().forEach(handler=>handler(snapshot(value)));}
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
    // Deliberately hostile generic legacy tasks. They must never seed household B.
    fam_tasks_v023:JSON.stringify([{id:'leak',title:'A-only local task'}]),
    familieapp_state_v024:JSON.stringify({tasks:[{id:'leak2',title:'another local leak'}]})
  });
  const eventListeners={};
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
  sandbox.window.addEventListener=function(type,fn){(eventListeners[type]||(eventListeners[type]=[])).push(fn);};
  sandbox.window.dispatchEvent=function(){};
  sandbox.HouseholdContext={
    snapshot(){return Object.freeze(Object.assign({},contextState));},
    capture(){return Object.freeze({uid:contextState.uid,householdId:contextState.householdId,revision:contextState.revision});},
    isCurrent(token){return !!token&&token.uid===contextState.uid&&token.householdId===contextState.householdId&&token.revision===contextState.revision;},
    subscribe(fn){contextSubscriber=fn;fn(Object.freeze(Object.assign({},contextState)),'subscribe');return function(){if(contextSubscriber===fn)contextSubscriber=null;};}
  };

  vm.runInNewContext(repoSource,sandbox,{filename:'taskHouseholdRepository.js'});
  const repo=sandbox.TaskHouseholdRepository;
  assert.ok(repo,'repository must install globally');
  assert.strictEqual(repo.status().canonicalPath,'families/A/tasks');
  const aRef=database.refs['families/A/tasks'];
  assert.ok(aRef&&aRef.handlers.length===1,'household A must have exactly one task listener');
  const staleAHandler=aRef.handlers[0];

  aRef.emit({a1:{id:1,title:'Task A',createdByUid:'uidA',createdAt:1}});
  assert.deepStrictEqual(repo.list().map(t=>t.title),['Task A']);

  // Switch account + household: old listener must be detached and projection cleared.
  contextState={uid:'uidB',householdId:'B',ready:true,revision:2};
  contextSubscriber(Object.freeze(Object.assign({},contextState)),'identity-change');
  assert.strictEqual(aRef.offCalls.length,1,'old household listener must be detached once');
  assert.strictEqual(aRef.offCalls[0].handler,staleAHandler,'exact old handler must be detached');
  assert.strictEqual(repo.list().length,0,'prior household projection must be cleared immediately');
  assert.strictEqual(repo.status().canonicalPath,'families/B/tasks');
  const bRef=database.refs['families/B/tasks'];
  assert.ok(bRef&&bRef.handlers.length===1,'household B must have exactly one task listener');

  // Even if a stale callback races after unbind, it must not repopulate A data.
  staleAHandler(snapshot({a2:{id:2,title:'STALE A'}}));
  assert.strictEqual(repo.list().length,0,'stale A callback must be ignored after switch');

  // Empty canonical B checks only B/shared/tasks. Generic localStorage must never seed B.
  bRef.emit(null);
  await tick();
  await tick();
  assert.strictEqual(repo.list().length,0,'empty B must remain empty when same-household legacy path is empty');
  assert.ok(!database.writes.some(w=>w.path.startsWith('families/B/tasks')&&JSON.stringify(w.value).includes('A-only local task')),'generic local task must never migrate into B');
  assert.ok(!database.writes.some(w=>w.path.startsWith('families/B/tasks')&&JSON.stringify(w.value).includes('another local leak')),'generic AppState task must never migrate into B');

  bRef.emit({b1:{id:11,title:'Task B',createdByUid:'uidB',createdAt:2}});
  assert.deepStrictEqual(repo.list().map(t=>t.title),['Task B']);
  assert.ok(repo.list().every(t=>t.householdId==='B'),'projection must be stamped to current household');

  const created=await repo.create({title:'Created in B',who:['B user']});
  assert.strictEqual(created.householdId,'B');
  assert.strictEqual(created.createdByUid,'uidB');
  const createWrite=database.writes.find(w=>w.path.startsWith('families/B/tasks/task_')&&w.value&&w.value.title==='Created in B');
  assert.ok(createWrite,'create must write only beneath canonical B task path');
  assert.ok(!database.writes.some(w=>w.path.startsWith('families/A/tasks')&&w.value&&w.value.title==='Created in B'),'B create must never write to A');

  // Same-household legacy migration is allowed, but only into that same household.
  contextState={uid:'uidC',householdId:'C',ready:true,revision:3};
  database.data['families/C/shared/tasks']={legacyC:{id:31,title:'Legacy C'}};
  contextSubscriber(Object.freeze(Object.assign({},contextState)),'identity-change');
  const cRef=database.refs['families/C/tasks'];
  cRef.emit(null);
  await tick();
  await tick();
  const migrationWrite=database.writes.find(w=>w.path==='families/C/tasks'&&w.value&&Object.values(w.value).some(t=>t.title==='Legacy C'));
  assert.ok(migrationWrite,'same-household shared/tasks may migrate into canonical C tasks');
  assert.ok(Object.values(migrationWrite.value).every(t=>t.householdId==='C'),'migrated rows must be stamped with household C');

  console.log('task household repository contract: PASS');
})().catch(error=>{console.error(error);process.exitCode=1;});
