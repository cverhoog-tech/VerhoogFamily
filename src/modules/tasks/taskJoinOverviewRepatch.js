'use strict';
// ============================================================
// TASK JOIN OVERVIEW REPATCH v0.300f
// Non-invasive repaint helper: after tab switches / renderTasks / join events,
// run TaskSharedJoinableState.patchCards a few delayed times so Joined/helper
// state is visible on overview cards. Does not write state and does not bind
// card clicks.
// ============================================================

(function(){
  var installed = false;

  function patch(){
    try {
      if(window.TaskSharedJoinableState && typeof window.TaskSharedJoinableState.patchCards === 'function'){
        window.TaskSharedJoinableState.patchCards();
      }
    } catch(e) {}
  }

  function burst(){
    patch();
    setTimeout(patch, 80);
    setTimeout(patch, 220);
    setTimeout(patch, 520);
    setTimeout(patch, 900);
  }

  function wrapRenderTasks(){
    if(typeof window.renderTasks !== 'function' || window.renderTasks.__joinOverviewRepatchWrapped) return;
    var original = window.renderTasks;
    window.renderTasks = function(){
      var result = original.apply(this, arguments);
      burst();
      return result;
    };
    window.renderTasks.__joinOverviewRepatchWrapped = true;
  }

  function wrapSetTaskTab(){
    if(typeof window.setTaskTab !== 'function' || window.setTaskTab.__joinOverviewRepatchWrapped) return;
    var original = window.setTaskTab;
    window.setTaskTab = function(){
      var result = original.apply(this, arguments);
      burst();
      return result;
    };
    window.setTaskTab.__joinOverviewRepatchWrapped = true;
  }

  function install(){
    if(installed) return;
    installed = true;
    wrapRenderTasks();
    wrapSetTaskTab();
    window.addEventListener('familyapp:tasks-updated', burst);
    window.addEventListener('familyapp:modules:ready', burst);
    document.addEventListener('click', function(ev){
      var t = ev.target;
      if(t && t.closest && t.closest('.ttab,.task-tabs button,[role="tab"],[data-task-tab]')) burst();
      if(t && t.closest && t.closest('[data-task-join],.fqJoinBtn')) burst();
    }, false);
    var i = 0;
    var timer = setInterval(function(){
      i++;
      wrapRenderTasks();
      wrapSetTaskTab();
      burst();
      if(i > 30) clearInterval(timer);
    }, 200);
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
  else install();

  window.TaskJoinOverviewRepatch = { install:install, patch:patch, burst:burst };
})();
