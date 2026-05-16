'use strict';
// ============================================================
// FINANCE NATIVE TABS v0.343
// Replaces legacy .fin-tabs layout with one stable native tabbar.
// This mirrors the successful task nav reset approach.
// ============================================================

(function(){
  var VERSION = '0.343';
  var STYLE_ID = 'finance-native-tabs-style';
  var NAV_ID = 'finance-native-tabs';
  var activeTab = 'maandplan';
  var tabs = [
    { id:'maandplan', label:'Maandplan', icon:'💳' },
    { id:'trans', label:'Transacties', icon:'📋' },
    { id:'analyse', label:'Analyse', icon:'📊' },
    { id:'sparen', label:'Sparen', icon:'🎯' }
  ];

  function ensureStyles(){
    if(document.getElementById(STYLE_ID)) return;
    var style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = [
      '#screen-finance{padding-top:0!important;overflow-x:hidden!important;background:var(--c-bg)!important}',
      '#screen-finance>.fin-tabs{display:none!important;height:0!important;min-height:0!important;max-height:0!important;overflow:hidden!important;margin:0!important;padding:0!important;border:0!important;position:static!important;top:auto!important}',
      '#'+NAV_ID+'{position:sticky!important;top:0!important;z-index:30!important;width:100%!important;background:rgba(255,255,255,.98)!important;border-bottom:1px solid var(--c-border)!important;box-shadow:0 5px 18px rgba(17,24,39,.045)!important;margin:0!important;padding:8px 0 7px!important;overflow-x:auto!important;overflow-y:hidden!important;-webkit-overflow-scrolling:touch!important;white-space:nowrap!important}',
      '#'+NAV_ID+'::-webkit-scrollbar{display:none!important}',
      '#'+NAV_ID+' .finance-native-track{display:flex!important;align-items:center!important;gap:10px!important;padding:0 16px!important;min-width:max-content!important}',
      '#'+NAV_ID+' .finance-native-tab{height:42px!important;border:0!important;border-radius:999px!important;background:var(--c-surface2)!important;color:var(--c-text2)!important;padding:0 16px!important;display:flex!important;align-items:center!important;justify-content:center!important;gap:7px!important;font-size:15px!important;font-weight:900!important;line-height:1!important;box-shadow:inset 0 0 0 1px rgba(17,24,39,.035)!important;white-space:nowrap!important;flex:0 0 auto!important}',
      '#'+NAV_ID+' .finance-native-tab.active{background:var(--c-primary)!important;color:#fff!important;box-shadow:0 7px 18px rgba(63,127,47,.20)!important}',
      '#'+NAV_ID+' .finance-native-icon{font-size:17px!important;line-height:1!important}',
      '#screen-finance .fin-panel{display:none!important;margin:0!important;padding:14px 16px 120px!important;box-sizing:border-box!important;overflow:visible!important}',
      '#screen-finance .fin-panel.active{display:block!important}',
      '#screen-finance .fin-panel>*:first-child{margin-top:0!important}',
      '#screen-finance [style*="linear-gradient"]{max-width:100%!important;box-sizing:border-box!important}',
      '@media(max-width:480px){#'+NAV_ID+'{top:0!important;padding-top:7px!important;padding-bottom:7px!important}#'+NAV_ID+' .finance-native-track{padding:0 14px!important;gap:9px!important}#'+NAV_ID+' .finance-native-tab{height:40px!important;font-size:14px!important;padding:0 14px!important}}'
    ].join('\n');
    document.head.appendChild(style);
  }

  function panelId(tab){ return 'fin-' + tab; }

  function getCurrentTab(){
    var activePanel = document.querySelector('#screen-finance .fin-panel.active');
    if(activePanel && activePanel.id && activePanel.id.indexOf('fin-') === 0) return activePanel.id.replace('fin-', '');
    return activeTab;
  }

  function activate(tab){
    activeTab = tab || activeTab;
    var screen = document.getElementById('screen-finance');
    if(!screen) return;

    screen.querySelectorAll('.fin-panel').forEach(function(panel){
      panel.classList.toggle('active', panel.id === panelId(activeTab));
    });

    screen.querySelectorAll('#'+NAV_ID+' .finance-native-tab').forEach(function(btn){
      btn.classList.toggle('active', btn.getAttribute('data-fin-tab') === activeTab);
    });

    try {
      if(activeTab === 'maandplan' && typeof window.renderFinance === 'function') window.renderFinance();
      if(activeTab === 'trans' && typeof window.renderFinance === 'function') window.renderFinance();
      if(activeTab === 'analyse' && typeof window.renderFinance === 'function') window.renderFinance();
      if(activeTab === 'sparen' && typeof window.renderSparen === 'function') window.renderSparen();
    } catch(error) {}
  }

  function buildNav(){
    var screen = document.getElementById('screen-finance');
    if(!screen) return;
    ensureStyles();

    var legacyTabs = screen.querySelector('.fin-tabs');
    var nav = document.getElementById(NAV_ID);
    if(!nav){
      nav = document.createElement('div');
      nav.id = NAV_ID;
      nav.innerHTML = '<div class="finance-native-track"></div>';
      if(legacyTabs && legacyTabs.parentNode) legacyTabs.parentNode.insertBefore(nav, legacyTabs);
      else screen.insertBefore(nav, screen.firstChild);
    }

    var track = nav.querySelector('.finance-native-track');
    track.innerHTML = tabs.map(function(t){
      return '<button type="button" class="finance-native-tab" data-fin-tab="'+t.id+'"><span class="finance-native-icon">'+t.icon+'</span><span>'+t.label+'</span></button>';
    }).join('');

    track.querySelectorAll('[data-fin-tab]').forEach(function(btn){
      btn.onclick = function(){ activate(btn.getAttribute('data-fin-tab')); };
    });

    activeTab = getCurrentTab();
    activate(activeTab);
  }

  function overrideLegacySetFinTab(){
    window.setFinTab = function(tab){
      activate(tab);
    };
  }

  function boot(){
    ensureStyles();
    buildNav();
    overrideLegacySetFinTab();
    [100, 300, 800, 1500, 2500].forEach(function(delay){
      setTimeout(function(){ ensureStyles(); buildNav(); overrideLegacySetFinTab(); }, delay);
    });
  }

  window.FinanceNativeTabs = { version: VERSION, boot: boot, activate: activate, buildNav: buildNav };
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
