'use strict';
// ============================================================
// TASK COMPACT LIFECYCLE v1.2.1
// Deterministic post-render lifecycle for the canonical TaskCompactHome.
// No polling, MutationObserver or global click interception.
// Groups task lifecycle state and projects collaboration actions from TaskSharedData.
// ============================================================
(function(){
  if(window.__taskCompactLifecycleV1)return;
  window.__taskCompactLifecycleV1=true;

  function realTasks(){return Array.isArray(window.taskData)?window.taskData:[];}
  function currentUid(){try{return (window.fbUser||(window.firebase&&firebase.auth&&firebase.auth().currentUser)||{}).uid||null;}catch(e){return null;}}
  function members(){try{return window.TaskSharedData&&TaskSharedData.members?TaskSharedData.members()||[]:[];}catch(e){return[];}}
  function member(id){return members().find(function(m){return String(m.uid||m.id)===String(id);})||null;}
  function helperUid(h){return String(h&&(h.uid||h.memberId||h.id)||'');}
  function dayDiff(task){if(!task||!task.date)return null;var d=new Date(task.date+'T00:00:00'),n=new Date();n.setHours(0,0,0,0);return Math.round((d-n)/86400000);}
  function isAssigned(task,id){return !!(window.TaskSharedData&&TaskSharedData.isAssignedTo&&TaskSharedData.isAssignedTo(task,id));}
  function isHelpOwner(task,id){var key=String(id||'');return !!(key&&(isAssigned(task,key)||String(task&&task.createdByUid||'')===key||String(task&&task.helpRequestedByUid||'')===key));}
  function helpers(task){return Array.isArray(task&&task.helpers)?task.helpers:[];}
  function isHelper(task,id){return helpers(task).some(function(h){return helperUid(h)===String(id);});}
  function initials(name){return String(name||'G').trim().split(/\s+/).map(function(x){return x[0]||'';}).join('').slice(0,2).toUpperCase()||'G';}
  function avatarFor(id){var m=member(id);return m&&(m.avatar||m.avatarUrl||m.photoURL||m.profilePhoto)||'';}

  function ensureCss(){
    if(document.getElementById('tch-lifecycle-css'))return;
    var s=document.createElement('style');s.id='tch-lifecycle-css';
    s.textContent=[
      '.tch-overdue-badge{display:inline-flex;margin-left:6px;padding:2px 6px;border-radius:99px;background:#fee2e2;color:#b91c1c;font-size:8px;font-weight:900;letter-spacing:.5px}',
      '.tch-completed-group .tch-row{opacity:.72}.tch-clear-completed{border:0;background:transparent;color:#b91c1c;font-size:10px;font-weight:900;padding:4px 6px;cursor:pointer}',
      '.tch-collab-action{border:1px solid rgba(109,40,217,.24);background:rgba(109,40,217,.08);color:#6d28d9;border-radius:999px;padding:5px 8px;font-size:9px;font-weight:950;white-space:nowrap;cursor:pointer;flex:0 0 auto}',
      '[data-theme*="dark"] .tch-collab-action{color:#c4b5fd;border-color:rgba(196,181,253,.32);background:rgba(124,58,237,.16)}',
      '.tch-collab-action.is-leave,.tch-collab-action.is-retract{color:#9f1239;border-color:rgba(190,24,93,.22);background:rgba(244,63,94,.08)}',
      '.tch-helper-avatar{width:27px;height:27px;border-radius:50%;object-fit:cover;display:grid;place-items:center;margin-left:-7px;background:linear-gradient(135deg,#7c3aed,#c084fc);color:#fff;border:2px solid var(--c-surface);font-size:8px;font-weight:900;box-shadow:0 0 0 1px rgba(202,161,83,.55)}'
    ].join('\n');document.head.appendChild(s);
  }
  function makeGroup(name,cls){var x=document.createElement('section');x.className='tch-group '+cls;x.dataset.lifeGroup=name;x.innerHTML='<button class="tch-group-head" type="button"><span><b>'+name+'</b><em>0 taken</em></span><span class="tch-group-right"><i>⌃</i></span></button><div class="tch-list"></div>';var head=x.querySelector('.tch-group-head');head.onclick=function(){var list=x.querySelector('.tch-list'),icon=x.querySelector('i'),hide=list.style.display!=='none';list.style.display=hide?'none':'';icon.textContent=hide?'⌄':'⌃';};return x;}
  function updateCount(group){var list=group&&group.querySelector(':scope > .tch-list');var n=list?list.querySelectorAll(':scope > .tch-row').length:0,em=group&&group.querySelector(':scope > .tch-group-head em');if(em)em.textContent=n+' '+(n===1?'taak':'taken');if(group&&group.dataset.lifeGroup)group.style.display=n?'':'none';}
  function updateCanonicalCounts(page){
    Array.prototype.forEach.call(page.querySelectorAll(':scope > .tch-group:not([data-life-group])'),function(group){
      var label=String((group.querySelector(':scope > .tch-group-head b')||{}).textContent||'').trim();
      if(label==='Vandaag'){
        var n=realTasks().filter(function(t){var diff=dayDiff(t);return t&&!t.done&&diff!==null&&diff<=0;}).length;
        var em=group.querySelector(':scope > .tch-group-head em');if(em)em.textContent=n+' '+(n===1?'taak':'taken');
      }else updateCount(group);
    });
  }
  function cleanupButton(group){var right=group.querySelector('.tch-group-head .tch-group-right');if(!right||right.querySelector('[data-clear-completed]'))return;var b=document.createElement('button');b.type='button';b.className='tch-clear-completed';b.dataset.clearCompleted='1';b.textContent='Opschonen';b.onclick=function(e){e.preventDefault();e.stopPropagation();var done=realTasks().filter(function(t){return t&&t.done;});if(!done.length)return;if(!confirm('Alle '+done.length+' voltooide taken verwijderen?'))return;if(typeof window.deleteTask!=='function'){if(typeof window.showToast==='function')window.showToast('Opschonen is nog niet beschikbaar');return;}done.forEach(function(t){window.deleteTask(t.id);});if(typeof window.showToast==='function')window.showToast(done.length+' voltooide '+(done.length===1?'taak verwijderd':'taken verwijderd'));};right.insertBefore(b,right.firstChild);}

  function addHelperAvatars(row,task){
    var wrap=row.querySelector('.tch-avatars');if(!wrap)return;
    helpers(task).forEach(function(h){
      var id=helperUid(h);if(!id)return;
      var already=Array.prototype.some.call(wrap.querySelectorAll('[data-helper-uid]'),function(el){return el.getAttribute('data-helper-uid')===id;});if(already)return;
      var av=avatarFor(id),name=(h&&h.name)||(member(id)&&(member(id).displayName||member(id).name))||'Helper';var el;
      if(av){el=document.createElement('img');el.src=av;el.alt=name;}else{el=document.createElement('span');el.textContent=initials(name);el.title=name;}
      el.className='tch-helper-avatar';el.setAttribute('data-helper-uid',id);wrap.appendChild(el);
    });
  }
  function addCollaborationAction(row,task){
    var me=currentUid();if(!me||task.done)return;
    var existing=row.querySelector('[data-collab-action]');if(existing)existing.remove();
    var action='',label='',cls='';
    if(isHelper(task,me)){action='leave';label='Quest verlaten';cls=' is-leave';}
    else if(task.helpRequested&&isHelpOwner(task,me)){action='retract';label='Hulpvraag intrekken';cls=' is-retract';}
    else if(task.helpRequested&&!isHelpOwner(task,me)){action='join';label='Hulp bieden';}
    if(!action)return;
    var btn=document.createElement('button');btn.type='button';btn.className='tch-collab-action'+cls;btn.dataset.collabAction=action;btn.textContent=label;
    btn.onclick=function(e){
      e.preventDefault();e.stopPropagation();if(e.stopImmediatePropagation)e.stopImmediatePropagation();btn.disabled=true;
      var service=window.TaskSharedData,p;
      if(!service){btn.disabled=false;return;}
      if(action==='join')p=service.joinHelp(task.id||task._key);
      if(action==='leave')p=service.leaveHelp(task.id||task._key);
      if(action==='retract')p=service.retractHelp(task.id||task._key);
      Promise.resolve(p).then(function(saved){
        if(action==='join'&&window.NotificationEvents&&NotificationEvents.taskHelpJoined)NotificationEvents.taskHelpJoined(saved||task,task.helpRequestedByUid||task.createdByUid||null).catch(function(){});
        if(typeof window.showToast==='function')window.showToast(action==='join'?'Je helpt nu mee 🤝':action==='leave'?'Je hebt de quest verlaten':'Hulpvraag ingetrokken');
      }).catch(function(err){btn.disabled=false;if(typeof window.showToast==='function')window.showToast((err&&err.message)||'Actie mislukt');});
    };
    var reward=row.querySelector('.tch-reward');if(reward)row.insertBefore(btn,reward);else row.appendChild(btn);
  }
  function projectCollaboration(row,task){addHelperAvatars(row,task);addCollaborationAction(row,task);}

  function apply(root){
    root=root||document.getElementById('task-content');var page=root&&root.querySelector('.tch-page');if(!page)return false;ensureCss();
    var first=page.querySelector('.tch-group'),partyCard=page.querySelector('#tch-party-quest');
    var overdue=page.querySelector('[data-life-group="Verlopen"]');if(!overdue){overdue=makeGroup('Verlopen','tch-overdue-group');if(first)page.insertBefore(overdue,first);else page.appendChild(overdue);}
    var completed=page.querySelector('[data-life-group="Voltooid"]');if(!completed){completed=makeGroup('Voltooid','tch-completed-group');if(partyCard)page.insertBefore(completed,partyCard);else page.appendChild(completed);}cleanupButton(completed);
    var overdueList=overdue.querySelector('.tch-list'),completedList=completed.querySelector('.tch-list');
    realTasks().forEach(function(task){
      var row=page.querySelector('.tch-row[data-task-id="'+String(task.id).replace(/"/g,'\\"')+'"]');if(!row)return;
      projectCollaboration(row,task);
      var meta=row.querySelector('.tch-meta span');if(task.done){if(meta)meta.textContent='Voltooid';completedList.appendChild(row);return;}
      var diff=dayDiff(task);if(diff!==null&&diff<0){if(meta){var days=Math.abs(diff);meta.textContent='Verlopen · '+days+' '+(days===1?'dag':'dagen');}var name=row.querySelector('.tch-name');if(name&&!name.querySelector('.tch-overdue-badge'))name.insertAdjacentHTML('beforeend','<span class="tch-overdue-badge">VERLOPEN</span>');overdueList.appendChild(row);}
    });
    updateCanonicalCounts(page);updateCount(overdue);updateCount(completed);return true;
  }
  function schedule(){Promise.resolve().then(function(){apply();});}
  window.addEventListener('familyapp:tasks-updated',schedule);window.addEventListener('familyapp:household-identity-synced',schedule);
  window.TaskCompactLifecycle={version:'1.2.1',apply:apply};
})();