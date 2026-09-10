'use strict';
const assert=require('assert');
const fs=require('fs');
const vm=require('vm');
const path=require('path');

function loadContext(){
  const events=[];
  const sessionListeners=[];
  const window={
    addEventListener(){},
    dispatchEvent(evt){events.push(evt);},
    AuthenticatedSessionController:{
      subscribe(fn){sessionListeners.push(fn);fn({state:'signedOut',generation:1,uid:null,householdId:null,ready:false});return()=>{const i=sessionListeners.indexOf(fn);if(i>=0)sessionListeners.splice(i,1);};}
    }
  };
  function CustomEvent(type,opts){this.type=type;this.detail=opts&&opts.detail;}
  const sandbox={window,CustomEvent,console,Object,String,Number,Error};
  vm.createContext(sandbox);
  const source=fs.readFileSync(path.join(__dirname,'../src/core/householdContext.js'),'utf8');
  vm.runInContext(source,sandbox,{filename:'householdContext.js'});
  return {ctx:window.HouseholdContext,sessionListeners,events};
}

(function(){
  const {ctx,sessionListeners}=loadContext();
  assert(ctx,'HouseholdContext should be installed');
  assert.strictEqual(ctx.snapshot().ready,false);
  assert.strictEqual(sessionListeners.length,1,'context must subscribe once to canonical session');

  sessionListeners[0]({state:'ready',generation:2,uid:'u1',householdId:'h1',ready:true,user:{uid:'u1'}});
  const first=ctx.snapshot();
  assert.strictEqual(first.uid,'u1');
  assert.strictEqual(first.householdId,'h1');
  assert.strictEqual(first.ready,true);
  assert.strictEqual(ctx.householdPath('tasks'),'families/h1/tasks');
  assert.strictEqual(ctx.sharedPath('recipes'),'families/h1/shared/recipes');
  assert.strictEqual(ctx.memberPath(null,'profile'),'families/h1/members/u1/profile');
  assert.strictEqual(ctx.userPath('settings'),'users/u1/settings');

  const token=ctx.capture();
  assert.strictEqual(ctx.isCurrent(token),true,'fresh capture should be current');

  sessionListeners[0]({state:'ready',generation:3,uid:'u1',householdId:'h2',ready:true,user:{uid:'u1'}});
  const second=ctx.snapshot();
  assert.strictEqual(second.householdId,'h2','household switch must rebind context');
  assert(second.revision>first.revision,'household switch must advance revision');
  assert.strictEqual(ctx.isCurrent(token),false,'old async capture must become stale after household switch');

  const token2=ctx.capture();
  sessionListeners[0]({state:'signedOut',generation:4,uid:null,householdId:null,ready:false,user:null});
  assert.strictEqual(ctx.snapshot().ready,false);
  assert.strictEqual(ctx.snapshot().uid,null);
  assert.strictEqual(ctx.isCurrent(token2),false,'sign-out must invalidate prior captures');
  assert.throws(()=>ctx.requireUser(),/AUTHENTICATED_USER_REQUIRED/);
  assert.throws(()=>ctx.requireHousehold(),/ACTIVE_HOUSEHOLD_REQUIRED/);

  console.log('household-context-contract: ok');
})();
