'use strict';
// ============================================================
// HERO CARD DATA ADAPTER v0.346
// Converts existing group quest/task data into stable hero card objects.
// ============================================================

(function(){
  var VERSION = '0.346';

  var FALLBACK_CARDS = [
    {
      id: 'fallback-raid-cleaning',
      title: 'Weekend Raid: Huis Reset',
      subtitle: 'Werk samen om het huis klaar te maken voor de nieuwe week.',
      type: 'raid',
      rarity: 'epic',
      difficulty: 'Epic',
      progress: 35,
      reward: '+120 XP · 40 coins',
      timeLeft: '2 dagen',
      members: ['SK','ES'],
      status: 'active',
      accent: '#f59e0b',
      emoji: '🏰'
    },
    {
      id: 'fallback-group-groceries',
      title: 'Duo Quest: Weekboodschappen',
      subtitle: 'Maak de lijst compleet en vink samen alles af.',
      type: 'group',
      rarity: 'rare',
      difficulty: 'Rare',
      progress: 62,
      reward: '+70 XP · Streak boost',
      timeLeft: 'Vandaag',
      members: ['SK','ES'],
      status: 'active',
      accent: '#7c3aed',
      emoji: '🛒'
    }
  ];

  function clamp(n, min, max){ return Math.max(min, Math.min(max, Number(n) || 0)); }

  function initials(name){
    var s = String(name || '').trim();
    if(!s) return '??';
    return s.split(/\s+/).map(function(p){ return p.charAt(0); }).join('').slice(0,2).toUpperCase();
  }

  function normalizeMembers(raw){
    if(Array.isArray(raw) && raw.length) return raw.map(initials).slice(0,4);
    var names = [];
    if(window.myName) names.push(window.myName);
    if(window.partnerName) names.push(window.partnerName);
    return names.length ? names.map(initials) : ['SK','ES'];
  }

  function rarityForProgress(progress, type){
    if(String(type || '').toLowerCase().indexOf('raid') > -1) return 'legendary';
    if(progress >= 75) return 'epic';
    if(progress >= 40) return 'rare';
    return 'common';
  }

  function accentForRarity(rarity){
    if(rarity === 'legendary') return '#f59e0b';
    if(rarity === 'epic') return '#a855f7';
    if(rarity === 'rare') return '#2563eb';
    return '#3f7f2f';
  }

  function fromGroupQuest(q, index){
    var total = Number(q.total || q.target || q.stepsTotal || (q.tasks && q.tasks.length) || 1) || 1;
    var done = Number(q.done || q.completed || q.stepsDone || 0) || 0;
    if(Array.isArray(q.tasks)) done = q.tasks.filter(function(t){ return !!t.done; }).length;
    var progress = clamp(Math.round(done / total * 100), 0, 100);
    var type = q.type || q.questType || 'group';
    var rarity = q.rarity || rarityForProgress(progress, type);
    return {
      id: q.id || ('group-quest-' + index),
      title: q.title || q.name || 'Group Quest',
      subtitle: q.subtitle || q.description || 'Samen sterker. Maak deze quest af als team.',
      type: type,
      rarity: rarity,
      difficulty: q.difficulty || (rarity.charAt(0).toUpperCase() + rarity.slice(1)),
      progress: progress,
      reward: q.reward || q.rewards || ('+' + (q.xp || 80) + ' XP'),
      timeLeft: q.timeLeft || q.deadlineLabel || q.dueLabel || 'Actief',
      members: normalizeMembers(q.members || q.assigned || q.who),
      status: q.status || (progress >= 100 ? 'complete' : 'active'),
      accent: q.accent || accentForRarity(rarity),
      emoji: q.emoji || (String(type).toLowerCase().indexOf('raid') > -1 ? '🐉' : '🤝')
    };
  }

  function fromTaskCluster(tasks){
    var groupTasks = (tasks || []).filter(function(t){ return Array.isArray(t.assigned || t.who) && (t.assigned || t.who).length > 1; });
    if(!groupTasks.length) return [];
    var done = groupTasks.filter(function(t){ return !!t.done; }).length;
    var progress = clamp(Math.round(done / groupTasks.length * 100), 0, 100);
    return [{
      id: 'task-cluster-teamwork',
      title: 'Teamwork Quest: Gezinsmissies',
      subtitle: groupTasks.length + ' gezamenlijke taken actief.',
      type: 'group',
      rarity: rarityForProgress(progress, 'group'),
      difficulty: 'Team Quest',
      progress: progress,
      reward: '+' + (groupTasks.length * 12) + ' XP',
      timeLeft: 'Deze week',
      members: normalizeMembers(['Shane','Esra']),
      status: progress >= 100 ? 'complete' : 'active',
      accent: accentForRarity(rarityForProgress(progress, 'group')),
      emoji: '⚔️'
    }];
  }

  function listHeroCards(){
    var cards = [];
    var sources = [window.groupQuestData, window.groupQuests, window.duoQuestData, window.raidData];
    sources.forEach(function(src){
      if(Array.isArray(src)) src.forEach(function(q, i){ cards.push(fromGroupQuest(q, i)); });
    });
    cards = cards.concat(fromTaskCluster(window.taskData || []));
    if(!cards.length) cards = FALLBACK_CARDS.slice();
    return cards.slice(0, 8);
  }

  window.HeroCardDataAdapter = {
    version: VERSION,
    listHeroCards: listHeroCards
  };
})();
