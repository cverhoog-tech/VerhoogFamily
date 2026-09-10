'use strict';
// ============================================================
// ACTION INBOX BOOTSTRAP v1.2.0
// The Action Inbox needs read access to the Cleaning canonical repository
// even when the user has never opened the Schoonmaken tab (that screen's
// own modules load lazily on first visit, see navigation.js).
//
// IMPORTANT: Cleaning dependencies are loaded with dynamic import() using the
// exact same versioned URLs as the Cleaning ES-module graph. Loading these files
// as classic <script> tags as well as ES modules creates two browser execution
// identities for the same source and therefore two independent top-level
// closures/listener-registration opportunities. One canonical module identity
// is required here.
//
// CleaningPermissions loads first so the final public Cleaning mutation APIs
// are capability-guarded even when Action Inbox eager-loads Cleaning before
// the Cleaning screen itself has ever been opened. The permission layer owns
// no domain state and writes no Firebase data.
// ============================================================
(function(){
  if(window.ActionInboxBootstrap)return;

  var VERSION='1.2.0';
  var readyCallbacks=[];
  var isReady=false;
  var startPromise=null;

  var MODULES=[
    '/src/modules/cleaning/cleaningPermissions.js?v=1',
    '/src/modules/cleaning/cleaningHouseholdRepository.js?v=7',
    '/src/modules/cleaning/cleaningHelpRequestUi.js?v=1',
    '/src/modules/cleaning/cleaningRoutineExperience.js?v=3'
  ];

  function loadModule(src){
    return import(src).catch(function(error){
      try{console.error('[ActionInboxBootstrap] failed to import',src,error);}catch(e){}
      // Preserve the previous bootstrap's best-effort behavior: continue the
      // dependency chain so other Inbox adapters remain usable if one optional
      // Cleaning presentation module cannot load.
      return null;
    });
  }

  function markReady(){
    if(isReady)return;
    isReady=true;
    var callbacks=readyCallbacks.slice();
    readyCallbacks=[];
    callbacks.forEach(function(fn){try{fn();}catch(e){console.warn('[ActionInboxBootstrap] ready callback failed',e);}});
  }

  function start(){
    if(isReady)return Promise.resolve(true);
    if(startPromise)return startPromise;
    if(window.CleaningPermissions&&window.CleaningHouseholdRepository&&window.CleaningHelpRequestUi&&window.CleaningRoutineExperience){
      markReady();
      return Promise.resolve(true);
    }

    startPromise=MODULES.reduce(function(chain,src){
      return chain.then(function(){return loadModule(src);});
    },Promise.resolve()).then(function(){
      if(window.CleaningPermissions&&window.CleaningPermissions._installGuards)window.CleaningPermissions._installGuards();
      markReady();
      return true;
    }).finally(function(){startPromise=null;});

    return startPromise;
  }

  function ready(callback){
    if(typeof callback!=='function')return;
    if(isReady){callback();return;}
    readyCallbacks.push(callback);
  }

  window.ActionInboxBootstrap={version:VERSION,start:start,ready:ready,isReady:function(){return isReady;}};
  start();
})();
