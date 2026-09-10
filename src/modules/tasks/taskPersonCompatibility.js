'use strict';
// ============================================================
// TASK PERSON COMPATIBILITY v1.1.0
// Keeps legacy person/progression readers alive by projecting the authoritative
// UID-based task assignment into the old fam_tasks_v023 array format.
// Names here are display-only compatibility data, never identity authority.
// v1.1.0: a canonical empty Firebase task snapshot counts as hydrated, so the
// compact task screen leaves "Taken synchroniseren..." when the final task is deleted.
// ============================================================
(function(){
  if(window.__taskPersonCompatibilityV1) return;
  window.__taskPersonCompatibilityV1=true;

  function canonicalSnapshotResolved(status){
    var value=status&&typeof status==='object'?status:{};
    if(typeof value.sharedSnapshot==='boolean')return value.sharedSnapshot;
    if(typeof value.hydrated==='boolean')return value.hydrated;
    var source=String(value.source||'');
    return source==='firebase'||source==='firebase-empty'||source==='firebase-error-cache'||source==='household-cache'||source==='cache-no-db';
  }

  function installCanonicalSnapshotStatus(){
    var shared=window.TaskSharedData;
    if(!shared||typeof shared.status!=='function')return false;
    if(shared.status.__taskCanonicalSnapshotFix)return true;
    var originalStatus=shared.status;
    var patchedStatus=function(){
      var current=originalStatus.apply(this,arguments);
      var status=current&&typeof current==='object'?Object.assign({},current):{};
      var resolved=canonicalSnapshotResolved(status);
      status.sharedSnapshot=resolved;
      status.hydrated=resolved;
      return status;
    };
    patchedStatus.__taskCanonicalSnapshotFix=true;
    patchedStatus.__originalStatus=originalStatus;
    shared.status=patchedStatus;
    return true;
  }

  function members(){
    try{
      if(window.HouseholdIdentityFirebaseBridge&&typeof window.HouseholdIdentityFirebaseBridge.getMembers==='function'){
        var live=window.HouseholdIdentityFirebaseBridge.getMembers();
        if(live&&live.length)return live;
      }
      if(window.TaskSharedData&&typeof window.TaskSharedData.members==='function')return window.TaskSharedData.members()||[];
    }catch(e){}
    return [];
  }
  function namesForTask(task){
    var byUid={};
    members().forEach(function(member){var id=member.uid||member.id;if(id)byUid[id]=member.displayName||member.name||'Gezinslid';});
    var out=[];
    if(task&&task.assignedToUids&&typeof task.assignedToUids==='object'){
      Object.keys(task.assignedToUids).forEach(function(id){if(task.assignedToUids[id]&&byUid[id])out.push(byUid[id]);});
    }
    if(!out.length&&task&&Array.isArray(task.who))out=task.who.slice();
    return out;
  }
  function toLegacy(task){
    var names=namesForTask(task);
    var who=names.length>1?'Beiden':(names[0]||'');
    return [
      task.id,
      task.type||'SIDE QUEST',
      task.title||'',
      task.desc||task.description||'',
      task.date||'',
      who,
      task.xp||'+10 XP',
      task.img||task.image||'',
      task.subs||task.subtasks||[],
      task.done?1:0,
      task.repeat||'once',
      task.date||'',
      task.prio||task.priority||'med'
    ];
  }
  function project(){
    try{
      var tasks=Array.isArray(window.taskData)?window.taskData:[];
      localStorage.setItem('fam_tasks_v023',JSON.stringify(tasks.map(toLegacy)));
    }catch(e){console.warn('[TaskPersonCompatibility] projection failed',e);}
  }
  function refreshCompact(){
    try{
      if(window.taskTab==='compact'&&window.TaskCompactHome&&typeof window.TaskCompactHome.render==='function')window.TaskCompactHome.render(document.getElementById('task-content'));
    }catch(e){}
  }

  installCanonicalSnapshotStatus();
  window.TaskPersonCompatibility={version:'1.1.0',project:project,namesForTask:namesForTask,canonicalSnapshotResolved:canonicalSnapshotResolved,installCanonicalSnapshotStatus:installCanonicalSnapshotStatus};
  window.addEventListener('familyapp:tasks-updated',function(){installCanonicalSnapshotStatus();project();});
  window.addEventListener('familyapp:task-repository',function(){installCanonicalSnapshotStatus();refreshCompact();});
  window.addEventListener('familyapp:household-identity-synced',project);
  setTimeout(function(){installCanonicalSnapshotStatus();project();refreshCompact();},0);
})();
