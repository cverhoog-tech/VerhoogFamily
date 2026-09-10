#!/usr/bin/env node
'use strict';
const assert=require('assert');
const fs=require('fs');
const path=require('path');
const vm=require('vm');
const ROOT=path.resolve(__dirname,'..');
function read(rel){return fs.readFileSync(path.join(ROOT,rel),'utf8');}

const contractSource=read('src/modules/cleaning/cleaningHistoryContract.js');
const historySource=read('src/modules/cleaning/cleaningHistoryV22.js');
const premiumSource=read('src/modules/cleaning/cleaningPremiumFeedback.js');
const navigationSource=read('src/core/navigation.js');
const statusSource=read('FamilyApp-Schoonmaken-current-status.md');
const milestoneSource=read('FamilyApp-Schoonmaken-milestone-log.md');
const todoSource=read('FamilyApp-TODO-updated.txt');
const currentTodoSource=read('docs/FAMILYAPP-CURRENT-TODO.md');
const progressSource=read('docs/household-rebuild-v2-progress.md');
const fixSource=read('docs/FAMILYAPP-FIX-LIST.md');
const architectureSource=read('FamilyApp-Schoonmaken-module-architectuur.md');

const sandbox={window:{},Date:Date,JSON:JSON,Error:Error,String:String,Number:Number,Array:Array,Object:Object,Math:Math,Set:Set};
vm.createContext(sandbox);
vm.runInContext(contractSource,sandbox,{filename:'cleaningHistoryContract.js'});
const contract=sandbox.window.CleaningHistoryContract;
assert.ok(contract,'CleaningHistoryContract must install');
assert.strictEqual(contract.version,'2.2.0');

const now=Date.now();
const day=86400000;
const today=new Date(now);today.setHours(0,0,0,0);
const todayAt=today.getTime();
function iso(timestamp){const d=new Date(timestamp);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
const data={
  rooms:{room1:{name:'Woonkamer'},room2:{name:'Badkamer'}},
  routines:{r1:{title:'Stofzuigen',roomId:'room1'},r2:{title:'Afstoffen',roomId:'room1'},r3:{title:'Douche reinigen',roomId:'room2'}},
  completionLogs:{
    log1:{status:'COMPLETED',roomId:'room1',completedAt:now-2*60*60*1000,completedByUid:'u1',estimatedMinutes:25,checklist:[{routineItemId:'r1',title:'Stofzuigen',completed:true},{routineItemId:'r2',title:'Afstoffen',completed:true}]},
    log2:{status:'COMPLETED',roomId:'room2',completedAt:now-60*60*1000,completedByUid:'u2',estimatedMinutes:15,checklist:[{routineItemId:'r3',title:'Douche reinigen',completed:true}]},
    log3:{status:'REOPENED',roomId:'room1',completedAt:now-3*60*60*1000,reopenedAt:now-30*60*1000,completedByUid:'u1',estimatedMinutes:25,checklist:[{routineItemId:'r1',title:'Stofzuigen',completed:true}]}
  },
  occurrences:{
    todayMine:{status:'FLEXIBLE',assignmentStatus:'ACTIVE',assignmentUids:['u1'],scheduledDate:iso(todayAt),estimatedMinutes:20},
    overdueMine:{status:'FLEXIBLE',assignmentStatus:'ACTIVE',assignmentUids:['u1'],scheduledDate:iso(todayAt-day),estimatedMinutes:10},
    todayOther:{status:'FLEXIBLE',assignmentStatus:'ACTIVE',assignmentUids:['u2'],scheduledDate:iso(todayAt),estimatedMinutes:30},
    completedMine:{status:'COMPLETED',assignmentStatus:'COMPLETED',assignmentUids:['u1'],scheduledDate:iso(todayAt),estimatedMinutes:40}
  }
};

const logs=contract.logs(data);
assert.strictEqual(logs.length,3,'history reads canonical completion logs without a second store');
assert.ok(logs[0]._at>=logs[1]._at,'history logs sort newest first');
const rooms=contract.roomRows(data,now);
assert.strictEqual(rooms.length,2,'history groups completion logs by room');
const living=rooms.find(row=>row.roomId==='room1');
assert.ok(living,'living room history should exist');
assert.strictEqual(living.activity30,1,'reopened logs must not count as completed room activity');
assert.ok(living.routines.some(row=>row.id==='r1'),'routine history is derived from completion checklist data');
const summary=contract.summary(data,now);
assert.strictEqual(summary.totalCompleted,2,'only genuine completed logs count as completions');
assert.strictEqual(summary.peopleCount,2,'weekly history retains who completed Cleaning');
assert.ok(summary.weekMinutes>=40,'weekly summary totals completed minutes');
const reminders=contract.reminders(data,'u1',now);
assert.strictEqual(reminders.todayCount,1,'today attention only counts current assignee');
assert.strictEqual(reminders.overdueCount,1,'overdue attention only counts current assignee');
assert.strictEqual(reminders.todayMinutes,20);
assert.strictEqual(reminders.overdueMinutes,10);
assert.strictEqual(contract.reminders(data,'u2',now).todayCount,1,'another member gets their own attention projection');
const event=contract.activityEvent(data,'log1',data.completionLogs.log1);
assert.strictEqual(event.type,'cleaning.completed');
assert.strictEqual(event.occurrenceKey,'cleaning:completion:log1','activity event dedupe key must be deterministic');
assert.strictEqual(event.actorUid,'u1');
assert.strictEqual(event.payload.roomName,'Woonkamer');
assert.strictEqual(contract.activityEvent(data,'log3',data.completionLogs.log3),null,'reopened log must not publish a completed activity event');

assert.match(historySource,/CleaningHouseholdRepository/,'V2.2 must reuse the existing Cleaning repository');
assert.match(historySource,/repo\.subscribe/,'V2.2 history must derive from the existing repository snapshot');
assert.match(historySource,/data-ch22-history/,'V2.2 must expose a History tab');
assert.match(historySource,/ch22-has-history/,'four-tab layout must explicitly adapt the accepted three-tab grid');
assert.match(historySource,/data-ch22-attention/,'V2.2 must expose a quiet in-module attention row');
assert.match(historySource,/HouseholdActivity/,'new Cleaning completions may project into the existing Activity feed');
assert.match(historySource,/state\.seen=new Set\(Object\.keys\(logs\)\)/,'first ready snapshot must baseline existing logs instead of flooding Activity');
assert.match(historySource,/state\.seen\.has\(id\)/,'only newly observed logs should be considered for Activity projection');
assert.doesNotMatch(historySource,/\.on\(\s*['"]value['"]|firebase\.database|fbDb/,'V2.2 must not add a second Firebase listener or database owner');
assert.doesNotMatch(historySource,/new\s+MutationObserver|MutationObserver\s*\(/,'V2.2 must not use MutationObserver');
assert.doesNotMatch(historySource,/setInterval\s*\(|setTimeout\s*\(/,'V2.2 must not add polling or timer loops');
assert.doesNotMatch(historySource,/NotificationStore|publishSelf|publishToUids|pushDelivery|notificationProjector/i,'V2.2 reminders stay in-module and must not create notification noise');
assert.doesNotMatch(historySource,/TaskDetailPopup|CleaningExecutionWriteRuntime|CleaningProjectionService/,'V2.2 must not reactivate legacy freeze-prone owners');
assert.doesNotMatch(contractSource,/\.ref\s*\(|firebase|document\.|MutationObserver|setInterval|setTimeout/,'history contract must remain pure');
assert.match(premiumSource,/import '\.\/cleaningHistoryV22\.js\?v=1'/,'V2.2 history must stay lazy behind Cleaning navigation');
assert.match(premiumSource,/import '\.\/cleaningCollaborationExperience\.js\?v=2'/,'V2.1 collaboration must remain present while V2.2 is added');
assert.match(premiumSource,/version:'2\.2\.0'/,'Cleaning companion marker must advance to V2.2');
assert.doesNotMatch(premiumSource,/cleaningHistoryExperience|cleaningActivityProjector|cleaningNotificationProjector/,'old pre-reset history/activity/notification runtimes must stay disconnected');
assert.doesNotMatch(navigationSource,/cleaningHistoryV22|cleaningHistoryContract/,'V2.2 must not move onto global app startup/navigation bootstrap');

[statusSource,milestoneSource,todoSource,currentTodoSource,progressSource,fixSource].forEach(source=>{
  assert.match(source,/V2\.2/,'current status/roadmap docs must mention V2.2');
  assert.match(source,/multi-user|MULTI-USER/i,'current docs must preserve the deferred V2.1 multi-user verification gate');
});
assert.match(statusSource,/V2\.2[\s\S]{0,200}CODECANDIDATE GEREED/,'current Cleaning status must mark V2.2 as candidate, not accepted');
assert.match(milestoneSource,/V2\.2[\s\S]{0,200}CODECANDIDATE GEREED/,'milestone log must record the V2.2 candidate');
assert.match(architectureSource,/Cleaning V2\.2 pure history contract/,'architecture must document the V2.2 read-model layer');
assert.match(architectureSource,/(?:geen|nooit een) tweede raw Firebase listener/,'architecture must preserve one raw Cleaning listener');
assert.match(architectureSource,/cleaningActivityProjector\.js` blijft disconnected historical reference/,'old activity projector must remain explicitly disconnected');
assert.match(architectureSource,/cleaningNotificationProjector\.js` blijft disconnected historical reference/,'old notification projector must remain explicitly disconnected');

console.log('Cleaning V2.2 history/activity/reminder contracts: PASS');