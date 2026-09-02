'use strict';
// ============================================================
// CLEANING RECURRING PLAN CONTRACT v0.1.0
// Adds concrete in-week recurrence slots on top of the accepted planner.
// A routine with intervalDays < 7 can therefore produce multiple concrete
// CleaningOccurrences in one weekly plan. Pure contract: no Firebase/DOM.
// ============================================================
(function(){
  if(window.CleaningRecurringPlanContract)return;

  var basePlanner=window.CleaningPlannerContract;
  var basePersistence=window.CleaningPlanPersistenceContract;
  if(!basePlanner||!basePersistence)return;

  var VERSION='0.1.0';
  var DAY_MS=Number(basePlanner.DAY_MS)||86400000;
  var INVALID_KEY=/[.#$\[\]\/\u0000-\u001F\u007F]/g;

  function clone(value){if(value===undefined)return undefined;try{return JSON.parse(JSON.stringify(value));}catch(e){return value;}}
  function text(value){return String(value==null?'':value).trim();}
  function safe(value){return text(value).replace(INVALID_KEY,'_');}
  function positive(value){var n=Number(value);return Number.isFinite(n)&&n>0?n:null;}
  function whole(value,min){var n=Number(value);return Number.isFinite(n)&&Math.floor(n)===n&&n>=min?n:null;}
  function rows(collection){
    if(Array.isArray(collection))return collection.map(function(value){return{key:null,value:value||{}};});
    if(!collection||typeof collection!=='object')return[];
    return Object.keys(collection).map(function(key){return{key:key,value:collection[key]||{}};});
  }
  function planningWindow(value){return basePlanner.planningWindow(value);}
  function dayIndex(at,windowValue){
    var raw=Math.floor((Number(at)-Number(windowValue.startAt))/DAY_MS);
    var max=Math.max(0,Math.ceil((Number(windowValue.endAt)-Number(windowValue.startAt))/DAY_MS)-1);
    return Math.max(0,Math.min(max,raw));
  }
  function daySlotAt(at,windowValue){return Number(windowValue.startAt)+(dayIndex(at,windowValue)*DAY_MS);}

  function roomMap(input){
    var out={};
    rows(input).forEach(function(entry){
      var row=entry.value||{};
      var id=text(entry.key||row.id);
      if(id&&!out[id])out[id]=row;
    });
    return out;
  }

  function alignedNextAfter(seed,start,intervalMs){
    if(seed>=start)return seed;
    var jumps=Math.ceil((start-seed)/intervalMs);
    var next=seed+(Math.max(1,jumps)*intervalMs);
    if(next<=start)next+=intervalMs;
    return next;
  }

  function expandRoutineSlots(input){
    var source=input||{};
    var windowValue=planningWindow(source.window);
    var rooms=roomMap(source.rooms);
    var candidates=[];
    var excluded=[];

    rows(source.routines).forEach(function(entry){
      var routine=entry.value||{};
      var routineId=text(entry.key||routine.id);
      var roomId=text(routine.roomId);
      if(!routineId||!roomId){excluded.push({routineId:routineId||null,roomId:roomId||null,reason:'INVALID_ROUTINE'});return;}
      if(!rooms[roomId]||rooms[roomId].active===false){excluded.push({routineId:routineId,roomId:roomId,reason:'ROOM_UNAVAILABLE'});return;}

      var evaluation=basePlanner.evaluateRoutineDue(routine,windowValue);
      if(!evaluation.eligible||!evaluation.dueThisWindow){
        excluded.push({routineId:routineId,roomId:roomId,reason:evaluation.reason||'NOT_DUE',dueAt:evaluation.dueAt||null});
        return;
      }

      var intervalDays=Math.max(1,parseInt(routine.intervalDays,10)||7);
      var intervalMs=intervalDays*DAY_MS;
      var seed=positive(evaluation.dueAt);
      if(!seed)return;
      var seriesIndex=0;

      function add(slotAt,state,sourceDueAt){
        if(!(slotAt>=windowValue.startAt&&slotAt<windowValue.endAt))return;
        candidates.push({
          routineId:routineId,
          roomId:roomId,
          title:text(routine.title)||'Schoonmaakonderdeel',
          dueAt:slotAt,
          sourceDueAt:sourceDueAt||slotAt,
          dueState:state,
          dueSource:evaluation.dueSource||null,
          intervalDays:intervalDays,
          estimatedMinutes:Math.max(1,parseInt(routine.estimatedMinutes,10)||10),
          priority:text(routine.priority)||'NORMAL',
          seriesIndex:seriesIndex++,
          dayIndex:dayIndex(slotAt,windowValue),
          slotAt:daySlotAt(slotAt,windowValue),
          createdByUid:text(routine.createdByUid)||null,
          createdAt:positive(routine.createdAt),
          schemaVersion:1
        });
      }

      var next;
      if(seed<windowValue.startAt){
        add(windowValue.startAt,'OVERDUE',seed);
        next=alignedNextAfter(seed,windowValue.startAt,intervalMs);
      }else{
        add(seed,'DUE_IN_WINDOW',seed);
        next=seed+intervalMs;
      }

      var guard=0;
      while(next<windowValue.endAt&&guard<370){
        add(next,'DUE_IN_WINDOW',next);
        next+=intervalMs;
        guard++;
      }
    });

    candidates.sort(function(a,b){
      if(a.dueAt!==b.dueAt)return a.dueAt-b.dueAt;
      if(a.roomId!==b.roomId)return a.roomId<b.roomId?-1:1;
      return a.routineId<b.routineId?-1:(a.routineId>b.routineId?1:0);
    });
    return Object.freeze({window:Object.freeze(clone(windowValue)),candidates:Object.freeze(candidates.map(Object.freeze)),excluded:Object.freeze(excluded.map(Object.freeze))});
  }

  function bundleSlots(input){
    var source=input||{};
    var windowValue=planningWindow(source.window);
    var rooms=roomMap(source.rooms);
    var grouped={};
    (Array.isArray(source.candidates)?source.candidates:[]).forEach(function(candidate){
      var roomId=text(candidate&&candidate.roomId);
      if(!roomId||!rooms[roomId])return;
      var index=whole(candidate.dayIndex,0);
      if(index===null)index=dayIndex(candidate.dueAt,windowValue);
      var key='room:'+roomId+':day:'+index;
      if(!grouped[key])grouped[key]={key:key,roomId:roomId,dayIndex:index,slotAt:Number(windowValue.startAt)+(index*DAY_MS),items:[]};
      grouped[key].items.push(candidate);
    });

    return Object.keys(grouped).map(function(key){
      var group=grouped[key],room=rooms[group.roomId]||{};
      group.items.sort(function(a,b){return a.dueAt-b.dueAt;});
      var checklist=group.items.map(function(item){
        return {
          id:item.routineId,
          routineItemId:item.routineId,
          title:item.title,
          estimatedMinutes:item.estimatedMinutes,
          priority:item.priority,
          dueAt:item.dueAt,
          dueState:item.dueState,
          completed:false
        };
      });
      var total=checklist.reduce(function(sum,item){return sum+item.estimatedMinutes;},0);
      return {
        bundleKey:key,
        roomId:group.roomId,
        roomName:text(room.name)||'Ruimte',
        roomType:text(room.type)||'custom',
        distributionMode:text(room.distributionMode)||'FAIR_TIME',
        dayIndex:group.dayIndex,
        slotAt:group.slotAt,
        dueState:checklist.some(function(item){return item.dueState==='OVERDUE';})?'OVERDUE':'DUE_IN_WINDOW',
        earliestDueAt:Math.min.apply(Math,checklist.map(function(item){return Number(item.dueAt);})),
        latestDueAt:Math.max.apply(Math,checklist.map(function(item){return Number(item.dueAt);})),
        estimatedMinutes:total,
        routineCount:checklist.length,
        routineItemIds:checklist.map(function(item){return item.routineItemId;}),
        checklist:checklist
      };
    }).sort(function(a,b){
      if(a.slotAt!==b.slotAt)return a.slotAt-b.slotAt;
      return a.roomId<b.roomId?-1:(a.roomId>b.roomId?1:0);
    });
  }

  function generateConceptPlan(input){
    var source=input||{};
    var expansion=expandRoutineSlots({window:source.window,rooms:source.rooms,routines:source.routines});
    var bundles=bundleSlots({window:expansion.window,rooms:source.rooms,candidates:expansion.candidates});
    var distribution=basePlanner.assignFairTime({members:source.members,bundles:bundles});
    var byBundle={};
    distribution.assignments.forEach(function(assignment){byBundle[assignment.bundleKey]=assignment;});

    var occurrenceDrafts=bundles.map(function(bundle){
      var assignment=byBundle[bundle.bundleKey];
      if(!assignment)throw new Error('CLEANING_PLANNER_ASSIGNMENT_MISMATCH');
      return Object.freeze({
        draftKey:bundle.bundleKey,
        occurrenceId:null,
        planId:null,
        status:'DRAFT',
        roomId:bundle.roomId,
        dayIndex:bundle.dayIndex,
        slotAt:bundle.slotAt,
        dueState:bundle.dueState,
        earliestDueAt:bundle.earliestDueAt,
        latestDueAt:bundle.latestDueAt,
        estimatedMinutes:bundle.estimatedMinutes,
        routineCount:bundle.routineCount,
        routineItemIds:Object.freeze(bundle.routineItemIds.slice()),
        checklist:Object.freeze(bundle.checklist.map(function(item){return Object.freeze(clone(item));})),
        proposedAssignmentUids:Object.freeze(assignment.assignmentUids.slice()),
        scheduledStartAt:null,
        scheduledEndAt:null,
        flexibleWindow:Object.freeze({startAt:bundle.slotAt,endAt:Math.min(expansion.window.endAt,bundle.slotAt+DAY_MS)})
      });
    });

    var routineCount=occurrenceDrafts.reduce(function(sum,draft){return sum+draft.routineCount;},0);
    var overdueCount=occurrenceDrafts.filter(function(draft){return draft.dueState==='OVERDUE';}).length;
    return Object.freeze({
      kind:'CLEANING_PLAN_CONCEPT',schemaVersion:2,id:null,persisted:false,status:'DRAFT',
      window:expansion.window,distributionMode:distribution.distributionMode,
      occurrenceDrafts:Object.freeze(occurrenceDrafts),
      summary:Object.freeze({
        occurrenceCount:occurrenceDrafts.length,
        routineCount:routineCount,
        overdueOccurrenceCount:overdueCount,
        dueInWindowOccurrenceCount:occurrenceDrafts.length-overdueCount,
        totalEstimatedMinutes:distribution.totalEstimatedMinutes,
        imbalanceMinutes:distribution.imbalanceMinutes,
        memberLoads:distribution.memberLoads
      }),
      diagnostics:Object.freeze({excludedRoutines:expansion.excluded,excludedMembers:distribution.excludedMembers||[]})
    });
  }

  function occurrenceIdFor(planId,roomId,slotAt){
    var plan=safe(planId),room=safe(roomId),slot=positive(slotAt);
    if(!plan||!room||!slot)throw new Error('CLEANING_PLAN_OCCURRENCE_ID_INVALID');
    return plan+'__room_'+room+'__slot_'+Math.floor(slot);
  }

  function materializeDraft(input){
    var source=input||{};
    var concept=source.conceptPlan;
    var householdId=text(source.householdId),actorUid=text(source.actorUid),timestamp=positive(source.timestamp);
    if(!concept||concept.kind!=='CLEANING_PLAN_CONCEPT'||concept.status!=='DRAFT'||!Array.isArray(concept.occurrenceDrafts))throw new Error('CLEANING_PLAN_CONCEPT_INVALID');
    if(!householdId)throw new Error('ACTIVE_HOUSEHOLD_REQUIRED');
    if(!actorUid)throw new Error('CLEANING_PLAN_ACTOR_REQUIRED');
    if(!timestamp)throw new Error('CLEANING_PLAN_TIMESTAMP_REQUIRED');
    var windowValue=planningWindow(concept.window);
    var planId=basePersistence.planIdForWindow(windowValue);
    var existingData=source.existingData&&typeof source.existingData==='object'?source.existingData:{};
    var existingPlans=existingData.plans&&typeof existingData.plans==='object'?existingData.plans:{};
    var existingOccurrences=existingData.occurrences&&typeof existingData.occurrences==='object'?existingData.occurrences:{};
    var existingPlan=existingPlans[planId]&&typeof existingPlans[planId]==='object'?existingPlans[planId]:null;
    if(existingPlan&&existingPlan.status!=='DRAFT')throw new Error('CLEANING_PLAN_NOT_DRAFT');

    var occurrenceIds=[],occurrenceRecords={},loads={},routineCount=0,totalMinutes=0,overdueCount=0,seenDrafts={};
    concept.occurrenceDrafts.forEach(function(draft){
      var roomId=safe(draft&&draft.roomId),slotAt=positive(draft&&draft.slotAt),minutes=whole(draft&&draft.estimatedMinutes,1);
      if(!roomId||!slotAt||minutes===null||seenDrafts[draft.draftKey])throw new Error('CLEANING_PLAN_OCCURRENCE_DRAFT_INVALID');
      seenDrafts[draft.draftKey]=true;
      if(!(slotAt>=windowValue.startAt&&slotAt<windowValue.endAt))throw new Error('CLEANING_PLAN_OCCURRENCE_SLOT_INVALID');
      if(!Array.isArray(draft.proposedAssignmentUids)||draft.proposedAssignmentUids.length!==1||!text(draft.proposedAssignmentUids[0]))throw new Error('CLEANING_PLAN_ASSIGNMENT_INVALID');
      if(!Array.isArray(draft.checklist)||!draft.checklist.length)throw new Error('CLEANING_PLAN_CHECKLIST_INVALID');
      var assignmentUid=text(draft.proposedAssignmentUids[0]),seenRoutine={},checklistMinutes=0;
      var checklist=draft.checklist.map(function(item){
        var routineId=safe(item&&item.routineItemId),itemMinutes=whole(item&&item.estimatedMinutes,1),dueAt=positive(item&&item.dueAt);
        if(!routineId||seenRoutine[routineId]||itemMinutes===null||!dueAt)throw new Error('CLEANING_PLAN_CHECKLIST_INVALID');
        seenRoutine[routineId]=true;checklistMinutes+=itemMinutes;
        return {id:routineId,routineItemId:routineId,title:text(item.title)||'Schoonmaakonderdeel',estimatedMinutes:itemMinutes,priority:text(item.priority)||'NORMAL',dueAt:dueAt,dueState:item.dueState==='OVERDUE'?'OVERDUE':'DUE_IN_WINDOW',completed:false};
      });
      if(checklistMinutes!==minutes)throw new Error('CLEANING_PLAN_MINUTES_MISMATCH');
      var occurrenceId=occurrenceIdFor(planId,roomId,slotAt);
      var existing=existingOccurrences[occurrenceId]&&typeof existingOccurrences[occurrenceId]==='object'?existingOccurrences[occurrenceId]:null;
      if(existing&&existing.status!=='DRAFT'&&existing.status!=='CANCELLED')throw new Error('CLEANING_OCCURRENCE_NOT_DRAFT');
      occurrenceIds.push(occurrenceId);
      occurrenceRecords[occurrenceId]={
        id:occurrenceId,householdId:householdId,planId:planId,roomId:roomId,slotAt:slotAt,
        routineItemIds:checklist.map(function(item){return item.routineItemId;}),checklist:checklist,
        assignmentUids:[assignmentUid],assignmentStatus:'PROPOSED',status:'DRAFT',
        dueState:draft.dueState==='OVERDUE'?'OVERDUE':'DUE_IN_WINDOW',
        earliestDueAt:Number(draft.earliestDueAt),latestDueAt:Number(draft.latestDueAt),estimatedMinutes:minutes,
        scheduledStartAt:null,scheduledEndAt:null,flexibleWindow:clone(draft.flexibleWindow)||{startAt:slotAt,endAt:Math.min(windowValue.endAt,slotAt+DAY_MS)},
        projections:{taskId:null,calendarEventId:null},recurrenceVersion:1,
        createdAt:positive(existing&&existing.createdAt)||timestamp,createdByUid:text(existing&&existing.createdByUid)||actorUid,
        updatedAt:timestamp,updatedByUid:actorUid,schemaVersion:2
      };
      routineCount+=checklist.length;totalMinutes+=minutes;if(draft.dueState==='OVERDUE')overdueCount++;
      if(!loads[assignmentUid])loads[assignmentUid]={uid:assignmentUid,estimatedMinutes:0,bundleCount:0};
      loads[assignmentUid].estimatedMinutes+=minutes;loads[assignmentUid].bundleCount++;
    });

    var active={};occurrenceIds.forEach(function(id){active[id]=true;});
    (existingPlan&&Array.isArray(existingPlan.occurrenceIds)?existingPlan.occurrenceIds:[]).forEach(function(id){
      if(active[id])return;
      var stale=existingOccurrences[id];
      if(!stale||stale.status==='CANCELLED')return;
      if(stale.status!=='DRAFT')throw new Error('CLEANING_OCCURRENCE_NOT_DRAFT');
      occurrenceRecords[id]=Object.assign({},clone(stale),{status:'CANCELLED',cancelledAt:timestamp,cancelledByUid:actorUid,updatedAt:timestamp,updatedByUid:actorUid});
    });

    var memberOrder=[];
    var requested=concept.summary&&Array.isArray(concept.summary.memberLoads)?concept.summary.memberLoads:[];
    requested.forEach(function(load){var uid=text(load&&load.uid);if(uid&&memberOrder.indexOf(uid)<0)memberOrder.push(uid);});
    Object.keys(loads).forEach(function(uid){if(memberOrder.indexOf(uid)<0)memberOrder.push(uid);});
    var memberLoads=memberOrder.map(function(uid){return loads[uid]||{uid:uid,estimatedMinutes:0,bundleCount:0};});
    var values=memberLoads.map(function(load){return load.estimatedMinutes;});
    var imbalance=values.length?Math.max.apply(Math,values)-Math.min.apply(Math,values):0;
    var summary={occurrenceCount:occurrenceIds.length,routineCount:routineCount,overdueOccurrenceCount:overdueCount,dueInWindowOccurrenceCount:occurrenceIds.length-overdueCount,totalEstimatedMinutes:totalMinutes,imbalanceMinutes:imbalance,memberLoads:memberLoads};
    var plan={
      id:planId,householdId:householdId,status:'DRAFT',windowStartAt:windowValue.startAt,windowEndAt:windowValue.endAt,
      distributionMode:'FAIR_TIME',occurrenceIds:occurrenceIds,summary:summary,
      generationRevision:Math.max(0,whole(existingPlan&&existingPlan.generationRevision,0)||0)+1,
      recurringPlanVersion:1,generatedAt:timestamp,generatedByUid:actorUid,
      createdAt:positive(existingPlan&&existingPlan.createdAt)||timestamp,createdByUid:text(existingPlan&&existingPlan.createdByUid)||actorUid,
      updatedAt:timestamp,updatedByUid:actorUid,schemaVersion:2
    };
    return Object.freeze({version:VERSION,planId:planId,plan:Object.freeze(plan),occurrences:Object.freeze(occurrenceRecords),activeOccurrenceIds:Object.freeze(occurrenceIds.slice())});
  }

  var recurring={
    version:VERSION,DAY_MS:DAY_MS,expandRoutineSlots:expandRoutineSlots,bundleSlots:bundleSlots,
    generateConceptPlan:generateConceptPlan,materializeDraft:materializeDraft,occurrenceIdFor:occurrenceIdFor,
    dayIndex:dayIndex,daySlotAt:daySlotAt
  };
  window.CleaningRecurringPlanContract=Object.freeze(recurring);

  // Keep all accepted helper functions while replacing only generation/persistence.
  window.CleaningPlannerContract=Object.freeze(Object.assign({},basePlanner,{version:'0.6.0',generateConceptPlan:generateConceptPlan,expandRoutineSlots:expandRoutineSlots,bundleRecurringSlots:bundleSlots}));
  window.CleaningPlanPersistenceContract=Object.freeze(Object.assign({},basePersistence,{version:'0.2.0',occurrenceIdFor:occurrenceIdFor,materializeDraft:materializeDraft}));
})();
