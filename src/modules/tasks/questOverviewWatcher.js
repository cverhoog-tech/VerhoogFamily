'use strict';
// ============================================================
// QUEST OVERVIEW WATCHER v0.276
// Robust DOM-level integration for the v023 quest overlay.
// This avoids fragile render wrapper timing.
// ============================================================

(function(){
  var PROMOTED_KEY = 'fam_promoted_group_task_ids_v001';
  var WATCHER_ID = 'quest-overview-watcher-styles';
  var BG = [
    'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=92&fm=webp',
    'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=92&fm=webp',
    'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=92&fm=webp'
  ];

  function safeParse(raw, fallback){
    try { return raw ? JSON.parse(raw) : fallback; }
    catch(e){ return fallback; }
  }

  function loadPromoted(){
    return safeParse(localStorage.getItem(PROMOTED_KEY), []);
  }

  function savePromoted(ids){
    localStorage.setItem(PROMOTED_KEY, JSON.stringify(Array.from(new Set(ids || []))));
  }

  function injectStyles(){
    if(document.getElementById(WATCHER_ID)) return;
    var s = document.createElement('style');
    s.id = WATCHER_ID;
    s.textContent = [
      '.gqOvSection{margin:2px 0 18px;padding:0 0 4px}',
      '.gqOvHead{display:flex;align-items:center;justify-content:space-between;margin:0 0 10px;padding:0 2px}',
      '.gqOvHead h3{margin:0;font-size:16px;font-weight:950;color:#111827;letter-spacing:-.2px}',
      '.gqOvHead button{border:0;border-radius:999px;background:#edf8e9;color:#24521f;padding:7px 10px;font-size:11px;font-weight:950;cursor:pointer}',
      '.gqOvScroll{display:flex;gap:10px;overflow-x:auto;padding:0 2px 6px;scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch}',
      '.gqOvScroll::-webkit-scrollbar{display:none}',
      '.gqOvCard{position:relative;overflow:hidden;flex:0 0 86%;min-height:160px;border:0;border-radius:24px;background-size:cover;background-position:center;color:#fff;box-shadow:0 18px 32px rgba(17,24,39,.16);scroll-snap-align:start;text-align:left}',
      '.gqOvCard:before{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.08),rgba(0,0,0,.48) 50%,rgba(8,14,11,.86)),radial-gradient(circle at 85% 12%,rgba(255,255,255,.28),transparent 30%)}',
      '.gqOvInner{position:relative;z-index:1;min-height:160px;padding:15px;display:flex;flex-direction:column;justify-content:flex-end}',
      '.gqOvKicker{font-size:10px;font-weight:950;letter-spacing:.12em;text-transform:uppercase;color:rgba(255,255,255,.76)}',
      '.gqOvTitle{font-size:19px;font-weight:950;letter-spacing:-.35px;margin:6px 0 9px;line-height:1.05;text-shadow:0 2px 10px rgba(0,0,0,.25)}',
      '.gqOvRow{display:flex;align-items:center;gap:10px}',
      '.gqOvProg{height:7px;border-radius:999px;background:rgba(255,255,255,.20);overflow:hidden;flex:1}',
      '.gqOvProg i{display:block;height:100%;border-radius:999px;background:linear-gradient(90deg,#86efac,#c4b5fd)}',
      '.gqOvXp{background:linear-gradient(135deg,#fef3c7,#facc15);color:#2d2100;border-radius:999px;padding:6px 9px;font-size:11px;font-weight:950;white-space:nowrap}',
      '.fqCard{position:relative}',
      '.fqHelpMini2{position:absolute;right:38px;top:9px;z-index:5;border:0;border-radius:999px;background:rgba(255,255,255,.94);color:#315f2c;padding:6px 9px;font-size:10px;font-weight:950;box-shadow:0 7px 16px rgba(17,24,39,.12);cursor:pointer;backdrop-filter:blur(10px)}',
      '.fqCard.group-promoted{outline:2px solid rgba(109,40,217,.24);box-shadow:0 12px 30px rgba(109,40,217,.10)}',
      '.fqCard.group-promoted .fqHelpMini2{background:linear-gradient(135deg,#315f2c,#6d28d9);color:#fff}',
      '.fqGroupBadge2{display:inline-flex;align-items:center;gap:4px;background:linear-gradient(135deg,#315f2c,#6d28d9);color:#fff;border-radius:999px;padding:4px 8px;font-size:10px;font-weight:950;margin-left:6px;vertical-align:middle}',
      '@media(max-width:420px){.gqOvCard{flex-basis:90%}.fqHelpMini2{right:34px;top:8px}}'
    ].join('');
    document.head.appendChild(s);
  }

  function isOverviewActive(){
    var active = document.querySelector('.task-tabs .ttab.active');
    if(!active) return true;
    return /overzicht/i.test(active.textContent || '');
  }

  function pickBg(q, index){
    var text = ((q.title || '') + ' ' + (q.description || '')).toLowerCase();
    if(text.indexOf('boodschap') > -1) return BG[2];
    if(text.indexOf('reset') > -1 || text.indexOf('schoon') > -1 || text.indexOf('was') > -1) return BG[0];
    return q.background || BG[index % BG.length];
  }

  function rewardTotal(q){
    if(typeof window.getGroupQuestReward === 'function') return window.getGroupQuestReward(q).total;
    return q.xp || 0;
  }

  function openGroupTab(){
    var btn = document.querySelector('.gq-tab');
    if(typeof window.setTaskTab === 'function') window.setTaskTab('groupquests', btn);
  }

  function buildGroupOverview(){
    if(typeof window.loadGroupQuests !== 'function') return null;
    var quests = window.loadGroupQuests().filter(function(q){ return q.status !== 'completed'; });
    if(!quests.length) return null;

    var section = document.createElement('section');
    section.id = 'gq-overview-section';
    section.className = 'gqOvSection';

    var head = document.createElement('div');
    head.className = 'gqOvHead';
    var h = document.createElement('h3');
    h.textContent = '⚔️ Actieve group quests';
    var allBtn = document.createElement('button');
    allBtn.textContent = 'Bekijk alles';
    allBtn.onclick = openGroupTab;
    head.appendChild(h);
    head.appendChild(allBtn);
    section.appendChild(head);

    var scroll = document.createElement('div');
    scroll.className = 'gqOvScroll';

    quests.slice(0, 5).forEach(function(q, index){
      var pct = Math.min(100, Math.round(((q.progress || 0) / Math.max(1, q.target || 1)) * 100));
      var card = document.createElement('button');
      card.className = 'gqOvCard';
      card.style.backgroundImage = 'url(' + pickBg(q, index) + ')';
      card.onclick = openGroupTab;
      card.innerHTML = '<div class="gqOvInner"><div class="gqOvKicker">⚔️ Group Quest · '+((q.members||[]).length)+' joined</div><div class="gqOvTitle">'+q.title+'</div><div class="gqOvRow"><div class="gqOvProg"><i style="width:'+pct+'%"></i></div><span class="gqOvXp">'+rewardTotal(q)+' XP</span></div></div>';
      scroll.appendChild(card);
    });

    section.appendChild(scroll);
    return section;
  }

  function promoteCard(card){
    if(!card || typeof window.loadGroupQuests !== 'function' || typeof window.saveGroupQuests !== 'function') return;
    var id = card.getAttribute('data-id') || ('task-' + Date.now());
    var promoted = loadPromoted();
    if(promoted.indexOf(id) > -1){
      if(typeof window.showToast === 'function') window.showToast('Hulp is al gevraagd voor deze quest.');
      return;
    }

    var titleEl = card.querySelector('.fqTitle');
    var descEl = card.querySelector('.fqDesc');
    var imgEl = card.querySelector('.fqImg');
    var title = titleEl ? titleEl.textContent.replace('Group','').trim() : 'Nieuwe group quest';
    var desc = descEl ? descEl.textContent.trim() : 'Hulp gevraagd vanuit het takenoverzicht.';
    var bg = '';
    if(imgEl) bg = (imgEl.style.backgroundImage || '').replace(/^url\(["']?/, '').replace(/["']?\)$/, '');

    var quests = window.loadGroupQuests();
    quests.unshift({
      id: 'gq-from-overview-' + id + '-' + Date.now(),
      sourceTaskId: id,
      title: title,
      description: desc,
      type: 'task',
      status: 'open',
      target: 3,
      progress: 0,
      xp: 160,
      coinReward: 20,
      multiplier: 1.12,
      background: bg || pickBg({ title: title, description: desc }, 0),
      deadline: new Date().toISOString().slice(0,10),
      members: [{ id: 'shane', status: 'joined', contribution: 0 }],
      invitedMemberIds: ['esra'],
      helpRequested: true,
      steps: ['Hulp accepteren', 'Taak verdelen', 'Samen afronden']
    });
    window.saveGroupQuests(quests);
    promoted.push(id);
    savePromoted(promoted);
    if(typeof window.addActivity === 'function') window.addActivity('⚔️','#ede9fe','Hulp gevraagd voor "'+title+'"');
    if(typeof window.showToast === 'function') window.showToast('Group quest aangemaakt ⚔️');
    applyOverviewPatch(true);
  }

  function augmentCards(){
    var promoted = loadPromoted();
    document.querySelectorAll('#task-content .fqCard').forEach(function(card){
      var id = card.getAttribute('data-id') || '';
      if(!card.querySelector('.fqHelpMini2')){
        var btn = document.createElement('button');
        btn.className = 'fqHelpMini2';
        btn.textContent = promoted.indexOf(id) > -1 ? '⚔️ Hulp gevraagd' : '⚔️ Vraag hulp';
        btn.addEventListener('click', function(ev){
          ev.preventDefault();
          ev.stopPropagation();
          promoteCard(card);
        });
        card.appendChild(btn);
      }
      if(promoted.indexOf(id) > -1){
        card.classList.add('group-promoted');
        var title = card.querySelector('.fqTitle');
        if(title && !title.querySelector('.fqGroupBadge2')){
          var badge = document.createElement('span');
          badge.className = 'fqGroupBadge2';
          badge.textContent = 'Group';
          title.appendChild(badge);
        }
      }
    });
  }

  function applyOverviewPatch(force){
    injectStyles();
    if(!isOverviewActive()) return;
    var root = document.getElementById('task-content');
    if(!root) return;
    var fq = root.querySelector('.fq');
    if(!fq) return;

    var existing = root.querySelector('#gq-overview-section');
    if(existing) existing.remove();

    var block = buildGroupOverview();
    if(block){
      var stats = fq.querySelector('.fqStats');
      if(stats && stats.parentNode) stats.parentNode.insertBefore(block, stats.nextSibling);
      else fq.insertBefore(block, fq.firstChild);
    }
    augmentCards();
  }

  function boot(){
    injectStyles();
    applyOverviewPatch(true);
    var root = document.getElementById('task-content');
    if(root && !window.__questOverviewWatcherObserver){
      window.__questOverviewWatcherObserver = new MutationObserver(function(){
        clearTimeout(window.__questOverviewWatcherTimer);
        window.__questOverviewWatcherTimer = setTimeout(applyOverviewPatch, 60);
      });
      window.__questOverviewWatcherObserver.observe(root, { childList: true, subtree: true });
    }
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
  setTimeout(boot, 300);
  setTimeout(boot, 900);
  window.addEventListener('familyapp:group-quests-updated', function(){ setTimeout(applyOverviewPatch, 60); });
})();
