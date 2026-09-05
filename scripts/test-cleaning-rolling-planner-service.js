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
    ongoing:{id:'ongoing',roomId:'kitchen',title:'Werkblad',intervalDays:2,estimatedMinutes:10,priority:'NORMAL',active:true,createdAt:start,repeatScope:'ONGOING',assignmentMode:'AUTO',assignmentRequestStatus:'AUTO'},
    thisWeek:{id:'thisWeek',roomId:'kitchen',title:'Eenmalige poetsbeurt',intervalDays:1,estimatedMinutes:5,priority:'NORMAL',active:true,createdAt:start,repeatScope:'THIS_WEEK',repeatScopeWeekStartAt:start,repeatScopeWeekEndAt:end,assignmentMode:'FIXED_PERSON',assignmentRequestStatus:'ACCEPTED',preferredAssigneeUid:'u2'},
    unapproved:{id:'unapproved',roomId:'kitchen',title:'Nog niet geaccepteerd',intervalDays:2,estimatedMinutes:7,priority:'NORMAL',active:true,createdAt:start,repeatScope:'ONGOING',assignmentMode:'AUTO',assignmentRequestStatus:'AUTO'}
  },
  plans:{[currentPlanId]:{id:currentPlanId,householdId:hid,status:'ACTIVE',windowStartAt:start,windowEndAt:end,occurrenceIds:['current-occ']}},
  occurrences:{
    'current-occ':{id:'current-occ',householdId:hid,planId:currentPlanId,roomId:'kitchen',slotAt:start,status:'COMPLETED',assignmentStatus:'COMPLETED',assignmentUids:['u1'],routineItemIds:['ongoing'],checklist:[{id:'ongoing',routineItemId:'ongoing',title:'Werkblad',estimatedMinutes:10,dueAt:start,dueState:'DUE_IN_WINDOW',completed:true}]}
  },
  approvals:{}
};

const first=rolling._reconcileRoot({root,householdId:hid,actorUid:'u1',timestamp:start+2*DAY,members,recurringContract:recurring,horizonWeeks:2});
assert.strictEqual(rolling.version,'0.1.5');
assert.strictEqual(rolling._assignmentAwaitingConsent({assignmentRequestStatus:'PENDING'}),true);
assert.strictEqual(rolling._assignmentAwaitingConsent({assignmentRequestStatus:'COUNTER_PROPOSED'}),true);
assert.strictEqual(rolling._assignmentAwaitingConsent({assignmentRequestStatus:'ACCEPTED'}),false);
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
assert.ok(!Object.values(first.root.occurrences).some((row)=>Array.isArray(row.routineItemIds)&&row.routineItemIds.includes('unapproved')&&Number(row.slotAt)>=end),'an ongoing routine without accepted standing assignment must not silently create future work');
assert.strictEqual(first.root.approvals.u1[nextPlanId].status,'ACCEPTED');
assert.strictEqual(first.root.approvals.u1[nextPlanId].standingRoutineConsent,true);

const second=rolling._reconcileRoot({root:first.root,householdId:hid,actorUid:'u2',timestamp:start+2*DAY+1000,members,recurringContract:recurring,horizonWeeks:2});
assert.strictEqual(second.changed,false,'rolling horizon reconciliation must be idempotent');
assert.strictEqual(second.reason,'ALREADY_CURRENT');

// A counter-proposal is still an unaccepted transfer. Even when pause
// continuity would otherwise supply a known assignee and a finite pause gets a
// planning shadow, the rolling horizon must not create work until consent.
const counterProposalRoot={
  rooms:{kitchen:{id:'kitchen',name:'Keuken',active:true}},
  routines:{counter:{
    id:'counter',roomId:'kitchen',title:'Werkblad overnemen',intervalDays:2,estimatedMinutes:8,priority:'NORMAL',active:true,createdAt:start,
    repeatScope:'ONGOING',assignmentMode:'REQUESTED',assignmentRequestStatus:'COUNTER_PROPOSED',preferredAssigneeUid:'u2',
    assignmentCounterProposedUid:'u1',assignmentCounterProposedByUid:'u2',paused:true,pauseSource:'ROUTINE',
    pausedAt:start+2*DAY,pauseUntilAt:start+3*DAY,pauseCadenceStartedAt:start+2*DAY,pauseCadenceNextDueAt:start+4*DAY,nextDueAt:start+4*DAY,
    continuityAssigneeUid:'u1',continuityAssignmentSource:'ACCEPTED_PLAN_BEFORE_PAUSE',continuityAnchorAt:start+DAY
  }},
  plans:{},occurrences:{},approvals:{}
};
const counterProposalRolling=rolling._reconcileRoot({root:counterProposalRoot,householdId:hid,actorUid:'u1',timestamp:start+2*DAY,members,recurringContract:recurring,horizonWeeks:2});
assert.ok(!Object.values(counterProposalRolling.root.occurrences||{}).some((row)=>Array.isArray(row.routineItemIds)&&row.routineItemIds.includes('counter')),'COUNTER_PROPOSED must never create rolling work before consent');

// A finite pause freezes the remaining countdown, not the recurrence itself.
// Here the routine had two days left when paused on Jan 3. A pause through Jan
// 15 therefore makes the next real clean Jan 17, then its 3-day interval keeps
// going on Jan 20. There must be no actual clean inside the pause.
const pauseRoot={
  rooms:{bathroom:{id:'bathroom',name:'Badkamer',active:true,distributionMode:'FAIR_TIME'}},
  routines:{
    paused:{
      id:'paused',roomId:'bathroom',title:'Douche reinigen',intervalDays:3,estimatedMinutes:12,priority:'NORMAL',active:true,
      createdAt:start,repeatScope:'ONGOING',assignmentMode:'AUTO',assignmentRequestStatus:'AUTO',paused:true,pauseSource:'ROUTINE',
      pausedAt:start+2*DAY,pauseUntilAt:start+14*DAY,pauseCadenceStartedAt:start+2*DAY,pauseCadenceNextDueAt:start+4*DAY,
      nextDueAt:start+4*DAY,continuityAssigneeUid:'u1',continuityAssignmentSource:'ACCEPTED_PLAN_BEFORE_PAUSE',continuityAnchorAt:start+DAY
    },
    indefinite:{
      id:'indefinite',roomId:'bathroom',title:'Voegen reinigen',intervalDays:7,estimatedMinutes:15,active:true,
      createdAt:start,repeatScope:'ONGOING',assignmentMode:'AUTO',assignmentRequestStatus:'AUTO',paused:true,pauseSource:'ROUTINE',pauseUntilAt:null,
      nextDueAt:start+3*DAY,continuityAssigneeUid:'u2',continuityAssignmentSource:'ACCEPTED_PLAN_BEFORE_PAUSE',continuityAnchorAt:start+DAY
    }
  },
  plans:{},occurrences:{},approvals:{}
};
const shadow=rolling._planningRoutines(pauseRoot);
assert.strictEqual(pauseRoot.routines.paused.paused,true,'rolling preview may never unpause canonical data');
assert.strictEqual(shadow.paused.paused,false,'finite pause gets a planning-only active shadow');
assert.strictEqual(shadow.paused.nextDueAt,start+16*DAY,'two days remaining at pause time must resume two days after the pause ends');
assert.strictEqual(shadow.indefinite.paused,true,'indefinite pause must not invent a future due date');
assert.strictEqual(rolling._finitePauseNextDue(pauseRoot,pauseRoot.routines.paused),start+16*DAY);
assert.strictEqual(rolling._finitePauseNextDue(pauseRoot,pauseRoot.routines.indefinite),null);

const pausedRolling=rolling._reconcileRoot({root:pauseRoot,householdId:hid,actorUid:'u1',timestamp:start+2*DAY,members,recurringContract:recurring,horizonWeeks:2});
const pausedSlots=Object.values(pausedRolling.root.occurrences)
  .filter((row)=>row.status!=='CANCELLED'&&Array.isArray(row.routineItemIds)&&row.routineItemIds.includes('paused'))
  .map((row)=>row.slotAt).sort((a,b)=>a-b);
assert.deepStrictEqual(pausedSlots,[start+16*DAY,start+19*DAY],'after the pause, real occurrences must continue on intervalDays');
assert.ok(pausedSlots.every((slot)=>slot>=start+14*DAY),'no real occurrence may be projected inside the pause');
assert.ok(Object.values(pausedRolling.root.occurrences).filter((row)=>Array.isArray(row.routineItemIds)&&row.routineItemIds.includes('paused')).every((row)=>row.assignmentUids[0]==='u1'),'accepted pre-pause assignment continuity must survive sanitizer removal');
assert.ok(!Object.values(pausedRolling.root.occurrences).some((row)=>Array.isArray(row.routineItemIds)&&row.routineItemIds.includes('indefinite')),'indefinite pause stays out of future rolling plans');

// A pause created by the previous runtime has no continuityAssigneeUid or
// pauseCadence* fields. Exact sanitizer history is enough to recover both the
// previously accepted assignee and the frozen countdown without guessing.
const legacyPlanId='week_legacy_pause';
const legacyPause={
  rooms:{bathroom:{id:'bathroom',name:'Badkamer',active:true}},
  routines:{legacy:{
    id:'legacy',roomId:'bathroom',title:'Spiegel reinigen',intervalDays:3,estimatedMinutes:8,priority:'NORMAL',active:true,createdAt:start,
    repeatScope:'ONGOING',assignmentMode:'AUTO',assignmentRequestStatus:'AUTO',paused:true,pauseSource:'ROUTINE',pausedAt:start+2*DAY,
    pauseUntilAt:start+14*DAY,nextDueAt:start+4*DAY
  }},
  plans:{[legacyPlanId]:{id:legacyPlanId,householdId:hid,status:'ACTIVE',rollingPlanVersion:0,windowStartAt:start,windowEndAt:end,occurrenceIds:[]}},
  occurrences:{'legacy-cancelled':{
    id:'legacy-cancelled',householdId:hid,planId:legacyPlanId,roomId:'bathroom',slotAt:start+2*DAY,status:'CANCELLED',assignmentStatus:'SKIPPED',
    assignmentUids:['u1'],routineItemIds:['legacy'],cancellationReason:'ROUTINES_REMOVED',cancelledAt:start+2*DAY,
    checklist:[{id:'legacy',routineItemId:'legacy',title:'Spiegel reinigen',estimatedMinutes:8,dueAt:start+4*DAY,dueState:'DUE_IN_WINDOW',completed:false}]
  }},approvals:{}
};
const legacyStanding=rolling._standingAssignments(legacyPause,members);
assert.strictEqual(legacyStanding.legacy,'u1','legacy pause must recover the exact accepted assignee from sanitizer history');
assert.strictEqual(rolling._finitePauseNextDue(legacyPause,legacyPause.routines.legacy),start+16*DAY,'legacy pause must preserve remaining countdown from pausedAt + nextDueAt');
const legacyResult=rolling._reconcileRoot({root:legacyPause,householdId:hid,actorUid:'u1',timestamp:start+2*DAY,members,recurringContract:recurring,horizonWeeks:2});
const legacySlots=Object.values(legacyResult.root.occurrences)
  .filter((row)=>row.status!=='CANCELLED'&&Array.isArray(row.routineItemIds)&&row.routineItemIds.includes('legacy'))
  .map((row)=>row.slotAt).sort((a,b)=>a-b);
assert.deepStrictEqual(legacySlots,[start+16*DAY,start+19*DAY]);
assert.ok(Object.values(legacyResult.root.occurrences).filter((row)=>row.status!=='CANCELLED'&&Array.isArray(row.routineItemIds)&&row.routineItemIds.includes('legacy')).every((row)=>row.assignmentUids[0]==='u1'));

// A room pause has precedence. A separately paused routine cannot leak a clean
// into an otherwise later room pause.
const roomPaused=JSON.parse(JSON.stringify(pauseRoot));
roomPaused.rooms.bathroom.paused=true;
roomPaused.rooms.bathroom.pauseUntilAt=start+18*DAY;
roomPaused.routines.paused.pauseUntilAt=start+14*DAY;
assert.strictEqual(rolling._finitePauseNextDue(roomPaused,roomPaused.routines.paused),start+20*DAY,'room pause must extend the effective resume before the frozen countdown continues');

// A rolling plan produced by an older runtime may not promote itself into
// standing consent. With no fixed or non-rolling accepted assignment it is
// cleaned up instead of being extended indefinitely.
const unsafeOccurrence='legacy-rolling-occ';
const legacyOnly={
  rooms:{kitchen:{id:'kitchen',name:'Keuken',active:true}},
  routines:{unsafe:{id:'unsafe',roomId:'kitchen',title:'Onbevestigde routine',intervalDays:2,estimatedMinutes:8,active:true,createdAt:start,repeatScope:'ONGOING',assignmentMode:'AUTO',assignmentRequestStatus:'AUTO'}},
  plans:{[nextPlanId]:{id:nextPlanId,householdId:hid,status:'ACTIVE',approvalState:'ROLLING_APPROVED',rollingPlanVersion:1,windowStartAt:end,windowEndAt:end+7*DAY,occurrenceIds:[unsafeOccurrence]}},
  occurrences:{[unsafeOccurrence]:{id:unsafeOccurrence,householdId:hid,planId:nextPlanId,roomId:'kitchen',slotAt:end+DAY,status:'FLEXIBLE',assignmentStatus:'ACTIVE',assignmentUids:['u2'],routineItemIds:['unsafe'],checklist:[{id:'unsafe',routineItemId:'unsafe',title:'Onbevestigde routine',estimatedMinutes:8,dueAt:end+DAY,dueState:'DUE_IN_WINDOW',completed:false}],rollingGenerated:true}},
  approvals:{u2:{[nextPlanId]:{id:nextPlanId+'__u2',householdId:hid,planId:nextPlanId,uid:'u2',status:'ACCEPTED',standingRoutineConsent:true,occurrenceIds:[unsafeOccurrence]}}}
};
const migration=rolling._reconcileRoot({root:legacyOnly,householdId:hid,actorUid:'u1',timestamp:start+2*DAY,members,recurringContract:recurring,horizonWeeks:2});
assert.strictEqual(migration.changed,true);
assert.strictEqual(migration.root.occurrences[unsafeOccurrence].status,'CANCELLED');
assert.ok(!Object.values(migration.root.occurrences).some((row)=>row.status!=='CANCELLED'&&Array.isArray(row.routineItemIds)&&row.routineItemIds.includes('unsafe')));

console.log('cleaning rolling planner keeps cadence and blocks unaccepted collaboration states: ok');