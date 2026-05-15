'use strict';
// ============================================================
// PREMIUM TASK TABS v0.318
// Rebuilds the task top navigation from scratch and pins it directly
// below the task header, outside the old broken tab layout flow.
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
  function setTab(id){ window.taskTab = id; if(typeof window.renderTasks === 'function') window.renderTasks(); requestAnimationFrame(render); }

  function injectStyles(){
    var old = document.getElementById('premium-task-tabs-styles');
    if(old) old.remove();
    var s = document.createElement('style');
    s.id = 'premium-task-tabs-styles';
    s.textContent = [
      'body{overflow-x:hidden!important}',
      '.task-tabs{display:none!important;visibility:hidden!important;height:0!important;min-height:0!important;max-height:0!important;overflow:hidden!important;margin:0!important;padding:0!important;border:0!important;box-shadow:none!important}',
      '.premiumTaskTabsShell{position:relative!important;z-index:80!important;width:100vw!important;max-width:100vw!important;margin:0!important;left:50%!important;transform:translateX(-50%)!important;overflow:hidden!important;background:linear-gradient(180deg,rgba(255,255,255,.98),rgba(250,252,250,.96))!important;border-top:1px solid rgba(17,24,39,.04)!important;border-bottom:1px solid rgba(17,24,39,.08)!important;box-shadow:0 10px 22px rgba(17,24,39,.045)!important;isolation:isolate!important}',
      '.premiumTaskTabsTrack{display:flex!important;align-items:center!important;gap:9px!important;width:100%!important;max-width:100vw!important;overflow-x:auto!important;overflow-y:hidden!important;overscroll-behavior-x:contain!important;-webkit-overflow-scrolling:touch!important;scroll-snap-type:x proximity!important;padding:9px 12px 10px!important;box-sizing:border-box!important;touch-action:pan-x!important}.premiumTaskTabsTrack::-webkit-scrollbar{display:none!important}.premiumTaskTabsTrack{scrollbar-width:none!important}',
      '.premiumTaskTab{flex:0 0 auto!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;gap:7px!important;height:42px!important;min-width:98px!important;padding:0 15px!important;border:0!important;border-radius:999px!important;background:rgba(17,24,39,.045)!important;color:#6b7280!important;font-size:13px!important;font-weight:900!important;letter-spacing:-.1px!important;white-space:nowrap!important;scroll-snap-align:center!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.9)!important;touch-action:manipulation!important}',
      '.premiumTaskTab:active{transform:scale(.97)!important}.premiumTaskTab .ico{font-size:16px!important;line-height:1!important}.premiumTaskTab.active{background:linear-gradient(135deg,#315f2c,#6d28d9)!important;color:#fff!important;box-shadow:0 12px 24px rgba(49,95,44,.22),inset 0 1px 0 rgba(255,255,255,.24)!important}',
      '.premiumTaskTab.active.overview{background:linear-gradient(135deg,#315f2c,#4f8a3c)!important}.premiumTaskTab.active.groupquests,.premiumTaskTab.active.preview{background:linear-gradient(135deg,#315f2c,#6d28d9)!important}',
      '#task-content{position:relative!important;z-index:1!important;max-width:100vw!important;overflow-x:hidden!important;padding-top:18px!important;box-sizing:border-box!important}',
      '.tasks-overview,.group-quests-view,.task-page,.task-screen{max-width:100vw!important;overflow-x:hidden!important;box-sizing:border-box!important}',
      '@media(max-width:420px){.premiumTaskTabsTrack{padding:8px 10px 9px!important;gap:8px!important}.premiumTaskTab{height:40px!important;min-width:92px!important;padding:0 13px!important;font-size:12.5px!important}.premiumTaskTab .ico{font-size:15px!important}#task-content{padding-top:16px!important}}'
    ].join('');
    document.head.appendChild(s);
  }

  function findHeaderAnchor(){
    var taskTitle = Array.prototype.slice.call(document.querySelectorAll('h1,h2,.page-title,.screen-title,.top-title')).find(function(el){
      return /Taken/.test((el.textContent || '').trim());
    });
    if(taskTitle){
      var header = taskTitle.closest('header,.topbar,.page-header,.screen-header,.app-header') || taskTitle.parentElement;
      if(header && header.parentNode) return header;
    }
    var oldTabs = document.querySelector('.task-tabs');
    if(oldTabs && oldTabs.parentNode) return oldTabs;
    return document.getElementById('task-content');
  }

  function ensureShell(){
    var shell = document.getElementById('premium-task-tabs-shell');
    var anchor = findHeaderAnchor();
    if(!anchor || !anchor.parentNode) return shell;
    if(!shell){
      shell = document.createElement('div');
      shell.id = 'premium-task-tabs-shell';
      shell.className = 'premiumTaskTabsShell';
      shell.innerHTML = '<div class="premiumTaskTabsTrack" id="premium-task-tabs-track"></div>';
    }
    if(anchor.id === 'task-content'){
      anchor.parentNode.insertBefore(shell, anchor);
    } else if(shell.previousElementSibling !== anchor){
      anchor.parentNode.insertBefore(shell, anchor.nextSibling);
    }
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
        + '<span>'+tab.label+'</span></button>';
    }).join('');
    track.querySelectorAll('[data-task-tab]').forEach(function(btn){ btn.onclick = function(ev){ ev.preventDefault(); setTab(btn.getAttribute('data-task-tab')); }; });
    var activeBtn = track.querySelector('.premiumTaskTab.active');
    if(activeBtn && activeBtn.scrollIntoView){ try { activeBtn.scrollIntoView({ inline:'center', block:'nearest', behavior:'smooth' }); } catch(e) {} }
  }

  function wrapRenderTasks(){
    if(window.__premiumTaskTabsWrapped || typeof window.renderTasks !== 'function') return;
    window.__premiumTaskTabsWrapped = true;
    var original = window.renderTasks;
    window.renderTasks = function(){ var result = original.apply(this, arguments); requestAnimationFrame(render); return result; };
  }

  function boot(){ injectStyles(); wrapRenderTasks(); render(); setTimeout(render, 200); setTimeout(render, 800); }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
