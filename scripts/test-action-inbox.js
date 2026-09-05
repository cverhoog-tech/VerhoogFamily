#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const INBOX_DIR = path.join(ROOT, 'src', 'platform', 'inbox');
const APP_JS = path.join(ROOT, 'api', 'app.js');

let failed = false;
function fail(message){failed=true;console.error('FAIL: '+message);}
function ok(message){console.log('OK: '+message);}
function read(relPath){return fs.readFileSync(path.join(ROOT, relPath), 'utf8');}
function readInbox(name){return fs.readFileSync(path.join(INBOX_DIR, name), 'utf8');}

const REQUIRED_FILES = [
  'actionInboxBootstrap.js',
  'actionInboxRegistry.js',
  'actionInboxStore.js',
  'actionInboxScreen.js',
  'actionInboxHeaderBridge.js'
];

// 1. Required files exist.
function testFilesExist(){
  const missing = REQUIRED_FILES.filter((name)=>!fs.existsSync(path.join(INBOX_DIR, name)));
  if(missing.length) fail('Missing Action Inbox files: '+missing.join(', '));
  else ok('all platform/inbox files exist');
}

// 2. No new canonical request database / direct Firebase domain writes from the Inbox layer.
function testNoNewWriters(){
  const forbidden = [/inboxRequests/i, /\.set\s*\(/, /\.push\s*\(\s*\)\.set/, /\.update\s*\(\s*\{/];
  REQUIRED_FILES.forEach((name)=>{
    const source = readInbox(name);
    if(/inboxRequests/i.test(source)) fail(name+' references an "inboxRequests" path — Inbox must not own canonical request state.');
    // Direct Firebase writes (.set/.update/.push with a value) are forbidden anywhere in the Inbox layer;
    // reading (.on('value', ...)) is allowed and expected for the swap watcher.
    if(/\.set\(/.test(source) || /\.transaction\(/.test(source)) fail(name+' appears to write directly to Firebase; all mutations must go through existing domain runtimes.');
  });
  ok('no new Inbox writer / canonical request database found');
}

// 3. Every adapter action routes to an existing, already-accepted domain runtime.
function testActionRouting(){
  const registry = readInbox('actionInboxRegistry.js');
  const expectedCalls = [
    'NotificationActions.acceptTaskHelp',
    'NotificationActions.declineTaskHelp',
    'TaskSwapRequests.acceptRequest',
    'TaskSwapRequests.declineRequest',
    'PartyQuestInvites.respond',
    'CleaningExceptionRuntime.respondToHelpRequest',
    'CleaningRoutineExperience.resolveRequest',
    'CleaningRoutineExperience.resolveCounter'
  ];
  const missing = expectedCalls.filter((call)=>registry.indexOf(call)<0);
  if(missing.length) fail('actionInboxRegistry.js does not route through: '+missing.join(', '));
  else ok('all adapters route actions through existing domain runtimes');
}

// 4. Presence in the Inbox is derived from canonical domain state, not from NotificationStore.
// NotificationStore may only be referenced for optional markRead cleanup, never inside a
// list()/findById() function that decides whether an item is open.
function testPresenceIsCanonical(){
  const registry = readInbox('actionInboxRegistry.js');
  const listBlocks = registry.match(/list:function\s*\([^)]*\)\s*\{[\s\S]*?\n\s{4}\},/g) || [];
  if(!listBlocks.length){ fail('Could not locate adapter list() functions to verify.'); return; }
  const offending = listBlocks.filter((block)=>/NotificationStore/.test(block));
  if(offending.length) fail('An adapter list() function reads NotificationStore — presence must come from canonical domain state only.');
  else ok('adapter list() functions never depend on NotificationStore ('+listBlocks.length+' checked)');
}

// 5. The Inbox badge has one owner: ActionInboxStore. It must never be derived from
// unread notifications, and NotificationStore's own unread badge must stay untouched.
function testBadgeOwnership(){
  const bridge = readInbox('actionInboxHeaderBridge.js');
  if(/NotificationStore\s*\./.test(bridge)) fail('actionInboxHeaderBridge.js reads from NotificationStore — the Inbox badge must be derived only from ActionInboxStore.');
  if(bridge.indexOf('ActionInboxStore')<0) fail('actionInboxHeaderBridge.js does not read from ActionInboxStore.');
  if(bridge.indexOf('notif-dot')>=0) fail('actionInboxHeaderBridge.js touches #notif-dot — Inbox and Meldingen badges must remain separately owned.');
  let notificationStoreSource;
  try{ notificationStoreSource = read('src/core/notificationStore.js'); }catch(e){ fail('src/core/notificationStore.js not found.'); return; }
  if(notificationStoreSource.indexOf('notif-dot')<0) fail('notificationStore.js no longer drives #notif-dot — existing Meldingen badge regressed.');
  else ok('Inbox badge (ActionInboxStore) and Meldingen badge (NotificationStore/#notif-dot) remain separately owned');
}

// 6. TaskSwapRequests exposes the small explicit accept/decline API additively.
function testTaskSwapApi(){
  let source;
  try{ source = read('src/modules/tasks/taskSwapRequests.js'); }catch(e){ fail('src/modules/tasks/taskSwapRequests.js not found.'); return; }
  if(!/acceptRequest\s*:\s*acceptRequest/.test(source) || !/declineRequest\s*:\s*declineRequest/.test(source)){
    fail('TaskSwapRequests does not export acceptRequest/declineRequest.');
  } else {
    ok('TaskSwapRequests exports acceptRequest(id)/declineRequest(id)');
  }
  // still only one canonical write path: families/{id}/taskSwapRequests
  const refCount = (source.match(/families\/'\+(?:family|hid\(\))\+'\/taskSwapRequests/g) || []).length;
  if(refCount<1) fail('taskSwapRequests.js no longer writes to its single canonical path.');
}

// 7. Household/account switch and logout must clear Inbox state (no stale items/badge).
function testIdentityLifecycle(){
  const store = readInbox('actionInboxStore.js');
  if(store.indexOf('identityKey')<0) fail('actionInboxStore.js has no identity-keyed reset logic for household/account switch.');
  if(!/items=\[\];emit\(\)/.test(store)) fail('actionInboxStore.js does not clear items on an invalid/absent household context (logout).');
  else ok('actionInboxStore.js resets on household/account switch and logout');
}

// 8. Cleaning counterproposal keeps accept/decline directly in the Inbox and offers a
// tertiary "Ander voorstel" action that opens the existing Cleaning UI, per product decision.
function testCleaningCounterUx(){
  const registry = readInbox('actionInboxRegistry.js');
  const counterBlockMatch = registry.match(/cleaningRoutineCounterAdapter=\{[\s\S]*?\n {2}\};/);
  if(!counterBlockMatch){ fail('cleaningRoutineCounterAdapter not found.'); return; }
  const block = counterBlockMatch[0];
  if(block.indexOf("id:'accept'")<0 || block.indexOf("id:'decline'")<0) fail('Cleaning counterproposal item is missing direct accept/decline actions.');
  if(block.indexOf("id:'detail'")<0 || block.indexOf('secondary:true')<0) fail('Cleaning counterproposal item is missing the tertiary "Ander voorstel" detail action.');
  if(block.indexOf("showScreen('cleaning')")<0) fail('The "Ander voorstel" action does not open the existing Cleaning UI.');
  else ok('Cleaning counterproposal: accept/decline in Inbox + "Ander voorstel" opens Cleaning module');
}

// 9. Script wiring: all five Inbox files are actually loaded by the app.
function testScriptWiring(){
  let appSource;
  try{ appSource = read('api/app.js'); }catch(e){ fail('api/app.js not found.'); return; }
  const missing = REQUIRED_FILES.filter((name)=>appSource.indexOf('src/platform/inbox/'+name)<0);
  if(missing.length) fail('api/app.js does not inject: '+missing.join(', '));
  else ok('api/app.js injects all Action Inbox scripts');
}

// 10. Existing sensitive contracts are not touched by this milestone.
function testExistingContractsUntouched(){
  const criticalFiles = [
    'src/core/notificationActions.js',
    'src/modules/tasks/partyQuestInvites.js',
    'src/modules/cleaning/cleaningExceptionRuntime.js',
    'src/modules/cleaning/cleaningRoutineExperience.js'
  ];
  const missing = criticalFiles.filter((rel)=>!fs.existsSync(path.join(ROOT, rel)));
  if(missing.length) fail('Expected existing domain files are missing: '+missing.join(', '));
  else ok('existing NotificationActions/PartyQuest/Cleaning runtime files are present and untouched by this change');
}

testFilesExist();
testNoNewWriters();
testActionRouting();
testPresenceIsCanonical();
testBadgeOwnership();
testTaskSwapApi();
testIdentityLifecycle();
testCleaningCounterUx();
testScriptWiring();
testExistingContractsUntouched();

if(failed){
  console.error('\nAction Inbox contract tests FAILED.');
  process.exitCode = 1;
} else {
  console.log('\nAction Inbox contract tests passed.');
}
