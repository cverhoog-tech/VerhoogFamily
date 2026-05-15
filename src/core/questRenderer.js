'use strict';
// ============================================================
// QUEST RENDERER v0.291
// Stable renderer foundation for future task/group/main quest screens.
// No MutationObservers, no DOM patch loops, no gesture overrides.
// ============================================================

(function(){
  var VERSION = '0.291';

  var IMAGE_RULES = [
    { keys: ['auto', 'car', 'wassen'], url: 'https://images.unsplash.com/photo-1607860108855-64acf2078ed9?auto=format&fit=crop&w=900&q=92&fm=webp' },
    { keys: ['boodschap', 'winkel', 'grocery', 'market'], url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=900&q=92&fm=webp' },
    { keys: ['schoon', 'reset', 'huis', 'kamer', 'stofzuig', 'opruim'], url: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=900&q=92&fm=webp' },
    { keys: ['was', 'laundry', 'kleding'], url: 'https://images.unsplash.com/photo-1545173168-9f1947eebb7f?auto=format&fit=crop&w=900&q=92&fm=webp' },
    { keys: ['kook', 'eten', 'maaltijd', 'recept'], url: 'https://images.unsplash.com/photo-1543353071-10c8ba85a904?auto=format&fit=crop&w=900&q=92&fm=webp' },
    { keys: ['date', 'romantisch', 'partner', 'liefde'], url: 'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=900&q=92&fm=webp' },
    { keys: ['trip', 'efteling', 'bucket', 'uitje'], url: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=92&fm=webp' },
    { keys: ['plan', 'agenda', 'werk', 'admin'], url: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=900&q=92&fm=webp' }
  ];

  function esc(value){
    return String(value || '').replace(/[&<>\"]/g, function(ch){
      return ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' })[ch];
    });
  }

  function pickImage(quest){
    var text = ((quest.title || '') + ' ' + (quest.description || '') + ' ' + (quest.questType || '')).toLowerCase();
    for(var i=0;i<IMAGE_RULES.length;i++){
      if(IMAGE_RULES[i].keys.some(function(key){ return text.indexOf(key) > -1; })) return IMAGE_RULES[i].url;
    }
    return quest.background || 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?auto=format&fit=crop&w=900&q=92&fm=webp';
  }

  function progress(quest){
    if(window.QuestEngine && typeof window.QuestEngine.calculateProgress === 'function'){
      return window.QuestEngine.calculateProgress(quest);
    }
    var steps = quest.steps || [];
    if(steps.length){
      var done = steps.filter(function(s){ return s.status === 'completed' || s.done; }).length;
      return { completed: done, total: steps.length, percent: Math.round(done / Math.max(1, steps.length) * 100) };
    }
    return { completed: quest.progress || 0, total: quest.target || 1, percent: Math.round((quest.progress || 0) / Math.max(1, quest.target || 1) * 100) };
  }

  function renderAvatars(quest, memberLookup){
    var ids = [];
    (quest.acceptedMemberIds || []).forEach(function(id){ if(ids.indexOf(id) === -1) ids.push(id); });
    (quest.assignedMemberIds || []).forEach(function(id){ if(ids.indexOf(id) === -1) ids.push(id); });
    if(!ids.length && quest.ownerId) ids.push(quest.ownerId);
    if(!ids.length) return '';
    return '<div class="qrAvatars">' + ids.slice(0,4).map(function(id){
      var m = memberLookup && memberLookup(id) || { initials: String(id || '?').slice(0,2).toUpperCase() };
      var img = m.avatar || m.avatarUrl || m.photoURL || '';
      return '<span class="qrAvatar '+(img?'hasImg':'')+'" '+(img?'style="background-image:url('+esc(img)+')"':'')+'>'+(!img?esc(m.initials || '?'):'')+'</span>';
    }).join('') + '</div>';
  }

  function renderSteps(quest){
    var steps = quest.steps || [];
    if(!steps.length) return '';
    return '<div class="qrSteps">' + steps.slice(0,5).map(function(step){
      var done = step.status === 'completed' || step.done;
      return '<div class="qrStep '+(done?'done':'')+'"><span class="qrCheck">'+(done?'✓':'')+'</span><b>'+esc(step.title || step)+'</b></div>';
    }).join('') + '</div>';
  }

  function renderQuestCard(quest, options){
    options = options || {};
    var p = progress(quest);
    var isGroup = quest.partyType === 'group' || quest.helpRequested;
    var bg = pickImage(quest);
    var reward = quest.rewards && quest.rewards.xp || quest.xp || 0;
    return '<article class="qrCard '+(isGroup?'group':'')+'" data-quest-id="'+esc(quest.id)+'">'
      + '<div class="qrBg" style="background-image:url('+bg+')"></div>'
      + '<div class="qrShade"></div>'
      + '<div class="qrContent">'
      + '<div class="qrTop"><span class="qrBadge">'+(isGroup?'⚔️ Group Quest':'✅ Quest')+'</span><span class="qrXp">'+reward+' XP</span></div>'
      + '<h3>'+esc(quest.title)+'</h3>'
      + '<p>'+esc(quest.description)+'</p>'
      + '<div class="qrMeta">'+renderAvatars(quest, options.memberLookup)+'<span>'+p.completed+'/'+p.total+' stappen</span></div>'
      + '<div class="qrProgress"><i style="width:'+p.percent+'%"></i></div>'
      + renderSteps(quest)
      + '</div>'
      + '</article>';
  }

  function injectStyles(){
    if(document.getElementById('quest-renderer-styles')) return;
    var s = document.createElement('style');
    s.id = 'quest-renderer-styles';
    s.textContent = [
      '.qrCard{position:relative;overflow:hidden;border-radius:28px;min-height:230px;margin:0 0 14px;color:#fff;box-shadow:0 20px 42px rgba(17,24,39,.18);isolation:isolate}',
      '.qrBg{position:absolute;inset:0;background-size:cover;background-position:center;z-index:0}',
      '.qrShade{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.06),rgba(0,0,0,.46) 48%,rgba(9,14,20,.88));z-index:1}',
      '.qrContent{position:relative;z-index:2;min-height:230px;display:flex;flex-direction:column;justify-content:flex-end;padding:16px}',
      '.qrTop{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:8px}.qrBadge{border-radius:999px;background:rgba(255,255,255,.16);border:1px solid rgba(255,255,255,.18);padding:6px 9px;font-size:10px;font-weight:950;text-transform:uppercase;letter-spacing:.08em}.qrXp{border-radius:999px;background:linear-gradient(135deg,#fef3c7,#facc15);color:#2d2100;padding:7px 10px;font-size:12px;font-weight:950}',
      '.qrCard h3{margin:0 0 6px;font-size:25px;line-height:1.02;letter-spacing:-.65px}.qrCard p{margin:0 0 11px;font-size:13px;line-height:1.35;color:rgba(255,255,255,.78)}',
      '.qrMeta{display:flex;align-items:center;justify-content:space-between;gap:10px;font-size:11px;font-weight:900;color:rgba(255,255,255,.78)}.qrAvatars{display:flex}.qrAvatar{width:30px;height:30px;border-radius:50%;margin-right:-8px;border:2px solid rgba(255,255,255,.88);background:linear-gradient(135deg,#315f2c,#6d28d9);display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:950;background-size:cover;background-position:center}',
      '.qrProgress{height:8px;border-radius:999px;background:rgba(255,255,255,.20);overflow:hidden;margin-top:10px}.qrProgress i{display:block;height:100%;border-radius:999px;background:linear-gradient(90deg,#86efac,#c4b5fd)}',
      '.qrSteps{display:flex;flex-direction:column;gap:7px;margin-top:12px}.qrStep{display:flex;align-items:center;gap:8px;padding:8px 9px;border-radius:14px;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.12)}.qrStep b{font-size:12px;color:rgba(255,255,255,.88)}.qrCheck{width:19px;height:19px;border-radius:7px;border:2px solid rgba(134,239,172,.72);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:950;color:#bbf7d0}.qrStep.done{background:rgba(34,197,94,.18)}'
    ].join('');
    document.head.appendChild(s);
  }

  window.QuestRenderer = {
    version: VERSION,
    injectStyles: injectStyles,
    pickImage: pickImage,
    renderQuestCard: renderQuestCard,
    renderSteps: renderSteps
  };

  injectStyles();
})();
