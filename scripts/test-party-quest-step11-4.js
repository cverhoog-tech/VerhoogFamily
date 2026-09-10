'use strict';
const fs=require('fs');
const assert=require('assert');
const vm=require('vm');

const serviceSource=fs.readFileSync('src/modules/tasks/partyQuestService.js','utf8');
const helpUiSource=fs.readFileSync('src/modules/tasks/partyQuestHelpUi.js','utf8');
const loaderSource=fs.readFileSync('api/app.js','utf8');

assert.ok(serviceSource.includes('requestHelp:requestHelp'),'service must expose targeted Party Quest help');
assert.ok(serviceSource.includes('requestHouseholdHelp:requestHouseholdHelp'),'service must expose household Party Quest help');
assert.ok(serviceSource.includes('respondHelp:respondHelp'),'service must expose help responses');
assert.ok(serviceSource.includes('retractHelp:retractHelp'),'service must expose help retraction');
assert.ok(serviceSource.includes('helpOccurrenceId'),'accepted helpers must retain help occurrence provenance');
assert.ok(serviceSource.includes("joinedVia:'help'"),'accepted helper must join through explicit help semantics');
assert.ok(!serviceSource.includes('firebase.database'),'Party Quest service must not write Firebase directly');
assert.ok(!serviceSource.includes('fbFamilyId'),'Party Quest service must not use legacy household identity');
assert.ok(!serviceSource.includes('fbUser'),'Party Quest service must not use legacy user identity');
assert.ok(!serviceSource.includes('localStorage'),'Party Quest service must not use local persistence');

assert.ok(helpUiSource.includes('PartyQuestRepository'),'help UI must read the canonical Party Quest repository');
assert.ok(helpUiSource.includes('PartyQuestService'),'help UI must delegate mutations to PartyQuestService');
assert.ok(helpUiSource.includes('HouseholdContext.snapshot'),'help UI identity must come from HouseholdContext');
assert.ok(helpUiSource.includes('repoUnsubscribe'),'help UI must own exact repository subscription cleanup');
assert.ok(helpUiSource.includes('!eligible(q,me)'),'help UI must hide requests when the current user becomes ineligible');
assert.ok(helpUiSource.includes('PartyQuestInvites.pending'),'regular Party Quest invites must keep UI priority over help requests');
assert.ok(!helpUiSource.includes('firebase.database'),'help UI must not own Firebase persistence');
assert.ok(!helpUiSource.includes('firebase.auth'),'help UI must not create parallel auth');
assert.ok(!helpUiSource.includes('fbFamilyId'),'help UI must not use legacy household identity');
assert.ok(!helpUiSource.includes('fbUser'),'help UI must not use legacy user identity');
assert.ok(!helpUiSource.includes('localStorage'),'help UI must not use local identity/persistence');
assert.ok(loaderSource.includes('partyQuestService.js?v=4'),'runtime must keep the STEP 11.5 service while preserving STEP 11.4 help contracts');
assert.ok(loaderSource.includes('partyQuestHelpUi.js?v=1'),'runtime must load the STEP 11.4 help presentation');
assert.ok(loaderSource.includes('partyQuestNotificationProjector.js?v=3'),'STEP 11.6 may advance only the Party Quest notification projector around frozen help semantics');
assert.ok(loaderSource.includes('notificationActions.js?v=4'),'STEP 11.6 must leave frozen notification actions runtime unchanged');

function clone(v){return v===undefined?undefined:JSON.parse(JSON.stringify(v));}
function makeRepo(){
  let rows={};let seq=0;let deferNext=false;const deferred=[];let writes=0;
  return {
    version:'test-repo',
    allocateId(){seq++;return 'alloc'+seq;},
    seed(next){rows=clone(next||{});},
    dump(){return clone(rows);},
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
          try{next=mutator(clone(rows[id]));}catch(e){reject(e);return;}
          if(next===undefined){reject(new Error('ABORTED'));return;}
          rows[id]=clone(next);writes++;resolve(clone(next));
        };
        if(deferNext){deferNext=false;deferred.push(run);}else run();
      });
    }
  };
}

async function testHelpService(){
  let state={uid:'A',householdId:'H1',ready:true,revision:1};
  const members=[
    {uid:'A',displayName:'Alice',status:'active'},
    {uid:'B',displayName:'Bob',status:'active'},
    {uid:'C',displayName:'Cara',status:'active'},
    {uid:'D',displayName:'Dormant',status:'inactive'},
    {uid:'E',displayName:'Evi',status:'active'},
    {uid:'F',displayName:'Finn',status:'active'},
    {uid:'G',displayName:'Gia',status:'active'}
  ];
  const taskData=[{id:'t1',title:'Keuken',createdByUid:'A',assignedToUids:{C:true},status:'open'}];
  const repository=makeRepo();
  repository.seed({pq1:{id:'pq1',questId:'t1',questTitle:'Keuken',status:'active',inviterUid:'A',inviterName:'Alice',invitees:{B:{uid:'B',name:'Bob',status:'active'}},helpRequests:{}}});
  const sandbox={console,Promise,Date,Math,JSON,Object,Array,String,Number,Boolean,RegExp,Error,taskData};
  sandbox.window=sandbox;
  sandbox.HouseholdContext={
    snapshot(){return Object.freeze(clone(state));},
    capture(){return Object.freeze({uid:state.uid,householdId:state.householdId,revision:state.revision});},
    isCurrent(token){return !!token&&token.uid===state.uid&&token.householdId===state.householdId&&token.revision===state.revision;}
  };
  sandbox.PartyQuestRepository=repository;
  sandbox.TaskSharedData={members(){return clone(members);},isTaskCreator(task,uid){return String(task&&(task.createdByUid||task.ownerUid)||'')===String(uid||'');}};
  vm.runInNewContext(serviceSource,sandbox,{filename:'partyQuestService.js'});
  const service=sandbox.PartyQuestService;

  await assert.rejects(()=>service.requestHelp('pq1','C'),e=>e.code==='PARTY_QUEST_HELP_TARGET_NOT_ELIGIBLE');
  await assert.rejects(()=>service.requestHelp('pq1','D'),e=>e.code==='PARTY_QUEST_HELP_TARGET_NOT_ELIGIBLE');

  const targeted=await service.requestHelp('pq1','E');
  const targetedId=targeted.occurrenceId;
  assert.ok(targetedId.startsWith('help:alloc'));
  assert.strictEqual(targeted.request.audience,'uid');
  assert.strictEqual(targeted.request.targetUid,'E');
  assert.strictEqual(targeted.request.status,'open');
  await assert.rejects(()=>service.requestHouseholdHelp('pq1'),e=>e.code==='PARTY_QUEST_HELP_ALREADY_OPEN');

  state={uid:'F',householdId:'H1',ready:true,revision:2};
  await assert.rejects(()=>service.respondHelp('pq1',targetedId,'active'),e=>e.code==='PARTY_QUEST_HELP_WRONG_RECIPIENT');

  state={uid:'E',householdId:'H1',ready:true,revision:3};
  const accepted=await service.respondHelp('pq1',targetedId,'active');
  assert.strictEqual(accepted.invitees.E.status,'active');
  assert.strictEqual(accepted.invitees.E.joinedVia,'help');
  assert.strictEqual(accepted.invitees.E.helpOccurrenceId,targetedId);
  assert.strictEqual(accepted.helpRequests[targetedId].status,'accepted');
  await assert.rejects(()=>service.respondHelp('pq1',targetedId,'active'),e=>e.code==='PARTY_QUEST_HELP_NOT_OPEN');

  state={uid:'A',householdId:'H1',ready:true,revision:4};
  const household=await service.requestHouseholdHelp('pq1');
  const householdId=household.occurrenceId;
  assert.strictEqual(household.request.audience,'household');
  assert.strictEqual(household.request.status,'open');

  state={uid:'B',householdId:'H1',ready:true,revision:5};
  await assert.rejects(()=>service.respondHelp('pq1',householdId,'active'),e=>e.code==='PARTY_QUEST_HELP_NOT_ELIGIBLE');

  state={uid:'F',householdId:'H1',ready:true,revision:6};
  const declined=await service.respondHelp('pq1',householdId,'declined');
  assert.strictEqual(declined.helpRequests[householdId].status,'open','household request must stay open after one decline');
  assert.ok(declined.helpRequests[householdId].declinedByUids.F,'household decline must be occurrence-specific');
  await assert.rejects(()=>service.respondHelp('pq1',householdId,'declined'),e=>e.code==='PARTY_QUEST_HELP_ALREADY_RESPONDED');

  state={uid:'E',householdId:'H1',ready:true,revision:7};
  await assert.rejects(()=>service.respondHelp('pq1',householdId,'active'),e=>e.code==='PARTY_QUEST_HELP_NOT_ELIGIBLE');

  state={uid:'G',householdId:'H1',ready:true,revision:8};
  const joined=await service.respondHelp('pq1',householdId,'active');
  assert.strictEqual(joined.invitees.G.status,'active');
  assert.strictEqual(joined.invitees.G.joinedVia,'help');
  assert.ok(joined.helpRequests[householdId].acceptedByUids.G);
  assert.strictEqual(joined.helpRequests[householdId].status,'open','household request must remain open for other eligible helpers');

  state={uid:'A',householdId:'H1',ready:true,revision:9};
  const retracted=await service.retractHelp('pq1',householdId);
  assert.strictEqual(retracted.helpRequests[householdId].status,'retracted');
  await assert.rejects(()=>service.retractHelp('pq1',householdId),e=>e.code==='PARTY_QUEST_HELP_NOT_OPEN');

  state={uid:'B',householdId:'H1',ready:true,revision:10};
  await assert.rejects(()=>service.requestHelp('pq1','F'),e=>e.code==='PARTY_QUEST_HELP_NOT_INVITER');

  repository.seed({pending:{id:'pending',questId:'t1',status:'pending',inviterUid:'A',invitees:{},helpRequests:{}}});
  state={uid:'A',householdId:'H1',ready:true,revision:11};
  await assert.rejects(()=>service.requestHouseholdHelp('pending'),e=>e.code==='PARTY_QUEST_HELP_REQUIRES_ACTIVE');

  repository.seed({cancel:{id:'cancel',questId:'t1',status:'active',inviterUid:'A',invitees:{B:{uid:'B',status:'active'}},helpRequests:{h1:{id:'h1',occurrenceId:'h1',status:'open',audience:'household',requesterUid:'A',acceptedByUids:{},declinedByUids:{}}}}});
  const cancelled=await service.cancelQuest('cancel');
  assert.strictEqual(cancelled.status,'cancelled');
  assert.strictEqual(cancelled.helpRequests.h1.status,'retracted','manual cancel must retract open help requests');

  repository.seed({stale:{id:'stale',questId:'t1',status:'active',inviterUid:'A',invitees:{B:{uid:'B',status:'active'}},helpRequests:{}}});
  state={uid:'A',householdId:'H1',ready:true,revision:12};
  repository.defer();
  const writesBefore=repository.writeCount();
  const stalePromise=service.requestHouseholdHelp('stale').then(()=>({ok:true}),error=>({ok:false,error}));
  state={uid:'X',householdId:'H2',ready:true,revision:13};
  repository.flush();
  const stale=await stalePromise;
  assert.strictEqual(stale.ok,false);
  assert.strictEqual(stale.error.code,'STALE_PARTY_QUEST_CONTEXT');
  assert.strictEqual(repository.writeCount(),writesBefore,'stale help request must not commit after household switch');
}

function testHelpUiProjection(){
  let state={uid:'E',householdId:'H1',ready:true,revision:1};
  let subscriber=null,unsubscribed=false;
  const taskData=[{id:'t1',createdByUid:'A',assignedToUids:{},status:'open'}];
  const memberRows=[{uid:'A',displayName:'Alice',status:'active'},{uid:'B',displayName:'Bob',status:'active'},{uid:'E',displayName:'Evi',status:'active'}];
  const repository={version:'test',subscribe(fn){subscriber=fn;return function(){unsubscribed=true;};},start(){return true;},getById(){return null;}};
  const document={body:{appendChild(){}},head:{appendChild(){}},addEventListener(){},getElementById(){return null;},createElement(){return{style:{},setAttribute(){},remove(){},querySelector(){return null;},querySelectorAll(){return[];},innerHTML:'',onclick:null};}};
  function MutationObserver(){this.observe=function(){};this.disconnect=function(){};}
  const sandbox={console,Promise,Date,Math,JSON,Object,Array,String,Number,Boolean,RegExp,Error,document,MutationObserver,taskData,setTimeout(){return 1;},clearTimeout(){},setInterval(){return 1;},clearInterval(){}};
  sandbox.window=sandbox;
  sandbox.HouseholdContext={snapshot(){return clone(state);}};
  sandbox.PartyQuestRepository=repository;
  sandbox.PartyQuestService={};
  sandbox.PartyQuestInvites={pending(){return[];}};
  sandbox.TaskSharedData={members(){return clone(memberRows);}};
  vm.runInNewContext(helpUiSource,sandbox,{filename:'partyQuestHelpUi.js'});
  const ui=sandbox.PartyQuestHelpUi;
  assert.ok(ui.start());
  const quest={id:'pq1',questId:'t1',questTitle:'Keuken',status:'active',inviterUid:'A',invitees:{B:{uid:'B',status:'active'}},helpRequests:{h1:{id:'h1',occurrenceId:'h1',status:'open',audience:'uid',requesterUid:'A',requesterName:'Alice',targetUid:'E',createdAt:1,acceptedByUids:{},declinedByUids:{}}}};
  subscriber([quest],{ready:true,uid:'E',householdId:'H1',revision:1});
  assert.strictEqual(ui.incoming().length,1,'eligible targeted recipient must see incoming help request');

  taskData[0].assignedToUids.E=true;
  subscriber([quest],{ready:true,uid:'E',householdId:'H1',revision:1});
  assert.strictEqual(ui.incoming().length,0,'newly assigned recipient must no longer see stale help request');
  delete taskData[0].assignedToUids.E;
  subscriber([quest],{ready:true,uid:'E',householdId:'H1',revision:1});
  assert.strictEqual(ui.incoming().length,1);

  state={uid:'X',householdId:'H2',ready:true,revision:2};
  subscriber([],{ready:false,source:'context-cleared'});
  assert.strictEqual(ui.incoming().length,0,'identity switch must clear old help projection');
  subscriber([quest],{ready:true,uid:'E',householdId:'H1',revision:1});
  assert.strictEqual(ui.incoming().length,0,'stale old-household callback must be ignored');
  ui.stop();
  assert.strictEqual(unsubscribed,true,'help UI stop must call exact repository unsubscribe');
}

(async function(){
  await testHelpService();
  testHelpUiProjection();
  console.log('party quest STEP 11.4 targeted + household help: PASS');
})().catch(error=>{console.error(error);process.exitCode=1;});