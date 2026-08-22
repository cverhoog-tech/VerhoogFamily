'use strict';
// ============================================================
// FAMILYAPP HERO BACKDROP UPLOAD SERVICE v2.1.0
// STEP 2B.3
// Own-profile Cloudinary Free upload bridge. Images are validated and
// compressed client-side before upload. Firebase Realtime Database remains
// the household-scoped source of truth for the selected backdrop metadata.
// ============================================================
(function(){
  if(window.HeroBackdropUploadService)return;

  var VERSION='2.1.0';
  var CLOUD_NAME='rg86slp4';
  // Prototype-only unsigned preset. Configure this preset in Cloudinary with
  // image-only formats, a strict file-size cap, random public IDs and the
  // familyapp/hero-uploads asset folder. STEP 15 replaces this bridge with a
  // server-authorized media boundary before broader multi-family beta.
  var UPLOAD_PRESET='fa_hero_91c8f43ad0b6_v1';
  var MAX_SOURCE_BYTES=15*1024*1024;
  var MAX_EDGE=1800;
  var MAX_OUTPUT_BYTES=1400*1024;
  var CLOUDINARY_ORIGIN='https://res.cloudinary.com/'+CLOUD_NAME+'/image/upload/';
  var COMPRESSION_STEPS=[
    {edge:1800,quality:.82},
    {edge:1600,quality:.76},
    {edge:1440,quality:.70},
    {edge:1280,quality:.64},
    {edge:1120,quality:.58},
    {edge:960,quality:.52},
    {edge:820,quality:.48},
    {edge:720,quality:.44}
  ];

  function context(){try{return window.HouseholdContext&&HouseholdContext.snapshot?HouseholdContext.snapshot():null;}catch(e){return null;}}
  function capture(){try{return window.HouseholdContext&&HouseholdContext.capture?HouseholdContext.capture():null;}catch(e){return null;}}
  function isCurrent(token){try{return !!(window.HouseholdContext&&HouseholdContext.isCurrent&&HouseholdContext.isCurrent(token));}catch(e){return false;}}
  function own(uid){var c=context();return !!(c&&c.ready&&c.uid&&c.householdId&&String(c.uid)===String(uid));}
  function error(code,message){var e=new Error(message);e.code=code;return e;}
  function validCloudinaryUrl(value){return String(value||'').indexOf(CLOUDINARY_ORIGIN)===0;}

  function validate(file){
    if(!file)throw error('NO_FILE','Kies eerst een afbeelding.');
    if(!String(file.type||'').toLowerCase().startsWith('image/'))throw error('INVALID_TYPE','Kies een geldig afbeeldingsbestand.');
    if(Number(file.size||0)>MAX_SOURCE_BYTES)throw error('SOURCE_TOO_LARGE','De afbeelding is te groot. Kies een foto kleiner dan 15 MB.');
    return true;
  }

  function loadImage(file){
    return new Promise(function(resolve,reject){
      var url=URL.createObjectURL(file),img=new Image();
      img.onload=function(){URL.revokeObjectURL(url);resolve(img);};
      img.onerror=function(){URL.revokeObjectURL(url);reject(error('DECODE_FAILED','Deze afbeelding kon niet worden gelezen.'));};
      img.src=url;
    });
  }

  function canvasBlob(canvas,type,quality){return new Promise(function(resolve){try{canvas.toBlob(function(blob){resolve(blob||null);},type,quality);}catch(e){resolve(null);}});}

  function makeCanvas(img,maxEdge){
    var w=Math.max(1,Number(img.naturalWidth||img.width||1)),h=Math.max(1,Number(img.naturalHeight||img.height||1));
    var scale=Math.min(1,maxEdge/Math.max(w,h));
    var outW=Math.max(1,Math.round(w*scale)),outH=Math.max(1,Math.round(h*scale));
    var canvas=document.createElement('canvas');canvas.width=outW;canvas.height=outH;
    var ctx=canvas.getContext('2d',{alpha:false});
    if(!ctx)throw error('CANVAS_UNAVAILABLE','Afbeelding verwerken is niet beschikbaar op dit toestel.');
    ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(img,0,0,outW,outH);
    return{canvas:canvas,width:outW,height:outH};
  }

  function encodeCandidate(img,maxEdge,quality){
    var rendered=makeCanvas(img,maxEdge);
    // JPEG quality control is reliable on iOS Safari and is ideal for photos.
    // If JPEG encoding is unavailable, WebP remains a safe fallback.
    return canvasBlob(rendered.canvas,'image/jpeg',quality).then(function(jpeg){
      if(jpeg&&jpeg.size<=MAX_OUTPUT_BYTES)return{blob:jpeg,width:rendered.width,height:rendered.height,contentType:'image/jpeg'};
      return canvasBlob(rendered.canvas,'image/webp',quality).then(function(webp){
        var chosen=null,type='';
        if(jpeg&&webp){chosen=jpeg.size<=webp.size?jpeg:webp;type=chosen===jpeg?'image/jpeg':'image/webp';}
        else if(jpeg){chosen=jpeg;type='image/jpeg';}
        else if(webp){chosen=webp;type='image/webp';}
        if(!chosen)throw error('ENCODE_FAILED','Afbeelding comprimeren is niet gelukt.');
        return{blob:chosen,width:rendered.width,height:rendered.height,contentType:type};
      });
    });
  }

  function compressToLimit(img){
    var index=0,best=null;
    function next(){
      var step=COMPRESSION_STEPS[index];
      return encodeCandidate(img,step.edge,step.quality).then(function(candidate){
        if(!best||candidate.blob.size<best.blob.size)best=candidate;
        if(candidate.blob.size<=MAX_OUTPUT_BYTES)return candidate;
        index++;
        if(index<COMPRESSION_STEPS.length)return next();
        throw error('OUTPUT_TOO_LARGE','Deze foto blijft uitzonderlijk groot na optimaliseren. Probeer een andere foto of een screenshot ervan.');
      });
    }
    return next();
  }

  function prepare(file){
    try{validate(file);}catch(e){return Promise.reject(e);}
    return loadImage(file).then(function(img){return compressToLimit(img);}).then(function(prepared){
      prepared.previewUrl=URL.createObjectURL(prepared.blob);
      prepared.sourceName=String(file.name||'achtergrond');
      prepared.sourceBytes=Number(file.size||0);
      return prepared;
    });
  }

  function dispose(prepared){if(prepared&&prepared.previewUrl){try{URL.revokeObjectURL(prepared.previewUrl);}catch(e){}prepared.previewUrl='';}}

  function cloudinaryUpload(prepared,onProgress){
    return new Promise(function(resolve,reject){
      var form=new FormData();
      form.append('file',prepared.blob,'familyapp-hero.'+(prepared.contentType==='image/webp'?'webp':'jpg'));
      form.append('upload_preset',UPLOAD_PRESET);
      var xhr=new XMLHttpRequest();
      xhr.open('POST','https://api.cloudinary.com/v1_1/'+CLOUD_NAME+'/image/upload',true);
      xhr.upload.onprogress=function(evt){if(evt.lengthComputable&&typeof onProgress==='function'){try{onProgress(Math.max(0,Math.min(.94,evt.loaded/evt.total*.94)));}catch(e){}}};
      xhr.onerror=function(){reject(error('UPLOAD_NETWORK','Uploaden naar de afbeeldingsdienst is niet gelukt.'));};
      xhr.onload=function(){
        var data={};try{data=JSON.parse(xhr.responseText||'{}');}catch(e){}
        if(xhr.status<200||xhr.status>=300){var msg=data&&data.error&&data.error.message||'Cloudinary upload mislukt.';reject(error('UPLOAD_FAILED',msg));return;}
        if(!data.secure_url||!validCloudinaryUrl(data.secure_url)){reject(error('INVALID_UPLOAD_RESPONSE','De afbeeldingsdienst gaf geen geldige URL terug.'));return;}
        if(typeof onProgress==='function'){try{onProgress(1);}catch(e){}}resolve(data);
      };
      xhr.send(form);
    });
  }

  function upload(uid,prepared,onProgress){
    if(!own(uid))return Promise.reject(error('NOT_OWN_PROFILE','Je kunt alleen je eigen hero-achtergrond aanpassen.'));
    if(!prepared||!prepared.blob)return Promise.reject(error('NOT_PREPARED','De afbeelding is nog niet voorbereid.'));
    var c=context(),token=capture();
    if(!c||!c.householdId||!token)return Promise.reject(error('NO_CONTEXT','Geen actieve gezinscontext.'));
    return cloudinaryUpload(prepared,onProgress).then(function(data){
      if(!isCurrent(token)){
        queueRetirement(uid,{provider:'cloudinary',assetId:data.asset_id||'',publicId:data.public_id||''});
        throw error('STALE_CONTEXT','De gezinscontext veranderde tijdens het uploaden. Probeer opnieuw.');
      }
      return{
        type:'upload',provider:'cloudinary',cloudName:CLOUD_NAME,assetId:String(data.asset_id||''),publicId:String(data.public_id||''),version:Number(data.version||0),format:String(data.format||''),
        imageUrl:String(data.secure_url||''),thumbnailUrl:String(data.secure_url||''),contentType:prepared.contentType||prepared.blob.type||'image/jpeg',
        width:Number(data.width||prepared.width||0),height:Number(data.height||prepared.height||0),bytes:Number(data.bytes||prepared.blob.size||0),uploadedAt:Date.now(),
        focalX:.5,focalY:.5,overlayStyle:'violet-night',overlayStrength:.34
      };
    });
  }

  function resolveConfig(config){
    config=config&&typeof config==='object'?config:{};
    if(config.type!=='upload')return Promise.resolve(config);
    if(config.provider==='cloudinary'&&validCloudinaryUrl(config.imageUrl))return Promise.resolve(config);
    if(config.imageUrl&&validCloudinaryUrl(config.imageUrl))return Promise.resolve(Object.assign({},config,{provider:'cloudinary'}));
    return Promise.reject(error('UPLOAD_URL_MISSING','Deze uploadachtergrond heeft geen geldige Cloudinary-URL.'));
  }

  function cleanupDb(){try{return window.fbDb||(window.firebase&&firebase.database&&firebase.database())||null;}catch(e){return null;}}
  function queueRetirement(uid,config){
    config=config&&typeof config==='object'?config:{};
    if(!own(uid)||config.provider!=='cloudinary'||!config.assetId)return Promise.resolve(false);
    var d=cleanupDb(),assetId=String(config.assetId||'').replace(/[^A-Za-z0-9_-]/g,'');
    if(!d||!assetId)return Promise.resolve(false);
    return d.ref('users/'+String(uid)+'/private/mediaCleanup/cloudinary/'+assetId).set({provider:'cloudinary',assetId:assetId,publicId:String(config.publicId||''),queuedAt:Date.now(),reason:'hero-backdrop-retired'}).then(function(){return true;}).catch(function(err){console.warn('[HeroBackdropUploadService] cleanup queue failed',err);return false;});
  }

  function deletePath(uid,pathOrConfig){if(pathOrConfig&&typeof pathOrConfig==='object')return queueRetirement(uid,pathOrConfig);return Promise.resolve(false);}

  window.HeroBackdropUploadService={
    version:VERSION,provider:'cloudinary',cloudName:CLOUD_NAME,uploadPreset:UPLOAD_PRESET,
    prepare:prepare,upload:upload,dispose:dispose,resolveConfig:resolveConfig,deletePath:deletePath,retireUpload:queueRetirement,canUpload:own,isValidCloudinaryUrl:validCloudinaryUrl,
    limits:Object.freeze({maxSourceBytes:MAX_SOURCE_BYTES,maxEdge:MAX_EDGE,maxOutputBytes:MAX_OUTPUT_BYTES})
  };
})();
