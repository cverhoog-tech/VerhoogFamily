'use strict';
const assert=require('assert');
const fs=require('fs');
const path=require('path');
const vm=require('vm');
function read(file){return fs.readFileSync(path.join(__dirname,'..',file),'utf8');}
function day(y,m,d){return new Date(y,m-1,d,0,0,0,0).getTime();}

// Keep the accepted pure availability math protected while Cleaning v2 no
// longer boots the old availability experience/runtime on screen entry.
const source=read('src/modules/cleaning/cleaningAvailabilityContract.js');
const screen=read('src/modules/cleaning/cleaningScreen.js');
const sandbox={window:{},console,Date,JSON,Math,Object,Array,String,Number,RegExp,Error,Map,Set};sandbox.window.window=sandbox.window;
vm.runInNewContext(source,sandbox,{filename:'cleaningAvailabilityContract.js'});
const contract=sandbox.window.CleaningAvailabilityContract;
assert.ok(contract,'availability pure contract must remain available as archived domain logic');
const week={startAt:day(2026,9,7),endAt:day(2026,9,14)};
const members=[{uid:'u1',status:'active'},{uid:'u2',status:'active'}];
const routines={normal:{id:'normal',active:true,priority:'NORMAL'},extra:{id:'extra',active:true,priority:'EXTRA'}};
const adjusted=contract.preparePlanningInput({window:week,members,routines,availability:{u1:{status:'UNAVAILABLE',fromAt:day(2026,9,8),untilAt:day(2026,9,10)}}});
assert.deepStrictEqual(Array.from(adjusted.members).map(row=>row.uid),['u2']);
const busy=contract.preparePlanningInput({window:week,members,routines,availability:{__household__:{mode:'BUSY_WEEK',fromAt:week.startAt,untilAt:week.endAt}}});
assert.strictEqual(busy.routines.extra.active,false);
assert.match(screen,/availability:\{\}/,'Cleaning v2 snapshot must preserve existing availability data');
assert.doesNotMatch(screen,/cleaningAvailabilityExperience|CleaningAvailabilityExperience/,'Cleaning v2 must not reactivate the old availability experience runtime');
console.log('cleaning availability pure contract retained; legacy runtime decoupled from v2: ok');
