'use strict';
// ============================================================
// FINANCE MAANDPLAN GROUPS v1.1.1
// Presentation-only grouping. FinanceStore.monthlySummary is the sole owner
// of disposable-income and monthly finance calculations.
// ============================================================
(function(){
  if(window.FinanceMaandplanGroups)return;
  var VERSION='1.1.1';
  var STORAGE_KEY='familyapp_finance_maandplan_groups_v1';
  var originalRender=null;

  function text(el){return String(el&&el.textContent||'').replace(/\s+/g,' ').trim();}
  function readState(){try{return Object.assign({transactions:true,oneoff:true,fixed:true},JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}'));}catch(e){return{transactions:true,oneoff:true,fixed:true};}}
  function saveState(v){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(v));}catch(e){}}
  function euro(v){return '€ '+Math.abs(Number(v)||0).toLocaleString('nl-NL',{minimumFractionDigits:0,maximumFractionDigits:2});}
  function ym(){var y=typeof window.mpYear==='number'?window.mpYear:new Date().getFullYear();var m=typeof window.mpMonth==='number'?window.mpMonth:new Date().getMonth();return y+'-'+String(m+1).padStart(2,'0');}
  function monthSummary(){
    if(!window.FinanceStore||typeof FinanceStore.monthlySummary!=='function')return null;
    return FinanceStore.monthlySummary(typeof window.mpYear==='number'?window.mpYear:undefined,typeof window.mpMonth==='number'?window.mpMonth:undefined);
  }

  function ensureStyles(){
    if(document.getElementById('finance-maandplan-groups-style'))return;
    var s=document.createElement('style');s.id='finance-maandplan-groups-style';s.textContent=[
      '.mp-groups{padding:12px 14px 22px;display:flex;flex-direction:column;gap:10px}',
      '.mp-group{background:var(--c-surface);border:1px solid var(--c-border);border-radius:18px;overflow:hidden;box-shadow:0 3px 12px rgba(17,24,39,.035)}',
      '.mp-group-toggle{width:100%;display:flex;align-items:center;gap:11px;border:0;background:var(--c-surface);color:var(--c-text);padding:13px 14px;min-height:66px;text-align:left;cursor:pointer}',
      '.mp-group-toggle:active{transform:none}',
      '.mp-group-icon{width:38px;height:38px;border-radius:12px;background:var(--c-surface2);display:grid;place-items:center;font-size:18px;flex:0 0 auto}',
      '.mp-group-copy{flex:1;min-width:0;display:flex;flex-direction:column;align-items:flex-start;justify-content:center;line-height:1.15}',
      '.mp-group-title{display:block;font-size:14px;font-weight:900;line-height:1.2;color:var(--c-text)}',
      '.mp-group-sub{display:block;font-size:10.5px;font-weight:500;color:var(--c-text3,var(--c-text2));margin-top:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}',
      '.mp-group-total{font-size:13px;font-weight:900;white-space:nowrap;margin-left:5px;align-self:center}',
      '.mp-group-chevron{width:25px;height:25px;border-radius:9px;background:var(--c-surface2);display:grid;place-items:center;color:var(--c-text2);font-size:15px;font-weight:900;transition:transform .18s ease;align-self:center}',
      '.mp-group.collapsed .mp-group-chevron{transform:rotate(-90deg)}',
      '.mp-group-body{border-top:1px solid var(--c-border);background:var(--c-bg)}',
      '.mp-group.collapsed .mp-group-body{display:none}',
      '.mp-group-body>.mp-tx-card{margin:0;border:0;border-radius:0;box-shadow:none;background:transparent}',
      '.mp-group-body>.mp-tx-card .mp-tx-head{display:none}',
      '.mp-group-body>.mp-tx-card .mp-tx-more{margin-bottom:2px}',
      '.mp-group-body>div{box-sizing:border-box}',
      '.mp-group-body .mp-unified-action{min-height:38px!important;border-radius:12px!important;padding:9px 12px!important;font-size:12px!important;font-weight:850!important;letter-spacing:0!important;box-shadow:none!important}',
      '.mp-group-body .mp-unified-icon-action{width:32px!important;height:32px!important;min-height:32px!important;border-radius:10px!important;padding:0!important;display:inline-grid!important;place-items:center!important}',
      '.mp-group-body input,.mp-group-body select{border-radius:11px!important}'
    ].join('\n');document.head.appendChild(s);
  }
  function classifyButtons(root){Array.prototype.forEach.call(root.querySelectorAll('button'),function(btn){if(btn.classList.contains('mp-group-toggle'))return;var t=text(btn);if(t==='✕'||t==='×'||t==='🗑'||t==='🗑️'||t==='✓')btn.classList.add('mp-unified-icon-action');else btn.classList.add('mp-unified-action');});}
  function summary(){
    var s=monthSummary();if(!s)return null;
    var oneCount=(window.extraIncome||[]).filter(function(t){return String(t&&t.date||'').slice(0,7)===ym();}).length;
    var fixedCount=(window.vasteLasten||[]).length;
    return{transactions:{count:s.transactionCount||0,total:s.transactionExpenses||0,sub:(s.transactionCount||0)+' transactie'+((s.transactionCount||0)===1?'':'s')+' deze maand'},oneoff:{count:oneCount,total:s.extraExpenses||0,sub:oneCount+' incidentele posten deze maand'},fixed:{count:fixedCount,total:s.fixedExpenses||0,sub:fixedCount+' vaste lasten'}};
  }

  function syncDisposableHero(panel){
    var s=monthSummary();if(!s)return false;
    var label=Array.prototype.slice.call(panel.querySelectorAll('div')).find(function(el){return text(el)==='Vrij besteedbaar';});
    if(!label)return false;
    var copy=label.parentElement,hero=copy&&copy.parentElement;if(!copy||!hero)return false;
    var value=Array.prototype.slice.call(copy.children).find(function(el){return /^€\s/.test(text(el));});
    var positive=Number(s.disposable)>=0,color=positive?'#16a34a':'#dc2626';
    if(value){value.textContent='€ '+Math.abs(Number(s.disposable)||0).toLocaleString('nl-NL');value.style.color=color;}
    label.style.color=color;hero.style.background=positive?'#dcfce7':'#fee2e2';
    var warning=copy.querySelector('[data-finance-disposable-warning]');
    if(!positive&&!warning){warning=document.createElement('div');warning.dataset.financeDisposableWarning='1';warning.style.cssText='font-size:11px;color:#dc2626;margin-top:2px';warning.textContent='⚠️ Let op: meer uitgaven dan inkomen!';copy.appendChild(warning);}else if(warning)warning.style.display=positive?'none':'';
    var detail=panel.querySelector('[data-finance-transaction-impact]');
    if(!detail){
      detail=document.createElement('div');detail.dataset.financeTransactionImpact='1';detail.style.cssText='display:flex;justify-content:space-between;align-items:center;padding:8px 12px;background:var(--c-surface2);border-radius:10px;margin-top:6px';
      detail.innerHTML='<div><div style="font-size:13px;font-weight:600;color:var(--c-text)">Transacties</div><div data-finance-transaction-count style="font-size:11px;color:var(--c-text2)"></div></div><div data-finance-transaction-total style="font-size:15px;font-weight:700;color:#dc2626"></div>';
      var overview=hero.nextElementSibling;if(overview)overview.appendChild(detail);
    }
    var count=detail.querySelector('[data-finance-transaction-count]'),total=detail.querySelector('[data-finance-transaction-total]');
    if(count)count.textContent=(s.transactionCount||0)+' transactie'+((s.transactionCount||0)===1?'':'s')+' deze maand';
    if(total)total.textContent=(s.transactionExpenses?'- '+euro(s.transactionExpenses):euro(0));
    detail.style.display=(s.transactionCount||0)?'flex':'none';
    return true;
  }

  function makeGroup(key,icon,title,sub,total,nodes,state){var group=document.createElement('section');group.className='mp-group'+(state[key]?'':' collapsed');group.dataset.group=key;var toggle=document.createElement('button');toggle.type='button';toggle.className='mp-group-toggle';toggle.setAttribute('aria-expanded',state[key]?'true':'false');toggle.innerHTML='<span class="mp-group-icon">'+icon+'</span><span class="mp-group-copy"><span class="mp-group-title">'+title+'</span><span class="mp-group-sub">'+sub+'</span></span><span class="mp-group-total">'+total+'</span><span class="mp-group-chevron">⌄</span>';var body=document.createElement('div');body.className='mp-group-body';nodes.forEach(function(n){if(n)body.appendChild(n);});classifyButtons(body);toggle.onclick=function(){state[key]=!state[key];saveState(state);group.classList.toggle('collapsed',!state[key]);toggle.setAttribute('aria-expanded',state[key]?'true':'false');};group.appendChild(toggle);group.appendChild(body);return group;}
  function directHeader(panel,pattern){return Array.prototype.slice.call(panel.children).find(function(el){return pattern.test(text(el));})||null;}
  function collectRange(start,stop){var out=[],node=start;while(node&&node!==stop){var next=node.nextSibling;out.push(node);node=next;}return out;}

  function apply(){
    var canonical=monthSummary();if(!canonical)return false;
    ensureStyles();var panel=document.getElementById('fin-maandplan');if(!panel)return false;syncDisposableHero(panel);
    var old=panel.querySelector(':scope > .mp-groups');if(old){var sumExisting=summary();if(!sumExisting)return false;var tg=old.querySelector('[data-group="transactions"] .mp-group-total');if(tg)tg.textContent=sumExisting.transactions.total?'- '+euro(sumExisting.transactions.total):euro(0);return true;}
    var tx=document.getElementById('mp-transactions-summary');if(!tx||tx.parentNode!==panel)return false;
    var one=directHeader(panel,/^Eenmalig deze maand\b/),fixed=directHeader(panel,/^Vaste lasten\b/);if(!one||!fixed)return false;
    var children=Array.prototype.slice.call(panel.children);if(children.indexOf(one)>children.indexOf(fixed)){var oneBlock=collectRange(one,null),fixedIndex=oneBlock.indexOf(fixed);if(fixedIndex>=0)oneBlock=oneBlock.slice(0,fixedIndex);oneBlock.forEach(function(n){if(n&&n.parentNode===panel)panel.insertBefore(n,fixed);});}
    one=directHeader(panel,/^Eenmalig deze maand\b/);fixed=directHeader(panel,/^Vaste lasten\b/);if(!one||!fixed)return false;
    var oneNodes=collectRange(one.nextSibling,fixed).filter(function(n){return n!==tx&&n.id!=='mp-transactions-summary';});var fixedNodes=collectRange(fixed.nextSibling,null).filter(function(n){return n!==tx&&n.id!=='mp-transactions-summary';});
    var groups=document.createElement('div');groups.className='mp-groups';panel.insertBefore(groups,one);if(one.parentNode===panel)panel.removeChild(one);if(fixed.parentNode===panel)panel.removeChild(fixed);
    var st=readState(),sum=summary();if(!sum)return false;groups.appendChild(makeGroup('transactions','💳','Transacties',sum.transactions.sub,sum.transactions.total?'- '+euro(sum.transactions.total):euro(0),[tx],st));groups.appendChild(makeGroup('oneoff','🧾','Eenmalige rekeningen',sum.oneoff.sub,sum.oneoff.total?'- '+euro(sum.oneoff.total):euro(0),oneNodes,st));groups.appendChild(makeGroup('fixed','🏠','Vaste lasten',sum.fixed.sub,sum.fixed.total?'- '+euro(sum.fixed.total):euro(0),fixedNodes,st));return true;
  }
  function install(){if(typeof window.renderMaandplan!=='function'||window.renderMaandplan._financeGroupsWrapped)return false;originalRender=window.renderMaandplan;function wrapped(){var result=originalRender.apply(this,arguments);apply();return result;}wrapped._financeGroupsWrapped=true;wrapped._original=originalRender;window.renderMaandplan=wrapped;apply();return true;}
  window.addEventListener('familyapp:finance:changed',function(){apply();});
  window.FinanceMaandplanGroups={version:VERSION,install:install,apply:apply,monthSummary:monthSummary};
})();