'use strict';
// ============================================================
// GROUP QUESTS PREMIUM UX v0.302
// Dedicated group gameplay card renderer.
// Uses fixed epic background pools and migrates legacy weekly -> dungeon.
// ============================================================

(function(){
  var FALLBACK_RAID = [
    'https://images.unsplash.com/photo-1518709268805-4e9042af2176?auto=format&fit=crop&w=1400&q=92&fm=webp',
    'https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=1400&q=92&fm=webp',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=92&fm=webp'
  ];
  var FALLBACK_GROUP = [
    'https://images.unsplash.com/photo-1522163182402-834f871fd851?auto=format&fit=crop&w=1400&q=92&fm=webp',
    'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1400&q=92&fm=webp',
    'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=92&fm=webp'
  ];

  function normalizeType(type){
    if(type === 'weekly' || type === 'task') return 'dungeon';
    return type || 'dungeon';
  }

  function seedIndex(q, list){
    var key = String((q && (q.id || q.title)) || 'quest');
    var seed = key.split('').reduce(function(sum, ch){ return sum + ch.charCodeAt(0); }, 0);
    return Math.abs(seed) % list.length;
  }

  function pickBg(q){
    var type = normalizeType(q.type);
    var quest = Object.assign({}, q, { type: type, questType: type, partyType: 'group', autoBackground: true, background: '' });
    if(window.EpicHeroBackgrounds && typeof window.EpicHeroBackgrounds.getHeroBackground === 'function'){
      return window.EpicHeroBackgrounds.getHeroBackground(quest);
    }
    var pool = (type === 'raid' || type === 'dungeon') ? FALLBACK_RAID : FALLBACK_GROUP;
    return pool[seedIndex(q, pool)];
  }

  function typeLabel(type){
    type = normalizeType(type);
    return ({ team:'Team Quest', adventure:'Adventure', dungeon:'Dungeon', raid:'Raid' })[type] || 'Dungeon';
  }

  function injectPremiumStyles(){
    var old = document.getElementById('group-quests-premium-styles');
    if(old) old.remove();
    var s = document.createElement('style');
    s.id = 'group-quests-premium-styles';
    s.textContent = [
      '.group-quests-view.premium{padding:14px 12px 116px;background:radial-gradient(circle at 10% 0%,#eef8ea 0,#f7faf6 34%,#f8fafc 100%);min-height:100%;overflow-x:hidden}',
      '.gq-hero{position:relative;overflow:hidden;border-radius:28px;padding:22px;min-height:164px;display:flex;justify-content:space-between;gap:16px;align-items:flex-end;color:#fff;background:linear-gradient(135deg,rgba(16,24,39,.96),rgba(49,95,44,.92) 48%,rgba(109,40,217,.86)),url(https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=90&fm=webp) center/cover;box-shadow:0 22px 44px rgba(31,41,55,.22);isolation:isolate}',
      '.gq-hero:before{content:"";position:absolute;inset:0;background:radial-gradient(circle at top right,rgba(255,255,255,.30),transparent 34%),linear-gradient(180deg,transparent,rgba(0,0,0,.22));pointer-events:none}.gq-hero>*{position:relative;z-index:1}.gq-hero p{margin:0 0 7px;font-size:11px;font-weight:950;letter-spacing:.14em;opacity:.76}.gq-hero h2{margin:0;font-size:29px;letter-spacing:-.7px;line-height:1}.gq-hero span{display:block;margin-top:8px;font-size:13px;line-height:1.35;opacity:.86;max-width:230px}.gq-hero button{border:0;border-radius:999px;background:rgba(255,255,255,.94);color:#173e17;padding:12px 15px;font-size:13px;font-weight:950;white-space:nowrap;box-shadow:0 10px 22px rgba(0,0,0,.22);cursor:pointer;backdrop-filter:blur(12px)}',
      '.gq-summary-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:9px;margin:13px 0 14px}.gq-summary-grid div{background:rgba(255,255,255,.82);backdrop-filter:blur(14px);border:1px solid rgba(225,234,220,.9);border-radius:20px;padding:12px 8px;text-align:center;box-shadow:0 8px 20px rgba(17,24,39,.055)}.gq-summary-grid b{display:block;font-size:21px;color:#111827}.gq-summary-grid span{display:block;margin-top:3px;font-size:9px;text-transform:uppercase;letter-spacing:.08em;font-weight:900;color:#6b7280}',
      '.gq-card.premium{position:relative;overflow:hidden;border:0;border-radius:28px;margin-bottom:14px;min-height:330px;background-size:cover;background-position:center;box-shadow:0 24px 44px rgba(17,24,39,.18),0 2px 0 rgba(255,255,255,.55) inset;isolation:isolate;transform:translateZ(0)}',
      '.gq-card.premium.completed{opacity:.78}.gq-card-shade{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.08),rgba(0,0,0,.44) 38%,rgba(12,18,16,.88)),radial-gradient(circle at 82% 10%,rgba(255,255,255,.26),transparent 28%);z-index:0}.gq-card-content{position:relative;z-index:1;min-height:330px;display:flex;flex-direction:column;justify-content:flex-end;padding:18px;color:#fff}',
      '.gq-card-top{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;margin-bottom:9px}.gq-card h3{margin:5px 0 0;font-size:24px;color:#fff;letter-spacing:-.55px;line-height:1.05;text-shadow:0 2px 10px rgba(0,0,0,.24)}.gq-card p{margin:0 0 13px;font-size:13px;line-height:1.42;color:rgba(255,255,255,.82);max-width:94%}',
      '.gq-card strong{background:linear-gradient(135deg,#fef3c7,#facc15);color:#2d2100;border-radius:999px;padding:8px 11px;font-size:12px;white-space:nowrap;box-shadow:0 9px 18px rgba(250,204,21,.24)}.gq-type{display:inline-flex;align-items:center;gap:4px;font-size:10px;text-transform:uppercase;letter-spacing:.11em;font-weight:950;color:rgba(255,255,255,.80);background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.18);border-radius:999px;padding:5px 8px;backdrop-filter:blur(10px)}',
      '.gq-party-row{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:12px}.gq-party-row>span{font-size:11px;font-weight:900;color:rgba(255,255,255,.84);background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.18);border-radius:999px;padding:6px 9px;backdrop-filter:blur(12px)}',
      '.gq-progress-wrap{display:flex;align-items:center;gap:9px}.gq-progress-wrap b{font-size:12px;color:#fff;min-width:34px;text-align:right}.gq-progress{height:9px;border-radius:999px;background:rgba(255,255,255,.20);overflow:hidden;flex:1;box-shadow:0 1px 0 rgba(255,255,255,.15) inset}.gq-progress i{display:block;height:100%;border-radius:999px;background:linear-gradient(90deg,#a7f3d0,#86efac,#c4b5fd);box-shadow:0 0 18px rgba(134,239,172,.42);transition:width .22s ease}',
      '.gq-meta{display:flex;flex-wrap:wrap;gap:7px;margin-top:10px}.gq-meta span{font-size:10px;font-weight:900;color:rgba(255,255,255,.86);background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.16);border-radius:999px;padding:6px 8px;backdrop-filter:blur(12px)}',
      '.gq-steps{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}.gq-steps span{font-size:10px;font-weight:850;color:rgba(255,255,255,.72);background:rgba(0,0,0,.18);border:1px solid rgba(255,255,255,.10);border-radius:999px;padding:5px 8px}.gq-steps span.done{color:#dcfce7;background:rgba(22,163,74,.24);border-color:rgba(134,239,172,.28)}',
      '.gq-party{display:flex;min-height:42px}.gq-avatar{width:42px;height:42px;border-radius:50%;background:linear-gradient(135deg,#3f7f2f,#6d28d9);background-size:cover;background-position:center;border:2px solid rgba(255,255,255,.94);margin-right:-8px;color:#fff;display:flex;align-items:center;justify-content:center;position:relative;box-shadow:0 9px 18px rgba(0,0,0,.25)}.gq-avatar.empty{background:rgba(255,255,255,.12);border:2px dashed rgba(255,255,255,.75);font-size:22px}.gq-avatar span{font-size:11px;font-weight:950}.gq-avatar.has-img span{display:none}.gq-avatar small{position:absolute;right:-3px;bottom:-3px;min-width:17px;height:17px;border-radius:50%;background:#fff;color:#24521f;border:1px solid rgba(220,232,215,.92);font-size:9px;font-weight:950;display:flex;align-items:center;justify-content:center}',
      '.gq-actions{display:flex;gap:8px;margin-top:14px}.gq-actions button{flex:1;border:0;border-radius:16px;background:linear-gradient(135deg,#86efac,#3f7f2f);color:#07280a;padding:12px 12px;font-size:13px;font-weight:950;box-shadow:0 10px 20px rgba(63,127,47,.22);cursor:pointer}.gq-actions button.ghost{background:rgba(255,255,255,.16);color:#fff;box-shadow:none;border:1px solid rgba(255,255,255,.22);backdrop-filter:blur(12px)}',
      '.task-tabs .ttab.gq-tab{background:linear-gradient(135deg,#315f2c,#6d28d9);color:#fff;border-color:transparent;box-shadow:0 8px 18px rgba(49,95,44,.18)}@media(max-width:420px){.gq-hero{display:block;min-height:155px}.gq-hero button{margin-top:14px;width:100%}.gq-card.premium,.gq-card-content{min-height:340px}.gq-actions{flex-direction:column}.gq-card h3{font-size:22px}}'
    ].join('');
    document.head.appendChild(s);
  }

  function premiumMembers(q, activeId, joined){
    var members = q.members || [];
    if(typeof getGroupQuestMember !== 'function') return '';
    var html = members.slice().sort(function(a,b){return (b.contribution||0)-(a.contribution||0);}).map(function(entry){
      var m = getGroupQuestMember(entry.id) || {};
      var img = m.avatar || m.avatarUrl || m.photoURL || '';
      var style = img ? ' style="background-image:url('+img+');"' : '';
      return '<div class="gq-avatar '+(img?'has-img':'')+'"'+style+' title="'+(m.name||entry.id)+'"><span>'+(!img?(m.initials||'?'):'')+'</span><small>'+(entry.contribution||0)+'</small></div>';
    }).join('');
    if(!joined) html += '<div class="gq-avatar empty" title="Join party"><span>+</span><small>join</small></div>';
    if(!html) html = '<div class="gq-avatar empty" title="Join party"><span>+</span><small>0</small></div>';
    return html;
  }

  function premiumSteps(q){
    var steps = q.steps || [];
    if(!steps.length) return '';
    return '<div class="gq-steps">' + steps.slice(0,4).map(function(step, idx){
      var done = idx < (q.progress || 0);
      return '<span class="'+(done?'done':'')+'">'+(done?'✓':'•')+' '+step+'</span>';
    }).join('') + (steps.length > 4 ? '<span>+'+(steps.length-4)+' meer</span>' : '') + '</div>';
  }

  function renderPremiumGroupQuests(container){
    if(!container || typeof loadGroupQuests !== 'function') return;
    injectPremiumStyles();
    var quests = loadGroupQuests().map(function(q){ return Object.assign({}, q, { type: normalizeType(q.type), autoBackground: true, background: '' }); });
    var activeId = typeof getActiveGroupQuestMemberId === 'function' ? getActiveGroupQuestMemberId() : 'shane';
    var open = quests.filter(function(q){return q.status !== 'completed';});
    var completed = quests.filter(function(q){return q.status === 'completed';});
    var totalXp = quests.reduce(function(sum,q){return sum + getGroupQuestReward(q).total;},0);
    var joins = quests.reduce(function(sum,q){return sum + getGroupQuestPartySize(q);},0);

    var html = '<div class="group-quests-view premium">'
      + '<section class="gq-hero"><div><p>FAMILY RAID BOARD</p><h2>Group quests</h2><span>Raids, dungeons, adventures en teamwork quests voor het gezin.</span></div><button onclick="createDemoGroupQuest()">+ Nieuwe raid</button></section>'
      + '<div class="gq-summary-grid"><div><b>'+open.length+'</b><span>open quests</span></div><div><b>'+joins+'</b><span>party joins</span></div><div><b>'+totalXp+'</b><span>XP pool</span></div></div>';

    if(!open.length) html += '<div class="gq-empty">Geen open group quests. Maak een nieuwe raid of dungeon aan.</div>';

    open.forEach(function(q){
      var reward = getGroupQuestReward(q);
      var joined = (q.members || []).some(function(m){return m.id === activeId;});
      var pct = Math.min(100, Math.round(((q.progress || 0) / Math.max(1, q.target || 1)) * 100));
      var bg = pickBg(q);
      var label = typeLabel(q.type);
      html += '<article class="gq-card premium" style="background-image:url('+bg+')"><div class="gq-card-shade"></div><div class="gq-card-content">'
        + '<div class="gq-card-top"><div><span class="gq-type">⚔️ '+label+'</span><h3>'+q.title+'</h3></div><strong>'+reward.total+' XP</strong></div>'
        + '<p>'+q.description+'</p>'
        + '<div class="gq-party-row"><div class="gq-party">'+premiumMembers(q, activeId, joined)+'</div><span>'+getGroupQuestPartySize(q)+' joined</span></div>'
        + '<div class="gq-progress-wrap"><div class="gq-progress"><i style="width:'+pct+'%"></i></div><b>'+pct+'%</b></div>'
        + '<div class="gq-meta"><span>'+Math.min(q.progress || 0, q.target || 1)+'/'+(q.target || 1)+' stappen</span><span>+'+reward.teamBonus+' team XP</span><span>'+Math.round(((q.multiplier || 1)-1)*100)+'% multiplier</span></div>'
        + premiumSteps(q)
        + '<div class="gq-actions">'+(joined ? '<button class="ghost" onclick="leaveGroupQuest(\''+q.id+'\')">Leave party</button>' : '<button class="ghost" onclick="joinGroupQuest(\''+q.id+'\')">Join party</button>')+'<button onclick="contributeGroupQuest(\''+q.id+'\')" '+(!joined?'disabled style="opacity:.45"':'')+'>+ Bijdrage</button></div>'
        + '</div></article>';
    });

    if(completed.length){
      html += '<h3 class="gq-section-title">Voltooid</h3>';
      completed.forEach(function(q){
        var reward = getGroupQuestReward(q);
        html += '<article class="gq-card premium completed" style="background-image:url('+pickBg(q)+')"><div class="gq-card-shade"></div><div class="gq-card-content"><div class="gq-card-top"><div><span class="gq-type">🏆 Completed</span><h3>'+q.title+'</h3></div><strong>'+reward.total+' XP</strong></div><p>Team quest afgerond. Klaar voor activity log, rewards en achievements.</p></div></article>';
      });
    }
    html += '</div>';
    container.innerHTML = html;
  }

  function installPremiumRender(){
    injectPremiumStyles();
    if(window.__gqPremiumInstalled || typeof window.renderTasks !== 'function') return;
    window.__gqPremiumInstalled = true;
    var previous = window.renderTasks;
    window.renderTasks = function(){
      if(window.taskTab === 'groupquests'){
        renderPremiumGroupQuests(document.getElementById('task-content'));
        return;
      }
      return previous.apply(this, arguments);
    };
    if(window.taskTab === 'groupquests') renderPremiumGroupQuests(document.getElementById('task-content'));
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', installPremiumRender);
  else installPremiumRender();
  setTimeout(installPremiumRender, 350);
})();
