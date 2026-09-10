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
const collaboration=read('src/modules/cleaning/cleaningCollaborationExperience.js');
const contract=read('src/modules/cleaning/cleaningCollaborationContract.js');
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
need(screen,/window\.CleaningHouseholdRepository=CleaningV2Repository/,'collaboration must read the same v2 repository');

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
need(premium,/import '\.\/cleaningCollaborationExperience\.js\?v=2'/,'v2.1 collaboration must lazy-load with the current cache key');
need(premium,/version:'2\.1\.1'/,'v2.1 contextual collaboration UX marker must be current');
need(premium,/disabledForCleaningV2:true/,'legacy premium runtime must stay inert');
forbid(premium,/MutationObserver|addEventListener|setTimeout|setInterval/,'premium shim must create no runtime work itself');

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
forbid(inboxBoot,/modules\/cleaning|cleaningHouseholdRepository|cleaningRoutineExperience|cleaningCollaboration/,'Cleaning must stay off the global startup path');
need(workflow,/var VERSION='0\.2\.0'/,'locked historical room workflow rollback file must remain unchanged');
[
 'scripts/test-cleaning-runtime-reachability.js','scripts/test-cleaning-modal-performance-guards.js','scripts/test-cleaning-permissions.js','scripts/test-cleaning-planning-member-filter.js','scripts/test-cleaning-module-identity.js','scripts/test-action-inbox.js','scripts/test-cleaning-collaboration-v21.js'
].forEach(read);
if(failed){console.error('\nCleaning v2.1 functional closeout FAILED.');process.exitCode=1;}else console.log('Cleaning v2.1 functional closeout: PASS');