'use strict';
// ============================================================
// TASK NAVIGATION STABILITY v0.278
// Reduces flicker caused by repeated task tab rerenders and stacked
// overlay integrations. This is a temporary safety layer until the old
// v023 renderer is replaced by a unified quest renderer.
// ============================================================

(function(){
  var lastRenderKey = '';
  var lastRenderAt = 0;
  var MIN_RENDER_GAP = 120;

  function isTaskScreenActive(){
    var screen = document.getElementById('screen-tasks');
    return !!(screen && screen.classList.contains('active'));
  }

  function activeTaskKey(){
    var tab = window.taskTab || 'overzicht';
    var active = document.querySelector('.task-tabs .ttab.active');
    return tab + '|' + (active ? active.textContent.trim() : '');
  }

  function installRenderGuard(){
    if(window.__taskNavigationStabilityInstalled || typeof window.renderTasks !== 'function') return;
    window.__taskNavigationStabilityInstalled = true;
    var previousRenderTasks = window.renderTasks;

    window.renderTasks = function(){
      if(isTaskScreenActive()){
        var now = Date.now();
        var key = activeTaskKey();
        if(key === lastRenderKey && now - lastRenderAt < MIN_RENDER_GAP){
          return;
        }
        lastRenderKey = key;
        lastRenderAt = now;
      }
      return previousRenderTasks.apply(this, arguments);
    };
  }

  function injectStyles(){
    if(document.getElementById('task-navigation-stability-styles')) return;
    var s = document.createElement('style');
    s.id = 'task-navigation-stability-styles';
    s.textContent = [
      '#screen-tasks{contain:layout paint;}',
      '#task-content{backface-visibility:hidden;transform:translateZ(0);}',
      '.task-tabs .ttab{transform:translateZ(0);}',
      '.bottom-nav,.tabbar,.nav-bottom{backface-visibility:hidden;transform:translateZ(0);}',
      'body.famTask #task-content{will-change:auto;}'
    ].join('');
    document.head.appendChild(s);
  }

  function boot(){
    injectStyles();
    installRenderGuard();
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
  setTimeout(boot, 300);
  setTimeout(boot, 900);
})();
