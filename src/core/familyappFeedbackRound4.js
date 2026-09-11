'use strict';
// FamilyApp feedback round 4.
// Lifecycle/performance adapter only. CleaningOccurrence remains canonical and
// the dedicated CleaningTurnExperience owns the Cleaning turn popup lifecycle.
(function(){
  if(window.__familyAppFeedbackRound4)return;
  window.__familyAppFeedbackRound4=true;

  var VERSION='0.4.1';
  var state={
    hookTimer:null,
    coreModulePromise:null,
    coreStylePromise:null,
    companionPromise:null,
    premiumPromise:null,
    turnPromise:null,
    adapterPromise:null,
    presentationScheduled:false,
    prewarmScheduled:false,
    cleaningEntry:0,
    renderingEntry:-1,
    renderedEntry:-1,
    resumeTimer:0
  };
  var ADAPTERS=[
    {key:'round2',flag:'__familyAppFeedbackRound2',attr:'data-familyapp-feedback-round2',src:'/src/core/familyappFeedbackRound2.js?v=20260909-turn-rebuild-1'},
    {key:'round3',flag:'__familyAppFeedbackRound3',attr:'data-familyapp-feedback-round3',src:'/src/core/familyappFeedbackRound3.js?v=20260907-3'}
  ];

  // Home Hero photography is deliberately NOT written from JavaScript anymore.
  // familyapp-feedback-round4.css owns the visible photo layer with ::before so
  // older presentation adapters can no longer race each other by rewriting the
  // card background-image after returning from Cleaning.
  function refreshHome(){
    var card=document.querySelector('#screen-home .feed-card, #screen-home .cleaning-card');
    if(card)card.classList.add('cleaning-card');
  }

  function ensureCleaningShell(){
    if(typeof window.ensureCleaningScreen==='function')return window.ensureCleaningScreen();
    return document.getElementById('screen-cleaning');
  }

  function ensureCoreStyle(){
    if(state.coreStylePromise)return state.coreStylePromise;
    if(window._cleaningStylePromise){state.coreStylePromise=window._cleaningStylePromise;return state.coreStylePromise;}
    if(typeof window.ensureCleaningStyles==='function'){
      try{state.coreStylePromise=window.ensureCleaningStyles();window._cleaningStylePromise=state.coreStylePromise;return state.coreStylePromise;}catch(error){}
    }
    state.coreStylePromise=new Promise(function(resolve,reject){
      var existing=document.querySelector('link[data-familyapp-cleaning-style]');
      if(existing){
        if(existing.sheet){resolve();return;}
        existing.addEventListener('load',resolve,{once:true});
        existing.addEventListener('error',reject,{once:true});
        return;
      }
      var link=document.createElement('link');
      link.rel='stylesheet';
      link.href='/src/styles/cleaning.css?v=1';
      link.setAttribute('data-familyapp-cleaning-style','1');
      link.addEventListener('load',resolve,{once:true});
      link.addEventListener('error',reject,{once:true});
      document.head.appendChild(link);
    });
    window._cleaningStylePromise=state.coreStylePromise;
    return state.coreStylePromise;
  }

  function ensureCoreModule(){
    if(state.coreModulePromise)return state.coreModulePromise;
    if(window._cleaningModulePromise){state.coreModulePromise=window._cleaningModulePromise;return state.coreModulePromise;}
    state.coreModulePromise=import('/src/modules/cleaning/cleaningScreen.js?v=1');
    window._cleaningModulePromise=state.coreModulePromise;
    return state.coreModulePromise;
  }

  function prepareCleaningCore(){
    ensureCleaningShell();
    var style=ensureCoreStyle();
    var module=ensureCoreModule();
    return Promise.all([style,module]);
  }

  function showImmediateShell(){
    var screen=document.getElementById('screen-cleaning');
    var root=document.getElementById('cleaning-content');
    if(!screen||!screen.classList.contains('active')||!root||root.children.length)return;
    root.innerHTML='<div class="familyapp-cleaning-loading-shell familyapp-cleaning-fast-shell" aria-live="polite">'
      +'<div class="familyapp-loading-head"><span></span><span></span></div>'
      +'<div class="familyapp-loading-hero"></div>'
      +'<div class="familyapp-loading-tabs"></div>'
      +'<div class="familyapp-loading-cards"><i></i><i></i><i></i></div>'
      +'<p>Schoonmaken openen…</p>'
      +'</div>';
  }

  function renderCleaningFast(){
    var root=document.getElementById('cleaning-content');
    if(!root)return;
    // Calls made by older warmers while Cleaning is not active may prepare the
    // module graph, but must never trigger an off-screen DOM render.
    if(window._currentScreen!=='cleaning'){
      prepareCleaningCore().catch(function(error){console.warn('[Cleaning] core prewarm skipped',error);});
      return;
    }
    var entry=state.cleaningEntry;
    if(state.renderedEntry===entry||state.renderingEntry===entry){schedulePresentation();return;}
    state.renderingEntry=entry;
    showImmediateShell();
    prepareCleaningCore().then(function(result){
      if(window._currentScreen!=='cleaning'){state.renderingEntry=-1;return;}
      var mod=result&&result[1];
      if(mod&&typeof mod.renderCleaningScreen==='function'){
        mod.renderCleaningScreen(root);
        root.setAttribute('data-familyapp-cleaning-core-mounted','1');
        state.renderedEntry=entry;
      }
      state.renderingEntry=-1;
      schedulePresentation();
    }).catch(function(error){
      state.renderingEntry=-1;
      console.error('[Cleaning] snelle core kon niet worden geladen:',error);
      if(root&&window._currentScreen==='cleaning')root.innerHTML='<section class="cleaning-status-card cleaning-status-error" role="alert"><strong>Schoonmaken kon niet worden geopend</strong><span>Probeer het nogmaals.</span></section>';
    });
  }
  renderCleaningFast.__familyappRound4Fast=true;

  function loadCleaningTurnExperience(){
    if(window.CleaningTurnExperience)return Promise.resolve(true);
    if(state.turnPromise)return state.turnPromise;
    state.turnPromise=import('/src/modules/cleaning/cleaningTurnExperience.js?v=20260909-1')
      .then(function(){return !!window.CleaningTurnExperience;})
      .catch(function(error){state.turnPromise=null;throw error;});
    return state.turnPromise;
  }

  function loadCleaningCompanions(){
    if(window.CleaningV23Companions)return Promise.resolve(true);
    if(state.companionPromise)return state.companionPromise;
    if(window._cleaningCompanionLoaderPromise){state.companionPromise=window._cleaningCompanionLoaderPromise;return state.companionPromise;}
    state.companionPromise=import('/src/modules/cleaning/cleaningCompanionLoader.js?v=1')
      .then(function(){return !!window.CleaningV23Companions;})
      .catch(function(error){state.companionPromise=null;window._cleaningCompanionLoaderPromise=null;throw error;});
    window._cleaningCompanionLoaderPromise=state.companionPromise;
    return state.companionPromise;
  }

  function loadPremiumFeedback(){
    if(window.CleaningPremiumFeedback)return Promise.resolve(true);
    if(state.premiumPromise)return state.premiumPromise;
    if(window._cleaningPremiumFeedbackPromise){state.premiumPromise=window._cleaningPremiumFeedbackPromise;return state.premiumPromise;}
    state.premiumPromise=import('/src/modules/cleaning/cleaningPremiumFeedback.js?v=2');
    window._cleaningPremiumFeedbackPromise=state.premiumPromise;
    return state.premiumPromise;
  }

  function loadScript(item){
    if(window[item.flag])return Promise.resolve(true);
    var existing=document.querySelector('script['+item.attr+']');
    if(existing&&existing.getAttribute('data-familyapp-loaded')==='1')return Promise.resolve(true);
    return new Promise(function(resolve,reject){
      var script=existing||document.createElement('script');
      var done=function(){script.setAttribute('data-familyapp-loaded','1');resolve(true);};
      var fail=function(){reject(new Error(item.key+' kon niet worden geladen'));};
      if(!existing){
        script.src=item.src;
        script.async=false;
        script.setAttribute(item.attr,'1');
        script.addEventListener('load',done,{once:true});
        script.addEventListener('error',fail,{once:true});
        document.head.appendChild(script);
      }else{
        if(window[item.flag]){done();return;}
        script.addEventListener('load',done,{once:true});
        script.addEventListener('error',fail,{once:true});
      }
    });
  }

  function loadCleaningAdapters(){
    if(state.adapterPromise)return state.adapterPromise;
    state.adapterPromise=loadScript(ADAPTERS[0])
      .then(function(){return loadScript(ADAPTERS[1]);})
      .then(function(){refreshHome();return true;})
      .catch(function(error){state.adapterPromise=null;console.error('[FamilyApp] Cleaning visual adapters',error);return false;});
    return state.adapterPromise;
  }

  function schedulePresentation(){
    if(state.presentationScheduled)return;
    state.presentationScheduled=true;
    var run=function(){
      // Register the dedicated turn owner first. Functional V2.1-V2.3 companions
      // then extend that accepted route, while V2.4 remains presentation-only.
      loadCleaningTurnExperience()
        .catch(function(error){console.warn('[Cleaning] beurt-popup kon niet worden geladen',error);})
        .then(function(){return loadCleaningCompanions();})
        .catch(function(error){console.warn('[Cleaning] companions konden niet worden geladen',error);})
        .then(function(){return loadPremiumFeedback();})
        .catch(function(error){console.warn('[Cleaning] premium feedback kon niet worden geladen',error);})
        .then(function(){return loadCleaningAdapters();});
    };
    // Core content has already rendered. Companions and presentation-only layers
    // may now arrive during idle time without sitting on the critical first-open path.
    if(typeof window.requestIdleCallback==='function')window.requestIdleCallback(run,{timeout:800});
    else window.setTimeout(run,180);
  }

  function installFastPath(){
    var installed=false;
    if(typeof window.renderCleaningModule==='function'){
      if(!window.renderCleaningModule.__familyappRound4Fast)window.renderCleaningModule=renderCleaningFast;
      if(state.coreModulePromise)window._cleaningModulePromise=state.coreModulePromise;
      if(state.coreStylePromise)window._cleaningStylePromise=state.coreStylePromise;
      installed=true;
    }
    if(typeof window.showScreen==='function'&&!window.showScreen.__familyappRound4Stable){
      var raw=window.showScreen;
      var wrapped=function(name){
        var target=String(name==null?'':name).toLowerCase();
        if(target==='cleaning'){
          if(window._currentScreen!=='cleaning')state.cleaningEntry++;
          prepareCleaningCore().catch(function(error){console.warn('[Cleaning] tap prewarm skipped',error);});
        }
        var result=raw.apply(this,arguments);
        if(target==='home')refreshHome();
        return result;
      };
      wrapped.__familyappRound4Stable=true;
      wrapped.__familyappRaw=raw;
      window.showScreen=wrapped;
      installed=true;
    }
    return installed&&typeof window.renderCleaningModule==='function'&&typeof window.showScreen==='function';
  }

  function pollForNavigation(){
    if(installFastPath()){
      if(state.hookTimer){window.clearInterval(state.hookTimer);state.hookTimer=null;}
      return;
    }
    if(state.hookTimer)return;
    var attempts=0;
    state.hookTimer=window.setInterval(function(){
      attempts++;
      if(installFastPath()||attempts>120){window.clearInterval(state.hookTimer);state.hookTimer=null;}
    },50);
  }

  function idlePrepare(){
    prepareCleaningCore().catch(function(error){console.warn('[Cleaning] idle prewarm skipped',error);});
  }
  function scheduleCorePrewarm(){
    if(state.prewarmScheduled)return;
    state.prewarmScheduled=true;
    var schedule=function(){
      window.setTimeout(function(){
        if(typeof window.requestIdleCallback==='function')window.requestIdleCallback(idlePrepare,{timeout:1800});
        else window.setTimeout(idlePrepare,650);
      },500);
    };
    try{
      var controller=window.AuthenticatedSessionController,snapshot=controller&&typeof controller.status==='function'?controller.status():null;
      if(snapshot&&snapshot.ready){schedule();return;}
    }catch(error){}
    var onSession=function(event){
      if(event&&event.detail&&event.detail.ready){window.removeEventListener('familyapp:session-state',onSession);schedule();}
    };
    window.addEventListener('familyapp:session-state',onSession);
    window.addEventListener('load',function(){window.setTimeout(schedule,700);},{once:true});
  }

  function bindCleaningIntent(){
    document.addEventListener('pointerdown',function(event){
      var target=event.target;
      if(target&&target.closest&&target.closest('#screen-home .cleaning-card, #screen-home .feed-card')){
        prepareCleaningCore().catch(function(){});
      }
    },{passive:true,capture:true});
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
      raf(function(){raf(function(){root.classList.remove('familyapp-resume-stable');state.resumeTimer=0;});});
    },150);
  }
  function bindResume(){
    window.addEventListener('pagehide',beginResumeStability);
    window.addEventListener('pageshow',function(){beginResumeStability();endResumeStability();});
    document.addEventListener('visibilitychange',function(){if(document.visibilityState==='hidden')beginResumeStability();else{beginResumeStability();endResumeStability();}});
  }

  function start(){
    window.__familyappCanonicalHomeHeroOwner='css-v3';
    refreshHome();
    pollForNavigation();
    bindCleaningIntent();
    bindResume();
    scheduleCorePrewarm();
  }

  window.FamilyAppFeedbackRound4={
    version:VERSION,
    refreshHome:refreshHome,
    prepareCleaningCore:prepareCleaningCore,
    loadCleaningTurnExperience:loadCleaningTurnExperience,
    loadCleaningCompanions:loadCleaningCompanions,
    loadCleaningAdapters:loadCleaningAdapters
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();