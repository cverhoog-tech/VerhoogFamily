'use strict';
// ============================================================
// FAMILYAPP PROFILE MEDIA v1.3
// Platform-neutral presentation model for profile/avatar media.
// Hero media and avatar fallback have separate, explicit contracts.
// ============================================================
(function(){
  if(window.ProfileMedia)return;

  var VERSION='1.3.0';
  var DEFAULT_FOCAL={x:0.5,y:0.5};
  var DEFAULT_SAFE={x:0.20,y:0.08,w:0.60,h:0.48};

  var BUNDLED={
    '01-aiden.webp':{focal:{x:0.50,y:0.25},safe:{x:0.20,y:0.06,w:0.60,h:0.46}},
    '02-kai.webp':{focal:{x:0.50,y:0.27},safe:{x:0.20,y:0.07,w:0.60,h:0.46}},
    '03-liam.webp':{focal:{x:0.50,y:0.27},safe:{x:0.20,y:0.07,w:0.60,h:0.46}},
    '04-asuna.webp':{focal:{x:0.50,y:0.25},safe:{x:0.20,y:0.06,w:0.60,h:0.46}},
    '05-elizabeth.webp':{focal:{x:0.50,y:0.26},safe:{x:0.20,y:0.06,w:0.60,h:0.46}},
    '06-mila.webp':{focal:{x:0.50,y:0.26},safe:{x:0.20,y:0.06,w:0.60,h:0.46}},
    '07-dylan.webp':{focal:{x:0.50,y:0.27},safe:{x:0.20,y:0.07,w:0.60,h:0.46}},
    '08-ethan.webp':{focal:{x:0.50,y:0.26},safe:{x:0.20,y:0.06,w:0.60,h:0.46}},
    '09-noah.webp':{focal:{x:0.50,y:0.27},safe:{x:0.20,y:0.07,w:0.60,h:0.46}},
    '10-sophie.webp':{focal:{x:0.50,y:0.25},safe:{x:0.20,y:0.06,w:0.60,h:0.46}},
    '11-luna.webp':{focal:{x:0.50,y:0.26},safe:{x:0.20,y:0.06,w:0.60,h:0.46}},
    '12-zara.webp':{focal:{x:0.50,y:0.26},safe:{x:0.20,y:0.06,w:0.60,h:0.46}}
  };

  function number(value,fallback){var n=Number(value);return isFinite(n)?n:fallback;}
  function clamp01(value,fallback){return Math.max(0,Math.min(1,number(value,fallback)));}
  function clampZoom(value){return Math.max(1,Math.min(2.5,number(value,1)));}
  function fileName(url){var value=String(url||'').split('?')[0].split('#')[0];return value.slice(value.lastIndexOf('/')+1);}
  function bundledMeta(url){return BUNDLED[fileName(url)]||null;}
  function candidate(record,key){var value=record&&record[key];return value&&typeof value==='object'?value:null;}
  function firstValue(rows,keys){for(var i=0;i<rows.length;i++){var row=rows[i];if(!row)continue;for(var j=0;j<keys.length;j++)if(row[keys[j]]!=null)return row[keys[j]];}return null;}
  function explicitHeroUrl(identityHero,recordHero,identity,record){
    // Only dedicated hero fields can opt into cropped hero treatment.
    // Historical `heroImage` values are intentionally ignored because older
    // profile code often copied the avatar URL into that field.
    return firstValue([identityHero,recordHero],['url'])
      || firstValue([identity,record],['heroUrl'])
      || '';
  }
  function avatarUrl(identity,record,fallbackUrl){return firstValue([identity,record],['avatar','avatarUrl','photoURL'])||fallbackUrl||'';}
  function normalizeSafe(input,fallback){input=input||{};fallback=fallback||DEFAULT_SAFE;var x=clamp01(input.x,fallback.x),y=clamp01(input.y,fallback.y),w=Math.max(.05,Math.min(1-x,number(input.w,fallback.w))),h=Math.max(.05,Math.min(1-y,number(input.h,fallback.h)));return Object.freeze({x:x,y:y,w:w,h:h});}

  function resolveHeroMedia(identity,record,fallbackUrl){
    identity=identity||{};record=record||{};
    var identityHero=candidate(identity,'heroMedia')||(identity.media&&candidate(identity.media,'hero'))||null;
    var recordHero=candidate(record,'heroMedia')||(record.media&&candidate(record.media,'hero'))||null;
    var heroUrl=explicitHeroUrl(identityHero,recordHero,identity,record);
    var fallbackAvatar=avatarUrl(identity,record,fallbackUrl);
    var usesPortraitFallback=!heroUrl;
    var url=heroUrl||fallbackAvatar||'';
    var bundled=bundledMeta(url)||{};

    if(usesPortraitFallback){
      return Object.freeze({
        url:String(url||''),
        mode:'portrait',
        source:'avatar-fallback',
        focalX:0.5,
        focalY:0.5,
        zoom:1,
        fit:'contain',
        safeRegion:normalizeSafe(bundled.safe||DEFAULT_SAFE,DEFAULT_SAFE)
      });
    }

    var rows=[identityHero,recordHero,identity,record];
    var bundledFocal=bundled.focal||DEFAULT_FOCAL;
    var focalX=firstValue(rows,['focalX','heroFocalX']);
    var focalY=firstValue(rows,['focalY','heroFocalY']);
    var zoom=firstValue(rows,['zoom','heroZoom']);
    var fit=String(firstValue(rows,['fit','heroFit'])||'cover');
    if(fit!=='cover'&&fit!=='contain')fit='cover';
    var safeInput=candidate(identityHero,'safeRegion')||candidate(recordHero,'safeRegion')||candidate(identity,'heroSafeRegion')||candidate(record,'heroSafeRegion')||bundled.safe||DEFAULT_SAFE;
    return Object.freeze({
      url:String(url||''),
      mode:'hero',
      source:'hero',
      focalX:clamp01(focalX,bundledFocal.x),
      focalY:clamp01(focalY,bundledFocal.y),
      zoom:clampZoom(zoom),
      fit:fit,
      safeRegion:normalizeSafe(safeInput,bundled.safe||DEFAULT_SAFE)
    });
  }

  window.ProfileMedia={
    version:VERSION,
    resolveHeroMedia:resolveHeroMedia,
    bundledMeta:function(url){var row=bundledMeta(url);return row?JSON.parse(JSON.stringify(row)):null;},
    defaults:Object.freeze({focalX:.5,focalY:.5,zoom:1,fit:'cover',mode:'hero',safeRegion:DEFAULT_SAFE})
  };
})();
