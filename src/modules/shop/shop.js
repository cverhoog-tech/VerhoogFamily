'use strict';
// ============================================================
// BOODSCHAPPEN v0.361
// Grocery add flow + shopping receipt finance bridge.
// Colorful FamilyApp utility icons are presentation-only; legacy icon metadata
// remains readable for compatibility with existing household grocery records.
// ============================================================

(function(){
  var loadingPromise = null;

  function loadScriptOnce(id, src, ready){
    return new Promise(function(resolve){
      if(ready && ready()) return resolve();
      if(document.getElementById(id)) {
        var tries = 0;
        var wait = setInterval(function(){
          tries++;
          if(!ready || ready() || tries > 50){ clearInterval(wait); resolve(); }
        }, 40);
        return;
      }
      var script = document.createElement('script');
      script.id = id;
      script.src = src;
      script.onload = function(){ resolve(); };
      script.onerror = function(){ console.warn('[Shop] failed to load', src); resolve(); };
      document.body.appendChild(script);
    });
  }

  function ensureGroceryAddStack(){
    if(loadingPromise) return loadingPromise;
    loadingPromise = Promise.resolve()
      .then(function(){ return loadScriptOnce('modal-manager-js', 'src/core/modalManager.js', function(){ return !!window.ModalManager; }); })
      .then(function(){ return loadScriptOnce('bottom-sheet-js', 'src/core/bottomSheet.js', function(){ return !!window.BottomSheet; }); })
      .then(function(){ return loadScriptOnce('grocery-product-classifier-js', 'src/modules/shop/groceryProductClassifier.js?v=1', function(){ return !!window.GroceryProductClassifier; }); })
      .then(function(){ return loadScriptOnce('grocery-quick-add-modal-js', 'src/core/groceryQuickAddModal.js?v=5', function(){ return !!window.GroceryQuickAddModal && window.GroceryQuickAddModal.version === '0.432'; }); })
      .then(function(){ return loadScriptOnce('shopping-receipt-finance-js', 'src/modules/shop/shoppingReceiptFinance.js?v=3', function(){ return !!window.ShoppingReceiptFinance; }); })
      .then(function(){
        if(window.GroceryQuickAddModal && typeof window.GroceryQuickAddModal.installButton === 'function') window.GroceryQuickAddModal.installButton();
        if(window.ShoppingReceiptFinance && typeof window.ShoppingReceiptFinance.render === 'function') window.ShoppingReceiptFinance.render();
      });
    return loadingPromise;
  }

  function openGroceryQuickAdd(){
    ensureGroceryAddStack().then(function(){
      if(window.GroceryQuickAddModal && typeof window.GroceryQuickAddModal.open === 'function') window.GroceryQuickAddModal.open();
      else if(typeof window.openAdd === 'function') window.openAdd('shop');
    });
    return false;
  }

  function wireShopAddButton(){
    var screen = document.getElementById('screen-shop');
    if(!screen) return;
    var header = screen.querySelector('.list-header');
    if(!header) return;
    var btn = header.querySelector('.add-btn');
    if(!btn){btn = document.createElement('button');btn.className = 'add-btn';btn.textContent = '+ Toevoegen';header.appendChild(btn);}
    btn.setAttribute('onclick', 'return openGroceryQuickAdd()');
    btn.onclick = function(e){if(e) e.preventDefault();return openGroceryQuickAdd();};
    btn.textContent = '+ Toevoegen';
    btn.style.pointerEvents = 'auto';
  }

  window.openGroceryQuickAdd = openGroceryQuickAdd;
  window.wireShopAddButton = wireShopAddButton;

  function bootShopAdd(){
    ensureGroceryAddStack();wireShopAddButton();
    [100, 300, 800, 1500, 2500].forEach(function(delay){ setTimeout(function(){wireShopAddButton();if(window.ShoppingReceiptFinance&&ShoppingReceiptFinance.render)ShoppingReceiptFinance.render();}, delay); });
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bootShopAdd);
  else bootShopAdd();
})();

function renderShop() {
  var openEl=document.getElementById('shop-open'),doneEl=document.getElementById('shop-done'),ocnt=document.getElementById('shop-open-cnt'),dcnt=document.getElementById('shop-done-cnt');
  if(!openEl)return;
  if(!Array.isArray(window.shopData)) window.shopData=[];
  var open=shopData.filter(function(i){return !i.done;}),done=shopData.filter(function(i){return i.done;});
  if(ocnt)ocnt.textContent=open.length;if(dcnt)dcnt.textContent=done.length;
  openEl.innerHTML=open.map(shopItemHTML).join('');doneEl.innerHTML=done.map(shopItemHTML).join('');
  if(typeof updateStats === 'function') updateStats();
  if(typeof wireShopAddButton === 'function') wireShopAddButton();
  if(window.ShoppingReceiptFinance&&typeof ShoppingReceiptFinance.render==='function')setTimeout(ShoppingReceiptFinance.render,0);
}

(function ensureShopAddedStyle(){
  if(document.getElementById('shop-added-style')) return;
  var css = document.createElement('style');css.id = 'shop-added-style';
  css.textContent = '.shop-item.shop-item-added{animation:shopItemAddedPop .8s cubic-bezier(.22,.9,.28,1)}@keyframes shopItemAddedPop{0%{opacity:0;transform:translateY(-10px) scale(.95);box-shadow:0 0 0 0 rgba(63,127,47,.4)}45%{opacity:1;transform:translateY(0) scale(1.025);box-shadow:0 0 0 10px rgba(63,127,47,.14)}100%{opacity:1;transform:none;box-shadow:0 0 0 0 rgba(63,127,47,0)}}';
  document.head.appendChild(css);
})();

function highlightShopItem(id){
  if(id === undefined || id === null) return;
  var el = document.getElementById('si-'+String(id).replace(/[^a-zA-Z0-9_-]/g,'_'));if(!el) return;
  el.classList.remove('shop-item-added');void el.offsetWidth;el.classList.add('shop-item-added');setTimeout(function(){ el.classList.remove('shop-item-added'); }, 850);
}
window.highlightShopItem = highlightShopItem;

function shopUtilityIcon(item){
  var legacy=(item&&item.photo&&!String(item.photo).startsWith('http'))?String(item.photo):'📦';
  var r=window.FamilyAppUtilityIconResolver;
  var html=r&&typeof r.render==='function'?r.render(item&&item.cat,legacy,{size:'lg'}):'';
  return html||legacy;
}

function shopItemHTML(item) {
  var stableKey=String(item&&item._key?item._key:item.id),domKey=stableKey.replace(/[^a-zA-Z0-9_-]/g,'_'),attrKey=stableKey.replace(/\\/g,'\\\\').replace(/'/g,"\\'");
  return '<div class="shop-item" id="si-'+domKey+'">'
    +'<div class="check-circle '+(item.done?'done':'')+'" id="shck-'+domKey+'" onclick="toggleShop(\''+attrKey+'\')" style="cursor:pointer;flex-shrink:0">'+(item.done?'<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>':'')+'</div>'
    +'<div class="shop-emoji fa-utility-item">'+shopUtilityIcon(item)+'</div>'
    +'<div class="shop-info"><div class="shop-name'+(item.done?' done':'')+'">'+item.name+'</div><div class="shop-qty">'+item.qty+' · '+item.cat+'</div></div>'
    +'<button class="shop-del" onclick="deleteShop(\''+attrKey+'\')">✕</button></div>';
}

function persistShopState(operation){
  try { localStorage.setItem('familyapp_food_shop_v001', JSON.stringify(window.shopData || [])); } catch(e) {}
  if(window.HouseholdRepository && typeof window.HouseholdRepository.write === 'function') window.HouseholdRepository.write('groceries', window.shopData || [], { source:'shop.js', operation:operation || 'shopMutation' });
}

function toggleShop(id) {
  var item=shopData.find(function(i){return String(i._key||i.id)===String(id);});if(!item)return;
  var domKey=String(item._key||item.id).replace(/[^a-zA-Z0-9_-]/g,'_'),el=document.getElementById('shck-'+domKey);item.done=!item.done;persistShopState('toggleShop');
  if(el){el.classList.toggle('done',item.done);el.innerHTML=item.done?'<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>:'';if(item.done && typeof spawnParticles === 'function') spawnParticles(el);}
  setTimeout(function(){renderShop();},150);
  if(item.done){if(typeof awardXP === 'function') awardXP(2,'Boodschap');if(typeof addActivity === 'function') addActivity('🛒','#fff3dc',myName+' kocht "'+item.name+'"');}
}

function deleteShop(id) {var i=shopData.findIndex(function(x){return String(x._key||x.id)===String(id);});if(i>-1){shopData.splice(i,1);persistShopState('deleteShop');renderShop();}}
function resetShop() {shopData=shopData.filter(function(i){return !i.done;});persistShopState('resetShop');renderShop();if(typeof showToast === 'function') showToast('Gekochte items geleegd ↺');}
