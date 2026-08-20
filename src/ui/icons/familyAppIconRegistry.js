'use strict';
(function(){
  if(window.FamilyAppIconRegistry)return;
  var VERSION='1.2.0';
  var PROGRESSION='src/ui/icons/assets/familyapp-icons-premium.svg';
  var TASKS='src/ui/icons/assets/familyapp-task-icons-premium.svg';
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
    taskQuest:Object.freeze({symbol:'task-quest',label:'Quest',tone:'task',sprite:TASKS,family:'tasks'}),
    taskLaundry:Object.freeze({symbol:'task-laundry',label:'Was',tone:'task',sprite:TASKS,family:'tasks'}),
    taskCleaning:Object.freeze({symbol:'task-cleaning',label:'Schoonmaken',tone:'task',sprite:TASKS,family:'tasks'}),
    taskKitchen:Object.freeze({symbol:'task-kitchen',label:'Keuken',tone:'task',sprite:TASKS,family:'tasks'}),
    taskGroceries:Object.freeze({symbol:'task-groceries',label:'Boodschappen',tone:'task',sprite:TASKS,family:'tasks'}),
    taskPantry:Object.freeze({symbol:'task-pantry',label:'Voorraad',tone:'task',sprite:TASKS,family:'tasks'}),
    taskAdmin:Object.freeze({symbol:'task-admin',label:'Administratie',tone:'task',sprite:TASKS,family:'tasks'}),
    taskFamily:Object.freeze({symbol:'task-family',label:'Gezin',tone:'task',sprite:TASKS,family:'tasks'}),
    taskGarden:Object.freeze({symbol:'task-garden',label:'Tuin',tone:'task',sprite:TASKS,family:'tasks'}),
    taskTravel:Object.freeze({symbol:'task-travel',label:'Reizen',tone:'task',sprite:TASKS,family:'tasks'}),
    taskDropoff:Object.freeze({symbol:'task-dropoff',label:'Wegbrengen',tone:'task',sprite:TASKS,family:'tasks'}),
    taskPickup:Object.freeze({symbol:'task-pickup',label:'Ophalen',tone:'task',sprite:TASKS,family:'tasks'})
  });
  function get(key){var row=ICONS[String(key||'')];return row?Object.freeze(Object.assign({key:String(key)},row)):null;}
  function has(key){return !!ICONS[String(key||'')];}
  window.FamilyAppIconRegistry={version:VERSION,get:get,has:has,keys:function(){return Object.keys(ICONS);}};
})();
