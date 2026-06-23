'use strict';
// FINANCE LAYOUT REPAIR v0.342
(function(){
  var VERSION = '0.342';
  var STYLE_ID = 'finance-layout-repair-style';

  function ensureStyles(){
    var old = document.getElementById(STYLE_ID);
    if(old && old.parentNode) old.parentNode.removeChild(old);
    var style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = [
      '#screen-finance{padding-top:0!important;padding-bottom:96px!important;background:var(--c-bg)!important;overflow-x:hidden!important}',
      '#screen-finance .fin-tabs{position:sticky!important;top:0!important;z-index:18!important;display:flex!important;align-items:center!important;background:rgba(255,255,255,.98)!important;border-bottom:1px solid var(--c-border)!important;box-shadow:0 6px 18px rgba(17,24,39,.04)!important;margin:0!important;padding:0!important;overflow-x:auto!important;overflow-y:hidden!important;-webkit-overflow-scrolling:touch!important}',
      '#screen-finance .fin-tabs::-webkit-scrollbar{display:none!important}',
      '#screen-finance .ftab{flex:0 0 auto!important;min-width:max-content!important;height:45px!important;padding:0 17px!important;border:0!important;border-bottom:3px solid transparent!important;background:transparent!important;color:var(--c-text2)!important;font-size:15px!important;font-weight:850!important;display:flex!important;align-items:center!important;justify-content:center!important;white-space:nowrap!important;line-height:1!important}',
      '#screen-finance .ftab.active{color:var(--c-primary)!important;border-bottom-color:var(--c-primary)!important;background:rgba(63,127,47,.045)!important}',
      '#screen-finance .fin-panel{display:none!important;padding:12px 16px 120px!important;margin:0!important;box-sizing:border-box!important;overflow:visible!important}',
      '#screen-finance .fin-panel.active{display:block!important}',
      '#screen-finance .fin-panel>*:first-child{margin-top:0!important}',
      '#screen-finance #fin-maandplan,#screen-finance #fin-trans,#screen-finance #fin-analyse,#screen-finance #fin-sparen{padding-top:12px!important}',
      '#screen-finance #fin-maandplan>div:first-child{margin-top:0!important;border-radius:22px!important;overflow:hidden!important;box-shadow:0 10px 24px rgba(63,127,47,.14)!important}',
      '#screen-finance [style*="linear-gradient"]{max-width:100%!important;box-sizing:border-box!important}',
      '@media(max-width:480px){#screen-finance .fin-tabs{top:0!important}#screen-finance .ftab{font-size:14px!important;padding:0 15px!important;height:45px!important}}'
    ].join('\n');
    document.head.appendChild(style);
  }

  function normalizeFinanceDom(){
    var screen = document.getElementById('screen-finance');
    if(!screen) return;
    screen.style.paddingTop = '0px';
    var tabs = screen.querySelector('.fin-tabs');
    if(tabs){ tabs.style.top = '0px'; tabs.style.marginTop = '0px'; }
  }

  function boot(){
    ensureStyles();
    normalizeFinanceDom();
    [100,300,800,1500,2500].forEach(function(delay){ setTimeout(function(){ ensureStyles(); normalizeFinanceDom(); }, delay); });
  }

  window.FinanceLayoutRepair = { version: VERSION, boot: boot };
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
