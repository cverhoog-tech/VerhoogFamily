'use strict';
(function(){
  if(window.FamilyAppIconRegistry)return;
  var VERSION='1.4.0';
  var PROGRESSION='src/ui/icons/assets/familyapp-icons-premium.svg';
  var TASKS='src/ui/icons/assets/familyapp-task-icons-premium.svg';
  var TASKS_COMPACT='src/ui/icons/assets/familyapp-task-icons-compact.svg?v=2';
  var UTILITY='src/ui/icons/assets/familyapp-colorful-icons.svg?v=1';
  function task(symbol,label){return Object.freeze({symbol:symbol,label:label,tone:'task',sprite:TASKS,family:'tasks',variants:Object.freeze({compact:Object.freeze({symbol:symbol+'-compact',sprite:TASKS_COMPACT})})});}
  function utility(symbol,label,tone){return Object.freeze({symbol:symbol,label:label,tone:tone||'utility',sprite:UTILITY,family:'utility'});}
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
    utilityShopping:utility('utility-shopping','Boodschappen','utility-purple'),utilityDairy:utility('utility-dairy','Zuivel','utility-blue'),utilityBread:utility('utility-bread','Brood','utility-warm'),utilityFruit:utility('utility-fruit','Fruit','utility-red'),utilityVegetable:utility('utility-vegetable','Groente','utility-green'),utilityMeat:utility('utility-meat','Vlees','utility-red'),utilityFish:utility('utility-fish','Vis','utility-blue'),utilityPantry:utility('utility-pantry','Voorraad','utility-warm'),utilityDrinks:utility('utility-drinks','Dranken','utility-blue'),utilitySnacks:utility('utility-snacks','Snacks','utility-orange'),utilityFrozen:utility('utility-frozen','Diepvries','utility-blue'),utilityHousehold:utility('utility-household','Huishouden','utility-teal'),utilityCare:utility('utility-care','Verzorging','utility-pink'),utilityBaby:utility('utility-baby','Baby','utility-blue'),utilityPet:utility('utility-pet','Huisdieren','utility-warm'),utilityElectronics:utility('utility-electronics','Elektronica','utility-indigo'),utilityHome:utility('utility-home','Wonen','utility-warm'),utilityGeneric:utility('utility-generic','Overig','utility-purple'),utilityRecipe:utility('utility-recipe','Recept','utility-warm'),utilityMeal:utility('utility-meal','Maaltijd','utility-warm'),utilityLunch:utility('utility-lunch','Lunch','utility-green'),utilityDinner:utility('utility-dinner','Diner','utility-warm'),utilityCalendar:utility('utility-calendar','Weekmenu','utility-blue')
  });
  function get(key){var row=ICONS[String(key||'')];return row?Object.freeze(Object.assign({key:String(key)},row)):null;}
  function resolve(key,variant){var row=get(key);if(!row)return null;var v=variant&&row.variants&&row.variants[String(variant)];return v?Object.freeze(Object.assign({},row,{symbol:v.symbol,sprite:v.sprite,variant:String(variant)})):row;}
  function has(key){return !!ICONS[String(key||'')];}
  window.FamilyAppIconRegistry={version:VERSION,get:get,resolve:resolve,has:has,keys:function(){return Object.keys(ICONS);}};
})();
