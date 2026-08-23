'use strict';
// ============================================================
// SHOPPING RECEIPT -> FINANCE v1.5.1
// Adds one stable finance transaction per shopping list receipt.
// Transaction name stays user-editable. Category is an optional fixed choice
// so Finance/Analyse never fragment into spelling variants.
// After Finance confirms the write, only the exact purchased-item snapshot
// used for that receipt is removed from the canonical shopping list.
// ============================================================
(function(){
  if(window.ShoppingReceiptFinance&&window.ShoppingReceiptFinance.version==='1.5.1')return;
  var RECEIPT_CATEGORIES=['Boodschappen','Uit eten','Thuisbezorgd','Uitjes','Transport','Gezondheid','Abonnementen','Kleding','Shopping','Wonen','Kinderen','Huisdieren','Overig'];
  function active(){return window.ShoppingListStore&&window.ShoppingListStore.active?window.ShoppingListStore.active():null;}
  function boughtItems(){var s=window.ShoppingListStore;if(!s||typeof s.projection!=='function')return[];return s.projection().doneItems||[];}
  function currentUserName(){return window.myName||'Gezin';}
  function today(){var d=new Date(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');return d.getFullYear()+'-'+m+'-'+day;}
  function esc(v){return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');}
  function icon(){var r=window.FamilyAppIconRenderer;return r&&typeof r.render==='function'?r.render('utilityShopping',{size:'sm',label:false,className:'fa-utility-icon'}):'';}
  function ensureStyles(){if(document.getElementById('shopping-receipt-finance-style'))return;var s=document.createElement('style');s.id='shopping-receipt-finance-style';s.textContent='.shopping-receipt-card{margin:11px 0 0;border:1px solid var(--c-border);background:var(--c-surface);border-radius:16px;padding:12px;box-shadow:0 3px 10px rgba(17,24,39,.035)}.shopping-receipt-head{display:flex;align-items:center;gap:10px}.shopping-receipt-icon{width:38px;height:38px;border-radius:13px;background:var(--c-surface2);display:grid;place-items:center}.shopping-receipt-copy{flex:1;min-width:0}.shopping-receipt-copy b{display:block;font-size:13px;color:var(--c-text)}.shopping-receipt-copy small{display:block;margin-top:2px;font-size:11px;color:var(--c-text2)}.shopping-receipt-btn{border:0;border-radius:12px;padding:9px 11px;background:var(--c-primary);color:#fff;font-size:12px;font-weight:900;min-height:40px}';document.head.appendChild(s);}
  function v2Anchor(){var page=window.ShoppingPageV2,status=page&&typeof page.status==='function'?page.status():null;if(!status||status.view!=='done')return null;var clear=document.getElementById('shopv2-clear');return clear&&clear.parentNode?{parent:clear.parentNode,before:clear}:null;}
  function legacyAnchor(){var done=document.getElementById('shop-done');if(!done)return null;var col=done.closest('.shop-col')||done.parentNode;return col?{parent:col,before:null}:null;}
  function ensureCard(){ensureStyles();var old=document.getElementById('shopping-receipt-card'),items=boughtItems(),anchor=v2Anchor()||legacyAnchor();if(!anchor||!items.length){if(old)old.remove();return;}var card=old||document.createElement('div');card.id='shopping-receipt-card';card.className='shopping-receipt-card';card.innerHTML='<div class="shopping-receipt-head"><div class="shopping-receipt-icon">'+icon()+'</div><div class="shopping-receipt-copy"><b>Bon van gekochte items</b><small>'+items.length+' gekocht · verwerk totaal in Financien</small></div><button class="shopping-receipt-btn">Totaal invoeren</button></div>';if(card.parentNode!==anchor.parent){if(card.parentNode)card.remove();anchor.parent.insertBefore(card,anchor.before||null);}else if(anchor.before&&card.nextSibling!==anchor.before){anchor.parent.insertBefore(card,anchor.before);}card.querySelector('button').onclick=openReceipt;}
  function ensureDeps(done){var jobs=[];if(!window.ModalManager)jobs.push(['receipt-modal-manager','src/core/modalManager.js']);function next(){if(!jobs.length)return done();var j=jobs.shift();if(document.getElementById(j[0]))return setTimeout(next,80);var s=document.createElement('script');s.id=j[0];s.src=j[1];s.onload=next;s.onerror=next;document.body.appendChild(s);}next();}
  function projectFinanceTransaction(record){if(!record)return;var list=Array.isArray(window.transData)?window.transData.slice():[];var idx=list.findIndex(function(t){return t&&(t.id===record.id||(record.sourceKey&&t.sourceKey===record.sourceKey));});if(idx>=0)list[idx]=record;else list.push(record);window.transData=(window.FinanceStore&&FinanceStore.sortTransactions)?FinanceStore.sortTransactions(list):list;if(window._currentScreen==='finance'&&typeof window.renderFinance==='function')window.renderFinance();}
  function categoryOptions(){return'<option value="">Geen categorie</option>'+RECEIPT_CATEGORIES.map(function(v){return'<option value="'+esc(v)+'"'+(v==='Boodschappen'?' selected':'')+'>'+esc(v)+'</option>';}).join('');}
  function normalizeCategory(value){value=String(value||'').trim();return RECEIPT_CATEGORIES.indexOf(value)>=0?value:'';}
  function itemSnapshot(item){return{key:String(item&&item._key||item&&item.id||''),name:String(item&&item.name||''),qty:item&&item.qty||null,amount:item&&item.amount!=null?item.amount:null,unit:item&&item.unit||null,cat:item&&item.cat||null,source:item&&item.source||null,sourceRecipeId:item&&item.sourceRecipeId||null};}
  function processedItemKeys(items){var seen={};return(items||[]).map(function(item){return String(item&&item._key||item&&item.id||'');}).filter(function(key){if(!key||seen[key])return false;seen[key]=true;return true;});}
  function clearProcessedItems(row,items){
    var repo=window.ShoppingListHouseholdRepository;
    var keys=processedItemKeys(items);
    if(!keys.length)return Promise.resolve(true);
    if(!row||!row.list||!repo||typeof repo.clearDone!=='function')return Promise.reject(new Error('Boodschappenopslag is niet beschikbaar'));
    return repo.clearDone(row.scope,row.list.id,keys);
  }
  function openReceipt(){ensureDeps(function(){
    var row=active();
    if(!row||!row.list||!window.FinanceStore){if(window.showToast)showToast('Bon kan nu niet worden verwerkt');return;}
    var bought=boughtItems(),listName=row.list.name||'Boodschappen';
    if(!bought.length){if(window.showToast)showToast('Er zijn geen gekochte items om te verwerken');return;}
    var names=bought.slice(0,4).map(function(i){return i.name;}).join(', ')+(bought.length>4?'...':'');
    var defaultName=listName==='Boodschappen'?'Boodschappen':'Boodschappen - '+listName;
    var html=''
      +'<div class="fam-modal-field"><label>Naam transactie</label><input id="receipt-name" type="text" value="'+esc(defaultName)+'" placeholder="bijv. Dierentuin Breda"></div>'
      +'<div class="fam-modal-field"><label>Categorie <span style="font-weight:400;color:var(--c-text2)">(optioneel)</span></label><select id="receipt-category">'+categoryOptions()+'</select></div>'
      +'<div class="fam-modal-field"><label>Totaalbedrag bon (€)</label><input id="receipt-total" type="number" min="0.01" step="0.01" inputmode="decimal" placeholder="0,00"></div>'
      +'<div class="fam-modal-field"><label>Datum</label><input id="receipt-date" type="date" value="'+today()+'"></div>'
      +'<div style="font-size:12px;line-height:1.5;color:var(--c-text2)"><b>'+esc(listName)+'</b><br>'+esc(names||'Gekochte items')+'</div>';
    ModalManager.open({title:'Bon verwerken',html:html,actions:[
      {label:'Annuleren'},
      {label:'Verwerk in Financien',primary:true,onClick:function(ctx){
        var raw=(ctx.modal.querySelector('#receipt-total').value||'').replace(',','.');
        var amount=parseFloat(raw),date=ctx.modal.querySelector('#receipt-date').value||today();
        var transactionName=(ctx.modal.querySelector('#receipt-name').value||'').trim();
        var category=normalizeCategory(ctx.modal.querySelector('#receipt-category').value);
        if(!transactionName){if(window.showToast)showToast('Geef de transactie een naam');return false;}
        if(!(amount>0)){if(window.showToast)showToast('Vul een totaalbedrag in');return false;}
        var sourceId=row.key;
        var snapshot=bought.map(itemSnapshot);
        var tx={name:transactionName,cat:category,amount:-Math.abs(amount),who:currentUserName(),date:date,note:'Bon voor '+bought.length+' gekochte items',shoppingListKey:row.key,shoppingListName:listName,shoppingItemCount:bought.length,shoppingItemNames:bought.map(function(i){return i.name;}),shoppingItemsSnapshot:snapshot,receiptProcessedAt:Date.now()};
        FinanceStore.upsertSourceTransaction({sourceType:'shoppingReceipt',sourceId:sourceId,transaction:tx}).then(function(record){
          projectFinanceTransaction(record);
          return clearProcessedItems(row,bought).then(function(){
            ensureCard();
            if(window.showToast)showToast(transactionName+' verwerkt · gekochte lijst opgeschoond ✓');
            return record;
          }).catch(function(error){
            console.warn('[ShoppingReceiptFinance] receipt saved but purchased items could not be cleared',error);
            if(window.showToast)showToast('Bon opgeslagen, maar gekochte items konden niet worden verwijderd');
            return record;
          });
        }).catch(function(error){if(window.showToast)showToast(error&&error.message||'Bon kon niet worden verwerkt');});
      }}
    ]});
  });}
  function boot(){ensureCard();document.addEventListener('click',function(event){if(event.target&&event.target.closest&&event.target.closest('#screen-shop [data-shop-view]'))setTimeout(ensureCard,0);});}
  window.ShoppingReceiptFinance={version:'1.5.1',boot:boot,render:ensureCard,open:openReceipt,clearProcessedItems:clearProcessedItems,categories:RECEIPT_CATEGORIES.slice(),normalizeCategory:normalizeCategory};
  window.addEventListener('familyapp:data:shared:shoppingLists',function(){setTimeout(ensureCard,0);});
  window.addEventListener('familyapp:shopping:changed',function(){setTimeout(ensureCard,0);});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
