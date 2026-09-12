'use strict';
const assert=require('assert');
const fs=require('fs');
function read(p){return fs.readFileSync(p,'utf8');}
const css=read('src/styles/tasksPremiumWarmV2.css');
const ui=read('src/modules/tasks/tasksPremiumWarmV2.js');
const shell=read('api/app-v7.js');
const compact=read('src/modules/tasks/taskCompactHome.js');
const detail=read('src/modules/tasks/taskDetailPopup.js');

assert(css.includes('--tpw2-bg:#f7f3ea'),'approved warm ivory token missing');
assert(css.includes('--tpw2-pine:#244f3e'),'approved pine token missing');
assert(css.includes('.tpw2-head'),'v2 task overview header styling missing');
assert(css.includes('.tpw2-stats'),'v2 summary strip styling missing');
assert(css.includes('.tpw2-task-row'),'v2 task row styling missing');
assert(css.includes('#tdp-overlay.tpw2-overlay'),'v2 task detail sheet styling missing');
assert(css.includes('.tpw2-create-card'),'create/edit styling must remain in the same family');
assert(css.includes('[data-theme*="dark"]'),'dark mode fallback missing');
assert(css.includes('min-height:58px'),'overview must stay compact rather than card-heavy');
assert(css.includes('box-shadow:none'),'quiet premium treatment should avoid decorative shadow stacking');
assert(css.includes('.tdp-icon-ring{display:none'),'detail sheet must remove legacy fantasy badge chrome');
assert(css.includes('.tdp-hero:after{display:none'),'detail sheet must remove legacy hero overlay');

assert(ui.includes('window.__tasksPremiumWarmV2=true'),'v2 decorator guard missing');
assert(ui.includes('Array.isArray(window.taskData)?window.taskData:[]'),'v2 must read canonical taskData');
assert(ui.includes('TaskDetailPopup.openCreate()'),'new task action must delegate to canonical popup');
assert(ui.includes('data-range="all"'),'v2 should ask canonical overview to render all groups before presentation filtering');
assert(ui.includes('data-tpw2-filter'),'approved grouped filter controls missing');
assert(ui.includes('MutationObserver'),'v2 must survive canonical rerenders');
assert(ui.includes('tpw2-detail-card'),'task detail decorator missing');
assert(!/firebase\.|\.set\(|TaskSharedData\.update|TaskSharedData\.create|taskData\.push|taskData\.splice/.test(ui),'v2 presentation layer must not own persistence or task mutations');

assert(compact.includes('data-task-id'),'TaskCompactHome must remain the canonical overview owner');
assert(detail.includes('TaskSharedData.update'),'TaskDetailPopup must remain the mutation owner');
assert(shell.includes('/src/styles/tasksPremiumWarmV2.css?v=2'),'served shell must include quiet premium v2.1 stylesheet');
assert(shell.includes('/src/modules/tasks/tasksPremiumWarmV2.js?v=1'),'served shell must include warm v2 decorator');

console.log('Tasks premium warm v2.1 presentation contract: PASS');
