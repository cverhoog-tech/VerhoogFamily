'use strict';
const fs=require('fs');
const assert=require('assert');
const vm=require('vm');

const serviceSource=fs.readFileSync('src/modules/tasks/partyQuestService.js','utf8');
const activeSource=fs.readFileSync('src/modules/tasks/partyQuestActiveView.js','utf8');

assert.ok(serviceSource.includes('leaveQuest:leaveQuest'),'service must expose leaveQuest');
assert.ok(serviceSource.includes("status:'left'"),'leave must use distinct left status');
assert.ok(serviceSource.includes('PARTY_QUEST_INVITER_CANNOT_LEAVE'),'inviter leave must be rejected');
assert.ok(serviceSource.includes('PartyQuestRepository'),'service persistence must stay on repository');
assert.ok(!serviceSource.includes('firebase.database'),'service must not write Firebase directly');

assert.ok(activeSource.includes('PartyQuestRepository'),'ActiveView must subscribe through PartyQuestRepository');
assert.ok(activeSource.includes('PartyQuestService'),'ActiveView mutations must use PartyQuestService');
assert.ok(activeSource.includes('HouseholdContext.snapshot'),'ActiveView identity must use HouseholdContext');
assert.ok(activeSource.includes('subscriptionGeneration'),'ActiveView must guard stale repository callbacks');
assert.ok(activeSource.includes('repoUnsubscribe'),'ActiveView must own an exact repository unsubscribe');
assert.ok(!activeSource.includes('firebase.database'),'ActiveView must not own Firebase database access');
assert.ok(!activeSource.includes('firebase.auth'),'ActiveView must not use parallel auth');
assert.ok(!activeSource.includes('fbFamilyId'),'ActiveView must not use legacy household identity');
assert.ok(!activeSource.includes('fbUser'),'ActiveView must not use legacy user identity');
assert.ok(!activeSource.includes('localStorage'),'ActiveView must not use name-keyed local persistence');
assert.ok(!activeSource.includes("status']='declined'"),'leaving must not be represented as declined');
assert.ok(!activeSource.includes("status:'completed'"),'manual ActiveView end must not mark Party Quest completed');

function clone(v){return v===undefined?undefined:JSON.parse(JSON.stringify(v));}
function makeRepo(){
  let rows={};let deferNext=false;const deferred=[];let writes=0;
  return {
    version:'test-repo',
    allocateId(){return 'unused';},
    seed(next){rows=clone(next||{});},
    dump(){return clone(rows);},
    defer(){deferNext=true;},
    flush(){while(deferred.length)deferred.shift()();},
    writeCount(){return writes;},
    mutateCollection(){return Promise.reject(new Error('not used'));},
    mutateOne(id,mutator){
      return new Promise((resolve,reject)=>{
        const run=()=>{
          if(!rows[id]){reject(new Error('NOT_FOUND'));return;}
          let next;
          try{next=mutator(clone(rows[id]));}catch(e){reject(e);return;}
          if(next===undefined){reject(new Error('ABORTED'));return;}
          rows[id]=clone(next);writes++;resolve(clone(next));
        };
        if(deferNext){deferNext=false;deferred.push(run);}else run();
      });
    }
  };
}

async function testServiceLeave(){
  let state={uid:'B',householdId:'H1',ready:true,revision:1};
  const repository=makeRepo();
  repository.seed({pq1:{id:'pq1',questId:'t1',questTitle:'Keuken',status:'active',inviterUid:'A',invitees:{B:{uid:'B',name:'Bob',status:'active'},C:{uid:'C',name:'Cara',status:'pending'}}}});
  const sandbox={console,Promise,Date,Math,JSON,Object,Array,String,Number,Boolean,RegExp,Error,taskData:[]};
  sandbox.window=sandbox;
  sandbox.HouseholdContext={
    snapshot(){return Object.freeze(clone(state));},
    capture(){return Object.freeze({uid:state.uid,householdId:state.householdId,revision:state.revision});},
    isCurrent(token){return !!token&&token.uid===state.uid&&token.householdId===state.householdId&&token.revision===state.revision;}
  };
  sandbox.PartyQuestRepository=repository;
  sandbox.TaskSharedData={members(){return[{uid:'A',displayName:'Alice'},{uid:'B',displayName:'Bob'},{uid:'C',displayName:'Cara'}];}};
  vm.runInNewContext(serviceSource,sandbox,{filename:'partyQuestService.js'});
  const service=sandbox.PartyQuestService;

  const left=await service.leaveQuest('pq1');
  assert.strictEqual(left.invitees.B.status,'left');
  assert.ok(left.invitees.B.leftAt,'leave must record leftAt');
  assert.strictEqual(left.status,'pending','remaining pending invite keeps quest pending');
  assert.strictEqual(left.lastEvent.type,'partyQuest.participant.left');
  await assert.rejects(()=>service.leaveQuest('pq1'),e=>e.code==='PARTY_QUEST_PARTICIPANT_NOT_ACTIVE');

  repository.seed({pq2:{id:'pq2',questId:'t1',questTitle:'Zolder',status:'active',inviterUid:'A',invitees:{B:{uid:'B',name:'Bob',status:'active'}}}});
  const lastLeft=await service.leaveQuest('pq2');
  assert.strictEqual(lastLeft.invitees.B.status,'left');
  assert.strictEqual(lastLeft.status,'cancelled','no active/pending invitees must cancel quest');
  assert.strictEqual(lastLeft.endReason,'no-active-or-pending-invitees');

  repository.seed({pq3:{id:'pq3',questId:'t1',status:'active',inviterUid:'A',invitees:{B:{uid:'B',status:'active'}}}});
  state={uid:'A',householdId:'H1',ready:true,revision:2};
  await assert.rejects(()=>service.leaveQuest('pq3'),e=>e.code==='PARTY_QUEST_INVITER_CANNOT_LEAVE');

  repository.seed({pq4:{id:'pq4',questId:'t1',status:'active',inviterUid:'A',invitees:{B:{uid:'B',status:'active'}}}});
  state={uid:'B',householdId:'H1',ready:true,revision:3};
  repository.defer();
  const writesBefore=repository.writeCount();
  const stalePromise=service.leaveQuest('pq4').then(()=>({ok:true}),error=>({ok:false,error}));
  state={uid:'X',householdId:'H2',ready:true,revision:4};
  repository.flush();
  const stale=await stalePromise;
  assert.strictEqual(stale.ok,false);
  assert.strictEqual(stale.error.code,'STALE_PARTY_QUEST_CONTEXT');
  assert.strictEqual(repository.writeCount(),writesBefore,'stale leave must not commit');
}

async function testActiveViewLifecycle(){
  let state={uid:'B',householdId:'H1',ready:true,revision:1};
  let subscriber=null,unsubscribed=false,cancelledId=null,leftId=null;
  const repository={
    version:'test-repo',
    subscribe(fn){subscriber=fn;return function(){unsubscribed=true;};},
    start(){return true;}
  };
  const service={
    leaveQuest(id){leftId=id;return Promise.resolve({id,status:'cancelled'});},
    cancelQuest(id){cancelledId=id;return Promise.resolve({id,status:'cancelled'});}
  };
  const body={appendChild(){},contains(){return false;}};
  const document={
    body,
    head:{appendChild(){}},
    addEventListener(){},
    getElementById(){return null;},
    querySelector(){return null;},
    createElement(){return {style:{},setAttribute(){},remove(){},querySelector(){return null;},querySelectorAll(){return[];},className:'',innerHTML:'',onclick:null};}
  };
  function FakeMutationObserver(){this.observe=function(){};this.disconnect=function(){};}
  const sandbox={console,Promise,Date,Math,JSON,Object,Array,String,Number,Boolean,RegExp,Error,document,MutationObserver:FakeMutationObserver,CustomEvent:function(type,opts){this.type=type;this.detail=opts&&opts.detail;},setInterval(){return 1;},clearInterval(){},setTimeout(fn){return 1;},clearTimeout(){}};
  sandbox.window=sandbox;
  sandbox.dispatchEvent=function(){};
  sandbox.addEventListener=function(){};
  sandbox.HouseholdContext={snapshot(){return clone(state);}};
  sandbox.PartyQuestRepository=repository;
  sandbox.PartyQuestService=service;
  sandbox.TaskSharedData={members(){return[{uid:'A',displayName:'Alice'},{uid:'B',displayName:'Bob'}];}};
  vm.runInNewContext(activeSource,sandbox,{filename:'partyQuestActiveView.js'});
  const view=sandbox.PartyQuestActiveView;
  assert.ok(view.start());
  assert.ok(subscriber,'ActiveView must attach one repository subscriber');

  const quest={id:'pq1',questId:'t1',questTitle:'Keuken',status:'active',inviterUid:'A',inviterName:'Alice',invitees:{B:{uid:'B',name:'Bob',status:'active'}}};
  subscriber([quest],{ready:true,uid:'B',householdId:'H1',revision:1});
  assert.strictEqual(view.list().length,1);

  state={uid:'X',householdId:'H2',ready:true,revision:2};
  subscriber([],{ready:false,source:'context-cleared'});
  assert.strictEqual(view.list().length,0,'context clear must immediately remove old ActiveView projection');
  subscriber([quest],{ready:true,uid:'B',householdId:'H1',revision:1});
  assert.strictEqual(view.list().length,0,'stale old-household callback must be ignored');

  state={uid:'B',householdId:'H1',ready:true,revision:3};
  subscriber([quest],{ready:true,uid:'B',householdId:'H1',revision:3});
  assert.strictEqual(view.list().length,1);
  await view.leaveQuest(quest);
  assert.strictEqual(leftId,'pq1','participant action must delegate to PartyQuestService.leaveQuest');

  const ownerQuest={id:'pq2',questId:'t2',questTitle:'Badkamer',status:'active',inviterUid:'B',invitees:{}};
  await view.endQuest(ownerQuest);
  assert.strictEqual(cancelledId,'pq2','owner end must delegate to PartyQuestService.cancelQuest');

  view.stop();
  assert.strictEqual(unsubscribed,true,'stop must call exact repository unsubscribe');
  assert.strictEqual(view.list().length,0);
  subscriber([quest],{ready:true,uid:'B',householdId:'H1',revision:3});
  assert.strictEqual(view.list().length,0,'callbacks after stop must be generation-rejected');
}

(async function(){
  await testServiceLeave();
  await testActiveViewLifecycle();
  console.log('party quest STEP 11.3 leave + ActiveView lifecycle: PASS');
})().catch(error=>{console.error(error);process.exitCode=1;});
