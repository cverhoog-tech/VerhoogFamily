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
// CLEANING EXPERIENCE BOOTSTRAP v1.6.0
// Explicit runtime experiences that sit around the base Cleaning screen.
// ============================================================
// Order:
//  1 exception contract
//  2 execution sync
//  3 execution UI guard
//  4 execution reverse-sync writer
//  5 exception runtime
//  6 actionable Cleaning help notification bridge
//  7 exception Task UI
//  8 help recipient UI inside Cleaning
//  9 availability contract
// 10 availability experience (reuses accepted pause semantics)
// 11 read-only room/routine history from completionLogs
// 12 exact-once shared household activity projection from completed logs
// 13 NotificationStore-only collaboration/reminder projection
// 14 Task-detail Cleaning supplies
//
// Ownership remains unchanged: CleaningOccurrence is canonical, history and
// activity are derived from canonical completionLogs, notifications never own
// Cleaning mutations, and execution reverse sync retains one writer.
// ============================================================

export const CLEANING_EXPERIENCE_BOOTSTRAP_VERSION = '1.6.0';
export function cleaningExperienceBootstrapLoaded(){return true;}
