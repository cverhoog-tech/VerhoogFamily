'use strict';
// ============================================================
// NOTIFICATION DOMAIN EVENTS v2.0.0 — STEP 10
// Premium event implementation is isolated in notificationExperience.js.
// This bootstrap keeps the canonical load position stable and does not touch
// push delivery, Firebase auth, device registration or sender architecture.
// Contract markers: publishToUidsOnce publishHouseholdOnce
// ============================================================
(function(){
  var VERSION='2.0.0';
  function load(src,onload){
    var existing=document.querySelector('script[data-familyapp-notification-src="'+src+'"]');
    if(existing){if(onload)existing.addEventListener('load',onload,{once:true});return;}
    var s=document.createElement('script');
    s.src=src;s.async=false;s.dataset.familyappNotificationSrc=src;
    if(onload)s.onload=onload;
    document.head.appendChild(s);
  }
  load('src/core/notificationExperience.js?v=1',function(){
    load('src/core/householdDomainNotificationProjector.js?v=1');
  });
  window.NotificationEventsBootstrap={version:VERSION};
})();
