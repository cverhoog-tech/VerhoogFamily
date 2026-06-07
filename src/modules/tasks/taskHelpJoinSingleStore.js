'use strict';
// ============================================================
// TASK HELP JOIN SINGLE STORE v0.301
// One simple MVP source of truth for help/join UI state.
// Stores help/join state separately from quest-overlay's internal data array,
// then mirrors the state back into task data when possible.
// ============================================================

(function(){
  var STORE = 'familyapp_help_join_state_v1';
  var TASK_KEYS = ['fam_tasks_v023','fam_tasks_v022','fam_tasks_v021'];
  var STYLE_ID = 'task-help-join-single-store-style';
  var installed = false;

  function parse(raw, fb){ try { return raw ? JSON.parse(raw) : fb; } catch(e){ return fb; } }
  function readStore(){ return parse(localStorage.getItem(STORE), {}); }
  function writeStore(state){ try { localStorage.setItem(STORE, JSON.stringify(state || {})); } catch(e) {} }
  function norm(v){ return String(v || '').trim().toLowerCase(); }
  function esc(v){ return String(v == null ? '' : v).replace(/[&<>\"]/g,function(ch){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'})[ch] || ch; }); }
  function css(){
    if(document.getElementById(STYLE_ID)) return;
    var s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = [
      '.fqCard.helpRequested{border-color:rgba(59,130,246,.30)!important;box-shadow:0 12px 36px rgba(59,130,246,.12)!important}',
      '.fqJoinRow{position:relative;z-index:4;display:flex;align-items:center;gap:8px;margin-top:9px;flex-wrap:wrap}',
      '.fqHelpState{display:inline-flex;align-items:center;gap:6px;border-radius:999px;padding:6px 9px;background:rgba(59,130,246,.10);color:#1d4ed8;font-size:11px;font-weight:950}',
      '.fqHelpSharedBadge{display:inline-flex;align-items:center;gap:6px;border-radius:999px;padding:6px 9px;background:rgba(22,163,74,.10);color:#166534;font-size:11px;font-weight:950}',
      '.fqJoinBtn{border:0;border-radius:999px;padding:7px 10px;background:linear-gradient(135deg,#dbeafe,#93c5fd);color:#07152d;font-size:11px;font-weight:1000;box-shadow:0 8px 18px rgba(59,130,246,.18);cursor:pointer;pointer-events:auto!important;touch-action:manipulation}',
      '.fqJoinBtn.joined{background:linear-gradient(135deg,#dcfce7,#86efac);color:#052e16}',
      '.fqAssistants{display:flex;align-items:center;gap:6px}',
      '.fqAssistAvatar{width:24px;height:24px;border-radius:50%;display:grid;place-items:center;background:#2563eb;color:#fff;font-size:8px;font-weight:1000;border:2px solid #fff;box-shadow:0 3px 8px rgba(0,0,0,.12)}',
      '.fqHelpBoxActive{border:1px solid rgba(59,130,246,.22)!important;background:rgba(59,130,246,.08)!important}'
    ].join('\n');
    document.head.appendChild(s);
  }

  function getActiveMember(){
    var id = 'shane';
    var name = 'Shane';
    try { if(window.HouseholdIdentity && window.HouseholdIdentity.getActiveMemberId) id = String(window.HouseholdIdentity.getActiveMemberId() || id); } catch(e) {}
    try {
      if(window.HouseholdIdentity && window.HouseholdIdentity.getProfile){
        var p = window.HouseholdIdentity.getProfile(id) || {};
        name = p.name || p.displayName || name;
      }
    } catch(e) {}
    try { if(window.myName) name = String(window.myName); } catch(e) {}
    return { memberId:id, name:name, initials:String(name || id).slice(0,2).toUpperCase() };
  }

  function titleFromCard(card){
    var el = card && card.querySelector('.fqTitle');
    return el ? String(el.textContent || '').trim() : '';
  }
  function titleFromModal(){
    var el = document.querySelector('#fqModal.open .fqHeroT h2, #fqModal .fqHeroT h2');
    return el ? String(el.textContent || '').trim() : '';
  }
  function keyFor(id, title){ return id ? 'id:' + String(id) : 'title:' + norm(title); }
  function keysFor(id, title){
    var out = [];
    if(id) out.push('id:' + String(id));
    if(title) out.push('title:' + norm(title));
    return out;
  }
  function getState(id, title){
    var store = readStore();
    var keys = keysFor(id, title);
    var best = null;
    keys.forEach(function(k){
      var item = store[k];
      if(!item) return;
      if(!best || (item.helpers || []).length >= (best.helpers || []).length) best = item;
    });
    return best || { helpRequested:false, helpers:[] };
  }
  function setState(id, title, patch){
    var store = readStore();
    var primary = keyFor(id, title);
    var current = getState(id, title);
    var next = Object.assign({}, current, patch || {}, { id:id || current.id || '', title:title || current.title || '', updatedAt:new Date().toISOString() });
    next.helpers = Array.isArray(next.helpers) ? next.helpers : [];
    keysFor(id, title).forEach(function(k){ store[k] = next; });
    store[primary] = next;
    writeStore(store);
    mirrorToTasks(next);
    try { window.dispatchEvent(new CustomEvent('familyapp:tasks-updated', { detail:{ source:'TaskHelpJoinSingleStore', helpJoinState:next } })); } catch(e) {}
    return next;
  }

  function readTasksFromKey(key){ return parse(localStorage.getItem(key), []); }
  function taskTitle(task){ return String(Array.isArray(task) ? task[2] : task && (task.title || task.name) || '').trim(); }
  function taskId(task){ return String(Array.isArray(task) ? task[0] : task && task.id || ''); }
  function mirrorTask(task, state){
    if(!task || !state) return false;
    if(state.id && taskId(task) !== state.id) return false;
    if(!state.id && state.title && norm(taskTitle(task)) !== norm(state.title)) return false;
    if(Array.isArray(task)){
      task[13] = state.helpRequested ? 'Hulp gevraagd' : '';
      task[14] = state.helpers || [];
    } else {
      task.helpRequested = !!state.helpRequested;
      task.helpers = state.helpers || [];
    }
    return true;
  }
  function mirrorToTasks(state){
    TASK_KEYS.forEach(function(key){
      var tasks = readTasksFromKey(key);
      if(!Array.isArray(tasks)) return;
      var changed = false;
      tasks.forEach(function(task){ if(mirrorTask(task, state)) changed = true; });
      if(changed){ try { localStorage.setItem(key, JSON.stringify(tasks)); } catch(e) {} }
    });
    try {
      if(Array.isArray(window.taskData)) window.taskData.forEach(function(task){ mirrorTask(task, state); });
    } catch(e) {}
  }

  function helperHtml(helpers){
    helpers = Array.isArray(helpers) ? helpers : [];
    if(!helpers.length) return '';
    return '<div class="fqAssistants">' + helpers.slice(0,4).map(function(h){ return '<span class="fqAssistAvatar" title="'+esc(h.name || h.memberId)+'">'+esc(h.initials || String(h.name || '?').slice(0,2).toUpperCase())+'</span>'; }).join('') + '<span class="fqHelpSharedBadge">'+helpers.length+' joined</span></div>';
  }

  function patchCards(){
    css();
    document.querySelectorAll('.fqCard[data-id]').forEach(function(card){
      var id = card.getAttribute('data-id') || '';
      var title = titleFromCard(card);
      var state = getState(id, title);
      var old = card.querySelector('.fqJoinRow[data-single-store="1"]') || card.querySelector('.fqJoinRow');
      if(!state.helpRequested){
        card.classList.remove('helpRequested');
        if(old && old.getAttribute('data-single-store') === '1') old.remove();
        return;
      }
      card.classList.add('helpRequested');
      var me = getActiveMember();
      var helpers = Array.isArray(state.helpers) ? state.helpers : [];
      var joined = helpers.some(function(h){ return String(h.memberId) === String(me.memberId) || String(h.name) === String(me.name); });
      var renderKey = String(helpers.length) + '-' + joined;
      var html = '<span class="fqHelpState">👥 Hulp gevraagd</span>' + helperHtml(helpers) + '<button class="fqJoinBtn '+(joined?'joined':'')+'" type="button" data-hj-id="'+esc(id)+'" data-hj-title="'+esc(title)+'">'+(joined?'Joined':'Join')+'</button>';
      if(old){
        old.setAttribute('data-single-store','1');
        if(old.getAttribute('data-render-key') !== renderKey){ old.innerHTML = html; old.setAttribute('data-render-key', renderKey); }
        return;
      }
      var row = document.createElement('div');
      row.className = 'fqJoinRow';
      row.setAttribute('data-single-store','1');
      row.setAttribute('data-render-key', renderKey);
      row.innerHTML = html;
      (card.querySelector('.fqBody') || card).appendChild(row);
    });
  }

  function patchModal(){
    var title = titleFromModal();
    var btn = document.querySelector('#fqModal.open .fqHelpBtn, #fqModal .fqHelpBtn');
    if(!btn || !title) return;
    var state = getState('', title);
    if(state.helpRequested){
      btn.textContent = (state.helpers && state.helpers.length) ? '👥 Hulp gevraagd · ' + state.helpers.length + ' joined' : '👥 Hulp gevraagd';
      var box = btn.closest('.fqBox');
      if(box) box.classList.add('fqHelpBoxActive');
    }
  }
  function burst(){ patchCards(); patchModal(); setTimeout(patchCards,80); setTimeout(patchCards,220); setTimeout(patchCards,600); }

  function requestHelp(){
    var title = titleFromModal();
    if(!title) return false;
    var state = setState('', title, { helpRequested:true });
    try { if(typeof window.showToast === 'function') window.showToast('Hulpvraag geplaatst 👥'); } catch(e) {}
    burst();
    return !!state.helpRequested;
  }
  function toggleJoin(id, title){
    var me = getActiveMember();
    var state = getState(id, title);
    var helpers = Array.isArray(state.helpers) ? state.helpers.slice() : [];
    var exists = helpers.some(function(h){ return String(h.memberId) === String(me.memberId) || String(h.name) === String(me.name); });
    if(exists) helpers = helpers.filter(function(h){ return String(h.memberId) !== String(me.memberId) && String(h.name) !== String(me.name); });
    else helpers.push(Object.assign({}, me, { joinedAt:new Date().toISOString() }));
    setState(id, title, { helpRequested:true, helpers:helpers });
    try { if(typeof window.showToast === 'function') window.showToast(exists ? 'Hulp verlaten' : me.name + ' joined 👥'); } catch(e) {}
    burst();
  }

  function install(){
    if(installed) return;
    installed = true;
    css();
    document.addEventListener('click', function(ev){
      var joinBtn = ev.target && ev.target.closest ? ev.target.closest('[data-hj-id],[data-hj-title]') : null;
      if(joinBtn){
        ev.preventDefault(); ev.stopPropagation(); if(ev.stopImmediatePropagation) ev.stopImmediatePropagation();
        toggleJoin(joinBtn.getAttribute('data-hj-id') || '', joinBtn.getAttribute('data-hj-title') || '');
        return;
      }
      var legacyJoin = ev.target && ev.target.closest ? ev.target.closest('[data-task-join],.fqJoinBtn') : null;
      if(legacyJoin){
        var card = legacyJoin.closest('.fqCard');
        if(card){
          ev.preventDefault(); ev.stopPropagation(); if(ev.stopImmediatePropagation) ev.stopImmediatePropagation();
          toggleJoin(card.getAttribute('data-id') || '', titleFromCard(card));
          return;
        }
      }
      var helpBtn = ev.target && ev.target.closest ? ev.target.closest('.fqHelpBtn') : null;
      if(helpBtn){
        ev.preventDefault(); ev.stopPropagation(); if(ev.stopImmediatePropagation) ev.stopImmediatePropagation();
        requestHelp();
      }
    }, true);
    window.addEventListener('familyapp:tasks-updated', burst);
    window.addEventListener('storage', function(ev){ if(ev.key === STORE || TASK_KEYS.indexOf(ev.key) >= 0) burst(); });
    document.addEventListener('click', function(ev){
      var t = ev.target;
      if(t && t.closest && t.closest('.fqCard,.fqStartBtn,.ttab,.task-tabs button,[role="tab"],[data-task-tab]')) setTimeout(burst,160);
    }, false);
    var i = 0;
    var timer = setInterval(function(){ i++; burst(); if(i > 40) clearInterval(timer); }, 180);
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
  else install();

  window.TaskHelpJoinSingleStore = { install:install, patchCards:patchCards, requestHelp:requestHelp, toggleJoin:toggleJoin, readStore:readStore };
})();
