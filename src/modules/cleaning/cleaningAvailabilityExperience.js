'use strict';
// ============================================================
// CLEANING AVAILABILITY EXPERIENCE v0.1.0
// Functional temporary exceptions without a second planning truth.
//
// - Personal unavailability is stored in cleaning/availability/{uid}.
// - Accepted fixed routines owned by that user reuse CleaningPauseExperience,
//   so cadence freezes and resumes without a backlog.
// - Household vacation / planning pause reuses room pauses for the same reason.
// - Busy week is advisory planning state; the pure availability contract makes
//   EXTRA routines ineligible for a freshly generated week plan.
// - Existing accepted occurrences are never silently reassigned. Transfer/help
//   remains explicit and consent-based.
// ============================================================
(function(){
  if(window.CleaningAvailabilityExperience)return;

  var VERSION='0.1.0';
  var HOUSEHOLD_KEY='__household__';
  var DAY_MS=86400000;
  var state={observer:null,queued:false,busy:false,sheet:null,repository:null};
  var INVALID_KEY=/[.#$\[\]\/\u0000-\u001F\u007F]/;

  function clone(value){if(value===undefined)return undefined;try{return JSON.parse(JSON.stringify(value));}catch(e){return value;}}
  function text(value){return String(value==null?'':value).trim();}
  function esc(value){return String(value==null?'':value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}
  function now(){return Date.now();}
  function startOfDay(value){var d=new Date(Number(value)||now());d.setHours(0,0,0,0);return d.getTime();}
  function context(){try{return window.HouseholdContext&&window.HouseholdContext.snapshot?window.HouseholdContext.snapshot():null;}catch(e){return null;}}
  function capture(){try{return window.HouseholdContext&&window.HouseholdContext.capture?window.HouseholdContext.capture():null;}catch(e){return null;}}
  function current(token){try{return !!(window.HouseholdContext&&window.HouseholdContext.isCurrent&&window.HouseholdContext.isCurrent(token));}catch(e){return false;}}
  function database(){try{return window.fbDb||(window.firebase&&window.firebase.database&&window.firebase.database())||null;}catch(e){return null;}}
  function repository(){return window.CleaningHouseholdRepository||null;}
  function snapshot(){try{var r=repository();return r&&r.snapshot?r.snapshot():null;}catch(e){return null;}}
  function data(){var snap=state.repository||snapshot();return snap&&snap.data||{};}
  function contract(){return window.CleaningAvailabilityContract||null;}
  function pauseExperience(){return window.CleaningPauseExperience||null;}
  function cleaningPath(householdId){var domain=window.CleaningDomain;return householdId&&domain&&domain.basePath?domain.basePath(householdId):null;}
  function toast(message){if(typeof window.showToast==='function')window.showToast(message);}
  function validKey(value){value=text(value);return value&&!INVALID_KEY.test(value)?value:null;}
  function writeContext(){
    var ctx=context(),db=database(),token=capture(),path=ctx&&cleaningPath(ctx.householdId);
    if(!ctx||ctx.ready!==true||!validKey(ctx.uid)||!ctx.householdId)throw new Error('ACTIVE_HOUSEHOLD_REQUIRED');
    if(!db)throw new Error('FIREBASE_DATABASE_UNAVAILABLE');
    if(!token||!current(token))throw new Error('HOUSEHOLD_CONTEXT_CHANGED');
    if(!path)throw new Error('ACTIVE_HOUSEHOLD_REQUIRED');
    return{ctx:ctx,db:db,token:token,path:path};
  }
  function availabilityRows(){var rows=data().availability;return rows&&typeof rows==='object'?rows:{};}
  function memberRow(uid){var c=contract(),row=availabilityRows()[uid];return c&&c.normalizeMemberRow?c.normalizeMemberRow(row,uid):(row||{});}
  function householdRow(){var c=contract(),row=availabilityRows()[HOUSEHOLD_KEY];return c&&c.normalizeHouseholdRow?c.normalizeHouseholdRow(row):(row||{});}
  function activeUntil(row){var until=Number(row&&row.untilAt)||0;return !until||until>now();}
  function currentMemberUnavailable(){var ctx=context();if(!ctx||!ctx.uid)return false;var row=memberRow(ctx.uid);return row.status==='UNAVAILABLE'&&activeUntil(row);}
  function currentHouseholdMode(){var row=householdRow();return row.mode&&row.mode!=='NORMAL'&&activeUntil(row)?row.mode:'NORMAL';}
  function fixedRoutinesForUid(uid){
    var rows=data().routines||{};
    return Object.keys(rows).map(function(id){return Object.assign({id:id},clone(rows[id]||{}));}).filter(function(row){
      return row.active!==false&&row.paused!==true&&text(row.assignmentMode)==='FIXED_PERSON'&&text(row.assignmentRequestStatus)==='ACCEPTED'&&text(row.preferredAssigneeUid)===text(uid);
    });
  }
  function activeRooms(){var rows=data().rooms||{};return Object.keys(rows).map(function(id){return Object.assign({id:id},clone(rows[id]||{}));}).filter(function(row){return row.active!==false;});}
  function promiseSeries(rows,worker){return rows.reduce(function(chain,row){return chain.then(function(result){return Promise.resolve(worker(row)).then(function(value){result.push(value);return result;});});},Promise.resolve([]));}
  function availabilityRef(write,key){return write.db.ref(write.path+'/availability/'+key);}
  function untilForDays(days){if(!days)return null;return startOfDay(now()+Math.max(1,Number(days))*DAY_MS);}

  function setMemberUnavailable(reason,days){
    if(state.busy)return Promise.resolve(null);
    var write;try{write=writeContext();}catch(error){return Promise.reject(error);}
    var pause=pauseExperience();if(!pause||typeof pause.pauseRoutine!=='function'||typeof pause.resumeRoutine!=='function')return Promise.reject(new Error('CLEANING_PAUSE_RUNTIME_UNAVAILABLE'));
    var uid=write.ctx.uid,started=now(),until=untilForDays(days),routines=fixedRoutinesForUid(uid),paused=[];
    state.busy=true;queue();
    return promiseSeries(routines,function(routine){
      return pause.pauseRoutine(routine.id,days).then(function(result){paused.push(routine.id);return result;});
    }).then(function(){
      if(!current(write.token))throw new Error('HOUSEHOLD_CONTEXT_CHANGED_AFTER_WRITE');
      return availabilityRef(write,uid).set({
        scope:'MEMBER',uid:uid,status:'UNAVAILABLE',reason:text(reason)||'TEMPORARY',fromAt:started,untilAt:until,
        pausedRoutineIds:paused,updatedAt:now(),updatedByUid:uid,schemaVersion:1
      });
    }).then(function(){
      if(!current(write.token))throw new Error('HOUSEHOLD_CONTEXT_CHANGED_AFTER_WRITE');
      window.dispatchEvent(new CustomEvent('familyapp:cleaning-availability',{detail:{scope:'MEMBER',uid:uid,status:'UNAVAILABLE'}}));
      return{uid:uid,status:'UNAVAILABLE',pausedRoutineIds:paused};
    }).catch(function(error){
      // If persistence itself fails after pauses succeeded, unwind only the
      // routines this action just paused. Existing/manual pauses were excluded.
      return promiseSeries(paused,function(id){return pause.resumeRoutine(id,false).catch(function(){});}).then(function(){throw error;});
    }).finally(function(){state.busy=false;queue();});
  }

  function setMemberAvailable(){
    if(state.busy)return Promise.resolve(null);
    var write;try{write=writeContext();}catch(error){return Promise.reject(error);}
    var pause=pauseExperience();if(!pause||typeof pause.resumeRoutine!=='function')return Promise.reject(new Error('CLEANING_PAUSE_RUNTIME_UNAVAILABLE'));
    var row=memberRow(write.ctx.uid),ids=Array.isArray(row.pausedRoutineIds)?row.pausedRoutineIds.slice():[];
    state.busy=true;queue();
    return promiseSeries(ids,function(id){
      var routine=data().routines&&data().routines[id];
      if(!routine||routine.paused!==true||text(routine.pausedByUid)!==text(write.ctx.uid))return null;
      return pause.resumeRoutine(id,false);
    }).then(function(){
      if(!current(write.token))throw new Error('HOUSEHOLD_CONTEXT_CHANGED_AFTER_WRITE');
      return availabilityRef(write,write.ctx.uid).set({scope:'MEMBER',uid:write.ctx.uid,status:'AVAILABLE',reason:null,fromAt:null,untilAt:null,pausedRoutineIds:[],updatedAt:now(),updatedByUid:write.ctx.uid,schemaVersion:1});
    }).then(function(){window.dispatchEvent(new CustomEvent('familyapp:cleaning-availability',{detail:{scope:'MEMBER',uid:write.ctx.uid,status:'AVAILABLE'}}));return{status:'AVAILABLE'};})
      .finally(function(){state.busy=false;queue();});
  }

  function setHouseholdMode(mode,days){
    if(state.busy)return Promise.resolve(null);
    mode=text(mode).toUpperCase();
    var write;try{write=writeContext();}catch(error){return Promise.reject(error);}
    var pause=pauseExperience(),started=now(),until=untilForDays(days),pausedRoomIds=[];
    if(mode==='NORMAL')return clearHouseholdMode();
    if(['BUSY_WEEK','VACATION','PLANNING_PAUSE'].indexOf(mode)<0)return Promise.reject(new Error('CLEANING_AVAILABILITY_MODE_INVALID'));
    if((mode==='VACATION'||mode==='PLANNING_PAUSE')&&(!pause||typeof pause.pauseRoom!=='function'||typeof pause.resumeRoom!=='function'))return Promise.reject(new Error('CLEANING_PAUSE_RUNTIME_UNAVAILABLE'));
    state.busy=true;queue();
    var rooms=(mode==='VACATION'||mode==='PLANNING_PAUSE')?activeRooms().filter(function(room){return room.paused!==true;}):[];
    return promiseSeries(rooms,function(room){
      return pause.pauseRoom(room.id,days).then(function(result){pausedRoomIds.push(room.id);return result;});
    }).then(function(){
      if(!current(write.token))throw new Error('HOUSEHOLD_CONTEXT_CHANGED_AFTER_WRITE');
      return availabilityRef(write,HOUSEHOLD_KEY).set({scope:'HOUSEHOLD',mode:mode,fromAt:started,untilAt:until,pausedRoomIds:pausedRoomIds,updatedAt:now(),updatedByUid:write.ctx.uid,schemaVersion:1});
    }).then(function(){window.dispatchEvent(new CustomEvent('familyapp:cleaning-availability',{detail:{scope:'HOUSEHOLD',mode:mode}}));return{mode:mode,pausedRoomIds:pausedRoomIds};})
      .catch(function(error){
        if(!pause||!pausedRoomIds.length)throw error;
        return promiseSeries(pausedRoomIds,function(id){return pause.resumeRoom(id,false).catch(function(){});}).then(function(){throw error;});
      }).finally(function(){state.busy=false;queue();});
  }

  function clearHouseholdMode(){
    if(state.busy)return Promise.resolve(null);
    var write;try{write=writeContext();}catch(error){return Promise.reject(error);}
    var pause=pauseExperience(),row=householdRow(),ids=Array.isArray(row.pausedRoomIds)?row.pausedRoomIds.slice():[];
    state.busy=true;queue();
    return promiseSeries(ids,function(id){
      var room=data().rooms&&data().rooms[id];
      if(!room||room.paused!==true||!pause||typeof pause.resumeRoom!=='function')return null;
      return pause.resumeRoom(id,false);
    }).then(function(){
      if(!current(write.token))throw new Error('HOUSEHOLD_CONTEXT_CHANGED_AFTER_WRITE');
      return availabilityRef(write,HOUSEHOLD_KEY).set({scope:'HOUSEHOLD',mode:'NORMAL',fromAt:null,untilAt:null,pausedRoomIds:[],updatedAt:now(),updatedByUid:write.ctx.uid,schemaVersion:1});
    }).then(function(){window.dispatchEvent(new CustomEvent('familyapp:cleaning-availability',{detail:{scope:'HOUSEHOLD',mode:'NORMAL'}}));return{mode:'NORMAL'};})
      .finally(function(){state.busy=false;queue();});
  }

  function memberStatusText(){
    if(!currentMemberUnavailable())return'Je bent beschikbaar voor nieuwe weekverdeling.';
    var ctx=context(),row=memberRow(ctx&&ctx.uid),label=row.reason==='SICK'?'Ziek / even rust':(row.reason==='VACATION'?'Op vakantie':'Tijdelijk niet beschikbaar');
    if(row.untilAt){try{label+=' · tot '+new Date(Number(row.untilAt)).toLocaleDateString('nl-NL',{day:'numeric',month:'short'});}catch(e){}}
    return label;
  }
  function householdStatusText(){
    var mode=currentHouseholdMode(),row=householdRow();
    var label=mode==='BUSY_WEEK'?'Drukke week · Extra-routines schuiven door':mode==='VACATION'?'Vakantie · schoonmaakcadans gepauzeerd':mode==='PLANNING_PAUSE'?'Schoonmaakplanning gepauzeerd':'Normale schoonmaakweek';
    if(mode!=='NORMAL'&&row.untilAt){try{label+=' · tot '+new Date(Number(row.untilAt)).toLocaleDateString('nl-NL',{day:'numeric',month:'short'});}catch(e){}}
    return label;
  }

  function ensureStyle(){
    if(document.getElementById('cleaning-availability-style'))return;
    var style=document.createElement('style');style.id='cleaning-availability-style';
    style.textContent='\n'
      +'#screen-cleaning .cleaning-availability-card{display:grid;gap:10px;padding:14px;margin:0 0 12px;border:1px solid var(--cleaning-border);border-radius:18px;background:var(--cleaning-surface)}\n'
      +'#screen-cleaning .cleaning-availability-head{display:flex;align-items:center;justify-content:space-between;gap:10px}#screen-cleaning .cleaning-availability-head strong{font-size:13px;color:var(--cleaning-text)}\n'
      +'#screen-cleaning .cleaning-availability-lines{display:grid;gap:7px}#screen-cleaning .cleaning-availability-line{display:flex;gap:8px;align-items:flex-start;font-size:10.5px;line-height:1.45;color:var(--cleaning-muted);font-weight:750}#screen-cleaning .cleaning-availability-line b{color:var(--cleaning-text)}\n'
      +'#screen-cleaning .cleaning-availability-actions{display:flex;gap:8px;flex-wrap:wrap}#screen-cleaning .cleaning-availability-actions button{min-height:40px;flex:1;min-width:130px;border:1px solid var(--cleaning-border);border-radius:12px;background:color-mix(in srgb,var(--cleaning-accent) 5%,var(--cleaning-surface));color:var(--cleaning-text);font:inherit;font-size:10.5px;font-weight:900;cursor:pointer}#screen-cleaning .cleaning-availability-actions button:disabled{opacity:.55}\n'
      +'.cleaning-availability-overlay{position:fixed;inset:0;z-index:12540;display:grid;align-items:end;background:rgba(8,10,16,.45)}.cleaning-availability-sheet{width:100%;max-height:80vh;overflow:auto;border-radius:26px 26px 0 0;background:var(--c-surface,#fff);color:var(--c-text,#1e232b);padding:12px 16px calc(22px + env(safe-area-inset-bottom));box-shadow:0 -20px 60px rgba(0,0,0,.18)}.cleaning-availability-handle{width:38px;height:4px;border-radius:999px;background:var(--c-border,#ddd);margin:0 auto 15px}.cleaning-availability-sheet h2{font-size:20px;margin:0 0 5px}.cleaning-availability-sheet p{font-size:11px;line-height:1.5;color:var(--c-text2,#737784);margin:0 0 14px}.cleaning-availability-grid{display:grid;gap:8px}.cleaning-availability-choice{min-height:48px;border:1px solid var(--c-border,#ddd);border-radius:13px;background:var(--c-surface2,#f7f7f8);color:inherit;font:inherit;font-size:12px;font-weight:850;text-align:left;padding:0 13px}.cleaning-availability-choice.is-primary{background:var(--c-primary,#6750a4);color:#fff;border-color:transparent}.cleaning-availability-choice:disabled{opacity:.55}.cleaning-availability-close{width:100%;min-height:44px;margin-top:10px;border:0;background:transparent;color:var(--c-text2,#737784);font:inherit;font-size:12px;font-weight:800}\n';
    document.head.appendChild(style);
  }

  function cardHtml(){
    return '<section class="cleaning-availability-card" data-cleaning-availability-card>'
      +'<div class="cleaning-availability-head"><strong>Beschikbaarheid</strong><span aria-hidden="true">🗓️</span></div>'
      +'<div class="cleaning-availability-lines">'
        +'<div class="cleaning-availability-line"><b>Jij</b><span>'+esc(memberStatusText())+'</span></div>'
        +'<div class="cleaning-availability-line"><b>Huishouden</b><span>'+esc(householdStatusText())+'</span></div>'
      +'</div>'
      +'<div class="cleaning-availability-actions">'
        +'<button type="button" data-cleaning-availability-open="member"'+(state.busy?' disabled':'')+'>Mijn beschikbaarheid</button>'
        +'<button type="button" data-cleaning-availability-open="household"'+(state.busy?' disabled':'')+'>Weekmodus</button>'
      +'</div>'
    +'</section>';
  }
  function findAnchor(panel){var prefs=panel.querySelector('[data-cleaning-preferences-row]');if(prefs)return{parent:prefs.parentNode,before:prefs.nextSibling};var overview=panel.querySelector('[data-cleaning-live-overview]');if(overview)return{parent:overview.parentNode,before:overview};var empty=panel.querySelector('.cleaning-empty-card');return empty?{parent:empty.parentNode,before:empty}:null;}
  function decorate(){
    state.queued=false;ensureStyle();var screen=document.getElementById('screen-cleaning');if(!screen)return;
    var active=screen.querySelector('[data-cleaning-tab="overview"].is-active'),panel=screen.querySelector('.cleaning-panel');if(!active||!panel)return;
    var existing=panel.querySelector('[data-cleaning-availability-card]'),html=cardHtml();
    if(!existing){var anchor=findAnchor(panel);if(!anchor)return;var holder=document.createElement('div');holder.innerHTML=html;anchor.parent.insertBefore(holder.firstElementChild,anchor.before);}
    else if(existing.getAttribute('data-signature')!==html){var next=document.createElement('div');next.innerHTML=html;var replacement=next.firstElementChild;replacement.setAttribute('data-signature',html);existing.replaceWith(replacement);}
    var card=panel.querySelector('[data-cleaning-availability-card]');if(card)card.setAttribute('data-signature',html);
  }
  function queue(){if(state.queued)return;state.queued=true;(window.requestAnimationFrame||function(cb){return window.setTimeout(cb,0);})(decorate);}

  function closeSheet(){var overlay=document.querySelector('.cleaning-availability-overlay');if(overlay)overlay.remove();state.sheet=null;}
  function openSheet(kind){closeSheet();state.sheet=kind;var overlay=document.createElement('div');overlay.className='cleaning-availability-overlay';overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');
    var member=kind==='member',unavailable=currentMemberUnavailable(),mode=currentHouseholdMode();
    var choices=member
      ? '<button class="cleaning-availability-choice is-primary" data-cleaning-availability-action="member-available"'+(!unavailable?' disabled':'')+'>Beschikbaar</button>'
        +'<button class="cleaning-availability-choice" data-cleaning-availability-action="member-sick-1">Ziek / rust nodig · vandaag</button>'
        +'<button class="cleaning-availability-choice" data-cleaning-availability-action="member-temp-3">Tijdelijk niet beschikbaar · 3 dagen</button>'
        +'<button class="cleaning-availability-choice" data-cleaning-availability-action="member-temp-7">Tijdelijk niet beschikbaar · 7 dagen</button>'
        +'<button class="cleaning-availability-choice" data-cleaning-availability-action="member-temp-open">Niet beschikbaar · tot ik dit uitzet</button>'
      : '<button class="cleaning-availability-choice is-primary" data-cleaning-availability-action="household-normal"'+(mode==='NORMAL'?' disabled':'')+'>Normale schoonmaakweek</button>'
        +'<button class="cleaning-availability-choice" data-cleaning-availability-action="household-busy">Drukke week · Extra-routines uitstellen</button>'
        +'<button class="cleaning-availability-choice" data-cleaning-availability-action="household-vacation-7">Vakantie · 7 dagen pauze</button>'
        +'<button class="cleaning-availability-choice" data-cleaning-availability-action="household-vacation-14">Vakantie · 14 dagen pauze</button>'
        +'<button class="cleaning-availability-choice" data-cleaning-availability-action="household-pause-open">Planning pauzeren · tot we hervatten</button>';
    overlay.innerHTML='<div class="cleaning-availability-sheet"><div class="cleaning-availability-handle"></div><h2>'+(member?'Mijn beschikbaarheid':'Weekmodus huishouden')+'</h2><p>'+(member?'Nieuwe automatische verdeling houdt rekening met jouw tijdelijke beschikbaarheid. Vaste routines worden veilig gepauzeerd; bestaand werk wordt nooit stil overgedragen.':'Vakantie/pauze bevriest de bestaande schoonmaakcadans. Een drukke week stelt alleen Extra-routines uit.')+'</p><div class="cleaning-availability-grid">'+choices+'</div><button class="cleaning-availability-close" data-cleaning-availability-close>Sluiten</button></div>';
    document.body.appendChild(overlay);
  }
  function run(action){
    var request;
    if(action==='member-available')request=setMemberAvailable();
    else if(action==='member-sick-1')request=setMemberUnavailable('SICK',1);
    else if(action==='member-temp-3')request=setMemberUnavailable('TEMPORARY',3);
    else if(action==='member-temp-7')request=setMemberUnavailable('TEMPORARY',7);
    else if(action==='member-temp-open')request=setMemberUnavailable('TEMPORARY',null);
    else if(action==='household-normal')request=clearHouseholdMode();
    else if(action==='household-busy')request=setHouseholdMode('BUSY_WEEK',7);
    else if(action==='household-vacation-7')request=setHouseholdMode('VACATION',7);
    else if(action==='household-vacation-14')request=setHouseholdMode('VACATION',14);
    else if(action==='household-pause-open')request=setHouseholdMode('PLANNING_PAUSE',null);
    else return;
    Promise.resolve(request).then(function(){closeSheet();queue();toast('Beschikbaarheid bijgewerkt ✓');}).catch(function(error){toast(text(error&&error.message)||'Beschikbaarheid kon niet worden bijgewerkt.');});
  }
  function onClick(event){
    var open=event.target&&event.target.closest?event.target.closest('[data-cleaning-availability-open]'):null;if(open){event.preventDefault();openSheet(text(open.getAttribute('data-cleaning-availability-open')));return;}
    var close=event.target&&event.target.closest?event.target.closest('[data-cleaning-availability-close]'):null;if(close||event.target&&event.target.classList&&event.target.classList.contains('cleaning-availability-overlay')){event.preventDefault();closeSheet();return;}
    var action=event.target&&event.target.closest?event.target.closest('[data-cleaning-availability-action]'):null;if(action&&!action.disabled){event.preventDefault();run(text(action.getAttribute('data-cleaning-availability-action')));}
  }
  function onRepository(event){state.repository=event&&event.detail||snapshot();queue();}
  function start(){
    if(window.__cleaningAvailabilityExperienceStarted)return;window.__cleaningAvailabilityExperienceStarted=true;ensureStyle();state.repository=snapshot();
    document.addEventListener('click',onClick,true);window.addEventListener('familyapp:cleaning-repository',onRepository);window.addEventListener('familyapp:household-context',function(){state.repository=snapshot();queue();});
    var target=document.getElementById('screen-cleaning')||document.documentElement;if(typeof MutationObserver!=='undefined'&&target){state.observer=new MutationObserver(queue);state.observer.observe(target,{childList:true,subtree:true});}queue();
  }

  window.CleaningAvailabilityExperience={version:VERSION,start:start,setMemberUnavailable:setMemberUnavailable,setMemberAvailable:setMemberAvailable,setHouseholdMode:setHouseholdMode,clearHouseholdMode:clearHouseholdMode,currentMemberUnavailable:currentMemberUnavailable,currentHouseholdMode:currentHouseholdMode};
  start();
})();
