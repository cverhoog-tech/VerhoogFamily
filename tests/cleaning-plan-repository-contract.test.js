'use strict';
const assert=require('assert');
const fs=require('fs');
const path=require('path');
const vm=require('vm');

function clone(value){return JSON.parse(JSON.stringify(value));}

async function loadRepository(){
  const context={uid:'member-a',householdId:'household-1',revision:7,ready:true};
  const token={uid:context.uid,householdId:context.householdId,revision:context.revision};
  let clock=500000;
  let serverRoot={
    rooms:{bathroom:{name:'Badkamer',active:true}},
    routines:{sink:{roomId:'bathroom',title:'Wastafel',active:true,nextDueAt:1000,estimatedMinutes:10}},
    plans:{},
    occurrences:{}
  };
  let rootHandler=null;
  let transactionCalls=0;
  const basePath='families/household-1/cleaning';
  const db={
    ref(refPath){
      return {
        on(event,handler){if(refPath===basePath&&event==='value'){rootHandler=handler;handler({val:()=>clone(serverRoot)});}},
        off(){},
        transaction(updater){
          transactionCalls++;
          const next=updater(clone(serverRoot));
          if(next===undefined)return Promise.resolve({committed:false,snapshot:{val:()=>clone(serverRoot)}});
          serverRoot=clone(next);
          if(rootHandler)rootHandler({val:()=>clone(serverRoot)});
          return Promise.resolve({committed:true,snapshot:{val:()=>clone(serverRoot)}});
        }
      };
    }
  };
  const window={
    fbDb:db,
    HouseholdContext:{
      snapshot(){return clone(context);},
      capture(){return clone(token);},
      isCurrent(value){return value&&value.uid===context.uid&&value.householdId===context.householdId&&value.revision===context.revision;},
      subscribe(fn){fn(clone(context));return function(){};}
    },
    addEventListener(){},
    dispatchEvent(){}
  };
  function CustomEvent(type,options){this.type=type;this.detail=options&&options.detail;}
  const FakeDate={now(){clock+=100;return clock;}};
  const sandbox={window,CustomEvent,console,Object,String,Number,Error,Array,Math,JSON,RegExp,Promise,Date:FakeDate};
  vm.createContext(sandbox);
  ['cleaningDomain.js','cleaningPlannerContract.js','cleaningPlanPersistenceContract.js','cleaningRepositoryContract.js','cleaningHouseholdRepository.js'].forEach((file) => {
    const source=fs.readFileSync(path.join(__dirname,'../src/modules/cleaning',file),'utf8');
    vm.runInContext(source,sandbox,{filename:file});
  });
  return {
    repository:window.CleaningHouseholdRepository,
    planner:window.CleaningPlannerContract,
    server(){return clone(serverRoot);},
    transactionCalls(){return transactionCalls;},
    advanceContextWithoutRepositoryEcho(){context.revision++;token.revision++;}
  };
}

(async function(){
  const harness=await loadRepository();
  const window={startAt:1,endAt:604800001};
  const concept=harness.planner.generateConceptPlan({
    window,
    rooms:{bathroom:{name:'Badkamer',active:true}},
    routines:{sink:{roomId:'bathroom',title:'Wastafel',nextDueAt:1000,estimatedMinutes:10}},
    members:{'member-a':{status:'active'}}
  });

  const first=await harness.repository.saveDraftPlan(concept);
  const firstServer=harness.server();
  assert.strictEqual(harness.transactionCalls(),1,'plan and occurrences are written in one cleaning-root transaction');
  assert.strictEqual(first.plan.status,'DRAFT');
  assert.strictEqual(Object.keys(firstServer.plans).length,1);
  assert.strictEqual(Object.keys(firstServer.occurrences).length,1);
  assert.strictEqual(firstServer.plans[first.planId].occurrenceIds[0],first.activeOccurrenceIds[0]);
  assert.strictEqual(firstServer.occurrences[first.activeOccurrenceIds[0]].planId,first.planId);
  assert.strictEqual(firstServer.rooms.bathroom.name,'Badkamer','the cleaning-root transaction preserves canonical rooms');
  assert.strictEqual(firstServer.routines.sink.title,'Wastafel','the cleaning-root transaction preserves canonical routines');

  const createdAt=firstServer.plans[first.planId].createdAt;
  const second=await harness.repository.saveDraftPlan(concept);
  const secondServer=harness.server();
  assert.strictEqual(harness.transactionCalls(),2);
  assert.strictEqual(second.planId,first.planId,'retry/regeneration reuses the stable week id');
  assert.strictEqual(Object.keys(secondServer.plans).length,1,'retry creates no duplicate plan');
  assert.strictEqual(Object.keys(secondServer.occurrences).length,1,'retry creates no duplicate occurrence');
  assert.strictEqual(secondServer.plans[first.planId].createdAt,createdAt);
  assert.strictEqual(secondServer.plans[first.planId].generationRevision,2);
  assert.strictEqual(harness.repository.getPlan(first.planId).id,first.planId);
  assert.strictEqual(harness.repository.getOccurrence(first.activeOccurrenceIds[0]).id,first.activeOccurrenceIds[0]);

  harness.advanceContextWithoutRepositoryEcho();
  await assert.rejects(()=>harness.repository.saveDraftPlan(concept),/CLEANING_REPOSITORY_CONTEXT_NOT_READY/,'a stale repository snapshot cannot be written into a newly active context');
  assert.strictEqual(harness.transactionCalls(),2,'context drift is rejected before starting a Firebase transaction');

  console.log('cleaning-plan-repository-contract: ok');
})().catch((error)=>{console.error(error);process.exitCode=1;});
