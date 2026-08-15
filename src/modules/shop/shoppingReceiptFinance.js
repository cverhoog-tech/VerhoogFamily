'use strict';
// ============================================================
// SHOPPING RECEIPT -> FINANCE v1.2.0
// Context-safe idempotent finance projection per shopping list receipt.
// ============================================================
(function(){
  if(window.ShoppingReceiptFinance)return;
  function active(){return window.ShoppingLists&&ShoppingLists.active?ShoppingLists.active():null;}
  function contextToken(){var c=window.HouseholdContext;if(!c)throw new Error('HOUSEHOLD_CONTEXT_UNAVAILABLE');var uid=c.requireUser(),householdId=c.requireHousehold();c.assertContext({uid:uid,householdId:householdId,requireReady:true});return{uid:uid,householdId:householdId};}
  function assertCurrent(token){if(!window.HouseholdContext||!window.HouseholdContext.isCurrent(token)){var e=new Error('SHOPPING_CONTEXT_CHANGED');e.code='SHOPPING_CONTEXT_CHANGED';throw e;}}
  function today(){var d=new Date(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');return d.getFullYear()+'-'+m+'-'+day;}
  function esc(v){return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');}
  function ensureStyles(){if(document.getElementById('shopping-receipt-finance-style'))return;var s=document.createElement('style');s.id='shopping-receipt-finance-style';s.textContent='.shopping-receipt-card{margin:12px 16px 18px;border:1px solid var(--c-border);background:var(--c-surface);border-radius:18px;padding:13px;box-shadow:0 4px 14px rgba(17,24,39,.04)}.shopping-receipt-head{display:flex;align-items:center;gap:10px}.shopping-receipt-icon{width:38px;height:38px;border-radius:13px;background:var(--c-surface2);display:grid;place-items:center;font-size:18px}.shopping-receipt-copy{flex:1;min-width:0}.shopping-receipt-copy b{display:block;font-size:13px;color:var(--c-text)}.shopping-receipt-copy small{display:block;margin-top:2px;font-size:11px;color:var(--c-text2)}.shopping-receipt-btn{border:0;border-radius:12px;padding:9px 11px;background:var(--c-primary);color:#fff;font-size:12px;font-weight:900}';document.head.appendChild(s);}
  function ensureCard(){ensureStyles();var done=document.getElementById('shop-done');if(!done)return;var col=done.closest('.shop-col')||done.parentNode;if(!col)return;var old=document.getElementById('shopping-receipt-card'),items=Array.isArray(window.shopData)?window.shopData.filter(function(i){return i&&i.done;}):[];if(!items.length){if(old)old.remove();return;}var card=old||document.createElement('div');card.id='shopping-receipt-card';card.className='shopping-receipt-card';card.innerHTML='<div class="shopping-receipt-head"><div class="shopping-receipt-icon">🧾</div><div class="shopping-receipt-copy"><b>Bon van gekochte items</b><small>'+items.length+' gekocht · verwerk totaal realtime in Financiën</small></div><button class="shopping-receipt-btn">Totaal invoeren</button></div>';if(!old)col.appendChild(card);card.querySelector('button').onclick=openReceipt;}
  function ensureDeps(done){var jobs=[];if(!window.ModalManager)jobs.push(['receipt-modal-manager','src/core/modalManager.js']);function next(){if(!jobs.length)return done();var j=jobs.shift();if(document.getElementById(j[0]))return setTimeout(next,80);var s=document.createElement('script');s.id=j[0];s.src=j[1];s.onload=next;s.onerror=next;document.body.appendChild(s);}next();}
  function projectFinanceTransaction(record){if(!record)return;var list=Array.isArray(window.transData)?window.transData.slice():[],idx=list.findIndex(function(t){return t&&(t.id===record.id||(record.sourceKey&&t.sourceKey===record.sourceKey));});if(idx>=0)list[idx]=record;else list.push(record);window.transData=(window.FinanceStore&&FinanceStore.sortTransactions)?FinanceStore.sortTransactions(list):list;if(window._currentScreen==='finance'&&typeof window.renderFinance==='function')window.renderFinance();}
  function openReceipt(){
    var token,row,bought;
    try{token=contextToken();row=active();bought=(window.shopData||[]).filter(function(i){return i&&i.done;});}catch(e){if(window.showToast)showToast('Bon kan nu niet worden verwerkt');return;}
    ensureDeps(function(){
      try{assertCurrent(token);}catch(e){if(window.showToast)showToast('Bon geannuleerd omdat gebruiker of gezin is gewijzigd');return;}
      if(!row||!row.list||!window.FinanceStore){if(window.showToast)showToast('Bon kan nu niet worden verwerkt');return;}
      var names=bought.slice(0,4).map(function(i){return i.name;}).join(', ')+(bought.length>4?'…':'');
      var html='<div class="fam-modal-field"><label>Totaalbedrag bon (€)</label><input id="receipt-total" type="number" min="0.01" step="0.01" inputmode="decimal" placeholder="0,00"></div><div class="fam-modal-field"><label>Datum</label><input id="receipt-date" type="date" value="'+today()+'"></div><div style="font-size:12px;line-height:1.5;color:var(--c-text2)"><b>'+esc(row.list.name||'Boodschappen')+'</b><br>'+esc(names||'Gekochte items')+'</div>';
      ModalManager.open({title:'🧾 Boodschappenbon',html:html,actions:[{label:'Annuleren'},{label:'Verwerk in Financiën',primary:true,onClick:function(ctx){
        try{assertCurrent(token);}catch(e){if(window.showToast)showToast('Bon geannuleerd omdat gebruiker of gezin is gewijzigd');return false;}
        var raw=(ctx.modal.querySelector('#receipt-total').value||'').replace(',','.'),amount=parseFloat(raw),date=ctx.modal.querySelector('#receipt-date').value||today();if(!(amount>0)){if(window.showToast)showToast('Vul een totaalbedrag in');return false;}
        var sourceId=token.householdId+':'+row.key;
        var tx={name:'Boodschappen · '+(row.list.name||'Lijst'),cat:'Boodschappen',amount:-Math.abs(amount),whoUid:token.uid,date:date,note:'Bon voor '+bought.length+' gekochte items',shoppingListKey:row.key,shoppingListName:row.list.name||'',shoppingItemNames:bought.map(function(i){return i.name;}),householdId:token.householdId};
        FinanceStore.upsertSourceTransaction({sourceType:'shoppingReceipt',sourceId:sourceId,transaction:tx}).then(function(record){assertCurrent(token);projectFinanceTransaction(record);if(window.showToast)showToast('Bon verwerkt in Financiën ✓');}).catch(function(e){if(window.showToast)showToast(e&&e.code==='SHOPPING_CONTEXT_CHANGED'?'Bon geannuleerd omdat gebruiker of gezin is gewijzigd':'Bon kon niet worden verwerkt');});
      }}]});
    });
  }
  function boot(){ensureCard();}
  window.ShoppingReceiptFinance={version:'1.2.0',boot:boot,render:ensureCard,open:openReceipt};
  window.addEventListener('familyapp:data:shared:shoppingLists',function(){setTimeout(ensureCard,0);});
  window.addEventListener('familyapp:household-context-changed',function(){var old=document.getElementById('shopping-receipt-card');if(old)old.remove();setTimeout(ensureCard,0);});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
