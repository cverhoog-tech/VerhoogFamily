'use strict';
// ============================================================
// CLEANING ROUTINE EXPERIENCE v0.3.0
// Progressive UX around the canonical Cleaning screen:
// - compact, collapsible rooms
// - visible routine assignment/request entry point
// - ongoing versus this-week-only recurrence choice
// - edit forms scroll into view immediately
// - request acceptance updates current plan summary + approval metadata safely
// ============================================================
(function(){
  if(window.CleaningRoutineExperience)return;

  var VERSION='0.3.0';
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
  function memberName(uid){var member=activeMembers().find(function(row){return text(row.uid)===text(uid);});return member?text(member.displayName||member.name)||'Gezinslid':'Gezinslid';}
  function routineById(id){var routines=cleaningData().routines||{};return routines[id]&&typeof routines[id]==='object'?Object.assign({id:id},clone(routines[id])):null;}
  function roomById(id){var rooms=cleaningData().rooms||{};return rooms[id]&&typeof rooms[id]==='object'?Object.assign({id:id},clone(rooms[id])):null;}

  function currentWeekWindow(timestamp){
    var start=new Date(Number(timestamp)||now());
    start.setHours(0,0,0,0);
    start.setDate(start.getDate()-((start.getDay()+6)%7));
    var end=new Date(start.getTime());end.setDate(end.getDate()+7);
    return{startAt:start.getTime(),endAt:end.getTime()};
  }

  function ensureStyle(){
    if(document.getElementById('cleaning-routine-experience-style'))return;
    var style=document.createElement('style');
    style.id='cleaning-routine-experience-style';
    style.textContent='\n'
      +'#screen-cleaning .cleaning-room-form{scroll-margin-top:92px}\n'
      +'#screen-cleaning .cleaning-room-card:not(.is-expanded) .cleaning-routine-section,#screen-cleaning .cleaning-room-card:not(.is-expanded) .cleaning-routine-empty{display:none!important}\n'
      +'#screen-cleaning .cleaning-room-card:not(.is-expanded){padding-bottom:0}\n'
      +'#screen-cleaning .cleaning-room-card:not(.is-expanded) .cleaning-room-card-copy p{display:none}\n'
      +'#screen-cleaning .cleaning-room-card-main{cursor:pointer}\n'
      +'#screen-cleaning .cleaning-room-expand-button{width:38px;height:38px;border-radius:12px;border:1px solid var(--cleaning-border);background:var(--cleaning-surface);color:var(--cleaning-text);font:inherit;font-weight:950;cursor:pointer;display:grid;place-items:center}\n'
      +'#screen-cleaning .cleaning-room-expand-button span{transition:transform .18s ease}\n'
      +'#screen-cleaning .cleaning-room-card.is-expanded .cleaning-room-expand-button span{transform:rotate(180deg)}\n'
      +'#screen-cleaning .cleaning-room-help{margin:0 0 12px;padding:11px 13px;border-radius:14px;background:color-mix(in srgb,var(--cleaning-accent) 7%,var(--cleaning-surface));color:var(--cleaning-muted);font-size:11px;font-weight:750;line-height:1.45}\n'
      +'#screen-cleaning .cleaning-routine-extra-fields{display:grid;gap:12px;padding:14px;border:1px solid var(--cleaning-border);border-radius:16px;background:color-mix(in srgb,var(--cleaning-accent) 5%,var(--cleaning-surface));margin:2px 0 4px}\n'
      +'#screen-cleaning .cleaning-routine-extra-copy{font-size:11px;line-height:1.45;color:var(--cleaning-muted);font-weight:750;margin:0}\n'
      +'#screen-cleaning .cleaning-routine-assign-button{border:1px solid color-mix(in srgb,var(--cleaning-accent) 35%,var(--cleaning-border));background:color-mix(in srgb,var(--cleaning-accent) 8%,var(--cleaning-surface));color:var(--cleaning-accent);border-radius:10px;padding:6px 9px;font:inherit;font-size:10px;font-weight:950;cursor:pointer}\n'
      +'#screen-cleaning .cleaning-routine-assignment-badge{display:inline-flex;margin-left:6px;padding:2px 7px;border-radius:999px;background:color-mix(in srgb,var(--cleaning-accent) 9%,transparent);color:var(--cleaning-accent);font-size:9px;font-weight:900;vertical-align:middle}\n'
      +'#screen-cleaning .cleaning-routine-request-card{display:grid;gap:10px;padding:14px 15px;margin:0 0 14px;border-radius:18px;border:1px solid color-mix(in srgb,var(--cleaning-accent) 25%,var(--cleaning-border));background:color-mix(in srgb,var(--cleaning-accent) 8%,var(--cleaning-surface));box-shadow:0 8px 24px rgba(31,25,55,.06)}\n'
      +'#screen-cleaning .cleaning-routine-request-card strong{font-size:14px;color:var(--cleaning-text)}\n'
      +'#screen-cleaning .cleaning-routine-request-card p{margin:0;font-size:11px;line-height:1.5;color:var(--cleaning-muted);font-weight:750}\n'
      +'#screen-cleaning .cleaning-routine-request-actions{display:flex;gap:8px}\n'
      +'#screen-cleaning .cleaning-routine-request-actions button{flex:1;min-height:44px;border-radius:13px;border:1px solid var(--cleaning-border);font:inherit;font-size:12px;font-weight:950;cursor:pointer}\n'
      +'#screen-cleaning .cleaning-routine-request-accept{background:var(--cleaning-accent);color:white;border-color:transparent!important}\n'
      +'#screen-cleaning .cleaning-routine-request-decline{background:var(--cleaning-surface);color:var(--cleaning-text)}\n';
    document.head.appendChild(style);
  }

  function formValues(){
    var form=document.querySelector('#screen-cleaning [data-cleaning-routine-form]');
    var assignee=form&&form.querySelector('[data-cleaning-routine-assignee]');
    var repeat=form&&form.querySelector('[data-cleaning-routine-repeat-scope]');
    return{assignee:text(assignee&&assignee.value)||'AUTO',repeatScope:text(repeat&&repeat.value)==='THIS_WEEK'?'THIS_WEEK':'ONGOING'};
  }

  function assignmentPatch(values,existing){
    var selected=text(values&&values.assignee)||'AUTO';
    var repeatScope=values&&values.repeatScope==='THIS_WEEK'?'THIS_WEEK':'ONGOING';
    var uid=currentUid(),patch={repeatScope:repeatScope};
    var scope=currentWeekWindow();
    patch.repeatScopeWeekStartAt=repeatScope==='THIS_WEEK'?scope.startAt:null;
    patch.repeatScopeWeekEndAt=repeatScope==='THIS_WEEK'?scope.endAt:null;

    if(!selected||selected==='AUTO'){
      patch.assignmentMode='AUTO';patch.preferredAssigneeUid=null;patch.assignmentRequestStatus='AUTO';patch.paused=false;
      patch.assignmentRequestedByUid=null;patch.assignmentRequestedAt=null;patch.assignmentAcceptedByUid=null;patch.assignmentAcceptedAt=null;
      return patch;
    }
    if(selected===uid){
      patch.assignmentMode='FIXED_PERSON';patch.preferredAssigneeUid=uid;patch.assignmentRequestStatus='ACCEPTED';patch.paused=false;
      patch.assignmentAcceptedByUid=uid;patch.assignmentAcceptedAt=Number(existing&&existing.assignmentAcceptedAt)||now();
      return patch;
    }
    if(existing&&text(existing.preferredAssigneeUid)===selected&&text(existing.assignmentRequestStatus)==='ACCEPTED'){
      patch.assignmentMode='FIXED_PERSON';patch.preferredAssigneeUid=selected;patch.assignmentRequestStatus='ACCEPTED';patch.paused=false;
      patch.assignmentAcceptedByUid=selected;patch.assignmentAcceptedAt=Number(existing.assignmentAcceptedAt)||now();
      return patch;
    }
    patch.assignmentMode='REQUESTED';patch.preferredAssigneeUid=selected;patch.assignmentRequestStatus='PENDING';patch.paused=true;
    patch.assignmentRequestedByUid=uid;patch.assignmentRequestedAt=now();patch.assignmentAcceptedByUid=null;patch.assignmentAcceptedAt=null;
    return patch;
  }

  function requireWriteContext(){
    var ctx=contextSnapshot(),database=firebaseDb(),token=captureContext();
    if(!ctx||ctx.ready!==true||!ctx.uid||!ctx.householdId)throw new Error('ACTIVE_HOUSEHOLD_REQUIRED');
    if(!database)throw new Error('FIREBASE_DATABASE_UNAVAILABLE');
    if(!token||!contextIsCurrent(token))throw new Error('HOUSEHOLD_CONTEXT_CHANGED');
    var path=cleaningPathFor(ctx.householdId);if(!path)throw new Error('ACTIVE_HOUSEHOLD_REQUIRED');
    return{ctx:ctx,database:database,token:token,path:path};
  }

  function directRoutineUpdate(id,input,extra){
    var write,domain=window.CleaningDomain;
    try{write=requireWriteContext();}catch(error){return Promise.reject(error);}
    if(!domain||typeof domain.normalizeRoutineItem!=='function')return Promise.reject(new Error('CLEANING_ROUTINE_UPDATE_UNAVAILABLE'));
    var transitionError=null,timestamp=now();
    return write.database.ref(write.path+'/routines/'+safe(id)).transaction(function(serverRoutine){
      if(!contextIsCurrent(write.token)){transitionError=new Error('HOUSEHOLD_CONTEXT_CHANGED');return;}
      if(!serverRoutine||typeof serverRoutine!=='object'){transitionError=new Error('CLEANING_ROUTINE_NOT_FOUND');return;}
      if(serverRoutine.active===false){transitionError=new Error('CLEANING_ROUTINE_INACTIVE');return;}
      var normalized=domain.normalizeRoutineItem(Object.assign({},clone(serverRoutine),input||{},extra||{}),id);
      if(!normalized.title){transitionError=new Error('CLEANING_ROUTINE_TITLE_REQUIRED');return;}
      normalized.id=serverRoutine.id||id;normalized.householdId=serverRoutine.householdId;normalized.createdAt=serverRoutine.createdAt;normalized.createdByUid=serverRoutine.createdByUid;
      normalized.updatedAt=timestamp;normalized.updatedByUid=write.ctx.uid;transitionError=null;return normalized;
    }).then(function(result){
      if(transitionError)throw transitionError;
      if(!contextIsCurrent(write.token))throw new Error('HOUSEHOLD_CONTEXT_CHANGED_AFTER_WRITE');
      if(!result||result.committed!==true)throw new Error('CLEANING_ROUTINE_UPDATE_NOT_COMMITTED');
      return result.snapshot&&result.snapshot.val?clone(result.snapshot.val()):null;
    });
  }

  function patchRepository(){
    var repo=repository();
    if(!repo)return false;
    if(repo.__routineExperienceV3){state.repoPatched=true;return true;}
    if(typeof repo.createRoutineItem!=='function'||typeof repo.updateRoutineItem!=='function')return false;
    var rawCreate=repo.createRoutineItem.bind(repo);
    repo.createRoutineItem=function(input){
      var values=input&&input.templateKey?{assignee:'AUTO',repeatScope:'ONGOING'}:formValues();
      var extra=assignmentPatch(values,null);
      return rawCreate(Object.assign({},input||{},extra));
    };
    repo.updateRoutineItem=function(id,input){var existing=routineById(id),extra=assignmentPatch(formValues(),existing);return directRoutineUpdate(id,input,extra);};
    repo.__routineExperienceV3=true;state.repoPatched=true;return true;
  }

  function updateFormCopy(form){
    var copy=form&&form.querySelector('[data-cleaning-routine-extra-copy]');
    var assignee=form&&form.querySelector('[data-cleaning-routine-assignee]');
    var repeat=form&&form.querySelector('[data-cleaning-routine-repeat-scope]');
    if(!copy)return;
    var selected=text(assignee&&assignee.value)||'AUTO',repeatValue=text(repeat&&repeat.value)||'ONGOING';
    var message=selected==='AUTO'?'De weekplanner verdeelt deze routine automatisch.':selected===currentUid()?'Deze routine wordt vast aan jou gekoppeld.':'Na opslaan krijgt '+memberName(selected)+' bovenaan Schoonmaken een duidelijk verzoek met Accepteren en Afwijzen.';
    message+=' '+(repeatValue==='ONGOING'?'Na acceptatie wordt hij ook vier weken vooruit gepland en blijft de horizon doorrollen.':'Hij blijft uitsluitend onderdeel van het huidige weekplan.');
    if(copy.textContent!==message)copy.textContent=message;
  }

  function decorateRoutineForm(){
    var form=document.querySelector('#screen-cleaning [data-cleaning-routine-form]');
    if(!form||form.querySelector('[data-cleaning-routine-extra-fields]'))return;
    var routine=state.editRoutineId?routineById(state.editRoutineId):null;
    var uid=currentUid(),selected=routine&&routine.preferredAssigneeUid?text(routine.preferredAssigneeUid):'AUTO';
    if(!routine||!routine.preferredAssigneeUid)selected='AUTO';
    var options=['<option value="AUTO"'+(selected==='AUTO'?' selected':'')+'>Automatisch eerlijk verdelen</option>'];
    activeMembers().forEach(function(member){var memberUid=text(member.uid),label=memberUid===uid?'Ikzelf':text(member.displayName||member.name)||'Gezinslid';options.push('<option value="'+escapeHtml(memberUid)+'"'+(selected===memberUid?' selected':'')+'>'+escapeHtml(label)+'</option>');});
    var repeat=routine&&routine.repeatScope==='THIS_WEEK'?'THIS_WEEK':'ONGOING';
    var box=document.createElement('div');box.className='cleaning-routine-extra-fields';box.setAttribute('data-cleaning-routine-extra-fields','1');
    box.innerHTML='<label class="cleaning-field"><span>Wie doet deze routine?</span><select data-cleaning-routine-assignee>'+options.join('')+'</select></label>'
      +'<label class="cleaning-field"><span>Herhalen na deze week?</span><select data-cleaning-routine-repeat-scope><option value="ONGOING"'+(repeat==='ONGOING'?' selected':'')+'>Ja · doorlopend, vier weken vooruit</option><option value="THIS_WEEK"'+(repeat==='THIS_WEEK'?' selected':'')+'>Nee · alleen dit weekplan</option></select></label>'
      +'<p class="cleaning-routine-extra-copy" data-cleaning-routine-extra-copy></p>';
    var actions=form.querySelector('.cleaning-form-actions');if(actions)form.insertBefore(box,actions);else form.appendChild(box);
    Array.prototype.forEach.call(box.querySelectorAll('select'),function(select){select.addEventListener('change',function(){updateFormCopy(form);});});updateFormCopy(form);
  }

  function decorateRooms(){
    var grid=document.querySelector('#screen-cleaning .cleaning-room-grid');
    if(grid){
      var previous=grid.previousElementSibling;
      if(!previous||!previous.matches||!previous.matches('[data-cleaning-room-help]')){
        var help=document.createElement('p');help.className='cleaning-room-help';help.setAttribute('data-cleaning-room-help','1');help.textContent='Kamers staan standaard ingeklapt. Open een kamer voor de routines. Gebruik Toewijzen om een routine aan jezelf of een ander gezinslid te vragen.';grid.parentNode.insertBefore(help,grid);
      }
    }
    Array.prototype.forEach.call(document.querySelectorAll('#screen-cleaning .cleaning-room-card'),function(card){
      var roomId=text(card.getAttribute('data-cleaning-room-id'));if(!roomId)return;
      var expanded=!!state.expanded[roomId];card.classList.toggle('is-expanded',expanded);
      var actions=card.querySelector('.cleaning-room-card-actions');
      if(actions&&!actions.querySelector('[data-cleaning-room-expand]')){
        var expandButton=document.createElement('button');expandButton.type='button';expandButton.className='cleaning-room-expand-button';expandButton.setAttribute('data-cleaning-room-expand',roomId);expandButton.innerHTML='<span aria-hidden="true">⌄</span>';actions.appendChild(expandButton);
      }
      var button=actions&&actions.querySelector('[data-cleaning-room-expand]');if(button){button.setAttribute('aria-expanded',expanded?'true':'false');button.setAttribute('aria-label',expanded?'Kamer inklappen':'Kamer uitklappen');}
    });
  }

  function decorateRoutineRows(){
    var rows=cleaningData().routines||{};
    Array.prototype.forEach.call(document.querySelectorAll('#screen-cleaning [data-cleaning-routine-edit]'),function(edit){
      var id=text(edit.getAttribute('data-cleaning-routine-edit')),routine=rows[id],item=edit.closest('.cleaning-routine-item'),actions=item&&item.querySelector('.cleaning-routine-item-actions');
      if(!routine||!item||!actions)return;
      if(!actions.querySelector('[data-cleaning-routine-assign]')){var assign=document.createElement('button');assign.type='button';assign.className='cleaning-routine-assign-button';assign.setAttribute('data-cleaning-routine-assign',id);assign.textContent='Toewijzen';actions.insertBefore(assign,edit);}
      var title=item.querySelector('.cleaning-routine-copy strong'),badge=title&&title.querySelector('[data-cleaning-routine-assignment-badge]'),label='';
      if(routine.assignmentRequestStatus==='PENDING')label='Verzoek naar '+memberName(routine.preferredAssigneeUid);
      else if(routine.assignmentRequestStatus==='ACCEPTED'&&routine.preferredAssigneeUid)label='Vast: '+memberName(routine.preferredAssigneeUid);
      else if(routine.assignmentRequestStatus==='DECLINED')label='Afgewezen · automatisch';
      if(!label){if(badge)badge.remove();return;}
      if(!badge){badge=document.createElement('span');badge.className='cleaning-routine-assignment-badge';badge.setAttribute('data-cleaning-routine-assignment-badge','1');title.appendChild(badge);}
      if(badge.textContent!==label)badge.textContent=label;
    });
  }

  function pendingRequests(){
    var uid=currentUid(),rows=cleaningData().routines||{};
    return Object.keys(rows).map(function(id){return Object.assign({id:id},rows[id]||{});}).filter(function(routine){return routine&&routine.active!==false&&routine.assignmentRequestStatus==='PENDING'&&text(routine.preferredAssigneeUid)===uid;});
  }

  function decorateRequests(){
    var panel=document.querySelector('#screen-cleaning .cleaning-panel');if(!panel)return;
    var inbox=panel.querySelector('[data-cleaning-routine-request-inbox]'),requests=pendingRequests();if(!requests.length){if(inbox)inbox.remove();return;}
    var html=requests.map(function(routine){var room=roomById(routine.roomId),requester=memberName(routine.assignmentRequestedByUid);return '<section class="cleaning-routine-request-card"><strong>'+escapeHtml(requester)+' vraagt jou: '+escapeHtml(routine.title||'Schoonmaakroutine')+'</strong><p>'+escapeHtml(room&&room.name||'Kamer')+' · elke '+escapeHtml(routine.intervalDays||7)+' dagen · '+escapeHtml(routine.estimatedMinutes||0)+' min. '+(routine.repeatScope==='THIS_WEEK'?'Alleen dit weekplan.':'Dit is een doorlopende routine.')+'</p><div class="cleaning-routine-request-actions"><button type="button" class="cleaning-routine-request-decline" data-cleaning-routine-request-decline="'+escapeHtml(routine.id)+'">Afwijzen</button><button type="button" class="cleaning-routine-request-accept" data-cleaning-routine-request-accept="'+escapeHtml(routine.id)+'">Accepteren</button></div></section>';}).join('');
    if(!inbox){inbox=document.createElement('div');inbox.setAttribute('data-cleaning-routine-request-inbox','1');panel.insertBefore(inbox,panel.firstChild);}if(inbox.innerHTML!==html)inbox.innerHTML=html;
  }

  function assignedUid(row){var ids=row&&Array.isArray(row.assignmentUids)?row.assignmentUids.filter(Boolean).map(String):[];return ids.length===1?ids[0]:null;}

  function planContaining(root,timestamp){
    var plans=root.plans||{};return Object.keys(plans).map(function(id){return Object.assign({id:id},plans[id]||{});}).filter(function(plan){return plan.status==='ACTIVE'&&Number(plan.windowStartAt)<=timestamp&&Number(plan.windowEndAt)>timestamp;}).sort(function(a,b){return Number(b.windowStartAt)-Number(a.windowStartAt);})[0]||null;
  }

  function activePlanOccurrenceIds(root,plan){
    return (Array.isArray(plan&&plan.occurrenceIds)?plan.occurrenceIds:[]).filter(function(id){var row=root.occurrences&&root.occurrences[id];return row&&row.status!=='CANCELLED'&&row.status!=='SKIPPED';});
  }

  function refreshPlanMetadata(root,plan,timestamp,actorUid){
    var ids=activePlanOccurrenceIds(root,plan),loads={},required=[],routineCount=0,total=0,overdue=0;
    activeMembers().forEach(function(member){loads[text(member.uid)]={uid:text(member.uid),estimatedMinutes:0,bundleCount:0};});
    ids.forEach(function(id){
      var row=root.occurrences[id],uid=assignedUid(row),minutes=Number(row&&row.estimatedMinutes)||0;
      routineCount+=(Array.isArray(row&&row.checklist)?row.checklist.length:0);total+=minutes;if(row&&row.dueState==='OVERDUE')overdue++;
      if(uid){if(required.indexOf(uid)<0)required.push(uid);if(!loads[uid])loads[uid]={uid:uid,estimatedMinutes:0,bundleCount:0};loads[uid].estimatedMinutes+=minutes;loads[uid].bundleCount++;}
    });
    required.sort();
    var memberLoads=Object.keys(loads).sort().map(function(uid){return loads[uid];}),values=memberLoads.map(function(load){return load.estimatedMinutes;});
    plan.summary={occurrenceCount:ids.length,routineCount:routineCount,overdueOccurrenceCount:overdue,dueInWindowOccurrenceCount:Math.max(0,ids.length-overdue),totalEstimatedMinutes:total,imbalanceMinutes:values.length?Math.max.apply(Math,values)-Math.min.apply(Math,values):0,memberLoads:memberLoads};
    plan.requiredApprovalUids=required.slice();plan.acceptedApprovalUids=required.slice();plan.declinedApprovalUids=[];
    plan.approvalSummary={requiredCount:required.length,acceptedCount:required.length,pendingCount:0};
    if(plan.approvalState!=='ROLLING_APPROVED')plan.approvalState='APPROVED';
    plan.updatedAt=timestamp;plan.updatedByUid=actorUid;
  }

  function ensureAcceptedPlanApproval(root,plan,uid,timestamp,actorUid){
    if(!root.approvals||typeof root.approvals!=='object')root.approvals={};
    if(!root.approvals[uid]||typeof root.approvals[uid]!=='object')root.approvals[uid]={};
    var existing=root.approvals[uid][plan.id]||{};
    var ownIds=activePlanOccurrenceIds(root,plan).filter(function(id){return assignedUid(root.occurrences[id])===uid;});
    root.approvals[uid][plan.id]={
      id:plan.id+'__'+uid,householdId:plan.householdId,planId:plan.id,uid:uid,status:'ACCEPTED',occurrenceIds:ownIds,
      round:Number(plan.approvalRound)||1,standingRoutineConsent:true,acceptedAt:Number(existing.acceptedAt)||timestamp,acceptedByUid:uid,
      createdAt:Number(existing.createdAt)||timestamp,createdByUid:text(existing.createdByUid)||actorUid,updatedAt:timestamp,updatedByUid:actorUid,schemaVersion:2
    };
  }

  function injectAcceptedRoutine(root,routineId,targetUid,timestamp){
    var contract=window.CleaningRecurringPlanContract,routine=root.routines&&root.routines[routineId],plan=planContaining(root,timestamp);if(!contract||!routine||!plan)return null;
    var today=new Date(timestamp);today.setHours(0,0,0,0);var cutoff=today.getTime(),rooms={};rooms[routine.roomId]=root.rooms&&root.rooms[routine.roomId];var routines={};routines[routineId]=routine;
    var expanded=contract.expandRoutineSlots({window:{startAt:Number(plan.windowStartAt),endAt:Number(plan.windowEndAt)},rooms:rooms,routines:routines});
    if(!root.occurrences)root.occurrences={};if(!Array.isArray(plan.occurrenceIds))plan.occurrenceIds=[];
    (expanded.candidates||[]).forEach(function(item){
      var slot=Number(item.slotAt);if(slot<cutoff)return;
      var existingId=plan.occurrenceIds.find(function(id){var row=root.occurrences[id],anchor=Number(row&&row.slotAt)||Number(row&&row.flexibleWindow&&row.flexibleWindow.startAt)||Number(row&&row.earliestDueAt);return row&&row.status!=='CANCELLED'&&text(row.roomId)===text(routine.roomId)&&contract.daySlotAt(anchor,{startAt:Number(plan.windowStartAt),endAt:Number(plan.windowEndAt)})===slot&&assignedUid(row)===targetUid;});
      var checklistItem={id:routineId,routineItemId:routineId,title:text(item.title)||'Schoonmaakonderdeel',estimatedMinutes:Number(item.estimatedMinutes)||10,priority:text(item.priority)||'NORMAL',dueAt:Number(item.dueAt)||slot,dueState:item.dueState==='OVERDUE'?'OVERDUE':'DUE_IN_WINDOW',completed:false};
      if(existingId){
        var existing=root.occurrences[existingId];if((existing.checklist||[]).some(function(row){return text(row.routineItemId||row.id)===routineId;}))return;
        existing.checklist=(existing.checklist||[]).concat([checklistItem]);existing.routineItemIds=(existing.routineItemIds||[]).concat([routineId]);existing.estimatedMinutes=(Number(existing.estimatedMinutes)||0)+checklistItem.estimatedMinutes;
        existing.earliestDueAt=Math.min(Number(existing.earliestDueAt)||checklistItem.dueAt,checklistItem.dueAt);existing.latestDueAt=Math.max(Number(existing.latestDueAt)||checklistItem.dueAt,checklistItem.dueAt);
        existing.updatedAt=timestamp;existing.updatedByUid=targetUid;return;
      }
      var base=contract.occurrenceIdFor(plan.id,routine.roomId,slot),id=root.occurrences[base]?base+'__uid_'+safe(targetUid):base;
      root.occurrences[id]={id:id,householdId:plan.householdId,planId:plan.id,roomId:routine.roomId,slotAt:slot,routineItemIds:[routineId],checklist:[checklistItem],assignmentUids:[targetUid],assignmentStatus:'ACTIVE',status:'FLEXIBLE',dueState:checklistItem.dueState,earliestDueAt:checklistItem.dueAt,latestDueAt:checklistItem.dueAt,estimatedMinutes:checklistItem.estimatedMinutes,scheduledStartAt:null,scheduledEndAt:null,flexibleWindow:{startAt:slot,endAt:Math.min(Number(plan.windowEndAt),slot+Number(contract.DAY_MS||DAY_MS))},projections:{taskId:null,calendarEventId:null},requestedRoutineAcceptance:true,activatedAt:timestamp,activatedByUid:targetUid,createdAt:timestamp,createdByUid:targetUid,updatedAt:timestamp,updatedByUid:targetUid,schemaVersion:3};plan.occurrenceIds.push(id);
    });
    refreshPlanMetadata(root,plan,timestamp,targetUid);ensureAcceptedPlanApproval(root,plan,targetUid,timestamp,targetUid);return plan;
  }

  function resolveRequest(routineId,accept){
    var write;try{write=requireWriteContext();}catch(error){return Promise.reject(error);}
    var transitionError=null;
    return write.database.ref(write.path).transaction(function(serverRoot){
      if(!contextIsCurrent(write.token)){transitionError=new Error('HOUSEHOLD_CONTEXT_CHANGED');return;}
      var root=serverRoot&&typeof serverRoot==='object'?clone(serverRoot):{},routine=root.routines&&root.routines[routineId];
      if(!routine||routine.active===false){transitionError=new Error('CLEANING_ROUTINE_NOT_FOUND');return;}
      if(routine.assignmentRequestStatus!=='PENDING'||text(routine.preferredAssigneeUid)!==text(write.ctx.uid)){transitionError=new Error('CLEANING_ROUTINE_REQUEST_NOT_PENDING');return;}
      var timestamp=now();
      if(accept){routine.assignmentMode='FIXED_PERSON';routine.assignmentRequestStatus='ACCEPTED';routine.assignmentAcceptedAt=timestamp;routine.assignmentAcceptedByUid=write.ctx.uid;routine.paused=false;routine.updatedAt=timestamp;routine.updatedByUid=write.ctx.uid;injectAcceptedRoutine(root,routineId,write.ctx.uid,timestamp);}
      else{routine.assignmentMode='AUTO';routine.assignmentRequestStatus='DECLINED';routine.assignmentDeclinedAt=timestamp;routine.assignmentDeclinedByUid=write.ctx.uid;routine.preferredAssigneeUid=null;routine.paused=false;routine.updatedAt=timestamp;routine.updatedByUid=write.ctx.uid;}
      transitionError=null;return root;
    }).then(function(result){
      if(transitionError)throw transitionError;if(!contextIsCurrent(write.token))throw new Error('HOUSEHOLD_CONTEXT_CHANGED_AFTER_WRITE');
      if(!result||result.committed!==true)throw new Error('CLEANING_ROUTINE_REQUEST_WRITE_NOT_COMMITTED');return true;
    });
  }

  function scrollToForm(selector,inputSelector){window.setTimeout(function(){var form=document.querySelector('#screen-cleaning '+selector);if(!form)return;try{form.scrollIntoView({behavior:'smooth',block:'start'});}catch(e){form.scrollIntoView();}window.setTimeout(function(){var input=form.querySelector(inputSelector);if(input){try{input.focus({preventScroll:true});}catch(e){input.focus();}}},220);},25);}

  function findRoutineEditButton(id){
    var buttons=document.querySelectorAll('#screen-cleaning [data-cleaning-routine-edit]');
    for(var index=0;index<buttons.length;index++){if(text(buttons[index].getAttribute('data-cleaning-routine-edit'))===text(id))return buttons[index];}
    return null;
  }

  function decorate(){state.queued=false;patchRepository();ensureStyle();decorateRooms();decorateRoutineForm();decorateRoutineRows();decorateRequests();}
  function queue(){if(state.queued)return;state.queued=true;(window.requestAnimationFrame||function(fn){setTimeout(fn,0);})(decorate);}
  function toggleRoom(roomId){state.expanded[roomId]=!state.expanded[roomId];queue();}

  function onClick(event){
    var target=event.target,closest=target&&target.closest?target.closest.bind(target):null;if(!closest)return;
    var roomEdit=closest('[data-cleaning-room-edit]');if(roomEdit){scrollToForm('[data-cleaning-room-form]','[data-cleaning-room-name]');return;}
    var routineEdit=closest('[data-cleaning-routine-edit]');if(routineEdit){var editId=text(routineEdit.getAttribute('data-cleaning-routine-edit'));state.editRoutineId=editId;var editRoutine=routineById(editId);if(editRoutine&&editRoutine.roomId)state.expanded[editRoutine.roomId]=true;scrollToForm('[data-cleaning-routine-form]','[data-cleaning-routine-title]');return;}
    var routineAssign=closest('[data-cleaning-routine-assign]');if(routineAssign){
      event.preventDefault();event.stopPropagation();var assignId=text(routineAssign.getAttribute('data-cleaning-routine-assign'));state.editRoutineId=assignId;var assignedRoutine=routineById(assignId);if(assignedRoutine&&assignedRoutine.roomId)state.expanded[assignedRoutine.roomId]=true;
      window.setTimeout(function(){var editButton=findRoutineEditButton(assignId);if(editButton)editButton.click();scrollToForm('[data-cleaning-routine-form]','[data-cleaning-routine-title]');},0);return;
    }
    var routineAdd=closest('[data-cleaning-routine-add]');if(routineAdd){state.editRoutineId=null;scrollToForm('[data-cleaning-routine-form]','[data-cleaning-routine-title]');return;}
    var roomAdd=closest('[data-cleaning-room-add]');if(roomAdd){state.editRoutineId=null;scrollToForm('[data-cleaning-room-form]','[data-cleaning-room-name]');return;}
    var expand=closest('[data-cleaning-room-expand]');if(expand){event.preventDefault();event.stopPropagation();toggleRoom(text(expand.getAttribute('data-cleaning-room-expand')));return;}
    var main=closest('.cleaning-room-card-main');if(main&&!closest('button')){var card=main.closest('.cleaning-room-card');if(card)toggleRoom(text(card.getAttribute('data-cleaning-room-id')));return;}
    var accept=closest('[data-cleaning-routine-request-accept]');if(accept){event.preventDefault();resolveRequest(text(accept.getAttribute('data-cleaning-routine-request-accept')),true).catch(function(error){console.error('[CleaningRoutineExperience] accept failed',error);});return;}
    var decline=closest('[data-cleaning-routine-request-decline]');if(decline){event.preventDefault();resolveRequest(text(decline.getAttribute('data-cleaning-routine-request-decline')),false).catch(function(error){console.error('[CleaningRoutineExperience] decline failed',error);});}
  }

  function start(){
    if(window.__cleaningRoutineExperienceStarted)return;window.__cleaningRoutineExperienceStarted=true;ensureStyle();patchRepository();document.addEventListener('click',onClick,true);
    var target=document.getElementById('screen-cleaning')||document.documentElement;if(typeof MutationObserver!=='undefined'){state.observer=new MutationObserver(queue);state.observer.observe(target,{childList:true,subtree:true});}
    window.addEventListener('familyapp:cleaning-repository',queue);window.addEventListener('familyapp:household-identity-synced',queue);queue();
  }

  window.CleaningRoutineExperience={version:VERSION,start:start,resolveRequest:resolveRequest,_assignmentPatch:assignmentPatch,_injectAcceptedRoutine:injectAcceptedRoutine,_refreshPlanMetadata:refreshPlanMetadata,_currentWeekWindow:currentWeekWindow};
  start();
})();
