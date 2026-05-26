'use strict';
// ============================================================
// TASK DETAIL FULLSCREEN POLISH v0.296
// Makes the task modal feel like a near fullscreen native sheet.
// Keeps create/edit save footers visible while removing only #fqDoneBtn.
// ============================================================

(function(){
  var STYLE_ID = 'task-detail-fullscreen-polish-style';

  function inject(){
    var old = document.getElementById(STYLE_ID);
    if(old) old.remove();

    var s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = [
      '#fqModal.open{align-items:flex-end!important;justify-content:center!important;padding:0!important}',
      '#fqModal .fqPage{width:100vw!important;max-width:100vw!important;height:calc(100dvh - 18px)!important;max-height:calc(100dvh - 18px)!important;margin:0!important;border-radius:28px 28px 0 0!important;overflow:auto!important;-webkit-overflow-scrolling:touch!important;background:#f8fafc!important;box-shadow:0 -24px 80px rgba(0,0,0,.28)!important;padding-bottom:calc(28px + env(safe-area-inset-bottom))!important}',
      '@supports not (height:100dvh){#fqModal .fqPage{height:calc(100vh - 18px)!important;max-height:calc(100vh - 18px)!important}}',
      '#fqModal .fqHero{height:255px!important;border-radius:28px 28px 0 0!important;margin:0!important}',
      '#fqModal .fqHero:after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.15),rgba(0,0,0,.62));pointer-events:none}',
      '#fqModal .fqHeroT{position:relative!important;z-index:2!important;padding:0 22px 24px!important}',
      '#fqModal .fqBackBtn{z-index:5!important;top:22px!important;left:22px!important}',
      '#fqModal .fqContent{padding:18px 18px 36px!important;overflow:visible!important}',
      '#fqModal .fqContent>p{margin:4px 0 16px!important;font-size:19px!important;line-height:1.42!important;color:#667085!important}',
      '#fqModal .fqBox{border-radius:24px!important;margin:0 0 16px!important;box-shadow:0 12px 34px rgba(15,23,42,.06)!important}',
      '#fqModal #fqDoneBtn{display:none!important}',
      '#fqModal .fqDoneWrap:has(#fqDoneBtn){display:none!important}',
      '#fqModal .fqDoneWrap:has(.fqSaveBtn){display:block!important;position:relative!important;margin:0!important;padding:12px 18px calc(22px + env(safe-area-inset-bottom))!important;background:#f8fafc!important}',
      '#fqModal .fqSaveBtn{display:block!important;width:100%!important;min-height:58px!important;border-radius:22px!important}',
      '#fqModal .fqContent:after{content:"";display:block;height:calc(34px + env(safe-area-inset-bottom))}',
      '@media(max-height:740px){#fqModal .fqPage{height:calc(100dvh - 8px)!important;max-height:calc(100dvh - 8px)!important;border-radius:24px 24px 0 0!important}#fqModal .fqHero{height:218px!important;border-radius:24px 24px 0 0!important}#fqModal .fqContent{padding-top:14px!important}}'
    ].join('\n');
    document.head.appendChild(s);
  }

  function patch(){ inject(); }

  var n = 0;
  var timer = setInterval(function(){
    n++;
    patch();
    if(n > 50) clearInterval(timer);
  }, 160);

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', patch);
  else patch();

  if(document.body && !document.body.__taskDetailFullscreenPolishObserver){
    document.body.__taskDetailFullscreenPolishObserver = true;
    new MutationObserver(function(){
      clearTimeout(document.body.__taskDetailFullscreenPolishTimer);
      document.body.__taskDetailFullscreenPolishTimer = setTimeout(patch, 30);
    }).observe(document.body, { childList:true, subtree:true });
  }

  window.TaskDetailFullscreenPolish = { patch: patch };
})();
