'use strict';
// ============================================================
// FINANCE RUNTIME SHELL v1.0.0
// Stable finance-shell controls that live outside renderable .fin-panel nodes.
// ============================================================
(function(){
  if(window.FinanceRuntimeShell)return;
  var VERSION='1.0.0';

  function ensureStyles(){
    if(document.getElementById('finance-runtime-shell-style'))return;
    var s=document.createElement('style');
    s.id='finance-runtime-shell-style';
    s.textContent=[
      '.fin-shell-actions{padding:10px 16px 4px;background:var(--c-bg)}',
      '.fin-reset-card{border:1px solid rgba(220,38,38,.14);background:linear-gradient(180deg,var(--c-surface),rgba(254,242,242,.72));border-radius:18px;padding:13px 14px;box-shadow:0 4px 14px rgba(17,24,39,.035)}',
      '.fin-reset-row{display:flex;align-items:center;gap:10px}',
      '.fin-reset-icon{width:36px;height:36px;border-radius:12px;background:rgba(220,38,38,.08);display:grid;place-items:center;flex:0 0 auto;color:#b91c1c;font-size:18px;font-weight:900}',
      '.fin-reset-copy{min-width:0;flex:1}',
      '.fin-reset-copy b{display:block;font-size:13px;color:var(--c-text)}',
      '.fin-reset-copy span{display:block;font-size:11px;line-height:1.4;color:var(--c-text2);margin-top:2px}',
      '.fin-reset-btn{margin-top:10px;width:100%;border:1px solid rgba(220,38,38,.22);background:rgba(220,38,38,.07);color:#b91c1c;border-radius:13px;padding:10px 12px;font-size:12.5px;font-weight:900;cursor:pointer}'
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
      host.innerHTML='<div class="fin-reset-card"><div class="fin-reset-row"><div class="fin-reset-icon">↺</div><div class="fin-reset-copy"><b>Verse start</b><span>Begin opnieuw met de financiële administratie zonder andere FamilyApp-data te wissen.</span></div></div><button type="button" class="fin-reset-btn" id="fin-reset-btn">Financiën opnieuw beginnen</button></div>';
      tabs.insertAdjacentElement('afterend',host);
    }
    var btn=document.getElementById('fin-reset-btn');
    if(btn&&!btn._financeShellWired){btn._financeShellWired=true;btn.onclick=resetFinance;}
    return true;
  }

  window.FinanceRuntimeShell={version:VERSION,ensure:ensure};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ensure);else ensure();
})();