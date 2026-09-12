'use strict';
const assert=require('assert');
const fs=require('fs');
function read(p){return fs.readFileSync(p,'utf8');}

const finish=read('src/modules/tasks/tasksPremiumWarmV2Finish.js');
const shell=read('api/app-v8.js');
const vercel=read('vercel.json');
const canonical=read('src/modules/tasks/taskDetailPopup.js');

assert(finish.includes("window.__tasksPremiumWarmV2Finish=true"),'finishing-pass guard missing');
assert(finish.includes('Kleine taken, een rustiger thuis'),'approved banner quote missing');
assert(finish.includes('tpw2-photo-thumb'),'photographic task thumbnail treatment missing');
assert(finish.includes('/src/assets/cleaning-rooms/bathroom-light.webp'),'bathroom thumbnail mapping missing');
assert(finish.includes('/src/assets/cleaning-rooms/kids-room-light.webp'),'kids-room thumbnail mapping missing');
assert(finish.includes('/src/assets/task-heroes/market.webp'),'groceries thumbnail mapping missing');
assert(finish.includes('/src/assets/cleaning-rooms/laundry-light.webp'),'laundry thumbnail mapping missing');
assert(finish.includes('Markeer als klaar'),'approved primary CTA copy missing');
assert(finish.includes('Uitstellen'),'postpone action presentation missing');
assert(finish.includes('Bewerken'),'edit action presentation missing');
assert(!/firebase\.|TaskSharedData\.(update|create|remove)|taskData\.push|taskData\.splice/.test(finish),'finishing pass must remain presentation-only');

assert(shell.includes('/src/modules/tasks/tasksPremiumWarmV2Finish.js?v=1'),'v8 shell must serve finishing pass');
assert(vercel.includes('"dest": "/api/app-v8"'),'root route must point at v8 shell');
assert(canonical.includes('TaskSharedData.update'),'canonical TaskDetailPopup must retain mutation ownership');
assert(canonical.includes('tdp-postpone-btn'),'canonical popup must retain the additive postpone control');

console.log('Tasks premium warm v2.3 finishing contract: PASS');
