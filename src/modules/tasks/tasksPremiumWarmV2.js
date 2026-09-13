'use strict';
// FamilyApp Tasks Premium Warm v2.3
// Presentation-only redesign matching the approved warm premium mock-up.
// Canonical task state, persistence and mutations remain owned by TaskCompactHome / TaskDetailPopup.
(function(){
  if(window.__tasksPremiumWarmV2)return;
  window.__tasksPremiumWarmV2=true;

  var overviewObserver=null;
  var popupObserver=null;
  var queued=false;
  var groupFilter='all';
  var TASK_HERO_DEFAULT='https://res.cloudinary.com/rg86slp4/image/upload/v1788808948/familyapp-home-tasks-hero-v3.webp';
  var TASK_HERO_CLEANING='https://res.cloudinary.com/rg86slp4/image/upload/v1788809095/familyapp-home-cleaning-hero-v3.webp';
  var TASK_PHOTO={
    bathroom:'/src/assets/cleaning-rooms/bathroom-light.webp',
    bedroom:'/src/assets/cleaning-rooms/bedroom-light.webp',
    hall:'/src/assets/cleaning-rooms/hall-light.webp',
    kids:'/src/assets/cleaning-rooms/kids-room-light.webp',
    kitchen:'/src/assets/cleaning-rooms/kitchen-light.webp',
    laundry:'/src/assets/cleaning-rooms/laundry-light.webp',
    living:'/src/assets/cleaning-rooms/living-room-light.webp',
    toilet:'/src/assets/cleaning-rooms/toilet-light.webp',
    outside:'/src/assets/cleaning-rooms/outdoor-light.webp',
    groceries:'/src/assets/task-heroes/market.webp',
    garden:'/src/assets/task-heroes/garden.webp',
    travel:'/src/assets/task-heroes/travel.webp',
    home:'/src/assets/task-heroes/cozy-home.webp',
    generic:'/src/assets/task-heroes/cozy-home.webp'
  };

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

  function ensureFinishStyle(){
    if(document.getElementById('tasks-premium-warm-v23-style'))return;
    var style=document.createElement('style');
    style.id='tasks-premium-warm-v23-style';
    style.textContent='\n'
      +'body[data-task-view="overview"] .tpw2-head h1{font-family:Georgia,"Times New Roman",serif!important;font-size:31px!important;font-weight:700!important;letter-spacing:-.025em!important}\n'
      +'body[data-task-view="overview"] .tpw2-stats{gap:7px!important;border:0!important;border-radius:0!important;overflow:visible!important;background:transparent!important}\n'
      +'body[data-task-view="overview"] .tpw2-stat{min-height:67px!important;padding:10px 11px!important;border:1px solid rgba(82,88,82,.10)!important;border-radius:13px!important;background:#fbfcf8!important;box-shadow:0 4px 14px rgba(43,52,47,.035)!important}\n'
      +'body[data-task-view="overview"] .tpw2-stat--important{background:#fbf7ee!important}\n'
      +'body[data-task-view="overview"] .tpw2-stat--overdue{background:#fbf1ef!important}\n'
      +'body[data-task-view="overview"] .tpw2-quote{position:relative;display:grid;grid-template-columns:27px minmax(0,1fr);align-items:center;gap:9px;min-height:58px;margin:0 0 11px;padding:10px 13px;overflow:hidden;border:1px solid rgba(70,78,73,.10);border-radius:13px;background:#f0eee5;box-shadow:none}\n'
      +'body[data-task-view="overview"] .tpw2-quote:after{content:"";position:absolute;inset:0 0 0 44%;pointer-events:none;background:linear-gradient(90deg,#f0eee5 0%,rgba(240,238,229,.78) 38%,rgba(240,238,229,.34) 100%),url("/src/assets/task-heroes/cozy-home.webp") center 58%/cover no-repeat;opacity:.64}\n'
      +'body[data-task-view="overview"] .tpw2-quote-mark,body[data-task-view="overview"] .tpw2-quote-copy{position:relative;z-index:1}\n'
      +'body[data-task-view="overview"] .tpw2-quote-mark{width:27px;height:27px;display:grid;place-items:center;color:#456653}\n'
      +'body[data-task-view="overview"] .tpw2-quote-mark svg{width:23px;height:23px}\n'
      +'body[data-task-view="overview"] .tpw2-quote-copy strong{display:block;color:#2e3b34;font:700 12px/1.15 Georgia,"Times New Roman",serif;letter-spacing:-.01em}\n'
      +'body[data-task-view="overview"] .tpw2-quote-copy small{display:block;margin-top:3px;color:#717b75;font-size:8.5px;font-weight:550}\n'
      +'body[data-task-view="overview"] .tpw2-filters{gap:0!important;padding:3px!important;border:1px solid rgba(76,84,79,.08)!important;border-radius:12px!important;background:#ece8df!important;overflow:visible!important}\n'
      +'body[data-task-view="overview"] .tpw2-filter{flex:1 1 0!important;height:29px!important;padding:0 6px!important;border:0!important;border-radius:9px!important;background:transparent!important;color:#59645e!important;font-size:8.5px!important}\n'
      +'body[data-task-view="overview"] .tpw2-filter.active{background:#3f604b!important;color:#fff!important;box-shadow:0 2px 7px rgba(47,82,62,.12)!important}\n'
      +'body[data-task-view="overview"] .tch-group-head b{font-family:Georgia,"Times New Roman",serif!important;font-size:15.5px!important;font-weight:700!important}\n'
      +'body[data-task-view="overview"] .tpw2-task-row{min-height:64px!important;padding:7px 8px!important;grid-template-columns:21px 52px minmax(0,1fr) auto auto 10px!important;gap:6px!important;border-radius:13px!important}\n'
      +'body[data-task-view="overview"] .tpw2-task-row .tch-icon.tpw2-photo-thumb{width:52px!important;height:44px!important;min-width:52px!important;border:0!important;border-radius:9px!important;background-color:#ebe8e0!important;background-position:center!important;background-size:cover!important;background-repeat:no-repeat!important;box-shadow:inset 0 0 0 1px rgba(44,54,48,.06)!important}\n'
      +'body[data-task-view="overview"] .tpw2-task-row .tch-icon.tpw2-photo-thumb svg,body[data-task-view="overview"] .tpw2-task-row .tch-icon.tpw2-photo-thumb>span{display:none!important}\n'
      +'body[data-task-view="overview"] .tpw2-task-row .tch-name{font-size:11.5px!important}\n'
      +'body[data-task-view="overview"] .tpw2-task-row .tch-chevron{display:block!important;grid-column:6!important;color:#9ca39f!important;font-size:12px!important}\n'
      +'body[data-task-view="overview"] .tpw2-task-row .tch-reward{grid-column:5!important}\n'
      +'body[data-task-view="overview"] .tpw2-task-row .tch-avatars{grid-column:4!important}\n'
      +'body[data-task-view="overview"] .tch-group.tpw2-empty-group{display:none!important}\n'
      +'#tdp-overlay.tpw2-overlay .tpw2-detail-card .tdp-title{font-family:Georgia,"Times New Roman",serif!important;font-size:22px!important;font-weight:700!important;letter-spacing:-.02em!important}\n'
      +'#tdp-overlay.tpw2-overlay .tpw2-detail-card .tdp-progress-label,#tdp-overlay.tpw2-overlay .tpw2-detail-card .tpw2-supplies-head strong{font-family:Georgia,"Times New Roman",serif!important;font-size:12.5px!important;font-weight:700!important}\n'
      +'#tdp-overlay.tpw2-overlay .tpw2-detail-card .tdp-more-row{display:grid!important;grid-template-columns:1fr 1fr!important;gap:7px!important;margin:8px 0 0!important}\n'
      +'#tdp-overlay.tpw2-overlay .tpw2-detail-card .tdp-more-row .tdp-more{width:100%!important;min-height:38px!important;margin:0!important;padding:0 10px!important;border:1px solid rgba(62,75,68,.22)!important;border-radius:11px!important;background:rgba(255,255,255,.72)!important;color:#2c3932!important;font-size:9.5px!important;font-weight:650!important}\n'
      +'@media(max-width:390px){body[data-task-view="overview"] .tpw2-task-row{grid-template-columns:20px 46px minmax(0,1fr) auto auto 9px!important;gap:5px!important}body[data-task-view="overview"] .tpw2-task-row .tch-icon.tpw2-photo-thumb{width:46px!important;height:40px!important;min-width:46px!important}body[data-task-view="overview"] .tpw2-task-row .tch-avatars{display:none!important}}\n'
      +'[data-theme*="dark"] body[data-task-view="overview"] .tpw2-stat{background:#14231d!important;border-color:#304039!important}[data-theme*="dark"] body[data-task-view="overview"] .tpw2-stat--important{background:#1c241d!important}[data-theme*="dark"] body[data-task-view="overview"] .tpw2-stat--overdue{background:#281d1b!important}\n'
      +'[data-theme*="dark"] body[data-task-view="overview"] .tpw2-quote{background:#15231d!important;border-color:#304039!important}[data-theme*="dark"] body[data-task-view="overview"] .tpw2-quote:after{background:linear-gradient(90deg,#15231d 0%,rgba(21,35,29,.82) 44%,rgba(21,35,29,.34) 100%),url("/src/assets/task-heroes/cozy-home.webp") center 58%/cover no-repeat!important;opacity:.48}[data-theme*="dark"] body[data-task-view="overview"] .tpw2-quote-copy strong{color:#eef3f0!important}[data-theme*="dark"] body[data-task-view="overview"] .tpw2-quote-copy small{color:#aab5ae!important}\n';
    document.head.appendChild(style);
  }

  function overviewActive(){
    return !!(document.body&&document.body.getAttribute('data-task-view')==='overview');
  }
  function canonicalTasks(){return Array.isArray(window.taskData)?window.taskData:[];}
  function taskById(id){
    return canonicalTasks().find(function(task){return String(task&&task.id||'')===String(id||'');})||null;
  }
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
  function quoteHtml(){
    return '<section class="tpw2-quote" aria-label="FamilyApp gedachte">'
      +'<span class="tpw2-quote-mark">'+ICON.leaf+'</span>'
      +'<span class="tpw2-quote-copy"><strong>Kleine taken, een rustiger thuis</strong><small>Samen maken we tijd voor wat echt telt.</small></span>'
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
      var hasTasks=!!group.querySelector('.tch-row,.tch-party-card');
      group.classList.toggle('tpw2-empty-group',!hasTasks);
      var show=hasTasks&&(groupFilter==='all'||name===groupFilter);
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
  function taskHeroSource(task){
    if(!task)return'';
    try{
      if(window.TaskModel&&typeof TaskModel.getImage==='function'){
        var modelImage=TaskModel.getImage(task);
        if(modelImage)return String(modelImage);
      }
    }catch(e){}
    return String(task.heroImage||task.img||task.imageUrl||task.image||task.photo||task.cover||'');
  }
  function taskPhotoKey(task){
    var raw=String(task&&(task.category||task.type||task.title)||'').toLowerCase();
    if(/badkamer|bathroom|douche/.test(raw))return'bathroom';
    if(/toilet|wc/.test(raw))return'toilet';
    if(/kinderkamer|kids|speelgoed|kind|toy/.test(raw))return'kids';
    if(/woonkamer|living/.test(raw))return'living';
    if(/slaapkamer|bedroom/.test(raw))return'bedroom';
    if(/hal|entree|hall/.test(raw))return'hall';
    if(/was|laundry|vouw|kleding/.test(raw))return'laundry';
    if(/bood|supermarkt|grocer|market/.test(raw))return'groceries';
    if(/keuken|kitchen|koken|vaat/.test(raw))return'kitchen';
    if(/tuin|garden/.test(raw))return'garden';
    if(/buiten|outside/.test(raw))return'outside';
    if(/reis|travel|vakantie/.test(raw))return'travel';
    if(/schoon|clean|dweil|stof|poets/.test(raw))return'home';
    return'generic';
  }
  function taskPhotoSource(task){
    return taskHeroSource(task)||TASK_PHOTO[taskPhotoKey(task)]||TASK_PHOTO.generic;
  }
  function decorateRows(page){
    page.querySelectorAll('.tch-row').forEach(function(row){
      row.classList.add('tpw2-task-row');
      var reward=row.querySelector('.tch-reward');
      if(reward&&!reward.getAttribute('aria-label'))reward.setAttribute('aria-label','Taakbeloning');
      var name=row.querySelector('.tch-name');
      if(name)name.setAttribute('title',name.textContent.trim());

      var task=taskById(row.getAttribute('data-task-id'));
      var thumb=row.querySelector('.tch-icon');
      if(thumb&&task){
        var src=taskPhotoSource(task);
        thumb.classList.add('tpw2-photo-thumb');
        if(thumb.dataset.tpw2Photo!==src){
          thumb.dataset.tpw2Photo=src;
          thumb.style.backgroundImage='url("'+src.replace(/"/g,'%22')+'")';
          thumb.setAttribute('aria-hidden','true');
        }
      }
      row.querySelectorAll('.tch-meta span').forEach(function(meta){
        if(/\b(stap|stappen)\b/i.test(meta.textContent||''))meta.style.display='none';
      });
    });
  }
  function decorateOverview(){
    queued=false;
    if(!overviewActive())return;
    ensureFinishStyle();
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
    var quote=page.querySelector('.tpw2-quote');
    if(!quote){
      var currentStats=page.querySelector('.tpw2-stats');
      if(currentStats)currentStats.insertAdjacentHTML('afterend',quoteHtml());
    }
    var filters=page.querySelector('.tpw2-filters');
    if(!filters){
      var currentQuote=page.querySelector('.tpw2-quote');
      if(currentQuote)currentQuote.insertAdjacentHTML('afterend',filterHtml());
      else{
        var currentStats2=page.querySelector('.tpw2-stats');
        if(currentStats2)currentStats2.insertAdjacentHTML('afterend',filterHtml());
      }
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
  function cleaningLikeTask(task){
    var raw=String(task&&(task.category||task.type||task.title)||'').toLowerCase();
    return /schoon|clean|badkamer|toilet|dweil|stof|poets/.test(raw);
  }
  function applyDetailHero(card,task){
    if(!card||!task)return;
    var hero=card.querySelector('.tdp-hero');
    if(!hero)return;
    if(taskHeroSource(task)){
      hero.classList.remove('tpw2-fallback-photo');
      return;
    }
    var src=taskPhotoSource(task);
    if(!src)src=cleaningLikeTask(task)?TASK_HERO_CLEANING:TASK_HERO_DEFAULT;
    hero.classList.add('tpw2-fallback-photo');
    hero.style.backgroundImage='url("'+src.replace(/"/g,'%22')+'")';
    hero.style.backgroundPosition='center 56%';
  }
  function detailEnhancements(card){
    ensureFinishStyle();
    if(card.querySelector('.tdp-title-input')){card.classList.add('tpw2-create-card');return;}
    card.classList.add('tpw2-detail-card');
    var task=findTaskForDetail(card);
    applyDetailHero(card,task);
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
    var postpone=card.querySelector('#tdp-postpone-btn');
    if(postpone){postpone.textContent='Uitstellen';postpone.classList.add('tpw2-postpone-action');}
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
    ensureFinishStyle();
    observeOverview();
    observePopup();
    ['familyapp:tasks-updated','familyapp:household-identity-synced','familyapp:session-state'].forEach(function(name){window.addEventListener(name,queueOverview);});
    document.addEventListener('click',function(e){
      if(e.target&&e.target.closest&&e.target.closest('#screen-tasks .ttab'))setTimeout(queueOverview,0);
    });
  }

  window.TasksPremiumWarmV2={version:'2.3.0',decorateOverview:decorateOverview,decoratePopup:decoratePopup,summary:summary};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();