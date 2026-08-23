'use strict';
// ============================================================
// FINANCE CONTROLS v1.1.0
// Compatibility bridge for the old Finance reset card.
// STEP 8 feedback: the destructive "Verse start" action belongs only at the
// bottom of Finance, owned by FinanceRuntimeShell. No card is rendered here.
// ============================================================
(function(){
  if(window.FinanceControls)return;

  function removeLegacyResetCard(){
    var host=document.getElementById('finance-reset-host');
    if(host&&host.parentNode)host.parentNode.removeChild(host);
    var card=document.getElementById('finance-reset-card');
    if(card&&card.parentNode)card.parentNode.removeChild(card);
  }

  function ensureCard(){
    removeLegacyResetCard();
    if(window.FinanceRuntimeShell&&typeof FinanceRuntimeShell.ensure==='function'){
      FinanceRuntimeShell.ensure();
    }
  }

  function boot(){ensureCard();}

  window.addEventListener('familyapp:finance:changed',ensureCard);
  window.FinanceControls={version:'1.1.0',boot:boot,ensureCard:ensureCard};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();