'use strict';
// ============================================================
// TASK COMPACT LIFECYCLE v1.4.0
// Deterministic post-render lifecycle for the canonical TaskCompactHome.
// No polling or MutationObserver. Groups task lifecycle state and projects
// collaboration state from TaskSharedData.
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
  function isHelpOwner(task,id){return !!(window.TaskSharedData&&TaskSharedData.isTaskOwner&&TaskSharedData.isTaskOwner(task,id));}
  function helpers(task){return Array.isArray(task&&task.helpers)?task.helpers:[];}
  function isHelper(task,id){return helpers(task).some(function(h){return helperUid(h)===String(id);});}
  function initials(name){return String(name||'G').trim().split(/\s+/).map(function(x){return x[0]||'';}).join('').slice(0,2).toUpperCase()||'G';}
  function avatarFor(id){var m=member(id);return m&&(m.avatar||m.avatarUrl||m.photoURL||m.profilePhoto)||'';}
  function toast(msg){if(typeof window.showToast==='function')window.showToast(msg);}

  function ensureCss(){
    if(document.getElementById('tch-lifecycle-css'))return;
    var s=document.createElement('style');s.id='tch-lifecycle-css';
    s.textContent=[
      '.tch-overdue-badge{display:inline-flex;margin-left:6px;padding:2px 6px;border-radius:99px;background:#fee2e2;color:#b91c1c;font-size:8px;font-weight:900;letter-spacing:.5px}',
      '.tch-completed-group .tch-row{opacity:.72}.tch-clear-completed{border:0;background:transparent;color:#b91c1c;font-size:10px;font-weight:900;padding:4px 6px;cursor:pointer}',
      '.tch-help-indicator{position:relative;width:29px;height:29px;min-width:29px;border-radius:50%;display:grid;place-items:center;border:1.5px solid rgba(184,134,31,.7);background:radial-gradient(circle at 35% 28%,#7c3aed,#4c1d95);color:#f6cf66;font-family:Georgia,serif;font-size:16px;font-weight:900;line-height:1;box-shadow:0 2px 7px rgba(61,35,97,.18),0 0 0 2px var(--c-surface);cursor:pointer;flex:0 0 auto;padding:0}',
      '.tch-help-indicator:after{content:"";position:absolute;inset:3px;border:1px solid rgba(246,207,102,.35);border-radius:50%;pointer-events:none}',
      '.tch-help-indicator.is-retract:before{content:"×";position:absolute;right:-4px;top:-5px;width:13px;height:13px;border-radius:50%;display:grid;place-items:center;background:#fff7e3;color:#9f1239;border:1px solid rgba(184,134,31,.65);font:900 10px/1 Arial}',
      '[data-theme*="dark"] .tch-help-indicator{box-shadow:0 2px 8px rgba(0,0,0,.45),0 0 0 2px var(--c-surface)}',
      '.tch-helper-avatar{position:relative;width:27px;height:27px;border-radius:50%;object-fit:cover;display:grid;place-items:center;margin-left:-7px;background:linear-gradient(135deg,#7c3aed,#c084fc);color:#fff;border:2px solid var(--c-surface);font-size:8px;font-weight:900;box-shadow:0 0 0 1px rgba(202,161,83,.55)}',
      '.tch-helper-avatar.is-self-helper{cursor:pointer;box-shadow:0 0 0 1px rgba(202,161,83,.9),0 2px 8px rgba(109,40,217,.2)}',
      '.tch-helper-avatar-wrap{position:relative;display:inline-flex;margin-left:-7px}',
      '.tch-helper-avatar-wrap .tch-helper-avatar{margin-left:0}',
      '.tch-helper-avatar-wrap.is-self-helper:after{content:"×";position:absolute;right:-4px;top:-5px;width:12px;height:12px;border-radius:50%;display:grid;place-items:center;background:#fff7e3;color:#9f1239;border:1px solid rgba(184,134,31,.65);font:900 9px/1 Arial;pointer-events:none}'
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
  function cleanupButton(group){var right=group.querySelector('.tch-group-head .tch-group-right');if(!right||right.querySelector('[data-clear-completed]'))return;var b=document.createElement('button');b.type='button';b.className='tch-clear-completed';b.dataset.clearCompleted='1';b.textContent='Opschonen';b.onclick=function(e){e.preventDefault();e.stopPropagation();var done=realTasks().filter(function(t){return t&&t.done;});if(!done.length)return;if(!confirm('Alle '+done.length+' voltooide taken verwijderen?'))return;if(typeof window.deleteTask!=='function'){toast('Opschonen is nog niet beschikbaar');return;}done.forEach(function(t){window.deleteTask(t.id);});toast(done.length+' voltooide '+(done.length===1?'taak verwijderd':'taken verwijderd'));};right.insertBefore(b,right.firstChild);}

  function leaveAsHelper(task,el){
    var service=window.TaskSharedData;if(!service||!service.leaveHelp)return;el.style.pointerEvents='none';
    Promise.resolve(service.leaveHelp(task.id||task._key)).then(function(){toast('Je hebt de quest verlaten');}).catch(function(err){el.style.pointerEvents='';toast((err&&err.message)||'Quest verlaten mislukt');});
  }
  function addHelperAvatars(row,task){
    var wrap=row.querySelector('.tch-avatars');if(!wrap)return;var me=currentUid();
    helpers(task).forEach(function(h){
      var id=helperUid(h);if(!id)return;
      var already=Array.prototype.some.call(wrap.querySelectorAll('[data-helper-uid]'),function(el){return el.getAttribute('data-helper-uid')===id;});if(already)return;
      var av=avatarFor(id),name=(h&&h.name)||(member(id)&&(member(id).displayName||member(id).name))||'Helper',holder=document.createElement('span'),el;
      holder.className='tch-helper-avatar-wrap'+(String(id)===String(me)?' is-self-helper':'');holder.setAttribute('data-helper-uid',id);holder.title=String(id)===String(me)?'Quest verlaten':name;
      if(av){el=document.createElement('img');el.src=av;el.alt=name;}else{el=document.createElement('span');el.textContent=initials(name);el.title=name;}
      el.className='tch-helper-avatar'+(String(id)===String(me)?' is-self-helper':'');holder.appendChild(el);wrap.appendChild(holder);
      if(String(id)===String(me))holder.onclick=function(e){e.preventDefault();e.stopPropagation();if(e.stopImmediatePropagation)e.stopImmediatePropagation();leaveAsHelper(task,holder);};
    });
  }
  function runAction(task,action,btn){
    var service=window.TaskSharedData,p;if(!service)return;btn.disabled=true;
    if(action==='join')p=service.joinHelp(task.id||task._key);
    if(action==='retract')p=service.retractHelp(task.id||task._key);
    Promise.resolve(p).then(function(saved){
      if(action==='join'&&window.NotificationEvents&&NotificationEvents.taskHelpJoined)NotificationEvents.taskHelpJoined(saved||task,task.helpRequestedByUid||task.createdByUid||null).catch(function(){});
      toast(action==='join'?'Je helpt nu mee 🤝':'Hulpvraag ingetrokken');
    }).catch(function(err){btn.disabled=false;toast((err&&err.message)||'Actie mislukt');});
  }
  function addCollaborationAction(row,task){
    var me=currentUid();if(!me||task.done)return;
    Array.prototype.forEach.call(row.querySelectorAll('[data-collab-action]'),function(x){x.remove();});
    if(isHelper(task,me))return; // leave is attached to the user's helper avatar itself.
    var action='',label='';
    if(task.helpRequested&&isHelpOwner(task,me)){action='retract';label='Hulpvraag intrekken';}
    else if(task.helpRequested&&String(task.helpRequestedForUid||'')===String(me)){action='join';label='Hulp geven';}
    if(!action)return;
    var btn=document.createElement('button');btn.type='button';btn.className='tch-help-indicator'+(action==='retract'?' is-retract':'');btn.dataset.collabAction=action;btn.textContent='!';btn.title=label;btn.setAttribute('aria-label',label);
    btn.onclick=function(e){e.preventDefault();e.stopPropagation();if(e.stopImmediatePropagation)e.stopImmediatePropagation();runAction(task,action,btn);};
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
  document.addEventListener('click',function(e){var h=e.target&&e.target.closest&&e.target.closest('#task-content [data-group-toggle]');if(h)Promise.resolve().then(function(){Promise.resolve().then(apply);});},false);
  window.addEventListener('familyapp:tasks-updated',schedule);window.addEventListener('familyapp:household-identity-synced',schedule);
  window.TaskCompactLifecycle={version:'1.4.0',apply:apply};
})();