'use strict';
(function(){
  if(window.FamilyAppIconRegistry)return;
  var VERSION='1.6.0';
  var PROGRESSION='src/ui/icons/assets/familyapp-icons-premium.svg';
  var TASKS='src/ui/icons/assets/familyapp-task-icons-premium.svg';
  var TASKS_COMPACT='src/ui/icons/assets/familyapp-task-icons-compact.svg?v=2';
  var UTILITY='src/ui/icons/assets/familyapp-colorful-icons.svg?v=2';
  var VEGETABLES='src/ui/icons/assets/familyapp-vegetable-basket.svg?v=1';
  function task(symbol,label){return Object.freeze({symbol:symbol,label:label,tone:'task',sprite:TASKS,family:'tasks',variants:Object.freeze({compact:Object.freeze({symbol:symbol+'-compact',sprite:TASKS_COMPACT})})});}
  function utility(symbol,label,tone,sprite){return Object.freeze({symbol:symbol,label:label,tone:tone||'utility',sprite:sprite||UTILITY,family:'utility'});}
  var ICONS=Object.freeze({
    level:Object.freeze({symbol:'fa-level',label:'Level',tone:'purple-gold',sprite:PROGRESSION,family:'progression'}),
    streak:Object.freeze({symbol:'fa-streak',label:'Streak',tone:'fire',sprite:PROGRESSION,family:'progression'}),
    quest:Object.freeze({symbol:'fa-quest',label:'Quest',tone:'purple-gold',sprite:PROGRESSION,family:'progression'}),
    xpWeekly:Object.freeze({symbol:'fa-xp',label:'XP',tone:'arcane',sprite:PROGRESSION,family:'progression'}),
    edit:Object.freeze({symbol:'fa-edit',label:'Bewerken',tone:'purple-gold',sprite:PROGRESSION,family:'progression'}),
    raid:Object.freeze({symbol:'fa-raid',label:'Raid',tone:'purple-gold',sprite:PROGRESSION,family:'progression'}),
    dungeon:Object.freeze({symbol:'fa-dungeon',label:'Dungeon',tone:'purple-gold',sprite:PROGRESSION,family:'progression'}),
    achievement:Object.freeze({symbol:'fa-achievement',label:'Achievement',tone:'gold',sprite:PROGRESSION,family:'progression'}),
    title:Object.freeze({symbol:'fa-title',label:'Titel',tone:'purple-gold',sprite:PROGRESSION,family:'progression'}),

    taskQuest:task('task-quest','Quest'),taskLaundry:task('task-laundry','Was'),taskCleaning:task('task-cleaning','Schoonmaken'),taskKitchen:task('task-kitchen','Keuken'),taskGroceries:task('task-groceries','Boodschappen'),taskPantry:task('task-pantry','Voorraad'),taskAdmin:task('task-admin','Administratie'),taskFamily:task('task-family','Gezin'),taskGarden:task('task-garden','Tuin'),taskTravel:task('task-travel','Reizen'),taskDropoff:task('task-dropoff','Wegbrengen'),taskPickup:task('task-pickup','Ophalen'),

    utilityShopping:utility('utility-shopping','Boodschappen','utility-purple'),
    utilityCart:utility('utility-cart','Winkelwagen','utility-purple'),
    utilityCategory:utility('utility-category','Categorie','utility-purple'),
    utilityDairy:utility('utility-dairy','Zuivel','utility-blue'),
    utilityCheese:utility('utility-cheese','Kaas','utility-warm'),
    utilityEggs:utility('utility-eggs','Eieren','utility-warm'),
    utilityBread:utility('utility-bread','Brood','utility-warm'),
    utilityFruit:utility('utility-fruit','Fruit','utility-red'),
    utilityBanana:utility('utility-banana','Banaan','utility-warm'),
    utilityBerries:utility('utility-berries','Bessen','utility-red'),
    utilityCitrus:utility('utility-citrus','Citrus','utility-orange'),
    utilityVegetable:utility('utility-vegetable','Groente','utility-green'),
    utilityVegetableBasket:utility('utility-vegetable-basket','Groente','utility-green',VEGETABLES),
    utilityTomato:utility('utility-tomato','Tomaat','utility-red'),
    utilityPotato:utility('utility-potato','Aardappel','utility-warm'),
    utilityBroccoli:utility('utility-broccoli','Broccoli','utility-green'),
    utilityMeat:utility('utility-meat','Vlees','utility-red'),
    utilityChicken:utility('utility-chicken','Kip','utility-warm'),
    utilityFish:utility('utility-fish','Vis','utility-blue'),
    utilityPantry:utility('utility-pantry','Voorraad','utility-warm'),
    utilityRice:utility('utility-rice','Rijst','utility-purple'),
    utilityPasta:utility('utility-pasta','Pasta','utility-warm'),
    utilityDrinks:utility('utility-drinks','Dranken','utility-blue'),
    utilitySoda:utility('utility-soda','Frisdrank','utility-red'),
    utilityCoffee:utility('utility-coffee','Koffie','utility-warm'),
    utilityTea:utility('utility-tea','Thee','utility-green'),
    utilitySnacks:utility('utility-snacks','Snacks','utility-orange'),
    utilityFrozen:utility('utility-frozen','Diepvries','utility-blue'),
    utilityHousehold:utility('utility-household','Huishouden','utility-teal'),
    utilityDetergent:utility('utility-detergent','Schoonmaakmiddel','utility-teal'),
    utilityToiletPaper:utility('utility-toiletpaper','Toiletpapier','utility-warm'),
    utilityCare:utility('utility-care','Verzorging','utility-pink'),
    utilityShampoo:utility('utility-shampoo','Shampoo','utility-pink'),
    utilityBaby:utility('utility-baby','Baby','utility-blue'),
    utilityDiapers:utility('utility-diapers','Luiers','utility-blue'),
    utilityPet:utility('utility-pet','Huisdieren','utility-warm'),

    utilityElectronics:utility('utility-electronics','Elektronica','utility-indigo'),
    utilityLaptop:utility('utility-laptop','Laptop','utility-indigo'),
    utilityPhone:utility('utility-phone','Telefoon','utility-indigo'),
    utilityMonitor:utility('utility-monitor','Monitor','utility-indigo'),
    utilityKeyboard:utility('utility-keyboard','Toetsenbord','utility-indigo'),
    utilityMouse:utility('utility-mouse','Muis','utility-indigo'),
    utilityHeadphones:utility('utility-headphones','Koptelefoon','utility-indigo'),
    utilityCharger:utility('utility-charger','Oplader','utility-purple'),
    utilityCable:utility('utility-cable','Kabel','utility-purple'),
    utilityBattery:utility('utility-battery','Batterij','utility-green'),
    utilityController:utility('utility-controller','Controller','utility-purple'),
    utilityCamera:utility('utility-camera','Camera','utility-indigo'),
    utilitySpeaker:utility('utility-speaker','Speaker','utility-indigo'),
    utilityWatch:utility('utility-watch','Smartwatch','utility-indigo'),

    utilityHome:utility('utility-home','Wonen','utility-warm'),
    utilitySofa:utility('utility-sofa','Bank','utility-warm'),
    utilityChair:utility('utility-chair','Stoel','utility-warm'),
    utilityBed:utility('utility-bed','Bed','utility-purple'),
    utilityPlant:utility('utility-plant','Plant','utility-green'),

    utilityTravel:utility('utility-travel','Reizen','utility-purple'),
    utilityCar:utility('utility-car','Auto','utility-red'),
    utilityTrain:utility('utility-train','Trein','utility-indigo'),
    utilityPlane:utility('utility-plane','Vliegtuig','utility-indigo'),
    utilitySuitcase:utility('utility-suitcase','Koffer','utility-warm'),
    utilityPassport:utility('utility-passport','Paspoort','utility-purple'),
    utilityTicket:utility('utility-ticket','Ticket','utility-warm'),
    utilityHotel:utility('utility-hotel','Hotel','utility-purple'),
    utilityFuel:utility('utility-fuel','Brandstof','utility-red'),
    utilityParking:utility('utility-parking','Parkeren','utility-blue'),
    utilityTaxi:utility('utility-taxi','Taxi','utility-warm'),
    utilityBus:utility('utility-bus','Bus','utility-warm'),
    utilityBike:utility('utility-bike','Fiets','utility-purple'),
    utilityBackpack:utility('utility-backpack','Rugzak','utility-purple'),

    utilityGeneric:utility('utility-generic','Overig','utility-purple'),
    utilityRecipe:utility('utility-recipe','Recept','utility-warm'),
    utilityMeal:utility('utility-meal','Maaltijd','utility-warm'),
    utilityLunch:utility('utility-lunch','Lunch','utility-green'),
    utilityDinner:utility('utility-dinner','Diner','utility-warm'),
    utilityCalendar:utility('utility-calendar','Weekmenu','utility-blue')
  });
  function get(key){var row=ICONS[String(key||'')];return row?Object.freeze(Object.assign({key:String(key)},row)):null;}
  function resolve(key,variant){var row=get(key);if(!row)return null;var v=variant&&row.variants&&row.variants[String(variant)];return v?Object.freeze(Object.assign({},row,{symbol:v.symbol,sprite:v.sprite,variant:String(variant)})):row;}
  function has(key){return !!ICONS[String(key||'')];}
  window.FamilyAppIconRegistry={version:VERSION,get:get,resolve:resolve,has:has,keys:function(){return Object.keys(ICONS);}};
})();
