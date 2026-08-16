'use strict';
const fs=require('fs');
const vm=require('vm');
const assert=require('assert');

const winEvents={},docEvents={};
const window={
  fbUser:{uid:'user-alpha',email:'secret@example.com',displayName:'Secret Name'},
  fbFamilyId:'household-alpha',
  addEventListener(name,fn){(winEvents[name]||(winEvents[name]=[])).push(fn);},
  dispatchEvent(){},
  AuthSessionBootstrap:{status(){return{started:true,uid:'user-alpha',bootedUid:'user-alpha'};}},
  HouseholdContext:{current(){return{uid:'user-alpha',householdId:'household-alpha',role:'adult'};}}
};
const document={visibilityState:'visible',addEventListener(name,fn){(docEvents[name]||(docEvents[name]=[])).push(fn);}};
const navigator={onLine:true};
const context={window,document,navigator,console,CustomEvent:function(){},Date,Math,Object,Array,String,JSON};
vm.createContext(context);
vm.runInContext(fs.readFileSync('src/core/clientObservability.js','utf8'),context,{filename:'clientObservability.js'});

window.FamilyObservability.record('beta-feedback',{
  name:'Secret Name',email:'secret@example.com',amount:123.45,body:'private family note',
  uid:'user-alpha',householdId:'household-alpha',module:'profile',code:'TEST_CODE',screen:'home'
});
window.FamilyObservability.error({name:'TypeError',message:'Secret Name secret@example.com',code:'BOOM'},{module:'tasks'});

const snap=window.FamilyObservability.snapshot();
const json=JSON.stringify(snap);
assert(!json.includes('Secret Name'));
assert(!json.includes('secret@example.com'));
assert(!json.includes('123.45'));
assert(!json.includes('private family note'));
assert(!json.includes('user-alpha'));
assert(!json.includes('household-alpha'));
assert(json.includes('TEST_CODE'));
assert(json.includes('tasks'));
assert(snap.events.length>=3);
console.log('client-observability-privacy: PASS');