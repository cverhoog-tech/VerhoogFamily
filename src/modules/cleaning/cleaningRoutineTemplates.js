import './cleaningPlanApprovalUi.js?v=1';
import './cleaningRecurringPlanContract.js?v=3';
import './cleaningRoutineExperience.js?v=3';
import './cleaningQuickChoiceFeedback.js?v=2';
import './cleaningRoomListControlsV2.js?v=1';
import './cleaningRoomWorkflowUx.js?v=2';
import './cleaningPauseExperience.js?v=2';
import './cleaningPauseAgendaProjection.js?v=1';
import './cleaningSupplyExperience.js?v=2';
import './cleaningSupplyDirectManager.js?v=1';
import './cleaningActivePlanReconciler.js?v=2';
import './cleaningPlanSanitizer.js?v=2';
import './cleaningApprovalClarity.js?v=1';
import './cleaningRollingPlannerService.js?v=4';
import './cleaningProjectionService.js?v=4';
import './cleaningDerivedCleanup.js?v=1';
import './cleaningShoppingCleanup.js?v=1';
import './cleaningOverviewExperience.js?v=1';
import './cleaningWeekAssist.js?v=2';
import './cleaningExperienceBootstrap.js?v=1';
import './cleaningPreferencesUi.js?v=1';

// ============================================================
// CLEANING ROUTINE TEMPLATES v0.3.7
// Static routine suggestions only. Once selected, a template becomes a
// normal CleaningRoutineItem and is fully editable by the household.
// Side-effect imports load approvals, recurring planning, compact room/routine
// management, cadence-preserving pauses + their Agenda resume marker, direct
// smart supplies, stale-plan sanitizing, rolling plans, Task/Calendar
// projections, derived cleanup, live overview and the advisory week assist.
//
// P0 runtime-wiring recovery (05-09-2026): the cleaningExperienceBootstrap.js
// import pulls in the Task-Detail-Popup-scoped exception/execution/task-supply
// family (cleaningExceptionContract.js, cleaningExecutionSync.js,
// cleaningExecutionUiGuard.js, cleaningExecutionWriteRuntime.js,
// cleaningExceptionRuntime.js, cleaningExceptionTaskUi.js,
// cleaningTaskSupplyUi.js) in explicit dependency order. A runtime audit
// found these seven files were never reachable from the real app entry
// before this line existed. See cleaningExperienceBootstrap.js for the full
// rationale and dependency order, and FamilyApp-Schoonmaken-milestone-log.md
// for the audit writeup.
//
// cleaningPreferencesUi.js (STEP 14 functional end-phase, Milestone 9) adds
// the personal Tijd/Aantal/Beide display preference to the Overzicht tab.
// ============================================================

const PRESETS = Object.freeze({
  'living-room': Object.freeze([
    preset('living-vacuum','Stofzuigen',7,20,'NORMAL'),
    preset('living-dust','Afstoffen',7,15,'NORMAL'),
    preset('living-mop','Dweilen',14,20,'NORMAL'),
    preset('living-deep','Meubels en oppervlakken grondig reinigen',30,20,'EXTRA')
  ]),
  kitchen: Object.freeze([
    preset('kitchen-worktop','Werkblad en kookplaat reinigen',2,10,'NORMAL'),
    preset('kitchen-sink','Spoelbak en kraan schoonmaken',3,10,'NORMAL'),
    preset('kitchen-floor','Keukenvloer reinigen',7,15,'NORMAL'),
    preset('kitchen-fridge','Koelkast schoonmaken',30,25,'EXTRA'),
    preset('kitchen-oven','Oven grondig reinigen',30,30,'EXTRA')
  ]),
  bathroom: Object.freeze([
    preset('bathroom-shower','Douche en bad schoonmaken',7,15,'NORMAL'),
    preset('bathroom-sink','Wastafel en spiegel reinigen',7,10,'NORMAL'),
    preset('bathroom-toilet','Toilet reinigen',7,10,'NORMAL'),
    preset('bathroom-floor','Badkamervloer reinigen',7,10,'NORMAL'),
    preset('bathroom-descale','Kranen en douche ontkalken',30,20,'EXTRA')
  ]),
  toilet: Object.freeze([
    preset('toilet-bowl','Toilet grondig reinigen',3,10,'NORMAL'),
    preset('toilet-sink','Wastafel en kraan reinigen',7,5,'BASIC'),
    preset('toilet-floor','Vloer reinigen',7,10,'NORMAL')
  ]),
  bedroom: Object.freeze([
    preset('bedroom-vacuum','Stofzuigen',7,15,'NORMAL'),
    preset('bedroom-dust','Afstoffen',14,10,'NORMAL'),
    preset('bedroom-bedding','Beddengoed verschonen',14,15,'NORMAL'),
    preset('bedroom-deep','Kamer grondig reinigen',30,20,'EXTRA')
  ]),
  'kids-room': Object.freeze([
    preset('kids-tidy','Speelgoed en oppervlakken opruimen',2,10,'BASIC'),
    preset('kids-vacuum','Stofzuigen',7,15,'NORMAL'),
    preset('kids-dust','Afstoffen',14,10,'NORMAL'),
    preset('kids-deep','Speelgoed en meubels grondig reinigen',30,20,'EXTRA')
  ]),
  hall: Object.freeze([
    preset('hall-vacuum','Hal stofzuigen',7,10,'NORMAL'),
    preset('hall-mop','Hal dweilen',14,10,'NORMAL'),
    preset('hall-handles','Deuren en grepen reinigen',30,10,'EXTRA')
  ]),
  laundry: Object.freeze([
    preset('laundry-floor','Wasruimte vloer reinigen',14,10,'NORMAL'),
    preset('laundry-machines','Wasmachine en droger buitenkant reinigen',14,10,'NORMAL'),
    preset('laundry-deep','Wasruimte grondig reinigen',30,20,'EXTRA')
  ]),
  outdoor: Object.freeze([
    preset('outdoor-sweep','Balkon of terras vegen',14,20,'NORMAL'),
    preset('outdoor-rail','Reling en oppervlakken reinigen',30,20,'NORMAL'),
    preset('outdoor-deep','Buitenruimte grondig reinigen',60,30,'EXTRA')
  ]),
  custom: Object.freeze([
    preset('custom-vacuum','Stofzuigen',7,15,'NORMAL'),
    preset('custom-dust','Afstoffen',14,10,'NORMAL'),
    preset('custom-mop','Dweilen',14,15,'NORMAL')
  ])
});

function preset(key,title,intervalDays,estimatedMinutes,priority){return Object.freeze({key:key,title:title,intervalDays:intervalDays,estimatedMinutes:estimatedMinutes,priority:priority});}
export function routineTemplatesForRoomType(roomType){const key=String(roomType||'custom');return PRESETS[key]||PRESETS.custom;}
export const CLEANING_ROUTINE_TEMPLATES_VERSION = '0.3.7';
