'use strict';
const assert=require('assert');
const fs=require('fs');
const path=require('path');
const vm=require('vm');

function read(file){return fs.readFileSync(path.join(__dirname,'..',file),'utf8');}
function day(y,m,d){return new Date(y,m-1,d,0,0,0,0).getTime();}

const contractSource=read('src/modules/cleaning/cleaningAvailabilityContract.js');
const experienceSource=read('src/modules/cleaning/cleaningAvailabilityExperience.js');
const screenSource=read('src/modules/cleaning/cleaningScreen.js');
const bootstrapSource=read('src/modules/cleaning/cleaningExperienceBootstrap.js');

const sandbox={window:{},console:console,Date:Date,JSON:JSON,Math:Math,Object:Object,Array:Array,String:String,Number:Number,RegExp:RegExp,Error:Error,Map:Map,Set:Set};
sandbox.window.window=sandbox.window;
vm.runInNewContext(contractSource,sandbox,{filename:'cleaningAvailabilityContract.js'});
const contract=sandbox.window.CleaningAvailabilityContract;
assert.ok(contract,'availability contract must register');
assert.strictEqual(contract.version,'0.1.0');
assert.strictEqual(contract.HOUSEHOLD_KEY,'__household__');

const week={startAt:day(2026,9,7),endAt:day(2026,9,14)};
const members=[
  {uid:'u1',displayName:'Een',status:'active'},
  {uid:'u2',displayName:'Twee',status:'active'},
  {uid:'u3',displayName:'Drie',status:'active'}
];
const routines={
  basic:{id:'basic',active:true,priority:'BASIC',title:'Basis'},
  normal:{id:'normal',active:true,priority:'NORMAL',title:'Normaal'},
  extra:{id:'extra',active:true,priority:'EXTRA',title:'Extra'}
};
const availability={
  u1:{status:'UNAVAILABLE',reason:'SICK',fromAt:day(2026,9,8),untilAt:day(2026,9,10)},
  u2:{status:'UNAVAILABLE',reason:'TEMPORARY',fromAt:day(2026,8,20),untilAt:day(2026,9,1)},
  u3:{status:'AVAILABLE',fromAt:null,untilAt:null},
  __household__:{mode:'NORMAL'}
};

const adjusted=contract.preparePlanningInput({window:week,members:members,routines:routines,availability:availability});
assert.deepStrictEqual(Array.from(adjusted.members).map(row=>row.uid),['u2','u3'],'only an unavailability window overlapping this plan may exclude a member');
assert.deepStrictEqual(Array.from(adjusted.excludedMemberUids),['u1']);
assert.strictEqual(adjusted.householdMode,'NORMAL');
assert.strictEqual(adjusted.routines.extra.active,true,'normal week must keep EXTRA work eligible');
assert.strictEqual(routines.extra.active,true,'pure availability contract may not mutate caller routines');
assert.strictEqual(members.length,3,'pure availability contract may not mutate caller members');
assert.strictEqual(contract.memberUnavailableForWindow(availability,'u2',week),false,'expired unavailability must not leak into future planning');
assert.strictEqual(contract.memberUnavailableForWindow(availability,'u1',week),true);

const openEnded={u1:{status:'UNAVAILABLE',reason:'TEMPORARY',fromAt:day(2026,9,5),untilAt:null}};
assert.strictEqual(contract.memberUnavailableForWindow(openEnded,'u1',week),true,'open-ended unavailability must overlap future windows after its start');

const busyAvailability={
  __household__:{mode:'BUSY_WEEK',fromAt:day(2026,9,7),untilAt:day(2026,9,14)}
};
const busy=contract.preparePlanningInput({window:week,members:members,routines:routines,availability:busyAvailability});
assert.strictEqual(busy.householdMode,'BUSY_WEEK');
assert.strictEqual(busy.routines.basic.active,true);
assert.strictEqual(busy.routines.normal.active,true);
assert.strictEqual(busy.routines.extra.active,false,'busy week must defer only EXTRA routines');
assert.deepStrictEqual(Array.from(busy.deferredRoutineIds),['extra']);
assert.strictEqual(routines.extra.active,true,'busy-week filtering must remain a planning clone, not canonical routine mutation');

const expiredBusy={__household__:{mode:'BUSY_WEEK',fromAt:day(2026,8,20),untilAt:day(2026,9,1)}};
assert.strictEqual(contract.householdModeForWindow(expiredBusy,week),'NORMAL','expired household mode must not affect a later week');

// Runtime ownership: persistence stays inside Cleaning availability and cadence
// changes delegate to the already accepted pause runtime instead of inventing
// another occurrence/planning writer.
assert.ok(experienceSource.includes("return householdId&&domain&&domain.basePath?domain.basePath(householdId):null"),'availability writes must derive the rules-safe Cleaning root from CleaningDomain');
assert.ok(experienceSource.includes("write.path+'/availability/'+key"),'availability state must live below the Cleaning root');
assert.ok(experienceSource.includes('pause.pauseRoutine(routine.id,days)'),'personal fixed work must reuse routine pause cadence semantics');
assert.ok(experienceSource.includes('pause.pauseRoom(room.id,days)'),'vacation/planning pause must reuse room pause cadence semantics');
assert.ok(experienceSource.includes("row.assignmentMode)==='FIXED_PERSON'"),'personal availability may pause only accepted fixed responsibilities');
assert.ok(experienceSource.includes("row.assignmentRequestStatus)==='ACCEPTED'"));
assert.ok(experienceSource.includes("text(row.preferredAssigneeUid)===text(uid)"));
assert.ok(!experienceSource.includes("ref('families/'+"),'availability experience may not address the family parent directly');
assert.ok(!experienceSource.includes(".transaction("),'availability experience does not need a second transaction writer');
assert.ok(!experienceSource.includes('assignmentUids=['),'availability may not silently rewrite occurrence assignment');
assert.ok(!experienceSource.includes("assignmentUids:"),'availability may not create a parallel occurrence assignment record');

// Planner integration must adapt input before the existing FAIR_TIME contract.
assert.ok(screenSource.includes('window.CleaningAvailabilityContract'));
assert.ok(screenSource.includes('availabilityContract.preparePlanningInput(planningInput)'));
assert.ok(screenSource.includes('concept = planner.generateConceptPlan(planningInput)'));
assert.ok(screenSource.indexOf('availabilityContract.preparePlanningInput(planningInput)')<screenSource.indexOf('concept = planner.generateConceptPlan(planningInput)'));
assert.ok(screenSource.includes('snapshot.data && snapshot.data.availability || {}'));
assert.ok(screenSource.includes('Deze week is niemand beschikbaar voor automatische verdeling'));

// Canonical runtime order: availability contract precedes its experience; the
// accepted pause experience is already loaded by cleaningRoutineTemplates.js.
const contractIndex=bootstrapSource.indexOf('cleaningAvailabilityContract.js?v=1');
const experienceIndex=bootstrapSource.indexOf('cleaningAvailabilityExperience.js?v=1');
assert.ok(contractIndex>=0&&contractIndex<experienceIndex);

console.log('cleaning temporary availability + busy week planning contracts: ok');
