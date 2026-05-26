'use strict';
// ============================================================
// GROUP QUEST OVERVIEW RESTRUCTURE v0.288
// Premium hero carousel rework.
// Uses fixed asset paths for the three curated FamilyApp backgrounds:
// - table/map = new quest
// - star adventurers = templates
// - family hero pose = weekly family raid
// ============================================================

(function(){
  var STYLE_ID = 'group-quest-overview-restructure-style';
  var CAROUSEL_ID = 'gq287HeroCarousel';

  var cards = [
    {
      key: 'create',
      eyebrow: 'Quest Board',
      title: 'Nieuwe Group Quest',
      text: 'Plan samen een raid, dungeon of team quest.',
      cta: '+ Aanmaken',
      icon: '🗺️',
      tone: 'warm',
      bg: '/assets/group-quests/gq-new-quest-table.webp',
      fallback: 'https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=1200&q=92&fm=webp'
    },
    {
      key: 'templates',
      eyebrow: 'Templates',
      title: 'Quick Start Templates',
      text: 'Kies direct een slimme missie voor het gezin.',
      cta: 'Bekijk',
      icon: '✨',
      tone: 'blue',
      bg: '/assets/group-quests/gq-templates-stars.webp',
      fallback: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=92&fm=webp'
    },
    {
      key: 'weekly',
      eyebrow: 'Family Event',
      title: 'Weekly Family Raid',
      text: 'Werk deze week samen aan een epische challenge.',
      cta: 'Start raid',
      icon: '🏆',
      tone: 'gold',
      bg: '/assets/group-quests/gq-family-raid.webp',
      fallback: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=92&fm=webp'
    }
  ];

  function injectStyles(){
    if(document.getElementById(STYLE_ID)) return;
    var s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = [
      '.gq287Wrap{position:relative;margin:2px 0 12px;padding:0 0 2px;display:flex;flex-direction:column;gap:12px}',
      '.gq287Head{display:flex;align-items:flex-end;justify-content:space-between;gap:12px;padding:0 2px 0 2px}',
      '.gq287Head h3{margin:0;font-size:20px;line-height:1;letter-spacing:-.65px;font-weight:1000;color:var(--c-text,#17201a)}',
      '.gq287Head span{font-size:11px;font-weight:900;color:var(--c-text2,#6b7280)}',
      '.gq287Rail{display:flex;gap:13px;overflow-x:auto;overscroll-behavior-x:contain;scroll-snap-type:x mandatory;padding:2px 2px 11px;margin:0 -2px;-webkit-overflow-scrolling:touch}',
      '.gq287Rail::-webkit-scrollbar{display:none}',

      '.gq287Hero{position:relative;flex:0 0 84%;min-width:272px;height:176px;border-radius:28px;overflow:hidden;background-size:cover;background-position:center;scroll-snap-align:start;color:#fff;border:1px solid rgba(255,255,255,.18);box-shadow:0 22px 60px rgba(8,12,20,.24), inset 0 0 0 1px rgba(255,255,255,.08);isolation:isolate;transform:translateZ(0)}',
      '.gq287Hero:before{content:"";position:absolute;inset:0;z-index:0;background:linear-gradient(180deg,rgba(3,7,18,.32),rgba(3,7,18,.52) 46%,rgba(3,7,18,.92)),linear-gradient(90deg,rgba(3,7,18,.55),rgba(3,7,18,.16) 48%,rgba(3,7,18,.35)),radial-gradient(circle at 82% 10%,rgba(255,255,255,.18),transparent 32%)}',
      '.gq287Hero:after{content:"";position:absolute;inset:0;z-index:1;pointer-events:none;box-shadow:inset 0 1px 0 rgba(255,255,255,.20), inset 0 -80px 90px rgba(0,0,0,.48)}',
      '.gq287Hero[data-tone="warm"]{background-position:center 58%}',
      '.gq287Hero[data-tone="warm"]:before{background:linear-gradient(180deg,rgba(24,12,4,.28),rgba(24,12,4,.50) 48%,rgba(10,6,4,.92)),linear-gradient(90deg,rgba(17,10,4,.62),rgba(17,10,4,.16) 48%,rgba(17,10,4,.34)),radial-gradient(circle at 78% 16%,rgba(255,199,104,.22),transparent 34%)}',
      '.gq287Hero[data-tone="blue"]{background-position:center 38%}',
      '.gq287Hero[data-tone="blue"]:before{background:linear-gradient(180deg,rgba(3,7,18,.38),rgba(10,24,58,.56) 44%,rgba(3,7,18,.94)),linear-gradient(90deg,rgba(3,7,18,.66),rgba(20,44,92,.12) 54%,rgba(3,7,18,.38)),radial-gradient(circle at 82% 12%,rgba(147,197,253,.22),transparent 34%)}',
      '.gq287Hero[data-tone="gold"]{background-position:center 48%}',
      '.gq287Hero[data-tone="gold"]:before{background:linear-gradient(180deg,rgba(24,12,4,.28),rgba(24,12,4,.48) 44%,rgba(8,5,4,.93)),linear-gradient(90deg,rgba(17,10,4,.62),rgba(17,10,4,.18) 52%,rgba(17,10,4,.35)),radial-gradient(circle at 78% 14%,rgba(251,191,36,.24),transparent 34%)}',

      '.gq287HeroInner{position:relative;z-index:2;height:100%;display:flex;flex-direction:column;justify-content:space-between;padding:15px 15px 14px;text-shadow:0 2px 18px rgba(0,0,0,.58)}',
      '.gq287TopRow{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}',
      '.gq287Eyebrow{display:inline-flex;align-items:center;gap:6px;border-radius:999px;padding:6px 9px;background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.18);backdrop-filter:blur(16px);box-shadow:0 8px 20px rgba(0,0,0,.18);font-size:10px;font-weight:1000;letter-spacing:.08em;text-transform:uppercase;color:rgba(255,255,255,.90)}',
      '.gq287Icon{flex:0 0 38px;width:38px;height:38px;border-radius:16px;display:grid;place-items:center;background:rgba(255,255,255,.13);border:1px solid rgba(255,255,255,.18);backdrop-filter:blur(16px);box-shadow:0 12px 28px rgba(0,0,0,.22);font-size:18px}',
      '.gq287TextBlock{max-width:82%}',
      '.gq287Hero h4{margin:0;font-size:24px;line-height:.98;letter-spacing:-.8px;font-weight:1000;color:#fff;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}',
      '.gq287Hero p{margin:7px 0 0;font-size:12.5px;line-height:1.28;font-weight:800;color:rgba(255,255,255,.82);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}',
      '.gq287Bottom{display:flex;align-items:flex-end;justify-content:space-between;gap:10px}',
      '.gq287Btn{border:0;border-radius:999px;padding:10px 13px;background:linear-gradient(135deg,rgba(255,255,255,.95),rgba(255,255,255,.72));color:#07130b;font-size:12px;font-weight:1000;box-shadow:0 14px 34px rgba(0,0,0,.28), inset 0 1px 0 rgba(255,255,255,.70);text-shadow:none;cursor:pointer;backdrop-filter:blur(10px)}',
      '.gq287Hero[data-tone="gold"] .gq287Btn{background:linear-gradient(135deg,#fef3c7,#facc15);color:#2d2100}',
      '.gq287Hero[data-tone="blue"] .gq287Btn{background:linear-gradient(135deg,#dbeafe,#93c5fd);color:#07152d}',
      '.gq287Btn:active{transform:scale(.965)}',

      '.group-quests-view.gq284.gq287Compact{gap:12px}',
      '.gq287Compact .gq284Card{min-height:330px;border-radius:25px;box-shadow:0 18px 48px rgba(8,12,20,.18)}',
      '.gq287Compact .gq284Content{min-height:330px;padding:14px;gap:9px}',
      '.gq287Compact .gq284Title{margin-top:2px}.gq287Compact .gq284Title h3{font-size:23px;line-height:1.02;-webkit-line-clamp:1}.gq287Compact .gq284Title p{font-size:12px;-webkit-line-clamp:1;margin-top:5px}',
      '.gq287Compact .gq284ProgressPanel{padding:10px;border-radius:19px}.gq287Compact .gq284PartyLine{margin-bottom:9px}.gq287Compact .gq284Avatar{width:35px;height:35px}.gq287Compact .gq284Avatar small{min-width:17px;height:17px;font-size:8px}',
      '.gq287Compact .gq284TasksPanel{padding:10px;border-radius:18px;gap:6px}.gq287Compact .gq284Task{min-height:24px}.gq287Compact .gq284Task b{font-size:11px}.gq287Compact .gq284Task span{width:21px;height:21px;flex-basis:21px}',
      '.gq287Compact .gq284Actions{grid-template-columns:1fr 1fr}.gq287Compact .gq284Actions button{min-height:40px;padding:10px;font-size:12px;border-radius:16px}',
      '.gq287Compact .gq286Edit{right:12px;bottom:12px;padding:7px 10px;font-size:11px}',
      '@media(max-width:420px){.gq287Hero{flex-basis:86%;height:166px;min-width:268px;border-radius:27px}.gq287Hero h4{font-size:22px}.gq287TextBlock{max-width:86%}.gq287Compact .gq284Card{min-height:350px}.gq287Compact .gq284Content{min-height:350px}.gq287Compact .gq284Actions{grid-template-columns:1fr}}'
    ].join('\n');
    document.head.appendChild(s);
  }

  function esc(value){
    return String(value == null ? '' : value).replace(/[&<>\"]/g, function(ch){ return ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '\"':'&quot;' })[ch] || ch; });
  }

  function activeMemberId(){
    try { if(window.HouseholdIdentity && window.HouseholdIdentity.getActiveMemberId) return window.HouseholdIdentity.getActiveMemberId(); } catch(e) {}
    try { if(typeof window.getActiveGroupQuestMemberId === 'function') return window.getActiveGroupQuestMemberId(); } catch(e) {}
    return 'shane';
  }

  function makeQuest(data){
    if(typeof window.loadGroupQuests !== 'function' || typeof window.saveGroupQuests !== 'function'){
      if(typeof window.showToast === 'function') window.showToast('Group quest systeem nog niet geladen');
      return;
    }
    var activeId = activeMemberId();
    var steps = data.steps || [];
    var q = {
      id: 'gq-' + Date.now(), title: data.title, description: data.description,
      type: data.type || 'team', status: 'open', target: steps.length || 3, progress: 0,
      xp: data.xp || 120, coinReward: data.coins || 30, multiplier: data.multiplier || 1.12,
      deadline: new Date().toISOString().slice(0,10),
      members: [{ id: activeId, status: 'joined', contribution: 0 }], invitedMemberIds: [],
      helpRequested: true, steps: steps, autoBackground: true, background: '', tags: [data.type || 'team', 'group', 'template']
    };
    var list = window.loadGroupQuests() || [];
    list.unshift(q); window.saveGroupQuests(list);
    if(typeof window.showToast === 'function') window.showToast(data.toast || 'Group quest aangemaakt ⚔️');
    if(typeof window.renderTasks === 'function') window.renderTasks();
    setTimeout(function(){ if(window.GroupQuestOverviewRestructure) window.GroupQuestOverviewRestructure.patch(); }, 80);
  }

  function openTemplates(){
    if(window.BottomSheet && typeof window.BottomSheet.open === 'function'){
      window.BottomSheet.open({
        title: '⚔️ Quick Start Templates',
        html: '<div style="display:grid;gap:10px">'
          + '<button class="gq287Btn" data-template="clean">Household Cleanup Raid</button>'
          + '<button class="gq287Btn" data-template="meal">Meal Prep Party</button>'
          + '<button class="gq287Btn" data-template="reset">Weekend Reset Dungeon</button>'
          + '</div>',
        onOpen: function(ctx){ ctx.modal.querySelectorAll('[data-template]').forEach(function(btn){ btn.addEventListener('click', function(){ var t = btn.getAttribute('data-template'); ctx.close(); if(t === 'meal') return makeQuest({ title:'Meal Prep Party', description:'Samen koken, voorbereiden en opruimen.', type:'team', xp:110, steps:['Menu kiezen','Ingrediënten klaarzetten','Samen koken','Keuken resetten'], toast:'Meal Prep Party gestart 🍳' }); if(t === 'reset') return makeQuest({ title:'Weekend Reset Dungeon', description:'Een korte dungeon om het huis weekend-klaar te maken.', type:'dungeon', xp:140, steps:['Woonkamer resetten','Was verzamelen','Badkamer check','Afval wegbrengen'], toast:'Weekend Reset Dungeon gestart 🗝️' }); return makeQuest({ title:'Household Cleanup Raid', description:'Een snelle raid om samen het huis op te ruimen.', type:'raid', xp:160, steps:['Taken verdelen','Keuken aanpakken','Woonkamer opruimen','Afval en was afronden'], toast:'Cleanup Raid gestart 🐉' }); }); }); },
        actions: [{ label:'Sluiten' }]
      });
      return;
    }
    makeQuest({ title:'Household Cleanup Raid', description:'Een snelle raid om samen het huis op te ruimen.', type:'raid', xp:160, steps:['Taken verdelen','Keuken aanpakken','Woonkamer opruimen','Afval en was afronden'] });
  }

  function handleCard(key){
    if(key === 'create'){
      if(typeof window.openGroupQuestEditor === 'function') window.openGroupQuestEditor();
      else if(typeof window.showToast === 'function') window.showToast('Editor nog niet geladen');
      return;
    }
    if(key === 'templates') return openTemplates();
    if(key === 'weekly') return makeQuest({ title:'Weekly Family Raid', description:'Voltooi deze week samen een epische household challenge.', type:'raid', xp:180, coins:50, multiplier:1.18, steps:['Weekdoel kiezen','Taken verdelen','3 bijdragen voltooien','Samen afronden'], toast:'Weekly Family Raid gestart 🏆' });
  }

  function carouselHtml(){
    return '<section class="gq287Wrap" id="'+CAROUSEL_ID+'">'
      + '<div class="gq287Head"><div><h3>Group Quest Hub</h3><span>Start, plan of beheer samen</span></div><span>Swipe →</span></div>'
      + '<div class="gq287Rail">'
      + cards.map(function(card){
        return '<article class="gq287Hero" data-gq287="'+esc(card.key)+'" data-tone="'+esc(card.tone)+'" style="background-image:url('+esc(card.bg)+'),url('+esc(card.fallback)+')">'
          + '<div class="gq287HeroInner"><div class="gq287TopRow"><span class="gq287Eyebrow">'+esc(card.eyebrow)+'</span><div class="gq287Icon">'+esc(card.icon)+'</div></div>'
          + '<div class="gq287Bottom"><div class="gq287TextBlock"><h4>'+esc(card.title)+'</h4><p>'+esc(card.text)+'</p></div><button class="gq287Btn" type="button">'+esc(card.cta)+'</button></div></div></article>';
      }).join('') + '</div></section>';
  }

  function patch(){
    injectStyles();
    var view = document.querySelector('#task-content .group-quests-view.gq284');
    if(!view) return;
    view.classList.add('gq287Compact');
    if(!document.getElementById(CAROUSEL_ID)) view.insertAdjacentHTML('beforebegin', carouselHtml());
    document.querySelectorAll('[data-gq287]').forEach(function(el){
      if(el.__gq287Bound) return;
      el.__gq287Bound = true;
      el.addEventListener('click', function(ev){ handleCard(el.getAttribute('data-gq287')); });
    });
  }

  function install(){
    injectStyles(); patch();
    var root = document.getElementById('task-content');
    if(root && !root.__gq287Observer){
      root.__gq287Observer = true;
      new MutationObserver(function(){ clearTimeout(root.__gq287Timer); root.__gq287Timer = setTimeout(patch, 60); }).observe(root, { childList:true, subtree:true });
    }
  }

  var tries = 0;
  var timer = setInterval(function(){ tries++; install(); if(document.querySelector('#task-content .group-quests-view.gq284') || tries > 40) clearInterval(timer); }, 150);
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install); else install();
  window.GroupQuestOverviewRestructure = { install: install, patch: patch };
})();
