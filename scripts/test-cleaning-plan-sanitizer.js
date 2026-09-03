'use strict';
const assert=require('assert');
const fs=require('fs');
const path=require('path');
const vm=require('vm');

const source=fs.readFileSync(path.join(__dirname,'..','src','modules','cleaning','cleaningPlanSanitizer.js'),'utf8');
const listeners={};
const context={
  console,Date,Math,JSON,Promise,
  setInterval:()=>1,clearInterval:()=>{},setTimeout:()=>1,clearTimeout:()=>{},
  addEventListener:(name,fn)=>{listeners[name]=fn;},dispatchEvent:()=>{},
  CustomEvent:function(name,options){this.type=name;this.detail=options&&options.detail;}
};
context.window=context;
vm.runInNewContext(source,context,{filename:'cleaningPlanSanitizer.js'});
const sanitizer=context.CleaningPlanSanitizer;
assert.ok(sanitizer);
assert.strictEqual(sanitizer.version,'0.1.0');

const planId='week-1';
const root={
  rooms:{
    old:{id:'old',name:'Oude woonkamer',active:false},
    current:{id:'current',name:'Nieuwe woonkamer',active:true}
  },
  routines:{
    oldRoutine:{id:'oldRoutine',roomId:'old',title:'Oude kamer',active:true},
    keep:{id:'keep',roomId:'current',title:'Stofzuigen',active:true},
    removed:{id:'removed',roomId:'current',title:'Oude routine',active:false}
  },
  plans:{
    [planId]:{
      id:planId,householdId:'family-1',status:'ACTIVE',approvalState:'APPROVED',
      windowStartAt:100,windowEndAt:100000,occurrenceIds:['old-occ','current-occ'],
      requiredApprovalUids:['u1','u2'],acceptedApprovalUids:['u1','u2'],declinedApprovalUids:[],
      summary:{occurrenceCount:2,routineCount:3,totalEstimatedMinutes:35},activatedAt:90,activatedByUid:'u1'
    }
  },
  occurrences:{
    'old-occ':{
      id:'old-occ',planId,roomId:'old',status:'FLEXIBLE',assignmentStatus:'ACTIVE',assignmentUids:['u1'],estimatedMinutes:15,dueState:'DUE_IN_WINDOW',
      checklist:[{id:'oldRoutine',routineItemId:'oldRoutine',title:'Oude kamer',estimatedMinutes:15,dueAt:500,dueState:'DUE_IN_WINDOW',completed:false}]
    },
    'current-occ':{
      id:'current-occ',planId,roomId:'current',status:'FLEXIBLE',assignmentStatus:'ACTIVE',assignmentUids:['u2'],estimatedMinutes:20,dueState:'OVERDUE',
      checklist:[
        {id:'keep',routineItemId:'keep',title:'Stofzuigen',estimatedMinutes:12,dueAt:600,dueState:'OVERDUE',completed:false},
        {id:'removed',routineItemId:'removed',title:'Oude routine',estimatedMinutes:8,dueAt:700,dueState:'DUE_IN_WINDOW',completed:false}
      ],routineItemIds:['keep','removed']
    }
  },
  approvals:{
    u1:{[planId]:{id:planId+'__u1',planId,uid:'u1',status:'ACCEPTED',occurrenceIds:['old-occ'],createdAt:80}},
    u2:{[planId]:{id:planId+'__u2',planId,uid:'u2',status:'ACCEPTED',occurrenceIds:['current-occ'],createdAt:80}}
  }
};

let result=sanitizer._sanitizeRoot({root,planId,householdId:'family-1',actorUid:'u1',timestamp:1000});
assert.strictEqual(result.changed,true);
assert.deepStrictEqual(Array.from(result.removedOccurrenceIds),['old-occ']);
assert.deepStrictEqual(Array.from(result.trimmedOccurrenceIds),['current-occ']);
assert.deepStrictEqual(Array.from(result.remainingOccurrenceIds),['current-occ']);

const cleaned=result.root;
assert.strictEqual(cleaned.occurrences['old-occ'].status,'CANCELLED','removed room occurrence must leave the active plan');
assert.strictEqual(cleaned.occurrences['old-occ'].assignmentStatus,'SKIPPED');
assert.strictEqual(cleaned.occurrences['old-occ'].cancellationReason,'ROOM_REMOVED');
assert.deepStrictEqual(Array.from(cleaned.occurrences['current-occ'].routineItemIds),['keep']);
assert.strictEqual(cleaned.occurrences['current-occ'].checklist.length,1);
assert.strictEqual(cleaned.occurrences['current-occ'].estimatedMinutes,12);
assert.strictEqual(cleaned.occurrences['current-occ'].dueState,'OVERDUE');

const plan=cleaned.plans[planId];
assert.strictEqual(plan.status,'ACTIVE','removing obsolete work must not deactivate already accepted remaining work');
assert.strictEqual(plan.approvalState,'APPROVED');
assert.deepStrictEqual(Array.from(plan.occurrenceIds),['current-occ']);
assert.deepStrictEqual(Array.from(plan.requiredApprovalUids),['u2']);
assert.deepStrictEqual(Array.from(plan.acceptedApprovalUids),['u2']);
assert.strictEqual(plan.summary.occurrenceCount,1);
assert.strictEqual(plan.summary.routineCount,1);
assert.strictEqual(plan.summary.totalEstimatedMinutes,12);
assert.strictEqual(plan.summary.overdueOccurrenceCount,1);
assert.strictEqual(cleaned.approvals.u1[planId].status,'SUPERSEDED','person with only removed work no longer blocks plan state');
assert.deepStrictEqual(Array.from(cleaned.approvals.u1[planId].occurrenceIds),[]);
assert.strictEqual(cleaned.approvals.u2[planId].status,'ACCEPTED');
assert.deepStrictEqual(Array.from(cleaned.approvals.u2[planId].occurrenceIds),['current-occ']);

result=sanitizer._sanitizeRoot({root:cleaned,planId,householdId:'family-1',actorUid:'u1',timestamp:2000});
assert.strictEqual(result.changed,false,'sanitizing an already-current plan must be idempotent');
assert.strictEqual(result.reason,'ALREADY_CLEAN');

// A completed occurrence from a removed room is removed from the live plan but
// remains historical completion data rather than being rewritten as cancelled.
const historyRoot=JSON.parse(JSON.stringify(cleaned));
historyRoot.rooms.current.active=false;
historyRoot.occurrences['current-occ'].status='COMPLETED';
historyRoot.occurrences['current-occ'].assignmentStatus='COMPLETED';
historyRoot.plans[planId].occurrenceIds=['current-occ'];
const history=sanitizer._sanitizeRoot({root:historyRoot,planId,householdId:'family-1',actorUid:'u1',timestamp:3000});
assert.strictEqual(history.changed,true);
assert.deepStrictEqual(Array.from(history.root.plans[planId].occurrenceIds),[]);
assert.strictEqual(history.root.occurrences['current-occ'].status,'COMPLETED','history must stay completed');

assert.ok(source.includes('CleaningActivePlanReconciler'));
assert.ok(source.includes('CleaningProjectionService'));
assert.ok(!source.includes('MutationObserver'));
assert.ok(!source.includes('document.'));
assert.ok(!source.includes('cleaning-approval-copy'));

console.log('cleaning stale room/routine plan sanitizer: ok');
