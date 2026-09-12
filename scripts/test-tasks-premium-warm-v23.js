'use strict';
const assert=require('assert');
const fs=require('fs');
function read(p){return fs.readFileSync(p,'utf8');}

const shell=read('api/app-v7.js');
const vercel=read('vercel.json');
const model=read('src/modules/tasks/v3/taskPresentationModelV3.js');
const overview=read('src/modules/tasks/v3/taskOverviewV3.js');
const detail=read('src/modules/tasks/v3/taskDetailV3.js');
const polish=read('src/styles/tasksV3Polish.css');

assert(vercel.includes('"dest": "/api/app-v7"'),'root route must remain on canonical v7 shell');
assert(shell.includes('/src/styles/tasksV3.css?v=2'),'canonical v7 shell must serve V3 stylesheet');
assert(shell.includes('/src/styles/tasksV3Polish.css?v=1'),'canonical v7 shell must serve V3 reference polish');
assert(shell.includes('/src/modules/tasks/v3/taskPresentationModelV3.js?v=3'),'canonical v7 shell must serve fresh V3 model first');
assert(shell.includes('/src/modules/tasks/v3/taskOverviewV3.js?v=2'),'canonical v7 shell must serve V3 overview');
assert(shell.includes('/src/modules/tasks/v3/taskDetailV3.js?v=2'),'canonical v7 shell must serve V3 detail');
assert(!shell.includes('tasksPremiumWarmV2.js'),'legacy warm decorator must be de-wired');
assert(!shell.includes('tasksPremiumModernV1.js'),'legacy modern decorator must be de-wired');

assert(model.includes('/src/assets/cleaning-rooms/bathroom-light.webp'),'bathroom photo mapping missing');
assert(model.includes('/src/assets/cleaning-rooms/kids-room-light.webp'),'kids-room photo mapping missing');
assert(model.includes('/src/assets/task-heroes/market.webp'),'grocery photo mapping missing');
assert(model.includes('/src/assets/cleaning-rooms/laundry-light.webp'),'laundry photo mapping missing');
assert(model.includes('/src/assets/cleaning-rooms/outdoor-light.webp'),'outdoor photo mapping missing');
assert(model.includes('isCleaningTask'),'Cleaning room photo priority missing');
assert(model.includes('displayTitle'),'human Cleaning display title missing');
assert(overview.includes("version:'3.0.0'"),'overview V3 identity missing');
assert(detail.includes("var VERSION='3.0.1'"),'hardened detail V3 identity missing');
assert(polish.includes('aspect-ratio:1/1!important'),'round task/subtask control guard missing');
assert(!/TaskSharedData\.(update|create|remove)|\.set\(|\.ref\([^)]*\)\.(set|update|remove)/.test(overview),'V3 overview must remain presentation-only');
assert(!/TaskSharedData\.(update|create|remove)|\.set\(|\.ref\([^)]*\)\.(set|update|remove)/.test(model),'V3 model must remain read-only');

console.log('Tasks V3 canonical shell / room photography / compact polish contract: PASS');