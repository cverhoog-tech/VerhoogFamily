'use strict';
// FamilyApp feedback round 2: presentation/performance adapters only.
// CleaningHouseholdRepository remains the only Cleaning writer and CleaningOccurrence stays canonical.
(function(){
  if(window.__familyAppFeedbackRound2)return;
  window.__familyAppFeedbackRound2=true;

  var state={
    queued:false,observer:null,turn:null,pendingSupply:null,roomCreateInFlight:false,
    themeWrapped:false,screenWrapped:false,screenWrapTimer:null,prewarmScheduled:false
  };
  var ROOM_LABELS={
    'living-room':'Woonkamer',kitchen:'Keuken',bathroom:'Badkamer',bedroom:'Slaapkamer',
    'kids-room':'Kinderkamer',toilet:'Toilet',hall:'Hal',laundry:'Wasruimte',outdoor:'Balkon / tuin',custom:'Kamer'
  };

  function text(value){return String(value==null?'':value).trim();}
  function escapeHtml(value){return String(value==null?'':value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}
  function rootData(){try{var repo=window.CleaningHouseholdRepository,snap=repo&&repo.snapshot?repo.snapshot():null;return snap&&snap.data||{};}catch(error){return{};}}
  function roomsMap(root){return root&&root.rooms&&typeof root.rooms==='object'?root.rooms:{};}
  function occurrencesMap(root){return root&&root.occurrences&&typeof root.occurrences==='object'?root.occurrences:{};}
  function occurrenceAnchor(row){
    if(!row)return Number.MAX_SAFE_INTEGER;
    if(text(row.scheduledDate)){
      var parts=text(row.scheduledDate).split('-').map(Number);
      if(parts.length===3){var local=new Date(parts[0],parts[1]-1,parts[2],0,0,0,0).getTime();if(Number.isFinite(local))return local;}
    }
    return Number(row.scheduledStartAt)||Number(row.slotAt)||Number(row.flexibleWindow&&row.flexibleWindow.startAt)||Number(row.earliestDueAt)||Number.MAX_SAFE_INTEGER;
  }
  function activeOccurrenceForRoom(root,roomId){
    var rows=occurrencesMap(root),best=null,bestAt=Number.MAX_SAFE_INTEGER;
    Object.keys(rows).forEach(function(id){
      var row=rows[id];if(!row||text(row.roomId)!==text(roomId))return;
      var status=text(row.status).toUpperCase(),assignment=text(row.assignmentStatus).toUpperCase();
      if(status==='CANCELLED'||status==='SKIPPED'||status==='COMPLETED'||assignment==='COMPLETED'||assignment==='SKIPPED')return;
      var at=occurrenceAnchor(row);if(at<bestAt){best=Object.assign({id:id},row);bestAt=at;}
    });
    return best;
  }
  function roomRecord(root,roomId){var row=roomsMap(root)[roomId];return row?Object.assign({id:roomId},row):null;}
  function roomLabel(room){return text(room&&room.name)||ROOM_LABELS[text(room&&room.type)]||'Kamer';}
  function roomType(room){var type=text(room&&room.type);return type&&type!=='custom'?type:'';}
  function taskRows(){return Array.isArray(window.taskData)?window.taskData:[];}
  function taskForOccurrence(occurrence){
    if(!occurrence)return null;var id=text(occurrence.id);
    return taskRows().find(function(task){
      if(!task)return false;
      if(text(task.cleaningOccurrenceId)===id||text(task.sourceId)===id)return true;
      return Array.isArray(task.cleaningOccurrenceIds)&&task.cleaningOccurrenceIds.some(function(value){return text(value)===id;});
    })||null;
  }
  function occurrenceParts(occurrence){
    var checklist=Array.isArray(occurrence&&occurrence.checklist)?occurrence.checklist:[];
    var ids=Array.isArray(occurrence&&occurrence.routineItemIds)?occurrence.routineItemIds:[];
    return checklist.length||ids.length||0;
  }
  function occurrenceMinutes(occurrence){return Math.max(0,Math.round(Number(occurrence&&occurrence.estimatedMinutes)||0));}
  function occurrenceWhen(occurrence){
    if(!occurrence)return'';
    var date=text(occurrence.scheduledDate),time=text(occurrence.scheduledTime||occurrence.time);
    if(date){
      var p=date.split('-').map(Number),d=p.length===3?new Date(p[0],p[1]-1,p[2]):null;
      var label=d&&Number.isFinite(d.getTime())?d.toLocaleDateString('nl-NL',{weekday:'short',day:'numeric',month:'short'}):date;
      return label+(time?' · '+time:'');
    }
    var stamp=Number(occurrence.scheduledStartAt)||Number(occurrence.slotAt)||0;
    if(stamp){var when=new Date(stamp);return when.toLocaleDateString('nl-NL',{weekday:'short',day:'numeric',month:'short'})+' · '+when.toLocaleTimeString('nl-NL',{hour:'2-digit',minute:'2-digit'});}
    return 'Gepland';
  }

  function openTurnDetail(primary){
    var card=primary&&primary.closest&&primary.closest('.cleaning-room-card');
    var roomId=text(primary&&primary.getAttribute('data-cleaning-room-primary-action'))||text(card&&card.getAttribute('data-cleaning-room-id'));
    if(!card||!roomId||!window.TaskDetailPopup||typeof window.TaskDetailPopup.open!=='function')return false;
    var root=rootData(),occurrence=activeOccurrenceForRoom(root,roomId),room=roomRecord(root,roomId),task=taskForOccurrence(occurrence);
    if(!occurrence||!room||!task||!task.id)return false;
    state.turn={roomId:roomId,room:room,occurrence:occurrence,taskId:text(task.id),openedAt:Date.now()};
    window.TaskDetailPopup.open(task.id);
    queue();
    return true;
  }

  function turnHeroBadge(overlay){
    var hero=overlay.querySelector('.tdp-hero');if(!hero||hero.querySelector('[data-familyapp-turn-status]'))return;
    var badge=document.createElement('span');badge.className='familyapp-turn-status';badge.setAttribute('data-familyapp-turn-status','1');badge.textContent='GEPLAND';hero.appendChild(badge);
  }
  function decorateTurnDetail(){
    if(!state.turn)return;
    var overlay=document.getElementById('tdp-overlay');if(!overlay||!overlay.classList.contains('open'))return;
    var task=taskRows().find(function(row){return row&&text(row.id)===state.turn.taskId;});if(!task)return;
    var room=state.turn.room,occurrence=state.turn.occurrence,type=roomType(room);
    overlay.classList.add('familyapp-cleaning-turn');
    if(type)overlay.setAttribute('data-cleaning-room-visual',type);else overlay.removeAttribute('data-cleaning-room-visual');
    turnHeroBadge(overlay);
    var body=overlay.querySelector('.tdp-body'),person=body&&body.querySelector('.tdp-person');if(!body)return;
    var title=body.querySelector('.tdp-title');if(title)title.textContent=roomLabel(room)+' schoonmaken';
    var context=body.querySelector('[data-familyapp-turn-context]');
    if(!context){
      context=document.createElement('div');context.className='familyapp-turn-context';context.setAttribute('data-familyapp-turn-context','1');
      if(person)body.insertBefore(context,person);else body.insertBefore(context,body.firstChild);
    }
    var count=occurrenceParts(occurrence),minutes=occurrenceMinutes(occurrence);
    context.innerHTML='<div class="familyapp-turn-when"><span aria-hidden="true">▣</span><strong>'+escapeHtml(occurrenceWhen(occurrence))+'</strong></div>'+
      '<div class="familyapp-turn-meta">'+count+' '+(count===1?'onderdeel':'onderdelen')+' <span>•</span> ± '+minutes+' min</div>';

    var footer=body.querySelector('.tdp-footer');
    var start=body.querySelector('[data-familyapp-turn-start]');
    if(!start){
      start=document.createElement('button');start.type='button';start.className='familyapp-turn-start';start.setAttribute('data-familyapp-turn-start','1');
      if(footer)body.insertBefore(start,footer);else body.appendChild(start);
    }
    var undone=overlay.querySelector('.tdp-sub-chk:not(.done)');
    start.innerHTML='<span aria-hidden="true">✦</span> '+(overlay.querySelector('.tdp-sub-chk.done')?'Ga verder met schoonmaken':'Start schoonmaken');
    start.onclick=function(event){
      event.preventDefault();event.stopPropagation();
      var target=overlay.querySelector('.tdp-sub-chk:not(.done)')||overlay.querySelector('.tdp-box');
      if(target&&target.scrollIntoView)target.scrollIntoView({behavior:'smooth',block:'center'});
      if(target&&target.focus)window.setTimeout(function(){try{target.focus({preventScroll:true});}catch(error){try{target.focus();}catch(ignore){}}},260);
    };
    if(!undone&&overlay.querySelector('.tdp-sub-chk'))start.textContent='✓ Alle onderdelen klaar';

    var supplies=body.querySelector('[data-familyapp-turn-supplies]');
    if(!supplies){
      supplies=document.createElement('button');supplies.type='button';supplies.className='familyapp-turn-supplies';supplies.setAttribute('data-familyapp-turn-supplies','1');supplies.innerHTML='<span aria-hidden="true">▣</span> Benodigdheden';body.appendChild(supplies);
    }
  }

  function supplyStateForRow(row){
    if(!row)return'IN_STOCK';var active=row.querySelector('.cleaning-supply-status.is-active');return text(active&&active.getAttribute('data-cleaning-supply-status')).toUpperCase()||'IN_STOCK';
  }
  function decorateSupplyOverlay(){
    var overlay=document.getElementById('cleaning-supplies-overlay');if(!overlay)return;
    var roomId=text(state.pendingSupply&&state.pendingSupply.roomId),root=rootData(),room=roomId?roomRecord(root,roomId):null;
    if(room&&roomType(room))overlay.setAttribute('data-cleaning-room-visual',roomType(room));
    var rows=overlay.querySelectorAll('.cleaning-supply-row'),low=0,out=0;
    for(var i=0;i<rows.length;i++){
      var status=supplyStateForRow(rows[i]);rows[i].setAttribute('data-familyapp-supply-state',status);if(status==='LOW')low++;if(status==='OUT')out++;
    }
    var sheet=overlay.querySelector('.cleaning-supply-sheet'),footer=sheet&&sheet.querySelector('.cleaning-supply-footer');if(!sheet||!footer)return;
    var summary=sheet.querySelector('[data-familyapp-supply-summary]');
    if(!summary){summary=document.createElement('section');summary.className='familyapp-supply-summary';summary.setAttribute('data-familyapp-supply-summary','1');footer.parentNode.insertBefore(summary,footer);}
    summary.innerHTML='<span>Kamer voorraad status</span><strong>'+(low?'<em>'+low+' bijna op</em>':'')+(low&&out?' <b>•</b> ':'')+(out?'<i>'+out+' ontbreekt</i>':(!low?'Alles aanwezig':''))+'</strong>';
    var prompt=sheet.querySelector('[data-familyapp-supply-prompt]');
    if(!prompt){
      prompt=document.createElement('section');prompt.className='familyapp-supply-prompt';prompt.setAttribute('data-familyapp-supply-prompt','1');
      prompt.innerHTML='<div><strong>Ontbreekt iets?</strong><span>Voeg gemarkeerde items direct toe aan Boodschappen</span></div><button type="button" data-familyapp-supply-prompt-button aria-label="Naar boodschappen">＋</button>';
      footer.parentNode.insertBefore(prompt,summary);
    }
    var attention=low+out,promptButton=prompt.querySelector('[data-familyapp-supply-prompt-button]');
    if(promptButton){promptButton.disabled=!attention;promptButton.setAttribute('aria-disabled',attention?'false':'true');promptButton.onclick=function(event){event.preventDefault();var shopping=overlay.querySelector('[data-cleaning-supply-shopping]');if(shopping&&!shopping.disabled)shopping.click();};}
    var actions=sheet.querySelector('[data-familyapp-supply-actions]');
    if(!actions){
      actions=document.createElement('div');actions.className='familyapp-supply-actions';actions.setAttribute('data-familyapp-supply-actions','1');
      actions.innerHTML='<button type="button" data-familyapp-supply-all>Bekijk alle kameritems</button><button type="button" data-familyapp-supply-shopping>Boodschappen <span>0</span></button>';
      footer.appendChild(actions);
    }
    var all=actions.querySelector('[data-familyapp-supply-all]'),shoppingButton=actions.querySelector('[data-familyapp-supply-shopping]');
    if(all)all.onclick=function(event){event.preventDefault();var tab=overlay.querySelector('[data-cleaning-supply-mode="all"]');if(tab)tab.click();};
    if(shoppingButton){var countEl=shoppingButton.querySelector('span');if(countEl)countEl.textContent=String(attention);shoppingButton.disabled=!attention;shoppingButton.onclick=function(event){event.preventDefault();var nativeButton=overlay.querySelector('.cleaning-supply-footer > [data-cleaning-supply-shopping]');if(nativeButton&&!nativeButton.disabled)nativeButton.click();};}
  }

  function iconForRoutine(title){
    var raw=text(title).toLocaleLowerCase('nl-NL');
    if(/speel|kind/.test(raw))return'🧸';if(/dweil|vloer|veeg|stofzuig/.test(raw))return'🧹';if(/toilet|wc/.test(raw))return'🚽';if(/bad|douche|kraan|wastafel/.test(raw))return'🫧';if(/was|kleding/.test(raw))return'🧺';if(/glas|spiegel|raam/.test(raw))return'✨';if(/keuken|aanrecht|oven/.test(raw))return'🧽';return'✓';
  }
  function decoratePlannedCard(card){
    if(!card||card.querySelector('[data-familyapp-planned-summary]'))return;
    card.classList.add('familyapp-planned-card');
    var items=card.querySelector('.cleaning-planned-room-items'),rows=items?items.querySelectorAll('.cleaning-planned-room-item'):[];
    var minutes=0,titles=[],next='';
    for(var i=0;i<rows.length;i++){
      var strong=rows[i].querySelector('strong'),small=rows[i].querySelector('small'),date=rows[i].querySelector(':scope > span');
      var title=text(strong&&strong.textContent);if(title)titles.push(title);
      var match=text(small&&small.textContent).match(/(\d+)\s*min/i);if(match)minutes+=Number(match[1])||0;
      if(!next&&date)next=text(date.textContent);
    }
    var summary=document.createElement('div');summary.className='familyapp-planned-summary';summary.setAttribute('data-familyapp-planned-summary','1');
    var icons=(titles.length?titles:['Routine']).slice(0,5).map(function(title){return '<span class="familyapp-planned-icon" title="'+escapeHtml(title)+'">'+iconForRoutine(title)+'</span>';}).join('');
    summary.innerHTML='<div class="familyapp-planned-summary-main"><div class="familyapp-planned-icons">'+icons+'</div><span class="familyapp-planned-meta">'+rows.length+' '+(rows.length===1?'routine':'routines')+' · ± '+minutes+' min'+(next?' · '+escapeHtml(next):'')+'</span></div><button type="button" class="familyapp-planned-toggle" data-familyapp-planned-toggle aria-expanded="false" aria-label="Toon routines"><span>⌄</span></button>';
    if(items)card.insertBefore(summary,items);else card.appendChild(summary);
  }
  function decoratePlannedCards(){var cards=document.querySelectorAll('#screen-cleaning .cleaning-planned-room-card');for(var i=0;i<cards.length;i++)decoratePlannedCard(cards[i]);}

  function overviewTone(value){
    var raw=text(value).toLocaleLowerCase('nl-NL');
    if(raw.indexOf('planningcheck')>=0||raw.indexOf('planning check')>=0)return'planning';
    if(raw.indexOf('weekvoorraad')>=0)return'supplies';
    if(raw.indexOf('aangevuld')>=0)return'restock';
    if(raw.indexOf('recente activiteit')>=0)return'activity';
    if(raw.indexOf('geschiedenis')>=0)return'history';
    if(raw.indexOf('snelle')>=0||raw.indexOf('quick')>=0)return'quick';
    return'';
  }
  function decorateOverviewTones(){
    var nodes=document.querySelectorAll('#screen-cleaning .cleaning-week-assist-card,#screen-cleaning .cleaning-overview-section,#screen-cleaning .cleaning-history-detail');
    for(var i=0;i<nodes.length;i++){var tone=overviewTone(nodes[i].textContent);if(tone&&nodes[i].getAttribute('data-familyapp-tone')!==tone)nodes[i].setAttribute('data-familyapp-tone',tone);}
  }

  function stableThemeAttr(themeId,dark){if(themeId==='nature')return dark?'dark':'';return themeId+(dark?'-dark':'');}
  function validTheme(themeId){try{return Array.isArray(window.THEMES)&&window.THEMES.some(function(theme){return theme&&theme.id===themeId;});}catch(error){return themeId==='nature';}}
  function applyCachedThemeAttr(){
    try{
      var cached=localStorage.getItem('familie_theme_id'),dark=localStorage.getItem('familie_theme_dark')==='1';
      var theme=validTheme(cached)?cached:(validTheme(window.currentTheme)?window.currentTheme:'nature');
      if(theme){window.currentTheme=theme;window.isDark=dark;document.documentElement.setAttribute('data-theme',stableThemeAttr(theme,dark));}
    }catch(error){}
  }
  function installThemeGuard(){
    if(state.themeWrapped||typeof window.applyTheme!=='function')return;var raw=window.applyTheme;if(raw.__familyappFeedbackRound2)return;
    window.applyTheme=function(themeId,dark){
      var next=validTheme(themeId)?themeId:'nature',nextDark=!!dark,expected=stableThemeAttr(next,nextDark);
      try{localStorage.setItem('familie_theme_id',next);}catch(error){}
      if(window.currentTheme===next&&!!window.isDark===nextDark&&document.documentElement.getAttribute('data-theme')===expected){if(typeof window.updateDarkToggleUI==='function')window.updateDarkToggleUI();return;}
      return raw.apply(this,arguments);
    };
    window.applyTheme.__familyappFeedbackRound2=true;state.themeWrapped=true;applyCachedThemeAttr();
  }
  function installShowScreenGuard(){
    if(state.screenWrapped||typeof window.showScreen!=='function')return false;var raw=window.showScreen;if(raw.__familyappFeedbackRound2){state.screenWrapped=true;return true;}
    window.showScreen=function(id){
      var target=text(id),screen=target&&document.getElementById('screen-'+target),login=document.getElementById('login-screen');
      if(target==='home'&&window._currentScreen==='home'&&screen&&screen.classList.contains('active')&&window._appStarted&&(!login||login.style.display==='none')){if(typeof window.renderNav==='function')window.renderNav();return;}
      return raw.apply(this,arguments);
    };
    window.showScreen.__familyappFeedbackRound2=true;state.screenWrapped=true;return true;
  }

  function prewarmCleaning(){
    if(state.prewarmScheduled)return;state.prewarmScheduled=true;
    function add(rel,href,as){if(document.querySelector('link[data-familyapp-prewarm="'+href+'"]'))return;var link=document.createElement('link');link.rel=rel;link.href=href;link.setAttribute('data-familyapp-prewarm',href);if(as)link.as=as;document.head.appendChild(link);}
    add('preload','/src/styles/cleaning.css?v=1','style');
    add('modulepreload','/src/modules/cleaning/cleaningScreen.js?v=1');
    add('modulepreload','/src/modules/cleaning/cleaningPremiumFeedback.js?v=2');
  }
  function schedulePrewarm(){var run=function(){if(window.requestIdleCallback)window.requestIdleCallback(prewarmCleaning,{timeout:1400});else window.setTimeout(prewarmCleaning,450);};if(document.readyState==='complete')run();else window.addEventListener('load',run,{once:true});}
  function ensureCleaningLoadingShell(){
    var screen=document.getElementById('screen-cleaning'),content=document.getElementById('cleaning-content');
    if(!screen||!screen.classList.contains('active')||!content||content.children.length)return;
    content.innerHTML='<div class="familyapp-cleaning-loading-shell" aria-live="polite"><div class="familyapp-loading-head"><span></span><span></span></div><div class="familyapp-loading-hero"></div><div class="familyapp-loading-tabs"></div><div class="familyapp-loading-cards"><i></i><i></i><i></i></div><p>Schoonmaken wordt klaargezet…</p></div>';
  }

  function handleRoomCreate(event){
    var form=event.target&&event.target.closest?event.target.closest('#screen-cleaning [data-cleaning-room-form]'):null;if(!form||state.roomCreateInFlight)return false;
    var submit=form.querySelector('[type="submit"]'),label=text(submit&&submit.textContent);if(!/kamer toevoegen|maak kamer|kamer maken/i.test(label))return false;
    var nameInput=form.querySelector('[data-cleaning-room-name]'),typeInput=form.querySelector('[data-cleaning-room-type]'),name=text(nameInput&&nameInput.value),type=text(typeInput&&typeInput.value)||'custom';
    var repo=window.CleaningHouseholdRepository;if(!name||!repo||typeof repo.createRoom!=='function')return false;
    event.preventDefault();event.stopImmediatePropagation();state.roomCreateInFlight=true;form.classList.add('is-familyapp-submitting');
    if(submit){submit.disabled=true;submit.setAttribute('aria-busy','true');submit.textContent='Kamer maken…';}
    var note=form.querySelector('[data-familyapp-room-create-status]');if(!note){note=document.createElement('div');note.className='familyapp-room-create-status';note.setAttribute('data-familyapp-room-create-status','1');note.textContent='Kamer wordt toegevoegd zonder het scherm te blokkeren…';if(submit&&submit.parentNode)submit.parentNode.insertBefore(note,submit);}
    window.requestAnimationFrame(function(){
      Promise.resolve().then(function(){return repo.createRoom({name:name,type:type});}).then(function(){
        state.roomCreateInFlight=false;var current=document.querySelector('#screen-cleaning [data-cleaning-room-form]'),cancel=current&&current.querySelector('[data-cleaning-room-cancel]');if(cancel)cancel.click();if(typeof window.showToast==='function')window.showToast(name+' toegevoegd ✓');queue();
      }).catch(function(error){
        state.roomCreateInFlight=false;var current=document.querySelector('#screen-cleaning [data-cleaning-room-form]')||form,currentSubmit=current.querySelector('[type="submit"]');current.classList.remove('is-familyapp-submitting');if(currentSubmit){currentSubmit.disabled=false;currentSubmit.removeAttribute('aria-busy');currentSubmit.textContent='Kamer toevoegen';}var currentNote=current.querySelector('[data-familyapp-room-create-status]');if(currentNote)currentNote.textContent='Opslaan lukte niet. Probeer opnieuw.';if(typeof window.showToast==='function')window.showToast((error&&error.message)||'Kamer kon niet worden toegevoegd');
      });
    });
    return true;
  }

  function onClickCapture(event){
    var target=event.target,closest=target&&target.closest?target.closest.bind(target):null;if(!closest)return;
    var primary=closest('[data-cleaning-room-primary-action]');if(primary&&openTurnDetail(primary)){event.preventDefault();event.stopImmediatePropagation();return;}
    var toggle=closest('[data-familyapp-planned-toggle]');if(toggle){event.preventDefault();event.stopPropagation();var card=toggle.closest('.cleaning-planned-room-card');if(card){var expanded=card.classList.toggle('is-familyapp-expanded');toggle.setAttribute('aria-expanded',expanded?'true':'false');toggle.setAttribute('aria-label',expanded?'Verberg routines':'Toon routines');}return;}
    var roomSupply=closest('[data-cleaning-room-supplies]');if(roomSupply){var roomId=text(roomSupply.getAttribute('data-cleaning-room-supplies')),room=roomRecord(rootData(),roomId);state.pendingSupply={roomId:roomId,type:roomType(room)};window.setTimeout(decorateSupplyOverlay,0);return;}
    if(closest('[data-familyapp-turn-supplies]')&&state.turn){event.preventDefault();event.stopImmediatePropagation();var info={roomId:state.turn.roomId,type:roomType(state.turn.room)};state.pendingSupply=info;if(window.TaskDetailPopup&&typeof window.TaskDetailPopup.close==='function')window.TaskDetailPopup.close();window.setTimeout(function(){if(window.CleaningSupplyExperience&&typeof window.CleaningSupplyExperience.openRoom==='function'){window.CleaningSupplyExperience.openRoom(info.roomId);window.setTimeout(decorateSupplyOverlay,0);}},180);return;}
    if(closest('#tdp-close-btn')||target&&target.id==='tdp-overlay'){window.setTimeout(function(){if(!document.getElementById('tdp-overlay'))state.turn=null;},280);}
  }
  function onSubmitCapture(event){handleRoomCreate(event);}

  function decorateAll(){
    state.queued=false;installThemeGuard();installShowScreenGuard();ensureCleaningLoadingShell();decoratePlannedCards();decorateOverviewTones();decorateTurnDetail();decorateSupplyOverlay();
  }
  function queue(){if(state.queued)return;state.queued=true;(window.requestAnimationFrame||function(callback){return window.setTimeout(callback,0);})(decorateAll);}
  function observe(){
    if(typeof MutationObserver==='undefined'||state.observer)return;state.observer=new MutationObserver(queue);state.observer.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class','data-theme']});
  }
  function start(){
    applyCachedThemeAttr();installThemeGuard();schedulePrewarm();document.addEventListener('click',onClickCapture,true);document.addEventListener('submit',onSubmitCapture,true);
    window.addEventListener('pageshow',function(){applyCachedThemeAttr();queue();});document.addEventListener('visibilitychange',function(){if(document.visibilityState==='visible'){applyCachedThemeAttr();queue();}});
    state.screenWrapTimer=window.setInterval(function(){if(installShowScreenGuard()&&state.screenWrapTimer){window.clearInterval(state.screenWrapTimer);state.screenWrapTimer=null;}},50);window.setTimeout(function(){if(state.screenWrapTimer){window.clearInterval(state.screenWrapTimer);state.screenWrapTimer=null;}},10000);
    observe();queue();
  }
  start();
})();
