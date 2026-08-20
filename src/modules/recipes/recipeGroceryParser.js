'use strict';
// RECIPE GROCERY PARSER v0.283
// Pure ingredient parsing utility. Shopping mutations are owned by ShoppingListStore.

(function(){
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

  function emojiFor(name, cat){
    var n = norm(name);
    if(/tomaat|tomaten|passata|tomatenpuree/.test(n)) return '🍅';
    if(/ui\b|uien/.test(n)) return '🧅';
    if(/knoflook|teen|teentjes/.test(n)) return '🧄';
    if(/aardappel/.test(n)) return '🥔';
    if(/wortel/.test(n)) return '🥕';
    if(/paprika|peper/.test(n)) return '🫑';
    if(/komkommer/.test(n)) return '🥒';
    if(/sla|spinazie|basilicum|peterselie|koriander|prei/.test(n)) return '🥬';
    if(/broccoli/.test(n)) return '🥦';
    if(/champignon|paddenstoel/.test(n)) return '🍄';
    if(/citroen|limoen/.test(n)) return '🍋';
    if(/appel/.test(n)) return '🍎';
    if(/banaan/.test(n)) return '🍌';
    if(/kip/.test(n)) return '🍗';
    if(/gehakt|rund|varken|spek|bacon|worst|lam/.test(n)) return '🥩';
    if(/vis|zalm|tonijn/.test(n)) return '🐟';
    if(/garnal/.test(n)) return '🦐';
    if(/ei\b|eieren/.test(n)) return '🥚';
    if(/melk/.test(n)) return '🥛';
    if(/kaas|mozzarella|parmezaan|feta/.test(n)) return '🧀';
    if(/boter/.test(n)) return '🧈';
    if(/pasta|spaghetti|macaroni/.test(n)) return '🍝';
    if(/rijst/.test(n)) return '🍚';
    if(/noedel|mie|bami/.test(n)) return '🍜';
    if(/brood|sneetje|sneetjes/.test(n)) return '🍞';
    if(/wrap|tortilla/.test(n)) return '🌯';
    if(/olie|olijfolie/.test(n)) return '🫒';
    if(/kokosmelk/.test(n)) return '🥥';
    if(/bonen/.test(n)) return '🫘';
    if(/mais|maïs/.test(n)) return '🌽';
    if(cat === 'Zuivel') return '🥛';
    if(cat === 'Groente/Fruit') return '🥦';
    if(cat === 'Vlees/Vis/Ei') return '🍗';
    if(cat === 'Droogwaren') return '🌾';
    if(cat === 'Kruiden/Sauzen') return '🧂';
    if(cat === 'Conserven') return '🥫';
    return '🛒';
  }

  function parseIngredient(line){
    var text = clean(line && typeof line === 'object' ? (line.rawText || line.text || line.name || '') : line);
    var qty = '1x';
    var name = text;
    var m = text.match(/^([0-9]+(?:[\.,][0-9]+)?|[0-9]+\/[0-9]+|½|¼|¾)\s*(kg|g|gram|ml|l|el|tl|stuks?|blik|pot|pak|zak|teen|teentjes|snuf|bos|plak|sneetjes?)?\s+(.+)$/i);
    if(m){ qty = (m[1] + (m[2] ? ' ' + m[2] : 'x')).trim(); name = m[3]; }
    name = clean(name).replace(/[,;].*$/, '').replace(/\([^)]*\)/g, '').trim();
    var cat = categoryFor(name || text);
    return { name:name || text, qty:qty, cat:cat, photo:emojiFor(name || text, cat), key:norm(name || text), rawText:text };
  }

  window.RecipeGroceryParser = { version:'0.283', parse:parseIngredient, emojiFor:emojiFor, categoryFor:categoryFor };
})();
