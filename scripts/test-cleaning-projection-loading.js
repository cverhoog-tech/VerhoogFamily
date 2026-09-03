'use strict';
const assert=require('assert');
const fs=require('fs');
const path=require('path');

function read(file){return fs.readFileSync(path.join(__dirname,'..',file),'utf8');}

const templates=read('src/modules/cleaning/cleaningRoutineTemplates.js');
const approvalUi=read('src/modules/cleaning/cleaningPlanApprovalUi.js');
const recurring=read('src/modules/cleaning/cleaningRecurringPlanContract.js');
const experience=read('src/modules/cleaning/cleaningRoutineExperience.js');
const quickChoice=read('src/modules/cleaning/cleaningQuickChoiceFeedback.js');
const roomControls=read('src/modules/cleaning/cleaningRoomListControlsV2.js');
const reconciler=read('src/modules/cleaning/cleaningActivePlanReconciler.js');
const rolling=read('src/modules/cleaning/cleaningRollingPlannerService.js');
const projection=read('src/modules/cleaning/cleaningProjectionService.js');
const executionContract=read('src/modules/cleaning/cleaningExecutionSync.js');
const executionWriter=read('src/modules/cleaning/cleaningExecutionWriteRuntime.js');
const executionGuard=read('src/modules/cleaning/cleaningExecutionUiGuard.js');
const calendarBootstrap=read('src/modules/calendar/calendar.js');

assert.ok(templates.includes("import './cleaningPlanApprovalUi.js?v=1';"));
assert.ok(templates.includes("import './cleaningRecurringPlanContract.js?v=3';"));
assert.ok(templates.includes("import './cleaningRoutineExperience.js?v=3';"));
assert.ok(templates.includes("import './cleaningQuickChoiceFeedback.js?v=2';"));
assert.ok(templates.includes("import './cleaningRoomListControlsV2.js?v=1';"));
assert.ok(templates.includes("import './cleaningActivePlanReconciler.js?v=2';"));
assert.ok(templates.includes("import './cleaningRollingPlannerService.js?v=3';"));
assert.ok(templates.includes("import './cleaningProjectionService.js?v=4';"));
assert.ok(templates.indexOf('cleaningRecurringPlanContract.js?v=3') < templates.indexOf('cleaningRoutineExperience.js?v=3'));
assert.ok(templates.indexOf('cleaningRoutineExperience.js?v=3') < templates.indexOf('cleaningQuickChoiceFeedback.js?v=2'));
assert.ok(templates.indexOf('cleaningQuickChoiceFeedback.js?v=2') < templates.indexOf('cleaningRoomListControlsV2.js?v=1'));
assert.ok(templates.indexOf('cleaningRoomListControlsV2.js?v=1') < templates.indexOf('cleaningActivePlanReconciler.js?v=2'));
assert.ok(templates.indexOf('cleaningActivePlanReconciler.js?v=2') < templates.indexOf('cleaningRollingPlannerService.js?v=3'));
assert.ok(templates.indexOf('cleaningRollingPlannerService.js?v=3') < templates.indexOf('cleaningProjectionService.js?v=4'));
assert.ok(recurring.includes("version:'0.7.0'"),'recurring contract must replace weekly planner generation');
assert.ok(experience.includes("var VERSION='0.3.1'"));
assert.ok(quickChoice.includes("var VERSION='0.3.0'"));
assert.ok(quickChoice.includes("window.showToast('Routine toegevoegd ✓')"));
assert.ok(quickChoice.includes('data-cleaning-quick-choice-pending'));
assert.ok(quickChoice.includes('scrollContainerFor'));
assert.ok(quickChoice.includes('anchorTop'));
assert.ok(!quickChoice.includes('scrollIntoView'));
assert.ok(roomControls.includes("var VERSION='0.2.0'"));
assert.ok(roomControls.includes('data-cleaning-routine-remove'));
assert.ok(roomControls.includes('data-cleaning-room-move'));
assert.ok(roomControls.includes('sortOrder'));
assert.ok(roomControls.includes('data-order-signature'),'room decorator must be mutation-loop safe');
assert.ok(rolling.includes("var VERSION='0.1.2'"));
assert.ok(rolling.includes("plan.rollingPlanVersion===1"),'rolling plans may not become their own consent source');
assert.ok(reconciler.includes("var VERSION='0.1.1'"));
assert.ok(reconciler.includes("reconciliationReason='ROUTINE_SCHEDULE_CHANGED'"));
assert.ok(reconciler.includes("plan.rollingPlanVersion===1"),'rolling future plans must have a single writer');
assert.ok(reconciler.includes("plan.rollingPlanVersion!==1"),'rolling plans must be excluded before reconciliation starts');

assert.ok(calendarBootstrap.includes("load('src/modules/cleaning/cleaningProjectionService.js?v=4'"));
assert.ok(calendarBootstrap.includes("load('src/modules/cleaning/cleaningExecutionSync.js?v=2'"));
assert.ok(calendarBootstrap.includes("load('src/modules/cleaning/cleaningExecutionWriteRuntime.js?v=1'"));
assert.ok(calendarBootstrap.includes("load('src/modules/cleaning/cleaningExecutionUiGuard.js?v=1'"));
assert.ok(calendarBootstrap.indexOf('calendarSharedLive.js?v=6') < calendarBootstrap.indexOf('cleaningProjectionService.js?v=4'));
assert.ok(calendarBootstrap.indexOf('cleaningProjectionService.js?v=4') < calendarBootstrap.indexOf('cleaningExecutionSync.js?v=2'));
assert.ok(calendarBootstrap.indexOf('cleaningExecutionSync.js?v=2') < calendarBootstrap.indexOf('cleaningExecutionWriteRuntime.js?v=1'));
assert.ok(calendarBootstrap.indexOf('cleaningExecutionWriteRuntime.js?v=1') < calendarBootstrap.indexOf('cleaningExecutionUiGuard.js?v=1'));

assert.ok(executionContract.includes("var VERSION='0.2.0'"));
assert.ok(executionContract.includes('_applyTaskPatchToFamily'));
assert.ok(executionContract.includes('_applyCalendarPatchToFamily'));
assert.ok(!executionContract.includes('firebase.database'));
assert.ok(!executionContract.includes('.transaction('));
assert.ok(!executionContract.includes('addEventListener'));
assert.ok(executionWriter.includes("var VERSION='0.1.0'"));
assert.ok(executionWriter.includes("cleaningPath:'families/'+ctx.householdId+'/cleaning'"));
assert.ok(executionWriter.includes('cleaningRef.transaction'));
assert.ok(executionWriter.includes('familyRef.update(updates)'));
assert.ok(executionWriter.includes('__cleaningExecutionWriteRuntime'));
assert.ok(executionWriter.includes('transactionPatch'));
assert.ok(!executionWriter.includes("ref('families/'+write.ctx.householdId).transaction"));
assert.ok(executionGuard.includes("var VERSION='0.1.0'"));
assert.ok(executionGuard.includes("closest('#tdp-delete-btn')"));
assert.ok(executionGuard.includes('stopImmediatePropagation'));

// Approval UI remains the only renderer of Planning approval copy. Data
// reconciliation, projection and reverse execution layers do not mutate it.
assert.ok(approvalUi.includes('new MutationObserver(queueDecorate)'));
assert.ok(approvalUi.includes('cleaning-approval-copy'));
assert.ok(!quickChoice.includes('cleaning-approval-copy'));
assert.ok(!quickChoice.includes('cleaning-plan-actions > span'));
assert.ok(!roomControls.includes('cleaning-approval-copy'));
assert.ok(!roomControls.includes('cleaning-plan-actions > span'));
assert.ok(projection.includes("var VERSION='0.3.1'"));
assert.ok(projection.includes('scheduledDate'));
assert.ok(projection.includes("assignmentStatus))<0"));
assert.ok(!projection.includes('MutationObserver'));
assert.ok(!projection.includes('cleaning-approval-copy'));
assert.ok(!projection.includes('cleaning-plan-actions > span'));
assert.ok(!executionContract.includes('cleaning-approval-copy'));
assert.ok(!executionWriter.includes('cleaning-approval-copy'));
assert.ok(!executionGuard.includes('cleaning-approval-copy'));
assert.ok(!reconciler.includes('MutationObserver'));
assert.ok(!reconciler.includes('document.'));
assert.ok(!rolling.includes('MutationObserver'));
assert.ok(!rolling.includes('document.'));
assert.ok(projection.includes("CustomEvent('familyapp:cleaning-projections'"));
assert.ok(reconciler.includes("CustomEvent('familyapp:cleaning-plan-reconciled'"));
assert.ok(rolling.includes("CustomEvent('familyapp:cleaning-rolling-plans'"));

console.log('cleaning pure execution contract + rules-safe writer + UI guard order: ok');
