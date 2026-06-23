'use strict';
// ============================================================
// QUEST OVERVIEW WATCHER v0.290
// Stabilized DOM integration: no carousel rebuild loops, no scroll reset,
// reversible help action remains intact.
// ============================================================

(function(){
  var PROMOTED_KEY = 'fam_promoted_group_task_ids_v001';
  var WATCHER_ID = 'quest-overview-watcher-styles';
  var lastOverviewSignature = '';
  var applyingPatch = false;
  var BG = [
    'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=92&fm=webp',
    'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=92&fm=webp',
    'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=92&fm=webp'
  ];

  function safeParse(raw, fallback){ try { return raw ? JSON.parse(raw) : fallback; } catch(e){ return fallback; } }
  function loadPromoted(){ return safeParse(localStorage.getItem(PROMOTED_KEY), []); }
  function savePromoted(ids){ localStorage.setItem(PROMOTED_KEY, JSON.stringify(Array.from(new Set(ids || [])))); }

  function injectStyles(){
    var old = document.getElementById(WATCHER_ID);
    if(old) old.remove();
    var s = document.createElement('style');
    s.id = WATCHER_ID;
    s.textContent = [
      '.gqOvSection{margin:2px 0 18px;padding:0 0 4px;max-width:100%;overflow:hidden}',
      '.gqOvHead{display:flex;align-items:center;justify-content:space-between;margin:0 0 10px;padding:0 2px}',
      '.gqOvHead h3{margin:0;font-size:16px;font-weight:950;color:#111827;letter-spacing:-.2px}',
      '.gqOvHead button{border:0;border-radius:999px;background:#edf8e9;color:#24521f;padding:7px 10px;font-size:11px;font-weight:950;cursor:pointer}',
      '.gqOvShell{position:relative;overflow:hidden;max-width:100%}',
      '.gqOvScroll{display:flex;gap:12px;overflow-x:auto!important;overflow-y:hidden!important;padding:0 2px 8px;scroll-snap-type:x proximity;-webkit-overflow-scrolling:touch;touch-action:pan-x!important;overscroll-behavior-x:contain;scroll-behavior:smooth;max-width:100%}',
      '.gqOvScroll::-webkit-scrollbar{display:none}',
      '.gqOvCard{position:relative;overflow:hidden;flex:0 0 84%;max-width:84%;min-height:160px;border:0;border-radius:24px;background-size:cover;background-position:center;color:#fff;box-shadow:0 18px 32px rgba(17,24,39,.16);scroll-snap-align:start;text-align:left;touch-action:pan-x!important;user-select:none;-webkit-user-select:none}',
      '.gqOvCard:before{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.08),rgba(0,0,0,.48) 50%,rgba(8,14,11,.86)),radial-gradient(circle at 85% 12%,rgba(255,255,255,.28),transparent 30%)}',
      '.gqOvInner{position:relative;z-index:1;min-height:160px;padding:15px;display:flex;flex-direction:column;justify-content:flex-end}',
      '.gqOvKicker{font-size:10px;font-weight:950;letter-spacing:.12em;text-transform:uppercase;color:rgba(255,255,255,.76)}',
      '.gqOvTitle{font-size:19px;font-weight:950;letter-spacing:-.35px;margin:6px 0 9px;line-height:1.05;text-shadow:0 2px 10px rgba(0,0,0,.25)}',
      '.gqOvRow{display:flex;align-items:center;gap:10px}',
      '.gqOvProg{height:7px;border-radius:999px;background:rgba(255,255,255,.20);overflow:hidden;flex:1}',
      '.gqOvProg i{display:block;height:100%;border-radius:999px;background:linear-gradient(90deg,#86efac,#c4b5fd)}',
      '.gqOvXp{background:linear-gradient(135deg,#fef3c7,#facc15);color:#2d2100;border-radius:999px;padding:6px 9px;font-size:11px;font-weight:950;white-space:nowrap}',
      '.gqOvControls{display:flex;justify-content:center;gap:8px;margin-top:6px}',
      '.gqOvControls button{width:34px;height:28px;border-radius:999px;border:0;background:#fff;color:#315f2c;font-size:16px;font-weight:950;box-shadow:0 6px 14px rgba(17,24,39,.08);cursor:pointer}',
      '.fqCard{position:relative}',
      '.fqCard .fqBody{padding-right:16px}',
      '.fqHelpMini2{position:static;display:inline-flex;align-items:center;justify-content:center;gap:4px;border:0;border-radius:999px;background:#edf8e9;color:#315f2c;padding:5px 9px;font-size:10px;font-weight:950;box-shadow:none;cursor:pointer;margin-top:7px;max-width:max-content}',
      '.fqCard.group-promoted{outline:2px solid rgba(109,40,217,.24);box-shadow:0 12px 30px rgba(109,40,217,.10)}',
      '.fqCard.group-promoted .fqHelpMini2{background:linear-gradient(135deg,#315f2c,#6d28d9);color:#fff}',
      '.fqGroupBadge2{display:inline-flex;align-items:center;gap:4px;background:linear-gradient(135deg,#315f2c,#6d28d9);color:#fff;border-radius:999px;padding:4px 8px;font-size:10px;font-weight:950;margin-left:6px;vertical-align:middle}',
      '@media(max-width:420px){.gqOvCard{flex-basis:88%;max-width:88%}.fqHelpMini2{font-size:9.5px;padding:5px 8px}}'
    ].join('');
    document.head.appendChild(s);
  }

  function isOverviewActive(){ var active = document.querySelector('.task-tabs .ttab.active'); if(!active) return true; return /overzicht/i.test(active.textContent || ''); }
  function pickBg(q, index){ var text = ((q.title || '') + ' ' + (q.description || '')).toLowerCase(); if(text.indexOf('boodschap') > -1) return BG[2]; if(text.indexOf('reset') > -1 || text.indexOf('schoon') > -1 || text.indexOf('was') > -1) return BG[0]; return q.background || BG[index % BG.length]; }
  function rewardTotal(q){ if(typeof window.getGroupQuestReward === 'function') return window.getGroupQuestReward(q).total; return q.xp || 0; }
  function openGroupTab(){ var btn = document.querySelector('.gq-tab'); if(typeof window.setTaskTab === 'function') window.setTaskTab('groupquests', btn); }

  function getOpenGroupQuests(){ if(typeof window.loadGroupQuests !== 'function') return []; return window.loadGroupQuests().filter(function(q){ return q.status !== 'completed'; }); }
  function getSignature(){ return JSON.stringify(getOpenGroupQuests().slice(0,5).map(function(q){ return [q.id,q.title,q.progress,q.target,(q.members||[]).length,q.status]; })); }

  function scrollGqCarousel(dir){
    var scroller = document.querySelector('.gqOvScroll');
    if(!scroller) return;
    var card = scroller.querySelector('.gqOvCard');
    var amount = card ? Math.round(card.getBoundingClientRect().width + 12) : Math.round(scroller.clientWidth * 0.86);
    scroller.scrollBy({ left: amount * dir, behavior: 'smooth' });
  }
  window.scrollGqCarousel = scrollGqCarousel;

  function buildGroupOverview(){
    var quests = getOpenGroupQuests();
    if(!quests.length) return null;
    var section = document.createElement('section');
    section.id = 'gq-overview-section';
    section.className = 'gqOvSection';
    var head = document.createElement('div');
    head.className = 'gqOvHead';
    head.innerHTML = '<h3>⚔️ Actieve group quests</h3>';
    var allBtn = document.createElement('button');
    allBtn.textContent = 'Bekijk alles';
    allBtn.onclick = openGroupTab;
    head.appendChild(allBtn);
    section.appendChild(head);

    var shell = document.createElement('div');
    shell.className = 'gqOvShell';
    var scroll = document.createElement('div');
    scroll.className = 'gqOvScroll';
    quests.slice(0,5).forEach(function(q, index){
      var pct = Math.min(100, Math.round(((q.progress || 0) / Math.max(1, q.target || 1)) * 100));
      var card = document.createElement('button');
      card.className = 'gqOvCard';
      card.type = 'button';
      card.style.backgroundImage = 'url(' + pickBg(q, index) + ')';
      card.addEventListener('click', function(ev){
        if(Math.abs((scroll.dataset.dragDelta || 0)) > 8) return;
        openGroupTab(ev);
      });
      card.innerHTML = '<div class="gqOvInner"><div class="gqOvKicker">⚔️ Group Quest · '+((q.members||[]).length)+' joined</div><div class="gqOvTitle">'+q.title+'</div><div class="gqOvRow"><div class="gqOvProg"><i style="width:'+pct+'%"></i></div><span class="gqOvXp">'+rewardTotal(q)+' XP</span></div></div>';
      scroll.appendChild(card);
    });
    shell.appendChild(scroll);
    section.appendChild(shell);
    if(quests.length > 1){
      var controls = document.createElement('div');
      controls.className = 'gqOvControls';
      controls.innerHTML = '<button type="button" data-gq-scroll="-1">‹</button><button type="button" data-gq-scroll="1">›</button>';
      section.appendChild(controls);
    }
    section.addEventListener('click', function(ev){
      var btn = ev.target.closest('[data-gq-scroll]');
      if(!btn) return;
      ev.preventDefault();
      ev.stopPropagation();
      scrollGqCarousel(parseInt(btn.getAttribute('data-gq-scroll'),10));
    });
    var startX = 0;
    scroll.addEventListener('touchstart', function(ev){ startX = ev.touches[0].clientX; scroll.dataset.dragDelta = 0; }, { passive:true });
    scroll.addEventListener('touchmove', function(ev){ scroll.dataset.dragDelta = Math.abs(ev.touches[0].clientX - startX); }, { passive:true });
    return section;
  }

  function removeGroupQuestForSource(sourceTaskId){ if(typeof window.loadGroupQuests !== 'function' || typeof window.saveGroupQuests !== 'function') return; var quests = window.loadGroupQuests().filter(function(q){ return q.sourceTaskId !== sourceTaskId; }); window.saveGroupQuests(quests); }
  function unpromoteCard(card){ var id = card.getAttribute('data-id') || ''; savePromoted(loadPromoted().filter(function(x){ return x !== id; })); removeGroupQuestForSource(id); card.classList.remove('group-promoted'); var badge = card.querySelector('.fqGroupBadge2'); if(badge) badge.remove(); var btn = card.querySelector('.fqHelpMini2'); if(btn) btn.textContent = '⚔️ Vraag hulp'; if(typeof window.showToast === 'function') window.showToast('Hulpvraag ingetrokken'); lastOverviewSignature=''; applyOverviewPatch(true); }
  function promoteCard(card){
    if(!card || typeof window.loadGroupQuests !== 'function' || typeof window.saveGroupQuests !== 'function') return;
    var id = card.getAttribute('data-id') || ('task-' + Date.now());
    var promoted = loadPromoted();
    if(promoted.indexOf(id) > -1){ unpromoteCard(card); return; }
    var titleEl = card.querySelector('.fqTitle'); var descEl = card.querySelector('.fqDesc'); var imgEl = card.querySelector('.fqImg');
    var title = titleEl ? titleEl.textContent.replace('Group','').trim() : 'Nieuwe group quest';
    var desc = descEl ? descEl.textContent.trim() : 'Hulp gevraagd vanuit het takenoverzicht.';
    var bg = ''; if(imgEl) bg = (imgEl.style.backgroundImage || '').replace(/^url\(["']?/, '').replace(/["']?\)$/, '');
    var quests = window.loadGroupQuests();
    quests.unshift({ id:'gq-from-overview-'+id+'-'+Date.now(), sourceTaskId:id, title:title, description:desc, type:'task', status:'open', target:3, progress:0, xp:120, coinReward:20, multiplier:1.12, background:bg || pickBg({title:title,description:desc},0), deadline:new Date().toISOString().slice(0,10), members:[{id:'shane',status:'joined',contribution:0}], invitedMemberIds:['esra'], helpRequested:true, steps:['Hulp accepteren','Taak verdelen','Samen afronden'] });
    window.saveGroupQuests(quests); promoted.push(id); savePromoted(promoted);
    if(typeof window.addActivity === 'function') window.addActivity('⚔️','#ede9fe','Hulp gevraagd voor "'+title+'"');
    if(typeof window.showToast === 'function') window.showToast('Group quest aangemaakt ⚔️');
    lastOverviewSignature=''; applyOverviewPatch(true);
  }

  function addHelpButton(card, promoted){ var body = card.querySelector('.fqBody') || card; var btn = card.querySelector('.fqHelpMini2'); if(!btn){ btn = document.createElement('button'); btn.className='fqHelpMini2'; btn.type='button'; btn.addEventListener('click', function(ev){ ev.preventDefault(); ev.stopPropagation(); promoteCard(card); }); body.appendChild(btn); } var id=card.getAttribute('data-id')||''; btn.textContent = promoted.indexOf(id)>-1 ? '⚔️ Hulp gevraagd · intrekken' : '⚔️ Vraag hulp'; }
  function augmentCards(){ var promoted = loadPromoted(); document.querySelectorAll('#task-content .fqCard').forEach(function(card){ var id=card.getAttribute('data-id')||''; addHelpButton(card,promoted); if(promoted.indexOf(id)>-1){ card.classList.add('group-promoted'); var title=card.querySelector('.fqTitle'); if(title && !title.querySelector('.fqGroupBadge2')){ var badge=document.createElement('span'); badge.className='fqGroupBadge2'; badge.textContent='Group'; title.appendChild(badge); } } else { card.classList.remove('group-promoted'); var oldBadge=card.querySelector('.fqGroupBadge2'); if(oldBadge) oldBadge.remove(); } }); }

  function applyOverviewPatch(force){
    if(applyingPatch) return;
    injectStyles();
    if(!isOverviewActive()) return;
    var root = document.getElementById('task-content'); if(!root) return;
    var fq = root.querySelector('.fq'); if(!fq) return;
    applyingPatch = true;
    try{
      var sig = getSignature();
      var existing = root.querySelector('#gq-overview-section');
      if(force || sig !== lastOverviewSignature || !existing){
        var prevScroll = existing ? (existing.querySelector('.gqOvScroll') || {}).scrollLeft || 0 : 0;
        if(existing) existing.remove();
        var block = buildGroupOverview();
        if(block){ var stats = fq.querySelector('.fqStats'); if(stats && stats.parentNode) stats.parentNode.insertBefore(block, stats.nextSibling); else fq.insertBefore(block, fq.firstChild); var sc = block.querySelector('.gqOvScroll'); if(sc) sc.scrollLeft = prevScroll; }
        lastOverviewSignature = sig;
      }
      augmentCards();
    } finally { applyingPatch = false; }
  }

  function boot(){
    injectStyles();
    applyOverviewPatch(true);
    var root = document.getElementById('task-content');
    if(root && !window.__questOverviewWatcherObserver){
      window.__questOverviewWatcherObserver = new MutationObserver(function(mutations){
        if(applyingPatch) return;
        var relevant = mutations.some(function(m){
          if(m.target && m.target.closest && m.target.closest('#gq-overview-section')) return false;
          return true;
        });
        if(!relevant) return;
        clearTimeout(window.__questOverviewWatcherTimer);
        window.__questOverviewWatcherTimer = setTimeout(function(){ applyOverviewPatch(false); }, 180);
      });
      window.__questOverviewWatcherObserver.observe(root, { childList:true, subtree:true });
    }
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
  setTimeout(boot,300);
  window.addEventListener('familyapp:group-quests-updated', function(){ lastOverviewSignature=''; setTimeout(function(){ applyOverviewPatch(true); }, 80); });
})();
