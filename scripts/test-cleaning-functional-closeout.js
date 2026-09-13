#!/usr/bin/env node
'use strict';
const fs=require('fs');
const path=require('path');
const ROOT=path.resolve(__dirname,'..');
let failed=false;
function read(rel){const full=path.join(ROOT,rel);if(!fs.existsSync(full)){failed=true;console.error('FAIL: missing '+rel);return'';}return fs.readFileSync(full,'utf8');}
function need(source,re,label){if(!re.test(source)){failed=true;console.error('FAIL: '+label);}}
function forbid(source,re,label){if(re.test(source)){failed=true;console.error('FAIL: '+label);}}
const screen=read('src/modules/cleaning/cleaningScreen.js');
const premium=read('src/modules/cleaning/cleaningPremiumFeedback.js');
const companions=read('src/modules/cleaning/cleaningCompanionLoader.js');
const collaboration=read('src/modules/cleaning/cleaningCollaborationExperience.js');
const contract=read('src/modules/cleaning/cleaningCollaborationContract.js');
const history=read('src/modules/cleaning/cleaningHistoryV22.js');
const historyContract=read('src/modules/cleaning/cleaningHistoryContract.js');
const detailVisual=read('src/modules/cleaning/cleaningDetailVisualV221.js');
const occurrenceCommands=read('src/modules/cleaning/cleaningOccurrenceCommandsV23.js');
const occurrenceControls=read('src/modules/cleaning/cleaningOccurrenceControlsV23.js');
const assignmentExperience=read('src/modules/cleaning/cleaningAssignmentExperienceV25.js');
const inbox=read('src/platform/inbox/actionInboxRegistry.js');
const inboxBoot=read('src/platform/inbox/actionInboxBootstrap.js');
const workflow=read('src/modules/cleaning/cleaningRoomWorkflowUx.js');

need(screen,/const VERSION='2\.0\.0'/,'served primary Cleaning entry must remain accepted v2 baseline');
need(screen,/familyPath:'families\/'\+ctx\.householdId/,'v2 repository must remain HouseholdContext scoped');
need(screen,/cleaningPath:'families\/'\+ctx\.householdId\+'\/cleaning'/,'canonical Cleaning Firebase root must be preserved');
need(screen,/function createRoom\(/,'room creation must exist');
need(screen,/function updateRoom\(/,'room editing must exist');
need(screen,/function removeRoom\(/,'room removal must exist');
need(screen,/function createRoutine\(/,'routine creation must exist');
need(screen,/function updateRoutine\(/,'routine editing must exist');
need(screen,/function removeRoutine\(/,'routine removal must exist');
need(screen,/function addRoomSupply\(/,'room supplies must exist');
need(screen,/function setInventoryStatus\(/,'inventory status must exist');
need(screen,/function generateWeekPlan\(/,'week planning must exist');
need(screen,/CleaningPlannerContract/,'accepted pure planner math must remain reused');
need(screen,/CleaningPlanPersistenceContract/,'accepted pure plan materialization must remain reused');
need(screen,/function writeOccurrenceChecklist\(/,'one canonical execution writer must exist');
need(screen,/cleaningPath\+'\/occurrences\/'/,'CleaningOccurrence remains canonical execution state');
need(screen,/completionLogs/,'completion history must stay in canonical Cleaning data');
need(screen,/updates\['tasks\/'/,'Tasks remain derived projections');
need(screen,/updates\['calendarEvents\/'/,'Agenda remains derived projection');
need(screen,/window\.CleaningHouseholdRepository=CleaningV2Repository/,'v2 companions must read the same v2 repository');

need(contract,/VERSION='2\.1\.0'/,'v2.1 pure collaboration state machine must exist');
['REQUEST_TRANSFER','WITHDRAW_TRANSFER','ACCEPT_TRANSFER','DECLINE_TRANSFER','COUNTER_TRANSFER','ACCEPT_COUNTER','DECLINE_COUNTER','REQUEST_HELP','WITHDRAW_HELP','ACCEPT_HELP','DECLINE_HELP'].forEach(function(command){need(contract,new RegExp("'"+command+"'"),'collaboration command '+command+' must exist');});
need(collaboration,/CleaningHouseholdRepository/,'v2.1 collaboration must reuse v2 repository');
need(collaboration,/\.transaction\(function\(server\)/,'collaboration writes must transact an occurrence');
need(collaboration,/syncAcceptedProjection/,'accepted transfer must update existing projections');
need(collaboration,/state\.busy\.has\(occurrenceId\)/,'duplicate-tap guard must exist');
need(collaboration,/data-cc21-turn/,'v2.1 collaboration must render inside the concrete turn detail flow');
forbid(collaboration,/screen\.appendChild\(panel\)|cc21-shell/,'v2.1 must not render a standalone collaboration menu');
forbid(collaboration,/\.on\(\s*['"]value['"]/,'v2.1 must not add a second Cleaning Firebase listener');
forbid(collaboration,/new\s+MutationObserver|MutationObserver\s*\(|document\.addEventListener\('click'|TaskDetailPopup|CleaningExecutionWriteRuntime|CleaningProjectionService/,'v2.1 must not reactivate forbidden runtime patterns');
forbid(collaboration,/NotificationStore|publishSelf|publishTo/,'v2.1 collaboration must not create noisy notification projection work');

need(historyContract,/VERSION='2\.2\.0'/,'v2.2 pure history contract must exist');
need(historyContract,/completionLogs/,'v2.2 history must derive from canonical completion logs');
need(historyContract,/activityEvent/,'v2.2 history contract must derive deterministic activity events');
forbid(historyContract,/\.ref\s*\(|firebase|document\.|MutationObserver|setInterval|setTimeout/,'v2.2 history contract must stay pure');
need(history,/CleaningHouseholdRepository/,'v2.2 history must reuse v2 repository');
need(history,/data-ch22-history/,'v2.2 must expose a History tab');
need(history,/data-ch22-attention/,'v2.2 must expose quiet in-module reminders');
need(history,/HouseholdActivity/,'v2.2 may project new completions to existing Activity');
need(history,/state\.seen=new Set\(Object\.keys\(logs\)\)/,'v2.2 must baseline existing completion logs without feed flooding');
forbid(history,/\.on\(\s*['"]value['"]|firebase\.database|fbDb/,'v2.2 must not add a Firebase owner/listener');
forbid(history,/new\s+MutationObserver|MutationObserver\s*\(|setInterval\s*\(|setTimeout\s*\(/,'v2.2 must not add observer or polling loops');
forbid(history,/NotificationStore|publishSelf|publishToUids|CleaningNotificationProjector/,'v2.2 reminders must not create notification noise');
forbid(history,/TaskDetailPopup|CleaningExecutionWriteRuntime|CleaningProjectionService/,'v2.2 must not reactivate legacy freeze-prone owners');

need(detailVisual,/VERSION='2\.2\.1'/,'v2.2.1 premium detail visual companion must exist');
need(detailVisual,/CleaningHouseholdRepository/,'v2.2.1 visual companion must reuse the v2 repository');
need(detailVisual,/document\.getElementById\('cleaning-v2-sheet'\)/,'v2.2.1 must reuse the existing Cleaning sheet');
need(detailVisual,/Voor deze beurt/,'v2.2.1 supplies must preserve concrete-turn scope');
need(detailVisual,/Alle kameritems/,'v2.2.1 supplies must preserve room scope');
need(detailVisual,/ShoppingListStore/,'v2.2.1 low\/out supplies may hand off to canonical Shopping');
forbid(detailVisual,/\.on\(\s*['"]value['"]|firebase\.database|fbDb|new\s+MutationObserver|MutationObserver\s*\(|setInterval\s*\(|setTimeout\s*\(|TaskDetailPopup|CleaningExecutionWriteRuntime|CleaningProjectionService/,'v2.2.1 visual companion must stay lightweight and non-authoritative');

need(occurrenceCommands,/VERSION='2\.3\.0'/,'v2.3 occurrence commands must remain present');
need(occurrenceCommands,/setOccurrenceAssigneesV25/,'v2.5 must expose explicit occurrence multi-assignment through the existing repository');
need(occurrenceCommands,/setRoutineAssigneesV25/,'v2.5 must persist routine assignment defaults through the existing repository');
need(occurrenceCommands,/applyRoutineDefaultsV25/,'v2.5 routine defaults must be applicable to active week-plan occurrences');
need(occurrenceCommands,/assignedToUids/,'v2.5 projection sync must preserve all assigned people');
forbid(occurrenceCommands,/\.on\(\s*['"]value['"]|new\s+MutationObserver|MutationObserver\s*\(|document\.addEventListener\('click'/,'v2.5 commands must not own another listener or global UI owner');

need(occurrenceControls,/name="assigneeUids"/,'turn editor must support selecting multiple household members');
need(occurrenceControls,/data-cv23-assignees-open/,'assigned-person card must be interactive');
need(occurrenceControls,/data\.getAll\('assigneeUids'\)/,'turn assignment submit must persist all selected people');
need(occurrenceControls,/avatarUrl/,'turn assignee picker must render household avatars where available');
forbid(occurrenceControls,/\.on\(\s*['"]value['"]|new\s+MutationObserver|MutationObserver\s*\(|document\.addEventListener\('click'/,'turn assignment controls must stay scoped to the Cleaning sheet');

need(assignmentExperience,/VERSION='2\.5\.1'/,'v2.5 assignment experience must exist at the current hardened version');
need(assignmentExperience,/HouseholdIdentityFirebaseBridge/,'v2.5 must use the canonical household identity source');
need(assignmentExperience,/data-ca25-member-filter/,'Weekplan must expose all-household member filters');
need(assignmentExperience,/ca25RoutineAssignee/,'routine editor must support explicit one-or-many assignees');
need(assignmentExperience,/avatarUrl/,'Weekplan and routines must use chosen avatars where available');
need(assignmentExperience,/setRoutineAssigneesV25/,'routine UI must delegate writes to the repository extension');
need(assignmentExperience,/applyRoutineDefaultsV25/,'routine defaults must be applied to generated\/active plan occurrences without another planner');
need(assignmentExperience,/r\.subscribe\(onRepo\)/,'v2.5 presentation must reuse the existing repository subscription');
forbid(assignmentExperience,/\.on\(\s*['"]value['"]|firebase\.database|fbDb|new\s+MutationObserver|MutationObserver\s*\(|document\.addEventListener\('click'|TaskDetailPopup/,'v2.5 assignment experience must not add a second raw data owner or popup');

need(companions,/import '\.\/cleaningCollaborationExperience\.js\?v=2'/,'v2.1 collaboration must lazy-load with the current cache key');
need(companions,/import '\.\/cleaningHistoryV22\.js\?v=1'/,'v2.2 history must lazy-load only with Cleaning');
need(companions,/import '\.\/cleaningDetailVisualV221\.js\?v=1'/,'v2.2.1 detail visual must lazy-load only with Cleaning');
need(companions,/import '\.\/cleaningOccurrenceCommandsV23\.js\?v=2'/,'v2.3\/v2.5 commands must lazy-load only with Cleaning');
need(companions,/import '\.\/cleaningOccurrenceControlsV23\.js\?v=3'/,'v2.3\/v2.5 controls must lazy-load only with Cleaning');
need(companions,/import '\.\/cleaningAssignmentExperienceV25\.js\?v=2'/,'v2.5 assignment experience must lazy-load only with Cleaning');
need(premium,/version:'2\.2\.1'/,'Cleaning companion marker must be v2.2.1');
need(premium,/disabledForCleaningV2:true/,'legacy premium runtime must stay inert');
forbid(premium,/MutationObserver|addEventListener|setTimeout|setInterval/,'premium shim must create no runtime work itself');
forbid(premium,/cleaningHistoryExperience|cleaningActivityProjector|cleaningNotificationProjector/,'old pre-reset v2.2 runtimes must remain disconnected');

need(inbox,/type:'cleaning\.help'/,'Action Inbox projects Cleaning help');
need(inbox,/type:'cleaning\.occurrence\.transfer'/,'Action Inbox projects occurrence transfers');
need(inbox,/type:'cleaning\.occurrence\.counter'/,'Action Inbox projects occurrence counterproposals');
need(inbox,/CleaningCollaborationV21\.handleInboxAction/,'Action Inbox decisions route into the v2.1 collaboration runtime');
forbid(inbox,/cleaning\.routine\.transfer|cleaning\.routine\.counter/,'old routine-level collaboration adapters must not be active');
forbid(inbox,/\.ref\s*\(/,'Action Inbox must remain writer-free');

need(screen,/requireCap\(CAP\.DESTRUCTIVE\)/,'destructive structure remains manager-only');
need(screen,/requireCap\(CAP\.PLANNING\)/,'planning remains permission guarded');
need(screen,/requireCap\(CAP\.EXECUTION\)/,'execution remains permission guarded');
forbid(screen,/TaskDetailPopup|TaskSharedData|CleaningExecutionWriteRuntime|CleaningProjectionService/,'primary v2 must not reactivate legacy popup/write cascade');
forbid(screen,/new\s+MutationObserver|MutationObserver\s*\(/,'primary v2 must not create MutationObservers');
forbid(inboxBoot,/modules\/cleaning|cleaningHouseholdRepository|cleaningRoutineExperience|cleaningHelpRequestUi|cleaningPermissions/,'Cleaning must stay off the global startup path');
need(workflow,/var VERSION='0\.2\.0'/,'locked historical room workflow rollback file must remain unchanged');
[
 'scripts/test-cleaning-runtime-reachability.js','scripts/test-cleaning-modal-performance-guards.js','scripts/test-cleaning-permissions.js','scripts/test-cleaning-planning-member-filter.js','scripts/test-cleaning-module-identity.js','scripts/test-action-inbox.js','scripts/test-cleaning-collaboration-v21.js','scripts/test-cleaning-collaboration-multiuser-v21.js','scripts/test-cleaning-history-v22.js','scripts/test-cleaning-detail-visual-v221.js','scripts/test-cleaning-v23.js'
].forEach(read);
if(failed){console.error('\nCleaning v2.5 functional closeout FAILED.');process.exitCode=1;}else console.log('Cleaning v2.5 functional closeout: PASS');
