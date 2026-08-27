'use strict';
const fs=require('fs');
const assert=require('assert');
const vm=require('vm');

function read(path){return fs.readFileSync(path,'utf8');}
function tick(){return new Promise(resolve=>setTimeout(resolve,0));}

const repoSource=read('src/modules/tasks/taskHouseholdRepository.js');
const facadeSource=read('src/modules/tasks/taskSharedData.js');
const guardSource=read('src/modules/tasks/taskLegacySyncGuard.js');
const loaderSource=read('api/app.js');
const rules=JSON.parse(read('database.rules.json'));

// Static architecture contract.
assert.ok(repoSource.includes("families/'+ctx.householdId+'/tasks"),'canonical task path must be families/{householdId}/tasks');
assert.ok(repoSource.includes('HouseholdContext.capture'),'task repository must capture household context before binding/mutations');
assert.ok(repoSource.includes('HouseholdContext.isCurrent'),'task repository must reject stale household context');
assert.ok(repoSource.includes("active.ref.off('value',active.handler)"),'task repository must detach the exact previous Firebase listener');
assert.ok(repoSource.includes("families/'+binding.context.householdId+'/shared/tasks"),'migration may only read the same household legacy shared/tasks path');
assert.ok(repoSource.includes('taskMigrations/v2SharedToCanonical'),'legacy reconciliation must use a persistent sibling migration marker');
assert.ok(!/fam_tasks_v0|familieapp_state_v024/.test(repoSource),'canonical repository must never seed from generic legacy local task storage');
assert.ok(!repoSource.includes('FamilyDataStore'),'canonical task repository must own its Firebase listener directly');
assert.ok(facadeSource.includes('TaskHouseholdRepository'),'TaskSharedData must be a compatibility facade over the canonical repository');
assert.ok(!facadeSource.includes('subscribeShared'),'TaskSharedData must not create its own shared Firebase listener');
assert.ok(!facadeSource.includes('FamilyDataStore'),'TaskSharedData must not retain the old persistence owner');
assert.ok(!guardSource.includes('data.tasks'),'legacy family-root sync must not project tasks');
assert.ok(!/tasks\s*:/.test(guardSource),'legacy family-root sync must not write a tasks payload');
const repoIndex=loaderSource.indexOf('taskHouseholdRepository.js?v=1');
const facadeIndex=loaderSource.indexOf('taskSharedData.js?v=5');
const guardIndex=loaderSource.indexOf('taskLegacySyncGuard.js?v=3');
const sessionIndex=loaderSource.indexOf('authenticatedSessionController.js?v=4');
assert.ok(repoIndex>=0&&facadeIndex>repoIndex,'runtime must load task repository before TaskSharedData');
assert.ok(guardIndex>=0&&sessionIndex>guardIndex,'legacy task sync guard must load before session bootstrap');
assert.ok(rules.rules.families.$familyId.$sharedData,'family rules must protect canonical task child through active-member family wildcard');
assert.ok(String(rules.rules.families.$familyId.$sharedData['.write']).includes("members').child(auth.uid).child('status').val() === 'active'"),'canonical task writes must require active household membership');

// Dynamic lifecycle/isolation contract.
function makeStorage(seed){
  const map=new Map(Object.entries(seed||{}));
