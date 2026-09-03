'use strict';
// ============================================================
// CLEANING ROUTINE EXPERIENCE v0.1.0
// Progressive UX for rooms/routines without taking over screen rendering:
// - rooms start collapsed
// - edit actions scroll to the actual form
// - routine repeat scope: ongoing or this week only
// - explicit assignee/request flow with accept/decline
// ============================================================
(function(){
  if(window.CleaningRoutineExperience)return;

  var VERSION='0.1.0';
  var state={observer:null,expanded:{},editRoutineId:null,editRoomId:null,createRoomId:null,repoPatched:false,queued:false};
  var INVALID_KEY=/[.#$\[\]\/\u0000-\u001F\u007F]/g;

  function clone(value){if(value===undefined)return undefined;try{return JSON.parse(JSON.stringify(value));}catch(e){return value;}}
  function text(value){return String(value==null?'':value).trim();}
  function safe(value){return text(value).replace(INVALID_KEY,'_');}
  function now(){return Date.now();}
  function ctx(){try{return window.HouseholdContext&&window.HouseholdContext.snapshot?window.HouseholdContext.snapshot():null;}catch(e){return null;}}
  function db(){try{return window.fbDb||(window.firebase&&window.firebase.database&&window.firebase.database())||null;}catch(e){return null;}}
  function repo(){return window.CleaningHouseholdRepository||null;}
  function snapshot(){try{var r=repo();return r&&r.snapshot?r.snapshot():null;}catch(e){return null;}}
  function data(){var s=snapshot();return s&&s.data||{};}
  function currentUid(){var c=ctx();return text(c&&c.uid);}
  function basePath(){var c=ctx(),domain=window.CleaningDomain;return c&&c.householdId&&domain&&domain.basePath?domain.basePath(c.householdId):null;}
  function members(){
    try{
      var bridge=window.HouseholdIdentityFirebaseBridge;
      var rows=bridge&&bridge.getMembers?bridge.getMembers():[];
      return Array.isArray(rows)?rows.filter(function(row){return row&&text(row.uid)&&text(row.status||'active').toLowerCase()==='active';}).map(clone):[];
    }catch(e){return [];}
  }
  function memberName(uid){var row=members().find(function(item){return text(item.uid)===text(uid);});return row?text(row.displayName||row.name)||'Gezinslid':'Gezinslid';}
  function routineById(id){var rows=data().routines||{};return rows[id]&&typeof rows[id]==='object'?Object.assign({id:id},clone(rows[id])):null;}
  function roomById(id){var rows=data().rooms||{};return rows[id]&&typeof rows[id]==='object'?Object.assign({id:id},clone(rows[id])):null;}

  function ensureStyle(){
    if(document.getElementById('cleaning-routine-experience-style'))return;
    var style=document.createElement('style');
    style.id='cleaning-routine-experience-style';
    style.textContent='\n'
      +'#screen-cleaning .cleaning-room-card:not(.is-expanded) .cleaning-routine-section,#screen-cleaning .cleaning-room-card:not(.is-expanded) .cleaning-routine-empty{display:none!important}\n'
      +'#screen-cleaning .cleaning-room-card:not(.is-expanded){padding-bottom:0}\n'
      +'#screen-cleaning .cleaning-room-card:not(.is-expanded) .cleaning-room-card-copy p{display:none}\n'
      +'#screen-cleaning .cleaning-room-expand-button{width:38px;height:38px;border-radius:12px;border:1px solid var(--cleaning-border);background:var(--cleaning-surface);color:var(--cleaning-text);font:inherit;font-weight:950;cursor:pointer;display:grid;place-items:center}\n'
      +'#screen-cleaning .cleaning-room-expand-button span{transition:transform .18s ease}\n'
      +'#screen-cleaning .cleaning-room-card.is-expanded .cleaning-room-expand-button span{transform:rotate(180deg)}\n'
      +'#screen-cleaning .cleaning-routine-extra-fields{display:grid;gap:12px;padding:14px;border:1px solid var(--cleaning-border);border-radius:16px;background:color-mix(in srgb,var(--cleaning-accent) 5%,var(--cleaning-surface));margin:2px 0 4px}\n'
      +'#screen-cleaning .cleaning-routine-extra-copy{font-size:11px;line-height:1.45;color:var(--cleaning-muted);font-weight:750;margin:0}\n'
      +'#screen-cleaning .cleaning-routine-request-card{display:grid;gap:10px;padding:14px 15px;margin:0 0 14px;border-radius:18px;border:1px solid color-mix(in srgb,var(--cleaning-accent) 25%,var(--cleaning-border));background:color-mix(in srgb,var(--cleaning-accent) 8%,var(--cleaning-surface));box-shadow:0 8px 24px rgba(31,25,55,.06)}\n'
      +'#screen-cleaning .cleaning-routine-request-card strong{font-size:14px;color:var(--cleaning-text)}\n'
      +'#screen-cleaning .cleaning-routine-request-card p{margin:0;font-size:11px;line-height:1.5;color:var(--cleaning-muted);font-weight:750}\n'
      +'#screen-cleaning .cleaning-routine-request-actions{display:flex;gap:8px}\n'
      +'#screen-cleaning .cleaning-routine-request-actions button{flex:1;min-height:44px;border-radius:13px;border:1px solid var(--cleaning-border);font:inherit;font-size:12px;font-weight:950;cursor:pointer}\n'
      +'#screen-cleaning .cleaning-routine-request-accept{background:var(--cleaning-accent);color:white;border-color:transparent!important}\n'
      +'#screen-cleaning .cleaning-routine-request-decline{background:var(--cleaning-surface);color:var(--cleaning-text)}\n'
      +'#screen-cleaning .cleaning-routine-assignment-badge{display:inline-flex;margin-left:6px;padding:2px 7px;border-radius:999px;background:color-mix(in srgb,var(--cleaning-accent) 9%,transparent);color:var(--cleaning-accent);font-size:9px;font-weight:900;vertical-align:middle}\n';
    document.head.appendChild(style);
  }

  function scrollToForm(selector,inputSelector){
    window.setTimeout(function(){
      var form=document.querySelector('#screen-cleaning '+selector);
      if(!form)return;
      try{form.scrollIntoView({behavior:'smooth',block:'start'});}catch(e){form.scrollIntoView();}
      window.setTimeout(function(){var input=form.querySelector(inputSelector);if(input){try{input.focus({preventScroll:true});}catch(e){input.focus();}}},220);
    },20);
  }

  function assigneeValueFor(routine){
    if(!routine)return'AUTO';
    var preferred=text(routine.preferredAssigneeUid);
    if(preferred&&routine.assignmentRequestStatus==='ACCEPTED')return preferred;
    if(preferred&&routine.assignmentRequestStatus==='PENDING')return preferred;
    return'AUTO';
  }

  function repeatValueFor(routine){return routine&&routine.repeatScope==='THIS_WEEK'?'THIS_WEEK':'ONGOING';}

  function extraValues(){
    var form=document.querySelector('#screen-cleaning [data-cleaning-routine-form]');
    var assignee=form&&form.querySelector('[data-cleaning-routine-assignee]');
    var repeat=form&&form.querySelector('[data-cleaning-routine-repeat-scope]');
    return{assignee:text(assignee&&assignee.value)||'AUTO',repeatScope:text(repeat&&repeat.value)==='THIS_WEEK'?'THIS_WEEK':'ONGOING'};
  }

  function assignmentPatch(values){
    var uid=currentUid();
    var selected=text(values&&values.assignee)||'AUTO';
    var patch={repeatScope:values&&values.repeatScope==='THIS_WEEK'?'THIS_WEEK':'ONGOING'};
    if(!selected||selected==='AUTO'){
      patch.assignmentMode='AUTO';
      patch.preferredAssigneeUid=null;
      patch.assignmentRequestStatus='AUTO';
      patch.paused=false;
      return patch;
    }
    patch.preferredAssigneeUid=selected;
    if(selected===uid){
      patch.assignmentMode='FIXED_PERSON';
      patch.assignmentRequestStatus='ACCEPTED';
      patch.assignmentAcceptedByUid=uid;
      patch.assignmentAcceptedAt=now();
      patch.paused=false;
    }else{
      patch.assignmentMode='REQUESTED';
      patch.assignmentRequestStatus='PENDING';
      patch.assignmentRequestedByUid=uid;
      patch.assignmentRequestedAt=now();
      patch.paused=true;
      patch.assignmentAcceptedByUid=null;
      patch.assignmentAcceptedAt=null;
    }
    return patch;
  }

  function directRoutinePatch(id,patch){
    var database=db(),path=basePath();
    if(!database||!path)return Promise.reject(new Error('CLEANING_ROUTINE_EXPERIENCE_DATABASE_UNAVAILABLE'));
    patch=Object.assign({},patch,{updatedAt:now(),updatedByUid:currentUid()});
    return database.ref(path+'/routines/'+safe(id)).update(patch).then(function(){return patch;});
  }

  function patchRepository(){
    var repository=repo();
    if(!repository)return false;
    if(repository.__routineExperienceV1){state.repoPatched=true;return true;}
    if(typeof repository.createRoutineItem!=='function'||typeof repository.updateRoutineItem!=='function')return false;
    var rawCreate=repository.createRoutineItem.bind(repository);
    var rawUpdate=repository.updateRoutineItem.bind(repository);

    repository.createRoutineItem=function(input){
      var values=extraValues();
      var patch=assignmentPatch(values);
      var payload=Object.assign({},input||{},patch);
      return rawCreate(payload);
    };
    repository.updateRoutineItem=function(id,input){
      var values=extraValues();
      var patch=assignmentPatch(values);
      return rawUpdate(id,input).then(function(result){
        return directRoutinePatch(id,patch).then(function(){return Object.assign({},result||{},patch);});
      });
    };
    repository.__routineExperienceV1=true;
    state.repoPatched=true;
    return true;
  }

  function decorateRoutineForm(){
    var form=document.querySelector('#screen-cleaning [data-cleaning-routine-form]');
    if(!form||form.querySelector('[data-cleaning-routine-extra-fields]'))return;
    var routine=state.editRoutineId?routineById(state.editRoutineId):null;
    var uid=currentUid();
    var memberRows=members();
    var currentAssignee=assigneeValueFor(routine);
    var options=['<option value="AUTO"'+(currentAssignee==='AUTO'?' selected':'')+'>Automatisch verdelen</option>'];
    memberRows.forEach(function(member){
      var memberUid=text(member.uid),label=memberUid===uid?'Ikzelf':text(member.displayName||member.name)||'Gezinslid';
      options.push('<option value="'+escapeHtml(memberUid)+'"'+(currentAssignee===memberUid?' selected':'')+'>'+escapeHtml(label)+'</option>');
    });
    var repeat=repeatValueFor(routine);
    var box=document.createElement('div');
    box.className='cleaning-routine-extra-fields';
    box.setAttribute('data-cleaning-routine-extra-fields','1');
    box.innerHTML='<label class="cleaning-field"><span>Wie doet deze routine?</span><select data-cleaning-routine-assignee>'+options.join('')+'</select></label>'
      +'<label class="cleaning-field"><span>Na deze week</span><select data-cleaning-routine-repeat-scope>'
      +'<option value="ONGOING"'+(repeat==='ONGOING'?' selected':'')+'>Doorlopend blijven herhalen</option>'
      +'<option value="THIS_WEEK"'+(repeat==='THIS_WEEK'?' selected':'')+'>Alleen in dit weekplan</option>'
      +'</select></label>'
      +'<p class="cleaning-routine-extra-copy" data-cleaning-routine-extra-copy></p>';
    var actions=form.querySelector('.cleaning-form-actions');
    if(actions)form.insertBefore(box,actions);else form.appendChild(box);
    updateExtraCopy(form);
    var assignee=box.querySelector('[data-cleaning-routine-assignee]');
    var repeatSelect=box.querySelector('[data-cleaning-routine-repeat-scope]');
    if(assignee)assignee.addEventListener('change',function(){updateExtraCopy(form);});
    if(repeatSelect)repeatSelect.addEventListener('change',function(){updateExtraCopy(form);});
  }

  function updateExtraCopy(form){
    var copy=form&&form.querySelector('[data-cleaning-routine-extra-copy]');
    var assignee=form&&form.querySelector('[data-cleaning-routine-assignee]');
    var repeat=form&&form.querySelector('[data-cleaning-routine-repeat-scope]');
    if(!copy)return;
    var selected=text(assignee&&assignee.value)||'AUTO';
    var repeatValue=text(repeat&&repeat.value)||'ONGOING';
    var message=selected==='AUTO'
      ? 'De weekplanner verdeelt deze routine automatisch.'
      : selected===currentUid()
        ? 'Deze routine wordt vast aan jou gekoppeld.'
        : 'Na opslaan krijgt '+memberName(selected)+' bovenaan Schoonmaken een verzoek om deze routine te accepteren of af te wijzen.';
    message+=' '+(repeatValue==='ONGOING'?'Na acceptatie blijft hij ook in volgende weken terugkomen.':'Hij wordt alleen in het huidige weekplan meegenomen.');
    copy.textContent=message;
  }

  function escapeHtml(value){return String(value==null?'':value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}

  function decorateRooms(){
    document.querySelectorAll('#screen-cleaning .cleaning-room-card').forEach(function(card){
      var roomId=text(card.getAttribute('data-cleaning-room-id'));
      if(!roomId)return;
      var expanded=!!state.expanded[roomId];
      card.classList.toggle('is-expanded',expanded);
      var actions=card.querySelector('.cleaning-room-card-actions');
      if(actions&&!actions.querySelector('[data-cleaning-room-expand]')){
        var button=document.createElement('button');
        button.type='button';button.className='cleaning-room-expand-button';button.setAttribute('data-cleaning-room-expand',roomId);button.setAttribute('aria-expanded',expanded?'true':'false');button.setAttribute('aria-label',(expanded?'Kamer inklappen':'Kamer uitklappen'));
        button.innerHTML='<span aria-hidden="true">⌄</span>';
        actions.appendChild(button);
      }else if(actions){
        var existing=actions.querySelector('[data-cleaning-room-expand]');
        if(existing){existing.setAttribute('aria-expanded',expanded?'true':'false');existing.setAttribute('aria-label',expanded?'Kamer inklappen':'Kamer uitklappen');}
      }
    });
  }

  function requestRoutines(){
    var uid=currentUid(),rows=data().routines||{};
    return Object.keys(rows).map(function(id){return Object.assign({id:id},rows[id]||{});}).filter(function(routine){return routine&&routine.active!==false&&routine.assignmentRequestStatus==='PENDING'&&text(routine.preferredAssigneeUid)===uid;});
  }

  function decorateRequests(){
    var panel=document.querySelector('#screen-cleaning .cleaning-panel');
    if(!panel)return;
    var existing=panel.querySelector('[data-cleaning-routine-request-inbox]');
    var requests=requestRoutines();
    if(!requests.length){if(existing)existing.remove();return;}
    var html=requests.map(function(routine){
      var room=roomById(routine.roomId),requester=memberName(routine.assignmentRequestedByUid);
      return '<section class="cleaning-routine-request-card" data-cleaning-routine-request-card="'+escapeHtml(routine.id)+'">'
        +'<strong>'+escapeHtml(requester)+' vraagt jou: '+escapeHtml(routine.title||'Schoonmaakroutine')+'</strong>'
        +'<p>'+escapeHtml(room&&room.name||'Kamer')+' · elke '+escapeHtml(routine.intervalDays||7)+' dagen · '+escapeHtml(routine.estimatedMinutes||0)+' min. '+(repeatValueFor(routine)==='ONGOING'?'Dit verzoek geldt ook voor volgende herhalingen.':'Alleen voor dit weekplan.')+'</p>'
        +'<div class="cleaning-routine-request-actions"><button type="button" class="cleaning-routine-request-decline" data-cleaning-routine-request-decline="'+escapeHtml(routine.id)+'">Afwijzen</button><button type="button" class="cleaning-routine-request-accept" data-cleaning-routine-request-accept="'+escapeHtml(routine.id)+'">Accepteren</button></div>'
        +'</section>';
    }).join('');
    if(!existing){existing=document.createElement('div');existing.setAttribute('data-cleaning-routine-request-inbox','1');panel.insertBefore(existing,panel.firstChild);}
    if(existing.innerHTML!==html)existing.innerHTML=html;
  }

  function decorateRoutineStatus(){
    var rows=data().routines||{};
    document.querySelectorAll('#screen-cleaning [data-cleaning-routine-edit]').forEach(function(button){
      var id=text(button.getAttribute('data-cleaning-routine-edit')),routine=rows[id],item=button.closest('.cleaning-routine-item');
      if(!routine||!item)return;
      var copy=item.querySelector('.cleaning-routine-copy strong');
      if(!copy)return;
      var badge=copy.querySelector('[data-cleaning-routine-assignment-badge]');
      var label='';
      if(routine.assignmentRequestStatus==='PENDING')label='Verzoek naar '+memberName(routine.preferredAssigneeUid);
      else if(routine.assignmentRequestStatus==='ACCEPTED'&&routine.preferredAssigneeUid)label='Vast: '+memberName(routine.preferredAssigneeUid);
      else if(routine.assignmentRequestStatus==='DECLINED')label='Verzoek afgewezen · automatisch';
      if(!label){if(badge)badge.remove();return;}
      if(!badge){badge=document.createElement('span');badge.className='cleaning-routine-assignment-badge';badge.setAttribute('data-cleaning-routine-assignment-badge','1');copy.appendChild(badge);}
      badge.textContent=label;
    });
  }

  function planWindowContaining(root,timestamp){
    var plans=root.plans||{},list=Object.keys(plans).map(function(id){return Object.assign({id:id},plans[id]||{});}).filter(function(plan){return plan.status==='ACTIVE'&&Number(plan.windowStartAt)<=timestamp&&Number(plan.windowEndAt)>timestamp;});
    list.sort(function(a,b){return Number(b.windowStartAt)-Number(a.windowStartAt);});
    return list[0]||null;
  }

  function occurrenceSlot(row,contract,plan){
    var anchor=Number(row&&row.slotAt)||Number(row&&row.flexibleWindow&&row.flexibleWindow.startAt)||Number(row&&row.scheduledStartAt)||Number(row&&row.earliestDueAt)||Number(plan.windowStartAt);
    return contract.daySlotAt(anchor,{startAt:Number(plan.windowStartAt),endAt:Number(plan.windowEndAt)});
  }

  function refreshPlanSummary(root,plan){
    var ids=Array.isArray(plan.occurrenceIds)?plan.occurrenceIds:[],total=0,routineCount=0,overdue=0,loads={};
    ids.forEach(function(id){var row=root.occurrences&&root.occurrences[id];if(!row||row.status==='CANCELLED')return;var min=Number(row.estimatedMinutes)||0,uid=Array.isArray(row.assignmentUids)&&row.assignmentUids[0];total+=min;routineCount+=(Array.isArray(row.checklist)?row.checklist.length:0);if(row.dueState==='OVERDUE')overdue++;if(uid){if(!loads[uid])loads[uid]={uid:uid,estimatedMinutes:0,bundleCount:0};loads[uid].estimatedMinutes+=min;loads[uid].bundleCount++;}});
    var memberLoads=Object.keys(loads).sort().map(function(uid){return loads[uid];}),vals=memberLoads.map(function(load){return load.estimatedMinutes;});
    plan.summary={occurrenceCount:ids.length,routineCount:routineCount,overdueOccurrenceCount:overdue,dueInWindowOccurrenceCount:Math.max(0,ids.length-overdue),totalEstimatedMinutes:total,imbalanceMinutes:vals.length?Math.max.apply(Math,vals)-Math.min.apply(Math,vals):0,memberLoads:memberLoads};
  }

  function injectAcceptedRoutine(root,routineId,targetUid,timestamp){
    var contract=window.CleaningRecurringPlanContract,routine=root.routines&&root.routines[routineId];
    if(!contract||!routine)return;
    var plan=planWindowContaining(root,timestamp);if(!plan)return;
    var today=new Date(timestamp);today.setHours(0,0,0,0);var cutoff=today.getTime();
    var rooms={};rooms[routine.roomId]=root.rooms&&root.rooms[routine.roomId];
    var routines={};routines[routineId]=routine;
    var expanded=contract.expandRoutineSlots({window:{startAt:Number(plan.windowStartAt),endAt:Number(plan.windowEndAt)},rooms:rooms,routines:routines});
    var bundles=contract.bundleSlots({window:{startAt:Number(plan.windowStartAt),endAt:Number(plan.windowEndAt)},rooms:rooms,candidates:expanded.candidates||[]});
    if(!root.occurrences)root.occurrences={};if(!Array.isArray(plan.occurrenceIds))plan.occurrenceIds=[];
    bundles.forEach(function(bundle){
      var slot=Number(bundle.slotAt);if(slot<cutoff)return;
      var existingId=plan.occurrenceIds.find(function(id){var row=root.occurrences[id];return row&&row.status!=='CANCELLED'&&text(row.roomId)===text(routine.roomId)&&occurrenceSlot(row,contract,plan)===slot&&Array.isArray(row.assignmentUids)&&text(row.assignmentUids[0])===targetUid;});
      var item=(bundle.checklist||[]).find(function(entry){return text(entry.routineItemId||entry.id)===routineId;});if(!item)return;
      if(existingId){
        var existing=root.occurrences[existingId];var has=(existing.checklist||[]).some(function(entry){return text(entry.routineItemId||entry.id)===routineId;});if(has)return;
        if(!Array.isArray(existing.checklist))existing.checklist=[];if(!Array.isArray(existing.routineItemIds))existing.routineItemIds=[];
        existing.checklist.push(clone(item));existing.routineItemIds.push(routineId);existing.estimatedMinutes=(Number(existing.estimatedMinutes)||0)+(Number(item.estimatedMinutes)||0);existing.earliestDueAt=Math.min(Number(existing.earliestDueAt)||Number(item.dueAt),Number(item.dueAt));existing.latestDueAt=Math.max(Number(existing.latestDueAt)||Number(item.dueAt),Number(item.dueAt));existing.updatedAt=timestamp;existing.updatedByUid=targetUid;return;
      }
      var base=contract.occurrenceIdFor(plan.id,routine.roomId,slot),id=base;
      if(root.occurrences[id]&&root.occurrences[id].status!=='CANCELLED')id=base+'__uid_'+safe(targetUid);
      root.occurrences[id]={id:id,householdId:plan.householdId,planId:plan.id,roomId:routine.roomId,slotAt:slot,routineItemIds:[routineId],checklist:[clone(item)],assignmentUids:[targetUid],assignmentStatus:'ACTIVE',status:'FLEXIBLE',dueState:item.dueState==='OVERDUE'?'OVERDUE':'DUE_IN_WINDOW',earliestDueAt:Number(item.dueAt)||slot,latestDueAt:Number(item.dueAt)||slot,estimatedMinutes:Number(item.estimatedMinutes)||Number(routine.estimatedMinutes)||10,scheduledStartAt:null,scheduledEndAt:null,flexibleWindow:{startAt:slot,endAt:Math.min(Number(plan.windowEndAt),slot+Number(contract.DAY_MS||86400000))},projections:{taskId:null,calendarEventId:null},recurrenceVersion:1,requestedRoutineAcceptance:true,activatedAt:timestamp,activatedByUid:targetUid,createdAt:timestamp,createdByUid:targetUid,updatedAt:timestamp,updatedByUid:targetUid,schemaVersion:2};
      plan.occurrenceIds.push(id);
    });
    refreshPlanSummary(root,plan);plan.updatedAt=timestamp;plan.updatedByUid=targetUid;
  }

  function resolveRequest(routineId,accept){
    var database=db(),path=basePath(),uid=currentUid();if(!database||!path||!uid)return Promise.reject(new Error('CLEANING_REQUEST_CONTEXT_UNAVAILABLE'));
    var ref=database.ref(path),transitionError=null;
    return ref.transaction(function(serverRoot){
      var root=serverRoot&&typeof serverRoot==='object'?clone(serverRoot):{},routine=root.routines&&root.routines[routineId];
      if(!routine||routine.active===false){transitionError=new Error('CLEANING_ROUTINE_NOT_FOUND');return;}
      if(routine.assignmentRequestStatus!=='PENDING'||text(routine.preferredAssigneeUid)!==uid){transitionError=new Error('CLEANING_ROUTINE_REQUEST_NOT_PENDING');return;}
      var timestamp=now();
      if(accept){
        routine.assignmentMode='FIXED_PERSON';routine.assignmentRequestStatus='ACCEPTED';routine.assignmentAcceptedAt=timestamp;routine.assignmentAcceptedByUid=uid;routine.paused=false;routine.updatedAt=timestamp;routine.updatedByUid=uid;
        injectAcceptedRoutine(root,routineId,uid,timestamp);
      }else{
        routine.assignmentMode='AUTO';routine.assignmentRequestStatus='DECLINED';routine.assignmentDeclinedAt=timestamp;routine.assignmentDeclinedByUid=uid;routine.preferredAssigneeUid=null;routine.paused=false;routine.updatedAt=timestamp;routine.updatedByUid=uid;
      }
      return root;
    }).then(function(result){if(transitionError)throw transitionError;if(!result||result.committed!==true)throw new Error('CLEANING_ROUTINE_REQUEST_WRITE_NOT_COMMITTED');return true;});
  }

  function decorate(){
    state.queued=false;patchRepository();ensureStyle();decorateRooms();decorateRoutineForm();decorateRequests();decorateRoutineStatus();
  }
  function queue(){if(state.queued)return;state.queued=true;(window.requestAnimationFrame||function(fn){setTimeout(fn,0);})(decorate);}

  function onClick(event){
    var expand=event.target.closest&&event.target.closest('[data-cleaning-room-expand]');
    if(expand){event.preventDefault();event.stopPropagation();var roomId=text(expand.getAttribute('data-cleaning-room-expand'));state.expanded[roomId]=!state.expanded[roomId];queue();return;}
    var roomEdit=event.target.closest&&event.target.closest('[data-cleaning-room-edit]');
    if(roomEdit){state.editRoomId=text(roomEdit.getAttribute('data-cleaning-room-edit'));state.editRoutineId=null;scrollToForm('[data-cleaning-room-form]','[data-cleaning-room-name]');return;}
    var routineEdit=event.target.closest&&event.target.closest('[data-cleaning-routine-edit]');
    if(routineEdit){state.editRoutineId=text(routineEdit.getAttribute('data-cleaning-routine-edit'));state.editRoomId=null;scrollToForm('[data-cleaning-routine-form]','[data-cleaning-routine-title]');return;}
    var routineAdd=event.target.closest&&event.target.closest('[data-cleaning-routine-add]');
    if(routineAdd){state.editRoutineId=null;state.createRoomId=text(routineAdd.getAttribute('data-cleaning-routine-add'));scrollToForm('[data-cleaning-routine-form]','[data-cleaning-routine-title]');return;}
    var roomAdd=event.target.closest&&event.target.closest('[data-cleaning-room-add]');
    if(roomAdd){state.editRoutineId=null;state.editRoomId=null;scrollToForm('[data-cleaning-room-form]','[data-cleaning-room-name]');return;}
    var accept=event.target.closest&&event.target.closest('[data-cleaning-routine-request-accept]');
    if(accept){event.preventDefault();resolveRequest(text(accept.getAttribute('data-cleaning-routine-request-accept')),true).catch(function(error){console.error('[CleaningRoutineExperience] accept failed',error);});return;}
    var decline=event.target.closest&&event.target.closest('[data-cleaning-routine-request-decline]');
    if(decline){event.preventDefault();resolveRequest(text(decline.getAttribute('data-cleaning-routine-request-decline')),false).catch(function(error){console.error('[CleaningRoutineExperience] decline failed',error);});}
  }

  function start(){
    if(window.__cleaningRoutineExperienceStarted)return;window.__cleaningRoutineExperienceStarted=true;
    ensureStyle();patchRepository();document.addEventListener('click',onClick,true);
    var target=document.getElementById('screen-cleaning')||document.documentElement;
    if(typeof MutationObserver!=='undefined'){state.observer=new MutationObserver(queue);state.observer.observe(target,{childList:true,subtree:true});}
    window.addEventListener('familyapp:cleaning-repository',queue);window.addEventListener('familyapp:household-identity-synced',queue);queue();
  }

  window.CleaningRoutineExperience={version:VERSION,start:start,resolveRequest:resolveRequest,_assignmentPatch:assignmentPatch,_injectAcceptedRoutine:injectAcceptedRoutine};
  start();
})();
