'use strict';
// ============================================================
// TASK UID CREATE BRIDGE v1.1
// Replaces the one-off task assignee UI with live household members and
// persists new tasks through TaskSharedData. Recurring tasks stay legacy.
// ============================================================
(function(){
  if(window.__taskUidCreateBridgeV1) return;
  window.__taskUidCreateBridgeV1=true;

  var selected={};
  var installed=false;
  var originalTaskBuild=null;
  var originalSaveItem=null;

  function esc(value){return String(value==null?'':value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');}
  function currentUid(){try{return (window.fbUser||(window.firebase&&firebase.auth&&firebase.auth().currentUser)||{}).uid||null;}catch(e){return null;}}
  function members(){try{if(window.HouseholdIdentityFirebaseBridge&&typeof window.HouseholdIdentityFirebaseBridge.getMembers==='function'){var live=window.HouseholdIdentityFirebaseBridge.getMembers();if(live&&live.length)return live;}if(window.TaskSharedData&&typeof window.TaskSharedData.members==='function')return window.TaskSharedData.members()||[];}catch(e){}return[];}
  function resetSelection(){selected={};var me=currentUid();if(me)selected[me]=true;window.taskSelectedAssigneeUids=selected;}
  function selectedMembers(){var map=selected;return members().filter(function(member){var id=member.uid||member.id;return id&&map[id];});}
  function assigneeHtml(){var list=members();if(!list.length)return'<div style="font-size:12px;color:var(--c-text2);padding:8px 0">Gezinsleden worden geladen…</div>';var me=currentUid();if(!Object.keys(selected).length&&me)selected[me]=true;return'<div class="assignee-row task-uid-assignees" style="flex-wrap:wrap">'+list.map(function(member){var id=member.uid||member.id,name=member.displayName||member.name||'Gezinslid',active=!!selected[id];return'<button type="button" class="assignee-chip'+(active?' active':'')+'" data-task-assignee-uid="'+esc(id)+'" onclick="taskUidToggleAssignee(this)">'+esc(name)+'</button>';}).join('')+'</div>';}
  function replaceOneOffAssignees(html){var start=html.indexOf('<div id="fields-eenmalig">'),recurring=html.indexOf('<div id="fields-herhalend"');if(start<0||recurring<0)return html;var part=html.slice(start,recurring),whoStart=part.indexOf('<div class="field"><label>Wie</label>'),dateStart=part.indexOf('<div class="field"><label>Datum</label>');if(whoStart<0||dateStart<0)return html;var replacement='<div class="field"><label>Wie</label>'+assigneeHtml()+'</div>',rebuilt=part.slice(0,whoStart)+replacement+part.slice(dateStart);return html.slice(0,start)+rebuilt+html.slice(recurring);}

  window.taskUidToggleAssignee=function(button){var id=button&&button.getAttribute('data-task-assignee-uid');if(!id)return;if(selected[id])delete selected[id];else selected[id]=true;if(!Object.keys(selected).length)selected[id]=true;window.taskSelectedAssigneeUids=selected;document.querySelectorAll('[data-task-assignee-uid]').forEach(function(btn){btn.classList.toggle('active',!!selected[btn.getAttribute('data-task-assignee-uid')]);});};

  function nextTaskId(){if(window.TaskSharedData&&typeof window.TaskSharedData.newLegacyId==='function')return window.TaskSharedData.newLegacyId();return(Date.now()*1000)+Math.floor(Math.random()*1000);}
  function buildTask(title){var date=(document.getElementById('f3')||{}).value||null,prio=(document.getElementById('f4')||{}).value||'med',chosen=selectedMembers();if(!chosen.length){var me=currentUid(),mine=members().find(function(m){return(m.uid||m.id)===me;});if(mine)chosen=[mine];}var assigned={},names=[];chosen.forEach(function(member){var id=member.uid||member.id;if(id)assigned[id]=true;names.push(member.displayName||member.name||'Gezinslid');});return{id:nextTaskId(),title:title,who:names,assignedToUids:assigned,createdByUid:currentUid(),date:date,done:false,prio:prio,createdAt:Date.now(),updatedAt:Date.now()};}
  function createSharedTask(title){
    if(!window.TaskSharedData||typeof window.TaskSharedData.create!=='function')return false;
    var task=buildTask(title);
    if(!Object.keys(task.assignedToUids).length){if(typeof window.showToast==='function')window.showToast('Kies minimaal één gezinslid');return true;}
    window.TaskSharedData.create(task).then(function(saved){
      if(!Array.isArray(window.taskData))window.taskData=[];
      var exists=window.taskData.some(function(t){return String(t.id)===String(saved.id);});
      if(!exists)window.taskData.unshift(saved);
      try{if(window.AppState&&typeof window.AppState.save==='function')window.AppState.save();if(typeof window.renderTasks==='function')window.renderTasks();if(typeof window.updateStats==='function')window.updateStats();}catch(e){}
    }).catch(function(error){if(typeof window.showToast==='function')window.showToast('Taak kon niet worden opgeslagen');console.warn('[TaskUidCreateBridge] create failed',error);});
    try{
      if(typeof window.addActivity==='function')window.addActivity('📋','#f0ede8',(window.myName||'Gezinslid')+' maakte taak "'+title+'" aan');
      if(typeof window.addNotif==='function')window.addNotif('📋','#f0ede8','Nieuwe taak',title);
      if(typeof window.closeAdd==='function')window.closeAdd();
    }catch(e){}
    window.taskTypeMode='eenmalig';resetSelection();return true;
  }

  function install(){
    if(typeof window.SHEETS==='undefined'||!window.SHEETS.task||typeof window.SHEETS.task.build!=='function'||typeof window.saveItem!=='function')return false;
    if(installed&&window.saveItem&&window.saveItem.__taskUidCreateBridgeV1)return true;
    if(!originalTaskBuild)originalTaskBuild=window.SHEETS.task.build;
    window.SHEETS.task.build=function(){resetSelection();return replaceOneOffAssignees(originalTaskBuild.apply(this,arguments));};
    originalSaveItem=window.saveItem;
    window.saveItem=function(){if(window.currentAddType==='task'&&window.taskTypeMode!=='herhalend'){var input=document.getElementById('f1'),title=input?input.value.trim():'';if(!title){if(typeof window.closeAdd==='function')window.closeAdd();return;}if(createSharedTask(title))return;}return originalSaveItem.apply(this,arguments);};
    window.saveItem.__taskUidCreateBridgeV1=true;installed=true;return true;
  }
  function ensureInstall(){if(install())return;var tries=0,timer=setInterval(function(){tries++;if(install()||tries>120)clearInterval(timer);},100);}

  resetSelection();
  window.addEventListener('load',function(){setTimeout(ensureInstall,0);});
  window.addEventListener('familyapp:household-identity-synced',function(){if(window.currentAddType==='task'&&window.taskTypeMode!=='herhalend'){var row=document.querySelector('.task-uid-assignees');if(row)row.outerHTML=assigneeHtml();}});
  setTimeout(ensureInstall,0);
})();

// Integration guard for consumers of TaskSharedData.update(). FamilyDataStore
// intentionally returns {mode,value}; task UI consumers need the saved task itself.
// Completion initiated through the new shared popup also receives the same legacy
// XP/activity side effects as toggleTask(), without double-awarding legacy toggles.
(function installTaskSharedUpdateContract(){
  if(window.__taskSharedUpdateContractV1) return;
  window.__taskSharedUpdateContractV1=true;
  function install(){
    var api=window.TaskSharedData;
    if(!api||typeof api.update!=='function')return false;
    if(api.update.__returnsSavedTask)return true;
    var rawUpdate=api.update;
    api.update=function(id,patch){
      var before=(window.taskData||[]).find(function(t){return String(t.id)===String(id);});
      var wasDone=before?!!before.done:false;
      return rawUpdate.apply(api,arguments).then(function(result){
        var saved=result&&result.value&&typeof result.value==='object'?result.value:result;
        var isDone=saved&&typeof saved==='object'?!!saved.done:!!(patch&&patch.done);
        if(!wasDone&&isDone){
          try{if(typeof window.awardXP==='function')window.awardXP(4,'Taak');}catch(e){}
          try{if(typeof window.addActivity==='function')window.addActivity('✅','#e8f5e3',(window.myName||'Gezinslid')+' voltooide "'+((saved&&saved.title)||(before&&before.title)||'Taak')+'"');}catch(e){}
        }
        return saved;
      });
    };
    api.update.__returnsSavedTask=true;
    return true;
  }
  if(!install()){
    var tries=0,timer=setInterval(function(){tries++;if(install()||tries>80)clearInterval(timer);},50);
  }
})();
