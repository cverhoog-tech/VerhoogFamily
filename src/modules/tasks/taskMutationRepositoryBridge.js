'use strict';
// ============================================================
// TASK MUTATION REPOSITORY BRIDGE v0.336
// Persists task mutations and guarantees completed tasks are rewarded once
// through the account progression engine, even if progression finishes booting
// slightly after the task UI.
// ============================================================
(function(){
  var VERSION='0.336',wrapped=false,pendingRewards={};
  function findTask(id){return (window.taskData||[]).find(function(t){return String(t.id)===String(id);})||null;}
  function persist(operation,id){if(window.TaskRepositoryAdapter&&typeof window.TaskRepositoryAdapter.persistGlobals==='function'){window.TaskRepositoryAdapter.persistGlobals({operation:operation||'taskMutation',id:id||null,source:'taskMutationRepositoryBridge',version:VERSION});}}
  function rewardNow(task){
    if(!task||!task.done)return false;
    if(window.FamilyProgression&&typeof FamilyProgression.awardTaskCompletion==='function'&&(!FamilyProgression.isReady||FamilyProgression.isReady())){
      FamilyProgression.awardTaskCompletion(task,{xp:4,source:'toggleTask'});
      return true;
    }
    return false;
  }
  function rewardIfCompleted(task,wasDone){
    if(!task||wasDone||!task.done)return;
    if(rewardNow(task))return;
    var key=String(task.id);
    pendingRewards[key]=JSON.parse(JSON.stringify(task));
  }
  function flushPending(){
    Object.keys(pendingRewards).forEach(function(key){
      var task=findTask(key)||pendingRewards[key];
      if(task&&task.done&&rewardNow(task))delete pendingRewards[key];
      else if(!task||!task.done)delete pendingRewards[key];
    });
  }
  function wrap(){
    if(wrapped||typeof window.toggleTask!=='function'||typeof window.deleteTask!=='function')return false;
    var originalToggleTask=window.toggleTask,originalDeleteTask=window.deleteTask;
    window.toggleTask=function(id){
      var before=findTask(id),wasDone=!!(before&&before.done);
      var result=originalToggleTask.apply(this,arguments);
      var after=findTask(id);
      rewardIfCompleted(after,wasDone);
      persist('toggleTask',id);
      return result;
    };
    window.deleteTask=function(id){var result=originalDeleteTask.apply(this,arguments);delete pendingRewards[String(id)];persist('deleteTask',id);return result;};
    wrapped=true;
    try{window.dispatchEvent(new CustomEvent('familyapp:tasks-mutation-bridge-ready',{detail:{version:VERSION}}));}catch(error){}
    return true;
  }
  function boot(){
    wrap();
    [100,300,800,1500,3000].forEach(function(delay){setTimeout(function(){wrap();flushPending();},delay);});
    window.addEventListener('familyapp:progression:ready',flushPending);
  }
  window.TaskMutationRepositoryBridge={version:VERSION,boot:boot,persist:persist,flushPending:flushPending};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
