'use strict';
// Pure reconciliation for the V2 planner. Finished work remains historical;
// unfinished work follows the current room/routine sources.
(function(){
  function copy(v){return JSON.parse(JSON.stringify(v||{}));}
  function liveRoom(data,id){return !!(data.rooms&&data.rooms[id]&&data.rooms[id].active!==false);}
  function liveRoutine(data,id,roomId){var r=data.routines&&data.routines[id];return !!(r&&r.active!==false&&r.paused!==true&&r.roomId===roomId&&liveRoom(data,roomId));}
  function itemId(item){return String(item.routineItemId||item.id||'');}
  function reconcile(input){
    var data=copy(input.data),material=input.material,planId=material.planId,timestamp=input.timestamp,uid=input.uid;
    data.occurrences=data.occurrences||{};data.plans=data.plans||{};
    var oldPlan=data.plans[planId]||{},kept=[],changed=[],cancelled=[],covered=new Set();
    var ids=Array.from(new Set((oldPlan.occurrenceIds||[]).concat(Object.keys(data.occurrences).filter(function(id){return data.occurrences[id].planId===planId;}))));
    ids.forEach(function(id){
      var row=data.occurrences[id];if(!row||row.planId!==planId)return;
      if(row.householdId&&row.householdId!==input.householdId)throw new Error('CLEANING_PLAN_HOUSEHOLD_CONFLICT');
      if(row.status==='CANCELLED'){cancelled.push(id);return;}
      if(row.status==='COMPLETED'||row.status==='SKIPPED'){
        (row.checklist||[]).forEach(function(item){covered.add(itemId(item));});
        if(liveRoom(data,row.roomId)&&row.status==='COMPLETED')kept.push(id);
        return;
      }
      var items=(row.checklist||[]).filter(function(item){return liveRoutine(data,itemId(item),row.roomId);}).map(function(item){
        var routine=data.routines[itemId(item)];return Object.assign({},item,{title:routine.title||item.title,estimatedMinutes:Number(routine.estimatedMinutes)||item.estimatedMinutes});
      });
      if(!liveRoom(data,row.roomId)||!items.length){
        row.status='CANCELLED';row.assignmentStatus='SKIPPED';row.cancellationReason='SOURCE_REMOVED';row.cancelledAt=timestamp;
        cancelled.push(id);
      }else{
        row.checklist=items;row.routineItemIds=items.map(itemId);row.estimatedMinutes=items.reduce(function(sum,item){return sum+(Number(item.estimatedMinutes)||0);},0);
        items.forEach(function(item){covered.add(itemId(item));});kept.push(id);changed.push(id);
      }
      row.updatedAt=timestamp;row.updatedByUid=uid;
    });
    Object.keys(material.occurrences).forEach(function(id){
      var draft=copy(material.occurrences[id]),items=(draft.checklist||[]).filter(function(item){return !covered.has(itemId(item))&&liveRoutine(data,itemId(item),draft.roomId);});
      if(!items.length)return;
      // Stable draft ids may already belong to completed/skipped work. Never
      // overwrite history when new routines are added to that same room.
      var target=kept.find(function(key){var row=data.occurrences[key];return row.roomId===draft.roomId&&row.status!=='COMPLETED';});
      if(target){
        var row=data.occurrences[target];row.checklist=row.checklist.concat(items);row.routineItemIds=row.checklist.map(itemId);row.estimatedMinutes=row.checklist.reduce(function(sum,item){return sum+(Number(item.estimatedMinutes)||0);},0);
      }else{
        target=id;var suffix=0;while(data.occurrences[target])target=id+'__refresh_'+(++suffix);
        data.occurrences[target]=Object.assign({},copy(draft),{id:target,checklist:items,routineItemIds:items.map(itemId),estimatedMinutes:items.reduce(function(sum,item){return sum+(Number(item.estimatedMinutes)||0);},0),status:'FLEXIBLE',assignmentStatus:'ACTIVE',updatedAt:timestamp,updatedByUid:uid});
        kept.push(target);changed.push(target);
      }
      items.forEach(function(item){covered.add(itemId(item));});
    });
    var rows=kept.map(function(id){return data.occurrences[id];}),loads={};
    rows.forEach(function(row){var assignee=(row.assignmentUids||[])[0];if(!assignee)return;if(!loads[assignee])loads[assignee]={uid:assignee,estimatedMinutes:0,bundleCount:0};loads[assignee].estimatedMinutes+=Number(row.estimatedMinutes)||0;loads[assignee].bundleCount++;});
    data.plans[planId]=Object.assign({},oldPlan,copy(material.plan),{status:'ACTIVE',occurrenceIds:kept,createdAt:oldPlan.createdAt||timestamp,createdByUid:oldPlan.createdByUid||uid,updatedAt:timestamp,updatedByUid:uid,summary:Object.assign({},material.plan.summary,{memberLoads:Object.keys(loads).map(function(id){return loads[id];}),occurrenceCount:rows.length,routineCount:rows.reduce(function(n,r){return n+(r.checklist||[]).length;},0),totalEstimatedMinutes:rows.reduce(function(n,r){return n+(Number(r.estimatedMinutes)||0);},0)})});
    return {data:data,planId:planId,changedIds:changed,cancelledIds:cancelled,empty:!kept.length};
  }
  window.CleaningWeekRefresh={reconcile:reconcile,liveRoom:liveRoom};
})();
