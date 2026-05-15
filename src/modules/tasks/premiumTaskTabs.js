'use strict';
// ============================================================
// PREMIUM TASK TABS v0.317
// Rebuilds the task top navigation from scratch and neutralizes the old
// patched tabbar layout. Uses existing taskTab + renderTasks contract.
// ============================================================

(function(){
  var TABS = [
    { id: 'overview', label: 'Overzicht', icon: '' },
    { id: 'recurring', label: 'Terugkerend', icon: '🔁' },
    { id: 'person', label: 'Familie', icon: '👨‍👩‍👧' },
    { id: 'groupquests', label: 'Group', icon: '⚔️' },
    { id: 'help', label: 'Samen', icon: '🤝' },
    { id: 'preview', label: 'Preview', icon: '✨' }
  ];

  function currentTab(){ return window.taskTab || 'overview'; }

  function setTab(id){
    window.taskTab = id;
    if(typeof window.renderTasks === 'function') window.renderTasks();
    requestAnimationFrame(render);
  }

  function injectStyles(){
    var old = document.getElementById('premium-task-tabs-styles');
    if(old) old.remove();
    var s = document.createElement('style');
    s.id = 'premium-task-tabs-styles';
    s.textContent = [
      'body{overflow-x:hidden!important}',
      '.task-tabs{display:none!important;visibility:hidden!important;height:0!important;min-height:0!important;max-height:0!important;overflow:hidden!important;margin:0!important;padding:0!important;border:0!important;box-shadow:none!important}',
      '.premiumTaskTabsShell{position:relative;z-index:80;width:100%;max-width:100vw;overflow:hidden;background:linear-gradient(180deg,rgba(255,255,255,.98),rgba(250,252,250,.96));border-top:1px solid rgba(17,24,39,.04);border-bottom:1px solid rgba(17,24,39,.08);box-shadow:0 10px 22px rgba(17,24,39,.045);isolation:isolate}',
      '.premiumTaskTabsTrack{display:flex;align-items:center;gap:9px;width:100%;max-width:100vw;overflow-x:auto;overflow-y:hidden;overscroll-behavior-x:contain;-webkit-overflow-scrolling:touch;scroll-snap-type:x proximity;padding:9px 12px 10px;box-sizing:border-box;touch-action:pan-x}.premiumTaskTabsTrack::-webkit-scrollbar{display:none}.premiumTaskTabsTrack{scrollbar-width:none}',
      '.premiumTaskTab{flex:0 0 auto;display:inline-flex;align-items:center;justify-content:center;gap:7px;height:42px;min-width:98px;padding:0 15px;border:0;border-radius:999px;background:rgba(17,24,39,.045);color:#6b7280;font-size:13px;font-weight:900;letter-spacing:-.1px;white-space:nowrap;scroll-snap-align:center;box-shadow:inset 0 1px 0 rgba(255,255,255,.9);touch-action:manipulation;transition:transform .16s ease,background .16s ease,color .16s ease,box-shadow .16s ease}',
      '.premiumTaskTab:active{transform:scale(.97)}.premiumTaskTab .ico{font-size:16px;line-height:1}.premiumTaskTab.active{background:linear-gradient(135deg,#315f2c,#6d28d9);color:#fff;box-shadow:0 12px 24px rgba(49,95,44,.22),inset 0 1px 0 rgba(255,255,255,.24)}',
      '.premiumTaskTab.active.overview{background:linear-gradient(135deg,#315f2c,#4f8a3c)}.premiumTaskTab.active.groupquests,.premiumTaskTab.active.preview{background:linear-gradient(135deg,#315f2c,#6d28d9)}',
      '#task-content{position:relative!important;z-index:1!important;max-width:100vw!important;overflow-x:hidden!important;padding-top:18px!important;box-sizing:border-box!important}',
      '.premiumTaskTabsShell + #task-content{padding-top:18px!important}',
      '.tasks-overview,.group-quests-view,.task-page,.task-screen{max-width:100vw!important;overflow-x:hidden!important;box-sizing:border-box!important}',
      '@media(max-width:420px){.premiumTaskTabsTrack{padding:8px 10px 9px;gap:8px}.premiumTaskTab{height:40px;min-width:92px;padding:0 13px;font-size:12.5px}.premiumTaskTab .ico{font-size:15px}#task-content{padding-top:16px!important}}'
    ].join('');
    document.head.appendChild(s);
  }

  function findAnchor(){
    var oldTabs = document.querySelector('.task-tabs');
    if(oldTabs && oldTabs.parentNode) return oldTabs;
    var content = document.getElementById('task-content');
    return content || null;
  }

  function ensureShell(){
    var shell = document.getElementById('premium-task-tabs-shell');
    if(shell) return shell;
    var anchor = findAnchor();
    if(!anchor || !anchor.parentNode) return null;
    shell = document.createElement('div');
    shell.id = 'premium-task-tabs-shell';
    shell.className = 'premiumTaskTabsShell';
    shell.innerHTML = '<div class="premiumTaskTabsTrack" id="premium-task-tabs-track"></div>';
    if(anchor.classList && anchor.classList.contains('task-tabs')) anchor.parentNode.insertBefore(shell, anchor.nextSibling);
    else anchor.parentNode.insertBefore(shell, anchor);
    return shell;
  }

  function render(){
    injectStyles();
    var shell = ensureShell();
    if(!shell) return;
    var track = document.getElementById('premium-task-tabs-track');
    if(!track) return;
    var active = currentTab();
    track.innerHTML = TABS.map(function(tab){
      return '<button type="button" class="premiumTaskTab '+tab.id+(active === tab.id ? ' active' : '')+'" data-task-tab="'+tab.id+'">'
        + (tab.icon ? '<span class="ico">'+tab.icon+'</span>' : '')
        + '<span>'+tab.label+'</span>'
        + '</button>';
    }).join('');
    track.querySelectorAll('[data-task-tab]').forEach(function(btn){
      btn.onclick = function(ev){ ev.preventDefault(); setTab(btn.getAttribute('data-task-tab')); };
    });
    var activeBtn = track.querySelector('.premiumTaskTab.active');
    if(activeBtn && activeBtn.scrollIntoView){
      try { activeBtn.scrollIntoView({ inline:'center', block:'nearest', behavior:'smooth' }); } catch(e) {}
    }
  }

  function wrapRenderTasks(){
    if(window.__premiumTaskTabsWrapped || typeof window.renderTasks !== 'function') return;
    window.__premiumTaskTabsWrapped = true;
    var original = window.renderTasks;
    window.renderTasks = function(){
      var result = original.apply(this, arguments);
      requestAnimationFrame(render);
      return result;
    };
  }

  function boot(){
    injectStyles();
    wrapRenderTasks();
    render();
    setTimeout(render, 200);
    setTimeout(render, 800);
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
