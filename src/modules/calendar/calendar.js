'use strict';
// ============================================================
// CALENDAR + FINANCE BOOTSTRAP
// FinanceStore is loaded before the legacy agenda/finance runtime so every
// finance mutation has one household-scoped source of truth from first use.
// ============================================================
(function(){
  function load(src, done){
    var s=document.createElement('script');
    s.src=src;
    s.async=false;
    if(done) s.onload=done;
    s.onerror=function(){ console.error('[CalendarBootstrap] failed to load', src); if(done)done(); };
    document.head.appendChild(s);
  }

  load('src/modules/finance/financeStore.js?v=3', function(){
    load('src/modules/finance/financeRuntimeShell.js?v=2', function(){
      load('src/modules/calendar/calendarLegacy.js?v=3', function(){
        load('src/modules/finance/financeMaandplanPriority.js?v=1', function(){
          load('src/modules/finance/financeTransactionsPremiumUi.js?v=1', function(){
            if(window.FinanceRuntimeShell&&FinanceRuntimeShell.ensure)FinanceRuntimeShell.ensure();
            if(window.FinanceMaandplanPriority&&FinanceMaandplanPriority.install)FinanceMaandplanPriority.install();
            if(window.FinanceTransactionsPremiumUi&&FinanceTransactionsPremiumUi.install)FinanceTransactionsPremiumUi.install();
            load('src/modules/calendar/calendarSharedLive.js?v=2', function(){
              load('src/modules/calendar/calendarPremiumUi.js?v=2', function(){
                load('src/modules/calendar/calendarMealPlanIntegration.js?v=1', function(){
                  load('src/modules/calendar/calendarGoogleSync.js?v=1');
                });
              });
            });
          });
        });
      });
    });
  });
})();
