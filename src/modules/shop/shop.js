'use strict';
// ============================================================
// BOODSCHAPPEN v0.354
// Grocery add flow loads ModalManager + BottomSheet deterministically.
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
      .then(function(){ return loadScriptOnce('grocery-quick-add-modal-js', 'src/core/groceryQuickAddModal.js', function(){ return !!window.GroceryQuickAddModal; }); })
      .then(function(){
        if(window.GroceryQuickAddModal && typeof window.GroceryQuickAddModal.installButton === 'function') window.GroceryQuickAddModal.installButton();
      });
    return loadingPromise;
  }

  function openGroceryQuickAdd(){
    ensureGroceryAddStack().then(function(){
      if(window.GroceryQuickAddModal && typeof window.GroceryQuickAddModal.open === 'function') {
        window.GroceryQuickAddModal.open();
      } else if(typeof window.openAdd === 'function') {
        window.openAdd('shop');
      }
    });
    return false;
  }

  function wireShopAddButton(){
    var screen = document.getElementById('screen-shop');
    if(!screen) return;
    var header = screen.querySelector('.list-header');
    if(!header) return;
    var btn = header.querySelector('.add-btn');
    if(!btn){
      btn = document.createElement('button');
      btn.className = 'add-btn';
      btn.textContent = '+ Toevoegen';
      header.appendChild(btn);
    }
    btn.setAttribute('onclick', 'return openGroceryQuickAdd()');
    btn.onclick = function(e){
      if(e) e.preventDefault();
      return openGroceryQuickAdd();
    };
    btn.textContent = '+ Toevoegen';
    btn.style.pointerEvents = 'auto';
  }

  window.openGroceryQuickAdd = openGroceryQuickAdd;
  window.wireShopAddButton = wireShopAddButton;

  function bootShopAdd(){
    ensureGroceryAddStack();
    wireShopAddButton();
    [100, 300, 800, 1500, 2500].forEach(function(delay){ setTimeout(wireShopAddButton, delay); });
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bootShopAdd);
  else bootShopAdd();
})();

function renderShop() {
  var openEl=document.getElementById('shop-open');
  var doneEl=document.getElementById('shop-done');
  var ocnt=document.getElementById('shop-open-cnt');
  var dcnt=document.getElementById('shop-done-cnt');
  if(!openEl)return;

  if(!Array.isArray(window.shopData)) window.shopData=[];
  var open=shopData.filter(function(i){return !i.done;});
  var done=shopData.filter(function(i){return i.done;});
  if(ocnt)ocnt.textContent=open.length;
  if(dcnt)dcnt.textContent=done.length;
  openEl.innerHTML=open.map(shopItemHTML).join('');
  doneEl.innerHTML=done.map(shopItemHTML).join('');
  if(typeof updateStats === 'function') updateStats();
  if(typeof wireShopAddButton === 'function') wireShopAddButton();
}

function shopItemHTML(item) {
  return '<div class="shop-item" id="si-'+item.id+'">'
    +'<div class="check-circle '+(item.done?'done':'')+'" id="shck-'+item.id+'" onclick="toggleShop('+item.id+')" style="cursor:pointer;flex-shrink:0">'
    +(item.done?'<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>':'')
    +'</div>'
    +'<div class="shop-emoji">'+((item.photo&&!String(item.photo).startsWith('http'))?item.photo:'📦')+'</div>'
    +'<div class="shop-info">'
    +'<div class="shop-name'+(item.done?' done':'')+'">'+item.name+'</div>'
    +'<div class="shop-qty">'+item.qty+' · '+item.cat+'</div>'
    +'</div>'
    +'<button class="shop-del" onclick="deleteShop('+item.id+')">✕</button>'
    +'</div>';
}

function persistShopState(operation){
  try { localStorage.setItem('familyapp_food_shop_v001', JSON.stringify(window.shopData || [])); } catch(e) {}
  if(window.HouseholdRepository && typeof window.HouseholdRepository.write === 'function'){
    window.HouseholdRepository.write('groceries', window.shopData || [], { source:'shop.js', operation:operation || 'shopMutation' });
  }
}

function toggleShop(id) {
  var item=shopData.find(function(i){return i.id===id;});if(!item)return;
  var el=document.getElementById('shck-'+id);
  item.done=!item.done;
  persistShopState('toggleShop');
  if(el){
    el.classList.toggle('done',item.done);
    el.innerHTML=item.done?'<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>':'';
    if(item.done && typeof spawnParticles === 'function') spawnParticles(el);
  }
  setTimeout(function(){renderShop();},150);
  if(item.done){
    if(typeof awardXP === 'function') awardXP(2,'Boodschap');
    if(typeof addActivity === 'function') addActivity('🛒','#fff3dc',myName+' kocht "'+item.name+'"');
  }
}

function deleteShop(id) {
  var i=shopData.findIndex(function(x){return x.id===id;});
  if(i>-1){shopData.splice(i,1);persistShopState('deleteShop');renderShop();}
}

function resetShop() {
  shopData=shopData.filter(function(i){return !i.done;});
  persistShopState('resetShop');
  renderShop();
  if(typeof showToast === 'function') showToast('Gekochte items geleegd ↺');
}

