'use strict';
// ============================================================
// SHOP INTERACTION BURST POLISH v1.0.0
// STEP 7 device polish.
//
// Rapid grocery taps are painted immediately and coalesced per item. Firebase
// writes only start after a short idle window, so the list cannot reorder under
// the user's finger. If a new tap arrives while a write is in flight, the lane
// serializes the next final state instead of dropping or reordering the tap.
// ============================================================
(function(){
  if(window.ShopInteractionBurstPolish)return;

  var VERSION='1.0.0';
  var IDLE_FLUSH_MS=420;
  var lanes={};
  var flushTimer=null;
  var originalToggle=window.toggleShop;
  var CHECK_SVG='<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>';

  function store(){return window.ShoppingListStore||null;}
  function repo(){return window.ShoppingListHouseholdRepository||null;}
  function domKey(value){return String(value==null?'':value).replace(/[^a-zA-Z0-9_-]/g,'_');}
  function laneKey(row,itemKey){return String(row.key)+'|'+String(itemKey);}
  function itemContext(id){
    var s=store(),row=s&&typeof s.active==='function'?s.active():null;
    if(!row||!row.list||!row.list.items)return null;
    var key=String(id==null?'':id),item=row.list.items[key]||null;
    if(!item){Object.keys(row.list.items).some(function(candidate){var value=row.list.items[candidate];if(value&&String(value.id)===key){key=candidate;item=value;return true;}return false;});}
    return item?{row:row,itemKey:key,item:item}:null;
  }
  function paint(id,done){
    var key=domKey(id),check=document.getElementById('shck-'+key),row=document.getElementById('si-'+key);if(!check||!row)return;
    check.classList.toggle('done',!!done);check.innerHTML=done?CHECK_SVG:'';
    var name=row.querySelector('.shop-name');if(name)name.classList.toggle('done',!!done);
    row.classList.remove('shop-toggle-pulse');void row.offsetWidth;row.classList.add('shop-toggle-pulse');
    setTimeout(function(){if(row&&row.classList)row.classList.remove('shop-toggle-pulse');},260);
  }
  function award(record,writtenDone,wasDone){
    if(!record||!writtenDone||wasDone)return;
    if(typeof window.awardXP==='function')window.awardXP(2,'Boodschap');
    if(typeof window.addActivity==='function')window.addActivity('🛒','#fff3dc',(window.myName||'Gezin')+' kocht "'+record.name+'"');
  }
  function settleLane(key,lane,record,writtenDone){
    var wasDone=lane.baseDone;
    lane.writing=false;
    lane.baseDone=writtenDone;
    award(record,writtenDone,wasDone);
    if(lane.dirty&&lane.desiredDone!==lane.baseDone){flushLane(key,lane);return;}
    lane.dirty=false;
    delete lanes[key];
  }
  function failLane(key,lane,error){
    lane.writing=false;lane.dirty=false;delete lanes[key];
    console.warn('[ShopBurst] toggle sync failed',error);
    if(typeof window.renderShop==='function')window.renderShop();
    if(typeof window.showToast==='function')window.showToast('Kon item niet bijwerken. Probeer opnieuw.');
  }
  function flushLane(key,lane){
    if(!lane||lane.writing||!lane.dirty)return;
    var repository=repo();if(!repository||typeof repository.setItem!=='function'){delete lanes[key];return;}
    var desired=!!lane.desiredDone;
    lane.dirty=false;
    if(desired===lane.baseDone){delete lanes[key];return;}
    lane.writing=true;
    repository.setItem(lane.scope,lane.listId,lane.itemKey,{done:desired}).then(function(record){settleLane(key,lane,record,desired);}).catch(function(error){failLane(key,lane,error);});
  }
  function flushAll(){
    if(flushTimer){clearTimeout(flushTimer);flushTimer=null;}
    Object.keys(lanes).forEach(function(key){flushLane(key,lanes[key]);});
  }
  function scheduleFlush(){
    if(flushTimer)clearTimeout(flushTimer);
    flushTimer=setTimeout(flushAll,IDLE_FLUSH_MS);
  }
  function burstToggle(id){
    var found=itemContext(id),repository=repo();
    if(!found||!repository||typeof repository.setItem!=='function')return typeof originalToggle==='function'?originalToggle(id):false;
    var key=laneKey(found.row,found.itemKey),lane=lanes[key];
    if(!lane){lane=lanes[key]={id:id,scope:found.row.scope,listId:found.row.list.id,itemKey:found.itemKey,baseDone:!!found.item.done,desiredDone:!!found.item.done,dirty:false,writing:false};}
    lane.desiredDone=!lane.desiredDone;
    lane.dirty=true;
    paint(id,lane.desiredDone);
    scheduleFlush();
    return false;
  }
  function installStyles(){
    if(document.getElementById('shop-burst-polish-style'))return;
    var style=document.createElement('style');style.id='shop-burst-polish-style';style.textContent=[
      '#screen-shop .check-circle{position:relative;touch-action:manipulation;-webkit-tap-highlight-color:transparent;user-select:none;-webkit-user-select:none}',
      '#screen-shop .check-circle:after{content:"";position:absolute;inset:-11px;border-radius:50%}',
      '.fam-modal-overlay:has(.shopping-conflict-list) .fam-modal-sheet{background:linear-gradient(180deg,#fff 0%,#fbfff9 52%,#f6fbf3 100%)}',
      '.fam-modal-overlay:has(.shopping-conflict-list) .fam-modal-title{color:#214d27}',
      '.shopping-conflict-intro{padding:11px 12px!important;border-radius:14px;background:linear-gradient(135deg,#eef8e9,#f8fcf5);border:1px solid #d7e9cf;color:#49634b!important}',
      '.shopping-conflict-intro b{color:#235c2c}',
      '.shopping-conflict-row{border:1.5px solid #d4e7cc!important;background:linear-gradient(135deg,#ffffff,#f1f8ed)!important;box-shadow:0 5px 15px rgba(47,110,37,.08)}',
      '.shopping-conflict-row select{border:1.5px solid #b9d7ae!important;background:#fff!important;color:#285d2a!important;box-shadow:0 2px 8px rgba(47,110,37,.06);font-weight:800!important}',
      '.fam-modal-overlay:has(.shopping-conflict-list) .fam-modal-primary{background:linear-gradient(135deg,#55973e,#2f742a)!important;color:#fff!important;box-shadow:0 8px 18px rgba(47,116,42,.24)}',
      '.fam-modal-overlay:has(.shopping-conflict-list) .fam-modal-secondary{background:linear-gradient(135deg,#fff7e8,#ffefd0)!important;color:#8b5713!important;border:1px solid #efd5a5!important;box-shadow:0 5px 14px rgba(139,87,19,.10)}',
      '.fam-modal-overlay:has(.shopping-conflict-list) .fam-modal-btn:active{transform:scale(.985)}'
    ].join('\n');document.head.appendChild(style);
  }
  function install(){installStyles();window.toggleShop=burstToggle;}

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
  window.addEventListener('pagehide',flushAll);
  document.addEventListener('visibilitychange',function(){if(document.visibilityState==='hidden')flushAll();});
  window.ShopInteractionBurstPolish={version:VERSION,flush:flushAll,status:function(){return{queued:Object.keys(lanes).length,idleFlushMs:IDLE_FLUSH_MS};}};
})();
