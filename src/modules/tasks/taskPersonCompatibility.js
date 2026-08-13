'use strict';
// ============================================================
// TASK PERSON COMPATIBILITY v1
// Keeps legacy person/progression readers alive by projecting the authoritative
// UID-based task assignment into the old fam_tasks_v023 array format.
// Names here are display-only compatibility data, never identity authority.
// ============================================================
(function(){
  if(window.__taskPersonCompatibilityV1) return;
  window.__taskPersonCompatibilityV1=true;

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

  window.TaskPersonCompatibility={project:project,namesForTask:namesForTask};
  window.addEventListener('familyapp:tasks-updated',project);
  window.addEventListener('familyapp:household-identity-synced',project);
  setTimeout(project,0);
})();
