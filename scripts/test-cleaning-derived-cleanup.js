'use strict';
const assert=require('assert');
const fs=require('fs');
const path=require('path');
const vm=require('vm');

const sandbox={
  console,Promise,JSON,Date,Math,
  setTimeout:()=>1,clearTimeout:()=>{},setInterval:()=>1,clearInterval:()=>{},
  addEventListener:()=>{},dispatchEvent:()=>{},CustomEvent:function(name,options){this.type=name;this.detail=options&&options.detail;}
};
sandbox.window=sandbox;
const source=fs.readFileSync(path.join(__dirname,'..','src','modules','cleaning','cleaningDerivedCleanup.js'),'utf8');
vm.runInNewContext(source,sandbox,{filename:'cleaningDerivedCleanup.js'});
const cleanup=sandbox.CleaningDerivedCleanup;
assert.ok(cleanup);
assert.strictEqual(cleanup.version,'0.1.0');

const cleaning={
  rooms:{
    kitchen:{id:'kitchen',active:true},
    oldroom:{id:'oldroom',active:false}
  },
  occurrences:{
    active:{id:'active',roomId:'kitchen',status:'FLEXIBLE',assignmentStatus:'ACTIVE'},
    cancelled:{id:'cancelled',roomId:'oldroom',status:'CANCELLED',assignmentStatus:'SKIPPED'},
    inactiveRoom:{id:'inactiveRoom',roomId:'oldroom',status:'FLEXIBLE',assignmentStatus:'ACTIVE'},
    completed:{id:'completed',roomId:'oldroom',status:'COMPLETED',assignmentStatus:'COMPLETED'}
  }
};

function task(ids,extra){return Object.assign({projectionManaged:true,sourceType:'cleaning-occurrence',cleaningOccurrenceIds:ids,done:false,status:'open'},extra||{});}
function event(ids,extra){return Object.assign({projectionManaged:true,sourceType:'cleaning-occurrence',cleaningOccurrenceIds:ids,completed:false},extra||{});}

assert.strictEqual(cleanup._shouldRemove(cleaning,task(['active']),'task'),false,'active Cleaning Task stays');
assert.strictEqual(cleanup._shouldRemove(cleaning,event(['active']),'calendar'),false,'active Cleaning Agenda item stays');
assert.strictEqual(cleanup._shouldRemove(cleaning,task(['cancelled']),'task'),true,'cancelled Cleaning Task is removed');
assert.strictEqual(cleanup._shouldRemove(cleaning,event(['inactiveRoom']),'calendar'),true,'inactive-room Agenda item is removed even before occurrence cancellation lands');
assert.strictEqual(cleanup._shouldRemove(cleaning,task(['cancelled'],{done:true,status:'done'}),'task'),false,'completed Cleaning Task remains history');
assert.strictEqual(cleanup._shouldRemove(cleaning,event(['cancelled'],{completed:true}),'calendar'),false,'completed Agenda item remains history');
assert.strictEqual(cleanup._shouldRemove(cleaning,{sourceType:'manual',cleaningOccurrenceIds:['cancelled'],done:false},'task'),false,'manual Task is never removed');
assert.strictEqual(cleanup._shouldRemove(cleaning,task(['cancelled','active']),'task'),false,'group remains when at least one canonical occurrence is active');
assert.strictEqual(cleanup._shouldRemove(cleaning,task(['missing']),'task'),false,'fully missing legacy occurrence is preserved rather than guessed');
assert.strictEqual(cleanup._shouldRemove(cleaning,task(['completed']),'task'),false,'completed canonical occurrence remains retained history');

const result=cleanup._cleanupUpdates({
  cleaning,
  tasks:{
    staleTask:task(['cancelled']),
    keepTask:task(['active']),
    doneTask:task(['cancelled'],{done:true,status:'done'}),
    manualTask:{id:'manual',title:'Handmatig',done:false}
  },
  calendarEvents:{
    staleEvent:event(['inactiveRoom']),
    keepEvent:event(['active']),
    doneEvent:event(['cancelled'],{completed:true}),
    manualEvent:{id:'manual-event',title:'Afspraak'}
  }
});
assert.deepStrictEqual(JSON.parse(JSON.stringify(result.updates)),{
  'tasks/staleTask':null,
  'calendarEvents/staleEvent':null
});
assert.deepStrictEqual(Array.from(result.removedTaskKeys),['staleTask']);
assert.deepStrictEqual(Array.from(result.removedCalendarKeys),['staleEvent']);
assert.strictEqual(result.removedCount,2);

assert.ok(!source.includes('cleaning-approval-copy'),'derived cleanup must never own Planning approval UI');
assert.ok(source.includes("projectionManaged===true"),'cleanup is restricted to managed Cleaning projections');
assert.ok(source.includes("status==='COMPLETED'"),'canonical completed history is protected');

console.log('cleaning orphaned Task/Agenda cleanup: ok');
