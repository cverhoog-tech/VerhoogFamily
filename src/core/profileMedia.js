'use strict';
// ============================================================
// FAMILYAPP PROFILE MEDIA v1
// Platform-neutral presentation model for profile/avatar media.
// No DOM ownership and no Firebase ownership.
// ============================================================
(function(){
  if(window.ProfileMedia)return;

  var VERSION='1.0.0';
  var DEFAULT_FOCAL={x:0.5,y:0.5};

  // Canonical presentation metadata for bundled portrait assets. These values
  // describe the subject focal point, not a screen-specific CSS offset.
  var BUNDLED={
    '01-aiden.webp':{x:0.50,y:0.36},
    '02-kai.webp':{x:0.50,y:0.34},
    '03-liam.webp':{x:0.50,y:0.36},
    '04-asuna.webp':{x:0.50,y:0.34},
    '05-elizabeth.webp':{x:0.50,y:0.35},
    '06-mila.webp':{x:0.50,y:0.35},
    '07-dylan.webp':{x:0.50,y:0.36},
    '08-ethan.webp':{x:0.50,y:0.35},
    '09-noah.webp':{x:0.50,y:0.36},
    '10-sophie.webp':{x:0.50,y:0.36},
    '11-luna.webp':{x:0.50,y:0.35},
    '12-zara.webp':{x:0.50,y:0.35}
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
  function resolveHeroMedia(identity,record,fallbackUrl){
    identity=identity||{};record=record||{};
    var identityHero=candidate(identity,'heroMedia')||(identity.media&&candidate(identity.media,'hero'))||null;
    var recordHero=candidate(record,'heroMedia')||(record.media&&candidate(record.media,'hero'))||null;
    var rows=[identityHero,recordHero,identity,record];
    var url=firstValue(rows,['url','heroImage','heroUrl','avatar','avatarUrl','photoURL'])||fallbackUrl||'';
    var bundled=bundledFocus(url)||DEFAULT_FOCAL;
    var focalX=firstValue(rows,['focalX','heroFocalX']);
    var focalY=firstValue(rows,['focalY','heroFocalY']);
    var zoom=firstValue(rows,['zoom','heroZoom']);
    var fit=String(firstValue(rows,['fit','heroFit'])||'cover');
    if(fit!=='cover'&&fit!=='contain')fit='cover';
    return Object.freeze({
      url:String(url||''),
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
    defaults:Object.freeze({focalX:DEFAULT_FOCAL.x,focalY:DEFAULT_FOCAL.y,zoom:1,fit:'cover'})
  };
})();
