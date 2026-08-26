'use strict';
const fs=require('fs');
const assert=require('assert');
const vm=require('vm');

const source=fs.readFileSync('src/modules/tasks/partyQuestService.js','utf8');
const invitesSource=fs.readFileSync('src/modules/tasks/partyQuestInvites.js','utf8');
const loaderSource=fs.readFileSync('api/app.js','utf8');
assert.ok(source.includes('HouseholdContext.capture'),'service must capture HouseholdContext');
assert.ok(source.includes('PartyQuestRepository'),'service must use canonical repository');
assert.ok(!source.includes('firebase.database'),'service must not write Firebase directly');
assert.ok(!source.includes('fbFamilyId'),'service must not use legacy household identity');
assert.ok(!source.includes('fbUser'),'service must not use legacy user identity');
assert.ok(!source.includes('localStorage'),'service must not use local Party Quest persistence');
assert.ok(invitesSource.includes('PartyQuestService'),'invite facade must delegate mutations to PartyQuestService');
assert.ok(invitesSource.includes('PartyQuestRepository'),'invite facade must read through PartyQuestRepository');
assert.ok(!invitesSource.includes('fbFamilyId'),'invite facade must not use legacy household identity');
assert.ok(!invitesSource.includes('fbUser'),'invite facade must not use legacy user identity');
assert.ok(!invitesSource.includes('firebase.auth'),'invite facade must not use parallel auth');
assert.ok(!invitesSource.includes('.transaction('),'invite facade must not own Firebase transactions');
assert.ok(!invitesSource.includes(".ref('families/"),'invite facade must not own Party Quest Firebase refs');
assert.ok(invitesSource.includes("getById:getById,revokeInvite:revokeInvite,respond:respond"),'frozen NotificationActions facade methods must remain available');
const contextIndex=loaderSource.indexOf('householdContext.js?v=1');
const repoIndex=loaderSource.indexOf('partyQuestRepository.js?v=2');
const serviceIndex=loaderSource.indexOf('partyQuestService.js?v=1');
const actionsIndex=loaderSource.indexOf('notificationActions.js?v=4');
const projectorIndex=loaderSource.indexOf('partyQuestNotificationProjector.js?v=2');
assert.ok(contextIndex>=0&&repoIndex>contextIndex&&serviceIndex>repoIndex,'runtime must load HouseholdContext -> PartyQuestRepository -> PartyQuestService');
assert.ok(actionsIndex>serviceIndex&&projectorIndex>serviceIndex,'frozen notification layer must load after PartyQuestService');
assert.ok(loaderSource.includes('partyQuestInvites.js?v=6'),'runtime must cache-bust the STEP 11.2 invite facade');

function clone(v){return v===undefined?undefined:JSON.parse(JSON.stringify(v));}
function makeRepo(){
  let rows={};let seq=0;let deferNext=false;const deferred=[];const writes=[];
  return {
    version:'test',
    allocateId(){seq++;return 'pq'+seq;},
    getById(id){return clone(rows[id]||null);},
    seed(next){rows=clone(next||{});},
    dump(){return clone(rows);},
    writes,
    defer(){deferNext=true;},
    flush(){while(deferred.length)deferred.shift()();},
    mutateCollection(mutator){
      return new Promise((resolve,reject)=>{
        const run=()=>{
          let changed;
          try{changed=mutator(clone(rows));}catch(e){reject(e);return;}
          if(changed===undefined){reject(new Error('ABORTED'));return;}
          const next=changed&&changed.rows?changed.rows:changed;
          rows=clone(next);writes.push({type:'collection',rows:clone(rows)});
          resolve({rows:Object.values(clone(rows)),result:clone(changed&&changed.result)});
        };
        if(deferNext){deferNext=false;deferred.push(run);}else run();
      });
    },
    mutateOne(id,mutator){
      return new Promise((resolve,reject)=>{
        const run=()=>{
          if(!rows[id]){reject(new Error('NOT_FOUND'));return;}
          let next;
          try{next=mutator(clone(rows[id]));}catch(e){reject(e);return;}
          if(next===undefined){reject(new Error('ABORTED'));return;}
          rows[id]=clone(next);writes.push({type:'one',id,value:clone(next)});resolve(clone(next));
        };
        if(deferNext){deferNext=false;deferred.push(run);}else run();
      });
    }
  };
}

(async function(){
  let state={uid:'A',householdId:'H1',ready:true,revision:1};
  const members=[
    {uid:'A',displayName:'Alice',status:'active'},
    {uid:'B',displayName:'Bob',status:'active'},
    {uid:'C',displayName:'Cara',status:'active'},
    {uid:'D',displayName:'Dormant',status:'inactive'}
  ];
  const taskData=[
    {id:'t1',title:'Keuken',createdByUid:'A',assignedToUids:{C:true},status:'open'},
    {id:'t2',title:'Badkamer',createdByUid:'C',status:'open'}
  ];
  const repository=makeRepo();
  const sandbox={console,Promise,Date,Math,JSON,Object,Array,String,Number,Boolean,RegExp,Error,taskData};
  sandbox.window=sandbox;
  sandbox.HouseholdContext={
    snapshot(){return Object.freeze(clone(state));},
    capture(){return Object.freeze({uid:state.uid,householdId:state.householdId,revision:state.revision});},
    isCurrent(token){return !!token&&token.uid===state.uid&&token.householdId===state.householdId&&token.revision===state.revision;}
  };
  sandbox.PartyQuestRepository=repository;
  sandbox.TaskSharedData={members(){return clone(members);},isTaskCreator(task,uid){return String(task&&(task.createdByUid||task.ownerUid)||'')===String(uid||'');}};
  vm.runInNewContext(source,sandbox,{filename:'partyQuestService.js'});
  const service=sandbox.PartyQuestService;
  assert.ok(service,'PartyQuestService must install globally');

  const created=await service.createInvites(['t1'],['A','B','C','D','B']);
  assert.strictEqual(created.created,1);
  assert.strictEqual(created.totalTargets,1);
  let all=repository.dump();
  assert.deepStrictEqual(Object.keys(all),['pq1']);
  assert.strictEqual(all.pq1.inviterUid,'A');
  assert.deepStrictEqual(Object.keys(all.pq1.invitees),['B']);
  assert.strictEqual(all.pq1.invitees.B.inviteVersion,1);
  assert.strictEqual(all.pq1.invitees.B.inviteOccurrenceId,'pq1:B:v1');

  await assert.rejects(()=>service.createInvites(['t1'],['B']),e=>e.code==='PARTY_QUEST_NO_ELIGIBLE_INVITEES');
  assert.deepStrictEqual(Object.keys(repository.dump()),['pq1']);
  await assert.rejects(()=>service.createInvites(['t2'],['B']),e=>e.code==='PARTY_QUEST_NOT_TASK_OWNER');

  state={uid:'B',householdId:'H1',ready:true,revision:2};
  const accepted=await service.respond('pq1','active');
  assert.strictEqual(accepted.invitees.B.status,'active');
  assert.strictEqual(accepted.status,'active');
  await assert.rejects(()=>service.respond('pq1','active'),e=>e.code==='PARTY_QUEST_INVITE_NOT_PENDING');

  repository.seed({pqC:{id:'pqC',questId:'t1',questTitle:'Keuken',status:'pending',inviterUid:'A',invitees:{C:{uid:'C',name:'Cara',status:'pending',inviteVersion:1,inviteOccurrenceId:'pqC:C:v1'}}}});
  await assert.rejects(()=>service.respond('pqC','active'),e=>e.code==='PARTY_QUEST_INVITE_WRONG_RECIPIENT');
  await assert.rejects(()=>service.revokeInvite('pqC','C'),e=>e.code==='PARTY_QUEST_NOT_INVITER');

  repository.seed({pqB:{id:'pqB',questId:'t1',questTitle:'Keuken',status:'pending',inviterUid:'A',invitees:{B:{uid:'B',name:'Bob',status:'pending',inviteVersion:1,inviteOccurrenceId:'pqB:B:v1'}}}});
  state={uid:'B',householdId:'H1',ready:true,revision:3};
  const declined=await service.respond('pqB','declined');
  assert.strictEqual(declined.status,'cancelled');
  state={uid:'A',householdId:'H1',ready:true,revision:4};
  const reinvite=await service.createInvites(['t1'],['B']);
  assert.strictEqual(reinvite.created,1);
  all=repository.dump();
  const newId=reinvite.questIds[0];
  assert.notStrictEqual(newId,'pqB');
  assert.strictEqual(all[newId].invitees.B.inviteVersion,2);
  assert.strictEqual(all[newId].invitees.B.inviteOccurrenceId,newId+':B:v2');

  const revoked=await service.revokeInvite(newId,'B');
  assert.strictEqual(revoked.invitees.B.status,'revoked');
  assert.strictEqual(revoked.status,'cancelled');

  const activeId='manual-active';
  repository.seed({[activeId]:{id:activeId,questId:'t1',status:'active',inviterUid:'A',invitees:{B:{uid:'B',status:'active'},C:{uid:'C',status:'pending'}}}});
  const ended=await service.cancelQuest(activeId);
  assert.strictEqual(ended.status,'cancelled');
  assert.strictEqual(ended.invitees.C.status,'revoked');
  assert.notStrictEqual(ended.status,'completed');

  repository.seed({});
  state={uid:'A',householdId:'H1',ready:true,revision:5};
  repository.defer();
  const stalePromise=service.createInvites(['t1'],['B']).then(()=>({ok:true}),error=>({ok:false,error}));
  state={uid:'X',householdId:'H2',ready:true,revision:6};
  const writesBefore=repository.writes.length;
  repository.flush();
  const stale=await stalePromise;
  assert.strictEqual(stale.ok,false);
  assert.strictEqual(stale.error.code,'STALE_PARTY_QUEST_CONTEXT');
  assert.strictEqual(repository.writes.length,writesBefore,'stale service mutation must not commit');

  console.log('party quest service state machine: PASS');
})().catch(error=>{console.error(error);process.exitCode=1;});
