'use strict';
// ============================================================
// FINANCE NATIVE TABS v0.345
// Stable finance tabbar + fallback renderers for missing legacy tabs.
// ============================================================

(function(){
  var VERSION = '0.345';
  var STYLE_ID = 'finance-native-tabs-style';
  var NAV_ID = 'finance-native-tabs';
  var activeTab = 'maandplan';
  var tabs = [
    { id:'maandplan', label:'Maandplan', icon:'💳' },
    { id:'trans', label:'Transacties', icon:'📋' },
    { id:'analyse', label:'Analyse', icon:'📊' },
    { id:'sparen', label:'Sparen', icon:'🎯' }
  ];

  function money(n){ return '€ '+Number(n || 0).toLocaleString('nl-NL', { maximumFractionDigits: 0 }); }
  function arr(name){ return Array.isArray(window[name]) ? window[name] : []; }

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
      '.finance-empty-card,.finance-mini-card,.finance-row-card{background:var(--c-surface)!important;border:1px solid var(--c-border)!important;border-radius:18px!important;box-shadow:0 5px 16px rgba(17,24,39,.045)!important}',
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

  function ensurePanel(tab){
    var screen = document.getElementById('screen-finance');
    if(!screen) return null;
    var id = panelId(tab);
    var panel = document.getElementById(id);
    if(!panel){
      panel = document.createElement('div');
      panel.id = id;
      panel.className = 'fin-panel';
      screen.appendChild(panel);
    }
    return panel;
  }

  function renderTransactionsFallback(){
    var el = ensurePanel('trans');
    if(!el) return;
    var trans = arr('transData').slice();
    var extra = arr('extraIncome').map(function(i){ return { name:i.name || 'Extra inkomen', cat:i.cat || 'Inkomen', amount:Number(i.amount || 0), who:i.who || window.myName || 'Gezin', date:i.date || '', positive:true }; });
    var all = trans.concat(extra).sort(function(a,b){ return String(b.date || '').localeCompare(String(a.date || '')); });
    if(!all.length){
      el.innerHTML = '<div class="finance-empty-card" style="padding:24px;text-align:center;color:var(--c-text2)"><div style="font-size:34px;margin-bottom:8px">📋</div><b>Geen transacties</b><div style="font-size:13px;margin-top:4px">Voeg inkomsten of uitgaven toe om ze hier te zien.</div></div>';
      return;
    }
    el.innerHTML = '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px"><h2 style="font-size:20px;margin:0;color:var(--c-text)">Transacties</h2><button onclick="openAdd(\'trans\')" style="border:0;background:var(--c-primary);color:#fff;border-radius:999px;padding:8px 14px;font-weight:900">+ Nieuw</button></div>'
      + all.map(function(t){
        var amount = Number(t.amount || 0);
        var positive = t.positive || amount > 0;
        return '<div class="finance-row-card" style="display:flex;align-items:center;gap:12px;padding:13px;margin-bottom:9px">'
          +'<div style="width:40px;height:40px;border-radius:14px;background:'+(positive?'#dcfce7':'#fee2e2')+';display:flex;align-items:center;justify-content:center;font-size:18px">'+(positive?'💚':'💸')+'</div>'
          +'<div style="flex:1;min-width:0"><div style="font-size:14px;font-weight:900;color:var(--c-text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+(t.name || 'Transactie')+'</div><div style="font-size:12px;color:var(--c-text2);margin-top:2px">'+(t.cat || 'Overig')+' · '+(t.who || '')+' · '+(t.date || '')+'</div></div>'
          +'<div style="font-size:15px;font-weight:950;color:'+(positive?'#16a34a':'#dc2626')+'">'+(positive?'+':'-')+money(Math.abs(amount))+'</div>'
          +'</div>';
      }).join('');
  }

  function renderAnalysisFallback(){
    var el = ensurePanel('analyse');
    if(!el) return;
    var trans = arr('transData');
    var income = arr('extraIncome').reduce(function(s,i){ return s + Number(i.amount || 0); }, 0);
    var expenses = trans.filter(function(t){ return Number(t.amount || 0) < 0; }).reduce(function(s,t){ return s + Math.abs(Number(t.amount || 0)); }, 0);
    var positive = trans.filter(function(t){ return Number(t.amount || 0) > 0; }).reduce(function(s,t){ return s + Number(t.amount || 0); }, 0);
    var balance = positive + income - expenses;
    var byCat = {};
    trans.forEach(function(t){
      var amount = Number(t.amount || 0);
      if(amount < 0){ byCat[t.cat || 'Overig'] = (byCat[t.cat || 'Overig'] || 0) + Math.abs(amount); }
    });
    var cats = Object.keys(byCat).sort(function(a,b){ return byCat[b] - byCat[a]; }).slice(0,5);
    el.innerHTML = '<h2 style="font-size:20px;margin:0 0 12px;color:var(--c-text)">Analyse</h2>'
      +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px">'
      +'<div class="finance-mini-card" style="padding:14px"><div style="font-size:12px;color:var(--c-text2);font-weight:800">Inkomsten</div><div style="font-size:22px;font-weight:950;color:#16a34a">'+money(positive+income)+'</div></div>'
      +'<div class="finance-mini-card" style="padding:14px"><div style="font-size:12px;color:var(--c-text2);font-weight:800">Uitgaven</div><div style="font-size:22px;font-weight:950;color:#dc2626">'+money(expenses)+'</div></div>'
      +'<div class="finance-mini-card" style="grid-column:1/-1;padding:14px"><div style="font-size:12px;color:var(--c-text2);font-weight:800">Balans</div><div style="font-size:26px;font-weight:950;color:'+(balance>=0?'#16a34a':'#dc2626')+'">'+money(balance)+'</div></div>'
      +'</div>'
      +'<div class="finance-mini-card" style="padding:14px"><div style="font-size:15px;font-weight:950;margin-bottom:10px;color:var(--c-text)">Grootste categorieën</div>'
      +(cats.length ? cats.map(function(cat){
        var pct = expenses ? Math.round(byCat[cat] / expenses * 100) : 0;
        return '<div style="margin-bottom:10px"><div style="display:flex;justify-content:space-between;font-size:13px;font-weight:850;color:var(--c-text)"><span>'+cat+'</span><span>'+money(byCat[cat])+'</span></div><div style="height:7px;background:var(--c-surface2);border-radius:99px;overflow:hidden;margin-top:5px"><div style="height:100%;width:'+pct+'%;background:var(--c-primary);border-radius:99px"></div></div></div>';
      }).join('') : '<div style="font-size:13px;color:var(--c-text2);padding:8px 0">Nog geen uitgaven om te analyseren.</div>')
      +'</div>';
  }

  function renderActiveTab(){
    try {
      if(activeTab === 'maandplan' && typeof window.renderFinance === 'function') window.renderFinance();
      if(activeTab === 'trans') {
        if(typeof window.renderFinance === 'function') window.renderFinance();
        var transPanel = document.getElementById('fin-trans');
        if(!transPanel || !transPanel.innerHTML.trim()) renderTransactionsFallback();
      }
      if(activeTab === 'analyse') {
        if(typeof window.renderFinance === 'function') window.renderFinance();
        var analysePanel = document.getElementById('fin-analyse');
        if(!analysePanel || !analysePanel.innerHTML.trim()) renderAnalysisFallback();
      }
      if(activeTab === 'sparen' && typeof window.renderSparen === 'function') window.renderSparen();
    } catch(error) {
      if(activeTab === 'trans') renderTransactionsFallback();
      if(activeTab === 'analyse') renderAnalysisFallback();
    }
  }

  function activate(tab){
    activeTab = tab || activeTab;
    var screen = document.getElementById('screen-finance');
    if(!screen) return;
    tabs.forEach(function(t){ ensurePanel(t.id); });
    screen.querySelectorAll('.fin-panel').forEach(function(panel){ panel.classList.toggle('active', panel.id === panelId(activeTab)); });
    screen.querySelectorAll('#'+NAV_ID+' .finance-native-tab').forEach(function(btn){ btn.classList.toggle('active', btn.getAttribute('data-fin-tab') === activeTab); });
    renderActiveTab();
  }

  function buildNav(){
    var screen = document.getElementById('screen-finance');
    if(!screen) return;
    ensureStyles();
    tabs.forEach(function(t){ ensurePanel(t.id); });
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
    track.innerHTML = tabs.map(function(t){ return '<button type="button" class="finance-native-tab" data-fin-tab="'+t.id+'"><span class="finance-native-icon">'+t.icon+'</span><span>'+t.label+'</span></button>'; }).join('');
    track.querySelectorAll('[data-fin-tab]').forEach(function(btn){ btn.onclick = function(){ activate(btn.getAttribute('data-fin-tab')); }; });
    activeTab = getCurrentTab();
    activate(activeTab);
  }

  function overrideLegacySetFinTab(){ window.setFinTab = function(tab){ activate(tab); }; }

  function boot(){
    ensureStyles(); buildNav(); overrideLegacySetFinTab();
    [100,300,800,1500,2500].forEach(function(delay){ setTimeout(function(){ ensureStyles(); buildNav(); overrideLegacySetFinTab(); }, delay); });
  }

  window.FinanceNativeTabs = { version: VERSION, boot: boot, activate: activate, buildNav: buildNav };
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
