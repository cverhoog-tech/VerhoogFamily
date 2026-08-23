'use strict';
// ============================================================
// SHOPPING PAGE v2.1.0
// STEP 7 mobile-first presentation rebuild.
// Fast keyed interaction stays intact; this revision restores the lighter
// pre-rework list selector and refines product controls.
// ============================================================
(function(){
  if(window.ShoppingPageV2)return;

  var VERSION='2.1.0';
  var FLUSH_IDLE_MS=220;
  var STYLE_ID='shopping-page-v2-style';
  var mounted=false;
  var screen=null;
  var currentView='open';
  var currentListKey=null;
  var localItems={};
  var lanes={};
  var flushTimer=null;
  var storeUnsubscribe=null;
  var pointerDown=null;

  function store(){return window.ShoppingListStore||null;}
  function repository(){return window.ShoppingListHouseholdRepository||null;}
  function clone(value){try{return JSON.parse(JSON.stringify(value));}catch(e){return value;}}
  function esc(value){var d=document.createElement('div');d.textContent=String(value==null?'':value);return d.innerHTML;}
  function domKey(value){return String(value==null?'':value).replace(/[^a-zA-Z0-9_-]/g,'_');}
  function toast(message){if(typeof window.showToast==='function')window.showToast(message);}
  function icon(key,size){var r=window.FamilyAppIconRenderer;return r&&typeof r.render==='function'?r.render(key,{size:size||'sm',label:false,className:'fa-utility-icon'}):'';}
  function utilityIcon(item,size){var r=window.FamilyAppUtilityIconResolver;return r&&typeof r.render==='function'?r.render(item&&item.cat,item&&item.photo,{size:size||'lg',name:item&&item.name||''}):'';}
  function category(item){var value=String(item&&item.cat||'').trim();return value||'Overig';}
  function qty(item){return String(item&&item.qty||((item&&item.amount!=null?item.amount:1)+' '+(item&&item.unit||'st')));}
  function allItems(){return Object.keys(localItems).map(function(key){var row=localItems[key];return row?Object.assign({},row,{_key:row._key||key}):null;}).filter(Boolean);}
  function sortedVisible(){var done=currentView==='done';return allItems().filter(function(item){return !!item.done===done;}).sort(function(a,b){return Number(b.createdAt||0)-Number(a.createdAt||0);});}
  function counts(){var open=0,done=0;allItems().forEach(function(item){if(item.done)done++;else open++;});return{open:open,done:done};}

  function ensureStyles(){
    if(document.getElementById(STYLE_ID))return;
    var css=document.createElement('style');css.id=STYLE_ID;css.textContent=[
      '#screen-shop{padding-bottom:18px}',
      '#screen-shop .shopv2-shell{max-width:760px;margin:0 auto;padding:4px 14px 20px}',
      '#screen-shop .shopv2-top{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:8px 2px 11px}',
      '#screen-shop .shopv2-top h2{margin:0;font-size:23px;line-height:1.15;color:var(--c-text);letter-spacing:-.025em}',
      '#screen-shop .shopv2-add{border:0;border-radius:999px;background:linear-gradient(135deg,var(--c-primary),#3f7836);color:#fff;font-weight:850;font-size:13px;min-height:42px;padding:0 16px;box-shadow:0 7px 18px rgba(63,120,54,.20);touch-action:manipulation}',

      /* Restore the lighter list selector that preceded the page rework. */
      '#screen-shop .shopv2-picker{width:100%;display:flex;align-items:center;gap:9px;border:1px solid var(--c-border);background:var(--c-surface);border-radius:16px;min-height:54px;padding:7px 11px;margin-bottom:10px;text-align:left;touch-action:manipulation;box-shadow:0 3px 10px rgba(34,45,35,.035)}',
      '#screen-shop .shopv2-picker-icon{width:32px;height:32px;border-radius:11px;background:var(--c-surface2);display:grid;place-items:center;flex:0 0 auto}',
      '#screen-shop .shopv2-picker-copy{min-width:0;flex:1}',
      '#screen-shop .shopv2-picker-copy b{display:block;color:var(--c-text);font-size:15px;line-height:1.25;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '#screen-shop .shopv2-picker-copy small{display:block;color:var(--c-muted);font-size:11.5px;line-height:1.3;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '#screen-shop .shopv2-chevron{font-size:17px;line-height:1;color:var(--c-muted);padding-left:4px;flex:0 0 auto}',

      '#screen-shop .shopv2-tabs{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:4px;margin:0 0 12px;padding:4px;border:1px solid rgba(65,88,61,.07);background:var(--c-surface2);border-radius:18px;box-shadow:inset 0 1px 3px rgba(26,45,25,.05)}',
      '#screen-shop .shopv2-tab{width:100%;height:48px;border-radius:14px;border:0;background:transparent;display:flex;align-items:center;justify-content:center;gap:8px;color:var(--c-text2);font-size:13.5px;font-weight:850;touch-action:manipulation;-webkit-tap-highlight-color:transparent}',
      '#screen-shop .shopv2-tab strong{min-width:25px;height:25px;border-radius:999px;background:rgba(89,104,86,.08);display:grid;place-items:center;font-size:11px;color:var(--c-text2)}',
      '#screen-shop .shopv2-tab.active{background:var(--c-surface);color:#285c2b;box-shadow:0 5px 14px rgba(39,70,35,.10),inset 0 0 0 1px rgba(75,132,56,.11)}',
      '#screen-shop .shopv2-tab.active strong{background:#dcefd5;color:#285c2b}',

      '#screen-shop .shopv2-list{display:flex;flex-direction:column;gap:8px;min-height:72px;padding:1px 0 2px}',
      '#screen-shop .shopv2-item{display:grid;grid-template-columns:minmax(0,1fr) 42px;align-items:stretch;border:0;background:var(--c-surface);border-radius:14px;min-height:58px;overflow:hidden;contain:layout paint;box-shadow:0 4px 14px rgba(34,45,35,.055),0 0 0 1px rgba(72,91,68,.045)}',
      '#screen-shop .shopv2-item-main{min-width:0;border:0;background:transparent;display:grid;grid-template-columns:28px 38px minmax(0,1fr);align-items:center;gap:8px;padding:7px 4px 7px 10px;text-align:left;touch-action:manipulation;-webkit-tap-highlight-color:transparent}',

      /* Deliberately slim visual checkbox; the whole product row remains the touch target. */
      '#screen-shop .shopv2-check{width:23px;height:23px;border-radius:50%;border:1.4px solid #9fb39b;background:transparent;display:grid;place-items:center;transition:transform .08s ease,background-color .08s ease,border-color .08s ease}',
      '#screen-shop .shopv2-check.done{background:#4d8b3c;border-color:#4d8b3c}',
      '#screen-shop .shopv2-check svg{width:11px;height:11px}',

      /* Product artwork floats on the row: no square tile, outline or shadow. */
      '#screen-shop .shopv2-product{width:38px;height:38px;background:transparent;border:0;border-radius:0;display:grid;place-items:center;overflow:visible;box-shadow:none}',
      '#screen-shop .shopv2-product .fa-icon{max-width:36px;max-height:36px}',
      '#screen-shop .shopv2-info{min-width:0;display:flex;flex-direction:column;align-items:flex-start;justify-content:center}',
      '#screen-shop .shopv2-name{display:block;width:100%;font-size:14px;line-height:1.25;font-weight:850;color:var(--c-text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '#screen-shop .shopv2-meta{display:block;width:100%;font-size:10.5px;line-height:1.25;color:var(--c-text2);margin-top:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '#screen-shop .shopv2-delete{align-self:center;width:30px;height:36px;margin-right:6px;border:0;border-radius:10px;background:transparent;color:#a1aaa0;font-size:15px;display:grid;place-items:center;touch-action:manipulation;-webkit-tap-highlight-color:transparent}',
      '#screen-shop .shopv2-delete:active{background:rgba(130,82,82,.08);color:#9b5757}',
      '#screen-shop .shopv2-item-main:active,#screen-shop .shopv2-tab:active,#screen-shop .shopv2-add:active,#screen-shop .shopv2-picker:active{transform:scale(.99)}',

      '#screen-shop .shopv2-empty{display:none;text-align:center;padding:30px 18px 26px;color:var(--c-text2)}',
      '#screen-shop .shopv2-empty.show{display:block}',
      '#screen-shop .shopv2-empty-icon{width:58px;height:58px;display:grid;place-items:center;margin:0 auto 10px}',
      '#screen-shop .shopv2-empty b{display:block;color:var(--c-text);font-size:14px}',
      '#screen-shop .shopv2-empty small{display:block;font-size:12px;margin-top:4px;line-height:1.45}',
      '#screen-shop .shopv2-clear{display:none;width:100%;margin-top:12px;min-height:42px;border-radius:13px;border:1px solid rgba(107,91,91,.11);background:transparent;color:var(--c-text2);font-size:12px;font-weight:800;touch-action:manipulation}',
      '#screen-shop .shopv2-clear.show{display:block}',

      /* Picker sheet also follows the previous, clearer list-card treatment. */
      '.shopping-list-option{width:100%;border:1px solid var(--c-border);background:var(--c-surface);border-radius:16px;padding:11px 12px;margin:7px 0;display:flex;align-items:center;gap:10px;text-align:left}',
      '.shopping-list-option.active{border-color:var(--c-primary);box-shadow:inset 0 0 0 1px rgba(75,132,56,.10)}',
      '.shopping-list-option .sl-icon{width:34px;height:34px;border-radius:11px;background:var(--c-surface2);display:grid;place-items:center;flex:0 0 auto}',
      '.shopping-list-create{width:100%;border:0;background:transparent;color:var(--c-primary);font-weight:800;padding:13px 10px;margin-top:4px;text-align:center}',

      '@media(max-width:600px){#screen-shop .shopv2-shell{padding-left:12px;padding-right:12px}#screen-shop .shopv2-top{padding-top:5px}#screen-shop .shopv2-item{min-height:56px}#screen-shop .shopv2-item-main{grid-template-columns:27px 37px minmax(0,1fr);gap:7px;padding-left:8px}#screen-shop .shopv2-product{width:37px;height:37px}}',
      '@media(prefers-reduced-motion:reduce){#screen-shop *{transition:none!important;animation:none!important}}'
    ].join('\n');document.head.appendChild(css);
  }

  function markup(){return '<div class="shopv2-shell">'
    +'<div class="shopv2-top"><h2>Boodschappen</h2><button type="button" class="shopv2-add" id="shopv2-add">+ Toevoegen</button></div>'
    +'<button type="button" class="shopv2-picker" id="shopv2-picker"><span class="shopv2-picker-icon" id="shopv2-picker-icon"></span><span class="shopv2-picker-copy"><b id="shopv2-list-name">Winkellijst</b><small id="shopv2-list-meta">Gezin · live · 0 te kopen</small></span><span class="shopv2-chevron">⌄</span></button>'
    +'<div class="shopv2-tabs" role="tablist" aria-label="Boodschappenstatus"><button type="button" class="shopv2-tab active" data-shop-view="open" role="tab" aria-selected="true"><span>Te kopen</span><strong id="shopv2-open-count">0</strong></button><button type="button" class="shopv2-tab" data-shop-view="done" role="tab" aria-selected="false"><span>Gekocht</span><strong id="shopv2-done-count">0</strong></button></div>'
    +'<div class="shopv2-list" id="shopv2-list"></div>'
    +'<div class="shopv2-empty" id="shopv2-empty"><div class="shopv2-empty-icon" id="shopv2-empty-icon"></div><b id="shopv2-empty-title"></b><small id="shopv2-empty-copy"></small></div>'
    +'<button type="button" class="shopv2-clear" id="shopv2-clear">Gekochte items verwijderen</button>'
    +'</div>';}

  function checkSvg(){return '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.7" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';}
  function rowHtml(item){var key=String(item._key||item.id||''),safe=domKey(key);return '<div class="shopv2-item" data-item-key="'+esc(key)+'" id="shopv2-item-'+safe+'">'
    +'<button type="button" class="shopv2-item-main" data-action="toggle" data-item-key="'+esc(key)+'" aria-label="'+(item.done?'Terug naar te kopen: ':'Markeer gekocht: ')+esc(item.name)+'">'
    +'<span class="shopv2-check '+(item.done?'done':'')+'">'+(item.done?checkSvg():'')+'</span>'
    +'<span class="shopv2-product">'+utilityIcon(item,'lg')+'</span>'
    +'<span class="shopv2-info"><span class="shopv2-name">'+esc(item.name)+'</span><span class="shopv2-meta">'+esc(qty(item))+' · '+esc(category(item))+'</span></span></button>'
    +'<button type="button" class="shopv2-delete" data-action="delete" data-item-key="'+esc(key)+'" aria-label="Verwijder '+esc(item.name)+'">×</button></div>';}

  function mount(){
    if(mounted&&screen&&document.body.contains(screen))return true;
    screen=document.getElementById('screen-shop');if(!screen)return false;
    ensureStyles();screen.innerHTML=markup();mounted=true;
    document.getElementById('shopv2-picker-icon').innerHTML=icon('utilityShopping','sm');
    var fallback=document.getElementById('shopv2-empty-icon'),r=window.FamilyAppUtilityIconResolver;if(fallback&&r&&typeof r.render==='function')fallback.innerHTML=r.render('Overig',null,{size:'lg',name:''});
    bindEvents();return true;
  }

  function updateListIdentity(row){
    var name=document.getElementById('shopv2-list-name');
    if(name)name.textContent=row&&row.list&&row.list.name||'Winkellijst';
    updateListMeta(row);
  }
  function updateListMeta(row){var meta=document.getElementById('shopv2-list-meta');if(!meta)return;row=row||(store()&&store().active?store().active():null);var c=counts();meta.textContent=(row&&row.scope==='private'?'Alleen ik':'Gezin · live')+' · '+c.open+' te kopen';}
  function updateTabs(){
    var c=counts(),open=document.getElementById('shopv2-open-count'),done=document.getElementById('shopv2-done-count');if(open)open.textContent=c.open;if(done)done.textContent=c.done;
    document.querySelectorAll('#screen-shop [data-shop-view]').forEach(function(btn){var active=btn.getAttribute('data-shop-view')===currentView;btn.classList.toggle('active',active);btn.setAttribute('aria-selected',active?'true':'false');});
    var clear=document.getElementById('shopv2-clear');if(clear)clear.classList.toggle('show',currentView==='done'&&c.done>0);updateListMeta();
  }
  function updateEmpty(){var visible=sortedVisible(),empty=document.getElementById('shopv2-empty');if(!empty)return;var show=visible.length===0;empty.classList.toggle('show',show);if(show){var title=document.getElementById('shopv2-empty-title'),copy=document.getElementById('shopv2-empty-copy');if(currentView==='open'){title.textContent='Alles in huis';copy.textContent='Voeg een product toe wanneer je iets nodig hebt.';}else{title.textContent='Nog niets gekocht';copy.textContent='Afgevinkte producten verschijnen hier direct.';}}}
  function updateRow(el,item){if(!el)return;var name=el.querySelector('.shopv2-name'),meta=el.querySelector('.shopv2-meta'),product=el.querySelector('.shopv2-product'),check=el.querySelector('.shopv2-check');if(name&&name.textContent!==String(item.name||''))name.textContent=item.name||'';if(meta)meta.textContent=qty(item)+' · '+category(item);if(product)product.innerHTML=utilityIcon(item,'lg');if(check){check.classList.toggle('done',!!item.done);check.innerHTML=item.done?checkSvg():'';}}
  function reconcileVisible(){
    if(!mount())return;var list=document.getElementById('shopv2-list');if(!list)return;var visible=sortedVisible(),wanted={};visible.forEach(function(item){wanted[String(item._key)]=item;});
    Array.prototype.slice.call(list.children).forEach(function(el){var key=el.getAttribute('data-item-key');if(!wanted[key])el.remove();});
    visible.forEach(function(item,index){var key=String(item._key),el=document.getElementById('shopv2-item-'+domKey(key));if(!el){var holder=document.createElement('div');holder.innerHTML=rowHtml(item);el=holder.firstElementChild;}else updateRow(el,item);var current=list.children[index];if(current!==el)list.insertBefore(el,current||null);});
    updateTabs();updateEmpty();
  }

  function laneId(row,itemKey){return row.key+'|'+itemKey;}
  function pendingFor(row,itemKey){return lanes[laneId(row,itemKey)]||null;}
  function syncFromStore(){
    if(!mount())return;var st=store(),row=st&&typeof st.active==='function'?st.active():null;
    if(!row){currentListKey=null;localItems={};updateListIdentity(null);reconcileVisible();return;}
    var changed=row.key!==currentListKey,canonical=row.list&&row.list.items||{},next={};
    Object.keys(canonical).forEach(function(key){var item=clone(canonical[key]);if(!item)return;item._key=item._key||key;var pending=pendingFor(row,key);if(pending)item.done=!!pending.desiredDone;next[key]=item;});
    if(changed){currentListKey=row.key;localItems=next;}else{
      Object.keys(next).forEach(function(key){localItems[key]=next[key];});
      Object.keys(localItems).forEach(function(key){if(!next[key]&&!pendingFor(row,key))delete localItems[key];});
    }
    updateListIdentity(row);reconcileVisible();
  }

  function scheduleFlush(){if(flushTimer)clearTimeout(flushTimer);flushTimer=setTimeout(flushAll,FLUSH_IDLE_MS);}
  function flushLane(id,lane){
    if(!lane||lane.writing||!lane.dirty)return;var r=repository();if(!r||typeof r.setItem!=='function')return;
    var desired=!!lane.desiredDone;lane.dirty=false;if(desired===lane.baseDone){delete lanes[id];return;}lane.writing=true;
    r.setItem(lane.scope,lane.listId,lane.itemKey,{done:desired}).then(function(record){lane.writing=false;lane.baseDone=desired;if(record)lane.baseItem=clone(record);if(lane.dirty&&lane.desiredDone!==lane.baseDone){flushLane(id,lane);return;}if(!lane.dirty)delete lanes[id];}).catch(function(error){console.warn('[ShoppingPageV2] optimistic toggle failed',error);lane.writing=false;delete lanes[id];toast('Bijwerken mislukt. De lijst is hersteld.');syncFromStore();});
  }
  function flushAll(){if(flushTimer){clearTimeout(flushTimer);flushTimer=null;}Object.keys(lanes).forEach(function(id){flushLane(id,lanes[id]);});}
  function toggleItem(key){
    var st=store(),row=st&&st.active?st.active():null,item=localItems[key];if(!row||!item)return;
    var id=laneId(row,key),lane=lanes[id];if(!lane)lane=lanes[id]={scope:row.scope,listId:row.list.id,itemKey:key,baseDone:!!item.done,desiredDone:!!item.done,baseItem:clone(item),dirty:false,writing:false};
    lane.desiredDone=!item.done;lane.dirty=true;item.done=lane.desiredDone;localItems[key]=item;
    var el=document.getElementById('shopv2-item-'+domKey(key));if(el)el.remove();updateTabs();updateEmpty();scheduleFlush();
  }
  function deleteItem(key){var st=store(),item=localItems[key];if(!st||!item)return;delete localItems[key];var el=document.getElementById('shopv2-item-'+domKey(key));if(el)el.remove();updateTabs();updateEmpty();st.deleteItem(key).catch(function(error){console.warn('[ShoppingPageV2] delete failed',error);toast('Verwijderen mislukt');syncFromStore();});}
  function clearDone(){var st=store();if(!st)return;var backup=clone(localItems);Object.keys(localItems).forEach(function(key){if(localItems[key]&&localItems[key].done)delete localItems[key];});reconcileVisible();st.clearDone().then(function(){toast('Gekochte items verwijderd');}).catch(function(error){console.warn('[ShoppingPageV2] clear done failed',error);localItems=backup;reconcileVisible();toast('Legen mislukt');});}
  function setView(view){currentView=view==='done'?'done':'open';reconcileVisible();}

  function openListPicker(){
    var st=store();if(!st||!window.BottomSheet)return;var active=st.active();var html=st.all().map(function(row){return '<button type="button" class="shopping-list-option'+(active&&active.key===row.key?' active':'')+'" data-list-key="'+esc(row.key)+'"><span class="sl-icon">'+icon('utilityShopping','sm')+'</span><span style="flex:1;min-width:0"><b>'+esc(row.list.name)+'</b><small style="display:block;margin-top:2px;color:var(--c-text2)">'+(row.scope==='private'?'Alleen ik':'Gezin · live')+'</small></span>'+(active&&active.key===row.key?'<span style="color:var(--c-primary);font-weight:900">✓</span>':'')+'</button>';}).join('')+'<button type="button" class="shopping-list-create" id="shopv2-create-list">＋ Nieuwe lijst</button>';
    window.BottomSheet.open({title:'Winkellijst kiezen',html:html,onOpen:function(ctx){ctx.modal.querySelectorAll('[data-list-key]').forEach(function(btn){btn.onclick=function(){flushAll();st.setActiveList(btn.getAttribute('data-list-key'));ctx.close();};});var create=ctx.modal.querySelector('#shopv2-create-list');if(create)create.onclick=function(){ctx.close();setTimeout(openCreateList,170);};},actions:[{label:'Sluiten'}]});
  }
  function openCreateList(){var st=store();if(!st||!window.BottomSheet)return;window.BottomSheet.open({title:'Nieuwe winkellijst',html:'<div class="fam-modal-field"><label>Naam</label><input id="shopv2-new-list-name" placeholder="bijv. Weekboodschappen"></div><div class="fam-modal-field"><label>Zichtbaarheid</label><select id="shopv2-new-list-privacy"><option value="household">Gezin</option><option value="private">Alleen ik</option></select></div>',actions:[{label:'Annuleren'},{label:'Lijst maken',primary:true,onClick:function(ctx){var name=ctx.modal.querySelector('#shopv2-new-list-name').value.trim();if(!name)return false;st.createList({name:name,visibility:ctx.modal.querySelector('#shopv2-new-list-privacy').value}).catch(function(){toast('Lijst kon niet worden aangemaakt');});}}]});}
  function openAdd(){if(window.GroceryAddSheet&&typeof window.GroceryAddSheet.open==='function')window.GroceryAddSheet.open();else toast('Toevoegen wordt geladen…');}

  function bindEvents(){
    var add=document.getElementById('shopv2-add'),picker=document.getElementById('shopv2-picker'),clear=document.getElementById('shopv2-clear');if(add)add.onclick=openAdd;if(picker)picker.onclick=openListPicker;if(clear)clear.onclick=clearDone;
    document.querySelectorAll('#screen-shop [data-shop-view]').forEach(function(btn){btn.onclick=function(){setView(btn.getAttribute('data-shop-view'));};});
    var list=document.getElementById('shopv2-list');if(!list)return;
    list.addEventListener('pointerdown',function(event){var btn=event.target.closest('[data-action]');if(!btn)return;pointerDown={id:event.pointerId,x:event.clientX,y:event.clientY,action:btn.getAttribute('data-action'),key:btn.getAttribute('data-item-key')};},{passive:true});
    list.addEventListener('pointerup',function(event){if(!pointerDown||pointerDown.id!==event.pointerId)return;var state=pointerDown;pointerDown=null;if(Math.abs(event.clientX-state.x)>9||Math.abs(event.clientY-state.y)>9)return;if(state.action==='toggle')toggleItem(state.key);else if(state.action==='delete')deleteItem(state.key);event.preventDefault();});
    list.addEventListener('click',function(event){if(event.target.closest('[data-action]'))event.preventDefault();});
  }
  function wireShopAddButton(){if(!mount())return false;var add=document.getElementById('shopv2-add');if(add)add.onclick=openAdd;return true;}
  function render(){mount();syncFromStore();}
  function highlightShopItem(id){var el=document.getElementById('shopv2-item-'+domKey(id));if(!el)return;el.animate([{transform:'scale(.985)',background:'#f1f8ed'},{transform:'scale(1)',background:'var(--c-surface)'}],{duration:260,easing:'ease-out'});}
  function boot(){if(!mount())return false;var st=store();if(st&&!storeUnsubscribe&&typeof st.onChange==='function')storeUnsubscribe=st.onChange(syncFromStore);syncFromStore();return true;}

  window.ShoppingPageV2={version:VERSION,render:render,sync:syncFromStore,setView:setView,flush:flushAll,status:function(){return{view:currentView,listKey:currentListKey,pending:Object.keys(lanes).length};}};
  window.renderShop=render;window.toggleShop=toggleItem;window.deleteShop=deleteItem;window.resetShop=clearDone;window.highlightShopItem=highlightShopItem;window.wireShopAddButton=wireShopAddButton;window.ShopRenderer={version:VERSION,render:render};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
  window.addEventListener('pagehide',flushAll);document.addEventListener('visibilitychange',function(){if(document.visibilityState==='hidden')flushAll();});
})();
