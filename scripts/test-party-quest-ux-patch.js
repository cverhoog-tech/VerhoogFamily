'use strict';
const fs=require('fs');
const assert=require('assert');
const vm=require('vm');

const invites=fs.readFileSync('src/modules/tasks/partyQuestInvites.js','utf8');
const active=fs.readFileSync('src/modules/tasks/partyQuestActiveView.js','utf8');
const loader=fs.readFileSync('api/app.js','utf8');

// Parse both browser modules so malformed UI strings fail CI immediately.
new vm.Script(invites,{filename:'partyQuestInvites.js'});
new vm.Script(active,{filename:'partyQuestActiveView.js'});

// Existing Party Quest state may never block starting another Party Quest.
assert.ok(invites.includes('startNew:startNew'),'invite facade must expose startNew');
assert.ok(invites.includes('＋ Nieuwe Party Quest'),'status UI must expose a new Party Quest action');
assert.ok(active.includes('PartyQuestInvites.startNew'),'active Party Quest view must delegate new starts to the invite facade');
assert.ok(active.includes('data-new-party'),'active Party Quest overlay must expose the new-start control');

// New tasks must use the one canonical premium task-create UI and return via
// the canonical shared task projection rather than creating a second task form.
assert.ok(invites.includes("TaskDetailPopup.openCreate()"),'Party Quest must open the canonical premium task creator');
assert.ok(invites.includes("window.addEventListener('familyapp:tasks-updated'"),'Party Quest must wait for the canonical task projection');
assert.ok(invites.includes('taskCreateHandoff'),'task-create return must be an explicit guarded handoff');
assert.ok(invites.includes('contextIdentity'),'task-create handoff must be scoped to HouseholdContext identity');
assert.ok(invites.includes('existing[String(id)]'),'handoff must distinguish a newly created task from pre-existing tasks');
assert.ok(invites.includes('chooseQuests(id)'),'newly created task must return to the Party Quest chooser preselected');
assert.ok(invites.includes('Nieuwe quest maken'),'chooser must offer direct quest creation');

// Meaningful Arcana task artwork reuses the existing canonical task icon family.
assert.ok(invites.includes('TaskCategoryIcons.detect'),'chooser must derive meaningful task categories');
assert.ok(invites.includes('TaskCategoryIcons.icon'),'chooser must render canonical RPG/Arcana task artwork');
assert.ok(active.includes('TaskCategoryIcons.detect'),'active Party Quest cards must derive task categories');
assert.ok(active.includes('TaskCategoryIcons.icon'),'active Party Quest cards must render canonical RPG/Arcana artwork');
assert.ok(!invites.includes('class="pqi-qicon">✦'),'generic sparkle chooser icon must be removed');

// Architecture boundaries stay intact.
['firebase.database','firebase.auth','fbFamilyId','fbUser','localStorage'].forEach(token=>{
  assert.ok(!invites.includes(token),'invite UI must not introduce legacy/direct authority: '+token);
  assert.ok(!active.includes(token),'active UI must not introduce legacy/direct authority: '+token);
});
assert.ok(invites.includes('PartyQuestService'),'mutations must still delegate to PartyQuestService');
assert.ok(invites.includes('PartyQuestRepository'),'reads must still use PartyQuestRepository');
assert.ok(invites.includes("getById:getById,revokeInvite:revokeInvite,respond:respond"),'frozen NotificationActions compatibility facade must remain intact');

// Runtime cache busts only the UX modules; frozen notification and future
// completion/reward layers remain untouched by this patch.
assert.ok(loader.includes('partyQuestInvites.js?v=7'),'runtime must serve PartyQuestInvites v7');
assert.ok(loader.includes('partyQuestActiveView.js?v=7'),'runtime must serve PartyQuestActiveView v7');
assert.ok(loader.includes('partyQuestHelpUi.js?v=1'),'STEP 11.4 help UI must remain on its accepted runtime key');
assert.ok(loader.includes('partyQuestCompletionReward.js?v=3'),'STEP 11.5 completion/reward work must not start in this patch');
assert.ok(loader.includes('notificationActions.js?v=4'),'frozen notification actions runtime must remain unchanged');
assert.ok(loader.includes('partyQuestNotificationProjector.js?v=2'),'frozen Party Quest projector runtime must remain unchanged');

console.log('party quest UX patch: PASS');