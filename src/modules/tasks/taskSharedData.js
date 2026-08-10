'use strict';
// ============================================================
// SHARED TASK DATA FOUNDATION v1
// Firebase shared/tasks is authoritative for household tasks.
// window.taskData remains a compatibility projection for existing UI/progression code.
// ============================================================
(function(){
  if(window.TaskSharedData) return;

  var COLLECTION='tasks';
  var started=false;
  var unsubscribe=null;
  var seeded=false;
  var legacySyncDisabled=false;

  function uid(){
    try{return (window.fbUser||(window.firebase&&firebase.auth&&firebase.auth().currentUser)||{}).uid||null;}catch(e){return null;}
  }
  function now(){return Date.now();}
  function clone(v){try{return JSON.parse(JSON.stringify(v));}catch(e){return v;}}
  function taskKey(id){return String(id===undefined||id===null?'task_'+now():id).replace(/[.#$\[\]\/]/g,'_');}
  function rows(value){
    if(!value) return [];
    if(Array.isArray(value)) return value.filter(Boolean);
    return Object.keys(value).map(function(key){
      var row=value[key];
      if(!row||typeof row!=='object') return null;
      if(row.id===undefined||row.id===null) row.id=key;
      return row;
    }).filter(Boolean);
  }
  function members(){
    try{
      if(window.FamilyHousehold&&typeof window.FamilyHousehold.getMembers==='function') return window.FamilyHousehold.getMembers()||[];
      if(window.HouseholdIdentity&&typeof window.HouseholdIdentity.getMembers==='function') return window.HouseholdIdentity.getMembers()||[];
    }catch(e){}
    return [];
  }
  function memberUidByName(name){
    if(!name) return null;
    var target=String(name).trim().toLowerCase();
    var found=members().filter(function(m){return String(m.displayName||m.name||'').trim().toLowerCase()===target;});
    return found.length===1?(found[0].uid||found[0].id||null):null;
  }
  function normalize(task){
    var out=clone(task||{})||{};
    if(out.id===undefined||out.id===null) out.id='task_'+now();
    var assigned={};
    if(out.assignedToUids&&typeof out.assignedToUids==='object'&&!Array.isArray(out.assignedToUids)){
      Object.keys(out.assignedToUids).forEach(function(k){if(out.assignedToUids[k]) assigned[k]=true;});
    }
    if(out.assignedToUid) assigned[out.assignedToUid]=true;
    if(!Object.keys(assigned).length){
      var names=[];
      if(Array.isArray(out.who)) names=out.who;
      else if(out.assignee) names=[out.assignee];
      else if(out.assigned) names=[out.assigned];
      names.forEach(function(name){var mapped=memberUidByName(name);if(mapped) assigned[mapped]=true;});
    }
    if(Object.keys(assigned).length) out.assignedToUids=assigned;
    if(!out.createdByUid) out.createdByUid=uid();
    if(!out.createdAt) out.createdAt=now();
    out.updatedAt=now();
    return out;
  }
  function persistLocalProjection(){
    try{
      if(window.AppState&&typeof window.AppState.get==='function'){
        var state=window.AppState.get();
        if(state){
          state.tasks=window.taskData;
          state.meta=state.meta||{};
          state.meta.lastSaved=new Date().toISOString();
          localStorage.setItem('familieapp_state_v024',JSON.stringify(state));
        }
      }
    }catch(e){}
  }
  function publishProjection(next,source){
    window.taskData=rows(next);
    persistLocalProjection();
    window.dispatchEvent(new CustomEvent('familyapp:tasks-updated',{detail:{source:source||'shared',count:window.taskData.length}}));
    try{
      if(typeof window._currentScreen!=='undefined'&&window._currentScreen==='tasks'&&typeof window.renderTasks==='function') window.renderTasks();
      if(typeof window.updateStats==='function') window.updateStats();
    }catch(e){}
  }
  function fds(){return window.FamilyDataStore||null;}
  function ready(){return !!(fds()&&window.fbFamilyId&&uid());}
  function write(task){
    var row=normalize(task);
    if(!ready()) return Promise.reject(new Error('Shared task store is not ready'));
    return fds().writeSharedRecord(COLLECTION,taskKey(row.id),row).then(function(){return row;});
  }
  function update(id,patch){
    if(!ready()) return Promise.reject(new Error('Shared task store is not ready'));
    var next=clone(patch||{})||{};
    next.updatedAt=now();
    return fds().mutateSharedRecord(COLLECTION,taskKey(id),function(current){
      var row=current&&typeof current==='object'?current:{};
      Object.keys(next).forEach(function(k){row[k]=next[k];});
      if(row.done&& !row.completedByUid) row.completedByUid=uid();
      if(!row.done){row.completedByUid=null;row.completedAt=null;}
      if(row.done&&!row.completedAt) row.completedAt=now();
      return normalize(row);
    });
  }
  function remove(id){
    if(!ready()) return Promise.reject(new Error('Shared task store is not ready'));
    return fds().writeSharedRecord(COLLECTION,taskKey(id),null);
  }
  function seedLegacyIfNeeded(snapshot){
    if(seeded||rows(snapshot).length||!Array.isArray(window.taskData)||!window.taskData.length||!ready()) return Promise.resolve(false);
    seeded=true;
    var writes=window.taskData.map(function(task){return write(task);});
    return Promise.all(writes).then(function(){return true;}).catch(function(e){seeded=false;throw e;});
  }
  function disableLegacyTaskFirebaseSync(){
    if(legacySyncDisabled||typeof window.syncToFirebase!=='function') return;
    legacySyncDisabled=true;
    var original=window.syncToFirebase;
    window.syncToFirebase=function(){
      var before=window.taskData;
      try{window.taskData=[];return original.apply(this,arguments);}finally{window.taskData=before;}
    };
    window.syncToFirebase.__sharedTasksOwnTasks=true;
  }
  function installMutationBridges(){
    if(typeof window.toggleTask==='function'&&!window.toggleTask.__sharedTasks){
      var oldToggle=window.toggleTask;
      window.toggleTask=function(id){
        var task=(window.taskData||[]).find(function(t){return String(t.id)===String(id);});
        var before=task?!!task.done:null;
        var result=oldToggle.apply(this,arguments);
        var after=(window.taskData||[]).find(function(t){return String(t.id)===String(id);});
        if(after&&before!==!!after.done) update(id,{done:!!after.done,completedByUid:after.done?uid():null,completedAt:after.done?now():null}).catch(console.warn);
        return result;
      };
      window.toggleTask.__sharedTasks=true;
    }
    if(typeof window.deleteTask==='function'&&!window.deleteTask.__sharedTasks){
      var oldDelete=window.deleteTask;
      window.deleteTask=function(id){
        var result=oldDelete.apply(this,arguments);
        remove(id).catch(console.warn);
        return result;
      };
      window.deleteTask.__sharedTasks=true;
    }
  }
  function start(){
    if(started||!ready()) return false;
    started=true;
    disableLegacyTaskFirebaseSync();
    installMutationBridges();
    unsubscribe=fds().subscribeShared(COLLECTION,function(value){
      seedLegacyIfNeeded(value).catch(console.warn);
      if(rows(value).length||seeded) publishProjection(value,'firebase');
    });
    return true;
  }
  function ensureStart(){
    if(start()) return;
    var tries=0;
    var timer=setInterval(function(){
      tries++;
      if(start()||tries>80) clearInterval(timer);
    },250);
  }

  window.TaskSharedData={
    start:start,
    create:write,
    update:update,
    remove:remove,
    normalize:normalize,
    members:members,
    memberUidByName:memberUidByName,
    status:function(){return{started:started,ready:ready(),uid:uid(),householdId:window.fbFamilyId||null,count:Array.isArray(window.taskData)?window.taskData.length:0};}
  };

  window.addEventListener('familyapp:household-changed',ensureStart);
  window.addEventListener('load',ensureStart);
  setTimeout(ensureStart,0);
})();
