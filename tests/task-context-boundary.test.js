'use strict';
const fs=require('fs');
const vm=require('vm');
const assert=require('assert');

let ctx={uid:'alpha-user',householdId:'alpha-household',ready:true};
let pendingResolve=null;
let calls=0;
const events={};
const window={
  TaskSharedData:{
    create(task){calls++;return new Promise(resolve=>{pendingResolve=()=>resolve({ok:true,task});});},
    update(){return Promise.resolve(true);},
    remove(){return Promise.resolve(true);},
    requestHelp(){return Promise.resolve(true);},
    joinHelp(){return Promise.resolve(true);},
    leaveHelp(){return Promise.resolve(true);},
    retractHelp(){return Promise.resolve(true);}
  },
  HouseholdContext:{
    requireUser(){if(!ctx.uid){const e=new Error('AUTH_REQUIRED');e.code='AUTH_REQUIRED';throw e;}return ctx.uid;},
    requireHousehold(){if(!ctx.householdId){const e=new Error('HOUSEHOLD_REQUIRED');e.code='HOUSEHOLD_REQUIRED';throw e;}return ctx.householdId;},
    assertContext(expected){if(expected.uid!==ctx.uid||expected.householdId!==ctx.householdId||!ctx.ready){const e=new Error('HOUSEHOLD_CONTEXT_CHANGED');e.code='HOUSEHOLD_CONTEXT_CHANGED';throw e;}return Object.assign({},ctx);},
    isCurrent(token){return token.uid===ctx.uid&&token.householdId===ctx.householdId;},
    current(){return Object.assign({},ctx);}
  },
  addEventListener(name,fn){(events[name]||(events[name]=[])).push(fn);}
};
const context={window,console,Promise,Error,Object,Array,String,Date,Math};
vm.createContext(context);
vm.runInContext(fs.readFileSync('src/modules/tasks/taskContextBoundary.js','utf8'),context,{filename:'taskContextBoundary.js'});

(async()=>{
  assert(window.TaskContextBoundary,'boundary should install');
  const status=window.TaskContextBoundary.status();
  Object.keys(status.guarded).forEach(name=>assert.equal(status.guarded[name],true,name+' should be guarded'));

  const p=window.TaskSharedData.create({title:'Alpha task'});
  await Promise.resolve();
  assert.equal(calls,1,'underlying mutation should start once');

  // Switch context while the asynchronous mutation is still in flight.
  ctx={uid:'beta-user',householdId:'beta-household',ready:true};
  pendingResolve();
  await assert.rejects(p,err=>err&&err.code==='TASK_CONTEXT_CHANGED');

  // New mutations under Beta are accepted and use a fresh token.
  let betaResolve=null;
  window.TaskSharedData.create.__original=function(task){return new Promise(resolve=>{betaResolve=()=>resolve({ok:true,task});});};
  // The wrapper captured the original at install time, so use another guarded mutation for success proof.
  const ok=await window.TaskSharedData.update('task1',{done:true});
  assert.equal(ok,true);

  // Missing household must fail before reaching any underlying mutation.
  ctx={uid:'beta-user',householdId:null,ready:false};
  const before=calls;
  await assert.rejects(Promise.resolve().then(()=>window.TaskSharedData.create({title:'No household'})),err=>err&&err.code==='HOUSEHOLD_REQUIRED');
  assert.equal(calls,before,'mutation must not start without household context');

  console.log('task-context-boundary: PASS');
})().catch(err=>{console.error(err);process.exit(1);});
