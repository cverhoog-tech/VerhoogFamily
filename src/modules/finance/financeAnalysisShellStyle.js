'use strict';
// Premium Finance tab shell used by STEP 8 Analysis.
// Presentation only: no Finance state or persistence ownership.
(function(){
  if(window.__financeAnalysisShellStyle)return;
  window.__financeAnalysisShellStyle=true;
  var id='finance-analysis-shell-style';
  if(document.getElementById(id))return;
  var s=document.createElement('style');s.id=id;s.textContent=[
    '#finance-native-tabs{position:sticky!important;top:0!important;z-index:30!important;width:100%!important;margin:0!important;padding:0!important;background:var(--c-surface)!important;border:0!important;border-bottom:1px solid var(--c-border)!important;box-shadow:none!important;overflow:hidden!important;white-space:normal!important}',
    '#finance-native-tabs .finance-native-track{width:100%!important;min-width:0!important;display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;align-items:stretch!important;gap:0!important;padding:0 8px!important}',
    '#finance-native-tabs .finance-native-tab{position:relative!important;width:100%!important;min-width:0!important;height:48px!important;padding:0 4px!important;border:0!important;border-radius:0!important;background:transparent!important;color:var(--c-text2)!important;box-shadow:none!important;font-size:11.5px!important;font-weight:750!important;display:flex!important;align-items:center!important;justify-content:center!important;gap:0!important;white-space:nowrap!important}',
    '#finance-native-tabs .finance-native-tab.active{background:transparent!important;color:var(--c-text)!important;box-shadow:none!important;font-weight:900!important}',
    '#finance-native-tabs .finance-native-tab.active:after{content:"";position:absolute;left:18%;right:18%;bottom:0;height:3px;border-radius:3px 3px 0 0;background:#9365e8;box-shadow:0 -2px 10px rgba(147,101,232,.24)}',
    '#finance-native-tabs .finance-native-icon{display:none!important}',
    '#screen-finance.finance-analysis-active #finance-native-tabs{background:#fbfaf7!important;border-bottom-color:#e9e3ef!important}',
    'html[data-theme="dark"] #screen-finance.finance-analysis-active #finance-native-tabs,html[data-theme$="-dark"] #screen-finance.finance-analysis-active #finance-native-tabs{background:#090a17!important;border-bottom-color:#292442!important}',
    '#screen-finance.finance-analysis-active #finance-native-tabs .finance-native-tab{color:#8e879b!important}',
    '#screen-finance.finance-analysis-active #finance-native-tabs .finance-native-tab.active{color:var(--c-text)!important}',
    '@media(max-width:360px){#finance-native-tabs .finance-native-tab{font-size:10.5px!important}#finance-native-tabs .finance-native-track{padding:0 5px!important}}'
  ].join('\n');
  document.head.appendChild(s);
})();
