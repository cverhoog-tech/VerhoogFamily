'use strict';
// ============================================================
// TASK JOINABLE HELP MERGE v0.289
// Product decision: remove separate Group Quest tab.
// Collaboration now lives inside normal task cards via Vraag om hulp.
// ============================================================

(function(){
  var STYLE_ID = 'task-joinable-help-merge-style';
  var TASK_STORE = 'fam_tasks_v023';
  var JOIN_STORE = 'fam_task_help_joins_v1';
  var installed = false;

  function injectStyles(){
    if(document.getElementById(STYLE_ID)) return;
    var s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = [
      'button[data-tab="groupquests"],.ttab[data-tab="groupquests"],.ttab[data-task-tab="groupquests"],.ttab.gq-tab,.task-tab-groupquests{display:none!important}',
      '.ttab[data-hidden-group="1"]{display:none!important}',
      '#gq287HeroCarousel,.group-quests-view,.gq284,.gq287Wrap{display:none!important}',
      '.fqCard.helpRequested{border-color:rgba(59,130,246,.28)!important;box-shadow:0 12px 36px rgba(59,130,246,.10)!important}',
      '.fqJoinRow{display:flex;align-items:center;gap:8px;margin-top:9px;flex-wrap:wrap}',
      '.fqHelpState{display:inline-flex;align-items:center;gap:6px;border-radius:999px;padding:6px 9px;background:rgba(59,130,246,.10);color:#1d4ed8;font-size:11px;font-weight:950}',
      '.fqJoinBtn{border:0;border-radius:999px;padding:7px 10px;background:linear-gradient(135deg,#dbeafe,#93c5fd);color:#07152d;font-size:11px;font-weight:1000;box-shadow:0 8px 18px rgba(59,130,246,.18);cursor:pointer}',
      '.fqJoinBtn.joined{background:linear-gradient(135deg,#dcfce7,#86efac);color:#052e16}',
      '.fqJoinBtn:active{transform:scale(.96)}',
      '.fqAssistants{display:flex;align-items:center;gap:6px;margin-top:8px}',
      '.fqAssistAvatar{width:24px;height:24px;border-radius:50%;display:grid;place-items:center;background:#2563eb;color:#fff;font-size:8px;font-weight:1000;border:2px solid #fff;box-shadow:0 3px 8px rgba(0,0,0,.12)}',
      '.fqPage{display:flex!important;flex-direction:column!important;max-height:min(92vh,820px)!important;overflow:hidden!important}',
      '.fqPage>.fqContent{flex:1 1 auto!important;overflow:auto!important;-webkit-overflow-scrolling:touch!important;padding-bottom:112px!important}',
      '.fqDoneWrap{position:sticky!important;bottom:0!important;z-index:30!important;background:linear-gradient(180deg,rgba(8,12,20,0),rgba(8,12,20,.92) 28%,rgba(8,12,20,.98))!important;padding:18px 18px calc(18px + env(safe-area-inset-bottom))!important;margin-top:auto!important;backdrop-filter:blur(14px)!important}',
      '.fqDone{width:100%!important}',
      '.fqHelpBoxActive{border:1px solid rgba(59,130,246,.22)!important;background:rgba(59,130,246,.08)!important}',
      '.fqHelpBoxActive b{color:#fff!important}'
    ].join('\n');
    document.head.appendChild(s);
  }

  function readTasks(){
    try { return JSON.parse(localStorage.getItem(TASK_STORE) || 'null') || []; } catch(e){ return []; }
  }

  function writeTasks(list){
    try { localStorage.setItem(TASK_STORE, JSON.stringify(list || [])); } catch(e) {}
  }

  function readJoins(){
    try { return JSON.parse(localStorage.getItem(JOIN_STORE) || '{}') || {}; } catch(e){ return {}; }
  }

  function writeJoins(store){
    try { localStorage.setItem(JOIN_STORE, JSON.stringify(store || {})); } catch(e) {}
  }

  function activeInitials(){
    try {
      if(window.HouseholdIdentity && window.HouseholdIdentity.getActiveMemberId){
        var id = window.HouseholdIdentity.getActiveMemberId();
        return String(id || 'SH').slice(0,2).toUpperCase();
      }
    } catch(e) {}
    try { if(window.myName) return String(window.myName).slice(0,2).toUpperCase(); } catch(e) {}
    return 'SH';
  }

  function taskIdFromCard(card){ return card && card.getAttribute('data-id'); }

  function markHelpRequestedByTitle(title){
    var list = readTasks();
    var changed = false;
    list.forEach(function(x){
      if(String(x[2] || '').trim() === String(title || '').trim()){
        x[13] = 'Hulp gevraagd';
        changed = true;
      }
    });
    if(changed) writeTasks(list);
    return changed;
  }

  function markHelpRequestedById(id){
    var list = readTasks();
    var changed = false;
    list.forEach(function(x){
      if(String(x[0]) === String(id)){
        x[13] = 'Hulp gevraagd';
        changed = true;
      }
    });
    if(changed) writeTasks(list);
    return changed;
  }

  function isHelpRequested(id){
    var list = readTasks();
    return list.some(function(x){ return String(x[0]) === String(id) && !!x[13]; });
  }

  function joinTask(id){
    var store = readJoins();
    var me = activeInitials();
    store[id] = store[id] || [];
    if(store[id].indexOf(me) === -1) store[id].push(me);
    writeJoins(store);
    if(typeof window.showToast === 'function') window.showToast('Je bent gejoined 👥');
    patchCards();
  }

  function unjoinTask(id){
    var store = readJoins();
    var me = activeInitials();
    store[id] = (store[id] || []).filter(function(x){ return x !== me; });
    writeJoins(store);
    if(typeof window.showToast === 'function') window.showToast('Je hebt de hulp verlaten');
    patchCards();
  }

  function assistantsHtml(id){
    var joins = readJoins()[id] || [];
    if(!joins.length) return '';
    return '<div class="fqAssistants">' + joins.slice(0,4).map(function(j){ return '<span class="fqAssistAvatar">'+esc(j)+'</span>'; }).join('') + '<span class="fqHelpState">'+joins.length+' helper'+(joins.length>1?'s':'')+'</span></div>';
  }

  function esc(v){ return String(v == null ? '' : v).replace(/[&<>\"]/g, function(ch){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'})[ch] || ch; }); }

  function patchCards(){
    injectStyles();
    document.querySelectorAll('.fqCard[data-id]').forEach(function(card){
      var id = taskIdFromCard(card);
      if(!id || !isHelpRequested(id)) return;
      card.classList.add('helpRequested');
      if(card.querySelector('.fqJoinRow')) return;
      var body = card.querySelector('.fqBody') || card;
      var joins = readJoins()[id] || [];
      var me = activeInitials();
      var joined = joins.indexOf(me) > -1;
      var row = document.createElement('div');
      row.className = 'fqJoinRow';
      row.innerHTML = '<span class="fqHelpState">👥 Hulp gevraagd</span>' + assistantsHtml(id) + '<button class="fqJoinBtn '+(joined?'joined':'')+'" type="button">'+(joined?'Joined':'Join')+'</button>';
      var btn = row.querySelector('.fqJoinBtn');
      btn.addEventListener('click', function(ev){
        ev.preventDefault(); ev.stopPropagation();
        if(joined) unjoinTask(id); else joinTask(id);
      });
      body.appendChild(row);
    });
  }

  function hideGroupTab(){
    injectStyles();
    document.querySelectorAll('.ttab,button,[role="tab"]').forEach(function(btn){
      var txt = String(btn.textContent || '').toLowerCase().trim();
      var attr = String(btn.getAttribute('onclick') || '') + ' ' + String(btn.dataset.tab || '') + ' ' + String(btn.dataset.taskTab || '');
      if(/group\s*quest|groupquests|group/.test(txt) || /groupquests/.test(attr)){
        btn.dataset.hiddenGroup = '1';
        btn.style.display = 'none';
        if(btn.classList.contains('active')){
          btn.classList.remove('active');
          var first = Array.prototype.slice.call(document.querySelectorAll('.ttab')).find(function(x){ return x.dataset.hiddenGroup !== '1' && x.style.display !== 'none'; });
          if(first) first.classList.add('active');
        }
      }
    });
    if(window.taskTab === 'groupquests'){
      window.taskTab = 'overzicht';
      try { if(typeof window.renderTasks === 'function') window.renderTasks(); } catch(e) {}
    }
  }

  function wrapSetTaskTab(){
    if(typeof window.setTaskTab !== 'function' || window.setTaskTab.__joinableMergeWrapped) return;
    var original = window.setTaskTab;
    window.setTaskTab = function(tab, btn){
      if(tab === 'groupquests' || tab === 'group'){
        tab = 'overzicht';
        btn = document.querySelector('.ttab:not([data-hidden-group="1"])') || btn;
      }
      var result = original.apply(this, arguments.length ? [tab, btn] : arguments);
      setTimeout(function(){ hideGroupTab(); patchCards(); }, 60);
      return result;
    };
    window.setTaskTab.__joinableMergeWrapped = true;
  }

  function wrapRenderTasks(){
    if(typeof window.renderTasks !== 'function' || window.renderTasks.__joinableMergeWrapped) return;
    var original = window.renderTasks;
    window.renderTasks = function(){
      if(window.taskTab === 'groupquests') window.taskTab = 'overzicht';
      var result = original.apply(this, arguments);
      setTimeout(function(){ hideGroupTab(); patchCards(); }, 40);
      return result;
    };
    window.renderTasks.__joinableMergeWrapped = true;
  }

  function currentModalTitle(){
    var h = document.querySelector('#fqModal .fqHeroT h2');
    return h ? h.textContent.trim() : '';
  }

  function patchModalHelpState(){
    var title = currentModalTitle();
    if(!title) return;
    var list = readTasks();
    var task = list.find(function(x){ return String(x[2] || '').trim() === title; });
    if(!task || !task[13]) return;
    var box = document.querySelector('#fqModal .fqHelpBtn');
    if(!box) return;
    var parent = box.closest('.fqBox');
    if(parent) parent.classList.add('fqHelpBoxActive');
    box.textContent = '👥 Hulp gevraagd';
  }

  function captureHelpButton(){
    if(document.__joinableHelpCapture) return;
    document.__joinableHelpCapture = true;
    document.addEventListener('click', function(ev){
      var btn = ev.target && ev.target.closest ? ev.target.closest('.fqHelpBtn') : null;
      if(!btn) return;
      var title = currentModalTitle();
      if(!title) return;
      ev.preventDefault(); ev.stopPropagation();
      if(typeof ev.stopImmediatePropagation === 'function') ev.stopImmediatePropagation();
      if(markHelpRequestedByTitle(title)){
        btn.textContent = '👥 Hulp gevraagd';
        var parent = btn.closest('.fqBox');
        if(parent) parent.classList.add('fqHelpBoxActive');
        if(typeof window.showToast === 'function') window.showToast('Hulpvraag geplaatst 👥');
        try { if(typeof window.addActivity === 'function') window.addActivity('👥','#dbeafe',(window.myName || 'Iemand')+' vroeg hulp bij "'+title+'"'); } catch(e) {}
        var r = document.getElementById('task-content');
        if(r) r.dataset.v023 = '';
        if(typeof window.renderTasks === 'function') setTimeout(window.renderTasks, 100);
      }
    }, true);
  }

  function observe(){
    var root = document.getElementById('task-content') || document.body;
    if(root && !root.__joinableHelpObserver){
      root.__joinableHelpObserver = true;
      new MutationObserver(function(){
        clearTimeout(root.__joinableHelpTimer);
        root.__joinableHelpTimer = setTimeout(function(){ hideGroupTab(); patchCards(); patchModalHelpState(); }, 50);
      }).observe(root, { childList:true, subtree:true });
    }
    var modal = document.getElementById('fqModal') || document.body;
    if(modal && !modal.__joinableHelpModalObserver){
      modal.__joinableHelpModalObserver = true;
      new MutationObserver(function(){ setTimeout(patchModalHelpState, 40); }).observe(modal, { childList:true, subtree:true });
    }
  }

  function install(){
    injectStyles();
    hideGroupTab();
    wrapSetTaskTab();
    wrapRenderTasks();
    captureHelpButton();
    patchCards();
    patchModalHelpState();
    observe();
    installed = true;
  }

  var tries = 0;
  var timer = setInterval(function(){
    tries++;
    install();
    if((typeof window.renderTasks === 'function' && document.getElementById('task-content')) || tries > 50) clearInterval(timer);
  }, 120);

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
  else install();

  window.TaskJoinableHelpMerge = { install: install, patchCards: patchCards, joinTask: joinTask, unjoinTask: unjoinTask, markHelpRequestedById: markHelpRequestedById };
})();
