'use strict';
// ============================================================
// CLEANING PLAN SANITIZER v0.2.0
// Removes references to unavailable rooms/routines from non-rolling live plans.
// Deleted or temporarily paused routines may no longer remain inside the
// current Planning view or derived Task/Calendar set. Historical occurrence
// records stay available. ActivePlanReconciler remains the owner that ADDS new
// work; this service only removes/trims stale work, then hands back to it.
// ============================================================
(function(){
  if(window.CleaningPlanSanitizer)return;

  var VERSION='0.2.0';
  var state={unsubscribe:null,attachTimer:null,inFlight:{},lastResult:null,lastError:null};

  function clone(value){if(value===undefined)return undefined;try{return JSON.parse(JSON.stringify(value));}catch(error){return value;}}
  function text(value){return String(value==null?'':value).trim();}
  function now(){return Date.now();}
  function startOfLocalDay(value){var d=new Date(Number(value)||now());d.setHours(0,0,0,0);return d.getTime();}
  function repository(){return window.CleaningHouseholdRepository||null;}
  function context(){try{return window.HouseholdContext&&window.HouseholdContext.snapshot?window.HouseholdContext.snapshot():null;}catch(error){return null;}}
  function capture(){try{return window.HouseholdContext&&window.HouseholdContext.capture?window.HouseholdContext.capture():null;}catch(error){return null;}}
  function current(token){try{return !!(window.HouseholdContext&&window.HouseholdContext.isCurrent&&window.HouseholdContext.isCurrent(token));}catch(error){return false;}}
  function database(){try{return window.fbDb||(window.firebase&&window.firebase.database&&window.firebase.database())||null;}catch(error){return null;}}
  function cleaningPath(householdId){var domain=window.CleaningDomain;return domain&&domain.basePath?domain.basePath(householdId):'families/'+String(householdId||'')+'/cleaning';}
  function validContext(ctx){return !!(ctx&&ctx.ready===true&&ctx.uid&&ctx.householdId);}
  function assignedUid(row){var ids=row&&Array.isArray(row.assignmentUids)?row.assignmentUids.filter(Boolean).map(String):[];return ids.length===1?ids[0]:null;}
  function isFinished(row){var status=text(row&&row.status).toUpperCase();return status==='COMPLETED'||status==='SKIPPED'||status==='CANCELLED';}
  function activeRoom(root,roomId){var row=root.rooms&&root.rooms[roomId];return !!(row&&typeof row==='object'&&row.active!==false);}
  function activeRoutine(root,routineId,roomId){var row=root.routines&&root.routines[routineId];return !!(row&&typeof row==='object'&&row.active!==false&&row.paused!==true&&text(row.roomId)===text(roomId));}
  function ensureApprovalMap(root,uid){if(!root.approvals||typeof root.approvals!=='object')root.approvals={};if(!root.approvals[uid]||typeof root.approvals[uid]!=='object')root.approvals[uid]={};return root.approvals[uid];}
  function approvalAt(root,uid,planId){var map=root.approvals&&root.approvals[uid],row=map&&map[planId];return row&&typeof row==='object'?row:null;}

  function cancelOccurrence(row,actorUid,timestamp,reason){
    if(!row||typeof row!=='object')return;
    if(text(row.status).toUpperCase()!=='COMPLETED'){
      row.status='CANCELLED';
      row.assignmentStatus='SKIPPED';
      row.cancelledAt=Number(row.cancelledAt)||timestamp;
      row.cancelledByUid=text(row.cancelledByUid)||actorUid;
      row.cancellationReason=reason||'SOURCE_REMOVED';
      row.updatedAt=timestamp;row.updatedByUid=actorUid;
    }
  }

  function trimOccurrence(root,row,actorUid,timestamp){
    var roomId=text(row&&row.roomId);if(!activeRoom(root,roomId))return{keep:false,changed:true,reason:'ROOM_REMOVED'};
    if(isFinished(row))return{keep:true,changed:false};
    var before=Array.isArray(row.checklist)?row.checklist:[],after=before.filter(function(item){var id=text(item&&(item.routineItemId||item.id));return id&&activeRoutine(root,id,roomId);});
    if(after.length===before.length)return{keep:true,changed:false};
    if(!after.length)return{keep:false,changed:true,reason:'ROUTINES_REMOVED'};
    row.checklist=after;
    row.routineItemIds=after.map(function(item){return text(item.routineItemId||item.id);}).filter(Boolean);
    row.estimatedMinutes=after.reduce(function(total,item){return total+(Math.max(1,parseInt(item.estimatedMinutes,10)||10));},0);
    var dues=after.map(function(item){return Number(item.dueAt)||0;}).filter(function(value){return value>0;});
    if(dues.length){row.earliestDueAt=Math.min.apply(Math,dues);row.latestDueAt=Math.max.apply(Math,dues);}
    row.dueState=after.some(function(item){return item.dueState==='OVERDUE';})?'OVERDUE':'DUE_IN_WINDOW';
    row.updatedAt=timestamp;row.updatedByUid=actorUid;
    return{keep:true,changed:true,reason:'ROUTINES_TRIMMED'};
  }

  function buildSummary(root,ids){
    var loads={},routineCount=0,total=0,overdue=0;
    ids.forEach(function(id){var row=root.occurrences&&root.occurrences[id];if(!row)return;var uid=assignedUid(row),minutes=Math.max(0,parseInt(row.estimatedMinutes,10)||0);routineCount+=Array.isArray(row.checklist)?row.checklist.length:(Array.isArray(row.routineItemIds)?row.routineItemIds.length:0);total+=minutes;if(row.dueState==='OVERDUE')overdue++;if(uid){if(!loads[uid])loads[uid]={uid:uid,estimatedMinutes:0,bundleCount:0};loads[uid].estimatedMinutes+=minutes;loads[uid].bundleCount++;}});
    var memberLoads=Object.keys(loads).sort().map(function(uid){return loads[uid];}),values=memberLoads.map(function(row){return row.estimatedMinutes;});
    return{occurrenceCount:ids.length,routineCount:routineCount,overdueOccurrenceCount:overdue,dueInWindowOccurrenceCount:Math.max(0,ids.length-overdue),totalEstimatedMinutes:total,imbalanceMinutes:values.length?Math.max.apply(Math,values)-Math.min.apply(Math,values):0,memberLoads:memberLoads};
  }

  function groupedByUid(root,ids){var grouped={};ids.forEach(function(id){var row=root.occurrences&&root.occurrences[id],uid=assignedUid(row);if(!uid)return;if(!grouped[uid])grouped[uid]=[];grouped[uid].push(id);});return grouped;}

  function syncApprovalState(root,plan,ids,actorUid,timestamp){
    var grouped=groupedByUid(root,ids),required=Object.keys(grouped).sort(),previous=Array.isArray(plan.requiredApprovalUids)?plan.requiredApprovalUids.map(String):[];
    previous.forEach(function(uid){if(required.indexOf(uid)>=0)return;var old=approvalAt(root,uid,plan.id);if(old){old.status='SUPERSEDED';old.occurrenceIds=[];old.supersededAt=timestamp;old.supersededByUid=actorUid;old.updatedAt=timestamp;old.updatedByUid=actorUid;}});

    if(plan.status==='ACTIVE'){
      required.forEach(function(uid){var map=ensureApprovalMap(root,uid),row=map[plan.id]&&typeof map[plan.id]==='object'?map[plan.id]:{};row.id=row.id||plan.id+'__'+uid;row.householdId=plan.householdId;row.planId=plan.id;row.uid=uid;row.status='ACCEPTED';row.occurrenceIds=grouped[uid].slice();row.acceptedAt=Number(row.acceptedAt)||Number(plan.activatedAt)||timestamp;row.acceptedByUid=text(row.acceptedByUid)||uid;row.createdAt=Number(row.createdAt)||timestamp;row.createdByUid=text(row.createdByUid)||actorUid;row.updatedAt=timestamp;row.updatedByUid=actorUid;row.schemaVersion=Math.max(1,Number(row.schemaVersion)||1);map[plan.id]=row;});
      plan.requiredApprovalUids=required;plan.acceptedApprovalUids=required.slice();plan.declinedApprovalUids=[];plan.approvalState='APPROVED';plan.approvalSummary={requiredCount:required.length,acceptedCount:required.length,pendingCount:0};return;
    }

    var accepted=[],declined=[];
    required.forEach(function(uid){var row=approvalAt(root,uid,plan.id);if(row){row.occurrenceIds=grouped[uid].slice();row.updatedAt=timestamp;row.updatedByUid=actorUid;if(row.status==='ACCEPTED')accepted.push(uid);else if(row.status==='DECLINED')declined.push(uid);}});
    plan.requiredApprovalUids=required;plan.acceptedApprovalUids=accepted.sort();plan.declinedApprovalUids=declined.sort();plan.approvalSummary={requiredCount:required.length,acceptedCount:accepted.length,pendingCount:Math.max(0,required.length-accepted.length-declined.length)};
    if(plan.status==='DRAFT'){plan.approvalState='DRAFT';return;}
    if(declined.length){plan.status=accepted.length?'PARTIALLY_ACCEPTED':'PROPOSED';plan.approvalState='CHANGES_REQUESTED';return;}
    if(!required.length||accepted.length===required.length){plan.status='ACTIVE';plan.approvalState='APPROVED';plan.activatedAt=Number(plan.activatedAt)||timestamp;plan.activatedByUid=text(plan.activatedByUid)||actorUid;ids.forEach(function(id){var row=root.occurrences&&root.occurrences[id];if(row&&!isFinished(row)){if(row.status==='PROPOSED'||row.status==='DRAFT')row.status='FLEXIBLE';row.assignmentStatus='ACTIVE';row.updatedAt=timestamp;row.updatedByUid=actorUid;}});return;}
    plan.status=accepted.length?'PARTIALLY_ACCEPTED':'PROPOSED';plan.approvalState='PENDING';
  }

  function sanitizeRoot(input){
    var source=input||{},root=source.root&&typeof source.root==='object'?clone(source.root):{},planId=text(source.planId),actorUid=text(source.actorUid),householdId=text(source.householdId),timestamp=Number(source.timestamp)||now();
    if(!root.plans||typeof root.plans!=='object')root.plans={};if(!root.occurrences||typeof root.occurrences!=='object')root.occurrences={};if(!root.rooms||typeof root.rooms!=='object')root.rooms={};if(!root.routines||typeof root.routines!=='object')root.routines={};
    var plan=root.plans[planId];if(!plan||typeof plan!=='object')return{changed:false,root:root,reason:'PLAN_NOT_FOUND'};plan.id=plan.id||planId;if(plan.householdId&&householdId&&text(plan.householdId)!==householdId)throw new Error('CLEANING_SANITIZE_HOUSEHOLD_CONFLICT');if(plan.rollingPlanVersion===1)return{changed:false,root:root,reason:'ROLLING_PLAN_SKIPPED'};
    var before=Array.isArray(plan.occurrenceIds)?plan.occurrenceIds.map(String):[],kept=[],removed=[],trimmed=[];
    before.forEach(function(id){var row=root.occurrences[id];if(!row||typeof row!=='object'||text(row.planId)!==planId){removed.push(id);return;}if(row.status==='CANCELLED'){removed.push(id);return;}var result=trimOccurrence(root,row,actorUid,timestamp);if(!result.keep){cancelOccurrence(row,actorUid,timestamp,result.reason);removed.push(id);return;}kept.push(id);if(result.changed)trimmed.push(id);});
    if(!removed.length&&!trimmed.length)return{changed:false,root:root,reason:'ALREADY_CLEAN',removedOccurrenceIds:[],trimmedOccurrenceIds:[]};
    plan.occurrenceIds=kept;plan.summary=buildSummary(root,kept);syncApprovalState(root,plan,kept,actorUid,timestamp);plan.sanitizedAt=timestamp;plan.sanitizedByUid=actorUid;plan.reconciliationReason='ROOM_OR_ROUTINE_REMOVED';plan.updatedAt=timestamp;plan.updatedByUid=actorUid;root.plans[planId]=plan;
    return{changed:true,root:root,reason:'STALE_SOURCE_REMOVED',planId:planId,removedOccurrenceIds:removed,trimmedOccurrenceIds:trimmed,remainingOccurrenceIds:kept.slice()};
  }

  function emit(detail){state.lastResult=clone(detail||{});state.lastError=detail&&detail.error||null;try{window.dispatchEvent(new CustomEvent('familyapp:cleaning-plan-sanitized',{detail:clone(detail||{})}));}catch(error){}}

  function sanitizePlan(planId){
    planId=text(planId);if(!planId)return Promise.resolve(null);if(state.inFlight[planId])return state.inFlight[planId];var ctx=context(),db=database(),token=capture();if(!validContext(ctx)||!db||!token||!current(token))return Promise.resolve(null);var path=cleaningPath(ctx.householdId),resultValue=null,transitionError=null;
    var work=db.ref(path).transaction(function(serverRoot){if(!current(token)){transitionError=new Error('CLEANING_SANITIZE_CONTEXT_CHANGED');return;}try{transitionError=null;resultValue=sanitizeRoot({root:serverRoot||{},planId:planId,householdId:ctx.householdId,actorUid:ctx.uid,timestamp:now()});return resultValue.changed?resultValue.root:undefined;}catch(error){transitionError=error;return;}}).then(function(result){if(transitionError)throw transitionError;if(!current(token))throw new Error('CLEANING_SANITIZE_CONTEXT_CHANGED_AFTER_WRITE');if(resultValue&&resultValue.changed&&(!result||result.committed!==true))throw new Error('CLEANING_SANITIZE_WRITE_NOT_COMMITTED');if(resultValue&&resultValue.changed)emit(Object.assign({status:'sanitized'},resultValue));return resultValue;}).catch(function(error){emit({status:'error',planId:planId,error:error&&error.message||String(error)});throw error;}).finally(function(){delete state.inFlight[planId];});state.inFlight[planId]=work;return work;
  }

  function reconcileAfter(planId){
    var reconciler=window.CleaningActivePlanReconciler,promise=reconciler&&typeof reconciler.reconcilePlan==='function'?reconciler.reconcilePlan(planId):Promise.resolve(null);
    return Promise.resolve(promise).then(function(result){var projection=window.CleaningProjectionService;if(projection&&typeof projection.reconcilePlan==='function')return Promise.resolve(projection.reconcilePlan(planId)).then(function(){return result;});return result;});
  }

  function refreshPlan(planId){return sanitizePlan(planId).then(function(sanitized){return reconcileAfter(planId).then(function(reconciled){return{sanitized:sanitized,reconciled:reconciled};});});}

  function eligiblePlans(snapshot){var plans=snapshot&&snapshot.data&&snapshot.data.plans;if(!plans||typeof plans!=='object')return[];var today=startOfLocalDay(now());return Object.keys(plans).filter(function(id){var plan=plans[id];return plan&&plan.rollingPlanVersion!==1&&['ACTIVE','PROPOSED','PARTIALLY_ACCEPTED'].indexOf(text(plan.status))>=0&&Number(plan.windowEndAt||0)>today;});}
  function scan(snapshot){eligiblePlans(snapshot).forEach(function(planId){sanitizePlan(planId).then(function(result){if(result&&result.changed)window.setTimeout(function(){reconcileAfter(planId).catch(function(){});},0);}).catch(function(){});});}
  function attach(){var r=repository();if(!r||typeof r.subscribe!=='function')return false;if(state.unsubscribe)return true;state.unsubscribe=r.subscribe(function(snapshot){if(snapshot&&snapshot.ready===true)scan(snapshot);});try{var initial=r.snapshot&&r.snapshot();if(initial&&initial.ready===true)scan(initial);}catch(error){}return true;}
  function start(){if(attach())return true;if(state.attachTimer)return false;var tries=0;state.attachTimer=window.setInterval(function(){tries++;if(attach()||tries>240){window.clearInterval(state.attachTimer);state.attachTimer=null;}},100);return false;}
  function stop(){if(state.unsubscribe){try{state.unsubscribe();}catch(error){}state.unsubscribe=null;}if(state.attachTimer){window.clearInterval(state.attachTimer);state.attachTimer=null;}state.inFlight={};}

  window.CleaningPlanSanitizer={version:VERSION,start:start,stop:stop,sanitizePlan:sanitizePlan,refreshPlan:refreshPlan,status:function(){return clone({version:VERSION,lastResult:state.lastResult,lastError:state.lastError,inFlight:Object.keys(state.inFlight)});},_sanitizeRoot:sanitizeRoot,_eligiblePlans:eligiblePlans};
  window.addEventListener('familyapp:cleaning-repository',start);window.addEventListener('familyapp:household-context',start);start();
})();