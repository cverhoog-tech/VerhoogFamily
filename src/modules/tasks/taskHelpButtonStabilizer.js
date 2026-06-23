'use strict';
// ============================================================
// TASK HELP BUTTON STABILIZER v0.300e
// Ensures Vraag hulp works from Side Quest, Dungeon and Raid detail sheets.
// It captures .fqHelpBtn before quest-overlay's legacy showGQPopup onclick
// can run, then writes helpRequested onto shared task state.
// ============================================================

(function(){
  var TASK_STORE = 'fam_tasks_v023';
  var FALLBACK_STORE = 'fam_tasks_v022';
  var installed = false;

  function parse(raw, fb){ try { return raw ? JSON.parse(raw) : fb; } catch(e){ return fb; } }
  function titleOf(task){ return String(Array.isArray(task) ? task[2] : task && (task.title || task.name) || '').trim(); }
  function idOf(task){ return String(Array.isArray(task) ? task[0] : task && task.id || '').trim(); }
  function getModalTitle(){
    var h = document.querySelector('#fqModal.open .fqHeroT h2, #fqModal .fqHeroT h2');
    return h ? String(h.textContent || '').trim() : '';
  }
  function readTasks(){
    var tasks = null;
    try { if(window.TaskRepositoryAdapter && window.TaskRepositoryAdapter.listTasks) tasks = window.TaskRepositoryAdapter.listTasks(); } catch(e) {}
    if(Array.isArray(tasks) && tasks.length) return tasks;
    try { if(window.HouseholdRepository && window.HouseholdRepository.listTasks) tasks = window.HouseholdRepository.listTasks(); } catch(e) {}
    if(Array.isArray(tasks) && tasks.length) return tasks;
    tasks = parse(localStorage.getItem(TASK_STORE), null);
    if(Array.isArray(tasks)) return tasks;
    tasks = parse(localStorage.getItem(FALLBACK_STORE), null);
    if(Array.isArray(tasks)) return tasks;
    return Array.isArray(window.taskData) ? window.taskData : [];
  }
  function writeTasks(tasks, meta){
    tasks = Array.isArray(tasks) ? tasks : [];
    try { localStorage.setItem(TASK_STORE, JSON.stringify(tasks)); } catch(e) {}
    try { localStorage.setItem(FALLBACK_STORE, JSON.stringify(tasks)); } catch(e) {}
    try {
      if(Array.isArray(window.taskData)){
        window.taskData.length = 0;
        tasks.forEach(function(t){ window.taskData.push(t); });
      } else {
        window.taskData = tasks.slice();
      }
    } catch(e) {}
    try { if(window.TaskRepositoryAdapter && window.TaskRepositoryAdapter.saveTasks) window.TaskRepositoryAdapter.saveTasks(tasks, Object.assign({ source:'TaskHelpButtonStabilizer' }, meta || {})); } catch(e) {}
    try { if(window.HouseholdRepository && window.HouseholdRepository.saveTasks) window.HouseholdRepository.saveTasks(tasks, Object.assign({ source:'TaskHelpButtonStabilizer' }, meta || {})); } catch(e) {}
    try { window.dispatchEvent(new CustomEvent('familyapp:tasks-updated', { detail:Object.assign({ tasks:tasks, source:'TaskHelpButtonStabilizer' }, meta || {}) })); } catch(e) {}
  }
  function markHelp(title){
    if(!title) return false;
    var tasks = readTasks();
    var changed = false;
    var id = '';
    tasks.forEach(function(task){
      if(titleOf(task) !== title) return;
      if(Array.isArray(task)){
        task[13] = 'Hulp gevraagd';
        if(!Array.isArray(task[14])) task[14] = [];
      } else if(task){
        task.helpRequested = true;
        if(!Array.isArray(task.helpers)) task.helpers = [];
      }
      id = idOf(task) || id;
      changed = true;
    });
    if(changed) writeTasks(tasks, { operation:'requestHelp', title:title, id:id });
    return changed;
  }
  function markCurrentModalHelp(){
    var title = getModalTitle();
    var ok = markHelp(title);
    if(ok){
      var btn = document.querySelector('#fqModal .fqHelpBtn');
      if(btn) btn.textContent = '👥 Hulp gevraagd';
      var box = btn && btn.closest ? btn.closest('.fqBox') : null;
      if(box) box.classList.add('fqHelpBoxActive');
      try { if(window.TaskSharedJoinableState && window.TaskSharedJoinableState.patchCards) window.TaskSharedJoinableState.patchCards(); } catch(e) {}
      try { if(typeof window.showToast === 'function') window.showToast('Hulpvraag geplaatst 👥'); } catch(e) {}
      try { if(typeof window.addActivity === 'function') window.addActivity('👥', '#dbeafe', (window.myName || 'Iemand') + ' vroeg hulp bij "' + title + '"'); } catch(e) {}
      var root = document.getElementById('task-content');
      if(root) root.dataset.v023 = '';
      setTimeout(function(){ try { if(typeof window.renderTasks === 'function') window.renderTasks(); } catch(e) {} }, 80);
      setTimeout(function(){ try { if(window.TaskSharedJoinableState && window.TaskSharedJoinableState.patchCards) window.TaskSharedJoinableState.patchCards(); } catch(e) {} }, 220);
    }
    return ok;
  }
  function bindButton(){
    var btn = document.querySelector('#fqModal.open .fqHelpBtn, #fqModal .fqHelpBtn');
    if(!btn || btn.__helpStabilizedV300e) return;
    btn.__helpStabilizedV300e = true;
    btn.onclick = function(ev){
      if(ev){ ev.preventDefault(); ev.stopPropagation(); }
      markCurrentModalHelp();
      return false;
    };
  }
  function install(){
    if(installed) return;
    installed = true;
    document.addEventListener('click', function(ev){
      var btn = ev.target && ev.target.closest ? ev.target.closest('.fqHelpBtn') : null;
      if(!btn) return;
      ev.preventDefault();
      ev.stopPropagation();
      if(typeof ev.stopImmediatePropagation === 'function') ev.stopImmediatePropagation();
      markCurrentModalHelp();
    }, true);
    document.addEventListener('click', function(ev){
      var t = ev.target;
      if(t && t.closest && t.closest('.fqCard,.fqStartBtn')) setTimeout(bindButton, 80);
    }, true);
    if(document.body){
      new MutationObserver(function(){
        clearTimeout(document.body.__helpStabilizerTimerV300e);
        document.body.__helpStabilizerTimerV300e = setTimeout(bindButton, 50);
      }).observe(document.body, { childList:true, subtree:true });
    }
    var i = 0;
    var timer = setInterval(function(){ i++; bindButton(); if(i > 80) clearInterval(timer); }, 120);
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
  else install();

  window.TaskHelpButtonStabilizer = { install:install, markCurrentModalHelp:markCurrentModalHelp, markHelp:markHelp };
})();
