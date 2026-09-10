'use strict';
// ============================================================
// TASK NOTIFICATION PROJECTOR v2.0.0 — STEP 10
// Observes the accepted canonical task projection and emits typed notification
// events only for transitions caused by the active HouseholdContext UID.
// ============================================================
(function(){
  if(window.TaskNotificationProjector)return;

  var VERSION='2.0.0';
  var snapshot={};
  var initialized=false;
  var running=false;
  var taskHandler=null;
  var contextUnsubscribe=null;
  var activeIdentity=null;

  function context(){try{return window.HouseholdContext&&HouseholdContext.snapshot?HouseholdContext.snapshot():null;}catch(e){return null;}}
  function validContext(c){return !!(c&&c.ready===true&&c.uid&&c.householdId);}
  function identity(c){return validContext(c)?[String(c.uid),String(c.householdId),String(c.revision||0)].join('|'):null;}
  function currentUid(){var c=context();return validContext(c)?c.uid:null;}
  function clone(v){try{return JSON.parse(JSON.stringify(v));}catch(e){return v;}}
  function taskKey(task){return String(task&&(task._key||task.id)||'');}
  function taskMap(list){var out={};(list||[]).forEach(function(task){var k=taskKey(task);if(k)out[k]=clone(task);});return out;}
  function helpers(task){return Array.isArray(task&&task.helpers)?task.helpers:[];}
  function helperUid(h){return h&&(h.uid||h.memberId||h.id)||null;}
  function safePublish(promise){if(promise&&typeof promise.catch==='function')promise.catch(function(e){console.warn('[TaskNotificationProjector]',e);});}
  function reset(){snapshot={};initialized=false;}

  function detectHelpRequest(prev,next){
    var me=currentUid();
    if(!me||!next||!window.NotificationEvents)return;
    var was=!!(prev&&prev.helpRequested),is=!!next.helpRequested;
    if(was||!is)return;
    var requester=next.helpRequestedByUid||next.requestedHelpByUid||next.createdByUid||null;
    if(String(requester||'')!==String(me))return;
    var target=next.helpRequestedForUid||next.requestedHelpForUid||null;
    safePublish(NotificationEvents.taskHelpRequested(next,target));
  }

  function detectHelpJoin(prev,next){
    var me=currentUid();
    if(!me||!next||!window.NotificationEvents)return;
    var before={};helpers(prev).forEach(function(h){var id=helperUid(h);if(id)before[String(id)]=true;});
    helpers(next).forEach(function(h){
      var id=helperUid(h);if(!id||before[String(id)]||String(id)!==String(me))return;
      var requester=next.helpRequestedByUid||next.requestedHelpByUid||next.createdByUid||null;
      safePublish(NotificationEvents.taskHelpJoined(next,requester));
    });
  }

  function project(list,meta){
    var c=context();
    if(!validContext(c)){reset();return;}
    var key=identity(c);
    if(key!==activeIdentity){activeIdentity=key;reset();}
    var nextMap=taskMap(list);
    if(!initialized){snapshot=nextMap;initialized=true;return;}
    Object.keys(nextMap).forEach(function(k){
      var prev=snapshot[k]||null,next=nextMap[k];
      detectHelpRequest(prev,next);
      detectHelpJoin(prev,next);
    });
    snapshot=nextMap;
  }

  function handleContext(c){
    var key=identity(c);
    if(key===activeIdentity)return;
    activeIdentity=key;
    reset();
  }

  function start(){
    if(running)return true;
    running=true;
    if(window.HouseholdContext&&typeof HouseholdContext.subscribe==='function')contextUnsubscribe=HouseholdContext.subscribe(handleContext);
    taskHandler=function(e){project(window.taskData||[],e&&e.detail||{});};
    window.addEventListener('familyapp:tasks-updated',taskHandler);
    return true;
  }

  function stop(){
    if(taskHandler){try{window.removeEventListener('familyapp:tasks-updated',taskHandler);}catch(e){}taskHandler=null;}
    if(contextUnsubscribe){try{contextUnsubscribe();}catch(e){}contextUnsubscribe=null;}
    running=false;activeIdentity=null;reset();
  }

  window.TaskNotificationProjector={version:VERSION,start:start,stop:stop,project:project,status:function(){return{version:VERSION,running:running,identity:activeIdentity,tracked:Object.keys(snapshot).length,initialized:initialized};}};
  start();
})();
