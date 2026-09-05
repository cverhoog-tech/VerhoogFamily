'use strict';
// ============================================================
// CLEANING NOTIFICATION PROJECTOR v0.1.0
// Limited, bundled Cleaning collaboration notifications + one daily reminder.
//
// Canonical notification persistence stays in NotificationStore / the
// NotificationHouseholdRepository. This projector NEVER mutates Cleaning.
// Cleaning actions (accept/decline/help/assignment) remain owned by the
// existing Cleaning UIs and runtimes; notifications are presentation only.
// ============================================================
(function(){
  if(window.CleaningNotificationProjector)return;

  var VERSION='0.1.0';
  var MAX_EVENT_AGE_MS=14*86400000;
  var state={unsubscribe:null,identity:null,inFlight:{},lastReminderKey:null};
  var TYPES=[
    'cleaning.assignment.requested',
    'cleaning.assignment.countered',
    'cleaning.assignment.resolved',
    'cleaning.help.requested',
    'cleaning.help.resolved',
    'cleaning.reminder.daily'
  ];

  function text(value){return String(value==null?'':value).trim();}
  function number(value){var n=Number(value);return Number.isFinite(n)?n:0;}
  function now(){return Date.now();}
  function context(){try{return window.HouseholdContext&&window.HouseholdContext.snapshot?window.HouseholdContext.snapshot():null;}catch(e){return null;}}
  function validContext(ctx){return !!(ctx&&ctx.ready===true&&text(ctx.uid)&&text(ctx.householdId));}
  function identity(ctx){return validContext(ctx)?[text(ctx.uid),text(ctx.householdId),String(ctx.revision||0)].join('|'):null;}
  function repository(){return window.CleaningHouseholdRepository||null;}
  function store(){return window.NotificationStore||null;}
  function fresh(timestamp){var value=number(timestamp);return value>0&&value>=now()-MAX_EVENT_AGE_MS&&value<=now()+60000;}
  function members(){
    try{
      var bridge=window.HouseholdIdentityFirebaseBridge;
      var rows=bridge&&typeof bridge.getMembers==='function'?bridge.getMembers():[];
      return Array.isArray(rows)?rows:[];
    }catch(e){return[];}
  }
  function memberName(uid){
    uid=text(uid);var row=members().find(function(member){return text(member&&(member.uid||member.id))===uid;});
    return text(row&&(row.displayName||row.name))||'Gezinslid';
  }
  function actor(uid){uid=text(uid);return{uid:uid||'system',name:uid?memberName(uid):'FamilyApp'};}
  function roomName(data,roomId){var row=data&&data.rooms&&data.rooms[roomId];return text(row&&row.name)||'een ruimte';}
  function routineLabel(data,routine){return text(routine&&routine.title)||('Schoonmaakroutine · '+roomName(data,routine&&routine.roomId));}
  function occurrenceLabel(data,row){return 'Schoonmaken · '+roomName(data,row&&row.roomId);}
  function eventKey(){return Array.prototype.slice.call(arguments).map(function(value){return text(value)||'none';}).join(':');}
  function safePublish(key,fn){
    if(!key||state.inFlight[key])return Promise.resolve(null);
    state.inFlight[key]=true;
    return Promise.resolve().then(fn).catch(function(error){
      console.warn('[CleaningNotificationProjector]',error&&error.message||error);return null;
    }).finally(function(){delete state.inFlight[key];});
  }
  function registerTypes(){var s=store();if(!s||typeof s.registerType!=='function')return false;TYPES.forEach(function(type){s.registerType(type);});return true;}
  function publishTo(key,type,uids,payload){
    var s=store();if(!s||typeof s.publishToUidsOnce!=='function')return Promise.resolve(null);
    var unique={},targets=(uids||[]).map(text).filter(function(uid){if(!uid||unique[uid])return false;unique[uid]=true;return true;});
    if(!targets.length)return Promise.resolve(null);
    return safePublish(key,function(){return s.publishToUidsOnce(key,type,targets,payload);});
  }
  function publishSelf(key,type,payload){
    var s=store();if(!s||typeof s.publishSelfOnce!=='function')return Promise.resolve(null);
    return safePublish(key,function(){return s.publishSelfOnce(key,type,payload);});
  }

  function projectHelp(data){
    var rows=data&&data.occurrences||{};
    Object.keys(rows).forEach(function(id){
      var occurrence=rows[id],request=occurrence&&occurrence.helpRequest;
      if(!request||typeof request!=='object')return;
      var fromUid=text(request.fromUid),toUid=text(request.toUid),requestedAt=number(request.requestedAt),status=text(request.status).toUpperCase();
      if(fromUid&&toUid&&fresh(requestedAt)){
        var requestKey=eventKey('cleaning.help.requested',id,requestedAt,toUid);
        publishTo(requestKey,'cleaning.help.requested',[toUid],{
          actor:actor(fromUid),icon:'help',bg:'#dbeafe',tone:'action',
          title:memberName(fromUid)+' vraagt je om hulp',
          body:'Kun je helpen met “'+occurrenceLabel(data,occurrence)+'”? Open Schoonmaken om te reageren.',
          entity:{type:'cleaningOccurrence',id:String(id)},
          data:{occurrenceId:String(id),fromUid:fromUid,toUid:toUid,action:'openCleaning'},
          channels:['inApp','push']
        });
      }
      var respondedAt=number(request.respondedAt),respondedBy=text(request.respondedByUid);
      if(fromUid&&respondedBy&&fresh(respondedAt)&&(status==='ACCEPTED'||status==='DECLINED')){
        var resolvedKey=eventKey('cleaning.help.resolved',id,respondedAt,status);
        publishTo(resolvedKey,'cleaning.help.resolved',[fromUid],{
          actor:actor(respondedBy),icon:status==='ACCEPTED'?'party':'help',bg:status==='ACCEPTED'?'#dcfce7':'#f1f5f9',tone:status==='ACCEPTED'?'success':'neutral',
          title:memberName(respondedBy)+(status==='ACCEPTED'?' helpt mee':' kan niet helpen'),
          body:'Bij “'+occurrenceLabel(data,occurrence)+'”.',
          entity:{type:'cleaningOccurrence',id:String(id)},
          data:{occurrenceId:String(id),fromUid:fromUid,toUid:toUid,status:status,action:'openCleaning'},
          channels:['inApp','push']
        });
      }
    });
  }

  function projectAssignments(data){
    var rows=data&&data.routines||{};
    Object.keys(rows).forEach(function(id){
      var routine=rows[id];if(!routine||routine.active===false)return;
      var status=text(routine.assignmentRequestStatus).toUpperCase();
      var requester=text(routine.assignmentRequestedByUid),target=text(routine.preferredAssigneeUid),requestedAt=number(routine.assignmentRequestedAt);
      if(status==='PENDING'&&requester&&target&&requester!==target&&fresh(requestedAt)){
        var requestKey=eventKey('cleaning.assignment.requested',id,requestedAt,target);
        publishTo(requestKey,'cleaning.assignment.requested',[target],{
          actor:actor(requester),icon:'tasks',bg:'#ede9fe',tone:'action',
          title:memberName(requester)+' vraagt je een routine over te nemen',
          body:'“'+routineLabel(data,routine)+'”. Open Schoonmaken om te accepteren, af te wijzen of een tegenvoorstel te doen.',
          entity:{type:'cleaningRoutine',id:String(id)},
          data:{routineId:String(id),requesterUid:requester,targetUid:target,action:'openCleaning'},
          channels:['inApp','push']
        });
      }

      var counterAt=number(routine.assignmentCounterProposedAt),counterBy=text(routine.assignmentCounterProposedByUid),counterTarget=text(routine.assignmentCounterProposedUid);
      if(status==='COUNTER_PROPOSED'&&requester&&counterBy&&counterTarget&&fresh(counterAt)){
        var counterKey=eventKey('cleaning.assignment.countered',id,counterAt,counterTarget);
        publishTo(counterKey,'cleaning.assignment.countered',[requester],{
          actor:actor(counterBy),icon:'undo',bg:'#fef3c7',tone:'action',
          title:memberName(counterBy)+' heeft een tegenvoorstel',
          body:'Voor “'+routineLabel(data,routine)+'”: '+memberName(counterTarget)+' wordt voorgesteld. Open Schoonmaken om te reageren.',
          entity:{type:'cleaningRoutine',id:String(id)},
          data:{routineId:String(id),requesterUid:requester,counterByUid:counterBy,counterTargetUid:counterTarget,action:'openCleaning'},
          channels:['inApp','push']
        });
      }

      var resolvedAt=number(routine.assignmentLastRequestResolvedAt),resolvedBy=text(routine.assignmentLastRequestResolvedByUid),outcome=text(routine.assignmentLastRequestOutcome).toUpperCase();
      if(requester&&resolvedBy&&requester!==resolvedBy&&fresh(resolvedAt)&&outcome&&outcome!=='COUNTER_PROPOSED'){
        var accepted=outcome.indexOf('ACCEPT')>=0&&!/DECLINED/.test(outcome);
        var declined=outcome.indexOf('DECLIN')>=0;
        if(accepted||declined){
          var resolvedKey=eventKey('cleaning.assignment.resolved',id,resolvedAt,outcome);
          publishTo(resolvedKey,'cleaning.assignment.resolved',[requester],{
            actor:actor(resolvedBy),icon:accepted?'tasks':'undo',bg:accepted?'#dcfce7':'#f1f5f9',tone:accepted?'success':'neutral',
            title:memberName(resolvedBy)+(accepted?' accepteerde de schoonmaakroutine':' wees de schoonmaakroutine af'),
            body:'“'+routineLabel(data,routine)+'”.',
            entity:{type:'cleaningRoutine',id:String(id)},
            data:{routineId:String(id),requesterUid:requester,resolvedByUid:resolvedBy,outcome:outcome,action:'openCleaning'},
            channels:['inApp','push']
          });
        }
      }
    });
  }

  function localDateKey(value){
    var d=value instanceof Date?value:new Date(Number(value)||now());
    var y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');
    return y+'-'+m+'-'+day;
  }
  function localMidnight(value){var d=new Date(Number(value)||now());d.setHours(0,0,0,0);return d.getTime();}
  function dateAtLocalMidnight(iso){
    var match=/^(\d{4})-(\d{2})-(\d{2})$/.exec(text(iso));if(!match)return 0;
    var d=new Date(Number(match[1]),Number(match[2])-1,Number(match[3]),0,0,0,0);return isNaN(d.getTime())?0:d.getTime();
  }
  function dueAt(row){
    if(!row)return 0;
    var scheduledDate=dateAtLocalMidnight(row.scheduledDate);if(scheduledDate)return scheduledDate;
    var scheduled=number(row.scheduledStartAt);if(scheduled)return localMidnight(scheduled);
    var flexible=number(row.flexibleWindow&&row.flexibleWindow.startAt);if(flexible)return localMidnight(flexible);
    var earliest=number(row.earliestDueAt);if(earliest)return localMidnight(earliest);
    var slot=number(row.slotAt);return slot?localMidnight(slot):0;
  }
  function assignedTo(row,uid){return Array.isArray(row&&row.assignmentUids)&&row.assignmentUids.map(String).indexOf(String(uid))>=0;}
  function remindable(row,uid){
    if(!row||!assignedTo(row,uid))return false;
    var status=text(row.status).toUpperCase(),assignment=text(row.assignmentStatus).toUpperCase();
    if(['COMPLETED','CANCELLED','SKIPPED','PROPOSED'].indexOf(status)>=0)return false;
    if(['COMPLETED','CANCELLED','SKIPPED','PROPOSED'].indexOf(assignment)>=0)return false;
    return assignment==='ACTIVE'||['ACTIVE','FLEXIBLE','SCHEDULED'].indexOf(status)>=0;
  }
  function projectDailyReminder(data,ctx){
    var uid=text(ctx&&ctx.uid);if(!uid)return;
    var today=localMidnight(now()),todayKey=localDateKey(today),todayCount=0,overdueCount=0;
    var rows=data&&data.occurrences||{};
    Object.keys(rows).forEach(function(id){var row=rows[id];if(!remindable(row,uid))return;var due=dueAt(row);if(!due)return;if(due<today)overdueCount++;else if(due===today)todayCount++;});
    if(!todayCount&&!overdueCount)return;
    var key=eventKey('cleaning.reminder.daily',uid,todayKey);
    if(state.lastReminderKey===key&&state.inFlight[key])return;
    state.lastReminderKey=key;
    var parts=[];if(todayCount)parts.push(todayCount+' '+(todayCount===1?'schoonmaakbeurt':'schoonmaakbeurten')+' vandaag');if(overdueCount)parts.push(overdueCount+' achterstallig');
    publishSelf(key,'cleaning.reminder.daily',{
      actor:actor(null),icon:'bell',bg:'#eef2ff',tone:overdueCount?'action':'neutral',
      title:overdueCount?'Schoonmaken vraagt aandacht':'Schoonmaken voor vandaag',
      body:parts.join(' · ')+'. Open Schoonmaken voor je planning.',
      entity:{type:'cleaning',id:'today'},
      data:{date:todayKey,todayCount:todayCount,overdueCount:overdueCount,action:'openCleaning'},
      channels:['inApp','push']
    });
  }

  function project(snapshot){
    if(!snapshot||snapshot.ready!==true)return;
    var ctx=context();if(!validContext(ctx))return;
    var nextIdentity=identity(ctx);if(nextIdentity!==state.identity){state.identity=nextIdentity;state.inFlight={};state.lastReminderKey=null;}
    if(!registerTypes())return;
    var data=snapshot.data||{};
    projectHelp(data);
    projectAssignments(data);
    projectDailyReminder(data,ctx);
  }

  function attach(){
    if(state.unsubscribe)return true;
    var repo=repository();if(!repo||typeof repo.subscribe!=='function')return false;
    state.unsubscribe=repo.subscribe(project);return true;
  }
  function start(){
    registerTypes();if(attach())return true;
    var tries=0,timer=setInterval(function(){tries++;if(attach()||tries>200)clearInterval(timer);},100);return false;
  }
  function stop(){if(state.unsubscribe){try{state.unsubscribe();}catch(e){}state.unsubscribe=null;}state.identity=null;state.inFlight={};state.lastReminderKey=null;}

  window.CleaningNotificationProjector={version:VERSION,start:start,stop:stop,project:project,status:function(){return{version:VERSION,subscribed:!!state.unsubscribe,identity:state.identity,inFlight:Object.keys(state.inFlight).length,lastReminderKey:state.lastReminderKey};},_dueAt:dueAt,_remindable:remindable};
  start();
})();
