'use strict';
const fs=require('fs');
const assert=require('assert');
const commands=fs.readFileSync('src/modules/cleaning/cleaningOccurrenceCommandsV23.js','utf8');
const controls=fs.readFileSync('src/modules/cleaning/cleaningOccurrenceControlsV23.js','utf8');
const loader=fs.readFileSync('src/modules/cleaning/cleaningPremiumFeedback.js','utf8');
const screen=fs.readFileSync('src/modules/cleaning/cleaningScreen.js','utf8');

assert.ok(commands.includes("VERSION='2.3.0'"));
assert.ok(controls.includes("VERSION='2.3.0'"));
assert.ok(loader.includes("cleaningOccurrenceCommandsV23.js?v=1"));
assert.ok(loader.includes("cleaningOccurrenceControlsV23.js?v=1"));
assert.ok(loader.includes("version:'2.2.1'"),'accepted visual bridge marker must remain v2.2.1');

// Architecture: no second raw Firebase listener, popup owner or observer.
[commands,controls].forEach(source=>{
  assert.ok(!source.includes(".on('value'"));
  assert.ok(!source.includes('MutationObserver'));
  assert.ok(!source.includes('setInterval('));
  assert.ok(!source.includes("document.addEventListener('click'"));
  assert.ok(!source.includes('TaskDetailPopup'));
});
assert.ok(!controls.includes('document.body.appendChild'));
assert.ok(controls.includes("document.getElementById('cleaning-v2-sheet')"));
assert.ok(controls.includes("sheet.addEventListener('click',click)"));

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
assert.ok(controls.includes('Ander moment / persoon'));
assert.ok(controls.includes('Doorschuiven'));
assert.ok(controls.includes('Deze keer overslaan'));
assert.ok(commands.includes("finalizeIncompleteV23"));
assert.ok(commands.includes("adjustOccurrenceV23"));
assert.ok(commands.includes("laterThisWeekV23"));
assert.ok(commands.includes("cleaning/completionLogs/"));
assert.ok(commands.includes("syncProjection(resultRow,write,mode)"));
assert.ok(commands.includes("syncProjection(row,write,'ADJUST')"));

// Primary accepted V2 screen remains untouched by this milestone's source.
assert.ok(screen.includes("const VERSION='2.0.0'"));
assert.ok(!screen.includes('CleaningOccurrenceCommandsV23'));

console.log('Cleaning V2.3 occurrence adjustment/hardening architecture contract: PASS');