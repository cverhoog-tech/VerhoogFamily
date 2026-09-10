'use strict';
// ============================================================
// SHOPPING RECIPE DUPLICATE RESOLVER v1.0.0
// Presentation/business bridge only. Keeps duplicate handling out of the fast
// shopping renderer so recipe imports cannot pull the legacy shopping UI back.
// ============================================================
(function(){
  if(window.ShoppingRecipeDuplicateResolver)return;
  var VERSION='1.0.0';
  var STYLE_ID='shopping-recipe-duplicate-style';

  function esc(value){var d=document.createElement('div');d.textContent=String(value==null?'':value);return d.innerHTML;}
  function store(){return window.ShoppingListStore||null;}
  function repository(){return window.ShoppingListHouseholdRepository||null;}
  function canonicalName(value){return String(value||'').trim().toLowerCase().replace(/\s+/g,' ');}
  function normalizeUnit(value){var raw=String(value||'').trim().toLowerCase(),p=window.GroceryInputParser;if(p&&typeof p.normalizeUnit==='function'){var normalized=p.normalizeUnit(raw);if(normalized)return normalized;}if(raw==='stuk'||raw==='stuks'||raw==='x')return'st';if(raw==='liter')return'l';return raw;}
  function niceNumber(value){var n=Math.round(Number(value)*100)/100;return String(n).replace('.',',');}
  function qtyParts(item){var amount=Number(item&&item.amount),unit=normalizeUnit(item&&item.unit);if(Number.isFinite(amount)&&unit)return{amount:amount,unit:unit};var raw=String(item&&item.qty||'').trim(),match=raw.match(/^([0-9]+(?:[.,][0-9]+)?)\s*([^\s]+)?/);if(!match)return null;amount=parseFloat(match[1].replace(',','.'));unit=normalizeUnit(match[2]||'st');return Number.isFinite(amount)&&unit?{amount:amount,unit:unit}:null;}
  function qtyLabel(item){var p=qtyParts(item);return p?niceNumber(p.amount)+' '+p.unit:String(item&&item.qty||'1 st');}
  function ingredientText(ingredient){if(ingredient&&typeof ingredient==='object')return String(ingredient.rawText||ingredient.text||ingredient.name||'').trim();return String(ingredient||'').trim();}
  function classifyIngredient(text,recipe){var parser=window.GroceryInputParser,classifier=window.GroceryProductClassifier;var parsed=parser&&typeof parser.parse==='function'?parser.parse(text):{productName:text,amount:null,unit:null};var guess=classifier&&typeof classifier.classify==='function'?classifier.classify(parsed.productName):{category:'Overig',icon:null,qty:'1 st'};var fallback=String(guess.qty||'1 st').match(/^([0-9]+(?:[.,][0-9]+)?)\s*(.*)$/),amount=parsed.amount!=null?Number(parsed.amount):(fallback?parseFloat(fallback[1].replace(',','.')):1),unit=normalizeUnit(parsed.unit||(fallback&&fallback[2])||'st');if(!Number.isFinite(amount))amount=1;return{name:parsed.productName||text,amount:amount,unit:unit||'st',qty:niceNumber(amount)+' '+(unit||'st'),cat:guess.category||'Overig',photo:guess.icon||null,source:'recipe',sourceRecipeId:recipe&&recipe.id||null,sourceRecipeName:recipe&&recipe.name||null};}
  function listRowByKey(s,key){return(s&&typeof s.all==='function'?s.all():[]).find(function(row){return row.key===key;})||null;}

  function analyze(s,recipe,listKey){
    var row=listRowByKey(s,listKey)||(s&&s.active?s.active():null);if(!row)return null;
    var existing=row.list&&row.list.items||{},openByName={};Object.keys(existing).forEach(function(key){var item=existing[key];if(item&&!item.done&&!openByName[canonicalName(item.name)])openByName[canonicalName(item.name)]={key:key,item:item};});
    var unique=[],conflicts=[];(recipe&&recipe.ingredients||[]).forEach(function(ingredient){var text=ingredientText(ingredient);if(!text)return;var incoming=classifyIngredient(text,recipe),hit=openByName[canonicalName(incoming.name)];if(!hit){unique.push(incoming);return;}var a=qtyParts(hit.item),b=qtyParts(incoming),canSum=!!(a&&b&&a.unit===b.unit);conflicts.push({incoming:incoming,existingKey:hit.key,existing:hit.item,canSum:canSum,sumQty:canSum?niceNumber(a.amount+b.amount)+' '+a.unit:null});});
    return{row:row,unique:unique,conflicts:conflicts};
  }

  function ensureStyles(){if(document.getElementById(STYLE_ID))return;var style=document.createElement('style');style.id=STYLE_ID;style.textContent=[
    '.shopping-conflict-modal .fam-modal-title{color:#111!important}',
    '.shopping-conflict-intro{font-size:13px;line-height:1.48;color:#111!important;margin:0 0 10px;padding:11px 12px;border-radius:14px;background:linear-gradient(135deg,#eef8e9,#f8fcf5);border:1px solid #d7e9cf}',
    '.shopping-conflict-intro b{color:#111!important}',
    '.shopping-conflict-list{display:flex;flex-direction:column;gap:9px}',
    '.shopping-conflict-row{border:1.5px solid #d4e7cc;background:linear-gradient(135deg,#fff,#f1f8ed);border-radius:16px;padding:11px;box-shadow:0 5px 15px rgba(47,110,37,.08)}',
    '.shopping-conflict-copy{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:8px}',
    '.shopping-conflict-copy b{font-size:14px;color:#111}',
    '.shopping-conflict-copy small{display:block;color:#4f5d50;font-size:11px;line-height:1.35;margin-top:2px}',
    '.shopping-conflict-row select{width:100%;border:1.5px solid #b9d7ae;background:#fff;color:#285d2a;border-radius:12px;padding:9px 10px;font-size:13px;font-weight:800;outline:none;box-shadow:0 2px 8px rgba(47,110,37,.06)}',
    '.shopping-conflict-modal .fam-modal-primary{background:linear-gradient(135deg,#55973e,#2f742a)!important;color:#fff!important;box-shadow:0 8px 18px rgba(47,116,42,.24)}',
    '.shopping-conflict-modal .fam-modal-secondary{background:linear-gradient(135deg,#fff7e8,#ffefd0)!important;color:#8b5713!important;border:1px solid #efd5a5!important;box-shadow:0 5px 14px rgba(139,87,19,.10)}'
  ].join('\n');document.head.appendChild(style);}

  function conflictHtml(analysis){return '<div class="shopping-conflict-intro"><b>'+analysis.conflicts.length+' dubbel'+(analysis.conflicts.length===1?' product':'e producten')+' gevonden.</b> Kies per product wat er moet gebeuren. Niets wordt stil overschreven.</div><div class="shopping-conflict-list">'+analysis.conflicts.map(function(conflict,index){var selected=conflict.canSum?'sum':'separate';return '<div class="shopping-conflict-row"><div class="shopping-conflict-copy"><div><b>'+esc(conflict.incoming.name)+'</b><small>Op lijst: '+esc(qtyLabel(conflict.existing))+' · Recept: '+esc(qtyLabel(conflict.incoming))+'</small></div></div><select data-conflict-index="'+index+'">'+(conflict.canSum?'<option value="sum"'+(selected==='sum'?' selected':'')+'>Optellen → '+esc(conflict.sumQty)+'</option>':'')+'<option value="replace">Bestaande hoeveelheid vervangen</option><option value="separate"'+(selected==='separate'?' selected':'')+'>Als aparte regel toevoegen</option><option value="skip">Bestaande laten staan</option></select></div>';}).join('')+'</div>';}

  function applyPlan(s,analysis,decisions){
    var repo=repository();if(!repo||typeof repo.setItem!=='function')return Promise.reject(new Error('Boodschappenopslag niet beschikbaar'));
    var additions=analysis.unique.slice(),processed=[],skipped=[],chain=Promise.resolve();
    analysis.conflicts.forEach(function(conflict,index){var action=decisions[index]||'skip';if(action==='separate'){additions.push(conflict.incoming);return;}if(action==='skip'){skipped.push(conflict.incoming);return;}chain=chain.then(function(){var live=listRowByKey(s,analysis.row.key)||analysis.row,current=live.list&&live.list.items&&live.list.items[conflict.existingKey];if(!current){additions.push(conflict.incoming);return null;}var patch=Object.assign({},current),a=qtyParts(current),b=qtyParts(conflict.incoming);if(action==='sum'&&a&&b&&a.unit===b.unit){patch.amount=a.amount+b.amount;patch.unit=a.unit;patch.qty=niceNumber(patch.amount)+' '+patch.unit;}else if(action==='replace'){patch.amount=conflict.incoming.amount;patch.unit=conflict.incoming.unit;patch.qty=conflict.incoming.qty;patch.cat=conflict.incoming.cat||patch.cat;patch.photo=conflict.incoming.photo||patch.photo;}else{additions.push(conflict.incoming);return null;}patch.source='recipe';patch.sourceRecipeId=conflict.incoming.sourceRecipeId;patch.sourceRecipeName=conflict.incoming.sourceRecipeName;return repo.setItem(live.scope,live.list.id,conflict.existingKey,patch).then(function(record){if(record)processed.push(record);});});});
    return chain.then(function(){if(!additions.length)return{added:[],skipped:[]};return s.addItems(analysis.row.key,additions,{dedupe:false});}).then(function(addResult){return{listKey:analysis.row.key,added:(addResult&&addResult.added||[]).concat(processed),skipped:skipped,mergedOrReplaced:processed};});
  }

  function openResolver(s,analysis){
    if(!window.BottomSheet){var skips={};analysis.conflicts.forEach(function(_,index){skips[index]='skip';});return applyPlan(s,analysis,skips);}
    ensureStyles();return new Promise(function(resolve,reject){var modal=window.BottomSheet.open({title:'Dubbele boodschappen',html:conflictHtml(analysis),closeOnBackdrop:false,onOpen:function(ctx){if(ctx&&ctx.modal)ctx.modal.classList.add('shopping-conflict-modal');},actions:[{label:'Alleen nieuwe',keepOpen:true,onClick:function(ctx){var decisions={};analysis.conflicts.forEach(function(_,index){decisions[index]='skip';});ctx.modal.querySelectorAll('.fam-modal-btn').forEach(function(button){button.disabled=true;});applyPlan(s,analysis,decisions).then(function(result){ctx.close();resolve(result);}).catch(function(error){ctx.modal.querySelectorAll('.fam-modal-btn').forEach(function(button){button.disabled=false;});reject(error);});}},{label:'Keuzes toepassen',primary:true,keepOpen:true,onClick:function(ctx){var decisions={};ctx.modal.querySelectorAll('[data-conflict-index]').forEach(function(select){decisions[parseInt(select.getAttribute('data-conflict-index'),10)]=select.value;});ctx.modal.querySelectorAll('.fam-modal-btn').forEach(function(button){button.disabled=true;});applyPlan(s,analysis,decisions).then(function(result){ctx.close();resolve(result);}).catch(function(error){ctx.modal.querySelectorAll('.fam-modal-btn').forEach(function(button){button.disabled=false;});reject(error);});}}]});if(!modal)reject(new Error('Conflictvenster kon niet openen'));});
  }

  function install(){var s=store();if(!s||typeof s.appendRecipeIngredients!=='function')return false;if(s.appendRecipeIngredients.__duplicateResolverV2)return true;var original=s.appendRecipeIngredients;s.appendRecipeIngredients=function(recipe,listKey){var analysisResult=analyze(s,recipe,listKey);if(!analysisResult||!analysisResult.conflicts.length)return original.call(s,recipe,listKey);return openResolver(s,analysisResult);};s.appendRecipeIngredients.__duplicateResolverV2=true;return true;}
  function boot(){ensureStyles();if(install())return;var tries=0,timer=setInterval(function(){tries++;if(install()||tries>200)clearInterval(timer);},50);}
  window.ShoppingRecipeDuplicateResolver={version:VERSION,install:install,analyze:function(recipe,listKey){var s=store();return s?analyze(s,recipe,listKey):null;}};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
