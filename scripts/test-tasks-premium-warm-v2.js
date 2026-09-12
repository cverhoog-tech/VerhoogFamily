'use strict';
const assert=require('assert');
const fs=require('fs');
function read(p){return fs.readFileSync(p,'utf8');}
const css=read('src/styles/tasksPremiumWarmV2.css');
const detailCss=read('src/styles/tasksCleaningDetailV3.css');
const ui=read('src/modules/tasks/tasksPremiumWarmV2.js');
const shell=read('api/app-v7.js');
const compact=read('src/modules/tasks/taskCompactHome.js');
const detail=read('src/modules/tasks/taskDetailPopup.js');

assert(css.includes('--tpw2-bg:#f7f3ea'),'approved warm ivory token missing');
assert(css.includes('--tpw2-pine:#244f3e'),'approved pine token missing');
assert(css.includes('.tpw2-head'),'v2 task overview header styling missing');
assert(css.includes('.tpw2-stats'),'v2 summary strip styling missing');
assert(css.includes('.tpw2-task-row'),'v2 task row styling missing');
assert(css.includes('#tdp-overlay.tpw2-overlay'),'v2 popup base styling missing');
assert(css.includes('.tpw2-create-card'),'create/edit styling must remain in the same family');
assert(css.includes('[data-theme*="dark"]'),'dark mode fallback missing');
assert(css.includes('min-height:58px'),'overview must stay compact rather than card-heavy');
assert(css.includes('box-shadow:none'),'quiet premium overview should avoid decorative shadow stacking');

// Detail v3 intentionally borrows the accepted Cleaning-card visual language:
// photo first, 16:9 crop, vertical fade, translucent inner sections, floating card.
assert(detailCss.includes('.tdp-card.tpw2-detail-card'),'Cleaning-style task detail card selector missing');
assert(detailCss.includes('aspect-ratio:16 / 9'),'task detail hero must use Cleaning-like 16:9 photography');
assert(detailCss.includes('linear-gradient(180deg'),'task detail must fade photography into the content surface');
assert(detailCss.includes('background:rgba(255,255,255,.64)'),'subtasks must use the Cleaning-like translucent routine surface');
assert(detailCss.includes('.tpw2-supplies'),'supplies surface must remain available');
assert(detailCss.includes('.tdp-help-box'),'collaboration surface must remain available');
assert(detailCss.includes('position:sticky'),'completion action must remain reachable on long task cards');
assert(detailCss.includes('[data-theme*="dark"]'),'Cleaning-style task detail must keep dark mode');
assert(!detailCss.includes('.tpw2-create-card'),'Cleaning photo treatment must not accidentally restyle create mode');

assert(ui.includes('window.__tasksPremiumWarmV2=true'),'v2 decorator guard missing');
assert(ui.includes('Array.isArray(window.taskData)?window.taskData:[]'),'v2 must read canonical taskData');
assert(ui.includes('TaskDetailPopup.openCreate()'),'new task action must delegate to canonical popup');
assert(ui.includes('data-range="all"'),'v2 should ask canonical overview to render all groups before presentation filtering');
assert(ui.includes('data-tpw2-filter'),'approved grouped filter controls missing');
assert(ui.includes('MutationObserver'),'v2 must survive canonical rerenders');
assert(ui.includes('tpw2-detail-card'),'task detail decorator missing');
assert(ui.includes('TASK_HERO_CLEANING'),'Cleaning tasks need a photo fallback without mutating task data');
assert(ui.includes('TASK_HERO_DEFAULT'),'non-image tasks need a premium photo fallback');
assert(ui.includes("version:'2.2.0'"),'presentation version must identify Cleaning-detail round');
assert(!/firebase\.|\.set\(|TaskSharedData\.update|TaskSharedData\.create|taskData\.push|taskData\.splice/.test(ui),'presentation layer must not own persistence or task mutations');

// Canonical detail module retains all existing functional affordances.
assert(compact.includes('data-task-id'),'TaskCompactHome must remain the canonical overview owner');
assert(detail.includes('TaskSharedData.update'),'TaskDetailPopup must remain the mutation owner');
assert(detail.includes('data-sub-toggle'),'subtask completion interaction must remain intact');
assert(detail.includes('data-sub-icon-toggle'),'subtask icon picker must remain intact');
assert(detail.includes('tdp-help-btn'),'help/collaboration interaction must remain intact');
assert(detail.includes('tdp-note-input'),'notes must remain intact');
assert(detail.includes('tdp-delete-btn'),'delete action must remain intact');
assert(detail.includes('tdp-bookmark-btn'),'bookmark action must remain intact');
assert(detail.includes('tdp-complete-btn'),'complete/reopen action must remain intact');
assert(detail.includes('tdp-more-btn'),'edit/details action must remain intact');
assert(detail.includes('openCreate'),'create task flow must remain intact');

assert(shell.includes('/src/styles/tasksPremiumWarmV2.css?v=2'),'served shell must retain compact overview stylesheet');
assert(shell.includes('/src/styles/tasksCleaningDetailV3.css?v=1'),'served shell must include Cleaning-style task detail stylesheet');
assert(shell.includes('/src/modules/tasks/tasksPremiumWarmV2.js?v=2'),'served shell must use the v2.2 presentation decorator');

console.log('Tasks premium warm v2.2 + Cleaning detail v3 contract: PASS');
