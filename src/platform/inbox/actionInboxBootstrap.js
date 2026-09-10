'use strict';
// ACTION INBOX BOOTSTRAP v2.0.0
// Cleaning is intentionally not booted here. The Cleaning v2 repository is
// lazy and becomes available only after the user opens Schoonmaken. Until then
// Cleaning adapters simply project zero items; every non-Cleaning Inbox domain
// remains immediately available. This removes all Cleaning Firebase/listener/
// presentation work from the critical app-start path.
(function(){
  if(window.ActionInboxBootstrap)return;
  var VERSION='2.0.0';
  function start(){return true;}
  function ready(callback){if(typeof callback!=='function')return;Promise.resolve().then(callback);}
  window.ActionInboxBootstrap={version:VERSION,start:start,ready:ready,isReady:function(){return true;}};
})();
