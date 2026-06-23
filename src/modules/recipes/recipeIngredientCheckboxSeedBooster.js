'use strict';
// ============================================================
// RECIPE INGREDIENT CHECKBOX + SEED BOOSTER v0.378
// Ensures every recipe has array-based ingredients so every ingredient
// renders as a checkbox in the direct stable detail renderer.
// Also adds a larger recipe pack without touching filter/search bridges.
// ============================================================

(function(){
  var VERSION = '0.378';
  var IMG = 'https://images.unsplash.com/';
  var FALLBACKS = [
    IMG+'photo-1529042410759-befb1204b468?auto=format&fit=crop&w=1200&q=85',
    IMG+'photo-1498579397066-22750a3cb424?auto=format&fit=crop&w=1200&q=85',
    IMG+'photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=1200&q=85',
    IMG+'photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=85',
    IMG+'photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=1200&q=85',
    IMG+'photo-1547592166-23ac45744acd?auto=format&fit=crop&w=1200&q=85'
  ];

  var EXTRA_MORE = [
    {name:'Bara met chutney',cat:'Snack',persons:8,time:70,photo:FALLBACKS[3],ingredients:['500g zelfrijzend bakmeel','200g urdi of gele erwten','Spinazie','Knoflook','Komijn','Masala','Zout','Olie'],steps:['Week en maal erwten.','Meng met bloem, spinazie en kruiden.','Laat kort rusten.','Vorm bara en frituur goudbruin.'],notes:'Lekker met mango chutney.'},
    {name:'Teloh bakkeljauw',cat:'Snack',persons:4,time:45,photo:FALLBACKS[4],ingredients:['1 cassave','250g bakkeljauw','1 ui','1 tomaat','Madame Jeanette','Knoflook','Olie'],steps:['Kook cassave gaar.','Bak of frituur cassave stukken.','Fruit ui, knoflook en tomaat.','Voeg bakkeljauw toe en serveer samen.'],notes:'Surinaamse streetfood klassieker.'},
    {name:'Kip saté met pindasaus',cat:'Diner',persons:4,time:55,photo:FALLBACKS[0],ingredients:['600g kipdijfilet','Ketjap','Knoflook','Gember','Citroen','Pindakaas','Kokosmelk','Sambal'],steps:['Marineer kip.','Rijg aan stokjes.','Grill of bak gaar.','Maak pindasaus.','Serveer met rijst of lontong.'],notes:'Ook goed op de BBQ.'},
    {name:'Bami goreng speciaal',cat:'Diner',persons:4,time:40,photo:IMG+'photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=1200&q=85',ingredients:['400g mie','300g kip','2 eieren','Prei','Wortel','Knoflook','Ketjap','Sambal'],steps:['Kook mie kort.','Bak kip met knoflook.','Voeg groenten toe.','Schep mie en ketjap erdoor.','Serveer met ei.'],notes:'Familie favoriet.'},
    {name:'Ajam smoor',cat:'Diner',persons:4,time:65,photo:FALLBACKS[4],ingredients:['700g kip','2 uien','Knoflook','Ketjap manis','Nootmuskaat','Kruidnagel','Bouillon','Aardappelen'],steps:['Bak kip bruin.','Fruit ui en knoflook.','Voeg ketjap en kruiden toe.','Stoof kip zacht gaar.'],notes:'Lekker met rijst en boontjes.'},
    {name:'Soto ayam',cat:'Diner',persons:4,time:80,photo:FALLBACKS[5],ingredients:['Kip','Rijstvermicelli','Eieren','Taugé','Kurkuma','Citroengras','Limoenblad','Selderij'],steps:['Trek kippenbouillon.','Maak kruidige basis.','Pluk kip.','Vul kommen met toppings.','Schenk bouillon erover.'],notes:'Fris met limoen.'},
    {name:'Kapsalon kip döner',cat:'Diner',persons:4,time:45,photo:FALLBACKS[0],ingredients:['600g kipdijfilet','Friet','IJsbergsla','Tomaat','Komkommer','Knoflooksaus','Sambal','Geraspte kaas'],steps:['Kruid en bak kip.','Bak friet krokant.','Bouw laag friet, kip en kaas.','Gratineer kort.','Top met salade en sauzen.'],notes:'Weekend comfort food.'},
    {name:'Iskender kebab',cat:'Diner',persons:4,time:60,photo:FALLBACKS[0],ingredients:['500g döner of lamsvlees','Turks brood','Tomatensaus','Yoghurt','Boter','Paprika','Tomaat'],steps:['Bak vlees krokant.','Snijd brood in blokjes.','Warm tomatensaus.','Leg vlees op brood.','Serveer met yoghurt en boter.'],notes:'Maak af met gesmolten paprikaboter.'},
    {name:'Mercimek çorbası',cat:'Diner',persons:4,time:40,photo:FALLBACKS[5],ingredients:['250g rode linzen','1 ui','1 wortel','Tomatenpuree','Komijn','Paprikapoeder','Bouillon','Citroen'],steps:['Fruit ui en wortel.','Voeg linzen, puree en kruiden toe.','Kook zacht.','Blend glad.','Serveer met citroen.'],notes:'Turkse linzensoep.'},
    {name:'Dolma met rijst en gehakt',cat:'Diner',persons:4,time:90,photo:FALLBACKS[3],ingredients:['Druivenbladeren of paprika','300g gehakt','200g rijst','Ui','Tomatenpuree','Peterselie','Munt','Bouillon'],steps:['Maak rijst-gehaktvulling.','Vul bladeren of paprika.','Leg strak in pan.','Stoof met bouillon gaar.'],notes:'Lekker met yoghurt.'},
    {name:'Lahmacun met salade',cat:'Diner',persons:4,time:70,photo:IMG+'photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=1200&q=85',ingredients:['Lahmacun deeg','350g gehakt','Ui','Tomaat','Paprika','Peterselie','Komijn','Citroen','Salade'],steps:['Maak gehaktmengsel.','Smeer dun op deeg.','Bak heet en kort.','Vul met salade en citroen.'],notes:'Rol op als wrap.'},
    {name:'Pide met kaas en sucuk',cat:'Diner',persons:4,time:65,photo:FALLBACKS[2],ingredients:['Pide deeg','Sucuk','Mozzarella','Feta','Ei','Peterselie','Boter'],steps:['Rol deeg ovaal.','Vul met kaas en sucuk.','Vouw randen dicht.','Bak goudbruin.','Bestrijk met boter.'],notes:'Warm serveren.'},
    {name:'Lasagne bolognese',cat:'Diner',persons:6,time:95,photo:IMG+'photo-1619895092538-128341789043?auto=format&fit=crop&w=1200&q=85',ingredients:['Lasagnebladen','600g gehakt','Passata','Ui','Wortel','Bleekselderij','Béchamel','Parmezaan','Mozzarella'],steps:['Maak bolognesesaus.','Maak of verwarm béchamel.','Bouw lagen.','Bak 40 minuten.','Laat 10 minuten rusten.'],notes:'Perfect voor meal prep.'},
    {name:'Gnocchi alla sorrentina',cat:'Diner',persons:4,time:40,photo:IMG+'photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=1200&q=85',ingredients:['500g gnocchi','Tomatensaus','Mozzarella','Parmezaan','Basilicum','Knoflook','Olijfolie'],steps:['Kook gnocchi kort.','Maak tomatensaus.','Meng gnocchi met saus.','Doe in schaal met kaas.','Gratineer goudbruin.'],notes:'Romige kaaslaag.'},
    {name:'Pasta pesto kip',cat:'Diner',persons:4,time:30,photo:IMG+'photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=1200&q=85',ingredients:['400g pasta','400g kipfilet','Groene pesto','Cherry tomaten','Parmezaan','Rucola','Pijnboompitten'],steps:['Kook pasta.','Bak kip gaar.','Meng met pesto en tomaat.','Serveer met rucola en kaas.'],notes:'Snel doordeweeks diner.'},
    {name:'Minestrone maaltijdsoep',cat:'Diner',persons:4,time:50,photo:FALLBACKS[5],ingredients:['Ui','Wortel','Bleekselderij','Courgette','Tomatenblokjes','Witte bonen','Pasta','Bouillon','Parmezaan'],steps:['Fruit groenten.','Voeg tomaat en bouillon toe.','Kook pasta mee.','Voeg bonen toe.','Serveer met Parmezaan.'],notes:'Goed met restgroenten.'},
    {name:'Melanzane alla parmigiana',cat:'Diner',persons:4,time:80,photo:IMG+'photo-1625944525533-473f1a3d54e7?auto=format&fit=crop&w=1200&q=85',ingredients:['3 aubergines','Tomatensaus','Mozzarella','Parmezaan','Basilicum','Olijfolie','Zout'],steps:['Rooster aubergine.','Maak tomatensaus.','Bouw lagen met kaas.','Bak in oven.','Laat rusten.'],notes:'Vegetarische comfort food.'},
    {name:'Kip cacciatore',cat:'Diner',persons:4,time:75,photo:FALLBACKS[4],ingredients:['700g kip','Paprika','Champignons','Ui','Knoflook','Tomaten','Olijven','Italiaanse kruiden'],steps:['Bak kip bruin.','Fruit groenten.','Voeg tomaten en kruiden toe.','Stoof kip gaar.'],notes:'Lekker met pasta of brood.'},
    {name:'Hutspot met gehaktbal',cat:'Diner',persons:4,time:55,photo:IMG+'photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1200&q=85',ingredients:['1kg aardappelen','700g wortel','500g ui','500g gehakt','Ei','Paneermeel','Melk','Boter','Jus'],steps:['Kook aardappel, wortel en ui.','Maak gehaktballen.','Stamp hutspot.','Serveer met jus.'],notes:'Nederlandse klassieker.'},
    {name:'Erwtensoep met rookworst',cat:'Diner',persons:6,time:120,photo:FALLBACKS[5],ingredients:['500g spliterwten','Rookworst','Prei','Wortel','Knolselderij','Ui','Laurier','Selderij'],steps:['Kook spliterwten met laurier.','Voeg groenten toe.','Laat dik worden.','Voeg rookworst toe.'],notes:'Volgende dag nog dikker.'},
    {name:'Appeltaart klassiek',cat:'Bakken',persons:10,time:90,photo:IMG+'photo-1621743478914-cc8a86d7e9f2?auto=format&fit=crop&w=1200&q=85',ingredients:['300g bloem','200g boter','150g suiker','1 ei','1kg appels','Rozijnen','Kaneel','Paneermeel'],steps:['Maak deeg.','Bekleed vorm.','Meng appelvulling.','Vul taart.','Bak goudbruin.'],notes:'Laat afkoelen voor mooie punten.'},
    {name:'Pannenkoeken met spek',cat:'Diner',persons:4,time:35,photo:IMG+'photo-1528207776546-365bb710ee93?auto=format&fit=crop&w=1200&q=85',ingredients:['250g bloem','2 eieren','500ml melk','Snuf zout','Spek','Boter','Stroop'],steps:['Maak beslag.','Bak spek.','Giet beslag erover.','Bak beide kanten goudbruin.'],notes:'Zoet of hartig.'},
    {name:'Shawarma wraps',cat:'Diner',persons:4,time:35,photo:FALLBACKS[0],ingredients:['600g kip of varkensvlees','Wraps','IJsbergsla','Tomaat','Komkommer','Knoflooksaus','Shawarmakruiden'],steps:['Kruid en bak vlees.','Warm wraps.','Vul met salade en saus.','Rol strak op.'],notes:'Snel weekendgerecht.'},
    {name:'Loaded nachos uit de oven',cat:'Snack',persons:4,time:25,photo:FALLBACKS[2],ingredients:['Tortillachips','Geraspte kaas','Bonen','Mais','Tomaat','Jalapeño','Zure room','Guacamole'],steps:['Verdeel chips in schaal.','Top met kaas en bonen.','Bak tot kaas smelt.','Maak af met toppings.'],notes:'Voor filmavond.'}
  ];

  function recipes(){ return Array.isArray(window.recipesData) ? window.recipesData : (typeof recipesData !== 'undefined' ? recipesData : []); }
  function setRecipes(next){ window.recipesData = next; try { recipesData = next; } catch(e) {} }
  function n(v){ return String(v||'').toLowerCase().trim(); }
  function nextId(){ var arr = recipes(); var max = Math.max.apply(null, arr.map(function(r){return Number(r.id)||0;}).concat([0])); window.recipeNextId = max + 1; try { recipeNextId = max + 1; } catch(e) {} return max + 1; }

  function normalizeList(value){
    if(Array.isArray(value)) return value.map(function(x){ return String(x || '').trim(); }).filter(Boolean);
    if(value == null) return [];
    return String(value)
      .split(/\n|\r|;|\u2022|\s\-\s/g)
      .map(function(x){ return x.trim(); })
      .filter(Boolean);
  }

  function normalizeAll(){
    var arr = recipes();
    arr.forEach(function(r){
      if(!r) return;
      r.ingredients = normalizeList(r.ingredients);
      r.steps = normalizeList(r.steps);
      if(!r.photo) r.photo = FALLBACKS[(Number(r.id)||0) % FALLBACKS.length];
    });
    setRecipes(arr);
  }

  function seedMore(){
    normalizeAll();
    var arr = recipes();
    var existing = {};
    arr.forEach(function(r){ existing[n(r.name)] = true; });
    var id = nextId();
    EXTRA_MORE.forEach(function(item){
      if(existing[n(item.name)]) return;
      var copy = JSON.parse(JSON.stringify(item));
      copy.id = id++;
      copy.seeded = true;
      copy.version = VERSION;
      copy.ingredients = normalizeList(copy.ingredients);
      copy.steps = normalizeList(copy.steps);
      arr.push(copy);
      existing[n(copy.name)] = true;
    });
    setRecipes(arr);
    try { recipeNextId = id; } catch(e) {}
  }

  function wrapDetail(){
    if(typeof window.openRecipeDetail !== 'function' || window.openRecipeDetail.__ingredientSeedBoosterWrapped) return;
    var original = window.openRecipeDetail;
    window.openRecipeDetail = function(id){
      normalizeAll();
      return original.apply(this, arguments);
    };
    window.openRecipeDetail.__ingredientSeedBoosterWrapped = true;
    try { openRecipeDetail = window.openRecipeDetail; } catch(e) {}
  }

  function boot(){
    seedMore();
    wrapDetail();
    if(window.RecipeDirectStablePatch && typeof window.RecipeDirectStablePatch.patch === 'function'){
      window.RecipeDirectStablePatch.patch();
    } else if(typeof window.renderRecipeGrid === 'function') {
      window.renderRecipeGrid();
    }
    [250,900,1800,3200].forEach(function(delay){ setTimeout(function(){ seedMore(); wrapDetail(); if(window.RecipeDirectStablePatch && typeof window.RecipeDirectStablePatch.patch === 'function') window.RecipeDirectStablePatch.patch(); }, delay); });
  }

  window.RecipeIngredientCheckboxSeedBooster = { version:VERSION, boot:boot, normalizeAll:normalizeAll, seedMore:seedMore };
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
