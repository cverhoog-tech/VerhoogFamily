'use strict';
// ============================================================
// FINANCE MAANDPLAN GROUPS v1.0.2
// Presentation-only grouping of the three operational month-plan areas:
// 1. Transactions, 2. One-off bills, 3. Fixed costs.
// Existing FinanceStore data + legacy actions remain authoritative.
// ============================================================
(function(){
  if(window.FinanceMaandplanGroups)return;
  var VERSION='1.0.2';
  var STORAGE_KEY='familyapp_finance_maandplan_groups_v1';
  var originalRender=null;

  function text(el){return String(el&&el.textContent||'').replace(/\s+/g,' ').trim();}
  function readState(){
    try{return Object.assign({transactions:true,oneoff:true,fixed:true},JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}'));}
    catch(e){return {transactions:true,oneoff:true,fixed:true};}
  }
  function saveState(v){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(v));}catch(e){}}
  function euro(v){return '€ '+Math.abs(Number(v)||0).toLocaleString('nl-NL',{minimumFractionDigits:0,maximumFractionDigits:2});}
  function ym(){var y=typeof window.mpYear==='number'?window.mpYear:new Date().getFullYear();var m=typeof window.mpMonth==='number'?window.mpMonth:new Date().getMonth();return y+'-'+String(m+1).padStart(2,'0');}

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
      '.mp-group-body input,.mp-group-body select{border-radius:11px!important}',
      '.mp-group-body [style*="border-radius:20px"]{border-radius:12px!important}',
      '.mp-group-body [style*="border-radius:10px"],.mp-group-body [style*="border-radius:12px"]{border-radius:12px!important}',
      '.mp-group-body [style*="background:var(--c-surface)"]{background:var(--c-surface)!important}',
      '.mp-group-body [style*="background:var(--c-surface2)"]{background:var(--c-surface2)!important}'
    ].join('\n');document.head.appendChild(s);
  }

  function classifyButtons(root){
    Array.prototype.forEach.call(root.querySelectorAll('button'),function(btn){
      if(btn.classList.contains('mp-group-toggle'))return;
      var t=text(btn);
      if(t==='✕'||t==='×'||t==='🗑'||t==='🗑️'||t==='✓')btn.classList.add('mp-unified-icon-action');
      else btn.classList.add('mp-unified-action');
    });
  }

  function summary(){
    var key=ym();
    var tx=(window.transData||[]).filter(function(t){return String(t&&t.date||'').slice(0,7)===key;});
    var one=(window.extraIncome||[]).filter(function(t){return String(t&&t.date||'').slice(0,7)===key;});
    var fixed=window.vasteLasten||[];
    var txOut=tx.filter(function(t){return Number(t.amount)<0;}).reduce(function(s,t){return s+Math.abs(Number(t.amount)||0);},0);
    var oneOut=one.filter(function(t){return Number(t.amount)<0;}).reduce(function(s,t){return s+Math.abs(Number(t.amount)||0);},0);
    var fixedTotal=fixed.reduce(function(s,t){return s+Math.abs(Number(t&&t.amount)||0);},0);
    return {
      transactions:{count:tx.length,total:txOut,sub:tx.length+' transactie'+(tx.length===1?'':'s')+' deze maand'},
      oneoff:{count:one.length,total:oneOut,sub:one.length+' eenmalige post'+(one.length===1?'':'en')+' deze maand'},
      fixed:{count:fixed.length,total:fixedTotal,sub:fixed.length+' vaste '+(fixed.length===1?'last':'lasten')}
    };
  }

  function makeGroup(key,icon,title,sub,total,nodes,state){
    var group=document.createElement('section');group.className='mp-group'+(state[key]?'':' collapsed');group.dataset.group=key;
    var toggle=document.createElement('button');toggle.type='button';toggle.className='mp-group-toggle';toggle.setAttribute('aria-expanded',state[key]?'true':'false');
    toggle.innerHTML='<span class="mp-group-icon">'+icon+'</span><span class="mp-group-copy"><span class="mp-group-title">'+title+'</span><span class="mp-group-sub">'+sub+'</span></span><span class="mp-group-total">'+total+'</span><span class="mp-group-chevron">⌄</span>';
    var body=document.createElement('div');body.className='mp-group-body';
    nodes.forEach(function(n){if(n)body.appendChild(n);});
    classifyButtons(body);
    toggle.onclick=function(){
      state[key]=!state[key];saveState(state);group.classList.toggle('collapsed',!state[key]);toggle.setAttribute('aria-expanded',state[key]?'true':'false');
    };
    group.appendChild(toggle);group.appendChild(body);return group;
  }

  function directHeader(panel,pattern){
    return Array.prototype.slice.call(panel.children).find(function(el){return pattern.test(text(el));})||null;
  }

  function collectRange(start,stop){
    var out=[],node=start;
    while(node&&node!==stop){var next=node.nextSibling;out.push(node);node=next;}
    return out;
  }

  function apply(){
    ensureStyles();
    var panel=document.getElementById('fin-maandplan');if(!panel)return false;
    var old=panel.querySelector(':scope > .mp-groups');
    if(old)return true;

    var tx=document.getElementById('mp-transactions-summary');
    if(!tx||tx.parentNode!==panel)return false;
    var one=directHeader(panel,/^Eenmalig deze maand\b/);
    var fixed=directHeader(panel,/^Vaste lasten\b/);
    if(!one||!fixed)return false;

    var children=Array.prototype.slice.call(panel.children);
    if(children.indexOf(one)>children.indexOf(fixed)){
      var oneBlock=collectRange(one,null);
      var fixedIndex=oneBlock.indexOf(fixed);
      if(fixedIndex>=0)oneBlock=oneBlock.slice(0,fixedIndex);
      oneBlock.forEach(function(n){if(n&&n.parentNode===panel)panel.insertBefore(n,fixed);});
    }

    one=directHeader(panel,/^Eenmalig deze maand\b/);
    fixed=directHeader(panel,/^Vaste lasten\b/);
    if(!one||!fixed)return false;

    // The outer group headers now own the hierarchy, so do not move the old
    // duplicate section titles into the group bodies.
    var oneNodes=collectRange(one.nextSibling,fixed);
    var fixedNodes=collectRange(fixed.nextSibling,null);

    var groups=document.createElement('div');groups.className='mp-groups';
    panel.insertBefore(groups,one);

    // Remove legacy duplicate headings after the stable group container exists.
    if(one.parentNode===panel)panel.removeChild(one);
    if(fixed.parentNode===panel)panel.removeChild(fixed);

    var st=readState(),sum=summary();
    groups.appendChild(makeGroup('transactions','💳','Transacties',sum.transactions.sub,sum.transactions.total?'- '+euro(sum.transactions.total):euro(0),[tx],st));
    groups.appendChild(makeGroup('oneoff','🧾','Eenmalige rekeningen',sum.oneoff.sub,sum.oneoff.total?'- '+euro(sum.oneoff.total):euro(0),oneNodes,st));
    groups.appendChild(makeGroup('fixed','🏠','Vaste lasten',sum.fixed.sub,sum.fixed.total?'- '+euro(sum.fixed.total):euro(0),fixedNodes,st));
    return true;
  }

  function install(){
    if(typeof window.renderMaandplan!=='function'||window.renderMaandplan._financeGroupsWrapped)return false;
    originalRender=window.renderMaandplan;
    function wrapped(){var result=originalRender.apply(this,arguments);apply();return result;}
    wrapped._financeGroupsWrapped=true;wrapped._original=originalRender;window.renderMaandplan=wrapped;
    apply();return true;
  }

  window.FinanceMaandplanGroups={version:VERSION,install:install,apply:apply};
})();