'use strict';
// Cleaning V2.4 presentation-only compatibility bridge.
// Functional V2.1-V2.3 companions are loaded separately by the Cleaning lifecycle.
(function(){
  if(document.getElementById('cleaning-v24-css'))return;
  var link=document.createElement('link');
  link.id='cleaning-v24-css';
  link.rel='stylesheet';
  link.href='/src/styles/cleaning-v24.css?v=1';
  document.head.appendChild(link);
})();

// Keep the compatibility marker on the accepted V2.2.1 visual milestone;
// V2.3 and V2.4 expose their own version markers independently.
window.CleaningPremiumFeedback=Object.freeze({version:'2.2.1',disabledForCleaningV2:true});
window.CleaningV24Visual=Object.freeze({version:'2.4.0',presentationOnly:true});
export const CLEANING_PREMIUM_FEEDBACK_DISABLED=true;
export const CLEANING_V24_VISUAL_VERSION='2.4.0';