'use strict';
// ============================================================
// CLEANING PLAN PERSISTENCE CONTRACT v0.1.0
// Pure materialization only: no Firebase, localStorage or DOM work.
// CleaningPlan stores references + derived summary; CleaningOccurrence owns each concrete clean.
// ============================================================
(function(){
  if(window.CleaningPlanPersistenceContract)return;

  var VERSION='0.1.0';
  var INVALID_FIREBASE_KEY=/[.#$\[\]\/\u0000-\u001F\u007F]/;

  function clone(value){
    if(value===undefined)return undefined;
    try{return JSON.parse(JSON.stringify(value));}catch(e){return value;}
  }

  function deepFreeze(value){
    if(!value||typeof value!=='object'||Object.isFrozen(value))return value;
    Object.keys(value).forEach(function(key){deepFreeze(value[key]);});
    return Object.freeze(value);
  }

  function text(value){return String(value==null?'':value).trim();}

  function positiveTimestamp(value){
    var number=Number(value);
    return Number.isFinite(number)&&number>0?number:null;
  }

  function wholeNumber(value,min){
    if(value===null||value===undefined||value===''||typeof value==='boolean')return null;
    var number=Number(value);
    return Number.isFinite(number)&&Math.floor(number)===number&&number>=min?number:null;
  }

  function validKeyPart(value){
    var part=text(value);
    return part&&!INVALID_FIREBASE_KEY.test(part)?part:null;
  }

  function windowValue(input){
    var source=input&&input.window?input.window:input||{};
    var startAt=positiveTimestamp(source.startAt||source.windowStartAt);
    var endAt=positiveTimestamp(source.endAt||source.windowEndAt);
    if(!startAt||!endAt||endAt<=startAt)throw new Error('CLEANING_PLAN_WINDOW_INVALID');
    return Object.freeze({startAt:startAt,endAt:endAt});
  }

  function planIdForWindow(input){
    var windowValueResult=windowValue(input);
    return 'week_'+windowValueResult.startAt+'_'+windowValueResult.endAt;
  }

  function occurrenceIdFor(planId,roomId){
    var planKey=validKeyPart(planId);
    var roomKey=validKeyPart(roomId);
    if(!planKey)throw new Error('CLEANING_PLAN_ID_INVALID');
    if(!roomKey)throw new Error('CLEANING_PLAN_ROOM_ID_INVALID');
    return planKey+'__room_'+roomKey;
  }

  function requireConcept(value){
    var concept=value&&typeof value==='object'?value:null;
    if(!concept||concept.kind!=='CLEANING_PLAN_CONCEPT'||concept.status!=='DRAFT'||concept.persisted!==false||concept.id!==null){
      throw new Error('CLEANING_PLAN_CONCEPT_INVALID');
    }
    if(!Array.isArray(concept.occurrenceDrafts)||!concept.summary||typeof concept.summary!=='object'){
      throw new Error('CLEANING_PLAN_CONCEPT_INVALID');
    }
    return concept;
  }

  function normalizedMemberLoads(value){
    if(!Array.isArray(value))throw new Error('CLEANING_PLAN_SUMMARY_INVALID');
    var seen=Object.create(null);
    return value.map(function(load){
      var uid=text(load&&load.uid);
      var minutes=wholeNumber(load&&load.estimatedMinutes,0);
      var bundleCount=wholeNumber(load&&load.bundleCount,0);
      if(!uid||minutes===null||bundleCount===null||seen[uid])throw new Error('CLEANING_PLAN_SUMMARY_INVALID');
      seen[uid]=true;
      return {uid:uid,estimatedMinutes:minutes,bundleCount:bundleCount};
    });
  }

  function materializeDraft(input){
    var source=input||{};
    var concept=requireConcept(source.conceptPlan);
    var householdId=text(source.householdId);
    var actorUid=text(source.actorUid);
    var timestamp=positiveTimestamp(source.timestamp);
    if(!householdId)throw new Error('ACTIVE_HOUSEHOLD_REQUIRED');
    if(!actorUid)throw new Error('CLEANING_PLAN_ACTOR_REQUIRED');
    if(!timestamp)throw new Error('CLEANING_PLAN_TIMESTAMP_REQUIRED');

    var planWindow=windowValue(concept.window);
    var planId=planIdForWindow(planWindow);
    var existingData=source.existingData&&typeof source.existingData==='object'?source.existingData:{};
    var existingPlans=existingData.plans&&typeof existingData.plans==='object'?existingData.plans:{};
    var existingOccurrences=existingData.occurrences&&typeof existingData.occurrences==='object'?existingData.occurrences:{};
    var existingPlan=existingPlans[planId]&&typeof existingPlans[planId]==='object'?existingPlans[planId]:null;

    if(existingPlan){
      if(existingPlan.status!=='DRAFT')throw new Error('CLEANING_PLAN_NOT_DRAFT');
      if(existingPlan.householdId&&text(existingPlan.householdId)!==householdId)throw new Error('CLEANING_PLAN_HOUSEHOLD_CONFLICT');
      if(Number(existingPlan.windowStartAt)!==planWindow.startAt||Number(existingPlan.windowEndAt)!==planWindow.endAt){
        throw new Error('CLEANING_PLAN_WINDOW_CONFLICT');
      }
    }

    var occurrenceIds=[];
    var occurrenceRecords={};
    var seenRooms=Object.create(null);
    var seenRoutineIds=Object.create(null);
    var computedLoads=Object.create(null);
    var routineCount=0;
    var totalMinutes=0;
    var overdueCount=0;

    concept.occurrenceDrafts.forEach(function(draft){
      var roomId=validKeyPart(draft&&draft.roomId);
      var minutes=wholeNumber(draft&&draft.estimatedMinutes,1);
      var draftRoutineCount=wholeNumber(draft&&draft.routineCount,1);
      if(!roomId||seenRooms[roomId]||minutes===null||draftRoutineCount===null)throw new Error('CLEANING_PLAN_OCCURRENCE_DRAFT_INVALID');
      if(draft.draftKey!=='room:'+roomId||draft.status!=='DRAFT'||draft.occurrenceId!==null||draft.planId!==null){
        throw new Error('CLEANING_PLAN_OCCURRENCE_DRAFT_INVALID');
      }
      if(draft.dueState!=='OVERDUE'&&draft.dueState!=='DUE_IN_WINDOW')throw new Error('CLEANING_PLAN_OCCURRENCE_DRAFT_INVALID');
      if(!positiveTimestamp(draft.earliestDueAt)||!positiveTimestamp(draft.latestDueAt))throw new Error('CLEANING_PLAN_OCCURRENCE_DRAFT_INVALID');
      if(!Array.isArray(draft.routineItemIds)||!Array.isArray(draft.checklist)||draft.routineItemIds.length!==draftRoutineCount||draft.checklist.length!==draftRoutineCount){
        throw new Error('CLEANING_PLAN_OCCURRENCE_DRAFT_INVALID');
      }
      if(!Array.isArray(draft.proposedAssignmentUids)||draft.proposedAssignmentUids.length!==1||!text(draft.proposedAssignmentUids[0])){
        throw new Error('CLEANING_PLAN_ASSIGNMENT_INVALID');
      }
      var assignmentUid=text(draft.proposedAssignmentUids[0]);

      var checklistMinutes=0;
      var routineIds=draft.routineItemIds.map(function(value){
        var id=validKeyPart(value);
        if(!id||seenRoutineIds[id])throw new Error('CLEANING_PLAN_ROUTINE_ID_INVALID');
        seenRoutineIds[id]=true;
        return id;
      });
      var checklistEarliest=null;
      var checklistLatest=null;
      var checklistHasOverdue=false;
      var checklist=draft.checklist.map(function(item,index){
        var routineItemId=validKeyPart(item&&item.routineItemId);
        var itemMinutes=wholeNumber(item&&item.estimatedMinutes,1);
        var itemDueAt=positiveTimestamp(item&&item.dueAt);
        var itemDueState=item&&item.dueState;
        if(!routineItemId||routineItemId!==routineIds[index]||validKeyPart(item&&item.id)!==routineItemId||itemMinutes===null||!itemDueAt){
          throw new Error('CLEANING_PLAN_CHECKLIST_INVALID');
        }
        if(itemDueState!=='OVERDUE'&&itemDueState!=='DUE_IN_WINDOW')throw new Error('CLEANING_PLAN_CHECKLIST_INVALID');
        checklistMinutes+=itemMinutes;
        checklistEarliest=checklistEarliest===null||itemDueAt<checklistEarliest?itemDueAt:checklistEarliest;
        checklistLatest=checklistLatest===null||itemDueAt>checklistLatest?itemDueAt:checklistLatest;
        if(itemDueState==='OVERDUE')checklistHasOverdue=true;
        return {
          id:routineItemId,
          routineItemId:routineItemId,
          title:text(item.title)||'Schoonmaakonderdeel',
          estimatedMinutes:itemMinutes,
          priority:text(item.priority)||'NORMAL',
          dueAt:itemDueAt,
          dueState:itemDueState,
          completed:false
        };
      });
      if(checklistMinutes!==minutes)throw new Error('CLEANING_PLAN_MINUTES_MISMATCH');
      if(checklistEarliest!==Number(draft.earliestDueAt)||checklistLatest!==Number(draft.latestDueAt)||draft.dueState!==(checklistHasOverdue?'OVERDUE':'DUE_IN_WINDOW')){
        throw new Error('CLEANING_PLAN_DUE_SUMMARY_MISMATCH');
      }

      var occurrenceId=occurrenceIdFor(planId,roomId);
      var existing=existingOccurrences[occurrenceId]&&typeof existingOccurrences[occurrenceId]==='object'?existingOccurrences[occurrenceId]:null;
      if(existing){
        if(existing.planId&&text(existing.planId)!==planId)throw new Error('CLEANING_OCCURRENCE_ID_CONFLICT');
        if(existing.householdId&&text(existing.householdId)!==householdId)throw new Error('CLEANING_OCCURRENCE_HOUSEHOLD_CONFLICT');
        if(existing.status!=='DRAFT'&&existing.status!=='CANCELLED')throw new Error('CLEANING_OCCURRENCE_NOT_DRAFT');
      }

      seenRooms[roomId]=true;
      occurrenceIds.push(occurrenceId);
      occurrenceRecords[occurrenceId]={
        id:occurrenceId,
        householdId:householdId,
        planId:planId,
        roomId:roomId,
        routineItemIds:routineIds,
        checklist:checklist,
        assignmentUids:[assignmentUid],
        assignmentStatus:'PROPOSED',
        status:'DRAFT',
        dueState:draft.dueState,
        earliestDueAt:Number(draft.earliestDueAt),
        latestDueAt:Number(draft.latestDueAt),
        estimatedMinutes:minutes,
        scheduledStartAt:null,
        scheduledEndAt:null,
        flexibleWindow:null,
        projections:{taskId:null,calendarEventId:null},
        createdAt:positiveTimestamp(existing&&existing.createdAt)||timestamp,
        createdByUid:text(existing&&existing.createdByUid)||actorUid,
        updatedAt:timestamp,
        updatedByUid:actorUid,
        schemaVersion:1
      };
      routineCount+=draftRoutineCount;
      totalMinutes+=minutes;
      if(draft.dueState==='OVERDUE')overdueCount++;
      if(!computedLoads[assignmentUid])computedLoads[assignmentUid]={estimatedMinutes:0,bundleCount:0};
      computedLoads[assignmentUid].estimatedMinutes+=minutes;
      computedLoads[assignmentUid].bundleCount++;
    });

    var memberLoads=normalizedMemberLoads(concept.summary.memberLoads);
    var loadMinutes=memberLoads.reduce(function(total,load){return total+load.estimatedMinutes;},0);
    if(Number(concept.summary.occurrenceCount)!==occurrenceIds.length||Number(concept.summary.routineCount)!==routineCount||Number(concept.summary.totalEstimatedMinutes)!==totalMinutes||loadMinutes!==totalMinutes){
      throw new Error('CLEANING_PLAN_SUMMARY_MISMATCH');
    }
    if(Number(concept.summary.overdueOccurrenceCount)!==overdueCount||Number(concept.summary.dueInWindowOccurrenceCount)!==occurrenceIds.length-overdueCount){
      throw new Error('CLEANING_PLAN_SUMMARY_MISMATCH');
    }
    var loadLookup=Object.create(null);
    memberLoads.forEach(function(load){
      var computed=computedLoads[load.uid]||{estimatedMinutes:0,bundleCount:0};
      if(load.estimatedMinutes!==computed.estimatedMinutes||load.bundleCount!==computed.bundleCount)throw new Error('CLEANING_PLAN_ASSIGNMENT_SUMMARY_MISMATCH');
      loadLookup[load.uid]=true;
    });
    Object.keys(computedLoads).forEach(function(uid){
      if(!loadLookup[uid])throw new Error('CLEANING_PLAN_ASSIGNMENT_SUMMARY_MISMATCH');
    });
    var loadValues=memberLoads.map(function(load){return load.estimatedMinutes;});
    var computedImbalance=loadValues.length?Math.max.apply(Math,loadValues)-Math.min.apply(Math,loadValues):0;
    if(wholeNumber(concept.summary.imbalanceMinutes,0)!==computedImbalance)throw new Error('CLEANING_PLAN_SUMMARY_MISMATCH');

    var activeLookup=Object.create(null);
    occurrenceIds.forEach(function(id){activeLookup[id]=true;});
    var previousIds=existingPlan&&Array.isArray(existingPlan.occurrenceIds)?existingPlan.occurrenceIds:[];
    previousIds.forEach(function(value){
      var staleId=text(value);
      if(!staleId||activeLookup[staleId]||occurrenceRecords[staleId])return;
      var stale=existingOccurrences[staleId]&&typeof existingOccurrences[staleId]==='object'?existingOccurrences[staleId]:null;
      if(!stale)return;
      if(text(stale.planId)!==planId)throw new Error('CLEANING_OCCURRENCE_ID_CONFLICT');
      if(stale.status==='CANCELLED')return;
      if(stale.status!=='DRAFT')throw new Error('CLEANING_OCCURRENCE_NOT_DRAFT');
      occurrenceRecords[staleId]=Object.assign({},clone(stale),{
        status:'CANCELLED',
        cancelledAt:timestamp,
        cancelledByUid:actorUid,
        updatedAt:timestamp,
        updatedByUid:actorUid
      });
    });

    var summary={
      occurrenceCount:occurrenceIds.length,
      routineCount:routineCount,
      overdueOccurrenceCount:overdueCount,
      dueInWindowOccurrenceCount:occurrenceIds.length-overdueCount,
      totalEstimatedMinutes:totalMinutes,
      imbalanceMinutes:computedImbalance,
      memberLoads:memberLoads
    };

    var planRecord={
      id:planId,
      householdId:householdId,
      status:'DRAFT',
      windowStartAt:planWindow.startAt,
      windowEndAt:planWindow.endAt,
      distributionMode:concept.distributionMode==='FAIR_TIME'?'FAIR_TIME':text(concept.distributionMode),
      occurrenceIds:occurrenceIds,
      summary:summary,
      generationRevision:Math.max(0,wholeNumber(existingPlan&&existingPlan.generationRevision,0)||0)+1,
      generatedAt:timestamp,
      generatedByUid:actorUid,
      createdAt:positiveTimestamp(existingPlan&&existingPlan.createdAt)||timestamp,
      createdByUid:text(existingPlan&&existingPlan.createdByUid)||actorUid,
      updatedAt:timestamp,
      updatedByUid:actorUid,
      schemaVersion:1
    };
    if(planRecord.distributionMode!=='FAIR_TIME')throw new Error('CLEANING_PLAN_DISTRIBUTION_UNSUPPORTED');

    return deepFreeze({
      version:VERSION,
      planId:planId,
      plan:planRecord,
      occurrences:occurrenceRecords,
      activeOccurrenceIds:occurrenceIds.slice()
    });
  }

  window.CleaningPlanPersistenceContract=Object.freeze({
    version:VERSION,
    planIdForWindow:planIdForWindow,
    occurrenceIdFor:occurrenceIdFor,
    materializeDraft:materializeDraft
  });
})();
