import './cleaningExceptionContract.js?v=1';
import './cleaningExecutionSync.js?v=1';
import './cleaningExecutionUiGuard.js?v=1';
import './cleaningExecutionWriteRuntime.js?v=1';
import './cleaningExceptionRuntime.js?v=1';
import './cleaningExceptionTaskUi.js?v=1';
import './cleaningTaskSupplyUi.js?v=1';

// ============================================================
// CLEANING EXPERIENCE BOOTSTRAP v1.0.0
//
// WHY THIS FILE EXISTS
// ---------------------
// A P0 runtime audit (05-09-2026) found that the following functionally
// required Cleaning modules were never reachable from the real app entry
// (navigation.js -> dynamic import of cleaningScreen.js -> side-effect
// imports in cleaningRoutineTemplates.js): cleaningExceptionContract.js,
// cleaningExecutionSync.js, cleaningExecutionUiGuard.js,
// cleaningExecutionWriteRuntime.js, cleaningExceptionRuntime.js,
// cleaningExceptionTaskUi.js, cleaningTaskSupplyUi.js.
//
// These seven files are scoped to the Tasks screen's Task Detail Popup
// (#tdp-overlay), not the Cleaning screen, which is why they were missed
// when cleaningRoutineTemplates.js's existing 18-file experience chain was
// built: that chain only decorates #screen-cleaning. This bootstrap is a
// deliberately separate, explicit entry point for the Task-Detail-Popup
// scoped family so their load path is self-documenting instead of being
// inferred from import side effects buried in an unrelated file.
//
// DEPENDENCY ORDER (do not reorder without re-checking each file's
// window.* prerequisites):
//   1. cleaningExceptionContract.js   - pure contract, no prerequisites.
//   2. cleaningExecutionSync.js       - pure contract, no prerequisites.
//   3. cleaningExecutionUiGuard.js    - reads window.CleaningExecutionSync;
//                                       polls for window.TaskDetailPopup.
//   4. cleaningExecutionWriteRuntime.js - reads window.CleaningExecutionSync;
//                                       polls for Task/Calendar repositories;
//                                       soft-depends on
//                                       window.CleaningProjectionService for
//                                       async repair only (already loaded by
//                                       cleaningRoutineTemplates.js before
//                                       this bootstrap runs).
//   5. cleaningExceptionRuntime.js    - reads window.CleaningExceptionContract
//                                       and window.CleaningExecutionSync.
//   6. cleaningExceptionTaskUi.js     - reads window.CleaningExceptionRuntime,
//                                       window.CleaningExecutionUiGuard and
//                                       window.CleaningExecutionSync.
//   7. cleaningTaskSupplyUi.js        - reads window.CleaningExecutionSync
//                                       (soft), window.CleaningHouseholdRepository
//                                       and window.CleaningDomain, both already
//                                       loaded by cleaningScreen.js's direct
//                                       imports before this file ever runs.
//
// OWNERSHIP GUARDS
// -----------------
// - This file only ever adds import statements. It contains no logic and
//   patches nothing itself, so it introduces no new writers or listeners.
// - Each imported file already guards its own single-install idempotency
//   (`if(window.X)return;` or an installed-flag check), so importing this
//   bootstrap more than once, or alongside a future direct import of the
//   same files elsewhere, stays safe.
// - CleaningOccurrence remains the only source of truth; none of these
//   seven files introduce a second canonical writer for occurrence data.
//   cleaningExecutionWriteRuntime.js is the only one that patches the
//   Task/Calendar repositories' updateOne/remove for cleaning-linked rows;
//   no other loaded Cleaning module patches those same two methods.
// ============================================================

export const CLEANING_EXPERIENCE_BOOTSTRAP_VERSION = '1.0.0';

// Importing this module is itself the "ensureLoaded" call: ES module
// evaluation is cached per URL by the browser, so re-importing this file
// from more than one call site never re-runs the seven side-effect imports
// above. This export exists only so a caller or a contract test can confirm
// the bootstrap module itself resolved successfully.
export function cleaningExperienceBootstrapLoaded(){
  return true;
}
