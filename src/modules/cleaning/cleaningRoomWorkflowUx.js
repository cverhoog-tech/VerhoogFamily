'use strict';
// ============================================================
// CLEANING ROOM WORKFLOW UX v0.2.0
// Presentation-only simplification around the canonical Cleaning screen.
// - room type comes first; standard room names are optional
// - an omitted standard name resolves to the room type label
// - duplicate unnamed standard rooms get a readable numeric suffix
// - routine actions collapse behind one compact overflow menu
// Existing edit/assign/pause/remove handlers stay canonical and are invoked
// through hidden proxy controls instead of being reimplemented here.
// ============================================================
(function(){
  if(window.CleaningRoomWorkflowUx)return;

  var VERSION='0.2.0';
  var LABELS={
    'living-room':'Woonkamer',kitchen:'Keuken',bathroom:'Badkamer',toilet:'Toilet',bedroom:'Slaapkamer',
    'kids-room':'Kinderkamer',hall:'Hal',laundry:'Wasruimte',outdoor:'Balkon / tuin',custom:'Eigen ruimte'
  };
  var state={observer:null,queued:false,openMenu:null,lastCreateForm:null};

  function text(value){return String(value==null?'':value).trim();}
  function canonical(value){return text(value).toLocaleLowerCase('nl-NL').replace(/\s+/g,' ');}
  function repositoryRoot(){try{var repo=window.CleaningHouseholdRepository,snap=repo&&repo.snapshot?repo.snapshot():null;return snap&&snap.data||{};}catch(error){return{};}}
  function activeRooms(){var raw=repositoryRoot().rooms||{};return Object.keys(raw).map(function(id){return Object.assign({id:id},raw[id]||{});}).filter(function(row){return row&&row.active!==false;});}
  function roomLabel(type){return LABELS[text(type)]||LABELS.custom;}
  function defaultRoomName(type,rooms){
    type=text(type)||'custom';if(type==='custom')return'';var base=roomLabel(type),taken={};(Array.isArray(rooms)?rooms:[]).forEach(function(row){if(row&&row.active!==false)taken[canonical(row.name)]=true;});if(!taken[canonical(base)])return base;var index=2;while(taken[canonical(base+' '+index)])index++;return base+' '+index;
  }

  function ensureStyle(){
    if(document.getElementById('cleaning-room-workflow-ux-style'))return;var style=document.createElement('style');style.id='cleaning-room-workflow-ux-style';style.textContent='\n'
      +'#screen-cleaning .cleaning-room-name-help{display:block;margin-top:5px;color:var(--cleaning-muted);font-size:9px;font-weight:750;line-height:1.4}\n'
      +'#screen-cleaning .cleaning-routine-item-actions{position:relative;display:flex;align-items:center;gap:7px}\n'
      +'#screen-cleaning .cleaning-routine-item-actions>.cleaning-routine-edit-button,#screen-cleaning .cleaning-routine-item-actions>.cleaning-routine-assign-button,#screen-cleaning .cleaning-routine-item-actions>.cleaning-routine-remove-button,#screen-cleaning .cleaning-routine-item-actions>.cleaning-routine-pause-button{display:none!important}\n'
      +'#screen-cleaning .cleaning-routine-more{width:38px;height:38px;display:grid;place-items:center;border:1px solid var(--cleaning-border);border-radius:11px;background:var(--cleaning-surface);color:var(--cleaning-text);font:inherit;font-size:18px;font-weight:950;line-height:1;cursor:pointer;touch-action:manipulation}\n'
      +'#screen-cleaning .cleaning-routine-more[aria-expanded="true"]{background:color-mix(in srgb,var(--cleaning-accent) 10%,var(--cleaning-surface));border-color:color-mix(in srgb,var(--cleaning-accent) 35%,var(--cleaning-border));color:var(--cleaning-accent)}\n'
      +'#screen-cleaning .cleaning-routine-more-menu{position:absolute;right:0;top:44px;z-index:25;min-width:184px;padding:6px;border:1px solid var(--cleaning-border);border-radius:14px;background:var(--cleaning-surface-strong,var(--cleaning-surface));box-shadow:0 14px 34px rgba(24,20,42,.16);display:grid;gap:3px}\n'
      +'#screen-cleaning .cleaning-routine-menu-action{min-height:42px;width:100%;border:0;border-radius:10px;padding:0 11px;background:transparent;color:var(--cleaning-text);font:inherit;font-size:11px;font-weight:850;text-align:left;cursor:pointer}\n'
      +'#screen-cleaning .cleaning-routine-menu-action:active{background:color-mix(in srgb,var(--cleaning-accent) 9%,var(--cleaning-surface))}\n'
      +'#screen-cleaning .cleaning-routine-menu-action.is-pause{color:var(--cleaning-accent)}\n'
      +'#screen-cleaning .cleaning-routine-menu-action.is-danger{color:#b32636}#screen-cleaning .cleaning-routine-menu-action.is-confirm{background:#b32636;color:#fff}\n'
      +'[data-theme*="dark"] #screen-cleaning .cleaning-routine-menu-action.is-danger:not(.is-confirm){color:#ff9ba6}\n';document.head.appendChild(style);
  }

  function decorateRoomForm(){
    var form=document.querySelector('#screen-cleaning [data-cleaning-room-form]');if(!form)return;var select=form.querySelector('[data-cleaning-room-type]'),name=form.querySelector('[data-cleaning-room-name]');if(!select||!name)return;var typeField=select.closest('.cleaning-field'),nameField=name.closest('.cleaning-field');
    if(typeField&&nameField&&typeField.parentNode===form&&nameField.parentNode===form&&typeField.nextElementSibling!==nameField)form.insertBefore(typeField,nameField);
    var type=text(select.value)||'custom',label=nameField&&nameField.querySelector('span'),help=nameField&&nameField.querySelector('[data-cleaning-room-name-help]');
    if(label)label.textContent=type==='custom'?'Naam':'Naam (optioneel)';name.placeholder=type==='custom'?'Bijv. Kantoor of Hobbykamer':'Optioneel · bijv. '+roomLabel(type)+' boven';
    if(nameField&&!help){help=document.createElement('small');help.className='cleaning-room-name-help';help.setAttribute('data-cleaning-room-name-help','1');nameField.appendChild(help);}
    if(help)help.textContent=type==='custom'?'Bij een Eigen ruimte is een naam nodig.':'Laat leeg en we gebruiken automatisch “'+roomLabel(type)+'”.';
    var editing=!!form.querySelector('[data-cleaning-room-delete-open],[data-cleaning-room-delete-confirm]');
    if(!editing&&state.lastCreateForm!==form){state.lastCreateForm=form;window.setTimeout(function(){try{if(document.activeElement===name||!document.activeElement||document.activeElement===document.body)select.focus();}catch(error){}},0);}
  }

  function originalAction(item,action){
    if(!item)return null;
    if(action==='edit')return item.querySelector('.cleaning-routine-item-actions>[data-cleaning-routine-edit]');
    if(action==='assign')return item.querySelector('.cleaning-routine-item-actions>[data-cleaning-routine-assign]');
    if(action==='pause')return item.querySelector('.cleaning-routine-item-actions>[data-cleaning-routine-pause]');
    if(action==='remove')return item.querySelector('.cleaning-routine-item-actions>[data-cleaning-routine-remove]');
    return null;
  }
  function menuMarkup(item,routineId){
    var assign=originalAction(item,'assign'),pause=originalAction(item,'pause'),remove=originalAction(item,'remove'),confirming=!!(remove&&remove.classList&&remove.classList.contains('is-confirm')),busy=!!(remove&&remove.disabled),parts=[];
    parts.push('<button type="button" class="cleaning-routine-menu-action" data-cleaning-routine-menu-action="edit" data-cleaning-routine-menu-id="'+routineId+'">Bewerken</button>');
    if(assign)parts.push('<button type="button" class="cleaning-routine-menu-action" data-cleaning-routine-menu-action="assign" data-cleaning-routine-menu-id="'+routineId+'">Toewijzen</button>');
    if(pause)parts.push('<button type="button" class="cleaning-routine-menu-action is-pause" data-cleaning-routine-menu-action="pause" data-cleaning-routine-menu-id="'+routineId+'">'+(text(pause.textContent)||'Pauzeren')+'</button>');
    if(remove)parts.push('<button type="button" class="cleaning-routine-menu-action is-danger'+(confirming?' is-confirm':'')+'" data-cleaning-routine-menu-action="remove" data-cleaning-routine-menu-id="'+routineId+'"'+(busy?' disabled':'')+'>'+(busy?'Verwijderen…':confirming?'Tik nogmaals om te verwijderen':'Verwijderen')+'</button>');
    return parts.join('');
  }
  function decorateRoutineActions(){
    var edits=document.querySelectorAll('#screen-cleaning .cleaning-routine-item [data-cleaning-routine-edit]');for(var i=0;i<edits.length;i++){var edit=edits[i],routineId=text(edit.getAttribute('data-cleaning-routine-edit')),item=edit.closest('.cleaning-routine-item'),actions=item&&item.querySelector('.cleaning-routine-item-actions');if(!routineId||!actions)continue;var more=actions.querySelector('[data-cleaning-routine-more="'+routineId+'"]');if(!more){more=document.createElement('button');more.type='button';more.className='cleaning-routine-more';more.setAttribute('data-cleaning-routine-more',routineId);more.setAttribute('aria-label','Routine-acties');actions.appendChild(more);}var open=state.openMenu===routineId;more.textContent='•••';more.setAttribute('aria-expanded',open?'true':'false');var menu=actions.querySelector('[data-cleaning-routine-more-menu="'+routineId+'"]');if(!open){if(menu)menu.remove();continue;}var markup=menuMarkup(item,routineId),signature=markup;if(!menu){menu=document.createElement('div');menu.className='cleaning-routine-more-menu';menu.setAttribute('data-cleaning-routine-more-menu',routineId);menu.setAttribute('role','menu');actions.appendChild(menu);}if(menu.getAttribute('data-signature')!==signature){menu.setAttribute('data-signature',signature);menu.innerHTML=markup;}}
  }

  function decorate(){state.queued=false;ensureStyle();decorateRoomForm();decorateRoutineActions();}
  function queue(){if(state.queued)return;state.queued=true;(window.requestAnimationFrame||function(callback){return window.setTimeout(callback,0);})(decorate);}
  function prepareOptionalName(form){
    if(!form||!form.matches||!form.matches('[data-cleaning-room-form]'))return;var select=form.querySelector('[data-cleaning-room-type]'),name=form.querySelector('[data-cleaning-room-name]');if(!select||!name||text(name.value))return;var type=text(select.value)||'custom';if(type==='custom')return;var generated=defaultRoomName(type,activeRooms());name.value=generated;try{name.dispatchEvent(new Event('input',{bubbles:true}));}catch(error){var event=document.createEvent&&document.createEvent('Event');if(event){event.initEvent('input',true,true);name.dispatchEvent(event);}}
  }

  function onSubmit(event){var form=event.target;if(form&&form.matches&&form.matches('[data-cleaning-room-form]'))prepareOptionalName(form);}
  function onChange(event){var target=event.target;if(target&&target.matches&&target.matches('[data-cleaning-room-type]'))window.setTimeout(queue,0);}
  function onClick(event){
    var target=event.target,closest=target&&target.closest?target.closest.bind(target):null;if(!closest)return;var more=closest('[data-cleaning-routine-more]');if(more){event.preventDefault();event.stopPropagation();var id=text(more.getAttribute('data-cleaning-routine-more'));state.openMenu=state.openMenu===id?null:id;queue();return;}
    var proxy=closest('[data-cleaning-routine-menu-action][data-cleaning-routine-menu-id]');if(proxy){event.preventDefault();event.stopPropagation();var action=text(proxy.getAttribute('data-cleaning-routine-menu-action')),id=text(proxy.getAttribute('data-cleaning-routine-menu-id')),item=proxy.closest('.cleaning-routine-item'),original=originalAction(item,action);if(original&&!original.disabled){if(action!=='remove')state.openMenu=null;original.click();if(action==='remove'){state.openMenu=id;window.setTimeout(queue,0);}else queue();}return;}
    if(state.openMenu&&!closest('[data-cleaning-routine-more-menu]')){state.openMenu=null;queue();}
  }

  function start(){
    if(window.__cleaningRoomWorkflowUxStarted)return;window.__cleaningRoomWorkflowUxStarted=true;ensureStyle();document.addEventListener('submit',onSubmit,true);document.addEventListener('change',onChange,true);document.addEventListener('click',onClick,true);var target=document.getElementById('screen-cleaning')||document.documentElement;if(typeof MutationObserver!=='undefined'&&target){state.observer=new MutationObserver(queue);state.observer.observe(target,{childList:true,subtree:true});}window.addEventListener('familyapp:cleaning-repository',queue);queue();
  }

  window.CleaningRoomWorkflowUx={version:VERSION,start:start,_roomLabel:roomLabel,_defaultRoomName:defaultRoomName};start();
})();