'use strict';
// FamilyApp feedback round 3.
// Presentation/performance adapter only. CleaningHouseholdRepository remains the
// canonical writer and CleaningOccurrence remains the concrete Cleaning state.
(function(){
  if(window.__familyAppFeedbackRound3)return;
  window.__familyAppFeedbackRound3=true;

  var VERSION='0.1.0';
  var state={queued:false,observer:null,homeWrapped:false,warmScheduled:false,warmed:false,resumeTimer:null};
  var HERO={
    tasks:{url:'https://res.cloudinary.com/rg86slp4/image/upload/v1788732539/familyapp-home-tasks-hero-v2.webp',pos:'center 70%'},
    shop:{url:'https://res.cloudinary.com/rg86slp4/image/upload/v1788732703/familyapp-home-groceries-hero-v2.webp',pos:'center 63%'},
    cleaning:{url:'https://res.cloudinary.com/rg86slp4/image/upload/v1788732770/familyapp-home-cleaning-hero-v2.webp',pos:'center 61%'}
  };
  var ROOM_LABELS={'living-room':'Woonkamer',kitchen:'Keuken',bathroom:'Badkamer',bedroom:'Slaapkamer','kids-room':'Kinderkamer',toilet:'Toilet',hall:'Hal',laundry:'Wasruimte',outdoor:'Balkon / tuin',custom:'Kamer'};

  function text(value){return String(value==null?'':value).trim();}
  function canonical(value){return text(value).toLocaleLowerCase('nl-NL').replace(/\s+/g,' ');}
  function esc(value){return String(value==null?'':value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}
  function rootData(){try{var repo=window.CleaningHouseholdRepository,snap=repo&&repo.snapshot?repo.snapshot():null;return snap&&snap.data||{};}catch(error){return{};}}
  function roomMap(root){return root&&root.rooms&&typeof root.rooms==='object'?root.rooms:{};}
  function routineMap(root){return root&&root.routines&&typeof root.routines==='object'?root.routines:{};}
  function roomName(row){return text(row&&row.name)||ROOM_LABELS[text(row&&row.type)]||'Kamer';}

  function isDark(){return (document.documentElement.getAttribute('data-theme')||'').indexOf('dark')>=0;}
  function heroBackground(def){
    var overlay=isDark()
      ?'linear-gradient(180deg,rgba(3,7,8,.13) 0%,rgba(3,7,8,.29) 48%,rgba(3,7,8,.75) 100%)'
      :'linear-gradient(180deg,rgba(10,14,11,.02) 0%,rgba(10,14,11,.15) 45%,rgba(10,14,11,.62) 100%)';
    return overlay+',url("'+def.url+'")';
  }
  function applyHomeHeroes(){
    var defs=[['.tasks-card',HERO.tasks],['.shop-card',HERO.shop],['.cleaning-card,.feed-card',HERO.cleaning]];
    defs.forEach(function(entry){
      var card=document.querySelector('#screen-home '+entry[0]);if(!card)return;
      if(entry[0].indexOf('cleaning-card')>=0)card.classList.add('cleaning-card');
      card.classList.add('familyapp-photo-hero');
      card.style.setProperty('background-image',heroBackground(entry[1]),'important');
      card.style.setProperty('background-size','cover','important');
      card.style.setProperty('background-position',entry[1].pos,'important');
      card.style.setProperty('background-repeat','no-repeat','important');
      var inner=card.querySelector('.card-inner');if(inner){inner.style.setProperty('background','transparent','important');inner.style.setProperty('background-image','none','important');}
    });
  }
  function installHomeWrapper(){
    if(state.homeWrapped||typeof window.renderHome!=='function')return;
    var raw=window.renderHome;
    var wrapped=function(){var result=raw.apply(this,arguments);applyHomeHeroes();return result;};
    wrapped.__familyappRound3=true;
    window.renderHome=wrapped;
    state.homeWrapped=true;
  }

  function roomForCard(root,card){
    var heading=card&&card.querySelector('.cleaning-planned-room-head strong'),target=canonical(heading&&heading.textContent),rooms=roomMap(root),ids=Object.keys(rooms);
    for(var i=0;i<ids.length;i++){
      var row=rooms[ids[i]];if(!row||row.active===false)continue;
      if(canonical(roomName(row))===target)return Object.assign({id:ids[i]},row);
    }
    return null;
  }
  function routinesForRoom(root,roomId){
    var routines=routineMap(root),rows=[];Object.keys(routines).forEach(function(id){var row=routines[id];if(row&&row.active!==false&&text(row.roomId)===text(roomId))rows.push(Object.assign({id:id},row));});
    return rows;
  }
  function routineVisual(title){
    var raw=canonical(title);
    if(/speel|kind|opruim|meubel/.test(raw))return{icon:'🧸',tone:'family'};
    if(/dweil|vloer|veeg|stofzuig/.test(raw))return{icon:'🧹',tone:'floor'};
    if(/toilet|\bwc\b/.test(raw))return{icon:'🚽',tone:'water'};
    if(/douche|bad|ontkalk/.test(raw))return{icon:'🚿',tone:'water'};
    if(/wastafel|kraan/.test(raw))return{icon:'🚰',tone:'water'};
    if(/was|kleding/.test(raw))return{icon:'🧺',tone:'laundry'};
    if(/bed|beddengoed/.test(raw))return{icon:'🛏️',tone:'laundry'};
    if(/spiegel/.test(raw))return{icon:'🪞',tone:'glass'};
    if(/glas|raam/.test(raw))return{icon:'🪟',tone:'glass'};
    if(/stof|afstof/.test(raw))return{icon:'🪶',tone:'floor'};
    if(/keuken|aanrecht|oven|fornuis/.test(raw))return{icon:'🧽',tone:'water'};
    if(/reling|balkon|terras|tuin|buiten/.test(raw))return{icon:'🌿',tone:'outdoor'};
    return{icon:'🧼',tone:'water'};
  }
  function plannedNext(rows){
    for(var i=0;i<rows.length;i++){
      var date=rows[i].querySelector(':scope > span');var value=text(date&&date.textContent);if(value)return value;
    }
    return'';
  }
  function decoratePlannedCards(){
    var root=rootData(),cards=document.querySelectorAll('#screen-cleaning .cleaning-planned-room-card');
    for(var c=0;c<cards.length;c++){
      var card=cards[c];card.classList.add('familyapp-planned-card');
      var items=card.querySelector('.cleaning-planned-room-items'),domRows=items?Array.prototype.slice.call(items.querySelectorAll('.cleaning-planned-room-item')):[];
      var roomRow=roomForCard(root,card),routines=roomRow?routinesForRoom(root,roomRow.id):[];
      var titles=routines.map(function(row){return text(row.title);}).filter(Boolean);
      var minutes=routines.reduce(function(sum,row){return sum+Math.max(0,Number(row.estimatedMinutes)||0);},0);
      if(!titles.length){
        titles=domRows.map(function(row){var strong=row.querySelector('strong');return text(strong&&strong.textContent);}).filter(function(value){return value&&!/^\d+\s+routines?$/i.test(value);});
        if(!titles.length&&domRows.length)titles=['Schoonmaakroutine'];
        if(!minutes)domRows.forEach(function(row){var small=row.querySelector('small'),match=text(small&&small.textContent).match(/(\d+)\s*min/i);if(match)minutes+=Number(match[1])||0;});
      }
      var count=routines.length||domRows.length,next=plannedNext(domRows),summary=card.querySelector('[data-familyapp-planned-summary]');
      if(!summary){summary=document.createElement('div');summary.className='familyapp-planned-summary';summary.setAttribute('data-familyapp-planned-summary','1');if(items)card.insertBefore(summary,items);else card.appendChild(summary);}
      var icons=(titles.length?titles:['Schoonmaakroutine']).slice(0,5).map(function(title){var visual=routineVisual(title);return'<span class="familyapp-planned-icon" data-routine-tone="'+visual.tone+'" role="img" aria-label="'+esc(title)+'" title="'+esc(title)+'">'+visual.icon+'</span>';}).join('');
      var existingToggle=summary.querySelector('[data-familyapp-planned-toggle]'),expanded=card.classList.contains('is-familyapp-expanded'),expandedAttr=existingToggle&&existingToggle.getAttribute('aria-expanded')==='true';
      summary.innerHTML='<div class="familyapp-planned-summary-main"><div class="familyapp-planned-icons">'+icons+'</div><span class="familyapp-planned-meta">'+count+' '+(count===1?'routine':'routines')+' · ± '+Math.round(minutes)+' min'+(next?' <span class="familyapp-planned-next">· '+esc(next)+'</span>':'')+'</span></div><button type="button" class="familyapp-planned-toggle" data-familyapp-planned-toggle aria-expanded="'+((expanded||expandedAttr)?'true':'false')+'" aria-label="'+((expanded||expandedAttr)?'Verberg routines':'Toon routines')+'"><span>'+(expanded?'⌃':'⌄')+'</span></button>';
    }
  }

  function preloadLink(rel,href,as){
    if(document.querySelector('link[data-familyapp-r3-preload="'+href+'"]'))return;
    var link=document.createElement('link');link.rel=rel;link.href=href;link.setAttribute('data-familyapp-r3-preload',href);if(as)link.as=as;document.head.appendChild(link);
  }
  function primeAssets(){
    preloadLink('modulepreload','/src/modules/cleaning/cleaningScreen.js?v=1');
    preloadLink('modulepreload','/src/modules/cleaning/cleaningPremiumFeedback.js?v=2');
    preloadLink('preload','/src/styles/cleaning.css?v=1','style');
    Object.keys(HERO).forEach(function(key){try{var img=new Image();img.decoding='async';img.src=HERO[key].url;}catch(error){}});
  }
  function warmCleaning(){
    if(state.warmed)return;state.warmed=true;
    try{
      if(typeof window.ensureCleaningScreen==='function')window.ensureCleaningScreen();
      if(typeof window.ensureCleaningStyles==='function')window.ensureCleaningStyles();
      if(typeof window.renderCleaningModule==='function')window.renderCleaningModule();
    }catch(error){state.warmed=false;console.warn('[Cleaning] early warm skipped',error);}
  }
  function scheduleWarm(){
    if(state.warmScheduled)return;state.warmScheduled=true;
    var run=function(){if(state.warmed)return;if(typeof window.requestIdleCallback==='function')window.requestIdleCallback(warmCleaning,{timeout:260});else window.setTimeout(warmCleaning,90);};
    try{
      var controller=window.AuthenticatedSessionController,session=controller&&typeof controller.status==='function'?controller.status():null;
      if(session&&session.ready){window.setTimeout(run,30);return;}
    }catch(error){}
    var onSession=function(event){if(event&&event.detail&&event.detail.ready){window.removeEventListener('familyapp:session-state',onSession);window.setTimeout(run,30);}};
    window.addEventListener('familyapp:session-state',onSession);
    window.addEventListener('load',function(){window.setTimeout(run,140);},{once:true});
  }

  function beginResumeStability(){
    var root=document.documentElement;if(!root||!root.classList)return;root.classList.add('familyapp-resume-stable');
    if(state.resumeTimer){clearTimeout(state.resumeTimer);state.resumeTimer=null;}
  }
  function endResumeStability(){
    var root=document.documentElement;if(!root||!root.classList)return;
    if(state.resumeTimer)clearTimeout(state.resumeTimer);
    state.resumeTimer=setTimeout(function(){
      var finish=function(){root.classList.remove('familyapp-resume-stable');state.resumeTimer=null;};
      if(typeof requestAnimationFrame==='function')requestAnimationFrame(function(){requestAnimationFrame(finish);});else finish();
    },160);
  }
  function bindResumeStability(){
    window.addEventListener('pagehide',beginResumeStability);
    window.addEventListener('pageshow',function(){beginResumeStability();endResumeStability();});
    document.addEventListener('visibilitychange',function(){if(document.visibilityState==='hidden')beginResumeStability();else{beginResumeStability();endResumeStability();}});
  }

  function decorate(){state.queued=false;installHomeWrapper();applyHomeHeroes();decoratePlannedCards();}
  function queue(){if(state.queued)return;state.queued=true;(window.requestAnimationFrame||function(fn){return setTimeout(fn,0);})(decorate);}
  function observe(){
    if(state.observer||typeof MutationObserver==='undefined')return;
    state.observer=new MutationObserver(function(mutations){
      for(var i=0;i<mutations.length;i++){
        var target=mutations[i].target,node=target&&target.nodeType===1?target:target&&target.parentElement;
        if(node&&(node.closest&&((node.closest('#screen-cleaning'))||(node.closest('#screen-home'))))){queue();return;}
      }
    });
    var body=document.body;if(body)state.observer.observe(body,{childList:true,subtree:true});
  }
  function start(){
    primeAssets();installHomeWrapper();bindResumeStability();scheduleWarm();observe();queue();
    window.addEventListener('familyapp:cleaning-repository',queue);
    window.addEventListener('familyapp:household-identity-synced',queue);
    window.addEventListener('familyapp:session-state',function(event){if(event&&event.detail&&event.detail.ready){queue();endResumeStability();}});
  }

  window.FamilyAppFeedbackRound3={version:VERSION,refresh:queue,warmCleaning:warmCleaning};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
