'use strict';
// ============================================================
// ACTION INBOX BOOTSTRAP v1.1.0
// The Action Inbox needs read access to the Cleaning canonical repository
// even when the user has never opened the Schoonmaken tab (that screen's
// own scripts load lazily on first visit, see navigation.js
// ensureCleaningScreen()). This loader brings in exactly the read-side
// Cleaning modules the Inbox depends on, using the same script-injection
// technique already used by calendar.js's bootstrap chain.
//
// CleaningPermissions loads first so the final public Cleaning mutation APIs
// are capability-guarded even when Action Inbox eager-loads Cleaning before
// the Cleaning screen itself has ever been opened. The permission layer owns
// no domain state and writes no Firebase data.
// ============================================================
(function(){
  if(window.ActionInboxBootstrap)return;

  var VERSION='1.1.0';
  var readyCallbacks=[];
  var isReady=false;

  function load(src,done){
    var existing=document.querySelector('script[data-action-inbox-boot="'+src+'"]');
    if(existing){if(done)done();return;}
    var s=document.createElement('script');
    s.src=src;s.async=false;s.setAttribute('data-action-inbox-boot',src);
    s.onload=function(){if(done)done();};
    s.onerror=function(){try{console.error('[ActionInboxBootstrap] failed to load',src);}catch(e){}if(done)done();};
    document.head.appendChild(s);
  }

  function markReady(){
    if(isReady)return;
    isReady=true;
    var callbacks=readyCallbacks.slice();
    readyCallbacks=[];
    callbacks.forEach(function(fn){try{fn();}catch(e){console.warn('[ActionInboxBootstrap] ready callback failed',e);}});
  }

  function start(){
    if(window.CleaningPermissions&&window.CleaningHouseholdRepository&&window.CleaningHelpRequestUi&&window.CleaningRoutineExperience){markReady();return;}
    load('src/modules/cleaning/cleaningPermissions.js?v=1',function(){
      load('src/modules/cleaning/cleaningHouseholdRepository.js?v=7',function(){
        load('src/modules/cleaning/cleaningHelpRequestUi.js?v=1',function(){
          load('src/modules/cleaning/cleaningRoutineExperience.js?v=3',function(){
            if(window.CleaningPermissions&&CleaningPermissions._installGuards)CleaningPermissions._installGuards();
            markReady();
          });
        });
      });
    });
  }

  function ready(callback){
    if(typeof callback!=='function')return;
    if(isReady){callback();return;}
    readyCallbacks.push(callback);
  }

  window.ActionInboxBootstrap={version:VERSION,start:start,ready:ready,isReady:function(){return isReady;}};
  start();
})();
