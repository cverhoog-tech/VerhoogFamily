'use strict';
// ============================================================
// TASK NOTIFICATION PROJECTOR v1.0.0
// Observes authoritative shared task projections and emits typed notification
// events only for state transitions caused by the current account.
// No Firebase paths, no UI hooks, no legacy addNotif dependency.
// ============================================================
(function(){
  if(window.TaskNotificationProjector)return;

  var VERSION='1.0.0';
  var snapshot={};
  var initialized=false;
  var running=false;

  function currentUid(){try{return (window.fbUser||(window.firebase&&firebase.auth&&firebase.auth().currentUser)||{}).uid||null;}catch(e){return null;}}
  function clone(v){try{return JSON.parse(JSON.stringify(v));}catch(e){return v;}}
  function taskKey(task){return String(task&& (task._key||task.id)||'');}
  function taskMap(list){var out={};(list||[]).forEach(function(task){var k=taskKey(task);if(k)out[k]=clone(task);});return out;}
  function helpers(task){return Array.isArray(task&&task.helpers)?task.helpers:[];}
  function helperUid(h){return h&&(h.uid||h.memberId||h.id)||null;}
  function safePublish(promise){if(promise&&typeof promise.catch==='function')promise.catch(function(e){console.warn('[TaskNotificationProjector]',e);});}

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
    var nextMap=taskMap(list);
    if(!initialized){snapshot=nextMap;initialized=true;return;}
    Object.keys(nextMap).forEach(function(k){
      var prev=snapshot[k]||null,next=nextMap[k];
      detectHelpRequest(prev,next);
      detectHelpJoin(prev,next);
    });
    snapshot=nextMap;
  }

  function start(){
    if(running)return true;
    running=true;
    snapshot=taskMap(window.taskData||[]);
    initialized=true;
    window.addEventListener('familyapp:tasks-updated',function(e){project(window.taskData||[],e&&e.detail||{});});
    return true;
  }

  window.TaskNotificationProjector={version:VERSION,start:start,project:project,status:function(){return{version:VERSION,running:running,tracked:Object.keys(snapshot).length};}};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();