'use strict';
// ============================================================
// CANONICAL TASK OVERVIEW
// There is only one overview: TaskCompactHome.
// Legacy v023 overview rendering is intentionally unreachable.
// ============================================================
(function(){
  if(window.__taskOverviewCanonicalV2)return;
  window.__taskOverviewCanonicalV2=true;

  function taskEl(){ return document.getElementById('task-content'); }
  function applyLifecycle(){
    try{
      if(window.TaskCompactLifecycle&&typeof window.TaskCompactLifecycle.apply==='function'){
        window.TaskCompactLifecycle.apply(taskEl());
      }
    }catch(e){}
  }

  function renderCompact(){
    try { window.taskTab='compact'; if(typeof taskTab!=='undefined') taskTab='compact'; } catch(e) {}
    var el=taskEl();
    if(el && window.TaskCompactHome && typeof window.TaskCompactHome.render==='function') {
      window.TaskCompactHome.render(el);
      applyLifecycle();
      return true;
    }
    return false;
  }

  // Canonical task renderer. "overzicht" is no longer a real render mode.
  window.renderTasks=function(){
    var el=taskEl();
    if(!el)return;
    if(window.taskTab==='persoon' || (typeof taskTab!=='undefined' && taskTab==='persoon')) {
      if(typeof window.renderTasksPersoon==='function') window.renderTasksPersoon(el);
      return;
    }
    renderCompact();
  };

  window.setTaskTab=function(tab,btn){
    if(tab==='overzicht') tab='compact';
    try { window.taskTab=tab; if(typeof taskTab!=='undefined') taskTab=tab; } catch(e) {}
    document.querySelectorAll('#screen-tasks .ttab').forEach(function(b){ b.classList.remove('active'); });
    if(btn) btn.classList.add('active');
    window.renderTasks();
  };

  window.renderTasksOverzicht=function(){ return renderCompact(); };

  // navigation.js still contains a v023 fallback. Override the screen renderer
  // after navigation.js has loaded so entering Tasks from Home, ribbon or More
  // always resolves to the same premium overview.
  var legacyRenderScreen=window._renderScreen;
  if(typeof legacyRenderScreen==='function') {
    window._renderScreen=function(id){
      if(id==='tasks') {
        var current='compact';
        try { current=window.taskTab || (typeof taskTab!=='undefined' ? taskTab : 'compact'); } catch(e) {}
        if(current==='persoon' && typeof window.renderTasksPersoon==='function') {
          var el=taskEl(); if(el) window.renderTasksPersoon(el);
          return;
        }
        renderCompact();
        return;
      }
      return legacyRenderScreen.apply(this,arguments);
    };
  }

  function normalizeTabs(){
    var screen=document.getElementById('screen-tasks');
    if(!screen)return;
    var buttons=Array.prototype.slice.call(screen.querySelectorAll('.task-tabs .ttab'));
    buttons.forEach(function(btn){
      var label=(btn.textContent||'').trim().toLowerCase();
      if(label==='overzicht') {
        btn.setAttribute('onclick',"setTaskTab('compact',this)");
        btn.classList.add('active');
      }
      if(label==='compact') btn.remove();
    });
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',normalizeTabs);
  else normalizeTabs();
  window.addEventListener('load',normalizeTabs);
})();