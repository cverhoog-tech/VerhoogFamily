'use strict';
// ============================================================
// SHOPPING LISTS v0.420 — Beta 1
// Multiple realtime household/private lists while preserving legacy shop UI.
// ============================================================
(function(){
  if(window.ShoppingLists) return;
  var VERSION='0.420';
  var COLLECTION='shoppingLists';
  var PREF_KEY='familyapp_active_shopping_list_v1';
  var sharedLists={}, privateLists={}, activeKey=null, booted=false, applying=false;
  var originalRender=null, originalToggle=null, originalDelete=null, originalReset=null;

  function store(){return window.FamilyDataStore;}
  function uid(){var s=store()&&store().status?store().status():{};return s.userId||null;}
  function now(){return Date.now();}
  function all(){
    var out=[];
    Object.keys(sharedLists||{}).forEach(function(id){var x=sharedLists[id];if(x)out.push({scope:'shared',list:x,key:'shared:'+id});});
    Object.keys(privateLists||{}).forEach(function(id){var x=privateLists[id];if(x)out.push({scope:'private',list:x,key:'private:'+id});});
    return out.sort(function(a,b){return Number(b.list.updatedAt||0)-Number(a.list.updatedAt||0);});
  }
  function active(){
    var rows=all();
    var found=rows.find(function(x){return x.key===activeKey;});
    if(found)return found;
    var shared=rows.find(function(x){return x.scope==='shared';});
    found=shared||rows[0]||null;
    if(found)setActive(found.key,false);
    return found;
  }
  function setActive(key,rerender){
    activeKey=key;
    try{localStorage.setItem(PREF_KEY,key);}catch(e){}
    applyActive(rerender!==false);
  }
  function applyActive(rerender){
    var row=active();
    if(!row)return;
    applying=true;
    window.shopData=Array.isArray(row.list.items)?row.list.items:[];
    window.shopNextId=Math.max.apply(null,window.shopData.map(function(i){return Number(i.id)||0;}).concat([0]))+1;
    applying=false;
    renderSwitcher();
    if(rerender&&typeof originalRender==='function')originalRender();
  }
  function saveActiveItems(items){
    var row=active();
    if(!row||!store())return Promise.resolve(false);
    var updated=Object.assign({},row.list,{items:Array.isArray(items)?items:[],updatedAt:now(),updatedBy:uid()});
    if(row.scope==='shared')sharedLists[updated.id]=updated;else privateLists[updated.id]=updated;
    var fn=row.scope==='shared'?store().writeSharedRecord:store().writePrivateRecord;
    return fn.call(store(),COLLECTION,updated.id,updated).then(function(){renderSwitcher();return true;});
  }
  function mutateActive(updater){
    var row=active();if(!row||!store())return Promise.resolve(false);
    var fn=row.scope==='shared'?store().mutateSharedRecord:store().mutatePrivateRecord;
    return fn.call(store(),COLLECTION,row.list.id,function(current){
      current=current||row.list;
      var items=Array.isArray(current.items)?current.items:[];
      current.items=updater(items)||items;
      current.updatedAt=now();current.updatedBy=uid();return current;
    },row.list);
  }

  function ensureStyles(){
    if(document.getElementById('shopping-lists-v1-style'))return;
    var st=document.createElement('style');st.id='shopping-lists-v1-style';
    st.textContent=[
      '.shopping-listbar{margin:0 16px 12px;display:flex;gap:9px;align-items:center}',
      '.shopping-listpick{min-width:0;flex:1;border:1px solid var(--c-border);background:var(--c-surface);border-radius:16px;padding:10px 12px;display:flex;align-items:center;gap:9px;box-shadow:0 5px 18px rgba(15,23,42,.05)}',
      '.shopping-listpick .sl-icon{font-size:21px}.shopping-listpick .sl-copy{min-width:0;flex:1;text-align:left}.shopping-listpick b{display:block;font-size:13px;color:var(--c-text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.shopping-listpick small{display:block;font-size:10px;color:var(--c-text2);margin-top:1px}',
      '.shopping-list-add{width:43px;height:43px;border:0;border-radius:15px;background:var(--c-primary);color:#fff;font-size:23px;font-weight:500;box-shadow:0 7px 18px rgba(63,127,47,.2)}',
      '.shopping-list-option{width:100%;border:1px solid var(--c-border);background:var(--c-surface);border-radius:16px;padding:11px 12px;margin:7px 0;display:flex;align-items:center;gap:10px;text-align:left}',
      '.shopping-list-option.active{border-color:var(--c-primary);box-shadow:0 0 0 3px rgba(63,127,47,.08)}',
      '.shopping-list-option .copy{flex:1;min-width:0}.shopping-list-option b{display:block;color:var(--c-text);font-size:14px}.shopping-list-option small{font-size:11px;color:var(--c-text2)}',
      '.shopping-privacy-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}.shopping-privacy{border:1.5px solid var(--c-border);border-radius:15px;padding:11px;background:var(--c-surface);font-weight:800;color:var(--c-text2);text-align:center}.shopping-privacy.selected{border-color:var(--c-primary);background:rgba(63,127,47,.08);color:var(--c-primary)}'
    ].join('\n');document.head.appendChild(st);
  }
  function ensureBar(){
    var screen=document.getElementById('screen-shop');if(!screen)return null;
    var header=screen.querySelector('.list-header');if(!header)return null;
    var bar=document.getElementById('shopping-listbar');
    if(!bar){bar=document.createElement('div');bar.id='shopping-listbar';bar.className='shopping-listbar';header.insertAdjacentElement('afterend',bar);}
    return bar;
  }
  function renderSwitcher(){
    ensureStyles();var bar=ensureBar();if(!bar)return;
    var row=active();
    if(!row){bar.innerHTML='<button class="shopping-listpick" type="button"><span class="sl-icon">🛒</span><span class="sl-copy"><b>Gezinslijst</b><small>Lijst wordt voorbereid…</small></span></button>';return;}
    var privacy=row.scope==='private'?'🔒 Privé':'👨‍👩‍👧 Gezin · live';
    bar.innerHTML='<button class="shopping-listpick" id="shopping-list-pick" type="button"><span class="sl-icon">'+(row.list.icon||'🛒')+'</span><span class="sl-copy"><b>'+escapeHtml(row.list.name||'Winkellijst')+'</b><small>'+privacy+' · '+(row.list.items||[]).filter(function(i){return !i.done;}).length+' te kopen</small></span><span>⌄</span></button><button class="shopping-list-add" id="shopping-list-add" type="button" aria-label="Nieuwe winkellijst">+</button>';
    document.getElementById('shopping-list-pick').onclick=openPicker;
    document.getElementById('shopping-list-add').onclick=openCreate;
  }
  function escapeHtml(s){var d=document.createElement('div');d.textContent=String(s||'');return d.innerHTML;}
  function openPicker(){
    if(!window.BottomSheet)return;
    var rows=all();
    var html='<div style="font-size:12px;color:var(--c-text2);margin-bottom:8px">Kies welke lijst je wilt gebruiken. Gezinslijsten synchroniseren live; privélijsten zijn alleen voor jou.</div>'+
      rows.map(function(r){return '<button type="button" class="shopping-list-option '+(r.key===activeKey?'active':'')+'" data-list-key="'+r.key+'"><span style="font-size:23px">'+(r.list.icon||'🛒')+'</span><span class="copy"><b>'+escapeHtml(r.list.name)+'</b><small>'+(r.scope==='private'?'🔒 Alleen ik':'👨‍👩‍👧 Gezin · live')+' · '+(r.list.items||[]).length+' items</small></span><span>›</span></button>';}).join('');
    window.BottomSheet.open({title:'Winkellijst kiezen',html:html,onOpen:function(ctx){ctx.modal.querySelectorAll('[data-list-key]').forEach(function(btn){btn.onclick=function(){setActive(btn.getAttribute('data-list-key'),true);ctx.close();};});},actions:[{label:'Sluiten'}]});
  }
  function openCreate(){
    if(!window.BottomSheet)return;
    var icons=['🛒','🏠','👕','🎁','🔨','💻','🧴','🧸','🐾','🏃','🚗','📚','🌱','🧳'];
    var html='<div class="fam-modal-field"><label>Naam</label><input id="sl-name" placeholder="bijv. IKEA, Vakantie of Weekboodschappen"></div><div class="fam-modal-field"><label>Icoon</label><select id="sl-icon">'+icons.map(function(x){return '<option>'+x+'</option>';}).join('')+'</select></div><div class="fam-modal-field"><label>Zichtbaarheid</label><div class="shopping-privacy-grid"><button type="button" class="shopping-privacy selected" data-privacy="household">👨‍👩‍👧<br>Gezin</button><button type="button" class="shopping-privacy" data-privacy="private">🔒<br>Alleen ik</button></div><input type="hidden" id="sl-privacy" value="household"></div>';
    window.BottomSheet.open({title:'Nieuwe winkellijst',html:html,onOpen:function(ctx){ctx.modal.querySelectorAll('[data-privacy]').forEach(function(btn){btn.onclick=function(){ctx.modal.querySelectorAll('[data-privacy]').forEach(function(x){x.classList.remove('selected');});btn.classList.add('selected');ctx.modal.querySelector('#sl-privacy').value=btn.getAttribute('data-privacy');};});},actions:[{label:'Annuleren'},{label:'Lijst maken',primary:true,onClick:function(ctx){var name=ctx.modal.querySelector('#sl-name').value.trim();if(!name){if(window.showToast)showToast('Geef de lijst een naam');return false;}var privacy=ctx.modal.querySelector('#sl-privacy').value;createList({name:name,icon:ctx.modal.querySelector('#sl-icon').value,visibility:privacy});}}]});
  }
  function createList(options){
    var s=store();if(!s)return Promise.resolve(false);
    var scope=options.visibility==='private'?'private':'shared';var id=s.makeId('list');
    var list={id:id,name:options.name,icon:options.icon||'🛒',category:'shopping',visibility:scope==='private'?'private':'household',ownerUid:uid(),createdBy:uid(),createdAt:now(),updatedAt:now(),items:[]};
    if(scope==='shared')sharedLists[id]=list;else privateLists[id]=list;
    var fn=scope==='shared'?s.writeSharedRecord:s.writePrivateRecord;
    return fn.call(s,COLLECTION,id,list).then(function(){setActive(scope+':'+id,true);if(window.showToast)showToast(scope==='private'?'Privélijst gemaakt 🔒':'Gezinslijst gemaakt ✓');return list;});
  }
  function installLegacyBridges(){
    if(!originalRender&&typeof window.renderShop==='function')originalRender=window.renderShop;
    if(!originalToggle&&typeof window.toggleShop==='function')originalToggle=window.toggleShop;
    if(!originalDelete&&typeof window.deleteShop==='function')originalDelete=window.deleteShop;
    if(!originalReset&&typeof window.resetShop==='function')originalReset=window.resetShop;
    if(originalRender)window.renderShop=function(){applyActive(false);var r=originalRender.apply(this,arguments);renderSwitcher();return r;};
    if(originalToggle)window.toggleShop=function(id){var result=originalToggle.apply(this,arguments);saveActiveItems(window.shopData||[]);return result;};
    if(originalDelete)window.deleteShop=function(id){var result=originalDelete.apply(this,arguments);saveActiveItems(window.shopData||[]);return result;};
    if(originalReset)window.resetShop=function(){var result=originalReset.apply(this,arguments);saveActiveItems(window.shopData||[]);return result;};
  }
  function onData(scope,value){
    if(scope==='shared')sharedLists=value||{};else privateLists=value||{};
    var row=active();
    if(row){window.shopData=Array.isArray(row.list.items)?row.list.items:[];if(typeof originalRender==='function'&&window._currentScreen==='shop')originalRender();}
    renderSwitcher();
  }
  function ensureDefault(){
    var s=store();if(!s)return Promise.resolve();
    return s.migrateLegacyShopping().then(function(){
      return Promise.all([s.readShared(COLLECTION,{}),s.readPrivate(COLLECTION,{})]);
    }).then(function(values){
      sharedLists=values[0]||{};privateLists=values[1]||{};
      if(!Object.keys(sharedLists).length&&!Object.keys(privateLists).length){
        var list=s.defaultShoppingList(Array.isArray(window.shopData)?window.shopData:[]);sharedLists[list.id]=list;return s.writeSharedRecord(COLLECTION,list.id,list);
      }
    });
  }
  function boot(){
    if(booted||!store())return;booted=true;ensureStyles();installLegacyBridges();
    try{activeKey=localStorage.getItem(PREF_KEY)||null;}catch(e){}
    ensureDefault().then(function(){
      store().subscribeShared(COLLECTION,function(v){onData('shared',v);},{});
      store().subscribePrivate(COLLECTION,function(v){onData('private',v);},{});
      applyActive(true);
    });
  }
  window.ShoppingLists={version:VERSION,boot:boot,all:all,active:active,setActive:setActive,create:createList,saveActiveItems:saveActiveItems,mutateActive:mutateActive,openPicker:openPicker,openCreate:openCreate};
  window.addEventListener('familyapp:modules:ready',function(){setTimeout(boot,50);});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){setTimeout(boot,500);});else setTimeout(boot,500);
})();
