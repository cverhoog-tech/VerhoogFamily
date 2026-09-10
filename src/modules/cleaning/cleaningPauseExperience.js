'use strict';
// ============================================================
// CLEANING PAUSE EXPERIENCE v0.2.0
// Temporary routine/room pauses with real pause semantics.
// - current Cleaning work disappears while paused
// - finite pauses freeze the routine countdown instead of resetting cadence
// - resume restores nextDueAt from the frozen countdown, then intervalDays
//   continues normally (pause != stop)
// - accepted non-rolling assignment continuity survives plan sanitizing
// - room pause takes precedence over a routine pause without destroying it
// ============================================================
(function(){
  if(window.CleaningPauseExperience)return;

  var VERSION='0.2.0';
  var DAY_MS=86400000;
  var state={observer:null,queued:false,sheet:null,busy:false,auto:{},repository:null};

  function clone(value){if(value===undefined)return undefined;try{return JSON.parse(JSON.stringify(value));}catch(error){return value;}}
  function text(value){return String(value==null?'':value).trim();}
  function esc(value){return String(value==null?'':value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}
  function now(){return Date.now();}
  function startOfDay(value){var d=new Date(Number(value)||now());d.setHours(0,0,0,0);return d.getTime();}
  function repo(){return window.CleaningHouseholdRepository||null;}
  function snapshot(){try{var r=repo();return r&&r.snapshot?r.snapshot():null;}catch(error){return null;}}
  function root(){var snap=state.repository||snapshot();return snap&&snap.data||{};}
  function context(){try{return window.HouseholdContext&&window.HouseholdContext.snapshot?window.HouseholdContext.snapshot():null;}catch(error){return null;}}
  function capture(){try{return window.HouseholdContext&&window.HouseholdContext.capture?window.HouseholdContext.capture():null;}catch(error){return null;}}
  function current(token){try{return !!(window.HouseholdContext&&window.HouseholdContext.isCurrent&&window.HouseholdContext.isCurrent(token));}catch(error){return false;}}
  function database(){try{return window.fbDb||(window.firebase&&window.firebase.database&&window.firebase.database())||null;}catch(error){return null;}}
  function cleaningPath(householdId){var domain=window.CleaningDomain;return householdId&&domain&&domain.basePath?domain.basePath(householdId):null;}
  function toast(message){if(typeof window.showToast==='function')window.showToast(message);}
  function writeContext(){var ctx=context(),db=database(),token=capture(),path=ctx&&cleaningPath(ctx.householdId);if(!ctx||ctx.ready!==true||!ctx.uid||!ctx.householdId)throw new Error('ACTIVE_HOUSEHOLD_REQUIRED');if(!db)throw new Error('FIREBASE_DATABASE_UNAVAILABLE');if(!token||!current(token))throw new Error('HOUSEHOLD_CONTEXT_CHANGED');if(!path)throw new Error('ACTIVE_HOUSEHOLD_REQUIRED');return{ctx:ctx,db:db,token:token,path:path};}
  function activeRoutine(row){return !!(row&&typeof row==='object'&&row.active!==false);}
  function routineById(id){var row=root().routines&&root().routines[id];return activeRoutine(row)?Object.assign({id:id},row):null;}
  function roomById(id){var row=root().rooms&&root().rooms[id];return row&&typeof row==='object'&&row.active!==false?Object.assign({id:id},row):null;}
  function routinesForRoom(roomId){var rows=root().routines||{};return Object.keys(rows).map(function(id){return Object.assign({id:id},rows[id]||{});}).filter(function(row){return activeRoutine(row)&&text(row.roomId)===text(roomId);});}
  function roomIsPaused(roomId){var row=root().rooms&&root().rooms[roomId];return !!(row&&row.active!==false&&row.paused===true);}
  function pauseUntil(days){return days?startOfDay(now()+Number(days)*DAY_MS):null;}

  function occurrenceRoutineIds(row){var out=[];(Array.isArray(row&&row.checklist)?row.checklist:[]).forEach(function(item){var id=text(item&&(item.routineItemId||item.id));if(id&&out.indexOf(id)<0)out.push(id);});(Array.isArray(row&&row.routineItemIds)?row.routineItemIds:[]).forEach(function(value){var id=text(value);if(id&&out.indexOf(id)<0)out.push(id);});return out;}
  function assignedUid(row){var ids=Array.isArray(row&&row.assignmentUids)?row.assignmentUids.filter(Boolean).map(String):[];return ids.length===1?ids[0]:null;}
  function occurrenceAnchor(row){return Number(row&&(row.slotAt||(row.flexibleWindow&&row.flexibleWindow.startAt)||row.scheduledStartAt||row.earliestDueAt||row.cancelledAt))||0;}

  // Preserve only assignment consent that came from a concrete ACTIVE,
  // non-rolling plan. A rolling plan never becomes its own consent source.
  function acceptedContinuity(routineId){
    var data=root(),plans=data.plans||{},occurrences=data.occurrences||{},best=null;
    function offer(row,plan){
      if(!row||!plan||plan.status!=='ACTIVE'||plan.rollingPlanVersion===1||occurrenceRoutineIds(row).indexOf(text(routineId))<0)return;
      var uid=assignedUid(row);if(!uid)return;
      var status=text(row.status).toUpperCase(),assignment=text(row.assignmentStatus).toUpperCase();
      var wasAccepted=['ACTIVE','ACCEPTED','COMPLETED'].indexOf(assignment)>=0||((status==='CANCELLED'||status==='SKIPPED')&&text(row.cancellationReason).indexOf('ROUTINE')===0);
      if(!wasAccepted)return;
      var anchor=occurrenceAnchor(row)||Number(row.updatedAt)||0;if(!best||anchor>=best.anchor)best={uid:uid,anchor:anchor,planId:text(plan.id||row.planId)};
    }
    Object.keys(plans).forEach(function(planId){var plan=plans[planId];if(!plan||plan.status!=='ACTIVE'||plan.rollingPlanVersion===1)return;(Array.isArray(plan.occurrenceIds)?plan.occurrenceIds:[]).forEach(function(id){offer(occurrences[id],plan);});});
    // Sanitizing a pause removes the occurrence id from the live plan but keeps
    // the historical occurrence. Use it only when it still points to an ACTIVE
    // non-rolling plan and was cancelled because its routine became unavailable.
    Object.keys(occurrences).forEach(function(id){var row=occurrences[id],plan=plans[text(row&&row.planId)];if(!row||text(row.status).toUpperCase()!=='CANCELLED'||text(row.cancellationReason).indexOf('ROUTINE')!==0)return;offer(row,plan);});
    return best;
  }

  function frozenNextDue(row,stamp){return Number(row&&row.nextDueAt)||startOfDay(stamp);}
  function nextDueOnResume(row,resumeAt){
    var resumeDay=startOfDay(resumeAt),pauseDay=startOfDay(row&&(row.pauseCadenceStartedAt||row.pausedAt)||resumeAt);
    var anchor=Number(row&&(row.pauseCadenceNextDueAt||row.nextDueAt))||pauseDay;
    var remaining=Math.max(0,anchor-pauseDay);
    return resumeDay+remaining;
  }
  function continuityPatch(row,routineId,stamp){
    var found=acceptedContinuity(routineId),uid=text(found&&found.uid)||text(row&&row.continuityAssigneeUid);if(!uid)return{};
    return{continuityAssigneeUid:uid,continuityAssignmentSource:'ACCEPTED_PLAN_BEFORE_PAUSE',continuityAnchorAt:Number(found&&found.anchor)||Number(row&&row.continuityAnchorAt)||stamp,continuityPlanId:text(found&&found.planId)||text(row&&row.continuityPlanId)||null};
  }
  function pausePatch(row,routineId,source,until,stamp,uid){
    return Object.assign({paused:true,pauseSource:source,pausedAt:stamp,pausedByUid:uid,pauseUntilAt:until,pauseCadenceStartedAt:startOfDay(stamp),pauseCadenceNextDueAt:frozenNextDue(row,stamp),updatedAt:stamp,updatedByUid:uid},continuityPatch(row,routineId,stamp));
  }
  function resumePatch(row,stamp,uid,automatic){
    return{paused:false,pauseSource:null,pauseUntilAt:null,resumedAt:stamp,resumedByUid:uid,resumeMode:automatic?'AUTO':'MANUAL',nextDueAt:nextDueOnResume(row,stamp),lastPauseCadenceStartedAt:Number(row&&row.pauseCadenceStartedAt)||Number(row&&row.pausedAt)||null,lastPauseCadenceNextDueAt:Number(row&&row.pauseCadenceNextDueAt)||Number(row&&row.nextDueAt)||null,pauseCadenceStartedAt:null,pauseCadenceNextDueAt:null,updatedAt:stamp,updatedByUid:uid};
  }

  function pauseRoutine(id,days){
    var write;try{write=writeContext();}catch(error){return Promise.reject(error);}var row=routineById(id);if(!row)return Promise.reject(new Error('CLEANING_ROUTINE_NOT_FOUND'));
    var stamp=now(),until=pauseUntil(days),patch=pausePatch(row,id,'ROUTINE',until,stamp,write.ctx.uid);
    return write.db.ref(write.path+'/routines/'+id).update(patch).then(function(){if(!current(write.token))throw new Error('HOUSEHOLD_CONTEXT_CHANGED_AFTER_WRITE');return Object.assign({},row,patch);});
  }
  function resumeRoutine(id,automatic){
    var write;try{write=writeContext();}catch(error){return Promise.reject(error);}var row=routineById(id);if(!row)return Promise.reject(new Error('CLEANING_ROUTINE_NOT_FOUND'));
    var stamp=now(),patch=Object.assign({},resumePatch(row,stamp,write.ctx.uid,automatic),continuityPatch(row,id,stamp));
    return write.db.ref(write.path+'/routines/'+id).update(patch).then(function(){if(!current(write.token))throw new Error('HOUSEHOLD_CONTEXT_CHANGED_AFTER_WRITE');return Object.assign({},row,patch);});
  }
  function pauseRoom(id,days){
    var write;try{write=writeContext();}catch(error){return Promise.reject(error);}var room=roomById(id);if(!room)return Promise.reject(new Error('CLEANING_ROOM_NOT_FOUND'));
    var stamp=now(),until=pauseUntil(days),patch={};patch['rooms/'+id+'/paused']=true;patch['rooms/'+id+'/pauseUntilAt']=until;patch['rooms/'+id+'/pausedAt']=stamp;patch['rooms/'+id+'/pausedByUid']=write.ctx.uid;patch['rooms/'+id+'/updatedAt']=stamp;patch['rooms/'+id+'/updatedByUid']=write.ctx.uid;
    routinesForRoom(id).forEach(function(routine){if(routine.paused===true)return;var base='routines/'+routine.id+'/',values=pausePatch(routine,routine.id,'ROOM',until,stamp,write.ctx.uid);Object.keys(values).forEach(function(key){patch[base+key]=values[key];});});
    return write.db.ref(write.path).update(patch).then(function(){if(!current(write.token))throw new Error('HOUSEHOLD_CONTEXT_CHANGED_AFTER_WRITE');return{roomId:id,pauseUntilAt:until};});
  }
  function resumeRoom(id,automatic){
    var write;try{write=writeContext();}catch(error){return Promise.reject(error);}var room=roomById(id);if(!room)return Promise.reject(new Error('CLEANING_ROOM_NOT_FOUND'));
    var stamp=now(),patch={};patch['rooms/'+id+'/paused']=false;patch['rooms/'+id+'/pauseUntilAt']=null;patch['rooms/'+id+'/resumedAt']=stamp;patch['rooms/'+id+'/resumedByUid']=write.ctx.uid;patch['rooms/'+id+'/updatedAt']=stamp;patch['rooms/'+id+'/updatedByUid']=write.ctx.uid;
    routinesForRoom(id).forEach(function(routine){if(routine.paused!==true||text(routine.pauseSource)!=='ROOM')return;var base='routines/'+routine.id+'/',values=Object.assign({},resumePatch(routine,stamp,write.ctx.uid,automatic),continuityPatch(routine,routine.id,stamp));Object.keys(values).forEach(function(key){patch[base+key]=values[key];});});
    return write.db.ref(write.path).update(patch).then(function(){if(!current(write.token))throw new Error('HOUSEHOLD_CONTEXT_CHANGED_AFTER_WRITE');return{roomId:id,resumed:true};});
  }

  function ensureStyle(){if(document.getElementById('cleaning-pause-experience-style'))return;var style=document.createElement('style');style.id='cleaning-pause-experience-style';style.textContent='\n'
    +'#screen-cleaning .cleaning-room-pause-button{min-height:34px;border:1px solid var(--cleaning-border);border-radius:10px;padding:0 10px;background:var(--cleaning-surface);color:var(--cleaning-text);font:inherit;font-size:10px;font-weight:900;cursor:pointer}#screen-cleaning .cleaning-room-pause-button.is-paused{color:var(--cleaning-accent);background:color-mix(in srgb,var(--cleaning-accent) 9%,var(--cleaning-surface))}#screen-cleaning .cleaning-routine-paused-badge{display:inline-flex;margin-top:4px;padding:3px 7px;border-radius:999px;background:color-mix(in srgb,var(--cleaning-accent) 10%,var(--cleaning-surface));color:var(--cleaning-accent);font-size:8.5px;font-weight:900}\n'
    +'.cleaning-pause-overlay{position:fixed;inset:0;z-index:12520;display:grid;align-items:end;background:rgba(8,10,16,.45);padding-top:max(24px,env(safe-area-inset-top))}.cleaning-pause-sheet{width:100%;border-radius:28px 28px 0 0;background:var(--c-surface,#fff);color:var(--c-text,#1e232b);padding:12px 16px calc(22px + env(safe-area-inset-bottom));box-shadow:0 -20px 60px rgba(0,0,0,.18)}.cleaning-pause-handle{width:38px;height:4px;border-radius:999px;background:var(--c-border,#ddd);margin:0 auto 15px}.cleaning-pause-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}.cleaning-pause-head p{margin:0 0 4px;font-size:10px;font-weight:900;color:var(--c-primary,#6750a4);text-transform:uppercase;letter-spacing:.08em}.cleaning-pause-head h2{margin:0;font-size:21px}.cleaning-pause-close{width:44px;height:44px;border-radius:13px;border:1px solid var(--c-border,#ddd);background:var(--c-surface,#fff);color:inherit;font:inherit;font-size:18px}.cleaning-pause-copy{font-size:11px;line-height:1.5;color:var(--c-text2,#737784);margin:12px 0}.cleaning-pause-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}.cleaning-pause-choice{min-height:48px;border:1px solid var(--c-border,#ddd);border-radius:13px;background:var(--c-surface2,#f7f7f8);color:inherit;font:inherit;font-size:11px;font-weight:900}.cleaning-pause-resume{width:100%;min-height:48px;border:0;border-radius:13px;background:var(--c-primary,#6750a4);color:#fff;font:inherit;font-size:11px;font-weight:900}.cleaning-pause-choice:disabled,.cleaning-pause-resume:disabled{opacity:.5}\n';document.head.appendChild(style);}

  function formatUntil(value){if(!Number(value))return'Tot je zelf hervat';try{return'Pauze tot '+new Date(Number(value)).toLocaleDateString('nl-NL',{day:'numeric',month:'short'});}catch(error){return'Gepauzeerd';}}
  function decorateRoutines(){var edits=document.querySelectorAll('#screen-cleaning [data-cleaning-routine-edit]');for(var i=0;i<edits.length;i++){var edit=edits[i],id=text(edit.getAttribute('data-cleaning-routine-edit')),item=edit.closest('.cleaning-routine-item'),actions=item&&item.querySelector('.cleaning-routine-item-actions'),routine=routineById(id);if(!id||!item||!actions||!routine)continue;var button=actions.querySelector('[data-cleaning-routine-pause="'+id+'"]');if(!button){button=document.createElement('button');button.type='button';button.className='cleaning-routine-pause-button';button.style.display='none';button.setAttribute('data-cleaning-routine-pause',id);actions.appendChild(button);}button.textContent=routine.paused===true?'Hervatten':'Pauzeren';var copy=item.querySelector('.cleaning-routine-copy'),badge=copy&&copy.querySelector('[data-cleaning-routine-paused-badge]');if(routine.paused===true){if(!badge){badge=document.createElement('span');badge.className='cleaning-routine-paused-badge';badge.setAttribute('data-cleaning-routine-paused-badge','1');copy.appendChild(badge);}badge.textContent=formatUntil(routine.pauseUntilAt);}else if(badge)badge.remove();}}
  function decorateRooms(){var cards=document.querySelectorAll('#screen-cleaning .cleaning-room-card[data-cleaning-room-id]');for(var i=0;i<cards.length;i++){var card=cards[i],id=text(card.getAttribute('data-cleaning-room-id')),room=roomById(id),actions=card.querySelector('.cleaning-room-order-actions');if(!id||!room||!actions)continue;var button=actions.querySelector('[data-cleaning-room-pause="'+id+'"]');if(!button){button=document.createElement('button');button.type='button';button.className='cleaning-room-pause-button';button.setAttribute('data-cleaning-room-pause',id);actions.insertBefore(button,actions.firstChild);}button.classList.toggle('is-paused',room.paused===true);button.textContent=room.paused===true?'▶ Hervat':'⏸ Pauzeer';}}
  function decorate(){state.queued=false;ensureStyle();decorateRoutines();decorateRooms();}
  function queue(){if(state.queued)return;state.queued=true;(window.requestAnimationFrame||function(callback){return setTimeout(callback,0);})(decorate);}

  function entity(){if(!state.sheet)return null;return state.sheet.kind==='room'?roomById(state.sheet.id):routineById(state.sheet.id);}
  function sheetHtml(){var row=entity();if(!row)return'';var paused=row.paused===true,title=state.sheet.kind==='room'?(row.name||'Kamer'):(row.title||'Routine');return '<section class="cleaning-pause-sheet"><div class="cleaning-pause-handle"></div><div class="cleaning-pause-head"><div><p>'+(state.sheet.kind==='room'?'Hele kamer':'Routine')+'</p><h2>'+esc(title)+'</h2></div><button type="button" class="cleaning-pause-close" data-cleaning-pause-close aria-label="Sluiten">✕</button></div>'+(paused?'<p class="cleaning-pause-copy">'+esc(formatUntil(row.pauseUntilAt))+'. De routine-intervallen lopen na hervatten verder vanaf waar de pauze begon, zonder gemiste backlog.</p><button type="button" class="cleaning-pause-resume" data-cleaning-pause-resume'+(state.busy?' disabled':'')+'>'+(state.busy?'Hervatten…':'Nu hervatten')+'</button>':'<p class="cleaning-pause-copy">Tijdens de pauze wordt huidig werk weggehaald. Na de pauze loopt ieder interval automatisch verder; de pauze stopt de routine dus niet.</p><div class="cleaning-pause-grid"><button type="button" class="cleaning-pause-choice" data-cleaning-pause-days="7"'+(state.busy?' disabled':'')+'>1 week</button><button type="button" class="cleaning-pause-choice" data-cleaning-pause-days="14"'+(state.busy?' disabled':'')+'>2 weken</button><button type="button" class="cleaning-pause-choice" data-cleaning-pause-days="30"'+(state.busy?' disabled':'')+'>1 maand</button><button type="button" class="cleaning-pause-choice" data-cleaning-pause-days="0"'+(state.busy?' disabled':'')+'>Tot ik hervat</button></div>')+'</section>';}
  function open(kind,id){state.sheet={kind:kind,id:text(id)};renderSheet();}
  function close(){state.sheet=null;var overlay=document.getElementById('cleaning-pause-overlay');if(overlay)overlay.remove();}
  function renderSheet(){if(!state.sheet)return;var row=entity();if(!row){close();return;}var overlay=document.getElementById('cleaning-pause-overlay');if(!overlay){overlay=document.createElement('div');overlay.id='cleaning-pause-overlay';overlay.className='cleaning-pause-overlay';document.body.appendChild(overlay);}overlay.innerHTML=sheetHtml();}
  function runPause(days){if(!state.sheet||state.busy)return;state.busy=true;renderSheet();var work=state.sheet.kind==='room'?pauseRoom(state.sheet.id,days):pauseRoutine(state.sheet.id,days);Promise.resolve(work).then(function(){state.busy=false;toast('Pauze ingesteld ✓');close();queue();}).catch(function(error){state.busy=false;toast((error&&error.message)||'Pauzeren mislukt');renderSheet();});}
  function runResume(){if(!state.sheet||state.busy)return;state.busy=true;renderSheet();var work=state.sheet.kind==='room'?resumeRoom(state.sheet.id,false):resumeRoutine(state.sheet.id,false);Promise.resolve(work).then(function(){state.busy=false;toast('Schoonmaakplanning hervat ✓');close();queue();}).catch(function(error){state.busy=false;toast((error&&error.message)||'Hervatten mislukt');renderSheet();});}

  function onClick(event){var target=event.target,closest=target&&target.closest?target.closest.bind(target):null;if(!closest)return;var routine=closest('[data-cleaning-routine-pause]');if(routine){event.preventDefault();event.stopPropagation();open('routine',routine.getAttribute('data-cleaning-routine-pause'));return;}var room=closest('[data-cleaning-room-pause]');if(room){event.preventDefault();event.stopPropagation();open('room',room.getAttribute('data-cleaning-room-pause'));return;}var overlay=document.getElementById('cleaning-pause-overlay');if(!overlay)return;if(closest('[data-cleaning-pause-close]')||target===overlay){event.preventDefault();close();return;}var choice=closest('[data-cleaning-pause-days]');if(choice&&!choice.disabled){event.preventDefault();runPause(Number(choice.getAttribute('data-cleaning-pause-days'))||0);return;}if(closest('[data-cleaning-pause-resume]')){event.preventDefault();runResume();}}
  function onKey(event){if(event.key==='Escape'&&state.sheet){event.preventDefault();close();}}

  function autoResume(snapshotValue){
    var snap=snapshotValue&&snapshotValue.data?snapshotValue:null;if(!snap||snap.ready!==true)return;var data=snap.data||{},stamp=now(),rooms=data.rooms||{},routines=data.routines||{};
    Object.keys(rooms).forEach(function(id){var row=rooms[id];if(!row||row.active===false||row.paused!==true||!Number(row.pauseUntilAt)||Number(row.pauseUntilAt)>stamp||state.auto['room:'+id])return;state.auto['room:'+id]=true;resumeRoom(id,true).catch(function(){}).finally(function(){delete state.auto['room:'+id];});});
    Object.keys(routines).forEach(function(id){var row=routines[id];if(!activeRoutine(row)||row.paused!==true||text(row.pauseSource)==='ROOM'||roomIsPaused(text(row.roomId))||!Number(row.pauseUntilAt)||Number(row.pauseUntilAt)>stamp||state.auto['routine:'+id])return;state.auto['routine:'+id]=true;resumeRoutine(id,true).catch(function(){}).finally(function(){delete state.auto['routine:'+id];});});
  }
  function onRepository(event){state.repository=event&&event.detail||snapshot();autoResume(state.repository);queue();if(state.sheet)renderSheet();}
  function start(){if(window.__cleaningPauseExperienceStarted)return;window.__cleaningPauseExperienceStarted=true;ensureStyle();state.repository=snapshot();autoResume(state.repository);document.addEventListener('click',onClick,true);document.addEventListener('keydown',onKey,true);var target=document.getElementById('screen-cleaning')||document.documentElement;if(typeof MutationObserver!=='undefined'&&target){state.observer=new MutationObserver(queue);state.observer.observe(target,{childList:true,subtree:true});}window.addEventListener('familyapp:cleaning-repository',onRepository);queue();}

  window.CleaningPauseExperience={version:VERSION,start:start,pauseRoutine:pauseRoutine,resumeRoutine:resumeRoutine,pauseRoom:pauseRoom,resumeRoom:resumeRoom,_nextDueOnResume:nextDueOnResume,_pauseUntil:pauseUntil,_acceptedContinuity:acceptedContinuity,_pausePatch:pausePatch};start();
})();
