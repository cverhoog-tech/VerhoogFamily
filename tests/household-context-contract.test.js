'use strict';
const fs=require('fs');
const vm=require('vm');
const assert=require('assert');

const listeners={};
const window={
  fbUser:null,
  fbFamilyId:null,
  HouseholdIdentityFirebaseBridge:{getMembers:()=>[]},
  addEventListener(name,fn){(listeners[name]||(listeners[name]=[])).push(fn);},
  dispatchEvent(){},
};
const auth={currentUser:null,onAuthStateChanged(fn){this._fn=fn;}};
const firebase={auth:()=>auth};
const context={window,firebase,console,Date,Object,Array,String,Error,CustomEvent:function(){}};
vm.createContext(context);
vm.runInContext(fs.readFileSync('src/core/householdContext.js','utf8'),context,{filename:'householdContext.js'});
const hc=window.HouseholdContext;

function throwsCode(fn,code){let got=null;try{fn();}catch(e){got=e&&e.code;}assert.equal(got,code);}

// No auth: both guards must fail explicitly.
throwsCode(()=>hc.requireUser(),'AUTH_REQUIRED');
throwsCode(()=>hc.requireHousehold(),'AUTH_REQUIRED');
assert.deepEqual(hc.capture(),{uid:null,householdId:null});

// Signed in, but no household: user is available, household is not.
window.fbUser={uid:'alpha-user'};auth.currentUser=window.fbUser;
assert.equal(hc.requireUser(),'alpha-user');
throwsCode(()=>hc.requireHousehold(),'HOUSEHOLD_REQUIRED');

// Active household context.
window.fbFamilyId='alpha-household';
window.HouseholdIdentityFirebaseBridge.getMembers=()=>[{uid:'alpha-user',status:'active',role:'owner'}];
assert.equal(hc.requireHousehold(),'alpha-household');
let token=hc.capture();
assert.deepEqual(token,{uid:'alpha-user',householdId:'alpha-household'});
assert.equal(hc.isCurrent(token),true);
assert.equal(hc.sharedPath('recipes'),'families/alpha-household/shared/recipes');
assert.equal(hc.privatePath('preferences'),'users/alpha-user/private/preferences');
assert.equal(hc.current().ready,true);

// Household switch invalidates captured context.
window.fbFamilyId='beta-household';
window.HouseholdIdentityFirebaseBridge.getMembers=()=>[{uid:'alpha-user',status:'active',role:'adult'}];
assert.equal(hc.isCurrent(token),false);
throwsCode(()=>hc.assertContext(token),'HOUSEHOLD_CONTEXT_CHANGED');

// Account switch also invalidates context and rebinds private path.
window.fbUser={uid:'beta-user'};auth.currentUser=window.fbUser;
window.HouseholdIdentityFirebaseBridge.getMembers=()=>[{uid:'beta-user',status:'active',role:'owner'}];
assert.equal(hc.privatePath('preferences'),'users/beta-user/private/preferences');
throwsCode(()=>hc.assertContext({uid:'alpha-user'}),'USER_CONTEXT_CHANGED');

// Explicit removed/inactive membership blocks household access.
window.HouseholdIdentityFirebaseBridge.getMembers=()=>[{uid:'beta-user',status:'removed',role:'adult'}];
throwsCode(()=>hc.requireHousehold(),'HOUSEHOLD_ACCESS_REVOKED');
assert.equal(hc.current().ready,false);

// Subscribers receive lifecycle changes and can detach.
let seen=0;const off=hc.subscribe(()=>seen++);const before=seen;
window.fbFamilyId=null;
(listeners['familyapp:household-identity-detached']||[]).forEach(fn=>fn());
assert(seen>before);
off();
const stopped=seen;
window.fbFamilyId='gamma-household';
(listeners['familyapp:household-identity-synced']||[]).forEach(fn=>fn());
assert.equal(seen,stopped);

console.log('household-context-contract: PASS');
