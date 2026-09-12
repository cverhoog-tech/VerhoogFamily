'use strict';
// FamilyApp Tasks Premium Warm v2.3 finishing pass.
// Presentation only: keeps canonical task data, handlers and persistence untouched.
(function(){
  if(window.__tasksPremiumWarmV2Finish)return;
  window.__tasksPremiumWarmV2Finish=true;

  var queued=false;
  var overviewObserver=null;
  var popupObserver=null;
  var PHOTO={
    bathroom:'/src/assets/cleaning-rooms/bathroom-light.webp',
    bedroom:'/src/assets/cleaning-rooms/bedroom-light.webp',
    hall:'/src/assets/cleaning-rooms/hall-light.webp',
    kids:'/src/assets/cleaning-rooms/kids-room-light.webp',
    kitchen:'/src/assets/cleaning-rooms/kitchen-light.webp',
    laundry:'/src/assets/cleaning-rooms/laundry-light.webp',
    living:'/src/assets/cleaning-rooms/living-room-light.webp',
    toilet:'/src/assets/cleaning-rooms/toilet-light.webp',
    outside:'/src/assets/cleaning-rooms/outside-light.webp',
    groceries:'/src/assets/task-heroes/market.webp',
    garden:'/src/assets/task-heroes/garden.webp',
    travel:'/src/assets/task-heroes/travel.webp',
    home:'/src/assets/task-heroes/cozy-home.webp',
    generic:'/src/assets/task-heroes/cozy-home.webp'
  };

  function tasks(){return Array.isArray(window.taskData)?window.taskData:[];}
  function byId(id){return tasks().find(function(t){return String(t&&t.id||'')===String(id||'');})||null;}
  function ownImage(task){
    if(!task)return'';
    try{if(window.TaskModel&&typeof TaskModel.getImage==='function'){var v=TaskModel.getImage(task);if(v)return String(v);}}catch(e){}
    return String(task.heroImage||task.img||task.imageUrl||task.image||task.photo||task.cover||'');
  }
  function key(task){
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
    if(/tuin|garden|buiten|outside/.test(raw))return'garden';
    if(/reis|travel|vakantie/.test(raw))return'travel';
    if(/schoon|clean|dweil|stof|poets/.test(raw))return'home';
    return'generic';
  }
  function photo(task){return ownImage(task)||PHOTO[key(task)]||PHOTO.generic;}
  function leaf(){return '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19.5 4.5C11 4.8 6.1 8.7 6.1 15.1c4.9.6 10.4-2.4 13.4-10.6Z"/><path d="M5 20c2.1-4.8 5.4-8 10.8-10.4"/></svg>';}

  function style(){
    if(document.getElementById('tasks-premium-warm-v23-finish'))return;
    var s=document.createElement('style');
    s.id='tasks-premium-warm-v23-finish';
    s.textContent='\n'
      +'body[data-task-view="overview"] .tpw2-head h1{font-family:Georgia,"Times New Roman",serif!important;font-size:31px!important;font-weight:700!important;letter-spacing:-.025em!important}\n'
      +'body[data-task-view="overview"] .tpw2-stats{gap:7px!important;border:0!important;border-radius:0!important;overflow:visible!important;background:transparent!important}\n'
      +'body[data-task-view="overview"] .tpw2-stat{min-height:67px!important;padding:10px 11px!important;border:1px solid rgba(82,88,82,.10)!important;border-radius:13px!important;background:#fbfcf8!important;box-shadow:0 4px 14px rgba(43,52,47,.035)!important}\n'
      +'body[data-task-view="overview"] .tpw2-stat--important{background:#fbf7ee!important}body[data-task-view="overview"] .tpw2-stat--overdue{background:#fbf1ef!important}\n'
      +'body[data-task-view="overview"] .tpw2-quote{position:relative;display:grid;grid-template-columns:27px minmax(0,1fr);align-items:center;gap:9px;min-height:58px;margin:0 0 11px;padding:10px 13px;overflow:hidden;border:1px solid rgba(70,78,73,.10);border-radius:13px;background:#f0eee5}\n'
      +'body[data-task-view="overview"] .tpw2-quote:after{content:"";position:absolute;inset:0 0 0 44%;pointer-events:none;background:linear-gradient(90deg,#f0eee5 0%,rgba(240,238,229,.78) 38%,rgba(240,238,229,.34) 100%),url("/src/assets/task-heroes/cozy-home.webp") center 58%/cover no-repeat;opacity:.64}\n'
      +'body[data-task-view="overview"] .tpw2-quote-mark,body[data-task-view="overview"] .tpw2-quote-copy{position:relative;z-index:1}body[data-task-view="overview"] .tpw2-quote-mark{width:27px;height:27px;display:grid;place-items:center;color:#456653}\n'
      +'body[data-task-view="overview"] .tpw2-quote-copy strong{display:block;color:#2e3b34;font:700 12px/1.15 Georgia,"Times New Roman",serif}body[data-task-view="overview"] .tpw2-quote-copy small{display:block;margin-top:3px;color:#717b75;font-size:8.5px;font-weight:550}\n'
      +'body[data-task-view="overview"] .tpw2-filters{gap:0!important;padding:3px!important;border:1px solid rgba(76,84,79,.08)!important;border-radius:12px!important;background:#ece8df!important;overflow:visible!important}\n'
      +'body[data-task-view="overview"] .tpw2-filter{flex:1 1 0!important;height:29px!important;padding:0 6px!important;border:0!important;border-radius:9px!important;background:transparent!important;color:#59645e!important;font-size:8.5px!important}body[data-task-view="overview"] .tpw2-filter.active{background:#3f604b!important;color:#fff!important;box-shadow:0 2px 7px rgba(47,82,62,.12)!important}\n'
      +'body[data-task-view="overview"] .tch-group-head b{font-family:Georgia,"Times New Roman",serif!important;font-size:15.5px!important;font-weight:700!important}\n'
      +'body[data-task-view="overview"] .tpw2-task-row{min-height:64px!important;padding:7px 8px!important;grid-template-columns:21px 52px minmax(0,1fr) auto auto 10px!important;gap:6px!important;border-radius:13px!important}\n'
      +'body[data-task-view="overview"] .tpw2-task-row .tch-icon.tpw2-photo-thumb{width:52px!important;height:44px!important;min-width:52px!important;border:0!important;border-radius:9px!important;background-color:#ebe8e0!important;background-position:center!important;background-size:cover!important;background-repeat:no-repeat!important;box-shadow:inset 0 0 0 1px rgba(44,54,48,.06)!important}\n'
      +'body[data-task-view="overview"] .tpw2-task-row .tch-icon.tpw2-photo-thumb svg,body[data-task-view="overview"] .tpw2-task-row .tch-icon.tpw2-photo-thumb>span{display:none!important}\n'
      +'body[data-task-view="overview"] .tpw2-task-row .tch-chevron{display:block!important;grid-column:6!important;color:#9ca39f!important;font-size:12px!important}body[data-task-view="overview"] .tch-group.tpw2-empty-group{display:none!important}\n'
      +'#tdp-overlay.tpw2-overlay .tpw2-detail-card .tdp-title{font-family:Georgia,"Times New Roman",serif!important;font-size:22px!important;font-weight:700!important;letter-spacing:-.02em!important}\n'
      +'#tdp-overlay.tpw2-overlay .tpw2-detail-card .tdp-progress-label,#tdp-overlay.tpw2-overlay .tpw2-detail-card .tpw2-supplies-head strong{font-family:Georgia,"Times New Roman",serif!important;font-size:12.5px!important;font-weight:700!important}\n'
      +'#tdp-overlay.tpw2-overlay .tpw2-detail-card .tdp-more-row{display:grid!important;grid-template-columns:1fr 1fr!important;gap:7px!important;margin:8px 0 0!important}#tdp-overlay.tpw2-overlay .tpw2-detail-card .tdp-more-row .tdp-more{width:100%!important;min-height:38px!important;margin:0!important;padding:0 10px!important;border:1px solid rgba(62,75,68,.22)!important;border-radius:11px!important;background:rgba(255,255,255,.72)!important;color:#2c3932!important;font-size:9.5px!important;font-weight:650!important}\n'
      +'@media(max-width:390px){body[data-task-view="overview"] .tpw2-task-row{grid-template-columns:20px 46px minmax(0,1fr) auto auto 9px!important;gap:5px!important}body[data-task-view="overview"] .tpw2-task-row .tch-icon.tpw2-photo-thumb{width:46px!important;height:40px!important;min-width:46px!important}body[data-task-view="overview"] .tpw2-task-row .tch-avatars{display:none!important}}\n'
      +'[data-theme*="dark"] body[data-task-view="overview"] .tpw2-stat{background:#14231d!important;border-color:#304039!important}[data-theme*="dark"] body[data-task-view="overview"] .tpw2-quote{background:#15231d!important;border-color:#304039!important}[data-theme*="dark"] body[data-task-view="overview"] .tpw2-quote-copy strong{color:#eef3f0!important}[data-theme*="dark"] body[data-task-view="overview"] .tpw2-quote-copy small{color:#aab5ae!important}\n';
    document.head.appendChild(s);
  }

  function quote(page){
    if(page.querySelector('.tpw2-quote'))return;
    var stats=page.querySelector('.tpw2-stats');
    if(!stats)return;
    stats.insertAdjacentHTML('afterend','<section class="tpw2-quote" aria-label="FamilyApp gedachte"><span class="tpw2-quote-mark">'+leaf()+'</span><span class="tpw2-quote-copy"><strong>Kleine taken, een rustiger thuis</strong><small>Samen maken we tijd voor wat echt telt.</small></span></section>');
    var filters=page.querySelector('.tpw2-filters');
    var q=page.querySelector('.tpw2-quote');
    if(filters&&q&&q.nextElementSibling!==filters)q.insertAdjacentElement('afterend',filters);
  }

  function rows(page){
    page.querySelectorAll('.tch-row').forEach(function(row){
      var task=byId(row.getAttribute('data-task-id'));
      var icon=row.querySelector('.tch-icon');
      if(icon&&task){
        var src=photo(task);
        icon.classList.add('tpw2-photo-thumb');
        if(icon.dataset.tpw2Photo!==src){
          icon.dataset.tpw2Photo=src;
          icon.style.backgroundImage='url("'+src.replace(/"/g,'%22')+'")';
          icon.setAttribute('aria-hidden','true');
        }
      }
      row.querySelectorAll('.tch-meta span').forEach(function(meta){if(/\b(stap|stappen)\b/i.test(meta.textContent||''))meta.style.display='none';});
    });
  }

  function groups(page){
    page.querySelectorAll('.tch-group[data-life-group]').forEach(function(group){
      group.classList.toggle('tpw2-empty-group',!group.querySelector('.tch-row,.tch-party-card'));
    });
  }

  function overview(){
    queued=false;
    if(!document.body||document.body.getAttribute('data-task-view')!=='overview')return;
    style();
    var page=document.querySelector('#task-content .tch-page');
    if(!page)return;
    quote(page);
    rows(page);
    groups(page);
  }
  function queue(){if(queued)return;queued=true;(window.requestAnimationFrame||window.setTimeout)(overview);}

  function popup(){
    style();
    var card=document.querySelector('#tdp-overlay.tpw2-overlay .tdp-card.tpw2-detail-card');
    if(!card)return;
    var title=card.querySelector('.tdp-title');
    var task=title?tasks().find(function(t){return String(t&&t.title||'').trim()===title.textContent.trim();}):null;
    var hero=card.querySelector('.tdp-hero');
    if(hero&&task&&!ownImage(task)){
      hero.style.backgroundImage='url("'+photo(task).replace(/"/g,'%22')+'")';
      hero.style.backgroundPosition='center 56%';
    }
    var more=card.querySelector('#tdp-more-btn');if(more)more.textContent=more.textContent.indexOf('Minder')===0?'Bewerken sluiten':'Bewerken';
    var postpone=card.querySelector('#tdp-postpone-btn');if(postpone)postpone.textContent='Uitstellen';
    var cta=card.querySelector('#tdp-complete-btn');if(cta&&cta.classList.contains('active')&&!cta.classList.contains('done-state'))cta.textContent='Markeer als klaar';
  }

  function boot(){
    style();overview();popup();
    var content=document.getElementById('task-content');
    if(content&&typeof MutationObserver==='function'){overviewObserver=new MutationObserver(queue);overviewObserver.observe(content,{childList:true,subtree:true});}
    if(typeof MutationObserver==='function'){popupObserver=new MutationObserver(function(){requestAnimationFrame(popup);});popupObserver.observe(document.body,{childList:true,subtree:true});}
    ['familyapp:tasks-updated','familyapp:household-identity-synced','familyapp:session-state'].forEach(function(name){window.addEventListener(name,queue);});
  }

  window.TasksPremiumWarmV2Finish={version:'2.3.0',decorateOverview:overview,decoratePopup:popup};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
