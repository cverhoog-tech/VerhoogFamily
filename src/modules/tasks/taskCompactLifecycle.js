'use strict';
// ============================================================
// TASK COMPACT LIFECYCLE v3.0.0
// Verlopen/Voltooid are rendered as first-class groups directly by
// TaskCompactHome (deterministic, always present regardless of which
// sections happen to be collapsed). This module only projects
// collaboration state (helper avatars, a compact help-request badge,
// and a small status/action popover) from TaskSharedData onto rows
// that TaskCompactHome has already rendered. No DOM group-moving, no
// second invitation state — every action here calls straight into
// TaskSharedData.
// ============================================================
(function(){
  if(window.__taskCompactLifecycleV3)return;
  window.__taskCompactLifecycleV3=true;
  window.__taskCompactLifecycleV2=true;window.__taskCompactLifecycleV1=true; // legacy guard flags for any stale cached script tag

  function realTasks(){return Array.isArray(window.taskData)?window.taskData:[];}
  function currentUid(){try{return (window.fbUser||(window.firebase&&firebase.auth&&firebase.auth().currentUser)||{}).uid||null;}catch(e){return null;}}
  function members(){try{return window.TaskSharedData&&TaskSharedData.members?TaskSharedData.members()||[]:[];}catch(e){return[];}}
  function member(id){return members().find(function(m){return String(m.uid||m.id)===String(id);})||null;}
  function memberName(id){var m=member(id);if(m)return m.displayName||m.name||'Gezinslid';return String(id||'')===String(currentUid())?(window.myName||'Jij'):'Gezinslid';}
  function helperUid(h){return String(h&&(h.uid||h.memberId||h.id)||'');}
  function isHelpOwner(task,id){return !!(window.TaskSharedData&&TaskSharedData.isTaskOwner&&TaskSharedData.isTaskOwner(task,id));}
  function helpers(task){return Array.isArray(task&&task.helpers)?task.helpers:[];}
  function isHelper(task,id){return helpers(task).some(function(h){return helperUid(h)===String(id);});}
  function initials(name){return String(name||'G').trim().split(/\s+/).map(function(x){return x[0]||'';}).join('').slice(0,2).toUpperCase()||'G';}
  function avatarFor(id){var m=member(id);return m&&(m.avatar||m.avatarUrl||m.photoURL||m.profilePhoto)||'';}
  function esc(v){return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');}
  function toast(msg){if(typeof window.showToast==='function')window.showToast(msg);}

  function ensureCss(){
    if(document.getElementById('tch-lifecycle-css'))return;
    var s=document.createElement('style');s.id='tch-lifecycle-css';
    s.textContent=[
      '.tch-overdue-badge{display:inline-flex;margin-left:6px;padding:2px 6px;border-radius:99px;background:#fee2e2;color:#b91c1c;font-size:8px;font-weight:900;letter-spacing:.5px}',
      '.tch-completed-group .tch-row{opacity:.72}.tch-clear-completed{border:0;background:transparent;color:#b91c1c;font-size:10px;font-weight:900;padding:4px 6px;cursor:pointer}',
      // A round badge with a real ≥40px tap target: the <button> itself is
      // the invisible hit area, the small visual circle sits centered
      // inside it. box-sizing/appearance are reset explicitly so mobile
      // Safari's native button chrome can never distort it into a pill.
      '.tch-help-indicator{box-sizing:border-box;-webkit-appearance:none;appearance:none;position:relative;width:40px;height:40px;min-width:40px;padding:0;margin:0;border:0;background:transparent;display:grid;place-items:center;cursor:pointer;flex:0 0 auto;touch-action:manipulation}',
      '.tch-help-indicator-dot{box-sizing:border-box;width:26px;height:26px;border-radius:50%;display:grid;place-items:center;border:1.5px solid rgba(184,134,31,.7);background:radial-gradient(circle at 35% 28%,#7c3aed,#4c1d95);color:#f6cf66;font-family:Georgia,serif;font-size:14px;font-weight:900;line-height:1;box-shadow:0 2px 7px rgba(61,35,97,.18),0 0 0 2px var(--c-surface)}',
      '.tch-help-indicator.is-actionable .tch-help-indicator-dot{box-shadow:0 2px 7px rgba(61,35,97,.18),0 0 0 2px var(--c-surface),0 0 0 3.5px rgba(216,181,82,.55)}',
      '[data-theme*="dark"] .tch-help-indicator-dot{box-shadow:0 2px 8px rgba(0,0,0,.45),0 0 0 2px var(--c-surface)}',
      '[data-theme*="dark"] .tch-help-indicator.is-actionable .tch-help-indicator-dot{box-shadow:0 2px 8px rgba(0,0,0,.45),0 0 0 2px var(--c-surface),0 0 0 3.5px rgba(216,181,82,.6)}',
      '.tch-helper-avatar{position:relative;width:27px;height:27px;border-radius:50%;object-fit:cover;display:grid;place-items:center;margin-left:-7px;background:linear-gradient(135deg,#7c3aed,#c084fc);color:#fff;border:2px solid var(--c-surface);font-size:8px;font-weight:900;box-shadow:0 0 0 1px rgba(202,161,83,.55)}',
      '.tch-helper-avatar-wrap{position:relative;display:inline-flex;margin-left:-7px;box-sizing:border-box;width:34px;height:34px;place-items:center;justify-content:center}',
      '.tch-helper-avatar-wrap .tch-helper-avatar{margin-left:0}',
      '.tch-helper-avatar-wrap.is-self-helper{cursor:pointer;touch-action:manipulation}',
      '.tch-helper-avatar-wrap.is-self-helper .tch-helper-avatar{box-shadow:0 0 0 1px rgba(202,161,83,.9),0 2px 8px rgba(109,40,217,.2)}',
      // Small status/action popover ("mini action sheet") shown on tap,
      // instead of the badge/avatar executing an action directly.
      '.tch-collab-overlay{position:fixed;inset:0;z-index:9400;background:rgba(8,7,15,.42);display:flex;align-items:flex-end;justify-content:center;padding:14px;opacity:0;pointer-events:none;transition:opacity .16s}',
      '.tch-collab-overlay.open{opacity:1;pointer-events:auto}',
      '.tch-collab-card{width:min(340px,100%);border-radius:18px;background:var(--c-surface);border:1.5px solid rgba(184,134,31,.45);box-shadow:0 18px 44px rgba(20,10,40,.24);padding:14px;transform:translateY(12px);transition:transform .18s}',
      '.tch-collab-overlay.open .tch-collab-card{transform:translateY(0)}',
      '.tch-collab-head{display:flex;align-items:center;gap:9px;margin-bottom:8px}',
      '.tch-collab-crest{width:32px;height:32px;border-radius:50%;display:grid;place-items:center;background:radial-gradient(circle at 35% 28%,#7c3aed,#4c1d95);color:#f6cf66;font-family:Georgia,serif;font-weight:900;font-size:15px;border:1.5px solid rgba(184,134,31,.7);flex:0 0 auto}',
      '.tch-collab-title{font-size:12.5px;font-weight:900;color:var(--c-text)}',
      '.tch-collab-sub{font-size:11.5px;color:var(--c-text2);line-height:1.4;margin:2px 0 0}',
      '.tch-collab-close{margin-left:auto;background:none;border:0;color:var(--c-text2);font-size:14px;cursor:pointer;padding:6px}',
      '.tch-collab-actions{display:flex;gap:8px;margin-top:11px}',
      '.tch-collab-btn{flex:1;border:0;border-radius:11px;padding:10px;font-size:11.5px;font-weight:800;cursor:pointer;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:#fff}',
      '.tch-collab-btn.is-muted{background:var(--c-surface2);color:var(--c-text2)}',
      '.tch-collab-btn.is-danger{background:#7f1d1d;color:#fff}'
    ].join('\n');document.head.appendChild(s);
  }

  // ── mini action sheet ──
  function closeCollabPopover(){var o=document.getElementById('tch-collab-popover');if(o){o.classList.remove('open');setTimeout(function(){if(o.parentNode)o.parentNode.removeChild(o);},160);}document.removeEventListener('keydown',collabEscHandler,true);}
  function collabEscHandler(e){if(e.key==='Escape')closeCollabPopover();}
  function collabButton(a){return '<button type="button" class="tch-collab-btn'+(a.cls?' '+a.cls:'')+'" data-collab-popover-action="'+esc(a.action)+'">'+esc(a.label)+'</button>';}
  function openCollabPopover(task,content){
    // Remove any existing popover immediately (no fade) before creating the
    // new one. closeCollabPopover()'s fade-out leaves the old node in the
    // DOM for ~160ms with the same id; opening a second popover inside that
    // window would otherwise leave two #tch-collab-popover elements at once
    // and getElementById() could resolve to the stale one, showing the
    // wrong role's status/actions.
    var stale=document.getElementById('tch-collab-popover');if(stale&&stale.parentNode)stale.parentNode.removeChild(stale);
    var o=document.createElement('div');o.id='tch-collab-popover';o.className='tch-collab-overlay';
    o.innerHTML='<div class="tch-collab-card"><div class="tch-collab-head"><div class="tch-collab-crest">!</div><div style="flex:1;min-width:0"><div class="tch-collab-title">'+esc(content.title)+'</div><div class="tch-collab-sub">'+esc(content.sub)+'</div></div><button type="button" class="tch-collab-close" data-collab-close="1">✕</button></div>'+(content.actions&&content.actions.length?'<div class="tch-collab-actions">'+content.actions.map(collabButton).join('')+'</div>':'')+'</div>';
    document.body.appendChild(o);
    o.onclick=function(e){if(e.target===o)closeCollabPopover();};
    o.querySelector('[data-collab-close]').onclick=closeCollabPopover;
    o.querySelectorAll('[data-collab-popover-action]').forEach(function(btn){
      btn.onclick=function(){
        var action=btn.getAttribute('data-collab-popover-action');
        if(action==='close'){closeCollabPopover();return;}
        Array.prototype.forEach.call(o.querySelectorAll('[data-collab-popover-action]'),function(b){b.disabled=true;});
        runCollabAction(task,action).then(function(){closeCollabPopover();}).catch(function(err){Array.prototype.forEach.call(o.querySelectorAll('[data-collab-popover-action]'),function(b){b.disabled=false;});toast((err&&err.message)||'Actie mislukt');});
      };
    });
    requestAnimationFrame(function(){o.classList.add('open');});
    document.addEventListener('keydown',collabEscHandler,true);
  }
  function runCollabAction(task,action){
    var service=window.TaskSharedData;if(!service)return Promise.reject(new Error('Nog niet klaar'));
    if(action==='join'){
      return service.joinHelp(task.id||task._key).then(function(saved){
        if(window.NotificationEvents&&NotificationEvents.taskHelpJoined)NotificationEvents.taskHelpJoined(saved||task,task.helpRequestedByUid||task.createdByUid||null).catch(function(){});
        toast('Je helpt nu mee 🤝');
      });
    }
    if(action==='retract')return service.retractHelp(task.id||task._key).then(function(){toast('Hulpvraag ingetrokken');});
    if(action==='leave')return service.leaveHelp(task.id||task._key).then(function(){toast('Je hebt de quest verlaten');});
    return Promise.resolve();
  }
  // Status + actions shown in the popover, per viewer role. Every role sees
  // at minimum a clear status line; only the role that can actually act on
  // it gets action buttons — no blind single-tap execution.
  function collabContentFor(task,role){
    var owner=memberName(task.helpRequestedByUid||task.createdByUid),target=memberName(task.helpRequestedForUid);
    if(role==='owner-pending')return{title:'Hulp gevraagd',sub:'Uitnodiging staat open voor '+target+'.',actions:[{label:'Hulpvraag intrekken',action:'retract',cls:'is-danger'}]};
    if(role==='invitee')return{title:'Hulp gevraagd',sub:owner+' vraagt jouw hulp bij deze taak.',actions:[{label:'Hulp geven',action:'join',cls:''},{label:'Niet nu',action:'close',cls:'is-muted'}]};
    if(role==='helper')return{title:'Samen op quest',sub:'Je helpt mee aan deze taak.',actions:[{label:'Quest verlaten',action:'leave',cls:'is-danger'}]};
    return{title:'Hulp gevraagd',sub:owner+' vraagt hulp'+(target&&target!==owner?' aan '+target:'')+' bij deze taak.',actions:[{label:'Sluiten',action:'close',cls:'is-muted'}]};
  }

  function leaveAsHelper(task,el){
    openCollabPopover(task,collabContentFor(task,'helper'));
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
  function addCollaborationAction(row,task){
    var me=currentUid();if(!me||task.done)return;
    Array.prototype.forEach.call(row.querySelectorAll('[data-collab-action]'),function(x){x.remove();});
    if(isHelper(task,me))return; // leave is attached to the user's own helper avatar instead.
    if(!task.helpRequested)return; // nothing to show.
    // Visible to everyone in the household while a request is open — the
    // owner and invitee get action buttons in the popover, anyone else
    // gets a status-only popover so the open request is never invisible.
    var role=isHelpOwner(task,me)?'owner-pending':(String(task.helpRequestedForUid||'')===String(me)?'invitee':'other');
    var btn=document.createElement('button');btn.type='button';btn.className='tch-help-indicator'+(role!=='other'?' is-actionable':'');btn.dataset.collabAction=role;
    btn.setAttribute('aria-label',role==='owner-pending'?'Open hulpvraag beheren':role==='invitee'?'Hulp gevraagd — bekijk':'Hulp gevraagd voor deze taak');
    btn.innerHTML='<span class="tch-help-indicator-dot">!</span>';
    btn.onclick=function(e){e.preventDefault();e.stopPropagation();if(e.stopImmediatePropagation)e.stopImmediatePropagation();openCollabPopover(task,collabContentFor(task,role));};
    var reward=row.querySelector('.tch-reward');if(reward)row.insertBefore(btn,reward);else row.appendChild(btn);
  }
  function projectCollaboration(row,task){addHelperAvatars(row,task);addCollaborationAction(row,task);}

  function apply(root){
    root=root||document.getElementById('task-content');var page=root&&root.querySelector('.tch-page');if(!page)return false;ensureCss();
    // Grouping (Verlopen/Vandaag/Morgen/Later/Voltooid) is deterministic and
    // owned by TaskCompactHome's renderer. This only projects collaboration
    // UI (helper avatars, help-request badge) onto rows that already exist.
    Array.prototype.forEach.call(page.querySelectorAll('.tch-row[data-task-id]'),function(row){
      var id=row.getAttribute('data-task-id'),task=realTasks().find(function(t){return String(t.id)===String(id);});
      if(task)projectCollaboration(row,task);
    });
    return true;
  }
  function schedule(){var stale=document.getElementById('tch-collab-popover');if(stale&&stale.parentNode)stale.parentNode.removeChild(stale);Promise.resolve().then(function(){apply();});}
  document.addEventListener('click',function(e){var h=e.target&&e.target.closest&&e.target.closest('#task-content [data-group-toggle]');if(h)Promise.resolve().then(function(){Promise.resolve().then(apply);});},false);
  window.addEventListener('familyapp:tasks-updated',schedule);window.addEventListener('familyapp:household-identity-synced',schedule);
  window.TaskCompactLifecycle={version:'3.0.0',apply:apply};
})();
