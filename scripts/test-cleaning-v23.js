'use strict';
const fs=require('fs');
const assert=require('assert');
const commands=fs.readFileSync('src/modules/cleaning/cleaningOccurrenceCommandsV23.js','utf8');
const controls=fs.readFileSync('src/modules/cleaning/cleaningOccurrenceControlsV23.js','utf8');
const assignments=fs.readFileSync('src/modules/cleaning/cleaningAssignmentExperienceV25.js','utf8');
const loader=fs.readFileSync('src/modules/cleaning/cleaningCompanionLoader.js','utf8');
const premium=fs.readFileSync('src/modules/cleaning/cleaningPremiumFeedback.js','utf8');
const screen=fs.readFileSync('src/modules/cleaning/cleaningScreen.js','utf8');

assert.ok(commands.includes("VERSION='2.3.0'"));
assert.ok(controls.includes("VERSION='2.3.0'"));
assert.ok(assignments.includes("VERSION='2.5.0'"));
assert.ok(loader.includes("cleaningOccurrenceCommandsV23.js?v=2"));
assert.ok(loader.includes("cleaningOccurrenceControlsV23.js?v=2"));
assert.ok(loader.includes("cleaningAssignmentExperienceV25.js?v=1"));
assert.ok(loader.includes("version:'2.5.0'"));
assert.ok(premium.includes("version:'2.2.1'"),'accepted visual bridge marker must remain v2.2.1');

// Architecture: no second raw Firebase listener, popup owner or observer.
[commands,controls,assignments].forEach(source=>{
  assert.ok(!source.includes(".on('value'"));
  assert.ok(!source.includes('MutationObserver'));
  assert.ok(!source.includes('setInterval('));
  assert.ok(!source.includes("document.addEventListener('click'"));
  assert.ok(!source.includes('TaskDetailPopup'));
});
assert.ok(!controls.includes('document.body.appendChild'));
assert.ok(controls.includes("document.getElementById('cleaning-v2-sheet')"));
assert.ok(controls.includes("sheet.addEventListener('click',click)"));
assert.ok(assignments.includes("screen.addEventListener('click',onScreenClick,true)"));
assert.ok(assignments.includes("r.subscribe(onRepo)"));

// Canonical occurrence safety.
assert.ok(commands.includes('HOUSEHOLD_CONTEXT_CHANGED'));
assert.ok(commands.includes('CLEANING_V23_HOUSEHOLD_CONFLICT'));
assert.ok(commands.includes('CLEANING_V23_ROOM_ARCHIVED'));
assert.ok(commands.includes('CLEANING_V23_COLLAB_PENDING'));
assert.ok(commands.includes("ref.transaction(function(server)"));
assert.ok(commands.includes('v23Revision'));
assert.ok(commands.includes('busy=new Set()'));
assert.ok(commands.includes('duplicateTap:true'));

// Product behavior required by V2.3.
assert.ok(controls.includes('Later deze week'));
assert.ok(controls.includes('Moment / personen'));
assert.ok(controls.includes('Doorschuiven'));
assert.ok(controls.includes('Deze keer overslaan'));
assert.ok(commands.includes("finalizeIncompleteV23"));
assert.ok(commands.includes("adjustOccurrenceV23"));
assert.ok(commands.includes("laterThisWeekV23"));
assert.ok(commands.includes("cleaning/completionLogs/"));
assert.ok(commands.includes("syncProjection(resultRow,write,mode)"));
assert.ok(commands.includes("syncProjection(row,write,'ADJUST')"));

// V2.5 explicit multi-person assignment extension.
assert.ok(commands.includes('normalizeAssigneeUids'));
assert.ok(commands.includes("setOccurrenceAssigneesV25"));
assert.ok(commands.includes("setRoutineAssigneesV25"));
assert.ok(commands.includes("applyRoutineDefaultsV25"));
assert.ok(commands.includes("assignedToUids"));
assert.ok(commands.includes("names.join(' & ')"));
assert.ok(controls.includes('name="assigneeUids"'));
assert.ok(controls.includes("data-cv23-assignees-open"));
assert.ok(controls.includes("data.getAll('assigneeUids')"));
assert.ok(assignments.includes('data-ca25-member-filter'));
assert.ok(assignments.includes('ca25-routine-assignment'));
assert.ok(assignments.includes('ca25RoutineAssignee'));
assert.ok(assignments.includes('HouseholdIdentityFirebaseBridge'));
assert.ok(assignments.includes('avatarUrl'));
assert.ok(assignments.includes('setRoutineAssigneesV25'));
assert.ok(assignments.includes('applyRoutineDefaultsV25'));

// Primary accepted V2 screen remains the canonical core and is not replaced.
assert.ok(screen.includes("const VERSION='2.0.0'"));
assert.ok(!screen.includes('CleaningOccurrenceCommandsV23'));

console.log('Cleaning V2.3 + V2.5 assignment/hardening architecture contract: PASS');
