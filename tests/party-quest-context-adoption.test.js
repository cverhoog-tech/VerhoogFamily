'use strict';
const fs=require('fs');
const assert=require('assert');
const app=fs.readFileSync('api/app.js','utf8');
const service=fs.readFileSync('src/modules/tasks/partyQuestContextService.js','utf8');
const active=fs.readFileSync('src/modules/tasks/partyQuestActiveContextView.js','utf8');
const reward=fs.readFileSync('src/modules/tasks/partyQuestCompletionReward.js','utf8');
const projector=fs.readFileSync('src/modules/tasks/partyQuestNotificationProjector.js','utf8');

assert(app.includes('partyQuestContextService.js'),'context service must load');
assert(app.includes('partyQuestActiveContextView.js'),'context active view must load');
assert(app.includes('partyQuestContextUi.js'),'context UI must load');
assert(!app.includes('partyQuestInvites.js?v='),'legacy direct-Firebase invite runtime must not load');
assert(!app.includes('partyQuestActiveView.js?v='),'legacy direct-Firebase active view must not load');
assert(service.includes("COLLECTION='partyQuests'"));
assert(service.includes('FamilyDataStore'));
assert(service.includes('HouseholdContext'));
assert(service.includes('transactSharedPath'));
[active,reward,projector].forEach(src=>{
  assert(!/families\s*['"+]/.test(src),'party quest consumers must not construct family Firebase paths');
  assert(!src.includes("/partyQuests/"),'party quest consumers must not use raw party quest paths');
});
console.log('party-quest-context-adoption: PASS');
