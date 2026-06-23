'use strict';
// ============================================================
// TASK JOIN STATE SOURCE BRIDGE v0.300g
// Non-invasive overview patcher that merges help/join state from all known
// task sources. Fixes cases where Joined is saved but not visible until the
// detail card is opened once.
// ============================================================

(function(){
  var TASK_KEYS = ['fam_tasks_v023','fam_tasks_v022','fam_tasks_v021'];
  var installed = false;

  function parse(raw, fb){ try { return raw ? JSON.parse(raw) : fb; } catch(e){ return fb; } }
  function esc(v){ return String(v == null ? '' : v).replace(/[&<>\"]/g,function(ch){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'})[ch] || ch; }); }
  function idOf(task){ return String(Array.isArray(task) ? task[0] : task && task.id || ''); }
  function titleOf(task){ return String(Array.isArray(task) ? task[2] : task && (task.title || task.name) || '').trim(); }
  function helpOf(task){ return !!(Array.isArray(task) ? task[13] : task && task.helpRequested); }
  function helpersOf(task){
    var helpers = Array.isArray(task) ? task[14] : task && task.helpers;
    return Array.isArray(helpers) ? helpers : [];
  }
  function score(task){
    return (helpOf(task) ? 10 : 0) + helpersOf(task).length * 100;
  }
  function addTasks(out, tasks){
    if(!Array.isArray(tasks)) return;
    tasks.forEach(function(task){
      var id = idOf(task);
      var title = titleOf(task);
      if(!id && !title) return;
      var key = id || ('title:' + title.toLowerCase());
      if(!out[key] || score(task) >= score(out[key])) out[key] = task;
      if(title){
        var tkey = 'title:' + title.toLowerCase();
        if(!out[tkey] || score(task) >= score(out[tkey])) out[tkey] = task;
      }
    });
  }
  function mergedMap(){
    var out = {};
    TASK_KEYS.forEach(function(key){ addTasks(out, parse(localStorage.getItem(key), [])); });
    try { addTasks(out, Array.isArray(window.taskData) ? window.taskData : []); } catch(e) {}
    try { if(window.TaskRepositoryAdapter && window.TaskRepositoryAdapter.listTasks) addTasks(out, window.TaskRepositoryAdapter.listTasks() || []); } catch(e) {}
    try { if(window.HouseholdRepository && window.HouseholdRepository.listTasks) addTasks(out, window.HouseholdRepository.listTasks() || []); } catch(e) {}
    return out;
  }
  function currentMember(){
    var id = 'shane', name = 'Shane';
    try { if(window.HouseholdIdentity && window.HouseholdIdentity.getActiveMemberId) id = String(window.HouseholdIdentity.getActiveMemberId() || id); } catch(e) {}
    try { if(window.myName) name = String(window.myName); } catch(e) {}
    return { memberId:id, name:name };
  }
  function helperHtml(helpers){
    if(!helpers.length) return '';
    return '<div class="fqAssistants">' + helpers.slice(0,4).map(function(h){
      var initials = h.initials || String(h.name || h.memberId || '?').slice(0,2).toUpperCase();
      return '<span class="fqAssistAvatar" title="'+esc(h.name || h.memberId)+'">'+esc(initials)+'</span>';
    }).join('') + '<span class="fqHelpSharedBadge">'+helpers.length+' joined</span></div>';
  }
  function patch(){
    var map = mergedMap();
    var me = currentMember();
    document.querySelectorAll('.fqCard[data-id]').forEach(function(card){
      var id = card.getAttribute('data-id') || '';
      var titleEl = card.querySelector('.fqTitle');
      var title = titleEl ? String(titleEl.textContent || '').trim().toLowerCase() : '';
      var task = map[id] || map['title:' + title];
      var old = card.querySelector('.fqJoinRow');
      if(!task || !helpOf(task)){
        if(old && old.getAttribute('data-bridge-row') === '1') old.remove();
        return;
      }
      card.classList.add('helpRequested');
      var helpers = helpersOf(task);
      var joined = helpers.some(function(h){ return String(h.memberId) === String(me.memberId) || String(h.name) === String(me.name); });
      var html = '<span class="fqHelpState">👥 Hulp gevraagd</span>' + helperHtml(helpers) + '<button class="fqJoinBtn '+(joined?'joined':'')+'" type="button" data-task-join="'+esc(id || idOf(task))+'">'+(joined?'Joined':'Join')+'</button>';
      var key = String(helpers.length) + '-' + joined;
      if(old){
        if(old.getAttribute('data-render-key') !== key){
          old.innerHTML = html;
          old.setAttribute('data-render-key', key);
        }
        old.setAttribute('data-bridge-row','1');
        return;
      }
      var row = document.createElement('div');
      row.className = 'fqJoinRow';
      row.setAttribute('data-render-key', key);
      row.setAttribute('data-bridge-row','1');
      row.innerHTML = html;
      var body = card.querySelector('.fqBody') || card;
      body.appendChild(row);
    });
  }
  function burst(){
    patch();
    setTimeout(patch,80);
    setTimeout(patch,220);
    setTimeout(patch,520);
    setTimeout(patch,1000);
  }
  function install(){
    if(installed) return;
    installed = true;
    window.addEventListener('familyapp:tasks-updated', burst);
    window.addEventListener('storage', function(ev){ if(TASK_KEYS.indexOf(ev.key) >= 0) burst(); });
    document.addEventListener('click', function(ev){
      var t = ev.target;
      if(t && t.closest && t.closest('.ttab,.task-tabs button,[role="tab"],[data-task-tab],[data-task-join],.fqJoinBtn')) burst();
    }, false);
    var i = 0;
    var timer = setInterval(function(){ i++; burst(); if(i > 30) clearInterval(timer); }, 220);
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
  else install();
  window.TaskJoinStateSourceBridge = { install:install, patch:patch, burst:burst };
})();
