'use strict';
const assert=require('assert');
const fs=require('fs');
const path=require('path');
const vm=require('vm');

const source=fs.readFileSync(path.join(__dirname,'..','src','modules','cleaning','cleaningExecutionWriteRuntime.js'),'utf8');

function clone(value){return JSON.parse(JSON.stringify(value));}
function setPath(root,pathName,value){
  const parts=pathName.split('/');let cursor=root;
  for(let i=0;i<parts.length-1;i++){if(!cursor[parts[i]]||typeof cursor[parts[i]]!=='object')cursor[parts[i]]={};cursor=cursor[parts[i]];}
  const key=parts[parts.length-1];if(value===null)delete cursor[key];else cursor[key]=clone(value);
}

(async function(){
  const transactionPaths=[];
  const updateBatches=[];
  const repairCalls=[];
  let cleaning={
    plans:{plan1:{id:'plan1',status:'ACTIVE',occurrenceIds:['occ1']}},
    occurrences:{occ1:{id:'occ1',householdId:'family-1',planId:'plan1',checklist:[{id:'r1',routineItemId:'r1',completed:false}]}}
  };
  let tasks={
    taskKey:{id:'task1',_key:'taskKey',householdId:'family-1',projectionManaged:true,sourceType:'cleaning-occurrence',cleaningOccurrenceIds:['occ1'],subtasks:[{id:'r1',sourceRoutineItemId:'r1',cleaningOccurrenceId:'occ1',done:false}],done:false}
  };
  let calendarEvents={
    eventKey:{id:'event1',_key:'eventKey',householdId:'family-1',projectionManaged:true,sourceType:'cleaning-occurrence',cleaningOccurrenceIds:['occ1'],date:'2026-09-03',time:'',completed:false}
  };

  const familyRoot={
    child(name){
      return{once(){return Promise.resolve({val:()=>clone(name==='tasks'?tasks:calendarEvents)});}};
    },
    update(updates){
      updateBatches.push(clone(updates));
      Object.keys(updates).forEach((key)=>{
        if(key.startsWith('tasks/'))setPath({tasks},key,updates[key]);
        else if(key.startsWith('calendarEvents/'))setPath({calendarEvents},key,updates[key]);
      });
      return Promise.resolve();
    }
  };
  const database={
    ref(pathName){
      if(pathName==='families/family-1/cleaning'){
        return{
          transaction(updater){
            transactionPaths.push(pathName);
            const next=updater(clone(cleaning));
            if(next===undefined)return Promise.resolve({committed:false,snapshot:{val:()=>clone(cleaning)}});
            cleaning=clone(next);
            return Promise.resolve({committed:true,snapshot:{val:()=>clone(cleaning)}});
          }
        };
      }
      if(pathName==='families/family-1')return familyRoot;
      throw new Error('Unexpected database path: '+pathName);
    }
  };

  const taskRepo={
    list:()=>Object.keys(tasks).map((key)=>clone(tasks[key])),
    updateOne:function originalTaskUpdate(){throw new Error('ordinary task writer should be bypassed for cleaning');},
    remove:()=>Promise.resolve(true)
  };
  const calendarRepo={
    get(id){return Object.keys(calendarEvents).map((key)=>calendarEvents[key]).find((row)=>row.id===id||row._key===id)||null;},
    list:()=>Object.keys(calendarEvents).map((key)=>clone(calendarEvents[key])),
    updateOne:function originalCalendarUpdate(){throw new Error('ordinary calendar writer should be bypassed for cleaning');},
    remove:()=>Promise.resolve(true)
  };

  function ids(row){return (row&&row.cleaningOccurrenceIds||[]).slice();}
  function applyTask(input){
    const family=clone(input.family),task=family.tasks.taskKey;
    if(!task)return{handled:false,family};
    const completed=!!input.patch.done;
    family.cleaning.occurrences.occ1.checklist[0].completed=completed;
    family.cleaning.occurrences.occ1.status=completed?'COMPLETED':'FLEXIBLE';
    family.cleaning.occurrences.occ1.assignmentStatus=completed?'COMPLETED':'ACTIVE';
    task.done=completed;task.status=completed?'done':'open';
    family.calendarEvents.eventKey.completed=completed;
    return{handled:true,family,task:clone(task),occurrenceIds:['occ1']};
  }
  function applyCalendar(input){
    const family=clone(input.family),event=family.calendarEvents.eventKey;
    if(!event)return{handled:false,family};
    const date=input.patch.date||event.date,time=Object.prototype.hasOwnProperty.call(input.patch,'time')?input.patch.time:event.time;
    family.cleaning.occurrences.occ1.scheduledDate=date;
    family.cleaning.occurrences.occ1.scheduledTime=time;
    event.date=date;event.time=time;
    family.tasks.taskKey.date=date;family.tasks.taskKey.time=time;
    return{handled:true,family,event:clone(event),occurrenceIds:['occ1']};
  }

  const listeners={};
  const context={
    console,Date,
    setInterval:()=>1,clearInterval:()=>{},setTimeout:(fn)=>{fn();return 1;},clearTimeout:()=>{},
    addEventListener:(name,fn)=>{listeners[name]=fn;},dispatchEvent:()=>{},CustomEvent:function(name,options){this.type=name;this.detail=options&&options.detail;},
    TaskHouseholdRepository:taskRepo,
    CalendarEventHouseholdRepository:calendarRepo,
    HouseholdContext:{snapshot:()=>({ready:true,uid:'u1',householdId:'family-1'}),capture:()=>({revision:1}),isCurrent:()=>true},
    fbDb:database,
    CleaningProjectionService:{reconcilePlan:(planId)=>{repairCalls.push(planId);return Promise.resolve({planId});}},
    CleaningExecutionSync:{
      _isCleaningProjection:(row)=>!!(row&&row.projectionManaged&&ids(row).length),
      _recordOccurrenceIds:ids,
      _applyTaskPatchToFamily:applyTask,
      _applyCalendarPatchToFamily:applyCalendar,
      userMessage:(error)=>error&&error.message||String(error)
    }
  };
  context.window=context;
  vm.runInNewContext(source,context,{filename:'cleaningExecutionWriteRuntime.js'});

  assert.strictEqual(context.CleaningExecutionWriteRuntime.version,'0.1.0');
  assert.strictEqual(context.CleaningExecutionWriteRuntime._cleaningPath('family-1'),'families/family-1/cleaning');
  assert.strictEqual(taskRepo.updateOne.__cleaningExecutionWriteRuntime,true);
  assert.strictEqual(calendarRepo.updateOne.__cleaningExecutionWriteRuntime,true);

  const taskSaved=await taskRepo.updateOne('task1',{done:true});
  assert.strictEqual(taskSaved.done,true);
  assert.deepStrictEqual(transactionPaths,['families/family-1/cleaning']);
  assert.strictEqual(cleaning.occurrences.occ1.status,'COMPLETED');
  assert.strictEqual(tasks.taskKey.done,true);
  assert.strictEqual(calendarEvents.eventKey.completed,true);
  assert.ok(updateBatches[0]['tasks/taskKey']);
  assert.ok(updateBatches[0]['calendarEvents/eventKey']);

  const eventSaved=await calendarRepo.updateOne('event1',{date:'2026-09-08',time:'09:30'});
  assert.strictEqual(eventSaved.date,'2026-09-08');
  assert.strictEqual(eventSaved.time,'09:30');
  assert.deepStrictEqual(transactionPaths,['families/family-1/cleaning','families/family-1/cleaning']);
  assert.strictEqual(cleaning.occurrences.occ1.scheduledDate,'2026-09-08');
  assert.strictEqual(tasks.taskKey.date,'2026-09-08');
  assert.strictEqual(calendarEvents.eventKey.date,'2026-09-08');
  assert.ok(repairCalls.length>=2);

  // Unchanged local state must take the newer canonical value while a distinct
  // user toggle remains intact, preventing a stale full subtask array from
  // reverting another device's checkbox update.
  const canonical={occurrences:{occ1:{checklist:[{id:'r1',routineItemId:'r1',completed:true},{id:'r2',routineItemId:'r2',completed:false}]}}};
  const baseline={subtasks:[
    {id:'r1',sourceRoutineItemId:'r1',cleaningOccurrenceId:'occ1',done:false},
    {id:'r2',sourceRoutineItemId:'r2',cleaningOccurrenceId:'occ1',done:false}
  ]};
  const merged=context.CleaningExecutionWriteRuntime._transactionPatch('task',baseline,{subtasks:[
    {id:'r1',sourceRoutineItemId:'r1',cleaningOccurrenceId:'occ1',done:false},
    {id:'r2',sourceRoutineItemId:'r2',cleaningOccurrenceId:'occ1',done:true}
  ]},canonical,['occ1']);
  assert.strictEqual(merged.subtasks[0].done,true,'untouched stale checkbox adopts canonical state');
  assert.strictEqual(merged.subtasks[1].done,true,'user-toggled checkbox keeps requested state');

  assert.ok(source.includes("cleaningPath:'families/'+ctx.householdId+'/cleaning'"));
  assert.ok(source.includes('cleaningRef.transaction'));
  assert.ok(!source.includes("ref('families/'+write.ctx.householdId).transaction"));
  console.log('cleaning rules-safe execution writer: ok');
})().catch((error)=>{console.error(error);process.exitCode=1;});
