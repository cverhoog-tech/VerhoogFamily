'use strict';
// ============================================================
// GROUP QUEST OVERVIEW RESTRUCTURE v0.287
// Adds a compact premium hero carousel above group quests and makes
// active quest cards calmer/less massive for better scanability.
// ============================================================

(function(){
  var STYLE_ID = 'group-quest-overview-restructure-style';
  var CAROUSEL_ID = 'gq287HeroCarousel';

  var cards = [
    {
      key: 'create',
      eyebrow: 'Start avontuur',
      title: 'Nieuwe Group Quest',
      text: 'Maak samen een raid, dungeon of team quest.',
      cta: '+ Aanmaken',
      bg: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=92&fm=webp'
    },
    {
      key: 'templates',
      eyebrow: 'Snelle start',
      title: 'Quick Start Templates',
      text: 'Start direct met een slim huishoud-sjabloon.',
      cta: 'Templates',
      bg: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=92&fm=webp'
    },
    {
      key: 'weekly',
      eyebrow: 'Event quest',
      title: 'Weekly Family Raid',
      text: 'Een wekelijkse challenge voor het hele household.',
      cta: 'Start raid',
      bg: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?auto=format&fit=crop&w=1200&q=92&fm=webp'
    }
  ];

  function injectStyles(){
    if(document.getElementById(STYLE_ID)) return;
    var s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = [
      '.gq287Wrap{display:flex;flex-direction:column;gap:14px;margin:0 0 4px}',
      '.gq287Head{display:flex;align-items:flex-end;justify-content:space-between;gap:12px;padding:0 2px}',
      '.gq287Head h3{margin:0;font-size:18px;letter-spacing:-.45px;font-weight:1000;color:var(--c-text,#17201a)}',
      '.gq287Head span{font-size:11px;font-weight:900;color:var(--c-text2,#6b7280)}',
      '.gq287Rail{display:flex;gap:12px;overflow-x:auto;overscroll-behavior-x:contain;scroll-snap-type:x mandatory;padding:2px 2px 8px;margin:0 -2px;-webkit-overflow-scrolling:touch}',
      '.gq287Rail::-webkit-scrollbar{display:none}',
      '.gq287Hero{position:relative;flex:0 0 78%;min-width:250px;height:158px;border-radius:25px;overflow:hidden;background-size:cover;background-position:center;scroll-snap-align:start;color:#fff;border:1px solid rgba(255,255,255,.14);box-shadow:0 18px 48px rgba(8,12,20,.18);isolation:isolate}',
      '.gq287Hero:before{content:"";position:absolute;inset:0;background:linear-gradient(135deg,rgba(5,8,14,.82),rgba(5,8,14,.34) 48%,rgba(5,8,14,.82)),radial-gradient(circle at 85% 10%,rgba(255,255,255,.18),transparent 34%);z-index:0}',
      '.gq287HeroInner{position:relative;z-index:1;height:100%;display:flex;flex-direction:column;justify-content:space-between;padding:14px;text-shadow:0 2px 14px rgba(0,0,0,.45)}',
      '.gq287Eyebrow{display:inline-flex;align-self:flex-start;border-radius:999px;padding:6px 8px;background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.16);backdrop-filter:blur(14px);font-size:10px;font-weight:1000;letter-spacing:.08em;text-transform:uppercase;color:rgba(255,255,255,.86)}',
      '.gq287Hero h4{margin:0;font-size:22px;line-height:1;letter-spacing:-.65px;font-weight:1000;max-width:88%}',
      '.gq287Hero p{margin:6px 0 0;font-size:12px;line-height:1.28;font-weight:800;color:rgba(255,255,255,.78);max-width:88%}',
      '.gq287Bottom{display:flex;align-items:flex-end;justify-content:space-between;gap:10px}',
      '.gq287Btn{border:0;border-radius:999px;padding:9px 12px;background:linear-gradient(135deg,#86efac,#315f2c);color:#061407;font-size:12px;font-weight:1000;box-shadow:0 14px 30px rgba(49,95,44,.28);text-shadow:none;cursor:pointer}',
      '.gq287Icon{width:36px;height:36px;border-radius:15px;display:grid;place-items:center;background:rgba(255,255,255,.13);border:1px solid rgba(255,255,255,.16);backdrop-filter:blur(14px);font-size:18px}',
      '.group-quests-view.gq284.gq287Compact{gap:13px}',
      '.gq287Compact .gq284Card{min-height:330px;border-radius:25px;box-shadow:0 18px 48px rgba(8,12,20,.18)}',
      '.gq287Compact .gq284Content{min-height:330px;padding:14px;gap:9px}',
      '.gq287Compact .gq284Title{margin-top:2px}.gq287Compact .gq284Title h3{font-size:23px;line-height:1.02;-webkit-line-clamp:1}.gq287Compact .gq284Title p{font-size:12px;-webkit-line-clamp:1;margin-top:5px}',
      '.gq287Compact .gq284ProgressPanel{padding:10px;border-radius:19px}.gq287Compact .gq284PartyLine{margin-bottom:9px}.gq287Compact .gq284Avatar{width:35px;height:35px}.gq287Compact .gq284Avatar small{min-width:17px;height:17px;font-size:8px}',
      '.gq287Compact .gq284TasksPanel{padding:10px;border-radius:18px;gap:6px}.gq287Compact .gq284Task{min-height:24px}.gq287Compact .gq284Task b{font-size:11px}.gq287Compact .gq284Task span{width:21px;height:21px;flex-basis:21px}',
      '.gq287Compact .gq284Actions{grid-template-columns:1fr 1fr}.gq287Compact .gq284Actions button{min-height:40px;padding:10px;font-size:12px;border-radius:16px}',
      '.gq287Compact .gq286Edit{right:12px;bottom:12px;padding:7px 10px;font-size:11px}',
      '@media(max-width:420px){.gq287Hero{flex-basis:82%;height:148px}.gq287Hero h4{font-size:20px}.gq287Compact .gq284Card{min-height:350px}.gq287Compact .gq284Content{min-height:350px}.gq287Compact .gq284Actions{grid-template-columns:1fr}}'
    ].join('\n');
    document.head.appendChild(s);
  }

  function esc(value){
    return String(value == null ? '' : value).replace(/[&<>\"]/g, function(ch){
      return ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '\"':'&quot;' })[ch] || ch;
    });
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
      id: 'gq-' + Date.now(),
      title: data.title,
      description: data.description,
      type: data.type || 'team',
      status: 'open',
      target: steps.length || 3,
      progress: 0,
      xp: data.xp || 120,
      coinReward: data.coins || 30,
      multiplier: data.multiplier || 1.12,
      deadline: new Date().toISOString().slice(0,10),
      members: [{ id: activeId, status: 'joined', contribution: 0 }],
      invitedMemberIds: [],
      helpRequested: true,
      steps: steps,
      autoBackground: true,
      background: '',
      tags: [data.type || 'team', 'group', 'template']
    };
    var list = window.loadGroupQuests() || [];
    list.unshift(q);
    window.saveGroupQuests(list);
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
        onOpen: function(ctx){
          ctx.modal.querySelectorAll('[data-template]').forEach(function(btn){
            btn.addEventListener('click', function(){
              var t = btn.getAttribute('data-template');
              ctx.close();
              if(t === 'meal') return makeQuest({ title:'Meal Prep Party', description:'Samen koken, voorbereiden en opruimen.', type:'team', xp:110, steps:['Menu kiezen','Ingrediënten klaarzetten','Samen koken','Keuken resetten'], toast:'Meal Prep Party gestart 🍳' });
              if(t === 'reset') return makeQuest({ title:'Weekend Reset Dungeon', description:'Een korte dungeon om het huis weekend-klaar te maken.', type:'dungeon', xp:140, steps:['Woonkamer resetten','Was verzamelen','Badkamer check','Afval wegbrengen'], toast:'Weekend Reset Dungeon gestart 🗝️' });
              return makeQuest({ title:'Household Cleanup Raid', description:'Een snelle raid om samen het huis op te ruimen.', type:'raid', xp:160, steps:['Taken verdelen','Keuken aanpakken','Woonkamer opruimen','Afval en was afronden'], toast:'Cleanup Raid gestart 🐉' });
            });
          });
        },
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
        var icon = card.key === 'create' ? '⚔️' : card.key === 'templates' ? '🗺️' : '🏆';
        return '<article class="gq287Hero" data-gq287="'+esc(card.key)+'" style="background-image:url('+esc(card.bg)+')">'
          + '<div class="gq287HeroInner"><span class="gq287Eyebrow">'+esc(card.eyebrow)+'</span>'
          + '<div class="gq287Bottom"><div><h4>'+esc(card.title)+'</h4><p>'+esc(card.text)+'</p></div><div class="gq287Icon">'+icon+'</div></div>'
          + '<button class="gq287Btn" type="button">'+esc(card.cta)+'</button></div></article>';
      }).join('')
      + '</div></section>';
  }

  function patch(){
    injectStyles();
    var view = document.querySelector('#task-content .group-quests-view.gq284');
    if(!view) return;
    view.classList.add('gq287Compact');
    if(!document.getElementById(CAROUSEL_ID)){
      view.insertAdjacentHTML('beforebegin', carouselHtml());
    }
    document.querySelectorAll('[data-gq287]').forEach(function(el){
      if(el.__gq287Bound) return;
      el.__gq287Bound = true;
      el.addEventListener('click', function(ev){
        var btnOrCard = ev.target.closest('button') || ev.currentTarget;
        if(!btnOrCard) return;
        handleCard(el.getAttribute('data-gq287'));
      });
    });
  }

  function install(){
    injectStyles();
    patch();
    var root = document.getElementById('task-content');
    if(root && !root.__gq287Observer){
      root.__gq287Observer = true;
      new MutationObserver(function(){ clearTimeout(root.__gq287Timer); root.__gq287Timer = setTimeout(patch, 60); }).observe(root, { childList:true, subtree:true });
    }
  }

  var tries = 0;
  var timer = setInterval(function(){
    tries++;
    install();
    if(document.querySelector('#task-content .group-quests-view.gq284') || tries > 40) clearInterval(timer);
  }, 150);

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
  else install();

  window.GroupQuestOverviewRestructure = { install: install, patch: patch };
})();
