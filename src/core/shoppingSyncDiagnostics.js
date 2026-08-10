'use strict';
// ============================================================
// SHOPPING SYNC DIAGNOSTICS v1
// Temporary debug tool for the cross-device shopping-list realtime sync bug.
// Call window.debugShoppingSync() on each phone and compare the two outputs.
// Safe to delete once the fix is confirmed on both devices.
// ============================================================
(function(){
  if(window.debugShoppingSync) return;
  var BUILD = 'shopping-sync-diag-v1';

  function fbUid(){try{return (window.fbUser||(window.firebase&&firebase.auth&&firebase.auth().currentUser)||{}).uid||null;}catch(e){return null;}}
  function fdsStatus(){try{return window.FamilyDataStore?window.FamilyDataStore.status():null;}catch(e){return{error:String(e)};}}
  function activeRow(){try{return window.ShoppingLists?window.ShoppingLists.active():null;}catch(e){return{error:String(e)};}}
  function computedPath(){
    var row=activeRow();
    if(!row||!row.list) return null;
    var fid=window.fbFamilyId;
    if(row.scope==='shared') return 'families/'+fid+'/shared/shoppingLists/'+row.list.id;
    return 'users/'+fbUid()+'/private/shoppingLists/'+row.list.id;
  }

  function snapshotShared(cb){
    try{
      if(!window.fbDb || !window.fbFamilyId){ cb({error:'no db or no fbFamilyId'}); return; }
      window.fbDb.ref('families/'+window.fbFamilyId+'/shared/shoppingLists').once('value')
        .then(function(s){ cb(s.val()); })
        .catch(function(e){ cb({error:String(e&&e.message||e)}); });
    }catch(e){ cb({error:String(e)}); }
  }

  function pendingWrites(){
    try{
      var raw=localStorage.getItem('familyapp_data_v1_pending_writes');
      return raw?JSON.parse(raw):[];
    }catch(e){return [{error:String(e)}];}
  }

  function collect(cb){
    var row=activeRow();
    var out={
      build:BUILD,
      timestamp:new Date().toISOString(),
      uid:fbUid(),
      fbFamilyId:window.fbFamilyId||null,
      offlineMode:!!window.offlineMode,
      firebaseDbAvailable:!!window.fbDb,
      familyDataStoreLoaded:!!window.FamilyDataStore,
      shoppingListsLoaded:!!window.ShoppingLists,
      familyDataStoreStatus:fdsStatus(),
      activeListKey:row&&row.key||null,
      activeListScope:row&&row.scope||null,
      activeListId:row&&row.list&&row.list.id||null,
      activeListName:row&&row.list&&row.list.name||null,
      computedFirebasePath:computedPath(),
      sharedListsCount:(function(){try{return window.ShoppingLists?window.ShoppingLists.all().filter(function(r){return r.scope==='shared';}).length:null;}catch(e){return null;}})(),
      privateListsCount:(function(){try{return window.ShoppingLists?window.ShoppingLists.all().filter(function(r){return r.scope==='private';}).length:null;}catch(e){return null;}})(),
      pendingWrites:pendingWrites(),
      localShopDataCount:Array.isArray(window.shopData)?window.shopData.length:null
    };
    snapshotShared(function(sharedSnapshot){out.firebaseSharedShoppingListsSnapshot=sharedSnapshot;cb(out);});
  }

  function renderPanel(data){
    var id='shopping-sync-diag-panel';
    var old=document.getElementById(id);if(old) old.remove();
    var pre=JSON.stringify(data,null,2).replace(/</g,'&lt;');
    var el=document.createElement('div');el.id=id;
    el.style.cssText='position:fixed;inset:0;z-index:99999;background:rgba(5,6,12,.96);color:#e5e7eb;overflow:auto;padding:16px;font:11px/1.4 monospace;';
    el.innerHTML='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px"><b style="font-size:14px;color:#fff">Shopping Sync Diagnostics</b><button id="shopping-sync-diag-close" style="border:0;border-radius:10px;background:#334155;color:#fff;padding:8px 12px;font-weight:800">Sluiten</button></div><pre style="white-space:pre-wrap;word-break:break-all">'+pre+'</pre>';
    document.body.appendChild(el);document.getElementById('shopping-sync-diag-close').onclick=function(){el.remove();};
  }

  window.debugShoppingSync=function(){collect(function(data){console.log('[debugShoppingSync]',data);renderPanel(data);});return 'Verzamelen…';};
  console.log('[shoppingSyncDiagnostics] loaded ('+BUILD+'). Run window.debugShoppingSync() to inspect.');
})();

function loadOrderedTaskModule(flag,src){
  if(window[flag]) return;
  window[flag]=true;
  var script=document.createElement('script');
  script.src=src;
  script.async=false;
  script.defer=true;
  document.head.appendChild(script);
}

// Shared task data must load after FamilyDataStore.
loadOrderedTaskModule('__familySharedTasksLoader','src/modules/tasks/taskSharedData.js?v=2');
// UID create bridge waits for the classic addSheet globals before installing itself.
loadOrderedTaskModule('__familyTaskUidCreateLoader','src/modules/tasks/taskUidCreateBridge.js?v=1');
