'use strict';
(function(){
  if(window.HeroBackdropCatalog)return;
  var VERSION='1.0.0';
  var DEFAULT_ID='fantasy-castle-night';
  var PRESETS=Object.freeze([
    Object.freeze({
      id:'fantasy-castle-night',
      label:'Fantasy Castle Night',
      category:'fantasy',
      imageUrl:'src/assets/hero-backdrops/fantasy-castle-night.svg',
      thumbnailUrl:'src/assets/hero-backdrops/fantasy-castle-night.svg',
      overlayStyle:'violet-night',
      focalX:0.58,
      focalY:0.46
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
