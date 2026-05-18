'use strict';
// ============================================================
// RECIPE SNACK SEED DATA v0.372
// Adds extra family-friendly dinner/snack recipes: pasteitjes, loempia's,
// extra Turkish and Italian dinners. Every recipe has a photo.
// ============================================================

(function(){
  var VERSION = '0.372';
  var STORAGE_KEY = 'familyapp_food_recipes_v001';
  var SEEDED_KEY = 'familyapp_seeded_snack_dinner_recipes_v001';
  var IMG = 'https://images.unsplash.com/';

  var RECIPES = [
    {name:'Surinaamse pasteitjes met kip',cat:'Snack',persons:8,time:55,emoji:'🥟',cuisine:'Surinaams',photo:IMG+'photo-1601050690597-df0568f70950?auto=format&fit=crop&w=1200&q=85',ingredients:['10 plakjes bladerdeeg','350g kipfilet','1 ui','2 teentjes knoflook','150g doperwten en wortel','1 tl kerrie','1 bouillonblokje','1 ei','Peper en zout'],steps:['Kook kip gaar en pluk fijn.','Fruit ui en knoflook met kerrie.','Meng kip, groenten en bouillon erdoor.','Vul bladerdeeg, vouw dicht en bestrijk met ei.','Bak 20 minuten op 200°C goudbruin.'],notes:'Perfect voor feestjes of lunchbox.'},
    {name:'Indische loempia’s met kip',cat:'Snack',persons:6,time:70,emoji:'🌯',cuisine:'Indonesisch',photo:IMG+'photo-1526318896980-cf78c088247c?auto=format&fit=crop&w=1200&q=85',ingredients:['12 loempiavellen','350g kip','200g witte kool','150g wortel','100g taugé','2 teentjes knoflook','1 el ketjap','1 tl sambal','Olie'],steps:['Bak kip met knoflook en sambal.','Voeg kool, wortel en taugé toe en roerbak kort.','Breng op smaak met ketjap.','Laat vulling afkoelen en rol in loempiavellen.','Frituur of airfry krokant.'],notes:'Serveer met chilisaus.'},
    {name:'Turkse sigara böreği',cat:'Snack',persons:6,time:35,emoji:'🧀',cuisine:'Turks',photo:IMG+'photo-1601050690117-94f5f6fa8bd7?auto=format&fit=crop&w=1200&q=85',ingredients:['Yufka vellen','250g feta','Peterselie','1 ei','Peper','Olie om te bakken'],steps:['Meng feta met peterselie, ei en peper.','Snijd yufka in driehoeken.','Leg vulling op elk vel en rol strak op.','Bak in olie goudbruin of airfry krokant.'],notes:'Lekker met yoghurt-knoflookdip.'},
    {name:'Arancini met mozzarella',cat:'Snack',persons:6,time:75,emoji:'🧆',cuisine:'Italiaans',photo:IMG+'photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=1200&q=85',ingredients:['400g risottorijst gekookt','150g mozzarella','2 eieren','Paneermeel','Bloem','Parmezaan','Olie','Tomatensaus'],steps:['Meng koude risotto met Parmezaan.','Vorm ballen met mozzarella in het midden.','Haal door bloem, ei en paneermeel.','Frituur of airfry goudbruin.','Serveer met tomatensaus.'],notes:'Ideaal met restjes risotto.'},
    {name:'Adana kebab met pilav',cat:'Diner',persons:4,time:55,emoji:'🔥',cuisine:'Turks',photo:IMG+'photo-1529042410759-befb1204b468?auto=format&fit=crop&w=1200&q=85',ingredients:['600g lams- of rundergehakt','1 rode peper','1 ui','Peterselie','1 tl komijn','1 tl paprika','Pilavrijst','Yoghurt','Flatbread'],steps:['Meng gehakt met ui, peper, peterselie en kruiden.','Vorm lange kebabs rond spiesen.','Grill of bak stevig bruin en gaar.','Maak pilavrijst.','Serveer met yoghurt en flatbread.'],notes:'Gebruik pul biber voor extra pit.'},
    {name:'Karnıyarık gevulde aubergine',cat:'Diner',persons:4,time:80,emoji:'🍆',cuisine:'Turks',photo:IMG+'photo-1625944228741-cf30983ecb78?auto=format&fit=crop&w=1200&q=85',ingredients:['4 aubergines','400g gehakt','1 ui','2 tomaten','2 groene pepers','2 teentjes knoflook','Tomatenpuree','Peterselie'],steps:['Rooster of bak aubergines zacht.','Bak gehakt met ui, knoflook, tomaat en peper.','Snijd aubergines open en vul met gehakt.','Bak met tomatensaus 25 minuten in oven.'],notes:'Lekker met rijst en yoghurt.'},
    {name:'Manti met yoghurt-knoflooksaus',cat:'Diner',persons:4,time:95,emoji:'🥟',cuisine:'Turks',photo:IMG+'photo-1601050690597-df0568f70950?auto=format&fit=crop&w=1200&q=85',ingredients:['Pastadeeg of wontonvellen','300g gehakt','1 ui','Yoghurt','2 teentjes knoflook','Boter','Paprikapoeder','Munt'],steps:['Meng gehakt met geraspte ui, zout en peper.','Vul kleine deegvierkantjes en vouw dicht.','Kook manti gaar in gezouten water.','Meng yoghurt met knoflook.','Serveer met paprikaboter en munt.'],notes:'Maak kleine porties, dit is vullend.'},
    {name:'Tavuk şiş met bulgur',cat:'Diner',persons:4,time:50,emoji:'🍢',cuisine:'Turks',photo:IMG+'photo-1529563021893-cc83c992d75d?auto=format&fit=crop&w=1200&q=85',ingredients:['600g kipdijfilet','Yoghurt','Citroen','Knoflook','Paprikapoeder','Komijn','Bulgur','Tomaat','Komkommer'],steps:['Marineer kip met yoghurt, citroen, knoflook en kruiden.','Rijg aan spiesen.','Grill of bak gaar.','Maak bulgur salade.','Serveer met frisse salade.'],notes:'Ook goed op de barbecue.'},
    {name:'Spaghetti carbonara',cat:'Diner',persons:4,time:25,emoji:'🍝',cuisine:'Italiaans',photo:IMG+'photo-1612874742237-6526221588e3?auto=format&fit=crop&w=1200&q=85',ingredients:['400g spaghetti','150g pancetta of spek','3 eieren','80g Parmezaan','Zwarte peper','Zout'],steps:['Kook spaghetti al dente.','Bak pancetta krokant.','Klop eieren met kaas en peper.','Meng pasta van het vuur met ei-kaasmengsel.','Voeg pastawater toe tot romig.'],notes:'Geen room nodig.'},
    {name:'Pasta arrabbiata',cat:'Diner',persons:4,time:30,emoji:'🌶️',cuisine:'Italiaans',photo:IMG+'photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=1200&q=85',ingredients:['400g penne','2 blikken tomaten','3 teentjes knoflook','Chilivlokken','Olijfolie','Peterselie','Parmezaan'],steps:['Fruit knoflook en chili in olijfolie.','Voeg tomaten toe en laat inkoken.','Kook penne al dente.','Meng pasta met saus.','Serveer met peterselie en kaas.'],notes:'Simpel, pittig en snel.'},
    {name:'Risotto funghi',cat:'Diner',persons:4,time:45,emoji:'🍄',cuisine:'Italiaans',photo:IMG+'photo-1476124369491-e7addf5db371?auto=format&fit=crop&w=1200&q=85',ingredients:['320g risottorijst','300g paddenstoelen','1 ui','1 glas witte wijn optioneel','1 liter bouillon','Parmezaan','Boter'],steps:['Fruit ui en rijst glazig.','Blus met wijn.','Voeg bouillon beetje bij beetje toe.','Bak paddenstoelen apart.','Roer paddenstoelen, boter en Parmezaan door de risotto.'],notes:'Gebruik gemengde paddenstoelen voor diepte.'},
    {name:'Melanzane alla parmigiana',cat:'Diner',persons:4,time:80,emoji:'🍆',cuisine:'Italiaans',photo:IMG+'photo-1625944525533-473f1a3d54e7?auto=format&fit=crop&w=1200&q=85',ingredients:['3 aubergines','Tomatensaus','Mozzarella','Parmezaan','Basilicum','Olijfolie','Zout'],steps:['Snijd aubergines en rooster of bak ze.','Maak tomatensaus.','Bouw lagen aubergine, saus, mozzarella en Parmezaan.','Bak 35 minuten op 190°C.','Laat even rusten voor serveren.'],notes:'Vegetarische comfort food.'},
    {name:'Pasta al forno',cat:'Diner',persons:6,time:65,emoji:'🧀',cuisine:'Italiaans',photo:IMG+'photo-1621996346565-e3dbc646d9a9?auto=format&fit=crop&w=1200&q=85',ingredients:['500g pasta','500g gehakt','Tomatensaus','Mozzarella','Parmezaan','Ui','Knoflook','Italiaanse kruiden'],steps:['Kook pasta net niet gaar.','Maak gehaktsaus met tomaat.','Meng pasta met saus.','Doe in ovenschaal met mozzarella en Parmezaan.','Bak 25 minuten goudbruin.'],notes:'Goede meal-prep ovenschotel.'}
  ];

  function normalize(name){ return String(name || '').trim().toLowerCase(); }
  function ensureRecipes(){ if(!Array.isArray(window.recipesData)) window.recipesData = []; window.recipeNextId = Math.max.apply(null, window.recipesData.map(function(r){ return Number(r.id)||0; }).concat([0])) + 1; }
  function persist(){
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(window.recipesData || [])); } catch(e) {}
    if(window.HouseholdRepository && typeof window.HouseholdRepository.write === 'function') window.HouseholdRepository.write('recipes', window.recipesData || [], { source:'recipeSnackSeedData', operation:'seedSnackDinnerRecipes', version:VERSION });
    try { window.dispatchEvent(new CustomEvent('familyapp:food:recipes-updated', { detail:{ recipes:window.recipesData || [], version:VERSION } })); } catch(e) {}
  }
  function seed(force){
    ensureRecipes();
    var existing = {};
    window.recipesData.forEach(function(r){ existing[normalize(r.name)] = true; });
    var added = 0;
    RECIPES.forEach(function(seedRecipe){
      var key = normalize(seedRecipe.name);
      if(!force && existing[key]) return;
      var copy = JSON.parse(JSON.stringify(seedRecipe));
      copy.id = window.recipeNextId++;
      copy.seeded = true;
      copy.version = VERSION;
      window.recipesData.push(copy);
      existing[key] = true;
      added++;
    });
    if(added){ persist(); if(typeof window.renderRecipes === 'function') setTimeout(window.renderRecipes, 60); }
    return added;
  }
  function boot(){ var seeded=null; try{seeded=localStorage.getItem(SEEDED_KEY);}catch(e){} if(seeded!==VERSION){ var added=seed(false); if(added){ try{localStorage.setItem(SEEDED_KEY, VERSION);}catch(e){} } } }
  window.RecipeSnackSeedData = { version:VERSION, seed:seed, recipes:RECIPES };
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
