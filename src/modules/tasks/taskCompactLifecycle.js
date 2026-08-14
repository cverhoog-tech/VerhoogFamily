'use strict';
// ============================================================
// TASK COMPACT LIFECYCLE v1.0
// Deterministic post-render lifecycle for the canonical TaskCompactHome.
// No polling, MutationObserver, global click interception or XP overrides.
// Owns only overdue/completed grouping and completed-task cleanup UI.
// ============================================================
(function(){
  if(window.__taskCompactLifecycleV1)return;
  window.__taskCompactLifecycleV1=true;

  function realTasks(){return Array.isArray(window.taskData)?window.taskData:[];}
  function dayDiff(task){
    if(!task||!task.date)return null;
    var d=new Date(task.date+'T00:00:00'),n=new Date();
    n.setHours(0,0,0,0);
    return Math.round((d-n)/86400000);
  }
  function ensureCss(){
    if(document.getElementById('tch-lifecycle-css'))return;
    var s=document.createElement('style');
    s.id='tch-lifecycle-css';
    s.textContent='.tch-overdue-badge{display:inline-flex;margin-left:6px;padding:2px 6px;border-radius:99px;background:#fee2e2;color:#b91c1c;font-size:8px;font-weight:900;letter-spacing:.5px}.tch-completed-group .tch-row{opacity:.72}.tch-clear-completed{border:0;background:transparent;color:#b91c1c;font-size:10px;font-weight:900;padding:4px 6px;cursor:pointer}';
    document.head.appendChild(s);
  }
  function makeGroup(name,cls){
    var x=document.createElement('section');
    x.className='tch-group '+cls;
    x.dataset.lifeGroup=name;
    x.innerHTML='<button class="tch-group-head" type="button"><span><b>'+name+'</b><em>0 taken</em></span><span class="tch-group-right"><i>⌃</i></span></button><div class="tch-list"></div>';
    var head=x.querySelector('.tch-group-head');
    head.onclick=function(){
      var list=x.querySelector('.tch-list'),icon=x.querySelector('i'),hide=list.style.display!=='none';
      list.style.display=hide?'none':'';
      icon.textContent=hide?'⌄':'⌃';
    };
    return x;
  }
  function updateCount(group){
    var n=group.querySelectorAll('.tch-list>.tch-row').length,em=group.querySelector('em');
    if(em)em.textContent=n+' '+(n===1?'taak':'taken');
    group.style.display=n?'':'none';
  }
  function cleanupButton(group){
    var right=group.querySelector('.tch-group-head .tch-group-right');
    if(!right||right.querySelector('[data-clear-completed]'))return;
    var b=document.createElement('button');
    b.type='button';
    b.className='tch-clear-completed';
    b.dataset.clearCompleted='1';
    b.textContent='Opschonen';
    b.onclick=function(e){
      e.preventDefault();e.stopPropagation();
      var done=realTasks().filter(function(t){return t&&t.done;});
      if(!done.length)return;
      if(!confirm('Alle '+done.length+' voltooide taken verwijderen?'))return;
      if(typeof window.deleteTask!=='function'){
        if(typeof window.showToast==='function')window.showToast('Opschonen is nog niet beschikbaar');
        return;
      }
      done.forEach(function(t){window.deleteTask(t.id);});
      if(typeof window.showToast==='function')window.showToast(done.length+' voltooide '+(done.length===1?'taak verwijderd':'taken verwijderd'));
    };
    right.insertBefore(b,right.firstChild);
  }
  function apply(root){
    root=root||document.getElementById('task-content');
    var page=root&&root.querySelector('.tch-page');
    if(!page)return false;
    ensureCss();

    var first=page.querySelector('.tch-group'),partyCard=page.querySelector('#tch-party-quest');
    var overdue=page.querySelector('[data-life-group="Verlopen"]');
    if(!overdue){overdue=makeGroup('Verlopen','tch-overdue-group');if(first)page.insertBefore(overdue,first);else page.appendChild(overdue);}
    var completed=page.querySelector('[data-life-group="Voltooid"]');
    if(!completed){completed=makeGroup('Voltooid','tch-completed-group');if(partyCard)page.insertBefore(completed,partyCard);else page.appendChild(completed);}
    cleanupButton(completed);

    var overdueList=overdue.querySelector('.tch-list'),completedList=completed.querySelector('.tch-list');
    realTasks().forEach(function(task){
      var row=page.querySelector('.tch-row[data-task-id="'+String(task.id).replace(/"/g,'\\"')+'"]');
      if(!row)return;
      var meta=row.querySelector('.tch-meta span');
      if(task.done){
        if(meta)meta.textContent='Voltooid';
        completedList.appendChild(row);
        return;
      }
      var diff=dayDiff(task);
      if(diff!==null&&diff<0){
        if(meta){var days=Math.abs(diff);meta.textContent='Verlopen · '+days+' '+(days===1?'dag':'dagen');}
        var name=row.querySelector('.tch-name');
        if(name&&!name.querySelector('.tch-overdue-badge'))name.insertAdjacentHTML('beforeend','<span class="tch-overdue-badge">VERLOPEN</span>');
        overdueList.appendChild(row);
      }
    });
    updateCount(overdue);
    updateCount(completed);
    return true;
  }

  function schedule(){Promise.resolve().then(function(){apply();});}
  window.addEventListener('familyapp:tasks-updated',schedule);
  window.addEventListener('familyapp:household-identity-synced',schedule);
  window.TaskCompactLifecycle={version:'1.0.0',apply:apply};
})();