'use strict';
// ============================================================
// HOUSEHOLD SYNC TEST PANEL v0.298d
// Internal QA helper for testing Shane/Esra task collaboration without
// needing both devices at the same time.
// ============================================================

(function(){
  var STYLE_ID = 'household-sync-test-panel-style';
  var PANEL_ID = 'householdSyncTestPanel';
  var ACTIVE_KEY = 'familyapp_active_member_override_v1';
  var TASK_STORE = 'fam_tasks_v023';

  var members = [
    { memberId:'shane', name:'Shane', initials:'SH' },
    { memberId:'esra', name:'Esra', initials:'ES' }
  ];

  function injectStyles(){
    if(document.getElementById(STYLE_ID)) return;
    var s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = [
      '.syncTestFab{position:fixed;right:14px;bottom:calc(88px + env(safe-area-inset-bottom));z-index:9999;border:0;border-radius:999px;padding:10px 12px;background:#111827;color:#fff;font-size:12px;font-weight:1000;box-shadow:0 16px 44px rgba(0,0,0,.28)}',
      '.syncTestPanel{position:fixed;left:12px;right:12px;bottom:calc(76px + env(safe-area-inset-bottom));z-index:10000;background:#0f172a;color:#fff;border-radius:24px;padding:14px;box-shadow:0 24px 80px rgba(0,0,0,.42);display:none;max-height:70vh;overflow:auto}',
      '.syncTestPanel.open{display:block}',
      '.syncTestHead{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:12px}.syncTestHead b{font-size:15px}.syncTestHead button{border:0;border-radius:999px;background:rgba(255,255,255,.12);color:#fff;padding:7px 9px;font-weight:900}',
      '.syncTestGrid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:10px 0}.syncTestBtn{border:1px solid rgba(255,255,255,.14);border-radius:16px;background:rgba(255,255,255,.08);color:#fff;padding:10px;font-size:12px;font-weight:950;text-align:left}.syncTestBtn.active{background:#2563eb;border-color:#93c5fd}',
      '.syncTestSection{border:1px solid rgba(255,255,255,.12);border-radius:18px;padding:10px;margin-top:9px;background:rgba(255,255,255,.06)}',
      '.syncTestSection h4{margin:0 0 7px;font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:#cbd5e1}.syncTestSection p{margin:4px 0;font-size:12px;color:#e5e7eb;line-height:1.35}',
      '.syncTestAction{width:100%;border:0;border-radius:16px;padding:11px 12px;background:#22c55e;color:#052e16;font-weight:1000;margin-top:8px}.syncTestAction.secondary{background:#dbeafe;color:#07152d}.syncTestAction.warn{background:#fef3c7;color:#422006}',
      '.syncTestTasks{display:grid;gap:7px;max-height:190px;overflow:auto}.syncTestTask{border:1px solid rgba(255,255,255,.10);border-radius:14px;padding:8px;background:rgba(0,0,0,.16);font-size:12px}.syncTestTask b{display:block;color:#fff;margin-bottom:3px}.syncTestTask span{color:#cbd5e1}',
      '.syncTestTiny{font-size:11px;color:#94a3b8!important}'
    ].join('\n');
    document.head.appendChild(s);
  }

  function parse(raw, fb){ try { return raw ? JSON.parse(raw) : fb; } catch(e){ return fb; } }
  function tm(){ return window.TaskModel || null; }

  function getActive(){
    var override = parse(localStorage.getItem(ACTIVE_KEY), null);
    if(override && override.memberId) return override;
    try {
      if(window.HouseholdIdentity && window.HouseholdIdentity.getActiveMemberId){
        var id = window.HouseholdIdentity.getActiveMemberId();
        var m = members.find(function(x){ return x.memberId === id; });
        if(m) return m;
      }
    } catch(e) {}
    return members[0];
  }

  function setActive(member){
    localStorage.setItem(ACTIVE_KEY, JSON.stringify(member));
    window.__familyAppActiveMemberOverride = member;
    window.myName = member.name;
    try {
      if(window.HouseholdIdentity){
        window.HouseholdIdentity.getActiveMemberId = function(){ return member.memberId; };
        window.HouseholdIdentity.getProfile = function(id){ return members.find(function(x){ return x.memberId === id; }) || member; };
      }
    } catch(e) {}
    try { window.dispatchEvent(new CustomEvent('familyapp:active-member-changed', { detail: member })); } catch(e) {}
    refreshApp();
    render();
  }

  function listTasks(){
    try { if(window.TaskRepositoryAdapter && window.TaskRepositoryAdapter.listTasks) return window.TaskRepositoryAdapter.listTasks() || []; } catch(e) {}
    try { if(window.HouseholdRepository && window.HouseholdRepository.listTasks) return window.HouseholdRepository.listTasks() || []; } catch(e) {}
    return parse(localStorage.getItem(TASK_STORE), []);
  }

  function saveTasks(tasks, meta){
    tasks = Array.isArray(tasks) ? tasks : [];
    try { if(window.TaskRepositoryAdapter && window.TaskRepositoryAdapter.saveTasks) return window.TaskRepositoryAdapter.saveTasks(tasks, Object.assign({ source:'HouseholdSyncTestPanel' }, meta || {})); } catch(e) {}
    try { if(window.HouseholdRepository && window.HouseholdRepository.saveTasks) return window.HouseholdRepository.saveTasks(tasks, Object.assign({ source:'HouseholdSyncTestPanel' }, meta || {})); } catch(e) {}
    localStorage.setItem(TASK_STORE, JSON.stringify(tasks));
    try { window.dispatchEvent(new CustomEvent('familyapp:tasks-updated', { detail:{ tasks:tasks, source:'HouseholdSyncTestPanel' } })); } catch(e) {}
  }

  function getId(t){ return tm() ? tm().getId(t) : String(Array.isArray(t) ? t[0] : t && t.id || ''); }
  function getTitle(t){ return tm() ? tm().getTitle(t) : String(Array.isArray(t) ? t[2] : t && (t.title || t.name) || 'Taak'); }
  function getHelp(t){ return tm() ? tm().getHelpRequested(t) : !!(Array.isArray(t) ? t[13] : t && t.helpRequested); }
  function setHelp(t, value){ if(tm()) return tm().setHelpRequested(t, value); if(Array.isArray(t)) t[13] = value ? 'Hulp gevraagd' : ''; else if(t) t.helpRequested = !!value; return t; }
  function getHelpers(t){ return tm() ? tm().getHelpers(t) : (Array.isArray(t) ? (Array.isArray(t[14]) ? t[14] : []) : (Array.isArray(t && t.helpers) ? t.helpers : [])); }
  function setHelpers(t, helpers){ if(tm()) return tm().setHelpers(t, helpers); if(Array.isArray(t)) t[14] = helpers; else if(t) t.helpers = helpers; return t; }

  function refreshApp(){
    var r = document.getElementById('task-content');
    if(r) r.dataset.v023 = '';
    if(window.TaskSharedJoinableState && window.TaskSharedJoinableState.patchCards) setTimeout(window.TaskSharedJoinableState.patchCards, 40);
    if(typeof window.renderTasks === 'function') setTimeout(window.renderTasks, 80);
  }

  function createSyncTestTask(){
    var active = getActive();
    var id = 'sync-test-' + Date.now();
    var task;
    if(tm()){
      task = tm().toLegacyArray({
        id:id,
        type:'SIDE QUEST',
        title:'Sync test: hulpvraag',
        description:'Interne testtaak om Shane/Esra hulpvragen en join-state te controleren.',
        dueDate:new Date().toISOString().slice(0,10),
        assignedTo:active.name,
        xpReward:'+10 XP',
        priority:'laag',
        imageUrl:'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=900&q=85&fm=webp',
        subtasks:['Vraag hulp als Shane','Join als Esra'],
        progress:0,
        recurrence:'once',
        helpRequested:false,
        helpers:[]
      });
    } else {
      task = [id,'SIDE QUEST','Sync test: hulpvraag','Interne testtaak om Shane/Esra hulpvragen en join-state te controleren.',new Date().toISOString().slice(0,10),active.name,'+10 XP','https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=900&q=85&fm=webp',['Vraag hulp als Shane','Join als Esra'],0,'once',new Date().toISOString().slice(0,10),'laag'];
    }
    var tasks = listTasks();
    tasks.unshift(task);
    saveTasks(tasks, { operation:'createSyncTestTask' });
    refreshApp();
    render();
  }

  function requestHelpOnFirstTest(){
    var tasks = listTasks();
    var task = tasks.find(function(t){ return /^sync-test-/.test(getId(t)); }) || tasks[0];
    if(!task) return;
    setHelp(task, true);
    saveTasks(tasks, { operation:'syncPanelRequestHelp', id:getId(task) });
    refreshApp();
    render();
  }

  function joinFirstHelpTask(){
    var active = getActive();
    var tasks = listTasks();
    var task = tasks.find(function(t){ return getHelp(t); });
    if(!task) return;
    var helpers = getHelpers(task).slice();
    if(!helpers.some(function(h){ return h.memberId === active.memberId; })){
      helpers.push({ memberId:active.memberId, name:active.name, initials:active.initials, joinedAt:new Date().toISOString(), contribution:0 });
      setHelpers(task, helpers);
      setHelp(task, true);
      saveTasks(tasks, { operation:'syncPanelJoinHelp', id:getId(task), memberId:active.memberId });
    }
    refreshApp();
    render();
  }

  function statusText(){
    var bits = [];
    bits.push('TaskModel: ' + (window.TaskModel ? 'ja' : 'nee'));
    bits.push('TaskRepositoryAdapter: ' + (window.TaskRepositoryAdapter ? 'ja' : 'nee'));
    bits.push('HouseholdRepository: ' + (window.HouseholdRepository ? 'ja' : 'nee'));
    try { bits.push('Repository tasks: ' + listTasks().length); } catch(e) { bits.push('Repository tasks: error'); }
    bits.push('Live multi-device: nog echte device-test nodig');
    return bits;
  }

  function taskRows(){
    var tasks = listTasks().slice(0,8);
    if(!tasks.length) return '<p class="syncTestTiny">Geen taken gevonden.</p>';
    return '<div class="syncTestTasks">' + tasks.map(function(t){
      var helpers = getHelpers(t);
      return '<div class="syncTestTask"><b>'+escapeHtml(getTitle(t))+'</b><span>ID: '+escapeHtml(getId(t))+'</span><br><span>Help: '+(getHelp(t) ? 'ja' : 'nee')+' · Helpers: '+helpers.map(function(h){ return h.name || h.memberId; }).join(', ')+'</span></div>';
    }).join('') + '</div>';
  }

  function escapeHtml(v){ return String(v == null ? '' : v).replace(/[&<>\"]/g, function(ch){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'})[ch] || ch; }); }

  function ensurePanel(){
    injectStyles();
    if(!document.getElementById(PANEL_ID)){
      var btn = document.createElement('button');
      btn.className = 'syncTestFab';
      btn.type = 'button';
      btn.textContent = 'Sync test';
      btn.addEventListener('click', function(){ toggle(); });
      document.body.appendChild(btn);

      var panel = document.createElement('section');
      panel.id = PANEL_ID;
      panel.className = 'syncTestPanel';
      document.body.appendChild(panel);
    }
    render();
  }

  function toggle(){
    var p = document.getElementById(PANEL_ID);
    if(!p) return;
    p.classList.toggle('open');
    render();
  }

  function render(){
    var p = document.getElementById(PANEL_ID);
    if(!p) return;
    var active = getActive();
    p.innerHTML = '<div class="syncTestHead"><b>Household sync test</b><button type="button" data-sync-close>Sluit</button></div>'
      + '<div class="syncTestSection"><h4>Actieve gebruiker</h4><p>Nu actief: <b>'+escapeHtml(active.name)+'</b></p><div class="syncTestGrid">'
      + members.map(function(m){ return '<button type="button" class="syncTestBtn '+(m.memberId===active.memberId?'active':'')+'" data-member="'+m.memberId+'">'+m.name+'<br><span class="syncTestTiny">'+m.memberId+'</span></button>'; }).join('')
      + '</div></div>'
      + '<div class="syncTestSection"><h4>Test acties</h4><button class="syncTestAction" type="button" data-action="create">Maak sync testtaak</button><button class="syncTestAction secondary" type="button" data-action="help">Vraag hulp op testtaak</button><button class="syncTestAction warn" type="button" data-action="join">Join als actieve gebruiker</button></div>'
      + '<div class="syncTestSection"><h4>Status</h4>'+statusText().map(function(x){ return '<p>'+escapeHtml(x)+'</p>'; }).join('')+'</div>'
      + '<div class="syncTestSection"><h4>Laatste taken</h4>'+taskRows()+'</div>';

    p.querySelector('[data-sync-close]').addEventListener('click', function(){ p.classList.remove('open'); });
    p.querySelectorAll('[data-member]').forEach(function(btn){ btn.addEventListener('click', function(){ var m = members.find(function(x){ return x.memberId === btn.dataset.member; }); if(m) setActive(m); }); });
    p.querySelectorAll('[data-action]').forEach(function(btn){ btn.addEventListener('click', function(){ var a = btn.dataset.action; if(a === 'create') createSyncTestTask(); if(a === 'help') requestHelpOnFirstTest(); if(a === 'join') joinFirstHelpTask(); }); });
  }

  function install(){
    // Internal QA helper: only show on non-production-like hosts or when enabled manually.
    var host = location.hostname || '';
    var enabled = localStorage.getItem('familyapp_sync_test_panel') === '1' || /localhost|127\.0\.0\.1|vercel\.app/.test(host);
    if(!enabled) return;
    ensurePanel();
    setActive(getActive());
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
  else install();

  window.HouseholdSyncTestPanel = { install: install, render: render, setActive: setActive, createSyncTestTask: createSyncTestTask, requestHelpOnFirstTest: requestHelpOnFirstTest, joinFirstHelpTask: joinFirstHelpTask };
})();
