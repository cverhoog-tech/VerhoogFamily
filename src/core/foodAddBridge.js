'use strict';
// ============================================================
// FOOD ADD BRIDGE v0.338
// Restores grocery add flow by handling shop save directly before the
// legacy addSheet/AppState route can fail silently.
// ============================================================

(function(){
  var VERSION = '0.338';
  var STORAGE_KEY = 'familyapp_food_shop_v001';
  var wrapped = false;

  function safeParse(raw, fallback){
    try { return raw ? JSON.parse(raw) : fallback; } catch(error) { return fallback; }
  }

  function ensureShopState(){
    if(!Array.isArray(window.shopData)) {
      window.shopData = safeParse(localStorage.getItem(STORAGE_KEY), []);
    }
    window.shopNextId = Math.max.apply(null, (window.shopData || []).map(function(item){ return Number(item.id) || 0; }).concat([0])) + 1;
  }

  function persistShop(){
    ensureShopState();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(window.shopData || []));
    if(window.HouseholdRepository && typeof window.HouseholdRepository.write === 'function'){
      window.HouseholdRepository.write('groceries', window.shopData || [], {
        source: 'foodAddBridge',
        operation: 'addGrocery',
        version: VERSION
      });
    }
    try {
      window.dispatchEvent(new CustomEvent('familyapp:food:grocery-updated', { detail: { items: window.shopData || [], version: VERSION } }));
    } catch(error) {}
  }

  function addShopItemFromSheet(){
    ensureShopState();
    var nameEl = document.getElementById('f1');
    var qtyEl = document.getElementById('f2');
    var catEl = document.getElementById('f3');
    var photoEl = document.getElementById('f4');
    var name = nameEl ? nameEl.value.trim() : '';
    if(!name){
      if(typeof window.closeAdd === 'function') window.closeAdd();
      return true;
    }

    var item = {
      id: window.shopNextId++,
      name: name,
      qty: (qtyEl && qtyEl.value) ? qtyEl.value : '1x',
      cat: (catEl && catEl.value) ? catEl.value : 'Overig',
      who: window.myName || 'Gezin',
      done: false,
      photo: photoEl && photoEl.value ? photoEl.value.trim() || null : null
    };

    window.shopData.unshift(item);
    persistShop();

    if(typeof window.renderShop === 'function') window.renderShop();
    if(typeof window.updateStats === 'function') window.updateStats();
    if(typeof window.addActivity === 'function') window.addActivity('🛒','#fff3dc',(window.myName || 'Gezin')+' voegde "'+name+'" toe');
    if(typeof window.showToast === 'function') window.showToast('Boodschap toegevoegd ✓');
    if(typeof window.closeAdd === 'function') window.closeAdd();
    return true;
  }

  function wrapSaveItem(){
    if(wrapped || typeof window.saveItem !== 'function') return;
    var originalSaveItem = window.saveItem;
    window.saveItem = function(){
      if(window.currentAddType === 'shop') return addShopItemFromSheet();
      return originalSaveItem.apply(this, arguments);
    };
    window.saveItem.__foodAddBridgeWrapped = true;
    wrapped = true;
  }

  function boot(){
    ensureShopState();
    wrapSaveItem();
    [100, 300, 800, 1500].forEach(function(delay){ setTimeout(wrapSaveItem, delay); });
    try { window.dispatchEvent(new CustomEvent('familyapp:food-add-bridge-ready', { detail: { version: VERSION } })); } catch(error) {}
  }

  window.FoodAddBridge = {
    version: VERSION,
    boot: boot,
    persistShop: persistShop,
    addShopItemFromSheet: addShopItemFromSheet
  };

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
