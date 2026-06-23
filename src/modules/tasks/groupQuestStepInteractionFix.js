'use strict';
// ============================================================
// GROUP QUEST STEP INTERACTION FIX v0.285
// Adds non-linear clickable subtasks to premium group quest cards.
// Also preserves scroll around contribution updates to reduce visual jumps.
// ============================================================

(function(){
  var STORE_KEY = 'fam_group_quest_step_checks_v1';
  var STYLE_ID = 'group-quest-step-interaction-fix-style';
  var installed = false;

  function injectStyles(){
    if(document.getElementById(STYLE_ID)) return;
    var s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = [
      '.group-quests-view.gq285{display:flex;flex-direction:column;gap:16px;padding:2px 0 22px}',
      '.gq285 .gq284Task{cursor:pointer;border-radius:14px;padding:4px 5px;margin:0 -4px;transition:background .16s ease,transform .16s ease}',
      '.gq285 .gq284Task:active{transform:scale(.985)}',
      '.gq285 .gq284Task:hover{background:rgba(255,255,255,.08)}',
      '.gq285 .gq284Task.done{background:rgba(134,239,172,.09)}',
      '.gq285 .gq284Task.locked{opacity:.72}',
      '.gq285FlashGuard{min-height:430px;border-radius:30px;background:linear-gradient(135deg,rgba(8,12,20,.86),rgba(49,95,44,.28));display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,.72);font-size:12px;font-weight:900}'
    ].join('\n');
    document.head.appendChild(s);
  }

  function readStore(){
    try { return JSON.parse(localStorage.getItem(STORE_KEY) || '{}') || {}; } catch(e){ return {}; }
  }

  function writeStore(store){
    try { localStorage.setItem(STORE_KEY, JSON.stringify(store || {})); } catch(e) {}
  }

  function getQuestChecks(q){
    var store = readStore();
    var id = String(q.id);
    if(!store[id]){
      store[id] = {};
      var progress = parseInt(q.progress, 10) || 0;
      for(var i=0; i<progress; i++) store[id][i] = true;
      writeStore(store);
    }
    return store[id];
  }

  function setQuestCheck(q, idx, value){
    var store = readStore();
    var id = String(q.id);
    store[id] = store[id] || {};
    if(value) store[id][idx] = true;
    else delete store[id][idx];
    writeStore(store);
  }

  function checkedCount(q){
    var checks = getQuestChecks(q);
    return Object.keys(checks).filter(function(k){ return checks[k]; }).length;
  }

  function findQuest(id){
    try {
      if(typeof window.loadGroupQuests !== 'function') return null;
      return (window.loadGroupQuests() || []).find(function(q){ return String(q.id) === String(id); }) || null;
    } catch(e){ return null; }
  }

  function preserveScroll(fn){
    var y = window.scrollY || document.documentElement.scrollTop || 0;
    try { fn(); } catch(e) { console.warn('[GroupQuestStepInteractionFix]', e); }
    requestAnimationFrame(function(){ window.scrollTo(0, y); });
    setTimeout(function(){ window.scrollTo(0, y); }, 80);
    setTimeout(function(){ window.scrollTo(0, y); }, 180);
  }

  function safeContribute(q){
    if(!q || typeof window.contributeGroupQuest !== 'function') return;
    preserveScroll(function(){ window.contributeGroupQuest(q.id); });
  }

  function updateVisibleCard(card, q){
    if(!card || !q) return;
    var count = checkedCount(q);
    var target = Math.max(1, parseInt(q.target, 10) || (q.steps || []).length || 1);
    var pct = Math.min(100, Math.round((count / target) * 100));
    var bar = card.querySelector('.gq284Bar i');
    var meta = card.querySelector('.gq284BarMeta span:last-child');
    if(bar) bar.style.width = pct + '%';
    if(meta) meta.textContent = pct + '% · ' + count + ' / ' + target + ' bijdragen';
    card.classList.toggle('nearDone', pct >= 75);
  }

  function applyTaskState(row, done){
    if(!row) return;
    row.classList.toggle('done', !!done);
    row.classList.toggle('open', !done);
    var dot = row.querySelector('span');
    if(dot) dot.textContent = done ? '✓' : '○';
  }

  function wireTasks(){
    injectStyles();
    document.querySelectorAll('.gq284Card[data-gqid]').forEach(function(card){
      if(card.__gq285Wired) return;
      card.__gq285Wired = true;
      var qid = card.getAttribute('data-gqid');
      var q = findQuest(qid);
      if(!q) return;
      var checks = getQuestChecks(q);
      card.querySelectorAll('.gq284Task[data-step-index]').forEach(function(row){
        var idx = parseInt(row.getAttribute('data-step-index'), 10);
        applyTaskState(row, !!checks[idx]);
        row.addEventListener('click', function(ev){
          ev.preventDefault();
          ev.stopPropagation();
          var fresh = findQuest(qid) || q;
          var nowDone = !getQuestChecks(fresh)[idx];
          setQuestCheck(fresh, idx, nowDone);
          applyTaskState(row, nowDone);
          updateVisibleCard(card, fresh);
          if(nowDone){
            var engineProgress = parseInt(fresh.progress, 10) || 0;
            var localCount = checkedCount(fresh);
            if(localCount > engineProgress) safeContribute(fresh);
          }
        });
      });
    });
  }

  function patchRenderedHtml(){
    document.querySelectorAll('.group-quests-view.premium.gq284').forEach(function(view){
      view.classList.add('gq285');
    });
    var quests = [];
    try { quests = typeof window.loadGroupQuests === 'function' ? (window.loadGroupQuests() || []).filter(function(q){ return q.status !== 'completed'; }) : []; } catch(e) {}
    document.querySelectorAll('.gq284Card').forEach(function(card, cardIndex){
      if(card.getAttribute('data-gqid')) return;
      var q = quests[cardIndex];
      if(!q) return;
      card.setAttribute('data-gqid', q.id);
      card.querySelectorAll('.gq284Task').forEach(function(row, idx){ row.setAttribute('data-step-index', idx); });
    });
    wireTasks();
  }

  function wrapRenderTasks(){
    if(typeof window.renderTasks !== 'function') return false;
    if(window.renderTasks.__gq285Wrapped) return true;
    var previous = window.renderTasks;
    var wrappedFn = function(){
      var y = window.scrollY || document.documentElement.scrollTop || 0;
      var result = previous.apply(this, arguments);
      patchRenderedHtml();
      if(window.__gq285PreserveScroll){
        requestAnimationFrame(function(){ window.scrollTo(0, y); });
        setTimeout(function(){ window.scrollTo(0, y); }, 120);
      }
      return result;
    };
    wrappedFn.__gq285Wrapped = true;
    window.renderTasks = wrappedFn;
    return true;
  }

  function wrapContributionFunctions(){
    ['contributeGroupQuest','joinGroupQuest','leaveGroupQuest'].forEach(function(name){
      var original = window[name];
      if(typeof original !== 'function' || original.__gq285ScrollWrapped) return;
      var wrappedFn = function(){
        var y = window.scrollY || document.documentElement.scrollTop || 0;
        window.__gq285PreserveScroll = true;
        var result = original.apply(this, arguments);
        setTimeout(patchRenderedHtml, 60);
        requestAnimationFrame(function(){ window.scrollTo(0, y); });
        setTimeout(function(){ window.scrollTo(0, y); window.__gq285PreserveScroll = false; }, 180);
        return result;
      };
      wrappedFn.__gq285ScrollWrapped = true;
      window[name] = wrappedFn;
    });
  }

  function install(){
    injectStyles();
    wrapRenderTasks();
    wrapContributionFunctions();
    patchRenderedHtml();
    if(installed) return true;
    installed = true;
    var root = document.getElementById('task-content');
    if(root && !root.__gq285Observer){
      root.__gq285Observer = true;
      new MutationObserver(function(){ patchRenderedHtml(); }).observe(root, { childList:true, subtree:true });
    }
    return true;
  }

  var tries = 0;
  var timer = setInterval(function(){
    tries++;
    install();
    if((typeof window.renderTasks === 'function' && typeof window.loadGroupQuests === 'function') || tries > 40) clearInterval(timer);
  }, 150);

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
  else install();

  window.GroupQuestStepInteractionFix = { install: install, patch: patchRenderedHtml };
})();
