'use strict';
const fs=require('fs');
const assert=require('assert');

function read(path){return fs.readFileSync(path,'utf8');}

const facade=read('src/modules/calendar/calendarSharedLive.js');
const bootstrap=read('src/modules/calendar/calendar.js');

// STEP 6 device-gate regression: a selected Agenda day must survive opening
// the shared add sheet, and the reused submit button must never stay disabled
// after a previous create/edit attempt.
assert.ok(facade.includes('function selectedCalendarDate()'),'calendar facade must own selected-day prefill logic');
assert.ok(facade.includes('window.calSelDay'),'calendar add sheet must read the selected Agenda day');
assert.ok(facade.includes("return isIsoDate(selected)?selected:localToday()"),'invalid/missing selected day must fall back to local today');
assert.ok(facade.includes('function prepareCalendarAddSheet(isEditing)'),'calendar facade must prepare the reused generic add sheet');
assert.ok(facade.includes("if(date)date.value=selectedCalendarDate()"),'new appointment sheet must prefill the selected Agenda date');
assert.ok(facade.includes('window.openAdd.__calendarRepositoryOpenWrapped'),'openAdd must be wrapped once at the Agenda compatibility boundary');
assert.ok(facade.includes('button.disabled=false'),'calendar add-sheet reset must re-enable the reused submit button');
assert.ok(facade.includes("button.removeAttribute('aria-busy')"),'calendar add-sheet reset must clear busy state');
assert.ok(facade.includes('resetCalendarButton(button);\n          state.editingId=null;'),'successful save must reset the button before closing the sheet');
assert.ok(facade.includes('catch(function(error){\n          resetCalendarButton(button);'),'failed save must also re-enable the button');
assert.ok(bootstrap.includes('calendarSharedLive.js?v=4'),'Agenda facade cache key must be bumped for iPhone/PWA clients');

console.log('STEP 6 calendar add-sheet regression contract: PASS');
