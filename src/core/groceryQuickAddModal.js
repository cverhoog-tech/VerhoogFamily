'use strict';
// ============================================================
// GROCERY QUICK ADD v0.500
// Premium quick-add UI. ShoppingLists is the only persistence authority.
// ============================================================
(function(){
  if(window.GroceryQuickAddModal&&window.GroceryQuickAddModal.version==='0.500')return;
  var VERSION='0.500',STYLE_ID='grocery-bottom-sheet-style';
  var QUICK=['Melk','Brood','Eieren','Bananen','Kaas','Toiletpapier'];

  function classify(name){
    try{return window.GroceryProductClassifier&&typeof window.GroceryProductClassifier.classify==='function'?window.GroceryProductClassifier.classify(name):{category:'Overig',icon:'📦',qty:'1 st'};}catch(e){return{category:'Overig',icon:'📦',qty:'1 st'};}
  }
  function token(){var c=window.HouseholdContext;if(!c)throw new Error('HOUSEHOLD_CONTEXT_UNAVAILABLE');var uid=c.requireUser(),householdId=c.requireHousehold();c.assertContext({uid:uid,householdId:householdId,requireReady:true});return{uid:uid,householdId:householdId};}
  function assertCurrent(t){if(!window.HouseholdContext||!window.HouseholdContext.isCurrent(t)){var e=new Error('SHOPPING_CONTEXT_CHANGED');e.code='SHOPPING_CONTEXT_CHANGED';throw e;}}
  function esc(v){return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');}
  function ensureStyles(){if(document.getElementById(STYLE_ID))return;var s=document.createElement('style');s.id=STYLE_ID;s.textContent='.gqa-wrap{display:grid;gap:12px}.gqa-field label{display:block;font-size:11px;font-weight:800;color:var(--c-text2);margin:0 0 6px}.gqa-field input,.gqa-field select{width:100%;box-sizing:border-box;border:1px solid var(--c-border);background:var(--c-surface);color:var(--c-text);border-radius:14px;padding:12px 13px;font:inherit;outline:none}.gqa-product-row{display:grid;grid-template-columns:58px 1fr;gap:10px;align-items:end}.gqa-icon{width:58px;height:46px;border:1px solid var(--c-border);background:var(--c-surface2);border-radius:14px;display:grid;place-items:center;font-size:24px}.gqa-meta{display:grid;grid-template-columns:1fr 1fr;gap:10px}.gqa-quick{display:flex;gap:7px;overflow:auto;padding:2px 0 3px}.gqa-chip{border:1px solid var(--c-border);background:var(--c-surface);border-radius:999px;padding:8px 10px;white-space:nowrap;color:var(--c-text);font-size:12px;font-weight:700}.gqa-hint{font-size:11px;color:var(--c-text2);line-height:1.4}';document.head.appendChild(s);}
  function buildHtml(){var cats=['Zuivel','Brood','Ontbijt','Groente','Fruit','Vlees','Vis','Vega','Voorraad','Dranken','Snacks','Diepvries','Huishouden','Verzorging','Baby','Huisdieren','Elektronica','Wonen','Overig'];try{if(window.GroceryProductClassifier&&typeof GroceryProductClassifier.categories==='function')cats=GroceryProductClassifier.categories();}catch(e){}return'<div class="gqa-wrap"><div><div class="gqa-hint">Snel toevoegen</div><div class="gqa-quick">'+QUICK.map(function(n){return'<button type="button" class="gqa-chip" data-gqa-quick="'+esc(n)+'">'+esc(n)+'</button>';}).join('')+'</div></div><div class="gqa-product-row"><div class="gqa-icon" id="gqa-icon">📦</div><div class="gqa-field"><label>Product</label><input id="gqa-name" autocomplete="off" placeholder="bijv. broccoli, laptop of bankstel"></div></div><div class="gqa-meta"><div class="gqa-field"><label>Hoeveelheid</label><input id="gqa-qty" placeholder="1 st"></div><div class="gqa-field"><label>Categorie</label><select id="gqa-cat">'+cats.map(function(c){return'<option value="'+esc(c)+'">'+esc(c)+'</option>';}).join('')+'</select></div></div><div class="gqa-hint" id="gqa-detected">Categorie, icoon en hoeveelheid worden automatisch herkend.</div></div>';}
  function open(){
    ensureStyles();var t;try{t=token();}catch(e){if(window.showToast)showToast('Winkellijst is nog niet beschikbaar');return false;}
    if(!window.BottomSheet||!window.ShoppingLists||typeof window.ShoppingLists.addItem!=='function'){if(window.showToast)showToast('Winkellijst is nog niet beschikbaar');return false;}
    BottomSheet.open({title:'Boodschap toevoegen',html:buildHtml(),onOpen:function(ctx){
      var name=ctx.modal.querySelector('#gqa-name'),qty=ctx.modal.querySelector('#gqa-qty'),cat=ctx.modal.querySelector('#gqa-cat'),icon=ctx.modal.querySelector('#gqa-icon'),hint=ctx.modal.querySelector('#gqa-detected');
      function applyGuess(force){var guess=classify(name.value);icon.textContent=guess.icon||'📦';if(force||!qty.dataset.edited)qty.value=guess.qty||'1 st';if(force||!cat.dataset.edited)cat.value=guess.category||'Overig';hint.textContent=(guess.confidence?'Herkend':'Voorgesteld')+': '+(guess.category||'Overig')+' · '+(guess.icon||'📦')+' · '+(guess.qty||'1 st');return guess;}
      name.addEventListener('input',function(){applyGuess(false);});qty.addEventListener('input',function(){qty.dataset.edited='1';});cat.addEventListener('change',function(){cat.dataset.edited='1';});ctx.modal.querySelectorAll('[data-gqa-quick]').forEach(function(b){b.onclick=function(){name.value=b.getAttribute('data-gqa-quick');qty.dataset.edited='';cat.dataset.edited='';applyGuess(true);name.focus();};});
      setTimeout(function(){name.focus();},30);
    },actions:[{label:'Annuleren'},{label:'Toevoegen',primary:true,onClick:function(ctx){
      var name=ctx.modal.querySelector('#gqa-name'),qty=ctx.modal.querySelector('#gqa-qty'),cat=ctx.modal.querySelector('#gqa-cat');var value=String(name.value||'').trim();if(!value){name.focus();return false;}var guess=classify(value);try{assertCurrent(t);}catch(e){if(window.showToast)showToast('Toevoegen geannuleerd omdat gebruiker of gezin is gewijzigd');return false;}
      return Promise.resolve(window.ShoppingLists.addItem({name:value,qty:String(qty.value||guess.qty||'1 st'),cat:String(cat.value||guess.category||'Overig'),photo:guess.icon||'📦',who:t.uid,source:'quickAdd'})).then(function(record){assertCurrent(t);if(window.highlightShopItem&&record)window.highlightShopItem(record._key||record.id);if(window.showToast)showToast('Boodschap toegevoegd ✓');return true;}).catch(function(e){if(window.showToast)showToast(e&&e.code==='SHOPPING_CONTEXT_CHANGED'?'Toevoegen geannuleerd omdat gebruiker of gezin is gewijzigd':'Boodschap kon niet worden toegevoegd');return false;});
    }}]});return true;
  }
  function installButton(){if(typeof window.wireShopAddButton==='function')window.wireShopAddButton();return true;}
  window.GroceryQuickAddModal={version:VERSION,open:open,installButton:installButton,classify:classify};
})();
