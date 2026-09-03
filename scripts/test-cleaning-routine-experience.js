'use strict';
const assert=require('assert');
const fs=require('fs');
const path=require('path');
const vm=require('vm');

const source=fs.readFileSync(path.join(__dirname,'..','src','modules','cleaning','cleaningRoutineExperience.js'),'utf8');
const context={
  console,Date,
  setTimeout:(fn)=>{fn();return 1;},clearTimeout:()=>{},requestAnimationFrame:(fn)=>{fn();return 1;},
  addEventListener:()=>{},dispatchEvent:()=>{},
  MutationObserver:function(cb){this.observe=()=>{};this.disconnect=()=>{};this.callback=cb;},
  CSS:{escape:(value)=>String(value)},
  HouseholdContext:{snapshot:()=>({ready:true,uid:'u1',householdId:'family-1'})},
  HouseholdIdentityFirebaseBridge:{getMembers:()=>[{uid:'u1',displayName:'Shane',status:'active'},{uid:'u2',displayName:'Esra',status:'active'}]},
  CleaningDomain:{basePath:(id)=>'families/'+id+'/cleaning'},
  document:{
    documentElement:{},
    head:{appendChild:()=>{}},
    getElementById:()=>null,
    createElement:()=>({id:'',textContent:'',className:'',setAttribute:()=>{},appendChild:()=>{},querySelector:()=>null,querySelectorAll:()=>[]}),
    querySelector:()=>null,
    querySelectorAll:()=>[],
    addEventListener:()=>{}
  }
};
context.window=context;
vm.runInNewContext(source,context,{filename:'cleaningRoutineExperience.js'});
const experience=context.CleaningRoutineExperience;
assert.strictEqual(experience.version,'0.2.0');

const request=experience._assignmentPatch({assignee:'u2',repeatScope:'ONGOING'},null);
assert.strictEqual(request.assignmentMode,'REQUESTED');
assert.strictEqual(request.assignmentRequestStatus,'PENDING');
assert.strictEqual(request.preferredAssigneeUid,'u2');
assert.strictEqual(request.paused,true,'requested routine stays out of planning until the recipient accepts');
assert.strictEqual(request.repeatScope,'ONGOING');

const self=experience._assignmentPatch({assignee:'u1',repeatScope:'THIS_WEEK'},null);
assert.strictEqual(self.assignmentMode,'FIXED_PERSON');
assert.strictEqual(self.assignmentRequestStatus,'ACCEPTED');
assert.strictEqual(self.paused,false);
assert.strictEqual(self.repeatScope,'THIS_WEEK');
assert.ok(Number(self.repeatScopeWeekStartAt)>0);
assert.ok(Number(self.repeatScopeWeekEndAt)>Number(self.repeatScopeWeekStartAt));

const acceptedExisting=experience._assignmentPatch({assignee:'u2',repeatScope:'ONGOING'},{preferredAssigneeUid:'u2',assignmentRequestStatus:'ACCEPTED',assignmentAcceptedAt:123});
assert.strictEqual(acceptedExisting.assignmentRequestStatus,'ACCEPTED','editing an accepted assignment must not silently request it again');
assert.strictEqual(acceptedExisting.assignmentAcceptedAt,123);

assert.ok(source.includes('.cleaning-room-card:not(.is-expanded)'));
assert.ok(source.includes('data-cleaning-room-expand'));
assert.ok(source.includes('data-cleaning-routine-assign'));
assert.ok(source.includes('Wie doet deze routine?'));
assert.ok(source.includes('vier weken vooruit'));
assert.ok(source.includes('data-cleaning-routine-request-accept'));
assert.ok(source.includes('data-cleaning-routine-request-decline'));
assert.ok(source.includes("scrollIntoView({behavior:'smooth',block:'start'})"));

console.log('cleaning compact rooms, edit scroll and routine request UX: ok');
