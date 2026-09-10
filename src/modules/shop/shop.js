'use strict';
// ============================================================
// BOODSCHAPPEN v1.1.0
// Render/interaction layer. ShoppingListStore remains the business facade and
// ShoppingListHouseholdRepository remains the canonical persistence owner.
// STEP 7 polish: smooth rapid checkbox interaction + explicit recipe duplicate
// resolution without reintroducing a second persistence owner.
// ============================================================
(function(){
  var VERSION = '1.1.0';
  var storeSub = null;
  var renderTimer = null;
  var interactionPendingUntil = 0;
  var CHECK_SVG = '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>';

  function esc(v){ var d = document.createElement('div'); d.textContent = String(v == null ? '' : v); return d.innerHTML; }
  function store(){ return window.ShoppingListStore || null; }
  function repository(){ return window.ShoppingListHouseholdRepository || null; }
  function uiIcon(key,size){var r=window.FamilyAppIconRenderer;return r&&typeof r.render==='function'?r.render(key,{size:size||'sm',label:false,className:'fa-utility-icon'}):'';}

  function ensureStyles(){
    if(document.getElementById('shop-v1-style')) return;
    var css = document.createElement('style');
    css.id = 'shop-v1-style';
    css.textContent = ''
      + '.shop-item.shop-item-added{animation:shopItemAddedPop .8s cubic-bezier(.22,.9,.28,1)}'
      + '@keyframes shopItemAddedPop{0%{opacity:0;transform:translateY(-10px) scale(.95);box-shadow:0 0 0 0 rgba(63,127,47,.4)}45%{opacity:1;transform:translateY(0) scale(1.025);box-shadow:0 0 0 10px rgba(63,127,47,.14)}100%{opacity:1;transform:none;box-shadow:0 0 0 0 rgba(63,127,47,0)}}'
      + '.shop-item{transform:translateZ(0)}.shop-item .check-circle{transition:transform .16s cubic-bezier(.2,.9,.25,1),background-color .14s ease,border-color .14s ease}.shop-item .shop-name{transition:opacity .16s ease,color .16s ease}'
      + '.shop-item.shop-toggle-pulse{animation:shopToggleRow .22s cubic-bezier(.2,.9,.25,1)}.shop-item.shop-toggle-pulse .check-circle{animation:shopCheckPop .26s cubic-bezier(.2,1.35,.35,1)}'
      + '@keyframes shopToggleRow{0%{transform:scale(1)}45%{transform:scale(.988)}100%{transform:scale(1)}}@keyframes shopCheckPop{0%{transform:scale(.78)}65%{transform:scale(1.14)}100%{transform:scale(1)}}'
      + '.shopping-listbar{margin:0 16px 12px;display:flex;align-items:center}'
      + '.shopping-listpick{min-width:0;flex:1;border:1px solid var(--c-border);background:var(--c-surface);border-radius:16px;padding:10px 12px;display:flex;align-items:center;gap:9px}'
      + '.shopping-listpick .sl-icon,.shopping-list-option .sl-icon{width:34px;height:34px;border-radius:11px;background:var(--c-surface2);display:grid;place-items:center;flex:0 0 auto}'
      + '.shopping-listpick .sl-copy{min-width:0;flex:1;text-align:left}'
      + '.shopping-listpick b{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'
      + '.shopping-listpick small{display:block;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'
      + '.shopping-listpick .sl-chevron{font-size:17px;line-height:1;color:var(--c-muted);padding-left:4px}'
      + '.shopping-list-option{width:100%;border:1px solid var(--c-border);background:var(--c-surface);border-radius:16px;padding:11px 12px;margin:7px 0;display:flex;align-items:center;gap:10px;text-align:left}'
      + '.shopping-list-option.active{border-color:var(--c-primary)}'
      + '.shopping-list-create{width:100%;border:0;background:transparent;color:var(--c-primary);font-weight:700;padding:13px 10px;margin-top:4px;text-align:center}'
      + '.shopping-conflict-intro{font-size:13px;line-height:1.45;color:var(--c-text2);margin:0 0 10px}.shopping-conflict-list{display:flex;flex-direction:column;gap:9px}.shopping-conflict-row{border:1px solid var(--c-border);background:var(--c-surface2);border-radius:16px;padding:11px}.shopping-conflict-copy{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:8px}.shopping-conflict-copy b{font-size:14px;color:var(--c-text)}.shopping-conflict-copy small{display:block;color:var(--c-text2);font-size:11px;line-height:1.35;margin-top:2px}.shopping-conflict-row select{width:100%;border:1px solid var(--c-border);background:var(--c-surface);color:var(--c-text);border-radius:12px;padding:9px 10px;font-size:13px;font-weight:750;outline:none}'
      + '@media(max-width:600px){.shopping-listbar{margin:0 16px 8px}.shopping-listpick{min-height:54px;border-radius:16px;padding:6px 10px;gap:8px}.shopping-listpick .sl-icon{width:32px;height:32px}.shopping-listpick b{font-size:15px}.shopping-listpick small{font-size:12px;color:var(--c-muted)}#screen-shop .shop-col+.shop-col{border-top-color:rgba(75,132,56,.06)}#screen-shop .shop-col:last-child .shop-col-head{background:rgba(75,132,56,.055)}#screen-shop .shop-del{color:rgba(86,96,112,.42)}#screen-shop .check-circle{transform:scale(.92)}}';
    document.head.appendChild(css);
  }

  function listScopeIcon(scope){
    if(scope!=='private')return uiIcon('utilityPeople','sm');
    return '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="10.5" width="14" height="9" rx="2"></rect><path d="M8 10.5V7a4 4 0 0 1 8 0v3.5"></path></svg>';
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
    var legacy = (item && item.photo && !String(item.photo).startsWith('http')) ? String(item.photo) : null;
    var resolver = window.FamilyAppUtilityIconResolver;
    var html = resolver && typeof resolver.render === 'function' ? resolver.render(displayCategory(item), legacy, { size: 'lg', name: item && item.name }) : '';
    return html || uiIcon('utilityGeneric','lg');
  }
  function shopItemHTML(item){
    var key = String(item && item._key ? item._key : item.id);
    var domKey = key.replace(/[^a-zA-Z0-9_-]/g, '_');
    var attrKey = key.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    return '<div class="shop-item" id="si-' + domKey + '">'
      + '<div class="check-circle ' + (item.done ? 'done' : '') + '" id="shck-' + domKey + '" onclick="toggleShop(\'' + attrKey + '\')" style="cursor:pointer;flex-shrink:0">' + (item.done ? CHECK_SVG : '') + '</div>'
      + '<div class="shop-emoji fa-utility-item">' + shopUtilityIcon(item) + '</div>'
      + '<div class="shop-info"><div class="shop-name' + (item.done ? ' done' : '') + '">' + esc(item.name) + '</div><div class="shop-qty">' + esc(item.qty) + ' · ' + esc(displayCategory(item)) + '</div></div>'
      + '<button class="shop-del" onclick="deleteShop(\'' + attrKey + '\')">✕</button></div>';
  }
  function ensureListBar(){var screen=document.getElementById('screen-shop');var header=screen&&screen.querySelector('.list-header');if(!header)return null;var bar=document.getElementById('shopping-listbar');if(!bar){bar=document.createElement('div');bar.id='shopping-listbar';bar.className='shopping-listbar';header.insertAdjacentElement('afterend',bar);}return bar;}
  function renderListSwitcher(view){var bar=ensureListBar();if(!bar||!view.key){if(bar)bar.innerHTML='';return;}bar.innerHTML='<button class="shopping-listpick" id="shopping-list-pick" aria-label="Winkellijst kiezen"><span class="sl-icon">'+listScopeIcon(view.scope)+'</span><span class="sl-copy"><b>'+esc(view.name||'Winkellijst')+'</b><small>'+(view.scope==='private'?'Privé':'Gezin · live')+' · '+view.openCount+' te kopen</small></span><span class="sl-chevron">⌄</span></button>';var pick=document.getElementById('shopping-list-pick');if(pick)pick.onclick=openPicker;}
  function openPicker(){var s=store();if(!s||!window.BottomSheet)return;var rowsHtml=s.all().map(function(row){return '<button class="shopping-list-option" data-list-key="'+esc(row.key)+'"><span class="sl-icon">'+uiIcon('utilityShopping','sm')+'</span><span style="flex:1"><b>'+esc(row.list.name)+'</b><small>'+(row.scope==='private'?'Alleen ik':'Gezin · live')+'</small></span></button>';}).join('')+'<button class="shopping-list-create" id="shopping-list-create">＋ Nieuwe lijst</button>';window.BottomSheet.open({title:'Winkellijst kiezen',html:rowsHtml,onOpen:function(ctx){ctx.modal.querySelectorAll('[data-list-key]').forEach(function(btn){btn.onclick=function(){s.setActiveList(btn.getAttribute('data-list-key'));ctx.close();};});var create=ctx.modal.querySelector('#shopping-list-create');if(create)create.onclick=function(){ctx.close();setTimeout(openCreate,180);};},actions:[{label:'Sluiten'}]});}
  function openCreate(){var s=store();if(!s||!window.BottomSheet)return;var html='<div class="fam-modal-field"><label>Naam</label><input id="sl-name" placeholder="bijv. IKEA of Weekboodschappen"></div><div class="fam-modal-field"><label>Zichtbaarheid</label><select id="sl-privacy"><option value="household">Gezin</option><option value="private">Alleen ik</option></select></div>';window.BottomSheet.open({title:'Nieuwe winkellijst',html:html,actions:[{label:'Annuleren'},{label:'Lijst maken',primary:true,onClick:function(ctx){var name=ctx.modal.querySelector('#sl-name').value.trim();if(!name)return false;s.createList({name:name,visibility:ctx.modal.querySelector('#sl-privacy').value}).catch(function(){if(typeof window.showToast==='function')window.showToast('Lijst kon niet worden aangemaakt');});}}]});}
  function renderShop(){ensureStyles();var openEl=document.getElementById('shop-open'),doneEl=document.getElementById('shop-done');var ocnt=document.getElementById('shop-open-cnt'),dcnt=document.getElementById('shop-done-cnt');if(!openEl)return;var s=store();var view=s?s.projection():{openItems:[],doneItems:[],openCount:0,doneCount:0};if(ocnt)ocnt.textContent=view.openCount;if(dcnt)dcnt.textContent=view.doneCount;openEl.innerHTML=view.openItems.map(shopItemHTML).join('');doneEl.innerHTML=view.doneItems.map(shopItemHTML).join('');renderListSwitcher(view);if(typeof window.updateStats==='function')window.updateStats();if(window.ShoppingReceiptFinance&&typeof window.ShoppingReceiptFinance.render==='function')setTimeout(window.ShoppingReceiptFinance.render,0);}
  function scheduleRenderShop(force){
    if(renderTimer){clearTimeout(renderTimer);renderTimer=null;}
    var delay=force?0:Math.max(0,interactionPendingUntil-Date.now());
    renderTimer=setTimeout(function(){renderTimer=null;var run=function(){if(window._currentScreen==='shop')renderShop();};if(typeof window.requestAnimationFrame==='function')window.requestAnimationFrame(run);else run();},delay);
  }
  function highlightShopItem(id){if(id===undefined||id===null)return;var el=document.getElementById('si-'+String(id).replace(/[^a-zA-Z0-9_-]/g,'_'));if(!el)return;el.classList.remove('shop-item-added');void el.offsetWidth;el.classList.add('shop-item-added');setTimeout(function(){el.classList.remove('shop-item-added');},850);}
  function paintToggle(id,done){
    var domKey=String(id).replace(/[^a-zA-Z0-9_-]/g,'_'),row=document.getElementById('si-'+domKey),check=document.getElementById('shck-'+domKey);if(!row||!check)return;
    check.classList.toggle('done',!!done);check.innerHTML=done?CHECK_SVG:'';
    var name=row.querySelector('.shop-name');if(name)name.classList.toggle('done',!!done);
    row.classList.remove('shop-toggle-pulse');void row.offsetWidth;row.classList.add('shop-toggle-pulse');setTimeout(function(){if(row)row.classList.remove('shop-toggle-pulse');},280);
  }
  function activeItem(id){var s=store(),row=s&&s.active?s.active():null;if(!row||!row.list||!row.list.items)return null;var key=String(id||'');var item=row.list.items[key]||null;if(!item){Object.keys(row.list.items).some(function(k){var x=row.list.items[k];if(x&&String(x.id)===key){key=k;item=x;return true;}return false;});}return item?{row:row,key:key,item:item}:null;}
  function toggleShop(id){
    var s=store();if(!s)return false;var found=activeItem(id),domKey=String(id).replace(/[^a-zA-Z0-9_-]/g,'_'),check=document.getElementById('shck-'+domKey),nextDone=check?!check.classList.contains('done'):!(found&&found.item&&found.item.done);
    interactionPendingUntil=Math.max(interactionPendingUntil,Date.now()+185);paintToggle(id,nextDone);
    var r=repository(),work;
    if(found&&r&&typeof r.setItem==='function')work=r.setItem(found.row.scope,found.row.list.id,found.key,Object.assign({},found.item,{done:nextDone}));
    else work=s.toggleItem(id);
    work.then(function(record){if(record&&record.done){if(typeof window.awardXP==='function')window.awardXP(2,'Boodschap');if(typeof window.addActivity==='function')window.addActivity('🛒','#fff3dc',(window.myName||'Gezin')+' kocht "'+record.name+'"');}}).catch(function(err){console.warn('[Shop] toggle failed',err);interactionPendingUntil=0;scheduleRenderShop(true);if(typeof window.showToast==='function')window.showToast('Kon item niet bijwerken. Probeer opnieuw.');});return false;
  }
  function deleteShop(id){var s=store();if(!s)return false;s.deleteItem(id).catch(function(err){console.warn('[Shop] delete failed',err);if(typeof window.showToast==='function')window.showToast('Kon item niet verwijderen. Probeer opnieuw.');});return false;}
  function resetShop(){var s=store();if(!s)return false;s.clearDone().then(function(){if(typeof window.showToast==='function')window.showToast('Gekochte items geleegd ↺');}).catch(function(err){console.warn('[Shop] reset failed',err);if(typeof window.showToast==='function')window.showToast('Kon niet legen. Probeer opnieuw.');});return false;}

  function canonicalName(value){return String(value||'').trim().toLowerCase().replace(/\s+/g,' ');}
  function normalizeUnit(value){var raw=String(value||'').trim().toLowerCase();var p=window.GroceryInputParser;if(p&&typeof p.normalizeUnit==='function'){var n=p.normalizeUnit(raw);if(n)return n;}if(raw==='stuk'||raw==='stuks'||raw==='x')return'st';if(raw==='liter')return'l';return raw;}
  function qtyParts(item){var amount=Number(item&&item.amount),unit=normalizeUnit(item&&item.unit);if(Number.isFinite(amount)&&unit)return{amount:amount,unit:unit};var raw=String(item&&item.qty||'').trim(),m=raw.match(/^([0-9]+(?:[.,][0-9]+)?)\s*([^\s]+)?/);if(!m)return null;amount=parseFloat(m[1].replace(',','.'));unit=normalizeUnit(m[2]||'st');return Number.isFinite(amount)&&unit?{amount:amount,unit:unit}:null;}
  function niceNumber(value){var n=Math.round(Number(value)*100)/100;return String(n).replace('.',',');}
  function qtyLabel(item){var p=qtyParts(item);return p?niceNumber(p.amount)+' '+p.unit:String(item&&item.qty||'1 st');}
  function ingredientText(ingredient){if(ingredient&&typeof ingredient==='object')return String(ingredient.rawText||ingredient.text||ingredient.name||'').trim();return String(ingredient||'').trim();}
  function classifyIngredient(text,recipe){var parser=window.GroceryInputParser,classifier=window.GroceryProductClassifier;var parsed=parser&&typeof parser.parse==='function'?parser.parse(text):{productName:text,amount:null,unit:null};var guess=classifier&&typeof classifier.classify==='function'?classifier.classify(parsed.productName):{category:'Overig',icon:null,qty:'1 st'};var fallback=String(guess.qty||'1 st').match(/^([0-9]+(?:[.,][0-9]+)?)\s*(.*)$/),amount=parsed.amount!=null?Number(parsed.amount):(fallback?parseFloat(fallback[1].replace(',','.')):1),unit=normalizeUnit(parsed.unit||(fallback&&fallback[2])||'st');if(!Number.isFinite(amount))amount=1;return{name:parsed.productName||text,amount:amount,unit:unit||'st',qty:niceNumber(amount)+' '+(unit||'st'),cat:guess.category||'Overig',photo:guess.icon||null,source:'recipe',sourceRecipeId:recipe&&recipe.id||null,sourceRecipeName:recipe&&recipe.name||null};}
  function listRowByKey(s,key){return(s&&typeof s.all==='function'?s.all():[]).find(function(row){return row.key===key;})||null;}
  function analyzeRecipeDuplicates(s,recipe,listKey){
    var row=listRowByKey(s,listKey)||(s&&s.active?s.active():null);if(!row)return null;var existing=row.list&&row.list.items||{},openByName={};Object.keys(existing).forEach(function(key){var item=existing[key];if(item&&!item.done&&!openByName[canonicalName(item.name)])openByName[canonicalName(item.name)]={key:key,item:item};});
    var unique=[],conflicts=[];(recipe&&recipe.ingredients||[]).forEach(function(ingredient){var text=ingredientText(ingredient);if(!text)return;var incoming=classifyIngredient(text,recipe),hit=openByName[canonicalName(incoming.name)];if(!hit){unique.push(incoming);return;}var a=qtyParts(hit.item),b=qtyParts(incoming),canSum=!!(a&&b&&a.unit===b.unit);conflicts.push({incoming:incoming,existingKey:hit.key,existing:hit.item,canSum:canSum,sumQty:canSum?niceNumber(a.amount+b.amount)+' '+a.unit:null});});
    return{row:row,unique:unique,conflicts:conflicts};
  }
  function conflictHtml(analysis){return '<div class="shopping-conflict-intro"><b>'+analysis.conflicts.length+' dubbel'+(analysis.conflicts.length===1?' product':'e producten')+' gevonden.</b> Kies per product wat er moet gebeuren. Niets wordt stil overschreven.</div><div class="shopping-conflict-list">'+analysis.conflicts.map(function(c,i){var selected=c.canSum?'sum':'separate';return '<div class="shopping-conflict-row"><div class="shopping-conflict-copy"><div><b>'+esc(c.incoming.name)+'</b><small>Op lijst: '+esc(qtyLabel(c.existing))+' · Recept: '+esc(qtyLabel(c.incoming))+'</small></div></div><select data-conflict-index="'+i+'">'+(c.canSum?'<option value="sum"'+(selected==='sum'?' selected':'')+'>Optellen → '+esc(c.sumQty)+'</option>':'')+'<option value="replace">Bestaande hoeveelheid vervangen</option><option value="separate"'+(selected==='separate'?' selected':'')+'>Als aparte regel toevoegen</option><option value="skip">Bestaande laten staan</option></select></div>';}).join('')+'</div>';}
  function applyRecipeConflictPlan(s,analysis,decisions){
    var repo=repository();if(!repo||typeof repo.setItem!=='function')return Promise.reject(new Error('Boodschappenopslag niet beschikbaar'));var additions=analysis.unique.slice(),processed=[],skipped=[],chain=Promise.resolve();
    analysis.conflicts.forEach(function(conflict,index){var action=decisions[index]||'skip';if(action==='separate'){additions.push(conflict.incoming);return;}if(action==='skip'){skipped.push(conflict.incoming);return;}chain=chain.then(function(){var live=listRowByKey(s,analysis.row.key)||analysis.row,current=live.list&&live.list.items&&live.list.items[conflict.existingKey];if(!current){additions.push(conflict.incoming);return null;}var patch=Object.assign({},current),a=qtyParts(current),b=qtyParts(conflict.incoming);if(action==='sum'&&a&&b&&a.unit===b.unit){patch.amount=a.amount+b.amount;patch.unit=a.unit;patch.qty=niceNumber(patch.amount)+' '+patch.unit;}else if(action==='replace'){patch.amount=conflict.incoming.amount;patch.unit=conflict.incoming.unit;patch.qty=conflict.incoming.qty;patch.cat=conflict.incoming.cat||patch.cat;patch.photo=conflict.incoming.photo||patch.photo;}else{additions.push(conflict.incoming);return null;}patch.source='recipe';patch.sourceRecipeId=conflict.incoming.sourceRecipeId;patch.sourceRecipeName=conflict.incoming.sourceRecipeName;return repo.setItem(live.scope,live.list.id,conflict.existingKey,patch).then(function(record){if(record)processed.push(record);});});});
    return chain.then(function(){if(!additions.length)return{added:[],skipped:[]};return s.addItems(analysis.row.key,additions,{dedupe:false});}).then(function(addResult){var added=(addResult&&addResult.added||[]).concat(processed);return{listKey:analysis.row.key,added:added,skipped:skipped,mergedOrReplaced:processed};});
  }
  function openDuplicateResolver(s,analysis){
    if(!window.BottomSheet)return applyRecipeConflictPlan(s,analysis,analysis.conflicts.reduce(function(out,c,i){out[i]='skip';return out;},{}));
    ensureStyles();return new Promise(function(resolve,reject){var modal=window.BottomSheet.open({title:'Dubbele boodschappen',html:conflictHtml(analysis),closeOnBackdrop:false,actions:[{label:'Alleen nieuwe',keepOpen:true,onClick:function(ctx){var decisions={};analysis.conflicts.forEach(function(_,i){decisions[i]='skip';});ctx.modal.querySelectorAll('.fam-modal-btn').forEach(function(b){b.disabled=true;});applyRecipeConflictPlan(s,analysis,decisions).then(function(result){ctx.close();resolve(result);}).catch(function(error){ctx.modal.querySelectorAll('.fam-modal-btn').forEach(function(b){b.disabled=false;});reject(error);});}},{label:'Keuzes toepassen',primary:true,keepOpen:true,onClick:function(ctx){var decisions={};ctx.modal.querySelectorAll('[data-conflict-index]').forEach(function(sel){decisions[parseInt(sel.getAttribute('data-conflict-index'),10)]=sel.value;});ctx.modal.querySelectorAll('.fam-modal-btn').forEach(function(b){b.disabled=true;});applyRecipeConflictPlan(s,analysis,decisions).then(function(result){ctx.close();resolve(result);}).catch(function(error){ctx.modal.querySelectorAll('.fam-modal-btn').forEach(function(b){b.disabled=false;});reject(error);});}}]});if(!modal)reject(new Error('Conflictvenster kon niet openen'));});
  }
  function installRecipeConflictResolver(){var s=store();if(!s||typeof s.appendRecipeIngredients!=='function'||s.appendRecipeIngredients.__duplicateResolver)return false;var original=s.appendRecipeIngredients;s.appendRecipeIngredients=function(recipe,listKey){var analysis=analyzeRecipeDuplicates(s,recipe,listKey);if(!analysis||!analysis.conflicts.length)return original.call(s,recipe,listKey);return openDuplicateResolver(s,analysis);};s.appendRecipeIngredients.__duplicateResolver=true;return true;}

  function wireShopAddButton(){var screen=document.getElementById('screen-shop');if(!screen)return;var header=screen.querySelector('.list-header');if(!header)return;var btn=header.querySelector('.add-btn');if(!btn){btn=document.createElement('button');btn.className='add-btn';header.appendChild(btn);}btn.textContent='+ Toevoegen';btn.onclick=function(e){if(e)e.preventDefault();if(window.GroceryAddSheet&&typeof window.GroceryAddSheet.open==='function')window.GroceryAddSheet.open();return false;};}
  function boot(){ensureStyles();installRecipeConflictResolver();wireShopAddButton();if(!storeSub&&window.ShoppingListStore){storeSub=window.ShoppingListStore.onChange(function(){scheduleRenderShop(false);});}[100,300,800].forEach(function(delay){setTimeout(function(){installRecipeConflictResolver();wireShopAddButton();if(!storeSub&&window.ShoppingListStore){storeSub=window.ShoppingListStore.onChange(function(){scheduleRenderShop(false);});}},delay);});}
  window.renderShop=renderShop;window.toggleShop=toggleShop;window.deleteShop=deleteShop;window.resetShop=resetShop;window.highlightShopItem=highlightShopItem;window.wireShopAddButton=wireShopAddButton;window.ShopRenderer={version:VERSION,render:renderShop};
  installRecipeConflictResolver();
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
