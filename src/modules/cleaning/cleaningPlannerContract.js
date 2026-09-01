'use strict';
// ============================================================
// CLEANING PLANNER CONTRACT v0.4.0
// Pure due, bundle, member and fair-time semantics: no Firebase, localStorage or DOM work.
// A planning window is half-open: [startAt, endAt).
// ============================================================
(function(){
  if(window.CleaningPlannerContract)return;

  var VERSION='0.4.0';
  var DAY_MS=24*60*60*1000;

  var DUE_STATE=Object.freeze({
    EXCLUDED:'EXCLUDED',
    OVERDUE:'OVERDUE',
    DUE_IN_WINDOW:'DUE_IN_WINDOW',
    FUTURE:'FUTURE'
  });

  var DUE_SOURCE=Object.freeze({
    NEXT_DUE_AT:'NEXT_DUE_AT',
    LAST_COMPLETED_AT:'LAST_COMPLETED_AT',
    CREATED_AT:'CREATED_AT',
    FIRST_WINDOW:'FIRST_WINDOW'
  });

  var EXCLUSION_REASON=Object.freeze({
    INACTIVE:'INACTIVE',
    PAUSED:'PAUSED',
    ROOM_REQUIRED:'ROOM_REQUIRED',
    ROUTINE_ID_REQUIRED:'ROUTINE_ID_REQUIRED',
    ROOM_NOT_FOUND:'ROOM_NOT_FOUND',
    ROOM_INACTIVE:'ROOM_INACTIVE',
    NOT_DUE:'NOT_DUE'
  });

  var PRIORITY_RANK=Object.freeze({BASIC:0,NORMAL:1,EXTRA:2});

  var MEMBER_EXCLUSION_REASON=Object.freeze({
    UID_REQUIRED:'UID_REQUIRED',
    NOT_ACTIVE:'NOT_ACTIVE'
  });

  function finiteTimestamp(value){
    var number=Number(value);
    return Number.isFinite(number)&&number>0?number:null;
  }

  function planningWindow(input){
    var source=input||{};
    var startAt=finiteTimestamp(source.startAt);
    var endAt=finiteTimestamp(source.endAt);
    if(!startAt||!endAt||endAt<=startAt)throw new Error('CLEANING_PLANNING_WINDOW_INVALID');
    return Object.freeze({startAt:startAt,endAt:endAt});
  }

  function deriveDue(routine,windowStartAt){
    var row=routine||{};
    var explicit=finiteTimestamp(row.nextDueAt);
    if(explicit)return{dueAt:explicit,source:DUE_SOURCE.NEXT_DUE_AT};

    var completed=finiteTimestamp(row.lastCompletedAt);
    if(completed){
      var intervalDays=Math.max(1,parseInt(row.intervalDays,10)||7);
      return{dueAt:completed+(intervalDays*DAY_MS),source:DUE_SOURCE.LAST_COMPLETED_AT};
    }

    var created=finiteTimestamp(row.createdAt);
    if(created)return{dueAt:created,source:DUE_SOURCE.CREATED_AT};

    return{dueAt:windowStartAt,source:DUE_SOURCE.FIRST_WINDOW};
  }

  function excluded(reason,window){
    return Object.freeze({
      eligible:false,
      dueThisWindow:false,
      state:DUE_STATE.EXCLUDED,
      reason:reason,
      dueAt:null,
      dueSource:null,
      window:window
    });
  }

  function evaluateRoutineDue(routine,inputWindow){
    var window=planningWindow(inputWindow);
    var row=routine||{};
    if(row.active===false)return excluded(EXCLUSION_REASON.INACTIVE,window);
    if(row.paused===true)return excluded(EXCLUSION_REASON.PAUSED,window);
    if(!String(row.roomId||'').trim())return excluded(EXCLUSION_REASON.ROOM_REQUIRED,window);

    var due=deriveDue(row,window.startAt);
    var state=due.dueAt<window.startAt?DUE_STATE.OVERDUE:(due.dueAt<window.endAt?DUE_STATE.DUE_IN_WINDOW:DUE_STATE.FUTURE);
    return Object.freeze({
      eligible:true,
      dueThisWindow:state===DUE_STATE.OVERDUE||state===DUE_STATE.DUE_IN_WINDOW,
      state:state,
      reason:null,
      dueAt:due.dueAt,
      dueSource:due.source,
      window:window
    });
  }

  function collectionRows(collection){
    if(Array.isArray(collection))return collection.map(function(value){return{key:null,value:value||{}};});
    if(!collection||typeof collection!=='object')return[];
    return Object.keys(collection).map(function(key){return{key:key,value:collection[key]||{}};});
  }

  function compareText(a,b){return a<b?-1:(a>b?1:0);}

  function candidateSort(a,b){
    if(a.dueAt!==b.dueAt)return a.dueAt-b.dueAt;
    var priorityA=Object.prototype.hasOwnProperty.call(PRIORITY_RANK,a.priority)?PRIORITY_RANK[a.priority]:PRIORITY_RANK.NORMAL;
    var priorityB=Object.prototype.hasOwnProperty.call(PRIORITY_RANK,b.priority)?PRIORITY_RANK[b.priority]:PRIORITY_RANK.NORMAL;
    if(priorityA!==priorityB)return priorityA-priorityB;
    return compareText(a.routineId,b.routineId);
  }

  function excludedCandidate(routineId,roomId,evaluation,reason){
    return Object.freeze({
      routineId:routineId||null,
      roomId:roomId||null,
      dueAt:evaluation&&evaluation.dueAt||null,
      dueState:evaluation&&evaluation.state||DUE_STATE.EXCLUDED,
      reason:reason
    });
  }

  function selectDueRoutineItems(input){
    var source=input||{};
    var window=planningWindow(source.window);
    var rooms={};
    collectionRows(source.rooms).forEach(function(entry){
      var row=entry.value;
      // Firebase collection keys are canonical; embedded ids are fallback for array/test input only.
      var id=String(entry.key||row.id||'').trim();
      if(id&&!Object.prototype.hasOwnProperty.call(rooms,id))rooms[id]=row;
    });

    var candidates=[];
    var excluded=[];
    collectionRows(source.routines).forEach(function(entry){
      var row=entry.value;
      var routineId=String(entry.key||row.id||'').trim();
      var roomId=String(row.roomId||'').trim();
      if(!routineId){excluded.push(excludedCandidate(null,roomId,null,EXCLUSION_REASON.ROUTINE_ID_REQUIRED));return;}

      var evaluation=evaluateRoutineDue(row,window);
      if(!evaluation.eligible){excluded.push(excludedCandidate(routineId,roomId,evaluation,evaluation.reason));return;}
      if(!Object.prototype.hasOwnProperty.call(rooms,roomId)){excluded.push(excludedCandidate(routineId,roomId,evaluation,EXCLUSION_REASON.ROOM_NOT_FOUND));return;}
      if(rooms[roomId].active===false){excluded.push(excludedCandidate(routineId,roomId,evaluation,EXCLUSION_REASON.ROOM_INACTIVE));return;}
      if(!evaluation.dueThisWindow){excluded.push(excludedCandidate(routineId,roomId,evaluation,EXCLUSION_REASON.NOT_DUE));return;}

      candidates.push(Object.freeze({
        routineId:routineId,
        roomId:roomId,
        title:String(row.title||'').trim(),
        dueAt:evaluation.dueAt,
        dueSource:evaluation.dueSource,
        dueState:evaluation.state,
        estimatedMinutes:Math.max(1,parseInt(row.estimatedMinutes,10)||10),
        priority:Object.prototype.hasOwnProperty.call(PRIORITY_RANK,row.priority)?row.priority:'NORMAL'
      }));
    });

    candidates.sort(candidateSort);
    excluded.sort(function(a,b){return compareText(String(a.routineId||''),String(b.routineId||''));});
    return Object.freeze({window:window,candidates:Object.freeze(candidates),excluded:Object.freeze(excluded)});
  }

  function bundleCandidatesByRoom(input){
    var source=input||{};
    var rooms={};
    collectionRows(source.rooms).forEach(function(entry){
      var row=entry.value;
      var id=String(entry.key||row.id||'').trim();
      if(id&&!Object.prototype.hasOwnProperty.call(rooms,id))rooms[id]=row;
    });

    var grouped={};
    var seenRoutineIds={};
    var candidates=Array.isArray(source.candidates)?source.candidates.slice():[];
    candidates.forEach(function(candidate){
      var row=candidate||{};
      var routineId=String(row.routineId||'').trim();
      var roomId=String(row.roomId||'').trim();
      var dueAt=finiteTimestamp(row.dueAt);
      if(!routineId||!roomId||!dueAt)throw new Error('CLEANING_PLANNER_CANDIDATE_INVALID');
      if(row.dueState!==DUE_STATE.OVERDUE&&row.dueState!==DUE_STATE.DUE_IN_WINDOW)throw new Error('CLEANING_PLANNER_CANDIDATE_NOT_DUE');
      if(seenRoutineIds[routineId])throw new Error('CLEANING_PLANNER_DUPLICATE_ROUTINE_CANDIDATE');
      seenRoutineIds[routineId]=true;
      if(!Object.prototype.hasOwnProperty.call(rooms,roomId))throw new Error('CLEANING_PLANNER_BUNDLE_ROOM_NOT_FOUND');
      if(rooms[roomId].active===false)throw new Error('CLEANING_PLANNER_BUNDLE_ROOM_INACTIVE');

      var priority=Object.prototype.hasOwnProperty.call(PRIORITY_RANK,row.priority)?row.priority:'NORMAL';
      var minutes=Math.max(1,parseInt(row.estimatedMinutes,10)||10);
      if(!grouped[roomId])grouped[roomId]=[];
      grouped[roomId].push({
        routineId:routineId,
        roomId:roomId,
        title:String(row.title||'').trim()||'Schoonmaakonderdeel',
        dueAt:dueAt,
        dueState:row.dueState,
        estimatedMinutes:minutes,
        priority:priority
      });
    });

    var bundles=Object.keys(grouped).map(function(roomId){
      var room=rooms[roomId]||{};
      var rows=grouped[roomId].sort(candidateSort);
      var checklist=rows.map(function(row){
        return Object.freeze({
          id:row.routineId,
          routineItemId:row.routineId,
          title:row.title,
          estimatedMinutes:row.estimatedMinutes,
          priority:row.priority,
          dueAt:row.dueAt,
          dueState:row.dueState,
          completed:false
        });
      });
      var total=checklist.reduce(function(sum,item){return sum+item.estimatedMinutes;},0);
      var earliest=checklist[0]&&checklist[0].dueAt||null;
      var latest=checklist.reduce(function(value,item){return value===null||item.dueAt>value?item.dueAt:value;},null);
      var dueState=checklist.some(function(item){return item.dueState===DUE_STATE.OVERDUE;})?DUE_STATE.OVERDUE:DUE_STATE.DUE_IN_WINDOW;
      return Object.freeze({
        bundleKey:'room:'+roomId,
        roomId:roomId,
        roomName:String(room.name||'').trim()||'Ruimte',
        roomType:String(room.type||'custom').trim()||'custom',
        distributionMode:String(room.distributionMode||'FAIR_TIME').trim()||'FAIR_TIME',
        dueState:dueState,
        earliestDueAt:earliest,
        latestDueAt:latest,
        estimatedMinutes:total,
        routineCount:checklist.length,
        routineItemIds:Object.freeze(checklist.map(function(item){return item.routineItemId;})),
        checklist:Object.freeze(checklist)
      });
    });

    bundles.sort(function(a,b){
      if(a.earliestDueAt!==b.earliestDueAt)return a.earliestDueAt-b.earliestDueAt;
      return compareText(a.roomId,b.roomId);
    });
    return Object.freeze({bundles:Object.freeze(bundles)});
  }

  function selectEligibleHouseholdMembers(input){
    var eligible=[];
    var excluded=[];
    var seen={};
    collectionRows(input).forEach(function(entry){
      var row=entry.value;
      // Firebase member-map keys or bridge-provided uid are canonical; legacy display ids are not.
      var uid=String(entry.key||row.uid||'').trim();
      if(!uid){excluded.push(Object.freeze({uid:null,reason:MEMBER_EXCLUSION_REASON.UID_REQUIRED}));return;}
      if(seen[uid])throw new Error('CLEANING_PLANNER_DUPLICATE_MEMBER_UID');
      seen[uid]=true;
      var status=String(row.status||'active').trim().toLowerCase();
      if(status!=='active'){
        excluded.push(Object.freeze({uid:uid,reason:MEMBER_EXCLUSION_REASON.NOT_ACTIVE}));
        return;
      }
      eligible.push(Object.freeze({
        uid:uid,
        displayName:String(row.displayName||row.name||'Gezinslid').trim()||'Gezinslid',
        role:String(row.role||'member').trim()||'member',
        joinedAt:finiteTimestamp(row.joinedAt)||null
      }));
    });
    eligible.sort(function(a,b){
      if(a.joinedAt&&b.joinedAt&&a.joinedAt!==b.joinedAt)return a.joinedAt-b.joinedAt;
      return compareText(a.uid,b.uid);
    });
    excluded.sort(function(a,b){return compareText(String(a.uid||''),String(b.uid||''));});
    return Object.freeze({members:Object.freeze(eligible),excluded:Object.freeze(excluded)});
  }

  function assignFairTime(input){
    var source=input||{};
    var memberSelection=selectEligibleHouseholdMembers(source.members);
    var bundles=Array.isArray(source.bundles)?source.bundles.slice():[];
    if(bundles.length&&!memberSelection.members.length)throw new Error('CLEANING_PLANNER_ACTIVE_MEMBER_REQUIRED');

    var bundleOrder={};
    var seenBundles={};
    bundles.forEach(function(bundle,index){
      var key=String(bundle&&bundle.bundleKey||'').trim();
      var roomId=String(bundle&&bundle.roomId||'').trim();
      var minutes=parseInt(bundle&&bundle.estimatedMinutes,10);
      if(!key||!roomId||!Number.isFinite(minutes)||minutes<1)throw new Error('CLEANING_PLANNER_BUNDLE_INVALID');
      if(seenBundles[key])throw new Error('CLEANING_PLANNER_DUPLICATE_BUNDLE_KEY');
      seenBundles[key]=true;
      bundleOrder[key]=index;
      if(String(bundle.distributionMode||'FAIR_TIME')!=='FAIR_TIME')throw new Error('CLEANING_PLANNER_DISTRIBUTION_MODE_UNSUPPORTED');
    });

    var loads={};
    memberSelection.members.forEach(function(member,index){
      loads[member.uid]={uid:member.uid,order:index,estimatedMinutes:0,bundleCount:0};
    });

    var work=bundles.slice().sort(function(a,b){
      var byMinutes=Number(b.estimatedMinutes)-Number(a.estimatedMinutes);
      if(byMinutes)return byMinutes;
      var dueA=finiteTimestamp(a.earliestDueAt)||Number.MAX_SAFE_INTEGER;
      var dueB=finiteTimestamp(b.earliestDueAt)||Number.MAX_SAFE_INTEGER;
      if(dueA!==dueB)return dueA-dueB;
      return compareText(String(a.bundleKey),String(b.bundleKey));
    });

    var assignments=work.map(function(bundle){
      var target=memberSelection.members.map(function(member){return loads[member.uid];}).sort(function(a,b){
        if(a.estimatedMinutes!==b.estimatedMinutes)return a.estimatedMinutes-b.estimatedMinutes;
        if(a.bundleCount!==b.bundleCount)return a.bundleCount-b.bundleCount;
        return a.order-b.order;
      })[0];
      var minutes=parseInt(bundle.estimatedMinutes,10);
      target.estimatedMinutes+=minutes;
      target.bundleCount+=1;
      return Object.freeze({
        bundleKey:String(bundle.bundleKey),
        roomId:String(bundle.roomId),
        assignedUid:target.uid,
        assignmentUids:Object.freeze([target.uid]),
        distributionMode:'FAIR_TIME',
        estimatedMinutes:minutes
      });
    });
    assignments.sort(function(a,b){return bundleOrder[a.bundleKey]-bundleOrder[b.bundleKey];});

    var memberLoads=memberSelection.members.map(function(member){
      var load=loads[member.uid];
      return Object.freeze({uid:member.uid,estimatedMinutes:load.estimatedMinutes,bundleCount:load.bundleCount});
    });
    var total=memberLoads.reduce(function(sum,load){return sum+load.estimatedMinutes;},0);
    var values=memberLoads.map(function(load){return load.estimatedMinutes;});
    var imbalance=values.length?Math.max.apply(Math,values)-Math.min.apply(Math,values):0;
    return Object.freeze({
      distributionMode:'FAIR_TIME',
      members:memberSelection.members,
      excludedMembers:memberSelection.excluded,
      assignments:Object.freeze(assignments),
      memberLoads:Object.freeze(memberLoads),
      totalEstimatedMinutes:total,
      imbalanceMinutes:imbalance
    });
  }

  window.CleaningPlannerContract=Object.freeze({
    version:VERSION,
    DAY_MS:DAY_MS,
    DUE_STATE:DUE_STATE,
    DUE_SOURCE:DUE_SOURCE,
    EXCLUSION_REASON:EXCLUSION_REASON,
    MEMBER_EXCLUSION_REASON:MEMBER_EXCLUSION_REASON,
    planningWindow:planningWindow,
    evaluateRoutineDue:evaluateRoutineDue,
    selectDueRoutineItems:selectDueRoutineItems,
    bundleCandidatesByRoom:bundleCandidatesByRoom,
    selectEligibleHouseholdMembers:selectEligibleHouseholdMembers,
    assignFairTime:assignFairTime
  });
})();
