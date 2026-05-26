'use strict';
// ============================================================
// TASK DETAIL FOOTER PLACEMENT FIX v0.291
// The complete button should sit at the bottom of the detail card content,
// not float/stick high over the modal and make the card feel small.
// ============================================================

(function(){
  var STYLE_ID = 'task-detail-footer-placement-fix-style';

  function inject(){
    var old = document.getElementById(STYLE_ID);
    if(old) old.remove();

    var s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = [
      '#fqModal .fqPage{display:flex!important;flex-direction:column!important;max-height:min(94vh,860px)!important;overflow:hidden!important}',
      '#fqModal .fqPage>.fqContent{flex:1 1 auto!important;overflow:auto!important;-webkit-overflow-scrolling:touch!important;padding-bottom:24px!important}',
      '#fqModal .fqDoneWrap{position:relative!important;bottom:auto!important;z-index:3!important;margin-top:10px!important;padding:14px 18px calc(22px + env(safe-area-inset-bottom))!important;background:linear-gradient(180deg,rgba(248,250,252,0),rgba(248,250,252,.96) 18%,rgba(248,250,252,1))!important;box-shadow:none!important;backdrop-filter:none!important}',
      '#fqModal .fqDone{width:100%!important;min-height:58px!important;border-radius:22px!important}',
      '#fqModal .fqHelpBoxActive + .fqDoneWrap{margin-top:14px!important}',
      '@media(max-height:760px){#fqModal .fqPage{max-height:91vh!important}#fqModal .fqDoneWrap{padding-bottom:calc(16px + env(safe-area-inset-bottom))!important}}'
    ].join('\n');
    document.head.appendChild(s);
  }

  function moveFooterIntoPageEnd(){
    var page = document.querySelector('#fqModal .fqPage');
    if(!page) return;
    var footer = page.querySelector('.fqDoneWrap');
    if(!footer) return;
    if(footer.parentElement !== page) page.appendChild(footer);
    footer.dataset.footerPlacement = 'page-end';
  }

  function patch(){ inject(); moveFooterIntoPageEnd(); }

  var timer = setInterval(patch, 200);
  setTimeout(function(){ clearInterval(timer); }, 8000);

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', patch);
  else patch();

  var root = document.body;
  if(root && !root.__taskDetailFooterPlacementObserver){
    root.__taskDetailFooterPlacementObserver = true;
    new MutationObserver(function(){ setTimeout(patch, 30); }).observe(root, { childList:true, subtree:true });
  }

  window.TaskDetailFooterPlacementFix = { patch: patch };
})();
