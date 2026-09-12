'use strict';
const assert=require('assert');
const fs=require('fs');
function read(p){return fs.readFileSync(p,'utf8');}

const model=read('src/modules/tasks/v3/taskPresentationModelV3.js');
const overview=read('src/modules/tasks/v3/taskOverviewV3.js');
const detail=read('src/modules/tasks/v3/taskDetailV3.js');
const css=read('src/styles/tasksV3.css');
const shell=read('api/app-v7.js');
const canonicalRouter=read('src/modules/tasks/taskOverviewCanonical.js');
const shared=read('src/modules/tasks/taskSharedData.js');

[model,overview,detail].forEach(function(source,index){assert.doesNotThrow(function(){new Function(source);},'Tasks V3 runtime '+index+' must be valid JavaScript');});

assert(model.includes("window.TaskPresentationModelV3"),'V3 presentation model missing');
assert(model.includes('Array.isArray(window.taskData)?window.taskData:[]'),'V3 model must read canonical taskData');
assert(model.includes('CleaningTaskSupplyUi'),'V3 must reuse exact Cleaning supply context');
assert(model.includes('/src/assets/cleaning-rooms/kids-room-light.webp'),'room photo resolver missing');
assert(model.includes('/src/assets/task-heroes/market.webp'),'grocery photo resolver missing');
assert(!/TaskSharedData\.(update|create|remove)|firebase\.|\.ref\(/.test(model),'V3 presentation model must remain read-only');

assert(overview.includes('window.TaskCompactHome=api'),'V3 overview must replace the active visual overview implementation');
assert(overview.includes('Kleine taken, een rustiger thuis'),'approved quote missing');
assert(overview.includes('tv3-task-photo'),'rows must render photos directly');
assert(overview.includes("['all','Alle taken']"),'approved filter system missing');
assert(overview.includes('Persoon-overzicht'),'person dashboard must remain reachable');
assert(overview.includes('TaskDetailPopup.openCreate'),'new task must open the active task editor');
assert(!/TaskSharedData\.(update|create|remove)|firebase\.|\.ref\(/.test(overview),'overview must not own persistence');

assert(detail.includes('window.TaskDetailPopup=api'),'V3 must become active task detail API');
assert(detail.includes('TaskSharedData.update'),'detail must persist via canonical TaskSharedData');
assert(detail.includes('TaskSharedData.create'),'create flow must persist via canonical TaskSharedData');
assert(detail.includes('window.toggleTask'),'completion must preserve existing completion/reward bridge');
assert(detail.includes('requestHelp'),'targeted help flow must remain available');
assert(detail.includes('retractHelp'),'help retract flow must remain available');
assert(detail.includes('joinHelp'),'help join flow must remain available');
assert(detail.includes('leaveHelp'),'help leave flow must remain available');
assert(detail.includes('data-v3e-note-send'),'notes must remain editable');
assert(detail.includes('data-v3e-delete'),'delete must remain available');
assert(detail.includes('data-v3e-icon-open'),'subtask icon editing must remain available');
assert(detail.includes('Beheer in Schoonmaken'),'Cleaning supply management must remain reachable');
assert(detail.includes('Markeer als klaar'),'approved completion CTA missing');
assert(detail.includes('Bewerken'),'approved edit CTA missing');
assert(detail.includes('Uitstellen'),'approved postpone CTA missing');

assert(css.includes('.tv3-page'),'V3 overview stylesheet missing');
assert(css.includes('.tv3d-card'),'V3 detail stylesheet missing');
assert(css.includes('.tv3e-sheet'),'V3 editor stylesheet missing');
assert(css.includes('aspect-ratio:16/8.3'),'photo-first detail hero contract missing');
assert(css.includes('[data-theme*="dark"]'),'dark mode contract missing');
assert(!css.includes('#tdp-overlay'),'V3 stylesheet must not depend on legacy popup DOM');

assert(shell.includes('/src/styles/tasksV3.css?v=1'),'shell must serve V3 stylesheet');
assert(shell.indexOf('taskPresentationModelV3.js?v=1')<shell.indexOf('taskOverviewV3.js?v=1'),'model must load before overview');
assert(shell.indexOf('taskOverviewV3.js?v=1')<shell.indexOf('taskDetailV3.js?v=1'),'overview must load before detail');
assert(!shell.includes('tasksPremiumModernV1'),'legacy modern decorator must not be active');
assert(!shell.includes('tasksPremiumWarmV2'),'legacy warm decorator must not be active');
assert(!shell.includes('tasksCleaningDetailV3'),'legacy detail override must not be active');

assert(canonicalRouter.includes('TaskCompactHome.render'),'canonical router must keep delegating through TaskCompactHome');
assert(canonicalRouter.includes('PersonTabV2.render'),'PersonTabV2 ownership must stay intact');
assert(shared.includes('TaskHouseholdRepository is the only task persistence/listener owner'),'TaskHouseholdRepository ownership contract must remain intact');

console.log('Tasks V3 rebuilt UI + canonical ownership contract: PASS');
