'use strict';
// ============================================================
// TASK TOP NAV STABILITY v0.314
// Prevents task top tabs from overlapping content or each other on mobile.
// Keeps horizontal tab scrolling intentional and stable.
// ============================================================

(function(){
  function inject(){
    var old = document.getElementById('task-top-nav-stability-styles');
    if(old) old.remove();
    var s = document.createElement('style');
    s.id = 'task-top-nav-stability-styles';
    s.textContent = [
      '.task-tabs{',
      '  position:relative!important;',
      '  z-index:25!important;',
      '  display:flex!important;',
      '  align-items:stretch!important;',
      '  gap:0!important;',
      '  width:100%!important;',
      '  max-width:100vw!important;',
      '  min-height:64px!important;',
      '  overflow-x:auto!important;',
      '  overflow-y:hidden!important;',
      '  overscroll-behavior-x:contain!important;',
      '  -webkit-overflow-scrolling:touch!important;',
      '  scroll-snap-type:x proximity!important;',
      '  background:rgba(255,255,255,.96)!important;',
      '  border-bottom:1px solid rgba(17,24,39,.08)!important;',
      '  box-shadow:0 8px 20px rgba(17,24,39,.04)!important;',
      '  touch-action:pan-x!important;',
      '  white-space:nowrap!important;',
      '}',
      '.task-tabs::-webkit-scrollbar{display:none!important}',
      '.task-tabs{scrollbar-width:none!important}',
      '.task-tabs .ttab{',
      '  position:relative!important;',
      '  flex:0 0 auto!important;',
      '  min-width:112px!important;',
      '  height:64px!important;',
      '  display:flex!important;',
      '  align-items:center!important;',
      '  justify-content:center!important;',
      '  padding:0 14px!important;',
      '  margin:0!important;',
      '  border-radius:0!important;',
      '  border:0!important;',
      '  box-sizing:border-box!important;',
      '  scroll-snap-align:start!important;',
      '  font-size:15px!important;',
      '  font-weight:850!important;',
      '  line-height:1!important;',
      '  color:#6b7280!important;',
      '  background:transparent!important;',
      '  transform:none!important;',
      '}',
      '.task-tabs .ttab.active{color:#315f2c!important;background:rgba(49,95,44,.06)!important}',
      '.task-tabs .ttab.active:after{content:"";position:absolute;left:10px;right:10px;bottom:0;height:3px;border-radius:999px;background:#315f2c!important}',
      '.task-tabs .ttab.gq-tab,.task-tabs .ttab.preview-tab{',
      '  min-width:130px!important;',
      '  color:#fff!important;',
      '  background:linear-gradient(135deg,#315f2c,#6d28d9)!important;',
      '  box-shadow:none!important;',
      '}',
      '.task-tabs .ttab.gq-tab.active:after,.task-tabs .ttab.preview-tab.active:after{background:rgba(255,255,255,.9)!important}',
      '#task-content{position:relative!important;z-index:1!important;padding-top:0!important;overflow-x:hidden!important;max-width:100vw!important}',
      '#task-content > *:first-child{margin-top:0!important}',
      '.tasks-overview,.group-quests-view,.task-page,.task-screen{max-width:100vw!important;overflow-x:hidden!important}',
      '.quest-add-row,.add-quest-row,.task-add-row{position:relative!important;z-index:2!important;margin-top:14px!important}',
      '@media(max-width:420px){',
      '  .task-tabs{min-height:58px!important}',
      '  .task-tabs .ttab{height:58px!important;min-width:104px!important;font-size:14px!important;padding:0 12px!important}',
      '  .task-tabs .ttab.gq-tab,.task-tabs .ttab.preview-tab{min-width:122px!important}',
      '}',
      '@media(max-width:360px){',
      '  .task-tabs .ttab{min-width:96px!important;font-size:13px!important}',
      '  .task-tabs .ttab.gq-tab,.task-tabs .ttab.preview-tab{min-width:114px!important}',
      '}'
    ].join('');
    document.head.appendChild(s);
  }

  function keepActiveVisible(){
    var tabs = document.querySelector('.task-tabs');
    if(!tabs) return;
    var active = tabs.querySelector('.ttab.active');
    if(active && typeof active.scrollIntoView === 'function'){
      try { active.scrollIntoView({ inline:'center', block:'nearest', behavior:'smooth' }); } catch(e) {}
    }
  }

  function boot(){
    inject();
    setTimeout(keepActiveVisible, 120);
    document.addEventListener('click', function(ev){
      if(ev.target && ev.target.closest && ev.target.closest('.task-tabs .ttab')) setTimeout(keepActiveVisible, 80);
    }, true);
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
  setTimeout(boot, 600);
})();
