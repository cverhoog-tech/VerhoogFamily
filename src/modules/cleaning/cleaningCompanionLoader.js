'use strict';
// Functional Cleaning V2.1-V2.3 companions. This loader is Cleaning-route only
// and deliberately separate from the V2.4 presentation compatibility bridge.
import './cleaningCollaborationExperience.js?v=2';
import './cleaningHistoryV22.js?v=1';
import './cleaningDetailVisualV221.js?v=1';
import './cleaningDetailVisualV221Refinement.js?v=1';
import './cleaningOccurrenceCommandsV23.js?v=1';
import './cleaningOccurrenceControlsV23.js?v=1';

window.CleaningV23Companions=Object.freeze({version:'2.3.0',cleaningOnly:true});
export const CLEANING_COMPANION_LOADER_VERSION='2.3.0';
