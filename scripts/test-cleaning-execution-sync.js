'use strict';
const assert=require('assert');
const fs=require('fs');
const path=require('path');
const vm=require('vm');

const source=fs.readFileSync(path.join(__dirname,'..','src','modules','cleaning','cleaningExecutionSync.js'),'utf8');
const context={console,Date};
context.window=context;
vm.runInNewContext(source,context,{filename:'cleaningExecutionSync.js'});
const sync=context.CleaningExecutionSync;
assert.strictEqual(sync.version,'0.2.0');
assert.ok(!source.includes('firebase.database'));
assert.ok(!source.includes('.transaction('));
assert.ok(!source.includes('addEventListener'));

const hid='family-1';
const planId='week-1';
const baseTime=new Date(2026,8,3,12,0,0,0).getTime();
let family={
  cleaning:{
    plans:{[planId]:{id:planId,householdId:hid,status:'ACTIVE',occurrenceIds:['occ-a','occ-b']}},
    occurrences:{
      'occ-a':{id:'occ-a',householdId:hid,planId,roomId:'kitchen',slotAt:baseTime,status:'FLEXIBLE',assignmentStatus:'ACTIVE',assignmentUids:['u1'],estimatedMinutes:10,checklist:[{id:'sink',routineItemId:'sink',title:'Spoelbak',estimatedMinutes:10,completed:false}],projections:{taskId:'task-group',calendarEventId:'event-group'}},
      'occ-b':{id:'occ-b',householdId:hid,planId,roomId:'kitchen',slotAt:baseTime,status:'FLEXIBLE',assignmentStatus:'ACTIVE',assignmentUids:['u1'],estimatedMinutes:15,checklist:[{id:'floor',routineItemId:'floor',title:'Vloer',estimatedMinutes:15,completed:false}],projections:{taskId:'task-group',calendarEventId:'event-group'}}
    },
    completionLogs:{}
  },
  tasks:{
    group:{id:'task-group',_key:'group',householdId:hid,projectionManaged:true,sourceType:'cleaning-occurrence-group',cleaningOccurrenceIds:['occ-a','occ-b'],date:'2026-09-03',time:'',subtasks:[
      {id:'sink',sourceRoutineItemId:'sink',cleaningOccurrenceId:'occ-a',title:'Spoelbak',done:false},
      {id:'floor',sourceRoutineItemId:'floor',cleaningOccurrenceId:'occ-b',title:'Vloer',done:false}
    ],done:false,status:'open',progress:0}
  },
  calendarEvents:{
    event:{id:'event-group',_key:'event',householdId:hid,projectionManaged:true,sourceType:'cleaning-occurrence-group',cleaningOccurrenceIds:['occ-a','occ-b'],date:'2026-09-03',time:'',flexible:true,completed:false}
  }
};

let result=sync._applyTaskPatchToFamily({
  family,taskId:'task-group',householdId:hid,actorUid:'u1',timestamp:baseTime+1000,
  patch:{subtasks:[
    {id:'sink',sourceRoutineItemId:'sink',cleaningOccurrenceId:'occ-a',title:'Spoelbak',done:true,icon:'🧽'},
    {id:'floor',sourceRoutineItemId:'floor',cleaningOccurrenceId:'occ-b',title:'Vloer',done:false}
  ]}
});
assert.strictEqual(result.handled,true);
family=result.family;
assert.strictEqual(family.cleaning.occurrences['occ-a'].checklist[0].completed,true);
assert.strictEqual(family.cleaning.occurrences['occ-a'].status,'COMPLETED');
assert.strictEqual(family.cleaning.occurrences['occ-b'].status,'FLEXIBLE');
assert.strictEqual(family.tasks.group.done,false);
assert.strictEqual(family.tasks.group.progress,50);
assert.strictEqual(family.tasks.group.subtasks[0].icon,'🧽');
assert.strictEqual(Object.keys(family.cleaning.completionLogs).length,1);

result=sync._applyTaskPatchToFamily({family,taskId:'task-group',householdId:hid,actorUid:'u1',timestamp:baseTime+2000,patch:{subtasks:family.tasks.group.subtasks}});
family=result.family;
assert.strictEqual(Object.keys(family.cleaning.completionLogs).length,1,'same state must not create another completion log');

const finishSubs=family.tasks.group.subtasks.map((item)=>Object.assign({},item,{done:true,completed:true}));
result=sync._applyTaskPatchToFamily({family,taskId:'task-group',householdId:hid,actorUid:'u1',timestamp:baseTime+3000,patch:{subtasks:finishSubs}});
family=result.family;
assert.strictEqual(family.cleaning.occurrences['occ-b'].status,'COMPLETED');
assert.strictEqual(family.tasks.group.done,true);
assert.strictEqual(family.tasks.group.progress,100);
assert.strictEqual(family.calendarEvents.event.completed,true);
assert.strictEqual(Object.keys(family.cleaning.completionLogs).length,2);

const reopenSubs=family.tasks.group.subtasks.map((item)=>Object.assign({},item,{done:item.sourceRoutineItemId!=='sink',completed:item.sourceRoutineItemId!=='sink'}));
result=sync._applyTaskPatchToFamily({family,taskId:'task-group',householdId:hid,actorUid:'u1',timestamp:baseTime+4000,patch:{subtasks:reopenSubs}});
family=result.family;
assert.strictEqual(family.cleaning.occurrences['occ-a'].status,'FLEXIBLE');
assert.strictEqual(family.cleaning.occurrences['occ-a'].assignmentStatus,'ACTIVE');
assert.strictEqual(family.tasks.group.done,false);
assert.ok(Object.values(family.cleaning.completionLogs).some((log)=>log.occurrenceId==='occ-a'&&log.status==='REOPENED'));

result=sync._applyTaskPatchToFamily({family,taskId:'task-group',householdId:hid,actorUid:'u1',timestamp:baseTime+5000,patch:{date:'2026-09-06',time:'09:30',desc:'ignored managed description',prio:'hoog'}});
family=result.family;
for(const id of ['occ-a','occ-b']){
  assert.strictEqual(family.cleaning.occurrences[id].scheduledDate,'2026-09-06');
  assert.strictEqual(family.cleaning.occurrences[id].scheduledTime,'09:30');
  assert.ok(Number(family.cleaning.occurrences[id].scheduledStartAt)>0);
}
assert.strictEqual(family.tasks.group.date,'2026-09-06');
assert.strictEqual(family.tasks.group.time,'09:30');
assert.strictEqual(family.calendarEvents.event.date,'2026-09-06');
assert.strictEqual(family.calendarEvents.event.time,'09:30');
assert.strictEqual(family.calendarEvents.event.flexible,false);

result=sync._applyCalendarPatchToFamily({family,eventId:'event-group',householdId:hid,actorUid:'u1',timestamp:baseTime+6000,patch:{date:'2026-09-08',time:'',title:'ignored managed title'}});
family=result.family;
assert.strictEqual(family.calendarEvents.event.date,'2026-09-08');
assert.strictEqual(family.calendarEvents.event.time,'');
assert.strictEqual(family.calendarEvents.event.flexible,true);
assert.strictEqual(family.tasks.group.date,'2026-09-08');
assert.strictEqual(family.tasks.group.time,'');
for(const id of ['occ-a','occ-b']){
  assert.strictEqual(family.cleaning.occurrences[id].scheduledDate,'2026-09-08');
  assert.strictEqual(family.cleaning.occurrences[id].scheduledTime,'');
  assert.strictEqual(family.cleaning.occurrences[id].scheduledStartAt,null);
}

assert.throws(()=>sync._applyTaskPatchToFamily({
  family,taskId:'task-group',householdId:hid,actorUid:'u1',timestamp:baseTime+7000,
  patch:{subtasks:[family.tasks.group.subtasks[0]]}
}),/CLEANING_EXECUTION_CHECKLIST_STRUCTURE_LOCKED/);

const plainTask=sync._applyTaskPatchToFamily({family:{tasks:{plain:{id:'plain',title:'Normaal'}}},taskId:'plain',householdId:hid,actorUid:'u1',timestamp:baseTime,patch:{done:true}});
assert.strictEqual(plainTask.handled,false);
assert.strictEqual(sync._isCleaningProjection({id:'x'}),false);
assert.strictEqual(sync._isCleaningProjection(family.tasks.group),true);

console.log('cleaning pure Task/Calendar execution contract: ok');
