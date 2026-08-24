'use strict';
const fs=require('fs');
const assert=require('assert');

function read(path){return fs.readFileSync(path,'utf8');}

const service=read('src/modules/profile/householdLeaveService.js');
const profile=read('src/core/profile.legacy.js');
const rules=read('database.rules.json');

assert.ok(service.includes('export async function getHouseholdLeavePlan'),'leave service must expose a read-only leave plan');
assert.ok(service.includes('export async function leaveHousehold'),'leave service must expose the household leave mutation');
assert.ok(service.includes('window.HouseholdContext'),'leave flow must bind to canonical HouseholdContext identity');
assert.ok(service.includes('STALE_HOUSEHOLD_CONTEXT'),'leave flow must reject stale identity changes');
assert.ok(service.includes("updates[`families/${plan.householdId}/members/${plan.uid}`] = null"),'leave flow must remove only the current membership record');
assert.ok(service.includes("updates[`users/${plan.uid}/households/${plan.householdId}`] = null"),'leave flow must remove the current user household pointer');
assert.ok(service.includes("updates[`users/${plan.uid}/activeHouseholdId`] = null"),'leave flow must clear the active household pointer when leaving it');
assert.ok(service.includes("updates[`users/${plan.uid}/familyId`] = null"),'leave flow must clear the legacy family pointer when it points at the leaving household');
assert.ok(service.includes('HOUSEHOLD_OWNER_SUCCESSOR_REQUIRED'),'owners must not orphan a household when leaving');
assert.ok(service.includes("updates[`families/${plan.householdId}/meta/ownerUid`] = successor.uid"),'owner leave must transfer canonical household ownership');
assert.ok(service.includes("updates[`families/${plan.householdId}/members/${successor.uid}/role`] = 'owner'"),'owner leave must promote the successor membership');
assert.ok(!service.includes("updates[`families/${plan.householdId}`] = null"),'leaving a household must never delete the shared household root');
assert.ok(service.includes('AuthenticatedSessionController.resume'),'leave completion must re-enter canonical authenticated onboarding/session flow');
assert.ok(service.includes('data-leave-household'),'profile UI must expose the leave-household action');
assert.ok(service.includes('Gezin verlaten'),'profile UI must label the destructive action clearly');
assert.ok(profile.includes("householdLeaveService.js?v=1"),'profile bridge must load the household leave service');
assert.ok(profile.includes("ProfileScreen.target.js?v=leave1"),'profile bridge must bust the profile module cache for the new action');

assert.ok(rules.includes("($memberUid === auth.uid && data.child('status').val() === 'active')"),'rules must allow an active member to remove their own membership');
assert.ok(rules.includes("data.parent().child('members').child(auth.uid).child('role').val() === 'owner'"),'rules must allow the current owner to transfer meta ownership');
assert.ok(rules.includes("root.child('families').child($familyId).child('members').child(auth.uid).child('role').val() === 'owner'"),'rules must allow the owner to update a successor member role');

console.log('profile household leave contract: PASS');
