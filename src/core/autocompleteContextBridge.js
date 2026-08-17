'use strict';
// ============================================================
// AUTOCOMPLETE CONTEXT BRIDGE v1.0.0
// Static vocabulary is always safe. Household history is supplied only by
// SearchContextService after current UID/household validation.
// ============================================================
(function(){
  if(window.AutocompleteContextBridge&&window.AutocompleteContextBridge.version==='1.0.0')return;
  var VERSION='1.0.0';
  function norm(v){return String(v||'').toLowerCase().trim();}
  function staticShop(query){var q=norm(query),seen={};if(!q)return[];return(Array.isArray(window.AC_SHOP)?window.AC_SHOP:[]).filter(function(item){var k=norm(item&&item.n);if(!k||seen[k])return false;seen[k]=true;return k.indexOf(q)>-1;}).slice(0,7);}
  function staticIngredients(query){var q=norm(query),seen={};if(q.length<2)return[];return(Array.isArray(window.AC_INGREDIENTS)?window.AC_INGREDIENTS:[]).filter(function(item){var k=norm(item);if(!k||seen[k])return false;seen[k]=true;return k.indexOf(q)>-1&&k!==q;}).slice(0,6);}
  function shop(query){var svc=window.SearchContextService;if(svc&&typeof svc.shoppingSuggestions==='function'){try{return svc.shoppingSuggestions(query,window.AC_SHOP||[]);}catch(e){if(!(e&&e.code==='SEARCH_CONTEXT_CHANGED'))console.warn('[AutocompleteContextBridge] shop context unavailable',e);}}return staticShop(query);}
  function ingredients(query){var svc=window.SearchContextService;if(svc&&typeof svc.ingredientSuggestions==='function'){try{return svc.ingredientSuggestions(query,window.AC_INGREDIENTS||[]);}catch(e){if(!(e&&e.code==='SEARCH_CONTEXT_CHANGED'))console.warn('[AutocompleteContextBridge] ingredient context unavailable',e);}}return staticIngredients(query);}
  window.getShopSuggestions=shop;
  window.getIngredientSuggestions=ingredients;
  try{getShopSuggestions=shop;}catch(e){}
  try{getIngredientSuggestions=ingredients;}catch(e){}
  window.AutocompleteContextBridge={version:VERSION,shopSuggestions:shop,ingredientSuggestions:ingredients};
})();
