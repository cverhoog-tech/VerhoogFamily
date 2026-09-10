'use strict';
const fs=require('fs');
const assert=require('assert');
const vm=require('vm');

function read(path){return fs.readFileSync(path,'utf8');}
function snapshot(value){return {val(){return value;}};}

const repoSource=read('src/modules/tasks/partyQuestRepository.js');
const loaderSource=read('api/app.js');

// Static architecture contract.
assert.ok(repoSource.includes("families/'+ctx.householdId+'/partyQuests"),'Party Quest source of truth must be household-scoped');
assert.ok(repoSource.includes('HouseholdContext.capture'),'repository must capture HouseholdContext before binding/mutation');
assert.ok(repoSource.includes('HouseholdContext.isCurrent'),'repository must reject stale HouseholdContext tokens');
assert.ok(repoSource.includes("active.ref.off('value',active.handler)"),'repository must detach the exact previous Firebase listener');
assert.ok(!repoSource.includes('fbFamilyId'),'repository must not use the legacy household global as identity authority');
assert.ok(!repoSource.includes('fbUser'),'repository must not use the legacy user global as identity authority');
assert.ok(!repoSource.includes('firebase.auth'),'repository must not create a parallel auth authority');
assert.ok(!repoSource.includes('localStorage'),'repository must not use legacy/local Party Quest persistence');
const contextIndex=loaderSource.indexOf('householdContext.js?v=1');
const repoIndex=loaderSource.indexOf('partyQuestRepository.js?v=2');
const serviceIndex=loaderSource.indexOf('partyQuestService.js?v=4');
const projectorIndex=loaderSource.indexOf('partyQuestNotificationProjector.js?v=3');
assert.ok(contextIndex>=0&&repoIndex>contextIndex,'runtime must load PartyQuestRepository after HouseholdContext');
assert.ok(serviceIndex>repoIndex,'runtime must load PartyQuestService after PartyQuestRepository');
assert.ok(projectorIndex>serviceIndex,'runtime must load the STEP 11.6 Party Quest notification projector after PartyQuestService');
assert.ok(loaderSource.includes('partyQuestHelpUi.js?v=1'),'runtime must load STEP 11.4 help presentation');

function makeDb(initial){
  const data=Object.assign({},initial||{});
  const refs={};
  const writes=[];
  const deferred=[];
  let deferNext=false;

  function ref(path){
    if(refs[path])return refs[path];
    const handlers=[];
    const offCalls=[];
    const node={
      path,handlers,offCalls,
      on(event,handler,errorHandler){assert.strictEqual(event,'value');handlers.push(handler);node.errorHandler=errorHandler;},
      off(event,handler){offCalls.push({event,handler});const i=handlers.indexOf(handler);if(i>=0)handlers.splice(i,1);},
      child(key){return ref(path+'/'+String(key));},
      push(){return {key:'push_'+Math.random().toString(36).slice(2)};},
      transaction(updater,done){
        const run=()=>{
          const current=data[path]===undefined?null:data[path];
          let next;
          try{next=updater(current);}catch(error){done(error,false,snapshot(current));return;}
          if(next===undefined){done(null,false,snapshot(current));return;}
          data[path]=next;
          writes.push({path,value:JSON.parse(JSON.stringify(next))});
          done(null,true,snapshot(next));
        };
        if(deferNext){deferNext=false;deferred.push(run);return;}
        run();
      },
      emit(value){data[path]=value;handlers.slice().forEach(handler=>handler(snapshot(value)));}
    };
    refs[path]=node;
    return node;
  }
  return {
    ref,refs,writes,data,
    deferNextTransaction(){deferNext=true;},
    flushDeferred(){while(deferred.length)deferred.shift()();}
  };
}

(async function(){
  let contextState={uid:'uidA',householdId:'H1',ready:true,revision:1};
  let contextSubscriber=null;
  const database=makeDb();
  const eventListeners={};
  const sandbox={
    console,
    setTimeout,clearTimeout,setInterval,clearInterval,
    Promise,Date,Math,JSON,Object,Array,String,Number,Boolean,RegExp,Error,
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

  vm.runInNewContext(repoSource,sandbox,{filename:'partyQuestRepository.js'});
  const repo=sandbox.PartyQuestRepository;
  assert.ok(repo,'PartyQuestRepository must install globally');
  assert.strictEqual(repo.status().canonicalPath,'families/H1/partyQuests');
  const h1Ref=database.refs['families/H1/partyQuests'];
  assert.ok(h1Ref&&h1Ref.handlers.length===1,'H1 must have exactly one Party Quest listener');
  const staleH1Handler=h1Ref.handlers[0];

  h1Ref.emit({
    pq1:{id:'pq1',questId:'task1',questTitle:'Legacy party',status:'pending',inviterUid:'uidA',invitees:{uidB:{name:'B',status:'pending'}},createdAt:1,updatedAt:1,rewardsClaimed:{uidA:{xp:10}}}
  });
  const aRows=repo.list();
  assert.strictEqual(aRows.length,1);
  assert.strictEqual(aRows[0].schemaVersion,2,'v1 rows must be normalized to the v2 in-memory contract');
  assert.strictEqual(aRows[0].householdId,'H1');
  assert.strictEqual(aRows[0].invitees.uidB.uid,'uidB');
  assert.deepStrictEqual(Object.keys(aRows[0].helpRequests),[]);
  assert.deepStrictEqual(Object.keys(aRows[0].rewardSettlements),[]);
  assert.ok(aRows[0].rewardsClaimed&&aRows[0].rewardsClaimed.uidA,'unknown/legacy fields must be preserved in the read model');
  assert.strictEqual(database.writes.length,0,'read normalization must not eagerly migrate or rewrite Firebase data');

  contextState={uid:'uidB',householdId:'H1',ready:true,revision:2};
  contextSubscriber(Object.freeze(Object.assign({},contextState)),'identity-change');
  assert.strictEqual(h1Ref.offCalls.length,1,'UID switch must detach the old exact listener');
  assert.strictEqual(h1Ref.offCalls[0].handler,staleH1Handler);
  assert.strictEqual(repo.list().length,0,'UID switch must clear the prior projection immediately');
  assert.ok(h1Ref.handlers.length===1,'same-household UID switch must bind one fresh listener');
  const uidBHandler=h1Ref.handlers[0];
  staleH1Handler(snapshot({leak:{id:'leak',questTitle:'STALE A'}}));
  assert.strictEqual(repo.list().length,0,'stale account-A callback must be ignored after switching to B');

  h1Ref.emit({pq2:{id:'pq2',questId:'task2',questTitle:'B sees H1',status:'active',inviterUid:'uidB',invitees:{},createdAt:2}});
  assert.deepStrictEqual(repo.list().map(q=>q.questTitle),['B sees H1']);

  contextState={uid:'uidB',householdId:'H2',ready:true,revision:3};
  contextSubscriber(Object.freeze(Object.assign({},contextState)),'identity-change');
  assert.strictEqual(repo.status().canonicalPath,'families/H2/partyQuests');
  assert.ok(h1Ref.offCalls.some(call=>call.handler===uidBHandler),'H1 listener for UID B must be detached on H1 -> H2 switch');
  assert.strictEqual(repo.list().length,0,'household switch must clear H1 projection immediately');
  const h2Ref=database.refs['families/H2/partyQuests'];
  assert.ok(h2Ref&&h2Ref.handlers.length===1,'H2 must have exactly one Party Quest listener');
  uidBHandler(snapshot({leak2:{id:'leak2',questTitle:'STALE H1'}}));
  assert.strictEqual(repo.list().length,0,'stale H1 callback must be ignored after H2 bind');

  h2Ref.emit({pqB:{id:'quest-B',questId:'taskB',questTitle:'H2 quest',status:'active',inviterUid:'uidB',invitees:{},createdAt:3}});
  assert.deepStrictEqual(repo.list().map(q=>q.questTitle),['H2 quest']);

  database.data['families/H2/partyQuests/pqB']={id:'quest-B',questId:'taskB',questTitle:'H2 quest',status:'active',inviterUid:'uidB',invitees:{},createdAt:3};
  database.deferNextTransaction();
  const staleMutation=repo.updateOne('quest-B',{status:'completed'}).then(
    ()=>({ok:true}),
    error=>({ok:false,error})
  );
  contextState={uid:'uidC',householdId:'H3',ready:true,revision:4};
  contextSubscriber(Object.freeze(Object.assign({},contextState)),'identity-change');
  database.flushDeferred();
  const staleResult=await staleMutation;
  assert.strictEqual(staleResult.ok,false,'stale mutation must reject');
  assert.strictEqual(staleResult.error.message,'STALE_PARTY_QUEST_CONTEXT');
  assert.strictEqual(database.writes.filter(w=>w.path==='families/H2/partyQuests/pqB').length,0,'stale H2 mutation must not commit after H3 switch');

  const h3Ref=database.refs['families/H3/partyQuests'];
  h3Ref.emit({pqC:{id:'quest-C',questId:'taskC',questTitle:'H3 quest',status:'active',inviterUid:'uidC',invitees:{},createdAt:4}});
  database.data['families/H3/partyQuests/pqC']={id:'quest-C',questId:'taskC',questTitle:'H3 quest',status:'active',inviterUid:'uidC',invitees:{},createdAt:4};
  const saved=await repo.updateOne('quest-C',{status:'pending'});
  assert.strictEqual(saved.householdId,'H3');
  assert.strictEqual(saved.inviterUid,'uidC','repository mutation must preserve canonical inviter identity');
  assert.strictEqual(saved.schemaVersion,2);
  assert.ok(database.writes.some(w=>w.path==='families/H3/partyQuests/pqC'&&w.value&&w.value.status==='pending'),'current-context mutation must write inside H3');
  assert.ok(!database.writes.some(w=>w.path.startsWith('families/H1/partyQuests')||w.path.startsWith('families/H2/partyQuests')),'current H3 mutation must not write into prior household paths');

  repo.stop();
  assert.strictEqual(repo.list().length,0,'stop must clear the Party Quest projection');
  console.log('party quest household repository contract: PASS');
})().catch(error=>{console.error(error);process.exitCode=1;});