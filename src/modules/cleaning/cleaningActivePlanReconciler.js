'use strict';
// ============================================================
// CLEANING ACTIVE PLAN RECONCILER v0.1.1
// Keeps a manually approved current weekly plan aligned with recurring slots
// and routines added after activation. Rolling future plans are deliberately
// owned only by CleaningRollingPlannerService to prevent competing rewrites.
// Newly added current-week work becomes a personal proposal before projection.
// ============================================================
(function(){
  if(window.CleaningActivePlanReconciler)return;

  var VERSION='0.1.1';
  var state={unsubscribe:null,attachTimer:null,inFlight:{},lastResult:null,lastError:null};
  var INVALID_KEY=/[.#$\[\]\/\u0000-\u001F\u007F]/g;

  function clone(value){if(value===undefined)return undefined;try{return JSON.parse(JSON.stringify(value));}catch(e){return value;}}
  function text(value){return String(value==null?'':value).trim();}
  function safe(value){return text(value).replace(INVALID_KEY,'_');}
  function positive(value){var n=Number(value);return Number.isFinite(n)&&n>0?n:null;}
  function now(){return Date.now();}
  function startOfLocalDay(value){var d=new Date(Number(value)||now());d.setHours(0,0,0,0);return d.getTime();}
  function repository(){return window.CleaningHouseholdRepository||null;}
  function recurring(){return window.CleaningRecurringPlanContract||null;}
  function contextSnapshot(){try{return window.HouseholdContext&&typeof window.HouseholdContext.snapshot==='function'?window.HouseholdContext.snapshot():null;}catch(e){return null;}}
  function captureContext(){try{return window.HouseholdContext&&typeof window.HouseholdContext.capture==='function'?window.HouseholdContext.capture():null;}catch(e){return null;}}
  function contextIsCurrent(token){try{return !!(window.HouseholdContext&&typeof window.HouseholdContext.isCurrent==='function'&&window.HouseholdContext.isCurrent(token));}catch(e){return false;}}
  function firebaseDb(){try{return window.fbDb||(window.firebase&&window.firebase.database&&window.firebase.database())||null;}catch(e){return null;}}
  function validContext(ctx){return !!(ctx&&ctx.ready===true&&ctx.uid&&ctx.householdId);}

  function members(){
    try{
      var bridge=window.HouseholdIdentityFirebaseBridge;
      var rows=bridge&&typeof bridge.getMembers==='function'?bridge.getMembers():[];
      return Array.isArray(rows)?rows.map(clone):[];
    }catch(e){return [];}
  }

  function eligibleMembers(input){
    var seen={},out=[];
    (Array.isArray(input)?input:[]).forEach(function(row,index){
      var uid=text(row&&(row.uid||row.id));
      var status=text(row&&row.status).toLowerCase();
      if(!uid||seen[uid]||status&&status!=='active')return;
      seen[uid]=true;
      out.push({uid:uid,order:index,displayName:text(row.displayName||row.name)||'Gezinslid'});
    });
    return out;
  }

  function assignedUid(occurrence){
    var ids=occurrence&&Array.isArray(occurrence.assignmentUids)?occurrence.assignmentUids.filter(Boolean).map(String):[];
    return ids.length===1?ids[0]:null;
  }

  function occurrenceSlot(occurrence,plan,contract){
    var flexible=occurrence&&occurrence.flexibleWindow&&positive(occurrence.flexibleWindow.startAt);
    var anchor=positive(occurrence&&occurrence.slotAt)||flexible||positive(occurrence&&occurrence.scheduledStartAt)||positive(occurrence&&occurrence.earliestDueAt)||positive(plan&&plan.windowStartAt);
    if(!anchor)return null;
    return contract.daySlotAt(anchor,{startAt:Number(plan.windowStartAt),endAt:Number(plan.windowEndAt)});
  }

  function routineIds(occurrence){
    var ids=[];
    (Array.isArray(occurrence&&occurrence.checklist)?occurrence.checklist:[]).forEach(function(item){
      var id=text(item&&(item.routineItemId||item.id));
      if(id&&ids.indexOf(id)<0)ids.push(id);
    });
    (Array.isArray(occurrence&&occurrence.routineItemIds)?occurrence.routineItemIds:[]).forEach(function(value){
      var id=text(value);if(id&&ids.indexOf(id)<0)ids.push(id);
    });
    return ids;
  }

  function hashText(value){
    var h=2166136261;value=String(value||'');
    for(var i=0;i<value.length;i++){h^=value.charCodeAt(i);h=Math.imul(h,16777619);}
    return(h>>>0).toString(36);
  }

  function approvalAt(root,uid,planId){
    var byUser=root.approvals&&root.approvals[uid];
    var record=byUser&&byUser[planId];
    return record&&typeof record==='object'?record:null;
  }

  function ensureApprovalMap(root,uid){
    if(!root.approvals||typeof root.approvals!=='object')root.approvals={};
    if(!root.approvals[uid]||typeof root.approvals[uid]!=='object')root.approvals[uid]={};
    return root.approvals[uid];
  }

  function occurrenceIdsForPlan(root,plan){
    var out=[];
    (Array.isArray(plan&&plan.occurrenceIds)?plan.occurrenceIds:[]).forEach(function(value){
      var id=text(value),row=root.occurrences&&root.occurrences[id];
      if(!id||!row||typeof row!=='object'||row.status==='CANCELLED'||text(row.planId)!==text(plan.id)||out.indexOf(id)>=0)return;
      out.push(id);
    });
    return out;
  }

  function buildLoads(root,occurrenceIds,memberRows){
    var loads={};
    memberRows.forEach(function(member){loads[member.uid]={uid:member.uid,order:member.order,estimatedMinutes:0,bundleCount:0};});
    occurrenceIds.forEach(function(id){
      var row=root.occurrences[id],uid=assignedUid(row);
      if(!uid||!loads[uid])return;
      loads[uid].estimatedMinutes+=Math.max(0,parseInt(row.estimatedMinutes,10)||0);
      loads[uid].bundleCount+=1;
    });
    return loads;
  }

  function previousAssignee(root,occurrenceIds,wantedRoutineIds,memberLookup){
    for(var i=occurrenceIds.length-1;i>=0;i--){
      var row=root.occurrences[occurrenceIds[i]],uid=assignedUid(row);
      if(!uid||!memberLookup[uid])continue;
      var ids=routineIds(row);
      if(wantedRoutineIds.some(function(id){return ids.indexOf(id)>=0;}))return uid;
    }
    return null;
  }

  function chooseAssignee(root,occurrenceIds,bundleItems,memberRows,loads){
    var lookup={};memberRows.forEach(function(member){lookup[member.uid]=true;});
    var ids=bundleItems.map(function(item){return text(item.routineItemId||item.id);}).filter(Boolean);
    var inherited=previousAssignee(root,occurrenceIds,ids,lookup);
    if(inherited)return inherited;

    var fixed=[];
    bundleItems.forEach(function(item){
      var routine=root.routines&&root.routines[text(item.routineItemId||item.id)]||{};
      var uid=text(routine.preferredAssigneeUid);
      if(uid&&lookup[uid]&&routine.assignmentMode==='FIXED_PERSON'&&routine.assignmentRequestStatus==='ACCEPTED'&&fixed.indexOf(uid)<0)fixed.push(uid);
    });
    if(fixed.length===1)return fixed[0];

    var creators=[];
    bundleItems.forEach(function(item){var uid=text(item.createdByUid);if(uid&&creators.indexOf(uid)<0)creators.push(uid);});
    if(creators.length===1&&lookup[creators[0]])return creators[0];

    var ordered=memberRows.map(function(member){return loads[member.uid];}).filter(Boolean).sort(function(a,b){
      if(a.estimatedMinutes!==b.estimatedMinutes)return a.estimatedMinutes-b.estimatedMinutes;
      if(a.bundleCount!==b.bundleCount)return a.bundleCount-b.bundleCount;
      return a.order-b.order;
    });
    return ordered[0]&&ordered[0].uid||null;
  }

  function supplementalOccurrenceId(root,contract,planId,roomId,slotAt,itemIds){
    var base=contract.occurrenceIdFor(planId,roomId,slotAt);
    if(!root.occurrences||!root.occurrences[base])return base;
    var suffix='__add_'+hashText(itemIds.slice().sort().join('|'));
    var candidate=base+suffix;
    if(!root.occurrences[candidate])return candidate;
    var existing=root.occurrences[candidate];
    if(existing&&existing.status!=='CANCELLED')return candidate;
    return candidate+'__r'+Math.max(1,Number(root.plans&&root.plans[planId]&&root.plans[planId].approvalRound||0)+1);
  }

  function planSummary(root,plan,occurrenceIds,memberRows){
    var loads={};memberRows.forEach(function(member){loads[member.uid]={uid:member.uid,estimatedMinutes:0,bundleCount:0};});
    var routineCount=0,total=0,overdue=0;
    occurrenceIds.forEach(function(id){
      var row=root.occurrences[id]||{},uid=assignedUid(row),minutes=Math.max(0,parseInt(row.estimatedMinutes,10)||0);
      routineCount+=(Array.isArray(row.checklist)?row.checklist.length:(Array.isArray(row.routineItemIds)?row.routineItemIds.length:0));
      total+=minutes;if(row.dueState==='OVERDUE')overdue++;
      if(uid){if(!loads[uid])loads[uid]={uid:uid,estimatedMinutes:0,bundleCount:0};loads[uid].estimatedMinutes+=minutes;loads[uid].bundleCount++;}
    });
    var order=memberRows.map(function(member){return member.uid;});
    Object.keys(loads).forEach(function(uid){if(order.indexOf(uid)<0)order.push(uid);});
    var memberLoads=order.map(function(uid){return loads[uid];});
    var values=memberLoads.map(function(load){return load.estimatedMinutes;});
    var imbalance=values.length?Math.max.apply(Math,values)-Math.min.apply(Math,values):0;
    return{
      occurrenceCount:occurrenceIds.length,
      routineCount:routineCount,
      overdueOccurrenceCount:overdue,
      dueInWindowOccurrenceCount:occurrenceIds.length-overdue,
      totalEstimatedMinutes:total,
      imbalanceMinutes:imbalance,
      memberLoads:memberLoads
    };
  }

  function reconcileRoot(input){
    var source=input||{};
    var root=source.root&&typeof source.root==='object'?clone(source.root):{};
    if(!root.plans||typeof root.plans!=='object')root.plans={};
    if(!root.occurrences||typeof root.occurrences!=='object')root.occurrences={};
    var planId=text(source.planId),plan=root.plans[planId];
    var contract=source.recurringContract||recurring();
    var householdId=text(source.householdId),actorUid=text(source.actorUid),timestamp=positive(source.timestamp)||now();
    if(!plan||typeof plan!=='object'||!contract||typeof contract.expandRoutineSlots!=='function'||typeof contract.bundleSlots!=='function')return{changed:false,root:root,reason:'NOT_READY'};
    plan.id=plan.id||planId;
    if(plan.householdId&&text(plan.householdId)!==householdId)throw new Error('CLEANING_RECONCILE_HOUSEHOLD_CONFLICT');
    if(plan.rollingPlanVersion===1)return{changed:false,root:root,reason:'PLAN_OWNED_BY_ROLLING'};
    if(['ACTIVE','PROPOSED','PARTIALLY_ACCEPTED'].indexOf(text(plan.status))<0||plan.approvalState==='CHANGES_REQUESTED')return{changed:false,root:root,reason:'PLAN_NOT_RECONCILABLE'};
    var windowValue={startAt:Number(plan.windowStartAt),endAt:Number(plan.windowEndAt)};
    if(!(windowValue.startAt>0&&windowValue.endAt>windowValue.startAt)||windowValue.endAt<=startOfLocalDay(timestamp))return{changed:false,root:root,reason:'WINDOW_EXPIRED'};

    var memberRows=eligibleMembers(source.members);
    if(!memberRows.length)return{changed:false,root:root,reason:'NO_ACTIVE_MEMBERS'};
    var occurrenceIds=occurrenceIdsForPlan(root,plan);
    var loads=buildLoads(root,occurrenceIds,memberRows);
    var coverage={},roomSlots={};
    occurrenceIds.forEach(function(id){
      var row=root.occurrences[id],slot=occurrenceSlot(row,plan,contract),roomId=text(row.roomId);
      if(!slot||!roomId)return;
      var roomSlot=roomId+'|'+slot;
      if(!roomSlots[roomSlot])roomSlots[roomSlot]=[];
      roomSlots[roomSlot].push(id);
      routineIds(row).forEach(function(routineId){coverage[roomSlot+'|'+routineId]=true;});
    });

    var expanded=contract.expandRoutineSlots({window:windowValue,rooms:root.rooms||{},routines:root.routines||{}});
    var bundles=contract.bundleSlots({window:windowValue,rooms:root.rooms||{},candidates:expanded.candidates||[]});
    var cutoff=startOfLocalDay(timestamp),added=[],affected={};

    bundles.forEach(function(bundle){
      var slot=Number(bundle.slotAt),roomId=text(bundle.roomId),roomSlot=roomId+'|'+slot;
      if(slot<cutoff)return;
      var missing=(Array.isArray(bundle.checklist)?bundle.checklist:[]).filter(function(item){
        var routineId=text(item&&(item.routineItemId||item.id));
        return routineId&&!coverage[roomSlot+'|'+routineId];
      });
      if(!missing.length)return;

      var candidateItems=missing.map(function(item){
        var routineId=text(item.routineItemId||item.id),routine=root.routines&&root.routines[routineId]||{};
        return Object.assign({},clone(item),{createdByUid:text(routine.createdByUid)||null});
      });
      var uid=chooseAssignee(root,occurrenceIds,candidateItems,memberRows,loads);
      if(!uid)return;
      var itemIds=candidateItems.map(function(item){return text(item.routineItemId||item.id);});
      var occurrenceId=supplementalOccurrenceId(root,contract,planId,roomId,slot,itemIds);
      var existing=root.occurrences[occurrenceId];
      if(existing&&existing.status!=='CANCELLED'){
        if(occurrenceIds.indexOf(occurrenceId)<0)occurrenceIds.push(occurrenceId);
        return;
      }
      var minutes=candidateItems.reduce(function(sum,item){return sum+Math.max(1,parseInt(item.estimatedMinutes,10)||10);},0);
      var earliest=Math.min.apply(Math,candidateItems.map(function(item){return Number(item.dueAt)||slot;}));
      var latest=Math.max.apply(Math,candidateItems.map(function(item){return Number(item.dueAt)||slot;}));
      var overdue=candidateItems.some(function(item){return item.dueState==='OVERDUE';});
      var checklist=candidateItems.map(function(item){
        var routineId=text(item.routineItemId||item.id);
        return{id:routineId,routineItemId:routineId,title:text(item.title)||'Schoonmaakonderdeel',estimatedMinutes:Math.max(1,parseInt(item.estimatedMinutes,10)||10),priority:text(item.priority)||'NORMAL',dueAt:Number(item.dueAt)||slot,dueState:item.dueState==='OVERDUE'?'OVERDUE':'DUE_IN_WINDOW',completed:false};
      });
      root.occurrences[occurrenceId]={
        id:occurrenceId,householdId:householdId,planId:planId,roomId:roomId,slotAt:slot,
        routineItemIds:itemIds,checklist:checklist,assignmentUids:[uid],assignmentStatus:'PROPOSED',status:'PROPOSED',
        dueState:overdue?'OVERDUE':'DUE_IN_WINDOW',earliestDueAt:earliest,latestDueAt:latest,estimatedMinutes:minutes,
        scheduledStartAt:null,scheduledEndAt:null,flexibleWindow:{startAt:slot,endAt:Math.min(windowValue.endAt,slot+Number(contract.DAY_MS||86400000))},
        projections:{taskId:null,calendarEventId:null},recurrenceVersion:2,supplemental:true,
        proposedAt:timestamp,proposedByUid:actorUid,createdAt:timestamp,createdByUid:actorUid,updatedAt:timestamp,updatedByUid:actorUid,schemaVersion:3
      };
      occurrenceIds.push(occurrenceId);
      itemIds.forEach(function(routineId){coverage[roomSlot+'|'+routineId]=true;});
      if(loads[uid]){loads[uid].estimatedMinutes+=minutes;loads[uid].bundleCount++;}
      affected[uid]=true;
      added.push(occurrenceId);
    });

    if(!added.length)return{changed:false,root:root,reason:'ALREADY_CURRENT',addedOccurrenceIds:[]};

    plan.occurrenceIds=occurrenceIds;
    var grouped={};
    occurrenceIds.forEach(function(id){
      var uid=assignedUid(root.occurrences[id]);
      if(!uid)return;if(!grouped[uid])grouped[uid]=[];grouped[uid].push(id);
    });
    var required=Object.keys(grouped).sort();
    var accepted=[];
    var round=Math.max(0,Number(plan.approvalRound||0))+1;
    required.forEach(function(uid){
      var existingApproval=approvalAt(root,uid,planId);
      var keepAccepted=!affected[uid]&&existingApproval&&existingApproval.status==='ACCEPTED';
      var record;
      if(keepAccepted){
        record=Object.assign({},clone(existingApproval),{occurrenceIds:grouped[uid].slice(),round:round,updatedAt:timestamp,updatedByUid:actorUid});
        accepted.push(uid);
      }else{
        record={
          id:planId+'__'+uid,householdId:householdId,planId:planId,uid:uid,status:'PENDING',occurrenceIds:grouped[uid].slice(),round:round,
          proposedAt:timestamp,proposedByUid:actorUid,createdAt:positive(existingApproval&&existingApproval.createdAt)||timestamp,
          createdByUid:text(existingApproval&&existingApproval.createdByUid)||actorUid,updatedAt:timestamp,updatedByUid:actorUid,schemaVersion:1
        };
      }
      ensureApprovalMap(root,uid)[planId]=record;
    });

    plan.status=accepted.length?'PARTIALLY_ACCEPTED':'PROPOSED';
    plan.approvalState='PENDING';
    plan.approvalRound=round;
    plan.requiredApprovalUids=required;
    plan.acceptedApprovalUids=accepted.sort();
    plan.declinedApprovalUids=[];
    plan.approvalSummary={requiredCount:required.length,acceptedCount:accepted.length,pendingCount:Math.max(0,required.length-accepted.length)};
    plan.summary=planSummary(root,plan,occurrenceIds,memberRows);
    plan.reconciledAt=timestamp;
    plan.reconciledByUid=actorUid;
    plan.reconciliationReason='ROUTINE_SCHEDULE_CHANGED';
    plan.proposedAt=timestamp;
    plan.proposedByUid=actorUid;
    plan.updatedAt=timestamp;
    plan.updatedByUid=actorUid;
    root.plans[planId]=plan;

    return{changed:true,root:root,reason:'OCCURRENCES_ADDED',addedOccurrenceIds:added.slice(),affectedUids:Object.keys(affected).sort(),planId:planId};
  }

  function emit(detail){
    state.lastResult=clone(detail||{});state.lastError=detail&&detail.error||null;
    try{window.dispatchEvent(new CustomEvent('familyapp:cleaning-plan-reconciled',{detail:clone(detail||{})}));}catch(e){}
  }

  function reconcilePlan(planId){
    planId=text(planId);
    if(!planId)return Promise.resolve(null);
    if(state.inFlight[planId])return state.inFlight[planId];
    var ctx=contextSnapshot(),database=firebaseDb(),token=captureContext(),contract=recurring();
    if(!validContext(ctx)||!database||!token||!contextIsCurrent(token)||!contract)return Promise.resolve(null);
    var basePath=window.CleaningDomain&&typeof window.CleaningDomain.basePath==='function'?window.CleaningDomain.basePath(ctx.householdId):'families/'+ctx.householdId+'/cleaning';
    var rootRef=database.ref(basePath),resultValue=null,transitionError=null;
    var work=rootRef.transaction(function(serverRoot){
      if(!contextIsCurrent(token)){transitionError=new Error('CLEANING_RECONCILE_CONTEXT_CHANGED');return;}
      try{
        transitionError=null;
        resultValue=reconcileRoot({root:serverRoot||{},planId:planId,householdId:ctx.householdId,actorUid:ctx.uid,timestamp:now(),members:members(),recurringContract:contract});
        return resultValue.changed?resultValue.root:undefined;
      }catch(error){transitionError=error;return;}
    }).then(function(result){
      if(transitionError)throw transitionError;
      if(!contextIsCurrent(token))throw new Error('CLEANING_RECONCILE_CONTEXT_CHANGED_AFTER_WRITE');
      if(resultValue&&resultValue.changed&&(!result||result.committed!==true))throw new Error('CLEANING_RECONCILE_WRITE_NOT_COMMITTED');
      if(resultValue&&resultValue.changed)emit(Object.assign({status:'reconciled'},resultValue));
      return resultValue;
    }).catch(function(error){emit({status:'error',planId:planId,error:error&&error.message||String(error)});throw error;}).finally(function(){delete state.inFlight[planId];});
    state.inFlight[planId]=work;
    return work;
  }

  function eligiblePlans(snapshot){
    var plans=snapshot&&snapshot.data&&snapshot.data.plans;
    if(!plans||typeof plans!=='object')return[];
    var today=startOfLocalDay(now());
    return Object.keys(plans).filter(function(id){
      var plan=plans[id];
      return plan&&plan.rollingPlanVersion!==1&&['ACTIVE','PROPOSED','PARTIALLY_ACCEPTED'].indexOf(text(plan.status))>=0&&plan.approvalState!=='CHANGES_REQUESTED'&&Number(plan.windowEndAt||0)>today;
    });
  }

  function reconcileSnapshot(snapshot){eligiblePlans(snapshot).forEach(function(planId){reconcilePlan(planId).catch(function(){});});}

  function attach(){
    var repo=repository();
    if(!repo||typeof repo.subscribe!=='function')return false;
    if(state.unsubscribe)return true;
    state.unsubscribe=repo.subscribe(function(snapshot){if(snapshot&&snapshot.ready===true)reconcileSnapshot(snapshot);});
    try{var initial=repo.snapshot&&repo.snapshot();if(initial&&initial.ready===true)reconcileSnapshot(initial);}catch(e){}
    return true;
  }

  function start(){
    if(attach())return true;
    if(state.attachTimer)return false;
    var tries=0;
    state.attachTimer=setInterval(function(){tries++;if(attach()||tries>240){clearInterval(state.attachTimer);state.attachTimer=null;}},100);
    return false;
  }

  function stop(){
    if(state.unsubscribe){try{state.unsubscribe();}catch(e){}state.unsubscribe=null;}
    if(state.attachTimer){clearInterval(state.attachTimer);state.attachTimer=null;}
    state.inFlight={};
  }

  window.CleaningActivePlanReconciler={
    version:VERSION,start:start,stop:stop,reconcilePlan:reconcilePlan,
    status:function(){return clone({version:VERSION,lastResult:state.lastResult,lastError:state.lastError,inFlight:Object.keys(state.inFlight)});},
    _reconcileRoot:reconcileRoot,_occurrenceSlot:occurrenceSlot,_eligiblePlans:eligiblePlans
  };

  window.addEventListener('familyapp:cleaning-repository',start);
  window.addEventListener('familyapp:household-context',start);
  start();
})();
