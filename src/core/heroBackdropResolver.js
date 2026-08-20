'use strict';
(function(){
  if(window.HeroBackdropResolver)return;
  var VERSION='1.1.0';
  function clamp01(value,fallback){var n=Number(value);if(!isFinite(n))n=fallback;return Math.max(0,Math.min(1,n));}
  function clamp(value,min,max,fallback){var n=Number(value);if(!isFinite(n))n=fallback;return Math.max(min,Math.min(max,n));}
  function normalizeBase(row,source){return Object.freeze({
    type:row.type||'preset',
    presetId:row.presetId||null,
    imageUrl:String(row.imageUrl||''),
    thumbnailUrl:String(row.thumbnailUrl||row.imageUrl||''),
    overlayStyle:String(row.overlayStyle||'violet-night'),
    focalX:clamp01(row.focalX,.5),
    focalY:clamp01(row.focalY,.5),
    sceneExposure:clamp(row.sceneExposure,.5,1.8,1),
    sceneSaturation:clamp(row.sceneSaturation,.5,1.8,1),
    sceneContrast:clamp(row.sceneContrast,.7,1.5,1),
    overlayStrength:clamp(row.overlayStrength,0,.9,.5),
    source:source
  });}
  function resolve(config){
    var catalog=window.HeroBackdropCatalog;
    if(!catalog)return normalizeBase({type:'preset',presetId:'fantasy-castle-night',imageUrl:'src/assets/hero-backdrops/fantasy-castle-night.svg',thumbnailUrl:'src/assets/hero-backdrops/fantasy-castle-night.svg',overlayStyle:'violet-night',focalX:.58,focalY:.46,sceneExposure:1.18,sceneSaturation:1.12,sceneContrast:1.05,overlayStrength:.44},'default');
    config=config&&typeof config==='object'?config:{};
    if(config.type==='upload'&&config.imageUrl){
      return normalizeBase({
        type:'upload',
        imageUrl:config.imageUrl,
        thumbnailUrl:config.thumbnailUrl||config.imageUrl,
        overlayStyle:config.overlayStyle||'violet-night',
        focalX:config.focalX,
        focalY:config.focalY,
        sceneExposure:config.sceneExposure,
        sceneSaturation:config.sceneSaturation,
        sceneContrast:config.sceneContrast,
        overlayStrength:config.overlayStrength
      },'upload');
    }
    var preset=catalog.getPreset(config.presetId)||catalog.getDefaultPreset();
    return normalizeBase({
      type:'preset',
      presetId:preset.id,
      imageUrl:preset.imageUrl,
      thumbnailUrl:preset.thumbnailUrl||preset.imageUrl,
      overlayStyle:preset.overlayStyle||'violet-night',
      focalX:config.focalX!=null?config.focalX:preset.focalX,
      focalY:config.focalY!=null?config.focalY:preset.focalY,
      sceneExposure:config.sceneExposure!=null?config.sceneExposure:preset.sceneExposure,
      sceneSaturation:config.sceneSaturation!=null?config.sceneSaturation:preset.sceneSaturation,
      sceneContrast:config.sceneContrast!=null?config.sceneContrast:preset.sceneContrast,
      overlayStrength:config.overlayStrength!=null?config.overlayStrength:preset.overlayStrength
    },config.presetId&&catalog.getPreset(config.presetId)?'profile':'default');
  }
  window.HeroBackdropResolver={version:VERSION,resolve:resolve};
})();
