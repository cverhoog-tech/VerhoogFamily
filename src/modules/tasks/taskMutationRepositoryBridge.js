'use strict';
// ============================================================
// TASK MUTATION REPOSITORY BRIDGE v0.335
// Persists task mutations and sends completed tasks through the
// idempotent account progression engine.
// ============================================================
(function(){
  var VERSION='0.335',wrapped=false;
  function findTask(id){return (window.taskData||[]).find(function(t){return String(t.id)===String(id);})||null;}
  function persist(operation,id){if(window.TaskRepositoryAdapter&&typeof window.TaskRepositoryAdapter.persistGlobals==='function'){window.TaskRepositoryAdapter.persistGlobals({operation:operation||'taskMutation',id:id||null,source:'taskMutationRepositoryBridge',version:VERSION});}}
  function rewardIfCompleted(task,wasDone){
    if(!task||wasDone||!task.done)return;
    if(window.FamilyProgression&&typeof FamilyProgression.awardTaskCompletion==='function'){
      FamilyProgression.awardTaskCompletion(task,{xp:4,source:'toggleTask'});
    }
  }
  function wrap(){
    if(wrapped||typeof window.toggleTask!=='function'||typeof window.deleteTask!=='function')return;
    var originalToggleTask=window.toggleTask,originalDeleteTask=window.deleteTask;
    window.toggleTask=function(id){
      var before=findTask(id),wasDone=!!(before&&before.done);
      var result=originalToggleTask.apply(this,arguments);
      var after=findTask(id);
      rewardIfCompleted(after,wasDone);
      persist('toggleTask',id);
      return result;
    };
    window.deleteTask=function(id){var result=originalDeleteTask.apply(this,arguments);persist('deleteTask',id);return result;};
    wrapped=true;
    try{window.dispatchEvent(new CustomEvent('familyapp:tasks-mutation-bridge-ready',{detail:{version:VERSION}}));}catch(error){}
  }
  function boot(){wrap();[100,300,800,1500].forEach(function(delay){setTimeout(wrap,delay);});}
  window.TaskMutationRepositoryBridge={version:VERSION,boot:boot,persist:persist};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
