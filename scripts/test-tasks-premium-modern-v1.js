'use strict';
const assert=require('assert');
const fs=require('fs');

function read(path){return fs.readFileSync(path,'utf8');}
const css=read('src/styles/tasksPremiumModernV1.css');
const components=read('src/styles/tasksPremiumModernV1Components.css');
const ui=read('src/modules/tasks/tasksPremiumModernV1.js');
const shell=read('api/app-v7.js');
const canonical=read('src/modules/tasks/taskOverviewCanonical.js');
const compact=read('src/modules/tasks/taskCompactHome.js');
const detail=read('src/modules/tasks/taskDetailPopup.js');

assert(css.includes('--tpm-pine:#0b3428'),'task brand must use the FamilyApp pine token');
assert(css.includes('--tpm-cream:#fbf7ed'),'task brand must use warm cream');
assert(css.includes('body[data-task-view="overview"] .tch-header'),'overview hero must be restyled through the canonical task view');
assert(css.includes('body[data-task-view="overview"] .tch-row'),'canonical task rows must receive the premium product treatment');
assert(css.includes('body[data-task-view="person"] .person-tab-v2'),'Person view must be part of the same visual system');
assert(css.includes('#tdp-overlay .tdp-card'),'task detail/create popup must be included in the visual system');
assert(css.includes('[data-theme*="dark"]'),'premium task system must retain dark mode');
assert(!css.includes('tasks.store.js'),'visual layer must never revive the dormant parallel modern task store');

assert(components.includes('.tpm-module-head'),'premium task module heading missing');
assert(components.includes('#tdp-overlay .tdp-title-input'),'create-task title styling missing');
assert(components.includes('#tdp-overlay .tdp-footer'),'task detail action footer styling missing');
assert(components.includes('#party-quest-active-view'),'Party Quest surface must join the new visual family');

assert(ui.includes("window.__tasksPremiumModernV1=true"),'premium presentation controller guard missing');
assert(ui.includes("Array.isArray(window.taskData)?window.taskData:[]"),'presentation summary must read canonical taskData');
assert(ui.includes("window.TaskDetailPopup.openCreate()"),'new-task CTA must delegate to canonical TaskDetailPopup');
assert(ui.includes('MutationObserver'),'decorator must survive canonical overview rerenders');
assert(ui.includes("familyapp:tasks-updated"),'summary must refresh after canonical task changes');
assert(!/firebase\.|\.set\(|\.update\(|TaskSharedData\.update|AppState\.save|taskData\.push|taskData\.splice/.test(ui),'presentation decorator must not own persistence or task mutations');

assert(canonical.includes('TaskCompactHome.render'),'TaskCompactHome must remain canonical overview owner');
assert(canonical.includes('PersonTabV2.render'),'PersonTabV2 must remain canonical person owner');
assert(compact.includes('data-task-id'),'canonical task row interactions must remain in TaskCompactHome');
assert(detail.includes('TaskSharedData.update'),'task detail popup must remain the task mutation owner');

assert(shell.includes('/src/styles/tasksPremiumModernV1.css?v=1'),'served shell must include premium task stylesheet');
assert(shell.includes('/src/styles/tasksPremiumModernV1Components.css?v=1'),'served shell must include premium task component stylesheet');
assert(shell.includes('/src/modules/tasks/tasksPremiumModernV1.js?v=1'),'served shell must include premium task decorator');

console.log('Tasks premium modern v1 presentation contract: PASS');
