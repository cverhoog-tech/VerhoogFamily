'use strict';
// ============================================================
// TASK REMOVE GROUP + COMPLETE CTA v0.295
// Product cleanup:
// - Remove the separate Group tab from the actual DOM, not just hide it.
// - Remove task detail "Markeer als voltooid" CTA entirely.
// - Keep collaboration inside normal tasks via "Vraag om hulp".
// v0.295: also removes nav-lint chips rendered as div/span/a elements.
// ============================================================

(function(){
  var STYLE_ID = 'task-remove-group-complete-cta-style';

  function injectSafetyCss(){
    var old = document.getElementById(STYLE_ID);
    if(old) old.remove();
    var s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = [
      '#fqModal .fqDoneWrap,#fqModal #fqDoneBtn{display:none!important}',
      '#gq287HeroCarousel,.group-quests-view,.gq284,.gq287Wrap{display:none!important}',
      '[data-tab="group"],[data-tab="groupquests"],[data-task-tab="group"],[data-task-tab="groupquests"],.task-tab-group,.task-tab-groupquests,.gq-tab{display:none!important}'
    ].join('\n');
    document.head.appendChild(s);
  }

  function norm(v){ return String(v || '').toLowerCase().replace(/\s+/g, ' ').trim(); }
  function textOf(el){ return norm(el && el.textContent); }
  function attrOf(el){
    if(!el) return '';
    return norm([
      el.getAttribute('onclick') || '',
      el.getAttribute('data-tab') || '',
      el.getAttribute('data-task-tab') || '',
      el.getAttribute('aria-label') || '',
      el.getAttribute('title') || '',
      el.id || '',
      el.className || ''
    ].join(' '));
  }

  function isTaskNavContainer(el){
    if(!el) return false;
    var a = attrOf(el);
    var t = textOf(el);
    if(/task|taken|tab|nav|lint|segmented|filter|chip/.test(a)) return true;
    if(/overzicht|vandaag|morgen|later|done|open|group/.test(t) && el.children && el.children.length >= 2) return true;
    return false;
  }

  function isGroupTab(el){
    var txt = textOf(el);
    var attr = attrOf(el);
    if(/group\s*quest|groupquests/.test(txt)) return true;
    if(/groupquests|task-tab-group|gq-tab/.test(attr)) return true;
    if(/(^|\s)(group)(\s|$)/.test(attr) && /tab|nav|chip|filter|ttab/.test(attr)) return true;
    if(/^group$/.test(txt)){
      if(el.classList && (el.classList.contains('ttab') || el.getAttribute('role') === 'tab')) return true;
      var parent = el.parentElement;
      var gp = parent && parent.parentElement;
      if(isTaskNavContainer(parent) || isTaskNavContainer(gp)) return true;
    }
    return false;
  }

  function removeGroupTabs(){
    var selectors = [
      '.ttab', '.task-tabs button', '.task-tabs *', '[role="tab"]',
      'button[data-tab]', 'button[data-task-tab]', '[data-tab]', '[data-task-tab]',
      '.task-nav *', '.taskNav *', '.task-lint *', '.nav-lint *', '.tabs *', '.segmented *'
    ].join(',');

    Array.prototype.slice.call(document.querySelectorAll(selectors)).forEach(function(el){
      if(isGroupTab(el) && el.parentNode){ el.parentNode.removeChild(el); }
    });

    // Final scoped fallback: find exact visible "Group" text in likely nav rows.
    Array.prototype.slice.call(document.querySelectorAll('div,span,a,button')).forEach(function(el){
      if(textOf(el) !== 'group') return;
      var parent = el.parentElement;
      var gp = parent && parent.parentElement;
      if((isTaskNavContainer(parent) || isTaskNavContainer(gp)) && el.parentNode){
        el.parentNode.removeChild(el);
      }
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
    if(n > 120) clearInterval(timer);
  }, 80);

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', patch);
  else patch();

  if(document.body && !document.body.__taskRemoveGroupCompleteObserver){
    document.body.__taskRemoveGroupCompleteObserver = true;
    new MutationObserver(function(){
      clearTimeout(document.body.__taskRemoveGroupCompleteTimer);
      document.body.__taskRemoveGroupCompleteTimer = setTimeout(patch, 15);
    }).observe(document.body, { childList:true, subtree:true });
  }

  window.TaskRemoveGroupAndCompleteCta = { patch: patch };
})();
