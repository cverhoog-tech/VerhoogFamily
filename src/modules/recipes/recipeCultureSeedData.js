'use strict';
// ============================================================
// RECIPE CULTURE SEED DATA v0.363
// Adds curated Surinamese, Indonesian and Turkish recipe seeds with images.
// Seed-only: does not overwrite user-created recipes.
// ============================================================

(function(){
  var VERSION = '0.363';
  var STORAGE_KEY = 'familyapp_food_recipes_v001';
  var SEEDED_KEY = 'familyapp_seeded_culture_recipes_v001';

  var IMAGE_BASE = 'https://images.unsplash.com/';

  var RECIPES = [
    // SURINAME
    {
      name:'Surinaamse roti met kip masala', cat:'Diner', persons:4, time:75, emoji:'🍛', cuisine:'Surinaams',
      photo:IMAGE_BASE+'photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=1200&q=85',
      ingredients:['4 rotiplaten','600g kipdijfilet','600g aardappelen','400g kousenband of sperziebonen','4 eieren','2 uien','3 teentjes knoflook','2 el masala','1 tl komijn','1 bouillonblokje','Madame Jeanette naar smaak','Olie, zout en peper'],
      steps:['Kook de eieren hard en halveer ze.','Bak ui en knoflook glazig in olie.','Voeg kip, masala en komijn toe en bak rondom aan.','Voeg aardappelblokjes, bouillon en water toe en laat gaar stoven.','Kook of roerbak kousenband kort met zout.','Warm de rotiplaten op en serveer met kip, aardappel, ei en groenten.'],
      notes:'Mild houden voor kinderen; sambal of Madame Jeanette apart serveren.'
    },
    {
      name:'Pom met kip', cat:'Diner', persons:6, time:110, emoji:'🥘', cuisine:'Surinaams',
      photo:IMAGE_BASE+'photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=85',
      ingredients:['1kg pomtayer of pommix','700g kip','2 uien','3 teentjes knoflook','2 tomaten','2 el tomatenpuree','Sap van 1 sinaasappel','Sap van 1 citroen','2 el suiker','Bouillonblokje','Olie, zout, peper'],
      steps:['Marineer de kip met knoflook, peper en zout.','Bak kip bruin met ui, tomaat en tomatenpuree.','Meng pomtayer met citrus, suiker en een deel van de jus.','Doe laag pom, kip en weer pom in een ovenschaal.','Bak 75 tot 90 minuten op 180°C tot goudbruin.'],
      notes:'Lekker met rijst, zuurgoed en komkommer.'
    },
    {
      name:'Saoto soep', cat:'Diner', persons:4, time:80, emoji:'🍲', cuisine:'Surinaams',
      photo:IMAGE_BASE+'photo-1547592166-23ac45744acd?auto=format&fit=crop&w=1200&q=85',
      ingredients:['1 hele kip of 600g kipdelen','2 liter water','1 ui','3 teentjes knoflook','1 stuk laos','2 salambladeren','Bouillonblokjes','Taugé','Gekookte eieren','Gebakken uitjes','Gebakken aardappelsticks','Rijst','Selderij'],
      steps:['Trek bouillon van kip, ui, knoflook, laos en salam.','Haal de kip eruit, pluk het vlees en breng de bouillon op smaak.','Kook rijst en eieren apart.','Vul kommen met rijst, kip, taugé, ei en aardappelsticks.','Schenk hete bouillon erover en garneer met selderij en uitjes.'],
      notes:'Serveer sambal ketjap apart.'
    },
    {
      name:'Bara met chutney', cat:'Snack', persons:6, time:90, emoji:'🫓', cuisine:'Surinaams',
      photo:IMAGE_BASE+'photo-1601050690597-df0568f70950?auto=format&fit=crop&w=1200&q=85',
      ingredients:['400g bloem','100g gele spliterwtenmeel','7g gist','250ml lauwwarm water','2 teentjes knoflook','1 tl komijn','1 tl masala','Spinazie of tajerblad fijngesneden','Zout','Olie om te frituren','Mango chutney'],
      steps:['Meng bloem, erwtenmeel, gist, kruiden en zout.','Voeg water toe en kneed tot een zacht deeg.','Meng spinazie erdoor en laat 45 minuten rijzen.','Vorm platte ringen met natte handen.','Frituur goudbruin en serveer met chutney.'],
      notes:'Maak ze kleiner als borrelhapje.'
    },
    {
      name:'Nasi Surinaams met kip', cat:'Diner', persons:4, time:45, emoji:'🍚', cuisine:'Surinaams',
      photo:IMAGE_BASE+'photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=1200&q=85',
      ingredients:['400g gekookte rijst','400g kipfilet','2 eieren','1 ui','2 teentjes knoflook','2 el ketjap manis','1 el sojasaus','1 tl trassi optioneel','Selderij','Komkommerzuur','Olie'],
      steps:['Gebruik koude gekookte rijst voor het beste resultaat.','Bak kip met ui en knoflook.','Schuif opzij en roerbak de eieren.','Voeg rijst, ketjap en sojasaus toe.','Bak alles goed droog en garneer met selderij.'],
      notes:'Lekker met gebakken banaan en zuur.'
    },
    {
      name:'Surinaamse bami', cat:'Diner', persons:4, time:40, emoji:'🍜', cuisine:'Surinaams',
      photo:IMAGE_BASE+'photo-1552611052-33e04de081de?auto=format&fit=crop&w=1200&q=85',
      ingredients:['400g spaghetti','400g kip','1 ui','3 teentjes knoflook','3 el ketjap manis','1 el sojasaus','1 tl five spice','Selderij','Komkommerzuur','Olie'],
      steps:['Kook spaghetti net gaar en spoel kort af.','Bak kip met ui en knoflook.','Voeg ketjap, sojasaus en five spice toe.','Schep spaghetti erdoor en bak tot alles goed gemengd is.','Garneer met selderij.'],
      notes:'Gebruik spaghetti voor de herkenbare Surinaamse bami-structuur.'
    },

    // INDONESIA
    {
      name:'Nasi goreng kampung', cat:'Diner', persons:4, time:35, emoji:'🍚', cuisine:'Indonesisch',
      photo:IMAGE_BASE+'photo-1512058564366-18510be2db19?auto=format&fit=crop&w=1200&q=85',
      ingredients:['500g koude rijst','3 eieren','250g kip of garnalen','2 sjalotten','3 teentjes knoflook','2 el ketjap manis','1 el sambal','1 tl trassi optioneel','Bosui','Komkommer','Kroepoek'],
      steps:['Bak sjalot, knoflook, sambal en trassi kort.','Voeg kip of garnalen toe en bak gaar.','Voeg rijst toe en roerbak op hoog vuur.','Breng op smaak met ketjap.','Bak eieren apart of roer ze door de rijst.','Serveer met komkommer en kroepoek.'],
      notes:'Koude rijst van de vorige dag werkt het beste.'
    },
    {
      name:'Rendang daging', cat:'Diner', persons:6, time:180, emoji:'🥩', cuisine:'Indonesisch',
      photo:IMAGE_BASE+'photo-1625944525533-473f1a3d54e7?auto=format&fit=crop&w=1200&q=85',
      ingredients:['1kg runderriblappen','400ml kokosmelk','2 stengels citroengras','4 limoenblaadjes','2 uien','4 teentjes knoflook','3 cm gember','3 cm laos','2 tl koriander','1 tl komijn','2 rode pepers','Zout'],
      steps:['Maak een boemboe van ui, knoflook, gember, laos, kruiden en peper.','Bak de boemboe tot geurig.','Voeg rundvlees toe en bak rondom aan.','Voeg kokosmelk, citroengras en limoenblad toe.','Laat 2,5 tot 3 uur zacht stoven tot de saus dik en donker is.'],
      notes:'Rendang wordt vaak beter na een nacht rusten.'
    },
    {
      name:'Gado gado', cat:'Lunch', persons:4, time:35, emoji:'🥗', cuisine:'Indonesisch',
      photo:IMAGE_BASE+'photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1200&q=85',
      ingredients:['300g sperziebonen','300g aardappelen','200g taugé','1 komkommer','4 eieren','Tofu of tempeh','Kroepoek','Gebakken uitjes','Pindasaus'],
      steps:['Kook aardappelen, boontjes en eieren.','Bak tofu of tempeh goudbruin.','Schik groenten, ei en tofu op een schaal.','Warm pindasaus op en schenk erover.','Garneer met uitjes en kroepoek.'],
      notes:'Kan lauwwarm of koud gegeten worden.'
    },
    {
      name:'Sate ayam met pindasaus', cat:'Diner', persons:4, time:50, emoji:'🍢', cuisine:'Indonesisch',
      photo:IMAGE_BASE+'photo-1529563021893-cc83c992d75d?auto=format&fit=crop&w=1200&q=85',
      ingredients:['600g kipdijfilet','3 el ketjap manis','2 teentjes knoflook','1 tl koriander','1 el limoensap','Satéstokjes','200ml pindasaus','Komkommer','Gebakken uitjes'],
      steps:['Snijd kip in blokjes en marineer met ketjap, knoflook, koriander en limoen.','Rijg aan stokjes.','Grill of bak tot gaar en licht gekarameliseerd.','Serveer met warme pindasaus, komkommer en uitjes.'],
      notes:'Week houten stokjes vooraf in water.'
    },
    {
      name:'Soto ayam', cat:'Diner', persons:4, time:75, emoji:'🍲', cuisine:'Indonesisch',
      photo:IMAGE_BASE+'photo-1617093727343-374698b1b08d?auto=format&fit=crop&w=1200&q=85',
      ingredients:['600g kip','1,5 liter kippenbouillon','2 stengels citroengras','3 limoenblaadjes','2 teentjes knoflook','2 cm gember','1 tl kurkuma','Glasnoedels','Taugé','Gekookte eieren','Limoen','Selderij'],
      steps:['Trek bouillon met kip, citroengras en limoenblad.','Maak boemboe van knoflook, gember en kurkuma en bak kort.','Voeg boemboe toe aan de bouillon.','Pluk kip en bereid noedels.','Serveer met taugé, ei, limoen en selderij.'],
      notes:'Fris maken met extra limoen vlak voor serveren.'
    },
    {
      name:'Tempeh orek', cat:'Diner', persons:4, time:30, emoji:'🌱', cuisine:'Indonesisch',
      photo:IMAGE_BASE+'photo-1604909052743-94e838986d24?auto=format&fit=crop&w=1200&q=85',
      ingredients:['400g tempeh','2 sjalotten','2 teentjes knoflook','2 el ketjap manis','1 el tamarinde of limoensap','1 rode peper','1 tl palmsuiker','Olie','Zout'],
      steps:['Snijd tempeh in reepjes en bak krokant.','Fruit sjalot, knoflook en peper.','Voeg ketjap, tamarinde en palmsuiker toe.','Schep tempeh erdoor tot glanzend en sticky.'],
      notes:'Lekker als bijgerecht bij rijsttafel.'
    },

    // TURKEY
    {
      name:'Turkse linzensoep mercimek çorbası', cat:'Lunch', persons:4, time:40, emoji:'🥣', cuisine:'Turks',
      photo:IMAGE_BASE+'photo-1547592180-85f173990554?auto=format&fit=crop&w=1200&q=85',
      ingredients:['250g rode linzen','1 ui','1 wortel','1 aardappel','1 el tomatenpuree','1 tl komijn','1 tl paprikapoeder','1,2 liter bouillon','Citroen','Munt of pul biber','Olijfolie'],
      steps:['Fruit ui in olijfolie.','Voeg wortel, aardappel, linzen en tomatenpuree toe.','Schenk bouillon erbij en kook 25 minuten.','Pureer glad en breng op smaak met komijn en paprika.','Serveer met citroen en munt of pul biber.'],
      notes:'Perfect als lichte lunch of voorgerecht.'
    },
    {
      name:'Köfte met bulgur salade', cat:'Diner', persons:4, time:50, emoji:'🥙', cuisine:'Turks',
      photo:IMAGE_BASE+'photo-1529042410759-befb1204b468?auto=format&fit=crop&w=1200&q=85',
      ingredients:['600g rundergehakt','1 ui geraspt','2 teentjes knoflook','1 ei','Paneermeel','1 tl komijn','1 tl paprikapoeder','Peterselie','250g bulgur','Tomaat','Komkommer','Citroen','Olijfolie'],
      steps:['Meng gehakt met ui, knoflook, ei, kruiden en paneermeel.','Vorm kleine köfte en laat kort rusten.','Kook of week bulgur en meng met tomaat, komkommer, peterselie, citroen en olie.','Bak of grill köfte gaar.','Serveer met yoghurt of knoflooksaus.'],
      notes:'Ook goed voor meal prep.'
    },
    {
      name:'Menemen', cat:'Ontbijt', persons:2, time:20, emoji:'🍳', cuisine:'Turks',
      photo:IMAGE_BASE+'photo-1525351484163-7529414344d8?auto=format&fit=crop&w=1200&q=85',
      ingredients:['4 eieren','3 tomaten','1 groene peper','1 ui optioneel','1 tl pul biber','Peterselie','Olijfolie','Zout en peper','Brood'],
      steps:['Fruit ui en groene peper in olijfolie.','Voeg tomaat toe en laat zacht worden.','Kluts eieren licht en roer door de tomaten.','Laat romig stollen en bestrooi met peterselie.','Serveer direct met brood.'],
      notes:'Niet te droog bakken; menemen hoort zacht en sappig.'
    },
    {
      name:'Lahmacun', cat:'Diner', persons:4, time:70, emoji:'🍕', cuisine:'Turks',
      photo:IMAGE_BASE+'photo-1642784353782-096640cb7028?auto=format&fit=crop&w=1200&q=85',
      ingredients:['4 dunne wraps of zelfgemaakt deeg','300g lams- of rundergehakt','1 ui','1 tomaat','1 rode paprika','2 el tomatenpuree','Peterselie','1 tl komijn','1 tl paprika','Citroen','Sla en ui voor topping'],
      steps:['Hak ui, tomaat, paprika en peterselie fijn.','Meng met gehakt, tomatenpuree en kruiden.','Smeer dun op wraps of deeg.','Bak heet in oven tot krokant.','Serveer met citroen, sla en ui en rol op.'],
      notes:'Snelle versie werkt goed met dunne wraps.'
    },
    {
      name:'Turkse pide met gehakt', cat:'Diner', persons:4, time:90, emoji:'🫓', cuisine:'Turks',
      photo:IMAGE_BASE+'photo-1601050690117-94f5f6fa8bd7?auto=format&fit=crop&w=1200&q=85',
      ingredients:['500g bloem','7g gist','280ml water','1 tl zout','2 el olie','350g gehakt','1 ui','1 paprika','2 el tomatenpuree','Peterselie','Komijn en paprika','Ei om te bestrijken'],
      steps:['Maak deeg van bloem, gist, water, zout en olie en laat rijzen.','Bak gehakt met ui, paprika, tomatenpuree en kruiden.','Verdeel deeg in ovalen en vul met gehakt.','Vouw randen naar binnen en bestrijk met ei.','Bak 15 tot 20 minuten op hoge temperatuur.'],
      notes:'Serveer met yoghurt-knoflooksaus.'
    },
    {
      name:'Imam bayildi', cat:'Diner', persons:4, time:80, emoji:'🍆', cuisine:'Turks',
      photo:IMAGE_BASE+'photo-1625944228741-cf30983ecb78?auto=format&fit=crop&w=1200&q=85',
      ingredients:['4 aubergines','3 uien','4 teentjes knoflook','4 tomaten','Peterselie','1 tl suiker','Olijfolie','Citroen','Zout en peper'],
      steps:['Halveer aubergines en bak of rooster ze zacht.','Fruit ui en knoflook langzaam in olijfolie.','Voeg tomaat, suiker en peterselie toe.','Vul aubergines met het mengsel.','Stoof of bak tot alles zacht en rijk van smaak is.'],
      notes:'Kan warm, lauwwarm of koud worden gegeten.'
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
      window.HouseholdRepository.write('recipes', window.recipesData || [], { source:'recipeCultureSeedData', operation:'seedCultureRecipes', version:VERSION });
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
      if(typeof window.showToast === 'function') window.showToast(added+' recepten toegevoegd ✓');
    }
    return added;
  }

  function boot(){
    ensureRecipes();
    var seeded = null;
    try { seeded = localStorage.getItem(SEEDED_KEY); } catch(e) {}
    if(seeded !== VERSION) seed(false);
  }

  window.RecipeCultureSeedData = { version:VERSION, seed:seed, recipes:RECIPES };
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
