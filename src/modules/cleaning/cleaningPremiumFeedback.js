'use strict';
import './cleaningCollaborationExperience.js?v=2';
import './cleaningHistoryV22.js?v=1';
import './cleaningDetailVisualV221.js?v=1';
import './cleaningDetailVisualV221Refinement.js?v=1';
import './cleaningOccurrenceCommandsV23.js?v=1';
import './cleaningOccurrenceControlsV23.js?v=1';

// Cleaning V2.4 presentation layer. This only loads static CSS and deliberately
// owns no persistent data state, listeners, observers, timers or popup lifecycle.
(function(){
  if(document.getElementById('cleaning-v24-css'))return;
  var link=document.createElement('link');
  link.id='cleaning-v24-css';
  link.rel='stylesheet';
  link.href='/src/styles/cleaning-v24.css?v=1';
  document.head.appendChild(link);
})();

// Keep the compatibility bridge marker on the accepted V2.2.1 visual milestone;
// V2.3 and V2.4 expose their own version markers independently.
window.CleaningPremiumFeedback=Object.freeze({version:'2.2.1',disabledForCleaningV2:true});
window.CleaningV24Visual=Object.freeze({version:'2.4.0',presentationOnly:true});
export const CLEANING_PREMIUM_FEEDBACK_DISABLED=true;
export const CLEANING_V24_VISUAL_VERSION='2.4.0';