'use strict';
// RECIPE GROCERY PARSER v0.281
// Improves recipe ingredient parsing for the shopping list.

(function(){
  var STORE_KEY = 'familyapp_food_shop_v001';

  function norm(v){ return String(v || '').toLowerCase().trim().replace(/\s+/g, ' '); }
  function clean(v){ return String(v || '').replace(/^[-*•]\s*/, '').replace(/\s+/g, ' ').trim(); }

  function categoryFor(name){
    var n = norm(name);
    if(/kip|gehakt|rund|varken|spek|worst|vis|zalm|tonijn|garnal|ei\b|eieren/.test(n)) return 'Vlees/Vis/Ei';
    if(/melk|kaas|yoghurt|boter|room|mozzarella|parmezaan|feta/.test(n)) return 'Zuivel';
    if(/sla|tomaat|ui\b|uien|knoflook|paprika|komkommer|wortel|aardappel|champignon|spinazie|courgette|broccoli|citroen|appel|banaan/.test(n)) return 'Groente/Fruit';
    if(/pasta|rijst|noedel|mie|bami|brood|wrap|tortilla|bloem|meel|suiker|havermout|couscous/.test(n)) return 'Droogwaren';
    if(/olie|azijn|saus|ketjap|sambal|mayonaise|ketchup|mosterd|bouillon|kruiden|peper|zout|komijn|kerrie|oregano|basilicum/.test(n)) return 'Kruiden/Sauzen';
    if(/blik|tomatenpuree|kokosmelk|bonen|mais|maïs|passata/.test(n)) return 'Conserven';
    return 'Overig';
  }

  function parseIngredient(line){
    var text = clean(line);
    var qty = '1x';
    var name = text;
    var m = text.match(/^([0-9]+(?:[\.,][0-9]+)?|[0-9]+\/[0-9]+|½|¼|¾)\s*(kg|g|gram|ml|l|el|tl|stuks?|blik|pot|pak|zak|teen|teentjes|snuf|bos|plak|sneetjes?)?\s+(.+)$/i);
    if(m){
      qty = (m[1] + (m[2] ? ' ' + m[2] : 'x')).trim();
      name = m[3];
    }
    name = clean(name).replace(/[,;].*$/, '').replace(/\([^)]*\)/g, '').trim();
    return { name: name || text, qty: qty, cat: categoryFor(name || text), key: norm(name || text) };
  }

  function currentRecipe(){
    var h = document.querySelector('#recipe-detail-view .rd-info h2');
    var title = h ? h.textContent.trim() : '';
    var list = Array.isArray(window.recipesData) ? window.recipesData : [];
    return list.find(function(r){ return String(r.name || '').trim() === title; });
  }

  function nextId(){
    if(!Array.isArray(window.shopData)) window.shopData = [];
    var max = window.shopData.reduce(function(m, x){ return Math.max(m, parseInt(x.id, 10) || 0); }, 0);
    window.shopNextId = Math.max(parseInt(window.shopNextId, 10) || 1, max + 1);
    return window.shopNextId++;
  }

  function persist(){
    try { localStorage.setItem(STORE_KEY, JSON.stringify(window.shopData || [])); } catch(e) {}
    try { if(window.HouseholdRepository && window.HouseholdRepository.write) window.HouseholdRepository.write('groceries', window.shopData || [], { source:'recipeGroceryParser' }); } catch(e) {}
  }

  function addRecipe(recipe){
    if(!recipe || !Array.isArray(recipe.ingredients)) return;
    if(!Array.isArray(window.shopData)) window.shopData = [];
    var added = 0;
    var merged = 0;
    recipe.ingredients.forEach(function(line){
      var p = parseIngredient(line);
      var found = window.shopData.find(function(x){ return !x.done && norm(x.name) === p.key; });
      if(found){
        if(found.qty !== p.qty && p.qty !== '1x') found.qty = found.qty ? found.qty + ' + ' + p.qty : p.qty;
        if(!found.cat || found.cat === 'Overig') found.cat = p.cat;
        merged++;
      } else {
        window.shopData.unshift({ id: nextId(), name: p.name, qty: p.qty, cat: p.cat, who: window.myName || '', done: false, photo: null, source:'recipe', sourceRecipe: recipe.name || '' });
        added++;
      }
    });
    persist();
    if(typeof window.renderShop === 'function') setTimeout(window.renderShop, 50);
    if(typeof window.updateStats === 'function') window.updateStats();
    if(typeof window.showToast === 'function') window.showToast(added + ' toegevoegd · ' + merged + ' samengevoegd ✓');
  }

  function wire(){
    var btn = document.getElementById('rd-shop');
    if(!btn || btn.__recipeGroceryParser) return;
    btn.__recipeGroceryParser = true;
    btn.onclick = function(){ addRecipe(currentRecipe()); return false; };
  }

  function boot(){
    wire();
    var screen = document.getElementById('screen-recipes');
    if(screen && !screen.__recipeGroceryParserObserver){
      screen.__recipeGroceryParserObserver = true;
      new MutationObserver(wire).observe(screen, { childList:true, subtree:true });
    }
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  window.RecipeGroceryParser = { parse: parseIngredient, addRecipe: addRecipe, boot: boot };
})();
