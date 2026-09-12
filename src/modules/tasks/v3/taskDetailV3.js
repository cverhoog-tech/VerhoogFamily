'use strict';
// ============================================================
// FAMILYAPP TASKS V3 — DETAIL / CREATE / EDIT
// Fresh UI, canonical TaskSharedData persistence.
// Completion delegates to window.toggleTask so existing reward/progression
// bridges keep their ownership.
// ============================================================
(function(){
  if(window.TaskDetailV3)return;

  var VERSION='3.0.1';
  var state={mode:null,taskId:null,draft:null,helpPicker:false,iconPicker:null,scrollOverflow:null};
  var SUB_ICONS=['','⭐','✅','📌','✨','🧹','🧽','🧴','🧼','🪣','🚿','🛒','🥦','🍎','🛏️','🚪','🪑','📦','📅','🌱','🐾','💻','🚗'];

  function M(){return window.TaskPresentationModelV3;}
  function idOf(row){return row&&(row.id||row._key)||null;}
  function esc(v){return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');}
  function clone(v){try{return JSON.parse(JSON.stringify(v));}catch(e){return v;}}
  function svg(path,size){return '<svg viewBox="0 0 24 24" width="'+(size||16)+'" height="'+(size||16)+'" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+path+'</svg>';}
  var ICON={
    close:svg('<path d="M6 6l12 12M18 6 6 18"/>',16),
    calendar:svg('<rect x="4" y="5.5" width="16" height="14.5" rx="2.2"/><path d="M4 10h16M8 3.5v4M16 3.5v4"/>',13),
    repeat:svg('<path d="M17 2l4 4-4 4"/><path d="M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4"/><path d="M21 13v2a3 3 0 0 1-3 3H3"/>',13),
    priority:svg('<path d="M5 20V10m7 10V4m7 16v-7"/>',13),
    check:svg('<path d="m5 12 4 4L19 6"/>',14),
    edit:svg('<path d="M4 20h4l11-11-4-4L4 16v4Z"/><path d="m13 7 4 4"/>',14),
    clock:svg('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',14),
    people:svg('<circle cx="9" cy="8" r="3"/><circle cx="16.5" cy="9" r="2.2"/><path d="M3.5 20a5.5 5.5 0 0 1 11 0M13 20a4 4 0 0 1 7.5-1.8"/>',16),
    trash:svg('<path d="M5 7h14M10 7V5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2M7 7l1 12a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2l1-12"/>',14)
  };

  function overlay(){
    var el=document.getElementById('tasks-v3-detail');
    if(!el){el=document.createElement('div');el.id='tasks-v3-detail';el.className='tv3d-overlay';document.body.appendChild(el);}
    return el;
  }
  function lock(){if(state.scrollOverflow===null)state.scrollOverflow=document.body.style.overflow||'';document.body.style.overflow='hidden';}
  function unlock(){document.body.style.overflow=state.scrollOverflow===null?'':state.scrollOverflow;state.scrollOverflow=null;}
  function toast(message){if(typeof window.showToast==='function')window.showToast(message);}
  function currentTask(){return M()&&M().getTask(state.taskId);}
  function close(){
    var el=document.getElementById('tasks-v3-detail');
    if(el){el.classList.remove('open');setTimeout(function(){if(el.parentNode)el.parentNode.removeChild(el);},180);}
    state.mode=null;state.taskId=null;state.draft=null;state.helpPicker=false;state.iconPicker=null;unlock();
  }
  function repositoryReady(){return !!(window.TaskSharedData&&typeof TaskSharedData.update==='function');}
  function patch(id,changes,callback){
    var row=M()&&M().getTask(id),key=idOf(row)||id;
    if(!key||!repositoryReady()){toast('Taken worden nog gesynchroniseerd');return;}
    TaskSharedData.update(key,changes).then(function(saved){if(callback)callback(saved||Object.assign({},row,changes));}).catch(function(error){toast((error&&error.message)||'Kon niet opslaan');});
  }
  function removeTask(row){
    var key=idOf(row);
    if(!key||!window.TaskSharedData||typeof TaskSharedData.remove!=='function'){toast('Taak kon niet worden verwijderd');return;}
    TaskSharedData.remove(key).then(function(){close();}).catch(function(error){toast((error&&error.message)||'Verwijderen mislukt');});
  }
  function draftFromTask(row){
    var draft=clone(row)||{};
    draft.assignedToUids=draft.assignedToUids&&typeof draft.assignedToUids==='object'?clone(draft.assignedToUids):{};
    if(!Object.keys(draft.assignedToUids).length){M().assignees(row).forEach(function(person){if(person.uid)draft.assignedToUids[person.uid]=true;});}
    draft.subtasks=Array.isArray(draft.subtasks)?clone(draft.subtasks):[];
    draft.supplies=Array.isArray(draft.supplies)?clone(draft.supplies):[];
    return draft;
  }

  function avatarHtml(person,cls){
    var c=cls||'tv3d-person-avatar';
    if(!person)return'<span class="'+c+'">?</span>';
    return person.avatar?'<img class="'+c+'" src="'+esc(person.avatar)+'" alt="'+esc(person.name)+'">':'<span class="'+c+'">'+esc(M().initials(person.name))+'</span>';
  }
  function chip(icon,label){return '<span class="tv3d-chip">'+icon+'<span>'+esc(label)+'</span></span>';}
  function managedCleaning(row){try{return !!(window.CleaningTaskSupplyUi&&CleaningTaskSupplyUi._isManaged&&CleaningTaskSupplyUi._isManaged(row));}catch(e){return false;}}
  function completeAllowed(vm){return !vm.subtasks.length||vm.subtasks.every(function(sub){return sub&&sub.done;});}

  function collaboration(row){
    var me=M().currentUid(),assigned=M().assignees(row),helpers=Array.isArray(row.helpers)?row.helpers:[];
    var owner=window.TaskSharedData&&TaskSharedData.isTaskOwner&&TaskSharedData.isTaskOwner(row,me);
    var helper=helpers.some(function(h){return String(h&&(h.uid||h.memberId||h.id))===String(me);});
    if(helper)return{role:'helper',title:'Samen aan deze taak',subtitle:'Je helpt mee met deze taak.',button:'Stop helpen'};
    if(owner&&row.helpRequested)return{role:'owner-pending',title:'Hulp gevraagd',subtitle:row.helpAudience==='household'?'De hulpvraag staat open voor het gezin.':'De uitnodiging staat nog open.',button:'Intrekken'};
    if(owner)return{role:'owner',title:'Hulp nodig?',subtitle:'Vraag iemand uit je gezin om mee te helpen.',button:'Hulp vragen'};
    if(row.helpRequested&&(row.helpAudience==='household'||String(row.helpRequestedForUid||'')===String(me)))return{role:'invitee',title:'Hulp gevraagd',subtitle:'Je kunt aansluiten bij deze taak.',button:'Meehelpen'};
    return{role:'viewer',title:'Samen',subtitle:assigned.length?'Deze taak is toegewezen aan '+assigned.map(function(p){return p.name;}).join(', ')+'.':'Deze taak is nog niet toegewezen.',button:null};
  }
  function helpPicker(row){
    if(!state.helpPicker)return'';
    var me=M().currentUid(),people=M().members().filter(function(member){var id=member.uid||member.id;return id&&String(id)!==String(me)&&!(row.assignedToUids&&row.assignedToUids[id]);});
    return '<div class="tv3d-help-picker">'+people.map(function(member){var id=member.uid||member.id;return '<button data-tv3-help-pick="'+esc(id)+'">'+esc(member.displayName||member.name||'Gezinslid')+'</button>';}).join('')+(people.length?'':'<span class="tv3d-supply-empty">Geen extra gezinsleden beschikbaar.</span>')+'</div>';
  }
  function helpHtml(row){
    var c=collaboration(row);
    return '<section class="tv3d-help"><span class="tv3d-help-icon">'+ICON.people+'</span><span class="tv3d-help-copy"><strong>'+esc(c.title)+'</strong><small>'+esc(c.subtitle)+'</small></span>'+(c.button?'<button class="tv3d-help-btn" data-tv3-help="'+c.role+'">'+esc(c.button)+'</button>':'')+helpPicker(row)+'</section>';
  }

  function subtaskHtml(vm){
    if(!vm.subtasks.length)return '<div class="tv3d-supply-empty">Nog geen subtaken.</div><button class="tv3d-sub-add" data-tv3-sub-add="1">+ Subtaak toevoegen</button>';
    return '<div class="tv3d-sublist">'+vm.subtasks.map(function(sub){return '<div class="tv3d-sub'+(sub.done?' is-done':'')+'"><button class="tv3d-sub-check" data-tv3-sub-toggle="'+esc(sub.id)+'">'+(sub.done?ICON.check:'')+'</button><span class="tv3d-sub-title">'+(sub.icon?'<span aria-hidden="true">'+esc(sub.icon)+'</span> ':'')+esc(sub.title||'Subtaak')+'</span><button class="tv3d-sub-more" data-tv3-sub-edit="'+esc(sub.id)+'" aria-label="Subtaak bewerken">⋮</button></div>';}).join('')+'</div><button class="tv3d-sub-add" data-tv3-sub-add="1">+ Subtaak toevoegen</button>';
  }
  function suppliesHtml(vm){
    var list=vm.supplies||[],managed=managedCleaning(vm.raw);
    return '<section class="tv3d-section"><div class="tv3d-section-head"><strong>Benodigdheden</strong>'+(list.length?'<small>'+list.length+' items</small>':'')+'</div>'+(list.length?'<div class="tv3d-supplies">'+list.map(function(item){return '<span class="tv3d-supply" data-status="'+esc(item.status||'IN_STOCK')+'"><i></i>'+esc(item.name)+'</span>';}).join('')+'</div>':'<div class="tv3d-supply-empty">Geen benodigdheden gekoppeld.</div>')+(managed?'<button class="tv3d-cleaning-manage" data-tv3-cleaning-manage="1">Beheer in Schoonmaken</button>':'')+'</section>';
  }
  function detailHtml(row){
    var vm=M().view(row),person=vm.primaryPerson,allowed=completeAllowed(vm),done=!!row.done;
    return '<article class="tv3d-card" role="dialog" aria-modal="true" aria-label="'+esc(vm.title)+'">'
      +'<div class="tv3d-hero" style="background-image:url(\''+esc(vm.photo)+'\')"><button class="tv3d-close" data-tv3-close="1">'+ICON.close+'</button></div>'
      +'<div class="tv3d-sheet"><h2 class="tv3d-title">'+esc(vm.title)+'</h2>'
      +'<div class="tv3d-person">'+avatarHtml(person)+'<span><strong>'+esc(person?person.name:'Niet toegewezen')+'</strong><small>Toegewezen aan</small></span></div>'
      +'<div class="tv3d-chips">'+chip(ICON.calendar,vm.dateLabel)+chip(ICON.repeat,vm.recurrenceLabel)+chip(ICON.priority,vm.priorityLabel)+'</div>'
      +(vm.description?'<p class="tv3d-description">'+esc(vm.description)+'</p>':'')+'<div class="tv3d-divider"></div>'
      +'<section class="tv3d-section"><div class="tv3d-section-head"><strong>Subtaken</strong><small>'+vm.subDone+' van '+vm.subtasks.length+' voltooid</small></div>'+subtaskHtml(vm)+'</section>'
      +suppliesHtml(vm)+helpHtml(row)
      +'<button class="tv3d-complete'+(done?' is-done':'')+'" data-tv3-complete="1" '+(!allowed&&!done?'disabled':'')+'>'+ICON.check+'<span>'+(done?'Heropenen':allowed?'Markeer als klaar':'Voltooi eerst alle stappen')+'</span></button>'
      +'<div class="tv3d-secondary"><button data-tv3-edit="1">'+ICON.edit+'<span>Bewerken</span></button><button data-tv3-postpone="1">'+ICON.clock+'<span>Uitstellen</span></button></div></div></article>';
  }

  function open(id){
    var row=M()&&M().getTask(id);if(!row)return;
    state.mode='detail';state.taskId=String(idOf(row));state.draft=null;state.helpPicker=false;state.iconPicker=null;lock();render();
  }
  function render(){
    var row=currentTask();if(!row){close();return;}
    if(state.mode==='edit'){renderEditor(row,false);return;}
    var el=overlay();el.innerHTML=detailHtml(row);requestAnimationFrame(function(){el.classList.add('open');});bindDetail(el,row);
  }
  function enterEditor(row,newSubtask){
    state.mode='edit';state.draft=draftFromTask(row);
    if(newSubtask){var id='sub_'+Date.now().toString(36);state.draft.subtasks.push({id:id,title:'',done:false});}
    renderEditor(row,false);
  }

  function bindDetail(el,row){
    var key=idOf(row);
    el.onclick=function(event){if(event.target===el)close();};
    var closeBtn=el.querySelector('[data-tv3-close]');if(closeBtn)closeBtn.onclick=close;
    el.querySelectorAll('[data-tv3-sub-toggle]').forEach(function(btn){btn.onclick=function(){var id=btn.getAttribute('data-tv3-sub-toggle'),next=(Array.isArray(row.subtasks)?row.subtasks:[]).map(function(sub){return String(sub.id)===String(id)?Object.assign({},sub,{done:!sub.done}):sub;});patch(key,{subtasks:next},render);};});
    el.querySelectorAll('[data-tv3-sub-edit]').forEach(function(btn){btn.onclick=function(){state.iconPicker=btn.getAttribute('data-tv3-sub-edit');enterEditor(row,false);};});
    var add=el.querySelector('[data-tv3-sub-add]');if(add)add.onclick=function(){enterEditor(row,true);};
    var complete=el.querySelector('[data-tv3-complete]');if(complete)complete.onclick=function(){var current=M().getTask(key);if(!current)return;var vm=M().view(current);if(!current.done&&!completeAllowed(vm)){toast('Voltooi eerst alle stappen');return;}if(typeof window.toggleTask==='function'){window.toggleTask(idOf(current));setTimeout(render,90);}else toast('Taak wordt nog gesynchroniseerd');};
    var edit=el.querySelector('[data-tv3-edit]');if(edit)edit.onclick=function(){enterEditor(row,false);};
    var postpone=el.querySelector('[data-tv3-postpone]');if(postpone)postpone.onclick=function(){var base=row.date?new Date(row.date+'T00:00:00'):new Date();base.setDate(base.getDate()+1);var iso=base.getFullYear()+'-'+String(base.getMonth()+1).padStart(2,'0')+'-'+String(base.getDate()).padStart(2,'0');patch(key,{date:iso},function(){toast('Taak één dag uitgesteld');render();});};
    var help=el.querySelector('[data-tv3-help]');if(help)help.onclick=function(){var role=help.getAttribute('data-tv3-help');if(!window.TaskSharedData)return;if(role==='owner'){state.helpPicker=!state.helpPicker;render();return;}var action=role==='owner-pending'?TaskSharedData.retractHelp(key):role==='invitee'?TaskSharedData.joinHelp(key):role==='helper'?TaskSharedData.leaveHelp(key):Promise.resolve();Promise.resolve(action).then(function(){state.helpPicker=false;render();}).catch(function(error){toast((error&&error.message)||'Actie mislukt');});};
    el.querySelectorAll('[data-tv3-help-pick]').forEach(function(btn){btn.onclick=function(){TaskSharedData.requestHelp(key,btn.getAttribute('data-tv3-help-pick')).then(function(){state.helpPicker=false;render();}).catch(function(error){toast((error&&error.message)||'Hulp vragen mislukt');});};});
    var manage=el.querySelector('[data-tv3-cleaning-manage]');if(manage)manage.onclick=function(){openCleaning(row);};
  }

  function openCleaning(row){
    var roomId=String(row.cleaningRoomId||'');close();if(typeof window.showScreen==='function')window.showScreen('cleaning');if(!roomId)return;
    var tries=0,timer=setInterval(function(){tries++;if(window.CleaningSupplyExperience&&CleaningSupplyExperience.openRoom){clearInterval(timer);CleaningSupplyExperience.openRoom(roomId);setTimeout(function(){var all=document.querySelector('[data-cleaning-supply-mode="all"]');if(all&&all.click)all.click();},60);}else if(tries>80)clearInterval(timer);},50);
  }

  function todayIso(){var d=new Date();d.setMinutes(d.getMinutes()-d.getTimezoneOffset());return d.toISOString().slice(0,10);}
  function newDraft(){var assigned={},me=M().currentUid();if(me)assigned[me]=true;return{title:'',desc:'',description:'',category:null,date:todayIso(),time:'',prio:'normaal',recurrence:'once',assignedToUids:assigned,subtasks:[],supplies:[],done:false};}
  function normalizeSupplyNames(value){return String(value||'').split(',').map(function(x){return x.trim();}).filter(Boolean).map(function(name,index){return{id:'supply_'+index+'_'+Date.now().toString(36),name:name,status:'IN_STOCK'};});}
  function editMembers(draft){return M().members().map(function(member){var id=member.uid||member.id,name=member.displayName||member.name||'Gezinslid',selected=!!(draft.assignedToUids&&draft.assignedToUids[id]),person={name:name,avatar:M().avatar(member)};return '<button type="button" class="tv3e-member'+(selected?' active':'')+'" data-v3e-member="'+esc(id)+'">'+avatarHtml(person,'tv3e-member-avatar')+'<span>'+esc(name)+'</span></button>';}).join('');}
  function editorSubs(draft){
    return '<div class="tv3e-sublist">'+(draft.subtasks||[]).map(function(sub){return '<div class="tv3e-subrow"><input data-v3e-sub-title="'+esc(sub.id)+'" value="'+esc(sub.title||'')+'" placeholder="Subtaak"><button type="button" data-v3e-sub-remove="'+esc(sub.id)+'">'+ICON.trash+'</button></div>'+(state.iconPicker===String(sub.id)?'<div class="tv3e-iconpicker">'+SUB_ICONS.map(function(icon){return '<button type="button" data-v3e-icon="'+esc(sub.id)+'" data-v3e-icon-value="'+esc(icon)+'">'+(icon||'Geen')+'</button>';}).join('')+'</div>':'')+'<button type="button" class="tv3e-icon-open" data-v3e-icon-open="'+esc(sub.id)+'">'+(sub.icon?esc(sub.icon)+' ':'')+'Icoon</button>';}).join('')+'</div><button type="button" class="tv3e-add" data-v3e-sub-add="1">+ Subtaak toevoegen</button>';
  }
  function notesHtml(row){
    var notes=Array.isArray(row&&row.notes)?row.notes.slice().reverse():[];
    return '<div class="tv3e-notes">'+(notes.length?notes.map(function(note){var date='';try{date=new Date(note.createdAt).toLocaleString('nl-NL',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});}catch(e){}var member=M().member(note.createdByUid)||{};return '<div class="tv3e-note"><strong>'+esc(member.displayName||member.name||'Gezinslid')+'</strong><small>'+esc(date)+'</small><p>'+esc(note.text||'')+'</p></div>';}).join(''):'<div class="tv3d-supply-empty">Nog geen opmerkingen.</div>')+'</div><div class="tv3e-note-form"><input data-v3e-note-input placeholder="Laat een opmerking achter…"><button type="button" data-v3e-note-send="1">Plaats</button></div>';
  }
  function editorHtml(row,isCreate){
    var d=state.draft,managed=!isCreate&&managedCleaning(row),supplies=Array.isArray(d.supplies)?d.supplies.map(function(x){return typeof x==='string'?x:(x&&x.name)||'';}).filter(Boolean).join(', '):'';
    return '<article class="tv3d-card tv3e-card" role="dialog" aria-modal="true"><div class="tv3d-sheet tv3e-sheet"><div class="tv3e-head"><h2>'+(isCreate?'Nieuwe taak':'Taak bewerken')+'</h2><button data-tv3-close="1">'+ICON.close+'</button></div>'
      +'<div class="tv3e-field"><label>Taaknaam</label><input class="tv3e-input" data-v3e-title value="'+esc(d.title||'')+'" placeholder="Bijv. badkamer schoonmaken"></div>'
      +'<div class="tv3e-field"><label>Beschrijving</label><textarea class="tv3e-textarea" data-v3e-desc placeholder="Wat moet er gebeuren?">'+esc(d.desc||d.description||'')+'</textarea></div>'
      +'<div class="tv3e-grid"><div class="tv3e-field"><label>Datum</label><input class="tv3e-input" type="date" data-v3e-date value="'+esc(d.date||'')+'"></div><div class="tv3e-field"><label>Tijd</label><input class="tv3e-input" type="time" data-v3e-time value="'+esc(d.time||'')+'"></div></div>'
      +'<div class="tv3e-grid"><div class="tv3e-field"><label>Herhaling</label><select class="tv3e-select" data-v3e-recurrence>'+['once','daily','weekly','monthly'].map(function(v){return '<option value="'+v+'"'+(String(d.recurrence||'once')===v?' selected':'')+'>'+({once:'Eenmalig',daily:'Dagelijks',weekly:'Wekelijks',monthly:'Maandelijks'}[v])+'</option>';}).join('')+'</select></div><div class="tv3e-field"><label>Prioriteit</label><select class="tv3e-select" data-v3e-prio>'+['laag','normaal','hoog'].map(function(v){return '<option value="'+v+'"'+(String(d.prio||d.priority||'normaal')===v?' selected':'')+'>'+({laag:'Laag',normaal:'Normaal',hoog:'Hoog'}[v])+'</option>';}).join('')+'</select></div></div>'
      +'<div class="tv3e-field"><label>Toegewezen aan</label><div class="tv3e-members">'+editMembers(d)+'</div></div><div class="tv3e-field"><label>Subtaken</label>'+editorSubs(d)+'</div>'
      +(managed?'<div class="tv3e-field"><label>Benodigdheden</label><button type="button" class="tv3e-add" data-v3e-cleaning="1">Beheer benodigdheden in Schoonmaken</button></div>':'<div class="tv3e-field"><label>Benodigdheden · gescheiden met komma&apos;s</label><input class="tv3e-input" data-v3e-supplies value="'+esc(supplies)+'" placeholder="Allesreiniger, spons, doek"></div>')
      +(!isCreate?'<div class="tv3e-field"><label>Opmerkingen</label>'+notesHtml(row)+'</div>':'')
      +'<button type="button" class="tv3e-save" data-v3e-save="1">'+(isCreate?'Taak aanmaken':'Wijzigingen opslaan')+'</button>'+(!isCreate?'<button type="button" class="tv3e-delete" data-v3e-delete="1">Taak verwijderen</button>':'')+'</div></article>';
  }

  function syncDraft(el){
    var d=state.draft;if(!d)return;var q=function(sel){return el.querySelector(sel);};
    d.title=(q('[data-v3e-title]')||{}).value||'';d.desc=(q('[data-v3e-desc]')||{}).value||'';d.description=d.desc;d.date=(q('[data-v3e-date]')||{}).value||'';d.time=(q('[data-v3e-time]')||{}).value||'';d.recurrence=(q('[data-v3e-recurrence]')||{}).value||'once';d.prio=(q('[data-v3e-prio]')||{}).value||'normaal';
    var supplies=q('[data-v3e-supplies]');if(supplies)d.supplies=normalizeSupplyNames(supplies.value);
    el.querySelectorAll('[data-v3e-sub-title]').forEach(function(input){var id=input.getAttribute('data-v3e-sub-title');d.subtasks=(d.subtasks||[]).map(function(sub){return String(sub.id)===String(id)?Object.assign({},sub,{title:input.value}):sub;});});
  }
  function renderEditor(row,isCreate){var el=overlay();el.innerHTML=editorHtml(row,isCreate);requestAnimationFrame(function(){el.classList.add('open');});bindEditor(el,row,isCreate);}
  function bindEditor(el,row,isCreate){
    var key=idOf(row);el.onclick=function(event){if(event.target===el)close();};
    var x=el.querySelector('[data-tv3-close]');if(x)x.onclick=function(){if(isCreate)close();else{state.mode='detail';state.draft=null;state.iconPicker=null;render();}};
    el.querySelectorAll('[data-v3e-member]').forEach(function(btn){btn.onclick=function(){syncDraft(el);var id=btn.getAttribute('data-v3e-member');state.draft.assignedToUids=state.draft.assignedToUids||{};if(state.draft.assignedToUids[id])delete state.draft.assignedToUids[id];else state.draft.assignedToUids[id]=true;renderEditor(row,isCreate);};});
    el.querySelectorAll('[data-v3e-sub-remove]').forEach(function(btn){btn.onclick=function(){syncDraft(el);var id=btn.getAttribute('data-v3e-sub-remove');state.draft.subtasks=(state.draft.subtasks||[]).filter(function(sub){return String(sub.id)!==String(id);});renderEditor(row,isCreate);};});
    var add=el.querySelector('[data-v3e-sub-add]');if(add)add.onclick=function(){syncDraft(el);state.draft.subtasks=state.draft.subtasks||[];state.draft.subtasks.push({id:'sub_'+Date.now().toString(36),title:'',done:false});renderEditor(row,isCreate);};
    el.querySelectorAll('[data-v3e-icon-open]').forEach(function(btn){btn.onclick=function(){syncDraft(el);var id=btn.getAttribute('data-v3e-icon-open');state.iconPicker=state.iconPicker===id?null:id;renderEditor(row,isCreate);};});
    el.querySelectorAll('[data-v3e-icon]').forEach(function(btn){btn.onclick=function(){syncDraft(el);var id=btn.getAttribute('data-v3e-icon'),value=btn.getAttribute('data-v3e-icon-value')||null;state.draft.subtasks=(state.draft.subtasks||[]).map(function(sub){return String(sub.id)===String(id)?Object.assign({},sub,{icon:value}):sub;});state.iconPicker=null;renderEditor(row,isCreate);};});
    var manage=el.querySelector('[data-v3e-cleaning]');if(manage)manage.onclick=function(){openCleaning(row);};
    var noteSend=el.querySelector('[data-v3e-note-send]');if(noteSend)noteSend.onclick=function(){var input=el.querySelector('[data-v3e-note-input]'),value=(input&&input.value||'').trim();if(!value)return;var notes=Array.isArray(row.notes)?row.notes.slice():[];notes.push({id:'note_'+Date.now().toString(36),text:value,createdByUid:M().currentUid(),createdAt:Date.now()});patch(key,{notes:notes},function(saved){state.draft=draftFromTask(saved||row);renderEditor(saved||row,false);});};
    var save=el.querySelector('[data-v3e-save]');if(save)save.onclick=function(){syncDraft(el);saveDraft(row,isCreate,save);};
    var del=el.querySelector('[data-v3e-delete]');if(del)del.onclick=function(){if(confirm('Deze taak verwijderen?'))removeTask(row);};
  }

  function saveDraft(row,isCreate,btn){
    var d=state.draft,title=String(d.title||'').trim();if(!title){toast('Geef de taak een naam');return;}
    d.assignedToUids=d.assignedToUids||{};if(!Object.keys(d.assignedToUids).length){var me=M().currentUid();if(me)d.assignedToUids[me]=true;}
    var names=[];M().members().forEach(function(member){var id=member.uid||member.id;if(id&&d.assignedToUids[id])names.push(member.displayName||member.name||'Gezinslid');});
    var payload={title:title,desc:d.desc||'',description:d.desc||'',category:d.category||null,who:names,assignedToUids:d.assignedToUids,date:d.date||'',time:d.time||'',prio:d.prio||'normaal',recurrence:d.recurrence||'once',subtasks:(d.subtasks||[]).filter(function(sub){return String(sub.title||'').trim();})};
    if(isCreate||!managedCleaning(row))payload.supplies=d.supplies||[];
    btn.disabled=true;
    if(isCreate){
      payload.createdByUid=M().currentUid();payload.done=false;
      if(!window.TaskSharedData||typeof TaskSharedData.create!=='function'){btn.disabled=false;toast('Taak kon niet worden opgeslagen');return;}
      TaskSharedData.create(payload).then(function(saved){toast('Taak aangemaakt');var key=idOf(saved);if(key){state.mode='detail';state.taskId=String(key);state.draft=null;render();}else close();}).catch(function(error){btn.disabled=false;toast((error&&error.message)||'Taak kon niet worden opgeslagen');});
      return;
    }
    patch(idOf(row),payload,function(saved){toast('Wijzigingen opgeslagen');state.mode='detail';state.draft=null;state.iconPicker=null;state.taskId=String(idOf(saved)||idOf(row));render();});
  }

  function openCreate(){state.mode='create';state.taskId=null;state.draft=newDraft();state.helpPicker=false;state.iconPicker=null;lock();renderEditor(null,true);}

  var legacy=window.TaskDetailPopup;
  var api={version:VERSION,open:open,close:close,openCreate:openCreate,isOpen:function(){return !!state.mode;},legacy:legacy};
  window.TaskDetailV3=api;
  window.TaskDetailPopup=api;

  window.addEventListener('familyapp:tasks-updated',function(){if(state.mode==='detail'&&state.taskId&&document.getElementById('tasks-v3-detail'))render();});
})();
