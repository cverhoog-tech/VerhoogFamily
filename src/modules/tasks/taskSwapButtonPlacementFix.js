'use strict';
// ============================================================
// TASK SWAP BUTTON PLACEMENT FIX v1.0.0
// Keeps the swap action inside the task hero, clear of close and XP controls.
// ============================================================
(function(){
  if(window.__taskSwapButtonPlacementFix)return;
  window.__taskSwapButtonPlacementFix=true;
  var s=document.createElement('style');
  s.id='task-swap-button-placement-fix';
  s.textContent=[
    '#tdp-overlay .tdp-hero > .tsr-trigger{position:absolute!important;top:10px!important;right:70px!important;left:auto!important;bottom:auto!important;z-index:20!important;width:34px!important;height:34px!important;min-width:34px!important;min-height:34px!important;max-width:34px!important;max-height:34px!important;display:grid!important;place-items:center!important;opacity:1!important;visibility:visible!important;pointer-events:auto!important;transform:none!important;margin:0!important;padding:0!important;overflow:visible!important}',
    '#tdp-overlay .tdp-hero > .tsr-trigger:active{transform:scale(.94)!important}',
    '@media(max-width:380px){#tdp-overlay .tdp-hero > .tsr-trigger{right:66px!important}}'
  ].join('\n');
  document.head.appendChild(s);
})();