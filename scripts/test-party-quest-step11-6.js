'use strict';
const fs=require('fs');
const assert=require('assert');
const vm=require('vm');
const crypto=require('crypto');

const experienceSource=fs.readFileSync('src/core/notificationExperience.js','utf8');
const domainSource=fs.readFileSync('src/core/householdDomainNotificationProjectorV2.js','utf8');
const partySource=fs.readFileSync('src/modules/tasks/partyQuestNotificationProjector.js','utf8');
const actionsSource=fs.readFileSync('src/core/notificationActions.js','utf8');
const loaderSource=fs.readFileSync('api/app.js','utf8');

new vm.Script(experienceSource,{filename:'notificationExperience.js'});
new vm.Script(domainSource,{filename:'householdDomainNotificationProjectorV2.js'});
new vm.Script(partySource,{filename:'partyQuestNotificationProjector.js'});

function gitBlobSha(source){return crypto.createHash('sha1').update(Buffer.concat([Buffer.from('blob '+Buffer.byteLength(source)+'\0'),Buffer.from(source)])).digest('hex');}
function clone(v){return v===undefined?undefined:JSON.parse(JSON.stringify(v));}
function tick(){return new Promise(resolve=>setTimeout(resolve,0));}

// Architecture boundaries: STEP 11.6 extends presentation/projectors only.
assert.strictEqual(gitBlobSha(actionsSource),'60a48daa628bc56531395d188a0811711d82a328','frozen NotificationActions blob must remain exact');
assert.ok(experienceSource.includes("type='task.completed.involved'"),'experience must expose involved-task completion type');
assert.ok(experienceSource.includes('publishToUidsOnce'),'new events must use canonical NotificationStore idempotency');
assert.ok(domainSource.includes('NotificationEvents.taskCompleted'),'task completion must project through NotificationEvents');
assert.ok(domainSource.includes('PartyQuestRepository'),'ordinary completion projector must exclude Party Quest participants from duplicate notification');
assert.ok(partySource.includes('completion.participantUids'),'Party Quest completion must use canonical participant snapshot');
assert.ok(partySource.includes('completion.xpPerParticipant'),'Party Quest completion notification must carry reward amount');
assert.ok(partySource.includes("String(uid)!==me&&String(uid)!==cause"),'publisher and actual task completer must both be excluded from recipient audience');
assert.ok(loaderSource.includes('notificationEvents.js?v=3'),'served runtime must cache-bust STEP 11.6 notification bootstrap');
assert.ok(loaderSource.includes('partyQuestNotificationProjector.js?v=3'),'served runtime must cache-bust STEP 11.6 Party Quest projector');
assert.ok(loaderSource.includes('notificationActions.js?v=4'),'frozen NotificationActions runtime key must remain unchanged');
['firebase.database','NotificationHouseholdRepository','fbFamilyId','fbUser','localStorage'].forEach(token=>{
  assert.ok(!experienceSource.includes(token),'notification experience must not create notification/data authority: '+token);
});

async function testPresentation(){
  let current={ready:true,uid:'A',householdId:'H1',revision:1};
  let myName='Alice';
  const members=[
    {uid:'A',displayName:'Alice',status:'active'},
    {uid:'B',displayName:'Bob',status:'active'},
    {uid:'C',displayName:'Cara',status:'active'},
    {uid:'D',displayName:'Daan',status:'active'}
  ];
  const calls=[];const types={};
  const NotificationStore={
    registerType(type){types[type]=true;},
    publishToUidsOnce(eventKey,type,uids,payload){calls.push({eventKey,type,uids:clone(uids),payload:clone(payload),publisher:current.uid});return Promise.resolve(Object.assign({eventKey,type,audience:{kind:'uids',uids:clone(uids)}},clone(payload)));},
    publishHouseholdOnce(eventKey,type,payload){calls.push({eventKey,type,uids:['household'],payload:clone(payload),publisher:current.uid});return Promise.resolve(Object.assign({eventKey,type},clone(payload)));}
  };
  const window={
    HouseholdContext:{snapshot(){return clone(current);}},
    TaskSharedData:{members(){return clone(members);}},
    NotificationStore,
    NotificationEvents:{version:'2.1.0'}
  };
  Object.defineProperty(window,'myName',{get(){return myName;},set(v){myName=v;}});
  const sandbox={window,HouseholdContext:window.HouseholdContext,TaskSharedData:window.TaskSharedData,NotificationStore,console,Promise,Date,Math,JSON,Object,String,Number,Array,Set,Intl,isNaN};
  vm.createContext(sandbox);vm.runInContext(experienceSource,sandbox,{filename:'notificationExperience.js'});
  const events=window.NotificationEvents;
  assert.strictEqual(window.NotificationExperience.version,'1.1.1');
  assert.ok(types['task.completed.involved'],'new task completion type must be registered with canonical store');

  const task={id:'t1',title:'Keuken opruimen',completedAt:100,completedByUid:'A'};
  const ordinary=await events.taskCompleted(task,['A','B','C','B'],{completedByUid:'A',occurrence:100});
  assert.strictEqual(ordinary.eventKey,'task.completed.involved:t1:100:A');
  assert.deepStrictEqual(Array.from(ordinary.audience.uids),['B','C'],'ordinary notification must exclude self and dedupe recipients');
  assert.ok(ordinary.title.includes('Alice')&&ordinary.title.includes('Keuken opruimen'));

  // Publisher C may finalize a Party Quest whose linked task was actually
  // completed by A. Presentation must name Alice, not the technical publisher.
  current={ready:true,uid:'C',householdId:'H1',revision:2};myName='Cara';
  const quest={id:'pq1',questId:'t1',questTitle:'Keuken opruimen',completion:{occurrenceId:'partyQuest:pq1:completion:v1',taskCompletedByUid:'A',participantUids:['A','B','C'],xpPerParticipant:7}};
  const party=await events.partyQuestCompleted(quest,['B'],{completedByUid:'A',xp:7,occurrence:'partyQuest:pq1:completion:v1'});
  assert.strictEqual(party.eventKey,'partyQuest.completed:pq1');
  assert.deepStrictEqual(Array.from(party.audience.uids),['B']);
  assert.ok(party.title.includes('Alice'),'combined Party Quest notification must name original task completer');
  assert.ok(party.body.includes('+7 XP'),'combined Party Quest notification must include XP reward');
  assert.strictEqual(party.data.completedByUid,'A');
  assert.strictEqual(party.data.xp,7);
}

async function testOrdinaryTaskProjection(){
  let current={ready:true,uid:'A',householdId:'H1',revision:1};
  const contextListeners=[];let taskSubscriber=null;
  const taskBaseline={id:'t1',title:'Keuken',createdByUid:'B',assignedToUids:{C:true},helpers:[{uid:'D'}],done:false,updatedByUid:'B',updatedAt:50};
  const calls=[];
  const HouseholdContext={snapshot(){return clone(current);},subscribe(fn){contextListeners.push(fn);fn(clone(current));return()=>{};}};
  const TaskHouseholdRepository={subscribe(fn){taskSubscriber=fn;fn([clone(taskBaseline)],{ready:true,source:'firebase',uid:'A',householdId:'H1'});return()=>{taskSubscriber=null;};}};
  const PartyQuestRepository={list(){return [{id:'pq1',questId:'t1',status:'completed',completion:{taskCompletedAt:100,participantUids:['A','C']}}];}};
  const NotificationEvents={
    taskCompleted(task,uids,options){calls.push({kind:'completed',uids:clone(uids),options:clone(options),task:clone(task)});return Promise.resolve();},
    taskAssigned(){return Promise.resolve();}
  };
  const window={HouseholdContext,TaskHouseholdRepository,PartyQuestRepository,NotificationEvents};
  const sandbox={window,HouseholdContext,TaskHouseholdRepository,PartyQuestRepository,NotificationEvents,console,Promise,Date,Math,JSON,Object,String,Number,Array,Set};
  vm.createContext(sandbox);vm.runInContext(domainSource,sandbox,{filename:'householdDomainNotificationProjectorV2.js'});
  assert.strictEqual(window.HouseholdDomainNotificationProjectorV2.version,'1.2.0');

  const completed=Object.assign({},taskBaseline,{done:true,completedAt:100,completedByUid:'A',updatedByUid:'A',updatedAt:100});
  taskSubscriber([completed],{ready:true,source:'firebase',uid:'A',householdId:'H1'});
  await tick();
  assert.strictEqual(calls.length,1,'one completion transition must project once');
  assert.deepStrictEqual(Array.from(calls[0].uids),['B','D'],'creator/helper get ordinary completion; Party Quest participant C is excluded from duplicate');
  assert.strictEqual(calls[0].options.completedByUid,'A');

  // Replaying identical completed state cannot create a new transition.
  taskSubscriber([completed],{ready:true,source:'firebase',uid:'A',householdId:'H1'});
  await tick();assert.strictEqual(calls.length,1,'replay must not project a duplicate ordinary completion');

  // Another UID observing the completed row must never publish on behalf of A.
  current={ready:true,uid:'B',householdId:'H1',revision:2};contextListeners.forEach(fn=>fn(clone(current)));
  taskSubscriber([completed],{ready:true,source:'firebase',uid:'B',householdId:'H1'});
  await tick();assert.strictEqual(calls.length,1,'non-completer observer must not publish completion event');
}

function makeDb(){
  const refs={};
  function ref(path){
    if(refs[path])return refs[path];
    const handlers=[];const offCalls=[];
    refs[path]={
      handlers,offCalls,
      on(event,handler){assert.strictEqual(event,'value');handlers.push(handler);},
      off(event,handler){offCalls.push({event,handler});const i=handlers.indexOf(handler);if(i>=0)handlers.splice(i,1);},
      emit(value){handlers.slice().forEach(fn=>fn({val(){return clone(value);}}));}
    };
    return refs[path];
  }
  return{ref,refs};
}

async function testPartyQuestProjection(){
  let current={ready:true,uid:'C',householdId:'H1',revision:1};const contextListeners=[];const db=makeDb();const calls=[];
  const HouseholdContext={
    snapshot(){return clone(current);},capture(){return clone(current);},isCurrent(t){return !!t&&t.uid===current.uid&&t.householdId===current.householdId&&t.revision===current.revision;},
    subscribe(fn){contextListeners.push(fn);fn(clone(current));return()=>{};}
  };
  const NotificationEvents={
    partyQuestCreated(){return Promise.resolve();},partyQuestInvitationSent(){return Promise.resolve();},partyQuestJoined(){return Promise.resolve();},
    partyQuestCompleted(q,uids,options){calls.push({q:clone(q),uids:clone(uids),options:clone(options),publisher:current.uid});return Promise.resolve();}
  };
  const window={HouseholdContext,NotificationEvents,fbDb:db,dispatchEvent(){}};
  const CustomEvent=function(type,opts){this.type=type;this.detail=opts&&opts.detail;};
  const sandbox={window,HouseholdContext,NotificationEvents,CustomEvent,console,Promise,Date,Math,JSON,Object,String,Number,Array,Set};
  vm.createContext(sandbox);vm.runInContext(partySource,sandbox,{filename:'partyQuestNotificationProjector.js'});
  assert.strictEqual(window.PartyQuestNotificationProjector.version,'3.0.1');
  const ref=db.ref('families/H1/partyQuests');
  const active={pq1:{id:'pq1',questId:'t1',questTitle:'Keuken',status:'active',inviterUid:'A',invitees:{B:{uid:'B',status:'active'},C:{uid:'C',status:'active'}}}};
  ref.emit(active); // baseline
  const completed={pq1:Object.assign({},active.pq1,{status:'completed',endedByUid:'A',completion:{occurrenceId:'partyQuest:pq1:completion:v1',taskCompletedAt:100,taskCompletedByUid:'A',finalizedByUid:'C',participantUids:['A','B','C'],xpPerParticipant:7}})};
  ref.emit(completed);await tick();
  assert.strictEqual(calls.length,1,'canonical finalizer must publish Party Quest completion once');
  assert.deepStrictEqual(Array.from(calls[0].uids),['B'],'publisher C and actual completer A must not receive self-notification');
  assert.strictEqual(calls[0].options.completedByUid,'A');
  assert.strictEqual(calls[0].options.xp,7);

  // Same snapshot replay cannot produce another transition.
  ref.emit(completed);await tick();assert.strictEqual(calls.length,1,'replay must not duplicate Party Quest completion projection');

  const staleHandler=ref.handlers[0];
  current={ready:true,uid:'B',householdId:'H2',revision:2};contextListeners.forEach(fn=>fn(clone(current)));
  assert.ok(ref.offCalls.length>=1,'context switch must detach old Party Quest listener');
  staleHandler({val(){return clone(completed);}});await tick();assert.strictEqual(calls.length,1,'stale old-household callback must not publish');
}

(async function(){
  await testPresentation();
  await testOrdinaryTaskProjection();
  await testPartyQuestProjection();
  console.log('party quest STEP 11.6 involved completion + XP notifications: PASS');
})().catch(error=>{console.error(error);process.exit(1);});
