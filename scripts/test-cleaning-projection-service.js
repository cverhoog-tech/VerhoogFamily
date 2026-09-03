'use strict';
const assert=require('assert');
const fs=require('fs');
const path=require('path');
const vm=require('vm');
const source=fs.readFileSync(path.join(__dirname,'..','src','modules','cleaning','cleaningProjectionService.js'),'utf8');
const listeners={};
const context={
  console,
  setInterval:()=>1,
  clearInterval:()=>{},
  setTimeout:(fn)=>{fn();return 1;},
  addEventListener:(name,cb)=>{listeners[name]=cb;},
  dispatchEvent:()=>{},
  CustomEvent:function(name,options){this.type=name;this.detail=options&&options.detail;}
};
context.window=context;
vm.runInNewContext(source,context,{filename:'cleaningProjectionService.js'});
const service=context.CleaningProjectionService;
const build=service._buildProjectionUpdates;
const hid='family-1';
const planId='week_100_200';
const family={
  cleaning:{
    rooms:{living:{name:'Woonkamer'},bath:{name:'Badkamer'}},
    plans:{[planId]:{id:planId,householdId:hid,status:'ACTIVE',windowStartAt:100,windowEndAt:604800100,activatedAt:200000000,activatedByUid:'u1',occurrenceIds:['occ-a','occ-b']}},
    occurrences:{
      'occ-a':{id:'occ-a',householdId:hid,planId,roomId:'living',status:'FLEXIBLE',assignmentStatus:'ACTIVE',assignmentUids:['u1'],estimatedMinutes:20,earliestDueAt:210000000,latestDueAt:220000000,checklist:[{id:'r1',routineItemId:'r1',title:'Stofzuigen',estimatedMinutes:20,priority:'NORMAL',completed:false}],projections:{taskId:null,calendarEventId:null}},
      'occ-b':{id:'occ-b',householdId:hid,planId,roomId:'bath',status:'FLEXIBLE',assignmentStatus:'ACTIVE',assignmentUids:['u2'],estimatedMinutes:15,earliestDueAt:230000000,latestDueAt:240000000,checklist:[{id:'r2',routineItemId:'r2',title:'Douche',estimatedMinutes:15,priority:'EXTRA',completed:false}],projections:{taskId:null,calendarEventId:null}}
    }
  },
  tasks:{},
  calendarEvents:{}
};
const members=[{uid:'u1',displayName:'Shane'},{uid:'u2',displayName:'Esra'}];
const first=build({family,planId,householdId:hid,actorUid:'u1',timestamp:250000000,members});
assert.strictEqual(service.version,'0.2.0');
assert.strictEqual(first.createdTasks,2);
assert.strictEqual(first.createdCalendarEvents,2);
assert.strictEqual(first.linkedOccurrences,2);
assert.strictEqual(first.groupCount,2);
assert.strictEqual(first.complete,true);
assert.ok(first.updates['tasks/cleaning_occ-a']);
assert.ok(first.updates['calendarEvents/id_cleaning_occ-a']);
assert.strictEqual(first.updates['tasks/cleaning_occ-a'].assignedToUids.u1,true);
assert.strictEqual(first.updates['tasks/cleaning_occ-b'].who[0],'Esra');
assert.strictEqual(first.updates['calendarEvents/id_cleaning_occ-b'].flexible,true);
assert.strictEqual(first.updates['cleaning/occurrences/occ-a/projections/taskId'],'cleaning_occ-a');

function setPath(root,path,value){
  const parts=path.split('/');let cur=root;
  for(let i=0;i<parts.length-1;i++){if(!cur[parts[i]]||typeof cur[parts[i]]!=='object')cur[parts[i]]={};cur=cur[parts[i]];}
  const key=parts[parts.length-1];
  if(value===null)delete cur[key];
  else cur[key]=JSON.parse(JSON.stringify(value));
}
Object.keys(first.updates).forEach((path)=>setPath(family,path,first.updates[path]));
const second=build({family,planId,householdId:hid,actorUid:'u2',timestamp:260000000,members});
assert.strictEqual(second.createdTasks,0);
assert.strictEqual(second.createdCalendarEvents,0);
assert.strictEqual(Object.keys(second.updates).length,0);

family.cleaning.plans[planId].status='PROPOSED';
const inactive=build({family,planId,householdId:hid,actorUid:'u1',timestamp:270000000,members});
assert.strictEqual(Object.keys(inactive.updates).length,0);
family.cleaning.plans[planId].status='ACTIVE';

// Reuse source-linked records instead of duplicating when old projection IDs differ.
family.cleaning.occurrences['occ-a'].projections={taskId:null,calendarEventId:null};
delete family.tasks['cleaning_occ-a'];
delete family.calendarEvents['id_cleaning_occ-a'];
family.tasks.legacyTask={id:'legacy-clean-task',_key:'legacyTask',cleaningOccurrenceId:'occ-a',title:'Existing'};
family.calendarEvents.legacyEvent={id:'legacy-clean-event',_key:'legacyEvent',sourceId:'occ-a',title:'Existing',date:'2026-09-02'};
const reuse=build({family,planId,householdId:hid,actorUid:'u1',timestamp:280000000,members});
assert.strictEqual(reuse.createdTasks,0);
assert.strictEqual(reuse.createdCalendarEvents,0);
assert.strictEqual(reuse.updates['cleaning/occurrences/occ-a/projections/taskId'],'legacy-clean-task');
assert.strictEqual(reuse.updates['cleaning/occurrences/occ-a/projections/calendarEventId'],'legacy-clean-event');

family.cleaning.plans.empty={id:'empty',householdId:hid,status:'ACTIVE',windowStartAt:100,windowEndAt:604800100,activatedAt:200000000,occurrenceIds:[]};
const empty=build({family,planId:'empty',householdId:hid,actorUid:'u1',timestamp:290000000,members});
assert.strictEqual(empty.expectedOccurrences,0);
assert.strictEqual(empty.linkedOccurrences,0);
assert.strictEqual(empty.complete,true);
assert.strictEqual(Object.keys(empty.updates).length,0);

// Two canonical occurrences on the same room/day/person become one Task card
// and one Agenda event. Old per-occurrence projections are removed safely.
const groupPlan='week_group';
family.cleaning.rooms.kitchen={name:'Keuken'};
family.cleaning.plans[groupPlan]={id:groupPlan,householdId:hid,status:'ACTIVE',windowStartAt:1704067200000,windowEndAt:1704672000000,occurrenceIds:['occ-worktop','occ-floor']};
family.cleaning.occurrences['occ-worktop']={id:'occ-worktop',householdId:hid,planId:groupPlan,roomId:'kitchen',slotAt:1704240000000,status:'FLEXIBLE',assignmentStatus:'ACTIVE',assignmentUids:['u1'],estimatedMinutes:10,checklist:[{id:'worktop',routineItemId:'worktop',title:'Werkblad',estimatedMinutes:10,priority:'NORMAL',completed:false}],projections:{taskId:'cleaning_occ-worktop',calendarEventId:'cleaning_occ-worktop'}};
family.cleaning.occurrences['occ-floor']={id:'occ-floor',householdId:hid,planId:groupPlan,roomId:'kitchen',slotAt:1704240000000,status:'FLEXIBLE',assignmentStatus:'ACTIVE',assignmentUids:['u1'],estimatedMinutes:15,checklist:[{id:'floor',routineItemId:'floor',title:'Vloer',estimatedMinutes:15,priority:'EXTRA',completed:false}],projections:{taskId:'cleaning_occ-floor',calendarEventId:'cleaning_occ-floor'}};
family.tasks.oldWorktop={id:'cleaning_occ-worktop',_key:'oldWorktop',cleaningOccurrenceId:'occ-worktop',sourceType:'cleaning-occurrence',projectionManaged:true,subtasks:[{id:'worktop',sourceRoutineItemId:'worktop',done:true}]};
family.tasks.oldFloor={id:'cleaning_occ-floor',_key:'oldFloor',cleaningOccurrenceId:'occ-floor',sourceType:'cleaning-occurrence',projectionManaged:true,subtasks:[{id:'floor',sourceRoutineItemId:'floor',done:false}]};
family.calendarEvents.oldWorktop={id:'cleaning_occ-worktop',_key:'oldWorktop',cleaningOccurrenceId:'occ-worktop',sourceType:'cleaning-occurrence',projectionManaged:true};
family.calendarEvents.oldFloor={id:'cleaning_occ-floor',_key:'oldFloor',cleaningOccurrenceId:'occ-floor',sourceType:'cleaning-occurrence',projectionManaged:true};

const grouped=build({family,planId:groupPlan,householdId:hid,actorUid:'u1',timestamp:1704243600000,members});
assert.strictEqual(grouped.groupCount,1);
assert.strictEqual(grouped.createdTasks,1);
assert.strictEqual(grouped.createdCalendarEvents,1);
const groupedTaskPath=Object.keys(grouped.updates).find((key)=>key.startsWith('tasks/cleaning_group_'));
const groupedEventPath=Object.keys(grouped.updates).find((key)=>key.startsWith('calendarEvents/id_cleaning_group_'));
assert.ok(groupedTaskPath,'grouped Task projection must use a deterministic group id');
assert.ok(groupedEventPath,'grouped Calendar projection must use the same group id');
assert.strictEqual(grouped.updates[groupedTaskPath].subtasks.length,2);
assert.strictEqual(grouped.updates[groupedTaskPath].subtasks.find((item)=>item.sourceRoutineItemId==='worktop').done,true,'completed subtask state survives migration');
assert.strictEqual(grouped.updates['tasks/oldWorktop'],null);
assert.strictEqual(grouped.updates['tasks/oldFloor'],null);
const groupedId=grouped.updates[groupedTaskPath].id;
assert.strictEqual(grouped.updates['cleaning/occurrences/occ-worktop/projections/taskId'],groupedId);
assert.strictEqual(grouped.updates['cleaning/occurrences/occ-floor/projections/taskId'],groupedId);
Object.keys(grouped.updates).forEach((path)=>setPath(family,path,grouped.updates[path]));
const groupedAgain=build({family,planId:groupPlan,householdId:hid,actorUid:'u2',timestamp:1704247200000,members});
assert.strictEqual(Object.keys(groupedAgain.updates).length,0,'grouped projection must be idempotent');

console.log('cleaning grouped projection service: ok');
