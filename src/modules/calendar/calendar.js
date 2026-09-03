'use strict';
// ============================================================
// CALENDAR + FINANCE BOOTSTRAP
// FinanceHouseholdRepository owns STEP 8 persistence. FinanceStore is the
// business/compatibility facade and must load before the legacy finance UI.
//
// STEP 6 calendar order is deliberate:
// legacy UI -> canonical repository -> premium decoration -> compatibility
// facade -> Cleaning execution sync -> virtual MealPlan projection ->
// per-user Google sync.
//
// CalendarSharedLive MUST load after CalendarPremiumUi because both touch the
// legacy add-sheet globals. CleaningExecutionSync loads after both canonical
// Task and Calendar repositories and wraps only explicit user mutations; raw
// projection writes bypass it to prevent synchronization loops.
// FinanceSavingsInteraction then wraps the final add-sheet owner so special
// Finance sheets bypass the generic f1 guard while calendar submissions still
// flow through CalendarSharedLive.
//
// STEP 8 Analysis order is deliberate:
// FinanceAnalysisEngine -> FinanceAnalysisUI v2 -> FinanceNativeTabs ->
// Analysis runtime guard -> Analysis shell style -> PDF export -> polish ->
// data-driven advisor. NativeTabs and the guard make FinanceAnalysisUI the only
// real Analyse renderer; polish/advisor decorate the canonical output last.
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

  load('src/modules/finance/financeHouseholdRepository.js?v=1', function(){
    load('src/modules/finance/financeStore.js?v=4', function(){
      load('src/modules/finance/financeRuntimeShell.js?v=3', function(){
        load('src/modules/calendar/calendarLegacy.js?v=3', function(){
          load('src/modules/finance/financeMaandplanPriority.js?v=1', function(){
            load('src/modules/finance/financeTransactionsPremiumUi.js?v=1', function(){
              load('src/modules/finance/financeMaandplanGroups.js?v=4', function(){
                if(window.FinanceRuntimeShell&&FinanceRuntimeShell.ensure)FinanceRuntimeShell.ensure();
                if(window.FinanceMaandplanPriority&&FinanceMaandplanPriority.install)FinanceMaandplanPriority.install();
                if(window.FinanceTransactionsPremiumUi&&FinanceTransactionsPremiumUi.install)FinanceTransactionsPremiumUi.install();
                if(window.FinanceMaandplanGroups&&FinanceMaandplanGroups.install)FinanceMaandplanGroups.install();
                load('src/modules/calendar/calendarEventHouseholdRepository.js?v=2', function(){
                  load('src/modules/calendar/calendarPremiumUi.js?v=3', function(){
                    load('src/modules/calendar/calendarSharedLive.js?v=6', function(){
                      load('src/modules/cleaning/cleaningExecutionSync.js?v=1', function(){
                        load('src/modules/finance/financeSavingsInteraction.js?v=1', function(){
                          load('src/modules/finance/financeAnalysisEngine.js?v=1', function(){
                            load('src/modules/finance/financeAnalysisUiV2.js?v=2', function(){
                              load('src/modules/finance/financeNativeTabs.js?v=348', function(){
                                if(window.FinanceNativeTabs&&FinanceNativeTabs.boot)FinanceNativeTabs.boot();
                                load('src/modules/finance/financeAnalysisRuntimeGuard.js?v=1', function(){
                                  load('src/modules/finance/financeAnalysisShellStyle.js?v=2', function(){
                                    load('src/modules/finance/financeAnalysisExport.js?v=1', function(){
                                      load('src/modules/finance/financeAnalysisPolish.js?v=1', function(){
                                        load('src/modules/finance/financeAnalysisAdvisor.js?v=1', function(){
                                          if(window.FinanceAnalysisAdvisor&&FinanceAnalysisAdvisor.install)FinanceAnalysisAdvisor.install();
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
                          });
                        });
                      });
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  });
})();
