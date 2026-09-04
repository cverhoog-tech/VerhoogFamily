'use strict';
const assert=require('assert');
const fs=require('fs');
const path=require('path');
const vm=require('vm');

const source=fs.readFileSync(path.join(__dirname,'..','src','modules','cleaning','cleaningPauseAgendaProjection.js'),'utf8');
const listeners={};
const context={
  console,Date,Math,JSON,Promise,Object,Array,String,Number,RegExp,Error,
  setTimeout:()=>1,clearTimeout:()=>{},
  addEventListener:(name,fn)=>{listeners[name]=fn;},dispatchEvent:()=>{},
  CustomEvent:function(name,options){this.type=name;this.detail=options&&options.detail;}
};
context.window=context;
vm.runInNewContext(source,context,{filename:'cleaningPauseAgendaProjection.js'});
const projection=context.CleaningPauseAgendaProjection;
assert.ok(projection);
assert.strictEqual(projection.version,'0.1.0');

const timestamp=new Date(2026,8,4,8,0,0,0).getTime();
const resumeAt=new Date(2026,8,18,0,0,0,0).getTime();
const cleaning={
  rooms:{
    bath:{id:'bath',name:'Badkamer',active:true,paused:true,pauseUntilAt:resumeAt,pausedAt:timestamp,pausedByUid:'u1'},
    kitchen:{id:'kitchen',name:'Keuken',active:true,paused:false}
  },
  routines:{
    shower:{id:'shower',roomId:'bath',title:'Douche schoonmaken',active:true,paused:true,pauseSource:'ROOM',pauseUntilAt:resumeAt},
    mirror:{id:'mirror',roomId:'bath',title:'Spiegel reinigen',active:true,paused:true,pauseSource:'ROOM',pauseUntilAt:resumeAt},
    oven:{id:'oven',roomId:'kitchen',title:'Oven reinigen',active:true,paused:true,pauseSource:'ROUTINE',pauseUntilAt:resumeAt,pausedAt:timestamp,pausedByUid:'u1'},
    manual:{id:'manual',roomId:'kitchen',title:'Koelkast',active:true,paused:true,pauseSource:'ROUTINE',pauseUntilAt:null}
  }
};

let result=projection._buildUpdates({cleaning,calendarEvents:{},householdId:'hh1',actorUid:'u1',timestamp});
const keys=Object.keys(result.updates).sort();
assert.deepStrictEqual(keys,[
  'calendarEvents/id_cleaning_pause_resume_room_bath',
  'calendarEvents/id_cleaning_pause_resume_routine_oven'
]);
assert.strictEqual(result.created,2);
assert.strictEqual(result.desiredCount,2,'room-paused routines must not create duplicate agenda markers');
const roomMarker=result.updates['calendarEvents/id_cleaning_pause_resume_room_bath'];
const routineMarker=result.updates['calendarEvents/id_cleaning_pause_resume_routine_oven'];
assert.strictEqual(roomMarker.title,'Schoonmaken hervat · Badkamer');
assert.strictEqual(roomMarker.date,'2026-09-18');
assert.strictEqual(roomMarker.time,'');
assert.strictEqual(roomMarker.flexible,true);
assert.strictEqual(roomMarker.sourceType,'cleaning-pause-resume');
assert.strictEqual(roomMarker.pauseResumeKind,'room');
assert.strictEqual(routineMarker.title,'Routine hervat · Oven reinigen');
assert.strictEqual(routineMarker.description,'Vanaf vandaag wordt Oven reinigen in Keuken automatisch hervat.');
assert.ok(!keys.some(key=>key.includes('manual')),'indefinite pause must not invent an agenda date');

const existing={};
existing[roomMarker._key]=roomMarker;
existing[routineMarker._key]=routineMarker;
result=projection._buildUpdates({cleaning,calendarEvents:existing,householdId:'hh1',actorUid:'u1',timestamp});
assert.deepStrictEqual(Object.keys(result.updates),[],'stable markers must not rewrite on every repository event');

const moved=JSON.parse(JSON.stringify(cleaning));
moved.routines.oven.pauseUntilAt=new Date(2026,8,25,0,0,0,0).getTime();
result=projection._buildUpdates({cleaning:moved,calendarEvents:existing,householdId:'hh1',actorUid:'u1',timestamp});
assert.ok(result.updates['calendarEvents/id_cleaning_pause_resume_routine_oven']);
assert.strictEqual(result.updates['calendarEvents/id_cleaning_pause_resume_routine_oven'].date,'2026-09-25','changed pause date must move the marker');

const resumed=JSON.parse(JSON.stringify(cleaning));
resumed.rooms.bath.paused=false;resumed.rooms.bath.pauseUntilAt=null;
resumed.routines.shower.paused=false;resumed.routines.mirror.paused=false;
resumed.routines.oven.paused=false;resumed.routines.oven.pauseUntilAt=null;
result=projection._buildUpdates({cleaning:resumed,calendarEvents:existing,householdId:'hh1',actorUid:'u1',timestamp});
assert.strictEqual(result.removed,2);
assert.strictEqual(result.updates['calendarEvents/id_cleaning_pause_resume_room_bath'],null,'manual/automatic room resume must remove stale marker');
assert.strictEqual(result.updates['calendarEvents/id_cleaning_pause_resume_routine_oven'],null,'routine resume must remove stale marker');

assert.ok(source.includes("sourceType:'cleaning-pause-resume'"));
assert.ok(source.includes("text(row.pauseSource)==='ROOM'"),'room pause must own one marker instead of one per routine');
assert.ok(source.includes("familyRef.child('calendarEvents').once('value')"));
assert.ok(source.includes("familyRef.update(result.updates)"));
assert.ok(!source.includes('.transaction('),'Agenda marker projection must not transact a parent family/root');
assert.ok(!source.includes('cleaning-approval-copy'));

console.log('cleaning finite pause -> single derived Agenda resume marker: ok');
