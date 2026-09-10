'use strict';
const assert=require('assert');
const fs=require('fs');
const path=require('path');

const ROOT=path.join(__dirname,'..');
function read(rel){return fs.readFileSync(path.join(ROOT,rel),'utf8');}

const inbox=read('src/platform/inbox/actionInboxBootstrap.js');
const screen=read('src/modules/cleaning/cleaningScreen.js');
const templates=read('src/modules/cleaning/cleaningRoutineTemplates.js');
const experienceBootstrap=read('src/modules/cleaning/cleaningExperienceBootstrap.js');
const turn=read('src/modules/cleaning/cleaningTurnExperience.js');

// Action Inbox may eager-load Cleaning, but it must participate in the same ES
// module registry as the lazy Cleaning screen. A classic-script copy would have
// its own closure/listeners even when the URL text is otherwise identical.
assert.match(inbox,/return import\(src\)/,'Action Inbox Cleaning dependencies must use dynamic import()');
assert.doesNotMatch(inbox,/createElement\(['"]script['"]\)|data-action-inbox-boot/,'Action Inbox must not inject Cleaning dependencies as classic scripts');

// Exact versioned identities must match the canonical Cleaning graph.
assert.match(inbox,/cleaningPermissions\.js\?v=1/);
assert.match(experienceBootstrap,/cleaningPermissions\.js\?v=1/);
assert.match(inbox,/cleaningHouseholdRepository\.js\?v=7/);
assert.match(screen,/cleaningHouseholdRepository\.js\?v=7/);
assert.match(inbox,/cleaningHelpRequestUi\.js\?v=1/);
assert.match(experienceBootstrap,/cleaningHelpRequestUi\.js\?v=1/);
assert.match(inbox,/cleaningRoutineExperience\.js\?v=3/);
assert.match(templates,/cleaningRoutineExperience\.js\?v=3/);
assert.match(turn,/cleaningSupplyExperience\.js\?v=2/);
assert.match(templates,/cleaningSupplyExperience\.js\?v=2/);
assert.doesNotMatch(turn,/cleaningSupplyExperience\.js\?v=1/);

console.log('Cleaning canonical module identity guards OK');
