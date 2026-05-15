'use strict';
// ============================================================
// TASK TOP NAV STABILITY v0.316
// Stabilizes task header tabs and prevents vertical overlap with content.
// ============================================================

(function(){
  function inject(){
    var old = document.getElementById('task-top-nav-stability-styles');
    if(old) old.remove();
    var s = document.createElement('style');
    s.id = 'task-top-nav-stability-styles';
    s.textContent = [
      'body:has(.task-tabs){overflow-x:hidden!important}',

      '.task-tabs{',
      '  position:relative!important;',
      '  z-index:60!important;',
      '  display:flex!important;',
      '  align-items:center!important;',
      '  gap:0!important;',
      '  width:100vw!important;',
      '  max-width:100vw!important;',
      '  min-height:56px!important;',
      '  height:56px!important;',
      '  margin:0!important;',
      '  padding:0!important;',
      '  overflow-x:auto!important;',
      '  overflow-y:hidden!important;',
      '  overscroll-behavior-x:contain!important;',
      '  -webkit-overflow-scrolling:touch!important;',
      '  scroll-snap-type:x proximity!important;',
      '  background:rgba(255,255,255,.98)!important;',
      '  border-top:1px solid rgba(17,24,39,.04)!important;',
      '  border-bottom:1px solid rgba(17,24,39,.08)!important;',
      '  box-shadow:0 8px 18px rgba(17,24,39,.045)!important;',
      '  touch-action:pan-x!important;',
      '  white-space:nowrap!important;',
      '  isolation:isolate!important;',
      '}',
      '.task-tabs::-webkit-scrollbar{display:none!important}',
      '.task-tabs{scrollbar-width:none!important}',

      '.task-tabs .ttab{',
      '  position:relative!important;',
      '  flex:0 0 auto!important;',
      '  min-width:108px!important;',
      '  height:56px!important;',
      '  display:flex!important;',
      '  align-items:center!important;',
      '  justify-content:center!important;',
      '  padding:0 12px!important;',
      '  margin:0!important;',
      '  border-radius:0!important;',
      '  border:0!important;',
      '  box-sizing:border-box!important;',
      '  scroll-snap-align:start!important;',
      '  font-size:14px!important;',
      '  font-weight:850!important;',
      '  line-height:1!important;',
      '  color:#6b7280!important;',
      '  background:transparent!important;',
      '  transform:none!important;',
      '  box-shadow:none!important;',
      '}',
      '.task-tabs .ttab.active{color:#315f2c!important;background:rgba(49,95,44,.065)!important}',
      '.task-tabs .ttab.active:after{content:"";position:absolute;left:10px;right:10px;bottom:0;height:3px;border-radius:999px;background:#315f2c!important}',
      '.task-tabs .ttab.gq-tab,.task-tabs .ttab.preview-tab{',
      '  min-width:124px!important;',
      '  color:#fff!important;',
      '  background:linear-gradient(135deg,#315f2c,#6d28d9)!important;',
      '}',
      '.task-tabs .ttab.gq-tab.active:after,.task-tabs .ttab.preview-tab.active:after{background:rgba(255,255,255,.9)!important}',

      '#task-content{',
      '  position:relative!important;',
      '  z-index:1!important;',
      '  padding-top:18px!important;',
      '  overflow-x:hidden!important;',
      '  max-width:100vw!important;',
      '  clear:both!important;',
      '}',
      '#task-content > *:first-child{margin-top:0!important}',
      '.tasks-overview,.group-quests-view,.task-page,.task-screen{max-width:100vw!important;overflow-x:hidden!important}',

      '#task-content button[class*="quest"],#task-content .quest-add-row,#task-content .add-quest-row,#task-content .task-add-row{',
      '  position:relative!important;',
      '  z-index:2!important;',
      '}',
      '.quest-add-row,.add-quest-row,.task-add-row{margin-top:0!important;margin-bottom:16px!important}',

      'button:has(+ .stat-cards), .tasks-overview > button:first-child, #task-content > button:first-child{',
      '  margin-top:6px!important;',
      '}',

      '@media(max-width:420px){',
      '  .task-tabs{min-height:54px!important;height:54px!important}',
      '  .task-tabs .ttab{height:54px!important;min-width:104px!important;font-size:13.5px!important;padding:0 11px!important}',
      '  .task-tabs .ttab.gq-tab,.task-tabs .ttab.preview-tab{min-width:118px!important}',
      '  #task-content{padding-top:20px!important}',
      '}',
      '@media(max-width:360px){',
      '  .task-tabs .ttab{min-width:96px!important;font-size:13px!important}',
      '  .task-tabs .ttab.gq-tab,.task-tabs .ttab.preview-tab{min-width:112px!important}',
      '}'
    ].join('');
    document.head.appendChild(s);
  }

  function fixAddButtonOverlap(){
    var tabs = document.querySelector('.task-tabs');
    var content = document.getElementById('task-content');
    if(!tabs || !content) return;
    var tabRect = tabs.getBoundingClientRect();
    var first = content.firstElementChild;
    if(!first) return;
    var firstRect = first.getBoundingClientRect();
    if(firstRect.top < tabRect.bottom + 12){
      content.style.setProperty('padding-top', Math.ceil(tabRect.bottom - firstRect.top + 24) + 'px', 'important');
    }
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
    setTimeout(keepActiveVisible, 80);
    setTimeout(fixAddButtonOverlap, 160);
    document.addEventListener('click', function(ev){
      if(ev.target && ev.target.closest && ev.target.closest('.task-tabs .ttab')){
        setTimeout(keepActiveVisible, 60);
        setTimeout(fixAddButtonOverlap, 130);
      }
    }, true);
    window.addEventListener('resize', function(){ setTimeout(fixAddButtonOverlap, 120); }, { passive:true });
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
  setTimeout(boot, 600);
  setTimeout(fixAddButtonOverlap, 1200);
})();
