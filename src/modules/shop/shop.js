'use strict';
// ============================================================
// BOODSCHAPPEN v1.0.2
// Render-only. ShoppingListStore.js is the sole owner of shopping state,
// mutations and realtime subscriptions — this file never mutates shopping
// data directly and holds no shopping array of its own.
// ============================================================
(function(){
  var VERSION = '1.0.2';
  var storeSub = null;

  function esc(v){ var d = document.createElement('div'); d.textContent = String(v == null ? '' : v); return d.innerHTML; }
  function store(){ return window.ShoppingListStore || null; }

  function ensureStyles(){
    if(document.getElementById('shop-v1-style')) return;
    var css = document.createElement('style');
    css.id = 'shop-v1-style';
    css.textContent = ''
      + '.shop-item.shop-item-added{animation:shopItemAddedPop .8s cubic-bezier(.22,.9,.28,1)}'
      + '@keyframes shopItemAddedPop{0%{opacity:0;transform:translateY(-10px) scale(.95);box-shadow:0 0 0 0 rgba(63,127,47,.4)}45%{opacity:1;transform:translateY(0) scale(1.025);box-shadow:0 0 0 10px rgba(63,127,47,.14)}100%{opacity:1;transform:none;box-shadow:0 0 0 0 rgba(63,127,47,0)}}'
      + '.shopping-listbar{margin:0 16px 12px;display:flex;align-items:center}'
      + '.shopping-listpick{min-width:0;flex:1;border:1px solid var(--c-border);background:var(--c-surface);border-radius:16px;padding:10px 12px;display:flex;align-items:center;gap:9px}'
      + '.shopping-listpick .sl-icon{width:34px;height:34px;border-radius:11px;background:var(--c-surface2);display:grid;place-items:center;flex:0 0 auto}'
      + '.shopping-listpick .sl-copy{min-width:0;flex:1;text-align:left}'
      + '.shopping-listpick b{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'
      + '.shopping-listpick small{display:block;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'
      + '.shopping-listpick .sl-chevron{font-size:17px;line-height:1;color:var(--c-muted);padding-left:4px}'
      + '.shopping-list-option{width:100%;border:1px solid var(--c-border);background:var(--c-surface);border-radius:16px;padding:11px 12px;margin:7px 0;display:flex;align-items:center;gap:10px;text-align:left}'
      + '.shopping-list-option.active{border-color:var(--c-primary)}'
      + '.shopping-list-create{width:100%;border:0;background:transparent;color:var(--c-primary);font-weight:700;padding:13px 10px;margin-top:4px;text-align:center}'
      + '@media(max-width:600px){.shopping-listbar{margin:0 16px 8px}.shopping-listpick{min-height:54px;border-radius:16px;padding:6px 10px;gap:8px}.shopping-listpick .sl-icon{width:32px;height:32px}.shopping-listpick b{font-size:15px}.shopping-listpick small{font-size:12px;color:var(--c-muted)}#screen-shop .shop-col+.shop-col{border-top-color:rgba(75,132,56,.06)}#screen-shop .shop-col:last-child .shop-col-head{background:rgba(75,132,56,.055)}#screen-shop .shop-del{color:rgba(86,96,112,.42)}#screen-shop .check-circle{transform:scale(.92)}}';
    document.head.appendChild(css);
  }

  function listScopeIcon(scope){
    return scope === 'private'
      ? '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="10.5" width="14" height="9" rx="2"></rect><path d="M8 10.5V7a4 4 0 0 1 8 0v3.5"></path></svg>'
      : '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17 20v-1a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v1"></path><circle cx="12" cy="7" r="3.2"></circle><path d="M21 20v-1a3.5 3.5 0 0 0-2.5-3.36"></path><path d="M15.5 3.13a3.2 3.2 0 0 1 0 6.2"></path></svg>';
  }
  function productHit(item){
    var lex=window.FamilyAppProductLexicon;
    return lex&&typeof lex.match==='function'?lex.match(item&&item.name):null;
  }
  function displayCategory(item){
    var stored=String(item&&item.cat||'').trim();
    if(stored&&stored!=='Overig')return stored;
    var hit=productHit(item);
    return hit&&hit.category?hit.category:(stored||'Overig');
  }
  function shopUtilityIcon(item){
    var legacy = (item && item.photo && !String(item.photo).startsWith('http')) ? String(item.photo) : '📦';
    var resolver = window.FamilyAppUtilityIconResolver;
    var html = resolver && typeof resolver.render === 'function' ? resolver.render(displayCategory(item), legacy, { size: 'lg', name: item && item.name }) : '';
    return html || legacy;
  }
  function shopItemHTML(item){
    var key = String(item && item._key ? item._key : item.id);
    var domKey = key.replace(/[^a-zA-Z0-9_-]/g, '_');
    var attrKey = key.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    return '<div class="shop-item" id="si-' + domKey + '">'
      + '<div class="check-circle ' + (item.done ? 'done' : '') + '" id="shck-' + domKey + '" onclick="toggleShop(\'' + attrKey + '\')" style="cursor:pointer;flex-shrink:0">' + (item.done ? '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>' : '') + '</div>'
      + '<div class="shop-emoji fa-utility-item">' + shopUtilityIcon(item) + '</div>'
      + '<div class="shop-info"><div class="shop-name' + (item.done ? ' done' : '') + '">' + esc(item.name) + '</div><div class="shop-qty">' + esc(item.qty) + ' · ' + esc(displayCategory(item)) + '</div></div>'
      + '<button class="shop-del" onclick="deleteShop(\'' + attrKey + '\')">✕</button></div>';
  }
  function ensureListBar(){var screen=document.getElementById('screen-shop');var header=screen&&screen.querySelector('.list-header');if(!header)return null;var bar=document.getElementById('shopping-listbar');if(!bar){bar=document.createElement('div');bar.id='shopping-listbar';bar.className='shopping-listbar';header.insertAdjacentElement('afterend',bar);}return bar;}
  function renderListSwitcher(view){var bar=ensureListBar();if(!bar||!view.key){if(bar)bar.innerHTML='';return;}bar.innerHTML='<button class="shopping-listpick" id="shopping-list-pick" aria-label="Winkellijst kiezen"><span class="sl-icon">'+listScopeIcon(view.scope)+'</span><span class="sl-copy"><b>'+esc(view.name||'Winkellijst')+'</b><small>'+(view.scope==='private'?'🔒 Privé':'👨‍👩‍👧 Gezin · live')+' · '+view.openCount+' te kopen</small></span><span class="sl-chevron">⌄</span></button>';var pick=document.getElementById('shopping-list-pick');if(pick)pick.onclick=openPicker;}
  function openPicker(){var s=store();if(!s||!window.BottomSheet)return;var rowsHtml=s.all().map(function(row){return '<button class="shopping-list-option" data-list-key="'+esc(row.key)+'"><span>'+esc(row.list.icon||'🛒')+'</span><span style="flex:1"><b>'+esc(row.list.name)+'</b><small>'+(row.scope==='private'?'🔒 Alleen ik':'👨‍👩‍👧 Gezin · live')+'</small></span></button>';}).join('')+'<button class="shopping-list-create" id="shopping-list-create">＋ Nieuwe lijst</button>';window.BottomSheet.open({title:'Winkellijst kiezen',html:rowsHtml,onOpen:function(ctx){ctx.modal.querySelectorAll('[data-list-key]').forEach(function(btn){btn.onclick=function(){s.setActiveList(btn.getAttribute('data-list-key'));ctx.close();};});var create=ctx.modal.querySelector('#shopping-list-create');if(create)create.onclick=function(){ctx.close();setTimeout(openCreate,180);};},actions:[{label:'Sluiten'}]});}
  function openCreate(){var s=store();if(!s||!window.BottomSheet)return;var html='<div class="fam-modal-field"><label>Naam</label><input id="sl-name" placeholder="bijv. IKEA of Weekboodschappen"></div><div class="fam-modal-field"><label>Zichtbaarheid</label><select id="sl-privacy"><option value="household">Gezin</option><option value="private">Alleen ik</option></select></div>';window.BottomSheet.open({title:'Nieuwe winkellijst',html:html,actions:[{label:'Annuleren'},{label:'Lijst maken',primary:true,onClick:function(ctx){var name=ctx.modal.querySelector('#sl-name').value.trim();if(!name)return false;s.createList({name:name,visibility:ctx.modal.querySelector('#sl-privacy').value}).catch(function(){if(typeof window.showToast==='function')window.showToast('Lijst kon niet worden aangemaakt');});}}]});}
  function renderShop(){ensureStyles();var openEl=document.getElementById('shop-open'),doneEl=document.getElementById('shop-done');var ocnt=document.getElementById('shop-open-cnt'),dcnt=document.getElementById('shop-done-cnt');if(!openEl)return;var s=store();var view=s?s.projection():{openItems:[],doneItems:[],openCount:0,doneCount:0};if(ocnt)ocnt.textContent=view.openCount;if(dcnt)dcnt.textContent=view.doneCount;openEl.innerHTML=view.openItems.map(shopItemHTML).join('');doneEl.innerHTML=view.doneItems.map(shopItemHTML).join('');renderListSwitcher(view);if(typeof window.updateStats==='function')window.updateStats();if(window.ShoppingReceiptFinance&&typeof window.ShoppingReceiptFinance.render==='function')setTimeout(window.ShoppingReceiptFinance.render,0);}
  function highlightShopItem(id){if(id===undefined||id===null)return;var el=document.getElementById('si-'+String(id).replace(/[^a-zA-Z0-9_-]/g,'_'));if(!el)return;el.classList.remove('shop-item-added');void el.offsetWidth;el.classList.add('shop-item-added');setTimeout(function(){el.classList.remove('shop-item-added');},850);}
  function toggleShop(id){var s=store();if(!s)return false;s.toggleItem(id).then(function(record){if(record&&record.done){if(typeof window.awardXP==='function')window.awardXP(2,'Boodschap');if(typeof window.addActivity==='function')window.addActivity('🛒','#fff3dc',(window.myName||'Gezin')+' kocht "'+record.name+'"');}}).catch(function(err){console.warn('[Shop] toggle failed',err);if(typeof window.showToast==='function')window.showToast('Kon item niet bijwerken. Probeer opnieuw.');});return false;}
  function deleteShop(id){var s=store();if(!s)return false;s.deleteItem(id).catch(function(err){console.warn('[Shop] delete failed',err);if(typeof window.showToast==='function')window.showToast('Kon item niet verwijderen. Probeer opnieuw.');});return false;}
  function resetShop(){var s=store();if(!s)return false;s.clearDone().then(function(){if(typeof window.showToast==='function')window.showToast('Gekochte items geleegd ↺');}).catch(function(err){console.warn('[Shop] reset failed',err);if(typeof window.showToast==='function')window.showToast('Kon niet legen. Probeer opnieuw.');});return false;}
  function wireShopAddButton(){var screen=document.getElementById('screen-shop');if(!screen)return;var header=screen.querySelector('.list-header');if(!header)return;var btn=header.querySelector('.add-btn');if(!btn){btn=document.createElement('button');btn.className='add-btn';header.appendChild(btn);}btn.textContent='+ Toevoegen';btn.onclick=function(e){if(e)e.preventDefault();if(window.GroceryAddSheet&&typeof window.GroceryAddSheet.open==='function')window.GroceryAddSheet.open();return false;};}
  function boot(){ensureStyles();wireShopAddButton();if(!storeSub&&window.ShoppingListStore){storeSub=window.ShoppingListStore.onChange(function(){if(window._currentScreen==='shop')renderShop();});}[100,300,800].forEach(function(delay){setTimeout(function(){wireShopAddButton();if(!storeSub&&window.ShoppingListStore){storeSub=window.ShoppingListStore.onChange(function(){if(window._currentScreen==='shop')renderShop();});}},delay);});}
  window.renderShop=renderShop;window.toggleShop=toggleShop;window.deleteShop=deleteShop;window.resetShop=resetShop;window.highlightShopItem=highlightShopItem;window.wireShopAddButton=wireShopAddButton;window.ShopRenderer={version:VERSION,render:renderShop};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
