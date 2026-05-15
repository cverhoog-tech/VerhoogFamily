'use strict';
// ============================================================
// QUEST OVERVIEW INTEGRATION v0.275
// Shows group quests inside the normal Taken > Overzicht flow and
// adds a first safe "Vraag hulp" action to existing quest cards.
// ============================================================

(function(){
  var PROMOTED_KEY = 'fam_promoted_group_task_ids_v001';
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

  function pickBg(q, i){
    var t = ((q.title || '') + ' ' + (q.description || '')).toLowerCase();
    if(t.indexOf('boodschap') > -1) return BG[2];
    if(t.indexOf('reset') > -1 || t.indexOf('schoon') > -1) return BG[0];
    return q.background || BG[i % BG.length];
  }

  function injectStyles(){
    if(document.getElementById('quest-overview-integration-styles')) return;
    var s = document.createElement('style');
    s.id = 'quest-overview-integration-styles';
    s.textContent = [
      '.gq-overview-section{padding:0 0 14px;margin:0 0 8px}',
      '.gq-overview-head{display:flex;align-items:center;justify-content:space-between;margin:0 2px 10px}',
      '.gq-overview-head h3{margin:0;font-size:15px;font-weight:950;color:#111827;letter-spacing:-.2px}',
      '.gq-overview-head button{border:0;background:#edf8e9;color:#24521f;border-radius:999px;padding:7px 10px;font-size:11px;font-weight:900;cursor:pointer}',
      '.gq-overview-scroll{display:flex;gap:10px;overflow-x:auto;padding:0 2px 5px;scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch}',
      '.gq-overview-scroll::-webkit-scrollbar{display:none}',
      '.gq-overview-card{position:relative;overflow:hidden;flex:0 0 82%;min-height:158px;border-radius:24px;background-size:cover;background-position:center;scroll-snap-align:start;color:#fff;box-shadow:0 18px 32px rgba(17,24,39,.16);isolation:isolate}',
      '.gq-overview-card:before{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.10),rgba(0,0,0,.45) 48%,rgba(8,14,11,.86)),radial-gradient(circle at 85% 12%,rgba(255,255,255,.28),transparent 30%);z-index:0}',
      '.gq-overview-inner{position:relative;z-index:1;min-height:158px;padding:15px;display:flex;flex-direction:column;justify-content:flex-end}',
      '.gq-overview-kicker{font-size:10px;font-weight:950;letter-spacing:.12em;text-transform:uppercase;color:rgba(255,255,255,.76)}',
      '.gq-overview-title{font-size:18px;font-weight:950;letter-spacing:-.35px;margin:5px 0 8px;line-height:1.05;text-shadow:0 2px 10px rgba(0,0,0,.25)}',
      '.gq-overview-row{display:flex;align-items:center;justify-content:space-between;gap:10px}',
      '.gq-overview-progress{height:7px;border-radius:999px;background:rgba(255,255,255,.20);overflow:hidden;flex:1}',
      '.gq-overview-progress i{display:block;height:100%;border-radius:999px;background:linear-gradient(90deg,#86efac,#c4b5fd)}',
      '.gq-overview-xp{background:linear-gradient(135deg,#fef3c7,#facc15);color:#2d2100;border-radius:999px;padding:6px 9px;font-size:11px;font-weight:950;white-space:nowrap}',
      '.fqCard.group-promoted{outline:2px solid rgba(109,40,217,.25);box-shadow:0 12px 30px rgba(109,40,217,.10)}',
      '.fqGroupBadge{display:inline-flex;align-items:center;gap:4px;background:linear-gradient(135deg,#315f2c,#6d28d9);color:#fff;border-radius:999px;padding:4px 8px;font-size:10px;font-weight:950;letter-spacing:.03em;margin-left:6px}',
      '.fqHelpMini{position:absolute;right:38px;top:9px;z-index:3;border:0;border-radius:999px;background:rgba(255,255,255,.92);color:#315f2c;padding:6px 9px;font-size:10px;font-weight:950;box-shadow:0 7px 16px rgba(17,24,39,.12);cursor:pointer;backdrop-filter:blur(10px)}',
      '.fqCard.group-promoted .fqHelpMini{background:linear-gradient(135deg,#315f2c,#6d28d9);color:#fff}',
      '@media(max-width:420px){.gq-overview-card{flex-basis:88%}.fqHelpMini{right:36px;top:8px;padding:5px 8px}}'
    ].join('');
    document.head.appendChild(s);
  }

  function getOpenGroupQuests(){
    if(typeof window.loadGroupQuests !== 'function') return [];
    return window.loadGroupQuests().filter(function(q){ return q.status !== 'completed'; });
  }

  function rewardTotal(q){
    if(typeof window.getGroupQuestReward === 'function') return window.getGroupQuestReward(q).total;
    return q.xp || 0;
  }

  function renderOverviewGroupBlock(){
    var quests = getOpenGroupQuests();
    if(!quests.length) return '';
    var cards = quests.slice(0, 5).map(function(q, i){
      var pct = Math.min(100, Math.round(((q.progress || 0) / Math.max(1, q.target || 1)) * 100));
      return '<button class="gq-overview-card" onclick="setTaskTab(\'groupquests\',document.querySelector(\'.gq-tab\'))" style="background-image:url('+pickBg(q, i)+')">'
        + '<div class="gq-overview-inner">'
        + '<div class="gq-overview-kicker">⚔️ Group Quest · '+((q.members||[]).length)+' joined</div>'
        + '<div class="gq-overview-title">'+q.title+'</div>'
        + '<div class="gq-overview-row"><div class="gq-overview-progress"><i style="width:'+pct+'%"></i></div><span class="gq-overview-xp">'+rewardTotal(q)+' XP</span></div>'
        + '</div></button>';
    }).join('');
    return '<section class="gq-overview-section" id="gq-overview-section">'
      + '<div class="gq-overview-head"><h3>⚔️ Actieve group quests</h3><button onclick="setTaskTab(\'groupquests\',document.querySelector(\'.gq-tab\'))">Bekijk alles</button></div>'
      + '<div class="gq-overview-scroll">'+cards+'</div>'
      + '</section>';
  }

  function promoteCardToGroupQuest(card){
    if(!card || typeof window.loadGroupQuests !== 'function' || typeof window.saveGroupQuests !== 'function') return;
    var legacyId = card.getAttribute('data-id') || String(Date.now());
    var promoted = loadPromoted();
    if(promoted.indexOf(legacyId) > -1){
      if(typeof showToast === 'function') showToast('Deze quest is al als group quest gemarkeerd.');
      return;
    }
    var titleEl = card.querySelector('.fqTitle');
    var descEl = card.querySelector('.fqDesc');
    var imgEl = card.querySelector('.fqImg');
    var bg = '';
    if(imgEl){
      bg = (imgEl.style.backgroundImage || '').replace(/^url\(["']?/, '').replace(/["']?\)$/, '');
    }
    var title = titleEl ? titleEl.textContent.trim() : 'Nieuwe group quest';
    var desc = descEl ? descEl.textContent.trim() : 'Hulp gevraagd vanuit het takenoverzicht.';
    var quests = window.loadGroupQuests();
    quests.unshift({
      id: 'gq-from-task-' + legacyId + '-' + Date.now(),
      sourceTaskId: legacyId,
      title: title,
      description: desc,
      type: 'task',
      status: 'open',
      target: 3,
      progress: 0,
      xp: 160,
      coinReward: 20,
      multiplier: 1.12,
      background: bg || pickBg({title:title,description:desc}, 0),
      deadline: new Date().toISOString().slice(0,10),
      members: [{ id: 'shane', status: 'joined', contribution: 0 }],
      invitedMemberIds: ['esra'],
      helpRequested: true,
      steps: ['Hulp accepteren', 'Taak verdelen', 'Samen afronden']
    });
    window.saveGroupQuests(quests);
    promoted.push(legacyId);
    savePromoted(promoted);
    if(window.QuestAdapter && typeof window.QuestAdapter.convertLegacyTaskToGroup === 'function'){
      window.QuestAdapter.convertLegacyTaskToGroup(legacyId, ['esra']);
    }
    if(typeof addActivity === 'function') addActivity('⚔️','#ede9fe','Hulp gevraagd voor "'+title+'"');
    if(typeof showToast === 'function') showToast('Group quest aangemaakt ⚔️');
    augmentOverview();
  }

  function augmentExistingCards(){
    var promoted = loadPromoted();
    document.querySelectorAll('#task-content .fqCard').forEach(function(card){
      var id = card.getAttribute('data-id') || '';
      if(!card.querySelector('.fqHelpMini')){
        var btn = document.createElement('button');
        btn.className = 'fqHelpMini';
        btn.textContent = promoted.indexOf(id) > -1 ? '⚔️ Hulp gevraagd' : '⚔️ Vraag hulp';
        btn.onclick = function(ev){
          ev.stopPropagation();
          promoteCardToGroupQuest(card);
        };
        card.appendChild(btn);
      }
      if(promoted.indexOf(id) > -1){
        card.classList.add('group-promoted');
        var title = card.querySelector('.fqTitle');
        if(title && !title.querySelector('.fqGroupBadge')){
          var badge = document.createElement('span');
          badge.className = 'fqGroupBadge';
          badge.textContent = 'Group';
          title.appendChild(badge);
        }
      }
    });
  }

  function augmentOverview(){
    injectStyles();
    if(window.taskTab && window.taskTab !== 'overzicht') return;
    var root = document.getElementById('task-content');
    if(!root) return;
    var fq = root.querySelector('.fq');
    if(!fq) return;
    var existing = root.querySelector('#gq-overview-section');
    if(existing) existing.remove();
    var block = renderOverviewGroupBlock();
    if(block){
      var stats = fq.querySelector('.fqStats');
      if(stats) stats.insertAdjacentHTML('afterend', block);
      else fq.insertAdjacentHTML('afterbegin', block);
    }
    augmentExistingCards();
  }

  function install(){
    injectStyles();
    if(window.__questOverviewIntegrationInstalled || typeof window.renderTasks !== 'function') return;
    window.__questOverviewIntegrationInstalled = true;
    var previous = window.renderTasks;
    window.renderTasks = function(){
      var result = previous.apply(this, arguments);
      setTimeout(augmentOverview, 80);
      return result;
    };
    setTimeout(augmentOverview, 150);
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
  else install();
  setTimeout(install, 500);
  window.addEventListener('familyapp:group-quests-updated', function(){ setTimeout(augmentOverview, 80); });
})();
