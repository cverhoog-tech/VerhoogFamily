'use strict';
// ============================================================
// TASK HOUSEHOLD HELP UI v1.0.0
// Adds a first-class "Heel het gezin" help choice to the accepted task popup
// and makes household-wide help requests actionable from compact task cards.
// Domain mutation remains owned by TaskSharedData/TaskHouseholdRepository.
// ============================================================
(function(){
  if(window.TaskHouseholdHelpUi)return;

  var VERSION='1.0.0';
  var activeTaskId=null;
  var observer=null;
  var scheduled=false;
  var installTimer=null;

  function currentUid(){
    try{
      var c=window.HouseholdContext&&typeof HouseholdContext.snapshot==='function'?HouseholdContext.snapshot():null;
      if(c&&c.uid)return String(c.uid);
    }catch(e){}
    try{return String((window.fbUser||(window.firebase&&firebase.auth&&firebase.auth().currentUser)||{}).uid||'');}catch(e){return'';}
  }
  function findTask(id){var wanted=String(id||'');return (window.taskData||[]).find(function(t){return String(t&&(t.id||t._key)||'')===wanted;})||null;}
  function helperUid(h){return String(h&&(h.uid||h.memberId||h.id)||'');}
  function isHelper(task,uid){return (Array.isArray(task&&task.helpers)?task.helpers:[]).some(function(h){return helperUid(h)===String(uid);});}
  function isOwner(task,uid){try{return !!(window.TaskSharedData&&TaskSharedData.isTaskCreator&&TaskSharedData.isTaskCreator(task,uid));}catch(e){return false;}}
  function isAssigned(task,uid){try{return !!(window.TaskSharedData&&TaskSharedData.isAssignedTo&&TaskSharedData.isAssignedTo(task,uid));}catch(e){return false;}}
  function isBroadcast(task){return !!(task&&task.helpRequested&&task.helpAudience==='household'&&!task.helpRequestedForUid);}
  function eligible(task,uid){return !!(task&&uid&&!isOwner(task,uid)&&!isAssigned(task,uid)&&!isHelper(task,uid));}
  function memberName(uid){
    try{
      var list=window.TaskSharedData&&TaskSharedData.members?TaskSharedData.members()||[]:[];
      var m=list.find(function(row){return String(row&&(row.uid||row.id)||'')===String(uid||'');});
      if(m)return m.displayName||m.name||'Gezinslid';
    }catch(e){}
    return 'Gezinslid';
  }
  function toast(message){if(typeof window.showToast==='function')window.showToast(message);}
  function esc(v){return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');}

  function ensureCss(){
    if(document.getElementById('task-household-help-ui-style'))return;
    var style=document.createElement('style');style.id='task-household-help-ui-style';
    style.textContent=[
      '.tdp-household-help-pick{box-sizing:border-box;display:flex;align-items:center;gap:10px;flex:1 0 100%;width:100%;min-height:48px;border:1px solid rgba(109,40,217,.22);border-radius:12px;padding:9px 10px;background:linear-gradient(135deg,rgba(109,40,217,.10),rgba(168,85,247,.06));color:var(--tdp-text);text-align:left;cursor:pointer}',
      '.tdp-household-help-pick:disabled{opacity:.55;cursor:default}',
      '.tdp-household-help-icon{width:30px;height:30px;min-width:30px;border-radius:10px;display:grid;place-items:center;background:linear-gradient(135deg,#6d28d9,#9333ea);color:#fff;font-size:15px}',
      '.tdp-household-help-copy{min-width:0;flex:1}.tdp-household-help-copy strong{display:block;font-size:11.5px;font-weight:900}.tdp-household-help-copy small{display:block;margin-top:2px;font-size:9.5px;line-height:1.3;color:var(--tdp-text2)}',
      '.tdp-household-help-action{font-size:9.5px;font-weight:900;color:var(--tdp-purple);white-space:nowrap}',
      '.tdp-household-help-divider{flex:1 0 100%;width:100%;height:1px;background:var(--tdp-border-soft);margin:2px 0}',
      '[data-theme*="dark"] .tdp-household-help-pick{border-color:rgba(196,181,253,.28);background:linear-gradient(135deg,rgba(109,40,217,.24),rgba(168,85,247,.10))}'
    ].join('\n');
    document.head.appendChild(style);
  }

  function refreshPopup(id){
    var reopenId=id||activeTaskId;
    if(!reopenId||!window.TaskDetailPopup)return;
    try{TaskDetailPopup.close();}catch(e){}
    setTimeout(function(){try{TaskDetailPopup.open(reopenId);}catch(e){}},190);
  }

  function householdPickerButton(task){
    var button=document.createElement('button');
    button.type='button';button.className='tdp-household-help-pick';button.setAttribute('data-household-help-pick','1');
    button.innerHTML='<span class="tdp-household-help-icon">👨‍👩‍👧‍👦</span><span class="tdp-household-help-copy"><strong>Heel het gezin</strong><small>Iedereen kan deze hulpvraag zien en wie wil kan meehelpen.</small></span><span class="tdp-household-help-action">Vraag iedereen</span>';
    button.onclick=function(e){
      e.preventDefault();e.stopPropagation();button.disabled=true;
      var service=window.TaskSharedData;
      if(!service||typeof service.requestHouseholdHelp!=='function'){button.disabled=false;toast('Hulp vragen is nog niet klaar');return;}
      Promise.resolve(service.requestHouseholdHelp(task.id||task._key)).then(function(){toast('Hulp gevraagd aan het hele gezin 🤝');refreshPopup(task.id||task._key);}).catch(function(err){button.disabled=false;toast((err&&err.message)||'Hulp vragen mislukt');});
    };
    return button;
  }

  function patchHelpPicker(task,box){
    if(!isOwner(task,currentUid())||task.helpRequested)return;
    var picker=box.querySelector('.tdp-member-pick');
    if(!picker||picker.querySelector('[data-household-help-pick]'))return;
    var button=householdPickerButton(task),divider=document.createElement('div');divider.className='tdp-household-help-divider';
    picker.insertBefore(divider,picker.firstChild);picker.insertBefore(button,divider);
  }

  function patchBroadcastDetail(task,box){
    if(!isBroadcast(task))return;
    var me=currentUid(),title=box.querySelector('.tdp-help-title'),sub=box.querySelector('.tdp-help-sub'),status=box.querySelector('.tdp-help-status'),row=box.querySelector('.tdp-help-row');
    if(isOwner(task,me)){
      if(title&&title.textContent!=='Hulp gevraagd')title.textContent='Hulp gevraagd';
      if(sub&&sub.textContent!=='Hulpvraag staat open voor het hele gezin. Iedereen kan meehelpen.')sub.textContent='Hulpvraag staat open voor het hele gezin. Iedereen kan meehelpen.';
      if(status&&status.textContent!=='Open voor het hele gezin')status.textContent='Open voor het hele gezin';
      return;
    }
    if(!eligible(task,me))return;
    var owner=memberName(task.helpRequestedByUid||task.createdByUid);
    if(title&&title.textContent!=='Hulp gevraagd')title.textContent='Hulp gevraagd';
    var message=owner+' vraagt het hele gezin om hulp bij deze quest.';
    if(sub&&sub.textContent!==message)sub.textContent=message;
    if(!row||row.querySelector('[data-household-help-join]'))return;
    var join=document.createElement('button');join.type='button';join.className='tdp-help-btn';join.setAttribute('data-household-help-join','1');join.textContent='Hulp geven';
    join.onclick=function(e){
      e.preventDefault();e.stopPropagation();join.disabled=true;
      var service=window.TaskSharedData;
      if(!service||typeof service.joinHelp!=='function'){join.disabled=false;toast('Hulp geven is nog niet klaar');return;}
      Promise.resolve(service.joinHelp(task.id||task._key)).then(function(){toast('Je helpt nu mee 🤝');refreshPopup(task.id||task._key);}).catch(function(err){join.disabled=false;toast((err&&err.message)||'Actie mislukt');});
    };
    row.appendChild(join);
  }

  function patchDetail(){
    var task=findTask(activeTaskId);if(!task)return;
    var box=document.querySelector('#tdp-overlay .tdp-help-box');if(!box)return;
    patchHelpPicker(task,box);patchBroadcastDetail(task,box);
  }

  function patchCompact(){
    var me=currentUid();if(!me)return;
    document.querySelectorAll('#task-content .tch-row[data-task-id]').forEach(function(row){
      var task=findTask(row.getAttribute('data-task-id'));if(!isBroadcast(task)||!eligible(task,me))return;
      var button=row.querySelector('.tch-help-indicator[data-collab-action="other"]');if(!button||button.getAttribute('data-household-help-actionable')==='1')return;
      button.setAttribute('data-household-help-actionable','1');button.dataset.collabAction='invitee-household';button.classList.add('is-actionable');button.setAttribute('aria-label','Het gezin is om hulp gevraagd — bekijk');
      button.onclick=function(e){e.preventDefault();e.stopPropagation();if(e.stopImmediatePropagation)e.stopImmediatePropagation();if(window.TaskDetailPopup&&typeof TaskDetailPopup.open==='function')TaskDetailPopup.open(task.id||task._key);};
    });
  }

  function apply(){scheduled=false;ensureCss();patchDetail();patchCompact();}
  function schedule(){if(scheduled)return;scheduled=true;if(typeof requestAnimationFrame==='function')requestAnimationFrame(apply);else setTimeout(apply,0);}

  function wrapPopup(){
    var popup=window.TaskDetailPopup;if(!popup||popup.__householdHelpWrapped)return false;
    var oldOpen=popup.open,oldClose=popup.close;
    popup.open=function(id){activeTaskId=id;var result=oldOpen.apply(this,arguments);schedule();return result;};
    popup.close=function(){activeTaskId=null;return oldClose.apply(this,arguments);};
    popup.__householdHelpWrapped=true;return true;
  }

  function start(){
    var ready=wrapPopup()&&window.TaskSharedData&&typeof TaskSharedData.requestHouseholdHelp==='function';
    if(!ready){if(!installTimer){var tries=0;installTimer=setInterval(function(){tries++;if(start()||tries>160){clearInterval(installTimer);installTimer=null;}},50);}return false;}
    if(installTimer){clearInterval(installTimer);installTimer=null;}
    if(!observer&&document.body){observer=new MutationObserver(schedule);observer.observe(document.body,{childList:true,subtree:true});}
    window.addEventListener('familyapp:tasks-updated',schedule);window.addEventListener('familyapp:household-identity-synced',schedule);schedule();return true;
  }

  window.TaskHouseholdHelpUi={version:VERSION,start:start,apply:apply,status:function(){return{version:VERSION,activeTaskId:activeTaskId,observing:!!observer};}};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
