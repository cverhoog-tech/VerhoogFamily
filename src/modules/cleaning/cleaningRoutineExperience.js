'use strict';
// ============================================================
// CLEANING ROUTINE EXPERIENCE v0.4.0
// Progressive UX around the canonical Cleaning screen:
// - compact, collapsible rooms
// - visible routine assignment/request entry point
// - transfer requests keep the previous responsibility as fallback
// - recipients can counter-propose another active household member
// - counter-proposals remain consent-based: third persons receive a new request
// - ongoing versus this-week-only recurrence choice
// - edit forms scroll into view immediately
// - accepting a transfer removes future duplicate work from the old assignee
// ============================================================
(function(){
  if(window.CleaningRoutineExperience)return;

  var VERSION='0.4.0';
  var DAY_MS=86400000;
  var state={observer:null,expanded:{},editRoutineId:null,repoPatched:false,queued:false};
  var INVALID_KEY=/[.#$\[\]\/\u0000-\u001F\u007F]/g;

  function clone(value){if(value===undefined)return undefined;try{return JSON.parse(JSON.stringify(value));}catch(e){return value;}}
  function text(value){return String(value==null?'':value).trim();}
  function safe(value){return text(value).replace(INVALID_KEY,'_');}
  function now(){return Date.now();}
  function escapeHtml(value){return String(value==null?'':value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}
  function contextSnapshot(){try{return window.HouseholdContext&&window.HouseholdContext.snapshot?window.HouseholdContext.snapshot():null;}catch(e){return null;}}
  function captureContext(){try{return window.HouseholdContext&&window.HouseholdContext.capture?window.HouseholdContext.capture():null;}catch(e){return null;}}
  function contextIsCurrent(token){try{return !!(window.HouseholdContext&&window.HouseholdContext.isCurrent&&window.HouseholdContext.isCurrent(token));}catch(e){return false;}}
  function firebaseDb(){try{return window.fbDb||(window.firebase&&window.firebase.database&&window.firebase.database())||null;}catch(e){return null;}}
  function repository(){return window.CleaningHouseholdRepository||null;}
  function repositorySnapshot(){try{var repo=repository();return repo&&repo.snapshot?repo.snapshot():null;}catch(e){return null;}}
  function cleaningData(){var snapshot=repositorySnapshot();return snapshot&&snapshot.data||{};}
  function currentUid(){var ctx=contextSnapshot();return text(ctx&&ctx.uid);}
  function cleaningPathFor(householdId){var domain=window.CleaningDomain;return householdId&&domain&&domain.basePath?domain.basePath(householdId):null;}

  function activeMembers(){
    try{
      var bridge=window.HouseholdIdentityFirebaseBridge;
      var rows=bridge&&bridge.getMembers?bridge.getMembers():[];
      return (Array.isArray(rows)?rows:[]).filter(function(row){return row&&text(row.uid)&&text(row.status||'active').toLowerCase()==='active';}).map(clone);
    }catch(e){return [];}
  }
  function activeMemberLookup(){var lookup={};activeMembers().forEach(function(member){var uid=text(member&&member.uid);if(uid)lookup[uid]=true;});return lookup;}
  function memberName(uid){var member=activeMembers().find(function(row){return text(row.uid)===text(uid);});return member?text(member.displayName||member.name)||'Gezinslid':'Gezinslid';}
  function routineById(id){var routines=cleaningData().routines||{};return routines[id]&&typeof routines[id]==='object'?Object.assign({id:id},clone(routines[id])):null;}
  function roomById(id){var rooms=cleaningData().rooms||{};return rooms[id]&&typeof rooms[id]==='object'?Object.assign({id:id},clone(rooms[id])):null;}

  function currentWeekWindow(timestamp){
    var start=new Date(Number(timestamp)||now());start.setHours(0,0,0,0);start.setDate(start.getDate()-((start.getDay()+6)%7));
    var end=new Date(start.getTime());end.setDate(end.getDate()+7);return{startAt:start.getTime(),endAt:end.getTime()};
  }

  function ensureStyle(){
    if(document.getElementById('cleaning-routine-experience-style'))return;
    var style=document.createElement('style');style.id='cleaning-routine-experience-style';
    style.textContent='\n'
      +'#screen-cleaning .cleaning-room-form{scroll-margin-top:92px}\n'
      +'#screen-cleaning .cleaning-room-card:not(.is-expanded) .cleaning-routine-section,#screen-cleaning .cleaning-room-card:not(.is-expanded) .cleaning-routine-empty{display:none!important}\n'
      +'#screen-cleaning .cleaning-room-card:not(.is-expanded){padding-bottom:0}\n'
      +'#screen-cleaning .cleaning-room-card:not(.is-expanded) .cleaning-room-card-copy p{display:none}\n'
      +'#screen-cleaning .cleaning-room-card-main{cursor:pointer}\n'
      +'#screen-cleaning .cleaning-room-expand-button{width:44px;height:44px;border-radius:12px;border:1px solid var(--cleaning-border);background:var(--cleaning-surface);color:var(--cleaning-text);font:inherit;font-weight:950;cursor:pointer;display:grid;place-items:center}\n'
      +'#screen-cleaning .cleaning-room-expand-button span{transition:transform .18s ease}\n'
      +'#screen-cleaning .cleaning-room-card.is-expanded .cleaning-room-expand-button span{transform:rotate(180deg)}\n'
      +'#screen-cleaning .cleaning-room-help{margin:0 0 12px;padding:11px 13px;border-radius:14px;background:color-mix(in srgb,var(--cleaning-accent) 7%,var(--cleaning-surface));color:var(--cleaning-muted);font-size:11px;font-weight:750;line-height:1.45}\n'
      +'#screen-cleaning .cleaning-routine-extra-fields{display:grid;gap:12px;padding:14px;border:1px solid var(--cleaning-border);border-radius:16px;background:color-mix(in srgb,var(--cleaning-accent) 5%,var(--cleaning-surface));margin:2px 0 4px}\n'
      +'#screen-cleaning .cleaning-routine-extra-copy{font-size:11px;line-height:1.45;color:var(--cleaning-muted);font-weight:750;margin:0}\n'
      +'#screen-cleaning .cleaning-routine-assign-button{min-height:44px;border:1px solid color-mix(in srgb,var(--cleaning-accent) 35%,var(--cleaning-border));background:color-mix(in srgb,var(--cleaning-accent) 8%,var(--cleaning-surface));color:var(--cleaning-accent);border-radius:10px;padding:6px 10px;font:inherit;font-size:10px;font-weight:950;cursor:pointer}\n'
      +'#screen-cleaning .cleaning-routine-assignment-badge{display:inline-flex;margin-left:6px;padding:2px 7px;border-radius:999px;background:color-mix(in srgb,var(--cleaning-accent) 9%,transparent);color:var(--cleaning-accent);font-size:9px;font-weight:900;vertical-align:middle}\n'
      +'#screen-cleaning .cleaning-routine-request-card{display:grid;gap:10px;padding:14px 15px;margin:0 0 14px;border-radius:18px;border:1px solid color-mix(in srgb,var(--cleaning-accent) 25%,var(--cleaning-border));background:color-mix(in srgb,var(--cleaning-accent) 8%,var(--cleaning-surface));box-shadow:0 8px 24px rgba(31,25,55,.06)}\n'
      +'#screen-cleaning .cleaning-routine-request-card.is-counter{border-color:color-mix(in srgb,var(--cleaning-accent) 42%,var(--cleaning-border));background:color-mix(in srgb,var(--cleaning-accent) 11%,var(--cleaning-surface))}\n'
      +'#screen-cleaning .cleaning-routine-request-card strong{font-size:14px;color:var(--cleaning-text)}\n'
      +'#screen-cleaning .cleaning-routine-request-card p{margin:0;font-size:11px;line-height:1.5;color:var(--cleaning-muted);font-weight:750}\n'
      +'#screen-cleaning .cleaning-routine-request-actions{display:flex;gap:8px;flex-wrap:wrap}\n'
      +'#screen-cleaning .cleaning-routine-request-actions button{flex:1;min-width:120px;min-height:44px;border-radius:13px;border:1px solid var(--cleaning-border);font:inherit;font-size:12px;font-weight:950;cursor:pointer}\n'
      +'#screen-cleaning .cleaning-routine-request-accept,#screen-cleaning .cleaning-routine-counter-accept{background:var(--cleaning-accent);color:white;border-color:transparent!important}\n'
      +'#screen-cleaning .cleaning-routine-request-decline,#screen-cleaning .cleaning-routine-counter-decline{background:var(--cleaning-surface);color:var(--cleaning-text)}\n'
      +'#screen-cleaning .cleaning-routine-counter-box{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;align-items:end;padding-top:2px}\n'
      +'#screen-cleaning .cleaning-routine-counter-box label{display:grid;gap:5px;min-width:0;color:var(--cleaning-muted);font-size:10px;font-weight:900}\n'
      +'#screen-cleaning .cleaning-routine-counter-box select{width:100%;min-height:44px;border:1px solid var(--cleaning-border);border-radius:12px;background:var(--cleaning-surface);color:var(--cleaning-text);padding:0 10px;font:inherit;font-size:12px;font-weight:850}\n'
      +'#screen-cleaning .cleaning-routine-counter-button{min-height:44px;border-radius:12px;border:1px solid color-mix(in srgb,var(--cleaning-accent) 35%,var(--cleaning-border));background:color-mix(in srgb,var(--cleaning-accent) 7%,var(--cleaning-surface));color:var(--cleaning-accent);padding:0 12px;font:inherit;font-size:11px;font-weight:950;cursor:pointer}\n'
      +'@media(max-width:430px){#screen-cleaning .cleaning-routine-counter-box{grid-template-columns:1fr}#screen-cleaning .cleaning-routine-request-actions button{min-width:0}}\n';
    document.head.appendChild(style);
  }

  function formValues(){
    var form=document.querySelector('#screen-cleaning [data-cleaning-routine-form]');
    var assignee=form&&form.querySelector('[data-cleaning-routine-assignee]'),repeat=form&&form.querySelector('[data-cleaning-routine-repeat-scope]');
    return{assignee:text(assignee&&assignee.value)||'AUTO',repeatScope:text(repeat&&repeat.value)==='THIS_WEEK'?'THIS_WEEK':'ONGOING'};
  }

  function assignmentFallback(existing){
    var row=existing||{},status=text(row.assignmentRequestStatus);
    if((status==='PENDING'||status==='COUNTER_PROPOSED')&&text(row.assignmentFallbackMode)){
      return{mode:text(row.assignmentFallbackMode)==='FIXED_PERSON'?'FIXED_PERSON':'AUTO',uid:text(row.assignmentFallbackAssigneeUid)||null,acceptedAt:Number(row.assignmentFallbackAcceptedAt)||null,acceptedByUid:text(row.assignmentFallbackAcceptedByUid)||null};
    }
    if(text(row.assignmentMode)==='FIXED_PERSON'&&status==='ACCEPTED'&&text(row.preferredAssigneeUid)){
      return{mode:'FIXED_PERSON',uid:text(row.preferredAssigneeUid),acceptedAt:Number(row.assignmentAcceptedAt)||null,acceptedByUid:text(row.assignmentAcceptedByUid)||text(row.preferredAssigneeUid)};
    }
    return{mode:'AUTO',uid:null,acceptedAt:null,acceptedByUid:null};
  }

  function clearActiveCounter(routine){
    routine.assignmentCounterProposedUid=null;
    routine.assignmentCounterProposedAt=null;
    routine.assignmentCounterProposedByUid=null;
  }

  function clearFallback(routine){
    routine.assignmentFallbackMode=null;
    routine.assignmentFallbackAssigneeUid=null;
    routine.assignmentFallbackAcceptedAt=null;
    routine.assignmentFallbackAcceptedByUid=null;
  }

  function setFallbackFields(target,fallback){
    var row=fallback||{mode:'AUTO'};
    target.assignmentFallbackMode=row.mode==='FIXED_PERSON'?'FIXED_PERSON':'AUTO';
    target.assignmentFallbackAssigneeUid=row.mode==='FIXED_PERSON'?text(row.uid)||null:null;
    target.assignmentFallbackAcceptedAt=row.mode==='FIXED_PERSON'?(Number(row.acceptedAt)||null):null;
    target.assignmentFallbackAcceptedByUid=row.mode==='FIXED_PERSON'?(text(row.acceptedByUid)||text(row.uid)||null):null;
  }

  function assignmentPatch(values,existing){
    var selected=text(values&&values.assignee)||'AUTO',repeatScope=values&&values.repeatScope==='THIS_WEEK'?'THIS_WEEK':'ONGOING',uid=currentUid(),patch={repeatScope:repeatScope},scope=currentWeekWindow();
    patch.repeatScopeWeekStartAt=repeatScope==='THIS_WEEK'?scope.startAt:null;patch.repeatScopeWeekEndAt=repeatScope==='THIS_WEEK'?scope.endAt:null;
    if(!selected||selected==='AUTO'){
      patch.assignmentMode='AUTO';patch.preferredAssigneeUid=null;patch.assignmentRequestStatus='AUTO';patch.paused=false;patch.assignmentRequestedByUid=null;patch.assignmentRequestedAt=null;patch.assignmentAcceptedByUid=null;patch.assignmentAcceptedAt=null;
      clearActiveCounter(patch);clearFallback(patch);return patch;
    }
    if(existing&&['PENDING','COUNTER_PROPOSED'].indexOf(text(existing.assignmentRequestStatus))>=0&&text(existing.assignmentRequestedByUid)!==uid&&selected===text(existing.preferredAssigneeUid)){
      patch.assignmentMode='REQUESTED';patch.preferredAssigneeUid=text(existing.preferredAssigneeUid);patch.assignmentRequestStatus=text(existing.assignmentRequestStatus);patch.paused=true;patch.assignmentRequestedByUid=text(existing.assignmentRequestedByUid);patch.assignmentRequestedAt=Number(existing.assignmentRequestedAt)||now();
      setFallbackFields(patch,assignmentFallback(existing));patch.assignmentCounterProposedUid=text(existing.assignmentCounterProposedUid)||null;patch.assignmentCounterProposedAt=Number(existing.assignmentCounterProposedAt)||null;patch.assignmentCounterProposedByUid=text(existing.assignmentCounterProposedByUid)||null;return patch;
    }
    if(selected===uid){
      patch.assignmentMode='FIXED_PERSON';patch.preferredAssigneeUid=uid;patch.assignmentRequestStatus='ACCEPTED';patch.paused=false;patch.assignmentAcceptedByUid=uid;patch.assignmentAcceptedAt=Number(existing&&existing.assignmentAcceptedAt)||now();
      clearActiveCounter(patch);clearFallback(patch);return patch;
    }
    if(existing&&text(existing.preferredAssigneeUid)===selected&&text(existing.assignmentRequestStatus)==='ACCEPTED'){
      patch.assignmentMode='FIXED_PERSON';patch.preferredAssigneeUid=selected;patch.assignmentRequestStatus='ACCEPTED';patch.paused=false;patch.assignmentAcceptedByUid=selected;patch.assignmentAcceptedAt=Number(existing.assignmentAcceptedAt)||now();
      clearActiveCounter(patch);clearFallback(patch);return patch;
    }
    var fallback=assignmentFallback(existing);
    patch.assignmentMode='REQUESTED';patch.preferredAssigneeUid=selected;patch.assignmentRequestStatus='PENDING';patch.paused=true;patch.assignmentRequestedByUid=uid;patch.assignmentRequestedAt=now();patch.assignmentAcceptedByUid=null;patch.assignmentAcceptedAt=null;
    clearActiveCounter(patch);setFallbackFields(patch,fallback);return patch;
  }

  function restoreAssignmentFallback(routine,timestamp,actorUid,outcome){
    var fallback=assignmentFallback(routine),mode=fallback.mode==='FIXED_PERSON'&&fallback.uid?'FIXED_PERSON':'AUTO';
    routine.assignmentMode=mode;
    routine.preferredAssigneeUid=mode==='FIXED_PERSON'?fallback.uid:null;
    routine.assignmentRequestStatus=mode==='FIXED_PERSON'?'ACCEPTED':'AUTO';
    routine.assignmentAcceptedAt=mode==='FIXED_PERSON'?(fallback.acceptedAt||timestamp):null;
    routine.assignmentAcceptedByUid=mode==='FIXED_PERSON'?(fallback.acceptedByUid||fallback.uid):null;
    routine.assignmentDeclinedAt=timestamp;
    routine.assignmentDeclinedByUid=actorUid;
    routine.assignmentLastRequestOutcome=text(outcome)||'DECLINED';
    routine.assignmentLastRequestResolvedAt=timestamp;
    routine.assignmentLastRequestResolvedByUid=actorUid;
    routine.paused=false;
    clearActiveCounter(routine);clearFallback(routine);
    routine.updatedAt=timestamp;routine.updatedByUid=actorUid;
    return routine;
  }

  function applyCounterProposal(routine,targetUid,actorUid,timestamp,memberLookup){
    var target=text(targetUid),actor=text(actorUid),lookup=memberLookup||{};
    if(!routine||routine.active===false)throw new Error('CLEANING_ROUTINE_NOT_FOUND');
    if(text(routine.assignmentRequestStatus)!=='PENDING'||text(routine.preferredAssigneeUid)!==actor)throw new Error('CLEANING_ROUTINE_REQUEST_NOT_PENDING');
    if(!target||target===actor||!lookup[target])throw new Error('CLEANING_ROUTINE_COUNTER_TARGET_INVALID');
    routine.assignmentRequestStatus='COUNTER_PROPOSED';routine.assignmentCounterProposedUid=target;routine.assignmentCounterProposedAt=timestamp;routine.assignmentCounterProposedByUid=actor;routine.assignmentLastRequestOutcome='COUNTER_PROPOSED';routine.paused=true;routine.updatedAt=timestamp;routine.updatedByUid=actor;return routine;
  }

  function markAccepted(routine,targetUid,timestamp,actorUid,outcome){
    routine.assignmentMode='FIXED_PERSON';routine.preferredAssigneeUid=targetUid;routine.assignmentRequestStatus='ACCEPTED';routine.assignmentAcceptedAt=timestamp;routine.assignmentAcceptedByUid=targetUid;routine.assignmentLastRequestOutcome=text(outcome)||'ACCEPTED';routine.assignmentLastRequestResolvedAt=timestamp;routine.assignmentLastRequestResolvedByUid=actorUid;routine.paused=false;clearActiveCounter(routine);clearFallback(routine);routine.updatedAt=timestamp;routine.updatedByUid=actorUid;return routine;
  }

  function requireWriteContext(){
    var ctx=contextSnapshot(),database=firebaseDb(),token=captureContext();
    if(!ctx||ctx.ready!==true||!ctx.uid||!ctx.householdId)throw new Error('ACTIVE_HOUSEHOLD_REQUIRED');if(!database)throw new Error('FIREBASE_DATABASE_UNAVAILABLE');if(!token||!contextIsCurrent(token))throw new Error('HOUSEHOLD_CONTEXT_CHANGED');
    var path=cleaningPathFor(ctx.householdId);if(!path)throw new Error('ACTIVE_HOUSEHOLD_REQUIRED');return{ctx:ctx,database:database,token:token,path:path};
  }

  function directRoutineUpdate(id,input,extra){
    var write,domain=window.CleaningDomain;try{write=requireWriteContext();}catch(error){return Promise.reject(error);}
    if(!domain||typeof domain.normalizeRoutineItem!=='function')return Promise.reject(new Error('CLEANING_ROUTINE_UPDATE_UNAVAILABLE'));
    var transitionError=null,timestamp=now();
    return write.database.ref(write.path+'/routines/'+safe(id)).transaction(function(serverRoutine){
      if(!contextIsCurrent(write.token)){transitionError=new Error('HOUSEHOLD_CONTEXT_CHANGED');return;}if(!serverRoutine||typeof serverRoutine!=='object'){transitionError=new Error('CLEANING_ROUTINE_NOT_FOUND');return;}if(serverRoutine.active===false){transitionError=new Error('CLEANING_ROUTINE_INACTIVE');return;}
      var normalized=domain.normalizeRoutineItem(Object.assign({},clone(serverRoutine),input||{},extra||{}),id);if(!normalized.title){transitionError=new Error('CLEANING_ROUTINE_TITLE_REQUIRED');return;}
      normalized.id=serverRoutine.id||id;normalized.householdId=serverRoutine.householdId;normalized.createdAt=serverRoutine.createdAt;normalized.createdByUid=serverRoutine.createdByUid;normalized.updatedAt=timestamp;normalized.updatedByUid=write.ctx.uid;transitionError=null;return normalized;
    }).then(function(result){if(transitionError)throw transitionError;if(!contextIsCurrent(write.token))throw new Error('HOUSEHOLD_CONTEXT_CHANGED_AFTER_WRITE');if(!result||result.committed!==true)throw new Error('CLEANING_ROUTINE_UPDATE_NOT_COMMITTED');return result.snapshot&&result.snapshot.val?clone(result.snapshot.val()):null;});
  }

  function patchRepository(){
    var repo=repository();if(!repo)return false;if(repo.__routineExperienceV3){state.repoPatched=true;return true;}if(typeof repo.createRoutineItem!=='function'||typeof repo.updateRoutineItem!=='function')return false;
    var rawCreate=repo.createRoutineItem.bind(repo);
    repo.createRoutineItem=function(input){var values=input&&input.templateKey?{assignee:'AUTO',repeatScope:'ONGOING'}:formValues(),extra=assignmentPatch(values,null);return rawCreate(Object.assign({},input||{},extra));};
    repo.updateRoutineItem=function(id,input){var existing=routineById(id),extra=assignmentPatch(formValues(),existing);return directRoutineUpdate(id,input,extra);};
    repo.__routineExperienceV3=true;state.repoPatched=true;return true;
  }

  function updateFormCopy(form){
    var copy=form&&form.querySelector('[data-cleaning-routine-extra-copy]'),assignee=form&&form.querySelector('[data-cleaning-routine-assignee]'),repeat=form&&form.querySelector('[data-cleaning-routine-repeat-scope]');if(!copy)return;
    var selected=text(assignee&&assignee.value)||'AUTO',repeatValue=text(repeat&&repeat.value)||'ONGOING';
    var message=selected==='AUTO'?'De weekplanner verdeelt deze routine automatisch.':selected===currentUid()?'Deze routine wordt vast aan jou gekoppeld.':'Na opslaan krijgt '+memberName(selected)+' bovenaan Schoonmaken een verzoek met Accepteren, Tegenvoorstel en Afwijzen.';
    message+=' '+(repeatValue==='ONGOING'?'Na acceptatie wordt hij ook vier weken vooruit gepland en blijft de horizon doorrollen.':'Hij blijft uitsluitend onderdeel van het huidige weekplan.');if(copy.textContent!==message)copy.textContent=message;
  }

  function decorateRoutineForm(){
    var form=document.querySelector('#screen-cleaning [data-cleaning-routine-form]');if(!form||form.querySelector('[data-cleaning-routine-extra-fields]'))return;
    var routine=state.editRoutineId?routineById(state.editRoutineId):null,uid=currentUid(),selected=routine&&routine.preferredAssigneeUid?text(routine.preferredAssigneeUid):'AUTO';if(!routine||!routine.preferredAssigneeUid)selected='AUTO';
    var options=['<option value="AUTO"'+(selected==='AUTO'?' selected':'')+'>Automatisch eerlijk verdelen</option>'];
    activeMembers().forEach(function(member){var memberUid=text(member.uid),label=memberUid===uid?'Ikzelf':text(member.displayName||member.name)||'Gezinslid';options.push('<option value="'+escapeHtml(memberUid)+'"'+(selected===memberUid?' selected':'')+'>'+escapeHtml(label)+'</option>');});
    var repeat=routine&&routine.repeatScope==='THIS_WEEK'?'THIS_WEEK':'ONGOING',box=document.createElement('div');box.className='cleaning-routine-extra-fields';box.setAttribute('data-cleaning-routine-extra-fields','1');
    box.innerHTML='<label class="cleaning-field"><span>Wie doet deze routine?</span><select data-cleaning-routine-assignee>'+options.join('')+'</select></label><label class="cleaning-field"><span>Herhalen na deze week?</span><select data-cleaning-routine-repeat-scope><option value="ONGOING"'+(repeat==='ONGOING'?' selected':'')+'>Ja · doorlopend, vier weken vooruit</option><option value="THIS_WEEK"'+(repeat==='THIS_WEEK'?' selected':'')+'>Nee · alleen dit weekplan</option></select></label><p class="cleaning-routine-extra-copy" data-cleaning-routine-extra-copy></p>';
    var actions=form.querySelector('.cleaning-form-actions');if(actions)form.insertBefore(box,actions);else form.appendChild(box);Array.prototype.forEach.call(box.querySelectorAll('select'),function(select){select.addEventListener('change',function(){updateFormCopy(form);});});updateFormCopy(form);
  }

  function decorateRooms(){
    var grid=document.querySelector('#screen-cleaning .cleaning-room-grid');
    if(grid){var previous=grid.previousElementSibling;if(!previous||!previous.matches||!previous.matches('[data-cleaning-room-help]')){var help=document.createElement('p');help.className='cleaning-room-help';help.setAttribute('data-cleaning-room-help','1');help.textContent='Kamers staan standaard ingeklapt. Open een kamer voor de routines. Gebruik Toewijzen om een routine aan jezelf of een ander gezinslid te vragen.';grid.parentNode.insertBefore(help,grid);}}
    Array.prototype.forEach.call(document.querySelectorAll('#screen-cleaning .cleaning-room-card'),function(card){
      var roomId=text(card.getAttribute('data-cleaning-room-id'));if(!roomId)return;var expanded=!!state.expanded[roomId];card.classList.toggle('is-expanded',expanded);var actions=card.querySelector('.cleaning-room-card-actions');
      if(actions&&!actions.querySelector('[data-cleaning-room-expand]')){var expandButton=document.createElement('button');expandButton.type='button';expandButton.className='cleaning-room-expand-button';expandButton.setAttribute('data-cleaning-room-expand',roomId);expandButton.innerHTML='<span aria-hidden="true">⌄</span>';actions.appendChild(expandButton);}
      var button=actions&&actions.querySelector('[data-cleaning-room-expand]');if(button){button.setAttribute('aria-expanded',expanded?'true':'false');button.setAttribute('aria-label',expanded?'Kamer inklappen':'Kamer uitklappen');}
    });
  }

  function decorateRoutineRows(){
    var rows=cleaningData().routines||{};
    Array.prototype.forEach.call(document.querySelectorAll('#screen-cleaning [data-cleaning-routine-edit]'),function(edit){
      var id=text(edit.getAttribute('data-cleaning-routine-edit')),routine=rows[id],item=edit.closest('.cleaning-routine-item'),actions=item&&item.querySelector('.cleaning-routine-item-actions');if(!routine||!item||!actions)return;
      if(!actions.querySelector('[data-cleaning-routine-assign]')){var assign=document.createElement('button');assign.type='button';assign.className='cleaning-routine-assign-button';assign.setAttribute('data-cleaning-routine-assign',id);assign.textContent='Toewijzen';actions.insertBefore(assign,edit);}
      var title=item.querySelector('.cleaning-routine-copy strong'),badge=title&&title.querySelector('[data-cleaning-routine-assignment-badge]'),label='',status=text(routine.assignmentRequestStatus);
      if(status==='PENDING')label='Verzoek naar '+memberName(routine.preferredAssigneeUid);else if(status==='COUNTER_PROPOSED')label='Tegenvoorstel: '+memberName(routine.assignmentCounterProposedUid);else if(status==='ACCEPTED'&&routine.preferredAssigneeUid)label='Vast: '+memberName(routine.preferredAssigneeUid);else if(text(routine.assignmentLastRequestOutcome).indexOf('DECLINED')>=0&&status==='AUTO')label='Afgewezen · automatisch';
      if(!label){if(badge)badge.remove();return;}if(!badge){badge=document.createElement('span');badge.className='cleaning-routine-assignment-badge';badge.setAttribute('data-cleaning-routine-assignment-badge','1');title.appendChild(badge);}if(badge.textContent!==label)badge.textContent=label;
    });
  }

  function incomingRequests(){var uid=currentUid(),rows=cleaningData().routines||{};return Object.keys(rows).map(function(id){return Object.assign({id:id},rows[id]||{});}).filter(function(routine){return routine&&routine.active!==false&&routine.assignmentRequestStatus==='PENDING'&&text(routine.preferredAssigneeUid)===uid;});}
  function outgoingCounterRequests(){var uid=currentUid(),rows=cleaningData().routines||{};return Object.keys(rows).map(function(id){return Object.assign({id:id},rows[id]||{});}).filter(function(routine){return routine&&routine.active!==false&&routine.assignmentRequestStatus==='COUNTER_PROPOSED'&&text(routine.assignmentRequestedByUid)===uid;});}

  function counterOptions(routine){
    var uid=currentUid(),requester=text(routine&&routine.assignmentRequestedByUid),options=[];
    activeMembers().forEach(function(member){var memberUid=text(member.uid);if(!memberUid||memberUid===uid)return;var label=memberUid===requester?'Terug naar mij':text(member.displayName||member.name)||'Gezinslid';options.push({uid:memberUid,label:label,priority:memberUid===requester?0:1});});
    options.sort(function(a,b){if(a.priority!==b.priority)return a.priority-b.priority;return a.label.localeCompare(b.label,'nl');});return options;
  }

  function incomingRequestHtml(routine){
    var room=roomById(routine.roomId),requester=memberName(routine.assignmentRequestedByUid),options=counterOptions(routine),optionHtml=options.map(function(option){return '<option value="'+escapeHtml(option.uid)+'">'+escapeHtml(option.label)+'</option>';}).join('');
    var counter=optionHtml?'<div class="cleaning-routine-counter-box"><label><span>Kan iemand anders hem beter doen?</span><select data-cleaning-routine-counter-target="'+escapeHtml(routine.id)+'">'+optionHtml+'</select></label><button type="button" class="cleaning-routine-counter-button" data-cleaning-routine-request-counter="'+escapeHtml(routine.id)+'">Tegenvoorstel</button></div>':'';
    return '<section class="cleaning-routine-request-card"><strong>'+escapeHtml(requester)+' vraagt jou: '+escapeHtml(routine.title||'Schoonmaakroutine')+'</strong><p>'+escapeHtml(room&&room.name||'Kamer')+' · elke '+escapeHtml(routine.intervalDays||7)+' dagen · '+escapeHtml(routine.estimatedMinutes||0)+' min. '+(routine.repeatScope==='THIS_WEEK'?'Alleen dit weekplan.':'Dit is een doorlopende routine.')+'</p>'+counter+'<div class="cleaning-routine-request-actions"><button type="button" class="cleaning-routine-request-decline" data-cleaning-routine-request-decline="'+escapeHtml(routine.id)+'">Afwijzen</button><button type="button" class="cleaning-routine-request-accept" data-cleaning-routine-request-accept="'+escapeHtml(routine.id)+'">Accepteren</button></div></section>';
  }

  function outgoingCounterHtml(routine){
    var proposer=memberName(routine.assignmentCounterProposedByUid),target=memberName(routine.assignmentCounterProposedUid),room=roomById(routine.roomId);
    return '<section class="cleaning-routine-request-card is-counter"><strong>'+escapeHtml(proposer)+' doet een tegenvoorstel</strong><p>'+escapeHtml(routine.title||'Schoonmaakroutine')+' · '+escapeHtml(room&&room.name||'Kamer')+'. Voorstel: '+escapeHtml(target)+' neemt deze routine over. Als dat iemand anders is, krijgt die persoon daarna eerst zelf een verzoek.</p><div class="cleaning-routine-request-actions"><button type="button" class="cleaning-routine-counter-decline" data-cleaning-routine-counter-decline="'+escapeHtml(routine.id)+'">Voorstel afwijzen</button><button type="button" class="cleaning-routine-counter-accept" data-cleaning-routine-counter-accept="'+escapeHtml(routine.id)+'">Voorstel accepteren</button></div></section>';
  }

  function decorateRequests(){
    var panel=document.querySelector('#screen-cleaning .cleaning-panel');if(!panel)return;var inbox=panel.querySelector('[data-cleaning-routine-request-inbox]'),incoming=incomingRequests(),counters=outgoingCounterRequests(),requests=incoming.length+counters.length;if(!requests){if(inbox)inbox.remove();return;}
    var html=counters.map(outgoingCounterHtml).concat(incoming.map(incomingRequestHtml)).join('');
    if(!inbox){inbox=document.createElement('div');inbox.setAttribute('data-cleaning-routine-request-inbox','1');panel.insertBefore(inbox,panel.firstChild);}if(inbox.innerHTML!==html)inbox.innerHTML=html;
  }

  function assignedUid(row){var ids=row&&Array.isArray(row.assignmentUids)?row.assignmentUids.filter(Boolean).map(String):[];return ids.length===1?ids[0]:null;}
  function occurrenceAnchor(row){return Number(row&&row.slotAt)||Number(row&&row.flexibleWindow&&row.flexibleWindow.startAt)||Number(row&&row.scheduledStartAt)||Number(row&&row.earliestDueAt)||0;}
  function planContaining(root,timestamp){var plans=root.plans||{};return Object.keys(plans).map(function(id){return Object.assign({id:id},plans[id]||{});}).filter(function(plan){return plan.status==='ACTIVE'&&Number(plan.windowStartAt)<=timestamp&&Number(plan.windowEndAt)>timestamp;}).sort(function(a,b){return Number(b.windowStartAt)-Number(a.windowStartAt);})[0]||null;}
  function activePlanOccurrenceIds(root,plan){return (Array.isArray(plan&&plan.occurrenceIds)?plan.occurrenceIds:[]).filter(function(id){var row=root.occurrences&&root.occurrences[id];return row&&row.status!=='CANCELLED'&&row.status!=='SKIPPED';});}

  function removeRoutineFromOtherAssignments(root,plan,routineId,targetUid,cutoff,timestamp){
    (Array.isArray(plan&&plan.occurrenceIds)?plan.occurrenceIds:[]).forEach(function(id){
      var row=root.occurrences&&root.occurrences[id];if(!row||row.status==='CANCELLED'||row.status==='SKIPPED'||occurrenceAnchor(row)<cutoff||assignedUid(row)===targetUid)return;
      var checklist=Array.isArray(row.checklist)?row.checklist:[],remaining=checklist.filter(function(item){return text(item&&(item.routineItemId||item.id))!==routineId;});if(remaining.length===checklist.length)return;
      row.checklist=remaining;row.routineItemIds=remaining.map(function(item){return text(item.routineItemId||item.id);}).filter(Boolean);row.estimatedMinutes=remaining.reduce(function(sum,item){return sum+(Number(item.estimatedMinutes)||0);},0);
      if(!remaining.length){row.status='CANCELLED';row.assignmentStatus='SKIPPED';row.cancelledAt=timestamp;row.cancelledByUid=targetUid;}
      else{var dueValues=remaining.map(function(item){return Number(item.dueAt)||occurrenceAnchor(row);});row.earliestDueAt=Math.min.apply(Math,dueValues);row.latestDueAt=Math.max.apply(Math,dueValues);row.dueState=remaining.some(function(item){return item.dueState==='OVERDUE';})?'OVERDUE':'DUE_IN_WINDOW';}
      row.updatedAt=timestamp;row.updatedByUid=targetUid;
    });
  }

  function refreshPlanMetadata(root,plan,timestamp,actorUid){
    var ids=activePlanOccurrenceIds(root,plan),loads={},required=[],routineCount=0,total=0,overdue=0,memberOrder=[];
    activeMembers().forEach(function(member){var uid=text(member.uid);if(uid&&memberOrder.indexOf(uid)<0)memberOrder.push(uid);if(uid)loads[uid]={uid:uid,estimatedMinutes:0,bundleCount:0};});
    ids.forEach(function(id){var row=root.occurrences[id],uid=assignedUid(row),minutes=Number(row&&row.estimatedMinutes)||0;routineCount+=(Array.isArray(row&&row.checklist)?row.checklist.length:0);total+=minutes;if(row&&row.dueState==='OVERDUE')overdue++;if(uid){if(required.indexOf(uid)<0)required.push(uid);if(memberOrder.indexOf(uid)<0)memberOrder.push(uid);if(!loads[uid])loads[uid]={uid:uid,estimatedMinutes:0,bundleCount:0};loads[uid].estimatedMinutes+=minutes;loads[uid].bundleCount++;}});
    required.sort();var memberLoads=memberOrder.map(function(uid){return loads[uid];}),values=memberLoads.map(function(load){return load.estimatedMinutes;});
    plan.summary={occurrenceCount:ids.length,routineCount:routineCount,overdueOccurrenceCount:overdue,dueInWindowOccurrenceCount:Math.max(0,ids.length-overdue),totalEstimatedMinutes:total,imbalanceMinutes:values.length?Math.max.apply(Math,values)-Math.min.apply(Math,values):0,memberLoads:memberLoads};
    plan.requiredApprovalUids=required.slice();plan.acceptedApprovalUids=required.slice();plan.declinedApprovalUids=[];plan.approvalSummary={requiredCount:required.length,acceptedCount:required.length,pendingCount:0};if(plan.approvalState!=='ROLLING_APPROVED')plan.approvalState='APPROVED';plan.updatedAt=timestamp;plan.updatedByUid=actorUid;return required;
  }

  function refreshAcceptedPlanApprovals(root,plan,timestamp,actorUid){
    if(!root.approvals||typeof root.approvals!=='object')root.approvals={};
    (Array.isArray(plan.requiredApprovalUids)?plan.requiredApprovalUids:[]).forEach(function(uid){
      if(!root.approvals[uid]||typeof root.approvals[uid]!=='object')root.approvals[uid]={};var existing=root.approvals[uid][plan.id]||{},ownIds=activePlanOccurrenceIds(root,plan).filter(function(id){return assignedUid(root.occurrences[id])===uid;});
      root.approvals[uid][plan.id]={id:plan.id+'__'+uid,householdId:plan.householdId,planId:plan.id,uid:uid,status:'ACCEPTED',occurrenceIds:ownIds,round:Number(plan.approvalRound)||1,standingRoutineConsent:true,acceptedAt:Number(existing.acceptedAt)||timestamp,acceptedByUid:uid,createdAt:Number(existing.createdAt)||timestamp,createdByUid:text(existing.createdByUid)||actorUid,updatedAt:timestamp,updatedByUid:actorUid,schemaVersion:2};
    });
  }

  function injectAcceptedRoutine(root,routineId,targetUid,timestamp){
    var contract=window.CleaningRecurringPlanContract,routine=root.routines&&root.routines[routineId],plan=planContaining(root,timestamp);if(!contract||!routine||!plan)return null;
    var today=new Date(timestamp);today.setHours(0,0,0,0);var cutoff=today.getTime(),rooms={};rooms[routine.roomId]=root.rooms&&root.rooms[routine.roomId];var routines={};routines[routineId]=routine;
    removeRoutineFromOtherAssignments(root,plan,routineId,targetUid,cutoff,timestamp);
    var expanded=contract.expandRoutineSlots({window:{startAt:Number(plan.windowStartAt),endAt:Number(plan.windowEndAt)},rooms:rooms,routines:routines});if(!root.occurrences)root.occurrences={};if(!Array.isArray(plan.occurrenceIds))plan.occurrenceIds=[];
    (expanded.candidates||[]).forEach(function(item){
      var slot=Number(item.slotAt);if(slot<cutoff)return;
      var existingId=plan.occurrenceIds.find(function(id){var row=root.occurrences[id];return row&&row.status!=='CANCELLED'&&text(row.roomId)===text(routine.roomId)&&contract.daySlotAt(occurrenceAnchor(row),{startAt:Number(plan.windowStartAt),endAt:Number(plan.windowEndAt)})===slot&&assignedUid(row)===targetUid;});
      var checklistItem={id:routineId,routineItemId:routineId,title:text(item.title)||'Schoonmaakonderdeel',estimatedMinutes:Number(item.estimatedMinutes)||10,priority:text(item.priority)||'NORMAL',dueAt:Number(item.dueAt)||slot,dueState:item.dueState==='OVERDUE'?'OVERDUE':'DUE_IN_WINDOW',completed:false};
      if(existingId){var existing=root.occurrences[existingId];if((existing.checklist||[]).some(function(row){return text(row.routineItemId||row.id)===routineId;}))return;existing.checklist=(existing.checklist||[]).concat([checklistItem]);existing.routineItemIds=(existing.routineItemIds||[]).concat([routineId]);existing.estimatedMinutes=(Number(existing.estimatedMinutes)||0)+checklistItem.estimatedMinutes;existing.earliestDueAt=Math.min(Number(existing.earliestDueAt)||checklistItem.dueAt,checklistItem.dueAt);existing.latestDueAt=Math.max(Number(existing.latestDueAt)||checklistItem.dueAt,checklistItem.dueAt);existing.updatedAt=timestamp;existing.updatedByUid=targetUid;return;}
      var base=contract.occurrenceIdFor(plan.id,routine.roomId,slot),id=root.occurrences[base]?base+'__uid_'+safe(targetUid):base;
      root.occurrences[id]={id:id,householdId:plan.householdId,planId:plan.id,roomId:routine.roomId,slotAt:slot,routineItemIds:[routineId],checklist:[checklistItem],assignmentUids:[targetUid],assignmentStatus:'ACTIVE',status:'FLEXIBLE',dueState:checklistItem.dueState,earliestDueAt:checklistItem.dueAt,latestDueAt:checklistItem.dueAt,estimatedMinutes:checklistItem.estimatedMinutes,scheduledStartAt:null,scheduledEndAt:null,flexibleWindow:{startAt:slot,endAt:Math.min(Number(plan.windowEndAt),slot+Number(contract.DAY_MS||DAY_MS))},projections:{taskId:null,calendarEventId:null},requestedRoutineAcceptance:true,activatedAt:timestamp,activatedByUid:targetUid,createdAt:timestamp,createdByUid:targetUid,updatedAt:timestamp,updatedByUid:targetUid,schemaVersion:3};plan.occurrenceIds.push(id);
    });
    refreshPlanMetadata(root,plan,timestamp,targetUid);refreshAcceptedPlanApprovals(root,plan,timestamp,targetUid);return plan;
  }

  function resolveRequest(routineId,accept){
    var write;try{write=requireWriteContext();}catch(error){return Promise.reject(error);}var transitionError=null;
    return write.database.ref(write.path).transaction(function(serverRoot){
      if(!contextIsCurrent(write.token)){transitionError=new Error('HOUSEHOLD_CONTEXT_CHANGED');return;}var root=serverRoot&&typeof serverRoot==='object'?clone(serverRoot):{},routine=root.routines&&root.routines[routineId];
      if(!routine||routine.active===false){transitionError=new Error('CLEANING_ROUTINE_NOT_FOUND');return;}if(routine.assignmentRequestStatus!=='PENDING'||text(routine.preferredAssigneeUid)!==text(write.ctx.uid)){transitionError=new Error('CLEANING_ROUTINE_REQUEST_NOT_PENDING');return;}
      var timestamp=now();if(accept){markAccepted(routine,write.ctx.uid,timestamp,write.ctx.uid,'ACCEPTED');injectAcceptedRoutine(root,routineId,write.ctx.uid,timestamp);}else{restoreAssignmentFallback(routine,timestamp,write.ctx.uid,'DECLINED');}transitionError=null;return root;
    }).then(function(result){if(transitionError)throw transitionError;if(!contextIsCurrent(write.token))throw new Error('HOUSEHOLD_CONTEXT_CHANGED_AFTER_WRITE');if(!result||result.committed!==true)throw new Error('CLEANING_ROUTINE_REQUEST_WRITE_NOT_COMMITTED');return true;});
  }

  function proposeCounter(routineId,targetUid){
    var write;try{write=requireWriteContext();}catch(error){return Promise.reject(error);}var transitionError=null,lookup=activeMemberLookup(),target=text(targetUid);if(!target||!lookup[target])return Promise.reject(new Error('CLEANING_ROUTINE_COUNTER_TARGET_INVALID'));
    return write.database.ref(write.path).transaction(function(serverRoot){
      if(!contextIsCurrent(write.token)){transitionError=new Error('HOUSEHOLD_CONTEXT_CHANGED');return;}var root=serverRoot&&typeof serverRoot==='object'?clone(serverRoot):{},routine=root.routines&&root.routines[routineId];
      try{applyCounterProposal(routine,target,write.ctx.uid,now(),lookup);}catch(error){transitionError=error;return;}transitionError=null;return root;
    }).then(function(result){if(transitionError)throw transitionError;if(!contextIsCurrent(write.token))throw new Error('HOUSEHOLD_CONTEXT_CHANGED_AFTER_WRITE');if(!result||result.committed!==true)throw new Error('CLEANING_ROUTINE_COUNTER_WRITE_NOT_COMMITTED');return true;});
  }

  function applyCounterResolution(root,routineId,accept,actorUid,timestamp,memberLookup){
    var routine=root&&root.routines&&root.routines[routineId],actor=text(actorUid),lookup=memberLookup||{},target=text(routine&&routine.assignmentCounterProposedUid);
    if(!routine||routine.active===false)throw new Error('CLEANING_ROUTINE_NOT_FOUND');
    if(text(routine.assignmentRequestStatus)!=='COUNTER_PROPOSED'||text(routine.assignmentRequestedByUid)!==actor)throw new Error('CLEANING_ROUTINE_COUNTER_NOT_PENDING');
    if(!accept){restoreAssignmentFallback(routine,timestamp,actor,'COUNTER_DECLINED');return{state:'RESTORED',targetUid:text(routine.preferredAssigneeUid)||null};}
    if(!target||!lookup[target])throw new Error('CLEANING_ROUTINE_COUNTER_TARGET_INVALID');
    routine.assignmentCounterAcceptedAt=timestamp;routine.assignmentCounterAcceptedByUid=actor;routine.assignmentLastCounterProposedUid=target;routine.assignmentLastCounterProposedByUid=text(routine.assignmentCounterProposedByUid)||null;routine.assignmentLastCounterProposedAt=Number(routine.assignmentCounterProposedAt)||null;
    var fallback=assignmentFallback(routine);
    if(fallback.mode==='FIXED_PERSON'&&fallback.uid===target){
      restoreAssignmentFallback(routine,timestamp,actor,'COUNTER_ACCEPTED_EXISTING');
      routine.assignmentDeclinedAt=null;routine.assignmentDeclinedByUid=null;return{state:'RESTORED_EXISTING',targetUid:target};
    }
    if(target===actor){markAccepted(routine,target,timestamp,actor,'COUNTER_ACCEPTED');injectAcceptedRoutine(root,routineId,target,timestamp);return{state:'ACCEPTED',targetUid:target};}
    routine.assignmentMode='REQUESTED';routine.preferredAssigneeUid=target;routine.assignmentRequestStatus='PENDING';routine.assignmentRequestedByUid=actor;routine.assignmentRequestedAt=timestamp;routine.assignmentAcceptedAt=null;routine.assignmentAcceptedByUid=null;routine.assignmentLastRequestOutcome='COUNTER_ACCEPTED_FORWARDED';routine.assignmentLastRequestResolvedAt=timestamp;routine.assignmentLastRequestResolvedByUid=actor;routine.paused=true;clearActiveCounter(routine);routine.updatedAt=timestamp;routine.updatedByUid=actor;return{state:'FORWARDED',targetUid:target};
  }

  function resolveCounter(routineId,accept){
    var write;try{write=requireWriteContext();}catch(error){return Promise.reject(error);}var transitionError=null,lookup=activeMemberLookup();
    return write.database.ref(write.path).transaction(function(serverRoot){
      if(!contextIsCurrent(write.token)){transitionError=new Error('HOUSEHOLD_CONTEXT_CHANGED');return;}var root=serverRoot&&typeof serverRoot==='object'?clone(serverRoot):{};
      try{applyCounterResolution(root,routineId,!!accept,write.ctx.uid,now(),lookup);}catch(error){transitionError=error;return;}transitionError=null;return root;
    }).then(function(result){if(transitionError)throw transitionError;if(!contextIsCurrent(write.token))throw new Error('HOUSEHOLD_CONTEXT_CHANGED_AFTER_WRITE');if(!result||result.committed!==true)throw new Error('CLEANING_ROUTINE_COUNTER_RESOLUTION_NOT_COMMITTED');return true;});
  }

  function counterTargetFor(routineId){var selects=document.querySelectorAll('#screen-cleaning [data-cleaning-routine-counter-target]');for(var index=0;index<selects.length;index++){if(text(selects[index].getAttribute('data-cleaning-routine-counter-target'))===text(routineId))return text(selects[index].value);}return '';}
  function scrollToForm(selector,inputSelector){window.setTimeout(function(){var form=document.querySelector('#screen-cleaning '+selector);if(!form)return;try{form.scrollIntoView({behavior:'smooth',block:'start'});}catch(e){form.scrollIntoView();}window.setTimeout(function(){var input=form.querySelector(inputSelector);if(input){try{input.focus({preventScroll:true});}catch(e){input.focus();}}},220);},25);}
  function findRoutineEditButton(id){var buttons=document.querySelectorAll('#screen-cleaning [data-cleaning-routine-edit]');for(var index=0;index<buttons.length;index++){if(text(buttons[index].getAttribute('data-cleaning-routine-edit'))===text(id))return buttons[index];}return null;}
  function decorate(){state.queued=false;patchRepository();ensureStyle();decorateRooms();decorateRoutineForm();decorateRoutineRows();decorateRequests();}
  function queue(){if(state.queued)return;state.queued=true;(window.requestAnimationFrame||function(fn){setTimeout(fn,0);})(decorate);}
  function toggleRoom(roomId){state.expanded[roomId]=!state.expanded[roomId];queue();}

  function onClick(event){
    var target=event.target,closest=target&&target.closest?target.closest.bind(target):null;if(!closest)return;
    var roomEdit=closest('[data-cleaning-room-edit]');if(roomEdit){scrollToForm('[data-cleaning-room-form]','[data-cleaning-room-name]');return;}
    var routineEdit=closest('[data-cleaning-routine-edit]');if(routineEdit){var editId=text(routineEdit.getAttribute('data-cleaning-routine-edit'));state.editRoutineId=editId;var editRoutine=routineById(editId);if(editRoutine&&editRoutine.roomId)state.expanded[editRoutine.roomId]=true;scrollToForm('[data-cleaning-routine-form]','[data-cleaning-routine-title]');return;}
    var routineAssign=closest('[data-cleaning-routine-assign]');if(routineAssign){event.preventDefault();event.stopPropagation();var assignId=text(routineAssign.getAttribute('data-cleaning-routine-assign'));state.editRoutineId=assignId;var assignedRoutine=routineById(assignId);if(assignedRoutine&&assignedRoutine.roomId)state.expanded[assignedRoutine.roomId]=true;window.setTimeout(function(){var editButton=findRoutineEditButton(assignId);if(editButton)editButton.click();scrollToForm('[data-cleaning-routine-form]','[data-cleaning-routine-title]');},0);return;}
    var routineAdd=closest('[data-cleaning-routine-add]');if(routineAdd){state.editRoutineId=null;scrollToForm('[data-cleaning-routine-form]','[data-cleaning-routine-title]');return;}var roomAdd=closest('[data-cleaning-room-add]');if(roomAdd){state.editRoutineId=null;scrollToForm('[data-cleaning-room-form]','[data-cleaning-room-name]');return;}
    var expand=closest('[data-cleaning-room-expand]');if(expand){event.preventDefault();event.stopPropagation();toggleRoom(text(expand.getAttribute('data-cleaning-room-expand')));return;}var main=closest('.cleaning-room-card-main');if(main&&!closest('button')){var card=main.closest('.cleaning-room-card');if(card)toggleRoom(text(card.getAttribute('data-cleaning-room-id')));return;}
    var counter=closest('[data-cleaning-routine-request-counter]');if(counter){event.preventDefault();var counterId=text(counter.getAttribute('data-cleaning-routine-request-counter')),counterTarget=counterTargetFor(counterId);proposeCounter(counterId,counterTarget).catch(function(error){console.error('[CleaningRoutineExperience] counter failed',error);});return;}
    var counterAccept=closest('[data-cleaning-routine-counter-accept]');if(counterAccept){event.preventDefault();resolveCounter(text(counterAccept.getAttribute('data-cleaning-routine-counter-accept')),true).catch(function(error){console.error('[CleaningRoutineExperience] counter accept failed',error);});return;}
    var counterDecline=closest('[data-cleaning-routine-counter-decline]');if(counterDecline){event.preventDefault();resolveCounter(text(counterDecline.getAttribute('data-cleaning-routine-counter-decline')),false).catch(function(error){console.error('[CleaningRoutineExperience] counter decline failed',error);});return;}
    var accept=closest('[data-cleaning-routine-request-accept]');if(accept){event.preventDefault();resolveRequest(text(accept.getAttribute('data-cleaning-routine-request-accept')),true).catch(function(error){console.error('[CleaningRoutineExperience] accept failed',error);});return;}var decline=closest('[data-cleaning-routine-request-decline]');if(decline){event.preventDefault();resolveRequest(text(decline.getAttribute('data-cleaning-routine-request-decline')),false).catch(function(error){console.error('[CleaningRoutineExperience] decline failed',error);});}
  }

  function start(){
    if(window.__cleaningRoutineExperienceStarted)return;window.__cleaningRoutineExperienceStarted=true;ensureStyle();patchRepository();document.addEventListener('click',onClick,true);var target=document.getElementById('screen-cleaning')||document.documentElement;if(typeof MutationObserver!=='undefined'){state.observer=new MutationObserver(queue);state.observer.observe(target,{childList:true,subtree:true});}window.addEventListener('familyapp:cleaning-repository',queue);window.addEventListener('familyapp:household-identity-synced',queue);queue();
  }

  window.CleaningRoutineExperience={version:VERSION,start:start,resolveRequest:resolveRequest,proposeCounter:proposeCounter,resolveCounter:resolveCounter,_assignmentPatch:assignmentPatch,_assignmentFallback:assignmentFallback,_restoreAssignmentFallback:restoreAssignmentFallback,_applyCounterProposal:applyCounterProposal,_applyCounterResolution:applyCounterResolution,_injectAcceptedRoutine:injectAcceptedRoutine,_removeRoutineFromOtherAssignments:removeRoutineFromOtherAssignments,_refreshPlanMetadata:refreshPlanMetadata,_currentWeekWindow:currentWeekWindow};
  start();
})();
