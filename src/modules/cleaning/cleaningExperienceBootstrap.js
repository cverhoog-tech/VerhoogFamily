import './cleaningPermissions.js?v=1';
import './cleaningExceptionContract.js?v=1';
import './cleaningExecutionSync.js?v=1';
import './cleaningExecutionUiGuard.js?v=1';
import './cleaningExecutionWriteRuntime.js?v=1';
import './cleaningExceptionRuntime.js?v=1';
import './cleaningHelpNotificationUi.js?v=1';
import './cleaningExceptionTaskUi.js?v=1';
import './cleaningHelpRequestUi.js?v=1';
import './cleaningAvailabilityContract.js?v=1';
import './cleaningAvailabilityExperience.js?v=1';
import './cleaningHistoryExperience.js?v=1';
import './cleaningActivityProjector.js?v=1';
import './cleaningNotificationProjector.js?v=1';
import './cleaningTaskSupplyUi.js?v=1';

// ============================================================
// CLEANING EXPERIENCE BOOTSTRAP v1.7.0
// Explicit runtime experiences that sit around the base Cleaning screen.
// ============================================================
// Order:
//  1 central role/capability policy (no data ownership)
//  2 exception contract
//  3 execution sync
//  4 execution UI guard
//  5 execution reverse-sync writer
//  6 exception runtime
//  7 actionable Cleaning help notification bridge
//  8 exception Task UI
//  9 help recipient UI inside Cleaning
// 10 availability contract
// 11 availability experience (reuses accepted pause semantics)
// 12 read-only room/routine history from completionLogs
// 13 exact-once shared household activity projection from completed logs
// 14 NotificationStore-only collaboration/reminder projection
// 15 Task-detail Cleaning supplies
//
// Ownership remains unchanged: CleaningOccurrence is canonical, history and
// activity are derived from canonical completionLogs, notifications never own
// Cleaning mutations, permission policy writes no domain data, and execution
// reverse sync retains one writer.
// ============================================================

export const CLEANING_EXPERIENCE_BOOTSTRAP_VERSION = '1.7.0';
export function cleaningExperienceBootstrapLoaded(){return true;}
