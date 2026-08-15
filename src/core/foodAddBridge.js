'use strict';
// ============================================================
// FOOD ADD BRIDGE v0.500
// Legacy add-sheet compatibility only. ShoppingLists is authoritative.
// ============================================================
(function(){
  var VERSION='0.500',wrapped=false;

  function classifier(name){
    try{return window.GroceryProductClassifier&&typeof window.GroceryProductClassifier.classify==='function'?window.GroceryProductClassifier.classify(name):null;}catch(e){return null;}
  }
  function shopping(){return window.ShoppingLists||null;}
  function contextToken(){
    var c=window.HouseholdContext;if(!c)throw new Error('HOUSEHOLD_CONTEXT_UNAVAILABLE');
    var uid=c.requireUser(),householdId=c.requireHousehold();c.assertContext({uid:uid,householdId:householdId,requireReady:true});
    return{uid:uid,householdId:householdId};
  }
  function assertCurrent(token){var c=window.HouseholdContext;if(!c||!c.isCurrent(token)){var e=new Error('SHOPPING_CONTEXT_CHANGED');e.code='SHOPPING_CONTEXT_CHANGED';throw e;}}
  function persistShop(){
    // Compatibility no-op: window.shopData is a projection of ShoppingLists.
    // Never persist this projection as an independent source of truth.
    try{window.dispatchEvent(new CustomEvent('familyapp:food:grocery-projection-updated',{detail:{items:window.shopData||[],version:VERSION}}));}catch(e){}
    return window.shopData||[];
  }
  function addShopItemFromSheet(){
    var svc=shopping(),token;
    try{token=contextToken();}catch(e){if(window.showToast)window.showToast('Winkellijst is nog niet beschikbaar');return Promise.reject(e);}
    if(!svc||typeof svc.addItem!=='function'){var err=new Error('SHOPPING_LISTS_UNAVAILABLE');if(window.showToast)window.showToast('Winkellijst is nog niet beschikbaar');return Promise.reject(err);}
    var nameEl=document.getElementById('f1'),qtyEl=document.getElementById('f2'),catEl=document.getElementById('f3'),photoEl=document.getElementById('f4');
    var name=nameEl?nameEl.value.trim():'';
    if(!name){if(typeof window.closeAdd==='function')window.closeAdd();return Promise.resolve(false);}
    var guessed=classifier(name)||{};
    var item={name:name,qty:(qtyEl&&qtyEl.value)||guessed.qty||'1x',cat:(catEl&&catEl.value)||guessed.cat||'Overig',who:token.uid,done:false,photo:(photoEl&&photoEl.value?photoEl.value.trim():null)||guessed.photo||guessed.emoji||null,source:'manual'};
    assertCurrent(token);
    return Promise.resolve(svc.addItem(item)).then(function(record){
      assertCurrent(token);
      if(typeof window.renderShop==='function')window.renderShop();
      if(typeof window.updateStats==='function')window.updateStats();
      if(typeof window.showToast==='function')window.showToast('Boodschap toegevoegd ✓');
      if(typeof window.closeAdd==='function')window.closeAdd();
      return record;
    }).catch(function(e){if(e&&e.code==='SHOPPING_CONTEXT_CHANGED'&&window.showToast)window.showToast('Toevoegen geannuleerd omdat gebruiker of gezin is gewijzigd');throw e;});
  }
  function wrapSaveItem(){
    if(wrapped||typeof window.saveItem!=='function')return;
    var original=window.saveItem;
    window.saveItem=function(){
      if(window.currentAddType==='shop'){addShopItemFromSheet().catch(function(e){console.warn('[FoodAddBridge] add failed',e);});return true;}
      return original.apply(this,arguments);
    };
    window.saveItem.__foodAddBridgeWrapped=true;wrapped=true;
  }
  function boot(){wrapSaveItem();[100,300,800,1500].forEach(function(delay){setTimeout(wrapSaveItem,delay);});try{window.dispatchEvent(new CustomEvent('familyapp:food-add-bridge-ready',{detail:{version:VERSION}}));}catch(e){}}
  window.FoodAddBridge={version:VERSION,boot:boot,persistShop:persistShop,addShopItemFromSheet:addShopItemFromSheet};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
