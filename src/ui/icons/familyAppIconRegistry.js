'use strict';
(function(){
  if(window.FamilyAppIconRegistry)return;
  var VERSION='1.3.1';
  var PROGRESSION='src/ui/icons/assets/familyapp-icons-premium.svg';
  var TASKS='src/ui/icons/assets/familyapp-task-icons-premium.svg';
  var TASKS_COMPACT='src/ui/icons/assets/familyapp-task-icons-compact.svg?v=2';
  function task(symbol,label){return Object.freeze({symbol:symbol,label:label,tone:'task',sprite:TASKS,family:'tasks',variants:Object.freeze({compact:Object.freeze({symbol:symbol+'-compact',sprite:TASKS_COMPACT})})});}
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
    taskQuest:task('task-quest','Quest'),
    taskLaundry:task('task-laundry','Was'),
    taskCleaning:task('task-cleaning','Schoonmaken'),
    taskKitchen:task('task-kitchen','Keuken'),
    taskGroceries:task('task-groceries','Boodschappen'),
    taskPantry:task('task-pantry','Voorraad'),
    taskAdmin:task('task-admin','Administratie'),
    taskFamily:task('task-family','Gezin'),
    taskGarden:task('task-garden','Tuin'),
    taskTravel:task('task-travel','Reizen'),
    taskDropoff:task('task-dropoff','Wegbrengen'),
    taskPickup:task('task-pickup','Ophalen')
  });
  function get(key){var row=ICONS[String(key||'')];return row?Object.freeze(Object.assign({key:String(key)},row)):null;}
  function resolve(key,variant){
    var row=get(key);if(!row)return null;
    var v=variant&&row.variants&&row.variants[String(variant)];
    return v?Object.freeze(Object.assign({},row,{symbol:v.symbol,sprite:v.sprite,variant:String(variant)})):row;
  }
  function has(key){return !!ICONS[String(key||'')];}
  window.FamilyAppIconRegistry={version:VERSION,get:get,resolve:resolve,has:has,keys:function(){return Object.keys(ICONS);}};
})();
