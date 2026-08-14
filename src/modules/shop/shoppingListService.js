'use strict';
// ============================================================
// SHOPPING LIST SERVICE v1.0
// Domain command layer for targeted list mutations.
// Appends records to an existing list without replacing its contents.
// ============================================================
(function(){
  if(window.ShoppingListService) return;
  var VERSION='1.0.0', COLLECTION='shoppingLists';

  function store(){ return window.FamilyDataStore || null; }
  function now(){ return Date.now(); }
  function uid(){ var s=store()&&store().status?store().status():{}; return s.userId||null; }
  function parseKey(key){
    var raw=String(key||''), i=raw.indexOf(':');
    if(i<1) return null;
    var scope=raw.slice(0,i), id=raw.slice(i+1);
    if((scope!=='shared'&&scope!=='private')||!id) return null;
    return {scope:scope,id:id,key:raw};
  }
  function listRows(){
    return window.ShoppingLists&&typeof window.ShoppingLists.all==='function' ? window.ShoppingLists.all() : [];
  }
  function getList(key){
    var parsed=parseKey(key); if(!parsed) return null;
    var row=listRows().find(function(x){return x&&x.key===parsed.key;});
    return row||null;
  }
  function writer(scope){
    if(!store()) return null;
    return scope==='shared' ? store().writeSharedPath : store().writePrivatePath;
  }
  function normalizeItem(input){
    input=input||{};
    var name=String(input.name||'').trim();
    if(!name) return null;
    return {
      name:name,
      qty:String(input.qty||'1x'),
      cat:input.cat||'Overig',
      who:input.who||'',
      done:false,
      photo:input.photo==null?null:input.photo,
      source:input.source||null,
      sourceRecipeId:input.sourceRecipeId||null,
      sourceRecipeName:input.sourceRecipeName||null
    };
  }
  function canonicalName(v){ return String(v||'').trim().toLowerCase(); }
  function appendItems(listKey, items, options){
    options=options||{};
    var row=getList(listKey), st=store();
    if(!row||!st) return Promise.reject(new Error('Winkellijst niet beschikbaar'));
    var fn=writer(row.scope); if(typeof fn!=='function') return Promise.reject(new Error('Winkellijst opslag niet beschikbaar'));
    var existing=row.list&&row.list.items&&typeof row.list.items==='object'?row.list.items:{};
    var existingNames={};
    Object.keys(existing).forEach(function(k){var x=existing[k];if(x&&!x.done)existingNames[canonicalName(x.name)]=true;});
    var added=[], skipped=[];
    (Array.isArray(items)?items:[]).forEach(function(input){
      var clean=normalizeItem(input); if(!clean) return;
      var n=canonicalName(clean.name);
      if(options.dedupe!==false&&existingNames[n]){ skipped.push(clean); return; }
      existingNames[n]=true;
      var key=st.makeId('item');
      added.push(Object.assign({},clean,{_key:key,createdAt:now(),createdBy:uid(),updatedAt:now(),updatedBy:uid()}));
    });
    var jobs=added.map(function(record){
      return fn.call(st,COLLECTION,[row.list.id,'items',record._key],record);
    });
    return Promise.all(jobs).then(function(){
      return Promise.all([
        fn.call(st,COLLECTION,[row.list.id,'updatedAt'],now()),
        fn.call(st,COLLECTION,[row.list.id,'updatedBy'],uid())
      ]);
    }).then(function(){ return {listKey:listKey,added:added,skipped:skipped}; });
  }
  function appendRecipeIngredients(listKey, recipe, options){
    if(!recipe) return Promise.reject(new Error('Recept ontbreekt'));
    var items=(recipe.ingredients||[]).map(function(ingredient){
      return {name:String(ingredient||'').trim(),qty:'1x',cat:'Overig',source:'recipe',sourceRecipeId:recipe.id||null,sourceRecipeName:recipe.name||null};
    }).filter(function(x){return !!x.name;});
    return appendItems(listKey,items,Object.assign({dedupe:true},options||{}));
  }

  window.ShoppingListService={version:VERSION,parseKey:parseKey,getList:getList,list:listRows,appendItems:appendItems,appendRecipeIngredients:appendRecipeIngredients};
})();
