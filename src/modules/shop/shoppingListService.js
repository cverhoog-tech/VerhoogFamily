'use strict';
// ============================================================
// SHOPPING LIST SERVICE v1.2
// Context-safe domain command layer for targeted list mutations.
// ============================================================
(function(){
  if(window.ShoppingListService&&window.ShoppingListService.version==='1.2.0')return;
  var VERSION='1.2.0',COLLECTION='shoppingLists';
  function store(){return window.FamilyDataStore||null;}function now(){return Date.now();}
  function token(){var c=window.HouseholdContext;if(!c)throw new Error('HOUSEHOLD_CONTEXT_UNAVAILABLE');var uid=c.requireUser(),householdId=c.requireHousehold();c.assertContext({uid:uid,householdId:householdId,requireReady:true});return{uid:uid,householdId:householdId};}
  function assertToken(t){if(!window.HouseholdContext||!window.HouseholdContext.isCurrent(t)){var e=new Error('SHOPPING_CONTEXT_CHANGED');e.code='SHOPPING_CONTEXT_CHANGED';throw e;}return t;}
  function parseKey(key){var raw=String(key||''),i=raw.indexOf(':');if(i<1)return null;var scope=raw.slice(0,i),id=raw.slice(i+1);if((scope!=='shared'&&scope!=='private')||!id)return null;return{scope:scope,id:id,key:raw};}
  function listRows(){return window.ShoppingLists&&typeof window.ShoppingLists.all==='function'?window.ShoppingLists.all():[];}
  function getList(key){var p=parseKey(key);if(!p)return null;return listRows().find(function(x){return x&&x.key===p.key;})||null;}
  function writer(scope){if(!store())return null;return scope==='shared'?store().writeSharedPath:store().writePrivatePath;}
  function normalizeItem(input){input=input||{};var name=String(input.name||'').trim();if(!name)return null;return{name:name,qty:String(input.qty||'1x'),cat:input.cat||'Overig',who:input.who||'',done:false,photo:input.photo==null?null:input.photo,source:input.source||null,sourceRecipeId:input.sourceRecipeId||null,sourceRecipeName:input.sourceRecipeName||null};}
  function canonicalName(v){return String(v||'').trim().toLowerCase();}
  function appendItems(listKey,items,options){
    options=options||{};var t=token(),row=getList(listKey),st=store();
    if(!row||!st)return Promise.reject(new Error('Winkellijst niet beschikbaar'));
    var fn=writer(row.scope);if(typeof fn!=='function')return Promise.reject(new Error('Winkellijst opslag niet beschikbaar'));
    var existing=row.list&&row.list.items&&typeof row.list.items==='object'?row.list.items:{},existingNames={};
    Object.keys(existing).forEach(function(k){var x=existing[k];if(x&&!x.done)existingNames[canonicalName(x.name)]=true;});
    var added=[],skipped=[];
    (Array.isArray(items)?items:[]).forEach(function(input){var clean=normalizeItem(input);if(!clean)return;var n=canonicalName(clean.name);if(options.dedupe!==false&&existingNames[n]){skipped.push(clean);return;}existingNames[n]=true;var key=st.makeId('item');added.push(Object.assign({},clean,{_key:key,createdAt:now(),createdBy:t.uid,updatedAt:now(),updatedBy:t.uid}));});
    assertToken(t);
    var jobs=added.map(function(record){assertToken(t);return fn.call(st,COLLECTION,[row.list.id,'items',record._key],record);});
    return Promise.all(jobs).then(function(){assertToken(t);if(!added.length)return null;return Promise.all([fn.call(st,COLLECTION,[row.list.id,'updatedAt'],now()),fn.call(st,COLLECTION,[row.list.id,'updatedBy'],t.uid)]);}).then(function(){assertToken(t);return{listKey:listKey,added:added,skipped:skipped};});
  }
  function ingredientText(ingredient){if(ingredient&&typeof ingredient==='object')return String(ingredient.rawText||ingredient.text||ingredient.name||'').trim();return String(ingredient||'').trim();}
  function ingredientItem(ingredient,recipe){var text=ingredientText(ingredient);if(!text)return null;var parsed=null;try{if(window.RecipeGroceryParser&&typeof window.RecipeGroceryParser.parse==='function')parsed=window.RecipeGroceryParser.parse(text);}catch(e){}var qty=ingredient&&typeof ingredient==='object'&&ingredient.quantity?String(ingredient.quantity)+(ingredient.unit?' '+ingredient.unit:''):'';return{name:parsed&&parsed.name?parsed.name:(ingredient&&typeof ingredient==='object'&&ingredient.name?ingredient.name:text),qty:qty||(parsed&&parsed.qty)||'1x',cat:(parsed&&parsed.cat)||'Overig',photo:(parsed&&parsed.photo)||null,source:'recipe',sourceRecipeId:recipe.id||null,sourceRecipeName:recipe.name||null};}
  function appendRecipeIngredients(listKey,recipe,options){if(!recipe)return Promise.reject(new Error('Recept ontbreekt'));var items=(recipe.ingredients||[]).map(function(i){return ingredientItem(i,recipe);}).filter(Boolean);return appendItems(listKey,items,Object.assign({dedupe:true},options||{}));}
  window.ShoppingListService={version:VERSION,parseKey:parseKey,getList:getList,list:listRows,appendItems:appendItems,appendRecipeIngredients:appendRecipeIngredients};
})();
