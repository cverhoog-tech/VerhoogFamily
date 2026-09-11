'use strict';
// FamilyApp PWA cache bootstrap v1.0.0
// Registers the existing shared push/cache worker even when push is not enabled.
// The worker itself owns the security boundary and caches static assets only.
(function(){
  if(window.FamilyAppPwaCache)return;
  var VERSION='1.0.0';
  var WORKER='/firebase-messaging-sw.js';
  var registrationPromise=null;

  function supported(){return !!(window.isSecureContext&&navigator&&navigator.serviceWorker);}

  function register(){
    if(!supported())return Promise.resolve(null);
    if(registrationPromise)return registrationPromise;
    registrationPromise=navigator.serviceWorker.register(WORKER,{scope:'/',updateViaCache:'none'}).then(function(registration){
      // Do not block app startup on an update check. Registration is enough for
      // this visit; subsequent static requests can be cached by the active worker.
      try{registration.update().catch(function(){});}catch(error){}
      return registration;
    }).catch(function(error){
      registrationPromise=null;
      try{console.warn('[FamilyAppPwaCache] registration failed',error);}catch(ignore){}
      return null;
    });
    return registrationPromise;
  }

  function clearStaticCache(){
    if(!supported())return Promise.resolve(false);
    return navigator.serviceWorker.ready.then(function(registration){
      var worker=registration.active||registration.waiting||registration.installing;
      if(!worker)return false;
      worker.postMessage({type:'familyapp:clear-static-cache'});
      return true;
    }).catch(function(){return false;});
  }

  window.FamilyAppPwaCache=Object.freeze({version:VERSION,register:register,clearStaticCache:clearStaticCache,isSupported:supported});

  // Register after the DOM is available but without waiting for auth, Firebase
  // household state or push opt-in. This is infrastructure, not user data.
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',register,{once:true});
  else register();
})();
