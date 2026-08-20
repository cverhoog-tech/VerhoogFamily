'use strict';
(function(){
  if(window.FamilyAppUtilityIconResolver)return;
  var VERSION='1.0.0';
  var BY_CATEGORY={
    'Zuivel':'utilityDairy','Brood':'utilityBread','Ontbijt':'utilityBread','Groente':'utilityVegetable','Fruit':'utilityFruit',
    'Vlees':'utilityMeat','Vis':'utilityFish','Vega':'utilityVegetable','Voorraad':'utilityPantry','Dranken':'utilityDrinks',
    'Snacks':'utilitySnacks','Diepvries':'utilityFrozen','Huishouden':'utilityHousehold','Verzorging':'utilityCare',
    'Baby':'utilityBaby','Huisdieren':'utilityPet','Elektronica':'utilityElectronics','Wonen':'utilityHome','Overig':'utilityGeneric'
  };
  var BY_EMOJI={
    '🥛':'utilityDairy','🥣':'utilityDairy','🧀':'utilityDairy','🧈':'utilityDairy','🥚':'utilityDairy',
    '🍞':'utilityBread','🥐':'utilityBread','🥔':'utilityVegetable','🍅':'utilityVegetable','🥦':'utilityVegetable','🥕':'utilityVegetable','🧅':'utilityVegetable','🧄':'utilityVegetable','🥒':'utilityVegetable','🫑':'utilityVegetable','🥬':'utilityVegetable','🍄':'utilityVegetable',
    '🍌':'utilityFruit','🍎':'utilityFruit','🍐':'utilityFruit','🍊':'utilityFruit','🍇':'utilityFruit','🍓':'utilityFruit','🫐':'utilityFruit','🥝':'utilityFruit','🍋':'utilityFruit','🍉':'utilityFruit',
    '🍗':'utilityMeat','🥩':'utilityMeat','🥓':'utilityMeat','🌭':'utilityMeat','🐟':'utilityFish','🌱':'utilityVegetable',
    '🍝':'utilityPantry','🍚':'utilityPantry','🥫':'utilityPantry','🫘':'utilityPantry','🧂':'utilityPantry','🫒':'utilityPantry','🍯':'utilityPantry','🍬':'utilitySnacks','🌾':'utilityPantry',
    '💧':'utilityDrinks','🥤':'utilityDrinks','🧃':'utilityDrinks','☕':'utilityDrinks','🫖':'utilityDrinks',
    '🍫':'utilitySnacks','🍪':'utilitySnacks','🍿':'utilitySnacks','🧊':'utilityFrozen','🍕':'utilityFrozen','🍨':'utilityFrozen',
    '🧻':'utilityHousehold','🧴':'utilityHousehold','🧽':'utilityHousehold','🗑️':'utilityHousehold','💡':'utilityHousehold','🔋':'utilityElectronics',
    '🪥':'utilityCare','🧼':'utilityCare','🪒':'utilityCare','🍼':'utilityBaby','👶':'utilityBaby','🐕':'utilityPet','🐈':'utilityPet','🐾':'utilityPet',
    '📺':'utilityElectronics','💻':'utilityElectronics','📱':'utilityElectronics','⌨️':'utilityElectronics','🖱️':'utilityElectronics','🎧':'utilityElectronics','🔌':'utilityElectronics','🎮':'utilityElectronics','📷':'utilityElectronics','🔊':'utilityElectronics','⌚':'utilityElectronics',
    '🛋️':'utilityHome','🪑':'utilityHome','🛏️':'utilityHome','🪴':'utilityHome','🧺':'utilityHome','📦':'utilityGeneric','🛒':'utilityShopping'
  };
  function keyFor(category,legacyIcon){return BY_EMOJI[String(legacyIcon||'')]||BY_CATEGORY[String(category||'')]||'utilityGeneric';}
  function render(category,legacyIcon,opts){var key=keyFor(category,legacyIcon);return window.FamilyAppIconRenderer&&FamilyAppIconRenderer.render?FamilyAppIconRenderer.render(key,Object.assign({label:false,size:'lg',className:'fa-utility-icon'},opts||{})):'';}
  window.FamilyAppUtilityIconResolver={version:VERSION,keyFor:keyFor,render:render,categoryMap:Object.freeze(Object.assign({},BY_CATEGORY))};
})();
