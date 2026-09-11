'use strict';
import './cleaningCollaborationExperience.js?v=2';
import './cleaningHistoryV22.js?v=1';
import './cleaningDetailVisualV221.js?v=1';
import './cleaningDetailVisualV221Refinement.js?v=1';
import './cleaningOccurrenceCommandsV23.js?v=1';
import './cleaningOccurrenceControlsV23.js?v=1';
// Cleaning v2 owns its complete primary presentation. This compatibility
// import remains free of observers, listeners that own Firebase state, timers,
// decorators, popup owners and parallel state authorities; it only lazy-loads
// the official lightweight companions when Cleaning itself is opened.
// Keep this bridge marker on the accepted visual milestone; V2.3 exposes its
// own versions from the occurrence command/control companions.
window.CleaningPremiumFeedback=Object.freeze({version:'2.2.1',disabledForCleaningV2:true});
export const CLEANING_PREMIUM_FEEDBACK_DISABLED=true;