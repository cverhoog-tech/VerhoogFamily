'use strict';
// ============================================================
// FAMILYAPP TASKS V3 — OVERVIEW
// New presentation built from scratch on canonical taskData.
// No persistence ownership. Mutations remain canonical.
// ============================================================
(function(){
  if(window.TaskOverviewV3)return;

  var state={group:'all',personUid:'all',expanded:{Verlopen:true,Vandaag:true,Morgen:true,Later:true,Voltooid:false},memberMenu:false};
  var GROUP_ORDER=['Verlopen','Vandaag','Morgen','Later','Voltooid'];

  function M(){return window.TaskPresentationModelV3;}
  function esc(v){return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');}
  function svg(path,size){return '<svg viewBox="0 0 24 24" width="'+(size||18)+'" height="'+(size||18)+'" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+path+'</svg>';}
  var ICON={
    leaf:svg('<path d="M19.5 4.5C11 4.8 6.1 8.7 6.1 15.1c4.9.6 10.4-2.4 13.4-10.6Z"/><path d="M5 20c2.1-4.8 5.4-8 10.8-10.4"/>',20),
    bell:svg('<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/>',18),
    plus:svg('<path d="M12 5v14M5 12h14"/>',16),
    clipboard:svg('<rect x="6" y="5" width="12" height="15" rx="2"/><path d="M9 5V3h6v2M9 10h6M9 14h5"/>',17),
    star:svg('<path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1L3.2 9.4l6.1-.9L12 3Z"/>',17),
    clock:svg('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',17),
    calendar:svg('<rect x="4" y="5.5" width="16" height="14.5" rx="2.2"/><path d="M4 10h16M8 3.5v4M16 3.5v4"/>',13),
    chevron:svg('<path d="m9 18 6-6-6-6"/>',14),
    down:svg('<path d="m7 10 5 5 5-5"/>',14),
    check:svg('<path d="m6 12 4 4 8-8"/>',13),
    people:svg('<circle cx="9" cy="8" r="3"/><circle cx="16.5" cy="9" r="2.2"/><path d="M3.5 20a5.5 5.5 0 0 1 11 0M13 20a4 4 0 0 1 7.5-1.8"/>',17)
  };

  function avatarHtml(person,cls){if(!person)return'';var c=cls||'tv3-avatar';return person.avatar?'<img class="'+c+'" src="'+esc(person.avatar)+'" alt="'+esc(person.name)+'">':'<span class="'+c+'">'+esc(M().initials(person.name))+'</span>';}
  function brandFamily(){var ms=M().members().slice(0,3),stack=ms.map(function(member){return avatarHtml({name:member.displayName||member.name||'Gezinslid',avatar:M().avatar(member)},'tv3-family-avatar');}).join('');return '<button class="tv3-family-stack" data-tv3-members="1" aria-label="Filter op gezinslid">'+(stack||ICON.people)+'</button>';}
  function brandHeader(){return '<header class="tv3-brand"><div class="tv3-brand-lockup"><span class="tv3-brand-leaf">'+ICON.leaf+'</span><span><strong>FamilyApp</strong><small>Samen rust en overzicht</small></span></div><div class="tv3-brand-actions"><button class="tv3-icon-btn" data-tv3-notif="1" aria-label="Meldingen">'+ICON.bell+'</button>'+brandFamily()+'</div></header>';}
  function memberMenu(){if(!state.memberMenu)return'';var rows=['<button data-tv3-person="all" class="'+(state.personUid==='all'?'active':'')+'">Iedereen</button>'];M().members().forEach(function(member){var id=member.uid||member.id,name=member.displayName||member.name||'Gezinslid',person={name:name,avatar:M().avatar(member)};rows.push('<button data-tv3-person="'+esc(id)+'" class="'+(String(state.personUid)===String(id)?'active':'')+'>'+avatarHtml(person,'tv3-menu-avatar')+'<span>'+esc(name)+'</span></button>');});rows.push('<button class="tv3-member-dashboard" data-tv3-person-dashboard="1">'+ICON.people+'<span>Persoon-overzicht</span></button>');return '<div class="tv3-member-menu" role="menu">'+rows.join('')+'</div>';}
  function statusCards(summary){function card(type,value,label,icon){return '<button class="tv3-stat tv3-stat--'+type+'" data-tv3-stat="'+type+'"><span class="tv3-stat-icon">'+icon+'</span><strong>'+value+'</strong><small>'+label+'</small></button>';}return '<section class="tv3-stats">'+card('open',summary.open,'open taken',ICON.clipboard)+card('important',summary.important,'belangrijk',ICON.star)+card('overdue',summary.overdue,'verlopen',ICON.clock)+'</section>';}
  function quote(){return '<section class="tv3-quote"><span class="tv3-quote-icon">'+ICON.leaf+'</span><span><strong>“Kleine taken, een rustiger thuis”</strong><small>Samen maken we tijd voor wat echt telt.</small></span></section>';}
  function filters(){var items=[['all','Alle taken'],['Vandaag','Vandaag'],['Morgen','Morgen'],['Later','Later'],['Voltooid','Voltooid']];return '<nav class="tv3-filters" aria-label="Taken filter">'+items.map(function(x){return '<button data-tv3-filter="'+x[0]+'" class="'+(state.group===x[0]?'active':'')+'">'+x[1]+'</button>';}).join('')+'</nav>';}

  function assigneeMatches(vm){if(state.personUid==='all')return true;return vm.people.some(function(p){return String(p.uid)===String(state.personUid);});}
  function visibleVms(){return M().tasks().map(M().view).filter(assigneeMatches);}
  function groups(){var out={Verlopen:[],Vandaag:[],Morgen:[],Later:[],Voltooid:[]};visibleVms().forEach(function(vm){out[vm.group].push(vm);});Object.keys(out).forEach(function(name){out[name].sort(function(a,b){var ad=String(a.raw.date||'9999'),bd=String(b.raw.date||'9999');return ad.localeCompare(bd)||a.title.localeCompare(b.title,'nl');});});return out;}
  function shownGroups(all){if(state.group==='all')return GROUP_ORDER.filter(function(name){return all[name].length;});return all[state.group]&&all[state.group].length?[state.group]:[];}
  function row(vm){var p=vm.primaryPerson,done=!!vm.raw.done;return '<article class="tv3-task-row'+(done?' is-done':'')+'" data-tv3-task="'+esc(vm.id)+'">'+'<button class="tv3-task-check" data-tv3-toggle="'+esc(vm.id)+'" aria-label="'+(done?'Heropen taak':'Voltooi taak')+'" aria-pressed="'+(done?'true':'false')+'">'+(done?ICON.check:'')+'</button>'+'<div class="tv3-task-photo" style="background-image:url(\''+esc(vm.photo)+'\')" aria-hidden="true"></div>'+'<div class="tv3-task-copy"><strong>'+esc(vm.title)+'</strong><div class="tv3-task-meta">'+(p?avatarHtml(p,'tv3-row-avatar'):'')+(p?'<span>'+esc(p.name)+'</span><i></i>':'')+'<span class="tv3-date">'+ICON.calendar+esc(vm.dateLabel)+'</span></div></div>'+'<span class="tv3-xp">+'+vm.xp+' XP</span><span class="tv3-row-chevron">'+ICON.chevron+'</span></article>';}
  function groupSection(name,list){var open=state.expanded[name]!==false;return '<section class="tv3-group tv3-group--'+name.toLowerCase()+'"><button class="tv3-group-head" data-tv3-group="'+name+'"><span><strong>'+name+'</strong><small>'+list.length+' '+(list.length===1?'taak':'taken')+'</small></span><span class="tv3-group-arrow'+(open?' open':'')+'">'+ICON.down+'</span></button>'+(open?'<div class="tv3-list">'+list.map(row).join('')+'</div>':'')+'</section>';}
  function loading(){return '<div class="tv3-loading"><span>Taken synchroniseren…</span><i></i><i></i><i></i></div>';}
  function empty(){return '<div class="tv3-empty"><strong>Geen taken hier</strong><span>Deze categorie is helemaal rustig.</span></div>';}
  function top(summary){return brandHeader()+memberMenu()+'<section class="tv3-titlebar"><h1>Taken</h1><button class="tv3-new" data-tv3-create="1">'+ICON.plus+'<span>Nieuwe taak</span></button></section>'+statusCards(summary)+quote()+filters();}

  function render(el){if(!el)el=document.getElementById('task-content');if(!el||!M())return;document.body.setAttribute('data-task-v3','1');var summary=M().statusSummary();if(!M().tasks().length&&!M().isHydrated()){el.innerHTML='<div class="tv3-page">'+top(summary)+loading()+'</div>';bind(el);return;}var all=groups(),names=shownGroups(all),body=names.length?names.map(function(name){return groupSection(name,all[name]);}).join(''):empty();el.innerHTML='<div class="tv3-page">'+top(summary)+body+'</div>';bind(el);}

  function openPersonDashboard(){state.memberMenu=false;var btn=Array.prototype.slice.call(document.querySelectorAll('#screen-tasks .task-tabs .ttab')).find(function(x){return (x.textContent||'').trim().toLowerCase()==='persoon';});if(typeof window.setTaskTab==='function')window.setTaskTab('persoon',btn||null);}
  function optimisticOverviewCheck(btn,task){
    if(!btn||!task)return;
    var next=!task.done,rowEl=btn.closest('.tv3-task-row');
    btn.innerHTML=next?ICON.check:'';
    btn.setAttribute('aria-pressed',next?'true':'false');
    btn.setAttribute('aria-label',next?'Heropen taak':'Voltooi taak');
    if(rowEl)rowEl.classList.toggle('is-done',next);
  }
  function toggleTask(vm,btn){if(!vm)return;var subs=vm.subtasks;if(!vm.raw.done&&subs.length&&!subs.every(function(s){return s&&s.done;})){if(window.TaskDetailPopup)TaskDetailPopup.open(vm.raw.id||vm.raw._key);if(typeof window.showToast==='function')window.showToast('Voltooi eerst alle stappen');return;}if(typeof window.toggleTask==='function'){optimisticOverviewCheck(btn,vm.raw);window.toggleTask(vm.raw.id||vm.raw._key);return;}if(window.TaskDetailPopup&&typeof TaskDetailPopup.open==='function')TaskDetailPopup.open(vm.raw.id||vm.raw._key);}
  function bind(el){var create=el.querySelector('[data-tv3-create]');if(create)create.onclick=function(){if(window.TaskDetailPopup&&TaskDetailPopup.openCreate)TaskDetailPopup.openCreate();};var notif=el.querySelector('[data-tv3-notif]');if(notif)notif.onclick=function(){if(typeof window.showScreen==='function')window.showScreen('notif');};var memberBtn=el.querySelector('[data-tv3-members]');if(memberBtn)memberBtn.onclick=function(e){e.stopPropagation();state.memberMenu=!state.memberMenu;render(el);};el.querySelectorAll('[data-tv3-person]').forEach(function(btn){btn.onclick=function(){state.personUid=btn.getAttribute('data-tv3-person')||'all';state.memberMenu=false;render(el);};});var dashboard=el.querySelector('[data-tv3-person-dashboard]');if(dashboard)dashboard.onclick=openPersonDashboard;el.querySelectorAll('[data-tv3-filter]').forEach(function(btn){btn.onclick=function(){state.group=btn.getAttribute('data-tv3-filter')||'all';render(el);};});var overdue=el.querySelector('[data-tv3-stat="overdue"]');if(overdue)overdue.onclick=function(){state.group='Verlopen';render(el);};var important=el.querySelector('[data-tv3-stat="important"]');if(important)important.onclick=function(){state.group='all';render(el);};el.querySelectorAll('[data-tv3-group]').forEach(function(btn){btn.onclick=function(){var name=btn.getAttribute('data-tv3-group');state.expanded[name]=!state.expanded[name];render(el);};});el.querySelectorAll('[data-tv3-toggle]').forEach(function(btn){btn.onclick=function(e){e.stopPropagation();var task=M().getTask(btn.getAttribute('data-tv3-toggle'));toggleTask(task&&M().view(task),btn);};});el.querySelectorAll('[data-tv3-task]').forEach(function(rowEl){rowEl.onclick=function(e){if(e.target.closest('[data-tv3-toggle]'))return;if(window.TaskDetailPopup&&TaskDetailPopup.open)TaskDetailPopup.open(rowEl.getAttribute('data-tv3-task'));};});}

  var api={version:'3.1.0',render:render,state:state,isHydrated:function(){return M()&&M().isHydrated();}};
  window.TaskOverviewV3=api;
  window.TaskCompactHomeV3=api;
  window.TaskCompactHome=api;

  function rerender(){if(document.body&&document.body.getAttribute('data-task-view')==='overview'&&window.taskTab!=='persoon')render();}
  ['familyapp:tasks-updated','familyapp:household-identity-synced','familyapp:party-quests-updated'].forEach(function(name){window.addEventListener(name,rerender);});
})();