'use strict';
// ============================================================
// FINANCE RUNTIME SHELL v1.1.0
// Stable finance-shell controls outside renderable .fin-panel nodes.
// ============================================================
(function(){
  if(window.FinanceRuntimeShell)return;
  var VERSION='1.1.0';

  function ensureStyles(){
    if(document.getElementById('finance-runtime-shell-style'))return;
    var s=document.createElement('style');
    s.id='finance-runtime-shell-style';
    s.textContent=[
      '.fin-shell-actions{padding:3px 16px 0;background:var(--c-bg);display:flex;justify-content:flex-end}',
      '.fin-reset-btn{border:0;background:transparent;color:var(--c-text3);border-radius:10px;padding:6px 4px;font-size:11px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:5px}',
      '.fin-reset-btn:active{background:var(--c-surface2);color:var(--c-text2)}'
    ].join('\n');
    document.head.appendChild(s);
  }

  function resetFinance(){
    if(!window.FinanceStore || typeof FinanceStore.resetAll!=='function'){
      if(window.showToast)showToast('Financiën zijn nog niet klaar');
      return;
    }
    var ok=window.confirm('Alle financiële gegevens van dit gezin wissen (maandplan, vaste lasten, transacties, spaardoelen)? Taken, agenda, recepten, boodschappen en voortgang blijven behouden.');
    if(!ok)return;
    FinanceStore.resetAll().then(function(){
      if(window.showToast)showToast('Financiën zijn opnieuw gestart ✓');
      if(typeof window.enterFinanceScreen==='function')window.enterFinanceScreen();
      else if(typeof window.renderFinance==='function')window.renderFinance();
    });
  }

  function ensure(){
    ensureStyles();
    var screen=document.getElementById('screen-finance');
    var tabs=screen&&screen.querySelector('.fin-tabs');
    if(!screen||!tabs)return false;
    var host=document.getElementById('fin-shell-actions');
    if(!host){
      host=document.createElement('div');
      host.id='fin-shell-actions';
      host.className='fin-shell-actions';
      host.innerHTML='<button type="button" class="fin-reset-btn" id="fin-reset-btn" title="Alleen financiële gegevens opnieuw beginnen"><span aria-hidden="true">↺</span><span>Verse start</span></button>';
      tabs.insertAdjacentElement('afterend',host);
    }
    var btn=document.getElementById('fin-reset-btn');
    if(btn&&!btn._financeShellWired){btn._financeShellWired=true;btn.onclick=resetFinance;}
    return true;
  }

  window.FinanceRuntimeShell={version:VERSION,ensure:ensure};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ensure);else ensure();
})();