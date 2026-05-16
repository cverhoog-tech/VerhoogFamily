'use strict';
// ============================================================
// TASK NAV NATIVE CSS v0.328
// Tasks screen with internal scrolling and flush nav/content spacing.
// ============================================================

(function(){
  var STYLE_ID = 'task-nav-native-css-v0328';

  function inject(){
    ['task-nav-native-css-v0321','task-nav-native-css-v0322','task-nav-native-css-v0323','task-nav-native-css-v0324','task-nav-native-css-v0327'].forEach(function(id){
      var old = document.getElementById(id);
      if(old) old.remove();
    });
    if(document.getElementById(STYLE_ID)) return;

    var style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = [
      'html,body{overflow-x:hidden!important;max-width:100vw!important}',
      '.app-header{position:sticky!important;top:0!important;z-index:70!important;min-height:64px!important;height:64px!important;padding-top:12px!important;padding-bottom:12px!important;box-sizing:border-box!important;background:var(--c-header-bg)!important}',

      '#screen-tasks.screen.active{display:flex!important;flex-direction:column!important;position:fixed!important;left:0!important;right:0!important;top:64px!important;bottom:74px!important;width:100%!important;max-width:480px!important;margin:0 auto!important;padding:0!important;overflow:hidden!important;background:var(--c-bg)!important;transform:none!important;animation:none!important;contain:none!important}',

      '#screen-tasks .task-tabs{position:relative!important;top:auto!important;left:auto!important;right:auto!important;transform:none!important;z-index:20!important;flex:0 0 52px!important;display:flex!important;align-items:center!important;gap:8px!important;width:100%!important;max-width:100%!important;min-height:52px!important;height:52px!important;padding:7px 12px!important;margin:0!important;box-sizing:border-box!important;overflow-x:auto!important;overflow-y:hidden!important;overscroll-behavior-x:contain!important;-webkit-overflow-scrolling:touch!important;scrollbar-width:none!important;background:rgba(255,255,255,.985)!important;border-top:0!important;border-bottom:1px solid rgba(17,24,39,.08)!important;box-shadow:0 8px 18px rgba(17,24,39,.04)!important;white-space:nowrap!important;touch-action:pan-x!important}',
      '#screen-tasks .task-tabs::-webkit-scrollbar{display:none!important}',

      '#screen-tasks .ttab{flex:0 0 auto!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;gap:6px!important;min-width:92px!important;height:38px!important;padding:0 13px!important;margin:0!important;border:0!important;border-radius:999px!important;background:rgba(17,24,39,.045)!important;color:#6b7280!important;font-size:12.5px!important;font-weight:900!important;line-height:1!important;letter-spacing:-.1px!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.9)!important}',
      '#screen-tasks .ttab.active{color:#fff!important;background:linear-gradient(135deg,#315f2c,#4f8a3c)!important;box-shadow:0 10px 22px rgba(49,95,44,.18),inset 0 1px 0 rgba(255,255,255,.22)!important}',
      '#screen-tasks .ttab.gq-tab,#screen-tasks .ttab.preview-tab,#screen-tasks .ttab[data-tab="groupquests"],#screen-tasks .ttab[data-tab="preview"]{min-width:108px!important}',
      '#screen-tasks .ttab.gq-tab.active,#screen-tasks .ttab.preview-tab.active{background:linear-gradient(135deg,#315f2c,#6d28d9)!important}',
      '#screen-tasks .ttab-trade{min-width:56px!important;padding:0 13px!important}',

      '#screen-tasks #task-content,.task-content{flex:1 1 auto!important;min-height:0!important;height:auto!important;padding:0 0 130px!important;margin:0!important;max-width:100%!important;overflow-x:hidden!important;overflow-y:auto!important;-webkit-overflow-scrolling:touch!important;box-sizing:border-box!important;background:var(--c-bg)!important}',
      '#screen-tasks #task-content > *:first-child{margin-top:0!important;padding-top:0!important}',
      '#screen-tasks #task-content .group-quests-view:first-child{margin-top:0!important;padding-top:0!important}',

      '@media(max-width:420px){.app-header{min-height:62px!important;height:62px!important}#screen-tasks.screen.active{top:62px!important;bottom:74px!important}#screen-tasks .task-tabs{height:50px!important;min-height:50px!important;flex-basis:50px!important;padding:6px 10px!important;gap:8px!important}#screen-tasks .ttab{height:36px!important;min-width:86px!important;padding:0 11px!important;font-size:12px!important}#screen-tasks .ttab.gq-tab,#screen-tasks .ttab.preview-tab{min-width:102px!important}#screen-tasks #task-content,.task-content{padding-top:0!important;padding-bottom:130px!important}}',
      '@media(max-width:360px){#screen-tasks .ttab{min-width:80px!important;padding:0 10px!important;font-size:11.5px!important}}'
    ].join('');
    document.head.appendChild(style);
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', inject);
  else inject();
})();