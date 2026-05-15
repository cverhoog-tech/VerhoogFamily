'use strict';
// ============================================================
// GROUP QUEST EDITOR v0.284
// Premium local-first creation/edit flow for group quests with
// editable subtasks and family invites.
// ============================================================

(function(){
  var draftSteps = [];
  var editingQuestId = null;

  function esc(value){
    return String(value || '').replace(/[&<>"]/g, function(ch){
      return ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' })[ch];
    });
  }

  function injectStyles(){
    var old = document.getElementById('group-quest-editor-styles');
    if(old) old.remove();
    var s = document.createElement('style');
    s.id = 'group-quest-editor-styles';
    s.textContent = [
      '.gqeOverlay{position:fixed;inset:0;z-index:9999;background:rgba(9,12,18,.52);backdrop-filter:blur(16px);display:flex;align-items:flex-end;justify-content:center;padding:18px}',
      '.gqePanel{width:min(560px,100%);max-height:88vh;overflow:auto;border-radius:30px;background:linear-gradient(180deg,#ffffff,#f7faf6);box-shadow:0 30px 80px rgba(17,24,39,.28);border:1px solid rgba(255,255,255,.72)}',
      '.gqeHero{position:relative;overflow:hidden;border-radius:30px 30px 22px 22px;padding:22px;color:#fff;background:linear-gradient(135deg,rgba(17,24,39,.96),rgba(49,95,44,.92),rgba(109,40,217,.88)),url(https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=90&fm=webp) center/cover}',
      '.gqeHero small{display:block;font-size:10px;font-weight:950;letter-spacing:.14em;text-transform:uppercase;opacity:.72}.gqeHero h2{margin:6px 0 6px;font-size:28px;line-height:1;letter-spacing:-.6px}.gqeHero p{margin:0;font-size:13px;line-height:1.35;opacity:.82;max-width:320px}',
      '.gqeBody{padding:18px}.gqeField{margin-bottom:13px}.gqeField label{display:block;margin:0 0 6px;font-size:11px;font-weight:950;letter-spacing:.08em;text-transform:uppercase;color:#667085}.gqeField input,.gqeField textarea,.gqeField select{width:100%;border:1px solid #e1eadc;background:#fff;border-radius:16px;padding:12px 13px;font-size:15px;font-weight:750;color:#111827;outline:none;box-sizing:border-box}.gqeField textarea{min-height:74px;resize:vertical;line-height:1.35}',
      '.gqeGrid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.gqeSubAdd{display:flex;gap:8px}.gqeSubAdd input{flex:1}.gqeSubAdd button,.gqeActions button{border:0;border-radius:16px;padding:12px 14px;font-size:13px;font-weight:950;cursor:pointer}.gqeSubAdd button{background:#315f2c;color:#fff;white-space:nowrap}',
      '.gqeSteps{display:flex;flex-direction:column;gap:7px;margin-top:9px}.gqeStep{display:flex;align-items:center;gap:8px;background:#fff;border:1px solid #e7ede3;border-radius:15px;padding:9px 10px}.gqeStep span{flex:1;min-width:0;font-size:13px;font-weight:850;color:#111827}.gqeStep button{border:0;width:26px;height:26px;border-radius:50%;background:#fee2e2;color:#b91c1c;font-weight:950}',
      '.gqeMembers{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.gqeMember{position:relative;border:1px solid #e1eadc;background:#fff;border-radius:17px;padding:10px 8px;text-align:center;font-size:12px;font-weight:900;color:#111827}.gqeMember input{position:absolute;opacity:0}.gqeMember b{display:flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:50%;margin:0 auto 6px;background:linear-gradient(135deg,#315f2c,#6d28d9);color:#fff;font-size:10px}.gqeMember:has(input:checked){border-color:#6d28d9;box-shadow:0 0 0 2px rgba(109,40,217,.12);background:#f5f3ff}',
      '.gqeActions{display:flex;gap:9px;padding:0 18px 18px}.gqeActions button{flex:1;background:linear-gradient(135deg,#86efac,#315f2c);color:#07280a}.gqeActions button.ghost{background:#fff;color:#111827;border:1px solid #e1eadc}',
      '.gqEditStepsBtn{background:rgba(255,255,255,.16)!important;color:#fff!important;box-shadow:none!important;border:1px solid rgba(255,255,255,.22)!important;backdrop-filter:blur(12px)!important}',
      '@media(max-width:420px){.gqeOverlay{padding:10px}.gqePanel{max-height:92vh;border-radius:28px}.gqeGrid{grid-template-columns:1fr}.gqeMembers{grid-template-columns:repeat(2,minmax(0,1fr))}.gqeActions{flex-direction:column}}'
    ].join('');
    document.head.appendChild(s);
  }

  function members(){
    if(typeof window.loadGroupQuestMembers === 'function') return window.loadGroupQuestMembers();
    return [
      {id:'shane', name:'Shane', initials:'SH'},
      {id:'esra', name:'Esra', initials:'ES'},
      {id:'family', name:'Gezin', initials:'GF'}
    ];
  }

  function getQuest(id){
    if(typeof window.loadGroupQuests !== 'function') return null;
    return window.loadGroupQuests().find(function(q){ return q.id === id; }) || null;
  }

  function renderSteps(){
    var box = document.getElementById('gqeSteps');
    if(!box) return;
    if(!draftSteps.length){
      box.innerHTML = '<div style="font-size:12px;color:#667085;font-weight:750;padding:4px 2px">Nog geen subtaken toegevoegd.</div>';
      return;
    }
    box.innerHTML = draftSteps.map(function(step, index){
      return '<div class="gqeStep"><span>'+(index+1)+'. '+esc(step)+'</span><button type="button" onclick="removeGroupQuestDraftStep('+index+')">×</button></div>';
    }).join('');
  }

  window.addGroupQuestDraftStep = function(){
    var input = document.getElementById('gqeStepInput');
    var value = input ? input.value.trim() : '';
    if(!value) return;
    draftSteps.push(value);
    input.value = '';
    renderSteps();
  };

  window.removeGroupQuestDraftStep = function(index){
    draftSteps.splice(index, 1);
    renderSteps();
  };

  function modalHtml(quest){
    var editing = !!quest;
    var invited = quest ? (quest.invitedMemberIds || []) : ['esra'];
    var joined = quest ? (quest.members || []).map(function(m){ return m.id; }) : [typeof window.getActiveGroupQuestMemberId === 'function' ? window.getActiveGroupQuestMemberId() : 'shane'];
    var memberHtml = members().map(function(m){
      var checked = invited.indexOf(m.id) > -1 || joined.indexOf(m.id) > -1;
      return '<label class="gqeMember"><input type="checkbox" value="'+esc(m.id)+'" '+(checked?'checked':'')+'><b>'+esc(m.initials || '?')+'</b>'+esc(m.name || m.id)+'</label>';
    }).join('');

    return '<div class="gqeOverlay" id="gqeOverlay">'
      + '<div class="gqePanel">'
      + '<div class="gqeHero"><small>Family raid builder</small><h2>'+(editing?'Group quest bewerken':'Nieuwe group quest')+'</h2><p>Maak een gezamenlijke quest met subtaken, invites en shared XP.</p></div>'
      + '<div class="gqeBody">'
      + '<div class="gqeField"><label>Titel</label><input id="gqeTitle" value="'+esc(quest ? quest.title : '')+'" placeholder="Bijv. Weekend reset"></div>'
      + '<div class="gqeField"><label>Omschrijving</label><textarea id="gqeDesc" placeholder="Wat moet er samen gebeuren?">'+esc(quest ? quest.description : '')+'</textarea></div>'
      + '<div class="gqeGrid"><div class="gqeField"><label>XP reward</label><input id="gqeXp" type="number" value="'+esc(quest ? quest.xp : 220)+'"></div><div class="gqeField"><label>Type</label><select id="gqeType"><option value="task">Task</option><option value="weekly" '+(!quest || quest.type === 'weekly' ? 'selected':'')+'>Weekly</option><option value="raid" '+(quest && quest.type === 'raid' ? 'selected':'')+'>Raid</option></select></div></div>'
      + '<div class="gqeField"><label>Subtaken</label><div class="gqeSubAdd"><input id="gqeStepInput" placeholder="Nieuwe subtaak"><button type="button" onclick="addGroupQuestDraftStep()">Toevoegen</button></div><div class="gqeSteps" id="gqeSteps"></div></div>'
      + '<div class="gqeField"><label>Invite gezinsleden</label><div class="gqeMembers">'+memberHtml+'</div></div>'
      + '</div>'
      + '<div class="gqeActions"><button class="ghost" type="button" onclick="closeGroupQuestEditor()">Annuleer</button><button type="button" onclick="saveGroupQuestEditor()">'+(editing?'Opslaan':'Group quest maken')+'</button></div>'
      + '</div></div>';
  }

  window.closeGroupQuestEditor = function(){
    var el = document.getElementById('gqeOverlay');
    if(el) el.remove();
    editingQuestId = null;
    draftSteps = [];
  };

  window.openGroupQuestEditor = function(id){
    injectStyles();
    var quest = id ? getQuest(id) : null;
    editingQuestId = quest ? quest.id : null;
    draftSteps = quest && Array.isArray(quest.steps) ? quest.steps.slice() : [];
    if(!draftSteps.length && !quest) draftSteps = ['Hulp accepteren', 'Taak verdelen', 'Samen afronden'];
    var old = document.getElementById('gqeOverlay');
    if(old) old.remove();
    document.body.insertAdjacentHTML('beforeend', modalHtml(quest));
    renderSteps();
    var input = document.getElementById('gqeStepInput');
    if(input){
      input.addEventListener('keydown', function(ev){
        if(ev.key === 'Enter'){
          ev.preventDefault();
          window.addGroupQuestDraftStep();
        }
      });
    }
  };

  window.saveGroupQuestEditor = function(){
    if(typeof window.loadGroupQuests !== 'function' || typeof window.saveGroupQuests !== 'function') return;
    var title = (document.getElementById('gqeTitle') || {}).value || '';
    var desc = (document.getElementById('gqeDesc') || {}).value || '';
    var xp = parseInt((document.getElementById('gqeXp') || {}).value || '220', 10);
    var type = (document.getElementById('gqeType') || {}).value || 'weekly';
    title = title.trim();
    desc = desc.trim();
    if(!title){
      if(typeof window.showToast === 'function') window.showToast('Geef de group quest een titel.');
      return;
    }
    if(!draftSteps.length){
      if(typeof window.showToast === 'function') window.showToast('Voeg minimaal één subtaak toe.');
      return;
    }

    var selected = Array.prototype.slice.call(document.querySelectorAll('.gqeMember input:checked')).map(function(i){ return i.value; });
    var activeId = typeof window.getActiveGroupQuestMemberId === 'function' ? window.getActiveGroupQuestMemberId() : 'shane';
    var quests = window.loadGroupQuests();
    var idx = editingQuestId ? quests.findIndex(function(q){ return q.id === editingQuestId; }) : -1;
    var existing = idx > -1 ? quests[idx] : null;
    var existingMembers = existing ? (existing.members || []) : [{ id: activeId, status: 'joined', contribution: 0 }];
    var joinedIds = existingMembers.map(function(m){ return m.id; });
    if(joinedIds.indexOf(activeId) === -1) existingMembers.push({ id: activeId, status: 'joined', contribution: 0 });

    var invited = selected.filter(function(id){ return joinedIds.indexOf(id) === -1; });
    var quest = Object.assign({}, existing || {}, {
      id: existing ? existing.id : 'gq-' + Date.now(),
      title: title,
      description: desc || 'Nieuwe gezamenlijke quest voor het gezin.',
      type: type,
      status: existing ? existing.status : 'open',
      target: draftSteps.length,
      progress: Math.min(existing ? (existing.progress || 0) : 0, draftSteps.length),
      xp: isNaN(xp) ? 220 : xp,
      coinReward: existing ? (existing.coinReward || 30) : 30,
      multiplier: existing ? (existing.multiplier || 1.12) : 1.12,
      deadline: existing ? (existing.deadline || (typeof window.gqTodayIso === 'function' ? window.gqTodayIso() : new Date().toISOString().slice(0,10))) : (typeof window.gqTodayIso === 'function' ? window.gqTodayIso() : new Date().toISOString().slice(0,10)),
      members: existingMembers,
      invitedMemberIds: invited,
      helpRequested: true,
      steps: draftSteps.slice()
    });

    if(idx > -1) quests[idx] = quest;
    else quests.unshift(quest);
    window.saveGroupQuests(quests);
    if(typeof window.showToast === 'function') window.showToast(editingQuestId ? 'Group quest bijgewerkt' : 'Group quest aangemaakt ⚔️');
    window.closeGroupQuestEditor();
    if(typeof window.renderTasks === 'function') window.renderTasks();
  };

  window.createDemoGroupQuest = function(){
    window.openGroupQuestEditor();
  };

  function addEditButtons(){
    document.querySelectorAll('#task-content .gq-card.premium').forEach(function(card){
      if(card.querySelector('.gqEditStepsBtn')) return;
      var contribute = Array.prototype.slice.call(card.querySelectorAll('button')).find(function(btn){
        return /contributeGroupQuest/.test(btn.getAttribute('onclick') || '');
      });
      if(!contribute) return;
      var onclick = contribute.getAttribute('onclick') || '';
      var match = onclick.match(/contributeGroupQuest\('([^']+)'\)/);
      if(!match) return;
      var id = match[1];
      var btn = document.createElement('button');
      btn.className = 'gqEditStepsBtn';
      btn.type = 'button';
      btn.textContent = '✏️ Subtaken';
      btn.onclick = function(ev){
        ev.preventDefault();
        ev.stopPropagation();
        window.openGroupQuestEditor(id);
      };
      contribute.parentNode.insertBefore(btn, contribute);
    });
  }

  function boot(){
    injectStyles();
    addEditButtons();
    var root = document.getElementById('task-content');
    if(root && !window.__groupQuestEditorObserver){
      window.__groupQuestEditorObserver = new MutationObserver(function(){
        clearTimeout(window.__groupQuestEditorTimer);
        window.__groupQuestEditorTimer = setTimeout(addEditButtons, 80);
      });
      window.__groupQuestEditorObserver.observe(root, { childList: true, subtree: true });
    }
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
  setTimeout(boot, 400);
  setTimeout(boot, 1000);
})();
