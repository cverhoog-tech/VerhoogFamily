'use strict';
const assert=require('assert');
const fs=require('fs');
const path=require('path');
const vm=require('vm');
const source=fs.readFileSync(path.join(__dirname,'..','src','modules','cleaning','cleaningProjectionService.js'),'utf8');
const context={
  console,Date,
  setInterval:()=>1,clearInterval:()=>{},setTimeout:(fn)=>{fn();return 1;},
  addEventListener:()=>{},dispatchEvent:()=>{},CustomEvent:function(name,options){this.type=name;this.detail=options&&options.detail;}
};
context.window=context;
vm.runInNewContext(source,context,{filename:'cleaningProjectionService.js'});
const service=context.CleaningProjectionService;
const build=service._buildProjectionUpdates;
assert.strictEqual(service.version,'0.3.1');

const hid='family-1';
const planId='week-1';
const start=new Date(2026,8,1,0,0,0,0).getTime();
const family={
  cleaning:{
    rooms:{kitchen:{name:'Keuken'}},
    plans:{[planId]:{id:planId,householdId:hid,status:'ACTIVE',windowStartAt:start,windowEndAt:start+7*86400000,occurrenceIds:['occ-a','occ-b']}},
    occurrences:{
      'occ-a':{id:'occ-a',householdId:hid,planId,roomId:'kitchen',slotAt:start+2*86400000,status:'FLEXIBLE',assignmentStatus:'ACTIVE',assignmentUids:['u1'],estimatedMinutes:10,createdAt:start,checklist:[{id:'sink',routineItemId:'sink',title:'Spoelbak',estimatedMinutes:10,priority:'NORMAL',completed:true}],projections:{}},
      'occ-b':{id:'occ-b',householdId:hid,planId,roomId:'kitchen',slotAt:start+2*86400000,status:'FLEXIBLE',assignmentStatus:'ACTIVE',assignmentUids:['u1'],estimatedMinutes:15,createdAt:start,checklist:[{id:'floor',routineItemId:'floor',title:'Vloer',estimatedMinutes:15,priority:'EXTRA',completed:false}],projections:{}}
    }
  },tasks:{},calendarEvents:{}
};
const members=[{uid:'u1',displayName:'Shane'}];
function setPath(root,pathName,value){const parts=pathName.split('/');let cur=root;for(let i=0;i<parts.length-1;i++){if(!cur[parts[i]]||typeof cur[parts[i]]!=='object')cur[parts[i]]={};cur=cur[parts[i]];}const key=parts[parts.length-1];if(value===null)delete cur[key];else cur[key]=JSON.parse(JSON.stringify(value));}
function apply(root,updates){Object.keys(updates).forEach((key)=>setPath(root,key,updates[key]));}

const first=build({family,planId,householdId:hid,actorUid:'u1',timestamp:start+1000,members});
assert.strictEqual(first.groupCount,1);
assert.strictEqual(first.createdTasks,1);
assert.strictEqual(first.createdCalendarEvents,1);
const taskPath=Object.keys(first.updates).find((key)=>key.startsWith('tasks/cleaning_group_'));
const eventPath=Object.keys(first.updates).find((key)=>key.startsWith('calendarEvents/id_cleaning_group_'));
assert.ok(taskPath&&eventPath);
assert.strictEqual(first.updates[taskPath].subtasks.length,2);
assert.strictEqual(first.updates[taskPath].subtasks.find((x)=>x.sourceRoutineItemId==='sink').done,true,'canonical checklist drives completion');
assert.strictEqual(first.updates[taskPath].subtasks.find((x)=>x.sourceRoutineItemId==='floor').done,false);
assert.strictEqual(first.updates[taskPath].done,false);
apply(family,first.updates);
const second=build({family,planId,householdId:hid,actorUid:'u1',timestamp:start+2000,members});
assert.deepStrictEqual(Object.keys(second.updates),[],'projection is idempotent');

// Task-only completion edits are not treated as canonical on the next projection.
const taskKey=taskPath.split('/')[1];
family.tasks[taskKey].subtasks[1].done=true;
family.tasks[taskKey].subtasks[1].completed=true;
family.tasks[taskKey].done=true;
const correct=build({family,planId,householdId:hid,actorUid:'u1',timestamp:start+3000,members});
assert.ok(correct.updates['tasks/'+taskKey]);
assert.strictEqual(correct.updates['tasks/'+taskKey].subtasks.find((x)=>x.sourceRoutineItemId==='floor').done,false);
assert.strictEqual(correct.updates['tasks/'+taskKey].done,false);
apply(family,correct.updates);

// Task-local presentation metadata, such as an icon, survives reprojection.
family.tasks[taskKey].subtasks[0].icon='🧽';
family.cleaning.occurrences['occ-b'].checklist[0].completed=true;
family.cleaning.occurrences['occ-a'].status='COMPLETED';
family.cleaning.occurrences['occ-a'].assignmentStatus='COMPLETED';
family.cleaning.occurrences['occ-a'].completedAt=start+3500;
family.cleaning.occurrences['occ-a'].completedByUid='u1';
family.cleaning.occurrences['occ-b'].status='COMPLETED';
family.cleaning.occurrences['occ-b'].assignmentStatus='COMPLETED';
family.cleaning.occurrences['occ-b'].completedAt=start+3600;
family.cleaning.occurrences['occ-b'].completedByUid='u1';
const completed=build({family,planId,householdId:hid,actorUid:'u1',timestamp:start+4000,members});
assert.ok(completed.updates['tasks/'+taskKey]);
assert.strictEqual(completed.updates['tasks/'+taskKey].done,true);
assert.strictEqual(completed.updates['tasks/'+taskKey].subtasks[0].icon,'🧽');
assert.strictEqual(completed.updates['calendarEvents/'+eventPath.split('/')[1]].completed,true);
apply(family,completed.updates);

// An explicit flexible scheduledDate may move outside the original week and is
// not clamped back into the plan window.
family.cleaning.occurrences['occ-a'].scheduledDate='2026-09-15';
family.cleaning.occurrences['occ-a'].scheduledTime='';
family.cleaning.occurrences['occ-a'].scheduledStartAt=null;
family.cleaning.occurrences['occ-b'].scheduledDate='2026-09-15';
family.cleaning.occurrences['occ-b'].scheduledTime='';
family.cleaning.occurrences['occ-b'].scheduledStartAt=null;
const moved=build({family,planId,householdId:hid,actorUid:'u1',timestamp:start+5000,members});
const movedTask=Object.values(moved.updates).find((row)=>row&&row.projectionManaged&&row.category==='cleaning');
assert.ok(movedTask);
assert.strictEqual(movedTask.date,'2026-09-15');
assert.strictEqual(movedTask.time,'');

// Splitting one old grouped projection over two dates claims the old row once
// and creates a second row instead of overwriting the first group.
apply(family,moved.updates);
family.cleaning.occurrences['occ-b'].scheduledDate='2026-09-16';
const split=build({family,planId,householdId:hid,actorUid:'u1',timestamp:start+6000,members});
assert.strictEqual(split.groupCount,2);
const taskWrites=Object.keys(split.updates).filter((key)=>key.startsWith('tasks/')&&split.updates[key]);
assert.strictEqual(taskWrites.length,2,'split creates or updates two distinct task rows');
assert.strictEqual(new Set(taskWrites).size,2);
assert.deepStrictEqual(taskWrites.map((key)=>split.updates[key].date).sort(),['2026-09-15','2026-09-16']);

console.log('cleaning canonical grouped projection service: ok');
