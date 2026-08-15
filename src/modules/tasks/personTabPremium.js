'use strict';
// ============================================================
// PERSOON TAB PREMIUM v4.0
// Pure renderer over PersonDashboardService. No name-based task lookups.
// ============================================================
(function(){
  if(window.__personTabPremiumV4) return;
  window.__personTabPremiumV4=true;

  var VERSION='4.0.0';
  var selectedUid=null;
  var currentTarget=null;
  var unsubscribe=null;
  var serviceLoading=false;
  var PALETTES=[
    {accent:'#a78bfa',glow:'rgba(124,58,237,.42)',hero:'linear-gradient(135deg,#211744,#4b2c7e 55%,#101426)'},
    {accent:'#f0abfc',glow:'rgba(217,70,239,.35)',hero:'linear-gradient(135deg,#31152f,#743a71 55%,#151020)'},
    {accent:'#fbbf24',glow:'rgba(245,158,11,.30)',hero:'linear-gradient(135deg,#31230d,#715522 55%,#17130d)'},
    {accent:'#5eead4',glow:'rgba(20,184,166,.30)',hero:'linear-gradient(135deg,#102e2b,#236c63 55%,#0d1718)'}
  ];
  var AREA={home:'Home',tasks:'Taken',shop:'Boodschappen',recipes:'Recepten',notes:'Notities',cal:'Agenda',calendar:'Agenda',finance:'Financiën',achievements:'Achievements',skills:'Skills',meals:'Maaltijden',profile:'Profiel',feed:'Feed'};

  function esc(v){return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');}
  function pct(n){return Math.max(0,Math.min(100,Math.round(Number(n)||0)));}
  function palette(index){return PALETTES[index%PALETTES.length];}
  function initials(member){if(member.initials)return member.initials;return String(member.displayName||'?').split(/\s+/).filter(Boolean).map(function(x){return x.charAt(0);}).join('').slice(0,2).toUpperCase()||'?';}
  function areaLabel(area){var key=String(area||'').toLowerCase();return AREA[key]||(area?String(area).charAt(0).toUpperCase()+String(area).slice(1):'de app');}
  function relative(ts){var time=Number(ts||0);if(!time)return'Offline';var min=Math.floor(Math.max(0,Date.now()-time)/60000);if(min<1)return'Zojuist actief';if(min<60)return min+' min geleden actief';var hours=Math.floor(min/60);if(hours<24)return hours+' uur geleden actief';var days=Math.floor(hours/24);return days<7?days+(days===1?' dag':' dagen')+' geleden actief':'Offline';}
  function presenceLabel(model){var p=model.presence||{};if(p.state==='online')return'Online · '+areaLabel(p.area);if(p.state==='recent')return relative(p.lastSeen)+(p.area?' · '+areaLabel(p.area):'');if(p.state==='today')return relative(p.lastSeen);return'Offline';}
  function presenceClass(model){return 'is-'+((model.presence&&model.presence.state)||'offline');}

  function injectStyles(){
    if(document.getElementById('person-tab-premium-style-v4'))return;
    var s=document.createElement('style');s.id='person-tab-premium-style-v4';s.textContent=[
      '.task-person-page{--ptp-bg:#080a14;--ptp-card:rgba(17,18,34,.78);--ptp-line:rgba(255,255,255,.075);--ptp-muted:rgba(244,246,255,.58);background:radial-gradient(90% 48% at 50% 0%,rgba(91,44,160,.24),transparent 70%),linear-gradient(180deg,#0b0d19,#070810);margin:0 -16px;padding:14px 16px 116px;min-height:100%;color:#f6f4ff;overflow-x:hidden}.task-person-page *{box-sizing:border-box}',
      '#screen-tasks:has(.task-person-page) .task-tabs{background:#0b0d19;display:flex;gap:4px;padding:10px 12px 7px;overflow-x:auto}#screen-tasks:has(.task-person-page) .ttab{background:transparent;border:0;color:rgba(244,246,255,.48);font-size:13px;font-weight:800;padding:9px 14px;border-radius:999px;white-space:nowrap}#screen-tasks:has(.task-person-page) .ttab.active{background:linear-gradient(135deg,#6d28d9,#8b5cf6);color:#fff;box-shadow:0 6px 18px rgba(109,40,217,.22)}',
      '.ptp-section{margin:0 0 18px}.ptp-section-head{display:flex;align-items:center;justify-content:space-between;margin:0 2px 10px}.ptp-title{font-size:12px;font-weight:950;letter-spacing:.075em;text-transform:uppercase;color:rgba(255,255,255,.74)}.ptp-link{border:0;background:none;color:#c4b5fd;font:inherit;font-size:11px;font-weight:850;padding:0;cursor:pointer}',
      '.ptp-members{display:flex;gap:14px;overflow-x:auto;padding:2px 2px 10px;margin-bottom:10px;scrollbar-width:none}.ptp-members::-webkit-scrollbar{display:none}.ptp-member{flex:0 0 68px;border:0;background:none;color:inherit;padding:0;text-align:center;cursor:pointer}.ptp-avatar-wrap{position:relative;width:54px;height:54px;margin:0 auto 6px}.ptp-avatar,.ptp-avatar-fallback{width:54px;height:54px;border-radius:50%;display:grid;place-items:center;object-fit:cover;border:2px solid rgba(255,255,255,.14);background:#272338;font-weight:900;font-size:14px;transition:.18s}.ptp-member.active .ptp-avatar,.ptp-member.active .ptp-avatar-fallback{border-color:var(--accent);box-shadow:0 0 0 2px #0b0d19,0 0 18px var(--glow)}.ptp-member-name{font-size:11px;font-weight:850;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:rgba(255,255,255,.68)}.ptp-member.active .ptp-member-name{color:#fff}.ptp-member-state{font-size:9px;color:rgba(255,255,255,.35);margin-top:1px}.ptp-presence-dot{position:absolute;right:-1px;bottom:1px;width:13px;height:13px;border-radius:50%;border:2.5px solid #0b0d19;background:#636977}.ptp-presence-dot.is-online{background:#22c55e;box-shadow:0 0 10px rgba(34,197,94,.55)}.ptp-presence-dot.is-recent{background:#84cc16}.ptp-presence-dot.is-today{background:#eab308}',
      '.ptp-hero{position:relative;min-height:202px;border-radius:24px;overflow:hidden;padding:18px;display:flex;align-items:flex-end;border:1px solid rgba(255,255,255,.09);box-shadow:0 18px 42px rgba(0,0,0,.34),0 0 34px var(--glow);background:var(--hero);margin-bottom:18px}.ptp-hero-bg{position:absolute;inset:0;background-size:cover;background-position:center 24%;opacity:.66;transform:scale(1.015)}.ptp-hero::after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,rgba(7,8,15,.94) 0%,rgba(7,8,15,.65) 42%,rgba(7,8,15,.18) 75%),linear-gradient(180deg,rgba(7,8,15,.08),rgba(7,8,15,.88))}.ptp-hero-content{position:relative;z-index:2;width:min(72%,270px)}.ptp-hero-name{font-size:25px;font-weight:950;letter-spacing:-.035em;line-height:1}.ptp-hero-title{font-size:12px;font-weight:850;color:#d8ccff;margin-top:5px}.ptp-presence{display:flex;align-items:center;gap:7px;font-size:10.5px;font-weight:750;color:rgba(255,255,255,.62);margin-top:7px}.ptp-presence i{width:7px;height:7px;border-radius:50%;background:#6b7280}.ptp-presence.is-online{color:#bbf7d0}.ptp-presence.is-online i{background:#22c55e;box-shadow:0 0 8px rgba(34,197,94,.55)}.ptp-presence.is-recent i{background:#84cc16}.ptp-presence.is-today i{background:#eab308}.ptp-level-badge{position:absolute;right:15px;top:15px;z-index:3;width:56px;height:62px;clip-path:polygon(50% 0,94% 18%,94% 72%,50% 100%,6% 72%,6% 18%);display:grid;place-items:center;align-content:center;background:linear-gradient(180deg,#4c1d95,#26104d);border:none;filter:drop-shadow(0 5px 10px rgba(0,0,0,.35))}.ptp-level-badge:before{content:"";position:absolute;inset:3px;clip-path:inherit;border:1px solid #f2c76e}.ptp-level-label{font-size:7px;text-transform:uppercase;font-weight:900;color:#f5d78e}.ptp-level-num{font-size:20px;line-height:1;font-weight:950;color:#fff3c4}.ptp-xp{margin-top:14px}.ptp-xp-meta{display:flex;justify-content:space-between;font-size:9px;color:rgba(255,255,255,.52);margin-bottom:5px}.ptp-xp-track{height:7px;background:rgba(255,255,255,.13);border-radius:999px;overflow:hidden}.ptp-xp-fill{height:100%;border-radius:inherit;background:linear-gradient(90deg,#7c3aed,#c084fc,#ddd6fe);box-shadow:0 0 10px rgba(192,132,252,.5)}',
      '.ptp-stat-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}.ptp-stat{min-width:0;background:linear-gradient(180deg,rgba(36,28,66,.72),rgba(18,18,33,.8));border:1px solid var(--ptp-line);border-radius:15px;padding:11px 5px 10px;text-align:center}.ptp-stat-icon{font-size:17px;line-height:1;margin-bottom:6px}.ptp-stat-value{font-size:17px;font-weight:950;line-height:1.1}.ptp-stat-label{font-size:8.5px;color:var(--ptp-muted);margin-top:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.ptp-quest-list{display:grid;gap:8px}.ptp-quest{display:grid;grid-template-columns:39px 1fr auto;gap:10px;align-items:center;background:var(--ptp-card);border:1px solid var(--ptp-line);border-radius:15px;padding:10px 11px}.ptp-quest-icon{width:39px;height:39px;border-radius:12px;display:grid;place-items:center;background:linear-gradient(145deg,#4c267c,#211534);font-size:18px}.ptp-quest-title{font-size:12.5px;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.ptp-quest-sub{font-size:9.5px;color:var(--ptp-muted);margin-top:3px}.ptp-quest-xp{font-size:10px;font-weight:900;color:#d8b4fe;background:#35165e;border:1px solid rgba(216,180,254,.2);padding:5px 7px;border-radius:999px;white-space:nowrap}',
      '.ptp-progress-card{position:relative;overflow:hidden;background:linear-gradient(115deg,rgba(57,27,95,.82),rgba(22,20,38,.92));border:1px solid rgba(196,181,253,.15);border-radius:18px;padding:15px}.ptp-progress-card:after{content:"";position:absolute;right:-15px;bottom:-28px;width:120px;height:120px;border-radius:50%;background:radial-gradient(circle,rgba(124,58,237,.2),transparent 70%)}.ptp-progress-top{display:flex;align-items:center;gap:12px;position:relative;z-index:1}.ptp-crest{width:48px;height:55px;clip-path:polygon(50% 0,94% 16%,94% 70%,50% 100%,6% 70%,6% 16%);background:linear-gradient(160deg,#6d28d9,#281249);display:grid;place-items:center;font-size:23px;filter:drop-shadow(0 6px 10px rgba(0,0,0,.28))}.ptp-progress-body{flex:1;min-width:0}.ptp-progress-name{font-size:13px;font-weight:950}.ptp-progress-level{font-size:9.5px;color:var(--ptp-muted);margin-top:2px}.ptp-progress-percent{font-size:12px;font-weight:950;color:#f4e8ff}.ptp-progress-track{height:7px;border-radius:999px;background:rgba(255,255,255,.11);margin-top:9px;overflow:hidden}.ptp-progress-fill{height:100%;border-radius:inherit;background:linear-gradient(90deg,#7c3aed,#c084fc)}.ptp-progress-foot{font-size:9px;color:var(--ptp-muted);margin-top:7px}',
      '.ptp-achievements{display:flex;gap:8px;overflow-x:auto;padding-bottom:3px;scrollbar-width:none}.ptp-achievements::-webkit-scrollbar{display:none}.ptp-ach{flex:0 0 78px;min-height:88px;background:var(--ptp-card);border:1px solid var(--ptp-line);border-radius:14px;padding:10px 6px;text-align:center}.ptp-ach-icon{width:35px;height:35px;border-radius:11px;margin:0 auto 6px;display:grid;place-items:center;background:linear-gradient(145deg,#5f2990,#26133f);font-size:18px}.ptp-ach-name{font-size:8.5px;font-weight:850;line-height:1.15}.ptp-ach-sub{font-size:7.5px;color:var(--ptp-muted);margin-top:3px}.ptp-ach.empty{opacity:.45}',
      '.ptp-activity{background:var(--ptp-card);border:1px solid var(--ptp-line);border-radius:16px;padding:5px 12px}.ptp-activity-row{display:flex;gap:10px;align-items:center;padding:10px 0}.ptp-activity-row+.ptp-activity-row{border-top:1px solid var(--ptp-line)}.ptp-activity-icon{width:26px;height:26px;border-radius:8px;background:#251a3d;display:grid;place-items:center}.ptp-activity-text{flex:1;font-size:10.5px;color:rgba(255,255,255,.75)}.ptp-activity-time{font-size:8.5px;color:rgba(255,255,255,.35)}.ptp-empty{padding:17px 12px;text-align:center;border:1px dashed rgba(255,255,255,.11);border-radius:14px;color:rgba(255,255,255,.42);font-size:10.5px}.ptp-loading{padding:34px 14px;text-align:center;color:rgba(255,255,255,.52)}',
      '@media(min-width:480px){.task-person-page{margin:0}.ptp-hero{min-height:220px}}'
    ].join('\n');document.head.appendChild(s);
  }

  function ensureService(done){
    if(window.PersonDashboardService){done();return;}
    if(serviceLoading)return;
    serviceLoading=true;
    var script=document.createElement('script');
    script.src='src/modules/tasks/personDashboardService.js?v=1';
    script.onload=function(){serviceLoading=false;done();};
    script.onerror=function(){serviceLoading=false;if(currentTarget)currentTarget.innerHTML='<div class="ptp-loading">Persoonsgegevens konden niet worden geladen.</div>';};
    document.head.appendChild(script);
  }

  function decorate(models){return (models||[]).map(function(model,index){model._palette=palette(index);return model;});}
  function choose(models){if(!models.length)return null;var valid=selectedUid&&models.find(function(m){return m.uid===selectedUid;});if(valid)return valid;var own=models.find(function(m){return m.member&&m.member.isCurrent;});var next=own||models[0];selectedUid=next.uid;return next;}

  function memberRail(models){return'<div class="ptp-members">'+models.map(function(m){var p=m._palette,active=m.uid===selectedUid,mem=m.member||{},pr=m.presence||{};return'<button type="button" class="ptp-member'+(active?' active':'')+'" data-person-uid="'+esc(m.uid)+'" style="--accent:'+p.accent+';--glow:'+p.glow+'"><div class="ptp-avatar-wrap">'+(mem.avatar?'<img class="ptp-avatar" src="'+esc(mem.avatar)+'" alt="'+esc(mem.displayName)+'">':'<div class="ptp-avatar-fallback">'+esc(initials(mem))+'</div>')+'<i class="ptp-presence-dot '+presenceClass(m)+'"></i></div><div class="ptp-member-name">'+esc(mem.displayName)+'</div><div class="ptp-member-state">'+(pr.state==='online'?'Online':pr.state==='recent'?'Recent':pr.state==='today'?'Vandaag':'Offline')+'</div></button>';}).join('')+'</div>';}

  function hero(model){var p=model._palette,mem=model.member||{},prog=model.progression||{},prev=Number(prog.previousLevelXp||0),next=Number(prog.nextLevelXp||prev+1),value=Number(prog.xp||0),progress=next>prev?pct((value-prev)/(next-prev)*100):0;return'<div class="ptp-hero" style="--glow:'+p.glow+';--hero:'+p.hero+'">'+(mem.avatar?'<div class="ptp-hero-bg" style="background-image:url(&quot;'+esc(mem.avatar)+'&quot;)"></div>':'')+'<div class="ptp-level-badge"><div class="ptp-level-label">Level</div><div class="ptp-level-num">'+esc(prog.level||1)+'</div></div><div class="ptp-hero-content"><div class="ptp-hero-name">'+esc(mem.displayName||'Gezinslid')+'</div><div class="ptp-hero-title">'+esc(prog.title||'Avonturier')+'</div><div class="ptp-presence '+presenceClass(model)+'"><i></i><span>'+esc(presenceLabel(model))+'</span></div><div class="ptp-xp"><div class="ptp-xp-meta"><span>'+value.toLocaleString('nl-NL')+' XP</span><span>'+next.toLocaleString('nl-NL')+' XP</span></div><div class="ptp-xp-track"><div class="ptp-xp-fill" style="width:'+progress+'%"></div></div></div></div></div>';}

  function stats(model){var q=model.quests||{},p=model.progression||{},cap=model.capabilities||{},streak=cap.streak&&p.streak!=null?p.streak:'—';return'<div class="ptp-section"><div class="ptp-section-head"><div class="ptp-title">Jouw avontuur</div></div><div class="ptp-stat-grid">'+[
    ['⬡',p.level||1,'Level'],['🔥',streak,'Streak'],['⚔️',q.completedCount||0,'Quests'],['✦',q.earnedXpThisWeek||0,'XP/week']
  ].map(function(x){return'<div class="ptp-stat"><div class="ptp-stat-icon">'+x[0]+'</div><div class="ptp-stat-value">'+esc(x[1])+'</div><div class="ptp-stat-label">'+esc(x[2])+'</div></div>';}).join('')+'</div></div>';}

  function questIcon(task){var type=String(task.type||'').toUpperCase();if(type.indexOf('RAID')>-1)return'⚔️';if(type.indexOf('DUNGEON')>-1)return'🏰';return'✦';}
  function quests(model){var list=((model.quests&&model.quests.active)||[]).slice(0,3);return'<div class="ptp-section"><div class="ptp-section-head"><div class="ptp-title">Actieve quests</div><button class="ptp-link" type="button" data-ptp-go-tasks>Alles bekijken ›</button></div>'+(list.length?'<div class="ptp-quest-list">'+list.map(function(t){var role=(t.roles||[]).indexOf('helper')>-1?'Helpt mee':(t.roles||[]).indexOf('creator')>-1?'Maker':'Toegewezen';return'<div class="ptp-quest"><div class="ptp-quest-icon">'+questIcon(t)+'</div><div><div class="ptp-quest-title">'+esc(t.title)+'</div><div class="ptp-quest-sub">'+esc(role+(t.dueDate?' · '+t.dueDate:''))+'</div></div><div class="ptp-quest-xp">+'+esc(t.xp||0)+' XP</div></div>';}).join('')+'</div>':'<div class="ptp-empty">Geen actieve quests voor dit gezinslid.</div>')+'</div>';}

  function progression(model){var p=model.progression||{},prev=Number(p.previousLevelXp||0),next=Number(p.nextLevelXp||prev+1),value=Number(p.xp||0),progress=next>prev?pct((value-prev)/(next-prev)*100):0;return'<div class="ptp-section"><div class="ptp-section-head"><div class="ptp-title">Progressie</div></div><div class="ptp-progress-card"><div class="ptp-progress-top"><div class="ptp-crest">⚔</div><div class="ptp-progress-body"><div class="ptp-progress-name">'+esc(p.title||'Avonturier')+'</div><div class="ptp-progress-level">Level '+esc(p.level||1)+'</div><div class="ptp-progress-track"><div class="ptp-progress-fill" style="width:'+progress+'%"></div></div><div class="ptp-progress-foot">Nog '+Math.max(0,next-value).toLocaleString('nl-NL')+' XP tot het volgende level</div></div><div class="ptp-progress-percent">'+progress+'%</div></div></div></div>';}

  function achievements(model){var list=((model.achievements&&model.achievements.recent)||[]).slice(0,5),cards=list.map(function(a){return'<div class="ptp-ach"><div class="ptp-ach-icon">🏆</div><div class="ptp-ach-name">'+esc(a.id)+'</div><div class="ptp-ach-sub">Ontgrendeld</div></div>';});while(cards.length<5)cards.push('<div class="ptp-ach empty"><div class="ptp-ach-icon">🔒</div><div class="ptp-ach-name">Nog te ontdekken</div><div class="ptp-ach-sub">Locked</div></div>');return'<div class="ptp-section"><div class="ptp-section-head"><div class="ptp-title">Achievements</div><button class="ptp-link" type="button" data-ptp-go-achievements>Alles bekijken ›</button></div><div class="ptp-achievements">'+cards.join('')+'</div></div>';}

  function activity(model){var enabled=model.capabilities&&model.capabilities.activity,list=(model.activity&&model.activity.recent)||[];if(!enabled||!list.length)return'<div class="ptp-section"><div class="ptp-section-head"><div class="ptp-title">Recente activiteit</div></div><div class="ptp-empty">Activiteitenfeed wordt UID-gebaseerd aangesloten in de volgende datalaag. Er wordt hier bewust geen legacy naam-data getoond.</div></div>';return'<div class="ptp-section"><div class="ptp-section-head"><div class="ptp-title">Recente activiteit</div></div><div class="ptp-activity">'+list.map(function(a){return'<div class="ptp-activity-row"><div class="ptp-activity-icon">'+esc(a.icon||'✦')+'</div><div class="ptp-activity-text">'+esc(a.text||a.title||'Activiteit')+'</div><div class="ptp-activity-time">'+esc(a.timeLabel||'')+'</div></div>';}).join('')+'</div></div>';}

  function bind(el){
    el.querySelectorAll('[data-person-uid]').forEach(function(btn){btn.addEventListener('click',function(){selectedUid=btn.getAttribute('data-person-uid');renderFromService();});});
    var tasksBtn=el.querySelector('[data-ptp-go-tasks]');if(tasksBtn)tasksBtn.addEventListener('click',function(){try{if(typeof window.setTaskTab==='function'){var tab=document.querySelector('.ttab[data-tab="overzicht"]');window.setTaskTab('overzicht',tab||null);}}catch(e){}});
    var ach=el.querySelector('[data-ptp-go-achievements]');if(ach)ach.addEventListener('click',function(){try{if(typeof window.showScreen==='function')window.showScreen('achievements');}catch(e){}});
  }

  function draw(models){
    if(!currentTarget)return;
    var data=decorate(models||[]),chosen=choose(data);
    if(!chosen){currentTarget.innerHTML='<div class="task-person-page"><div class="ptp-loading">Gezinsleden worden geladen…</div></div>';return;}
    var html='<div class="task-person-page">'+memberRail(data)+hero(chosen)+stats(chosen)+quests(chosen)+progression(chosen)+achievements(chosen)+activity(chosen)+'</div>';
    currentTarget.innerHTML=html;bind(currentTarget);
  }

  function renderFromService(){if(!window.PersonDashboardService){ensureService(renderFromService);return;}draw(window.PersonDashboardService.getMembers());}
  function connect(){if(!window.PersonDashboardService)return;if(unsubscribe)return;unsubscribe=window.PersonDashboardService.subscribe(function(models){if(currentTarget&&document.documentElement.contains(currentTarget))draw(models);});}

  window.renderTasksPersoon=function(el){
    injectStyles();
    currentTarget=el||document.getElementById('task-content');
    if(!currentTarget)return;
    currentTarget.innerHTML='<div class="task-person-page"><div class="ptp-loading">Persoonsdashboard laden…</div></div>';
    ensureService(function(){connect();renderFromService();});
  };

  window.PersonTabPremium={version:VERSION,render:window.renderTasksPersoon,refresh:function(){if(window.PersonDashboardService)window.PersonDashboardService.refresh();else renderFromService();},selectedUid:function(){return selectedUid;}};

  window.addEventListener('familyapp:person-dashboard-updated',function(){if(currentTarget&&document.documentElement.contains(currentTarget))renderFromService();});
})();
