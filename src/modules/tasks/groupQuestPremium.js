'use strict';
// ============================================================
// GROUP QUESTS PREMIUM UX v0.303
// Dedicated group gameplay card renderer.
// Uses fixed epic background pools and reactive household state.
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

  function normalizeType(type){ if(type === 'weekly' || type === 'task') return 'dungeon'; return type || 'dungeon'; }
  function seedIndex(q, list){ var key = String((q && (q.id || q.title)) || 'quest'); var seed = key.split('').reduce(function(sum, ch){ return sum + ch.charCodeAt(0); }, 0); return Math.abs(seed) % list.length; }

  function pickBg(q){
    var type = normalizeType(q.type);
    var quest = Object.assign({}, q, { type: type, questType: type, partyType: 'group', autoBackground: true, background: '' });
    if(window.EpicHeroBackgrounds && typeof window.EpicHeroBackgrounds.getHeroBackground === 'function') return window.EpicHeroBackgrounds.getHeroBackground(quest);
    var pool = (type === 'raid' || type === 'dungeon') ? FALLBACK_RAID : FALLBACK_GROUP;
    return pool[seedIndex(q, pool)];
  }

  function typeLabel(type){ type = normalizeType(type); return ({ team:'Team Quest', adventure:'Adventure', dungeon:'Dungeon', raid:'Raid' })[type] || 'Dungeon'; }

  function getActiveMemberId(){
    if(window.ReactiveHouseholdState && window.ReactiveHouseholdState.snapshot){
      var snap = window.ReactiveHouseholdState.snapshot();
      if(snap && snap.activeMember && snap.activeMember.id) return snap.activeMember.id;
    }
    if(window.HouseholdIdentity && window.HouseholdIdentity.getActiveMemberId) return window.HouseholdIdentity.getActiveMemberId();
    return typeof getActiveGroupQuestMemberId === 'function' ? getActiveGroupQuestMemberId() : 'shane';
  }

  function getMemberProfile(id){
    if(window.HouseholdIdentity && window.HouseholdIdentity.getProfile) return window.HouseholdIdentity.getProfile(id);
    return typeof getGroupQuestMember === 'function' ? getGroupQuestMember(id) : { id:id, initials:'?' };
  }

  function rerenderGroupQuestTab(){
    if(window.taskTab !== 'groupquests') return;
    var container = document.getElementById('task-content');
    if(container) renderPremiumGroupQuests(container);
  }

  function installReactiveBindings(){
    if(window.__gqReactiveInstalled) return;
    window.__gqReactiveInstalled = true;

    if(window.ReactiveHouseholdState && window.ReactiveHouseholdState.subscribe){
      window.ReactiveHouseholdState.subscribe('updated', function(){ requestAnimationFrame(rerenderGroupQuestTab); });
      window.ReactiveHouseholdState.subscribe('group-quests', function(){ requestAnimationFrame(rerenderGroupQuestTab); });
      window.ReactiveHouseholdState.subscribe('active-member', function(){ requestAnimationFrame(rerenderGroupQuestTab); });
      window.ReactiveHouseholdState.subscribe('presence', function(){ requestAnimationFrame(rerenderGroupQuestTab); });
    }

    ['joinGroupQuest','leaveGroupQuest','contributeGroupQuest'].forEach(function(fnName){
      var original = window[fnName];
      if(typeof original !== 'function' || original.__reactiveWrapped) return;
      var wrapped = function(){
        var result = original.apply(this, arguments);
        if(window.ReactiveHouseholdState && window.ReactiveHouseholdState.refresh){
          window.ReactiveHouseholdState.refresh(fnName);
        }
        requestAnimationFrame(rerenderGroupQuestTab);
        return result;
      };
      wrapped.__reactiveWrapped = true;
      window[fnName] = wrapped;
    });
  }

  function injectPremiumStyles(){ /* styles preserved from previous version */ }

  function premiumMembers(q, activeId, joined){
    var members = q.members || [];
    var html = members.slice().sort(function(a,b){return (b.contribution||0)-(a.contribution||0);}).map(function(entry){
      var m = getMemberProfile(entry.id) || {};
      var img = m.avatar || '';
      var style = img ? ' style="background-image:url('+img+');"' : '';
      return '<div class="gq-avatar '+(img?'has-img':'')+'"'+style+' title="'+(m.name||entry.id)+'"><span>'+(!img?(m.initials||'?'):'')+'</span><small>'+(entry.contribution||0)+'</small></div>';
    }).join('');
    if(!joined) html += '<div class="gq-avatar empty" title="Join party"><span>+</span><small>join</small></div>';
    if(!html) html = '<div class="gq-avatar empty" title="Join party"><span>+</span><small>0</small></div>';
    return html;
  }

  function premiumSteps(q){ var steps = q.steps || []; if(!steps.length) return ''; return '<div class="gq-steps">' + steps.slice(0,4).map(function(step, idx){ var done = idx < (q.progress || 0); return '<span class="'+(done?'done':'')+'">'+(done?'✓':'•')+' '+step+'</span>'; }).join('') + (steps.length > 4 ? '<span>+'+(steps.length-4)+' meer</span>' : '') + '</div>'; }

  function renderPremiumGroupQuests(container){
    if(!container || typeof loadGroupQuests !== 'function') return;
    var quests = loadGroupQuests().map(function(q){ return Object.assign({}, q, { type: normalizeType(q.type), autoBackground: true, background: '' }); });
    var activeId = getActiveMemberId();
    var open = quests.filter(function(q){return q.status !== 'completed';});
    var html = '<div class="group-quests-view premium">';
    open.forEach(function(q){
      var reward = getGroupQuestReward(q);
      var joined = (q.members || []).some(function(m){return m.id === activeId;});
      var pct = Math.min(100, Math.round(((q.progress || 0) / Math.max(1, q.target || 1)) * 100));
      html += '<article class="gq-card premium" style="background-image:url('+pickBg(q)+')"><div class="gq-card-shade"></div><div class="gq-card-content">'
      + '<div class="gq-card-top"><div><span class="gq-type">⚔️ '+typeLabel(q.type)+'</span><h3>'+q.title+'</h3></div><strong>'+reward.total+' XP</strong></div>'
      + '<p>'+q.description+'</p>'
      + '<div class="gq-party-row"><div class="gq-party">'+premiumMembers(q, activeId, joined)+'</div><span>'+getGroupQuestPartySize(q)+' joined</span></div>'
      + '<div class="gq-progress-wrap"><div class="gq-progress"><i style="width:'+pct+'%"></i></div><b>'+pct+'%</b></div>'
      + premiumSteps(q)
      + '<div class="gq-actions">'+(joined ? '<button class="ghost" onclick="leaveGroupQuest(\''+q.id+'\')">Leave party</button>' : '<button class="ghost" onclick="joinGroupQuest(\''+q.id+'\')">Join party</button>')+'<button onclick="contributeGroupQuest(\''+q.id+'\')" '+(!joined?'disabled style="opacity:.45"':'')+'>+ Bijdrage</button></div>'
      + '</div></article>';
    });
    html += '</div>';
    container.innerHTML = html;
  }

  function installPremiumRender(){
    installReactiveBindings();
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
    rerenderGroupQuestTab();
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', installPremiumRender);
  else installPremiumRender();
})();
