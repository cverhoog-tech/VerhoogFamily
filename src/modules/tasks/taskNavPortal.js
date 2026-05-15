'use strict';
// ============================================================
// TASK NAV PORTAL v0.325
// Moves the existing task-tabs out of the scrolling task screen and into
// body as a viewport-fixed layer. No render wrapping, no observers.
// ============================================================

(function(){
  var STYLE_ID = 'task-nav-portal-css-v0325';
  var portalized = false;
  var originalParent = null;
  var originalNext = null;

  function injectStyles(){
    if(document.getElementById(STYLE_ID)) return;
    var style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = [
      'html,body{overflow-x:hidden!important;max-width:100vw!important}',
      '#screen-tasks{padding-top:0!important;margin-top:0!important;max-width:100vw!important;overflow-x:hidden!important}',
      '#screen-tasks #task-content,.task-content{padding-top:66px!important;margin-top:0!important;max-width:100vw!important;overflow-x:hidden!important;box-sizing:border-box!important}',
      'body > .task-tabs.task-tabs-portal{',
      '  position:fixed!important;',
      '  top:64px!important;',
      '  left:50%!important;',
      '  right:auto!important;',
      '  bottom:auto!important;',
      '  transform:translate3d(-50%,0,0)!important;',
      '  z-index:9998!important;',
      '  display:none!important;',
      '  align-items:center!important;',
      '  gap:8px!important;',
      '  width:100%!important;',
      '  max-width:480px!important;',
      '  min-height:52px!important;',
      '  height:52px!important;',
      '  padding:7px 12px!important;',
      '  margin:0!important;',
      '  box-sizing:border-box!important;',
      '  overflow-x:auto!important;',
      '  overflow-y:hidden!important;',
      '  overscroll-behavior-x:contain!important;',
      '  -webkit-overflow-scrolling:touch!important;',
      '  scrollbar-width:none!important;',
      '  background:rgba(255,255,255,.985)!important;',
      '  border-top:0!important;',
      '  border-bottom:1px solid rgba(17,24,39,.08)!important;',
      '  box-shadow:0 8px 18px rgba(17,24,39,.04)!important;',
      '  white-space:nowrap!important;',
      '  touch-action:pan-x!important;',
      '  backface-visibility:hidden!important;',
      '  -webkit-transform:translate3d(-50%,0,0)!important;',
      '}',
      'body > .task-tabs.task-tabs-portal.is-visible{display:flex!important}',
      'body > .task-tabs.task-tabs-portal::-webkit-scrollbar{display:none!important}',
      'body > .task-tabs.task-tabs-portal .ttab{',
      '  flex:0 0 auto!important;',
      '  display:inline-flex!important;',
      '  align-items:center!important;',
      '  justify-content:center!important;',
      '  gap:6px!important;',
      '  min-width:92px!important;',
      '  height:38px!important;',
      '  padding:0 13px!important;',
      '  margin:0!important;',
      '  border:0!important;',
      '  border-radius:999px!important;',
      '  background:rgba(17,24,39,.045)!important;',
      '  color:#6b7280!important;',
      '  font-size:12.5px!important;',
      '  font-weight:900!important;',
      '  line-height:1!important;',
      '  letter-spacing:-.1px!important;',
      '  box-shadow:inset 0 1px 0 rgba(255,255,255,.9)!important;',
      '}',
      'body > .task-tabs.task-tabs-portal .ttab.active{color:#fff!important;background:linear-gradient(135deg,#315f2c,#4f8a3c)!important;box-shadow:0 10px 22px rgba(49,95,44,.18),inset 0 1px 0 rgba(255,255,255,.22)!important}',
      'body > .task-tabs.task-tabs-portal .ttab-trade{min-width:56px!important;padding:0 13px!important}',
      '@media(max-width:420px){',
      '  body > .task-tabs.task-tabs-portal{top:62px!important;height:50px!important;min-height:50px!important;padding:6px 10px!important;gap:8px!important}',
      '  body > .task-tabs.task-tabs-portal .ttab{height:36px!important;min-width:86px!important;padding:0 11px!important;font-size:12px!important}',
      '  #screen-tasks #task-content,.task-content{padding-top:64px!important}',
      '}'
    ].join('');
    document.head.appendChild(style);
  }

  function isTasksActive(){
    var screen = document.getElementById('screen-tasks');
    return !!(screen && screen.classList.contains('active'));
  }

  function ensurePortal(){
    injectStyles();
    var tabs = document.querySelector('body > .task-tabs.task-tabs-portal') || document.querySelector('#screen-tasks > .task-tabs');
    if(!tabs) return;

    if(!portalized || tabs.parentNode !== document.body){
      originalParent = originalParent || tabs.parentNode;
      originalNext = originalNext || tabs.nextSibling;
      tabs.classList.add('task-tabs-portal');
      document.body.appendChild(tabs);
      portalized = true;
    }

    tabs.classList.toggle('is-visible', isTasksActive());
  }

  function boot(){
    ensurePortal();
    [100, 300, 800, 1500].forEach(function(delay){ setTimeout(ensurePortal, delay); });
    document.addEventListener('click', function(){ setTimeout(ensurePortal, 80); }, true);
    window.addEventListener('hashchange', ensurePortal, { passive:true });
    window.addEventListener('popstate', ensurePortal, { passive:true });
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
