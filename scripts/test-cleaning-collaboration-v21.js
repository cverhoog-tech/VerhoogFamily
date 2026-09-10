#!/usr/bin/env node
'use strict';
const assert=require('assert');
const fs=require('fs');
const path=require('path');
const vm=require('vm');
const ROOT=path.resolve(__dirname,'..');
function read(rel){return fs.readFileSync(path.join(ROOT,rel),'utf8');}

const contractSource=read('src/modules/cleaning/cleaningCollaborationContract.js');
const experienceSource=read('src/modules/cleaning/cleaningCollaborationExperience.js');
const premiumSource=read('src/modules/cleaning/cleaningPremiumFeedback.js');
const registrySource=read('src/platform/inbox/actionInboxRegistry.js');
const todoSource=read('FamilyApp-TODO-updated.txt');
const currentTodoSource=read('docs/FAMILYAPP-CURRENT-TODO.md');
const progressSource=read('docs/household-rebuild-v2-progress.md');
const statusSource=read('FamilyApp-Schoonmaken-current-status.md');
const milestoneSource=read('FamilyApp-Schoonmaken-milestone-log.md');
const architectureSource=read('FamilyApp-Schoonmaken-module-architectuur.md');

const sandbox={window:{},Date:Date,JSON:JSON,Error:Error,String:String,Number:Number,Array:Array,Object:Object,Math:Math};
vm.createContext(sandbox);
vm.runInContext(contractSource,sandbox,{filename:'cleaningCollaborationContract.js'});
const contract=sandbox.window.CleaningCollaborationContract;
assert.ok(contract,'CleaningCollaborationContract must install');
assert.strictEqual(contract.version,'2.1.0');

const base={id:'occ-1',roomId:'room-1',status:'FLEXIBLE',assignmentStatus:'ACTIVE',assignmentUids:['u1'],scheduledDate:'2026-09-10',scheduledTime:'',estimatedMinutes:30,checklist:[{id:'r1',completed:false}]};
const ctx=(actor,timestamp=1000)=>({actorUid:actor,activeUids:['u1','u2','u3'],timestamp:timestamp,isManager:false});

let transfer=contract.apply(base,{type:'REQUEST_TRANSFER',toUid:'u2'},ctx('u1'));
assert.strictEqual(transfer.changed,true);
assert.strictEqual(transfer.occurrence.transferRequest.status,'PENDING');
assert.deepStrictEqual(Array.from(transfer.occurrence.assignmentUids),['u1'],'request must not change canonical assignment before acceptance');
let repeated=contract.apply(transfer.occurrence,{type:'REQUEST_TRANSFER',toUid:'u2'},ctx('u1',1001));
assert.strictEqual(repeated.changed,false,'same pending transfer must be idempotent');
let accepted=contract.apply(transfer.occurrence,{type:'ACCEPT_TRANSFER'},ctx('u2',1100));
assert.deepStrictEqual(Array.from(accepted.occurrence.assignmentUids),['u2']);
assert.strictEqual(accepted.projectionChanged,true,'accepted transfer must request projection sync');
let declined=contract.apply(transfer.occurrence,{type:'DECLINE_TRANSFER'},ctx('u2',1200));
assert.deepStrictEqual(Array.from(declined.occurrence.assignmentUids),['u1'],'decline must preserve original assignee');
let withdrawn=contract.apply(transfer.occurrence,{type:'WITHDRAW_TRANSFER'},ctx('u1',1250));
assert.strictEqual(withdrawn.occurrence.transferRequest.status,'WITHDRAWN');

let counter=contract.apply(transfer.occurrence,{type:'COUNTER_TRANSFER',assigneeUid:'u3',scheduledDate:'2026-09-12',scheduledTime:'10:30'},ctx('u2',1300));
assert.strictEqual(counter.occurrence.transferRequest.status,'COUNTER_PROPOSED');
let counterAccepted=contract.apply(counter.occurrence,{type:'ACCEPT_COUNTER'},ctx('u1',1400));
assert.strictEqual(counterAccepted.retargeted,true,'third-person counter must create a fresh explicit request');
assert.strictEqual(counterAccepted.occurrence.transferRequest.toUid,'u3');
assert.deepStrictEqual(Array.from(counterAccepted.occurrence.assignmentUids),['u1'],'third member must not be silently assigned');
let thirdAccept=contract.apply(counterAccepted.occurrence,{type:'ACCEPT_TRANSFER'},ctx('u3',1500));
assert.deepStrictEqual(Array.from(thirdAccept.occurrence.assignmentUids),['u3']);
assert.strictEqual(thirdAccept.occurrence.scheduledDate,'2026-09-12');
assert.strictEqual(thirdAccept.occurrence.scheduledTime,'10:30');

let help=contract.apply(base,{type:'REQUEST_HELP',toUid:'u2'},ctx('u1',2000));
assert.strictEqual(help.occurrence.helpRequest.status,'PENDING');
let helpRepeat=contract.apply(help.occurrence,{type:'REQUEST_HELP',toUid:'u2'},ctx('u1',2001));
assert.strictEqual(helpRepeat.changed,false,'same pending help request must be idempotent');
let helpAccepted=contract.apply(help.occurrence,{type:'ACCEPT_HELP'},ctx('u2',2100));
assert.strictEqual(helpAccepted.occurrence.helpRequest.helperUid,'u2');
assert.deepStrictEqual(Array.from(helpAccepted.occurrence.assignmentUids),['u1'],'help must not silently become multi-person assignment');
let helpWithdrawn=contract.apply(help.occurrence,{type:'WITHDRAW_HELP'},ctx('u1',2200));
assert.strictEqual(helpWithdrawn.occurrence.helpRequest.status,'WITHDRAWN');

assert.throws(()=>contract.apply(base,{type:'REQUEST_TRANSFER',toUid:'u9'},ctx('u1')),/CLEANING_COLLAB_MEMBER_REQUIRED/);
assert.throws(()=>contract.apply(transfer.occurrence,{type:'ACCEPT_TRANSFER'},ctx('u3')),/CLEANING_COLLAB_NOT_RECIPIENT/);
assert.throws(()=>contract.apply(help.occurrence,{type:'DECLINE_HELP'},ctx('u3')),/CLEANING_COLLAB_NOT_RECIPIENT/);

assert.match(experienceSource,/CleaningHouseholdRepository/,'collaboration must reuse the existing v2 repository');
assert.doesNotMatch(experienceSource,/\.on\(\s*['"]value['"]/,'collaboration must not create a second Firebase listener');
assert.match(experienceSource,/\.transaction\(function\(server\)/,'collaboration writes must transact the canonical occurrence');
assert.match(experienceSource,/cleaningPath\+'\/occurrences\/'/,'collaboration writes must stay occurrence-scoped');
assert.doesNotMatch(experienceSource,/\.ref\([^)]*\)\.push\s*\(/,'collaboration must never create a Firebase push path');
assert.doesNotMatch(experienceSource,/new\s+MutationObserver|MutationObserver\s*\(|document\.addEventListener\('click'|TaskDetailPopup|CleaningExecutionWriteRuntime|CleaningProjectionService/,'forbidden legacy runtime techniques must stay absent');
assert.doesNotMatch(experienceSource,/NotificationStore|publishSelf|publishTo/,'v2.1 must not create noisy notification projection work');
assert.doesNotMatch(experienceSource,/screen\.appendChild\(panel\)|cc21-shell/,'collaboration must not render a standalone menu below Cleaning');
assert.match(experienceSource,/data-cc21-turn/,'collaboration actions must live inside the turn detail flow');
assert.match(experienceSource,/body\.insertBefore\(section,actions\)/,'collaboration section must be inserted before existing turn actions');
assert.match(experienceSource,/screen\.addEventListener\('click',onScreenClick\)/,'turn enhancement must be scoped to the Cleaning screen');
assert.match(experienceSource,/sheet\.addEventListener\('click',onSheetClick\)/,'collaboration must only handle its controls inside the existing V2 sheet');
assert.match(experienceSource,/openTurnForCounter/,'Action Inbox counter must route back to the concrete turn');
assert.match(experienceSource,/syncAcceptedProjection/,'accepted transfers must update existing Task\/Agenda projections');
assert.match(experienceSource,/state\.busy\.has\(occurrenceId\)/,'double tap guard must exist');
assert.match(premiumSource,/import '\.\/cleaningCollaborationExperience\.js\?v=1'/,'collaboration must remain lazy behind Cleaning navigation');
assert.match(premiumSource,/disabledForCleaningV2:true/,'legacy premium compatibility marker must remain inert');
assert.doesNotMatch(premiumSource,/MutationObserver|addEventListener|setTimeout|setInterval/,'premium shim itself must remain runtime-free');
assert.match(registrySource,/type:'cleaning\.occurrence\.transfer'/,'Action Inbox must expose occurrence transfer decisions');
assert.match(registrySource,/type:'cleaning\.occurrence\.counter'/,'Action Inbox must expose occurrence counter decisions');
assert.match(registrySource,/type:'cleaning\.help'/,'Action Inbox must expose help decisions');
assert.match(registrySource,/CleaningCollaborationV21\.handleInboxAction/,'Inbox decisions must route into the v2.1 collaboration writer');
assert.doesNotMatch(registrySource,/\.ref\s*\(/,'Action Inbox must remain writer-free');

[todoSource,currentTodoSource,progressSource,statusSource,milestoneSource].forEach((source)=>{
  assert.match(source,/V2\.1/,'current roadmap/status docs must mention Cleaning V2.1');
  assert.match(source,/real-device/i,'current roadmap/status docs must keep the real-device acceptance gate explicit');
});
assert.match(statusSource,/CODECANDIDATE GEREED/,'Cleaning current status must describe V2.1 as a candidate, not accepted');
assert.doesNotMatch(statusSource,/STEP 14 is FUNCTIONEEL AFGEROND EN REAL-DEVICE GEACCEPTEERD/,'stale pre-reset STEP 14 completion claim must not return');
assert.match(architectureSource,/CleaningOccurrence is de concrete authority/,'architecture must keep CleaningOccurrence canonical');
assert.match(architectureSource,/Third-person counter safety/,'architecture must document explicit third-person consent');
assert.match(architectureSource,/CleaningV2Repository` heeft één actieve household-scoped Firebase `value` listener/,'architecture must preserve the one-listener performance rule');

console.log('Cleaning V2.1 collaboration contracts: PASS');