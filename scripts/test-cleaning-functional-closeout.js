#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
let failed = false;

function fail(message) {
  failed = true;
  console.error('FAIL: ' + message);
}

function ok(message) {
  console.log('OK: ' + message);
}

function file(rel) {
  const full = path.join(ROOT, rel);
  if (!fs.existsSync(full)) {
    fail('Missing required close-out file: ' + rel);
    return '';
  }
  return fs.readFileSync(full, 'utf8');
}

function requireText(source, needle, label) {
  if (!source.includes(needle)) fail(label + ' (missing: ' + needle + ')');
}

function requireRegex(source, regex, label) {
  if (!regex.test(source)) fail(label + ' (pattern: ' + regex + ')');
}

function forbidRegex(source, regex, label) {
  if (regex.test(source)) fail(label + ' (forbidden pattern: ' + regex + ')');
}

// ------------------------------------------------------------
// 1. Runtime reachability for all late functional STEP 14 blocks.
// ------------------------------------------------------------
const bootstrap = file('src/modules/cleaning/cleaningExperienceBootstrap.js');
[
  'cleaningPermissions.js',
  'cleaningExceptionContract.js',
  'cleaningExecutionSync.js',
  'cleaningExecutionUiGuard.js',
  'cleaningExecutionWriteRuntime.js',
  'cleaningExceptionRuntime.js',
  'cleaningHelpNotificationUi.js',
  'cleaningExceptionTaskUi.js',
  'cleaningHelpRequestUi.js',
  'cleaningAvailabilityContract.js',
  'cleaningAvailabilityExperience.js',
  'cleaningHistoryExperience.js',
  'cleaningActivityProjector.js',
  'cleaningNotificationProjector.js',
  'cleaningTaskSupplyUi.js'
].forEach((name) => requireText(bootstrap, "import './" + name, 'Cleaning bootstrap must reach ' + name));
if (!failed) ok('late STEP 14 runtime blocks remain reachable through the Cleaning bootstrap');

// ------------------------------------------------------------
// 2. Preferences + household/context safety + retry idempotency.
// ------------------------------------------------------------
const repository = file('src/modules/cleaning/cleaningHouseholdRepository.js');
requireText(repository, "'preferences'", 'Cleaning repository must keep preferences in the canonical aggregate');
requireText(repository, 'setUserPreferences:setUserPreferences', 'Cleaning repository must expose setUserPreferences');
requireText(repository, 'getUserPreferences:getUserPreferences', 'Cleaning repository must expose getUserPreferences');
requireRegex(repository, /preferences\/'\+write\.ctx\.uid/, 'Preferences must be written under the active UID');
requireText(repository, 'captureContext()', 'Cleaning writes must capture HouseholdContext');
requireText(repository, 'isCurrent(write.token)', 'Cleaning writes must reject stale HouseholdContext tokens');
requireText(repository, 'createFingerprint', 'Room/routine create retries need a stable fingerprint');
requireText(repository, 'retryCreateHandle', 'Room/routine create retries must reuse their push handle');
requireText(repository, 'clearCreateRetries', 'Create retry state must clear across lifecycle/context changes');
if (!failed) ok('preferences, household-context guards and create retry idempotency remain present');

// ------------------------------------------------------------
// 3. Shopping is explicit and carries stable Cleaning metadata.
// ------------------------------------------------------------
const supplies = file('src/modules/cleaning/cleaningSupplyExperience.js');
requireText(supplies, "source:'cleaning'", 'Cleaning-created Shopping items must keep their source marker');
requireText(supplies, 'cleaningSupplyId:', 'Cleaning Shopping items must carry cleaningSupplyId');
requireText(supplies, 'cleaningOccurrenceIds:', 'Cleaning Shopping items must carry cleaningOccurrenceIds');
requireText(supplies, 'cleaningRoomIds:', 'Cleaning Shopping items must carry cleaningRoomIds');
requireText(supplies, 'cleaningRoutineIds:', 'Cleaning Shopping items must carry cleaningRoutineIds');
requireText(supplies, 'shoppingRepo.addItems(', 'Cleaning supplies must use the existing Shopping repository write API');
requireText(supplies, 'Toevoegen aan Boodschappen gebeurt nooit automatisch.', 'Shopping add must remain an explicit user action');
const shoppingStore = file('src/modules/shop/shoppingListStore.js');
requireRegex(shoppingStore, /function normalizeItem\(raw,key,ctx\)[\s\S]*?var out=clone\(raw\|\|\{\}\)\|\|\{\}/, 'Shopping normalization must preserve additive Cleaning metadata from the raw item');
if (!failed) ok('explicit Shopping handoff keeps stable Cleaning identifiers');

// ------------------------------------------------------------
// 4. Cleanup stays conservative: derived/open only, history safe.
// ------------------------------------------------------------
const derivedCleanup = file('src/modules/cleaning/cleaningDerivedCleanup.js');
requireText(derivedCleanup, 'if(!managed(row)||recordIsCompleted(row,kind))return false;', 'Derived cleanup must protect manual and completed Task/Agenda rows');
requireText(derivedCleanup, 'if(!existing.length)return false;', 'Derived cleanup must not guess when canonical occurrence history is missing');
const shoppingCleanup = file('src/modules/cleaning/cleaningShoppingCleanup.js');
requireText(shoppingCleanup, "text(item.source).toLowerCase()!=='cleaning'", 'Shopping cleanup must only target Cleaning-origin items');
requireText(shoppingCleanup, 'item.done===true', 'Shopping cleanup must protect completed Shopping history');
if (!failed) ok('Task/Agenda/Shopping cleanup remains conservative and history-safe');

// ------------------------------------------------------------
// 5. Action Inbox is the central Cleaning decision projection, not a writer.
// ------------------------------------------------------------
const inbox = file('src/platform/inbox/actionInboxRegistry.js');
requireText(inbox, "type:'cleaning.help'", 'Action Inbox must project Cleaning help requests');
requireText(inbox, "type:'cleaning.routine.transfer'", 'Action Inbox must project Cleaning routine transfer requests');
requireText(inbox, "type:'cleaning.routine.counter'", 'Action Inbox must project Cleaning counterproposals');
requireText(inbox, 'CleaningExceptionRuntime.respondToHelpRequest', 'Cleaning help Inbox actions must route to the accepted Cleaning exception runtime');
requireText(inbox, 'CleaningRoutineExperience.resolveRequest', 'Cleaning transfer Inbox actions must route to CleaningRoutineExperience');
requireText(inbox, 'CleaningRoutineExperience.resolveCounter', 'Cleaning counterproposal Inbox actions must route to CleaningRoutineExperience');
forbidRegex(inbox, /\.ref\s*\(/, 'Action Inbox must not become a direct Firebase writer');
forbidRegex(inbox, /inboxRequests/, 'Action Inbox must not introduce canonical inbox request storage');
if (!failed) ok('Action Inbox keeps Cleaning requests as canonical-domain projections with routed actions');

// ------------------------------------------------------------
// 6. Role policy is centralized, generic for adult members and non-writer.
// ------------------------------------------------------------
const permissions = file('src/modules/cleaning/cleaningPermissions.js');
requireText(permissions, "owner/admin", 'Cleaning role policy must document manager mapping');
requireText(permissions, "adult/member", 'Cleaning role policy must document household member mapping');
requireText(permissions, "child/limited/restricted", 'Cleaning role policy must document limited-profile mapping');
requireText(permissions, "STRUCTURE:'STRUCTURE'", 'Cleaning role policy must expose normal structural capability');
requireText(permissions, "DESTRUCTIVE_STRUCTURE:'DESTRUCTIVE_STRUCTURE'", 'Cleaning role policy must separate destructive structural capability');
requireText(permissions, "if(value===ROLE.MEMBER){base[CAP.STRUCTURE]=true", 'Every adult/member must receive normal room/routine management rights');
requireText(permissions, "['removeRoom','removeRoutineItem']", 'Permanent structure removal must remain separately guarded');
requireText(permissions, "PLANNING:'PLANNING'", 'Cleaning role policy must expose planning capability');
requireText(permissions, "RESPOND:'RESPOND'", 'Cleaning role policy must preserve request-response capability');
forbidRegex(permissions, /\.ref\s*\(/, 'Cleaning permission policy must never write Firebase directly');
requireText(permissions, 'Production Firebase Rules are deliberately NOT changed/deployed here.', 'Client role policy must keep the production Firebase Rules boundary explicit');
if (!failed) ok('adult household members keep normal Cleaning management while destructive/admin powers stay separated');

// ------------------------------------------------------------
// 7. Dedicated regression contracts that make up functional close-out.
// ------------------------------------------------------------
[
  'scripts/test-cleaning-runtime-reachability.js',
  'scripts/test-cleaning-permissions.js',
  'scripts/test-cleaning-availability.js',
  'scripts/test-cleaning-execution-exceptions.js',
  'scripts/test-cleaning-execution-sync.js',
  'scripts/test-cleaning-execution-write-runtime.js',
  'scripts/test-cleaning-history.js',
  'scripts/test-cleaning-notifications.js',
  'scripts/test-cleaning-activity.js',
  'scripts/test-cleaning-derived-cleanup.js',
  'scripts/test-cleaning-shopping-cleanup.js',
  'scripts/test-cleaning-supplies.js',
  'scripts/test-cleaning-household-key-safety.js',
  'scripts/test-cleaning-create-retry-idempotency.js',
  'scripts/test-action-inbox.js'
].forEach((rel) => file(rel));
if (!failed) ok('all dedicated functional/hardening regression contracts required for STEP 14 close-out are present');

if (failed) {
  console.error('\nSTEP 14 Cleaning functional close-out contract FAILED.');
  process.exitCode = 1;
} else {
  console.log('\nSTEP 14 Cleaning functional close-out contract PASSED.');
}
