'use strict';
// ============================================================
// CANONICAL TASK OVERVIEW v2.2
// TaskCompactHome owns Overzicht. PersonTabV2 owns Persoon.
// Legacy person renderers are intentionally unreachable live.
// ============================================================
(function(){
  if(window.__taskOverviewCanonicalV22)return;
  window.__taskOverviewCanonicalV22=true;
  window.__taskOverviewCanonicalV21=true;
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
      window.TaskCompactHome.render(el);applyLifecycle();return true;
    }
    return false;
  }
  function renderPerson(){
    var el=taskEl();if(!el)return false;
    if(window.PersonTabV2&&typeof window.PersonTabV2.render==='function'){
      window.PersonTabV2.render(el);return true;
    }
    el.innerHTML='<div style="padding:30px 16px;text-align:center;color:var(--c-text2);font-size:13px">Persoonsdashboard laden…</div>';
    var tries=0,timer=setInterval(function(){tries++;if(window.PersonTabV2&&typeof window.PersonTabV2.render==='function'){clearInterval(timer);window.PersonTabV2.render(el);}else if(tries>30){clearInterval(timer);}},100);
    return true;
  }

  window.renderTasks=function(){
    var el=taskEl();if(!el)return;
    var current='compact';try{current=window.taskTab||(typeof taskTab!=='undefined'?taskTab:'compact');}catch(e){}
    if(current==='persoon'){renderPerson();return;}
    renderCompact();
  };
  window.setTaskTab=function(tab,btn){
    if(tab==='overzicht')tab='compact';
    try { window.taskTab=tab; if(typeof taskTab!=='undefined') taskTab=tab; } catch(e) {}
    document.querySelectorAll('#screen-tasks .ttab').forEach(function(b){ b.classList.remove('active'); });
    if(btn)btn.classList.add('active');window.renderTasks();
  };
  window.renderTasksOverzicht=function(){return renderCompact();};

  var legacyRenderScreen=window._renderScreen;
  if(typeof legacyRenderScreen==='function'){
    window._renderScreen=function(id){
      if(id==='tasks'){
        var current='compact';try{current=window.taskTab||(typeof taskTab!=='undefined'?taskTab:'compact');}catch(e){}
        return current==='persoon'?renderPerson():renderCompact();
      }
      return legacyRenderScreen.apply(this,arguments);
    };
  }

  function normalizeTabs(){
    var screen=document.getElementById('screen-tasks');if(!screen)return;
    var buttons=Array.prototype.slice.call(screen.querySelectorAll('.task-tabs .ttab'));
    buttons.forEach(function(btn){
      var label=(btn.textContent||'').trim().toLowerCase();
      if(label==='overzicht'){btn.setAttribute('onclick',"setTaskTab('compact',this)");}
      if(label==='persoon'){btn.setAttribute('onclick',"setTaskTab('persoon',this)");}
      if(label==='compact')btn.remove();
    });
    var current='compact';try{current=window.taskTab||(typeof taskTab!=='undefined'?taskTab:'compact');}catch(e){}
    buttons=Array.prototype.slice.call(screen.querySelectorAll('.task-tabs .ttab'));
    buttons.forEach(function(btn){var label=(btn.textContent||'').trim().toLowerCase();btn.classList.toggle('active',(current==='persoon'&&label==='persoon')||(current!=='persoon'&&label==='overzicht'));});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',normalizeTabs);else normalizeTabs();
  window.addEventListener('load',normalizeTabs);
})();