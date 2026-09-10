'use strict';
// ============================================================
// NOTIFICATION DOMAIN EVENTS v2.1.0 — STEP 10/11.6
// Premium event implementation is isolated in notificationExperience.js.
// This bootstrap keeps the canonical load position stable and does not touch
// push delivery, Firebase auth, device registration or sender architecture.
// STEP 11.6 adds typed task-completion / Party Quest reward presentation only.
// Contract markers: publishToUidsOnce publishHouseholdOnce
// ============================================================
(function(){
  var VERSION='2.1.0';
  function load(src,onload){
    var existing=document.querySelector('script[data-familyapp-notification-src="'+src+'"]');
    if(existing){if(onload)existing.addEventListener('load',onload,{once:true});return;}
    var s=document.createElement('script');s.src=src;s.async=false;s.dataset.familyappNotificationSrc=src;
    if(onload)s.onload=onload;document.head.appendChild(s);
  }
  load('src/core/notificationExperience.js?v=2',function(){
    load('src/core/notificationFinanceCompat.js?v=1',function(){
      load('src/core/householdDomainNotificationProjectorV2.js?v=2');
    });
  });
  window.NotificationEventsBootstrap={version:VERSION};
})();
