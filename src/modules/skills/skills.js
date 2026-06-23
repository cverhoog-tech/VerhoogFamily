'use strict';
// ============================================================
// SKILLS SYSTEEM
// ============================================================

var SKILL_TITLES = [
  // Tier 1 — lv 1-3: rampzalig
  ['🐣 Absolute beginner',        '🤷 Hoe doe je dit ook alweer?',   '😬 Gevaar voor omgeving'],
  // Tier 2 — lv 4-6: moeizaam
  ['🧹 Bijna nuttig',              '👀 Het lijkt ergens op',           '🐌 Langzaam maar zeker'],
  // Tier 3 — lv 7-9: redelijk
  ['🙂 Doet het gewoon',           '💪 Je begint het door te krijgen', '✅ Betrouwbaar'],
  // Tier 4 — lv 10-12: goed
  ['🌟 Echt goed bezig',           '⚡ Vlot aan het werk',             '🏅 Trots op jezelf'],
  // Tier 5 — lv 13-15: expert
  ['🎖️ Semi-professional',         '🔥 Onomstreden expert',            '👑 Huishoud-legende'],
  // Tier 6 — lv 16-18: mythisch
  ['🌌 Mythische status',          '⚗️ Wijze der wijzen',              '🦄 Bestaat maar 1x'],
  // Tier 7 — lv 19-21: transcendent
  ['🌠 Boven het niveau',          '🧬 Aangeboren talent',             '🔮 Ziet de was aankomen'],
  // Tier 8 — lv 22-24: kosmisch
  ['🌍 Aardse perfectie',          '🪐 Planetaire schoonmaak',         '☀️ Zon schijnt op jou'],
  // Tier 9 — lv 25+: godelijk
  ['⚡ Taak-godheid',              '🌌 Kosmische meester',             '🦋 Één met het huishouden'],
];

function getSkillTitle(level) {
  var tier = Math.min(Math.floor((level-1)/3), SKILL_TITLES.length-1);
  var pos  = Math.min((level-1)%3, 2);
  return SKILL_TITLES[tier][pos];
}

function skillXpForLevel(lv) { return Math.floor(20 + lv*15 + Math.pow(lv,1.6)); }
function skillTotalXpForLevel(lv) { var t=0; for(var i=1;i<lv;i++) t+=skillXpForLevel(i); return t; }
function skillLevelFromXp(xp) { var lv=1; while(xp>=skillTotalXpForLevel(lv+1)) lv++; return lv; }
function skillXpInCurrentLevel(xp) { return xp - skillTotalXpForLevel(skillLevelFromXp(xp)); }
function skillXpToNextLevel(xp) { return skillXpForLevel(skillLevelFromXp(xp)); }

var SKILL_DEFS = [
  {id:'vacuum',      icon:'🧹', name:'Stofzuigen',      color:'#2d5a27', xpPerDo:12, desc:'Stofzuig een ruimte'},
  {id:'windows',     icon:'🪟', name:'Ramen zemen',     color:'#1a6fa8', xpPerDo:18, desc:'Zeem alle ramen'},
  {id:'cooking',     icon:'🍳', name:'Koken',            color:'#d97706', xpPerDo:15, desc:'Maak een maaltijd'},
  {id:'dishes',      icon:'🍽️', name:'Afwassen',         color:'#7c3aed', xpPerDo:8,  desc:'Was de vaat af'},
  {id:'laundry',     icon:'👕', name:'Was doen',         color:'#0ea5e9', xpPerDo:10, desc:'Was draaien + opvouwen'},
  {id:'ironing',     icon:'👔', name:'Strijken',         color:'#c0547a', xpPerDo:14, desc:'Strijk een lading kleren'},
  {id:'groceries',   icon:'🛒', name:'Boodschappen',     color:'#059669', xpPerDo:10, desc:'Doe de boodschappen'},
  {id:'cooking_pro', icon:'👨‍🍳', name:'Gourmet koken',  color:'#dc2626', xpPerDo:25, desc:'Maak een uitgebreid gerecht'},
  {id:'tidying',     icon:'🗂️', name:'Opruimen',         color:'#6366f1', xpPerDo:10, desc:'Ruim een ruimte op'},
  {id:'mopping',     icon:'🪣', name:'Dweilen',          color:'#64748b', xpPerDo:16, desc:'Dweil de vloer'},
  {id:'bathroom',    icon:'🚿', name:'Badkamer schoon',  color:'#0891b2', xpPerDo:20, desc:'Maak de badkamer schoon'},
  {id:'garden',      icon:'🌱', name:'Tuinieren',        color:'#16a34a', xpPerDo:18, desc:'Werk in de tuin'},
  {id:'trash',       icon:'🗑️', name:'Vuilnis',          color:'#78716c', xpPerDo:6,  desc:'Breng de vuilnisbakken weg'},
  {id:'finance_sk',  icon:'💰', name:'Budgetteren',      color:'#b45309', xpPerDo:15, desc:'Bijhouden van financiën'},
  {id:'planning',    icon:'📋', name:'Plannen',          color:'#4338ca', xpPerDo:12, desc:'Plan taken en activiteiten'}
];

var skillsData = {Shane:{}, Esra:{}};
['Shane','Esra'].forEach(function(p){
  SKILL_DEFS.forEach(function(d){ skillsData[p][d.id]={xp:0,log:[]}; });
});

// Laad persistent data
(function(){
  var raw = localStorage.getItem('fam_skills_v1');
  if(raw) {
    try {
      var saved = JSON.parse(raw);
      ['Shane','Esra'].forEach(function(p){
        if(saved[p]) {
          SKILL_DEFS.forEach(function(d){
            if(saved[p][d.id]) skillsData[p][d.id] = saved[p][d.id];
          });
        }
      });
    } catch(e){}
  } else {
    // Eerste keer — zet demo starter XP
    skillsData.Shane.vacuum.xp=145; skillsData.Shane.cooking.xp=210;
    skillsData.Shane.groceries.xp=90; skillsData.Shane.dishes.xp=55;
    skillsData.Esra.laundry.xp=180; skillsData.Esra.cooking.xp=290;
    skillsData.Esra.tidying.xp=120; skillsData.Esra.bathroom.xp=95;
    saveSkills();
  }
})();

function saveSkills() {
  try { localStorage.setItem('fam_skills_v1', JSON.stringify(skillsData)); } catch(e){}
}

var skillsViewPerson = 'Shane';
var skillsViewFilter = 'all';

function renderSkills() {
  var el = document.getElementById('skills-content');
  if(!el) return;
  var person = skillsViewPerson;
  var isShane = person==='Shane';
  var pColor = isShane ? '#2d5a27' : '#c0547a';
  var pColor2 = isShane ? '#4a8a42' : '#d4709a';
  var pData = skillsData[person];

  var skills = SKILL_DEFS.map(function(def){
    var d=pData[def.id]||{xp:0,log:[]};
    return Object.assign({},def,{xp:d.xp,log:d.log||[],level:skillLevelFromXp(d.xp)});
  });
  if(skillsViewFilter==='top') skills=skills.slice().sort(function(a,b){return b.xp-a.xp;}).slice(0,6);
  else if(skillsViewFilter==='recent') skills=skills.filter(function(s){return s.log.length>0;})
    .sort(function(a,b){var la=a.log[a.log.length-1],lb=b.log[b.log.length-1];return(lb?lb.date:'')>(la?la.date:'')?1:-1;});

  var totalLevels=SKILL_DEFS.reduce(function(s,d){return s+skillLevelFromXp((pData[d.id]||{}).xp||0);},0);
  var maxSk=SKILL_DEFS.reduce(function(best,d){var xp=(pData[d.id]||{}).xp||0;return xp>best.xp?Object.assign({},d,{xp:xp}):best;},{xp:0,name:'–',icon:'?'});

  var html='<div style="background:linear-gradient(135deg,'+pColor+','+pColor2+');color:#fff;padding:22px 16px 16px">'
    +'<div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">'
    +'<div style="width:50px;height:50px;border-radius:50%;background:rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:800;flex-shrink:0">'
    +person.substring(0,2).toUpperCase()+'</div>'
    +'<div><div style="font-size:20px;font-weight:800">'+person+'\'s Skills</div>'
    +'<div style="font-size:12px;opacity:.8;margin-top:2px">'+totalLevels+' totale levels · Best: '+maxSk.icon+' '+maxSk.name+'</div>'
    +'</div></div>'
    +'<div style="display:flex;gap:5px;flex-wrap:wrap">'
    +SKILL_DEFS.map(function(def){
      var xp=(pData[def.id]||{}).xp||0,lv=skillLevelFromXp(xp),pct=Math.min(lv/10,1);
      return '<span title="'+def.name+' Lv '+lv+'" style="font-size:18px;opacity:'+(0.25+pct*.75)+';transform:scale('+(0.65+pct*.45)+');display:inline-block">'+def.icon+'</span>';
    }).join('')
    +'</div></div>';

  // Person tabs
  html+='<div class="skills-person-tabs">'
    +'<button class="skills-ptab'+(isShane?' active':'')+'" id="skt-shane" style="'+(isShane?'background:#2d5a27':'')+'">Shane</button>'
    +'<button class="skills-ptab'+(!isShane?' active':'')+'" id="skt-esra" style="'+(!isShane?'background:#c0547a':'')+'">Esra</button>'
    +'</div>';

  // Filter chips
  html+='<div class="chips" style="padding:10px 16px 6px">'
    +[['all','Alle'],['top','🏆 Top 6'],['recent','🕐 Recent']].map(function(f){
      return '<div class="chip'+(skillsViewFilter===f[0]?' active':'')+'" data-sf="'+f[0]+'">'+f[1]+'</div>';
    }).join('')+'</div>';

  html+='<div style="padding:4px 0 90px">';
  if(!skills.length){
    html+='<div style="text-align:center;padding:40px;color:var(--c-text2)">Nog geen activiteit</div>';
  } else {
    skills.forEach(function(sk){
      var xpIn=skillXpInCurrentLevel(sk.xp),xpTo=skillXpToNextLevel(sk.xp);
      var pct=xpTo?Math.round(xpIn/xpTo*100):100;
      var title=getSkillTitle(sk.level);
      var dots=sk.log.slice(-12).map(function(l){
        return '<div class="skill-hist-dot" style="background:'+sk.color+';opacity:'+(0.25+(l.xp/25)*.75)+'"></div>';
      }).join('');
      html+='<div class="skill-card">'
        +'<div class="skill-top">'
        +'<div class="skill-icon" style="background:'+sk.color+'22">'+sk.icon+'</div>'
        +'<div class="skill-info"><div class="skill-name">'+sk.name+'</div>'
        +'<div class="skill-title" style="color:'+sk.color+'">'+title+'</div></div>'
        +'<div class="skill-lvl-badge" style="background:'+sk.color+'">Lv '+sk.level+'</div>'
        +'</div>'
        +'<div class="skill-xp-row">'
        +'<div class="skill-xp-bar"><div class="skill-xp-fill" style="width:'+pct+'%;background:'+sk.color+'"></div></div>'
        +'<div class="skill-xp-txt">'+xpIn+' / '+xpTo+' XP</div>'
        +'</div>'
        +(dots?'<div class="skill-history">'+dots+'</div>':'')
        +'<div id="skill-kw-'+sk.id+'" class="skill-actions" style="flex-direction:column;gap:5px">'
        +'</div></div>';
    });
  }
  html+='</div>';
  el.innerHTML=html;

  // Events
  document.getElementById('skt-shane').onclick=function(){skillsViewPerson='Shane';renderSkills();};
  document.getElementById('skt-esra').onclick =function(){skillsViewPerson='Esra'; renderSkills();};
  el.querySelectorAll('[data-sf]').forEach(function(c){c.onclick=function(){skillsViewFilter=c.dataset.sf;renderSkills();};});

  // Populate keyword hints per skill card
  skills.forEach(function(sk){
    var kwEl = document.getElementById('skill-kw-'+sk.id);
    if(!kwEl) return;
    var matchingKeywords = Object.keys(TASK_SKILL_MAP)
      .filter(function(k){return TASK_SKILL_MAP[k]===sk.id && !k.startsWith('#');}).slice(0,5);
    var hashtag = Object.keys(TASK_SKILL_MAP).find(function(k){return k.startsWith('#') && TASK_SKILL_MAP[k]===sk.id;});
    kwEl.innerHTML = '<div style="font-size:11px;color:var(--c-text2);line-height:1.8">'
      +'<span style="font-weight:700;color:var(--c-text)">Auto XP</span> als taak bevat: '
      +matchingKeywords.map(function(kw){
        return '<span style="background:var(--c-surface2);border-radius:6px;padding:1px 7px;font-size:10px;font-weight:600;margin:0 1px">'+kw+'</span>';
      }).join('')
      +(hashtag ? ' · gebruik tag <span style="background:'+sk.color+'22;color:'+sk.color+';border-radius:6px;padding:2px 8px;font-size:10px;font-weight:700;cursor:pointer" onclick="showToast(\'Voeg '+hashtag+' toe aan een taaknaam voor auto-XP!\')">'+hashtag+'</span>' : '')
      +'</div>';
  });

  el.querySelectorAll('[data-infoskill]').forEach(function(btn){
    btn.onclick=function(e){e.stopPropagation();
      var d=SKILL_DEFS.find(function(x){return x.id===btn.dataset.infoskill;});
      if(d)showToast(d.icon+' '+d.name+' · '+d.desc+' · +'+d.xpPerDo+' XP per taak');
    };
  });
}

function logSkill(person, skillId) {
  var def=SKILL_DEFS.find(function(d){return d.id===skillId;});if(!def)return;
  if(!skillsData[person][skillId])skillsData[person][skillId]={xp:0,log:[]};
  var sk=skillsData[person][skillId];
  var prevLv=skillLevelFromXp(sk.xp);
  sk.xp+=def.xpPerDo;
  sk.log.push({date:new Date().toISOString(),xp:def.xpPerDo});
  var newLv=skillLevelFromXp(sk.xp);
  showXPPopup(def.xpPerDo, def.name);
  awardXP(Math.floor(def.xpPerDo/3), def.name);
  if(newLv>prevLv) showSkillLevelUp(person,def,newLv);
  else showToast(def.icon+' '+person+' deed '+def.name+'! +'+def.xpPerDo+' XP');
  addActivity(def.icon, def.color+'22', person+' deed '+def.name+' (Lv '+newLv+')');
  saveSkills();
  renderSkills();
}

// ── SKILL XP INDICATOR ──
function showSkillXpIndicator(def) {
  var el = document.createElement('div');
  el.className = 'skill-xp-indicator';
  el.innerHTML = '<span style="font-size:16px">'+def.icon+'</span>'
    +'<span style="font-size:12px;font-weight:700;color:'+def.color+'">+'+def.xpPerDo+' '+def.name+'</span>';
  // Position near center-bottom of screen
  el.style.bottom = '90px';
  el.style.left = '50%';
  el.style.transform = 'translateX(-50%)';
  document.body.appendChild(el);
  setTimeout(function(){ el.remove(); }, 1500);
}

// ── LIVE UNLOCK QUEUE ──
// Shows a beautiful full-screen card when something important is unlocked
var _unlockQueue = [];
var _unlockShowing = false;

function queueUnlock(card) {
  _unlockQueue.push(card);
  if(!_unlockShowing) _showNextUnlock();
}

function _showNextUnlock() {
  if(!_unlockQueue.length) { _unlockShowing = false; return; }
  _unlockShowing = true;
  var card = _unlockQueue.shift();
  var overlay = document.getElementById('unlock-overlay');
  var cardEl  = document.getElementById('unlock-card');
  if(!overlay || !cardEl) { _unlockShowing = false; return; }

  var whoColor = card.who === myName ? 'var(--c-primary)' : 'var(--c-partner)';
  var whoInit  = card.who ? card.who.substring(0,2).toUpperCase() : '';

  cardEl.innerHTML =
    '<div class="unlock-card-top">'+card.icon+'</div>'
    +'<div class="unlock-card-label">'+card.type+'</div>'
    +'<div class="unlock-card-title">'+card.title+'</div>'
    +'<div class="unlock-card-desc">'+card.desc+'</div>'
    +(card.who
      ? '<div class="unlock-card-who" style="background:'+whoColor+'22;color:'+whoColor+'">'
        +'<div style="width:20px;height:20px;border-radius:50%;background:'+whoColor+';color:#fff;font-size:9px;font-weight:800;display:flex;align-items:center;justify-content:center">'+whoInit+'</div>'
        +card.who
        +'</div>'
      : '')
    +(card.extra ? '<div style="font-size:12px;color:var(--c-text2);margin-bottom:12px">'+card.extra+'</div>' : '')
    +'<button class="unlock-card-btn" id="unlock-close-btn">🎉 Awesome!</button>';

  overlay.style.display = 'flex';
  overlay.classList.add('has-content');

  document.getElementById('unlock-close-btn').onclick = function(){
    overlay.style.display = 'none';
    overlay.classList.remove('has-content');
    cardEl.innerHTML = '';
    setTimeout(_showNextUnlock, 200);
  };

  // Confetti for epic+ unlocks
  if(card.confetti) spawnConfetti();
}

// ── LEVEL UP — uses new overlay ──
function showLevelUp(level) {
  var titleData = LEVEL_TITLES[Math.min(level-1, LEVEL_TITLES.length-1)];
  queueUnlock({
    icon: '🎉',
    type: 'Level omhoog!',
    title: 'Level '+level,
    desc: titleData ? titleData.title+'\n"'+titleData.desc+'"' : 'Nieuw level bereikt!',
    who: myName,
    confetti: true
  });
}

// ── ACHIEVEMENT TOAST → also queue for important ones ──
function showAchievementToast(badge) {
  // Always show the slide-in toast
  var existing = document.querySelector('.ach-toast');
  if(existing) existing.remove();
  var rarityLabel = {common:'Gewoon',rare:'Zeldzaam',epic:'Episch',legendary:'Legendarisch'}[badge.rarity]||'';
  var toast = document.createElement('div');
  toast.className = 'ach-toast';
  toast.innerHTML =
    '<div class="ach-toast-icon">'+badge.icon+'</div>'
    +'<div class="ach-toast-body">'
    +'<div class="ach-toast-label">🏆 Achievement unlocked · '+rarityLabel+'</div>'
    +'<div class="ach-toast-name">'+badge.name+'</div>'
    +'<div class="ach-toast-desc">'+badge.funny+'</div>'
    +'</div>'
    +'<div class="ach-toast-xp">+'+badge.xp+' XP</div>'
    +'<div class="ach-toast-close">✕</div>';
  toast.onclick = function(){
    toast.classList.add('hiding');
    setTimeout(function(){ toast.remove(); }, 260);
  };
  document.body.appendChild(toast);
  var timer = setTimeout(function(){
    if(toast.parentNode){ toast.classList.add('hiding'); setTimeout(function(){toast.remove();},260); }
  }, 5000);
  toast.addEventListener('touchstart', function(e){ var sy=e.touches[0].clientY; toast.addEventListener('touchmove',function(e2){if(e2.touches[0].clientY<sy-30){clearTimeout(timer);toast.classList.add('hiding');setTimeout(function(){toast.remove();},260);}}); });

  // For epic/legendary: also show full overlay
  if(badge.rarity === 'epic' || badge.rarity === 'legendary') {
    setTimeout(function(){
      queueUnlock({
        icon: badge.icon,
        type: '🏆 '+{epic:'Epische',legendary:'Legendarische'}[badge.rarity]+' Badge!',
        title: badge.name,
        desc: badge.desc,
        who: myName,
        extra: '"'+badge.funny+'"',
        confetti: badge.rarity === 'legendary'
      });
    }, 800);
  }
}

// ── SKILL LEVEL UP — uses overlay ──
function showSkillLevelUp(person, def, level) {
  var title = getSkillTitle(level);
  // Small toast for minor levels, full overlay for milestone levels
  if(level % 5 === 0 || level >= 10) {
    queueUnlock({
      icon: def.icon,
      type: '⚡ Skill Level Up!',
      title: def.name+' — Level '+level,
      desc: title,
      who: person,
      confetti: level % 5 === 0
    });
  } else {
    // Compact banner toast
    var ex = document.querySelector('.skill-levelup'); if(ex) ex.remove();
    var el = document.createElement('div');
    el.className = 'skill-levelup';
    el.innerHTML = '<div style="font-size:28px">'+def.icon+'</div>'
      +'<div style="flex:1"><div style="font-size:10px;opacity:.7;text-transform:uppercase;letter-spacing:.5px">'+person+' · '+def.name+' Level Up!</div>'
      +'<div style="font-size:16px;font-weight:800;margin:1px 0">Level '+level+'</div>'
      +'<div style="font-size:12px;opacity:.85">'+title+'</div></div>'
      +'<div style="font-size:11px;opacity:.5">✕</div>';
    el.onclick = function(){ el.remove(); };
    document.body.appendChild(el);
    setTimeout(function(){if(el.parentNode){el.style.animation='achSlideOut .3s ease forwards';setTimeout(function(){el.remove();},300);}},4000);
  }
}

// ── KEYWORD → SKILL mapping (also supports #hashtags in task titles) ──
var TASK_SKILL_MAP = {
  // Stofzuigen
  'stofzuig': 'vacuum', 'vacuüm': 'vacuum', 'hoover': 'vacuum', '#stofzuigen': 'vacuum',
  // Ramen
  'ramen zem': 'windows', 'ramen poets': 'windows', 'raam': 'windows', '#ramen': 'windows',
  // Koken
  'koken': 'cooking', 'gekookt': 'cooking', 'avondeten': 'cooking', 'lunch mak': 'cooking',
  'ontbijt mak': 'cooking', '#koken': 'cooking',
  // Gourmet
  'gourmet': 'cooking_pro', 'uitgebreid gerecht': 'cooking_pro', '#gourmet': 'cooking_pro',
  // Afwassen
  'afwas': 'dishes', 'vaatwas': 'dishes', 'borden': 'dishes', '#afwassen': 'dishes',
  // Was
  'was doen': 'laundry', 'wasmachine': 'laundry', 'wassen': 'laundry', 'ophangen': 'laundry',
  'opvouwen': 'laundry', '#was': 'laundry',
  // Strijken
  'strijk': 'ironing', '#strijken': 'ironing',
  // Boodschappen
  'boodschap': 'groceries', 'supermarkt': 'groceries', 'jumbo': 'groceries',
  'albert heijn': 'groceries', 'lidl': 'groceries', '#boodschappen': 'groceries',
  // Opruimen
  'opruim': 'tidying', 'rommel': 'tidying', 'ordenen': 'tidying', '#opruimen': 'tidying',
  // Dweilen
  'dweil': 'mopping', 'mop': 'mopping', 'vloer schoon': 'mopping', '#dweilen': 'mopping',
  // Badkamer
  'badkamer': 'bathroom', 'toilet': 'bathroom', 'douche': 'bathroom', 'bad schoon': 'bathroom',
  '#badkamer': 'bathroom',
  // Tuin
  'tuin': 'garden', 'maaien': 'garden', 'snoeien': 'garden', 'planten water': 'garden',
  '#tuin': 'garden',
  // Vuilnis
  'vuilnis': 'trash', 'vuilnisbak': 'trash', 'afval': 'trash', 'container': 'trash',
  '#vuilnis': 'trash',
  // Financiën
  'begroting': 'finance_sk', 'rekening': 'finance_sk', 'belasting': 'finance_sk',
  'budget': 'finance_sk', '#financiën': 'finance_sk', '#budget': 'finance_sk',
  // Planning
  'plan': 'planning', 'organiseer': 'planning', 'schema': 'planning', 'agenda': 'planning',
  '#plannen': 'planning'
};

function tryAwardTaskSkill(person, taskTitle) {
  var lower = taskTitle.toLowerCase();
  var matched = null;
  // Check hashtags first (exact match preferred)
  var hashtags = lower.match(/#\w+/g) || [];
  hashtags.forEach(function(tag){
    if(!matched && TASK_SKILL_MAP[tag]) matched = TASK_SKILL_MAP[tag];
  });
  // Then keyword match
  if(!matched) {
    Object.keys(TASK_SKILL_MAP).forEach(function(k){
      if(!matched && lower.indexOf(k) > -1) matched = TASK_SKILL_MAP[k];
    });
  }
  if(!matched) return null;
  awardSkillXP(person, matched);
  return matched;
}

// Central skill XP award — no more "Gedaan" button needed
function awardSkillXP(person, skillId) {
  var def = SKILL_DEFS.find(function(d){return d.id===skillId;});
  if(!def) return;
  if(!skillsData[person]) skillsData[person] = {};
  if(!skillsData[person][skillId]) skillsData[person][skillId] = {xp:0, log:[]};
  var sk = skillsData[person][skillId];
  var prevLv = skillLevelFromXp(sk.xp);
  sk.xp += def.xpPerDo;
  sk.log.push({date: new Date().toISOString(), xp: def.xpPerDo});
  var newLv = skillLevelFromXp(sk.xp);
  if(newLv > prevLv) {
    showSkillLevelUp(person, def, newLv);
  }
  saveSkills();
  trackWeeklyProgress('skills');
  checkAchievements();
}

// ============================================================
// WEEKLY QUESTS + ABILITIES
// ============================================================

var ABILITIES = [
  // ── UITSTEL ──
  {id:'postpone1',   icon:'⏰', name:'Dag Uitstel',         desc:'Stel een taak 1 dag uit, geen straf',        color:'#6366f1', cost:1, type:'postpone', days:1},
  {id:'postpone2',   icon:'📅', name:'Weekend Uitstel',     desc:'Stel een taak 2 dagen uit',                  color:'#7c3aed', cost:1, type:'postpone', days:2},
  {id:'postpone7',   icon:'🗓️', name:'Week Verlof',         desc:'Geef een taak een week respijt',             color:'#4338ca', cost:2, type:'postpone', days:7},
  {id:'postpone14',  icon:'🌙', name:'Twee Weken Rust',     desc:'Taak 14 dagen op pauze zetten',              color:'#1e1b4b', cost:3, type:'postpone', days:14},
  // ── RUIL & MANIPULATIE ──
  {id:'freetrade',   icon:'🤝', name:'Gratis Ruil',         desc:'Ruil een taak zonder tegenprestatie',        color:'#059669', cost:1, type:'free_trade'},
  {id:'reassign',    icon:'🔄', name:'Taak Overdragen',     desc:'Wijs een taak toe aan de ander zonder akkoord',color:'#0891b2',cost:2, type:'reassign'},
  {id:'split',       icon:'✂️', name:'Taak Halveren',       desc:'Splits een zware taak in twee kleinere',     color:'#d97706', cost:2, type:'split'},
  // ── BESCHERMING ──
  {id:'shield',      icon:'🛡️', name:'Taak-schild',         desc:'Bescherm één taak deze week van deadlines',  color:'#d97706', cost:1, type:'shield'},
  {id:'freeze',      icon:'🧊', name:'Taak-bevriezing',     desc:'Bevries een taak — tijdelijk onzichtbaar',   color:'#0ea5e9', cost:2, type:'freeze'},
  {id:'bubble',      icon:'🫧',  name:'Zeepbel-modus',       desc:'Jouw taken zijn deze week onaantastbaar',    color:'#38bdf8', cost:3, type:'shield'},
  // ── XP BOOSTS ──
  {id:'double',      icon:'⚡', name:'Dubbel-XP',           desc:'Volgende taak geeft dubbele XP',             color:'#dc2626', cost:2, type:'double_xp'},
  {id:'triple',      icon:'🔥', name:'Triple-XP',           desc:'Volgende taak geeft drievoudige XP',         color:'#b91c1c', cost:4, type:'triple_xp'},
  {id:'xpbomb',      icon:'💣', name:'XP-bom',              desc:'Alle taken deze dag geven +50% XP',          color:'#7c3aed', cost:3, type:'xp_day_boost'},
  {id:'skillboost',  icon:'🌱', name:'Skill-turbo',         desc:'Volgende skill-taak geeft 3x skill XP',      color:'#16a34a', cost:2, type:'skill_boost'},
  // ── VERWIJDEREN & VERGEVEN ──
  {id:'pardonne',    icon:'🎁', name:'Vrij Pardon',         desc:'Verwijder een taak volledig zonder gevolgen', color:'#c0547a', cost:3, type:'pardonne'},
  {id:'amnesia',     icon:'🧹', name:'Selectieve Amnesie',  desc:'Verwijder 3 taken tegelijk — poof, weg!',    color:'#6366f1', cost:4, type:'multi_pardonne'},
  // ── SPECIALE ACTIES ──
  {id:'spy',         icon:'🕵️', name:'Taak-spion',          desc:'Bekijk alle verborgen/bevroren taken van de ander',color:'#334155',cost:1, type:'spy'},
  {id:'copycat',     icon:'🐱', name:'Kopieer-kat',         desc:'Kopieer een voltooide taak van de ander als gedaan',color:'#f59e0b',cost:2, type:'copycat'},
  {id:'streak_saver',icon:'🔥', name:'Streak-redder',       desc:'Bescherm je streak als je een week mist',    color:'#ea580c', cost:3, type:'streak_save'},
  {id:'auto_done',   icon:'✨', name:'Auto-piloot',         desc:'Markeer een taak als gedaan zonder hem te doen',color:'#8b5cf6',cost:4, type:'auto_done'},
  // ── FINANCIEEL ──
  {id:'budget_eye',  icon:'👁️', name:'Budget-röntgen',      desc:'Zie alle uitgaven van de ander deze maand',  color:'#0891b2', cost:1, type:'info'},
  {id:'savings_boost',icon:'💎',name:'Spaar-multiplier',    desc:'Volgende storting telt dubbel in de tracker', color:'#0369a1', cost:2, type:'savings_double'},
];

var myAbilities = {};    // {abilityId: count}
var activeDoubleXP = false;
var frozenTasks = {};    // {taskId: true}

// Weekly quest state
var weeklyQuests = [];
var weeklyQuestWeek = '';

// ── WEEKLY QUEST SYSTEM — alleen EXTRA taken (boven standaard) ──
// Standaard taken = vaste terugkerende taken (recurData)
// Extra taken = eenmalige taken BOVEN op wat al gepland staat

var QUEST_TEMPLATES = [
  // Alle quests zijn gebaseerd op EXTRA taken boven standaard
  {id:'extra_2',  icon:'⭐', desc:'Doe 2 extra taken deze week',           target:2,  type:'extra', difficulty:'Makkelijk', abilityId:'postpone1'},
  {id:'extra_3',  icon:'🌟', desc:'Doe 3 extra taken deze week',           target:3,  type:'extra', difficulty:'Normaal',   abilityId:'postpone2'},
  {id:'extra_5',  icon:'🔥', desc:'Doe 5 extra taken deze week',           target:5,  type:'extra', difficulty:'Uitdagend', abilityId:'postpone7'},
  {id:'extra_8',  icon:'💪', desc:'Doe 8 extra taken — held van de week',  target:8,  type:'extra', difficulty:'Zwaar',     abilityId:'freetrade'},
  {id:'extra_10', icon:'🦾', desc:'Doe 10 extra taken — legendarisch!',    target:10, type:'extra', difficulty:'Episch',    abilityId:'shield'},
  {id:'extra_cat_huis', icon:'🏠', desc:'Doe 3 extra huishoud-taken',      target:3,  type:'extra_cat', cat:'huis', difficulty:'Normaal', abilityId:'freeze'},
  {id:'extra_cat_koken',icon:'🍳', desc:'Doe 3 extra kook-taken',          target:3,  type:'extra_cat', cat:'koken',difficulty:'Normaal', abilityId:'double'},
  {id:'extra_cat_bood', icon:'🛒', desc:'Doe 3 extra boodschappen-taken',  target:3,  type:'extra_cat', cat:'bood', difficulty:'Normaal', abilityId:'skillboost'},
  {id:'extra_streak',   icon:'📅', desc:'Doe elke dag 1+ extra taak (5 dagen)', target:5, type:'extra_days', difficulty:'Uitdagend', abilityId:'streak_saver'},
  {id:'extra_blitz',    icon:'⚡', desc:'Doe 4 extra taken op één dag',    target:4,  type:'extra_day_burst', difficulty:'Zwaar', abilityId:'xpbomb'},
];

// ── ABILITY PER WEEK LIMIET ──
var abilityEarnedThisWeek = false;
var abilityWeekKey = '';

function canEarnAbilityThisWeek() {
  var wk = getWk();
  if(abilityWeekKey !== wk) {
    abilityWeekKey = wk;
    abilityEarnedThisWeek = false;
  }
  return !abilityEarnedThisWeek;
}

function markAbilityEarned() {
  abilityEarnedThisWeek = true;
  abilityWeekKey = getWk();
  saveWeeklyQuests();
}

// Weekly progress
var weeklyProgress = {
  tasks:0, recur:0, shop:0, extra:0, skills:0, streak:0,
  extra_cat_huis:0, extra_cat_koken:0, extra_cat_bood:0,
  extra_days:0, extra_day_burst:0, lastExtraDay:''
};
var weeklyBaselineSet = false;
var weeklyBaseline = 0; // how many recur tasks are planned this week

function getWeeklyBaseline() {
  // Baseline = number of recurring tasks this week
  var today = todayName();
  var days = ['maandag','dinsdag','woensdag','donderdag','vrijdag','zaterdag','zondag'];
  var total = 0;
  recurData.forEach(function(r){
    if(r.freq==='weekly') total += (r.days||[]).length;
    else if(r.freq==='monthly1'||r.freq==='monthly2') total += 1;
  });
  return Math.max(total, 2); // minimum baseline of 2
}

function getWeeklyQuests() {
  var wk = getWk();

  // Load persisted state from localStorage
  if(weeklyQuestWeek !== wk) {
    var stored = null;
    try {
      var raw = localStorage.getItem('familie_weekly_quests');
      if(raw) stored = JSON.parse(raw);
    } catch(e){}

    if(stored && stored.week === wk) {
      // Same week — restore saved quests and progress
      weeklyQuestWeek = wk;
      weeklyQuests = stored.quests;
      weeklyProgress = stored.progress || weeklyProgress;
      weeklyBaseline = stored.baseline || getWeeklyBaseline();
      abilityEarnedThisWeek = stored.abilityEarned || false;
      abilityWeekKey = wk;
    } else {
      // New week — generate fresh quests using week number as seed
      weeklyQuestWeek = wk;
      weeklyProgress = {
        tasks:0, recur:0, shop:0, extra:0, skills:0, streak:0,
        extra_cat_huis:0, extra_cat_koken:0, extra_cat_bood:0,
        extra_days:0, extra_day_burst:0, lastExtraDay:''
      };
      weeklyBaseline = getWeeklyBaseline();
      abilityEarnedThisWeek = false;
      abilityWeekKey = wk;

      // Deterministic shuffle based on week string so both users see same quests
      var seed = wk.split('').reduce(function(s,c){return s+c.charCodeAt(0);},0);
      function seededRand(max, offset) {
        return Math.abs(Math.sin(seed + offset) * 10000) % max | 0;
      }

      var easy   = QUEST_TEMPLATES.filter(function(q){return q.difficulty==='Makkelijk'||q.difficulty==='Normaal';});
      var harder = QUEST_TEMPLATES.filter(function(q){return q.difficulty==='Uitdagend'||q.difficulty==='Zwaar'||q.difficulty==='Episch';});

      // Rotate through templates so we never repeat the same quest two weeks in a row
      var weekNum = parseInt(wk.split('-W')[1])||1;
      var easyIdx   = (weekNum - 1) % easy.length;
      var harderIdx = (weekNum - 1) % harder.length;

      var pick = [];
      if(easy.length)   pick.push(easy[easyIdx]);
      if(harder.length) pick.push(harder[harderIdx]);

      weeklyQuests = pick.map(function(q){
        return Object.assign({}, q, {progress:0, done:false, claimed:false});
      });

      saveWeeklyQuests();
    }
  }
  return weeklyQuests;
}

function saveWeeklyQuests() {
  try {
    localStorage.setItem('familie_weekly_quests', JSON.stringify({
      week:    weeklyQuestWeek,
      quests:  weeklyQuests,
      progress: weeklyProgress,
      baseline: weeklyBaseline,
      abilityEarned: abilityEarnedThisWeek
    }));
  } catch(e){}
}

function trackWeeklyProgress(type, taskTitle) {
  var wk = getWk();
  if(!weeklyProgress[type] && weeklyProgress[type]!==0) weeklyProgress[type] = 0;
  weeklyProgress[type]++;

  // Track extra_cat subtypes based on task title keywords
  if(type === 'extra' && taskTitle) {
    var lower = (taskTitle||'').toLowerCase();
    var huisWords  = ['stofzuig','dweil','opruim','badkamer','ramen','schoon','was','strijk'];
    var kokenWords = ['kook','avondeten','lunch','ontbijt','gourmet','bakken','recept'];
    var boodWords  = ['boodschap','jumbo','supermarkt','albert','lidl'];
    if(huisWords.some(function(w){return lower.indexOf(w)>-1;}))  weeklyProgress.extra_cat_huis++;
    if(kokenWords.some(function(w){return lower.indexOf(w)>-1;})) weeklyProgress.extra_cat_koken++;
    if(boodWords.some(function(w){return lower.indexOf(w)>-1;}))  weeklyProgress.extra_cat_bood++;

    // Track daily burst
    var today2 = todayStr();
    if(weeklyProgress.lastExtraDay !== today2) {
      weeklyProgress.lastExtraDay = today2;
      weeklyProgress.extra_days++;
      weeklyProgress.extra_day_burst = 1;
    } else {
      weeklyProgress.extra_day_burst++;
    }
  }

  // Check quests
  getWeeklyQuests().forEach(function(q){
    if(q.done) return;
    var prog = weeklyProgress[q.type==='extra_cat'?'extra_cat_'+q.cat : q.type==='extra_days'?'extra_days' : q.type==='extra_day_burst'?'extra_day_burst' : q.type] || 0;
    q.progress = prog;
    if(q.progress >= q.target) {
      q.done = true;
      saveWeeklyQuests();
      showQuestComplete(q);
    }
  });
  saveWeeklyQuests();
}

function showQuestComplete(quest) {
  var ability = ABILITIES.find(function(a){return a.id===quest.abilityId;});
  questsCompleted++;
  checkAchievements();

  if(!canEarnAbilityThisWeek()) {
    // Already earned an ability this week — show XP reward instead
    awardXP(20, 'Quest bonus');
    showToast('📜 Quest voltooid! Je hebt al een ability deze week — +20 XP bonus');
    return;
  }

  markAbilityEarned();
  queueUnlock({
    icon: quest.icon||'📜',
    type: '✅ Quest voltooid!',
    title: quest.desc,
    desc: 'Beloning: '+(ability ? ability.icon+' '+ability.name+'\n'+ability.desc : '?'),
    who: myName,
    extra: '<button onclick="claimQuestReward(weeklyQuests.find(function(q){return q.id===\''+quest.id+'\'}))" '
      +'style="background:#059669;color:#fff;border:none;border-radius:10px;padding:8px 20px;'
      +'font-size:13px;font-weight:700;cursor:pointer;margin-top:4px">🎁 Claim ability!</button>',
    confetti: true
  });
}

function claimQuestReward(quest) {
  if(!quest || quest.claimed) return;
  quest.claimed = true;
  saveWeeklyQuests();
  if(!ability) return;
  if(!myAbilities[ability.id]) myAbilities[ability.id] = 0;
  myAbilities[ability.id]++;
  awardXP(10, 'Quest beloning');

  // Notify partner
  addNotif('🪄', '#ede9fe',
    myName+' verdiende een ability!',
    ability.icon+' '+ability.name+' — verdient door extra inzet deze week');

  queueUnlock({
    icon: ability.icon,
    type: '🪄 Ability verkregen!',
    title: ability.name,
    desc: ability.desc,
    who: myName,
    extra: 'Gebruik via Achievements → 🪄 Abilities',
    confetti: false
  });
  addActivity('🪄', '#ede9fe', myName+' verdiende ability: '+ability.name);
}




// ── ABILITY USAGE ──
function useAbility(abilityId, taskId) {
  var ability = ABILITIES.find(function(a){return a.id===abilityId;});
  if(!ability) return;
  if(!myAbilities[abilityId] || myAbilities[abilityId] < 1) {
    showToast('Je hebt deze ability niet (of niet genoeg)'); return;
  }

  var task = taskId ? taskData.find(function(t){return t.id===taskId;}) : null;

  if(ability.type === 'postpone' && task) {
    var d = task.date ? new Date(task.date+'T00:00:00') : new Date();
    d.setDate(d.getDate() + ability.days);
    task.date = d.toISOString().split('T')[0];
    showToast(ability.icon+' "'+task.title+'" uitgesteld met '+ability.days+' dag(en)!');
    addActivity('⏰','#ede9fe', myName+' stelde "'+task.title+'" uit ('+ability.name+')');
    renderTasks();
  } else if(ability.type === 'free_trade') {
    showToast('🤝 Gratis Ruil actief! Volgende taakruil zonder tegenprestatie.');
  } else if(ability.type === 'reassign' && task) {
    task.who = [partnerName];
    showToast('🔄 Taak "'+task.title+'" overgedragen aan '+partnerName+'!');
    addActivity('🔄','#ede9fe', myName+' droeg "'+task.title+'" over aan '+partnerName);
    renderTasks();
  } else if(ability.type === 'split' && task) {
    var copy = Object.assign({}, task, {id:taskNextId++, title:task.title+' (deel 2)'});
    task.title = task.title+' (deel 1)';
    taskData.push(copy);
    showToast('✂️ Taak gesplitst in 2 kleinere taken!');
    renderTasks(); updateStats();
  } else if(ability.type === 'shield' && task) {
    task._shielded = true;
    showToast('🛡️ Taak "'+task.title+'" heeft een schild!');
    renderTasks();
  } else if(ability.type === 'freeze' && task) {
    frozenTasks[task.id] = true; task._frozen = true;
    showToast('🧊 Taak "'+task.title+'" bevroren — verborgen!');
    renderTasks();
  } else if(ability.type === 'double_xp') {
    activeDoubleXP = true;
    showToast('⚡ Dubbel-XP actief voor je volgende taak!');
  } else if(ability.type === 'triple_xp') {
    activeDoubleXP = true; myXP += 4; // extra bump
    showToast('🔥 Triple-XP actief! Ga snel een taak doen!');
  } else if(ability.type === 'xp_day_boost') {
    showToast('💣 XP-bom actief! Alle taken vandaag +50% XP');
    addActivity('💣','#fde68a', myName+' activeerde XP-bom!');
  } else if(ability.type === 'skill_boost') {
    showToast('🌱 Skill-turbo actief! Volgende skill-taak = 3x XP');
    addActivity('🌱','#d1fae5', myName+' activeerde Skill-turbo!');
  } else if(ability.type === 'pardonne' && task) {
    var pi = taskData.findIndex(function(t){return t.id===task.id;});
    if(pi>-1) taskData.splice(pi,1);
    showToast('🎁 Taak "'+task.title+'" vergeven en vergeten!');
    renderTasks(); updateStats();
  } else if(ability.type === 'multi_pardonne') {
    var myOpen = taskData.filter(function(t){return !t.done && t.who && t.who.indexOf(myName)>-1;}).slice(0,3);
    myOpen.forEach(function(t){ taskData = taskData.filter(function(x){return x.id!==t.id;}); });
    showToast('🧹 '+myOpen.length+' taken weggepoetst — poof!');
    renderTasks(); updateStats();
  } else if(ability.type === 'spy') {
    var frozen = Object.keys(frozenTasks).length;
    showToast('🕵️ '+partnerName+' heeft '+frozen+' bevroren taken. Nu weet je het!');
  } else if(ability.type === 'copycat') {
    var doneTasks = taskData.filter(function(t){return t.done && t.who && t.who.indexOf(partnerName)>-1;});
    if(doneTasks.length){
      taskData.unshift({id:taskNextId++,title:doneTasks[0].title+' (gekopieerd)',who:[myName],done:true,date:todayStr(),prio:'low'});
      showToast('🐱 Gekopieerd: "'+doneTasks[0].title+'" staat op jouw naam!');
      awardXP(4,'Kopieer-kat');
    } else showToast('Geen voltooide taken van '+partnerName+' gevonden');
  } else if(ability.type === 'streak_save') {
    showToast('🔥 Streak-redder opgeslagen! Wordt gebruikt als je een week mist.');
    addActivity('🔥','#fff3dc', myName+' heeft een Streak-redder!');
  } else if(ability.type === 'auto_done' && task) {
    task.done = true;
    trackWeeklyProgress('tasks');
    awardXP(4,'Auto-piloot');
    showToast('✨ Taak "'+task.title+'" auto-afgevinkt!');
    renderTasks(); updateStats();
  } else if(ability.type === 'info') {
    showToast('👁️ Budget-röntgen: '+partnerName+' gaf € '+
      transData.filter(function(t){return t.who===partnerName&&t.amount<0;})
        .reduce(function(s,t){return s+Math.abs(t.amount);},0).toFixed(0)+' uit deze maand');
  } else if(ability.type === 'savings_double') {
    showToast('💎 Spaar-multiplier actief! Volgende storting telt dubbel.');
    addActivity('💎','#dbeafe', myName+' activeerde Spaar-multiplier!');
  } else {
    showToast('Kies eerst een taak om de ability op te gebruiken!');
    openAbilityTaskPicker(abilityId);
    return;
  }

  myAbilities[abilityId]--;
  abilitiesUsed++;
  checkAchievements();
}

function openAbilityTaskPicker(abilityId) {
  var ability = ABILITIES.find(function(a){return a.id===abilityId;});
  if(!ability) return;
  var myTasks = taskData.filter(function(t){return !t.done && t.who && t.who.indexOf(myName)>-1;});
  if(!myTasks.length){showToast('Geen open taken gevonden');return;}

  currentAddType = 'ability_pick';
  document.getElementById('sheet-title').textContent = ability.icon+' '+ability.name;
  document.getElementById('sheet-fields').innerHTML =
    '<div style="font-size:13px;color:var(--c-text2);margin-bottom:12px">'+ability.desc+'</div>'
    +'<div class="field"><label>Kies een taak</label>'
    +'<select id="ability-task-sel">'
    +myTasks.map(function(t){return '<option value="'+t.id+'">'+(t.title)+'</option>';}).join('')
    +'</select></div>';
  document.getElementById('add-overlay').classList.add('open');
  // Override save button
  document.querySelector('.sheet-btn').textContent = ability.icon+' Gebruik ability';
  document.querySelector('.sheet-btn').onclick = function(){
    var sel = document.getElementById('ability-task-sel');
    var tid = sel ? parseInt(sel.value) : null;
    closeAdd();
    useAbility(abilityId, tid);
    document.querySelector('.sheet-btn').textContent = 'Toevoegen';
    document.querySelector('.sheet-btn').onclick = saveItem;
  };
}

// Hook into existing functions to track weekly progress
var _origToggleTask = toggleTask;
toggleTask = function(id) {
  _origToggleTask(id);
  var t = taskData.find(function(x){return x.id===id;});
  if(t && t.done) {
    // Only count EENMALIGE (non-recurring) tasks as potential extras
    var isRecurring = recurData.some(function(r){
      return r.title.toLowerCase() === t.title.toLowerCase();
    });

    if(!isRecurring) {
      // Count how many eenmalige tasks done this week so far
      var weekDoneCount = taskData.filter(function(x){
        return x.done && !recurData.some(function(r){return r.title.toLowerCase()===x.title.toLowerCase();});
      }).length;
      var baseline = getWeeklyBaseline();

      // If we've done more eenmalige tasks than the baseline → it's an extra
      if(weekDoneCount > baseline) {
        trackWeeklyProgress('extra', t.title);
        showToast('⭐ Extra taak! +1 voortgang op je quest');
      }
    }

    // Auto-award skill XP
    var skillMatched = tryAwardTaskSkill(t.who && t.who[0] ? t.who[0] : myName, t.title);
    if(skillMatched) {
      var def = SKILL_DEFS.find(function(d){return d.id===skillMatched;});
      if(def) showSkillXpIndicator(def);
    }
    // Double XP?
    if(activeDoubleXP){myXP+=4;activeDoubleXP=false;showToast('⚡ Dubbel-XP gebruikt!');}
  }
};

var _origToggleShop = toggleShop;
toggleShop = function(id){
  _origToggleShop(id);
  var item = shopData.find(function(i){return i.id===id;});
  if(item && item.done) trackWeeklyProgress('shop');
};

// Skills now auto-awarded via task completion


// ── RENDER WEEKLY QUESTS (used in achievements screen) ──
function renderWeeklyQuestsHtml() {
  var quests = getWeeklyQuests();
  var wk = getWk();
  var canEarn = canEarnAbilityThisWeek();
  var baseline = getWeeklyBaseline();

  var html = '<div class="ach-section-title">📜 Weekly Quests — Week '+wk.split('-W')[1]+'</div>'
    +'<div style="padding:0 16px 8px">'
    +'<div style="font-size:12px;color:var(--c-text2);background:var(--c-surface2);border-radius:10px;padding:10px 12px;margin-bottom:10px;line-height:1.6">'
    +'📌 Alleen <b style="color:var(--c-text)">extra taken</b> tellen — taken die je doet <b style="color:var(--c-text)">boven je '+baseline+' vaste taken</b>. '
    +(canEarn
      ? '🏆 Je kunt nog <b style="color:#059669">1 ability</b> verdienen deze week!'
      : '✅ Ability al verdiend deze week. Extra quests = +20 XP.')
    +'</div></div>'
    +'<div style="padding:0 16px 12px;display:flex;flex-direction:column;gap:8px">';

  quests.forEach(function(q){
    var ability = ABILITIES.find(function(a){return a.id===q.abilityId;});
    var pct = Math.min(Math.round((q.progress||0)/q.target*100), 100);
    var done = q.done;
    var diffColor = {Makkelijk:'#16a34a',Normaal:'#d97706',Uitdagend:'#dc2626',Zwaar:'#7c3aed',Episch:'#c0547a'}[q.difficulty]||'var(--c-text2)';
    html += '<div style="background:var(--c-surface);border-radius:16px;padding:14px;box-shadow:0 1px 6px var(--c-card-shadow);border-left:4px solid '+(done?'#059669':diffColor)+'">'
      +'<div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:10px">'
      +'<div style="font-size:24px;flex-shrink:0">'+(done?'✅':(q.icon||'📜'))+'</div>'
      +'<div style="flex:1"><div style="font-size:13px;font-weight:700;color:var(--c-text);margin-bottom:4px">'+q.desc+'</div>'
      +'<div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center">'
      +'<span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:10px;background:'+diffColor+'22;color:'+diffColor+'">'+q.difficulty+'</span>'
      +(ability?'<span style="font-size:11px;color:var(--c-text2)">'+ability.icon+' '+ability.name+'</span>':'')
      +'</div></div>'
      +(done&&!q.claimed?'<button onclick="claimQuestReward(weeklyQuests.find(function(q){return q.id===\''+q.id+'\';}))" style="background:#059669;color:#fff;border:none;border-radius:12px;padding:8px 14px;font-size:12px;font-weight:800;cursor:pointer;flex-shrink:0">🎁 Claim!</button>'
        :done&&q.claimed?'<span style="color:#059669;font-size:20px">✓</span>':'')
      +'</div>'
      +'<div style="display:flex;align-items:center;gap:8px">'
      +'<div style="flex:1;height:8px;background:var(--c-surface2);border-radius:4px;overflow:hidden">'
      +'<div style="height:100%;width:'+pct+'%;background:'+(done?'#059669':diffColor)+';border-radius:4px;transition:width .4s"></div>'
      +'</div>'
      +'<div style="font-size:11px;font-weight:700;color:var(--c-text2);min-width:42px;text-align:right">'+(q.progress||0)+' / '+q.target+'</div>'
      +'</div></div>';
  });
  html += '</div>';
  return html;
}

function renderAbilitiesHtml() {
  var total = Object.values(myAbilities).reduce(function(s,v){return s+v;},0);
  var groups = [
    {label:'⏰ Uitstel',     ids:['postpone1','postpone2','postpone7','postpone14']},
    {label:'🔄 Manipulatie', ids:['freetrade','reassign','split']},
    {label:'🛡️ Bescherming', ids:['shield','freeze','bubble']},
    {label:'⚡ XP Boosts',   ids:['double','triple','xpbomb','skillboost']},
    {label:'🎁 Vergeven',    ids:['pardonne','amnesia']},
    {label:'🕵️ Speciaal',    ids:['spy','copycat','streak_saver','auto_done','budget_eye','savings_boost']},
  ];
  var html = '<div class="ach-section-title">🪄 Abilities '+(total?'('+total+' beschikbaar)':'— verdien via quests')+'</div>';

  if(total) {
    groups.forEach(function(group){
      var groupAbs = group.ids.map(function(id){return ABILITIES.find(function(a){return a.id===id;});}).filter(Boolean);
      var owned = groupAbs.filter(function(ab){return (myAbilities[ab.id]||0)>0;});
      if(!owned.length) return;
      html += '<div style="padding:0 16px 10px"><div style="font-size:11px;font-weight:700;color:var(--c-text2);text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px">'+group.label+'</div>'
        +'<div style="display:flex;flex-direction:column;gap:6px">';
      owned.forEach(function(ab){
        var count = myAbilities[ab.id]||0;
        html += '<div style="background:var(--c-surface);border-radius:14px;padding:12px 14px;border:.5px solid '+ab.color+';display:flex;align-items:center;gap:12px">'
          +'<div style="width:40px;height:40px;border-radius:12px;background:'+ab.color+'22;display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0">'+ab.icon+'</div>'
          +'<div style="flex:1;min-width:0">'
          +'<div style="font-size:14px;font-weight:700;color:var(--c-text)">'+ab.name
          +(count>1?' <span style="background:'+ab.color+';color:#fff;font-size:10px;font-weight:800;padding:1px 7px;border-radius:10px">×'+count+'</span>':'')+'</div>'
          +'<div style="font-size:11px;color:var(--c-text2);margin-top:2px;line-height:1.4">'+ab.desc+'</div>'
          +'</div>'
          +'<button onclick="openAbilityTaskPicker(\''+ab.id+'\')" style="background:'+ab.color+';color:#fff;border:none;border-radius:12px;padding:10px 16px;font-size:13px;font-weight:800;cursor:pointer;flex-shrink:0">Inzetten →</button>'
          +'</div>';
      });
      html += '</div></div>';
    });
  } else {
    html += '<div style="padding:0 16px 8px;text-align:center;color:var(--c-text2);font-size:13px;line-height:1.6">'
      +'Verdien abilities door weekly quests te voltooien.<br>'
      +'<span style="font-size:11px;opacity:.7">Maximaal 1 ability per week</span></div>'
      +'<div style="padding:0 16px 16px;display:grid;grid-template-columns:1fr 1fr;gap:6px">';
    ABILITIES.slice(0,6).forEach(function(ab){
      html += '<div style="background:var(--c-surface);border-radius:12px;padding:10px;border:.5px solid var(--c-border);opacity:.4;display:flex;align-items:center;gap:8px">'
        +'<span style="font-size:18px">'+ab.icon+'</span>'
        +'<div><div style="font-size:11px;font-weight:700;color:var(--c-text)">'+ab.name+'</div>'
        +'<div style="font-size:9px;color:var(--c-text2)">🔒 Vergrendeld</div></div></div>';
    });
    html += '<div style="grid-column:1/-1;text-align:center;font-size:11px;color:var(--c-text2);padding:4px">...en nog '+(ABILITIES.length-6)+' meer</div></div>';
  }
  return html;
}


