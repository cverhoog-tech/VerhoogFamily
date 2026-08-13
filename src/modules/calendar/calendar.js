'use strict';
// ============================================================
// CALENDAR BOOTSTRAP
// Preserve the legacy agenda/finance runtime, then layer the
// household-scoped shared/live calendar adapter and premium UI on top.
// ============================================================
(function(){
  function load(src, done){
    var s=document.createElement('script');
    s.src=src;
    s.async=false;
    if(done) s.onload=done;
    s.onerror=function(){ console.error('[CalendarBootstrap] failed to load', src); };
    document.head.appendChild(s);
  }

  load('src/modules/calendar/calendarLegacy.js?v=1', function(){
    load('src/modules/calendar/calendarSharedLive.js?v=1', function(){
      load('src/modules/calendar/calendarPremiumUi.js?v=2');
    });
  });
})();
