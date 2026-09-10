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
assert.strictEqual(declined.occurrence.transferRequest.status,'DECLINED');

let withdrawn=contract.apply(transfer.occurrence,{type:'WITHDRAW_TRANSFER'},ctx('u1',1250));
assert.strictEqual(withdrawn.occurrence.transferRequest.status,'WITHDRAWN');
assert.deepStrictEqual(Array.from(withdrawn.occurrence.assignmentUids),['u1']);

let counter=contract.apply(transfer.occurrence,{type:'COUNTER_TRANSFER',assigneeUid:'u3',scheduledDate:'2026-09-12',scheduledTime:'10:30'},ctx('u2',1300));
assert.strictEqual(counter.occurrence.transferRequest.status,'COUNTER_PROPOSED');
assert.strictEqual(counter.occurrence.transferRequest.counterProposal.assigneeUid,'u3');
assert.deepStrictEqual(Array.from(counter.occurrence.assignmentUids),['u1']);
let counterAccepted=contract.apply(counter.occurrence,{type:'ACCEPT_COUNTER'},ctx('u1',1400));
assert.strictEqual(counterAccepted.retargeted,true,'third-person counter must create a fresh explicit request');
assert.strictEqual(counterAccepted.occurrence.transferRequest.status,'PENDING');
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
assert.strictEqual(helpAccepted.occurrence.helpRequest.status,'ACCEPTED');
assert.strictEqual(helpAccepted.occurrence.helpRequest.helperUid,'u2');
assert.deepStrictEqual(Array.from(helpAccepted.occurrence.assignmentUids),['u1'],'help must not silently become multi-person assignment');
let helpWithdrawn=contract.apply(help.occurrence,{type:'WITHDRAW_HELP'},ctx('u1',2200));
assert.strictEqual(helpWithdrawn.occurrence.helpRequest.status,'WITHDRAWN');

assert.throws(()=>contract.apply(base,{type:'REQUEST_TRANSFER',toUid:'u9'},ctx('u1')),/CLEANING_COLLAB_MEMBER_REQUIRED/,'targets must be active household members');
assert.throws(()=>contract.apply(transfer.occurrence,{type:'ACCEPT_TRANSFER'},ctx('u3')),/CLEANING_COLLAB_NOT_RECIPIENT/,'only target can accept transfer');
assert.throws(()=>contract.apply(help.occurrence,{type:'DECLINE_HELP'},ctx('u3')),/CLEANING_COLLAB_NOT_RECIPIENT/,'only help target can decline');

assert.match(experienceSource,/CleaningHouseholdRepository/,'collaboration must reuse the existing v2 repository');
assert.doesNotMatch(experienceSource,/\.on\(\s*['"]value['"]/,'collaboration must not create a second Firebase listener');
assert.match(experienceSource,/\.transaction\(function\(server\)/,'collaboration writes must transact the canonical occurrence');
assert.match(experienceSource,/cleaningPath\+'\/occurrences\/'/,'collaboration writes must stay occurrence-scoped');
assert.doesNotMatch(experienceSource,/\.push\s*\(/,'collaboration must never create duplicate occurrence/task/projection records');
assert.doesNotMatch(experienceSource,/MutationObserver|document\.addEventListener\('click'|TaskDetailPopup|CleaningExecutionWriteRuntime|CleaningProjectionService/,'forbidden legacy runtime techniques must stay absent');
assert.doesNotMatch(experienceSource,/NotificationStore|publishSelf|publishTo/,'v2.1 must not create noisy notification projection work');
assert.match(experienceSource,/panel\.addEventListener\('click',onClick\)/,'collaboration owns only its inline sub-root interactions');
assert.match(experienceSource,/syncAcceptedProjection/,'accepted transfers must update existing Task/Agenda projections');
assert.match(experienceSource,/state\.busy\.has\(occurrenceId\)/,'double tap guard must exist');
assert.match(premiumSource,/import '\.\/cleaningCollaborationExperience\.js\?v=1'/,'collaboration must remain lazy behind Cleaning navigation');
assert.match(premiumSource,/disabledForCleaningV2:true/,'legacy premium compatibility marker must remain inert');
assert.doesNotMatch(premiumSource,/MutationObserver|addEventListener|setTimeout|setInterval/,'premium shim itself must remain runtime-free');
assert.match(registrySource,/type:'cleaning\.occurrence\.transfer'/,'Action Inbox must expose occurrence transfer decisions');
assert.match(registrySource,/type:'cleaning\.occurrence\.counter'/,'Action Inbox must expose occurrence counter decisions');
assert.match(registrySource,/type:'cleaning\.help'/,'Action Inbox must expose help decisions');
assert.match(registrySource,/CleaningCollaborationV21\.handleInboxAction/,'Inbox decisions must route into the v2.1 collaboration writer');
assert.doesNotMatch(registrySource,/\.ref\s*\(/,'Action Inbox must remain writer-free');

console.log('Cleaning V2.1 collaboration contracts: PASS');