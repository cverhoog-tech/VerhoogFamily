'use strict';
const fs=require('fs');
const assert=require('assert');
const vm=require('vm');

const storeSource=fs.readFileSync('src/core/notificationStore.js','utf8');
const eventsSource=fs.readFileSync('src/core/notificationEvents.js','utf8');

function clone(v){return v===undefined?undefined:JSON.parse(JSON.stringify(v));}
function tick(){return new Promise(resolve=>setTimeout(resolve,0));}
function safeId(key){return 'evt_'+encodeURIComponent(String(key)).replace(/\./g,'%2E');}

(async function(){
  let current={ready:true,uid:'userA',householdId:'houseA',revision:1};
  const repoListeners=[];
  const records={};
  const publishCalls=[];
  const readCalls=[];
  const dismissCalls=[];

  const HouseholdContext={snapshot(){return clone(current);}};
  const NotificationHouseholdRepository={
    version:'1.0.0',
    start(){return true;},
    status(){return{version:'1.0.0',ready:!!current.ready,uid:current.uid,householdId:current.householdId};},
    subscribe(fn){repoListeners.push(fn);fn(clone(records),{source:'subscribe',ready:!!current.ready,uid:current.uid,householdId:current.householdId,revision:current.revision});return()=>{const i=repoListeners.indexOf(fn);if(i>=0)repoListeners.splice(i,1);};},
    publishOnce(key,payload){
      publishCalls.push({key,payload:clone(payload),uid:current.uid,householdId:current.householdId});
      const id=safeId(key);
      if(records[id])return Promise.resolve({created:false,id,event:clone(records[id])});
      records[id]=Object.assign({},clone(payload),{id,eventKey:String(key),updatedAt:Date.now()});
      emit('mutation-ack');
      return Promise.resolve({created:true,id,event:clone(records[id])});
    },
    markRead(id){readCalls.push({id,uid:current.uid});if(!records[id])return Promise.reject(new Error('missing'));records[id].readBy=Object.assign({},records[id].readBy||{});records[id].readBy[current.uid]=Date.now();emit('marker-ack');return Promise.resolve({id,uid:current.uid});},
    dismiss(id){dismissCalls.push({id,uid:current.uid});if(!records[id])return Promise.reject(new Error('missing'));records[id].dismissedBy=Object.assign({},records[id].dismissedBy||{});records[id].dismissedBy[current.uid]=Date.now();emit('marker-ack');return Promise.resolve({id,uid:current.uid});}
  };
  function emit(source){repoListeners.slice().forEach(fn=>fn(clone(records),{source:source||'firebase',ready:!!current.ready,uid:current.uid,householdId:current.householdId,revision:current.revision}));}

  const members=[
    {uid:'userA',displayName:'Alice',status:'active'},
    {uid:'userB',displayName:'Bob',status:'active'},
    {uid:'userC',displayName:'Cara',status:'active'}
  ];
  const received=[];
  function CustomEvent(type,opts){this.type=type;this.detail=opts&&opts.detail;}
  const document={getElementById(){return null;}};
  const window={
    HouseholdContext,
    NotificationHouseholdRepository,
    TaskSharedData:{members(){return members;}},
    myName:'Alice',
    dispatchEvent(event){if(event.type==='familyapp:notification-received')received.push(event.detail.event);},
    addEventListener(){}
  };
  const sandbox={window,HouseholdContext,document,CustomEvent,console,setTimeout,clearTimeout,Promise,Date,Math,JSON,Object,String,Number,Array,Set,encodeURIComponent};
  vm.createContext(sandbox);
  vm.runInContext(storeSource,sandbox,{filename:'notificationStore.js'});
  sandbox.NotificationStore=window.NotificationStore;
  sandbox.TaskSharedData=window.TaskSharedData;
  vm.runInContext(eventsSource,sandbox,{filename:'notificationEvents.js'});
  sandbox.NotificationEvents=window.NotificationEvents;

  const store=window.NotificationStore,events=window.NotificationEvents;
  assert.ok(store&&events);
  assert.strictEqual(store.version,'2.0.0');
  assert.strictEqual(events.version,'2.0.0');

  // Unkeyed/random notification creation is deliberately no longer accepted.
  assert.throws(()=>store.publish({type:'system.message',title:'Legacy'}),/EVENT_KEY_REQUIRED/i);

  const helpTask={id:'task42',title:'Badkamer',helpRequestedAt:111,updatedAt:111};
  const help1=await events.taskHelpRequested(helpTask,'userB');
  const help2=await events.taskHelpRequested(helpTask,'userB');
  const helpKey='task.help.requested:task42:111:userB';
  assert.strictEqual(help1.eventKey,helpKey);
  assert.strictEqual(help2.id,help1.id,'same transition must resolve to same canonical event');
  assert.strictEqual(Object.keys(records).filter(id=>records[id].eventKey===helpKey).length,1,'same help transition may exist only once');
  assert.strictEqual(publishCalls.filter(x=>x.key===helpKey).length,2,'duplicate callers may race but repository receives same idempotency key');
  assert.strictEqual(store.list().length,0,'actor A must not see B-only help request');

  // Switch to recipient B. Store visibility/read state is per current UID while
  // canonical event data stays household-shared.
  current={ready:true,uid:'userB',householdId:'houseA',revision:2};
  window.myName='Bob';
  emit('identity-switch');
  await tick();
  assert.strictEqual(store.list().length,1,'recipient B must see targeted help request');
  assert.strictEqual(store.unreadCount(),1);
  await store.markRead(help1.id);
  assert.strictEqual(readCalls[0].uid,'userB','read mutation must use active UID');
  assert.strictEqual(store.unreadCount(),0);
  await store.dismiss(help1.id);
  assert.strictEqual(dismissCalls[0].uid,'userB','dismiss mutation must use active UID');
  assert.strictEqual(store.list().length,0,'dismissed event is hidden only for active UID');

  // Help-joined event is keyed by accepted occurrence + helper/requester.
  const joinedTask={id:'task42',title:'Badkamer',helpAcceptedAt:222,updatedAt:222};
  const joined=await events.taskHelpJoined(joinedTask,'userA');
  assert.strictEqual(joined.eventKey,'task.help.joined:task42:222:userB:userA');

  // Swap keys use the stable request id, not task title or render timing.
  const swapRequest={id:'swap_9',taskId:'task42',targetUid:'userC',createdAt:333,status:'pending'};
  const swap=await events.taskSwapRequested(helpTask,'userC',swapRequest);
  assert.strictEqual(swap.eventKey,'task.swap.requested:swap_9');
  const resolved=await events.taskSwapResolved(helpTask,'userA',true,Object.assign({},swapRequest,{status:'accepted'}));
  assert.strictEqual(resolved.eventKey,'task.swap.accepted:swap_9');

  // Party Quest events have one canonical identity per quest/recipient action.
  const quest={id:'quest_7',questTitle:'Garage opruimen',inviterUid:'userB'};
  const party=await events.partyQuestCreated(quest,['userA','userC']);
  assert.strictEqual(party.eventKey,'partyQuest.created:quest_7');
  const sent=await events.partyQuestInvitationSent(quest,'userC');
  assert.strictEqual(sent.eventKey,'partyQuest.invitation.sent:quest_7:userC');
  const joinedQuest=await events.partyQuestJoined(quest,'userA');
  assert.strictEqual(joinedQuest.eventKey,'partyQuest.joined:quest_7:userB');
  const completed=await events.partyQuestCompleted(quest);
  assert.strictEqual(completed.eventKey,'partyQuest.completed:quest_7');

  // Finance event identity is the canonical Finance transaction id.
  const finance=await events.financeSavingsUpdated({id:'goal1',name:'Vakantie',icon:'✈️'},{id:'tx55',type:'deposit',amount:25,who:'Bob',date:'2026-08-24'});
  assert.strictEqual(finance.eventKey,'finance.savings.updated:goal1:tx55');

  assert.ok(publishCalls.every(x=>x.key&&String(x.key).indexOf('unknown')<0),'tested typed producers must publish deterministic keys');
  console.log('STEP 10 canonical NotificationStore + deterministic events contract: PASS');
})().catch(error=>{console.error(error);process.exit(1);});
