'use strict';
// ============================================================
// SHARED TASK DATA COMPATIBILITY FACADE v2.0.0
// STEP 3: TaskHouseholdRepository is the only task persistence/listener owner.
// This facade preserves the existing task UI/collaboration API while routing
// every mutation through the canonical UID + HouseholdContext boundary.
// ============================================================
(function(){
  if(window.TaskSharedData&&window.TaskSharedData.version==='2.0.0')return;

  var VERSION='2.0.0';
  var projectionUnsubscribe=null;
  var startTimer=null;
  var bridgesInstalled=false;

  function now(){return Date.now();}
  function clone(value){try{return JSON.parse(JSON.stringify(value));}catch(e){return value;}}
  function ctx(){try{return window.HouseholdContext&&typeof window.HouseholdContext.snapshot==='function'?window.HouseholdContext.snapshot():null;}catch(e){return null;}}
  function uid(){var c=ctx();return c&&c.uid||null;}
  function repo(){return window.TaskHouseholdRepository||window.TaskRepository||null;}
  function ready(){var r=repo(),c=ctx();return !!(r&&c&&c.ready&&c.uid&&c.householdId&&typeof r.updateOne==='function');}
  function legacyId(){return (Date.now()*1000)+Math.floor(Math.random()*1000);}

  function members(){
    try{
      if(window.HouseholdIdentityFirebaseBridge&&typeof window.HouseholdIdentityFirebaseBridge.getMembers==='function'){
        var live=window.HouseholdIdentityFirebaseBridge.getMembers();
        if(live&&live.length)return live;
      }
      if(window.HouseholdIdentity&&typeof window.HouseholdIdentity.getMembers==='function')return window.HouseholdIdentity.getMembers()||[];
    }catch(e){}
    return [];
  }
  function member(uidVal){return members().find(function(m){return String(m.uid||m.id)===String(uidVal);})||null;}
  function memberUidByName(name){
    if(!name)return null;
    var target=String(name).trim().toLowerCase();
    var found=members().filter(function(m){return String(m.displayName||m.name||'').trim().toLowerCase()===target;});
    return found.length===1?(found[0].uid||found[0].id||null):null;
  }
  function localTask(id){
    var wanted=String(id);
    return (window.taskData||[]).find(function(t){return String(t&&t.id)===wanted||String(t&&t._key)===wanted;})||null;
  }
  function normalize(task){
    var out=clone(task||{})||{};
    if(Array.isArray(task)&&window.TaskModel&&typeof window.TaskModel.toObject==='function')out=window.TaskModel.toObject(task)||{};
    if(out.id===undefined||out.id===null||out.id==='')out.id=legacyId();
    var assigned={};
    if(out.assignedToUids&&typeof out.assignedToUids==='object'&&!Array.isArray(out.assignedToUids)){
      Object.keys(out.assignedToUids).forEach(function(key){if(out.assignedToUids[key])assigned[key]=true;});
    }
    if(out.assignedToUid)assigned[out.assignedToUid]=true;
    if(!Object.keys(assigned).length){
      var names=[];
      if(Array.isArray(out.who))names=out.who;
      else if(out.assignee)names=[out.assignee];
      else if(out.assigned)names=[out.assigned];
      names.forEach(function(name){var mapped=memberUidByName(name);if(mapped)assigned[mapped]=true;});
    }
    if(Object.keys(assigned).length)out.assignedToUids=assigned;
    if(!Array.isArray(out.helpers))out.helpers=[];
    return out;
  }
  function publishProjection(tasks,meta){
    var next=Array.isArray(tasks)?tasks.map(clone):[];
    if(Array.isArray(window.taskData)){
      window.taskData.length=0;
      next.forEach(function(task){window.taskData.push(task);});
    }else window.taskData=next;
    try{window.dispatchEvent(new CustomEvent('familyapp:tasks-updated',{detail:{source:(meta&&meta.source)||'task-repository',count:window.taskData.length,householdId:meta&&meta.householdId||null}}));}catch(e){}
    try{
      if(window._currentScreen==='tasks'&&typeof window.renderTasks==='function')window.renderTasks();
      if(typeof window.updateStats==='function')window.updateStats();
    }catch(e){}
  }

  function create(task){
    var r=repo();if(!r||typeof r.create!=='function')return Promise.reject(new Error('Task repository is not ready'));
    return r.create(normalize(task));
  }
  function update(id,patch){
    var next=clone(patch||{})||{};
    if(next.helpRequested===true&&next.helpRequestedForUid)return requestHelp(id,next.helpRequestedForUid);
    var r=repo();if(!r||typeof r.updateOne!=='function')return Promise.reject(new Error('Task repository is not ready'));
    var current=localTask(id);
    if(next.done===true&&current&&!current.done){next.completedByUid=uid();next.completedAt=now();}
    if(next.done===false){next.completedByUid=null;next.completedAt=null;}
    return r.updateOne(id,next);
  }
  function remove(id){var r=repo();return r&&typeof r.remove==='function'?r.remove(id):Promise.reject(new Error('Task repository is not ready'));}

  function isAssignedTo(task,userId){
    var id=String(userId||'');if(!task||!id)return false;
    if(task.assignedToUids&&task.assignedToUids[id])return true;
    if(String(task.assignedToUid||'')===id)return true;
    return false;
  }
  function isTaskCreator(task,userId){
    var id=String(userId||'');if(!task||!id)return false;
    return String(task.createdByUid||task.ownerUid||'')===id;
  }
  function isTaskOwner(task,userId){return isTaskCreator(task,userId);}
  function helperUid(helper){return String(helper&&(helper.uid||helper.memberId||helper.id)||'');}
  function mutateCollaboration(id,mutator){
    var r=repo();if(!r||typeof r.mutateOne!=='function')return Promise.reject(new Error('Task repository is not ready'));
    return r.mutateOne(id,function(row){var next=mutator(normalize(row));if(!next)return;return normalize(next);});
  }
  function requestHelp(id,targetUid){
    var me=uid(),target=String(targetUid||'');
    if(!me)return Promise.reject(new Error('Niet ingelogd'));
    if(!target)return Promise.reject(new Error('Kies iemand om hulp te vragen'));
    return mutateCollaboration(id,function(row){
      if(!isTaskCreator(row,me))throw new Error('Alleen de maker kan hulp vragen voor deze taak');
      if(String(me)===target||isTaskCreator(row,target)||isAssignedTo(row,target))throw new Error('Deze persoon neemt al deel aan de taak');
      if((row.helpers||[]).some(function(h){return helperUid(h)===target;}))throw new Error('Deze persoon helpt al mee');
      if(row.helpRequested&&row.helpRequestedForUid){var pending=member(row.helpRequestedForUid);throw new Error('Er staat al een hulpuitnodiging open voor '+((pending&&(pending.displayName||pending.name))||'dit gezinslid'));}
      if(!member(target))throw new Error('Dit gezinslid is niet meer beschikbaar');
      row.helpRequested=true;
      row.helpRequestedByUid=me;
      row.helpRequestedForUid=target;
      row.helpRequestedAt=now();
      row.helpRetractedAt=null;
      return row;
    });
  }
  function joinHelp(id){
    var me=uid();if(!me)return Promise.reject(new Error('Niet ingelogd'));
    return mutateCollaboration(id,function(row){
      if(!row.helpRequested)throw new Error('De hulpvraag is niet meer actief');
      if(row.helpRequestedForUid&&String(row.helpRequestedForUid)!==String(me))throw new Error('Deze hulpuitnodiging is voor een ander gezinslid');
      if(isTaskCreator(row,me)||isAssignedTo(row,me))throw new Error('Je neemt al deel aan deze taak');
      var helpers=Array.isArray(row.helpers)?row.helpers.slice():[];
      if(!helpers.some(function(h){return helperUid(h)===String(me);})){var m=member(me)||{},name=m.displayName||m.name||window.myName||'Gezinslid';helpers.push({uid:me,memberId:me,name:name,initials:String(name).trim().split(/\s+/).map(function(p){return p.charAt(0);}).join('').slice(0,2).toUpperCase(),joinedAt:now()});}
      row.helpers=helpers;
      row.helpRequested=false;
      row.helpAcceptedByUid=me;
      row.helpAcceptedAt=now();
      row.helpRequestedForUid=null;
      row.helpRequestedByUid=null;
      return row;
    });
  }
  function leaveHelp(id){
    var me=uid();if(!me)return Promise.reject(new Error('Niet ingelogd'));
    return mutateCollaboration(id,function(row){row.helpers=(Array.isArray(row.helpers)?row.helpers:[]).filter(function(h){return helperUid(h)!==String(me);});return row;});
  }
  function retractHelp(id){
    var me=uid();if(!me)return Promise.reject(new Error('Niet ingelogd'));
    return mutateCollaboration(id,function(row){
      if(!isTaskCreator(row,me))throw new Error('Alleen de maker kan de hulpvraag intrekken');
      row.helpRequested=false;
      row.helpRequestedForUid=null;
      row.helpRequestedByUid=null;
      row.helpRetractedAt=now();
      return row;
    });
  }

  function installMutationBridges(){
    if(bridgesInstalled)return true;
    if(typeof window.toggleTask==='function'&&!window.toggleTask.__taskRepository){
      var oldToggle=window.toggleTask;
      window.toggleTask=function(id){
        var before=localTask(id),wasDone=before?!!before.done:null;
        var result=oldToggle.apply(this,arguments),after=localTask(id);
        if(after&&wasDone!==!!after.done)update(id,{done:!!after.done}).catch(function(e){console.warn('[TaskSharedData] toggle sync failed',e);});
        return result;
      };
      window.toggleTask.__taskRepository=true;
    }
    if(typeof window.deleteTask==='function'&&!window.deleteTask.__taskRepository){
      var oldDelete=window.deleteTask;
      window.deleteTask=function(id){
        var existed=!!localTask(id),result=oldDelete.apply(this,arguments);
        if(existed)remove(id).catch(function(e){console.warn('[TaskSharedData] delete sync failed',e);});
        return result;
      };
      window.deleteTask.__taskRepository=true;
    }
    bridgesInstalled=!!(typeof window.toggleTask==='function'&&typeof window.deleteTask==='function');
    return bridgesInstalled;
  }
  function start(){
    var r=repo();
    if(!r||typeof r.subscribe!=='function'){
      if(!startTimer){var tries=0;startTimer=setInterval(function(){tries++;if(start()||tries>200){clearInterval(startTimer);startTimer=null;}},50);}
      return false;
    }
    if(typeof r.start==='function')r.start();
    if(!projectionUnsubscribe)projectionUnsubscribe=r.subscribe(publishProjection);
    installMutationBridges();
    return true;
  }
  function stop(){
    if(startTimer){clearInterval(startTimer);startTimer=null;}
    if(projectionUnsubscribe){try{projectionUnsubscribe();}catch(e){}projectionUnsubscribe=null;}
  }
  function status(){
    var r=repo(),base=r&&typeof r.status==='function'?r.status():{};
    return Object.assign({version:VERSION,ready:ready(),count:Array.isArray(window.taskData)?window.taskData.length:0},base);
  }

  window.TaskSharedData={
    version:VERSION,
    start:start,
    stop:stop,
    create:create,
    update:update,
    remove:remove,
    normalize:normalize,
    members:members,
    memberUidByName:memberUidByName,
    newLegacyId:legacyId,
    isAssignedTo:isAssignedTo,
    isTaskCreator:isTaskCreator,
    isTaskOwner:isTaskOwner,
    requestHelp:requestHelp,
    joinHelp:joinHelp,
    leaveHelp:leaveHelp,
    retractHelp:retractHelp,
    subscribe:function(callback){var r=repo();return r&&r.subscribe?r.subscribe(callback):function(){};},
    status:status
  };

  window.addEventListener('familyapp:household-context',start);
  window.addEventListener('familyapp:session-state',start);
  window.addEventListener('load',function(){start();},{once:true});
  start();
})();
