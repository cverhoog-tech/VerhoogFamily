'use strict';
// ============================================================
// CLEANING EXECUTION UI GUARD v0.1.0
// Prevents the legacy Task detail popup from closing after a blocked delete.
// Deletion and checklist structure remain owned by Schoonmaken -> Kamers.
// ============================================================
(function(){
  if(window.CleaningExecutionUiGuard)return;

  var VERSION='0.1.0';
  var state={currentTaskId:null,installed:false,timer:null};

  function text(value){return String(value==null?'':value).trim();}
  function taskRepository(){return window.TaskHouseholdRepository||window.TaskRepository||null;}
  function taskById(id){
    var repo=taskRepository(),rows=[];
    try{rows=repo&&repo.list?repo.list():(window.taskData||[]);}catch(error){rows=[];}
    for(var i=0;i<rows.length;i++)if(text(rows[i]&&(rows[i].id||rows[i]._key))===text(id)||text(rows[i]&&rows[i]._key)===text(id))return rows[i];
    return null;
  }
  function isManaged(task){var contract=window.CleaningExecutionSync;return !!(contract&&typeof contract._isCleaningProjection==='function'&&contract._isCleaningProjection(task));}
  function toast(message){if(typeof window.showToast==='function')window.showToast(message);}

  function install(){
    var popup=window.TaskDetailPopup;
    if(!popup||typeof popup.open!=='function')return false;
    if(popup.open.__cleaningExecutionUiGuard){state.installed=true;return true;}
    var rawOpen=popup.open;
    popup.open=function(id){state.currentTaskId=text(id);return rawOpen.apply(this,arguments);};
    popup.open.__cleaningExecutionUiGuard=true;
    popup.open.__raw=rawOpen;
    state.installed=true;
    return true;
  }

  function onClick(event){
    var target=event.target&&event.target.closest?event.target.closest('#tdp-delete-btn'):null;
    if(!target)return;
    var task=taskById(state.currentTaskId);
    if(!isManaged(task))return;
    event.preventDefault();
    event.stopPropagation();
    if(event.stopImmediatePropagation)event.stopImmediatePropagation();
    toast('Schoonmaaktaak verwijderen kan niet via Taken. Pas de routine aan bij Schoonmaken.');
  }

  function start(){
    if(document&&document.addEventListener)document.addEventListener('click',onClick,true);
    if(install())return true;
    if(state.timer)return false;
    var tries=0;
    state.timer=window.setInterval(function(){tries++;if(install()||tries>300){window.clearInterval(state.timer);state.timer=null;}},100);
    return false;
  }

  function stop(){if(state.timer){window.clearInterval(state.timer);state.timer=null;}}

  window.CleaningExecutionUiGuard={version:VERSION,start:start,stop:stop,status:function(){return{version:VERSION,installed:state.installed,currentTaskId:state.currentTaskId};}};
  start();
})();
