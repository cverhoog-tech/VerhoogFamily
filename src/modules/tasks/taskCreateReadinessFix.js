'use strict';
// Keeps task creation on the existing authoritative TaskSharedData/Firebase path,
// but avoids a mobile startup race where the create card can be opened before
// FamilyDataStore + household id + Firebase uid are all ready.
(function(){
  if(window.__taskCreateReadinessFix) return;
  window.__taskCreateReadinessFix=true;

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

  // Mobile Safari normally synthesizes click after touchend. On the affected
  // create card that click can occasionally be swallowed after scrolling a
  // long modal. We only invoke the button's EXISTING onclick as a fallback
  // when no click was observed for the same touch. No save logic is duplicated.
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

  function install(){
    installLayoutGuard();
    installTapGuard();

    var shared=window.TaskSharedData;
    if(!shared||typeof shared.create!=='function') return false;
    if(shared.create.__waitsForReadiness) return true;

    var originalCreate=shared.create.bind(shared);

    function waitUntilReady(timeoutMs){
      return new Promise(function(resolve,reject){
        var startedAt=Date.now();
        function check(){
          try{
            if(typeof shared.start==='function') shared.start();
            var status=typeof shared.status==='function'?shared.status():null;
            if(status&&status.ready){resolve(status);return;}
          }catch(e){}
          if(Date.now()-startedAt>=timeoutMs){
            reject(new Error('Shared task store is not ready'));
            return;
          }
          setTimeout(check,120);
        }
        check();
      });
    }

    function createWhenReady(task){
      return waitUntilReady(5000).then(function(){
        return originalCreate(task);
      });
    }
    createWhenReady.__waitsForReadiness=true;
    createWhenReady.__original=originalCreate;
    shared.create=createWhenReady;
    return true;
  }

  if(install()) return;
  var tries=0;
  var timer=setInterval(function(){
    tries++;
    if(install()||tries>=50) clearInterval(timer);
  },100);
})();
