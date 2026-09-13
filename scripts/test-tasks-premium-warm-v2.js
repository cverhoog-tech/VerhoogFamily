'use strict';
const assert=require('assert');
const fs=require('fs');
function read(p){return fs.readFileSync(p,'utf8');}

const shell=read('api/app-v7.js');
const css=read('src/styles/tasksV3.css');
const overview=read('src/modules/tasks/v3/taskOverviewV3.js');
const detail=read('src/modules/tasks/v3/taskDetailV3.js');
const model=read('src/modules/tasks/v3/taskPresentationModelV3.js');
const shared=read('src/modules/tasks/taskSharedData.js');

// V2 visual layers are deliberately retired from the live shell.
assert(!shell.includes('/src/styles/tasksPremiumWarmV2.css'),'warm v2 stylesheet must not remain active');
assert(!shell.includes('/src/styles/tasksCleaningDetailV3.css'),'Cleaning-detail override must not remain active');
assert(!shell.includes('/src/modules/tasks/tasksPremiumWarmV2.js'),'warm v2 decorator must not remain active');

assert(css.includes('--tv3-bg:#f6f1e6'),'V3 warm ivory background token missing');
assert(css.includes('--tv3-green:#385f49'),'V3 FamilyApp green token missing');
assert(css.includes('.tv3-task-photo'),'V3 photographic task rows missing');
assert(css.includes('.tv3d-hero'),'V3 photo-first task detail missing');
assert(css.includes('.tv3e-sheet'),'V3 create/edit styling missing');
assert(css.includes('[data-theme*="dark"]'),'V3 dark mode support missing');

assert(overview.includes('Kleine taken, een rustiger thuis'),'approved quote banner missing');
assert(overview.includes('Nieuwe taak'),'approved create CTA missing');
assert(overview.includes('Alle taken'),'approved segmented filter missing');
assert(overview.includes('tv3-task-photo'),'overview must render photographic rows directly, not decorate legacy icons');
assert(detail.includes('Markeer als klaar'),'approved detail CTA missing');
assert(detail.includes('Uitstellen'),'approved postpone action missing');
assert(detail.includes('Bewerken'),'approved edit action missing');
assert(detail.includes('TaskSharedData.update'),'V3 detail must mutate through canonical TaskSharedData');
assert(detail.includes('window.toggleTask'),'V3 completion must preserve legacy reward/progression bridges');
assert(model.includes('CleaningTaskSupplyUi'),'V3 model must reuse Cleaning supply context without becoming Cleaning authority');
assert(shared.includes('window.TaskSharedData={'),'canonical task data facade must remain present');

console.log('Tasks warm v2 retirement / V3 visual contract: PASS');
