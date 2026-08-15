'use strict';
// ============================================================
// GROCERY PRODUCT CLASSIFIER v1
// Centrale, uitbreidbare productherkenning voor boodschappen.
// Levert categorie, icoon en logische standaardhoeveelheid.
// ============================================================
(function(){
  var VERSION = '1.0.0';

  function normalize(value){
    return String(value || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function rule(category, icon, qty, words){
    return { category:category, icon:icon, qty:qty, words:words };
  }

  // Specifieke regels staan voor algemene regels. Nieuwe producten kunnen hier
  // zonder wijzigingen aan de modal/UI aan worden toegevoegd.
  var RULES = [
    // Zuivel / gekoeld
    rule('Zuivel','🥛','1 l',['melk','karnemelk','chocolademelk','havermelk','amandelmelk','sojamelk']),
    rule('Zuivel','🥣','500 g',['yoghurt','kwark','skyr','vla']),
    rule('Zuivel','🧀','200 g',['kaas','cheddar','mozzarella','parmezaan','feta']),
    rule('Zuivel','🧈','250 g',['boter','margarine']),
    rule('Zuivel','🥚','6 st',['ei','eieren']),
    rule('Zuivel','🥛','250 ml',['room','slagroom','kookroom','creme fraiche']),

    // Brood / ontbijt
    rule('Brood','🍞','1 st',['brood','volkorenbrood','witbrood','bruinbrood','stokbrood','baguette']),
    rule('Brood','🥐','4 st',['croissant','croissants','bolletje','bolletjes','pistolet','pistolets']),
    rule('Ontbijt','🥣','500 g',['muesli','granola','havermout','cornflakes','ontbijtgranen']),

    // Groente
    rule('Groente','🥔','1 kg',['aardappel','aardappelen','krieltjes']),
    rule('Groente','🍅','500 g',['tomaat','tomaten','cherrytomaat']),
    rule('Groente','🥦','500 g',['broccoli','bloemkool']),
    rule('Groente','🥕','500 g',['wortel','wortels','winterpeen']),
    rule('Groente','🧅','500 g',['ui','uien','sjalot']),
    rule('Groente','🧄','1 st',['knoflook']),
    rule('Groente','🥒','1 st',['komkommer','courgette']),
    rule('Groente','🫑','3 st',['paprika','paprikas']),
    rule('Groente','🥬','1 st',['sla','spinazie','andijvie','boerenkool']),
    rule('Groente','🍄','250 g',['champignon','champignons','paddenstoel','paddenstoelen']),

    // Fruit
    rule('Fruit','🍌','6 st',['banaan','bananen']),
    rule('Fruit','🍎','1 kg',['appel','appels']),
    rule('Fruit','🍐','1 kg',['peer','peren']),
    rule('Fruit','🍊','1 kg',['sinaasappel','sinaasappels','mandarijn','mandarijnen']),
    rule('Fruit','🍇','500 g',['druif','druiven']),
    rule('Fruit','🍓','400 g',['aardbei','aardbeien']),
    rule('Fruit','🫐','250 g',['blauwe bes','blauwe bessen','bosbes','bosbessen']),
    rule('Fruit','🥝','4 st',['kiwi','kiwis']),
    rule('Fruit','🍋','2 st',['citroen','citroenen','limoen','limoenen']),
    rule('Fruit','🍉','1 st',['watermeloen','meloen']),

    // Vlees / vis / vega
    rule('Vlees','🍗','500 g',['kip','kipfilet','kipdij','kipdijen','drumstick']),
    rule('Vlees','🥩','500 g',['gehakt','rund','rundvlees','biefstuk','steak']),
    rule('Vlees','🥓','250 g',['spek','bacon']),
    rule('Vlees','🌭','1 pak',['worst','worsten','knakworst']),
    rule('Vis','🐟','500 g',['vis','zalm','kabeljauw','tonijn','pangasius']),
    rule('Vega','🌱','1 pak',['tofu','tempeh','vega','vegetarisch','vleesvervanger']),

    // Droge voorraad / koken
    rule('Voorraad','🍝','500 g',['pasta','spaghetti','macaroni','penne','fusilli','tagliatelle']),
    rule('Voorraad','🍚','1 kg',['rijst','basmati','jasmijnrijst']),
    rule('Voorraad','🥫','1 st',['blik','tomatenblokjes','bonen','kidneybonen','kikkererwten','mais']),
    rule('Voorraad','🫘','500 g',['linzen','droge bonen']),
    rule('Voorraad','🧂','1 st',['zout','peper','kruiden','paprikapoeder','kerrie','komijn']),
    rule('Voorraad','🫒','500 ml',['olijfolie','olie','zonnebloemolie']),
    rule('Voorraad','🍯','1 st',['honing','stroop']),
    rule('Voorraad','🍬','1 kg',['suiker']),
    rule('Voorraad','🌾','1 kg',['bloem','meel']),

    // Dranken
    rule('Dranken','💧','1.5 l',['water','mineraalwater','spa']),
    rule('Dranken','🥤','1.5 l',['cola','sinas','frisdrank','limonade']),
    rule('Dranken','🧃','1 l',['sap','appelsap','sinaasappelsap','vruchtensap']),
    rule('Dranken','☕','500 g',['koffie','koffiebonen']),
    rule('Dranken','🫖','1 pak',['thee','theezakjes']),

    // Snacks
    rule('Snacks','🍫','1 st',['chocolade','chocoladereep']),
    rule('Snacks','🍪','1 pak',['koek','koekjes','biscuit']),
    rule('Snacks','🍿','1 zak',['chips','popcorn','nootjes','noten']),
    rule('Snacks','🍬','1 zak',['snoep','winegums','drop']),

    // Diepvries
    rule('Diepvries','🧊','1 zak',['diepvries','vries','friet','patat','diepvriesgroente','diepvriesfruit']),
    rule('Diepvries','🍕','1 st',['diepvriespizza','pizza']),
    rule('Diepvries','🍨','1 bak',['ijs','roomijs']),

    // Huishouden
    rule('Huishouden','🧻','1 pak',['toiletpapier','wc papier','keukenpapier','tissues']),
    rule('Huishouden','🧴','1 flacon',['afwasmiddel','wasmiddel','wasverzachter','allesreiniger','schoonmaakmiddel']),
    rule('Huishouden','🧽','1 pak',['spons','sponzen','doekjes','microvezeldoek']),
    rule('Huishouden','🗑️','1 rol',['vuilniszak','vuilniszakken','afvalzak','afvalzakken']),
    rule('Huishouden','💡','1 st',['lamp','lampje','led lamp','ledlamp']),
    rule('Huishouden','🔋','1 pak',['batterij','batterijen']),

    // Persoonlijke verzorging
    rule('Verzorging','🧴','1 st',['shampoo','conditioner','douchegel','bodywash','deodorant']),
    rule('Verzorging','🪥','1 st',['tandenborstel','tandpasta','mondwater']),
    rule('Verzorging','🧼','1 st',['zeep','handzeep']),
    rule('Verzorging','🪒','1 pak',['scheermes','scheermesjes','scheerschuim']),

    // Baby
    rule('Baby','🍼','1 pak',['babyvoeding','flesvoeding','melkpoeder']),
    rule('Baby','👶','1 pak',['luier','luiers','billendoekjes']),

    // Huisdieren
    rule('Huisdieren','🐕','1 zak',['hondenvoer','hondenbrokken','hondensnacks']),
    rule('Huisdieren','🐈','1 zak',['kattenvoer','kattenbrokken','kattensnoep']),
    rule('Huisdieren','🐾','1 st',['kattenbakvulling','halsband','dierenvoer']),

    // Elektronica / non-food
    rule('Elektronica','📺','1 st',['tv','televisie','smart tv','monitor']),
    rule('Elektronica','💻','1 st',['laptop','computer','pc','macbook','chromebook']),
    rule('Elektronica','📱','1 st',['telefoon','smartphone','iphone','android telefoon']),
    rule('Elektronica','⌨️','1 st',['toetsenbord','keyboard']),
    rule('Elektronica','🖱️','1 st',['muis','computermuis']),
    rule('Elektronica','🎧','1 st',['koptelefoon','headset','oordopjes','airpods']),
    rule('Elektronica','🔌','1 st',['oplader','adapter','stekker','usb kabel','usb-c kabel','hdmi kabel','kabel']),
    rule('Elektronica','🎮','1 st',['controller','gamepad','spelcomputer','playstation','xbox','nintendo switch']),
    rule('Elektronica','📷','1 st',['camera','fotocamera','webcam']),
    rule('Elektronica','🔊','1 st',['speaker','bluetooth speaker','soundbar']),
    rule('Elektronica','⌚','1 st',['smartwatch','horloge','apple watch']),

    // Wonen / grotere winkelitems
    rule('Wonen','🛋️','1 st',['bank','bankstel','sofa']),
    rule('Wonen','🪑','1 st',['stoel','stoelen','bureaustoel']),
    rule('Wonen','🛏️','1 st',['bed','matras']),
    rule('Wonen','🪴','1 st',['plant','kamerplant']),
    rule('Wonen','🧺','1 st',['wasmand','mand']),

    // Algemeen verpakkingsgedrag
    rule('Dranken','🥤','1 l',['drank']),
    rule('Voorraad','📦','1 pak',['pak']),
    rule('Overig','📦','1 st',['stuk','stuks'])
  ];

  function matches(text, keyword){
    if(!text || !keyword) return false;
    var word = normalize(keyword);
    if(!word) return false;
    if(word.indexOf(' ') >= 0) return text.indexOf(word) >= 0;
    return new RegExp('(^|\\s|-)'+word.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'($|\\s|-)', 'i').test(text);
  }

  function classify(name){
    var text = normalize(name);
    if(!text) return { category:'Overig', icon:'📦', qty:'1 st', confidence:0, matched:null };

    for(var i=0;i<RULES.length;i++){
      var current = RULES[i];
      for(var j=0;j<current.words.length;j++){
        if(matches(text,current.words[j])){
          return {
            category:current.category,
            icon:current.icon,
            qty:current.qty,
            confidence:1,
            matched:current.words[j]
          };
        }
      }
    }

    // Voor samengestelde onbekende namen nog een paar generieke eenheids-signalen.
    if(/sap|melk|water|olie|saus|drank/.test(text)) return {category:'Dranken',icon:'🥤',qty:'1 l',confidence:.35,matched:'liquid-signal'};
    if(/poeder|meel|rijst|pasta|granen|noten/.test(text)) return {category:'Voorraad',icon:'📦',qty:'500 g',confidence:.35,matched:'weight-signal'};

    return { category:'Overig', icon:'📦', qty:'1 st', confidence:0, matched:null };
  }

  function categories(){
    var seen={};
    RULES.forEach(function(r){seen[r.category]=true;});
    seen.Overig=true;
    return Object.keys(seen);
  }

  window.GroceryProductClassifier={
    version:VERSION,
    classify:classify,
    categories:categories,
    normalize:normalize
  };
})();
