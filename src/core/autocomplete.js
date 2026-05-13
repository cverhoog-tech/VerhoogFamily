'use strict';
// ============================================================
// AUTOCOMPLETE
// ============================================================

var AC_SHOP = [
  // Zuivel
  {n:'Melk',           e:'🥛', c:'Zuivel',     q:'1 liter'},
  {n:'Volle melk',     e:'🥛', c:'Zuivel',     q:'1 liter'},
  {n:'Halfvolle melk', e:'🥛', c:'Zuivel',     q:'1 liter'},
  {n:'Boter',          e:'🧈', c:'Zuivel',     q:'250g'},
  {n:'Kaas',           e:'🧀', c:'Zuivel',     q:'200g'},
  {n:'Jonge kaas',     e:'🧀', c:'Zuivel',     q:'200g'},
  {n:'Belegen kaas',   e:'🧀', c:'Zuivel',     q:'200g'},
  {n:'Yoghurt',        e:'🥛', c:'Zuivel',     q:'500ml'},
  {n:'Kwark',          e:'🥛', c:'Zuivel',     q:'500g'},
  {n:'Slagroom',       e:'🥛', c:'Zuivel',     q:'250ml'},
  {n:'Crème fraîche',  e:'🥛', c:'Zuivel',     q:'200ml'},
  {n:'Eieren',         e:'🥚', c:'Zuivel',     q:'6 stuks'},
  // Groente
  {n:'Ui',             e:'🧅', c:'Groente',    q:'2 stuks'},
  {n:'Uien',           e:'🧅', c:'Groente',    q:'1 zak'},
  {n:'Knoflook',       e:'🧄', c:'Groente',    q:'1 bol'},
  {n:'Tomaten',        e:'🍅', c:'Groente',    q:'500g'},
  {n:'Paprika',        e:'🫑', c:'Groente',    q:'2 stuks'},
  {n:'Komkommer',      e:'🥒', c:'Groente',    q:'1 stuks'},
  {n:'Sla',            e:'🥬', c:'Groente',    q:'1 zak'},
  {n:'Spinazie',       e:'🥬', c:'Groente',    q:'300g'},
  {n:'Broccoli',       e:'🥦', c:'Groente',    q:'1 stuks'},
  {n:'Bloemkool',      e:'🥦', c:'Groente',    q:'1 stuks'},
  {n:'Wortel',         e:'🥕', c:'Groente',    q:'500g'},
  {n:'Wortelen',       e:'🥕', c:'Groente',    q:'500g'},
  {n:'Aardappelen',    e:'🥔', c:'Groente',    q:'1 kg'},
  {n:'Zoete aardappel',e:'🍠', c:'Groente',    q:'500g'},
  {n:'Champignons',    e:'🍄', c:'Groente',    q:'250g'},
  {n:'Courgette',      e:'🥒', c:'Groente',    q:'1 stuks'},
  {n:'Prei',           e:'🥬', c:'Groente',    q:'2 stuks'},
  {n:'Bosui',          e:'🌿', c:'Groente',    q:'1 bos'},
  // Fruit
  {n:'Appels',         e:'🍎', c:'Fruit',      q:'1 zak'},
  {n:'Bananen',        e:'🍌', c:'Fruit',      q:'6 stuks'},
  {n:'Sinaasappels',   e:'🍊', c:'Fruit',      q:'4 stuks'},
  {n:'Citroenen',      e:'🍋', c:'Fruit',      q:'3 stuks'},
  {n:'Druiven',        e:'🍇', c:'Fruit',      q:'500g'},
  {n:'Aardbeien',      e:'🍓', c:'Fruit',      q:'250g'},
  {n:'Mango',          e:'🥭', c:'Fruit',      q:'1 stuks'},
  {n:'Avocado',        e:'🥑', c:'Fruit',      q:'2 stuks'},
  // Brood & Bakkerij
  {n:'Brood',          e:'🍞', c:'Brood',      q:'1 brood'},
  {n:'Wit brood',      e:'🍞', c:'Brood',      q:'1 brood'},
  {n:'Volkorenbrood',  e:'🍞', c:'Brood',      q:'1 brood'},
  {n:'Croissants',     e:'🥐', c:'Brood',      q:'4 stuks'},
  {n:'Crackers',       e:'🍘', c:'Brood',      q:'1 pak'},
  {n:'Beschuit',       e:'🫓', c:'Brood',      q:'1 pak'},
  // Vlees & Vis
  {n:'Kipfilet',       e:'🍗', c:'Vlees',      q:'500g'},
  {n:'Kip',            e:'🍗', c:'Vlees',      q:'500g'},
  {n:'Rundergehakt',   e:'🥩', c:'Vlees',      q:'500g'},
  {n:'Gehakt',         e:'🥩', c:'Vlees',      q:'500g'},
  {n:'Spek',           e:'🥓', c:'Vlees',      q:'150g'},
  {n:'Zalm',           e:'🐟', c:'Vlees',      q:'2 filets'},
  {n:'Tonijn blik',    e:'🐟', c:'Vlees',      q:'2 blikken'},
  // Pasta & Granen
  {n:'Pasta',          e:'🍝', c:'Overig',     q:'500g'},
  {n:'Spaghetti',      e:'🍝', c:'Overig',     q:'500g'},
  {n:'Penne',          e:'🍝', c:'Overig',     q:'500g'},
  {n:'Rijst',          e:'🍚', c:'Overig',     q:'1 kg'},
  {n:'Basmatirijst',   e:'🍚', c:'Overig',     q:'1 kg'},
  {n:'Lasagnebladen',  e:'🍝', c:'Overig',     q:'1 pak'},
  {n:'Couscous',       e:'🍚', c:'Overig',     q:'500g'},
  {n:'Bloem',          e:'🌾', c:'Overig',     q:'1 kg'},
  {n:'Havermout',      e:'🌾', c:'Overig',     q:'500g'},
  // Conserven & Sauzen
  {n:'Tomatenpuree',   e:'🥫', c:'Overig',     q:'2 blikken'},
  {n:'Gepelde tomaten',e:'🥫', c:'Overig',     q:'1 blik'},
  {n:'Kikkererwten',   e:'🥫', c:'Overig',     q:'1 blik'},
  {n:'Bruine bonen',   e:'🥫', c:'Overig',     q:'1 blik'},
  {n:'Olijfolie',      e:'🫙', c:'Overig',     q:'1 fles'},
  {n:'Zonnebloemolie', e:'🫙', c:'Overig',     q:'1 fles'},
  {n:'Ketjap',         e:'🫙', c:'Overig',     q:'1 fles'},
  {n:'Sojasaus',       e:'🫙', c:'Overig',     q:'1 fles'},
  // Dranken
  {n:'Water',          e:'💧', c:'Dranken',    q:'6 flessen'},
  {n:'Sinaasappelsap', e:'🍊', c:'Dranken',    q:'1 liter'},
  {n:'Appelsap',       e:'🍎', c:'Dranken',    q:'1 liter'},
  {n:'Cola',           e:'🥤', c:'Dranken',    q:'1.5 liter'},
  {n:'Koffie',         e:'☕', c:'Dranken',    q:'1 pak'},
  {n:'Thee',           e:'🍵', c:'Dranken',    q:'1 doosje'},
  // Overig
  {n:'Suiker',         e:'🍬', c:'Overig',     q:'1 kg'},
  {n:'Zout',           e:'🧂', c:'Overig',     q:'1 pak'},
  {n:'Peper',          e:'🫙', c:'Overig',     q:'1 pot'},
  {n:'Mayonaise',      e:'🫙', c:'Overig',     q:'1 pot'},
  {n:'Mosterd',        e:'🫙', c:'Overig',     q:'1 pot'},
  {n:'Ketchup',        e:'🫙', c:'Overig',     q:'1 fles'},
  {n:'Chocolade',      e:'🍫', c:'Overig',     q:'1 reep'},
  {n:'Chips',          e:'🥔', c:'Overig',     q:'1 zak'},
  {n:'Shampoo',        e:'🧴', c:'Overig',     q:'1 fles'},
  {n:'Tandpasta',      e:'🪥', c:'Overig',     q:'1 tube'},
  {n:'Toiletpapier',   e:'🧻', c:'Overig',     q:'1 pak'},
  {n:'Wasmiddel',      e:'🧺', c:'Overig',     q:'1 fles'},
  {n:'Afwasmiddel',    e:'🫧', c:'Overig',     q:'1 fles'},
];

// Also use previous shopping items as suggestions
function getShopSuggestions(query) {
  if(!query || query.length < 1) return [];
  var q = query.toLowerCase();
  // Merge static list with previous purchases
  var prev = shopData.map(function(i){
    return {n:i.name, e:i.photo&&!i.photo.startsWith('http')?i.photo:'🛒', c:i.cat, q:i.qty};
  });
  var all = AC_SHOP.concat(prev);
  // Deduplicate by name
  var seen = {};
  all = all.filter(function(item){
    var k = item.n.toLowerCase();
    if(seen[k]) return false;
    seen[k] = true;
    return true;
  });
  return all.filter(function(item){
    return item.n.toLowerCase().indexOf(q) > -1;
  }).slice(0, 7);
}

// Ingredient suggestions for recipe editor
var AC_INGREDIENTS = [
  '500g gehakt','250g kipfilet','200g spek','400g zalm','300g tonijn',
  '1 ui','2 uien','3 uien','1 rode ui','1 sjalot',
  '2 teentjes knoflook','3 teentjes knoflook','1 bol knoflook',
  '400g gepelde tomaten','2 el tomatenpuree','500ml passata',
  '200ml slagroom','100ml crème fraîche','250ml bouillon','500ml kippenbouillon',
  '200g champignons','1 courgette','2 paprika\'s','1 broccoli','300g spinazie',
  '500g aardappelen','400g zoete aardappel','200g wortel',
  '2 eieren','3 eieren','4 eieren',
  '100g boter','50g boter','3 el olijfolie','2 el zonnebloemolie',
  '200g mozzarella','150g parmezaan','100g feta','200g geraspte kaas',
  '400g pasta','250g spaghetti','200g penne','lasagnebladen',
  '200g rijst','300g basmatirijst','150g couscous',
  '100g bloem','2 el bloem','1 tl zout','1 tl peper',
  '1 tl komijn','1 tl paprikapoeder','1 tl oregano','1 tl tijm','1 tl basilicum',
  '2 el ketjap','3 el sojasaus','1 el azijn','2 el honing',
  '1 blik kikkererwten','1 blik bruine bonen','1 blik maïs',
  '1 citroen','2 citroenen','1 limoen','verse peterselie','verse basilicum',
  '1 baguette','4 sneetjes brood','paneermeel',
  '200ml kokosmelk','400ml kokosmelk','1 blikje tomatensaus',
];

function getIngredientSuggestions(lastLine) {
  if(!lastLine || lastLine.length < 2) return [];
  var q = lastLine.toLowerCase();
  // Combine static list + existing recipe ingredients
  var existing = [];
  recipesData.forEach(function(r){
    (r.ingredients||[]).forEach(function(ing){ if(existing.indexOf(ing)<0) existing.push(ing); });
  });
  var all = AC_INGREDIENTS.concat(existing);
  var seen = {};
  all = all.filter(function(i){if(seen[i])return false;seen[i]=true;return true;});
  return all.filter(function(ing){
    return ing.toLowerCase().indexOf(q)>-1 && ing.toLowerCase()!==q;
  }).slice(0, 6);
}

// ── ATTACH AUTOCOMPLETE TO FIELDS ──
function attachShopAutocomplete() {
  var inp = document.getElementById('f1');
  var drop = document.getElementById('ac-shop');
  if(!inp || !drop) return;

  inp.oninput = function() {
    var q = inp.value.trim();
    var results = getShopSuggestions(q);
    if(!results.length || !q) { drop.style.display='none'; return; }

    drop.style.display = 'block';
    drop.innerHTML = results.map(function(item) {
      var highlighted = item.n.replace(
        new RegExp('('+q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+')', 'gi'),
        '<span class="ac-highlight">$1</span>'
      );
      return '<div class="ac-item" data-name="'+item.n+'" data-qty="'+item.q+'" data-cat="'+item.c+'" data-emoji="'+item.e+'">'
        +'<div class="ac-item-icon">'+item.e+'</div>'
        +'<div class="ac-item-text"><div>'+highlighted+'</div>'
        +'<div class="ac-item-sub">'+item.q+' · '+item.c+'</div>'
        +'</div></div>';
    }).join('');

    drop.querySelectorAll('.ac-item').forEach(function(item){
      item.onmousedown = item.ontouchstart = function(e){
        e.preventDefault();
        inp.value = item.dataset.name;
        // Auto-fill quantity and category
        var qtyInp = document.getElementById('f2');
        var catSel = document.getElementById('f3');
        if(qtyInp && !qtyInp.value) qtyInp.value = item.dataset.qty;
        if(catSel) {
          var opts = Array.from(catSel.options);
          var match = opts.find(function(o){return o.value===item.dataset.cat;});
          if(match) catSel.value = item.dataset.cat;
        }
        setShopEmoji(item.dataset.emoji);
        drop.style.display = 'none';
        // Move focus to quantity
        if(qtyInp) qtyInp.focus();
      };
    });
  };

  inp.onblur = function(){ setTimeout(function(){drop.style.display='none';},150); };
  inp.onfocus = function(){ if(inp.value.trim()) inp.oninput(); };
}

function attachIngredientAutocomplete() {
  var ta = document.getElementById('re-ingredients');
  var chips = document.getElementById('ac-ing-chips');
  if(!ta || !chips) return;

  ta.oninput = function() {
    var val = ta.value;
    var lines = val.split('\n');
    var lastLine = lines[lines.length-1].trim();
    var suggestions = getIngredientSuggestions(lastLine);

    if(!suggestions.length || !lastLine) { chips.style.display='none'; return; }
    chips.style.display = 'flex';
    chips.innerHTML = suggestions.map(function(s){
      return '<div class="ac-ta-chip" data-sug="'+s.replace(/"/g,'&quot;')+'">'+s+'</div>';
    }).join('');

    chips.querySelectorAll('.ac-ta-chip').forEach(function(chip){
      chip.onmousedown = chip.ontouchstart = function(e){
        e.preventDefault();
        var lines2 = ta.value.split('\n');
        lines2[lines2.length-1] = chip.dataset.sug;
        ta.value = lines2.join('\n') + '\n';
        chips.style.display='none';
        ta.focus();
        // Move cursor to end
        ta.selectionStart = ta.selectionEnd = ta.value.length;
      };
    });
  };

  ta.onblur = function(){ setTimeout(function(){chips.style.display='none';},150); };
}




