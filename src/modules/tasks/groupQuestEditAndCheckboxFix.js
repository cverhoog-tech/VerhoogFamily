'use strict';
// ============================================================
// GROUP QUEST EDIT + CHECKBOX FIX v0.286
// Fixes first-click subtask refresh by capturing checkbox clicks before
// the older interaction bridge can call contributeGroupQuest().
// Adds a clear edit button on every premium group quest card.
// ============================================================

(function(){
  var STORE_KEY = 'fam_group_quest_step_checks_v1';
  var STYLE_ID = 'group-quest-edit-checkbox-fix-style';

  function injectStyles(){
    if(document.getElementById(STYLE_ID)) return;
    var s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = [
      '.gq286Edit{position:absolute;right:14px;bottom:14px;z-index:5;border:1px solid rgba(255,255,255,.20);background:rgba(8,12,20,.52);color:#fff;border-radius:999px;padding:9px 12px;font-size:12px;font-weight:1000;box-shadow:0 12px 28px rgba(0,0,0,.24);backdrop-filter:blur(16px);cursor:pointer;text-shadow:none}',
      '.gq286Edit:active{transform:scale(.96)}',
      '.gq286Toast{position:fixed;left:50%;bottom:92px;z-index:13000;transform:translateX(-50%) translateY(12px);opacity:0;background:rgba(8,12,20,.92);color:#fff;border:1px solid rgba(255,255,255,.16);box-shadow:0 16px 50px rgba(0,0,0,.30);border-radius:999px;padding:10px 14px;font-size:12px;font-weight:950;backdrop-filter:blur(16px);transition:opacity .2s ease,transform .2s ease;pointer-events:none;white-space:nowrap}',
      '.gq286Toast.show{opacity:1;transform:translateX(-50%) translateY(0)}',
      '.gq284Card{position:relative}',
      '.gq284Task{touch-action:manipulation}'
    ].join('\n');
    document.head.appendChild(s);
  }

  function toast(text){
    injectStyles();
    var old = document.querySelector('.gq286Toast');
    if(old) old.remove();
    var el = document.createElement('div');
    el.className = 'gq286Toast';
    el.textContent = text;
    document.body.appendChild(el);
    requestAnimationFrame(function(){ el.classList.add('show'); });
    setTimeout(function(){ el.classList.remove('show'); setTimeout(function(){ if(el.parentNode) el.parentNode.removeChild(el); }, 250); }, 1200);
  }

  function readStore(){
    try { return JSON.parse(localStorage.getItem(STORE_KEY) || '{}') || {}; } catch(e){ return {}; }
  }

  function writeStore(store){
    try { localStorage.setItem(STORE_KEY, JSON.stringify(store || {})); } catch(e) {}
  }

  function findQuest(id){
    try {
      if(typeof window.loadGroupQuests !== 'function') return null;
      return (window.loadGroupQuests() || []).find(function(q){ return String(q.id) === String(id); }) || null;
    } catch(e){ return null; }
  }

  function getChecks(q){
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

  function setCheck(q, idx, value){
    var store = readStore();
    var id = String(q.id);
    store[id] = store[id] || {};
    if(value) store[id][idx] = true;
    else delete store[id][idx];
    writeStore(store);
  }

  function countChecks(q){
    var checks = getChecks(q);
    return Object.keys(checks).filter(function(k){ return checks[k]; }).length;
  }

  function applyRow(row, done){
    row.classList.toggle('done', !!done);
    row.classList.toggle('open', !done);
    var dot = row.querySelector('span');
    if(dot) dot.textContent = done ? '✓' : '○';
  }

  function updateCard(card, q){
    var count = countChecks(q);
    var target = Math.max(1, parseInt(q.target, 10) || (q.steps || []).length || 1);
    var pct = Math.min(100, Math.round((count / target) * 100));
    var bar = card.querySelector('.gq284Bar i');
    var meta = card.querySelector('.gq284BarMeta span:last-child');
    if(bar) bar.style.width = pct + '%';
    if(meta) meta.textContent = pct + '% · ' + count + ' / ' + target + ' subtaken';
    card.classList.toggle('nearDone', pct >= 75);
  }

  function ensureDataAttributes(){
    var quests = [];
    try { quests = typeof window.loadGroupQuests === 'function' ? (window.loadGroupQuests() || []).filter(function(q){ return q.status !== 'completed'; }) : []; } catch(e) {}
    document.querySelectorAll('.gq284Card').forEach(function(card, cardIndex){
      var q = null;
      var id = card.getAttribute('data-gqid');
      if(id) q = findQuest(id);
      if(!q) q = quests[cardIndex] || null;
      if(!q) return;
      card.setAttribute('data-gqid', q.id);
      card.querySelectorAll('.gq284Task').forEach(function(row, idx){
        row.setAttribute('data-step-index', idx);
        var checks = getChecks(q);
        applyRow(row, !!checks[idx]);
      });
      updateCard(card, q);
    });
  }

  function handleTaskClick(ev){
    var row = ev.target && ev.target.closest ? ev.target.closest('.gq284Task[data-step-index]') : null;
    if(!row) return;
    var card = row.closest('.gq284Card[data-gqid]');
    if(!card) return;
    var q = findQuest(card.getAttribute('data-gqid'));
    if(!q) return;

    ev.preventDefault();
    ev.stopPropagation();
    if(typeof ev.stopImmediatePropagation === 'function') ev.stopImmediatePropagation();

    var idx = parseInt(row.getAttribute('data-step-index'), 10);
    var next = !getChecks(q)[idx];
    setCheck(q, idx, next);
    applyRow(row, next);
    updateCard(card, q);
    toast(next ? 'Subtaak afgevinkt ✓' : 'Subtaak heropend');
  }

  function injectEditButtons(){
    injectStyles();
    ensureDataAttributes();
    document.querySelectorAll('.gq284Card[data-gqid]').forEach(function(card){
      if(card.querySelector('.gq286Edit')) return;
      var id = card.getAttribute('data-gqid');
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'gq286Edit';
      btn.textContent = '✏️ Bewerken';
      btn.addEventListener('click', function(ev){
        ev.preventDefault();
        ev.stopPropagation();
        if(typeof ev.stopImmediatePropagation === 'function') ev.stopImmediatePropagation();
        if(typeof window.openGroupQuestEditor === 'function') window.openGroupQuestEditor(id);
        else toast('Editor nog niet geladen');
      });
      card.appendChild(btn);
    });
  }

  function install(){
    injectStyles();
    ensureDataAttributes();
    injectEditButtons();
    if(!document.__gq286TaskCapture){
      document.__gq286TaskCapture = true;
      document.addEventListener('click', handleTaskClick, true);
    }
    var root = document.getElementById('task-content');
    if(root && !root.__gq286Observer){
      root.__gq286Observer = true;
      new MutationObserver(function(){
        clearTimeout(root.__gq286Timer);
        root.__gq286Timer = setTimeout(function(){ ensureDataAttributes(); injectEditButtons(); }, 40);
      }).observe(root, { childList:true, subtree:true });
    }
  }

  var tries = 0;
  var timer = setInterval(function(){
    tries++;
    install();
    if(document.querySelector('.gq284Card') || tries > 40) clearInterval(timer);
  }, 150);

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
  else install();

  window.GroupQuestEditAndCheckboxFix = { install: install, patch: injectEditButtons };
})();
