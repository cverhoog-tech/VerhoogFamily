'use strict';
// ============================================================
// CLEANING ACTIVITY PROJECTOR v0.1.0
// Read-only projection from canonical Cleaning completionLogs into the shared
// HouseholdActivity feed. It never owns Cleaning persistence.
//
// Exactly-once is guaranteed by HouseholdActivity ->
// ActivityHouseholdRepository.appendOnce using deterministic occurrenceKey.
// ============================================================
(function(){
  if(window.CleaningActivityProjector)return;

  var VERSION='0.1.0';
  var state={unsubscribe:null,latest:null,inFlight:{},published:{},wakeTimer:null};

  function text(value){return String(value==null?'':value).trim();}
  function num(value){var n=Number(value);return Number.isFinite(n)?n:0;}
  function activity(){return window.HouseholdActivity||null;}
  function repository(){return window.CleaningHouseholdRepository||null;}
  function roomName(data,roomId){var row=data&&data.rooms&&data.rooms[roomId];return text(row&&row.name)||'Ruimte';}
  function actorUid(log){return text(log&&(log.completedByUid||log.finalizedByUid||log.createdByUid||log.updatedByUid))||null;}
  function occurredAt(log){return num(log&&(log.completedAt||log.finalizedAt||log.createdAt||log.updatedAt));}
  function routineCount(log){
    var checklist=Array.isArray(log&&log.checklist)?log.checklist:[];
    if(checklist.length)return checklist.length;
    var ids=Array.isArray(log&&log.routineItemIds)?log.routineItemIds:[];
    return ids.length;
  }
  function completed(log){
    var status=text(log&&log.status).toUpperCase();
    var outcome=text(log&&log.outcome).toUpperCase();
    if(['SKIPPED','PARTIAL','REOPENED','CARRIED_FORWARD','CARRY_FORWARD'].indexOf(status)>=0)return false;
    if(['SKIP','SKIPPED','PARTIAL','REOPENED','CARRIED_FORWARD','CARRY_FORWARD'].indexOf(outcome)>=0)return false;
    return status==='COMPLETED'||outcome==='COMPLETED';
  }
  function eventFor(data,id,log){
    var room=roomName(data,log&&log.roomId),count=routineCount(log),minutes=num(log&&(log.actualMinutes||log.estimatedMinutes));
    var detail=[];
    if(count)detail.push(count+' '+(count===1?'routine':'routines'));
    if(minutes)detail.push(Math.max(0,Math.round(minutes))+' min');
    return{
      type:'cleaning.completed',
      occurrenceKey:'cleaning:completion:'+String(id),
      occurredAt:occurredAt(log)||Date.now(),
      actorUid:actorUid(log),
      source:{module:'cleaning',entityType:'cleaningCompletionLog',entityId:String(id)},
      payload:{
        title:room+' schoongemaakt',
        message:'Schoonmaak afgerond in '+room,
        detail:detail.join(' · ')||null,
        roomId:text(log&&log.roomId)||null,
        roomName:room,
        routineCount:count,
        actualMinutes:minutes||null,
        completionLogId:String(id)
      }
    };
  }
  function publishOne(data,id,log){
    var key='cleaning:completion:'+String(id);
    if(state.published[key]||state.inFlight[key])return Promise.resolve(null);
    var a=activity();if(!a||typeof a.publish!=='function')return Promise.resolve(null);
    state.inFlight[key]=true;
    return Promise.resolve(a.publish(eventFor(data,id,log))).then(function(event){
      state.published[key]=true;return event;
    }).catch(function(error){
      try{console.warn('[CleaningActivityProjector] activity projection deferred',key,error&&error.message||error);}catch(e){}
      return null;
    }).finally(function(){delete state.inFlight[key];});
  }
  function project(snapshot){
    state.latest=snapshot||null;
    if(!snapshot||snapshot.ready!==true)return Promise.resolve([]);
    var a=activity();if(!a||typeof a.publish!=='function'){wake();return Promise.resolve([]);}
    var data=snapshot.data||{},logs=data.completionLogs&&typeof data.completionLogs==='object'?data.completionLogs:{};
    var jobs=[];
    Object.keys(logs).sort().forEach(function(id){var log=logs[id];if(log&&typeof log==='object'&&completed(log))jobs.push(publishOne(data,id,log));});
    return Promise.all(jobs);
  }
  function wake(){
    if(activity()&&typeof activity().publish==='function'){
      if(state.wakeTimer){clearInterval(state.wakeTimer);state.wakeTimer=null;}
      if(state.latest)project(state.latest);
      return true;
    }
    if(state.wakeTimer)return false;
    var tries=0;state.wakeTimer=setInterval(function(){
      tries++;
      if(activity()&&typeof activity().publish==='function'){
        clearInterval(state.wakeTimer);state.wakeTimer=null;if(state.latest)project(state.latest);
      }else if(tries>=200){clearInterval(state.wakeTimer);state.wakeTimer=null;}
    },100);
    return false;
  }
  function attach(){
    if(state.unsubscribe)return true;
    var repo=repository();if(!repo||typeof repo.subscribe!=='function')return false;
    state.unsubscribe=repo.subscribe(function(snapshot){project(snapshot);});
    return true;
  }
  function start(){
    wake();if(attach())return true;
    var tries=0,timer=setInterval(function(){tries++;if(attach()||tries>=200)clearInterval(timer);},100);
    return false;
  }
  function stop(){
    if(state.unsubscribe){try{state.unsubscribe();}catch(e){}state.unsubscribe=null;}
    if(state.wakeTimer){clearInterval(state.wakeTimer);state.wakeTimer=null;}
    state.latest=null;state.inFlight={};state.published={};
  }

  window.CleaningActivityProjector={version:VERSION,start:start,stop:stop,project:project,_eventFor:eventFor,_completed:completed,status:function(){return{version:VERSION,subscribed:!!state.unsubscribe,published:Object.keys(state.published).length,inFlight:Object.keys(state.inFlight).length};}};
  start();
})();
