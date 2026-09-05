import './cleaningExceptionContract.js?v=1';
import './cleaningExecutionSync.js?v=1';
import './cleaningExecutionUiGuard.js?v=1';
import './cleaningExecutionWriteRuntime.js?v=1';
import './cleaningExceptionRuntime.js?v=1';
import './cleaningExceptionTaskUi.js?v=1';
import './cleaningHelpRequestUi.js?v=1';
import './cleaningAvailabilityContract.js?v=1';
import './cleaningAvailabilityExperience.js?v=1';
import './cleaningHistoryExperience.js?v=1';
import './cleaningActivityProjector.js?v=1';
import './cleaningNotificationProjector.js?v=1';
import './cleaningTaskSupplyUi.js?v=1';

// ============================================================
// CLEANING EXPERIENCE BOOTSTRAP v1.5.0
// Explicit runtime experiences that sit around the base Cleaning screen.
// ============================================================
// Order:
//  1 exception contract
//  2 execution sync
//  3 execution UI guard
//  4 execution reverse-sync writer
//  5 exception runtime
//  6 exception Task UI
//  7 help recipient UI
//  8 availability contract
//  9 availability experience (reuses accepted pause semantics)
// 10 read-only room/routine history from completionLogs
// 11 exact-once shared household activity projection from completed logs
// 12 NotificationStore-only collaboration/reminder projection
// 13 Task-detail Cleaning supplies
//
// Ownership remains unchanged: CleaningOccurrence is canonical, history and
// activity are derived from canonical completionLogs, notifications never
// mutate Cleaning, and execution reverse sync retains one writer.
// ============================================================

export const CLEANING_EXPERIENCE_BOOTSTRAP_VERSION = '1.5.0';
export function cleaningExperienceBootstrapLoaded(){return true;}
