'use strict';
const fs=require('fs');
const assert=require('assert');

function read(path){return fs.readFileSync(path,'utf8');}

const facade=read('src/modules/calendar/calendarSharedLive.js');
const bootstrap=read('src/modules/calendar/calendar.js');
const appLoader=read('api/app.js');

// STEP 6 device-gate regression: a selected Agenda day must survive opening
// the shared add sheet, the reused submit button must never stay disabled,
// and acknowledged mutations must render without waiting on listener timing.
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
assert.ok(facade.includes('function projectAcknowledgedMutation(type,event)'),'calendar facade must be able to immediately project a server-acknowledged mutation');
assert.ok(bootstrap.includes('calendarEventHouseholdRepository.js?v=2'),'Agenda repository cache key must be bumped for iPhone/PWA clients');
assert.ok(bootstrap.includes('calendarSharedLive.js?v=5'),'Agenda facade cache key must be bumped for iPhone/PWA clients');
assert.ok(appLoader.includes('src/modules/calendar/calendar.js?v=2'),'served runtime must cache-bust the Agenda bootstrap itself');

console.log('STEP 6 calendar add-sheet regression contract: PASS');
