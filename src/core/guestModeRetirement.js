'use strict';
// Retires the legacy "use without an account" guest path. This does NOT
// disable normal authenticated offline/reconnect behavior or queued sync.
(function(){
  function retireGuestMode(){
    try {
      var candidates=document.querySelectorAll('button[onclick="useOfflineMode()"],button[onclick="offlineLogin()"]');
      for(var i=0;i<candidates.length;i++) candidates[i].remove();
    } catch(e){}

    // Defense in depth for stale cached markup or old inline callers.
    window.useOfflineMode=function(){
      if(typeof window.showAuthError==='function') window.showAuthError('Offline gebruiken zonder account is niet meer beschikbaar.');
      return false;
    };
    window.offlineLogin=function(){
      if(typeof window.showAuthError==='function') window.showAuthError('Inloggen is nog niet beschikbaar. Probeer opnieuw zodra de verbinding klaar is.');
      return false;
    };
    try { useOfflineMode=window.useOfflineMode; } catch(e){}
    try { offlineLogin=window.offlineLogin; } catch(e){}
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',retireGuestMode);
  else retireGuestMode();
})();
