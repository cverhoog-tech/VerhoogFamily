'use strict';
// ============================================================
// TASK SWAP NOTIFICATION PROJECTOR v1.0.0
// Projects the existing UID-based taskSwapRequests state into typed
// NotificationEvents. Read-only observer: request ownership stays with the
// task swap module, notification persistence stays with NotificationStore.
// ============================================================
(function(){
  if(window.TaskSwapNotificationProjector)return;

  var VERSION='1.0.0';
  var ref=null,handler=null,householdId=null,snapshot={},initialized=false;

  function db(){try{return window.fbDb||(window.firebase&&firebase.database&&firebase.database())||null;}catch(e){return null;}}
  function uid(){try{return (window.fbUser||(window.firebase&&firebase.auth&&firebase.auth().currentUser)||{}).uid||null;}catch(e){return null;}}
  function hid(){return window.fbFamilyId||null;}
  function task(id){return (window.taskData||[]).find(function(t){return String(t.id)===String(id);})||{id:String(id||''),title:'Taak'};}
  function map(value){var out={};Object.keys(value||{}).forEach(function(k){var r=value[k];if(r){out[k]=Object.assign({id:r.id||k},r);}});return out;}
  function safe(p){if(p&&typeof p.catch==='function')p.catch(function(e){console.warn('[TaskSwapNotificationProjector]',e);});}

  function project(next){
    var me=uid();
    if(!initialized){snapshot=next;initialized=true;return;}
    Object.keys(next).forEach(function(k){
      var row=next[k],prev=snapshot[k]||null;
      if(!row||!window.NotificationEvents)return;
      if(!prev&&row.status==='pending'&&String(row.requesterUid||'')===String(me)){
        safe(NotificationEvents.taskSwapRequested(task(row.taskId),row.targetUid));
        return;
      }
      if(!prev||prev.status===row.status)return;
      if(String(row.targetUid||'')!==String(me))return;
      if(row.status==='accepted')safe(NotificationEvents.taskSwapResolved(task(row.taskId),row.requesterUid,true));
      else if(row.status==='declined')safe(NotificationEvents.taskSwapResolved(task(row.taskId),row.requesterUid,false));
    });
    snapshot=next;
  }

  function stop(){if(ref&&handler)try{ref.off('value',handler);}catch(e){}ref=null;handler=null;householdId=null;initialized=false;snapshot={};}
  function start(){
    var d=db(),family=hid(),me=uid();
    if(!d||!family||!me)return false;
    if(ref&&householdId===family)return true;
    stop();householdId=family;
    ref=d.ref('families/'+family+'/taskSwapRequests');
    handler=function(s){project(map(s.val()||{}));};
    ref.on('value',handler);
    return true;
  }

  window.TaskSwapNotificationProjector={version:VERSION,start:start,stop:stop,status:function(){return{version:VERSION,started:!!ref,householdId:householdId,tracked:Object.keys(snapshot).length};}};
  window.addEventListener('familyapp:household-members-updated',start);
  window.addEventListener('familyapp:household-changed',start);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();