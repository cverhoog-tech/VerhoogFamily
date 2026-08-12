'use strict';
// Keeps task creation on the existing authoritative TaskSharedData/Firebase path.
// Repairs the mobile startup race by actively resolving the authenticated
// household context before create(), instead of only polling for readiness.
(function(){
  if(window.__taskCreateReadinessFix) return;
  window.__taskCreateReadinessFix=true;

  var familyStoreLoadPromise=null;
  var householdResolvePromise=null;

  function installLayoutGuard(){
    if(document.getElementById('task-create-mobile-guard-style')) return;
    var style=document.createElement('style');
    style.id='task-create-mobile-guard-style';
    style.textContent='\n'+
      '#tdp-overlay .tdp-edit-field{min-width:0!important;box-sizing:border-box;}\n'+
      '#tdp-overlay .tdp-edit-input,#tdp-overlay .tdp-edit-select{width:100%!important;min-width:0!important;max-width:100%!important;box-sizing:border-box;}\n'+
      '#tdp-overlay #tdp-create-time,#tdp-overlay #tdp-create-prio{display:block;width:100%!important;min-width:0!important;max-width:100%!important;}\n';
    document.head.appendChild(style);
  }

  // iOS Safari can occasionally swallow the synthetic click after scrolling
  // a long modal. This only reuses the button's existing onclick handler when
  // no real click was observed for the same touch.
  function installTapGuard(){
    if(window.__taskCreateTapGuard) return;
    window.__taskCreateTapGuard=true;

    document.addEventListener('click',function(e){
      var btn=e.target&&e.target.closest?e.target.closest('#tdp-create-save-btn'):null;
      if(btn) btn.__tdpLastRealClick=Date.now();
    },true);

    document.addEventListener('touchend',function(e){
      var btn=e.target&&e.target.closest?e.target.closest('#tdp-create-save-btn'):null;
      if(!btn) return;
      var touchedAt=Date.now();
      setTimeout(function(){
        if(!btn||!document.documentElement.contains(btn)||btn.disabled) return;
        if(btn.__tdpLastRealClick&&btn.__tdpLastRealClick>=touchedAt) return;
        if(typeof btn.onclick==='function') btn.onclick.call(btn);
      },40);
    },true);
  }

  function authUid(){
    try{
      var u=window.fbUser||(window.firebase&&firebase.auth&&firebase.auth().currentUser)||null;
      return u&&u.uid||null;
    }catch(e){return null;}
  }

  function loadFamilyDataStore(){
    if(window.FamilyDataStore) return Promise.resolve(window.FamilyDataStore);
    if(familyStoreLoadPromise) return familyStoreLoadPromise;
    familyStoreLoadPromise=new Promise(function(resolve,reject){
      var existing=document.querySelector('script[data-task-family-store-loader="1"]');
      if(existing){
        existing.addEventListener('load',function(){
          if(window.FamilyDataStore) resolve(window.FamilyDataStore);
          else reject(new Error('FamilyDataStore loaded without API'));
        },{once:true});
        existing.addEventListener('error',function(){reject(new Error('FamilyDataStore kon niet worden geladen'));},{once:true});
        return;
      }
      var s=document.createElement('script');
      s.src='src/core/familyDataStore.js?v=2';
      s.async=false;
      s.dataset.taskFamilyStoreLoader='1';
      s.onload=function(){
        if(window.FamilyDataStore) resolve(window.FamilyDataStore);
        else reject(new Error('FamilyDataStore loaded without API'));
      };
      s.onerror=function(){reject(new Error('FamilyDataStore kon niet worden geladen'));};
      document.head.appendChild(s);
    }).catch(function(err){familyStoreLoadPromise=null;throw err;});
    return familyStoreLoadPromise;
  }

  function resolveHouseholdContext(){
    if(window.fbFamilyId) return Promise.resolve(window.fbFamilyId);
    if(householdResolvePromise) return householdResolvePromise;

    householdResolvePromise=new Promise(function(resolve,reject){
      var started=Date.now();
      function tryResolve(){
        if(window.fbFamilyId){resolve(window.fbFamilyId);return;}
        if(!authUid()){
          if(Date.now()-started>=6000){reject(new Error('Firebase gebruiker is nog niet beschikbaar'));return;}
          setTimeout(tryResolve,120);
          return;
        }
        if(window.FamilyHousehold&&typeof window.FamilyHousehold.resolve==='function'){
          Promise.resolve(window.FamilyHousehold.resolve()).then(function(result){
            var hid=window.fbFamilyId||(result&&result.id)||null;
            if(hid){window.fbFamilyId=hid;resolve(hid);return;}
            reject(new Error('Geen actief gezin gevonden'));
          }).catch(reject);
          return;
        }
        if(Date.now()-started>=6000){reject(new Error('Household platform is nog niet beschikbaar'));return;}
        setTimeout(tryResolve,120);
      }
      tryResolve();
    }).finally(function(){householdResolvePromise=null;});

    return householdResolvePromise;
  }

  function prepareSharedTaskStore(shared){
    return Promise.all([
      loadFamilyDataStore(),
      resolveHouseholdContext()
    ]).then(function(){
      if(typeof shared.start==='function') shared.start();
      var status=typeof shared.status==='function'?shared.status():null;
      if(status&&status.ready) return status;
      throw new Error('Shared task store niet ready na household resolve');
    });
  }

  function install(){
    installLayoutGuard();
    installTapGuard();

    var shared=window.TaskSharedData;
    if(!shared||typeof shared.create!=='function') return false;
    if(shared.create.__resolvesHouseholdContext) return true;

    var originalCreate=shared.create.bind(shared);

    function createWhenReady(task){
      return prepareSharedTaskStore(shared).then(function(){
        return originalCreate(task);
      });
    }
    createWhenReady.__resolvesHouseholdContext=true;
    createWhenReady.__original=originalCreate;
    shared.create=createWhenReady;
    return true;
  }

  if(install()) return;
  var tries=0;
  var timer=setInterval(function(){
    tries++;
    if(install()||tries>=80) clearInterval(timer);
  },100);
})();
