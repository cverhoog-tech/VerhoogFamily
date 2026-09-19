'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const box={console,Date,Set,Map,setTimeout,clearTimeout,document:{},window:null};box.window=box;vm.createContext(box);
for(const name of ['cleaningPlannerContract','cleaningPlanPersistenceContract','cleaningWeekRefresh'])vm.runInContext(fs.readFileSync('src/modules/cleaning/'+name+'.js','utf8'),box);
const planner=box.CleaningPlannerContract,persist=box.CleaningPlanPersistenceContract,refresh=box.CleaningWeekRefresh;
const monday=new Date();monday.setHours(0,0,0,0);monday.setDate(monday.getDate()-((monday.getDay()+6)%7));
const range={startAt:+monday,endAt:+monday+7*86400000},members={u:{uid:'u',displayName:'Tester',status:'active',role:'owner'}};
function material(data){return persist.materializeDraft({conceptPlan:planner.generateConceptPlan({window:range,rooms:data.rooms,routines:data.routines,members}),householdId:'h',actorUid:'u',timestamp:range.startAt,existingData:{}});}
function run(data){return refresh.reconcile({data,material:material(data),timestamp:range.startAt,uid:'u',householdId:'h'});}
let data={rooms:{old:{name:'Old',active:true},keep:{name:'Keep',active:true}},routines:{a:{roomId:'old',title:'A',nextDueAt:range.startAt,estimatedMinutes:10},b:{roomId:'keep',title:'B',nextDueAt:range.startAt,estimatedMinutes:15}},plans:{},occurrences:{}};
let first=run(data);data=first.data;const oldId=first.changedIds.find(id=>data.occurrences[id].roomId==='old'),keepId=first.changedIds.find(id=>data.occurrences[id].roomId==='keep');
data.occurrences[keepId].checklist[0].completed=true;data.rooms.old.active=false;data.rooms.new={name:'New',active:true};data.routines.c={roomId:'new',title:'C',nextDueAt:range.startAt,estimatedMinutes:20};
let next=run(data);assert.equal(next.data.occurrences[oldId].status,'CANCELLED');assert.ok(!next.data.plans[next.planId].occurrenceIds.includes(oldId));assert.ok(next.changedIds.some(id=>next.data.occurrences[id].roomId==='new'));assert.equal(next.data.occurrences[keepId].checklist[0].completed,true);
let again=run(next.data);assert.deepEqual(Array.from(again.data.plans[again.planId].occurrenceIds),Array.from(next.data.plans[next.planId].occurrenceIds),'repeat refresh must not duplicate work');
let done=again.data;done.occurrences[keepId].status='COMPLETED';done.routines.d={roomId:'keep',title:'D',nextDueAt:range.startAt,estimatedMinutes:5};
const history=JSON.stringify(done.occurrences[keepId]);let added=run(done);assert.equal(JSON.stringify(added.data.occurrences[keepId]),history);assert.ok(added.changedIds.some(id=>id!==keepId&&added.data.occurrences[id].roomId==='keep'));
Object.values(added.data.rooms).forEach(r=>r.active=false);let empty=run(added.data);assert.equal(empty.empty,true);assert.equal(empty.data.plans[empty.planId].occurrenceIds.length,0);assert.equal(empty.data.occurrences[keepId].status,'COMPLETED');
console.log('PASS: removed and added rooms, preserved checklist/history, repeat refresh, empty plan');
// Load the real screen and exercise its repository command with a stale UI
// snapshot. The transaction must use server data rather than the UI cache.
const source=fs.readFileSync('src/modules/cleaning/cleaningScreen.js','utf8').replace(/^import .*;\n/gm,'').replace(/^export /gm,'');vm.runInContext(source,box);
next.data.occurrences[oldId].projections={taskId:'old-task',calendarEventId:'old-event'};
let server=next.data,projected={},contextValid=true;
box.HouseholdContext={snapshot:()=>({ready:true,uid:'u',householdId:'h'}),capture:()=>({uid:'u',householdId:'h'}),isCurrent:()=>contextValid};
box.HouseholdIdentityFirebaseBridge={getMembers:()=>[members.u]};
box.fbDb={ref:path=>({transaction:async fn=>{let value=fn(server);if(value===undefined)return{committed:false};server=value;return{committed:true,snapshot:{val:()=>server}};},update:async updates=>{projected=updates;}})};
(async()=>{
 await box.CleaningV2Repository.generateWeekPlan();assert.ok(server.plans);assert.ok(Object.keys(projected).length);assert.equal(projected['tasks/old-task'],null);assert.equal(projected['calendarEvents/id_old-event'],null);
 contextValid=false;await assert.rejects(box.CleaningV2Repository.generateWeekPlan(),/HOUSEHOLD_CONTEXT_CHANGED/);
 console.log('PASS: V2 command reads server data, projects results and rejects changed context');
})().catch(error=>{console.error(error);process.exitCode=1;});
