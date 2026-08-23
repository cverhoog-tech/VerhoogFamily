'use strict';
(function(){
  if(window.FamilyAppUtilityIconResolver)return;
  var VERSION='1.4.0';
  var BY_CATEGORY={
    'Zuivel':'utilityDairy','Brood':'utilityBread','Ontbijt':'utilityBread','Groente':'utilityVegetableBasket','Fruit':'utilityFruit',
    'Vlees':'utilityMeat','Vis':'utilityFish','Vega':'utilityVegetable','Voorraad':'utilityPantry','Dranken':'utilityDrinks',
    'Snacks':'utilitySnacks','Diepvries':'utilityFrozen','Huishouden':'utilityHousehold','Verzorging':'utilityCare',
    'Baby':'utilityBaby','Huisdieren':'utilityPet','Elektronica':'utilityElectronics','Wonen':'utilityHome','Reizen':'utilityTravel','Overig':'utilityCategory'
  };
  var BY_EMOJI={
    '🥛':'utilityDairy','🥣':'utilityDairy','🧀':'utilityCheese','🥚':'utilityEggs','🍞':'utilityBread','🥐':'utilityBread',
    '🥔':'utilityPotato','🍅':'utilityTomato','🥦':'utilityBroccoli','🥕':'utilityVegetableBasket','🧅':'utilityVegetableBasket','🧄':'utilityVegetableBasket','🥒':'utilityVegetableBasket','🫑':'utilityVegetableBasket','🥬':'utilityVegetableBasket','🍄':'utilityVegetableBasket','🌱':'utilityVegetableBasket',
    '🍌':'utilityBanana','🍎':'utilityFruit','🍐':'utilityFruit','🍊':'utilityCitrus','🍇':'utilityBerries','🍓':'utilityBerries','🫐':'utilityBerries','🥝':'utilityFruit','🍋':'utilityCitrus','🍉':'utilityFruit',
    '🍗':'utilityChicken','🥩':'utilityMeat','🥓':'utilityMeat','🐟':'utilityFish','🍝':'utilityPasta','🍚':'utilityRice','🥫':'utilityPantry','🫘':'utilityPantry','🫒':'utilityPantry',
    '💧':'utilityDrinks','🥤':'utilitySoda','🧃':'utilityDrinks','☕':'utilityCoffee','🫖':'utilityTea','🍫':'utilitySnacks','🍪':'utilitySnacks','🍿':'utilitySnacks','🧊':'utilityFrozen','🍕':'utilityFrozen','🍨':'utilityFrozen',
    '🧻':'utilityToiletPaper','🧴':'utilityDetergent','🧽':'utilityHousehold','🗑️':'utilityHousehold','🔋':'utilityBattery','👶':'utilityDiapers','🐕':'utilityPet','🐈':'utilityPet','🐾':'utilityPet',
    '📺':'utilityMonitor','💻':'utilityLaptop','📱':'utilityPhone','⌨️':'utilityKeyboard','🖱️':'utilityMouse','🎧':'utilityHeadphones','🔌':'utilityCharger','🎮':'utilityController','📷':'utilityCamera','🔊':'utilitySpeaker','⌚':'utilityWatch',
    '🛋️':'utilitySofa','🪑':'utilityChair','🛏️':'utilityBed','🪴':'utilityPlant','🚗':'utilityCar','🚆':'utilityTrain','✈️':'utilityPlane','🧳':'utilitySuitcase','🛂':'utilityPassport','🎫':'utilityTicket','🏨':'utilityHotel','⛽':'utilityFuel','🅿️':'utilityParking','🚕':'utilityTaxi','🚌':'utilityBus','🚲':'utilityBike','🎒':'utilityBackpack',
    '📦':'utilityCategory','🛒':'utilityShopping'
  };
  function keyFor(category,legacyIcon,name){
    var lex=window.FamilyAppProductLexicon;
    var hit=lex&&typeof lex.match==='function'?lex.match(name):null;
    if((hit&&hit.category==='Groente')||String(category||'')==='Groente')return 'utilityVegetableBasket';
    if(hit&&hit.iconKey)return hit.iconKey;
    return BY_EMOJI[String(legacyIcon||'')]||BY_CATEGORY[String(category||'')]||'utilityCategory';
  }
  function render(category,legacyIcon,opts){
    opts=opts||{};
    var key=keyFor(category,legacyIcon,opts.name);
    var clean=Object.assign({},opts);delete clean.name;
    return window.FamilyAppIconRenderer&&FamilyAppIconRenderer.render?FamilyAppIconRenderer.render(key,Object.assign({label:false,size:'lg',className:'fa-utility-icon'},clean)):'';
  }
  window.FamilyAppUtilityIconResolver={version:VERSION,keyFor:keyFor,render:render,categoryMap:Object.freeze(Object.assign({},BY_CATEGORY))};
})();
