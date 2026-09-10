'use strict';
// FamilyApp feedback round 2.
// Presentation/performance adapter only. Cleaning turn popup ownership lives in
// CleaningTurnExperience; this adapter no longer opens or decorates task popups.
(function(){
  if(window.__familyAppFeedbackRound2)return;
  window.__familyAppFeedbackRound2=true;

  var state={queued:false,supplyQueued:false,observers:[],pendingSupply:null,roomCreateInFlight:false,themeWrapped:false,prewarmStarted:false,perf:{supplyOpenFrameMs:null,decorateCalls:0,supplyDecorates:0,observerCallbacks:0}};
  var HERO={
    tasks:{url:'https://res.cloudinary.com/dcnhl3mti/image/upload/v1788732320/familyapp-home-tasks-hero-v2.webp',pos:'center 70%'},
    shop:{url:'https://res.cloudinary.com/dcnhl3mti/image/upload/v1788733572/familyapp-home-groceries-hero-v2.webp',pos:'center 63%'},
    cleaning:{url:'https://res.cloudinary.com/dcnhl3mti/image/upload/v1788733601/familyapp-home-cleaning-hero-v2.webp',pos:'center 61%'}
  };

  function text(value){return String(value==null?'':value).trim();}
  function esc(value){return String(value==null?'':value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}
  function raf(fn){return (window.requestAnimationFrame||function(callback){return window.setTimeout(callback,0);})(fn);}
  function rootData(){try{var repo=window.CleaningHouseholdRepository,snap=repo&&repo.snapshot?repo.snapshot():null;return snap&&snap.data||{};}catch(error){return{};}}
  function roomMap(root){return root&&root.rooms&&typeof root.rooms==='object'?root.rooms:{};}
  function room(root,id){var row=roomMap(root)[id];return row?Object.assign({id:id},row):null;}
  function roomType(row){var type=text(row&&row.type);return type&&type!=='custom'?type:'';}

  function supplyState(row){var active=row&&row.querySelector('.cleaning-supply-status.is-active');return text(active&&active.getAttribute('data-cleaning-supply-status')).toUpperCase()||'IN_STOCK';}
  function decorateSupply(){
    state.supplyQueued=false;state.perf.supplyDecorates++;
    var overlay=document.getElementById('cleaning-supplies-overlay');if(!overlay)return;
    var root=rootData(),roomId=text(state.pendingSupply&&state.pendingSupply.roomId),roomRow=roomId?room(root,roomId):null;if(roomRow&&roomType(roomRow))overlay.setAttribute('data-cleaning-room-visual',roomType(roomRow));
    var rows=overlay.querySelectorAll('.cleaning-supply-row'),low=0,out=0;for(var i=0;i<rows.length;i++){var status=supplyState(rows[i]);rows[i].setAttribute('data-familyapp-supply-state',status);if(status==='LOW')low++;if(status==='OUT')out++;}
    var sheet=overlay.querySelector('.cleaning-supply-sheet'),footer=sheet&&sheet.querySelector('.cleaning-supply-footer');if(!sheet||!footer)return;
    var summary=sheet.querySelector('[data-familyapp-supply-summary]');if(!summary){summary=document.createElement('section');summary.className='familyapp-supply-summary';summary.setAttribute('data-familyapp-supply-summary','1');footer.parentNode.insertBefore(summary,footer);}
    var summarySignature=low+'|'+out;if(summary.getAttribute('data-familyapp-signature')!==summarySignature){summary.setAttribute('data-familyapp-signature',summarySignature);summary.innerHTML='<span>Kamer voorraad status</span><strong>'+(low?'<em>'+low+' bijna op</em>':'')+(low&&out?' <b>•</b> ':'')+(out?'<i>'+out+' ontbreekt</i>':(!low?'Alles aanwezig':''))+'</strong>';}
    var prompt=sheet.querySelector('[data-familyapp-supply-prompt]');if(!prompt){prompt=document.createElement('section');prompt.className='familyapp-supply-prompt';prompt.setAttribute('data-familyapp-supply-prompt','1');prompt.innerHTML='<div><strong>Ontbreekt iets?</strong><span>Voeg gemarkeerde items direct toe aan Boodschappen</span></div><button type="button" data-familyapp-supply-prompt-button aria-label="Naar boodschappen">＋</button>';footer.parentNode.insertBefore(prompt,summary);}
    var attention=low+out,promptButton=prompt.querySelector('[data-familyapp-supply-prompt-button]');if(promptButton){promptButton.disabled=!attention;promptButton.onclick=function(event){event.preventDefault();var nativeButton=overlay.querySelector('.cleaning-supply-footer > [data-cleaning-supply-shopping]');if(nativeButton&&!nativeButton.disabled)nativeButton.click();};}
    var actions=sheet.querySelector('[data-familyapp-supply-actions]');if(!actions){actions=document.createElement('div');actions.className='familyapp-supply-actions';actions.setAttribute('data-familyapp-supply-actions','1');actions.innerHTML='<button type="button" data-familyapp-supply-all>Bekijk alle kameritems</button><button type="button" data-familyapp-supply-shopping>Boodschappen <span>0</span></button>';footer.appendChild(actions);}
    var all=actions.querySelector('[data-familyapp-supply-all]'),shopping=actions.querySelector('[data-familyapp-supply-shopping]');if(all)all.onclick=function(event){event.preventDefault();var tab=overlay.querySelector('[data-cleaning-supply-mode="all"]');if(tab)tab.click();};if(shopping){var count=shopping.querySelector('span');if(count&&count.textContent!==String(attention))count.textContent=String(attention);shopping.disabled=!attention;shopping.onclick=function(event){event.preventDefault();var nativeButton=overlay.querySelector('.cleaning-supply-footer > [data-cleaning-supply-shopping]');if(nativeButton&&!nativeButton.disabled)nativeButton.click();};}
  }

  function routineIcon(title){var raw=text(title).toLocaleLowerCase('nl-NL');if(/speel|kind/.test(raw))return'🧸';if(/dweil|vloer|veeg|stofzuig/.test(raw))return'🧹';if(/toilet|wc/.test(raw))return'🚽';if(/bad|douche|kraan|wastafel/.test(raw))return'🫧';if(/was|kleding/.test(raw))return'🧺';if(/glas|spiegel|raam/.test(raw))return'✨';if(/keuken|aanrecht|oven/.test(raw))return'🧽';return'✓';}
  function decoratePlannedCards(){
    var cards=document.querySelectorAll('#screen-cleaning .cleaning-planned-room-card');
    for(var c=0;c<cards.length;c++){
      var card=cards[c];if(card.querySelector('[data-familyapp-planned-summary]'))continue;card.classList.add('familyapp-planned-card');
      var items=card.querySelector('.cleaning-planned-room-items'),rows=items?items.querySelectorAll('.cleaning-planned-room-item'):[],minutes=0,titles=[],next='';
      for(var i=0;i<rows.length;i++){var strong=rows[i].querySelector('strong'),small=rows[i].querySelector('small'),date=rows[i].querySelector(':scope > span'),title=text(strong&&strong.textContent),match=text(small&&small.textContent).match(/(\d+)\s*min/i);if(title)titles.push(title);if(match)minutes+=Number(match[1])||0;if(!next&&date)next=text(date.textContent);}
      var summary=document.createElement('div');summary.className='familyapp-planned-summary';summary.setAttribute('data-familyapp-planned-summary','1');var icons=(titles.length?titles:['Routine']).slice(0,5).map(function(title){return'<span class="familyapp-planned-icon" title="'+esc(title)+'">'+routineIcon(title)+'</span>';}).join('');
      summary.innerHTML='<div class="familyapp-planned-summary-main"><div class="familyapp-planned-icons">'+icons+'</div><span class="familyapp-planned-meta">'+rows.length+' '+(rows.length===1?'routine':'routines')+' · ± '+minutes+' min'+(next?' · '+esc(next):'')+'</span></div><button type="button" class="familyapp-planned-toggle" data-familyapp-planned-toggle aria-expanded="false" aria-label="Toon routines"><span>⌄</span></button>';
      if(items)card.insertBefore(summary,items);else card.appendChild(summary);
    }
  }
  function overviewTone(value){var raw=text(value).toLocaleLowerCase('nl-NL');if(raw.indexOf('planningcheck')>=0||raw.indexOf('planning check')>=0)return'planning';if(raw.indexOf('weekvoorraad')>=0)return'supplies';if(raw.indexOf('aangevuld')>=0)return'restock';if(raw.indexOf('recente activiteit')>=0)return'activity';if(raw.indexOf('geschiedenis')>=0)return'history';if(raw.indexOf('snelle')>=0||raw.indexOf('quick')>=0)return'quick';return'';}
  function decorateOverview(){var nodes=document.querySelectorAll('#screen-cleaning .cleaning-week-assist-card,#screen-cleaning .cleaning-overview-section,#screen-cleaning .cleaning-history-detail');for(var i=0;i<nodes.length;i++){var tone=overviewTone(nodes[i].textContent);if(tone)nodes[i].setAttribute('data-familyapp-tone',tone);}}

  function heroBackground(url,dark){return 'linear-gradient(90deg,'+(dark?'rgba(6,11,17,.91) 0%,rgba(6,11,17,.76) 42%,rgba(6,11,17,.28) 73%,rgba(6,11,17,.10) 100%':'rgba(250,248,241,.90) 0%,rgba(250,248,241,.70) 42%,rgba(250,248,241,.24) 73%,rgba(250,248,241,.06) 100%')+'),url("'+url+'")';}
  function decorateHomeHeroes(){
    var dark=(document.documentElement.getAttribute('data-theme')||'').indexOf('dark')>=0,defs=[['.tasks-card',HERO.tasks],['.shop-card',HERO.shop],['.cleaning-card',HERO.cleaning]];
    defs.forEach(function(entry){var card=document.querySelector(entry[0]);if(!card)return;var nodes=[card,card.querySelector('.home-hero-inner')].filter(Boolean),bg=heroBackground(entry[1].url,dark);nodes.forEach(function(node){node.style.setProperty('background-image',bg,'important');node.style.setProperty('background-size','cover','important');node.style.setProperty('background-position',entry[1].pos,'important');node.style.setProperty('background-repeat','no-repeat','important');});});
  }
  function installThemeCache(){if(state.themeWrapped||typeof window.applyTheme!=='function')return;var raw=window.applyTheme;window.applyTheme=function(themeId,dark){try{if(themeId)localStorage.setItem('familie_theme_id',themeId);}catch(error){}var result=raw.apply(this,arguments);queue();return result;};state.themeWrapped=true;}

  function prewarmCleaning(){if(state.prewarmStarted)return;state.prewarmStarted=true;try{if(typeof window.ensureCleaningScreen==='function')window.ensureCleaningScreen();if(typeof window.renderCleaningModule==='function')window.renderCleaningModule();}catch(error){console.warn('[Cleaning] prewarm skipped',error);}}
  function schedulePrewarm(){var run=function(){if(window.requestIdleCallback)window.requestIdleCallback(prewarmCleaning,{timeout:1100});else window.setTimeout(prewarmCleaning,350);};if(document.readyState==='complete')run();else window.addEventListener('load',run,{once:true});}
  function ensureLoadingShell(){var screen=document.getElementById('screen-cleaning'),content=document.getElementById('cleaning-content');if(!screen||!screen.classList.contains('active')||!content||content.children.length)return;content.innerHTML='<div class="familyapp-cleaning-loading-shell" aria-live="polite"><div class="familyapp-loading-head"><span></span><span></span></div><div class="familyapp-loading-hero"></div><div class="familyapp-loading-tabs"></div><div class="familyapp-loading-cards"><i></i><i></i><i></i></div><p>Schoonmaken wordt klaargezet…</p></div>';}

  function interceptRoomCreate(event){
    var form=event.target&&event.target.closest?event.target.closest('#screen-cleaning [data-cleaning-room-form]'):null;if(!form||state.roomCreateInFlight)return false;
    var submit=form.querySelector('[type="submit"]'),label=text(submit&&submit.textContent);if(!/kamer toevoegen|maak kamer|kamer maken/i.test(label))return false;
    var nameInput=form.querySelector('[data-cleaning-room-name]'),typeInput=form.querySelector('[data-cleaning-room-type]'),name=text(nameInput&&nameInput.value),type=text(typeInput&&typeInput.value)||'custom',repo=window.CleaningHouseholdRepository;if(!name||!repo||typeof repo.createRoom!=='function')return false;
    event.preventDefault();event.stopImmediatePropagation();state.roomCreateInFlight=true;form.classList.add('is-familyapp-submitting');if(submit){submit.disabled=true;submit.setAttribute('aria-busy','true');submit.textContent='Kamer maken…';}
    var note=form.querySelector('[data-familyapp-room-create-status]');if(!note){note=document.createElement('div');note.className='familyapp-room-create-status';note.setAttribute('data-familyapp-room-create-status','1');note.textContent='Kamer wordt toegevoegd…';if(submit&&submit.parentNode)submit.parentNode.insertBefore(note,submit);}
    raf(function(){Promise.resolve().then(function(){return repo.createRoom({name:name,type:type});}).then(function(){state.roomCreateInFlight=false;var current=document.querySelector('#screen-cleaning [data-cleaning-room-form]'),cancel=current&&current.querySelector('[data-cleaning-room-cancel]');if(cancel)cancel.click();if(typeof window.showToast==='function')window.showToast(name+' toegevoegd ✓');queue();}).catch(function(error){state.roomCreateInFlight=false;var current=document.querySelector('#screen-cleaning [data-cleaning-room-form]')||form,button=current.querySelector('[type="submit"]');current.classList.remove('is-familyapp-submitting');if(button){button.disabled=false;button.removeAttribute('aria-busy');button.textContent='Kamer toevoegen';}var currentNote=current.querySelector('[data-familyapp-room-create-status]');if(currentNote)currentNote.textContent='Opslaan lukte niet. Probeer opnieuw.';if(typeof window.showToast==='function')window.showToast((error&&error.message)||'Kamer kon niet worden toegevoegd');});});
    return true;
  }

  function onPointerUp(event){
    var close=event.target&&event.target.closest?event.target.closest('#cleaning-supplies-overlay [data-cleaning-supply-close]'):null;if(!close)return;
    event.preventDefault();event.stopImmediatePropagation();state.pendingSupply=null;
    raf(function(){var experience=window.CleaningSupplyExperience;if(experience&&typeof experience.close==='function')experience.close();});
  }
  function onClick(event){
    var target=event.target;if(!target||!target.closest)return;
    if(target.closest('#cleaning-supplies-overlay [data-cleaning-supply-close]')){state.pendingSupply=null;return;}
    var toggle=target.closest('[data-familyapp-planned-toggle]');if(toggle){event.preventDefault();event.stopPropagation();var card=toggle.closest('.cleaning-planned-room-card');if(card){var expanded=card.classList.toggle('is-familyapp-expanded');toggle.setAttribute('aria-expanded',expanded?'true':'false');toggle.setAttribute('aria-label',expanded?'Verberg routines':'Toon routines');}return;}
    var roomSupply=target.closest('[data-cleaning-room-supplies]');if(roomSupply){var roomId=text(roomSupply.getAttribute('data-cleaning-room-supplies')),roomRow=room(rootData(),roomId);state.pendingSupply={roomId:roomId,type:roomType(roomRow)};window.setTimeout(function(){queueSupply();observe();},0);return;}
  }
  function onSubmit(event){interceptRoomCreate(event);}
  function decorate(){state.queued=false;state.perf.decorateCalls++;installThemeCache();ensureLoadingShell();decorateHomeHeroes();decoratePlannedCards();decorateOverview();decorateSupply();observe();}
  function queue(){if(state.queued)return;state.queued=true;raf(decorate);}
  function queueSupply(){if(state.supplyQueued)return;state.supplyQueued=true;raf(decorateSupply);}
  function isOwnObservedMutation(node){return !!(node&&node.closest&&node.closest('[data-familyapp-supply-summary],[data-familyapp-supply-prompt],[data-familyapp-supply-actions],[data-familyapp-planned-summary]'));}
  function relevantObservedMutation(records){for(var i=0;i<records.length;i++){var target=records[i].target,node=target&&target.nodeType===1?target:target&&target.parentElement;if(!isOwnObservedMutation(node))return true;}return false;}
  function cleanupObservers(){var kept=[];for(var i=0;i<state.observers.length;i++){var entry=state.observers[i];if(entry&&entry.node&&entry.node.isConnected){kept.push(entry);continue;}try{if(entry&&entry.observer)entry.observer.disconnect();}catch(error){}}state.observers=kept;}
  function observeRoot(node,scope){if(!node||node.__familyappFeedbackRound2Observed||typeof MutationObserver==='undefined')return;node.__familyappFeedbackRound2Observed=true;var observer=new MutationObserver(function(records){state.perf.observerCallbacks++;if(!relevantObservedMutation(records))return;if(scope==='supply')queueSupply();else queue();});observer.observe(node,{childList:true,subtree:true});state.observers.push({node:node,observer:observer,scope:scope});}
  function observe(){cleanupObservers();observeRoot(document.getElementById('screen-cleaning'),'screen');observeRoot(document.getElementById('cleaning-supplies-overlay'),'supply');}
  function start(){installThemeCache();schedulePrewarm();document.addEventListener('pointerup',onPointerUp,true);document.addEventListener('click',onClick,true);document.addEventListener('submit',onSubmit,true);observe();queue();window.addEventListener('pageshow',queue);window.addEventListener('familyapp:cleaning-repository',queue);document.addEventListener('visibilitychange',function(){if(document.visibilityState==='visible')queue();});}
  window.FamilyAppCleaningPerformance={status:function(){return JSON.parse(JSON.stringify(state.perf));}};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
