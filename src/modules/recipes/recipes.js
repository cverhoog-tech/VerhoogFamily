'use strict';
// ============================================================
// RECEPTEN MODULE v0.272 — complete refactor
// Één renderer, één search, één checkbox systeem, geen bridges.
// ============================================================

(function () {

  var VERSION = '0.272';
  var STORAGE_KEY = 'familyapp_food_recipes_v001';
  var SEEDED_KEY  = 'familyapp_seeded_all_v0272';

  // ── CONSTANTS ──────────────────────────────────────────────

  var CAT_EMOJIS = { Ontbijt:'🥞', Lunch:'🥗', Diner:'🍽️', Snack:'🍿', Dessert:'🍰', Bakken:'🧁' };

  var FALLBACK_PHOTOS = [
    'https://images.unsplash.com/photo-1529042410759-befb1204b468?auto=format&fit=crop&w=1200&q=85',
    'https://images.unsplash.com/photo-1498579397066-22750a3cb424?auto=format&fit=crop&w=1200&q=85',
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=1200&q=85',
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=85',
    'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=1200&q=85',
    'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=1200&q=85'
  ];

  var IMG = 'https://images.unsplash.com/';

  // ── SEED DATA ──────────────────────────────────────────────

  var SEED_RECIPES = [
    // BASE
    { name:'Lasagne', cat:'Diner', persons:4, time:60, emoji:'🍝', cuisine:'Italiaans',
      photo:IMG+'photo-1621996346565-e3dbc646d9a9?auto=format&fit=crop&w=1200&q=85',
      ingredients:['500g gehakt','2 uien','2 teentjes knoflook','1 blik tomaten (400g)','Lasagne platen','500ml béchamelsaus','100g geraspte kaas','Olijfolie, zout, peper'],
      steps:['Verwarm oven op 180°C.','Bak gehakt met ui en knoflook.','Voeg tomaten toe, 15 min sudderen.','Laag voor laag opbouwen: lasagne, vleessaus, béchamel.','Afsluiten met kaas. 40 min bakken.'],
      notes:'Heerlijk de volgende dag ook!' },
    { name:'Shakshuka', cat:'Ontbijt', persons:2, time:20, emoji:'🍳', cuisine:'Midden-Oosten',
      photo:IMG+'photo-1525351484163-7529414344d8?auto=format&fit=crop&w=1200&q=85',
      ingredients:['4 eieren','1 blik tomaten','1 ui','1 paprika','Komijn, paprikapoeder','Feta (optioneel)'],
      steps:['Bak ui en paprika zacht.','Voeg tomaten en kruiden toe.','Maak kuiltjes en breek eieren erin.','Deksel op pan, 8-10 min laten staan.'],
      notes:'Lekker met knapperig brood' },
    { name:'Bananenbrood', cat:'Bakken', persons:8, time:65, emoji:'🍌', cuisine:'Internationaal',
      photo:IMG+'photo-1493770348161-369560ae357d?auto=format&fit=crop&w=1200&q=85',
      ingredients:['3 rijpe bananen','200g bloem','100g suiker','2 eieren','80g boter','1 tl bakpoeder','Snuf zout'],
      steps:['Verwarm oven op 175°C.','Prak bananen fijn.','Meng alle ingrediënten.','In broodvorm 55 min bakken.'],
      notes:'' },

    // SURINAAMS
    { name:'Surinaamse roti met kip masala', cat:'Diner', persons:4, time:75, emoji:'🍛', cuisine:'Surinaams',
      photo:IMG+'photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=1200&q=85',
      ingredients:['4 rotiplaten','600g kipdijfilet','600g aardappelen','400g kousenband of sperziebonen','4 eieren','2 uien','3 teentjes knoflook','2 el masala','1 tl komijn','1 bouillonblokje','Madame Jeanette naar smaak','Olie, zout en peper'],
      steps:['Kook de eieren hard en halveer ze.','Bak ui en knoflook glazig in olie.','Voeg kip, masala en komijn toe en bak rondom aan.','Voeg aardappelblokjes, bouillon en water toe en laat gaar stoven.','Kook of roerbak kousenband kort met zout.','Warm de rotiplaten op en serveer met kip, aardappel, ei en groenten.'],
      notes:'Mild houden voor kinderen; sambal of Madame Jeanette apart serveren.' },
    { name:'Pom met kip', cat:'Diner', persons:6, time:110, emoji:'🥘', cuisine:'Surinaams',
      photo:IMG+'photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=85',
      ingredients:['1kg pomtayer of pommix','700g kip','2 uien','3 teentjes knoflook','2 tomaten','2 el tomatenpuree','Sap van 1 sinaasappel','Sap van 1 citroen','2 el suiker','Bouillonblokje','Olie, zout, peper'],
      steps:['Marineer de kip met knoflook, peper en zout.','Bak kip bruin met ui, tomaat en tomatenpuree.','Meng pomtayer met citrus, suiker en een deel van de jus.','Doe laag pom, kip en weer pom in een ovenschaal.','Bak 75 tot 90 minuten op 180°C tot goudbruin.'],
      notes:'Lekker met rijst, zuurgoed en komkommer.' },
    { name:'Saoto soep', cat:'Diner', persons:4, time:80, emoji:'🍲', cuisine:'Surinaams',
      photo:IMG+'photo-1547592166-23ac45744acd?auto=format&fit=crop&w=1200&q=85',
      ingredients:['1 hele kip of 600g kipdelen','2 liter water','1 ui','3 teentjes knoflook','1 stuk laos','2 salambladeren','Bouillonblokjes','Taugé','Gekookte eieren','Gebakken uitjes','Gebakken aardappelsticks','Rijst','Selderij'],
      steps:['Trek bouillon van kip, ui, knoflook, laos en salam.','Haal de kip eruit, pluk het vlees en breng de bouillon op smaak.','Kook rijst en eieren apart.','Vul kommen met rijst, kip, taugé, ei en aardappelsticks.','Schenk hete bouillon erover en garneer met selderij en uitjes.'],
      notes:'Serveer sambal ketjap apart.' },
    { name:'Surinaamse pasteitjes met kip', cat:'Snack', persons:8, time:55, emoji:'🥟', cuisine:'Surinaams',
      photo:IMG+'photo-1601050690597-df0568f70950?auto=format&fit=crop&w=1200&q=85',
      ingredients:['10 plakjes bladerdeeg','350g kipfilet','1 ui','2 teentjes knoflook','150g doperwten en wortel','1 tl kerrie','1 bouillonblokje','1 ei','Peper en zout'],
      steps:['Kook kip gaar en pluk fijn.','Fruit ui en knoflook met kerrie.','Meng kip, groenten en bouillon erdoor.','Vul bladerdeeg, vouw dicht en bestrijk met ei.','Bak 20 minuten op 200°C goudbruin.'],
      notes:'Perfect voor feestjes of lunchbox.' },
    { name:'Nasi Surinaams met kip', cat:'Diner', persons:4, time:45, emoji:'🍚', cuisine:'Surinaams',
      photo:IMG+'photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=1200&q=85',
      ingredients:['400g gekookte rijst','400g kipfilet','2 eieren','1 ui','2 teentjes knoflook','2 el ketjap manis','1 el sojasaus','1 tl trassi optioneel','Selderij','Komkommerzuur','Olie'],
      steps:['Gebruik koude gekookte rijst voor het beste resultaat.','Bak kip met ui en knoflook.','Schuif opzij en roerbak de eieren.','Voeg rijst, ketjap en sojasaus toe.','Bak alles goed droog en garneer met selderij.'],
      notes:'Lekker met gebakken banaan en zuur.' },
    { name:'Surinaamse bami', cat:'Diner', persons:4, time:40, emoji:'🍜', cuisine:'Surinaams',
      photo:IMG+'photo-1552611052-33e04de081de?auto=format&fit=crop&w=1200&q=85',
      ingredients:['400g spaghetti','400g kip','1 ui','3 teentjes knoflook','3 el ketjap manis','1 el sojasaus','1 tl five spice','Selderij','Komkommerzuur','Olie'],
      steps:['Kook spaghetti net gaar en spoel kort af.','Bak kip met ui en knoflook.','Voeg ketjap, sojasaus en five spice toe.','Schep spaghetti erdoor en bak tot alles goed gemengd is.','Garneer met selderij.'],
      notes:'Gebruik spaghetti voor de herkenbare Surinaamse bami-structuur.' },
    { name:'Bara met chutney', cat:'Snack', persons:6, time:90, emoji:'🫓', cuisine:'Surinaams',
      photo:IMG+'photo-1601050690597-df0568f70950?auto=format&fit=crop&w=1200&q=85',
      ingredients:['400g bloem','100g gele spliterwtenmeel','7g gist','250ml lauwwarm water','2 teentjes knoflook','1 tl komijn','1 tl masala','Spinazie of tajerblad fijngesneden','Zout','Olie om te frituren','Mango chutney'],
      steps:['Meng bloem, erwtenmeel, gist, kruiden en zout.','Voeg water toe en kneed tot een zacht deeg.','Meng spinazie erdoor en laat 45 minuten rijzen.','Vorm platte ringen met natte handen.','Frituur goudbruin en serveer met chutney.'],
      notes:'Maak ze kleiner als borrelhapje.' },

    // INDONESISCH
    { name:'Nasi goreng kampung', cat:'Diner', persons:4, time:35, emoji:'🍚', cuisine:'Indonesisch',
      photo:IMG+'photo-1512058564366-18510be2db19?auto=format&fit=crop&w=1200&q=85',
      ingredients:['500g koude rijst','3 eieren','250g kip of garnalen','2 sjalotten','3 teentjes knoflook','2 el ketjap manis','1 el sambal','1 tl trassi optioneel','Bosui','Komkommer','Kroepoek'],
      steps:['Bak sjalot, knoflook, sambal en trassi kort.','Voeg kip of garnalen toe en bak gaar.','Voeg rijst toe en roerbak op hoog vuur.','Breng op smaak met ketjap.','Bak eieren apart of roer ze door de rijst.','Serveer met komkommer en kroepoek.'],
      notes:"Koude rijst van de vorige dag werkt het beste." },
    { name:'Rendang daging', cat:'Diner', persons:6, time:180, emoji:'🥩', cuisine:'Indonesisch',
      photo:IMG+'photo-1625944525533-473f1a3d54e7?auto=format&fit=crop&w=1200&q=85',
      ingredients:['1kg runderriblappen','400ml kokosmelk','2 stengels citroengras','4 limoenblaadjes','2 uien','4 teentjes knoflook','3 cm gember','3 cm laos','2 tl koriander','1 tl komijn','2 rode pepers','Zout'],
      steps:['Maak een boemboe van ui, knoflook, gember, laos, kruiden en peper.','Bak de boemboe tot geurig.','Voeg rundvlees toe en bak rondom aan.','Voeg kokosmelk, citroengras en limoenblad toe.','Laat 2,5 tot 3 uur zacht stoven tot de saus dik en donker is.'],
      notes:'Rendang wordt vaak beter na een nacht rusten.' },
    { name:'Gado gado', cat:'Lunch', persons:4, time:35, emoji:'🥗', cuisine:'Indonesisch',
      photo:IMG+'photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1200&q=85',
      ingredients:['300g sperziebonen','300g aardappelen','200g taugé','1 komkommer','4 eieren','Tofu of tempeh','Kroepoek','Gebakken uitjes','Pindasaus'],
      steps:['Kook aardappelen, boontjes en eieren.','Bak tofu of tempeh goudbruin.','Schik groenten, ei en tofu op een schaal.','Warm pindasaus op en schenk erover.','Garneer met uitjes en kroepoek.'],
      notes:'Kan lauwwarm of koud gegeten worden.' },
    { name:'Sate ayam met pindasaus', cat:'Diner', persons:4, time:50, emoji:'🍢', cuisine:'Indonesisch',
      photo:IMG+'photo-1529563021893-cc83c992d75d?auto=format&fit=crop&w=1200&q=85',
      ingredients:['600g kipdijfilet','3 el ketjap manis','2 teentjes knoflook','1 tl koriander','1 el limoensap','Satéstokjes','200ml pindasaus','Komkommer','Gebakken uitjes'],
      steps:['Snijd kip in blokjes en marineer met ketjap, knoflook, koriander en limoen.','Rijg aan stokjes.','Grill of bak tot gaar en licht gekarameliseerd.','Serveer met warme pindasaus, komkommer en uitjes.'],
      notes:'Week houten stokjes vooraf in water.' },
    { name:"Indische loempia's met kip", cat:'Snack', persons:6, time:70, emoji:'🌯', cuisine:'Indonesisch',
      photo:IMG+'photo-1526318896980-cf78c088247c?auto=format&fit=crop&w=1200&q=85',
      ingredients:['12 loempiavellen','350g kip','200g witte kool','150g wortel','100g taugé','2 teentjes knoflook','1 el ketjap','1 tl sambal','Olie'],
      steps:['Bak kip met knoflook en sambal.','Voeg kool, wortel en taugé toe en roerbak kort.','Breng op smaak met ketjap.','Laat vulling afkoelen en rol in loempiavellen.','Frituur of airfry krokant.'],
      notes:'Serveer met chilisaus.' },
    { name:'Tempeh orek', cat:'Diner', persons:4, time:30, emoji:'🌱', cuisine:'Indonesisch',
      photo:IMG+'photo-1604909052743-94e838986d24?auto=format&fit=crop&w=1200&q=85',
      ingredients:['400g tempeh','2 sjalotten','2 teentjes knoflook','2 el ketjap manis','1 el tamarinde of limoensap','1 rode peper','1 tl palmsuiker','Olie','Zout'],
      steps:['Snijd tempeh in reepjes en bak krokant.','Fruit sjalot, knoflook en peper.','Voeg ketjap, tamarinde en palmsuiker toe.','Schep tempeh erdoor tot glanzend en sticky.'],
      notes:'Lekker als bijgerecht bij rijsttafel.' },

    // TURKS
    { name:'Köfte met bulgur salade', cat:'Diner', persons:4, time:50, emoji:'🥙', cuisine:'Turks',
      photo:IMG+'photo-1529042410759-befb1204b468?auto=format&fit=crop&w=1200&q=85',
      ingredients:['600g rundergehakt','1 ui geraspt','2 teentjes knoflook','1 ei','Paneermeel','1 tl komijn','1 tl paprikapoeder','Peterselie','250g bulgur','Tomaat','Komkommer','Citroen','Olijfolie'],
      steps:['Meng gehakt met ui, knoflook, ei, kruiden en paneermeel.','Vorm kleine köfte en laat kort rusten.','Kook of week bulgur en meng met tomaat, komkommer, peterselie, citroen en olie.','Bak of grill köfte gaar.','Serveer met yoghurt of knoflooksaus.'],
      notes:'Ook goed voor meal prep.' },
    { name:'Menemen', cat:'Ontbijt', persons:2, time:20, emoji:'🍳', cuisine:'Turks',
      photo:IMG+'photo-1525351484163-7529414344d8?auto=format&fit=crop&w=1200&q=85',
      ingredients:['4 eieren','3 tomaten','1 groene peper','1 ui optioneel','1 tl pul biber','Peterselie','Olijfolie','Zout en peper','Brood'],
      steps:['Fruit ui en groene peper in olijfolie.','Voeg tomaat toe en laat zacht worden.','Kluts eieren licht en roer door de tomaten.','Laat romig stollen en bestrooi met peterselie.','Serveer direct met brood.'],
      notes:'Niet te droog bakken; menemen hoort zacht en sappig.' },
    { name:'Lahmacun', cat:'Diner', persons:4, time:70, emoji:'🍕', cuisine:'Turks',
      photo:IMG+'photo-1642784353782-096640cb7028?auto=format&fit=crop&w=1200&q=85',
      ingredients:['4 dunne wraps of zelfgemaakt deeg','300g lams- of rundergehakt','1 ui','1 tomaat','1 rode paprika','2 el tomatenpuree','Peterselie','1 tl komijn','1 tl paprika','Citroen','Sla en ui voor topping'],
      steps:['Hak ui, tomaat, paprika en peterselie fijn.','Meng met gehakt, tomatenpuree en kruiden.','Smeer dun op wraps of deeg.','Bak heet in oven tot krokant.','Serveer met citroen, sla en ui en rol op.'],
      notes:'Snelle versie werkt goed met dunne wraps.' },
    { name:'Turkse pide met gehakt', cat:'Diner', persons:4, time:90, emoji:'🫓', cuisine:'Turks',
      photo:IMG+'photo-1601050690117-94f5f6fa8bd7?auto=format&fit=crop&w=1200&q=85',
      ingredients:['500g bloem','7g gist','280ml water','1 tl zout','2 el olie','350g gehakt','1 ui','1 paprika','2 el tomatenpuree','Peterselie','Komijn en paprika','Ei om te bestrijken'],
      steps:['Maak deeg van bloem, gist, water, zout en olie en laat rijzen.','Bak gehakt met ui, paprika, tomatenpuree en kruiden.','Verdeel deeg in ovalen en vul met gehakt.','Vouw randen naar binnen en bestrijk met ei.','Bak 15 tot 20 minuten op hoge temperatuur.'],
      notes:'Serveer met yoghurt-knoflooksaus.' },
    { name:'Turkse sigara böreği', cat:'Snack', persons:6, time:35, emoji:'🧀', cuisine:'Turks',
      photo:IMG+'photo-1601050690117-94f5f6fa8bd7?auto=format&fit=crop&w=1200&q=85',
      ingredients:['Yufka vellen','250g feta','Peterselie','1 ei','Peper','Olie om te bakken'],
      steps:['Meng feta met peterselie, ei en peper.','Snijd yufka in driehoeken.','Leg vulling op elk vel en rol strak op.','Bak in olie goudbruin of airfry krokant.'],
      notes:'Lekker met yoghurt-knoflookdip.' },
    { name:'Adana kebab met pilav', cat:'Diner', persons:4, time:55, emoji:'🔥', cuisine:'Turks',
      photo:IMG+'photo-1529042410759-befb1204b468?auto=format&fit=crop&w=1200&q=85',
      ingredients:['600g lams- of rundergehakt','1 rode peper','1 ui','Peterselie','1 tl komijn','1 tl paprika','Pilavrijst','Yoghurt','Flatbread'],
      steps:['Meng gehakt met ui, peper, peterselie en kruiden.','Vorm lange kebabs rond spiesen.','Grill of bak stevig bruin en gaar.','Maak pilavrijst.','Serveer met yoghurt en flatbread.'],
      notes:'Gebruik pul biber voor extra pit.' },
    { name:'Turkse linzensoep mercimek çorbası', cat:'Lunch', persons:4, time:40, emoji:'🥣', cuisine:'Turks',
      photo:IMG+'photo-1547592180-85f173990554?auto=format&fit=crop&w=1200&q=85',
      ingredients:['250g rode linzen','1 ui','1 wortel','1 aardappel','1 el tomatenpuree','1 tl komijn','1 tl paprikapoeder','1,2 liter bouillon','Citroen','Munt of pul biber','Olijfolie'],
      steps:['Fruit ui in olijfolie.','Voeg wortel, aardappel, linzen en tomatenpuree toe.','Schenk bouillon erbij en kook 25 minuten.','Pureer glad en breng op smaak met komijn en paprika.','Serveer met citroen en munt of pul biber.'],
      notes:'Perfect als lichte lunch of voorgerecht.' },
    { name:'Karnıyarık gevulde aubergine', cat:'Diner', persons:4, time:80, emoji:'🍆', cuisine:'Turks',
      photo:IMG+'photo-1625944228741-cf30983ecb78?auto=format&fit=crop&w=1200&q=85',
      ingredients:['4 aubergines','400g gehakt','1 ui','2 tomaten','2 groene pepers','2 teentjes knoflook','Tomatenpuree','Peterselie'],
      steps:['Rooster of bak aubergines zacht.','Bak gehakt met ui, knoflook, tomaat en peper.','Snijd aubergines open en vul met gehakt.','Bak met tomatensaus 25 minuten in oven.'],
      notes:'Lekker met rijst en yoghurt.' },

    // ITALIAANS
    { name:'Spaghetti carbonara', cat:'Diner', persons:4, time:25, emoji:'🍝', cuisine:'Italiaans',
      photo:IMG+'photo-1612874742237-6526221588e3?auto=format&fit=crop&w=1200&q=85',
      ingredients:['400g spaghetti','150g pancetta of spek','3 eieren','80g Parmezaan','Zwarte peper','Zout'],
      steps:['Kook spaghetti al dente.','Bak pancetta krokant.','Klop eieren met kaas en peper.','Meng pasta van het vuur met ei-kaasmengsel.','Voeg pastawater toe tot romig.'],
      notes:'Geen room nodig.' },
    { name:'Pizza margherita', cat:'Diner', persons:4, time:60, emoji:'🍕', cuisine:'Italiaans',
      photo:IMG+'photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=1200&q=85',
      ingredients:['Pizzadeeg','Tomatensaus','Mozzarella','Basilicum','Olijfolie'],
      steps:['Verwarm oven op maximale temperatuur.','Rol deeg dun uit.','Beleg met saus en mozzarella.','Bak krokant.','Garneer met basilicum.'],
      notes:'Simpel en premium.' },
    { name:'Risotto funghi', cat:'Diner', persons:4, time:45, emoji:'🍄', cuisine:'Italiaans',
      photo:IMG+'photo-1476124369491-e7addf5db371?auto=format&fit=crop&w=1200&q=85',
      ingredients:['320g risottorijst','300g paddenstoelen','1 ui','1 glas witte wijn optioneel','1 liter bouillon','Parmezaan','Boter'],
      steps:['Fruit ui en rijst glazig.','Blus met wijn.','Voeg bouillon beetje bij beetje toe.','Bak paddenstoelen apart.','Roer paddenstoelen, boter en Parmezaan door de risotto.'],
      notes:'Gebruik gemengde paddenstoelen voor diepte.' },
    { name:'Pasta arrabbiata', cat:'Diner', persons:4, time:30, emoji:'🌶️', cuisine:'Italiaans',
      photo:IMG+'photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=1200&q=85',
      ingredients:['400g penne','2 blikken tomaten','3 teentjes knoflook','Chilivlokken','Olijfolie','Peterselie','Parmezaan'],
      steps:['Fruit knoflook en chili in olijfolie.','Voeg tomaten toe en laat inkoken.','Kook penne al dente.','Meng pasta met saus.','Serveer met peterselie en kaas.'],
      notes:'Simpel, pittig en snel.' },
    { name:'Pasta al forno', cat:'Diner', persons:6, time:65, emoji:'🧀', cuisine:'Italiaans',
      photo:IMG+'photo-1621996346565-e3dbc646d9a9?auto=format&fit=crop&w=1200&q=85',
      ingredients:['500g pasta','500g gehakt','Tomatensaus','Mozzarella','Parmezaan','Ui','Knoflook','Italiaanse kruiden'],
      steps:['Kook pasta net niet gaar.','Maak gehaktsaus met tomaat.','Meng pasta met saus.','Doe in ovenschaal met mozzarella en Parmezaan.','Bak 25 minuten goudbruin.'],
      notes:'Goede meal-prep ovenschotel.' },
    { name:'Melanzane alla parmigiana', cat:'Diner', persons:4, time:80, emoji:'🍆', cuisine:'Italiaans',
      photo:IMG+'photo-1625944525533-473f1a3d54e7?auto=format&fit=crop&w=1200&q=85',
      ingredients:['3 aubergines','Tomatensaus','Mozzarella','Parmezaan','Basilicum','Olijfolie','Zout'],
      steps:['Snijd aubergines en rooster of bak ze.','Maak tomatensaus.','Bouw lagen aubergine, saus, mozzarella en Parmezaan.','Bak 35 minuten op 190°C.','Laat even rusten voor serveren.'],
      notes:'Vegetarische comfort food.' },
    { name:'Arancini met mozzarella', cat:'Snack', persons:6, time:75, emoji:'🧆', cuisine:'Italiaans',
      photo:IMG+'photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=1200&q=85',
      ingredients:['400g risottorijst gekookt','150g mozzarella','2 eieren','Paneermeel','Bloem','Parmezaan','Olie','Tomatensaus'],
      steps:['Meng koude risotto met Parmezaan.','Vorm ballen met mozzarella in het midden.','Haal door bloem, ei en paneermeel.','Frituur of airfry goudbruin.','Serveer met tomatensaus.'],
      notes:'Ideaal met restjes risotto.' },

    // NEDERLANDS
    { name:'Boerenkool stamppot met rookworst', cat:'Diner', persons:4, time:40, emoji:'🥬', cuisine:'Nederlands',
      photo:IMG+'photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1200&q=85',
      ingredients:['1kg kruimige aardappelen','500g gesneden boerenkool','1 rookworst','150ml melk','40g boter','Mosterd','Zout, peper en nootmuskaat'],
      steps:['Schil aardappelen en kook ze met boerenkool in 20 minuten gaar.','Warm de rookworst volgens verpakking.','Giet af en stamp met melk en boter.','Breng op smaak met zout, peper en nootmuskaat.','Serveer met rookworst en mosterd.'],
      notes:'Extra lekker met uitgebakken spekjes.' },
    { name:'Hutspot met hachee', cat:'Diner', persons:4, time:150, emoji:'🥕', cuisine:'Nederlands',
      photo:IMG+'photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=1200&q=85',
      ingredients:['1kg aardappelen','700g winterpeen','500g uien','600g riblappen','2 laurierblaadjes','2 kruidnagels','500ml runderbouillon','2 el bloem','Boter','Zout en peper'],
      steps:['Bak riblappen rondom bruin in boter.','Voeg uien, bloem, bouillon, laurier en kruidnagel toe.','Laat 2 uur zacht stoven.','Kook aardappelen, wortel en ui gaar.','Stamp tot hutspot en serveer met hachee.'],
      notes:'Maak hachee een dag vooraf voor extra smaak.' },
    { name:'Erwtensoep snert', cat:'Diner', persons:6, time:120, emoji:'🥣', cuisine:'Nederlands',
      photo:IMG+'photo-1547592180-85f173990554?auto=format&fit=crop&w=1200&q=85',
      ingredients:['500g spliterwten','1 prei','1 winterpeen','1 knolselderij','2 uien','1 rookworst','300g speklap of krabbetjes','2 laurierblaadjes','Selderij','Zout en peper'],
      steps:['Spoel spliterwten en kook met vlees en laurier.','Schep schuim af en laat zacht koken.','Voeg gesneden groenten toe en kook tot alles zacht is.','Haal vlees eruit, snijd klein en doe terug.','Voeg rookworst toe en breng op smaak.'],
      notes:'Snert hoort dik te zijn; de volgende dag is hij vaak nog beter.' },
    { name:'Pannenkoeken', cat:'Diner', persons:4, time:35, emoji:'🥞', cuisine:'Nederlands',
      photo:IMG+'photo-1528207776546-365bb710ee93?auto=format&fit=crop&w=1200&q=85',
      ingredients:['250g bloem','2 eieren','500ml melk','Snuf zout','Boter om te bakken','Stroop','Poedersuiker','Spek of appel optioneel'],
      steps:['Klop bloem, eieren, melk en zout tot een glad beslag.','Laat eventueel 10 minuten rusten.','Verhit boter in een koekenpan.','Bak dunne pannenkoeken aan beide kanten goudbruin.','Serveer met stroop, suiker of hartige toppings.'],
      notes:'Ideaal als snelle gezinsmaaltijd.' },
    { name:'Appeltaart', cat:'Bakken', persons:10, time:90, emoji:'🥧', cuisine:'Nederlands',
      photo:IMG+'photo-1621743478914-cc8a86d7e9f2?auto=format&fit=crop&w=1200&q=85',
      ingredients:['300g bloem','200g boter','150g suiker','1 ei','1kg appels','75g rozijnen','2 tl kaneel','Paneermeel','Snuf zout'],
      steps:['Maak deeg van bloem, boter, suiker, ei en zout.','Bekleed een springvorm met deeg.','Meng appel met rozijnen, kaneel en wat suiker.','Strooi paneermeel op de bodem en vul met appel.','Maak een raster van deeg en bak 60 minuten op 175°C.'],
      notes:'Laat afkoelen voor mooie punten.' },
    { name:'Poffertjes', cat:'Dessert', persons:4, time:35, emoji:'🥞', cuisine:'Nederlands',
      photo:IMG+'photo-1554520735-0a6b8b6ce8b7?auto=format&fit=crop&w=1200&q=85',
      ingredients:['250g bloem','7g gist','300ml melk','1 ei','Snuf zout','Boter','Poedersuiker'],
      steps:['Meng bloem, gist, melk, ei en zout tot beslag.','Laat 30 minuten rijzen.','Vet poffertjespan in met boter.','Bak kleine poffertjes en draai ze om zodra de bovenkant stolt.','Serveer met boter en poedersuiker.'],
      notes:'Leuk weekendgerecht met kinderen.' },
    { name:'Uitsmijter ham kaas', cat:'Lunch', persons:1, time:12, emoji:'🍳', cuisine:'Nederlands',
      photo:IMG+'photo-1525351484163-7529414344d8?auto=format&fit=crop&w=1200&q=85',
      ingredients:['2 sneetjes brood','2 eieren','2 plakken ham','2 plakken kaas','Boter','Zout en peper'],
      steps:['Rooster of bak brood licht.','Bak eieren in boter als spiegelei.','Leg ham en kaas op het brood.','Leg eieren erbovenop.','Breng op smaak met zout en peper.'],
      notes:'Lekker met tomaat of augurk erbij.' }
  ];

  // ── STATE ──────────────────────────────────────────────────

  var state = {
    search: '',
    catFilter: 'all',
    currentId: null,
    checkedIngredients: {},
    checkedSteps: {}
  };

  // ── UTILS ──────────────────────────────────────────────────

  function esc(v) {
    return String(v == null ? '' : v)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;').replace(/'/g,'&#039;');
  }

  function norm(v) { return String(v || '').toLowerCase().trim(); }

  function fallbackPhoto(r) {
    if (r && r.photo) return r.photo;
    var key = String((r && r.name) || '').length + Number((r && r.id) || 0);
    return FALLBACK_PHOTOS[Math.abs(key) % FALLBACK_PHOTOS.length];
  }

  function getSet(bucket, id) {
    if (!bucket[id]) bucket[id] = new Set();
    if (Array.isArray(bucket[id])) bucket[id] = new Set(bucket[id]);
    return bucket[id];
  }

  function recipes() {
    if (!Array.isArray(window.recipesData)) window.recipesData = [];
    return window.recipesData;
  }

  function setRecipes(arr) {
    window.recipesData = arr;
    try { recipesData = arr; } catch(e) {}
  }

  function nextId() {
    var max = Math.max.apply(null, recipes().map(function(r){ return Number(r.id)||0; }).concat([0]));
    var id = max + 1;
    window.recipeNextId = id;
    try { recipeNextId = id; } catch(e) {}
    return id;
  }

  function persist(op) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(recipes())); } catch(e) {}
    if (window.HouseholdRepository && typeof window.HouseholdRepository.write === 'function') {
      window.HouseholdRepository.write('recipes', recipes(), { source:'recipes', operation:op||'mutation', version:VERSION });
    }
    try { window.dispatchEvent(new CustomEvent('familyapp:food:recipes-updated', { detail:{ recipes:recipes(), version:VERSION } })); } catch(e) {}
  }

  function toast(msg) { if (typeof window.showToast === 'function') window.showToast(msg); }
  function xp(n, lbl) { if (typeof window.awardXP === 'function') window.awardXP(n, lbl); }
  function activity(icon, bg, msg) { if (typeof window.addActivity === 'function') window.addActivity(icon, bg, msg); }

  // ── STYLES ────────────────────────────────────────────────

  function injectStyles() {
    if (document.getElementById('recipes-v0272-style')) return;
    var s = document.createElement('style');
    s.id = 'recipes-v0272-style';
    s.textContent = [
      '.rf-search{padding:0 16px 12px}',
      '.rf-search input{width:100%;height:46px;border-radius:18px;border:1px solid var(--c-border,#edf0ec);background:var(--c-surface,#fff);padding:0 16px;font-size:15px;font-weight:800;box-shadow:0 8px 22px rgba(17,24,39,.045);-webkit-appearance:none;outline:none}',
      '#recipe-grid{display:grid!important;grid-template-columns:1fr 1fr!important;gap:14px!important;padding:0 16px 120px!important}',
      '.rf-card{position:relative;min-height:218px;border-radius:24px;overflow:hidden;background:#111827;box-shadow:0 16px 34px rgba(17,24,39,.14);border:1px solid rgba(255,255,255,.18);cursor:pointer;transform:translateZ(0)}',
      '.rf-card:active{transform:scale(.985)}',
      '.rf-card-bg{position:absolute;inset:0;background-size:cover;background-position:center;transition:transform .35s ease}',
      '.rf-card:active .rf-card-bg{transform:scale(1.04)}',
      '.rf-card-overlay{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.06) 0%,rgba(0,0,0,.18) 42%,rgba(0,0,0,.76) 100%)}',
      '.rf-card-emoji{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:56px;background:linear-gradient(135deg,#f7f7f3,#edf5e9)}',
      '.rf-card-cuisine{position:absolute;top:12px;left:12px;height:28px;display:inline-flex;align-items:center;padding:0 10px;border-radius:999px;background:rgba(255,255,255,.18);backdrop-filter:blur(10px);color:#fff;font-size:11px;font-weight:950;letter-spacing:.02em;text-shadow:0 2px 8px rgba(0,0,0,.25)}',
      '.rf-card-time{position:absolute;top:12px;right:12px;height:28px;display:inline-flex;align-items:center;padding:0 9px;border-radius:999px;background:rgba(0,0,0,.32);backdrop-filter:blur(10px);color:#fff;font-size:11px;font-weight:950}',
      '.rf-card-body{position:absolute;left:13px;right:13px;bottom:13px;color:#fff}',
      '.rf-card-name{font-size:17px;line-height:1.05;font-weight:950;letter-spacing:-.035em;text-shadow:0 2px 12px rgba(0,0,0,.35)}',
      '.rf-card-meta{display:flex;gap:6px;flex-wrap:wrap;margin-top:9px}',
      '.rf-card-pill{height:26px;display:inline-flex;align-items:center;gap:4px;padding:0 8px;border-radius:999px;background:rgba(255,255,255,.17);backdrop-filter:blur(10px);color:#fff;font-size:11px;font-weight:900;border:1px solid rgba(255,255,255,.12)}',
      '.rf-hero{width:100%;height:210px;overflow:hidden;position:relative;background:var(--c-surface2,#f4f7f2);display:flex;align-items:center;justify-content:center;font-size:64px}',
      '.rf-hero img{width:100%;height:100%;object-fit:cover;display:block}',
      '.rf-hero-btn{position:absolute;bottom:10px;right:10px;background:rgba(0,0,0,.6);color:#fff;border:none;border-radius:20px;padding:6px 14px;font-size:12px;font-weight:800;cursor:pointer}',
      '.rf-actions{display:flex;gap:9px;flex-wrap:wrap;margin:14px 16px 4px}',
      '.rf-btn{border:0;border-radius:999px;padding:10px 13px;font-size:12px;font-weight:950;background:var(--c-surface2,#f4f7f2);color:var(--c-text,#111827);cursor:pointer}',
      '.rf-btn.primary{background:var(--c-primary,#3f7f2f);color:#fff}',
      '.rf-btn.danger{background:#fff1f1;color:#c23333}',
      '.rf-section{background:var(--c-surface,#fff);border-radius:22px;margin:12px 16px;padding:16px;box-shadow:0 6px 20px rgba(17,24,39,.05);border:1px solid var(--c-border,#edf0ec)}',
      '.rf-section-title{font-size:13px;font-weight:950;letter-spacing:.04em;text-transform:uppercase;color:var(--c-text2,#667085);margin-bottom:12px}',
      '.rf-ing-row{display:flex;align-items:flex-start;gap:12px;padding:10px 0;border-bottom:1px solid rgba(17,24,39,.055);cursor:pointer}',
      '.rf-ing-row:last-of-type{border-bottom:0}',
      '.rf-check-circle{width:26px;height:26px;min-width:26px;border-radius:50%;border:2px solid var(--c-border,#d8dfd6);background:var(--c-surface,#fff);display:flex;align-items:center;justify-content:center;transition:all .18s cubic-bezier(.2,.8,.2,1);box-shadow:0 2px 8px rgba(17,24,39,.04);flex-shrink:0}',
      '.rf-check-circle.done{border-color:var(--c-primary,#3f7f2f);background:var(--c-primary,#3f7f2f);box-shadow:0 7px 18px rgba(63,127,47,.22);transform:scale(1.04)}',
      '.rf-check-text{font-size:15px;line-height:1.45;color:var(--c-text,#111827);font-weight:650;transition:all .18s ease;flex:1}',
      '.rf-check-text.done{color:var(--c-text3,#9aa3af);text-decoration:line-through;text-decoration-thickness:2px}',
      '.rf-step-row{display:flex;align-items:flex-start;gap:12px;background:var(--c-surface,#fff);border:1px solid var(--c-border,#edf0ec);border-radius:16px;margin-bottom:8px;padding:12px;cursor:pointer}',
      '.rf-step-num{width:28px;height:28px;border-radius:10px;background:var(--c-surface2,#f4f7f2);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:950;color:var(--c-text2,#667085);flex-shrink:0}',
      '.rf-shop-btn{width:100%;margin-top:14px;padding:13px;border:0;border-radius:16px;background:var(--c-primary,#3f7f2f);color:#fff;font-size:14px;font-weight:950;cursor:pointer;box-shadow:0 8px 18px rgba(63,127,47,.18)}',
      '.rf-notes{background:var(--c-surface2,#f4f7f2);border-radius:16px;margin:12px 16px;padding:14px}',
      '.rf-notes-label{font-size:12px;font-weight:950;color:var(--c-text2);margin-bottom:6px}',
      '.rf-notes-body{font-size:14px;line-height:1.5;color:var(--c-text)}',
      '.rf-add-btn{background:var(--c-primary,#3f7f2f)!important;color:#fff!important;border:0!important;border-radius:999px!important;padding:9px 16px!important;font-size:13px!important;font-weight:950!important;box-shadow:0 8px 18px rgba(63,127,47,.18)!important;cursor:pointer!important}',
      '.rf-photo-preview{width:100%;height:155px;border-radius:20px;background-size:cover;background-position:center;background-color:var(--c-surface2,#f4f7f2);border:1px solid var(--c-border,#edf0ec);margin-bottom:12px}',
      '.rf-photo-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px}',
      '.rf-photo-thumb{height:76px;border-radius:15px;background-size:cover;background-position:center;border:2px solid transparent;cursor:pointer}',
      '.rf-photo-thumb.active{border-color:var(--c-primary,#3f7f2f)}',
      '.rf-upload-row{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:12px}',
      '.rf-empty{grid-column:1/-1;text-align:center;padding:40px;color:var(--c-text2)}',
      '@media(max-width:390px){#recipe-grid{gap:11px!important;padding-left:14px!important;padding-right:14px!important}.rf-card{min-height:204px}.rf-card-name{font-size:16px}}'
    ].join('\n');
    document.head.appendChild(s);
  }

  // ── SEED ─────────────────────────────────────────────────

  function runSeed() {
    var seeded;
    try { seeded = localStorage.getItem(SEEDED_KEY); } catch(e) {}
    if (seeded === VERSION) return;
    var arr = recipes();
    var existing = {};
    arr.forEach(function(r){ existing[norm(r.name)] = true; });
    var added = 0;
    SEED_RECIPES.forEach(function(sr) {
      if (existing[norm(sr.name)]) return;
      var copy = JSON.parse(JSON.stringify(sr));
      copy.id = nextId() + added;
      copy.seeded = true;
      arr.push(copy);
      existing[norm(copy.name)] = true;
      added++;
    });
    if (added) {
      setRecipes(arr);
      persist('seed');
    }
    try { localStorage.setItem(SEEDED_KEY, VERSION); } catch(e) {}
  }

  // ── VIEW SWITCHER ─────────────────────────────────────────

  function showView(name) {
    ['recipe-list-view','recipe-detail-view','recipe-editor-view','recipe-import-view'].forEach(function(id) {
      var el = document.getElementById(id);
      if (el) el.style.display = (id === 'recipe-' + name + '-view') ? 'block' : 'none';
    });
  }

  // ── SEARCH BAR ────────────────────────────────────────────

  function installSearchBar() {
    var grid = document.getElementById('recipe-grid');
    if (!grid || !grid.parentNode) return;
    if (document.getElementById('rf-search-bar')) return;
    var wrap = document.createElement('div');
    wrap.id = 'rf-search-bar';
    wrap.className = 'rf-search';
    wrap.innerHTML = '<input id="rf-search-input" placeholder="🔎 Zoek recept, ingrediënt of keuken" value="'+esc(state.search)+'">';
    grid.parentNode.insertBefore(wrap, grid);
    var inp = document.getElementById('rf-search-input');
    inp.oninput = function() { state.search = inp.value || ''; renderRecipeGrid(); };
  }

  // ── ADD BUTTON ────────────────────────────────────────────

  function installAddButton() {
    var screen = document.getElementById('screen-recipes');
    if (!screen) return;
    var header = screen.querySelector('.list-header');
    if (!header) return;
    if (document.getElementById('rf-add-btn')) return;
    header.querySelectorAll('.add-btn').forEach(function(b) { b.style.display = 'none'; });
    var btn = document.createElement('button');
    btn.id = 'rf-add-btn';
    btn.className = 'rf-add-btn';
    btn.textContent = '+ Recept';
    btn.onclick = function() { openRecipeEditor(null); };
    header.appendChild(btn);
  }

  // ── GRID ─────────────────────────────────────────────────

  function renderRecipeGrid() {
    injectStyles();
    installSearchBar();
    installAddButton();
    var grid = document.getElementById('recipe-grid');
    if (!grid) return;
    var q = norm(state.search);
    var data = recipes().filter(function(r) {
      var catOk = state.catFilter === 'all' || r.cat === state.catFilter;
      if (!catOk) return false;
      if (!q) return true;
      var hay = norm([r.name, r.cat, r.cuisine, r.notes, (r.ingredients||[]).join(' ')].join(' '));
      return hay.indexOf(q) > -1;
    });
    if (!data.length) {
      grid.innerHTML = '<div class="rf-empty">Geen recepten gevonden</div>';
      return;
    }
    grid.innerHTML = data.map(function(r) {
      var photo = fallbackPhoto(r);
      var emoji = r.emoji || CAT_EMOJIS[r.cat] || '🍴';
      var bg = photo
        ? '<div class="rf-card-bg" style="background-image:url(\''+esc(photo)+'\')"></div><div class="rf-card-overlay"></div>'
        : '<div class="rf-card-emoji">'+esc(emoji)+'</div>';
      return '<article class="rf-card" data-rid="'+esc(r.id)+'">'
        + bg
        + '<div class="rf-card-cuisine">'+esc(r.cuisine || r.cat || 'Recept')+'</div>'
        + '<div class="rf-card-time">⏱ '+esc(r.time||20)+'m</div>'
        + '<div class="rf-card-body">'
        + '<div class="rf-card-name">'+esc(r.name)+'</div>'
        + '<div class="rf-card-meta">'
        + '<span class="rf-card-pill">'+esc(emoji)+' '+esc(r.cat||'Diner')+'</span>'
        + '<span class="rf-card-pill">👥 '+esc(r.persons||4)+'p</span>'
        + '</div></div></article>';
    }).join('');
    grid.querySelectorAll('[data-rid]').forEach(function(card) {
      card.onclick = function() { openRecipeDetail(parseInt(card.getAttribute('data-rid'), 10)); };
    });
  }

  function renderRecipes() {
    injectStyles();
    runSeed();
    document.querySelectorAll('#recipe-cat-chips .chip').forEach(function(c) {
      c.onclick = function() {
        document.querySelectorAll('#recipe-cat-chips .chip').forEach(function(x){ x.classList.remove('active'); });
        c.classList.add('active');
        state.catFilter = c.dataset.rcat || 'all';
        renderRecipeGrid();
      };
    });
    showView('list');
    renderRecipeGrid();
  }

  // ── DETAIL ────────────────────────────────────────────────

  function openRecipeDetail(id) {
    var r = recipes().find(function(x){ return Number(x.id) === Number(id); });
    if (!r) { toast('Recept niet gevonden'); return; }
    state.currentId = id;
    window.currentRecipeId = id;
    try { currentRecipeId = id; } catch(e) {}
    if (!Array.isArray(r.ingredients)) r.ingredients = [];
    if (!Array.isArray(r.steps)) r.steps = [];
    showView('detail');
    var dc = document.getElementById('recipe-detail-content');
    if (!dc) return;
    var ingSet  = getSet(state.checkedIngredients, id);
    var stepSet = getSet(state.checkedSteps, id);
    window.checkedIngredients = state.checkedIngredients;
    window.checkedRecipeSteps = state.checkedSteps;
    var photo = fallbackPhoto(r);
    var emoji = r.emoji || CAT_EMOJIS[r.cat] || '🍴';
    var SVG_CHECK = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.5"><polyline points="20 6 9 17 4 12"/></svg>';
    var heroHtml = '<div class="rf-hero">'
      + (photo ? '<img src="'+esc(photo)+'" onerror="this.style.display=\'none\'">' : '<span>'+esc(emoji)+'</span>')
      + '<button class="rf-hero-btn" id="rf-photo-btn">📷 '+(photo?'Wijzigen':'Foto toevoegen')+'</button></div>';
    var ingsHtml = r.ingredients.length
      ? r.ingredients.map(function(ing, i) {
          var done = ingSet.has(i);
          return '<label class="rf-ing-row" data-rf-ing="'+i+'">'
            + '<span class="rf-check-circle'+(done?' done':'')+'">'+( done ? SVG_CHECK : '')+'</span>'
            + '<span class="rf-check-text'+(done?' done':'')+'">'+esc(ing)+'</span></label>';
        }).join('')
      : '<p style="padding:10px 0;color:var(--c-text2)">Geen ingrediënten opgegeven</p>';
    var stepsHtml = r.steps.length
      ? r.steps.map(function(step, i) {
          var done = stepSet.has(i);
          return '<label class="rf-step-row" data-rf-step="'+i+'">'
            + '<span class="rf-check-circle'+(done?' done':'')+'">'+( done ? SVG_CHECK : '')+'</span>'
            + '<span class="rf-step-num">'+(i+1)+'</span>'
            + '<span class="rf-check-text'+(done?' done':'')+'">'+esc(step)+'</span></label>';
        }).join('')
      : '<p style="padding:10px 0;color:var(--c-text2)">Geen bereidingsstappen opgegeven</p>';
    dc.innerHTML = heroHtml
      + '<div class="recipe-title-area" style="padding:22px 16px 8px"><h2>'+esc(r.name)+'</h2>'
      + '<div style="display:flex;gap:8px;flex-wrap:wrap">'
      + '<span class="recipe-tag">📂 '+esc(r.cat||'Diner')+'</span>'
      + '<span class="recipe-tag">⏱ '+esc(r.time||20)+' min</span>'
      + '<span class="recipe-tag">👥 '+esc(r.persons||4)+' pers</span>'
      + '</div></div>'
      + '<div class="rf-actions">'
      + '<button class="rf-btn primary" id="rf-edit-btn">✏️ Bewerken</button>'
      + '<button class="rf-btn" id="rf-photo2-btn">🖼️ Foto</button>'
      + '<button class="rf-btn danger" id="rf-del-btn">🗑️ Verwijderen</button>'
      + '</div>'
      + '<div class="rf-section"><div class="rf-section-title">Ingrediënten</div>'
      + ingsHtml
      + '<button class="rf-shop-btn" id="rf-shop-btn">🛒 Zet alles op boodschappenlijst</button></div>'
      + '<div class="rf-section"><div class="rf-section-title">Bereiding</div>'+stepsHtml+'</div>'
      + (r.notes ? '<div class="rf-notes"><div class="rf-notes-label">💡 Notities</div><div class="rf-notes-body">'+esc(r.notes)+'</div></div>' : '')
      + '<div style="height:40px"></div>';
    // Ingredient toggles — no full re-render
    dc.querySelectorAll('[data-rf-ing]').forEach(function(row) {
      row.onclick = function() {
        var idx = parseInt(row.getAttribute('data-rf-ing'), 10);
        if (ingSet.has(idx)) ingSet.delete(idx); else ingSet.add(idx);
        var done = ingSet.has(idx);
        var circle = row.querySelector('.rf-check-circle');
        var text   = row.querySelector('.rf-check-text');
        if (circle) { circle.classList.toggle('done', done); circle.innerHTML = done ? SVG_CHECK : ''; }
        if (text)   { text.classList.toggle('done', done); }
      };
    });
    // Step toggles
    dc.querySelectorAll('[data-rf-step]').forEach(function(row) {
      row.onclick = function() {
        var idx = parseInt(row.getAttribute('data-rf-step'), 10);
        if (stepSet.has(idx)) stepSet.delete(idx); else stepSet.add(idx);
        var done = stepSet.has(idx);
        var circle = row.querySelector('.rf-check-circle');
        var text   = row.querySelector('.rf-check-text');
        if (circle) { circle.classList.toggle('done', done); circle.innerHTML = done ? SVG_CHECK : ''; }
        if (text)   { text.classList.toggle('done', done); }
      };
    });
    var pBtn = document.getElementById('rf-photo-btn');
    var p2   = document.getElementById('rf-photo2-btn');
    var edit = document.getElementById('rf-edit-btn');
    var del  = document.getElementById('rf-del-btn');
    var shop = document.getElementById('rf-shop-btn');
    [pBtn, p2].forEach(function(b) { if (b) b.onclick = function() { openRecipePhotoSheet(id); }; });
    if (edit) edit.onclick = function() { openRecipeEditor(id); };
    if (del)  del.onclick  = function() { deleteRecipe(id); };
    if (shop) shop.onclick = function() { addRecipeToShop(id); };
  }

  function closeRecipeDetail() { showView('list'); renderRecipeGrid(); }

  // ── DELETE ────────────────────────────────────────────────

  function deleteRecipe(id) {
    var r = recipes().find(function(x){ return Number(x.id) === Number(id); });
    if (!r) return;
    if (!confirm('Recept "'+r.name+'" verwijderen?')) return;
    setRecipes(recipes().filter(function(x){ return Number(x.id) !== Number(id); }));
    persist('deleteRecipe');
    toast('Recept verwijderd');
    showView('list');
    renderRecipeGrid();
  }

  // ── PHOTO SHEET ───────────────────────────────────────────

  function openRecipePhotoSheet(id) {
    var r = recipes().find(function(x){ return Number(x.id) === Number(id); });
    if (!r) return;
    if (window.BottomSheet) {
      var current = r.photo || fallbackPhoto(r);
      window.BottomSheet.open({
        title: '🖼️ Receptfoto',
        html: '<div id="rf-ps-preview" class="rf-photo-preview" style="background-image:url(\''+esc(current)+'\')">'
          + '</div><div class="fam-modal-field"><label>Foto URL</label>'
          + '<input id="rf-ps-url" value="'+esc(current)+'"></div>'
          + '<div class="rf-upload-row">'
          + '<button type="button" class="rf-btn primary" id="rf-ps-upload-btn">📷 Uploaden</button>'
          + '<input type="file" accept="image/*" id="rf-ps-file" style="display:none">'
          + '<button type="button" class="rf-btn" id="rf-ps-random">✨ Sfeerfoto</button>'
          + '</div><div class="rf-photo-grid">'
          + FALLBACK_PHOTOS.map(function(src) {
              return '<button type="button" class="rf-photo-thumb" data-photo="'+esc(src)+'" style="background-image:url(\''+esc(src)+'\')"></button>';
            }).join('')
          + '</div>',
        onOpen: function(ctx) {
          function setPhoto(src) {
            var inp = ctx.modal.querySelector('#rf-ps-url');
            var prev = ctx.modal.querySelector('#rf-ps-preview');
            if (inp) inp.value = src || '';
            if (prev) prev.style.backgroundImage = src ? "url('"+String(src).replace(/'/g,'%27')+"')" : '';
          }
          var urlInp = ctx.modal.querySelector('#rf-ps-url');
          if (urlInp) urlInp.oninput = function() { setPhoto(urlInp.value); };
          var uploadBtn = ctx.modal.querySelector('#rf-ps-upload-btn');
          var fileInp   = ctx.modal.querySelector('#rf-ps-file');
          if (uploadBtn && fileInp) uploadBtn.onclick = function() { fileInp.click(); };
          if (fileInp) fileInp.onchange = function(e) {
            var file = e.target.files[0]; if (!file) return;
            var reader = new FileReader();
            reader.onload = function(ev) { setPhoto(ev.target.result); };
            reader.readAsDataURL(file);
          };
          var randomBtn = ctx.modal.querySelector('#rf-ps-random');
          if (randomBtn) randomBtn.onclick = function() { setPhoto(FALLBACK_PHOTOS[Math.floor(Math.random()*FALLBACK_PHOTOS.length)]); };
          ctx.modal.querySelectorAll('[data-photo]').forEach(function(btn) {
            btn.onclick = function() { setPhoto(btn.getAttribute('data-photo')); };
          });
        },
        actions: [
          { label: 'Annuleren' },
          { label: 'Opslaan', primary: true, onClick: function(ctx) {
            var url = ((ctx.modal.querySelector('#rf-ps-url') || {}).value || '').trim();
            r.photo = url || fallbackPhoto(r);
            r.photoFallback = !url;
            persist('updatePhoto');
            toast('Foto opgeslagen ✓');
            openRecipeDetail(id);
            return true;
          }}
        ]
      });
    }
  }

  // ── EDITOR ────────────────────────────────────────────────

  function openRecipeEditor(id) {
    var r = id ? recipes().find(function(x){ return Number(x.id) === Number(id); }) : null;
    state.currentId = id || null;
    window.currentRecipeId = id || null;
    if (window.BottomSheet) {
      window.BottomSheet.open({
        title: r ? '✏️ Recept bewerken' : '🍳 Nieuw recept',
        html: '<div class="fam-modal-field"><label>Naam</label><input id="rfe-name" placeholder="bijv. Pasta pesto" value="'+esc(r ? r.name : '')+'"></div>'
          + '<div class="fam-modal-field"><label>Categorie</label><select id="rfe-cat"><option>Ontbijt</option><option>Lunch</option><option>Diner</option><option>Snack</option><option>Dessert</option><option>Bakken</option></select></div>'
          + '<div class="fam-modal-field"><label>Keuken</label><input id="rfe-cuisine" placeholder="bijv. Turks" value="'+esc(r ? r.cuisine||'' : '')+'"></div>'
          + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">'
          + '<div class="fam-modal-field"><label>Personen</label><input id="rfe-persons" type="number" min="1" value="'+esc(r ? r.persons||4 : 4)+'"></div>'
          + '<div class="fam-modal-field"><label>Tijd min.</label><input id="rfe-time" type="number" min="1" value="'+esc(r ? r.time||30 : 30)+'"></div>'
          + '</div>'
          + '<div class="fam-modal-field"><label>Ingrediënten</label><textarea id="rfe-ings" rows="5" placeholder="Elke regel is één ingrediënt">'+esc(r ? (r.ingredients||[]).join('\n') : '')+'</textarea></div>'
          + '<div class="fam-modal-field"><label>Bereiding</label><textarea id="rfe-steps" rows="5" placeholder="Elke regel is één stap">'+esc(r ? (r.steps||[]).join('\n') : '')+'</textarea></div>'
          + '<div class="fam-modal-field"><label>Notities</label><textarea id="rfe-notes" rows="3">'+esc(r ? r.notes||'' : '')+'</textarea></div>',
        onOpen: function(ctx) {
          var cat = ctx.modal.querySelector('#rfe-cat');
          if (cat && r) cat.value = r.cat || 'Diner';
          var nameInp = ctx.modal.querySelector('#rfe-name');
          if (nameInp) setTimeout(function(){ nameInp.focus(); }, 80);
        },
        actions: [
          { label: 'Annuleren' },
          { label: 'Opslaan', primary: true, onClick: function(ctx) {
            var m = ctx.modal;
            var name = ((m.querySelector('#rfe-name')||{}).value||'').trim();
            if (!name) { toast('Vul een naam in'); return false; }
            var ings = String((m.querySelector('#rfe-ings')||{}).value||'').split('\n').map(function(s){ return s.trim(); }).filter(Boolean);
            if (!ings.length) { toast('Voeg minimaal één ingrediënt toe'); return false; }
            if (r) {
              r.name = name;
              r.cat = (m.querySelector('#rfe-cat')||{}).value || 'Diner';
              r.cuisine = ((m.querySelector('#rfe-cuisine')||{}).value||'').trim();
              r.persons = parseInt((m.querySelector('#rfe-persons')||{}).value,10) || 4;
              r.time = parseInt((m.querySelector('#rfe-time')||{}).value,10) || 30;
              r.ingredients = ings;
              r.steps = String((m.querySelector('#rfe-steps')||{}).value||'').split('\n').map(function(s){ return s.trim(); }).filter(Boolean);
              r.notes = (m.querySelector('#rfe-notes')||{}).value || '';
              persist('updateRecipe');
              toast('Recept opgeslagen ✓');
              setTimeout(function(){ openRecipeDetail(r.id); }, 100);
            } else {
              var newR = {
                id: nextId(),
                name: name,
                cat: (m.querySelector('#rfe-cat')||{}).value || 'Diner',
                cuisine: ((m.querySelector('#rfe-cuisine')||{}).value||'').trim(),
                persons: parseInt((m.querySelector('#rfe-persons')||{}).value,10) || 4,
                time: parseInt((m.querySelector('#rfe-time')||{}).value,10) || 30,
                emoji: CAT_EMOJIS[(m.querySelector('#rfe-cat')||{}).value] || '🍴',
                photo: null, ingredients: ings,
                steps: String((m.querySelector('#rfe-steps')||{}).value||'').split('\n').map(function(s){ return s.trim(); }).filter(Boolean),
                notes: (m.querySelector('#rfe-notes')||{}).value || ''
              };
              recipes().unshift(newR);
              persist('createRecipe');
              xp(4, 'Recept aangemaakt');
              activity('🍳','#fff3dc', (window.myName||'Gezin') + ' maakte recept "' + name + '" aan');
              toast('Recept toegevoegd ✓');
              setTimeout(function(){ openRecipeDetail(newR.id); }, 100);
            }
            renderRecipeGrid();
            return true;
          }}
        ]
      });
      return;
    }
    // Legacy fallback editor
    showView('editor');
    var title = document.getElementById('recipe-editor-title');
    if (title) title.textContent = r ? 'Recept bewerken' : 'Nieuw recept';
    ['re-name','re-cat','re-persons','re-time','re-ingredients','re-steps','re-notes'].forEach(function(elId) {
      var el = document.getElementById(elId);
      if (!el) return;
      if (elId === 're-name')        el.value = r ? r.name : '';
      if (elId === 're-cat')         el.value = r ? r.cat : 'Diner';
      if (elId === 're-persons')     el.value = r ? r.persons : 4;
      if (elId === 're-time')        el.value = r ? r.time : 30;
      if (elId === 're-ingredients') el.value = r ? (r.ingredients||[]).join('\n') : '';
      if (elId === 're-steps')       el.value = r ? (r.steps||[]).join('\n') : '';
      if (elId === 're-notes')       el.value = r ? r.notes||'' : '';
    });
  }

  function saveRecipe() {
    var nameEl = document.getElementById('re-name');
    var name = nameEl ? nameEl.value.trim() : '';
    if (!name) { toast('Vul een naam in'); return; }
    var r = {
      id: state.currentId || nextId(),
      name: name,
      cat: (document.getElementById('re-cat') || {}).value || 'Diner',
      persons: parseInt((document.getElementById('re-persons')||{}).value) || 4,
      time: parseInt((document.getElementById('re-time')||{}).value) || 30,
      ingredients: ((document.getElementById('re-ingredients')||{}).value||'').split('\n').map(function(s){ return s.trim(); }).filter(Boolean),
      steps: ((document.getElementById('re-steps')||{}).value||'').split('\n').map(function(s){ return s.trim(); }).filter(Boolean),
      notes: (document.getElementById('re-notes')||{}).value || '',
      photo: null
    };
    if (state.currentId) {
      var idx = recipes().findIndex(function(x){ return Number(x.id) === Number(state.currentId); });
      if (idx > -1) { r.photo = recipes()[idx].photo; recipes()[idx] = r; }
    } else {
      recipes().unshift(r);
      xp(4, 'Recept aangemaakt');
    }
    persist('saveRecipe');
    toast('Recept opgeslagen ✓');
    openRecipeDetail(r.id);
  }

  function closeRecipeEditor() {
    if (state.currentId) openRecipeDetail(state.currentId);
    else showView('list');
  }

  // ── SHOP ─────────────────────────────────────────────────

  function addRecipeToShop(id) {
    var r = recipes().find(function(x){ return Number(x.id) === Number(id); });
    if (!r) return;
    var added = 0;
    (r.ingredients||[]).forEach(function(ing) {
      var match = ing.match(/^([\d\/]+\s*(?:g|kg|ml|l|el|tl|stuk|stuks|blik|teen|teentjes|snuf|takje|tak)?\s+)/i);
      var qty  = match ? match[1].trim() : '1x';
      var name = match ? ing.substring(match[0].length).trim() : ing;
      var exists = Array.isArray(window.shopData) && window.shopData.some(function(s){ return norm(s.name) === norm(name) && !s.done; });
      if (!exists) {
        if (!Array.isArray(window.shopData)) window.shopData = [];
        window.shopData.unshift({ id: ((window.shopNextId||0) + added + 1), name:name, qty:qty, cat:'Overig', who:window.myName||'', done:false, photo:null });
        added++;
      }
    });
    if (window.shopNextId != null) window.shopNextId += added;
    if (typeof window.updateStats === 'function') window.updateStats();
    activity('🛒','#fff3dc', (window.myName||'Gezin') + ' voegde '+added+' ingrediënten toe van "'+r.name+'"');
    xp(2, 'Recept naar lijst');
    toast(added + ' ingrediënten toegevoegd aan boodschappen ✓');
  }

  // ── IMPORT ────────────────────────────────────────────────

  function openRecipeImport() {
    showView('import');
    var status = document.getElementById('recipe-import-status');
    var urlInp = document.getElementById('recipe-url-inp');
    if (status) status.textContent = '';
    if (urlInp) urlInp.value = '';
  }

  function closeRecipeImport() { showView('list'); renderRecipeGrid(); }

  function importRecipeFromUrl() {
    if (typeof window.checkApiKey === 'function' && !window.checkApiKey()) return;
    var url = ((document.getElementById('recipe-url-inp')||{}).value||'').trim();
    if (!url) { toast('Vul een URL in'); return; }
    var statusEl = document.getElementById('recipe-import-status');
    if (statusEl) statusEl.innerHTML = '<div style="display:flex;gap:6px;justify-content:center;align-items:center"><div class="ai-typing-dot"></div><div class="ai-typing-dot"></div><div class="ai-typing-dot"></div></div><div style="margin-top:6px">Recept ophalen via AI...</div>';
    var prompt = 'Analyseer deze recepten URL en geef het recept als JSON terug. URL: '+url+'\n\n'
      + 'Als je de pagina niet kan ophalen, maak dan een plausibel recept op basis van de URL naam.\n\n'
      + 'JSON formaat (ALLEEN JSON, geen markdown, geen uitleg):\n'
      + '{"name":"...","cat":"Diner","cuisine":"...","persons":4,"time":30,'
      + '"ingredients":["500g gehakt","2 uien"],'
      + '"steps":["Stap 1...","Stap 2..."],'
      + '"notes":"...",'
      + '"photo":"https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=85"}\n\n'
      + 'Categorieën: Ontbijt, Lunch, Diner, Snack, Dessert, Bakken';
    if (typeof window.callGemini === 'function') {
      window.callGemini(prompt, null, 1200).then(function(text) {
        var clean = text.replace(/```json|```/g,'').trim();
        try {
          var recipe = JSON.parse(clean);
          recipe.id = nextId();
          if (!recipe.name) throw new Error('no name');
          recipes().unshift(recipe);
          persist('importRecipe');
          showView('list');
          renderRecipeGrid();
          toast('Recept "'+recipe.name+'" geïmporteerd! 🍳');
          xp(5, 'Recept geïmporteerd');
          setTimeout(function(){ openRecipeDetail(recipe.id); }, 300);
        } catch(e) {
          if (statusEl) statusEl.textContent = '❌ Kon recept niet verwerken. Probeer een ander adres of voeg handmatig toe.';
        }
      }).catch(function() {
        if (statusEl) statusEl.textContent = '❌ Verbindingsfout. Controleer je internetverbinding.';
      });
    }
  }

  // ── STORAGE LOAD ─────────────────────────────────────────

  function loadFromStorage() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length) setRecipes(parsed);
      }
    } catch(e) {}
  }

  // ── GLOBALS ───────────────────────────────────────────────

  window.renderRecipes        = renderRecipes;
  window.renderRecipeGrid     = renderRecipeGrid;
  window.openRecipeDetail     = openRecipeDetail;
  window.closeRecipeDetail    = closeRecipeDetail;
  window.openRecipeEditor     = openRecipeEditor;
  window.openRecipeEditSheet  = openRecipeEditor;
  window.saveRecipe           = saveRecipe;
  window.closeRecipeEditor    = closeRecipeEditor;
  window.openRecipeImport     = openRecipeImport;
  window.closeRecipeImport    = closeRecipeImport;
  window.importRecipeFromUrl  = importRecipeFromUrl;
  window.openRecipePhotoSheet = openRecipePhotoSheet;
  window.addRecipeToShop      = addRecipeToShop;
  window.deleteRecipeManaged  = deleteRecipe;
  window.CAT_EMOJIS           = CAT_EMOJIS;
  window.recipesData          = window.recipesData || [];
  window.recipeNextId         = 1;
  window.currentRecipeId      = null;
  window.checkedIngredients   = state.checkedIngredients;
  window.checkedRecipeSteps   = state.checkedSteps;

  try {
    renderRecipes       = renderRecipes;
    renderRecipeGrid    = renderRecipeGrid;
    openRecipeDetail    = openRecipeDetail;
    saveRecipe          = saveRecipe;
    closeRecipeEditor   = closeRecipeEditor;
    openRecipeImport    = openRecipeImport;
    closeRecipeImport   = closeRecipeImport;
    importRecipeFromUrl = importRecipeFromUrl;
    addRecipeToShop     = addRecipeToShop;
  } catch(e) {}

  // ── BOOT ─────────────────────────────────────────────────

  function boot() {
    injectStyles();
    loadFromStorage();
    runSeed();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

})();
