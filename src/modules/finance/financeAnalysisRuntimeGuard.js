'use strict';
// STEP 8 Analysis runtime ownership guard.
// Ensures the premium FinanceAnalysisUI remains the only Analyse renderer,
// even when legacy FinanceStore/renderFinance or screen-entry code fires.
(function(){
  if(window.__financeAnalysisRuntimeGuard)return;
  window.__financeAnalysisRuntimeGuard=true;

  var legacyRenderFinance=typeof window.renderFinance==='function'?window.renderFinance:null;
  var legacyEnterFinanceScreen=typeof window.enterFinanceScreen==='function'?window.enterFinanceScreen:null;

  function canonicalAnalysis(){
    return window.FinanceAnalysisUI&&typeof window.FinanceAnalysisUI.render==='function';
  }
  function activeTab(){return String(window.finTab||'maandplan');}

  if(legacyRenderFinance&&!legacyRenderFinance.__analysisGuarded){
    var guardedRender=function(){
      if(activeTab()==='analyse'&&canonicalAnalysis())return window.FinanceAnalysisUI.render();
      return legacyRenderFinance.apply(this,arguments);
    };
    guardedRender.__analysisGuarded=true;
    window.renderFinance=guardedRender;
  }

  if(legacyEnterFinanceScreen&&!legacyEnterFinanceScreen.__analysisGuarded){
    var guardedEnter=function(){
      var tab=activeTab();
      if(tab==='analyse'&&window.FinanceNativeTabs&&typeof window.FinanceNativeTabs.activate==='function'){
        if(window.FinanceStore&&typeof window.FinanceStore.boot==='function')window.FinanceStore.boot();
        return window.FinanceNativeTabs.activate('analyse');
      }
      var result=legacyEnterFinanceScreen.apply(this,arguments);
      if(window.FinanceNativeTabs&&typeof window.FinanceNativeTabs.activate==='function')window.FinanceNativeTabs.activate(tab);
      return result;
    };
    guardedEnter.__analysisGuarded=true;
    window.enterFinanceScreen=guardedEnter;
  }
})();
