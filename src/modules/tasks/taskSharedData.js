'use strict';
// ============================================================
// SHARED TASK DATA FOUNDATION v1.1
// Firebase shared/tasks is authoritative for household tasks.
// window.taskData remains a compatibility projection for existing UI/progression code.
// ============================================================
(function(){
  if(window.TaskSharedData) return;

  var COLLECTION='tasks';
  var started=false;
  var unsubscribe=null;
  var seeded=false;
  var lastShared={};
  var hasSharedSnapshot=false;
  var legacyRootRef=null;
  var legacyRootHandler=null;
  var legacyRootHouseholdId=null;
  var legacySyncTimer=null;

  function uid(){
    try{return (window.fbUser||(window.firebase&&firebase.auth&&firebase.auth().currentUser)||{}).uid||null;}catch(e){return null;}
  }
  function now(){return Date.now();}
  function clone(v){try{return JSON.parse(JSON.stringify(v));}catch(e){return v;}}
  function legacyId(){return (Date.now()*1000)+Math.floor(Math.random()*1000);}
  function safeKey(v){return String(v===undefined||v===null?'task_'+now():v).replace(/[.#$\[\]\/]/g,'_');}
  function rows(value){
    if(!value) return [];
    if(Array.isArray(value)) return value.filter(Boolean);
    return Object.keys(value).map(function(key){
      var row=value[key];
      if(!row||typeof row!=='object') return null;
      var copy=clone(row)||{};
      if(copy.id===undefined||copy.id===null) copy.id=key;
      if(!copy._key) copy._key=key;
      return copy;
    }).filter(Boolean);
  }
  function members(){
    try{
      if(window.HouseholdIdentityFirebaseBridge&&typeof window.HouseholdIdentityFirebaseBridge.getMembers==='function'){
        var live=window.HouseholdIdentityFirebaseBridge.getMembers();
        if(live&&live.length) return live;
      }
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
    if(out.id===undefined||out.id===null) out.id=legacyId();
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
  function fds(){return window.FamilyDataStore||null;}
  function ready(){return !!(fds()&&window.fbFamilyId&&uid());}
  function makeRecordKey(){
    var store=fds();
    return store&&typeof store.makeId==='function'?store.makeId('task'):'task_'+now().toString(36)+'_'+Math.random().toString(36).slice(2,8);
  }
  function localTask(id){return (window.taskData||[]).find(function(t){return String(t.id)===String(id);})||null;}
  function recordKeyFor(taskOrId){
    if(taskOrId&&typeof taskOrId==='object') return taskOrId._key||safeKey(taskOrId.id);
    var task=localTask(taskOrId);
    return task&&task._key?task._key:safeKey(taskOrId);
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
    try{window.dispatchEvent(new CustomEvent('familyapp:tasks-updated',{detail:{source:source||'shared',count:window.taskData.length}}));}catch(e){}
    try{
      if(typeof window._currentScreen!=='undefined'&&window._currentScreen==='tasks'&&typeof window.renderTasks==='function') window.renderTasks();
      if(typeof window.updateStats==='function') window.updateStats();
    }catch(e){}
  }
  function write(task){
    var row=normalize(task);
    if(!ready()){
      // TEMP DIAGNOSTIC (see report — remove once root cause is confirmed on device):
      // this is the only place TaskSharedData.create()/write() can reject on its
      // own, so log exactly which readiness precondition was missing.
      console.warn('[TaskSharedData][DIAG] create() rejected: store not ready',{
        hasFamilyDataStore:!!fds(),
        fbFamilyId:window.fbFamilyId||null,
        uid:uid(),
        started:started
      });
      return Promise.reject(new Error('Shared task store is not ready'));
    }
    if(!row._key){row.id=legacyId();row._key=makeRecordKey();}
    return fds().writeSharedRecord(COLLECTION,row._key,row).then(function(writeResult){
      // TEMP DIAGNOSTIC: writeSharedRecord() never rejects (see familyDataStore.js
      // writePath) — it resolves with {mode:'firebase'|'local'|'local-pending', ...}.
      // A generic create-failure toast can therefore NEVER originate from this call;
      // log the actual mode so a silent local/local-pending write is visible.
      console.log('[TaskSharedData][DIAG] writeSharedRecord() resolved',writeResult);
      return row;
    });
  }
  function update(id,patch){
    if(!ready()) return Promise.reject(new Error('Shared task store is not ready'));
    var current=localTask(id);
    var key=recordKeyFor(current||id);
    var fallback=current?normalize(current):{id:id,_key:key,createdByUid:uid(),createdAt:now()};
    var next=clone(patch||{})||{};
    next.updatedAt=now();
    return fds().mutateSharedRecord(COLLECTION,key,function(server){
      var row=server&&typeof server==='object'?server:clone(fallback)||{};
      Object.keys(next).forEach(function(k){row[k]=next[k];});
      row._key=key;
      if(row.done&&!row.completedByUid) row.completedByUid=uid();
      if(!row.done){row.completedByUid=null;row.completedAt=null;}
      if(row.done&&!row.completedAt) row.completedAt=now();
      return normalize(row);
    },fallback);
  }
  function remove(id){
    if(!ready()) return Promise.reject(new Error('Shared task store is not ready'));
    return fds().writeSharedRecord(COLLECTION,recordKeyFor(id),null);
  }
  function seedLegacyIfNeeded(snapshot){
    if(seeded||rows(snapshot).length||!Array.isArray(window.taskData)||!window.taskData.length||!ready()) return Promise.resolve(false);
    seeded=true;
    return Promise.all(window.taskData.map(function(task){return write(task);})).then(function(){return true;}).catch(function(e){seeded=false;throw e;});
  }
  function arrToLegacyObj(arr){
    var out={};
    (arr||[]).forEach(function(item,i){if(item)out[(item.id!==undefined?'id_'+item.id:'i_'+i)]=item;});
    return out;
  }
  function disableLegacyTaskFirebaseSync(){
    if(typeof window.syncToFirebase!=='function'||window.syncToFirebase.__sharedTasksOwnTasks) return false;
    window.syncToFirebase=function(){
      if(!window.fbDb||!window.fbFamilyId||window.offlineMode) return;
      clearTimeout(legacySyncTimer);
      legacySyncTimer=setTimeout(function(){
        var currentUid=uid()||'anon';
        var updatePayload={
          shop:arrToLegacyObj(window.shopData),
          cal:arrToLegacyObj(window.calData),
          feed:arrToLegacyObj(window.feedData),
          trans:arrToLegacyObj(window.transData),
          savingsGoals:arrToLegacyObj(window.savingsGoals),
          extraIncome:arrToLegacyObj(window.extraIncome),
          vasteLasten:arrToLegacyObj(window.vasteLasten),
          recurData:arrToLegacyObj(window.recurData)
        };
        window.fbDb.ref('families/'+window.fbFamilyId).update(updatePayload);
        window.fbDb.ref('families/'+window.fbFamilyId+'/members/'+currentUid).update({xp:Number(window.myXP||0),name:window.myName||'Gezinslid',lastSeen:Date.now()});
      },800);
    };
    window.syncToFirebase.__sharedTasksOwnTasks=true;
    return true;
  }
  function attachLegacyRootGuard(){
    if(!window.fbDb||!window.fbFamilyId) return false;
    if(legacyRootRef&&legacyRootHouseholdId===window.fbFamilyId) return true;
    if(legacyRootRef&&legacyRootHandler){try{legacyRootRef.off('value',legacyRootHandler);}catch(e){}}
    legacyRootHouseholdId=window.fbFamilyId;
    legacyRootRef=window.fbDb.ref('families/'+window.fbFamilyId);
    legacyRootHandler=function(){
      if(!hasSharedSnapshot) return;
      setTimeout(function(){if(hasSharedSnapshot) publishProjection(lastShared,'shared-authority-guard');},0);
    };
    legacyRootRef.on('value',legacyRootHandler);
    return true;
  }
  function installMutationBridges(){
    if(typeof window.toggleTask==='function'&&!window.toggleTask.__sharedTasks){
      var oldToggle=window.toggleTask;
      window.toggleTask=function(id){
        var task=localTask(id),before=task?!!task.done:null;
        var result=oldToggle.apply(this,arguments);
        var after=localTask(id);
        if(after&&before!==!!after.done) update(id,{done:!!after.done,completedByUid:after.done?uid():null,completedAt:after.done?now():null}).catch(function(e){console.warn('[TaskSharedData] toggle sync failed',e);});
        return result;
      };
      window.toggleTask.__sharedTasks=true;
    }
    if(typeof window.deleteTask==='function'&&!window.deleteTask.__sharedTasks){
      var oldDelete=window.deleteTask;
      window.deleteTask=function(id){
        var key=recordKeyFor(id);
        var result=oldDelete.apply(this,arguments);
        if(ready()) fds().writeSharedRecord(COLLECTION,key,null).catch(function(e){console.warn('[TaskSharedData] delete sync failed',e);});
        return result;
      };
      window.deleteTask.__sharedTasks=true;
    }
    return true;
  }
  function installGuards(){
    disableLegacyTaskFirebaseSync();
    installMutationBridges();
    attachLegacyRootGuard();
  }
  function start(){
    if(started||!ready()) return false;
    started=true;
    installGuards();
    unsubscribe=fds().subscribeShared(COLLECTION,function(value){
      var list=rows(value);
      if(list.length){
        lastShared=value||{};
        hasSharedSnapshot=true;
        publishProjection(lastShared,'firebase');
        return;
      }
      if(Array.isArray(window.taskData)&&window.taskData.length&&!seeded){
        seedLegacyIfNeeded(value).catch(function(e){console.warn('[TaskSharedData] legacy seed failed',e);});
        return;
      }
      lastShared=value||{};
      hasSharedSnapshot=true;
      publishProjection(lastShared,'firebase-empty');
    },{});
    return true;
  }
  function ensureStart(){
    start();
    installGuards();
  }

  window.TaskSharedData={
    version:'1.1',
    start:start,
    create:write,
    update:update,
    remove:remove,
    normalize:normalize,
    members:members,
    memberUidByName:memberUidByName,
    newLegacyId:legacyId,
    makeRecordKey:makeRecordKey,
    status:function(){return{started:started,ready:ready(),uid:uid(),householdId:window.fbFamilyId||null,count:Array.isArray(window.taskData)?window.taskData.length:0,sharedSnapshot:hasSharedSnapshot};}
  };

  window.addEventListener('familyapp:household-changed',ensureStart);
  window.addEventListener('familyapp:household-identity-synced',ensureStart);
  window.addEventListener('load',ensureStart);
  var bootTries=0,bootTimer=setInterval(function(){
    bootTries++;
    ensureStart();
    if(bootTries>120&&started&&window.syncToFirebase&&window.syncToFirebase.__sharedTasksOwnTasks&&window.toggleTask&&window.toggleTask.__sharedTasks){clearInterval(bootTimer);}
  },250);
  setTimeout(ensureStart,0);
})();
