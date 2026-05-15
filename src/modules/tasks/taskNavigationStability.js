'use strict';
// ============================================================
// TASK NAVIGATION STABILITY v0.279
// Minimal render guard only. The previous containment/GPU styles caused
// mobile layout side effects on the bottom navigation and carousel.
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
    var old = document.getElementById('task-navigation-stability-styles');
    if(old) old.remove();
    var s = document.createElement('style');
    s.id = 'task-navigation-stability-styles';
    s.textContent = [
      'html,body{max-width:100%;overflow-x:hidden;}',
      '.screen{max-width:100%;overflow-x:hidden;}',
      '#task-content{max-width:100%;overflow-x:hidden;}',
      '.task-tabs{max-width:100%;overflow-x:auto;overscroll-behavior-x:contain;-webkit-overflow-scrolling:touch;}',
      '.bottom-nav{left:0!important;right:0!important;width:100%!important;max-width:100%!important;box-sizing:border-box!important;}',
      '.bottom-nav *{box-sizing:border-box;}'
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
