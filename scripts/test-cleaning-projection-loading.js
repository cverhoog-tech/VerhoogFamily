'use strict';
const assert=require('assert');
const fs=require('fs');
const path=require('path');

function read(file){
  return fs.readFileSync(path.join(__dirname,'..',file),'utf8');
}

const templates=read('src/modules/cleaning/cleaningRoutineTemplates.js');
const approvalUi=read('src/modules/cleaning/cleaningPlanApprovalUi.js');
const projection=read('src/modules/cleaning/cleaningProjectionService.js');

assert.ok(templates.includes("import './cleaningPlanApprovalUi.js?v=1';"));
assert.ok(templates.includes("import './cleaningProjectionService.js?v=2';"));
assert.ok(templates.indexOf('cleaningPlanApprovalUi.js?v=1') < templates.indexOf('cleaningProjectionService.js?v=2'));

// The approval runtime is the single owner of Planning DOM presentation.
// The projection runtime may publish data/events, but must not observe and
// rewrite the same text nodes or both observers can oscillate indefinitely.
assert.ok(approvalUi.includes('new MutationObserver(queueDecorate)'));
assert.ok(approvalUi.includes('cleaning-approval-copy'));
assert.ok(projection.includes("var VERSION='0.1.1'"));
assert.ok(!projection.includes('MutationObserver'));
assert.ok(!projection.includes('cleaning-approval-copy'));
assert.ok(!projection.includes('cleaning-plan-actions > span'));
assert.ok(projection.includes("CustomEvent('familyapp:cleaning-projections'"));

console.log('cleaning projection loading + Planning render-loop guard: ok');
