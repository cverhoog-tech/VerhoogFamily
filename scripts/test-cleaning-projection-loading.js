'use strict';
const assert=require('assert');
const fs=require('fs');
const path=require('path');

function read(file){
  return fs.readFileSync(path.join(__dirname,'..',file),'utf8');
}

const templates=read('src/modules/cleaning/cleaningRoutineTemplates.js');
const approvalUi=read('src/modules/cleaning/cleaningPlanApprovalUi.js');
const recurring=read('src/modules/cleaning/cleaningRecurringPlanContract.js');
const reconciler=read('src/modules/cleaning/cleaningActivePlanReconciler.js');
const projection=read('src/modules/cleaning/cleaningProjectionService.js');

assert.ok(templates.includes("import './cleaningPlanApprovalUi.js?v=1';"));
assert.ok(templates.includes("import './cleaningRecurringPlanContract.js?v=1';"));
assert.ok(templates.includes("import './cleaningActivePlanReconciler.js?v=1';"));
assert.ok(templates.includes("import './cleaningProjectionService.js?v=2';"));
assert.ok(templates.indexOf('cleaningRecurringPlanContract.js?v=1') < templates.indexOf('cleaningActivePlanReconciler.js?v=1'));
assert.ok(templates.indexOf('cleaningActivePlanReconciler.js?v=1') < templates.indexOf('cleaningProjectionService.js?v=2'));
assert.ok(recurring.includes("version:'0.6.0'"),'recurring contract must replace weekly planner generation');
assert.ok(reconciler.includes("var VERSION='0.1.0'"));
assert.ok(reconciler.includes("reconciliationReason='ROUTINE_SCHEDULE_CHANGED'"));

// The approval runtime is the single owner of Planning DOM presentation.
// Data reconciliation and projection may publish events, but must not observe
// and rewrite the same text nodes or the screen can oscillate indefinitely.
assert.ok(approvalUi.includes('new MutationObserver(queueDecorate)'));
assert.ok(approvalUi.includes('cleaning-approval-copy'));
assert.ok(projection.includes("var VERSION='0.1.1'"));
assert.ok(!projection.includes('MutationObserver'));
assert.ok(!projection.includes('cleaning-approval-copy'));
assert.ok(!projection.includes('cleaning-plan-actions > span'));
assert.ok(!reconciler.includes('MutationObserver'));
assert.ok(!reconciler.includes('document.'));
assert.ok(projection.includes("CustomEvent('familyapp:cleaning-projections'"));
assert.ok(reconciler.includes("CustomEvent('familyapp:cleaning-plan-reconciled'"));

console.log('cleaning recurring loading + Planning render-loop guard: ok');
