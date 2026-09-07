'use strict';
// FamilyApp feedback round 4.
// Lifecycle/performance adapter only. CleaningHouseholdRepository remains the sole
// Cleaning writer and CleaningOccurrence remains the canonical concrete state.
(function(){
  if(window.__familyAppFeedbackRound4)return;
  window.__familyAppFeedbackRound4=true;

  var VERSION='0.1.0';
  var state={homeFrame:0,observer:null,adapterPromise:null,networkPrimed:false,resumeTimer:0};
  var HERO={
    tasks:{url:'https://res.cloudinary.com/rg86slp4/image/upload/v1788808948/familyapp-home-tasks-hero-v3.webp',pos:'center 62%',overlay:'linear-gradient(180deg,rgba(5,10,16,.04) 0%,rgba(5,10,16,.17) 42%,rgba(5,10,16,.66) 100%)'},
    shop:{url:'https://res.cloudinary.com/rg86slp4/image/upload/v1788809037/familyapp-home-groceries-hero-v3.webp',pos:'center 59%',overlay:'linear-gradient(180deg,rgba(20,17,12,.02) 0%,rgba(20,17,12,.10) 42%,rgba(20,17,12,.62) 100%)'},
    cleaning:{url:'https://res.cloudinary.com/rg86slp4/image/upload/v1788809095/familyapp-home-cleaning-hero-v3.webp',pos:'center 57%',overlay:'linear-gradient(180deg,rgba(9,14,17,.02) 0%,rgba(9,14,17,.11) 42%,rgba(9,14,17,.62) 100%)'}
  };
  var ADAPTERS=[
    {key:'round2',flag:'__familyAppFeedbackRound2',attr:'data-familyapp-feedback-round2',src:'/src/core/familyappFeedbackRound2.js?v=20260907-3'},
    {key:'round3',flag:'__familyAppFeedbackRound3',attr:'data-familyapp-feedback-round3',src:'/src/core/familyappFeedbackRound3.js?v=20260907-3'}
  ];

  function setHero(card,def){
    if(!card||!def)return;
    card.classList.add('familyapp-photo-hero');
    card.style.setProperty('background-image',def.overlay+',url("'+def.url+'")','important');
    card.style.setProperty('background-size','cover','important');
    card.style.setProperty('background-position',def.pos,'important');
    card.style.setProperty('background-repeat','no-repeat','important');
    var inner=card.querySelector('.card-inner');
    if(inner){inner.style.setProperty('background','transparent','important');inner.style.setProperty('background-image','none','important');}
  }
  function applyHomeHeroes(){
    var home=document.getElementById('screen-home');if(!home)return;
    var tasks=home.querySelector('.tasks-card'),shop=home.querySelector('.shop-card'),cleaning=home.querySelector('.cleaning-card, .feed-card');
    if(cleaning)cleaning.classList.add('cleaning-card');
    setHero(tasks,HERO.tasks);setHero(shop,HERO.shop);setHero(cleaning,HERO.cleaning);
  }
  function queueHome(){
    if(state.homeFrame)return;
    var raf=window.requestAnimationFrame||function(fn){return window.setTimeout(fn,16);};
    state.homeFrame=raf(function(){state.homeFrame=0;applyHomeHeroes();});
  }

  function wrapRenderHome(){
    var raw=window.renderHome;if(typeof raw!=='function'||raw.__familyappRound4)return;
    var wrapped=function(){var result=raw.apply(this,arguments);applyHomeHeroes();queueHome();return result;};
    wrapped.__familyappRound4=true;window.renderHome=wrapped;
  }
  function wrapTheme(){
    var raw=window.applyTheme;if(typeof raw!=='function'||raw.__familyappRound4)return;
    var wrapped=function(){var result=raw.apply(this,arguments);queueHome();return result;};
    wrapped.__familyappRound4=true;window.applyTheme=wrapped;
  }
  function wrapNavigation(){
    var raw=window.showScreen;if(typeof raw!=='function'||raw.__familyappRound4)return;
    var wrapped=function(name){
      var target=String(name==null?'':name).toLowerCase();
      if(target==='cleaning')loadCleaningAdapters();
      var result=raw.apply(this,arguments);
      if(target==='home')queueHome();
      return result;
    };
    wrapped.__familyappRound4=true;window.showScreen=wrapped;
  }
  function installHooks(){wrapRenderHome();wrapTheme();wrapNavigation();}

  function addHint(rel,href,as){
    if(document.querySelector('link[data-familyapp-r4-hint="'+href+'"]'))return;
    var link=document.createElement('link');link.rel=rel;link.href=href;if(as)link.as=as;link.setAttribute('data-familyapp-r4-hint',href);document.head.appendChild(link);
  }
  function primeCleaningNetwork(){
    if(state.networkPrimed)return;state.networkPrimed=true;
    ADAPTERS.forEach(function(item){addHint('prefetch',item.src,'script');});
    addHint('prefetch','/src/modules/cleaning/cleaningScreen.js?v=1','script');
    addHint('prefetch','/src/modules/cleaning/cleaningPremiumFeedback.js?v=2','script');
    addHint('prefetch','/src/styles/cleaning.css?v=1','style');
  }
  function scheduleNetworkPrime(){
    function later(){
      window.setTimeout(function(){
        if(typeof window.requestIdleCallback==='function')window.requestIdleCallback(primeCleaningNetwork,{timeout:3200});
        else window.setTimeout(primeCleaningNetwork,900);
      },750);
    }
    try{
      var controller=window.AuthenticatedSessionController,snapshot=controller&&typeof controller.status==='function'?controller.status():null;
      if(snapshot&&snapshot.ready){later();return;}
    }catch(error){}
    var onSession=function(event){if(event&&event.detail&&event.detail.ready){window.removeEventListener('familyapp:session-state',onSession);later();}};
    window.addEventListener('familyapp:session-state',onSession);
  }

  function loadScript(item){
    if(window[item.flag])return Promise.resolve(true);
    var existing=document.querySelector('script['+item.attr+']');
    if(existing&&existing.getAttribute('data-familyapp-loaded')==='1')return Promise.resolve(true);
    return new Promise(function(resolve,reject){
      var script=existing||document.createElement('script');
      if(!existing){script.src=item.src;script.async=false;script.setAttribute(item.attr,'1');document.head.appendChild(script);}
      var done=function(){script.setAttribute('data-familyapp-loaded','1');resolve(true);};
      var fail=function(){reject(new Error(item.key+' kon niet worden geladen'));};
      if(window[item.flag]){done();return;}
      script.addEventListener('load',done,{once:true});script.addEventListener('error',fail,{once:true});
    });
  }
  function loadCleaningAdapters(){
    primeCleaningNetwork();
    if(state.adapterPromise)return state.adapterPromise;
    state.adapterPromise=loadScript(ADAPTERS[0]).then(function(){return loadScript(ADAPTERS[1]);}).then(function(){
      installHooks();resetHomeObserver();queueHome();return true;
    }).catch(function(error){state.adapterPromise=null;console.error('[FamilyApp] Cleaning visual adapters',error);return false;});
    return state.adapterPromise;
  }

  function relevantHomeMutation(mutation){
    var target=mutation&&mutation.target,node=target&&target.nodeType===1?target:target&&target.parentElement;
    if(node&&node.closest&&node.closest('#screen-home'))return true;
    var added=mutation&&mutation.addedNodes||[];
    for(var i=0;i<added.length;i++){var child=added[i];if(child&&child.nodeType===1&&(child.id==='screen-home'||(child.closest&&child.closest('#screen-home'))||(child.querySelector&&child.querySelector('#screen-home'))))return true;}
    return false;
  }
  function resetHomeObserver(){
    if(state.observer){state.observer.disconnect();state.observer=null;}
    if(typeof MutationObserver==='undefined'||!document.body)return;
    state.observer=new MutationObserver(function(mutations){for(var i=0;i<mutations.length;i++){if(relevantHomeMutation(mutations[i])){queueHome();break;}}});
    state.observer.observe(document.body,{childList:true,subtree:true});
  }

  function beginResumeStability(){
    var root=document.documentElement;if(!root||!root.classList)return;
    root.classList.add('familyapp-resume-stable');
    if(state.resumeTimer){window.clearTimeout(state.resumeTimer);state.resumeTimer=0;}
  }
  function endResumeStability(){
    var root=document.documentElement;if(!root||!root.classList)return;
    if(state.resumeTimer)window.clearTimeout(state.resumeTimer);
    state.resumeTimer=window.setTimeout(function(){
      var raf=window.requestAnimationFrame||function(fn){return window.setTimeout(fn,16);};
      raf(function(){raf(function(){root.classList.remove('familyapp-resume-stable');state.resumeTimer=0;queueHome();});});
    },150);
  }
  function bindResume(){
    window.addEventListener('pagehide',beginResumeStability);
    window.addEventListener('pageshow',function(){beginResumeStability();endResumeStability();});
    document.addEventListener('visibilitychange',function(){if(document.visibilityState==='hidden')beginResumeStability();else{beginResumeStability();endResumeStability();}});
  }
  function bindCleaningIntent(){
    document.addEventListener('pointerdown',function(event){var target=event.target;if(target&&target.closest&&target.closest('#screen-home .cleaning-card, #screen-home .feed-card'))primeCleaningNetwork();},{passive:true,capture:true});
  }
  function start(){installHooks();resetHomeObserver();bindResume();bindCleaningIntent();scheduleNetworkPrime();applyHomeHeroes();window.setTimeout(installHooks,0);window.setTimeout(installHooks,250);window.setTimeout(installHooks,900);}

  window.FamilyAppFeedbackRound4={version:VERSION,refreshHome:queueHome,loadCleaningAdapters:loadCleaningAdapters,primeCleaningNetwork:primeCleaningNetwork};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
