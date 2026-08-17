'use strict';
const fs=require('fs');
const assert=require('assert');
function read(p){return fs.readFileSync(p,'utf8');}
const live=read('src/modules/calendar/calendarSharedLive.js');
const google=read('src/modules/calendar/calendarGoogleSync.js');
const meal=read('src/modules/calendar/calendarMealPlanIntegration.js');

assert(live.includes('HouseholdContext'),'calendar live layer must use HouseholdContext');
assert(live.includes('CALENDAR_CONTEXT_CHANGED'),'calendar mutations must reject stale context');
assert(live.includes('state.unsubscribe'),'calendar live layer must retain unsubscribe handle');
assert(live.includes("familyapp:household-context-changed"),'calendar must rebind on household context changes');
assert(!live.includes('window.fbFamilyId'),'calendar live layer must not use fbFamilyId as authority');
assert(!live.includes('window.fbUser'),'calendar live layer must not use fbUser as authority');
assert(live.includes('createdBy:token.uid'),'new calendar events must carry createdBy UID');
assert(live.includes('householdId:token.householdId'),'new calendar events must carry householdId');
assert(live.includes('attendeeUids:[]'),'calendar schema must prepare UID attendees');

assert(google.includes('HouseholdContext'),'Google calendar sync must capture HouseholdContext');
assert(google.includes('CALENDAR_CONTEXT_CHANGED'),'Google sync must reject stale callbacks');
assert(!google.includes('window.fbUser'),'Google sync must not use fbUser as identity authority');
assert(!google.includes('firebase.auth'),'Google sync must not resolve auth directly');
assert(google.includes('detail.familyId')&&google.includes('detail.userId'),'Google sync must validate mutation actor context');

assert(!meal.includes('FamilyDataStore.write'),'meal calendar integration must remain read-only projection');
console.log('calendar-context-adoption: PASS');
