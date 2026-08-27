'use strict';
const fs=require('fs');
const assert=require('assert');
const vm=require('vm');

const serviceSource=fs.readFileSync('src/modules/tasks/partyQuestService.js','utf8');
const workerSource=fs.readFileSync('src/modules/tasks/partyQuestCompletionReward.js','utf8');
const loaderSource=fs.readFileSync('api/app.js','utf8');

new vm.Script(serviceSource,{filename:'partyQuestService.js'});
new vm.Script(workerSource,{filename:'partyQuestCompletionReward.js'});

// STEP 11.5 must extend the existing authorities rather than introducing new
// Party Quest/task/progression persistence paths.
assert.ok(serviceSource.includes('completeFromTask:completeFromTask'),'service must expose task-driven completion');
assert.ok(serviceSource.includes('markRewardSettled:markRewardSettled'),'service must expose post-award settlement acknowledgement');
assert.ok(serviceSource.includes('taskCompletionProjectionTrusted'),'completion must reject non-canonical task projections');
assert.ok(serviceSource.includes("source||'').indexOf('firebase')===0"),'completion must require a live Firebase task projection');
assert.ok(serviceSource.includes("status:'pending'"),'completion must persist pending reward settlements');
assert.ok(serviceSource.includes("completion:v1"),'completion occurrence must be deterministic/versioned');
assert.ok(serviceSource.includes("return 'partyQuest:'"),'reward key must stay deterministic and migration-compatible');
assert.ok(serviceSource.includes('ProgressionStore'),'settlement confirmation must use frozen ProgressionStore');
assert.ok(!serviceSource.includes('firebase.database'),'PartyQuestService must not write Firebase directly');
assert.ok(!serviceSource.includes('fbFamilyId'),'PartyQuestService must not use legacy household identity');
assert.ok(!serviceSource.includes('fbUser'),'PartyQuestService must not use legacy user identity');
assert.ok(!serviceSource.includes('localStorage'),'PartyQuestService must not create local authority');

assert.ok(workerSource.includes('PartyQuestRepository'),'worker must observe canonical Party Quest repository');
assert.ok(workerSource.includes('PartyQuestService'),'worker must delegate Party Quest mutations to the service');
assert.ok(workerSource.includes('ProgressionStore'),'worker must award through frozen ProgressionStore');
assert.ok(workerSource.includes('awardOnce'),'worker must use deterministic idempotent progression reward API');
assert.ok(workerSource.includes('hasReward'),'worker must confirm canonical reward before settlement acknowledgement');
assert.ok(workerSource.includes('repoUnsubscribe'),'worker must own exact Party Quest repository cleanup');
assert.ok(workerSource.includes('HouseholdContext.capture'),'worker must capture HouseholdContext');
assert.ok(workerSource.includes('generation'),'worker must reject stale lifecycle work');
['firebase.database','rewardsClaimed','awardXP','PartyQuestActiveView.endQuest','fbFamilyId','fbUser','localStorage'].forEach(token=>{
  assert.ok(!workerSource.includes(token),'STEP 11.5 worker must not use legacy/preclaim authority: '+token);
});

assert.ok(loaderSource.includes('partyQuestService.js?v=4'),'runtime must serve STEP 11.5 PartyQuestService');
assert.ok(loaderSource.includes('partyQuestCompletionReward.js?v=4'),'runtime must serve STEP 11.5 completion/reward worker');
assert.ok(loaderSource.includes('progressionStore.js?v=1'),'frozen ProgressionStore runtime key must remain unchanged');
assert.ok(loaderSource.includes('progressionRuntime.js?v=2'),'frozen ProgressionRuntime runtime key must remain unchanged');
assert.ok(loaderSource.includes('notificationActions.js?v=4'),'frozen notification actions runtime key must remain unchanged');
assert.ok(loaderSource.includes('partyQuestNotificationProjector.js?v=2'),'STEP 11.6 notification work must not start in STEP 11.5');

function clone(v){return v===undefined?undefined:JSON.parse(JSON.stringify(v));}

function makeRepo(){
  let rows={};
  let deferNext=false;
  const deferred=[];
  let writes=0;
  return {
    version:'test-party-repo',
    allocateId(){return 'unused';},
    seed(next){rows=clone(next||{});},
    dump(){return clone(rows);},
    list(){return Object.values(clone(rows));},
    writeCount(){return writes;},
    defer(){deferNext=true;},
    flush(){while(deferred.length)deferred.shift()();},
    getById(id){return clone(rows[id]||null);},
    mutateCollection(){return Promise.reject(new Error('not used'));},
    mutateOne(id,mutator){
      return new Promise((resolve,reject)=>{
        const run=()=>{
          if(!rows[id]){reject(new Error('NOT_FOUND'));return;}
          let next;
          try{next=mutator(clone(rows[id]));}catch(error){reject(error);return;}
          if(next===undefined){reject(new Error('ABORTED'));return;}
          rows[id]=clone(next);
          writes++;
          resolve(clone(next));
        };
        if(deferNext){deferNext=false;deferred.push(run);}else run();
      });
    }
  };
}

async function testCompletionService(){
  let state={uid:'A',householdId:'H1',ready:true,revision:1};
  let taskSource='household-cache';
  const tasks=[{id:'t1',title:'Keuken',createdByUid:'A',done:true,completedAt:123,completedByUid:'A',rewardXp:7}];
  const members=[{uid:'A',displayName:'Alice',status:'active'},{uid:'B',displayName:'Bob',status:'active'},{uid:'C',displayName:'Cara',status:'active'}];
  const repository=makeRepo();
  repository.seed({pq1:{
    id:'pq1',questId:'t1',questTitle:'Keuken',status:'active',inviterUid:'A',inviterName:'Alice',
    invitees:{B:{uid:'B',name:'Bob',status:'active'},C:{uid:'C',name:'Cara',status:'pending'}},
    helpRequests:{h1:{id:'h1',occurrenceId:'h1',status:'open',audience:'household',requesterUid:'A'}},
    rewardSettlements:{},completion:null
  }});

  const rewarded={};
  const sandbox={console,Promise,Date,Math,JSON,Object,Array,String,Number,Boolean,RegExp,Error,taskData:tasks};
  sandbox.window=sandbox;
  sandbox.HouseholdContext={
    snapshot(){return Object.freeze(clone(state));},
    capture(){return Object.freeze({uid:state.uid,householdId:state.householdId,revision:state.revision});},
    isCurrent(token){return !!token&&token.uid===state.uid&&token.householdId===state.householdId&&token.revision===state.revision;}
  };
  sandbox.PartyQuestRepository=repository;
  sandbox.TaskHouseholdRepository={list(){return clone(tasks);},status(){return{ready:true,source:taskSource};}};
  sandbox.TaskSharedData={members(){return clone(members);},isTaskCreator(task,uid){return String(task&&task.createdByUid||'')===String(uid||'');}};
  sandbox.ProgressionStore={hasReward(key){return !!rewarded[state.uid+'|'+key];}};
  vm.runInNewContext(serviceSource,sandbox,{filename:'partyQuestService.js'});
  const service=sandbox.PartyQuestService;

  const writesBeforeCache=repository.writeCount();
  await assert.rejects(()=>service.completeFromTask('pq1'),e=>e.code==='PARTY_QUEST_TASK_NOT_CANONICAL');
  assert.strictEqual(repository.writeCount(),writesBeforeCache,'cache-only task state must not complete Party Quest');

  taskSource='firebase';
  const completed=await service.completeFromTask('pq1');
  assert.strictEqual(completed.status,'completed');
  assert.strictEqual(completed.endReason,'linked-task-completed');
  assert.strictEqual(completed.completion.occurrenceId,'partyQuest:pq1:completion:v1');
  assert.strictEqual(completed.completion.participantUids.join(','),'A,B','only inviter + active participants receive Party Quest rewards');
  assert.strictEqual(completed.completion.xpPerParticipant,7);
  assert.strictEqual(completed.rewardSettlements.A.status,'pending');
  assert.strictEqual(completed.rewardSettlements.B.status,'pending');
  assert.strictEqual(completed.rewardSettlements.A.rewardKey,'partyQuest:pq1');
  assert.strictEqual(completed.rewardSettlements.B.rewardKey,'partyQuest:pq1');
  assert.ok(!completed.rewardSettlements.C,'pending invitee must not receive a completion reward');
  assert.strictEqual(completed.invitees.C.status,'revoked','pending invite must close on task-driven completion');
  assert.strictEqual(completed.helpRequests.h1.status,'retracted','open help must close on completion');

  const repeated=await service.completeFromTask('pq1');
  assert.strictEqual(repeated.completion.occurrenceId,'partyQuest:pq1:completion:v1','repeated completion must keep one occurrence');
  assert.strictEqual(Object.keys(repeated.rewardSettlements).sort().join(','),'A,B','repeated completion must not create extra settlements');

  // A settlement may only move to settled after ProgressionStore confirms that
  // the deterministic reward exists for the current UID.
  await assert.rejects(()=>service.markRewardSettled('pq1','partyQuest:pq1:completion:v1'),e=>e.code==='PARTY_QUEST_REWARD_NOT_CONFIRMED');
  assert.strictEqual(repository.dump().pq1.rewardSettlements.A.status,'pending');
  rewarded['A|partyQuest:pq1']=true;
  const settled=await service.markRewardSettled('pq1','partyQuest:pq1:completion:v1');
  assert.strictEqual(settled.rewardSettlements.A.status,'settled');
  assert.strictEqual(settled.rewardSettlements.A.settledByUid,'A');

  repository.seed({pqOpen:{id:'pqOpen',questId:'t2',status:'active',inviterUid:'A',invitees:{B:{uid:'B',status:'active'}},rewardSettlements:{},completion:null}});
  tasks.push({id:'t2',createdByUid:'A',done:false,status:'open'});
  await assert.rejects(()=>service.completeFromTask('pqOpen'),e=>e.code==='PARTY_QUEST_TASK_NOT_COMPLETED');

  repository.seed({pqCancelled:{id:'pqCancelled',questId:'t1',status:'cancelled',inviterUid:'A',invitees:{B:{uid:'B',status:'active'}},rewardSettlements:{},completion:null}});
  await assert.rejects(()=>service.completeFromTask('pqCancelled'),e=>e.code==='PARTY_QUEST_ALREADY_CANCELLED');

  repository.seed({pqStale:{id:'pqStale',questId:'t1',status:'active',inviterUid:'A',invitees:{B:{uid:'B',status:'active'}},rewardSettlements:{},completion:null}});
  state={uid:'A',householdId:'H1',ready:true,revision:2};
  repository.defer();
  const writesBeforeStale=repository.writeCount();
  const stalePromise=service.completeFromTask('pqStale').then(()=>({ok:true}),error=>({ok:false,error}));
  state={uid:'X',householdId:'H2',ready:true,revision:3};
  repository.flush();
  const stale=await stalePromise;
  assert.strictEqual(stale.ok,false);
  assert.strictEqual(stale.error.code,'STALE_PARTY_QUEST_CONTEXT');
  assert.strictEqual(repository.writeCount(),writesBeforeStale,'stale completion must not commit after household switch');
}

function makeWorkerSandbox(options){
  options=options||{};
  let state=options.state||{uid:'A',householdId:'H1',ready:true,revision:1};
  let rows=clone(options.rows||{});
  let subscriber=null;
  const order=[];
  const rewards=options.rewards||{};
  const marks=[];
  const toasts=[];
  const activities=[];
  const repository={
    version:'test-repo',
    list(){return Object.values(clone(rows));},
    subscribe(fn){subscriber=fn;return function(){subscriber=null;};}
  };
  const progression={
    awardOnce(key,amount){
      order.push('award:'+state.uid+':'+key);
      if(options.awardImpl)return options.awardImpl({key,amount,state,rewards,order});
      const mapKey=state.uid+'|'+key;
      if(rewards[mapKey])return Promise.resolve({awarded:false,key,amount:0});
      rewards[mapKey]=true;
      return Promise.resolve({awarded:true,key,amount});
    },
    hasReward(key){return !!rewards[state.uid+'|'+key];}
  };
  const service={
    completeFromTask(id){order.push('complete:'+id);return Promise.resolve(rows[id]);},
    markRewardSettled(id,occurrenceId){
      order.push('mark:'+state.uid+':'+id);
      marks.push({uid:state.uid,id,occurrenceId});
      if(rows[id]&&rows[id].rewardSettlements&&rows[id].rewardSettlements[state.uid])rows[id].rewardSettlements[state.uid].status='settled';
      return Promise.resolve(clone(rows[id]));
    }
  };
  const listeners={};
  const sandbox={
    console,Promise,Date,Math,JSON,Object,Array,String,Number,Boolean,RegExp,Error,
    setTimeout(){return 1;},clearTimeout(){},
    addEventListener(type,fn){listeners[type]=fn;},
    dispatchEvent(){},
    showToast(message){toasts.push(message);},
    addActivity(){activities.push(Array.from(arguments));},
    taskData:[]
  };
  sandbox.window=sandbox;
  sandbox.HouseholdContext={
    snapshot(){return clone(state);},
    capture(){return Object.freeze({uid:state.uid,householdId:state.householdId,revision:state.revision});},
    isCurrent(token){return !!token&&token.uid===state.uid&&token.householdId===state.householdId&&token.revision===state.revision;}
  };
  sandbox.PartyQuestRepository=repository;
  sandbox.PartyQuestService=service;
  sandbox.ProgressionStore=progression;
  sandbox.TaskHouseholdRepository={list(){return[];}};
  vm.runInNewContext(workerSource,sandbox,{filename:'partyQuestCompletionReward.js'});
  return {
    sandbox,repository,service,progression,order,rewards,marks,toasts,activities,
    getState(){return state;},setState(next){state=next;},setRows(next){rows=clone(next||{});},getRows(){return clone(rows);},subscriber(){return subscriber;}
  };
}

function completedQuest(){
  return {pq1:{
    id:'pq1',questId:'t1',questTitle:'Keuken',status:'completed',inviterUid:'A',
    completion:{occurrenceId:'partyQuest:pq1:completion:v1',participantUids:['A','B'],xpPerParticipant:7},
    rewardSettlements:{
      A:{uid:'A',occurrenceId:'partyQuest:pq1:completion:v1',rewardKey:'partyQuest:pq1',amount:7,status:'pending'},
      B:{uid:'B',occurrenceId:'partyQuest:pq1:completion:v1',rewardKey:'partyQuest:pq1',amount:7,status:'pending'}
    }
  }};
}

async function testRewardWorker(){
  // Current participant receives XP first; only after ProgressionStore confirms
  // the reward may the Party Quest settlement be acknowledged.
  const w=makeWorkerSandbox({rows:completedQuest()});
  await w.sandbox.PartyQuestCompletionReward.scan();
  assert.deepStrictEqual(w.order.slice(0,2),['award:A:partyQuest:pq1','mark:A:pq1']);
  assert.strictEqual(w.rewards['A|partyQuest:pq1'],true);
  assert.strictEqual(w.marks.length,1);
  assert.strictEqual(w.toasts.length,1,'first real award may show one completion toast');

  // B can have been offline during completion. On B's later authenticated
  // session the same durable Party Quest row still contains B's pending work.
  const bRows=completedQuest();
  bRows.pq1.rewardSettlements.A.status='settled';
  w.setRows(bRows);
  w.setState({uid:'B',householdId:'H1',ready:true,revision:2});
  await w.sandbox.PartyQuestCompletionReward.scan();
  assert.ok(w.order.includes('award:B:partyQuest:pq1'),'offline participant must receive reward when they later become current UID');
  assert.ok(w.marks.some(row=>row.uid==='B'),'offline participant settlement must be acknowledged after its reward');
  assert.strictEqual(w.rewards['B|partyQuest:pq1'],true);

  // Crash/retry scenario: XP already exists but settlement stayed pending.
  // awardOnce returns awarded:false and must NOT add XP again; worker still
  // acknowledges the pending settlement because hasReward is true.
  const retryRewards={'A|partyQuest:pq1':true};
  const retry=makeWorkerSandbox({rows:completedQuest(),rewards:retryRewards});
  await retry.sandbox.PartyQuestCompletionReward.scan();
  assert.deepStrictEqual(retry.order.slice(0,2),['award:A:partyQuest:pq1','mark:A:pq1']);
  assert.strictEqual(retry.toasts.length,0,'idempotent retry must not repeat completion celebration');
  assert.strictEqual(retry.marks.length,1,'already-awarded pending settlement must converge to settled');

  // Reward failure must leave settlement pending. There is no preclaim write.
  const failed=makeWorkerSandbox({
    rows:completedQuest(),
    awardImpl(){return Promise.reject(new Error('NETWORK_DOWN'));}
  });
  await failed.sandbox.PartyQuestCompletionReward.scan();
  assert.strictEqual(failed.marks.length,0,'failed XP mutation must not mark settlement settled');
  assert.strictEqual(failed.getRows().pq1.rewardSettlements.A.status,'pending');

  // Delayed reward completion from an old account/household must not be followed
  // by a Party Quest settlement mutation in the new context.
  let resolveAward;
  const stale=makeWorkerSandbox({
    rows:completedQuest(),
    awardImpl({key,state,rewards}){
      const capturedUid=state.uid;
      return new Promise(resolve=>{resolveAward=()=>{rewards[capturedUid+'|'+key]=true;resolve({awarded:true,key,amount:7});};});
    }
  });
  const pending=stale.sandbox.PartyQuestCompletionReward.scan();
  for(let i=0;i<8&&typeof resolveAward!=='function';i++)await Promise.resolve();
  assert.strictEqual(typeof resolveAward,'function','stale-context test must pause after awardOnce has started');
  stale.setState({uid:'X',householdId:'H2',ready:true,revision:2});
  resolveAward();
  await pending;
  assert.strictEqual(stale.marks.length,0,'stale delayed reward must not mutate old Party Quest settlement after context switch');
}

(async function(){
  await testCompletionService();
  await testRewardWorker();
  console.log('party quest STEP 11.5 completion + exactly-once rewards: PASS');
})().catch(error=>{console.error(error);process.exitCode=1;});