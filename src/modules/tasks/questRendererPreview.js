'use strict';
// ============================================================
// QUEST RENDERER PREVIEW TAB v0.295
// Interactive preview for the new QuestRenderer with party join/leave.
// No observers, no gesture hacks, no replacement of legacy overview.
// ============================================================

(function(){
  var TAB_ID = 'questpreview';
  var GROUP_HERO = 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=92&fm=webp';
  var PARTNERSHIP_BG = 'https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1200&q=92&fm=webp';

  function canRender(){ return !!(window.QuestRenderer && window.QuestAdapter && typeof window.QuestRenderer.renderQuestCard === 'function'); }
  function activeMemberId(){ return typeof window.getActiveGroupQuestMemberId === 'function' ? window.getActiveGroupQuestMemberId() : 'shane'; }

  function memberLookup(id){
    var fromRenderer = window.QuestRenderer && window.QuestRenderer.lookupProfileAvatar ? window.QuestRenderer.lookupProfileAvatar(id) : null;
    if(fromRenderer && (fromRenderer.avatar || fromRenderer.avatarUrl || fromRenderer.photoURL)) return fromRenderer;
    if(typeof window.getGroupQuestMember === 'function'){
      var m = window.getGroupQuestMember(id);
      if(m) return Object.assign({}, m, fromRenderer || {});
    }
    var map = { shane:{name:'Shane',initials:'SH'}, esra:{name:'Esra',initials:'ES'}, family:{name:'Gezin',initials:'GF'} };
    return Object.assign({}, map[id] || { name:id, initials:String(id || '?').slice(0,2).toUpperCase() }, fromRenderer || {});
  }

  function injectStyles(){
    var old = document.getElementById('quest-renderer-preview-styles');
    if(old) old.remove();
    var s = document.createElement('style');
    s.id = 'quest-renderer-preview-styles';
    s.textContent = [
      '.ttab.qr-preview-tab{background:linear-gradient(135deg,#111827,#315f2c 55%,#6d28d9)!important;color:#fff!important;border-color:transparent!important;box-shadow:0 8px 18px rgba(49,95,44,.18)}',
      '.qrPreview{padding:14px 14px 128px;background:radial-gradient(circle at 10% 0%,#eef8ea 0,#f7faf6 34%,#f8fafc 100%);min-height:100%;overflow-x:hidden}',
      '.qrPreviewHero{position:relative;overflow:hidden;border-radius:28px;min-height:158px;padding:20px;color:#fff;background:linear-gradient(135deg,rgba(17,24,39,.92),rgba(49,95,44,.82),rgba(109,40,217,.74)),url('+GROUP_HERO+') center/cover;box-shadow:0 22px 44px rgba(31,41,55,.18);margin-bottom:13px}',
      '.qrPreviewHero small{display:block;font-size:10px;font-weight:950;letter-spacing:.14em;text-transform:uppercase;color:rgba(255,255,255,.72)}.qrPreviewHero h2{margin:7px 0 7px;font-size:29px;line-height:.98;letter-spacing:-.75px}.qrPreviewHero p{margin:0;font-size:13px;line-height:1.35;color:rgba(255,255,255,.82);max-width:320px}',
      '.qrPreviewGrid{display:grid;grid-template-columns:1fr;gap:0}.qrPreviewNote{background:#fff;border:1px solid #e7ede3;border-radius:20px;padding:13px;margin:0 0 13px;color:#667085;font-size:12px;font-weight:750;line-height:1.35;box-shadow:0 6px 18px rgba(17,24,39,.045)}.qrPreviewEmpty{background:#fff;border:1px dashed #cfd9ca;border-radius:20px;padding:18px;text-align:center;color:#667085;font-weight:800}',
      '.qrCard{cursor:pointer}.qrCard.isEditing{outline:2px solid rgba(134,239,172,.55);box-shadow:0 22px 48px rgba(49,95,44,.22)}.qrCard.notJoined .qrSteps{opacity:.45;pointer-events:none;filter:saturate(.75)}',
      '.qrInlineActions{display:flex;gap:8px;margin-top:11px;flex-wrap:wrap}.qrInlineActions button{border:0;border-radius:999px;padding:8px 11px;font-size:11px;font-weight:950;background:rgba(255,255,255,.16);color:#fff;border:1px solid rgba(255,255,255,.18)}.qrInlineActions button.primary{background:linear-gradient(135deg,#86efac,#315f2c);color:#07280a;border:0}.qrInlineActions button.danger{background:rgba(239,68,68,.18);color:#fecaca;border:1px solid rgba(248,113,113,.22)}.qrInlineActions button:disabled{opacity:.45}',
      '.qrJoinRow{display:flex;align-items:center;gap:8px;margin-top:12px}.qrJoinSlot{width:38px;height:38px;border-radius:50%;border:2px dashed rgba(255,255,255,.68);background:rgba(255,255,255,.12);color:#fff;font-size:22px;font-weight:950;display:flex;align-items:center;justify-content:center;box-shadow:0 10px 22px rgba(0,0,0,.18)}.qrJoinHint{font-size:11px;font-weight:900;color:rgba(255,255,255,.72)}',
      '.qrCard.group .qrBg{filter:saturate(1.08)}'
    ].join('');
    document.head.appendChild(s);
  }

  function normalizeStep(step, index){
    if(typeof step === 'string') return { id:'step-'+index, title:step, status:'open' };
    return Object.assign({ id:step.id || ('step-'+index), title:step.title || step.name || ('Step '+(index+1)), status:step.status || (step.done ? 'completed' : 'open') }, step);
  }

  function normalizeLegacyGroupQuest(gq){
    var members = (gq.members || []).map(function(m){ return m.id; });
    return window.QuestEngine && window.QuestEngine.normalizeQuest ? window.QuestEngine.normalizeQuest({
      id:'preview-'+gq.id, sourceId:gq.id, title:gq.title, description:gq.description, questType:gq.type || 'weekly', partyType:'group', status:gq.status || 'open',
      ownerId:members[0] || 'shane', assignedMemberIds:members, acceptedMemberIds:members, invitedMemberIds:gq.invitedMemberIds || [], helpRequested:true,
      steps:(gq.steps || []).map(normalizeStep), rewards:{ xp:gq.xp || 0, coins:gq.coinReward || 0 }, progress:gq.progress || 0, target:gq.target || Math.max(1,(gq.steps || []).length), background:gq.background || PARTNERSHIP_BG
    }) : null;
  }

  function getPreviewQuests(){
    var quests = [];
    if(window.QuestAdapter && typeof window.QuestAdapter.getAllUnifiedQuests === 'function') quests = window.QuestAdapter.getAllUnifiedQuests() || [];
    if((!quests || !quests.length) && typeof window.loadGroupQuests === 'function') quests = window.loadGroupQuests().map(normalizeLegacyGroupQuest).filter(Boolean);
    return (quests || []).filter(function(q){ return q.status !== 'completed'; }).slice(0,8);
  }

  function findLegacyIndex(quest){
    if(!quest || !quest.sourceId || typeof window.loadGroupQuests !== 'function') return -1;
    return window.loadGroupQuests().findIndex(function(q){ return q.id === quest.sourceId; });
  }

  function updateLegacyQuest(quest, updater){
    if(!quest || !quest.sourceId || typeof window.loadGroupQuests !== 'function' || typeof window.saveGroupQuests !== 'function') return;
    var quests = window.loadGroupQuests();
    var idx = quests.findIndex(function(q){ return q.id === quest.sourceId; });
    if(idx < 0) return;
    updater(quests[idx]);
    window.saveGroupQuests(quests);
  }

  function savePreviewQuest(quest){
    updateLegacyQuest(quest, function(gq){
      gq.steps = (quest.steps || []).map(function(s){ return s.title || s.name || s; });
      gq.target = gq.steps.length || 1;
      gq.progress = (quest.steps || []).filter(function(s){ return s.status === 'completed' || s.done; }).length;
    });
  }

  function isJoined(q){ return (q.acceptedMemberIds || []).indexOf(activeMemberId()) > -1; }

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
      var editable = q.partyType === 'group' && isJoined(q);
      var joined = isJoined(q);
      var html = window.QuestRenderer.renderQuestCard(q, { memberLookup: memberLookup, editableSteps: editable });
      html = html.replace('class="qrCard ', 'class="qrCard '+(!joined && q.partyType === 'group' ? 'notJoined ' : ''));
      if(q.partyType === 'group'){
        var controls = joined
          ? '<div class="qrInlineActions"><button class="primary" type="button" data-preview-save="'+q.id+'">Opslaan</button><button type="button" data-preview-add="'+q.id+'">+ Subtaak</button><button class="danger" type="button" data-preview-leave="'+q.id+'">Verlaat quest</button></div>'
          : '<div class="qrJoinRow"><button class="qrJoinSlot" type="button" data-preview-join="'+q.id+'">+</button><span class="qrJoinHint">Join deze group quest om progress te loggen</span></div>';
        html = html.replace('</article>', controls + '</article>');
      }
      return html;
    }).join('');
    el.innerHTML = '<div class="qrPreview">'
      + '<section class="qrPreviewHero"><small>Renderer preview</small><h2>Nieuwe quest cards</h2><p>Stabiele interactieve cards met joinbare party quests.</p></section>'
      + '<div class="qrPreviewNote">Join eerst een group quest via het + avatar-slot. Pas daarna kun je subtaken/progress loggen.</div>'
      + '<div class="qrPreviewGrid">' + (cards || '<div class="qrPreviewEmpty">Geen quests gevonden om te tonen.</div>') + '</div>'
      + '</div>';
    bindInteractions(quests);
  }

  function readCardSteps(card){
    return Array.prototype.slice.call(card.querySelectorAll('.qrStep:not(.qrStepDraft)')).map(function(row,index){
      var input = row.querySelector('.qrStepInput');
      var title = input ? input.value.trim() : '';
      var done = row.classList.contains('done');
      return title ? { id:'step-'+index, title:title, status:done ? 'completed' : 'open' } : null;
    }).filter(Boolean);
  }

  function bindInteractions(quests){
    var root = document.querySelector('.qrPreview');
    if(!root) return;
    root.addEventListener('click', function(ev){
      var card = ev.target.closest('.qrCard');
      if(card && !ev.target.closest('button') && !ev.target.closest('input')) card.classList.toggle('isEditing');

      var join = ev.target.closest('[data-preview-join]');
      if(join){
        ev.preventDefault();
        var jq = quests.find(function(item){ return item.id === join.getAttribute('data-preview-join'); });
        updateLegacyQuest(jq, function(gq){
          gq.members = gq.members || [];
          if(!gq.members.some(function(m){ return m.id === activeMemberId(); })) gq.members.push({ id:activeMemberId(), status:'joined', contribution:0 });
          gq.invitedMemberIds = (gq.invitedMemberIds || []).filter(function(id){ return id !== activeMemberId(); });
        });
        if(typeof window.showToast === 'function') window.showToast('Je bent gejoined ⚔️');
        renderPreview();
        return;
      }

      var leave = ev.target.closest('[data-preview-leave]');
      if(leave){
        ev.preventDefault();
        var lq = quests.find(function(item){ return item.id === leave.getAttribute('data-preview-leave'); });
        updateLegacyQuest(lq, function(gq){ gq.members = (gq.members || []).filter(function(m){ return m.id !== activeMemberId(); }); });
        if(typeof window.showToast === 'function') window.showToast('Je hebt de quest verlaten');
        renderPreview();
        return;
      }

      if(card && card.classList.contains('notJoined') && (ev.target.closest('[data-step-toggle]') || ev.target.closest('[data-step-remove]'))){
        ev.preventDefault();
        if(typeof window.showToast === 'function') window.showToast('Join eerst de quest om progress te loggen.');
        return;
      }

      var toggle = ev.target.closest('[data-step-toggle]');
      if(toggle){ ev.preventDefault(); var row = toggle.closest('.qrStep'); if(row){ row.classList.toggle('done'); toggle.textContent = row.classList.contains('done') ? '✓' : ''; } }

      var remove = ev.target.closest('[data-step-remove]');
      if(remove){ ev.preventDefault(); var removeRow = remove.closest('.qrStep'); if(removeRow) removeRow.remove(); }

      var add = ev.target.closest('[data-preview-add]');
      if(add){ ev.preventDefault(); var addCard = add.closest('.qrCard'); var draft = addCard && addCard.querySelector('.qrStepDraftInput'); if(draft && draft.value.trim()){ addStepFromDraft(addCard,draft.value.trim()); draft.value=''; } else if(draft) draft.focus(); }

      var save = ev.target.closest('[data-preview-save]');
      if(save){
        ev.preventDefault();
        var q = quests.find(function(item){ return item.id === save.getAttribute('data-preview-save'); });
        var saveCard = save.closest('.qrCard');
        if(q && saveCard){
          var draftInput = saveCard.querySelector('.qrStepDraftInput');
          if(draftInput && draftInput.value.trim()){ addStepFromDraft(saveCard,draftInput.value.trim()); draftInput.value=''; }
          q.steps = readCardSteps(saveCard);
          savePreviewQuest(q);
          if(typeof window.showToast === 'function') window.showToast('Subtaken opgeslagen');
          renderPreview();
        }
      }
    });
    root.addEventListener('keydown', function(ev){
      var draft = ev.target.closest('.qrStepDraftInput');
      if(draft && ev.key === 'Enter'){
        ev.preventDefault();
        var card = draft.closest('.qrCard');
        if(card && card.classList.contains('notJoined')){ if(typeof window.showToast === 'function') window.showToast('Join eerst de quest.'); return; }
        if(draft.value.trim()){ addStepFromDraft(card,draft.value.trim()); draft.value=''; }
      }
    });
  }

  function addStepFromDraft(card,title){
    var list = card && card.querySelector('.qrSteps');
    var draft = list && list.querySelector('.qrStepDraft');
    if(!list || !draft) return;
    var index = list.querySelectorAll('.qrStep:not(.qrStepDraft)').length;
    var row = document.createElement('div');
    row.className = 'qrStep';
    row.setAttribute('data-step-index',index);
    row.innerHTML = '<button type="button" class="qrCheck" data-step-toggle="'+index+'"></button><input class="qrStepInput" value="'+title.replace(/"/g,'&quot;')+'" placeholder="Subtaak"><button type="button" class="qrStepRemove" data-step-remove="'+index+'">×</button>';
    list.insertBefore(row,draft);
  }

  function installTab(){
    injectStyles();
    var tabs = document.querySelector('.task-tabs');
    if(!tabs || document.querySelector('.ttab.qr-preview-tab')) return;
    var btn = document.createElement('button');
    btn.className = 'ttab qr-preview-tab';
    btn.textContent = '✨ Preview';
    btn.onclick = function(){ if(typeof window.setTaskTab === 'function') window.setTaskTab(TAB_ID,btn); else { window.taskTab = TAB_ID; renderPreview(); } };
    tabs.appendChild(btn);
  }

  function patchRenderTasks(){
    if(window.__questRendererPreviewPatched || typeof window.renderTasks !== 'function') return;
    window.__questRendererPreviewPatched = true;
    var original = window.renderTasks;
    window.renderTasks = function(){ if(window.taskTab === TAB_ID){ renderPreview(); return; } return original.apply(this,arguments); };
  }

  function boot(){ installTab(); patchRenderTasks(); if(window.taskTab === TAB_ID) renderPreview(); }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
  setTimeout(boot,300);
  window.addEventListener('familyapp:navigation-rendered', boot);
})();
