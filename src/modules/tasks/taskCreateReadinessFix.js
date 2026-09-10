'use strict';
// ============================================================
// TASK CREATE READINESS v2.1
// Keeps TaskSharedData/Firebase authoritative while resolving the authenticated
// household context on demand. Auth readiness is consumed from the canonical
// AuthenticatedSessionController; this feature owns no Firebase auth observer.
// ============================================================
(function(){
  if(window.__taskCreateReadinessV2)return;
  window.__taskCreateReadinessV2=true;

  var householdResolvePromise=null;

  function installLayoutGuard(){
    if(document.getElementById('task-create-mobile-guard-style'))return;
    var style=document.createElement('style');
    style.id='task-create-mobile-guard-style';
    style.textContent='\n'+
      '#tdp-overlay .tdp-edit-field{min-width:0!important;box-sizing:border-box;}\n'+
      '#tdp-overlay .tdp-edit-input,#tdp-overlay .tdp-edit-select{width:100%!important;min-width:0!important;max-width:100%!important;box-sizing:border-box;}\n'+
      '#tdp-overlay #tdp-create-time,#tdp-overlay #tdp-create-prio{display:block;width:100%!important;min-width:0!important;max-width:100%!important;}\n';
    document.head.appendChild(style);
  }

  function installTapGuard(){
    if(window.__taskCreateTapGuard)return;
    window.__taskCreateTapGuard=true;
    document.addEventListener('click',function(e){
      var btn=e.target&&e.target.closest?e.target.closest('#tdp-create-save-btn'):null;
      if(btn)btn.__tdpLastRealClick=Date.now();
    },true);
    document.addEventListener('touchend',function(e){
      var btn=e.target&&e.target.closest?e.target.closest('#tdp-create-save-btn'):null;
      if(!btn)return;
      var touchedAt=Date.now();
      setTimeout(function(){
        if(!btn||!document.documentElement.contains(btn)||btn.disabled)return;
        if(btn.__tdpLastRealClick&&btn.__tdpLastRealClick>=touchedAt)return;
        if(typeof btn.onclick==='function')btn.onclick.call(btn);
      },40);
    },true);
  }

  function currentUser(){
    try{return window.fbUser||(window.AuthenticatedSessionController&&window.AuthenticatedSessionController.status().user)||null;}catch(e){return null;}
  }

  function waitForAuthenticatedUser(){
    var existing=currentUser();
    if(existing&&existing.uid)return Promise.resolve(existing);
    if(window.AuthenticatedSessionController&&typeof window.AuthenticatedSessionController.whenAuthenticated==='function'){
      return window.AuthenticatedSessionController.whenAuthenticated();
    }
    return Promise.reject(new Error('Canonical sessie is nog niet beschikbaar'));
  }

  function resolveHouseholdContext(){
    if(window.fbFamilyId)return Promise.resolve(window.fbFamilyId);
    if(householdResolvePromise)return householdResolvePromise;
    householdResolvePromise=waitForAuthenticatedUser().then(function(){
      if(window.fbFamilyId)return window.fbFamilyId;
      if(window.FamilyHousehold&&typeof window.FamilyHousehold.resolve==='function'){
        return Promise.resolve(window.FamilyHousehold.resolve()).then(function(result){
          var hid=window.fbFamilyId||(result&&result.id)||null;
          if(!hid)throw new Error('Geen actief gezin gevonden');
          window.fbFamilyId=hid;
          return hid;
        });
      }
      return new Promise(function(resolve,reject){
        var settled=false,timer=null;
        function finish(){
          if(settled)return;
          if(window.fbFamilyId){settled=true;cleanup();resolve(window.fbFamilyId);}
        }
        function cleanup(){
          if(timer)clearTimeout(timer);
          window.removeEventListener('familyapp:household-changed',finish);
          window.removeEventListener('familyapp:household-identity-synced',finish);
        }
        window.addEventListener('familyapp:household-changed',finish);
        window.addEventListener('familyapp:household-identity-synced',finish);
        timer=setTimeout(function(){if(!settled){settled=true;cleanup();reject(new Error('Household platform is nog niet beschikbaar'));}},6000);
        finish();
      });
    }).finally(function(){householdResolvePromise=null;});
    return householdResolvePromise;
  }

  function prepareSharedTaskStore(shared){
    if(!window.FamilyDataStore)return Promise.reject(new Error('FamilyDataStore is niet beschikbaar'));
    return resolveHouseholdContext().then(function(){
      if(typeof shared.start==='function')shared.start();
      var status=typeof shared.status==='function'?shared.status():null;
      if(status&&status.ready)return status;
      throw new Error('Shared task store niet ready na household resolve');
    });
  }

  function install(){
    installLayoutGuard();
    installTapGuard();
    var shared=window.TaskSharedData;
    if(!shared||typeof shared.create!=='function')return false;
    if(shared.create.__resolvesHouseholdContext)return true;
    var originalCreate=shared.create.bind(shared);
    function createWhenReady(task){return prepareSharedTaskStore(shared).then(function(){return originalCreate(task);});}
    createWhenReady.__resolvesHouseholdContext=true;
    createWhenReady.__original=originalCreate;
    shared.create=createWhenReady;
    return true;
  }

  if(!install())console.warn('[TaskCreateReadiness] TaskSharedData was not available at deterministic load time');
})();
