'use strict';
(function(){
  if(window.HeroBackdropCatalog)return;
  var VERSION='1.3.0';
  var DEFAULT_ID='fantasy-castle-night';
  var PRESETS=Object.freeze([
    Object.freeze({id:'fantasy-castle-night',label:'Kasteel bij maanlicht',category:'fantasy',imageUrl:'src/assets/hero-backdrops/fantasy-castle-night.webp',thumbnailUrl:'src/assets/hero-backdrops/fantasy-castle-night.webp',overlayStyle:'violet-night',focalX:0.60,focalY:0.47,sceneExposure:1.04,sceneSaturation:1.04,sceneContrast:1.03,overlayStrength:0.34}),
    Object.freeze({id:'quest-adventure',label:'Avonturenrijk',category:'adventure',imageUrl:'src/assets/task-heroes/quest-adventure.webp',thumbnailUrl:'src/assets/task-heroes/quest-adventure.webp',overlayStyle:'violet-night',focalX:0.52,focalY:0.50,sceneExposure:1.05,sceneSaturation:1.06,sceneContrast:1.03,overlayStrength:0.38}),
    Object.freeze({id:'enchanted-garden',label:'Betoverde tuin',category:'nature',imageUrl:'src/assets/task-heroes/garden.webp',thumbnailUrl:'src/assets/task-heroes/garden.webp',overlayStyle:'emerald-night',focalX:0.50,focalY:0.52,sceneExposure:1.02,sceneSaturation:1.08,sceneContrast:1.02,overlayStrength:0.34}),
    Object.freeze({id:'cozy-guild-home',label:'Gezellige gildehal',category:'cozy',imageUrl:'src/assets/task-heroes/cozy-home.webp',thumbnailUrl:'src/assets/task-heroes/cozy-home.webp',overlayStyle:'amber-night',focalX:0.50,focalY:0.52,sceneExposure:1.03,sceneSaturation:1.04,sceneContrast:1.02,overlayStrength:0.32})
  ]);
  function clone(row){return row?Object.freeze(Object.assign({},row)):null;}
  function getPreset(id){var key=String(id||'');for(var i=0;i<PRESETS.length;i++)if(PRESETS[i].id===key)return clone(PRESETS[i]);return null;}
  function getDefaultPreset(){return getPreset(DEFAULT_ID);}
  window.HeroBackdropCatalog={version:VERSION,defaultId:DEFAULT_ID,listPresets:function(){return PRESETS.map(clone);},getPreset:getPreset,getDefaultPreset:getDefaultPreset};
})();
