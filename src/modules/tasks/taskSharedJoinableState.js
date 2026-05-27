'use strict';
// ============================================================
// TASK SHARED JOINABLE STATE v0.298c
// Join/help data is written onto shared task data and persisted through
// TaskRepositoryAdapter / HouseholdRepository.
// v0.298c: uses TaskModel accessors first, with legacy fallbacks only.
// ============================================================

(function(){
  var STYLE_ID = 'task-shared-joinable-state-style';

  function css(){
    if(document.getElementById(STYLE_ID)) return;
    var s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = [
      '.fqAssistAvatar{background-size:cover;background-position:center}',
      '.fqHelpSharedBadge{display:inline-flex;align-items:center;gap:6px;border-radius:999px;padding:6px 9px;background:rgba(22,163,74,.10);color:#166534;font-size:11px;font-weight:950}'
    ].join('\n');
    document.head.appendChild(s);
  }

  function tm(){ return window.TaskModel || null; }
  function repoReady(){ return !!(window.HouseholdRepository && typeof window.HouseholdRepository.listTasks === 'function'); }
  function adapterReady(){ return !!(window.TaskRepositoryAdapter && typeof window.TaskRepositoryAdapter.listTasks === 'function'); }
  function parse(raw, fb){ try { return raw ? JSON.parse(raw) : fb; } catch(e){ return fb; } }

  function listTasks(){
    if(adapterReady()) return window.TaskRepositoryAdapter.listTasks() || [];
    if(repoReady()) return window.HouseholdRepository.listTasks() || [];
    return parse(localStorage.getItem('fam_tasks_v023'), []);
  }

  function saveTasks(tasks, meta){
    tasks = Array.isArray(tasks) ? tasks : [];
    if(adapterReady()) return window.TaskRepositoryAdapter.saveTasks(tasks, Object.assign({ source:'TaskSharedJoinableState' }, meta || {}));
    if(repoReady()) return window.HouseholdRepository.saveTasks(tasks, Object.assign({ source:'TaskSharedJoinableState' }, meta || {}));
    localStorage.setItem('fam_tasks_v023', JSON.stringify(tasks));
    try { window.dispatchEvent(new CustomEvent('familyapp:tasks-updated', { detail:{ tasks:tasks, source:'TaskSharedJoinableState' } })); } catch(e) {}
    return tasks;
  }

  function idOf(task){
    if(tm()) return tm().getId(task);
    return String(Array.isArray(task) ? task[0] : task && task.id || '');
  }
  function titleOf(task){
    if(tm()) return tm().getTitle(task);
    return Array.isArray(task) ? task[2] : task && (task.title || task.name);
  }
  function helpOf(task){
    if(tm()) return tm().getHelpRequested(task);
    return !!(Array.isArray(task) ? task[13] : task && task.helpRequested);
  }
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

  function esc(v){ return String(v == null ? '' : v).replace(/[&<>\"]/g, function(ch){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'})[ch] || ch; }); }

  function activity(icon, text){
    try { if(typeof window.addActivity === 'function') window.addActivity(icon || '👥', '#dbeafe', text); } catch(e) {}
    try { if(window.HouseholdRepository && window.HouseholdRepository.appendActivity) window.HouseholdRepository.appendActivity({ icon:icon || '👥', color:'#dbeafe', text:text, type:'task-help' }); } catch(e) {}
  }

  function refresh(){
    var r = document.getElementById('task-content');
    if(r) r.dataset.v023 = '';
    if(typeof window.renderTasks === 'function') setTimeout(window.renderTasks, 60);
    setTimeout(patchCards, 140);
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
      if(!task || !helpOf(task)) return;
      card.classList.add('helpRequested');
      var old = card.querySelector('.fqJoinRow');
      if(old) old.remove();
      var body = card.querySelector('.fqBody') || card;
      var helpers = helpersOf(task);
      var me = member();
      var joined = helpers.some(function(h){ return String(h.memberId) === String(me.memberId); });
      var row = document.createElement('div');
      row.className = 'fqJoinRow';
      row.innerHTML = '<span class="fqHelpState">👥 Hulp gevraagd</span>' + helperHtml(helpers) + '<button class="fqJoinBtn '+(joined?'joined':'')+'" type="button">'+(joined?'Joined':'Join')+'</button>';
      row.querySelector('.fqJoinBtn').addEventListener('click', function(ev){
        ev.preventDefault();
        ev.stopPropagation();
        if(joined) unjoinTask(id); else joinTask(id);
      });
      body.appendChild(row);
    });
  }

  function modalTitle(){
    var h = document.querySelector('#fqModal .fqHeroT h2');
    return h ? h.textContent.trim() : '';
  }

  function patchModal(){
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
    if(document.__sharedJoinableHelpCapture) return;
    document.__sharedJoinableHelpCapture = true;
    document.addEventListener('click', function(ev){
      var btn = ev.target && ev.target.closest ? ev.target.closest('.fqHelpBtn') : null;
      if(!btn) return;
      var title = modalTitle();
      if(!title) return;
      ev.preventDefault();
      ev.stopPropagation();
      if(typeof ev.stopImmediatePropagation === 'function') ev.stopImmediatePropagation();
      if(setHelpByTitle(title)){
        btn.textContent = '👥 Hulp gevraagd';
        var box = btn.closest('.fqBox');
        if(box) box.classList.add('fqHelpBoxActive');
        activity('👥', member().name + ' vroeg hulp bij "' + title + '"');
        if(typeof window.showToast === 'function') window.showToast('Hulpvraag geplaatst 👥');
        refresh();
      }
    }, true);
  }

  function listen(){
    try {
      if(window.HouseholdRepository && window.HouseholdRepository.on && !window.__sharedJoinableRepoListener){
        window.__sharedJoinableRepoListener = true;
        window.HouseholdRepository.on('tasks', function(){ setTimeout(function(){ refresh(); patchModal(); }, 60); });
      }
    } catch(e) {}
    try {
      if(!window.__sharedJoinableDomListener){
        window.__sharedJoinableDomListener = true;
        window.addEventListener('familyapp:tasks-updated', function(){ setTimeout(function(){ patchCards(); patchModal(); }, 60); });
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
  }

  var n = 0;
  var timer = setInterval(function(){
    n++;
    install();
    if(document.querySelector('.fqCard') || n > 50) clearInterval(timer);
  }, 120);

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
  else install();

  window.TaskSharedJoinableState = { install: install, patchCards: patchCards, joinTask: joinTask, unjoinTask: unjoinTask, markHelpRequestedById: setHelpById };
})();
