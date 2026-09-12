'use strict';
// FamilyApp Tasks Premium Modern v1
// Presentation-only decorator for the canonical TaskCompactHome overview.
// Reads taskData; never owns persistence, routing or task mutations.
(function(){
  if(window.__tasksPremiumModernV1)return;
  window.__tasksPremiumModernV1=true;

  var observer=null;
  var queued=false;

  function esc(value){
    return String(value==null?'':value)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;').replace(/'/g,'&#039;');
  }
  function overviewActive(){
    try{return document.body&&document.body.getAttribute('data-task-view')==='overview';}catch(e){return false;}
  }
  function tasks(){return Array.isArray(window.taskData)?window.taskData:[];}
  function localDay(value){
    if(!value)return null;
    var d=new Date(String(value)+'T00:00:00');
    if(isNaN(d.getTime()))return null;
    d.setHours(0,0,0,0);
    return d;
  }
  function today(){var d=new Date();d.setHours(0,0,0,0);return d;}
  function summary(){
    var all=tasks(),now=today(),open=0,todayCount=0,done=0,overdue=0;
    all.forEach(function(task){
      if(!task)return;
      if(task.done){done++;return;}
      open++;
      var date=localDay(task.date);
      if(!date)return;
      if(date.getTime()===now.getTime())todayCount++;
      else if(date<now)overdue++;
    });
    return {open:open,today:todayCount,done:done,overdue:overdue};
  }
  function plusSvg(){
    return '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>';
  }
  function taskSvg(){
    return '<svg viewBox="0 0 28 28" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="4.5" width="18" height="19" rx="4"/><path d="m9 10 1.8 1.8L14 8.6M16.5 10h3M9 17h10"/></svg>';
  }
  function moduleHeader(){
    return '<section class="tpm-module-head" aria-label="Taken">'
      +'<div class="tpm-module-mark">'+taskSvg()+'</div>'
      +'<div class="tpm-module-copy"><span>FAMILYAPP · TAKEN</span><h1>Taken</h1><p>Plan, verdeel en rond samen af.</p></div>'
      +'<button type="button" class="tpm-add-task" data-tpm-add-task="1" aria-label="Nieuwe taak">'+plusSvg()+'</button>'
      +'</section>';
  }
  function summaryStrip(data){
    var attention=data.overdue>0
      ?'<div class="tpm-summary-card is-overdue"><span>Verlopen</span><strong>'+data.overdue+'</strong></div>'
      :'<div class="tpm-summary-card is-done"><span>Klaar</span><strong>'+data.done+'</strong></div>';
    return '<section class="tpm-summary-strip" aria-label="Taken samenvatting" data-tpm-summary="'+[data.open,data.today,data.done,data.overdue].join(':')+'">'
      +'<div class="tpm-summary-card"><span>Open</span><strong>'+data.open+'</strong></div>'
      +'<div class="tpm-summary-card"><span>Vandaag</span><strong>'+data.today+'</strong></div>'
      +attention
      +'</section>';
  }
  function bindAdd(page){
    var button=page.querySelector('[data-tpm-add-task]');
    if(!button||button.dataset.bound==='1')return;
    button.dataset.bound='1';
    button.addEventListener('click',function(){
      if(window.TaskDetailPopup&&typeof window.TaskDetailPopup.openCreate==='function'){
        window.TaskDetailPopup.openCreate();
      }else if(typeof window.openAdd==='function'){
        window.openAdd('task');
      }
    });
  }
  function decorate(){
    queued=false;
    if(!overviewActive())return;
    var content=document.getElementById('task-content');
    var page=content&&content.querySelector('.tch-page');
    if(!page)return;

    if(!page.querySelector('.tpm-module-head')){
      page.insertAdjacentHTML('afterbegin',moduleHeader());
    }
    bindAdd(page);

    var data=summary();
    var sig=[data.open,data.today,data.done,data.overdue].join(':');
    var current=page.querySelector('.tpm-summary-strip');
    if(!current||current.getAttribute('data-tpm-summary')!==sig){
      if(current)current.remove();
      var hero=page.querySelector('.tch-header');
      if(hero)hero.insertAdjacentHTML('afterend',summaryStrip(data));
      else page.querySelector('.tpm-module-head').insertAdjacentHTML('afterend',summaryStrip(data));
    }
  }
  function queue(){
    if(queued)return;queued=true;
    if(typeof requestAnimationFrame==='function')requestAnimationFrame(decorate);
    else setTimeout(decorate,0);
  }
  function observe(){
    var content=document.getElementById('task-content');
    if(!content||observer)return;
    if(typeof MutationObserver==='function'){
      observer=new MutationObserver(queue);
      observer.observe(content,{childList:true,subtree:false});
    }
    queue();
  }
  function boot(){
    observe();
    window.addEventListener('familyapp:tasks-updated',queue);
    window.addEventListener('familyapp:household-identity-synced',queue);
    window.addEventListener('familyapp:party-quests-updated',queue);
    window.addEventListener('familyapp:session-state',queue);
    document.addEventListener('click',function(e){
      var tab=e.target&&e.target.closest&&e.target.closest('#screen-tasks .ttab');
      if(tab)setTimeout(queue,0);
    });
  }

  window.TasksPremiumModernV1={decorate:decorate,summary:summary,version:'1.0.0'};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
