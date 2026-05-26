'use strict';
// ============================================================
// TASK DETAIL FOOTER PLACEMENT FIX v0.292
// Complete CTA should be fixed near the bottom of the viewport,
// just above the mobile browser bar / safe area.
// ============================================================

(function(){
  var STYLE_ID = 'task-detail-footer-placement-fix-style';

  function inject(){
    var old = document.getElementById(STYLE_ID);
    if(old) old.remove();

    var s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = [
      '#fqModal .fqPage{display:block!important;max-height:min(94vh,860px)!important;overflow:auto!important;-webkit-overflow-scrolling:touch!important;padding-bottom:190px!important}',
      '#fqModal .fqPage>.fqContent{overflow:visible!important;padding-bottom:190px!important}',
      '#fqModal .fqDoneWrap{position:fixed!important;left:0!important;right:0!important;bottom:calc(96px + env(safe-area-inset-bottom))!important;z-index:9998!important;margin:0!important;padding:18px 28px 18px!important;background:linear-gradient(180deg,rgba(248,250,252,0),rgba(248,250,252,.88) 42%,rgba(248,250,252,.98))!important;box-shadow:none!important;backdrop-filter:blur(16px)!important;pointer-events:none!important}',
      '#fqModal .fqDone{width:100%!important;min-height:58px!important;border-radius:22px!important;pointer-events:auto!important;box-shadow:0 22px 54px rgba(49,95,44,.25)!important}',
      '@supports (-webkit-touch-callout:none){#fqModal .fqDoneWrap{bottom:calc(106px + env(safe-area-inset-bottom))!important}}',
      '@media(max-height:760px){#fqModal .fqDoneWrap{bottom:calc(86px + env(safe-area-inset-bottom))!important;padding-left:24px!important;padding-right:24px!important}#fqModal .fqPage{padding-bottom:170px!important}#fqModal .fqPage>.fqContent{padding-bottom:170px!important}}'
    ].join('\n');
    document.head.appendChild(s);
  }

  function moveFooterToModal(){
    var modal = document.querySelector('#fqModal');
    if(!modal) return;
    var footer = modal.querySelector('.fqDoneWrap');
    if(!footer) return;
    if(footer.parentElement !== modal) modal.appendChild(footer);
    footer.dataset.footerPlacement = 'fixed-browser-bar';
  }

  function patch(){ inject(); moveFooterToModal(); }

  var timer = setInterval(patch, 160);
  setTimeout(function(){ clearInterval(timer); }, 10000);

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', patch);
  else patch();

  var root = document.body;
  if(root && !root.__taskDetailFooterPlacementObserver){
    root.__taskDetailFooterPlacementObserver = true;
    new MutationObserver(function(){ setTimeout(patch, 20); }).observe(root, { childList:true, subtree:true });
  }

  window.TaskDetailFooterPlacementFix = { patch: patch };
})();
