import './cleaningExceptionContract.js?v=1';
import './cleaningExecutionSync.js?v=1';
import './cleaningExecutionUiGuard.js?v=1';
import './cleaningExecutionWriteRuntime.js?v=1';
import './cleaningExceptionRuntime.js?v=1';
import './cleaningExceptionTaskUi.js?v=1';
import './cleaningHelpRequestUi.js?v=1';
import './cleaningTaskSupplyUi.js?v=1';

// ============================================================
// CLEANING EXPERIENCE BOOTSTRAP v1.1.0
//
// WHY THIS FILE EXISTS
// ---------------------
// A P0 runtime audit (05-09-2026) established one explicit Cleaning-side
// reachability path from navigation.js -> cleaningScreen.js ->
// cleaningRoutineTemplates.js -> this bootstrap for the execution/exception
// family. Some of these files are also loaded by calendar.js for Tasks/Agenda
// interoperability; their own idempotency guards make the additional Cleaning
// entry safe and ensure opening Schoonmaken never depends on that older loader.
//
// v1.1.0 adds cleaningHelpRequestUi.js for STEP 14 Blok 2.4. The requester
// starts a help request from cleaningExceptionTaskUi.js. The intended recipient
// sees explicit accept/decline controls in Schoonmaken. Acceptance is never
// automatic and CleaningOccurrence remains the canonical source of truth.
//
// DEPENDENCY ORDER (do not reorder without re-checking each file's
// window.* prerequisites):
//   1. cleaningExceptionContract.js    - pure contract, no prerequisites.
//   2. cleaningExecutionSync.js        - pure contract, no prerequisites.
//   3. cleaningExecutionUiGuard.js     - reads window.CleaningExecutionSync;
//                                        polls for window.TaskDetailPopup.
//   4. cleaningExecutionWriteRuntime.js - reads window.CleaningExecutionSync;
//                                        polls for Task/Calendar repositories;
//                                        soft-depends on
//                                        window.CleaningProjectionService for
//                                        async repair only.
//   5. cleaningExceptionRuntime.js     - reads window.CleaningExceptionContract
//                                        and window.CleaningExecutionSync.
//   6. cleaningExceptionTaskUi.js      - reads window.CleaningExceptionRuntime,
//                                        window.CleaningExecutionUiGuard and
//                                        window.CleaningExecutionSync.
//   7. cleaningHelpRequestUi.js        - reads window.CleaningExceptionRuntime,
//                                        CleaningHouseholdRepository and active
//                                        household/member identity; renders only
//                                        explicit recipient accept/decline UI.
//   8. cleaningTaskSupplyUi.js         - reads window.CleaningExecutionSync
//                                        (soft), window.CleaningHouseholdRepository
//                                        and window.CleaningDomain.
//
// OWNERSHIP GUARDS
// -----------------
// - This file only adds import statements. It contains no writer logic.
// - Each imported file guards its own single-install idempotency, so the
//   calendar bootstrap and this Cleaning bootstrap cannot install duplicate
//   writers/listeners even when both paths are evaluated.
// - CleaningOccurrence remains the only source of truth. Help request state
//   is stored on the occurrence and changes assignmentUids only after an
//   explicit ACCEPT_HELP transition by the intended recipient.
// - cleaningExecutionWriteRuntime.js remains the sole reverse-sync patch for
//   Cleaning-linked Task/Calendar updateOne/remove operations.
// ============================================================

export const CLEANING_EXPERIENCE_BOOTSTRAP_VERSION = '1.1.0';

// Importing this module is itself the ensureLoaded call: ES module evaluation
// is cached per URL by the browser. This export exists so callers/tests can
// confirm the bootstrap itself resolved successfully.
export function cleaningExperienceBootstrapLoaded(){
  return true;
}
