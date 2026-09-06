'use strict';
// ============================================================
// CLEANING PERMISSIONS v1.0.1
// Central client-side capability policy for STEP 14.
//
// Existing household roles are mapped without introducing new account state:
//   owner/admin            -> MANAGER (Beheerder)
//   adult/member           -> MEMBER  (Gezinslid)
//   child/limited/restricted -> LIMITED (Beperkt profiel)
//
// This layer never owns Cleaning data and never writes Firebase directly.
// It guards the final public mutation APIs plus actionable Cleaning UI. The
// canonical domain runtimes remain the only writers.
//
// IMPORTANT SECURITY BOUNDARY:
// database.rules.json currently grants active household members broad writes
// below families/{householdId}/$sharedData. This client capability layer gives
// the product the intended role behaviour now, but server-side enforcement
// still requires an explicit Firebase Rules migration before public release.
// Production Firebase Rules are deliberately NOT changed/deployed here.
// ============================================================
(function(){
  if(window.CleaningPermissions)return;

  var VERSION='1.0.1';
  var ROLE={MANAGER:'MANAGER',MEMBER:'MEMBER',LIMITED:'LIMITED',UNKNOWN:'UNKNOWN'};
  var CAP={
    STRUCTURE:'STRUCTURE',
    PLANNING:'PLANNING',
    ASSIGNMENTS:'ASSIGNMENTS',
    AVAILABILITY:'AVAILABILITY',
    HOUSEHOLD_AVAILABILITY:'HOUSEHOLD_AVAILABILITY',
    SUPPLIES:'SUPPLIES',
    PREFERENCES:'PREFERENCES',
    EXECUTION:'EXECUTION',
    RESPOND:'RESPOND',
    HELP:'HELP'
  };
  var state={observer:null,queued:false,installTimer:null,installAttempts:0};

  function text(value){return String(value==null?'':value).trim();}
  function context(){try{return window.HouseholdContext&&HouseholdContext.snapshot?HouseholdContext.snapshot():null;}catch(e){return null;}}
  function members(){try{var bridge=window.HouseholdIdentityFirebaseBridge;var rows=bridge&&bridge.getMembers?bridge.getMembers():[];return Array.isArray(rows)?rows:[];}catch(e){return[];}}
  function currentMember(){var ctx=context();if(!ctx||ctx.ready!==true||!ctx.uid)return null;return members().find(function(row){return row&&text(row.uid||row.id)===text(ctx.uid)&&text(row.status||'active').toLowerCase()==='active';})||null;}
  function normalizeRole(raw){
    var role=text(raw).toLowerCase();
    if(role==='owner'||role==='admin'||role==='manager'||role==='beheerder')return ROLE.MANAGER;
    if(role==='child'||role==='limited'||role==='restricted'||role==='beperkt')return ROLE.LIMITED;
    if(role==='adult'||role==='member'||role==='gezinslid')return ROLE.MEMBER;
    return ROLE.UNKNOWN;
  }
  function role(){var member=currentMember();return normalizeRole(member&&member.role);}
  function roleLabel(value){value=value||role();return value===ROLE.MANAGER?'Beheerder':value===ROLE.MEMBER?'Gezinslid':value===ROLE.LIMITED?'Beperkt profiel':'Profiel laden…';}
  function capabilities(value){
    value=value||role();
    var base={};Object.keys(CAP).forEach(function(key){base[CAP[key]]=false;});
    base[CAP.PREFERENCES]=true;base[CAP.EXECUTION]=true;base[CAP.RESPOND]=true;base[CAP.HELP]=true;
    if(value===ROLE.MANAGER){Object.keys(base).forEach(function(key){base[key]=true;});return base;}
    if(value===ROLE.MEMBER){base[CAP.PLANNING]=true;base[CAP.ASSIGNMENTS]=true;base[CAP.AVAILABILITY]=true;base[CAP.SUPPLIES]=true;return base;}
    return base;
  }
  function can(capability){return capabilities()[capability]===true;}
  function permissionMessage(capability){
    if(capability===CAP.STRUCTURE)return'Alleen een beheerder kan kamers en schoonmaakroutines structureel wijzigen.';
    if(capability===CAP.PLANNING)return'Dit profiel kan geen nieuw huishoudelijk weekplan maken.';
    if(capability===CAP.ASSIGNMENTS)return'Dit profiel kan geen routine-overdracht of tegenvoorstel starten.';
    if(capability===CAP.AVAILABILITY)return'Dit profiel kan de schoonmaakbeschikbaarheid niet wijzigen.';
    if(capability===CAP.HOUSEHOLD_AVAILABILITY)return'Alleen een beheerder kan de weekmodus voor het hele huishouden wijzigen.';
    if(capability===CAP.SUPPLIES)return'Dit profiel kan voorraad of schoonmaakbenodigdheden niet wijzigen.';
    return'Deze actie is voor dit profiel niet beschikbaar.';
  }
  function error(capability){var e=new Error(permissionMessage(capability));e.code='CLEANING_PERMISSION_DENIED';e.capability=capability;return e;}
  function requireCapability(capability){if(!can(capability))throw error(capability);return true;}
  function denied(capability){return Promise.reject(error(capability));}

  function repository(){return window.CleaningHouseholdRepository||null;}
  function cleaningData(){try{var repo=repository(),snap=repo&&repo.snapshot?repo.snapshot():null;return snap&&snap.data||{};}catch(e){return{};}}
  function routineById(id){var row=cleaningData().routines&&cleaningData().routines[text(id)];return row&&typeof row==='object'?row:null;}
  function currentUid(){var ctx=context();return text(ctx&&ctx.uid);}
  function ownAcceptedRoutine(row){return !!(row&&text(row.assignmentMode)==='FIXED_PERSON'&&text(row.assignmentRequestStatus)==='ACCEPTED'&&text(row.preferredAssigneeUid)===currentUid());}
  function canPauseRoutine(rowOrId){if(role()===ROLE.MANAGER)return true;if(role()!==ROLE.MEMBER)return false;var row=typeof rowOrId==='object'?rowOrId:routineById(rowOrId);return ownAcceptedRoutine(row);}

  function comparable(value){if(Array.isArray(value))return value.map(String).sort();if(value&&typeof value==='object')return value;return value==null?null:value;}
  function equal(a,b){try{return JSON.stringify(comparable(a))===JSON.stringify(comparable(b));}catch(e){return a===b;}}
  function routineStructuralChange(id,input){
    var existing=routineById(id);if(!existing)return true;input=input||{};
    return ['title','intervalDays','estimatedMinutes','priority','roomId','supplyIds'].some(function(key){return Object.prototype.hasOwnProperty.call(input,key)&&!equal(input[key],existing[key]);});
  }

  function wrap(target,name,guard){
    if(!target||typeof target[name]!=='function')return false;
    var current=target[name];if(current.__cleaningPermissionsV1)return true;
    var wrapped=function(){var args=Array.prototype.slice.call(arguments),decision;try{decision=guard(args);}catch(e){return Promise.reject(e);}if(decision!==true)return denied(decision||CAP.STRUCTURE);return current.apply(this,args);};
    wrapped.__cleaningPermissionsV1=true;wrapped.__raw=current;target[name]=wrapped;return true;
  }
  function installRepositoryGuards(){
    var repo=repository();if(!repo)return false;
    ['createRoom','updateRoom','removeRoom','createRoutineItem','removeRoutineItem'].forEach(function(name){wrap(repo,name,function(){return can(CAP.STRUCTURE)?true:CAP.STRUCTURE;});});
    wrap(repo,'updateRoutineItem',function(args){if(can(CAP.STRUCTURE))return true;if(!can(CAP.ASSIGNMENTS))return CAP.ASSIGNMENTS;return routineStructuralChange(args[0],args[1])?CAP.STRUCTURE:true;});
    wrap(repo,'saveDraftPlan',function(){return can(CAP.PLANNING)?true:CAP.PLANNING;});
    wrap(repo,'setUserPreferences',function(){return can(CAP.PREFERENCES)?true:CAP.PREFERENCES;});
    if(typeof repo.createSupply==='function')wrap(repo,'createSupply',function(){return can(CAP.SUPPLIES)?true:CAP.SUPPLIES;});
    if(typeof repo.setSupplyStatus==='function')wrap(repo,'setSupplyStatus',function(){return can(CAP.SUPPLIES)?true:CAP.SUPPLIES;});
    return true;
  }
  function installExperienceGuards(){
    var routine=window.CleaningRoutineExperience;
    if(routine){wrap(routine,'proposeCounter',function(){return can(CAP.ASSIGNMENTS)?true:CAP.ASSIGNMENTS;});wrap(routine,'resolveRequest',function(){return can(CAP.RESPOND)?true:CAP.RESPOND;});wrap(routine,'resolveCounter',function(){return can(CAP.RESPOND)?true:CAP.RESPOND;});}
    var availability=window.CleaningAvailabilityExperience;
    if(availability){wrap(availability,'setMemberUnavailable',function(){return can(CAP.AVAILABILITY)?true:CAP.AVAILABILITY;});wrap(availability,'setMemberAvailable',function(){return can(CAP.AVAILABILITY)?true:CAP.AVAILABILITY;});wrap(availability,'setHouseholdMode',function(){return can(CAP.HOUSEHOLD_AVAILABILITY)?true:CAP.HOUSEHOLD_AVAILABILITY;});wrap(availability,'clearHouseholdMode',function(){return can(CAP.HOUSEHOLD_AVAILABILITY)?true:CAP.HOUSEHOLD_AVAILABILITY;});}
    var supplies=window.CleaningSupplyExperience;
    if(supplies){wrap(supplies,'createSupply',function(){return can(CAP.SUPPLIES)?true:CAP.SUPPLIES;});wrap(supplies,'setSupplyStatus',function(){return can(CAP.SUPPLIES)?true:CAP.SUPPLIES;});}
    var pause=window.CleaningPauseExperience;
    if(pause){wrap(pause,'pauseRoom',function(){return can(CAP.HOUSEHOLD_AVAILABILITY)?true:CAP.HOUSEHOLD_AVAILABILITY;});wrap(pause,'resumeRoom',function(){return can(CAP.HOUSEHOLD_AVAILABILITY)?true:CAP.HOUSEHOLD_AVAILABILITY;});wrap(pause,'pauseRoutine',function(args){return canPauseRoutine(args[0])?true:CAP.AVAILABILITY;});wrap(pause,'resumeRoutine',function(args){return canPauseRoutine(args[0])?true:CAP.AVAILABILITY;});}
    return !!(repoOrFalse()||routine||availability||supplies||pause);
  }
  function repoOrFalse(){return repository()||false;}
  function installGuards(){installRepositoryGuards();installExperienceGuards();}

  function markHidden(node,hidden){if(!node)return;if(hidden){if(!node.hasAttribute('data-cleaning-permission-hidden'))node.setAttribute('data-cleaning-permission-hidden','1');node.hidden=true;node.setAttribute('aria-hidden','true');}
    else if(node.hasAttribute('data-cleaning-permission-hidden')){node.removeAttribute('data-cleaning-permission-hidden');node.hidden=false;node.removeAttribute('aria-hidden');}}
  function markDisabled(node,disabled){if(!node)return;if(disabled){if(!node.hasAttribute('data-cleaning-permission-disabled'))node.setAttribute('data-cleaning-permission-disabled','1');node.disabled=true;}
    else if(node.hasAttribute('data-cleaning-permission-disabled')){node.removeAttribute('data-cleaning-permission-disabled');node.disabled=false;}}
  function each(selector,fn){try{Array.prototype.forEach.call(document.querySelectorAll(selector),fn);}catch(e){}}
  function ensureNote(screen,currentRole){
    if(!screen)return;var note=screen.querySelector('[data-cleaning-permission-note]');
    if(currentRole===ROLE.MANAGER){if(note)note.remove();return;}
    var toolbar=screen.querySelector('.cleaning-room-toolbar');if(!toolbar){if(note)note.remove();return;}
    if(!note){note=document.createElement('p');note.setAttribute('data-cleaning-permission-note','1');note.style.cssText='margin:0 0 12px;padding:10px 12px;border-radius:12px;background:color-mix(in srgb,var(--cleaning-accent) 7%,var(--cleaning-surface));color:var(--cleaning-muted);font-size:10.5px;font-weight:750;line-height:1.45';toolbar.parentNode.insertBefore(note,toolbar.nextSibling);}
    note.textContent=currentRole===ROLE.LIMITED?'Beperkt profiel · je kunt toegewezen schoonmaakbeurten uitvoeren, verzoeken beantwoorden en hulp vragen.':'Gezinslid · je kunt plannen, voorraad bijhouden en routines overdragen. Structurele kamers en routines beheert een beheerder.';
  }
  function decorateUi(){
    state.queued=false;installGuards();var screen=document.getElementById('screen-cleaning');if(!screen)return;var currentRole=role(),manager=currentRole===ROLE.MANAGER,limited=currentRole===ROLE.LIMITED;
    each('#screen-cleaning [data-cleaning-room-add],#screen-cleaning [data-cleaning-room-edit],#screen-cleaning [data-cleaning-routine-add],#screen-cleaning [data-cleaning-routine-edit],#screen-cleaning [data-cleaning-template-add],#screen-cleaning [data-cleaning-routine-remove],#screen-cleaning [data-cleaning-room-move],#screen-cleaning [data-cleaning-room-delete-open],#screen-cleaning [data-cleaning-room-delete-confirm],#screen-cleaning [data-cleaning-routine-delete-open],#screen-cleaning [data-cleaning-routine-delete-confirm]',function(node){markHidden(node,!manager);});
    each('#screen-cleaning [data-cleaning-routine-title],#screen-cleaning [data-cleaning-routine-interval],#screen-cleaning [data-cleaning-routine-minutes],#screen-cleaning [data-cleaning-routine-priority]',function(node){markDisabled(node,!manager);});
    each('#screen-cleaning [data-cleaning-supply-form]',function(node){markHidden(node,!can(CAP.SUPPLIES));});
    each('#screen-cleaning [data-cleaning-plan-generate],#screen-cleaning [data-cleaning-routine-assign]',function(node){markHidden(node,limited||currentRole===ROLE.UNKNOWN);});
    each('#screen-cleaning [data-cleaning-routine-request-counter]',function(node){markHidden(node,!can(CAP.ASSIGNMENTS));});
    each('#screen-cleaning [data-cleaning-availability-open="member"]',function(node){markHidden(node,!can(CAP.AVAILABILITY));});
    each('#screen-cleaning [data-cleaning-availability-open="household"]',function(node){markHidden(node,!can(CAP.HOUSEHOLD_AVAILABILITY));});
    each('#screen-cleaning [data-cleaning-room-pause]',function(node){markHidden(node,!manager);});
    each('#screen-cleaning [data-cleaning-routine-pause]',function(node){markHidden(node,!canPauseRoutine(text(node.getAttribute('data-cleaning-routine-pause'))));});
    each('#screen-cleaning [data-cleaning-supply-status],#screen-cleaning [data-cleaning-supply-shopping],#screen-cleaning [data-cleaning-supply-create],#screen-cleaning [data-cleaning-supply-toggle],#screen-cleaning [data-cleaning-smart-supply]',function(node){markHidden(node,!can(CAP.SUPPLIES));});
    ensureNote(screen,currentRole);
    screen.setAttribute('data-cleaning-role',currentRole.toLowerCase());
  }
  function queue(){if(state.queued)return;state.queued=true;(window.requestAnimationFrame||function(fn){return setTimeout(fn,0);})(decorateUi);}

  function forbiddenClick(event){
    var target=event&&event.target,closest=target&&target.closest?target.closest.bind(target):null;if(!closest)return null;
    if(closest('[data-cleaning-room-add],[data-cleaning-room-edit],[data-cleaning-routine-add],[data-cleaning-template-add],[data-cleaning-routine-remove],[data-cleaning-room-move],[data-cleaning-room-delete-open],[data-cleaning-room-delete-confirm],[data-cleaning-routine-delete-open],[data-cleaning-routine-delete-confirm]')&&!can(CAP.STRUCTURE))return CAP.STRUCTURE;
    if(closest('[data-cleaning-plan-generate]')&&!can(CAP.PLANNING))return CAP.PLANNING;
    if(closest('[data-cleaning-routine-assign],[data-cleaning-routine-request-counter]')&&!can(CAP.ASSIGNMENTS))return CAP.ASSIGNMENTS;
    var availability=closest('[data-cleaning-availability-open],[data-cleaning-availability-action]');if(availability){var value=text(availability.getAttribute('data-cleaning-availability-open')||availability.getAttribute('data-cleaning-availability-action'));if(value.indexOf('household')===0&&!can(CAP.HOUSEHOLD_AVAILABILITY))return CAP.HOUSEHOLD_AVAILABILITY;if(value.indexOf('member')===0&&!can(CAP.AVAILABILITY))return CAP.AVAILABILITY;}
    var roomPause=closest('[data-cleaning-room-pause]');if(roomPause&&!can(CAP.HOUSEHOLD_AVAILABILITY))return CAP.HOUSEHOLD_AVAILABILITY;
    var routinePause=closest('[data-cleaning-routine-pause]');if(routinePause&&!canPauseRoutine(text(routinePause.getAttribute('data-cleaning-routine-pause'))))return CAP.AVAILABILITY;
    if(closest('[data-cleaning-supply-status],[data-cleaning-supply-shopping],[data-cleaning-supply-create],[data-cleaning-supply-toggle],[data-cleaning-smart-supply]')&&!can(CAP.SUPPLIES))return CAP.SUPPLIES;
    return null;
  }
  function onClick(event){var capability=forbiddenClick(event);if(!capability)return;event.preventDefault();event.stopImmediatePropagation();if(typeof window.showToast==='function')window.showToast(permissionMessage(capability));}

  function start(){
    if(window.__cleaningPermissionsStarted)return true;window.__cleaningPermissionsStarted=true;
    document.addEventListener('click',onClick,true);window.addEventListener('familyapp:household-context',queue);window.addEventListener('familyapp:household-identity-synced',queue);window.addEventListener('familyapp:cleaning-repository',queue);
    var target=document.documentElement;if(typeof MutationObserver!=='undefined'&&target){state.observer=new MutationObserver(queue);state.observer.observe(target,{childList:true,subtree:true});}
    installGuards();state.installTimer=window.setInterval(function(){state.installAttempts++;installGuards();if(state.installAttempts>160){window.clearInterval(state.installTimer);state.installTimer=null;}},250);queue();return true;
  }

  window.CleaningPermissions={version:VERSION,ROLE:ROLE,CAP:CAP,role:role,roleLabel:roleLabel,capabilities:capabilities,can:can,require:requireCapability,permissionMessage:permissionMessage,currentMember:currentMember,canPauseRoutine:canPauseRoutine,start:start,_normalizeRole:normalizeRole,_routineStructuralChange:routineStructuralChange,_installGuards:installGuards,_decorateUi:decorateUi};
  start();
})();
