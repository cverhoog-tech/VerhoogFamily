'use strict';
// ============================================================
// TASK SHARED JOINABLE STATE v0.300d
// Shared help/join state with safer DOM behavior.
// v0.300d: binds the modal help button directly so Vraag om hulp works for
// Side Quest, Dungeon and Raid detail flows.
// ============================================================

(function(){
  var STYLE_ID = 'task-shared-joinable-state-style';
  var TASK_STORE = 'fam_tasks_v023';
  var FALLBACK_STORE = 'fam_tasks_v022';

  function css(){
    if(document.getElementById(STYLE_ID)) return;
    var s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = [
      '.fqAssistAvatar{background-size:cover;background-position:center}',
      '.fqHelpSharedBadge{display:inline-flex;align-items:center;gap:6px;border-radius:999px;padding:6px 9px;background:rgba(22,163,74,.10);color:#166534;font-size:11px;font-weight:950}',
      '.fqCard.helpRequested{border-color:rgba(59,130,246,.28)!important;box-shadow:0 12px 36px rgba(59,130,246,.10)!important}',
      '.fqJoinRow{position:relative;z-index:2}',
      '.fqJoinBtn{pointer-events:auto!important;touch-action:manipulation}',
      '.fqHelpBoxActive{border:1px solid rgba(59,130,246,.22)!important;background:rgba(59,130,246,.08)!important}'
    ].join('\n');
    document.head.appendChild(s);
  }

  function tm(){ return window.TaskModel || null; }
  function repoReady(){ return !!(window.HouseholdRepository && typeof window.HouseholdRepository.listTasks === 'function'); }
  function adapterReady(){ return !!(window.TaskRepositoryAdapter && typeof window.TaskRepositoryAdapter.listTasks === 'function'); }
  function parse(raw, fb){ try { return raw ? JSON.parse(raw) : fb; } catch(e){ return fb; } }

  function readLocalTasks(){
    var tasks = parse(localStorage.getItem(TASK_STORE), null);
    if(Array.isArray(tasks)) return tasks;
    tasks = parse(localStorage.getItem(FALLBACK_STORE), null);
    return Array.isArray(tasks) ? tasks : [];
  }

  function listTasks(){
    var tasks = [];
    if(adapterReady()){
      try { tasks = window.TaskRepositoryAdapter.listTasks() || []; } catch(e) { tasks = []; }
    } else if(repoReady()){
      try { tasks = window.HouseholdRepository.listTasks() || []; } catch(e) { tasks = []; }
    }
    if(Array.isArray(tasks) && tasks.length) return tasks;
    tasks = readLocalTasks();
    if(Array.isArray(tasks) && tasks.length) return tasks;
    return Array.isArray(window.taskData) ? window.taskData : [];
  }

  function syncGlobals(tasks){
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
  }

  function saveTasks(tasks, meta){
    tasks = Array.isArray(tasks) ? tasks : [];
    syncGlobals(tasks);
    var saved = tasks;
    try {
      if(adapterReady()) saved = window.TaskRepositoryAdapter.saveTasks(tasks, Object.assign({ source:'TaskSharedJoinableState' }, meta || {})) || tasks;
      else if(repoReady()) saved = window.HouseholdRepository.saveTasks(tasks, Object.assign({ source:'TaskSharedJoinableState' }, meta || {})) || tasks;
    } catch(e) {}
    if(Array.isArray(saved)) syncGlobals(saved);
    try { window.dispatchEvent(new CustomEvent('familyapp:tasks-updated', { detail:Object.assign({ tasks:saved || tasks, source:'TaskSharedJoinableState' }, meta || {}) })); } catch(e) {}
    return saved || tasks;
  }

  function idOf(task){ if(tm()) return tm().getId(task); return String(Array.isArray(task) ? task[0] : task && task.id || ''); }
  function titleOf(task){ if(tm()) return tm().getTitle(task); return Array.isArray(task) ? task[2] : task && (task.title || task.name); }
  function helpOf(task){ if(tm()) return tm().getHelpRequested(task); return !!(Array.isArray(task) ? task[13] : task && task.helpRequested); }
  function setHelp(task, value){
    if(tm()) return tm().setHelpRequested(task, !!value);
    if(Array.isArray(task)) task[13] = value ? 'Hulp gevraagd' : '';
    else if(task) task.helpRequested = !!value;
    return task;
  }
  function helpersOf(task){
    if(tm()) return tm().getHelpers(task);
    var helpers = Array.isArray(task) ? task[14] : task && task.helpers;
    return Array.isArray(helpers) ? helpers : [];
  }
  function setHelpers(task, helpers){
    helpers = Array.isArray(helpers) ? helpers : [];
    if(tm()) return tm().setHelpers(task, helpers);
    if(Array.isArray(task)) task[14] = helpers;
    else if(task) task.helpers = helpers;
    return task;
  }
  function sameTitle(task, title){ return String(titleOf(task) || '').trim() === String(title || '').trim(); }
  function sameId(task, id){ return String(idOf(task)) === String(id); }

  function member(){
    var id = 'shane', name = 'Shane', initials = 'SH', avatar = '';
    try {
      if(window.HouseholdIdentity && window.HouseholdIdentity.getActiveMemberId) id = String(window.HouseholdIdentity.getActiveMemberId() || id);
      if(window.HouseholdIdentity && window.HouseholdIdentity.getProfile){
        var p = window.HouseholdIdentity.getProfile(id) || {};
        name = p.name || p.displayName || name;
        initials = p.initials || String(name || id).slice(0,2).toUpperCase();
        avatar = p.avatar || p.photo || '';
      }
    } catch(e) {}
    try { if(window.myName){ name = String(window.myName); initials = name.slice(0,2).toUpperCase(); } } catch(e) {}
    return { memberId:id, name:name, initials:initials, avatar:avatar };
  }

  function esc(v){ return String(v == null ? '' : v).replace(/[&<>"]/g, function(ch){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[ch] || ch; }); }
  function activity(icon, text){
    try { if(typeof window.addActivity === 'function') window.addActivity(icon || '👥', '#dbeafe', text); } catch(e) {}
    try { if(window.HouseholdRepository && window.HouseholdRepository.appendActivity) window.HouseholdRepository.appendActivity({ icon:icon || '👥', color:'#dbeafe', text:text, type:'task-help' }); } catch(e) {}
  }

  function refresh(){
    var r = document.getElementById('task-content');
    if(r) r.dataset.v023 = '';
    if(typeof window.renderTasks === 'function') setTimeout(function(){ try { window.renderTasks(); } catch(e) {} }, 60);
    setTimeout(function(){ patchCards(); patchModal(); bindModalHelpButton(); }, 180);
  }

  function setHelpByTitle(title){
    var tasks = listTasks();
    var changed = false;
    tasks.forEach(function(task){
      if(sameTitle(task, title)){
        setHelp(task, true);
        setHelpers(task, helpersOf(task));
        changed = true;
      }
    });
    if(changed) saveTasks(tasks, { operation:'requestHelp', title:title });
    return changed;
  }

  function setHelpById(id){
    var tasks = listTasks();
    var changed = false;
    tasks.forEach(function(task){
      if(sameId(task, id)){
        setHelp(task, true);
        setHelpers(task, helpersOf(task));
        changed = true;
      }
    });
    if(changed) saveTasks(tasks, { operation:'requestHelp', id:id });
    return changed;
  }

  function taskFromModal(){
    var title = modalTitle();
    if(!title) return null;
    var tasks = listTasks();
    return tasks.find(function(t){ return sameTitle(t, title); }) || null;
  }

  function requestHelpFromModal(){
    var task = taskFromModal();
    var title = modalTitle();
    var ok = false;
    if(task && idOf(task)) ok = setHelpById(idOf(task));
    if(!ok && title) ok = setHelpByTitle(title);
    if(ok){
      activity('👥', member().name + ' vroeg hulp bij "' + (title || 'taak') + '"');
      if(typeof window.showToast === 'function') window.showToast('Hulpvraag geplaatst 👥');
      refresh();
    }
    return ok;
  }

  function joinTask(id){
    var me = member();
    var tasks = listTasks();
    var title = '';
    var changed = false;
    tasks.forEach(function(task){
      if(!sameId(task, id)) return;
      setHelp(task, true);
      var helpers = helpersOf(task).slice();
      if(!helpers.some(function(h){ return String(h.memberId) === String(me.memberId); })){
        helpers.push(Object.assign({}, me, { joinedAt:new Date().toISOString(), contribution:0 }));
        setHelpers(task, helpers);
        title = titleOf(task) || 'taak';
        changed = true;
      }
    });
    if(changed){
      saveTasks(tasks, { operation:'joinHelpTask', id:id, memberId:me.memberId });
      activity('👥', me.name + ' joined "' + title + '"');
      if(typeof window.showToast === 'function') window.showToast(me.name + ' joined 👥');
      refresh();
    }
  }

  function unjoinTask(id){
    var me = member();
    var tasks = listTasks();
    var title = '';
    var changed = false;
    tasks.forEach(function(task){
      if(!sameId(task, id)) return;
      var before = helpersOf(task);
      var helpers = before.filter(function(h){ return String(h.memberId) !== String(me.memberId); });
      if(helpers.length !== before.length){
        setHelpers(task, helpers);
        title = titleOf(task) || 'taak';
        changed = true;
      }
    });
    if(changed){
      saveTasks(tasks, { operation:'unjoinHelpTask', id:id, memberId:me.memberId });
      activity('👥', me.name + ' verliet hulp bij "' + title + '"');
      if(typeof window.showToast === 'function') window.showToast('Hulp verlaten');
      refresh();
    }
  }

  function helperHtml(helpers){
    if(!helpers.length) return '';
    return '<div class="fqAssistants">' + helpers.slice(0,4).map(function(h){
      var style = h.avatar ? ' style="background-image:url('+esc(h.avatar)+');color:transparent"' : '';
      return '<span class="fqAssistAvatar"'+style+' title="'+esc(h.name || h.memberId)+'">'+esc(h.initials || String(h.name || '?').slice(0,2).toUpperCase())+'</span>';
    }).join('') + '<span class="fqHelpSharedBadge">'+helpers.length+' joined</span></div>';
  }

  function patchCards(){
    css();
    var tasks = listTasks();
    document.querySelectorAll('.fqCard[data-id]').forEach(function(card){
      var id = card.getAttribute('data-id');
      var task = tasks.find(function(candidate){ return sameId(candidate, id); });
      var old = card.querySelector('.fqJoinRow');
      if(!task || !helpOf(task)){
        card.classList.remove('helpRequested');
        if(old) old.remove();
        return;
      }
      card.classList.add('helpRequested');
      var helpers = helpersOf(task);
      var me = member();
      var joined = helpers.some(function(h){ return String(h.memberId) === String(me.memberId); });
      var html = '<span class="fqHelpState">👥 Hulp gevraagd</span>' + helperHtml(helpers) + '<button class="fqJoinBtn '+(joined?'joined':'')+'" type="button" data-task-join="'+esc(id)+'">'+(joined?'Joined':'Join')+'</button>';
      if(old){
        if(old.getAttribute('data-render-key') !== String(helpers.length)+'-'+joined){
          old.innerHTML = html;
          old.setAttribute('data-render-key', String(helpers.length)+'-'+joined);
        }
        return;
      }
      var body = card.querySelector('.fqBody') || card;
      var row = document.createElement('div');
      row.className = 'fqJoinRow';
      row.setAttribute('data-render-key', String(helpers.length)+'-'+joined);
      row.innerHTML = html;
      body.appendChild(row);
    });
  }

  function modalTitle(){
    var h = document.querySelector('#fqModal .fqHeroT h2');
    return h ? h.textContent.trim() : '';
  }

  function bindModalHelpButton(){
    var btn = document.querySelector('#fqModal.open .fqHelpBtn');
    if(!btn || btn.__sharedJoinableBoundV300d) return;
    btn.__sharedJoinableBoundV300d = true;
    btn.onclick = function(ev){
      if(ev){ ev.preventDefault(); ev.stopPropagation(); }
      requestHelpFromModal();
      return false;
    };
  }

  function patchModal(){
    bindModalHelpButton();
    var title = modalTitle();
    if(!title) return;
    var task = listTasks().find(function(candidate){ return sameTitle(candidate, title); });
    if(!task || !helpOf(task)) return;
    var btn = document.querySelector('#fqModal .fqHelpBtn');
    if(!btn) return;
    var helpers = helpersOf(task);
    btn.textContent = helpers.length ? '👥 Hulp gevraagd · '+helpers.length+' joined' : '👥 Hulp gevraagd';
    var box = btn.closest('.fqBox');
    if(box) box.classList.add('fqHelpBoxActive');
  }

  function captureHelp(){
    if(document.__sharedJoinableHelpCaptureV300d) return;
    document.__sharedJoinableHelpCaptureV300d = true;
    document.addEventListener('click', function(ev){
      var joinBtn = ev.target && ev.target.closest ? ev.target.closest('[data-task-join]') : null;
      if(joinBtn){
        ev.preventDefault();
        ev.stopPropagation();
        if(typeof ev.stopImmediatePropagation === 'function') ev.stopImmediatePropagation();
        var id = joinBtn.getAttribute('data-task-join');
        var task = listTasks().find(function(candidate){ return sameId(candidate, id); });
        var me = member();
        var joined = task && helpersOf(task).some(function(h){ return String(h.memberId) === String(me.memberId); });
        if(joined) unjoinTask(id); else joinTask(id);
        return;
      }

      var btn = ev.target && ev.target.closest ? ev.target.closest('.fqHelpBtn') : null;
      if(!btn) return;
      ev.preventDefault();
      ev.stopPropagation();
      if(typeof ev.stopImmediatePropagation === 'function') ev.stopImmediatePropagation();
      requestHelpFromModal();
    }, true);
  }

  function listen(){
    try {
      if(window.HouseholdRepository && window.HouseholdRepository.on && !window.__sharedJoinableRepoListener){
        window.__sharedJoinableRepoListener = true;
        window.HouseholdRepository.on('tasks', function(){ setTimeout(function(){ patchCards(); patchModal(); }, 120); });
      }
    } catch(e) {}
    try {
      if(!window.__sharedJoinableDomListenerV300d){
        window.__sharedJoinableDomListenerV300d = true;
        window.addEventListener('familyapp:tasks-updated', function(){ setTimeout(function(){ patchCards(); patchModal(); }, 120); });
        window.addEventListener('familyapp:active-member-changed', function(){ setTimeout(function(){ patchCards(); patchModal(); }, 120); });
        document.addEventListener('click', function(ev){
          var t = ev.target;
          if(t && t.closest && t.closest('.fqCard,.fqStartBtn,.ttab,.task-tabs button,[role="tab"]')) setTimeout(function(){ patchCards(); patchModal(); bindModalHelpButton(); }, 220);
        }, false);
      }
    } catch(e) {}
  }

  function overrideOldModule(){
    if(!window.TaskJoinableHelpMerge) window.TaskJoinableHelpMerge = {};
    window.TaskJoinableHelpMerge.joinTask = joinTask;
    window.TaskJoinableHelpMerge.unjoinTask = unjoinTask;
    window.TaskJoinableHelpMerge.markHelpRequestedById = setHelpById;
    window.TaskJoinableHelpMerge.patchCards = patchCards;
  }

  function install(){
    css();
    captureHelp();
    listen();
    overrideOldModule();
    patchCards();
    patchModal();
    bindModalHelpButton();
  }

  var n = 0;
  var timer = setInterval(function(){
    n++;
    install();
    if(n > 120) clearInterval(timer);
  }, 120);

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
  else install();

  window.TaskSharedJoinableState = { install: install, patchCards: patchCards, joinTask: joinTask, unjoinTask: unjoinTask, markHelpRequestedById: setHelpById };
})();
