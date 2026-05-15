'use strict';
// ============================================================
// GROUP QUESTS / PARTY SYSTEM v0.271
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

function injectGroupQuestStyles() {
  if (document.getElementById('group-quests-inline-styles')) return;
  var css = document.createElement('style');
  css.id = 'group-quests-inline-styles';
  css.textContent = '.group-quests-view{padding:14px 14px 110px;background:#f7faf6;min-height:100%;}.gq-hero{position:relative;overflow:hidden;border-radius:24px;padding:20px;min-height:145px;display:flex;justify-content:space-between;gap:16px;align-items:flex-end;color:#fff;background:linear-gradient(135deg,#1f2937,#315f2c 55%,#6d28d9);box-shadow:0 18px 36px rgba(31,41,55,.18);}.gq-hero:before{content:"";position:absolute;inset:0;background:radial-gradient(circle at top right,rgba(255,255,255,.26),transparent 36%);pointer-events:none}.gq-hero>*{position:relative;z-index:1}.gq-hero p{margin:0 0 6px;font-size:11px;font-weight:950;letter-spacing:.12em;opacity:.76}.gq-hero h2{margin:0;font-size:25px;letter-spacing:-.5px}.gq-hero span{display:block;margin-top:6px;font-size:13px;line-height:1.35;opacity:.82}.gq-hero button,.gq-actions button{border:0;border-radius:999px;background:#fff;color:#24521f;padding:11px 14px;font-size:13px;font-weight:900;white-space:nowrap;box-shadow:0 8px 18px rgba(0,0,0,.18);cursor:pointer}.gq-summary-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:9px;margin:12px 0}.gq-summary-grid div{background:#fff;border:1px solid #e7ede3;border-radius:18px;padding:12px 8px;text-align:center;box-shadow:0 3px 12px rgba(17,24,39,.04)}.gq-summary-grid b{display:block;font-size:20px;color:#111827}.gq-summary-grid span{display:block;margin-top:2px;font-size:10px;text-transform:uppercase;letter-spacing:.07em;font-weight:850;color:#6b7280}.gq-card{background:#fff;border:1px solid #e7ede3;border-radius:22px;padding:16px;margin-bottom:12px;box-shadow:0 5px 18px rgba(17,24,39,.055)}.gq-card.completed{opacity:.72}.gq-card-top{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}.gq-card h3{margin:4px 0 0;font-size:18px;color:#111827;letter-spacing:-.25px}.gq-card p{margin:10px 0 12px;font-size:13px;line-height:1.45;color:#667085}.gq-card strong{background:#edf8e9;color:#2d5a27;border-radius:999px;padding:7px 10px;font-size:12px;white-space:nowrap}.gq-type{font-size:10px;text-transform:uppercase;letter-spacing:.1em;font-weight:950;color:#6d28d9}.gq-progress{height:8px;border-radius:999px;background:#edf0ec;overflow:hidden}.gq-progress i{display:block;height:100%;border-radius:999px;background:linear-gradient(90deg,#3f7f2f,#6d28d9);transition:width .22s ease}.gq-meta{display:flex;flex-wrap:wrap;gap:7px;margin-top:9px}.gq-meta span{font-size:11px;font-weight:800;color:#5f6b5d;background:#f3f6f1;border-radius:999px;padding:5px 8px}.gq-party{display:flex;margin-top:12px;min-height:33px}.gq-avatar{width:34px;height:34px;border-radius:50%;background:linear-gradient(135deg,#3f7f2f,#6d28d9);border:2px solid #fff;margin-right:-6px;color:#fff;display:flex;align-items:center;justify-content:center;position:relative;box-shadow:0 5px 12px rgba(0,0,0,.12)}.gq-avatar span{font-size:10px;font-weight:950}.gq-avatar small{position:absolute;right:-2px;bottom:-3px;min-width:15px;height:15px;border-radius:50%;background:#fff;color:#24521f;border:1px solid #dce8d7;font-size:9px;font-weight:950;display:flex;align-items:center;justify-content:center}.gq-actions{display:flex;gap:8px;margin-top:14px}.gq-actions button{flex:1;background:#315f2c;color:#fff;box-shadow:0 7px 16px rgba(49,95,44,.18)}.gq-actions button.ghost{background:#f3f6f1;color:#315f2c;box-shadow:none;border:1px solid #e1eadc}.gq-empty{background:#fff;border:1px dashed #cfd9ca;border-radius:18px;padding:18px;text-align:center;color:#667085;font-weight:750}.gq-section-title{font-size:14px;text-transform:uppercase;letter-spacing:.08em;color:#667085;margin:18px 4px 10px}.task-tabs .ttab.gq-tab{background:linear-gradient(135deg,#315f2c,#6d28d9);color:#fff;border-color:transparent}@media(max-width:420px){.gq-hero{display:block}.gq-hero button{margin-top:14px;width:100%}.gq-summary-grid{gap:7px}.gq-summary-grid div{padding:10px 4px}.gq-actions{flex-direction:column}}';
  document.head.appendChild(css);
}

function installGroupQuestTab() {
  injectGroupQuestStyles();
  var tabs = document.querySelector('.task-tabs');
  if (!tabs || document.querySelector('.ttab.gq-tab')) return;
  var trade = tabs.querySelector('.ttab-trade');
  var btn = document.createElement('button');
  btn.className = 'ttab gq-tab';
  btn.textContent = '⚔️ Group';
  btn.onclick = function(){ setTaskTab('groupquests', btn); };
  tabs.insertBefore(btn, trade || null);
}

(function patchGroupQuestRender(){
  function patch(){
    installGroupQuestTab();
    if (window.__groupQuestRenderPatched || typeof window.renderTasks !== 'function') return;
    window.__groupQuestRenderPatched = true;
    var originalRenderTasks = window.renderTasks;
    window.renderTasks = function(){
      if (window.taskTab === 'groupquests') {
        var el = document.getElementById('task-content');
        renderGroupQuests(el);
        return;
      }
      return originalRenderTasks.apply(this, arguments);
    };
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', patch);
  else patch();
  setTimeout(patch, 250);
  window.addEventListener('familyapp:navigation-rendered', patch);
})();
