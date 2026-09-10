'use strict';
const assert=require('assert');
const fs=require('fs');
const path=require('path');
const ROOT=path.join(__dirname,'..');
function read(rel){return fs.readFileSync(path.join(ROOT,rel),'utf8');}
const inbox=read('src/platform/inbox/actionInboxBootstrap.js');
const screen=read('src/modules/cleaning/cleaningScreen.js');
const premium=read('src/modules/cleaning/cleaningPremiumFeedback.js');

assert.match(inbox,/ACTION INBOX BOOTSTRAP v2\.0\.0/);
assert.doesNotMatch(inbox,/modules\/cleaning|cleaningHouseholdRepository|cleaningRoutineExperience|cleaningHelpRequestUi|cleaningPermissions/,'global startup must not create a Cleaning module identity');
assert.match(screen,/cleaningPlannerContract\.js\?v=1/);
assert.match(screen,/cleaningPlanPersistenceContract\.js\?v=1/);
assert.doesNotMatch(screen,/cleaningHouseholdRepository\.js|cleaningRoutineTemplates\.js|cleaningExecutionWriteRuntime\.js|cleaningProjectionService\.js|cleaningTurnExperience\.js|cleaningSupplyExperience\.js/,'served v2 entry must not import legacy runtime identities');
assert.match(premium,/disabledForCleaningV2:true/);
assert.doesNotMatch(premium,/MutationObserver|addEventListener|setTimeout|setInterval/,'premium compatibility import must remain inert');
console.log('Cleaning v2 lazy module identity guards OK');
