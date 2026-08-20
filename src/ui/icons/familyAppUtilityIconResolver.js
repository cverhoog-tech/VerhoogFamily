'use strict';
(function(){
  if(window.FamilyAppUtilityIconResolver)return;
  var VERSION='1.1.0';
  var BY_CATEGORY={
    'Zuivel':'utilityDairy','Brood':'utilityBread','Ontbijt':'utilityBread','Groente':'utilityVegetable','Fruit':'utilityFruit',
    'Vlees':'utilityMeat','Vis':'utilityFish','Vega':'utilityVegetable','Voorraad':'utilityPantry','Dranken':'utilityDrinks',
    'Snacks':'utilitySnacks','Diepvries':'utilityFrozen','Huishouden':'utilityHousehold','Verzorging':'utilityCare',
    'Baby':'utilityBaby','Huisdieren':'utilityPet','Elektronica':'utilityElectronics','Wonen':'utilityHome','Reizen':'utilityTravel','Overig':'utilityGeneric'
  };
  var BY_EMOJI={
    '🥛':'utilityDairy','🥣':'utilityDairy','🧀':'utilityCheese','🧈':'utilityDairy','🥚':'utilityEggs',
    '🍞':'utilityBread','🥐':'utilityBread','🥔':'utilityPotato','🍅':'utilityTomato','🥦':'utilityBroccoli','🥕':'utilityVegetable','🧅':'utilityVegetable','🧄':'utilityVegetable','🥒':'utilityVegetable','🫑':'utilityVegetable','🥬':'utilityVegetable','🍄':'utilityVegetable',
    '🍌':'utilityBanana','🍎':'utilityFruit','🍐':'utilityFruit','🍊':'utilityCitrus','🍇':'utilityBerries','🍓':'utilityBerries','🫐':'utilityBerries','🥝':'utilityFruit','🍋':'utilityCitrus','🍉':'utilityFruit',
    '🍗':'utilityChicken','🥩':'utilityMeat','🥓':'utilityMeat','🌭':'utilityMeat','🐟':'utilityFish','🌱':'utilityVegetable',
    '🍝':'utilityPasta','🍚':'utilityRice','🥫':'utilityPantry','🫘':'utilityPantry','🧂':'utilityPantry','🫒':'utilityPantry','🍯':'utilityPantry','🍬':'utilitySnacks','🌾':'utilityPantry',
    '💧':'utilityDrinks','🥤':'utilitySoda','🧃':'utilityDrinks','☕':'utilityCoffee','🫖':'utilityTea',
    '🍫':'utilitySnacks','🍪':'utilitySnacks','🍿':'utilitySnacks','🧊':'utilityFrozen','🍕':'utilityFrozen','🍨':'utilityFrozen',
    '🧻':'utilityToiletPaper','🧴':'utilityDetergent','🧽':'utilityHousehold','🗑️':'utilityHousehold','💡':'utilityHousehold','🔋':'utilityBattery',
    '🪥':'utilityCare','🧼':'utilityCare','🪒':'utilityCare','🍼':'utilityBaby','👶':'utilityDiapers','🐕':'utilityPet','🐈':'utilityPet','🐾':'utilityPet',
    '📺':'utilityMonitor','💻':'utilityLaptop','📱':'utilityPhone','⌨️':'utilityKeyboard','🖱️':'utilityMouse','🎧':'utilityHeadphones','🔌':'utilityCharger','🎮':'utilityController','📷':'utilityCamera','🔊':'utilitySpeaker','⌚':'utilityWatch',
    '🛋️':'utilitySofa','🪑':'utilityChair','🛏️':'utilityBed','🪴':'utilityPlant','🧺':'utilityHome',
    '🚗':'utilityCar','🚆':'utilityTrain','✈️':'utilityPlane','🧳':'utilitySuitcase','🛂':'utilityPassport','🎫':'utilityTicket','🏨':'utilityHotel','⛽':'utilityFuel','🅿️':'utilityParking','🚕':'utilityTaxi','🚌':'utilityBus','🚲':'utilityBike','🎒':'utilityBackpack',
    '📦':'utilityGeneric','🛒':'utilityShopping'
  };
  var NAME_RULES=[
    [/\b(melk|karnemelk|chocolademelk|havermelk|amandelmelk|sojamelk)\b/,'utilityDairy'],
    [/\b(kaas|cheddar|mozzarella|parmezaan|feta)\b/,'utilityCheese'],[/\b(ei|eieren)\b/,'utilityEggs'],[/\b(brood|stokbrood|baguette|croissant)\b/,'utilityBread'],
    [/\b(aardappel|aardappelen|krieltjes)\b/,'utilityPotato'],[/\b(tomaat|tomaten|cherrytomaat)\b/,'utilityTomato'],[/\b(broccoli|bloemkool)\b/,'utilityBroccoli'],
    [/\b(banaan|bananen)\b/,'utilityBanana'],[/\b(aardbei|aardbeien|bosbes|bosbessen|blauwe bes|druif|druiven)\b/,'utilityBerries'],[/\b(sinaasappel|mandarijn|citroen|limoen)\b/,'utilityCitrus'],
    [/\b(kip|kipfilet|kipdij|drumstick)\b/,'utilityChicken'],[/\b(zalm|vis|kabeljauw|tonijn)\b/,'utilityFish'],[/\b(pasta|spaghetti|macaroni|penne|fusilli|tagliatelle)\b/,'utilityPasta'],[/\b(rijst|basmati|jasmijnrijst)\b/,'utilityRice'],
    [/\b(cola|sinas|frisdrank|limonade)\b/,'utilitySoda'],[/\b(koffie|koffiebonen)\b/,'utilityCoffee'],[/\b(thee|theezakjes)\b/,'utilityTea'],
    [/\b(toiletpapier|wc papier|keukenpapier|tissues)\b/,'utilityToiletPaper'],[/\b(afwasmiddel|wasmiddel|wasverzachter|allesreiniger|schoonmaakmiddel)\b/,'utilityDetergent'],[/\b(shampoo|conditioner|douchegel|bodywash)\b/,'utilityShampoo'],[/\b(luier|luiers|billendoekjes)\b/,'utilityDiapers'],
    [/\b(laptop|macbook|chromebook|notebook)\b/,'utilityLaptop'],[/\b(telefoon|smartphone|iphone|android telefoon)\b/,'utilityPhone'],[/\b(monitor|beeldscherm|display)\b/,'utilityMonitor'],[/\b(toetsenbord|keyboard)\b/,'utilityKeyboard'],[/\b(computermuis|muis)\b/,'utilityMouse'],[/\b(koptelefoon|headset|oordopjes|airpods)\b/,'utilityHeadphones'],[/\b(oplader|adapter|charger|stekker)\b/,'utilityCharger'],[/\b(usb kabel|usb-c kabel|hdmi kabel|lightning kabel|kabel)\b/,'utilityCable'],[/\b(batterij|batterijen|powerbank)\b/,'utilityBattery'],[/\b(controller|gamepad|playstation|xbox|nintendo switch)\b/,'utilityController'],[/\b(camera|fotocamera|webcam)\b/,'utilityCamera'],[/\b(speaker|bluetooth speaker|soundbar)\b/,'utilitySpeaker'],[/\b(smartwatch|apple watch|horloge)\b/,'utilityWatch'],
    [/\b(bankstel|bank|sofa)\b/,'utilitySofa'],[/\b(bureaustoel|stoel|stoelen)\b/,'utilityChair'],[/\b(matras|bed)\b/,'utilityBed'],[/\b(kamerplant|plant)\b/,'utilityPlant'],
    [/\b(auto|wagen|huurauto)\b/,'utilityCar'],[/\b(trein|treinkaart|treinkaartje)\b/,'utilityTrain'],[/\b(vliegtuig|vlucht|vliegticket|boarding pass)\b/,'utilityPlane'],[/\b(koffer|trolley|bagage)\b/,'utilitySuitcase'],[/\b(paspoort|reisdocument)\b/,'utilityPassport'],[/\b(ticket|kaartje|toegangsbewijs)\b/,'utilityTicket'],[/\b(hotel|overnachting|accommodatie)\b/,'utilityHotel'],[/\b(benzine|diesel|brandstof|tanken)\b/,'utilityFuel'],[/\b(parkeren|parking|parkeerticket)\b/,'utilityParking'],[/\b(taxi|uber)\b/,'utilityTaxi'],[/\b(bus|buskaart)\b/,'utilityBus'],[/\b(fiets|e-bike|ebike)\b/,'utilityBike'],[/\b(rugzak|backpack)\b/,'utilityBackpack']
  ];
  function normalize(v){return String(v||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9\s-]/g,' ').replace(/\s+/g,' ').trim();}
  function keyFor(category,legacyIcon,name){var text=normalize(name);if(text){for(var i=0;i<NAME_RULES.length;i++){if(NAME_RULES[i][0].test(text))return NAME_RULES[i][1];}}return BY_EMOJI[String(legacyIcon||'')]||BY_CATEGORY[String(category||'')]||'utilityGeneric';}
  function render(category,legacyIcon,opts){opts=opts||{};var key=keyFor(category,legacyIcon,opts.name);var clean=Object.assign({},opts);delete clean.name;return window.FamilyAppIconRenderer&&FamilyAppIconRenderer.render?FamilyAppIconRenderer.render(key,Object.assign({label:false,size:'lg',className:'fa-utility-icon'},clean)):'';}
  window.FamilyAppUtilityIconResolver={version:VERSION,keyFor:keyFor,render:render,categoryMap:Object.freeze(Object.assign({},BY_CATEGORY))};
})();
