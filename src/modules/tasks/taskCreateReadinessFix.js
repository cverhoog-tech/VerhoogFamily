'use strict';
// Keeps task creation on the existing authoritative TaskSharedData/Firebase path,
// but avoids a mobile startup race where the create card can be opened before
// FamilyDataStore + household id + Firebase uid are all ready.
(function(){
  if(window.__taskCreateReadinessFix) return;
  window.__taskCreateReadinessFix=true;

  function install(){
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
