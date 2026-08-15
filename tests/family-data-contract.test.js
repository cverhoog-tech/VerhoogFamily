'use strict';
const fs=require('fs');
const vm=require('vm');
const assert=require('assert');

const window={
  HouseholdContext:{
    sharedPath:(c)=>'families/alpha/shared/'+c,
    privatePath:(c)=>'users/alpha/private/'+c
  }
};
const context={window,console,Object,Error,String};
vm.createContext(context);
vm.runInContext(fs.readFileSync('src/core/familyDataContract.js','utf8'),context,{filename:'familyDataContract.js'});
const c=window.FamilyDataContract;

assert.equal(c.shared('tasks').path,'families/alpha/shared/tasks');
assert.equal(c.shared('shoppingLists').path,'families/alpha/shared/shoppingLists');
assert.equal(c.private('progression').path,'users/alpha/private/progression');
assert.equal(c.sharedRecord('recipes','r1').path,'families/alpha/shared/recipes/r1');
assert.equal(c.privateRecord('drafts','d1').path,'users/alpha/private/drafts/d1');

let err=null;try{c.shared('unknown');}catch(e){err=e.code;}assert.equal(err,'UNKNOWN_SHARED_COLLECTION');
err=null;try{c.private('unknown');}catch(e){err=e.code;}assert.equal(err,'UNKNOWN_PRIVATE_COLLECTION');
assert.throws(()=>c.sharedRecord('tasks',''),/RECORD_ID_REQUIRED/);
assert.throws(()=>c.privateRecord('preferences',null),/RECORD_ID_REQUIRED/);

// Contract maps are immutable so modules cannot redefine canonical collection names at runtime.
assert(Object.isFrozen(c.sharedCollections));
assert(Object.isFrozen(c.privateCollections));

console.log('family-data-contract: PASS');
