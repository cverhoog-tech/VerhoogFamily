'use strict';
// ============================================================
// FAMILYAPP PROFILE MEDIA v1.1
// Platform-neutral presentation model for profile/avatar media.
// Distinguishes true hero media from portrait/avatar fallback media.
// ============================================================
(function(){
  if(window.ProfileMedia)return;

  var VERSION='1.1.0';
  var DEFAULT_FOCAL={x:0.5,y:0.5};

  // Canonical subject focal points for bundled portraits. These values belong
  // to the assets and can be reused by web/native renderers.
  var BUNDLED={
    '01-aiden.webp':{x:0.50,y:0.25},
    '02-kai.webp':{x:0.50,y:0.27},
    '03-liam.webp':{x:0.50,y:0.27},
    '04-asuna.webp':{x:0.50,y:0.25},
    '05-elizabeth.webp':{x:0.50,y:0.26},
    '06-mila.webp':{x:0.50,y:0.26},
    '07-dylan.webp':{x:0.50,y:0.27},
    '08-ethan.webp':{x:0.50,y:0.26},
    '09-noah.webp':{x:0.50,y:0.27},
    '10-sophie.webp':{x:0.50,y:0.25},
    '11-luna.webp':{x:0.50,y:0.26},
    '12-zara.webp':{x:0.50,y:0.26}
  };

  function number(value,fallback){var n=Number(value);return isFinite(n)?n:fallback;}
  function clamp01(value,fallback){return Math.max(0,Math.min(1,number(value,fallback)));}
  function clampZoom(value){return Math.max(1,Math.min(2.5,number(value,1)));}
  function fileName(url){var value=String(url||'').split('?')[0].split('#')[0];return value.slice(value.lastIndexOf('/')+1);}
  function bundledFocus(url){var row=BUNDLED[fileName(url)];return row?{x:row.x,y:row.y}:null;}
  function candidate(record,key){var value=record&&record[key];return value&&typeof value==='object'?value:null;}
  function firstValue(rows,keys){
    for(var i=0;i<rows.length;i++){
      var row=rows[i];if(!row)continue;
      for(var j=0;j<keys.length;j++)if(row[keys[j]]!=null)return row[keys[j]];
    }
    return null;
  }
  function explicitHeroUrl(identityHero,recordHero,identity,record){
    return firstValue([identityHero,recordHero,identity,record],['url','heroImage','heroUrl'])||'';
  }
  function avatarUrl(identity,record,fallbackUrl){
    return firstValue([identity,record],['avatar','avatarUrl','photoURL'])||fallbackUrl||'';
  }
  function resolveHeroMedia(identity,record,fallbackUrl){
    identity=identity||{};record=record||{};
    var identityHero=candidate(identity,'heroMedia')||(identity.media&&candidate(identity.media,'hero'))||null;
    var recordHero=candidate(record,'heroMedia')||(record.media&&candidate(record.media,'hero'))||null;
    var heroUrl=explicitHeroUrl(identityHero,recordHero,identity,record);
    var fallbackAvatar=avatarUrl(identity,record,fallbackUrl);
    var usesPortraitFallback=!heroUrl;
    var url=heroUrl||fallbackAvatar||'';
    var rows=[identityHero,recordHero,identity,record];
    var bundled=bundledFocus(url)||DEFAULT_FOCAL;
    var focalX=firstValue(rows,['focalX','heroFocalX']);
    var focalY=firstValue(rows,['focalY','heroFocalY']);
    var zoom=firstValue(rows,['zoom','heroZoom']);
    var fit=String(firstValue(rows,['fit','heroFit'])||(usesPortraitFallback?'contain':'cover'));
    if(fit!=='cover'&&fit!=='contain')fit=usesPortraitFallback?'contain':'cover';
    var mode=String(firstValue(rows,['mode','heroMode'])||(usesPortraitFallback?'portrait':'hero'));
    if(mode!=='portrait'&&mode!=='hero')mode=usesPortraitFallback?'portrait':'hero';
    return Object.freeze({
      url:String(url||''),
      mode:mode,
      source:usesPortraitFallback?'avatar-fallback':'hero',
      focalX:clamp01(focalX,bundled.x),
      focalY:clamp01(focalY,bundled.y),
      zoom:clampZoom(zoom),
      fit:fit
    });
  }

  window.ProfileMedia={
    version:VERSION,
    resolveHeroMedia:resolveHeroMedia,
    bundledFocus:function(url){var row=bundledFocus(url);return row?Object.freeze(row):null;},
    defaults:Object.freeze({focalX:DEFAULT_FOCAL.x,focalY:DEFAULT_FOCAL.y,zoom:1,fit:'cover',mode:'hero'})
  };
})();
