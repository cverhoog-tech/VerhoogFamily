'use strict';
// ============================================================
// TASK REMOVE GROUP + COMPLETE CTA v0.293
// Product cleanup:
// - Remove the separate Group tab from the actual DOM, not just hide it.
// - Remove the task detail "Markeer als voltooid" CTA entirely.
// - Keep collaboration inside normal tasks via "Vraag om hulp".
// ============================================================

(function(){
  var STYLE_ID = 'task-remove-group-complete-cta-style';

  function injectSafetyCss(){
    if(document.getElementById(STYLE_ID)) return;
    var s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = [
      '#fqModal .fqDoneWrap,#fqModal #fqDoneBtn{display:none!important}',
      '#gq287HeroCarousel,.group-quests-view,.gq284,.gq287Wrap{display:none!important}'
    ].join('\n');
    document.head.appendChild(s);
  }

  function textOf(el){ return String(el && el.textContent || '').toLowerCase().trim(); }
  function attrOf(el){
    if(!el) return '';
    return [
      el.getAttribute('onclick') || '',
      el.getAttribute('data-tab') || '',
      el.getAttribute('data-task-tab') || '',
      el.id || '',
      el.className || ''
    ].join(' ').toLowerCase();
  }

  function isGroupTab(el){
    var txt = textOf(el);
    var attr = attrOf(el);
    if(/group\s*quest|groupquests/.test(txt)) return true;
    if(/groupquests/.test(attr)) return true;
    // Do not remove general helper/party content; only tab-like controls.
    if((el.classList && (el.classList.contains('ttab') || el.getAttribute('role') === 'tab')) && /^group$/.test(txt)) return true;
    return false;
  }

  function removeGroupTabs(){
    Array.prototype.slice.call(document.querySelectorAll('.ttab,.task-tabs button,[role="tab"],button[data-tab],button[data-task-tab]')).forEach(function(el){
      if(isGroupTab(el)) el.remove();
    });
    if(window.taskTab === 'groupquests' || window.taskTab === 'group'){
      window.taskTab = 'overzicht';
      try { if(typeof window.renderTasks === 'function') window.renderTasks(); } catch(e) {}
    }
  }

  function removeGroupViews(){
    Array.prototype.slice.call(document.querySelectorAll('#gq287HeroCarousel,.group-quests-view,.gq284,.gq287Wrap')).forEach(function(el){
      if(el && el.parentNode) el.parentNode.removeChild(el);
    });
  }

  function removeCompleteCta(){
    var modal = document.getElementById('fqModal');
    if(!modal) return;
    Array.prototype.slice.call(modal.querySelectorAll('.fqDoneWrap,#fqDoneBtn')).forEach(function(el){
      if(el && el.parentNode) el.parentNode.removeChild(el);
    });
  }

  function wrapSetTaskTab(){
    if(typeof window.setTaskTab !== 'function' || window.setTaskTab.__removeGroupWrapped) return;
    var original = window.setTaskTab;
    window.setTaskTab = function(tab, btn){
      if(tab === 'groupquests' || tab === 'group'){
        tab = 'overzicht';
        btn = document.querySelector('.ttab,[data-tab="overzicht"],[data-task-tab="overzicht"]') || btn;
      }
      var result = original.apply(this, [tab, btn]);
      setTimeout(patch, 30);
      return result;
    };
    window.setTaskTab.__removeGroupWrapped = true;
  }

  function patch(){
    injectSafetyCss();
    wrapSetTaskTab();
    removeGroupTabs();
    removeGroupViews();
    removeCompleteCta();
  }

  var n = 0;
  var timer = setInterval(function(){
    n++;
    patch();
    if(n > 60) clearInterval(timer);
  }, 120);

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', patch);
  else patch();

  if(document.body && !document.body.__taskRemoveGroupCompleteObserver){
    document.body.__taskRemoveGroupCompleteObserver = true;
    new MutationObserver(function(){
      clearTimeout(document.body.__taskRemoveGroupCompleteTimer);
      document.body.__taskRemoveGroupCompleteTimer = setTimeout(patch, 20);
    }).observe(document.body, { childList:true, subtree:true });
  }

  window.TaskRemoveGroupAndCompleteCta = { patch: patch };
})();
