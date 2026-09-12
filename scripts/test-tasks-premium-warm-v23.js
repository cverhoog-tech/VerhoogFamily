'use strict';
const assert=require('assert');
const fs=require('fs');
function read(p){return fs.readFileSync(p,'utf8');}

const ui=read('src/modules/tasks/tasksPremiumWarmV2.js');
const shell=read('api/app-v7.js');
const vercel=read('vercel.json');
const canonical=read('src/modules/tasks/taskDetailPopup.js');

assert(ui.includes("window.__tasksPremiumWarmV2=true"),'warm decorator guard missing');
assert(ui.includes("version:'2.3.0'"),'integrated v2.3 presentation version missing');
assert(ui.includes('Kleine taken, een rustiger thuis'),'approved banner quote missing');
assert(ui.includes('tpw2-photo-thumb'),'photographic task thumbnail treatment missing');
assert(ui.includes('/src/assets/cleaning-rooms/bathroom-light.webp'),'bathroom thumbnail mapping missing');
assert(ui.includes('/src/assets/cleaning-rooms/kids-room-light.webp'),'kids-room thumbnail mapping missing');
assert(ui.includes('/src/assets/task-heroes/market.webp'),'groceries thumbnail mapping missing');
assert(ui.includes('/src/assets/cleaning-rooms/laundry-light.webp'),'laundry thumbnail mapping missing');
assert(ui.includes('/src/assets/cleaning-rooms/outdoor-light.webp'),'outdoor thumbnail mapping missing');
assert(ui.includes('Markeer als klaar'),'approved primary CTA copy missing');
assert(ui.includes('Uitstellen'),'postpone action presentation missing');
assert(ui.includes('Bewerken'),'edit action presentation missing');
assert(!/firebase\.|TaskSharedData\.(update|create|remove)|taskData\.push|taskData\.splice/.test(ui),'warm presentation layer must remain presentation-only');

assert(shell.includes('/src/modules/tasks/tasksPremiumWarmV2.js?v=2'),'canonical v7 shell must serve warm task decorator');
assert(vercel.includes('"dest": "/api/app-v7"'),'root route must remain on canonical v7 shell');
assert(canonical.includes('TaskSharedData.update'),'canonical TaskDetailPopup must retain mutation ownership');
assert(canonical.includes('tdp-postpone-btn'),'canonical popup must retain the additive postpone control');

console.log('Tasks premium warm v2.3 integrated presentation contract: PASS');
