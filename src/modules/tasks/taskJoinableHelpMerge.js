'use strict';
// ============================================================
// TASK JOINABLE HELP MERGE v0.300a
// MVP stabilization: this legacy module is now UI-only.
// It hides/removes the old Group Quest tab and provides styling only.
// Help/join state is owned by taskSharedJoinableState.js so it can persist
// through TaskRepositoryAdapter / HouseholdRepository instead of local-only
// join storage.
// ============================================================

(function(){
  var STYLE_ID = 'task-joinable-help-merge-style';

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
      setTimeout(hideGroupTab, 60);
      try { if(window.TaskSharedJoinableState && window.TaskSharedJoinableState.patchCards) setTimeout(window.TaskSharedJoinableState.patchCards, 80); } catch(e) {}
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
      setTimeout(hideGroupTab, 40);
      try { if(window.TaskSharedJoinableState && window.TaskSharedJoinableState.patchCards) setTimeout(window.TaskSharedJoinableState.patchCards, 60); } catch(e) {}
      return result;
    };
    window.renderTasks.__joinableMergeWrapped = true;
  }

  function delegate(name){
    return function(){
      if(window.TaskSharedJoinableState && typeof window.TaskSharedJoinableState[name] === 'function'){
        return window.TaskSharedJoinableState[name].apply(window.TaskSharedJoinableState, arguments);
      }
    };
  }

  function install(){
    injectStyles();
    hideGroupTab();
    wrapSetTaskTab();
    wrapRenderTasks();
  }

  var tries = 0;
  var timer = setInterval(function(){
    tries++;
    install();
    if((typeof window.renderTasks === 'function' && document.getElementById('task-content')) || tries > 50) clearInterval(timer);
  }, 120);

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
  else install();

  window.TaskJoinableHelpMerge = {
    install: install,
    patchCards: delegate('patchCards'),
    joinTask: delegate('joinTask'),
    unjoinTask: delegate('unjoinTask'),
    markHelpRequestedById: delegate('markHelpRequestedById')
  };
})();
