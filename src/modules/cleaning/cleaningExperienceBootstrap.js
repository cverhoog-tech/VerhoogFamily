import './cleaningExceptionContract.js?v=1';
import './cleaningExecutionSync.js?v=1';
import './cleaningExecutionUiGuard.js?v=1';
import './cleaningExecutionWriteRuntime.js?v=1';
import './cleaningExceptionRuntime.js?v=1';
import './cleaningExceptionTaskUi.js?v=1';
import './cleaningHelpRequestUi.js?v=1';
import './cleaningAvailabilityContract.js?v=1';
import './cleaningAvailabilityExperience.js?v=1';
import './cleaningTaskSupplyUi.js?v=1';

// ============================================================
// CLEANING EXPERIENCE BOOTSTRAP v1.2.0
//
// WHY THIS FILE EXISTS
// ---------------------
// A P0 runtime audit (05-09-2026) established one explicit Cleaning-side
// reachability path from navigation.js -> cleaningScreen.js ->
// cleaningRoutineTemplates.js -> this bootstrap for runtime experiences that
// are not part of the base Cleaning screen. Some execution files are also
// loaded by calendar.js for Tasks/Agenda interoperability; idempotency guards
// make this Cleaning-side entry safe and deterministic.
//
// v1.1.0 added cleaningHelpRequestUi.js for explicit recipient accept/decline.
// v1.2.0 adds the pure availability contract + availability experience. The
// experience reuses CleaningPauseExperience for fixed-routine / room cadence
// pauses; it does not invent a second occurrence or assignment truth.
//
// DEPENDENCY ORDER (do not reorder without re-checking prerequisites):
//   1. cleaningExceptionContract.js     - pure exception contract.
//   2. cleaningExecutionSync.js         - pure execution contract.
//   3. cleaningExecutionUiGuard.js      - reads CleaningExecutionSync.
//   4. cleaningExecutionWriteRuntime.js - reverse-sync Task/Calendar writer.
//   5. cleaningExceptionRuntime.js      - reads exception + execution contract.
//   6. cleaningExceptionTaskUi.js       - Task-detail exception actions.
//   7. cleaningHelpRequestUi.js         - recipient accept/decline UI.
//   8. cleaningAvailabilityContract.js  - pure availability/planning adapter.
//   9. cleaningAvailabilityExperience.js - availability UI + cadence-safe pause
//                                          orchestration. CleaningPauseExperience
//                                          is already loaded earlier by
//                                          cleaningRoutineTemplates.js.
//  10. cleaningTaskSupplyUi.js          - Task-detail Cleaning supplies.
//
// OWNERSHIP GUARDS
// -----------------
// - This file only adds imports; it contains no writer logic.
// - Imported files guard single-install idempotency.
// - CleaningOccurrence remains the only concrete-clean source of truth.
// - Help assignment changes happen only after explicit ACCEPT_HELP.
// - Availability never silently reassigns existing accepted work.
// - cleaningExecutionWriteRuntime.js remains the sole reverse-sync patch for
//   Cleaning-linked Task/Calendar updateOne/remove operations.
// ============================================================

export const CLEANING_EXPERIENCE_BOOTSTRAP_VERSION = '1.2.0';

export function cleaningExperienceBootstrapLoaded(){
  return true;
}
