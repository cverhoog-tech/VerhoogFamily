'use strict';
// ============================================================
// CLEANING ROLLING PLANNER SERVICE v0.1.0
// Keeps a four-week future horizon for routines marked ONGOING.
// Future occurrences inherit an accepted fixed person or the latest accepted
// assignee for that routine. THIS_WEEK routines never cross the week boundary.
// ============================================================
(function(){
  if(window.CleaningRollingPlannerService)return;

  var VERSION='0.1.0';
  var DEFAULT_HORIZON_WEEKS=4;
  var state={unsubscribe:null,attachTimer:null,debounce:null,inFlight:null,lastResult:null,lastError:null};
  var INVALID_KEY=/[.#$\[\]\/\u0000-\u001F\u007F]/g;

  function clone(value){if(value===undefined)return undefined;try{return JSON.parse(JSON.stringify(value));}catch(e){return value;}}
  function text(value){return String(value==null?'':value).trim();}
  function safe(value){return text(value).replace(INVALID_KEY,'_');}
  function positive(value){var n=Number(value);return Number.isFinite(n)&&n>0?n:null;}
  function now(){return Date.now();}
  function repository(){return window.CleaningHouseholdRepository||null;}
  function recurring(){return window.CleaningRecurringPlanContract||null;}
  function contextSnapshot(){try{return window.HouseholdContext&&window.HouseholdContext.snapshot?window.HouseholdContext.snapshot():null;}catch(e){return null;}}
  function captureContext(){try{return window.HouseholdContext&&window.HouseholdContext.capture?window.HouseholdContext.capture():null;}catch(e){return null;}}
  function contextIsCurrent(token){try{return !!(window.HouseholdContext&&window.HouseholdContext.isCurrent&&window.HouseholdContext.isCurrent(token));}catch(e){return false;}}
  function firebaseDb(){try{return window.fbDb||(window.firebase&&window.firebase.database&&window.firebase.database())||null;}catch(e){return null;}}
  function validContext(ctx){return !!(ctx&&ctx.ready===true&&ctx.uid&&ctx.householdId);}

  function weekStartAt(timestamp){
    var d=new Date(Number(timestamp)||now());
    d.setHours(0,0,0,0);
    d.setDate(d.getDate()-((d.getDay()+6)%7));
    return d.getTime();
  }

  function activeMembers(input){
    var seen={},out=[];
    (Array.isArray(input)?input:[]).forEach(function(row,index){
      var uid=text(row&&(row.uid||row.id));
      var status=text(row&&row.status||'active').toLowerCase();
      if(!uid||seen[uid]||status!=='active')return;
      seen[uid]=true;
      out.push({uid:uid,order:index,displayName:text(row.displayName||row.name)||'Gezinslid'});
    });
    return out;
  }

  function liveMembers(){
    try{
      var bridge=window.HouseholdIdentityFirebaseBridge;
      var rows=bridge&&bridge.getMembers?bridge.getMembers():[];
      return activeMembers(rows).map(clone);
    }catch(e){return [];}
  }

  function assignedUid(occurrence){
    var ids=occurrence&&Array.isArray(occurrence.assignmentUids)?occurrence.assignmentUids.filter(Boolean).map(String):[];
    return ids.length===1?ids[0]:null;
  }

  function occurrenceAnchor(occurrence){
    return positive(occurrence&&occurrence.slotAt)||positive(occurrence&&occurrence.flexibleWindow&&occurrence.flexibleWindow.startAt)||positive(occurrence&&occurrence.scheduledStartAt)||positive(occurrence&&occurrence.earliestDueAt)||0;
  }

  function routineIds(occurrence){
    var out=[];
    (Array.isArray(occurrence&&occurrence.checklist)?occurrence.checklist:[]).forEach(function(item){
      var id=text(item&&(item.routineItemId||item.id));if(id&&out.indexOf(id)<0)out.push(id);
    });
    (Array.isArray(occurrence&&occurrence.routineItemIds)?occurrence.routineItemIds:[]).forEach(function(value){
      var id=text(value);if(id&&out.indexOf(id)<0)out.push(id);
    });
    return out;
  }

  function standingAssignments(root,memberRows){
    var memberLookup={};memberRows.forEach(function(member){memberLookup[member.uid]=true;});
    var assignments={},anchors={};
    var routines=root.routines&&typeof root.routines==='object'?root.routines:{};
    Object.keys(routines).forEach(function(id){
      var routine=routines[id]||{},uid=text(routine.preferredAssigneeUid);
      if(uid&&memberLookup[uid]&&text(routine.assignmentMode)==='FIXED_PERSON'&&text(routine.assignmentRequestStatus)==='ACCEPTED'){
        assignments[id]=uid;anchors[id]=Number.MAX_SAFE_INTEGER;
      }
    });

    var plans=root.plans&&typeof root.plans==='object'?root.plans:{};
    var occurrences=root.occurrences&&typeof root.occurrences==='object'?root.occurrences:{};
    Object.keys(plans).forEach(function(planId){
      var plan=plans[planId];
      if(!plan||plan.status!=='ACTIVE')return;
      (Array.isArray(plan.occurrenceIds)?plan.occurrenceIds:[]).forEach(function(id){
        var row=occurrences[id],uid=assignedUid(row),anchor=occurrenceAnchor(row);
        if(!row||!uid||!memberLookup[uid]||row.status==='CANCELLED'||row.status==='SKIPPED'||row.assignmentStatus!=='ACTIVE')return;
        routineIds(row).forEach(function(routineId){
          if(anchors[routineId]===Number.MAX_SAFE_INTEGER)return;
          if(!anchors[routineId]||anchor>=anchors[routineId]){assignments[routineId]=uid;anchors[routineId]=anchor;}
        });
      });
    });
    return assignments;
  }

  function planIdForWindow(contract,windowValue){
    var persistence=window.CleaningPlanPersistenceContract;
    if(persistence&&typeof persistence.planIdForWindow==='function')return persistence.planIdForWindow(windowValue);
    return 'week_'+windowValue.startAt+'_'+windowValue.endAt;
  }

  function semanticChecklist(value){
    return (Array.isArray(value)?value:[]).map(function(item){
      return{id:text(item&&item.routineItemId||item&&item.id),title:text(item&&item.title),estimatedMinutes:Number(item&&item.estimatedMinutes)||0,priority:text(item&&item.priority)||'NORMAL',dueAt:Number(item&&item.dueAt)||0,dueState:text(item&&item.dueState)||'DUE_IN_WINDOW',completed:!!(item&&item.completed)};
    }).sort(function(a,b){return a.id<b.id?-1:(a.id>b.id?1:0);});
  }

  function occurrenceSemantic(value){
    var row=value||{};
    return{
      roomId:text(row.roomId),slotAt:Number(row.slotAt)||0,routineItemIds:(Array.isArray(row.routineItemIds)?row.routineItemIds:[]).map(String).sort(),
      checklist:semanticChecklist(row.checklist),assignmentUids:(Array.isArray(row.assignmentUids)?row.assignmentUids:[]).map(String),
      assignmentStatus:text(row.assignmentStatus),status:text(row.status),dueState:text(row.dueState),earliestDueAt:Number(row.earliestDueAt)||0,
      latestDueAt:Number(row.latestDueAt)||0,estimatedMinutes:Number(row.estimatedMinutes)||0,
      flexibleWindow:row.flexibleWindow?{startAt:Number(row.flexibleWindow.startAt)||0,endAt:Number(row.flexibleWindow.endAt)||0}:null,
      rollingGenerated:row.rollingGenerated===true
    };
  }

  function planSummary(root,ids,memberRows){
    var loads={};memberRows.forEach(function(member){loads[member.uid]={uid:member.uid,estimatedMinutes:0,bundleCount:0};});
    var count=0,routineCount=0,total=0,overdue=0;
    ids.forEach(function(id){
      var row=root.occurrences&&root.occurrences[id];
      if(!row||row.status==='CANCELLED'||row.status==='SKIPPED')return;
      count++;var minutes=Number(row.estimatedMinutes)||0,uid=assignedUid(row);total+=minutes;
      routineCount+=(Array.isArray(row.checklist)?row.checklist.length:0);if(row.dueState==='OVERDUE')overdue++;
      if(uid){if(!loads[uid])loads[uid]={uid:uid,estimatedMinutes:0,bundleCount:0};loads[uid].estimatedMinutes+=minutes;loads[uid].bundleCount++;}
    });
    var order=memberRows.map(function(member){return member.uid;});Object.keys(loads).forEach(function(uid){if(order.indexOf(uid)<0)order.push(uid);});
    var memberLoads=order.map(function(uid){return loads[uid];});var values=memberLoads.map(function(load){return load.estimatedMinutes;});
    return{occurrenceCount:count,routineCount:routineCount,overdueOccurrenceCount:overdue,dueInWindowOccurrenceCount:Math.max(0,count-overdue),totalEstimatedMinutes:total,imbalanceMinutes:values.length?Math.max.apply(Math,values)-Math.min.apply(Math,values):0,memberLoads:memberLoads};
  }

  function summarySemantic(summary){
    var value=summary||{};
    return{occurrenceCount:Number(value.occurrenceCount)||0,routineCount:Number(value.routineCount)||0,totalEstimatedMinutes:Number(value.totalEstimatedMinutes)||0,imbalanceMinutes:Number(value.imbalanceMinutes)||0,memberLoads:(Array.isArray(value.memberLoads)?value.memberLoads:[]).map(function(load){return{uid:text(load.uid),estimatedMinutes:Number(load.estimatedMinutes)||0,bundleCount:Number(load.bundleCount)||0};})};
  }

  function pickAssignee(candidate,routine,standing,memberRows,loads){
    var lookup={};memberRows.forEach(function(member){lookup[member.uid]=true;});
    var preferred=text(routine&&routine.preferredAssigneeUid);
    if(preferred&&lookup[preferred]&&text(routine.assignmentMode)==='FIXED_PERSON'&&text(routine.assignmentRequestStatus)==='ACCEPTED')return preferred;
    var inherited=text(standing[candidate.routineId]);
    if(inherited&&lookup[inherited])return inherited;
    var creator=text(routine&&routine.createdByUid);
    if(creator&&lookup[creator])return creator;
    var ordered=memberRows.map(function(member){return loads[member.uid];}).sort(function(a,b){if(a.estimatedMinutes!==b.estimatedMinutes)return a.estimatedMinutes-b.estimatedMinutes;if(a.bundleCount!==b.bundleCount)return a.bundleCount-b.bundleCount;return a.order-b.order;});
    return ordered[0]&&ordered[0].uid||null;
  }

  function desiredGroups(root,contract,windowValue,memberRows,standing){
    var expansion=contract.expandRoutineSlots({window:windowValue,rooms:root.rooms||{},routines:root.routines||{},carryOverOverdue:false});
    var routines=root.routines||{},loads={};memberRows.forEach(function(member){loads[member.uid]={uid:member.uid,order:member.order,estimatedMinutes:0,bundleCount:0};});
    var groups={};
    (expansion.candidates||[]).forEach(function(candidate){
      var routine=routines[candidate.routineId]||{};
      if(text(routine.assignmentRequestStatus)==='PENDING'||routine.paused===true)return;
      var uid=pickAssignee(candidate,routine,standing,memberRows,loads);if(!uid)return;
      var key=text(candidate.roomId)+'|'+Number(candidate.slotAt)+'|'+uid;
      if(!groups[key])groups[key]={roomId:text(candidate.roomId),slotAt:Number(candidate.slotAt),uid:uid,items:[]};
      groups[key].items.push(candidate);
      loads[uid].estimatedMinutes+=Number(candidate.estimatedMinutes)||0;loads[uid].bundleCount++;
    });
    return Object.keys(groups).sort().map(function(key){
      var group=groups[key];group.items.sort(function(a,b){return a.routineId<b.routineId?-1:1;});return group;
    });
  }

  function reconcileWindow(root,contract,windowValue,memberRows,standing,householdId,actorUid,timestamp,horizonWeeks){
    if(!root.plans||typeof root.plans!=='object')root.plans={};
    if(!root.occurrences||typeof root.occurrences!=='object')root.occurrences={};
    if(!root.approvals||typeof root.approvals!=='object')root.approvals={};
    var planId=planIdForWindow(contract,windowValue),existingPlan=root.plans[planId];
    if(existingPlan&&existingPlan.rollingPlanVersion!==1)return{changed:false,planId:planId,reason:'MANUAL_PLAN_EXISTS'};
    var groups=desiredGroups(root,contract,windowValue,memberRows,standing);
    if(!groups.length&&!existingPlan)return{changed:false,planId:planId,reason:'NO_OCCURRENCES'};

    var beforePlan=existingPlan?clone(existingPlan):null;
    var activeIds=[],allIds=[],seen={},changed=false;
    groups.forEach(function(group){
      var base=contract.occurrenceIdFor(planId,group.roomId,group.slotAt);
      var occurrenceId=base+'__uid_'+safe(group.uid);
      var existing=root.occurrences[occurrenceId];
      var oldCompleted={};semanticChecklist(existing&&existing.checklist).forEach(function(item){oldCompleted[item.id]=item.completed;});
      var checklist=group.items.map(function(item){
        return{id:item.routineId,routineItemId:item.routineId,title:text(item.title)||'Schoonmaakonderdeel',estimatedMinutes:Number(item.estimatedMinutes)||10,priority:text(item.priority)||'NORMAL',dueAt:Number(item.dueAt)||group.slotAt,dueState:'DUE_IN_WINDOW',completed:!!oldCompleted[item.routineId]};
      });
      var minutes=checklist.reduce(function(sum,item){return sum+item.estimatedMinutes;},0);
      var desired={
        id:occurrenceId,householdId:householdId,planId:planId,roomId:group.roomId,slotAt:group.slotAt,
        routineItemIds:checklist.map(function(item){return item.routineItemId;}),checklist:checklist,
        assignmentUids:[group.uid],assignmentStatus:'ACTIVE',status:'FLEXIBLE',dueState:'DUE_IN_WINDOW',
        earliestDueAt:Math.min.apply(Math,checklist.map(function(item){return item.dueAt;})),latestDueAt:Math.max.apply(Math,checklist.map(function(item){return item.dueAt;})),estimatedMinutes:minutes,
        scheduledStartAt:null,scheduledEndAt:null,flexibleWindow:{startAt:group.slotAt,endAt:Math.min(windowValue.endAt,group.slotAt+Number(contract.DAY_MS||86400000))},
        projections:existing&&existing.projections&&typeof existing.projections==='object'?clone(existing.projections):{taskId:null,calendarEventId:null},
        recurrenceVersion:2,rollingGenerated:true,rollingHorizonWeeks:horizonWeeks,
        activatedAt:positive(existing&&existing.activatedAt)||timestamp,activatedByUid:text(existing&&existing.activatedByUid)||actorUid,
        createdAt:positive(existing&&existing.createdAt)||timestamp,createdByUid:text(existing&&existing.createdByUid)||actorUid,
        updatedAt:positive(existing&&existing.updatedAt)||timestamp,updatedByUid:text(existing&&existing.updatedByUid)||actorUid,schemaVersion:3
      };
      if(!existing||JSON.stringify(occurrenceSemantic(existing))!==JSON.stringify(occurrenceSemantic(desired))){desired.updatedAt=timestamp;desired.updatedByUid=actorUid;root.occurrences[occurrenceId]=desired;changed=true;}
      else root.occurrences[occurrenceId]=existing;
      activeIds.push(occurrenceId);allIds.push(occurrenceId);seen[occurrenceId]=true;
    });

    (existingPlan&&Array.isArray(existingPlan.occurrenceIds)?existingPlan.occurrenceIds:[]).forEach(function(id){
      if(seen[id])return;var row=root.occurrences[id];if(!row||row.rollingGenerated!==true)return;
      allIds.push(id);
      if(row.status!=='CANCELLED'&&row.status!=='COMPLETED'){
        root.occurrences[id]=Object.assign({},clone(row),{status:'CANCELLED',assignmentStatus:'SKIPPED',cancelledAt:timestamp,cancelledByUid:actorUid,updatedAt:timestamp,updatedByUid:actorUid});changed=true;
      }
    });

    var required=[];activeIds.forEach(function(id){var uid=assignedUid(root.occurrences[id]);if(uid&&required.indexOf(uid)<0)required.push(uid);});required.sort();
    var summary=planSummary(root,activeIds,memberRows);
    var plan={
      id:planId,householdId:householdId,status:'ACTIVE',approvalState:'ROLLING_APPROVED',approvalRound:Number(existingPlan&&existingPlan.approvalRound)||1,
      windowStartAt:windowValue.startAt,windowEndAt:windowValue.endAt,distributionMode:'FIXED_PERSON',occurrenceIds:allIds,
      requiredApprovalUids:required.slice(),acceptedApprovalUids:required.slice(),declinedApprovalUids:[],approvalSummary:{requiredCount:required.length,acceptedCount:required.length,pendingCount:0},
      summary:summary,rollingPlanVersion:1,rollingHorizonWeeks:horizonWeeks,autoActivatedFromRoutineConsent:true,
      activatedAt:positive(existingPlan&&existingPlan.activatedAt)||timestamp,activatedByUid:text(existingPlan&&existingPlan.activatedByUid)||actorUid,
      generatedAt:positive(existingPlan&&existingPlan.generatedAt)||timestamp,generatedByUid:text(existingPlan&&existingPlan.generatedByUid)||actorUid,
      createdAt:positive(existingPlan&&existingPlan.createdAt)||timestamp,createdByUid:text(existingPlan&&existingPlan.createdByUid)||actorUid,
      updatedAt:positive(existingPlan&&existingPlan.updatedAt)||timestamp,updatedByUid:text(existingPlan&&existingPlan.updatedByUid)||actorUid,schemaVersion:3
    };
    var planChanged=!beforePlan||JSON.stringify({status:beforePlan.status,occurrenceIds:beforePlan.occurrenceIds||[],required:beforePlan.requiredApprovalUids||[],summary:summarySemantic(beforePlan.summary),horizon:beforePlan.rollingHorizonWeeks})!==JSON.stringify({status:plan.status,occurrenceIds:plan.occurrenceIds,required:plan.requiredApprovalUids,summary:summarySemantic(plan.summary),horizon:plan.rollingHorizonWeeks});
    if(planChanged){plan.updatedAt=timestamp;plan.updatedByUid=actorUid;changed=true;}else{plan.updatedAt=beforePlan.updatedAt;plan.updatedByUid=beforePlan.updatedByUid;}
    root.plans[planId]=plan;

    required.forEach(function(uid){
      if(!root.approvals[uid]||typeof root.approvals[uid]!=='object')root.approvals[uid]={};
      var ownIds=activeIds.filter(function(id){return assignedUid(root.occurrences[id])===uid;});
      var existingApproval=root.approvals[uid][planId];
      var same=existingApproval&&existingApproval.status==='ACCEPTED'&&JSON.stringify(existingApproval.occurrenceIds||[])===JSON.stringify(ownIds);
      if(!same){
        root.approvals[uid][planId]={id:planId+'__'+uid,householdId:householdId,planId:planId,uid:uid,status:'ACCEPTED',occurrenceIds:ownIds,round:plan.approvalRound,standingRoutineConsent:true,acceptedAt:positive(existingApproval&&existingApproval.acceptedAt)||timestamp,acceptedByUid:uid,createdAt:positive(existingApproval&&existingApproval.createdAt)||timestamp,createdByUid:text(existingApproval&&existingApproval.createdByUid)||actorUid,updatedAt:timestamp,updatedByUid:actorUid,schemaVersion:2};changed=true;
      }
    });

    return{changed:changed,planId:planId,reason:changed?'ROLLING_PLAN_UPDATED':'ALREADY_CURRENT',activeOccurrenceIds:activeIds};
  }

  function reconcileRoot(input){
    var source=input||{},root=source.root&&typeof source.root==='object'?clone(source.root):{};
    var contract=source.recurringContract||recurring(),memberRows=activeMembers(source.members),householdId=text(source.householdId),actorUid=text(source.actorUid),timestamp=positive(source.timestamp)||now();
    var horizonWeeks=Math.max(1,Math.min(8,parseInt(source.horizonWeeks,10)||DEFAULT_HORIZON_WEEKS));
    if(!contract||typeof contract.expandRoutineSlots!=='function'||!memberRows.length||!householdId||!actorUid)return{changed:false,root:root,reason:'NOT_READY',planIds:[]};
    var standing=standingAssignments(root,memberRows),start=weekStartAt(timestamp),planIds=[],changed=false,results=[];
    for(var index=1;index<=horizonWeeks;index++){
      var windowValue={startAt:start+(index*7*Number(contract.DAY_MS||86400000)),endAt:start+((index+1)*7*Number(contract.DAY_MS||86400000))};
      var result=reconcileWindow(root,contract,windowValue,memberRows,standing,householdId,actorUid,timestamp,horizonWeeks);
      results.push(result);if(result.changed)changed=true;if(result.reason!=='NO_OCCURRENCES')planIds.push(result.planId);
    }
    return{changed:changed,root:root,reason:changed?'ROLLING_HORIZON_UPDATED':'ALREADY_CURRENT',planIds:planIds,results:results,horizonWeeks:horizonWeeks};
  }

  function emit(detail){state.lastResult=clone(detail||{});state.lastError=detail&&detail.error||null;try{window.dispatchEvent(new CustomEvent('familyapp:cleaning-rolling-plans',{detail:clone(detail||{})}));}catch(e){}}

  function reconcile(){
    if(state.inFlight)return state.inFlight;
    var ctx=contextSnapshot(),database=firebaseDb(),token=captureContext(),contract=recurring();
    if(!validContext(ctx)||!database||!token||!contextIsCurrent(token)||!contract)return Promise.resolve(null);
    var domain=window.CleaningDomain,path=domain&&domain.basePath?domain.basePath(ctx.householdId):'families/'+ctx.householdId+'/cleaning';
    var rootRef=database.ref(path),resultValue=null,transitionError=null;
    state.inFlight=rootRef.transaction(function(serverRoot){
      if(!contextIsCurrent(token)){transitionError=new Error('CLEANING_ROLLING_CONTEXT_CHANGED');return;}
      try{transitionError=null;resultValue=reconcileRoot({root:serverRoot||{},householdId:ctx.householdId,actorUid:ctx.uid,timestamp:now(),members:liveMembers(),recurringContract:contract,horizonWeeks:DEFAULT_HORIZON_WEEKS});return resultValue.changed?resultValue.root:undefined;}catch(error){transitionError=error;return;}
    }).then(function(result){
      if(transitionError)throw transitionError;if(!contextIsCurrent(token))throw new Error('CLEANING_ROLLING_CONTEXT_CHANGED_AFTER_WRITE');
      if(resultValue&&resultValue.changed&&(!result||result.committed!==true))throw new Error('CLEANING_ROLLING_WRITE_NOT_COMMITTED');
      emit(Object.assign({status:resultValue&&resultValue.changed?'updated':'current'},resultValue||{}));return resultValue;
    }).catch(function(error){emit({status:'error',error:error&&error.message||String(error)});throw error;}).finally(function(){state.inFlight=null;});
    return state.inFlight;
  }

  function schedule(){
    if(state.debounce)clearTimeout(state.debounce);
    state.debounce=setTimeout(function(){state.debounce=null;reconcile().catch(function(){});},120);
  }

  function attach(){
    var r=repository();if(!r||typeof r.subscribe!=='function')return false;if(state.unsubscribe)return true;
    state.unsubscribe=r.subscribe(function(snapshot){if(snapshot&&snapshot.ready===true)schedule();});
    try{var initial=r.snapshot&&r.snapshot();if(initial&&initial.ready===true)schedule();}catch(e){}
    return true;
  }

  function start(){
    if(attach())return true;if(state.attachTimer)return false;var tries=0;
    state.attachTimer=setInterval(function(){tries++;if(attach()||tries>240){clearInterval(state.attachTimer);state.attachTimer=null;}},100);return false;
  }

  function stop(){if(state.unsubscribe){try{state.unsubscribe();}catch(e){}state.unsubscribe=null;}if(state.attachTimer){clearInterval(state.attachTimer);state.attachTimer=null;}if(state.debounce){clearTimeout(state.debounce);state.debounce=null;}state.inFlight=null;}

  window.CleaningRollingPlannerService={version:VERSION,start:start,stop:stop,reconcile:reconcile,status:function(){return clone({version:VERSION,lastResult:state.lastResult,lastError:state.lastError,inFlight:!!state.inFlight});},_reconcileRoot:reconcileRoot,_weekStartAt:weekStartAt,_standingAssignments:standingAssignments};
  window.addEventListener('familyapp:cleaning-repository',start);window.addEventListener('familyapp:household-context',start);window.addEventListener('familyapp:household-identity-synced',schedule);start();
})();
