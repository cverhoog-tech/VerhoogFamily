'use strict';
// ============================================================
// TASK CREATE READINESS v3.0
// Uses HouseholdContext as the only task identity/readiness authority.
// ============================================================
(function(){
  if(window.__taskCreateReadinessV3)return;
  window.__taskCreateReadinessV3=true;

  var contextWaitPromise=null;

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

  function householdContext(){return window.HouseholdContext||null;}

  function currentReadyContext(){
    var ctx=householdContext();
    if(!ctx)return null;
    try{
      var current=ctx.current();
      if(current&&current.ready&&current.uid&&current.householdId)return current;
    }catch(e){}
    return null;
  }

  function waitForReadyContext(){
    var existing=currentReadyContext();
    if(existing)return Promise.resolve(existing);
    if(contextWaitPromise)return contextWaitPromise;
    contextWaitPromise=new Promise(function(resolve,reject){
      var settled=false,timer=null,off=null;
      function cleanup(){if(timer)clearTimeout(timer);if(typeof off==='function')try{off();}catch(e){}}
      function finish(err,value){if(settled)return;settled=true;cleanup();if(err)reject(err);else resolve(value);}
      function inspect(){var ready=currentReadyContext();if(ready)finish(null,ready);}
      var ctx=householdContext();
      if(!ctx||typeof ctx.subscribe!=='function'){finish(new Error('HouseholdContext is niet beschikbaar'));return;}
      off=ctx.subscribe(function(){inspect();});
      timer=setTimeout(function(){finish(new Error('Geen actieve household-context beschikbaar'));},6000);
      inspect();
    }).finally(function(){contextWaitPromise=null;});
    return contextWaitPromise;
  }

  function prepareSharedTaskStore(shared){
    if(!window.FamilyDataStore)return Promise.reject(new Error('FamilyDataStore is niet beschikbaar'));
    return waitForReadyContext().then(function(ctx){
      var boundary=window.TaskContextBoundary;
      if(boundary&&typeof boundary.assertReady==='function')boundary.assertReady();
      if(typeof shared.start==='function')shared.start();
      var status=typeof shared.status==='function'?shared.status():null;
      if(status&&status.ready)return {status:status,context:ctx};
      throw new Error('Shared task store niet ready na HouseholdContext resolve');
    });
  }

  function install(){
    installLayoutGuard();
    installTapGuard();
    var shared=window.TaskSharedData;
    if(!shared||typeof shared.create!=='function')return false;
    if(shared.create.__resolvesHouseholdContextV3)return true;
    var originalCreate=shared.create.bind(shared);
    function createWhenReady(task){return prepareSharedTaskStore(shared).then(function(){return originalCreate(task);});}
    createWhenReady.__resolvesHouseholdContextV3=true;
    createWhenReady.__original=originalCreate;
    shared.create=createWhenReady;
    if(window.TaskContextBoundary&&typeof window.TaskContextBoundary.install==='function')window.TaskContextBoundary.install();
    return true;
  }

  if(!install())console.warn('[TaskCreateReadiness] TaskSharedData was not available at deterministic load time');
})();
