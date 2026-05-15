'use strict';
// ============================================================
// QUEST RENDERER PREVIEW TAB v0.292
// Safely exposes the new QuestRenderer in a separate Tasks tab.
// No observers, no gesture hacks, no replacement of legacy overview.
// ============================================================

(function(){
  var TAB_ID = 'questpreview';

  function canRender(){
    return !!(window.QuestRenderer && window.QuestAdapter && typeof window.QuestRenderer.renderQuestCard === 'function');
  }

  function memberLookup(id){
    if(typeof window.getGroupQuestMember === 'function'){
      var m = window.getGroupQuestMember(id);
      if(m) return m;
    }
    var map = {
      shane: { name: 'Shane', initials: 'SH' },
      esra: { name: 'Esra', initials: 'ES' },
      family: { name: 'Gezin', initials: 'GF' }
    };
    return map[id] || { name: id, initials: String(id || '?').slice(0,2).toUpperCase() };
  }

  function injectStyles(){
    if(document.getElementById('quest-renderer-preview-styles')) return;
    var s = document.createElement('style');
    s.id = 'quest-renderer-preview-styles';
    s.textContent = [
      '.ttab.qr-preview-tab{background:linear-gradient(135deg,#111827,#315f2c 55%,#6d28d9)!important;color:#fff!important;border-color:transparent!important;box-shadow:0 8px 18px rgba(49,95,44,.18)}',
      '.qrPreview{padding:14px 14px 128px;background:radial-gradient(circle at 10% 0%,#eef8ea 0,#f7faf6 34%,#f8fafc 100%);min-height:100%;overflow-x:hidden}',
      '.qrPreviewHero{position:relative;overflow:hidden;border-radius:28px;min-height:148px;padding:20px;color:#fff;background:linear-gradient(135deg,rgba(17,24,39,.96),rgba(49,95,44,.9),rgba(109,40,217,.84)),url(https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=90&fm=webp) center/cover;box-shadow:0 22px 44px rgba(31,41,55,.18);margin-bottom:13px}',
      '.qrPreviewHero small{display:block;font-size:10px;font-weight:950;letter-spacing:.14em;text-transform:uppercase;color:rgba(255,255,255,.72)}',
      '.qrPreviewHero h2{margin:7px 0 7px;font-size:29px;line-height:.98;letter-spacing:-.75px}',
      '.qrPreviewHero p{margin:0;font-size:13px;line-height:1.35;color:rgba(255,255,255,.82);max-width:320px}',
      '.qrPreviewGrid{display:grid;grid-template-columns:1fr;gap:0}',
      '.qrPreviewNote{background:#fff;border:1px solid #e7ede3;border-radius:20px;padding:13px;margin:0 0 13px;color:#667085;font-size:12px;font-weight:750;line-height:1.35;box-shadow:0 6px 18px rgba(17,24,39,.045)}',
      '.qrPreviewEmpty{background:#fff;border:1px dashed #cfd9ca;border-radius:20px;padding:18px;text-align:center;color:#667085;font-weight:800}'
    ].join('');
    document.head.appendChild(s);
  }

  function normalizeLegacyGroupQuest(gq){
    var members = (gq.members || []).map(function(m){ return m.id; });
    return window.QuestEngine && window.QuestEngine.normalizeQuest ? window.QuestEngine.normalizeQuest({
      id: 'preview-' + gq.id,
      title: gq.title,
      description: gq.description,
      questType: gq.type || 'weekly',
      partyType: 'group',
      status: gq.status || 'open',
      ownerId: members[0] || 'shane',
      assignedMemberIds: members,
      acceptedMemberIds: members,
      invitedMemberIds: gq.invitedMemberIds || [],
      helpRequested: true,
      steps: gq.steps || [],
      rewards: { xp: gq.xp || 0, coins: gq.coinReward || 0 },
      progress: gq.progress || 0,
      target: gq.target || 1,
      background: gq.background || null
    }) : null;
  }

  function getPreviewQuests(){
    var quests = [];
    if(window.QuestAdapter && typeof window.QuestAdapter.getAllUnifiedQuests === 'function'){
      quests = window.QuestAdapter.getAllUnifiedQuests() || [];
    }
    if((!quests || !quests.length) && typeof window.loadGroupQuests === 'function'){
      quests = window.loadGroupQuests().map(normalizeLegacyGroupQuest).filter(Boolean);
    }
    return (quests || []).filter(function(q){ return q.status !== 'completed'; }).slice(0, 8);
  }

  function renderPreview(){
    injectStyles();
    var el = document.getElementById('task-content');
    if(!el) return;
    if(!canRender()){
      el.innerHTML = '<div class="qrPreview"><div class="qrPreviewEmpty">QuestRenderer is nog niet geladen.</div></div>';
      return;
    }
    window.QuestRenderer.injectStyles();
    var quests = getPreviewQuests();
    var cards = quests.map(function(q){
      return window.QuestRenderer.renderQuestCard(q, { memberLookup: memberLookup });
    }).join('');
    el.innerHTML = '<div class="qrPreview">'
      + '<section class="qrPreviewHero"><small>Renderer preview</small><h2>Nieuwe quest cards</h2><p>Test de nieuwe stabiele renderer zonder de oude takenmodule te vervangen.</p></section>'
      + '<div class="qrPreviewNote">Deze tab is bewust losstaand. Als performance en layout goed zijn, migreren we daarna Overzicht stap voor stap.</div>'
      + '<div class="qrPreviewGrid">' + (cards || '<div class="qrPreviewEmpty">Geen quests gevonden om te tonen.</div>') + '</div>'
      + '</div>';
  }

  function installTab(){
    injectStyles();
    var tabs = document.querySelector('.task-tabs');
    if(!tabs || document.querySelector('.ttab.qr-preview-tab')) return;
    var btn = document.createElement('button');
    btn.className = 'ttab qr-preview-tab';
    btn.textContent = '✨ Preview';
    btn.onclick = function(){
      if(typeof window.setTaskTab === 'function'){
        window.setTaskTab(TAB_ID, btn);
      } else {
        window.taskTab = TAB_ID;
        renderPreview();
      }
    };
    tabs.appendChild(btn);
  }

  function patchRenderTasks(){
    if(window.__questRendererPreviewPatched || typeof window.renderTasks !== 'function') return;
    window.__questRendererPreviewPatched = true;
    var original = window.renderTasks;
    window.renderTasks = function(){
      if(window.taskTab === TAB_ID){
        renderPreview();
        return;
      }
      return original.apply(this, arguments);
    };
  }

  function boot(){
    installTab();
    patchRenderTasks();
    if(window.taskTab === TAB_ID) renderPreview();
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
  setTimeout(boot, 300);
  window.addEventListener('familyapp:navigation-rendered', boot);
})();
