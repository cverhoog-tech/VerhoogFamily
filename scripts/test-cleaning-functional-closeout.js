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
const inbox=read('src/platform/inbox/actionInboxRegistry.js');
const inboxBoot=read('src/platform/inbox/actionInboxBootstrap.js');
const workflow=read('src/modules/cleaning/cleaningRoomWorkflowUx.js');

need(screen,/const VERSION='2\.0\.0'/,'served Cleaning entry must be v2');
need(screen,/familyPath:'families\/'\+ctx\.householdId/,'v2 repository must remain HouseholdContext scoped');
need(screen,/cleaningPath:'families\/'\+ctx\.householdId\+'\/cleaning'/,'existing canonical Cleaning Firebase root must be preserved');
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
need(screen,/window\.CleaningHouseholdRepository=CleaningV2Repository/,'Action Inbox reads the same v2 repository instead of a parallel store');
need(screen,/respondToHelpRequest:respondHelp/,'Cleaning help Inbox actions route into v2');
need(screen,/resolveRequest:resolveRoutineRequest,resolveCounter:resolveRoutineCounter/,'routine request decisions route into v2');
need(inbox,/type:'cleaning\.help'/,'Action Inbox still projects Cleaning help');
need(inbox,/type:'cleaning\.routine\.transfer'/,'Action Inbox still projects routine transfers');
need(inbox,/type:'cleaning\.routine\.counter'/,'Action Inbox still projects counterproposals');
forbid(inbox,/\.ref\s*\(/,'Action Inbox must remain writer-free');
need(screen,/requireCap\(CAP\.DESTRUCTIVE\)/,'destructive structure remains manager-only');
need(screen,/requireCap\(CAP\.PLANNING\)/,'planning remains permission guarded');
need(screen,/requireCap\(CAP\.EXECUTION\)/,'execution remains permission guarded');
forbid(screen,/TaskDetailPopup|TaskSharedData|CleaningExecutionWriteRuntime|CleaningProjectionService/,'v2 must not reactivate legacy popup/write cascade');
forbid(screen,/new\s+MutationObserver|MutationObserver\s*\(/,'v2 must not create MutationObservers');
need(premium,/disabledForCleaningV2:true/,'legacy premium runtime must stay inert');
forbid(inboxBoot,/modules\/cleaning|cleaningHouseholdRepository|cleaningRoutineExperience/,'Cleaning must stay off the global startup path');
need(workflow,/var VERSION='0\.2\.0'/,'locked historical room workflow rollback file must remain unchanged');
[
 'scripts/test-cleaning-runtime-reachability.js','scripts/test-cleaning-modal-performance-guards.js','scripts/test-cleaning-permissions.js','scripts/test-cleaning-planning-member-filter.js','scripts/test-cleaning-module-identity.js','scripts/test-action-inbox.js'
].forEach(read);
if(failed){console.error('\nCleaning v2 functional closeout FAILED.');process.exitCode=1;}else console.log('Cleaning v2 functional closeout: PASS');
