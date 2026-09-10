'use strict';
// ============================================================
// FINANCE ANALYSIS POLISH v1.0.0
// STEP 8 feedback pass: richer depth, calm hero, premium controls + PDF action.
// Presentation only; FinanceAnalysisUI remains the render/data owner.
// ============================================================
(function(){
  if(window.FinanceAnalysisPolish)return;
  var VERSION='1.0.0';
  var STYLE_ID='finance-analysis-polish-style';
  var scheduled=false;

  function ensureStyles(){
    if(document.getElementById(STYLE_ID))return;
    var s=document.createElement('style');s.id=STYLE_ID;s.textContent=[
      '#fin-analyse.finance-analysis-owned{--fa2-shadow:0 14px 34px rgba(76,56,102,.09);background:radial-gradient(circle at 92% 2%,rgba(150,105,235,.13),transparent 28%),radial-gradient(circle at 4% 42%,rgba(83,178,157,.07),transparent 30%),linear-gradient(180deg,#fbfaf7 0%,#f8f6fa 46%,#fbfaf7 100%)!important}',
      'html[data-theme="dark"] #fin-analyse.finance-analysis-owned,html[data-theme$="-dark"] #fin-analyse.finance-analysis-owned{--fa2-shadow:0 18px 42px rgba(0,0,0,.30);background:radial-gradient(circle at 88% 3%,rgba(133,82,225,.22),transparent 28%),radial-gradient(circle at 4% 48%,rgba(58,147,132,.11),transparent 32%),linear-gradient(180deg,#090a17,#0d0c20 68%,#090a17)!important}',
      '#fin-analyse .fa2-card{border-color:rgba(112,90,134,.13);box-shadow:0 14px 34px rgba(76,56,102,.085);background:linear-gradient(155deg,rgba(255,255,255,.98),rgba(251,248,253,.96))}',
      'html[data-theme="dark"] #fin-analyse .fa2-card,html[data-theme$="-dark"] #fin-analyse .fa2-card{border-color:rgba(174,146,220,.16);background:linear-gradient(155deg,rgba(22,21,45,.98),rgba(15,15,34,.98))}',
      '#fin-analyse .fa2-overview{border-color:rgba(139,92,246,.18);box-shadow:0 18px 42px rgba(108,70,160,.12)}',
      '#fin-analyse .fa2-periodbar{background:linear-gradient(90deg,rgba(255,255,255,.88),rgba(246,241,252,.92));border-bottom-color:rgba(139,92,246,.10)}',
      '#fin-analyse .fa2-period-btn,#fin-analyse .fa2-ghost-btn{background:linear-gradient(180deg,rgba(255,255,255,.98),rgba(245,241,250,.98));border-color:rgba(123,101,143,.16);box-shadow:0 5px 13px rgba(72,55,91,.07);transition:transform .14s ease,box-shadow .14s ease,border-color .14s ease}',
      '#fin-analyse .fa2-period-btn:active,#fin-analyse .fa2-ghost-btn:active,#fin-analyse .fa2-chip:active,#fin-analyse .fa2-export-btn:active{transform:scale(.975)}',
      '#fin-analyse .fa2-chip{background:linear-gradient(180deg,rgba(255,255,255,.98),rgba(248,245,251,.98));border-color:rgba(123,101,143,.15);box-shadow:0 4px 10px rgba(72,55,91,.045)}',
      '#fin-analyse .fa2-chip.active{background:linear-gradient(135deg,#7d4fd5,#9e72ee);border-color:#8b5cf6;box-shadow:0 7px 16px rgba(125,79,213,.24)}',
      '#fin-analyse .fa2-hero{position:relative;overflow:hidden;min-height:164px;padding:19px 16px 17px;background:radial-gradient(circle at 82% 30%,rgba(255,255,255,.82) 0 7%,rgba(221,204,253,.58) 18%,rgba(221,204,253,0) 43%),radial-gradient(circle at 98% 100%,rgba(196,165,255,.42),transparent 42%),linear-gradient(125deg,#f4edff 0%,#ece3fb 36%,#f8f4fc 68%,#eef7f2 100%)!important}',
      '#fin-analyse .fa2-hero:before{content:"";position:absolute;right:-58px;top:-82px;width:230px;height:230px;border-radius:50%;border:1px solid rgba(139,92,246,.18);box-shadow:0 0 0 28px rgba(139,92,246,.035),0 0 0 60px rgba(139,92,246,.025);pointer-events:none}',
      '#fin-analyse .fa2-hero:after{content:"";position:absolute;right:24px;bottom:-58px;width:210px;height:106px;border-radius:50%;background:linear-gradient(90deg,rgba(111,174,151,.20),rgba(139,92,246,.28),rgba(255,255,255,0));filter:blur(18px);transform:rotate(-10deg);pointer-events:none}',
      '#fin-analyse .fa2-hero>*{position:relative;z-index:2}',
      '#fin-analyse .fa2-art{opacity:.30;right:8px;bottom:2px;transform:scale(.88);filter:saturate(.72)}',
      '#fin-analyse .fa2-eyebrow{color:#6f4aa4}.fa2-hero-title{color:#696174!important}.fa2-hero-value{color:#251f31!important;text-shadow:0 1px 0 rgba(255,255,255,.45)}',
      'html[data-theme="dark"] #fin-analyse .fa2-hero,html[data-theme$="-dark"] #fin-analyse .fa2-hero{background:radial-gradient(circle at 82% 30%,rgba(197,164,255,.16),transparent 34%),radial-gradient(circle at 96% 100%,rgba(80,171,145,.12),transparent 40%),linear-gradient(125deg,#2a1c49 0%,#1e1838 42%,#12152a 100%)!important}',
      'html[data-theme="dark"] #fin-analyse .fa2-eyebrow,html[data-theme$="-dark"] #fin-analyse .fa2-eyebrow{color:#cbb3f7}html[data-theme="dark"] #fin-analyse .fa2-hero-title,html[data-theme$="-dark"] #fin-analyse .fa2-hero-title{color:#b9b0c9!important}html[data-theme="dark"] #fin-analyse .fa2-hero-value,html[data-theme$="-dark"] #fin-analyse .fa2-hero-value{color:#fff!important;text-shadow:none}',
      '#fin-analyse .fa2-export-btn{position:absolute;right:14px;top:14px;z-index:5;height:34px;border:1px solid rgba(104,72,149,.18);border-radius:12px;padding:0 10px;display:inline-flex;align-items:center;gap:6px;background:linear-gradient(135deg,rgba(255,255,255,.94),rgba(243,235,255,.94));color:#68439f;font-size:9.5px;font-weight:950;box-shadow:0 7px 18px rgba(92,61,132,.12);cursor:pointer;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}',
      '#fin-analyse .fa2-export-btn svg{width:14px;height:14px;display:block}.fa2-export-btn[disabled]{opacity:.58;cursor:default}',
      '#fin-analyse .fa2-kpi{box-shadow:inset 0 1px 0 rgba(255,255,255,.72),0 6px 14px rgba(79,62,96,.055);border-color:rgba(100,81,117,.10)}',
      '#fin-analyse .fa2-kpi.income{background:linear-gradient(155deg,rgba(229,248,236,.96),rgba(251,253,250,.98))}#fin-analyse .fa2-kpi.expenses{background:linear-gradient(155deg,rgba(255,231,236,.96),rgba(255,250,250,.98))}#fin-analyse .fa2-kpi.savings{background:linear-gradient(155deg,rgba(240,232,255,.98),rgba(251,248,255,.98))}',
      '#fin-analyse .fa2-category-card{background:linear-gradient(150deg,rgba(255,255,255,.98),rgba(251,246,253,.96))}#fin-analyse .fa2-trend-card{background:linear-gradient(150deg,rgba(255,255,255,.98),rgba(245,249,255,.96))}',
      '#fin-analyse .fa2-insight{background:linear-gradient(145deg,rgba(249,246,252,.98),rgba(255,255,255,.98));box-shadow:inset 0 1px 0 rgba(255,255,255,.7)}#fin-analyse .fa2-assistant{background:linear-gradient(135deg,rgba(235,225,255,.92),rgba(246,250,248,.96))}',
      '#fin-analyse .fa2-icon,#fin-analyse .fa2-goal-icon{background:linear-gradient(145deg,rgba(248,244,252,.98),rgba(238,230,250,.98));box-shadow:inset 0 1px 0 rgba(255,255,255,.7)}',
      '#fin-analyse .fa2-mini:nth-child(1){background:linear-gradient(145deg,rgba(240,235,251,.96),rgba(255,255,255,.98))}#fin-analyse .fa2-mini:nth-child(2){background:linear-gradient(145deg,rgba(233,247,243,.96),rgba(255,255,255,.98))}#fin-analyse .fa2-mini:nth-child(3){background:linear-gradient(145deg,rgba(244,237,255,.96),rgba(255,255,255,.98))}#fin-analyse .fa2-mini:nth-child(4){background:linear-gradient(145deg,rgba(255,242,233,.96),rgba(255,255,255,.98))}',
      'html[data-theme="dark"] #fin-analyse .fa2-periodbar,html[data-theme$="-dark"] #fin-analyse .fa2-periodbar{background:linear-gradient(90deg,rgba(20,19,40,.96),rgba(31,25,51,.96))}html[data-theme="dark"] #fin-analyse .fa2-period-btn,html[data-theme$="-dark"] #fin-analyse .fa2-period-btn,html[data-theme="dark"] #fin-analyse .fa2-ghost-btn,html[data-theme$="-dark"] #fin-analyse .fa2-ghost-btn,html[data-theme="dark"] #fin-analyse .fa2-chip,html[data-theme$="-dark"] #fin-analyse .fa2-chip{background:linear-gradient(180deg,#22203f,#17172f);border-color:#332c51}html[data-theme="dark"] #fin-analyse .fa2-kpi,html[data-theme$="-dark"] #fin-analyse .fa2-kpi,html[data-theme="dark"] #fin-analyse .fa2-category-card,html[data-theme$="-dark"] #fin-analyse .fa2-category-card,html[data-theme="dark"] #fin-analyse .fa2-trend-card,html[data-theme$="-dark"] #fin-analyse .fa2-trend-card,html[data-theme="dark"] #fin-analyse .fa2-insight,html[data-theme$="-dark"] #fin-analyse .fa2-insight,html[data-theme="dark"] #fin-analyse .fa2-mini,html[data-theme$="-dark"] #fin-analyse .fa2-mini{background:linear-gradient(150deg,rgba(27,25,52,.98),rgba(17,17,36,.98))}',
      'html[data-theme="dark"] #fin-analyse .fa2-export-btn,html[data-theme$="-dark"] #fin-analyse .fa2-export-btn{background:linear-gradient(135deg,rgba(46,36,70,.94),rgba(31,28,54,.94));color:#d4c0f5;border-color:rgba(191,159,237,.18)}',
      '@media(max-width:390px){#fin-analyse .fa2-export-btn{right:10px;top:10px;padding:0 8px}.fa2-export-btn span{display:none}#fin-analyse .fa2-hero{min-height:158px}.fa2-hero-compare{max-width:68%!important}}'
    ].join('\n');document.head.appendChild(s);
  }

  function exportAnalysis(button){
    if(button&&button.disabled)return;
    var exporter=window.FinanceAnalysisExport;
    var ui=window.FinanceAnalysisUI;
    var model=ui&&typeof ui.getModel==='function'?ui.getModel():null;
    if(!exporter||typeof exporter.exportAndShare!=='function'||!model){
      if(window.showToast)showToast('Analyse-export is nog niet klaar');
      return;
    }
    if(button)button.disabled=true;
    Promise.resolve(exporter.exportAndShare(model)).catch(function(){}).finally(function(){if(button)button.disabled=false;});
  }

  function decorate(){
    scheduled=false;
    ensureStyles();
    var el=document.getElementById('fin-analyse');
    if(!el||!el.classList.contains('finance-analysis-owned'))return false;
    var hero=el.querySelector('.fa2-hero');
    if(hero&&!hero.querySelector('[data-fa-export]')){
      var btn=document.createElement('button');
      btn.type='button';btn.className='fa2-export-btn';btn.setAttribute('data-fa-export','');
      btn.title='Analyse als PDF delen';btn.setAttribute('aria-label','Analyse als PDF delen');
      btn.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 3v12"/><path d="m7 8 5-5 5 5"/><path d="M5 14v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5"/></svg><span>PDF delen</span>';
      btn.onclick=function(event){event.stopPropagation();exportAnalysis(btn);};
      hero.appendChild(btn);
    }
    if(window.FinanceRuntimeShell&&typeof FinanceRuntimeShell.ensure==='function')FinanceRuntimeShell.ensure();
    return true;
  }

  function schedule(){
    if(scheduled)return;scheduled=true;
    setTimeout(decorate,0);
    setTimeout(decorate,80);
  }

  function wrapUi(){
    var ui=window.FinanceAnalysisUI;
    if(!ui||ui.__step8PolishWrapped)return;
    ui.__step8PolishWrapped=true;
    if(typeof ui.render==='function'){
      var originalRender=ui.render;
      ui.render=function(){var result=originalRender.apply(this,arguments);schedule();return result;};
    }
    if(typeof ui.requestRender==='function'){
      var originalRequest=ui.requestRender;
      ui.requestRender=function(){var result=originalRequest.apply(this,arguments);schedule();return result;};
    }
  }

  function install(){
    ensureStyles();wrapUi();schedule();
    document.addEventListener('click',function(event){
      var target=event.target&&event.target.closest?event.target.closest('#fin-analyse button,#finance-native-tabs [data-fin-tab]'):null;
      if(target)schedule();
    },true);
    document.addEventListener('change',function(event){if(event.target&&event.target.closest&&event.target.closest('#fin-analyse'))schedule();},true);
    window.addEventListener('familyapp:finance:changed',schedule);
    window.addEventListener('familyapp:household-members-updated',schedule);
    [100,350,900,1800].forEach(function(delay){setTimeout(function(){wrapUi();decorate();},delay);});
  }

  window.FinanceAnalysisPolish={version:VERSION,install:install,decorate:decorate};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
