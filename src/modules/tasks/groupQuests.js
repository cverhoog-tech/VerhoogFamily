'use strict';
// ============================================================
// GROUP QUESTS / PARTY SYSTEM v0.1
// Local-first prototype: open group quests, join/leave party,
// shared progress and XP preview. Later this can move to backend.
// ============================================================

var GROUP_QUESTS_KEY = 'fam_group_quests_v001';
var GROUP_QUESTS_MEMBERS_KEY = 'fam_group_members_v001';

function gqSafeParse(raw, fallback) {
  try { return raw ? JSON.parse(raw) : fallback; }
  catch (e) { return fallback; }
}

function gqTodayIso() {
  return new Date().toISOString().slice(0, 10);
}

function gqDefaultMembers() {
  return [
    { id: 'shane', name: 'Shane', initials: 'SH', role: 'parent', xp: 0 },
    { id: 'esra', name: 'Esra', initials: 'ES', role: 'partner', xp: 0 },
    { id: 'family', name: 'Gezin', initials: 'GF', role: 'household', xp: 0 }
  ];
}

function gqDefaultQuests() {
  return [
    {
      id: 'gq-weekend-reset',
      title: 'Weekend reset',
      description: 'Samen het huis klaarmaken voor een rustige nieuwe week.',
      type: 'weekly',
      status: 'open',
      target: 6,
      progress: 2,
      xp: 300,
      coinReward: 40,
      multiplier: 1.15,
      deadline: gqTodayIso(),
      members: [
        { id: 'shane', status: 'joined', contribution: 1 },
        { id: 'esra', status: 'joined', contribution: 1 }
      ],
      steps: ['Woonkamer opruimen', 'Keuken reset', 'Was verzamelen', 'Planning maken', 'Boodschappencheck', 'Afval wegbrengen']
    },
    {
      id: 'gq-family-groceries',
      title: 'Gezinsboodschappen run',
      description: 'Maak samen de lijst compleet en rond de boodschappen af.',
      type: 'weekly',
      status: 'open',
      target: 4,
      progress: 1,
      xp: 180,
      coinReward: 25,
      multiplier: 1.1,
      deadline: gqTodayIso(),
      members: [
        { id: 'family', status: 'joined', contribution: 1 }
      ],
      steps: ['Maaltijden kiezen', 'Lijst aanvullen', 'Boodschappen halen', 'Voorraad opruimen']
    }
  ];
}

function loadGroupQuestMembers() {
  var saved = gqSafeParse(localStorage.getItem(GROUP_QUESTS_MEMBERS_KEY), null);
  if (Array.isArray(saved) && saved.length) return saved;
  var members = gqDefaultMembers();
  localStorage.setItem(GROUP_QUESTS_MEMBERS_KEY, JSON.stringify(members));
  return members;
}

function loadGroupQuests() {
  var saved = gqSafeParse(localStorage.getItem(GROUP_QUESTS_KEY), null);
  if (Array.isArray(saved) && saved.length) return saved;
  var quests = gqDefaultQuests();
  localStorage.setItem(GROUP_QUESTS_KEY, JSON.stringify(quests));
  return quests;
}

function saveGroupQuests(quests) {
  localStorage.setItem(GROUP_QUESTS_KEY, JSON.stringify(quests));
  window.dispatchEvent(new CustomEvent('familyapp:group-quests-updated', { detail: { quests: quests } }));
}

function getGroupQuestMember(memberId) {
  return loadGroupQuestMembers().find(function(m){ return m.id === memberId; }) || loadGroupQuestMembers()[0];
}

function getActiveGroupQuestMemberId() {
  return localStorage.getItem('fam_active_member_id') || 'shane';
}

function getGroupQuestPartySize(quest) {
  return (quest.members || []).filter(function(m){ return m.status === 'joined' || m.status === 'ready' || m.status === 'completed'; }).length;
}

function getGroupQuestReward(quest) {
  var partySize = Math.max(1, getGroupQuestPartySize(quest));
  var completionBonus = quest.progress >= quest.target ? 40 : 0;
  var base = Math.round((quest.xp || 0) * (quest.multiplier || 1));
  return {
    base: base,
    teamBonus: Math.max(0, (partySize - 1) * 25),
    completionBonus: completionBonus,
    total: base + Math.max(0, (partySize - 1) * 25) + completionBonus
  };
}

function joinGroupQuest(id) {
  var activeId = getActiveGroupQuestMemberId();
  var quests = loadGroupQuests().map(function(q){
    if (q.id !== id) return q;
    var members = q.members || [];
    var current = members.find(function(m){ return m.id === activeId; });
    if (current) current.status = 'joined';
    else members.push({ id: activeId, status: 'joined', contribution: 0 });
    q.members = members;
    q.status = 'open';
    return q;
  });
  saveGroupQuests(quests);
  if (typeof showToast === 'function') showToast('Party joined! Samen XP verdienen gestart.');
  renderTasks();
}

function leaveGroupQuest(id) {
  var activeId = getActiveGroupQuestMemberId();
  var quests = loadGroupQuests().map(function(q){
    if (q.id !== id) return q;
    q.members = (q.members || []).filter(function(m){ return m.id !== activeId; });
    return q;
  });
  saveGroupQuests(quests);
  if (typeof showToast === 'function') showToast('Je hebt de party verlaten.');
  renderTasks();
}

function contributeGroupQuest(id) {
  var activeId = getActiveGroupQuestMemberId();
  var quests = loadGroupQuests().map(function(q){
    if (q.id !== id || q.status === 'completed') return q;
    var members = q.members || [];
    var current = members.find(function(m){ return m.id === activeId; });
    if (!current) {
      current = { id: activeId, status: 'joined', contribution: 0 };
      members.push(current);
    }
    current.contribution = (current.contribution || 0) + 1;
    q.members = members;
    q.progress = Math.min(q.target, (q.progress || 0) + 1);
    if (q.progress >= q.target) q.status = 'completed';
    return q;
  });
  saveGroupQuests(quests);
  if (typeof awardXP === 'function') awardXP(10, 'Group quest bijdrage');
  if (typeof showToast === 'function') showToast('+10 XP bijdrage aan group quest');
  renderTasks();
}

function renderGroupQuestMembers(members) {
  return (members || []).map(function(entry){
    var member = getGroupQuestMember(entry.id);
    return '<div class="gq-avatar" title="'+member.name+' - '+entry.status+'">'
      + '<span>'+member.initials+'</span>'
      + '<small>'+Math.max(0, entry.contribution || 0)+'</small>'
      + '</div>';
  }).join('');
}

function renderGroupQuests(container) {
  if (!container) return;
  var quests = loadGroupQuests();
  var activeId = getActiveGroupQuestMemberId();
  var open = quests.filter(function(q){ return q.status !== 'completed'; });
  var completed = quests.filter(function(q){ return q.status === 'completed'; });

  var html = '<div class="group-quests-view">'
    + '<section class="gq-hero">'
    + '<div><p>PARTY QUESTS</p><h2>Open group quests</h2><span>Samen joinen, bijdragen en bonus-XP verdienen.</span></div>'
    + '<button onclick="createDemoGroupQuest()">+ Group quest</button>'
    + '</section>';

  html += '<div class="gq-summary-grid">'
    + '<div><b>'+open.length+'</b><span>open</span></div>'
    + '<div><b>'+quests.reduce(function(sum,q){return sum + getGroupQuestPartySize(q);},0)+'</b><span>party joins</span></div>'
    + '<div><b>'+quests.reduce(function(sum,q){return sum + getGroupQuestReward(q).total;},0)+'</b><span>mogelijke XP</span></div>'
    + '</div>';

  if (!open.length) {
    html += '<div class="gq-empty">Geen open group quests. Maak een nieuwe family quest aan.</div>';
  }

  open.forEach(function(q){
    var reward = getGroupQuestReward(q);
    var joined = (q.members || []).some(function(m){ return m.id === activeId; });
    var pct = Math.min(100, Math.round(((q.progress || 0) / Math.max(1, q.target || 1)) * 100));
    html += '<article class="gq-card">'
      + '<div class="gq-card-top"><div><span class="gq-type">'+(q.type || 'group')+'</span><h3>'+q.title+'</h3></div><strong>'+reward.total+' XP</strong></div>'
      + '<p>'+q.description+'</p>'
      + '<div class="gq-progress"><i style="width:'+pct+'%"></i></div>'
      + '<div class="gq-meta"><span>'+Math.min(q.progress || 0, q.target || 1)+'/'+(q.target || 1)+' stappen</span><span>'+getGroupQuestPartySize(q)+' leden</span><span>'+Math.round(((q.multiplier || 1) - 1) * 100)+'% team bonus</span></div>'
      + '<div class="gq-party">'+renderGroupQuestMembers(q.members)+'</div>'
      + '<div class="gq-actions">'
      + (joined ? '<button class="ghost" onclick="leaveGroupQuest(\''+q.id+'\')">Leave</button>' : '<button class="ghost" onclick="joinGroupQuest(\''+q.id+'\')">Join party</button>')
      + '<button onclick="contributeGroupQuest(\''+q.id+'\')">+ Bijdrage</button>'
      + '</div>'
      + '</article>';
  });

  if (completed.length) {
    html += '<h3 class="gq-section-title">Voltooid</h3>';
    completed.forEach(function(q){
      var reward = getGroupQuestReward(q);
      html += '<article class="gq-card completed"><div class="gq-card-top"><div><span class="gq-type">completed</span><h3>'+q.title+'</h3></div><strong>'+reward.total+' XP</strong></div><p>Team quest afgerond. Klaar om later aan rewards/activity log te koppelen.</p></article>';
    });
  }

  html += '</div>';
  container.innerHTML = html;
}

function createDemoGroupQuest() {
  var title = prompt('Naam group quest?', 'Family clean-up raid');
  if (!title) return;
  var quests = loadGroupQuests();
  quests.unshift({
    id: 'gq-' + Date.now(),
    title: title,
    description: 'Nieuwe gezamenlijke quest voor het gezin.',
    type: 'weekly',
    status: 'open',
    target: 5,
    progress: 0,
    xp: 220,
    coinReward: 30,
    multiplier: 1.12,
    deadline: gqTodayIso(),
    members: [],
    steps: ['Stap 1', 'Stap 2', 'Stap 3', 'Stap 4', 'Stap 5']
  });
  saveGroupQuests(quests);
  renderTasks();
}
