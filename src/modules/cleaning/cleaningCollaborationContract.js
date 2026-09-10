'use strict';
// CLEANING COLLABORATION CONTRACT v2.1.0
// Pure occurrence-level state transitions. No Firebase, DOM, notification or
// projection writes live here: CleaningOccurrence remains the only authority.
(function(global){
  if(global.CleaningCollaborationContract)return;
  var VERSION='2.1.0';
  function text(v){return String(v==null?'':v).trim();}
  function clone(v){return JSON.parse(JSON.stringify(v));}
  function fail(code){var e=new Error(code);e.code=code;throw e;}
  function activeSet(values){var out={};(values||[]).forEach(function(v){var id=text(v);if(id)out[id]=true;});return out;}
  function ensureActive(uid,set){uid=text(uid);if(!uid||!set[uid])fail('CLEANING_COLLAB_MEMBER_REQUIRED');return uid;}
  function status(row){return text(row&&row.status).toUpperCase();}
  function openOccurrence(row){var s=status(row),a=text(row&&row.assignmentStatus).toUpperCase();return !!row&&s!=='CANCELLED'&&s!=='SKIPPED'&&s!=='COMPLETED'&&a!=='SKIPPED'&&a!=='COMPLETED';}
  function currentAssignee(row){return text(row&&row.assignmentUids&&row.assignmentUids[0]);}
  function normalizeDate(v){var s=text(v);return /^\d{4}-\d{2}-\d{2}$/.test(s)?s:'';}
  function normalizeTime(v){var s=text(v);return /^([01]\d|2[0-3]):[0-5]\d$/.test(s)?s:'';}
  function schedule(row,date,time){
    date=normalizeDate(date);time=normalizeTime(time);
    if(!date)return row;
    row.scheduledDate=date;row.scheduledTime=time;
    var day=new Date(date+'T00:00:00').getTime();
    if(Number.isFinite(day)){row.scheduledWindow={startAt:day,endAt:day+86400000};row.flexibleWindow={startAt:day,endAt:day+86400000};}
    if(time){var start=new Date(date+'T'+time+':00').getTime();if(Number.isFinite(start)){row.scheduledStartAt=start;row.scheduledEndAt=start+Math.max(1,Number(row.estimatedMinutes)||1)*60000;row.status='SCHEDULED';}}
    else{row.scheduledStartAt=null;row.scheduledEndAt=null;row.status='FLEXIBLE';}
    return row;
  }
  function nextRevision(request){return Math.max(0,Number(request&&request.revision)||0)+1;}
  function baseContext(ctx){
    ctx=ctx||{};var actor=text(ctx.actorUid),set=activeSet(ctx.activeUids),ts=Number(ctx.timestamp)||Date.now();
    ensureActive(actor,set);return{actor:actor,set:set,ts:ts,isManager:ctx.isManager===true};
  }
  function canInitiate(row,c){var assigned=currentAssignee(row);if(c.isManager||assigned===c.actor)return true;fail('CLEANING_COLLAB_NOT_OWNER');}
  function requestTransfer(row,input,ctx){
    if(!openOccurrence(row))fail('CLEANING_COLLAB_OCCURRENCE_CLOSED');var c=baseContext(ctx);canInitiate(row,c);var to=ensureActive(input&&input.toUid,c.set);if(to===currentAssignee(row))fail('CLEANING_COLLAB_SAME_ASSIGNEE');
    var out=clone(row),old=out.transferRequest||{};
    if(status(old)==='PENDING'&&text(old.fromUid)===c.actor&&text(old.toUid)===to&&!old.counterProposal)return{occurrence:out,changed:false,projectionChanged:false};
    out.transferRequest={kind:'TRANSFER',status:'PENDING',fromUid:c.actor,toUid:to,originalAssigneeUid:currentAssignee(out),requestedAt:c.ts,requestedByUid:c.actor,revision:nextRevision(old)};
    out.updatedAt=c.ts;out.updatedByUid=c.actor;return{occurrence:out,changed:true,projectionChanged:false};
  }
  function withdrawTransfer(row,ctx){
    var c=baseContext(ctx),out=clone(row),req=out.transferRequest||{};if(status(req)!=='PENDING'&&status(req)!=='COUNTER_PROPOSED')fail('CLEANING_COLLAB_REQUEST_NOT_PENDING');if(text(req.fromUid)!==c.actor)fail('CLEANING_COLLAB_NOT_REQUESTER');
    req.status='WITHDRAWN';req.withdrawnAt=c.ts;req.withdrawnByUid=c.actor;out.transferRequest=req;out.updatedAt=c.ts;out.updatedByUid=c.actor;return{occurrence:out,changed:true,projectionChanged:false};
  }
  function acceptTransfer(row,ctx){
    var c=baseContext(ctx),out=clone(row),req=out.transferRequest||{};if(status(req)!=='PENDING')fail('CLEANING_COLLAB_REQUEST_NOT_PENDING');if(text(req.toUid)!==c.actor)fail('CLEANING_COLLAB_NOT_RECIPIENT');
    out.assignmentUids=[c.actor];schedule(out,req.proposedDate,req.proposedTime);req.status='ACCEPTED';req.acceptedAt=c.ts;req.acceptedByUid=c.actor;out.transferRequest=req;out.updatedAt=c.ts;out.updatedByUid=c.actor;return{occurrence:out,changed:true,projectionChanged:true};
  }
  function declineTransfer(row,ctx){
    var c=baseContext(ctx),out=clone(row),req=out.transferRequest||{};if(status(req)!=='PENDING')fail('CLEANING_COLLAB_REQUEST_NOT_PENDING');if(text(req.toUid)!==c.actor)fail('CLEANING_COLLAB_NOT_RECIPIENT');
    req.status='DECLINED';req.declinedAt=c.ts;req.declinedByUid=c.actor;out.transferRequest=req;out.updatedAt=c.ts;out.updatedByUid=c.actor;return{occurrence:out,changed:true,projectionChanged:false};
  }
  function counterTransfer(row,input,ctx){
    var c=baseContext(ctx),out=clone(row),req=out.transferRequest||{};if(status(req)!=='PENDING')fail('CLEANING_COLLAB_REQUEST_NOT_PENDING');if(text(req.toUid)!==c.actor)fail('CLEANING_COLLAB_NOT_RECIPIENT');
    var proposed=ensureActive(input&&input.assigneeUid,c.set),date=normalizeDate(input&&input.scheduledDate),time=normalizeTime(input&&input.scheduledTime);if(!date&&text(input&&input.scheduledDate))fail('CLEANING_COLLAB_BAD_DATE');if(!time&&text(input&&input.scheduledTime))fail('CLEANING_COLLAB_BAD_TIME');
    req.status='COUNTER_PROPOSED';req.counterProposal={status:'PENDING',fromUid:c.actor,toUid:text(req.fromUid),assigneeUid:proposed,scheduledDate:date,scheduledTime:time,proposedAt:c.ts};out.transferRequest=req;out.updatedAt=c.ts;out.updatedByUid=c.actor;return{occurrence:out,changed:true,projectionChanged:false};
  }
  function respondCounter(row,accept,ctx){
    var c=baseContext(ctx),out=clone(row),req=out.transferRequest||{},counter=req.counterProposal||{};if(status(req)!=='COUNTER_PROPOSED'||status(counter)!=='PENDING')fail('CLEANING_COLLAB_COUNTER_NOT_PENDING');if(text(req.fromUid)!==c.actor)fail('CLEANING_COLLAB_NOT_REQUESTER');
    if(!accept){counter.status='DECLINED';counter.respondedAt=c.ts;counter.respondedByUid=c.actor;req.counterProposal=counter;req.status='DECLINED';out.transferRequest=req;out.updatedAt=c.ts;out.updatedByUid=c.actor;return{occurrence:out,changed:true,projectionChanged:false};}
    var target=ensureActive(counter.assigneeUid,c.set),counterAuthor=text(counter.fromUid);counter.status='ACCEPTED';counter.respondedAt=c.ts;counter.respondedByUid=c.actor;
    if(target===counterAuthor||target===c.actor){out.assignmentUids=[target];schedule(out,counter.scheduledDate,counter.scheduledTime);req.counterProposal=counter;req.status='ACCEPTED';req.acceptedAt=c.ts;req.acceptedByUid=c.actor;out.transferRequest=req;out.updatedAt=c.ts;out.updatedByUid=c.actor;return{occurrence:out,changed:true,projectionChanged:true};}
    out.transferRequest={kind:'TRANSFER',status:'PENDING',fromUid:c.actor,toUid:target,originalAssigneeUid:currentAssignee(out),requestedAt:c.ts,requestedByUid:c.actor,proposedDate:counter.scheduledDate||'',proposedTime:counter.scheduledTime||'',counterAcceptedFromUid:counterAuthor,revision:nextRevision(req)};out.updatedAt=c.ts;out.updatedByUid=c.actor;return{occurrence:out,changed:true,projectionChanged:false,retargeted:true};
  }
  function requestHelp(row,input,ctx){
    if(!openOccurrence(row))fail('CLEANING_COLLAB_OCCURRENCE_CLOSED');var c=baseContext(ctx);canInitiate(row,c);var to=ensureActive(input&&input.toUid,c.set);if(to===c.actor)fail('CLEANING_COLLAB_SELF_HELP');var out=clone(row),old=out.helpRequest||{};
    if(status(old)==='PENDING'&&text(old.fromUid)===c.actor&&text(old.toUid)===to)return{occurrence:out,changed:false,projectionChanged:false};
    out.helpRequest={kind:'HELP',status:'PENDING',fromUid:c.actor,toUid:to,requestedAt:c.ts,requestedByUid:c.actor,revision:nextRevision(old)};out.updatedAt=c.ts;out.updatedByUid=c.actor;return{occurrence:out,changed:true,projectionChanged:false};
  }
  function withdrawHelp(row,ctx){var c=baseContext(ctx),out=clone(row),req=out.helpRequest||{};if(status(req)!=='PENDING')fail('CLEANING_COLLAB_REQUEST_NOT_PENDING');if(text(req.fromUid)!==c.actor)fail('CLEANING_COLLAB_NOT_REQUESTER');req.status='WITHDRAWN';req.withdrawnAt=c.ts;req.withdrawnByUid=c.actor;out.helpRequest=req;out.updatedAt=c.ts;out.updatedByUid=c.actor;return{occurrence:out,changed:true,projectionChanged:false};}
  function respondHelp(row,accept,ctx){var c=baseContext(ctx),out=clone(row),req=out.helpRequest||{};if(status(req)!=='PENDING')fail('CLEANING_COLLAB_REQUEST_NOT_PENDING');if(text(req.toUid)!==c.actor)fail('CLEANING_COLLAB_NOT_RECIPIENT');req.status=accept?'ACCEPTED':'DECLINED';req.respondedAt=c.ts;req.respondedByUid=c.actor;if(accept)req.helperUid=c.actor;out.helpRequest=req;out.updatedAt=c.ts;out.updatedByUid=c.actor;return{occurrence:out,changed:true,projectionChanged:false};}
  function apply(row,command,ctx){var type=text(command&&command.type).toUpperCase();if(type==='REQUEST_TRANSFER')return requestTransfer(row,command,ctx);if(type==='WITHDRAW_TRANSFER')return withdrawTransfer(row,ctx);if(type==='ACCEPT_TRANSFER')return acceptTransfer(row,ctx);if(type==='DECLINE_TRANSFER')return declineTransfer(row,ctx);if(type==='COUNTER_TRANSFER')return counterTransfer(row,command,ctx);if(type==='ACCEPT_COUNTER')return respondCounter(row,true,ctx);if(type==='DECLINE_COUNTER')return respondCounter(row,false,ctx);if(type==='REQUEST_HELP')return requestHelp(row,command,ctx);if(type==='WITHDRAW_HELP')return withdrawHelp(row,ctx);if(type==='ACCEPT_HELP')return respondHelp(row,true,ctx);if(type==='DECLINE_HELP')return respondHelp(row,false,ctx);fail('CLEANING_COLLAB_UNKNOWN_COMMAND');}
  global.CleaningCollaborationContract={version:VERSION,apply:apply,normalizeDate:normalizeDate,normalizeTime:normalizeTime};
})(window);