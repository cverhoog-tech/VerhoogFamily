'use strict';
// V2.2.1 supply visual refinement. Presentation only; no data/listener ownership.
(function(){
  if(document.getElementById('cleaning-detail-visual-v221-refinement-css'))return;
  var link=document.createElement('link');
  link.id='cleaning-detail-visual-v221-refinement-css';
  link.rel='stylesheet';
  link.href='/src/styles/cleaning-detail-v221-refinement.css?v=1';
  document.head.appendChild(link);
})();
export const CLEANING_DETAIL_VISUAL_V221_REFINEMENT_VERSION='2.2.1-r1';
