'use strict';
const assert=require('assert');
const fs=require('fs');
const path=require('path');

function read(file){return fs.readFileSync(path.join(__dirname,'..',file),'utf8');}

const templates=read('src/modules/cleaning/cleaningRoutineTemplates.js');
const approvalUi=read('src/modules/cleaning/cleaningPlanApprovalUi.js');
const recurring=read('src/modules/cleaning/cleaningRecurringPlanContract.js');
const experience=read('src/modules/cleaning/cleaningRoutineExperience.js');
const reconciler=read('src/modules/cleaning/cleaningActivePlanReconciler.js');
const rolling=read('src/modules/cleaning/cleaningRollingPlannerService.js');
const projection=read('src/modules/cleaning/cleaningProjectionService.js');

assert.ok(templates.includes("import './cleaningPlanApprovalUi.js?v=1';"));
assert.ok(templates.includes("import './cleaningRecurringPlanContract.js?v=3';"));
assert.ok(templates.includes("import './cleaningRoutineExperience.js?v=3';"));
assert.ok(templates.includes("import './cleaningActivePlanReconciler.js?v=2';"));
assert.ok(templates.includes("import './cleaningRollingPlannerService.js?v=3';"));
assert.ok(templates.includes("import './cleaningProjectionService.js?v=3';"));
assert.ok(templates.indexOf('cleaningRecurringPlanContract.js?v=3') < templates.indexOf('cleaningRoutineExperience.js?v=3'));
assert.ok(templates.indexOf('cleaningRoutineExperience.js?v=3') < templates.indexOf('cleaningActivePlanReconciler.js?v=2'));
assert.ok(templates.indexOf('cleaningActivePlanReconciler.js?v=2') < templates.indexOf('cleaningRollingPlannerService.js?v=3'));
assert.ok(templates.indexOf('cleaningRollingPlannerService.js?v=3') < templates.indexOf('cleaningProjectionService.js?v=3'));
assert.ok(recurring.includes("version:'0.7.0'"),'recurring contract must replace weekly planner generation');
assert.ok(experience.includes("var VERSION='0.3.1'"));
assert.ok(rolling.includes("var VERSION='0.1.2'"));
assert.ok(rolling.includes("plan.rollingPlanVersion===1"),'rolling plans may not become their own consent source');
assert.ok(reconciler.includes("var VERSION='0.1.1'"));
assert.ok(reconciler.includes("reconciliationReason='ROUTINE_SCHEDULE_CHANGED'"));
assert.ok(reconciler.includes("plan.rollingPlanVersion===1"),'rolling future plans must have a single writer');
assert.ok(reconciler.includes("plan.rollingPlanVersion!==1"),'rolling plans must be excluded before reconciliation starts');

// The approval runtime remains the single owner of Planning approval copy.
// Data reconciliation, rolling planning and projection must not observe or
// rewrite those nodes, otherwise the earlier vertical render loop can return.
assert.ok(approvalUi.includes('new MutationObserver(queueDecorate)'));
assert.ok(approvalUi.includes('cleaning-approval-copy'));
assert.ok(projection.includes("var VERSION='0.2.0'"));
assert.ok(!projection.includes('MutationObserver'));
assert.ok(!projection.includes('cleaning-approval-copy'));
assert.ok(!projection.includes('cleaning-plan-actions > span'));
assert.ok(!reconciler.includes('MutationObserver'));
assert.ok(!reconciler.includes('document.'));
assert.ok(!rolling.includes('MutationObserver'));
assert.ok(!rolling.includes('document.'));
assert.ok(projection.includes("CustomEvent('familyapp:cleaning-projections'"));
assert.ok(reconciler.includes("CustomEvent('familyapp:cleaning-plan-reconciled'"));
assert.ok(rolling.includes("CustomEvent('familyapp:cleaning-rolling-plans'"));

console.log('cleaning rolling runtime order + transfer-safe request + single-owner guard: ok');
