'use strict';
(function(){
  if(window.HeroBackdropResolver)return;
  var VERSION='1.0.0';
  function clamp01(value,fallback){var n=Number(value);if(!isFinite(n))n=fallback;return Math.max(0,Math.min(1,n));}
  function resolve(config){
    var catalog=window.HeroBackdropCatalog;
    if(!catalog)return Object.freeze({type:'preset',presetId:'fantasy-castle-night',imageUrl:'src/assets/hero-backdrops/fantasy-castle-night.svg',thumbnailUrl:'src/assets/hero-backdrops/fantasy-castle-night.svg',overlayStyle:'violet-night',focalX:.58,focalY:.46,source:'default'});
    config=config&&typeof config==='object'?config:{};
    if(config.type==='upload'&&config.imageUrl){
      return Object.freeze({
        type:'upload',presetId:null,imageUrl:String(config.imageUrl),thumbnailUrl:String(config.thumbnailUrl||config.imageUrl),overlayStyle:String(config.overlayStyle||'violet-night'),focalX:clamp01(config.focalX,.5),focalY:clamp01(config.focalY,.5),source:'upload'
      });
    }
    var preset=catalog.getPreset(config.presetId)||catalog.getDefaultPreset();
    return Object.freeze({
      type:'preset',presetId:preset.id,imageUrl:preset.imageUrl,thumbnailUrl:preset.thumbnailUrl||preset.imageUrl,overlayStyle:preset.overlayStyle||'violet-night',focalX:clamp01(config.focalX,preset.focalX),focalY:clamp01(config.focalY,preset.focalY),source:config.presetId&&catalog.getPreset(config.presetId)?'profile':'default'
    });
  }
  window.HeroBackdropResolver={version:VERSION,resolve:resolve};
})();
