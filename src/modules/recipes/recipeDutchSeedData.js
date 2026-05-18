'use strict';
// ============================================================
// RECIPE DUTCH SEED DATA v0.364
// Adds Dutch household classics with hero images.
// Seed-only: does not overwrite user-created recipes.
// ============================================================

(function(){
  var VERSION = '0.364';
  var STORAGE_KEY = 'familyapp_food_recipes_v001';
  var SEEDED_KEY = 'familyapp_seeded_dutch_recipes_v001';
  var IMAGE_BASE = 'https://images.unsplash.com/';

  var RECIPES = [
    {
      name:'Boerenkool stamppot met rookworst', cat:'Diner', persons:4, time:40, emoji:'🥬', cuisine:'Nederlands',
      photo:IMAGE_BASE+'photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1200&q=85',
      ingredients:['1kg kruimige aardappelen','500g gesneden boerenkool','1 rookworst','150ml melk','40g boter','Mosterd','Zout, peper en nootmuskaat'],
      steps:['Schil aardappelen en kook ze met boerenkool in 20 minuten gaar.','Warm de rookworst volgens verpakking.','Giet af en stamp met melk en boter.','Breng op smaak met zout, peper en nootmuskaat.','Serveer met rookworst en mosterd.'],
      notes:'Extra lekker met uitgebakken spekjes.'
    },
    {
      name:'Hutspot met hachee', cat:'Diner', persons:4, time:150, emoji:'🥕', cuisine:'Nederlands',
      photo:IMAGE_BASE+'photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=1200&q=85',
      ingredients:['1kg aardappelen','700g winterpeen','500g uien','600g riblappen','2 laurierblaadjes','2 kruidnagels','500ml runderbouillon','2 el bloem','Boter','Zout en peper'],
      steps:['Bak riblappen rondom bruin in boter.','Voeg uien, bloem, bouillon, laurier en kruidnagel toe.','Laat 2 uur zacht stoven.','Kook aardappelen, wortel en ui gaar.','Stamp tot hutspot en serveer met hachee.'],
      notes:'Maak hachee een dag vooraf voor extra smaak.'
    },
    {
      name:'Erwtensoep snert', cat:'Diner', persons:6, time:120, emoji:'🥣', cuisine:'Nederlands',
      photo:IMAGE_BASE+'photo-1547592180-85f173990554?auto=format&fit=crop&w=1200&q=85',
      ingredients:['500g spliterwten','1 prei','1 winterpeen','1 knolselderij','2 uien','1 rookworst','300g speklap of krabbetjes','2 laurierblaadjes','Selderij','Zout en peper'],
      steps:['Spoel spliterwten en kook met vlees en laurier.','Schep schuim af en laat zacht koken.','Voeg gesneden groenten toe en kook tot alles zacht is.','Haal vlees eruit, snijd klein en doe terug.','Voeg rookworst toe en breng op smaak.'],
      notes:'Snert hoort dik te zijn; de volgende dag is hij vaak nog beter.'
    },
    {
      name:'Zuurkool stamppot met spek', cat:'Diner', persons:4, time:45, emoji:'🥔', cuisine:'Nederlands',
      photo:IMAGE_BASE+'photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=1200&q=85',
      ingredients:['1kg aardappelen','500g zuurkool','200g spekblokjes','1 rookworst','150ml melk','40g boter','Mosterd','Peper'],
      steps:['Kook aardappelen gaar.','Warm zuurkool apart of kook kort mee.','Bak spekblokjes krokant.','Stamp aardappelen met melk en boter.','Meng zuurkool en spek erdoor en serveer met rookworst.'],
      notes:'Ook lekker met appelblokjes erdoor.'
    },
    {
      name:'Andijviestamppot met gehaktbal', cat:'Diner', persons:4, time:40, emoji:'🥬', cuisine:'Nederlands',
      photo:IMAGE_BASE+'photo-1543339308-43e59d6b73a6?auto=format&fit=crop&w=1200&q=85',
      ingredients:['1kg aardappelen','400g rauwe andijvie','500g gehakt','1 ei','Paneermeel','150ml melk','Boter','Jus','Zout, peper en nootmuskaat'],
      steps:['Maak gehaktballen met ei, paneermeel, zout en peper.','Bak de gehaktballen bruin en gaar.','Kook aardappelen gaar en stamp met melk en boter.','Schep rauwe andijvie door de hete puree.','Serveer met gehaktbal en jus.'],
      notes:'Rauwe andijvie geeft een frisse bite.'
    },
    {
      name:'Pannenkoeken', cat:'Diner', persons:4, time:35, emoji:'🥞', cuisine:'Nederlands',
      photo:IMAGE_BASE+'photo-1528207776546-365bb710ee93?auto=format&fit=crop&w=1200&q=85',
      ingredients:['250g bloem','2 eieren','500ml melk','Snuf zout','Boter om te bakken','Stroop','Poedersuiker','Spek of appel optioneel'],
      steps:['Klop bloem, eieren, melk en zout tot een glad beslag.','Laat eventueel 10 minuten rusten.','Verhit boter in een koekenpan.','Bak dunne pannenkoeken aan beide kanten goudbruin.','Serveer met stroop, suiker of hartige toppings.'],
      notes:'Ideaal als snelle gezinsmaaltijd.'
    },
    {
      name:'Hollandse macaroni met gehakt', cat:'Diner', persons:4, time:35, emoji:'🍝', cuisine:'Nederlands',
      photo:IMAGE_BASE+'photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=1200&q=85',
      ingredients:['400g macaroni','400g gehakt','1 ui','2 paprika’s','1 courgette optioneel','400g tomatenblokjes','2 el tomatenpuree','Italiaanse kruiden','Geraspte kaas'],
      steps:['Kook macaroni volgens verpakking.','Bak gehakt rul met ui.','Voeg paprika en eventueel courgette toe.','Roer tomatenpuree, tomatenblokjes en kruiden erdoor.','Meng met macaroni en serveer met kaas.'],
      notes:'Kindvriendelijke klassieker.'
    },
    {
      name:'Uitsmijter ham kaas', cat:'Lunch', persons:1, time:12, emoji:'🍳', cuisine:'Nederlands',
      photo:IMAGE_BASE+'photo-1525351484163-7529414344d8?auto=format&fit=crop&w=1200&q=85',
      ingredients:['2 sneetjes brood','2 eieren','2 plakken ham','2 plakken kaas','Boter','Zout en peper'],
      steps:['Rooster of bak brood licht.','Bak eieren in boter als spiegelei.','Leg ham en kaas op het brood.','Leg eieren erbovenop.','Breng op smaak met zout en peper.'],
      notes:'Lekker met tomaat of augurk erbij.'
    },
    {
      name:'Tosti ham kaas', cat:'Lunch', persons:1, time:10, emoji:'🥪', cuisine:'Nederlands',
      photo:IMAGE_BASE+'photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=1200&q=85',
      ingredients:['2 sneetjes brood','1 plak ham','1-2 plakken kaas','Boter optioneel','Ketchup of curry'],
      steps:['Beleg brood met ham en kaas.','Bak in tosti-ijzer of pan tot goudbruin.','Snijd diagonaal door.','Serveer met ketchup of curry.'],
      notes:'Snel en ideaal voor lunch.'
    },
    {
      name:'Appeltaart', cat:'Bakken', persons:10, time:90, emoji:'🥧', cuisine:'Nederlands',
      photo:IMAGE_BASE+'photo-1621743478914-cc8a86d7e9f2?auto=format&fit=crop&w=1200&q=85',
      ingredients:['300g bloem','200g boter','150g suiker','1 ei','1kg appels','75g rozijnen','2 tl kaneel','Paneermeel','Snuf zout'],
      steps:['Maak deeg van bloem, boter, suiker, ei en zout.','Bekleed een springvorm met deeg.','Meng appel met rozijnen, kaneel en wat suiker.','Strooi paneermeel op de bodem en vul met appel.','Maak een raster van deeg en bak 60 minuten op 175°C.'],
      notes:'Laat afkoelen voor mooie punten.'
    },
    {
      name:'Wentelteefjes', cat:'Ontbijt', persons:2, time:15, emoji:'🍞', cuisine:'Nederlands',
      photo:IMAGE_BASE+'photo-1484723091739-30a097e8f929?auto=format&fit=crop&w=1200&q=85',
      ingredients:['4 sneetjes oud brood','2 eieren','200ml melk','1 tl kaneel','1 el suiker','Boter','Poedersuiker of stroop'],
      steps:['Klop eieren met melk, kaneel en suiker.','Week brood kort in het mengsel.','Bak in boter aan beide kanten goudbruin.','Serveer met poedersuiker of stroop.'],
      notes:'Perfect om oud brood op te maken.'
    },
    {
      name:'Poffertjes', cat:'Dessert', persons:4, time:35, emoji:'🥞', cuisine:'Nederlands',
      photo:IMAGE_BASE+'photo-1554520735-0a6b8b6ce8b7?auto=format&fit=crop&w=1200&q=85',
      ingredients:['250g bloem','7g gist','300ml melk','1 ei','Snuf zout','Boter','Poedersuiker'],
      steps:['Meng bloem, gist, melk, ei en zout tot beslag.','Laat 30 minuten rijzen.','Vet poffertjespan in met boter.','Bak kleine poffertjes en draai ze om zodra de bovenkant stolt.','Serveer met boter en poedersuiker.'],
      notes:'Leuk weekendgerecht met kinderen.'
    }
  ];

  function normalizeName(name){ return String(name || '').trim().toLowerCase(); }

  function ensureRecipes(){
    if(!Array.isArray(window.recipesData)) window.recipesData = [];
    window.recipeNextId = Math.max.apply(null, window.recipesData.map(function(r){ return Number(r.id) || 0; }).concat([0])) + 1;
  }

  function persist(){
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(window.recipesData || [])); } catch(e) {}
    if(window.HouseholdRepository && typeof window.HouseholdRepository.write === 'function'){
      window.HouseholdRepository.write('recipes', window.recipesData || [], { source:'recipeDutchSeedData', operation:'seedDutchRecipes', version:VERSION });
    }
    try { window.dispatchEvent(new CustomEvent('familyapp:food:recipes-updated', { detail:{ recipes:window.recipesData || [], version:VERSION } })); } catch(e) {}
  }

  function seed(force){
    ensureRecipes();
    var existing = {};
    window.recipesData.forEach(function(r){ existing[normalizeName(r.name)] = true; });
    var added = 0;
    RECIPES.forEach(function(seedRecipe){
      var key = normalizeName(seedRecipe.name);
      if(!force && existing[key]) return;
      var copy = JSON.parse(JSON.stringify(seedRecipe));
      copy.id = window.recipeNextId++;
      copy.seeded = true;
      copy.version = VERSION;
      window.recipesData.push(copy);
      existing[key] = true;
      added++;
    });
    if(added){
      persist();
      try { localStorage.setItem(SEEDED_KEY, VERSION); } catch(e) {}
      if(typeof window.renderRecipes === 'function') window.renderRecipes();
      if(typeof window.showToast === 'function') window.showToast(added+' Nederlandse recepten toegevoegd ✓');
    }
    return added;
  }

  function boot(){
    ensureRecipes();
    var seeded = null;
    try { seeded = localStorage.getItem(SEEDED_KEY); } catch(e) {}
    if(seeded !== VERSION) seed(false);
  }

  window.RecipeDutchSeedData = { version:VERSION, seed:seed, recipes:RECIPES };
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
