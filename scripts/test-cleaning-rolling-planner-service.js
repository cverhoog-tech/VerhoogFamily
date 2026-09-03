'use strict';
const assert=require('assert');
const fs=require('fs');
const path=require('path');
const vm=require('vm');

const listeners={};
const context={
  console,Date,
  setInterval:()=>1,clearInterval:()=>{},setTimeout:()=>1,clearTimeout:()=>{},
  addEventListener:(name,cb)=>{listeners[name]=cb;},dispatchEvent:()=>{},
  CustomEvent:function(name,options){this.type=name;this.detail=options&&options.detail;}
};
context.window=context;
function load(name){const source=fs.readFileSync(path.join(__dirname,'..','src','modules','cleaning',name),'utf8');vm.runInNewContext(source,context,{filename:name});}
load('cleaningPlannerContract.js');
load('cleaningPlanPersistenceContract.js');
load('cleaningRecurringPlanContract.js');
load('cleaningRollingPlannerService.js');

const recurring=context.CleaningRecurringPlanContract;
const rolling=context.CleaningRollingPlannerService;
const DAY=recurring.DAY_MS;
const start=1704067200000; // Monday 1 Jan 2024 UTC
const end=start+7*DAY;
const hid='family-1';
const members=[{uid:'u1',displayName:'Shane',status:'active'},{uid:'u2',displayName:'Esra',status:'active'}];
const currentPlanId='week_'+start+'_'+end;
const root={
  rooms:{kitchen:{id:'kitchen',name:'Keuken',active:true,distributionMode:'FAIR_TIME'}},
  routines:{
    ongoing:{id:'ongoing',roomId:'kitchen',title:'Werkblad',intervalDays:2,estimatedMinutes:10,priority:'NORMAL',active:true,createdAt:start,repeatScope:'ONGOING',assignmentMode:'FIXED_PERSON',assignmentRequestStatus:'ACCEPTED',preferredAssigneeUid:'u1'},
    thisWeek:{id:'thisWeek',roomId:'kitchen',title:'Eenmalige poetsbeurt',intervalDays:1,estimatedMinutes:5,priority:'NORMAL',active:true,createdAt:start,repeatScope:'THIS_WEEK',repeatScopeWeekStartAt:start,repeatScopeWeekEndAt:end,assignmentMode:'FIXED_PERSON',assignmentRequestStatus:'ACCEPTED',preferredAssigneeUid:'u2'}
  },
  plans:{[currentPlanId]:{id:currentPlanId,householdId:hid,status:'ACTIVE',windowStartAt:start,windowEndAt:end,occurrenceIds:['current-occ']}},
  occurrences:{
    'current-occ':{id:'current-occ',householdId:hid,planId:currentPlanId,roomId:'kitchen',slotAt:start,status:'FLEXIBLE',assignmentStatus:'ACTIVE',assignmentUids:['u1'],routineItemIds:['ongoing'],checklist:[{id:'ongoing',routineItemId:'ongoing',title:'Werkblad',estimatedMinutes:10,dueAt:start,dueState:'DUE_IN_WINDOW',completed:false}]}
  },
  approvals:{}
};

const first=rolling._reconcileRoot({root,householdId:hid,actorUid:'u1',timestamp:start+2*DAY,members,recurringContract:recurring,horizonWeeks:2});
assert.strictEqual(rolling.version,'0.1.0');
assert.strictEqual(first.changed,true);
assert.strictEqual(first.planIds.length,2);

const nextPlanId='week_'+end+'_'+(end+7*DAY);
const followingPlanId='week_'+(end+7*DAY)+'_'+(end+14*DAY);
const nextPlan=first.root.plans[nextPlanId];
const followingPlan=first.root.plans[followingPlanId];
assert.ok(nextPlan&&followingPlan,'rolling service must create both future week plans');
assert.strictEqual(nextPlan.status,'ACTIVE');
assert.strictEqual(nextPlan.approvalState,'ROLLING_APPROVED');
assert.deepStrictEqual(Array.from(nextPlan.requiredApprovalUids),['u1']);
assert.strictEqual(nextPlan.occurrenceIds.length,3,'the next week keeps the Tue/Thu/Sat cadence');
assert.deepStrictEqual(Array.from(nextPlan.occurrenceIds).map((id)=>first.root.occurrences[id].slotAt),[end+DAY,end+3*DAY,end+5*DAY]);
assert.strictEqual(followingPlan.occurrenceIds.length,4,'the following week continues Mon/Wed/Fri/Sun');
assert.deepStrictEqual(Array.from(followingPlan.occurrenceIds).map((id)=>first.root.occurrences[id].slotAt),[end+7*DAY,end+9*DAY,end+11*DAY,end+13*DAY]);
assert.ok(nextPlan.occurrenceIds.every((id)=>first.root.occurrences[id].assignmentUids[0]==='u1'));
assert.ok(!Object.values(first.root.occurrences).some((row)=>Array.isArray(row.routineItemIds)&&row.routineItemIds.includes('thisWeek')&&Number(row.slotAt)>=end),'THIS_WEEK routine must not leak into rolling plans');
assert.strictEqual(first.root.approvals.u1[nextPlanId].status,'ACCEPTED');
assert.strictEqual(first.root.approvals.u1[nextPlanId].standingRoutineConsent,true);

const second=rolling._reconcileRoot({root:first.root,householdId:hid,actorUid:'u2',timestamp:start+2*DAY+1000,members,recurringContract:recurring,horizonWeeks:2});
assert.strictEqual(second.changed,false,'rolling horizon reconciliation must be idempotent');
assert.strictEqual(second.reason,'ALREADY_CURRENT');

console.log('cleaning rolling four-week planner: ok');
