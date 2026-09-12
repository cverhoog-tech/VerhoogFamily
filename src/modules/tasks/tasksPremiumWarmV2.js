'use strict';
// FamilyApp Tasks Premium Warm v2
// Presentation-only redesign matching the approved warm premium mock-up.
// Canonical task state, persistence and mutations remain owned by TaskCompactHome / TaskDetailPopup.
(function(){
  if(window.__tasksPremiumWarmV2)return;
  window.__tasksPremiumWarmV2=true;

  var overviewObserver=null;
  var popupObserver=null;
  var queued=false;
  var groupFilter='all';

  function esc(value){
    return String(value==null?'':value)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;').replace(/'/g,'&#039;');
  }
  function svg(path,size){
    return '<svg viewBox="0 0 24 24" width="'+(size||20)+'" height="'+(size||20)+'" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+path+'</svg>';
  }
  var ICON={
    plus:svg('<path d="M12 5v14M5 12h14"/>',18),
    list:svg('<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1"/><circle cx="4.5" cy="12" r="1"/><circle cx="4.5" cy="18" r="1"/>',18),
    star:svg('<path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1L3.2 9.4l6.1-.9L12 3Z"/>',18),
    clock:svg('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',18),
    leaf:svg('<path d="M19.5 4.5C11 4.8 6.1 8.7 6.1 15.1c4.9.6 10.4-2.4 13.4-10.6Z"/><path d="M5 20c2.1-4.8 5.4-8 10.8-10.4"/>',20)
  };

  function overviewActive(){
    return !!(document.body&&document.body.getAttribute('data-task-view')==='overview');
  }
  function canonicalTasks(){return Array.isArray(window.taskData)?window.taskData:[];}
  function localDay(value){
    if(!value)return null;
    var d=new Date(String(value)+'T00:00:00');
    if(isNaN(d.getTime()))return null;
    d.setHours(0,0,0,0);
    return d;
  }
  function today(){var d=new Date();d.setHours(0,0,0,0);return d;}
  function highPriority(task){
    var p=String(task&&(task.prio||task.priority)||'').toLowerCase();
    return /hoog|high|urgent|belangrijk/.test(p);
  }
  function summary(){
    var now=today(),data={open:0,important:0,overdue:0,done:0};
    canonicalTasks().forEach(function(task){
      if(!task)return;
      if(task.done){data.done++;return;}
      data.open++;
      if(highPriority(task))data.important++;
      var d=localDay(task.date);
      if(d&&d<now)data.overdue++;
    });
    return data;
  }
  function moduleHead(){
    return '<section class="tpw2-head" aria-label="Taken">'
      +'<div class="tpw2-title-wrap"><span class="tpw2-brand-kicker">'+ICON.leaf+'<span>Samen rust en overzicht</span></span><h1>Taken</h1></div>'
      +'<button type="button" class="tpw2-new-task" data-tpw2-create="1">'+ICON.plus+'<span>Nieuwe taak</span></button>'
      +'</section>';
  }
  function statCard(type,label,value,icon){
    return '<button type="button" class="tpw2-stat tpw2-stat--'+type+'" data-tpw2-stat="'+type+'">'
      +'<span class="tpw2-stat-icon">'+icon+'</span><strong>'+value+'</strong><span>'+label+'</span></button>';
  }
  function summaryHtml(data){
    return '<section class="tpw2-stats" aria-label="Taaksamenvatting" data-tpw2-summary="'+[data.open,data.important,data.overdue,data.done].join(':')+'">'
      +statCard('open','open taken',data.open,ICON.list)
      +statCard('important','belangrijk',data.important,ICON.star)
      +statCard('overdue','verlopen',data.overdue,ICON.clock)
      +'</section>';
  }
  function filterHtml(){
    var items=[['all','Alle taken'],['Vandaag','Vandaag'],['Morgen','Morgen'],['Later','Later'],['Voltooid','Voltooid']];
    return '<nav class="tpw2-filters" aria-label="Taken filter">'+items.map(function(item){
      return '<button type="button" class="tpw2-filter'+(groupFilter===item[0]?' active':'')+'" data-tpw2-filter="'+item[0]+'">'+item[1]+'</button>';
    }).join('')+'</nav>';
  }
  function triggerCanonicalAll(page){
    if(page.dataset.tpw2AllRange==='1')return;
    var all=page.querySelector('.tch-chip[data-range="all"]');
    if(!all)return;
    page.dataset.tpw2AllRange='1';
    if(!all.classList.contains('active'))all.click();
  }
  function bindOverview(page){
    var create=page.querySelector('[data-tpw2-create]');
    if(create&&create.dataset.bound!=='1'){
      create.dataset.bound='1';
      create.addEventListener('click',function(){
        if(window.TaskDetailPopup&&typeof TaskDetailPopup.openCreate==='function')TaskDetailPopup.openCreate();
        else if(typeof window.openAdd==='function')window.openAdd('task');
      });
    }
    page.querySelectorAll('[data-tpw2-filter]').forEach(function(btn){
      if(btn.dataset.bound==='1')return;
      btn.dataset.bound='1';
      btn.addEventListener('click',function(){
        groupFilter=btn.getAttribute('data-tpw2-filter')||'all';
        page.querySelectorAll('[data-tpw2-filter]').forEach(function(x){x.classList.toggle('active',x===btn);});
        applyGroupFilter(page);
      });
    });
    var overdue=page.querySelector('[data-tpw2-stat="overdue"]');
    if(overdue&&overdue.dataset.bound!=='1'){
      overdue.dataset.bound='1';
      overdue.addEventListener('click',function(){groupFilter='Verlopen';applyGroupFilter(page);});
    }
  }
  function applyGroupFilter(page){
    var groups=page.querySelectorAll('.tch-group[data-life-group]');
    var any=false;
    groups.forEach(function(group){
      var name=group.getAttribute('data-life-group')||'';
      var show=groupFilter==='all'||name===groupFilter;
      group.classList.toggle('tpw2-filter-hidden',!show);
      if(show)any=true;
    });
    var empty=page.querySelector('.tpw2-filter-empty');
    if(!empty){
      empty=document.createElement('div');
      empty.className='tpw2-filter-empty';
      empty.textContent='Geen taken in deze categorie.';
      var filters=page.querySelector('.tpw2-filters');
      if(filters)filters.insertAdjacentElement('afterend',empty);
    }
    empty.hidden=any;
  }
  function decorateRows(page){
    page.querySelectorAll('.tch-row').forEach(function(row){
      row.classList.add('tpw2-task-row');
      var reward=row.querySelector('.tch-reward');
      if(reward&&!reward.getAttribute('aria-label'))reward.setAttribute('aria-label','Taakbeloning');
      var name=row.querySelector('.tch-name');
      if(name)name.setAttribute('title',name.textContent.trim());
    });
  }
  function decorateOverview(){
    queued=false;
    if(!overviewActive())return;
    var content=document.getElementById('task-content');
    var page=content&&content.querySelector('.tch-page');
    if(!page)return;
    page.classList.add('tpw2-page');
    triggerCanonicalAll(page);

    var head=page.querySelector('.tpw2-head');
    if(!head)page.insertAdjacentHTML('afterbegin',moduleHead());

    var data=summary(),sig=[data.open,data.important,data.overdue,data.done].join(':');
    var stats=page.querySelector('.tpw2-stats');
    if(!stats||stats.getAttribute('data-tpw2-summary')!==sig){
      if(stats)stats.remove();
      var currentHead=page.querySelector('.tpw2-head');
      if(currentHead)currentHead.insertAdjacentHTML('afterend',summaryHtml(data));
    }
    var filters=page.querySelector('.tpw2-filters');
    if(!filters){
      var currentStats=page.querySelector('.tpw2-stats');
      if(currentStats)currentStats.insertAdjacentHTML('afterend',filterHtml());
    }
    bindOverview(page);
    decorateRows(page);
    applyGroupFilter(page);
  }
  function queueOverview(){
    if(queued)return;
    queued=true;
    if(typeof requestAnimationFrame==='function')requestAnimationFrame(decorateOverview);
    else setTimeout(decorateOverview,0);
  }

  function findTaskForDetail(card){
    var titleEl=card&&card.querySelector('.tdp-title');
    if(!titleEl)return null;
    var title=titleEl.textContent.trim();
    return canonicalTasks().find(function(task){return String(task&&task.title||'').trim()===title;})||null;
  }
  function recurrenceLabel(task){
    var r=String(task&&task.recurrence||'once').toLowerCase();
    return {once:'Eenmalig',daily:'Dagelijks',weekly:'Wekelijks',monthly:'Maandelijks'}[r]||'Eenmalig';
  }
  function priorityLabel(task){
    var p=String(task&&(task.prio||task.priority)||'normaal').toLowerCase();
    if(/hoog|high|urgent/.test(p))return'Hoge prioriteit';
    if(/laag|low/.test(p))return'Lage prioriteit';
    return'Normale prioriteit';
  }
  function detailEnhancements(card){
    if(card.querySelector('.tdp-title-input')){card.classList.add('tpw2-create-card');return;}
    card.classList.add('tpw2-detail-card');
    var task=findTaskForDetail(card);
    var person=card.querySelector('.tdp-person');
    if(person&&!person.querySelector('.tpw2-assignee-label')){
      var copy=person.querySelector('.tdp-person-name');
      if(copy)copy.insertAdjacentHTML('beforebegin','<span class="tpw2-assignee-label">Toegewezen aan</span>');
    }
    var meta=card.querySelector('.tdp-person-meta');
    if(meta){
      meta.classList.add('tpw2-meta-chips');
      Array.prototype.slice.call(meta.querySelectorAll('em')).forEach(function(el){el.remove();});
      if(task){
        var spans=meta.querySelectorAll('span');
        if(spans[1])spans[1].lastChild.textContent=recurrenceLabel(task);
        if(!meta.querySelector('.tpw2-priority-chip')){
          var priority=document.createElement('span');
          priority.className='tpw2-priority-chip';
          priority.textContent=priorityLabel(task);
          meta.appendChild(priority);
        }
      }
    }
    if(task&&!card.querySelector('.tpw2-description')){
      var desc=String(task.desc||task.description||'').trim();
      if(desc){
        var description=document.createElement('p');
        description.className='tpw2-description';
        description.textContent=desc;
        if(person)person.insertAdjacentElement('afterend',description);
      }
    }
    var label=card.querySelector('.tdp-progress-label');
    if(label)label.textContent='Subtaken';
    var value=card.querySelector('.tdp-progress-value');
    if(value)value.classList.add('tpw2-subtask-count');

    if(task&&Array.isArray(task.supplies)&&task.supplies.length&&!card.querySelector('.tpw2-supplies')){
      var help=card.querySelector('.tdp-help-box');
      var supplies=document.createElement('section');
      supplies.className='tpw2-supplies';
      supplies.innerHTML='<div class="tpw2-supplies-head"><strong>Benodigdheden</strong><span>'+task.supplies.length+' items</span></div><div class="tpw2-supplies-list">'
        +task.supplies.map(function(item){var name=typeof item==='string'?item:(item&&item.name)||'';return name?'<span>'+esc(name)+'</span>':'';}).join('')+'</div>';
      if(help)help.insertAdjacentElement('beforebegin',supplies);
      else{var box=card.querySelector('.tdp-box');if(box)box.insertAdjacentElement('afterend',supplies);}
    }

    var more=card.querySelector('#tdp-more-btn');
    if(more){more.textContent=more.textContent.indexOf('Minder')===0?'Bewerken sluiten':'Bewerken';more.classList.add('tpw2-edit-action');}
    var cta=card.querySelector('#tdp-complete-btn');
    if(cta&&cta.classList.contains('active')&&!cta.classList.contains('done-state'))cta.textContent='Markeer als klaar';
  }
  function decoratePopup(){
    var overlay=document.getElementById('tdp-overlay');
    var card=overlay&&overlay.querySelector('.tdp-card');
    if(!card)return;
    overlay.classList.add('tpw2-overlay');
    detailEnhancements(card);
  }
  function observePopup(){
    if(popupObserver||typeof MutationObserver!=='function')return;
    popupObserver=new MutationObserver(function(){
      if(typeof requestAnimationFrame==='function')requestAnimationFrame(decoratePopup);
      else setTimeout(decoratePopup,0);
    });
    popupObserver.observe(document.body,{childList:true,subtree:true});
    decoratePopup();
  }
  function observeOverview(){
    var content=document.getElementById('task-content');
    if(!content||overviewObserver||typeof MutationObserver!=='function')return;
    overviewObserver=new MutationObserver(queueOverview);
    overviewObserver.observe(content,{childList:true,subtree:true});
    queueOverview();
  }
  function boot(){
    observeOverview();
    observePopup();
    ['familyapp:tasks-updated','familyapp:household-identity-synced','familyapp:session-state'].forEach(function(name){window.addEventListener(name,queueOverview);});
    document.addEventListener('click',function(e){
      if(e.target&&e.target.closest&&e.target.closest('#screen-tasks .ttab'))setTimeout(queueOverview,0);
    });
  }

  window.TasksPremiumWarmV2={version:'2.0.0',decorateOverview:decorateOverview,decoratePopup:decoratePopup,summary:summary};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
