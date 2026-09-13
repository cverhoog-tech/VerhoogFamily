'use strict';
// ============================================================
// CLEANING V2.5 — HOUSEHOLD ASSIGNMENT EXPERIENCE
// Presentation + orchestration over the existing Cleaning repository.
// No raw Firebase listener, no second popup owner and no MutationObserver.
// ============================================================
(function(){
  if(window.CleaningAssignmentExperienceV25)return;
  var VERSION='2.5.0';
  var state={bound:false,selectedWeekUid:'',repoUnsub:null,identityUnsub:null,pendingNewRoutine:null,applyingDefaults:false,lastDefaultSignature:''};

  function text(value){return String(value==null?'':value).trim();}
  function esc(value){return String(value==null?'':value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}
  function defer(fn){if(typeof queueMicrotask==='function')queueMicrotask(fn);else Promise.resolve().then(fn);}
  function repo(){return window.CleaningHouseholdRepository||window.CleaningV2Repository||null;}
  function snap(){var r=repo();try{return r&&typeof r.snapshot==='function'?r.snapshot():null;}catch(error){return null;}}
  function data(){var s=snap();return s&&s.data||{};}
  function members(){try{var bridge=window.HouseholdIdentityFirebaseBridge,rows=bridge&&bridge.getMembers?bridge.getMembers():[];return(Array.isArray(rows)?rows:[]).filter(function(row){return row&&text(row.uid||row.id)&&text(row.status||'active').toLowerCase()==='active';});}catch(error){return[];}}
  function memberUid(row){return text(row&&(row.uid||row.id));}
  function memberName(row){return text(row&&(row.displayName||row.name))||'Gezinslid';}
  function memberByUid(uid){uid=text(uid);return members().find(function(row){return memberUid(row)===uid;})||null;}
  function avatarUrl(row){var raw=text(row&&(row.avatar||row.avatarUrl||row.photoURL||row.photoUrl||row.profilePhoto||row.image));return /^(https?:\/\/|\/|data:image\/)/i.test(raw)?raw:'';}
  function initials(row){var parts=memberName(row).split(/\s+/).filter(Boolean);return((parts[0]||'G').charAt(0)+(parts.length>1?parts[parts.length-1].charAt(0):'')).toUpperCase();}
  function avatar(row){var url=avatarUrl(row);return url?'<img src="'+esc(url)+'" alt="">':'<span>'+esc(initials(row))+'</span>';}
  function avatarBubble(row,klass){return'<span class="'+(klass||'ca25-avatar')+'">'+avatar(row)+'</span>';}
  function toast(message){if(typeof window.showToast==='function')window.showToast(message);}
  function occurrence(id){var row=data().occurrences&&data().occurrences[id];return row?Object.assign({id:id},row):null;}
  function routine(id){var row=data().routines&&data().routines[id];return row?Object.assign({id:id},row):null;}
  function assignedUids(row){var out=(Array.isArray(row&&row.assignmentUids)?row.assignmentUids:[]).map(text).filter(Boolean);if(!out.length){var legacy=text(row&&(row.assignedUid||row.preferredAssigneeUid));if(legacy)out=[legacy];}return out.filter(function(uid,index){return out.indexOf(uid)===index;});}
  function formatDate(value){if(!value)return'Flexibel';try{var date=/^\d{4}-\d{2}-\d{2}$/.test(String(value))?new Date(String(value)+'T12:00:00'):new Date(Number(value)||value);return date.toLocaleDateString('nl-NL',{weekday:'short',day:'numeric',month:'short'});}catch(error){return text(value);}}

  function ensureStyle(){if(document.getElementById('cleaning-assignment-v25-style'))return;var style=document.createElement('style');style.id='cleaning-assignment-v25-style';style.textContent=''
    +'#screen-cleaning .cv2-filter-chips{display:none!important}'
    +'#screen-cleaning .ca25-week-members{display:flex;gap:8px;overflow-x:auto;padding:3px 2px 12px;scrollbar-width:none;-webkit-overflow-scrolling:touch}'
    +'#screen-cleaning .ca25-week-members::-webkit-scrollbar{display:none}'
    +'#screen-cleaning .ca25-member-chip{display:flex;align-items:center;gap:7px;min-height:38px;padding:5px 10px 5px 6px;border:1px solid var(--c-border);border-radius:999px;background:var(--c-bg2);color:var(--c-text);font:inherit;font-size:11.5px;font-weight:800;white-space:nowrap}'
    +'#screen-cleaning .ca25-member-chip.is-active{border-color:#4f9566;background:rgba(62,130,84,.11);box-shadow:0 5px 14px rgba(49,103,66,.10)}'
    +'#screen-cleaning .ca25-avatar{width:28px;height:28px;flex:0 0 28px;border-radius:50%;overflow:hidden;display:grid;place-items:center;background:rgba(124,58,237,.12);color:#6f42b8;font-size:9.5px;font-weight:900}'
    +'#screen-cleaning .ca25-avatar img,#cleaning-v2-sheet .ca25-avatar img{width:100%;height:100%;object-fit:cover}'
    +'#screen-cleaning .ca25-everyone{width:28px;height:28px;border-radius:50%;display:grid;place-items:center;background:rgba(49,114,72,.12);color:#34784d;font-size:15px}'
    +'#screen-cleaning .ca25-card-assignees{display:flex;align-items:center;gap:7px;margin-top:7px;min-width:0}'
    +'#screen-cleaning .ca25-card-stack{display:flex;align-items:center;flex:0 0 auto}'
    +'#screen-cleaning .ca25-card-stack .ca25-avatar{width:25px;height:25px;flex-basis:25px;border:2px solid var(--c-bg2);margin-left:-7px;font-size:8px}'
    +'#screen-cleaning .ca25-card-stack .ca25-avatar:first-child{margin-left:0}'
    +'#screen-cleaning .ca25-card-names{font-size:10.5px;color:var(--c-text2);font-weight:750;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'
    +'#screen-cleaning .ca25-filter-empty{padding:18px 14px;border:1px dashed var(--c-border);border-radius:16px;color:var(--c-text2);font-size:12px;text-align:center;margin-top:4px}'
    +'#cleaning-v2-sheet .ca25-routine-assignment{display:grid;gap:9px;padding:13px;border:1px solid var(--c-border);border-radius:16px;background:var(--c-bg,var(--c-bg2))}'
    +'#cleaning-v2-sheet .ca25-routine-assignment-head small{display:block;color:var(--c-text2);font-size:10px;font-weight:850;letter-spacing:.3px;text-transform:uppercase}'
    +'#cleaning-v2-sheet .ca25-routine-assignment-head strong{display:block;color:var(--c-text);font-size:13px;margin-top:2px}'
    +'#cleaning-v2-sheet .ca25-routine-assignment-head p{margin:3px 0 0;color:var(--c-text2);font-size:10.5px;line-height:1.35}'
    +'#cleaning-v2-sheet .ca25-person-grid{display:grid;grid-template-columns:1fr 1fr;gap:7px}'
    +'#cleaning-v2-sheet .ca25-person-option{display:flex;align-items:center;gap:8px;min-height:48px;border:1px solid var(--c-border);border-radius:12px;padding:6px 8px;background:var(--c-bg2);cursor:pointer}'
    +'#cleaning-v2-sheet .ca25-person-option input{position:absolute;opacity:0;pointer-events:none}'
    +'#cleaning-v2-sheet .ca25-person-option .ca25-avatar{width:32px;height:32px;flex:0 0 32px;border-radius:50%;overflow:hidden;display:grid;place-items:center;background:rgba(124,58,237,.12);color:#6f42b8;font-size:9px;font-weight:900}'
    +'#cleaning-v2-sheet .ca25-person-option b{min-width:0;flex:1;color:var(--c-text);font-size:11.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'
    +'#cleaning-v2-sheet .ca25-person-option i{width:19px;height:19px;border-radius:50%;border:1.5px solid var(--c-border);display:grid;place-items:center;color:transparent;font-style:normal;font-size:11px;font-weight:900}'
    +'#cleaning-v2-sheet .ca25-person-option:has(input:checked){border-color:#4f9566;background:rgba(62,130,84,.09)}'
    +'#cleaning-v2-sheet .ca25-person-option:has(input:checked) i{border-color:#397e50;background:#397e50;color:#fff}'
    +'#cleaning-v2-sheet .ca25-routine-people{display:flex;align-items:center;gap:6px;margin-top:5px}'
    +'#cleaning-v2-sheet .ca25-routine-stack{display:flex;align-items:center}'
    +'#cleaning-v2-sheet .ca25-routine-stack .ca25-avatar{width:23px;height:23px;flex:0 0 23px;border-radius:50%;overflow:hidden;display:grid;place-items:center;background:rgba(124,58,237,.12);color:#6f42b8;font-size:7.5px;font-weight:900;border:2px solid var(--c-bg2);margin-left:-6px}'
    +'#cleaning-v2-sheet .ca25-routine-stack .ca25-avatar:first-child{margin-left:0}'
    +'#cleaning-v2-sheet .ca25-routine-people em{font-style:normal;color:var(--c-text2);font-size:9.5px;font-weight:700}'
    +'[data-theme*="dark"] #screen-cleaning .ca25-member-chip.is-active,[data-theme*="dark"] #cleaning-v2-sheet .ca25-person-option:has(input:checked){border-color:#7cab89;background:rgba(75,135,91,.14)}'
    +'@media(max-width:390px){#cleaning-v2-sheet .ca25-person-grid{grid-template-columns:1fr}}';document.head.appendChild(style);}

  function filterButton(row){var uid=memberUid(row),active=state.selectedWeekUid===uid;return'<button type="button" class="ca25-member-chip '+(active?'is-active':'')+'" data-ca25-member-filter="'+esc(uid)+'">'+avatarBubble(row)+'<span>'+esc(memberName(row))+'</span></button>';}
  function enhanceTurnCard(card,row){if(!card||!row)return;var copy=card.querySelector('.cv2-turn-copy');if(!copy)return;var top=copy.querySelector(':scope > span');var uids=assignedUids(row),people=uids.map(memberByUid).filter(Boolean),names=people.map(memberName);if(top)top.textContent=formatDate(row.scheduledDate||row.earliestDueAt);var existing=copy.querySelector('.ca25-card-assignees');if(existing)existing.remove();var wrap=document.createElement('div');wrap.className='ca25-card-assignees';wrap.innerHTML='<div class="ca25-card-stack">'+people.slice(0,3).map(function(person){return avatarBubble(person);}).join('')+'</div><span class="ca25-card-names">'+esc(names.length?names.join(', '):'Nog niemand toegewezen')+'</span>';copy.appendChild(wrap);}
  function enhanceWeekplan(){var screen=document.getElementById('screen-cleaning'),hero=screen&&screen.querySelector('.cv2-plan-hero');if(!screen||!hero)return;var active=members();if(state.selectedWeekUid&&!active.some(function(row){return memberUid(row)===state.selectedWeekUid;}))state.selectedWeekUid='';var bar=screen.querySelector('.ca25-week-members');if(!bar){bar=document.createElement('div');bar.className='ca25-week-members';hero.insertAdjacentElement('afterend',bar);}bar.innerHTML='<button type="button" class="ca25-member-chip '+(!state.selectedWeekUid?'is-active':'')+'" data-ca25-member-filter=""><span class="ca25-everyone">⌂</span><span>Iedereen</span></button>'+active.map(filterButton).join('');var cards=Array.from(screen.querySelectorAll('.cv2-turn-card[data-cv2-turn]')),visible=0;cards.forEach(function(card){var row=occurrence(card.dataset.cv2Turn);enhanceTurnCard(card,row);var show=!state.selectedWeekUid||(row&&assignedUids(row).indexOf(state.selectedWeekUid)>=0);card.hidden=!show;if(show)visible++;});var list=screen.querySelector('.cv2-turn-list'),empty=screen.querySelector('.ca25-filter-empty');if(state.selectedWeekUid&&cards.length&&!visible){if(!empty&&list){empty=document.createElement('div');empty.className='ca25-filter-empty';empty.textContent='Voor dit gezinslid staat deze week nog geen schoonmaakbeurt gepland.';list.insertAdjacentElement('afterend',empty);}}else if(empty)empty.remove();}

  function routineAssignmentMarkup(row){var selected=assignedUids(row),active=members();return'<section class="ca25-routine-assignment" data-ca25-routine-assignment><div class="ca25-routine-assignment-head"><small>Verdeling</small><strong>Toegewezen personen</strong><p>Selecteer één of meerdere gezinsleden. Geen selectie betekent automatisch verdelen in het weekplan.</p></div><div class="ca25-person-grid">'+active.map(function(person){var uid=memberUid(person),checked=selected.indexOf(uid)>=0?' checked':'';return'<label class="ca25-person-option"><input type="checkbox" name="ca25RoutineAssignee" value="'+esc(uid)+'"'+checked+'>'+avatarBubble(person)+'<b>'+esc(memberName(person))+'</b><i>✓</i></label>';}).join('')+'</div></section>';}
  function enhanceRoutineForm(){var sheet=document.getElementById('cleaning-v2-sheet'),form=sheet&&sheet.querySelector('[data-cv2-routine-form]');if(!form)return;var routineId=text(form.dataset.routineId),row=routineId?routine(routineId):null,existing=form.querySelector('[data-ca25-routine-assignment]');if(existing)existing.remove();var holder=document.createElement('div');holder.innerHTML=routineAssignmentMarkup(row);var section=holder.firstElementChild,save=form.querySelector('button[type="submit"]');if(save)form.insertBefore(section,save);else form.appendChild(section);}
  function enhanceRoutineRows(){var sheet=document.getElementById('cleaning-v2-sheet');if(!sheet)return;Array.from(sheet.querySelectorAll('.cv2-routines [data-cv2-routine-edit]')).forEach(function(button){var id=text(button.dataset.cv2RoutineEdit),row=routine(id),target=button.querySelector('span');if(!row||!target)return;var old=target.querySelector('.ca25-routine-people');if(old)old.remove();var people=assignedUids(row).map(memberByUid).filter(Boolean),wrap=document.createElement('div');wrap.className='ca25-routine-people';wrap.innerHTML=people.length?'<div class="ca25-routine-stack">'+people.slice(0,3).map(function(person){return avatarBubble(person);}).join('')+'</div><em>'+esc(people.map(memberName).join(', '))+'</em>':'<em>Automatisch verdelen</em>';target.appendChild(wrap);});}
  function enhanceAll(){ensureStyle();enhanceWeekplan();enhanceRoutineForm();enhanceRoutineRows();}

  function routineIdsForRoom(roomId){var rows=data().routines||{};return Object.keys(rows).filter(function(id){var row=rows[id];return row&&text(row.roomId)===text(roomId);});}
  function handleRoutineSubmit(form){var r=repo();if(!r||typeof r.setRoutineAssigneesV25!=='function')return;var routineId=text(form.dataset.routineId),roomId=text(form.dataset.roomId),uids=Array.from(form.querySelectorAll('input[name="ca25RoutineAssignee"]:checked')).map(function(input){return text(input.value);}).filter(Boolean);if(routineId){r.setRoutineAssigneesV25(routineId,uids).then(function(){toast(uids.length?'Routineverdeling opgeslagen ✓':'Routine wordt automatisch verdeeld ✓');}).catch(function(error){toast(text(error&&error.message)||'Toewijzing kon niet worden opgeslagen.');});return;}state.pendingNewRoutine={roomId:roomId,title:text(form.querySelector('input[name="title"]')&&form.querySelector('input[name="title"]').value),uids:uids,before:routineIdsForRoom(roomId)};}
  function resolvePendingNewRoutine(){var pending=state.pendingNewRoutine,r=repo();if(!pending||!r||typeof r.setRoutineAssigneesV25!=='function')return;var rows=data().routines||{},found=Object.keys(rows).find(function(id){var row=rows[id];return row&&text(row.roomId)===pending.roomId&&pending.before.indexOf(id)<0&&(!pending.title||text(row.title)===pending.title);});if(!found)return;state.pendingNewRoutine=null;r.setRoutineAssigneesV25(found,pending.uids).then(function(){if(pending.uids.length)toast('Routine en toewijzing opgeslagen ✓');}).catch(function(error){toast(text(error&&error.message)||'Toewijzing kon niet worden opgeslagen.');});}

  function planSignature(){var plans=data().plans||{},active=Object.keys(plans).map(function(id){return Object.assign({id:id},plans[id]||{});}).filter(function(row){return text(row.status).toUpperCase()==='ACTIVE';}).sort(function(a,b){return Number(b.activatedAt||b.updatedAt||0)-Number(a.activatedAt||a.updatedAt||0);})[0];if(!active)return'';return active.id+':'+String(active.updatedAt||active.activatedAt||'');}
  function applyDefaultsOnce(){var r=repo();if(state.applyingDefaults||!r||typeof r.applyRoutineDefaultsV25!=='function')return;var sig=planSignature();if(!sig||sig===state.lastDefaultSignature)return;state.lastDefaultSignature=sig;state.applyingDefaults=true;Promise.resolve(r.applyRoutineDefaultsV25()).catch(function(error){console.warn('[CleaningAssignmentV25] defaults',error);}).finally(function(){state.applyingDefaults=false;});}

  function onScreenClick(event){var filter=event.target&&event.target.closest?event.target.closest('[data-ca25-member-filter]'):null;if(filter){event.preventDefault();event.stopImmediatePropagation();state.selectedWeekUid=text(filter.dataset.ca25MemberFilter);enhanceWeekplan();return;}defer(enhanceAll);}
  function onSheetClick(){defer(enhanceAll);}
  function onSheetSubmit(event){var form=event.target&&event.target.closest?event.target.closest('[data-cv2-routine-form]'):null;if(form)handleRoutineSubmit(form);defer(enhanceAll);}
  function onRepo(){resolvePendingNewRoutine();defer(function(){enhanceAll();applyDefaultsOnce();});}

  function bind(){if(state.bound)return true;var screen=document.getElementById('screen-cleaning'),sheet=document.getElementById('cleaning-v2-sheet'),r=repo();if(!screen||!sheet||!r)return false;state.bound=true;ensureStyle();screen.addEventListener('click',onScreenClick,true);sheet.addEventListener('click',onSheetClick);sheet.addEventListener('submit',onSheetSubmit);if(typeof r.subscribe==='function')state.repoUnsub=r.subscribe(onRepo);try{var bridge=window.HouseholdIdentityFirebaseBridge;if(bridge&&typeof bridge.subscribe==='function')state.identityUnsub=bridge.subscribe(function(){defer(enhanceAll);});}catch(error){}defer(enhanceAll);return true;}
  function boot(){if(bind())return;if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else defer(bind);}

  window.CleaningAssignmentExperienceV25=Object.freeze({version:VERSION,bind:bind,enhance:enhanceAll,status:function(){return{bound:state.bound,selectedWeekUid:state.selectedWeekUid};}});
  boot();
})();

export const CLEANING_ASSIGNMENT_EXPERIENCE_V25_VERSION='2.5.0';
