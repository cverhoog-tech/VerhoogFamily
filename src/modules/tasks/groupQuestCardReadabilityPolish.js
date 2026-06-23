'use strict';
// ============================================================
// GROUP QUEST CARD READABILITY POLISH v0.284
// Premium readable group quest card renderer.
// Goals:
// - every card has a cinematic background
// - text stays readable on every image
// - subtasks are compact and structured
// - card hierarchy feels AAA/mobile-game instead of messy web card
// ============================================================

(function(){
  var STYLE_ID = 'group-quest-card-readability-polish-style';
  var installed = false;

  var BG = {
    raid: [
      'https://images.unsplash.com/photo-1518709268805-4e9042af2176?auto=format&fit=crop&w=1400&q=92&fm=webp',
      'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1400&q=92&fm=webp',
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=92&fm=webp'
    ],
    dungeon: [
      'https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=1400&q=92&fm=webp',
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=92&fm=webp',
      'https://images.unsplash.com/photo-1522163182402-834f871fd851?auto=format&fit=crop&w=1400&q=92&fm=webp'
    ],
    adventure: [
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=92&fm=webp',
      'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1400&q=92&fm=webp',
      'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1400&q=92&fm=webp'
    ],
    team: [
      'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1400&q=92&fm=webp',
      'https://images.unsplash.com/photo-1522163182402-834f871fd851?auto=format&fit=crop&w=1400&q=92&fm=webp',
      'https://images.unsplash.com/photo-1491438590914-bc09fcaaf77a?auto=format&fit=crop&w=1400&q=92&fm=webp'
    ]
  };

  function esc(value){
    return String(value == null ? '' : value).replace(/[&<>\"]/g, function(ch){
      return ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '\"':'&quot;' })[ch] || ch;
    });
  }

  function normalizeType(type){
    if(type === 'weekly' || type === 'task') return 'dungeon';
    return type || 'dungeon';
  }

  function typeLabel(type){
    type = normalizeType(type);
    return ({ team:'Team Quest', adventure:'Adventure', dungeon:'Dungeon', raid:'Raid' })[type] || 'Dungeon';
  }

  function typeIcon(type){
    type = normalizeType(type);
    return ({ team:'🤝', adventure:'🧭', dungeon:'🗝️', raid:'🐉' })[type] || '⚔️';
  }

  function seedIndex(q, list){
    var key = String((q && (q.id || q.title)) || 'quest');
    var seed = key.split('').reduce(function(sum, ch){ return sum + ch.charCodeAt(0); }, 0);
    return Math.abs(seed) % list.length;
  }

  function pickBg(q){
    var type = normalizeType(q && q.type);
    try {
      if(window.EpicHeroBackgrounds && typeof window.EpicHeroBackgrounds.getHeroBackground === 'function'){
        var quest = Object.assign({}, q, { type:type, questType:type, partyType:'group', autoBackground:true, background:'' });
        var bg = window.EpicHeroBackgrounds.getHeroBackground(quest);
        if(bg) return bg;
      }
    } catch(e) {}
    var pool = BG[type] || BG.dungeon;
    return pool[seedIndex(q, pool)];
  }

  function getActiveMemberId(){
    try {
      if(window.ReactiveHouseholdState && window.ReactiveHouseholdState.snapshot){
        var snap = window.ReactiveHouseholdState.snapshot();
        if(snap && snap.activeMember && snap.activeMember.id) return snap.activeMember.id;
      }
    } catch(e) {}
    try { if(window.HouseholdIdentity && window.HouseholdIdentity.getActiveMemberId) return window.HouseholdIdentity.getActiveMemberId(); } catch(e) {}
    try { if(typeof window.getActiveGroupQuestMemberId === 'function') return window.getActiveGroupQuestMemberId(); } catch(e) {}
    return 'shane';
  }

  function getMemberProfile(id){
    try { if(window.HouseholdIdentity && window.HouseholdIdentity.getProfile) return window.HouseholdIdentity.getProfile(id); } catch(e) {}
    try { if(typeof window.getGroupQuestMember === 'function') return window.getGroupQuestMember(id); } catch(e) {}
    return { id:id, name:id, initials:String(id || '?').slice(0,2).toUpperCase() };
  }

  function rewardFor(q){
    try { if(window.getGroupQuestReward) return window.getGroupQuestReward(q).total || 0; } catch(e) {}
    return q && q.xp ? q.xp : 100;
  }

  function partySize(q){
    try { if(window.getGroupQuestPartySize) return window.getGroupQuestPartySize(q); } catch(e) {}
    return (q.members || []).length;
  }

  function difficultyFor(q){
    var type = normalizeType(q.type);
    var target = parseInt(q.target, 10) || 1;
    if(type === 'raid') return 'Epic';
    if(type === 'dungeon') return target >= 8 ? 'Hard' : 'Medium';
    if(type === 'adventure') return target >= 8 ? 'Hard' : 'Medium';
    return target >= 6 ? 'Medium' : 'Easy';
  }

  function membersHtml(q, activeId, joined){
    var members = (q.members || []).slice().sort(function(a,b){ return (b.contribution || 0) - (a.contribution || 0); });
    var shown = members.slice(0,4);
    var html = shown.map(function(entry){
      var m = getMemberProfile(entry.id) || {};
      var img = m.avatar || '';
      var style = img ? ' style="background-image:url('+esc(img)+')"' : '';
      var active = entry.id === activeId ? ' active' : '';
      return '<div class="gq284Avatar '+(img?'hasImg':'')+active+'"'+style+' title="'+esc(m.name || entry.id)+'"><span>'+(!img ? esc(m.initials || '?') : '')+'</span><small>'+esc(entry.contribution || 0)+'</small></div>';
    }).join('');
    if(members.length > 4) html += '<div class="gq284Avatar more"><span>+'+(members.length-4)+'</span><small>team</small></div>';
    if(!html && !joined) html = '<div class="gq284Avatar empty"><span>+</span><small>join</small></div>';
    return html;
  }

  function stepsHtml(q){
    var steps = q.steps || [];
    if(!steps.length) return '<div class="gq284Tasks muted"><span>○</span><b>Geen subtaken toegevoegd</b></div>';
    var progress = parseInt(q.progress, 10) || 0;
    var visible = steps.slice(0,3);
    var html = visible.map(function(step, idx){
      var done = idx < progress;
      return '<div class="gq284Task '+(done?'done':'open')+'"><span>'+(done?'✓':'○')+'</span><b>'+esc(step)+'</b></div>';
    }).join('');
    if(steps.length > 3) html += '<div class="gq284More">+'+(steps.length-3)+' meer subtaken</div>';
    return html;
  }

  function injectStyles(){
    if(document.getElementById(STYLE_ID)) return;
    var s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = [
      '.group-quests-view.premium.gq284{display:flex;flex-direction:column;gap:16px;padding:2px 0 20px}',
      '.gq284Card{position:relative;min-height:430px;border-radius:30px;overflow:hidden;background-size:cover;background-position:center;box-shadow:0 28px 80px rgba(8,12,20,.28);isolation:isolate;border:1px solid rgba(255,255,255,.14);color:#fff;transform:translateZ(0)}',
      '.gq284Card:before{content:"";position:absolute;inset:0;z-index:0;background:linear-gradient(180deg,rgba(5,8,14,.58),rgba(5,8,14,.38) 34%,rgba(5,8,14,.82) 72%,rgba(5,8,14,.96)),radial-gradient(circle at 82% 8%,rgba(255,255,255,.16),transparent 34%),radial-gradient(circle at 4% 92%,rgba(134,239,172,.14),transparent 34%)}',
      '.gq284Card:after{content:"";position:absolute;inset:0;z-index:1;background:linear-gradient(90deg,rgba(0,0,0,.24),transparent 42%,rgba(0,0,0,.18));box-shadow:inset 0 0 0 1px rgba(255,255,255,.08),inset 0 -120px 130px rgba(0,0,0,.58);pointer-events:none}',
      '.gq284Content{position:relative;z-index:2;min-height:430px;display:flex;flex-direction:column;padding:18px;gap:12px;text-shadow:0 2px 14px rgba(0,0,0,.45)}',
      '.gq284Top{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}.gq284Chips{display:flex;gap:7px;flex-wrap:wrap;min-width:0}.gq284Chip{display:inline-flex;align-items:center;gap:6px;max-width:100%;border-radius:999px;background:rgba(8,12,20,.42);border:1px solid rgba(255,255,255,.18);box-shadow:0 8px 24px rgba(0,0,0,.18);backdrop-filter:blur(14px);padding:7px 9px;font-size:10px;font-weight:950;letter-spacing:.08em;text-transform:uppercase;color:rgba(255,255,255,.90)}',
      '.gq284Reward{flex:0 0 auto;display:inline-flex;align-items:center;gap:6px;border-radius:999px;padding:8px 11px;background:linear-gradient(135deg,#fef3c7,#facc15);color:#2d2100;font-size:12px;font-weight:1000;box-shadow:0 13px 30px rgba(250,204,21,.24);text-shadow:none}',
      '.gq284Title{margin-top:6px}.gq284Title h3{margin:0;font-size:30px;line-height:.98;letter-spacing:-.9px;font-weight:1000;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;color:#fff}.gq284Title p{margin:8px 0 0;max-width:94%;font-size:13px;line-height:1.38;color:rgba(255,255,255,.84);font-weight:750;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}',
      '.gq284ProgressPanel{margin-top:auto;border-radius:23px;background:rgba(8,12,20,.50);border:1px solid rgba(255,255,255,.14);box-shadow:0 18px 45px rgba(0,0,0,.25);backdrop-filter:blur(18px);padding:13px}',
      '.gq284PartyLine{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:12px}.gq284Party{display:flex;align-items:center;min-width:0}.gq284Avatar{position:relative;width:42px;height:42px;border-radius:50%;display:flex;align-items:center;justify-content:center;margin-left:-7px;background:linear-gradient(135deg,#315f2c,#6d28d9);background-size:cover;background-position:center;border:2px solid rgba(255,255,255,.86);box-shadow:0 8px 18px rgba(0,0,0,.25);font-size:11px;font-weight:1000;text-shadow:none}.gq284Avatar:first-child{margin-left:0}.gq284Avatar small{position:absolute;right:-4px;bottom:-6px;min-width:19px;height:19px;border-radius:999px;display:flex;align-items:center;justify-content:center;background:#fef3c7;color:#2d2100;border:1px solid rgba(0,0,0,.12);font-size:9px;font-weight:1000}.gq284Avatar.more,.gq284Avatar.empty{background:rgba(255,255,255,.14)}.gq284Avatar.active{box-shadow:0 0 0 3px rgba(134,239,172,.34),0 8px 18px rgba(0,0,0,.25)}',
      '.gq284Meta{text-align:right;font-size:11px;line-height:1.2;color:rgba(255,255,255,.80);font-weight:900}.gq284Meta b{display:block;color:#fff;font-size:13px}',
      '.gq284BarMeta{display:flex;align-items:center;justify-content:space-between;margin-bottom:7px;font-size:11px;font-weight:950;color:rgba(255,255,255,.78)}.gq284Bar{position:relative;height:12px;border-radius:999px;background:rgba(255,255,255,.14);overflow:hidden;box-shadow:inset 0 1px 5px rgba(0,0,0,.35)}.gq284Bar i{display:block;height:100%;border-radius:inherit;background:linear-gradient(90deg,#86efac,#facc15);box-shadow:0 0 24px rgba(134,239,172,.45)}',
      '.gq284TasksPanel{border-radius:22px;background:rgba(5,8,14,.46);border:1px solid rgba(255,255,255,.13);backdrop-filter:blur(16px);box-shadow:0 16px 35px rgba(0,0,0,.22);padding:12px;display:flex;flex-direction:column;gap:8px}.gq284TasksHead{display:flex;align-items:center;justify-content:space-between;font-size:10px;font-weight:1000;letter-spacing:.09em;text-transform:uppercase;color:rgba(255,255,255,.68);margin-bottom:1px}.gq284Task{display:flex;align-items:center;gap:9px;min-height:28px}.gq284Task span{flex:0 0 23px;height:23px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:1px solid rgba(255,255,255,.22);background:rgba(255,255,255,.10);font-size:13px;font-weight:1000}.gq284Task b{min-width:0;font-size:12px;line-height:1.28;color:rgba(255,255,255,.88);font-weight:850;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.gq284Task.done span{background:linear-gradient(135deg,#86efac,#315f2c);color:#061407;border-color:rgba(134,239,172,.70);text-shadow:none}.gq284Task.done b{color:rgba(255,255,255,.58);text-decoration:line-through;text-decoration-thickness:1px}.gq284More{font-size:11px;font-weight:900;color:#bbf7d0;padding-left:32px}.gq284Tasks.muted{display:flex;gap:8px;color:rgba(255,255,255,.62);font-size:12px}',
      '.gq284Actions{display:grid;grid-template-columns:1fr 1.2fr;gap:9px}.gq284Actions button{border:0;border-radius:18px;padding:12px 11px;font-size:13px;font-weight:1000;cursor:pointer;min-height:46px}.gq284Actions button.ghost{background:rgba(255,255,255,.13);color:#fff;border:1px solid rgba(255,255,255,.18);backdrop-filter:blur(14px)}.gq284Actions button.primary{background:linear-gradient(135deg,#86efac,#315f2c);color:#061407;box-shadow:0 14px 30px rgba(49,95,44,.30);text-shadow:none}.gq284Actions button:disabled{opacity:.48;filter:saturate(.5);box-shadow:none}',
      '.gq284Card.joined{border-color:rgba(134,239,172,.30)}.gq284Card.nearDone{border-color:rgba(250,204,21,.38)}.gq284Card.nearDone .gq284Reward{animation:gq284RewardPulse 1.8s ease-in-out infinite}@keyframes gq284RewardPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.035)}}',
      '@media(max-width:420px){.gq284Card{min-height:455px;border-radius:28px}.gq284Content{min-height:455px;padding:15px}.gq284Title h3{font-size:27px}.gq284Actions{grid-template-columns:1fr}.gq284Top{align-items:flex-start}.gq284Reward{font-size:11px;padding:7px 9px}.gq284ProgressPanel{padding:12px}.gq284Avatar{width:39px;height:39px}}'
    ].join('\n');
    document.head.appendChild(s);
  }

  function renderCards(container){
    if(!container || typeof window.loadGroupQuests !== 'function') return false;
    injectStyles();
    var quests = (window.loadGroupQuests() || []).map(function(q){ return Object.assign({}, q, { type:normalizeType(q.type) }); });
    var activeId = getActiveMemberId();
    var open = quests.filter(function(q){ return q.status !== 'completed'; });
    if(!open.length){
      container.innerHTML = '<div class="group-quests-view premium gq284"><div class="gq284TasksPanel" style="color:#fff;margin:8px 0"><b>Geen actieve group quests</b><span style="font-size:12px;color:rgba(255,255,255,.65)">Maak een nieuwe raid, dungeon of team quest aan.</span></div></div>';
      return true;
    }

    var html = '<div class="group-quests-view premium gq284">';
    open.forEach(function(q){
      var type = normalizeType(q.type);
      var joined = (q.members || []).some(function(m){ return m.id === activeId; });
      var pct = Math.min(100, Math.round(((q.progress || 0) / Math.max(1, q.target || 1)) * 100));
      var near = pct >= 75 ? ' nearDone' : '';
      var bg = pickBg(q);
      var reward = rewardFor(q);
      var progressText = (q.progress || 0) + ' / ' + Math.max(1, q.target || 1) + ' bijdragen';
      html += '<article class="gq284Card '+(joined?'joined':'')+near+'" style="background-image:url('+esc(bg)+')">'
        + '<div class="gq284Content">'
          + '<div class="gq284Top"><div class="gq284Chips">'
            + '<span class="gq284Chip">'+typeIcon(type)+' '+esc(typeLabel(type))+'</span>'
            + '<span class="gq284Chip">◆ '+esc(difficultyFor(q))+'</span>'
          + '</div><div class="gq284Reward">⚡ +'+esc(reward)+' XP</div></div>'
          + '<div class="gq284Title"><h3>'+esc(q.title || 'Group quest')+'</h3><p>'+esc(q.description || 'Werk samen om deze quest te voltooien.')+'</p></div>'
          + '<div class="gq284ProgressPanel">'
            + '<div class="gq284PartyLine"><div class="gq284Party">'+membersHtml(q, activeId, joined)+'</div><div class="gq284Meta"><b>'+esc(partySize(q))+' helden actief</b><span>'+esc(joined ? 'Jij zit in de party' : 'Nog niet gejoined')+'</span></div></div>'
            + '<div class="gq284BarMeta"><span>Voortgang</span><span>'+pct+'% · '+esc(progressText)+'</span></div>'
            + '<div class="gq284Bar"><i style="width:'+pct+'%"></i></div>'
          + '</div>'
          + '<div class="gq284TasksPanel"><div class="gq284TasksHead"><span>Quest taken</span><span>max 3 zichtbaar</span></div>'+stepsHtml(q)+'</div>'
          + '<div class="gq284Actions">'
            + (joined ? '<button class="ghost" onclick="leaveGroupQuest(\''+esc(q.id)+'\')">Leave party</button>' : '<button class="ghost" onclick="joinGroupQuest(\''+esc(q.id)+'\')">Join party</button>')
            + '<button class="primary" onclick="contributeGroupQuest(\''+esc(q.id)+'\')" '+(!joined?'disabled':'')+'>'+esc(joined ? '+ Bijdrage' : 'Join om bij te dragen')+'</button>'
          + '</div>'
        + '</div>'
      + '</article>';
    });
    html += '</div>';
    container.innerHTML = html;
    return true;
  }

  function rerender(){
    if(window.taskTab !== 'groupquests') return;
    renderCards(document.getElementById('task-content'));
  }

  function install(){
    injectStyles();
    if(installed || typeof window.renderTasks !== 'function') return false;
    installed = true;
    var previous = window.renderTasks;
    window.renderTasks = function(){
      if(window.taskTab === 'groupquests'){
        if(renderCards(document.getElementById('task-content'))) return;
      }
      return previous.apply(this, arguments);
    };
    ['joinGroupQuest','leaveGroupQuest','contributeGroupQuest'].forEach(function(name){
      var original = window[name];
      if(typeof original !== 'function' || original.__gq284Wrapped) return;
      var wrappedFn = function(){
        var result = original.apply(this, arguments);
        setTimeout(rerender, 140);
        return result;
      };
      wrappedFn.__gq284Wrapped = true;
      window[name] = wrappedFn;
    });
    rerender();
    return true;
  }

  var tries = 0;
  var timer = setInterval(function(){
    tries++;
    if(install() || tries > 40) clearInterval(timer);
  }, 150);

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
  else install();

  window.GroupQuestCardReadabilityPolish = { install: install, render: renderCards, rerender: rerender };
})();
