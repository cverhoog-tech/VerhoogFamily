'use strict';
// ============================================================
// CLEANING PAUSE AGENDA PROJECTION v0.1.0
// Projects a finite Cleaning pause to one read-only FamilyApp Agenda marker.
// Cleaning pause state remains canonical; Calendar is derived presentation.
// - room pause => one room resume marker
// - direct routine pause => one routine resume marker
// - ROOM-paused routines do not create duplicate markers
// - indefinite pauses have no invented resume date
// - manual/automatic resume removes the stale marker
// ============================================================
(function(){
  if(window.CleaningPauseAgendaProjection)return;

  var VERSION='0.1.0';
  var state={queued:false,inFlight:null,dirty:false,lastResult:null,lastError:null};
  var INVALID_KEY=/[.#$\[\]\/\u0000-\u001F\u007F]/g;

  function clone(value){if(value===undefined)return undefined;try{return JSON.parse(JSON.stringify(value));}catch(error){return value;}}
  function text(value){return String(value==null?'':value).trim();}
  function safe(value){return text(value).replace(INVALID_KEY,'_');}
  function now(){return Date.now();}
  function pad(value){return value<10?'0'+value:String(value);}
  function localDate(timestamp){var date=new Date(Number(timestamp)||now());return date.getFullYear()+'-'+pad(date.getMonth()+1)+'-'+pad(date.getDate());}
  function context(){try{return window.HouseholdContext&&window.HouseholdContext.snapshot?window.HouseholdContext.snapshot():null;}catch(error){return null;}}
  function capture(){try{return window.HouseholdContext&&window.HouseholdContext.capture?window.HouseholdContext.capture():null;}catch(error){return null;}}
  function current(token){try{return !!(window.HouseholdContext&&window.HouseholdContext.isCurrent&&window.HouseholdContext.isCurrent(token));}catch(error){return false;}}
  function database(){try{return window.fbDb||(window.firebase&&window.firebase.database&&window.firebase.database())||null;}catch(error){return null;}}
  function validContext(value){return !!(value&&value.ready===true&&value.uid&&value.householdId);}
  function markerId(kind,id){return 'cleaning_pause_resume_'+safe(kind)+'_'+safe(id);}
  function markerKey(kind,id){return 'id_'+markerId(kind,id);}
  function isManaged(row){return !!(row&&row.pauseResumeManaged===true&&text(row.sourceType)==='cleaning-pause-resume');}
  function roomName(cleaning,roomId){var row=cleaning&&cleaning.rooms&&cleaning.rooms[roomId];return text(row&&row.name)||'Kamer';}

  function markerEvent(kind,id,row,cleaning,householdId,actorUid,timestamp,existing){
    var until=Number(row&&row.pauseUntilAt)||0,key=markerKey(kind,id),eventId=markerId(kind,id),isRoom=kind==='room';
    var roomLabel=isRoom?(text(row&&row.name)||'Kamer'):roomName(cleaning,text(row&&row.roomId));
    var title=isRoom?'Schoonmaken hervat · '+roomLabel:'Routine hervat · '+(text(row&&row.title)||'Schoonmaakroutine');
    var description=isRoom
      ? 'Vanaf vandaag wordt de schoonmaakplanning voor '+roomLabel+' automatisch hervat.'
      : 'Vanaf vandaag wordt '+(text(row&&row.title)||'deze routine')+' in '+roomLabel+' automatisch hervat.';
    return {
      id:eventId,_key:key,householdId:householdId,title:title,date:localDate(until),time:'',description:description,
      color:'#7c3aed',who:null,flexible:true,completed:false,_imported:false,
      sourceType:'cleaning-pause-resume',sourceId:text(id),pauseResumeKind:kind,pauseResumeUntilAt:until,pauseResumeManaged:true,
      createdAt:Number(existing&&existing.createdAt)||Number(row&&row.pausedAt)||timestamp,
      createdByUid:text(existing&&existing.createdByUid)||text(row&&row.pausedByUid)||actorUid,
      updatedAt:timestamp,updatedByUid:actorUid,schemaVersion:2
    };
  }

  function stable(row){
    return {
      title:text(row&&row.title),date:text(row&&row.date),time:text(row&&row.time),description:text(row&&row.description),
      flexible:row&&row.flexible===true,completed:row&&row.completed===true,sourceType:text(row&&row.sourceType),sourceId:text(row&&row.sourceId),
      pauseResumeKind:text(row&&row.pauseResumeKind),pauseResumeUntilAt:Number(row&&row.pauseResumeUntilAt)||0,pauseResumeManaged:row&&row.pauseResumeManaged===true
    };
  }

  function desiredMarkers(cleaning,calendarEvents,householdId,actorUid,timestamp){
    var root=cleaning&&typeof cleaning==='object'?cleaning:{},events=calendarEvents&&typeof calendarEvents==='object'?calendarEvents:{},desired={};
    var rooms=root.rooms&&typeof root.rooms==='object'?root.rooms:{};
    Object.keys(rooms).forEach(function(id){
      var row=rooms[id],until=Number(row&&row.pauseUntilAt)||0;if(!row||row.active===false||row.paused!==true||until<=timestamp)return;
      var key=markerKey('room',id);desired[key]=markerEvent('room',id,row,root,householdId,actorUid,timestamp,events[key]);
    });
    var routines=root.routines&&typeof root.routines==='object'?root.routines:{};
    Object.keys(routines).forEach(function(id){
      var row=routines[id],until=Number(row&&row.pauseUntilAt)||0;if(!row||row.active===false||row.paused!==true||text(row.pauseSource)==='ROOM'||until<=timestamp)return;
      var key=markerKey('routine',id);desired[key]=markerEvent('routine',id,row,root,householdId,actorUid,timestamp,events[key]);
    });
    return desired;
  }

  function buildUpdates(input){
    var source=input||{},cleaning=source.cleaning&&typeof source.cleaning==='object'?source.cleaning:{},events=source.calendarEvents&&typeof source.calendarEvents==='object'?source.calendarEvents:{},householdId=text(source.householdId),actorUid=text(source.actorUid),timestamp=Number(source.timestamp)||now();
    var desired=desiredMarkers(cleaning,events,householdId,actorUid,timestamp),updates={},created=0,updated=0,removed=0;
    Object.keys(desired).forEach(function(key){var existing=events[key],next=desired[key];if(!existing){updates['calendarEvents/'+key]=next;created++;return;}if(JSON.stringify(stable(existing))!==JSON.stringify(stable(next))){updates['calendarEvents/'+key]=next;updated++;}});
    Object.keys(events).forEach(function(key){var row=events[key];if(!isManaged(row)||desired[key])return;updates['calendarEvents/'+key]=null;removed++;});
    return {updates:updates,created:created,updated:updated,removed:removed,desiredCount:Object.keys(desired).length};
  }

  function emit(detail){state.lastResult=clone(detail||{});state.lastError=detail&&detail.error||null;try{window.dispatchEvent(new CustomEvent('familyapp:cleaning-pause-agenda',{detail:clone(detail||{})}));}catch(error){}}

  function reconcile(){
    if(state.inFlight){state.dirty=true;return state.inFlight;}
    var ctx=context(),db=database(),token=capture();if(!validContext(ctx)||!db||!token||!current(token))return Promise.resolve(null);
    var familyRef=db.ref('families/'+ctx.householdId),work=Promise.all([familyRef.child('cleaning').once('value'),familyRef.child('calendarEvents').once('value')]).then(function(values){
      if(!current(token))throw new Error('CLEANING_PAUSE_AGENDA_CONTEXT_CHANGED');
      var result=buildUpdates({cleaning:values[0]&&values[0].val?values[0].val():{},calendarEvents:values[1]&&values[1].val?values[1].val():{},householdId:ctx.householdId,actorUid:ctx.uid,timestamp:now()}),keys=Object.keys(result.updates);
      if(!keys.length){emit(Object.assign({status:'synced'},result));return result;}
      return familyRef.update(result.updates).then(function(){if(!current(token))throw new Error('CLEANING_PAUSE_AGENDA_CONTEXT_CHANGED_AFTER_WRITE');emit(Object.assign({status:'projected'},result));return result;});
    }).catch(function(error){emit({status:'error',error:error&&error.message||String(error)});throw error;}).finally(function(){state.inFlight=null;if(state.dirty){state.dirty=false;queue();}});
    state.inFlight=work;return work;
  }

  function queue(){if(state.queued)return;state.queued=true;window.setTimeout(function(){state.queued=false;reconcile().catch(function(){});},40);}
  function start(){if(window.__cleaningPauseAgendaProjectionStarted)return;window.__cleaningPauseAgendaProjectionStarted=true;window.addEventListener('familyapp:cleaning-repository',queue);window.addEventListener('familyapp:household-context',queue);window.addEventListener('focus',queue);queue();}

  window.CleaningPauseAgendaProjection={version:VERSION,start:start,reconcile:reconcile,status:function(){return clone({version:VERSION,lastResult:state.lastResult,lastError:state.lastError,busy:!!state.inFlight});},_buildUpdates:buildUpdates,_markerId:markerId,_markerKey:markerKey,_localDate:localDate};
  start();
})();
