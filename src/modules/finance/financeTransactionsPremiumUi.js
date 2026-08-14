'use strict';
// ============================================================
// FINANCE TRANSACTIONS PREMIUM UI v1.0.0
// Presentation-only layer. Uses FinanceStore-backed legacy mirrors as data.
// ============================================================
(function(){
  if(window.FinanceTransactionsPremiumUi)return;
  var VERSION='1.0.0';
  var originalRenderTrans=null;
  var originalRenderMaandplan=null;

  function esc(v){return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');}
  function sorted(list){return window.FinanceStore&&FinanceStore.sortTransactions?FinanceStore.sortTransactions(list||[]):(list||[]).slice().sort(function(a,b){return String(b.date||'').localeCompare(String(a.date||''));});}
  function euro(v){return '€ '+Math.abs(Number(v)||0).toLocaleString('nl-NL',{minimumFractionDigits:2,maximumFractionDigits:2});}
  function monthKey(y,m){return y+'-'+String(m+1).padStart(2,'0');}
  function dateLabel(date){try{return new Date(date+'T00:00:00').toLocaleDateString('nl-NL',{weekday:'short',day:'numeric',month:'short'});}catch(e){return date||'';}}
  function categoryIcon(cat){return ({'Boodschappen':'🛒','Uit eten':'🍽️','Transport':'🚗','Gezondheid':'💊','Abonnementen':'📱','Kleding':'👕','Shopping':'🛍️','Wonen':'🏠','Sparen':'🏦','Overig':'💸'})[cat]||'💸';}
  function tint(cat){return ({'Boodschappen':'#f59e0b','Uit eten':'#ea580c','Transport':'#2563eb','Gezondheid':'#dc2626','Abonnementen':'#7c3aed','Kleding':'#db2777','Shopping':'#9333ea','Wonen':'#0f766e','Sparen':'#0891b2','Overig':'#64748b'})[cat]||'#64748b';}

  function ensureStyles(){
    if(document.getElementById('finance-transactions-premium-style'))return;
    var s=document.createElement('style');s.id='finance-transactions-premium-style';s.textContent=[
      '#fin-trans{background:var(--c-bg);min-height:100%}',
      '.fin-tx-wrap{padding:14px 14px 24px}',
      '.fin-tx-hero{background:linear-gradient(135deg,var(--c-primary),#182a54);color:#fff;border-radius:20px;padding:16px;margin-bottom:12px;box-shadow:0 8px 22px rgba(20,35,70,.12)}',
      '.fin-tx-hero-top{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}',
      '.fin-tx-kicker{font-size:10px;letter-spacing:.7px;text-transform:uppercase;opacity:.72;font-weight:800}',
      '.fin-tx-balance{font-size:28px;font-weight:950;line-height:1.05;margin-top:4px}',
      '.fin-tx-hero-sub{font-size:11px;opacity:.76;margin-top:4px}',
      '.fin-tx-stats{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:14px}',
      '.fin-tx-stat{background:rgba(255,255,255,.11);border:1px solid rgba(255,255,255,.10);border-radius:13px;padding:9px 10px}',
      '.fin-tx-stat span{display:block;font-size:9.5px;opacity:.72;margin-bottom:2px}',
      '.fin-tx-stat b{font-size:14px}',
      '.fin-tx-filters{display:flex;gap:7px;overflow-x:auto;padding:2px 1px 10px;scrollbar-width:none}',
      '.fin-tx-filters::-webkit-scrollbar{display:none}',
      '.fin-tx-filter{appearance:none;border:1px solid var(--c-border);background:var(--c-surface);color:var(--c-text2);border-radius:999px;padding:7px 28px 7px 11px;font-size:11px;font-weight:750;box-shadow:0 2px 8px rgba(17,24,39,.025)}',
      '.fin-tx-day{margin-top:7px}',
      '.fin-tx-day-head{display:flex;align-items:center;justify-content:space-between;padding:7px 4px;font-size:10.5px;font-weight:850;color:var(--c-text2);text-transform:uppercase;letter-spacing:.35px}',
      '.fin-tx-group{background:var(--c-surface);border:1px solid var(--c-border);border-radius:17px;overflow:hidden;box-shadow:0 3px 12px rgba(17,24,39,.035)}',
      '.fin-tx-row{display:flex;align-items:center;gap:11px;padding:11px 12px;background:var(--c-surface)}',
      '.fin-tx-row+.fin-tx-row{border-top:1px solid var(--c-border)}',
      '.fin-tx-icon{width:39px;height:39px;border-radius:13px;display:grid;place-items:center;font-size:18px;flex:0 0 auto}',
      '.fin-tx-main{flex:1;min-width:0}',
      '.fin-tx-name{font-size:13px;font-weight:850;color:var(--c-text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.fin-tx-meta{font-size:10.5px;color:var(--c-text2);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.fin-tx-amount{font-size:13px;font-weight:900;white-space:nowrap}',
      '.fin-tx-del{border:0;background:transparent;color:var(--c-text3);font-size:14px;padding:5px;cursor:pointer}',
      '.fin-tx-add{width:100%;margin-top:12px;border:0;border-radius:14px;padding:12px 14px;background:var(--c-primary);color:#fff;font-size:13px;font-weight:900;cursor:pointer}',
      '.mp-tx-card{margin:12px 16px 4px;background:linear-gradient(180deg,var(--c-surface),var(--c-surface2));border:1px solid var(--c-border);border-radius:18px;padding:13px;box-shadow:0 3px 12px rgba(17,24,39,.035)}',
      '.mp-tx-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px}',
      '.mp-tx-title{font-size:15px;font-weight:900;color:var(--c-text)}',
      '.mp-tx-sub{font-size:10.5px;color:var(--c-text2);margin-top:2px}',
      '.mp-tx-total{font-size:16px;font-weight:950;color:#dc2626}',
      '.mp-tx-list{display:flex;flex-direction:column;gap:7px}',
      '.mp-tx-item{display:flex;align-items:center;gap:9px;background:var(--c-surface);border:1px solid var(--c-border);border-radius:12px;padding:8px 9px}',
      '.mp-tx-item-icon{width:30px;height:30px;border-radius:10px;display:grid;place-items:center;font-size:14px;flex:0 0 auto}',
      '.mp-tx-item-main{flex:1;min-width:0}',
      '.mp-tx-item-name{font-size:11.5px;font-weight:800;color:var(--c-text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.mp-tx-item-meta{font-size:9.5px;color:var(--c-text2);margin-top:1px}',
      '.mp-tx-item-amt{font-size:11.5px;font-weight:900;white-space:nowrap}',
      '.mp-tx-more{width:100%;margin-top:9px;border:0;background:transparent;color:var(--c-primary);font-size:11px;font-weight:850;padding:5px;cursor:pointer}',
      '.mp-tx-empty{font-size:11px;color:var(--c-text2);text-align:center;padding:10px 4px}'
    ].join('\n');document.head.appendChild(s);
  }

  function filteredTransactions(){
    var all=sorted(window.transData||[]);
    var f=window.transFilter||{who:'all',cat:'all',period:'all'};
    return all.filter(function(t){
      if(f.who&&f.who!=='all'&&t.who!==f.who)return false;
      if(f.cat&&f.cat!=='all'&&t.cat!==f.cat)return false;
      if(f.period&&f.period!=='all'){
        var d=new Date((t.date||'')+'T00:00:00'),now=new Date();
        if(f.period==='month'&&(d.getMonth()!==now.getMonth()||d.getFullYear()!==now.getFullYear()))return false;
        if(f.period==='3m'){var cut=new Date(now.getFullYear(),now.getMonth()-3,now.getDate());if(d<cut)return false;}
      }
      return true;
    });
  }

  function renderTransPremium(){
    ensureStyles();
    var el=document.getElementById('fin-trans');if(!el)return;
    if(!window.transFilter)window.transFilter={who:'all',cat:'all',period:'all'};
    var data=filteredTransactions();
    var all=sorted(window.transData||[]);
    var cats=Array.from(new Set(all.map(function(t){return t.cat;}).filter(Boolean))).sort();
    var totalIn=data.filter(function(t){return Number(t.amount)>0;}).reduce(function(s,t){return s+Number(t.amount||0);},0);
    var totalOut=data.filter(function(t){return Number(t.amount)<0;}).reduce(function(s,t){return s+Math.abs(Number(t.amount||0));},0);
    var net=totalIn-totalOut;
    var groups={};data.forEach(function(t){var k=t.date||'Onbekend';(groups[k]||(groups[k]=[])).push(t);});
    var html='<div class="fin-tx-wrap">'
      +'<section class="fin-tx-hero"><div class="fin-tx-hero-top"><div><div class="fin-tx-kicker">Transacties</div><div class="fin-tx-balance">'+(net<0?'-':'')+euro(net)+'</div><div class="fin-tx-hero-sub">Netto resultaat binnen je huidige filters</div></div><div style="font-size:28px">💳</div></div>'
      +'<div class="fin-tx-stats"><div class="fin-tx-stat"><span>Inkomsten</span><b>+ '+euro(totalIn)+'</b></div><div class="fin-tx-stat"><span>Uitgaven</span><b>- '+euro(totalOut)+'</b></div></div></section>'
      +'<div class="fin-tx-filters">'
      +'<select class="fin-tx-filter" onchange="transFilter.who=this.value;renderTrans()"><option value="all">👥 Beiden</option><option value="Shane"'+(transFilter.who==='Shane'?' selected':'')+'>Shane</option><option value="Esra"'+(transFilter.who==='Esra'?' selected':'')+'>Esra</option></select>'
      +'<select class="fin-tx-filter" onchange="transFilter.period=this.value;renderTrans()"><option value="all">📅 Alles</option><option value="month"'+(transFilter.period==='month'?' selected':'')+'>Deze maand</option><option value="3m"'+(transFilter.period==='3m'?' selected':'')+'>3 maanden</option></select>'
      +'<select class="fin-tx-filter" onchange="transFilter.cat=this.value;renderTrans()"><option value="all">🏷️ Alle categorieën</option>'+cats.map(function(c){return '<option value="'+esc(c)+'"'+(transFilter.cat===c?' selected':'')+'>'+esc(c)+'</option>';}).join('')+'</select></div>';

    Object.keys(groups).sort().reverse().forEach(function(date){
      var rows=groups[date];var dayOut=rows.filter(function(t){return Number(t.amount)<0;}).reduce(function(s,t){return s+Math.abs(Number(t.amount||0));},0);
      html+='<section class="fin-tx-day"><div class="fin-tx-day-head"><span>'+esc(dateLabel(date))+'</span><span>'+(dayOut?'- '+euro(dayOut):rows.length+' items')+'</span></div><div class="fin-tx-group">';
      rows.forEach(function(t){var neg=Number(t.amount)<0,accent=tint(t.cat),meta=[t.cat,t.who].filter(Boolean).join(' · ');html+='<div class="fin-tx-row"><div class="fin-tx-icon" style="background:'+accent+'18;color:'+accent+'">'+categoryIcon(t.cat)+'</div><div class="fin-tx-main"><div class="fin-tx-name">'+esc(t.name||'Transactie')+'</div><div class="fin-tx-meta">'+esc(meta)+'</div></div><div class="fin-tx-amount" style="color:'+(neg?'#dc2626':'#16a34a')+'">'+(neg?'- ':'+ ')+euro(t.amount)+'</div><button class="fin-tx-del" onclick="deleteTrans(\''+esc(t.id)+'\')">✕</button></div>';});
      html+='</div></section>';
    });
    if(!data.length)html+='<div class="mp-tx-empty" style="padding:28px 8px">Geen transacties binnen deze filters.</div>';
    html+='<button class="fin-tx-add" onclick="openAdd(\'trans\')">+ Transactie toevoegen</button></div>';
    el.innerHTML=html;
  }

  function buildMonthCard(){
    ensureStyles();
    var y=typeof window.mpYear==='number'?window.mpYear:new Date().getFullYear();
    var m=typeof window.mpMonth==='number'?window.mpMonth:new Date().getMonth();
    var key=monthKey(y,m);
    var data=sorted(window.transData||[]).filter(function(t){return String(t.date||'').slice(0,7)===key;});
    var out=data.filter(function(t){return Number(t.amount)<0;}).reduce(function(s,t){return s+Math.abs(Number(t.amount||0));},0);
    var recent=data.slice(0,5);
    var months=['januari','februari','maart','april','mei','juni','juli','augustus','september','oktober','november','december'];
    var html='<section class="mp-tx-card" id="mp-transactions-summary"><div class="mp-tx-head"><div><div class="mp-tx-title">💳 Transacties</div><div class="mp-tx-sub">'+data.length+' in '+months[m]+' · meest recente eerst</div></div><div class="mp-tx-total">'+(out?'- '+euro(out):euro(0))+'</div></div><div class="mp-tx-list">';
    if(!recent.length)html+='<div class="mp-tx-empty">Nog geen transacties deze maand.</div>';
    recent.forEach(function(t){var neg=Number(t.amount)<0,accent=tint(t.cat);html+='<div class="mp-tx-item"><div class="mp-tx-item-icon" style="background:'+accent+'18">'+categoryIcon(t.cat)+'</div><div class="mp-tx-item-main"><div class="mp-tx-item-name">'+esc(t.name||'Transactie')+'</div><div class="mp-tx-item-meta">'+esc(dateLabel(t.date))+' · '+esc(t.cat||'Overig')+'</div></div><div class="mp-tx-item-amt" style="color:'+(neg?'#dc2626':'#16a34a')+'">'+(neg?'- ':'+ ')+euro(t.amount)+'</div></div>';});
    html+='</div><button class="mp-tx-more" onclick="setFinTab(\'trans\',document.querySelectorAll(\'#screen-finance .ftab\')[1]);renderFinance()">Bekijk alle transacties →</button></section>';
    return html;
  }

  function enhanceMaandplan(){
    var panel=document.getElementById('fin-maandplan');if(!panel)return;
    var old=document.getElementById('mp-transactions-summary');if(old)old.remove();
    var holder=document.createElement('div');holder.innerHTML=buildMonthCard();var card=holder.firstChild;
    var oneOffTitle=Array.from(panel.querySelectorAll('div')).find(function(n){return (n.textContent||'').trim().indexOf('Eenmalig deze maand')===0;});
    var insertAfter=null;
    if(oneOffTitle){var node=oneOffTitle;while(node&&node.parentNode===panel===false)node=node.parentNode;if(node&&node.parentNode===panel)insertAfter=node;}
    if(insertAfter&&insertAfter.nextSibling)panel.insertBefore(card,insertAfter.nextSibling);else panel.appendChild(card);
  }

  function install(){
    ensureStyles();
    if(!originalRenderTrans&&typeof window.renderTrans==='function')originalRenderTrans=window.renderTrans;
    window.renderTrans=renderTransPremium;
    if(!originalRenderMaandplan&&typeof window.renderMaandplan==='function'){
      originalRenderMaandplan=window.renderMaandplan;
      window.renderMaandplan=function(){originalRenderMaandplan();enhanceMaandplan();};
    }
    if(window._currentScreen==='finance'&&typeof window.renderFinance==='function')window.renderFinance();
  }

  window.FinanceTransactionsPremiumUi={version:VERSION,install:install,renderTrans:renderTransPremium,enhanceMaandplan:enhanceMaandplan};
})();