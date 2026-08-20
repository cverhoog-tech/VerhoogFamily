'use strict';
(function(){
  if(window.HeroBackdropCatalog)return;
  var VERSION='1.2.0';
  var DEFAULT_ID='fantasy-castle-night';
  var PRESETS=Object.freeze([
    Object.freeze({
      id:'fantasy-castle-night',
      label:'Fantasy Castle Night',
      category:'fantasy',
      imageUrl:'src/assets/hero-backdrops/fantasy-castle-night.webp',
      thumbnailUrl:'src/assets/hero-backdrops/fantasy-castle-night.webp',
      overlayStyle:'violet-night',
      focalX:0.60,
      focalY:0.47,
      sceneExposure:1.04,
      sceneSaturation:1.04,
      sceneContrast:1.03,
      overlayStrength:0.34
    })
  ]);
  function clone(row){return row?Object.freeze(Object.assign({},row)):null;}
  function getPreset(id){var key=String(id||'');for(var i=0;i<PRESETS.length;i++)if(PRESETS[i].id===key)return clone(PRESETS[i]);return null;}
  function getDefaultPreset(){return getPreset(DEFAULT_ID);}
  window.HeroBackdropCatalog={
    version:VERSION,
    defaultId:DEFAULT_ID,
    listPresets:function(){return PRESETS.map(clone);},
    getPreset:getPreset,
    getDefaultPreset:getDefaultPreset
  };
})();
