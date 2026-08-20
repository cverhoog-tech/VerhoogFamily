'use strict';
(function(){
  if(window.FamilyAppIconRegistry)return;
  var VERSION='1.0.0';
  var SPRITE='src/ui/icons/assets/familyapp-icons.svg';
  var ICONS=Object.freeze({
    level:Object.freeze({symbol:'fa-level',label:'Level',tone:'purple-gold'}),
    streak:Object.freeze({symbol:'fa-streak',label:'Streak',tone:'fire'}),
    quest:Object.freeze({symbol:'fa-quest',label:'Quest',tone:'purple-gold'}),
    xpWeekly:Object.freeze({symbol:'fa-xp',label:'XP',tone:'arcane'}),
    edit:Object.freeze({symbol:'fa-edit',label:'Bewerken',tone:'purple-gold'}),
    raid:Object.freeze({symbol:'fa-raid',label:'Raid',tone:'purple-gold'}),
    dungeon:Object.freeze({symbol:'fa-dungeon',label:'Dungeon',tone:'purple-gold'}),
    achievement:Object.freeze({symbol:'fa-achievement',label:'Achievement',tone:'gold'}),
    title:Object.freeze({symbol:'fa-title',label:'Titel',tone:'purple-gold'})
  });
  function get(key){var row=ICONS[String(key||'')];return row?Object.freeze(Object.assign({key:String(key),sprite:SPRITE},row)):null;}
  function has(key){return !!ICONS[String(key||'')];}
  window.FamilyAppIconRegistry={version:VERSION,sprite:SPRITE,get:get,has:has,keys:function(){return Object.keys(ICONS);}};
})();
