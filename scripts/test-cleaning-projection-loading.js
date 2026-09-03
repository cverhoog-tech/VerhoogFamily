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
const roomWorkflow=read('src/modules/cleaning/cleaningRoomWorkflowUx.js');
const supplies=read('src/modules/cleaning/cleaningSupplyExperience.js');
const supplyManager=read('src/modules/cleaning/cleaningSupplyDirectManager.js');
const reconciler=read('src/modules/cleaning/cleaningActivePlanReconciler.js');
const sanitizer=read('src/modules/cleaning/cleaningPlanSanitizer.js');
const approvalClarity=read('src/modules/cleaning/cleaningApprovalClarity.js');
const rolling=read('src/modules/cleaning/cleaningRollingPlannerService.js');
const projection=read('src/modules/cleaning/cleaningProjectionService.js');
const executionContract=read('src/modules/cleaning/cleaningExecutionSync.js');
const executionWriter=read('src/modules/cleaning/cleaningExecutionWriteRuntime.js');
const executionGuard=read('src/modules/cleaning/cleaningExecutionUiGuard.js');
const taskSupplyUi=read('src/modules/cleaning/cleaningTaskSupplyUi.js');
const calendarBootstrap=read('src/modules/calendar/calendar.js');

assert.ok(templates.includes("import './cleaningPlanApprovalUi.js?v=1';"));
assert.ok(templates.includes("import './cleaningRecurringPlanContract.js?v=3';"));
assert.ok(templates.includes("import './cleaningRoutineExperience.js?v=3';"));
assert.ok(templates.includes("import './cleaningQuickChoiceFeedback.js?v=2';"));
assert.ok(templates.includes("import './cleaningRoomListControlsV2.js?v=1';"));
assert.ok(templates.includes("import './cleaningRoomWorkflowUx.js?v=1';"));
assert.ok(templates.includes("import './cleaningSupplyExperience.js?v=2';"));
assert.ok(templates.includes("import './cleaningSupplyDirectManager.js?v=1';"));
assert.ok(templates.includes("import './cleaningActivePlanReconciler.js?v=2';"));
assert.ok(templates.includes("import './cleaningPlanSanitizer.js?v=1';"));
assert.ok(templates.includes("import './cleaningApprovalClarity.js?v=1';"));
assert.ok(templates.includes("import './cleaningRollingPlannerService.js?v=3';"));
assert.ok(templates.includes("import './cleaningProjectionService.js?v=4';"));

const order=[
  'cleaningRecurringPlanContract.js?v=3','cleaningRoutineExperience.js?v=3','cleaningQuickChoiceFeedback.js?v=2',
  'cleaningRoomListControlsV2.js?v=1','cleaningRoomWorkflowUx.js?v=1','cleaningSupplyExperience.js?v=2',
  'cleaningSupplyDirectManager.js?v=1','cleaningActivePlanReconciler.js?v=2','cleaningPlanSanitizer.js?v=1',
  'cleaningApprovalClarity.js?v=1','cleaningRollingPlannerService.js?v=3','cleaningProjectionService.js?v=4'
];
for(let i=1;i<order.length;i++)assert.ok(templates.indexOf(order[i-1])<templates.indexOf(order[i]),order[i-1]+' must load before '+order[i]);

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

assert.ok(roomWorkflow.includes("var VERSION='0.1.1'"));
assert.ok(roomWorkflow.includes('data-cleaning-routine-more'));
assert.ok(roomWorkflow.includes('cleaning-routine-edit-button'));
assert.ok(roomWorkflow.includes('cleaning-routine-assign-button'));
assert.ok(roomWorkflow.includes('cleaning-routine-remove-button'));
assert.ok(roomWorkflow.includes('prepareOptionalName'));

assert.ok(supplies.includes("var VERSION='0.2.0'"));
assert.ok(supplies.includes('data-cleaning-room-supplies'));
assert.ok(supplies.includes('data-supply-form-signature'),'supply form must refresh selection state without duplicating its DOM');
assert.ok(supplies.includes('data-cleaning-smart-supply'),'smart supply suggestions must be visible in routine editing');
assert.ok(supplies.includes("overlay.addEventListener('pointerup'"),'supply sheet must have direct close handling');
assert.ok(supplies.includes('setRepositorySnapshot(event.detail)'),'supply runtime must cache repository events instead of cloning per render');
assert.ok(!supplies.includes('function snapshot()'),'supply render path must not repeatedly clone the Cleaning snapshot');
assert.ok(!supplies.includes("write.db.ref(write.path).transaction"),'supply create must not transact the full Cleaning aggregate');
assert.ok(supplies.includes('ShoppingListStore'));
assert.ok(supplies.includes('{dedupe:true}'));
assert.ok(supplies.includes('__routineExperienceV3'),'supplies must wrap the final routine persistence owner');

assert.ok(supplyManager.includes("var VERSION='0.1.0'"));
assert.ok(supplyManager.includes('data-cleaning-supply-direct-target'));
assert.ok(supplyManager.includes('data-cleaning-supply-link-routine'));
assert.ok(supplyManager.includes("'/routines/'"),'direct supply linking must write only the routine child');
assert.ok(supplyManager.includes('CleaningSupplyExperience'));

assert.ok(reconciler.includes("var VERSION='0.1.1'"));
assert.ok(reconciler.includes("reconciliationReason='ROUTINE_SCHEDULE_CHANGED'"));
assert.ok(reconciler.includes("plan.rollingPlanVersion===1"),'rolling future plans must have a single writer');
assert.ok(reconciler.includes("plan.rollingPlanVersion!==1"),'rolling plans must be excluded before reconciliation starts');

assert.ok(sanitizer.includes("var VERSION='0.1.0'"));
assert.ok(sanitizer.includes("reconciliationReason='ROOM_OR_ROUTINE_REMOVED'"));
assert.ok(sanitizer.includes('CleaningActivePlanReconciler'));
assert.ok(sanitizer.includes('CleaningProjectionService'));
assert.ok(!sanitizer.includes('MutationObserver'));
assert.ok(!sanitizer.includes('document.'));

assert.ok(approvalClarity.includes("var VERSION='0.1.0'"));
assert.ok(approvalClarity.includes('Jouw akkoord is nog nodig'));
assert.ok(approvalClarity.includes('Planning vernieuwen'));
assert.ok(approvalClarity.includes('CleaningPlanSanitizer'));

assert.ok(rolling.includes("var VERSION='0.1.2'"));
assert.ok(rolling.includes("plan.rollingPlanVersion===1"),'rolling plans may not become their own consent source');

assert.ok(calendarBootstrap.includes("load('src/modules/cleaning/cleaningProjectionService.js?v=4'"));
assert.ok(calendarBootstrap.includes("load('src/modules/cleaning/cleaningExecutionSync.js?v=2'"));
assert.ok(calendarBootstrap.includes("load('src/modules/cleaning/cleaningExecutionWriteRuntime.js?v=1'"));
assert.ok(calendarBootstrap.includes("load('src/modules/cleaning/cleaningExecutionUiGuard.js?v=1'"));
assert.ok(calendarBootstrap.includes("load('src/modules/cleaning/cleaningTaskSupplyUi.js?v=1'"));
assert.ok(calendarBootstrap.indexOf('calendarSharedLive.js?v=6') < calendarBootstrap.indexOf('cleaningProjectionService.js?v=4'));
assert.ok(calendarBootstrap.indexOf('cleaningProjectionService.js?v=4') < calendarBootstrap.indexOf('cleaningExecutionSync.js?v=2'));
assert.ok(calendarBootstrap.indexOf('cleaningExecutionSync.js?v=2') < calendarBootstrap.indexOf('cleaningExecutionWriteRuntime.js?v=1'));
assert.ok(calendarBootstrap.indexOf('cleaningExecutionWriteRuntime.js?v=1') < calendarBootstrap.indexOf('cleaningExecutionUiGuard.js?v=1'));
assert.ok(calendarBootstrap.indexOf('cleaningExecutionUiGuard.js?v=1') < calendarBootstrap.indexOf('cleaningTaskSupplyUi.js?v=1'));

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
assert.ok(taskSupplyUi.includes("var VERSION='0.1.0'"));
assert.ok(taskSupplyUi.includes('_deriveDetails'));
assert.ok(taskSupplyUi.includes("once('value')"),'task supply UI may read canonical Cleaning when the lazy module is not mounted');
assert.ok(!taskSupplyUi.includes('.transaction('),'Task supply presentation may not write Cleaning directly');
assert.ok(!taskSupplyUi.includes('.update('),'Task supply presentation may not write Cleaning directly');

// Approval UI remains the only renderer of the canonical approval copy. Other
// decorators may add their own idempotent controls but never rewrite its copy.
assert.ok(approvalUi.includes('new MutationObserver(queueDecorate)'));
assert.ok(approvalUi.includes('cleaning-approval-copy'));
for(const source of [quickChoice,roomControls,roomWorkflow,supplies,supplyManager,sanitizer,approvalClarity,taskSupplyUi]){
  assert.ok(!source.includes('cleaning-plan-actions > span'),'secondary Cleaning decorators may not rewrite Planning hero copy');
}
assert.ok(!quickChoice.includes('cleaning-approval-copy'));
assert.ok(!roomControls.includes('cleaning-approval-copy'));
assert.ok(!roomWorkflow.includes('cleaning-approval-copy'));
assert.ok(!supplies.includes('cleaning-approval-copy'));
assert.ok(!supplyManager.includes('cleaning-approval-copy'));
assert.ok(!sanitizer.includes('cleaning-approval-copy'));
assert.ok(!approvalClarity.includes('cleaning-approval-copy'));
assert.ok(!taskSupplyUi.includes('cleaning-approval-copy'));

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
assert.ok(sanitizer.includes("CustomEvent('familyapp:cleaning-plan-sanitized'"));
assert.ok(rolling.includes("CustomEvent('familyapp:cleaning-rolling-plans'"));

console.log('cleaning streamlined rooms + direct supplies + stale-plan sanitizer + execution ownership: ok');
