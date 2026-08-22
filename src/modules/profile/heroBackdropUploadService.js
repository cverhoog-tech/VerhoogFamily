'use strict';
// ============================================================
// FAMILYAPP HERO BACKDROP UPLOAD SERVICE v1.1.0
// STEP 2B.3
// Own-profile write boundary for household/UID-scoped Firebase Storage.
// Files are resized/compressed client-side and stored under an unguessable
// object id. Download URLs are resolved in-memory only and are never part of
// the persistence contract.
// ============================================================
(function(){
  if(window.HeroBackdropUploadService)return;

  var VERSION='1.1.0';
  var MAX_SOURCE_BYTES=15*1024*1024;
  var MAX_EDGE=1800;
  var MAX_OUTPUT_BYTES=1400*1024;
  var QUALITY=.82;
  var resolvedUrlCache=Object.create(null);
  var resolving=Object.create(null);

  function context(){try{return window.HouseholdContext&&HouseholdContext.snapshot?HouseholdContext.snapshot():null;}catch(e){return null;}}
  function capture(){try{return window.HouseholdContext&&HouseholdContext.capture?HouseholdContext.capture():null;}catch(e){return null;}}
  function isCurrent(token){try{return !!(window.HouseholdContext&&HouseholdContext.isCurrent&&HouseholdContext.isCurrent(token));}catch(e){return false;}}
  function storage(){try{if(window.fbStorage)return window.fbStorage;if(window.firebase&&firebase.storage)return firebase.storage();}catch(e){}return null;}
  function own(uid){var c=context();return !!(c&&c.ready&&c.uid&&c.householdId&&String(c.uid)===String(uid));}
  function error(code,message){var e=new Error(message);e.code=code;return e;}
  function clean(v){return String(v==null?'':v).replace(/^\/+|\/+$/g,'');}
  function familyPrefix(householdId){return 'families/'+clean(householdId)+'/members/';}
  function ownPrefix(householdId,uid){return familyPrefix(householdId)+clean(uid)+'/hero-backdrops/';}
  function extension(type){return String(type||'').toLowerCase()==='image/webp'?'.webp':'.jpg';}
  function randomId(){
    var cryptoObj=window.crypto||window.msCrypto;
    if(!cryptoObj||typeof cryptoObj.getRandomValues!=='function')throw error('SECURE_RANDOM_UNAVAILABLE','Veilige afbeeldingsopslag is op dit toestel niet beschikbaar.');
    var bytes=new Uint8Array(16);cryptoObj.getRandomValues(bytes);
    return Array.prototype.map.call(bytes,function(b){return ('0'+b.toString(16)).slice(-2);}).join('');
  }
  function storagePath(householdId,uid,contentType){return ownPrefix(householdId,uid)+randomId()+extension(contentType);}
  function pathBelongsToHousehold(path,householdId){return clean(path).indexOf(familyPrefix(householdId))===0&&clean(path).indexOf('/hero-backdrops/')>-1;}
  function pathBelongsToMember(path,householdId,uid){return clean(path).indexOf(ownPrefix(householdId,uid))===0;}

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

  function canvasBlob(canvas,type,quality){
    return new Promise(function(resolve){try{canvas.toBlob(function(blob){resolve(blob||null);},type,quality);}catch(e){resolve(null);}});
  }

  function resize(img,maxEdge,quality){
    var w=Math.max(1,Number(img.naturalWidth||img.width||1)),h=Math.max(1,Number(img.naturalHeight||img.height||1));
    var scale=Math.min(1,maxEdge/Math.max(w,h));
    var outW=Math.max(1,Math.round(w*scale)),outH=Math.max(1,Math.round(h*scale));
    var canvas=document.createElement('canvas');canvas.width=outW;canvas.height=outH;
    var ctx=canvas.getContext('2d',{alpha:false});
    if(!ctx)throw error('CANVAS_UNAVAILABLE','Afbeelding verwerken is niet beschikbaar op dit toestel.');
    ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(img,0,0,outW,outH);
    return canvasBlob(canvas,'image/webp',quality).then(function(blob){
      if(blob)return{blob:blob,width:outW,height:outH,contentType:'image/webp'};
      return canvasBlob(canvas,'image/jpeg',Math.min(.88,quality+.04)).then(function(jpeg){
        if(!jpeg)throw error('ENCODE_FAILED','Afbeelding comprimeren is niet gelukt.');
        return{blob:jpeg,width:outW,height:outH,contentType:'image/jpeg'};
      });
    });
  }

  function prepare(file){
    try{validate(file);}catch(e){return Promise.reject(e);}
    return loadImage(file).then(function(img){
      return resize(img,MAX_EDGE,QUALITY).then(function(prepared){return prepared.blob.size<=MAX_OUTPUT_BYTES?prepared:resize(img,1280,.72);});
    }).then(function(prepared){
      if(prepared.blob.size>MAX_OUTPUT_BYTES)throw error('OUTPUT_TOO_LARGE','De foto kon niet klein genoeg worden gemaakt. Kies een andere afbeelding.');
      prepared.previewUrl=URL.createObjectURL(prepared.blob);
      prepared.sourceName=String(file.name||'achtergrond');
      prepared.sourceBytes=Number(file.size||0);
      return prepared;
    });
  }

  function dispose(prepared){if(prepared&&prepared.previewUrl){try{URL.revokeObjectURL(prepared.previewUrl);}catch(e){}prepared.previewUrl='';}}

  function upload(uid,prepared,onProgress){
    if(!own(uid))return Promise.reject(error('NOT_OWN_PROFILE','Je kunt alleen je eigen hero-achtergrond aanpassen.'));
    if(!prepared||!prepared.blob)return Promise.reject(error('NOT_PREPARED','De afbeelding is nog niet voorbereid.'));
    var c=context(),token=capture(),s=storage();
    if(!c||!c.householdId||!token)return Promise.reject(error('NO_CONTEXT','Geen actieve gezinscontext.'));
    if(!s)return Promise.reject(error('STORAGE_UNAVAILABLE','Firebase Storage is niet beschikbaar.'));
    var path;
    try{path=storagePath(c.householdId,String(uid),prepared.contentType||prepared.blob.type);}catch(e){return Promise.reject(e);}
    var ref=s.ref().child(path);
    var metadata={
      contentType:prepared.contentType||prepared.blob.type||'image/webp',
      cacheControl:'private,max-age=3600',
      customMetadata:{familyAppPurpose:'hero-backdrop',householdId:String(c.householdId),uid:String(uid)}
    };
    return new Promise(function(resolve,reject){
      var task;
      try{task=ref.put(prepared.blob,metadata);}catch(e){reject(e);return;}
      task.on('state_changed',function(snap){
        if(typeof onProgress==='function'){var total=Number(snap.totalBytes||0),done=Number(snap.bytesTransferred||0);try{onProgress(total?Math.max(0,Math.min(1,done/total)):0);}catch(e){}}
      },reject,function(){resolve(task.snapshot);});
    }).then(function(snapshot){
      if(!isCurrent(token)){
        try{snapshot.ref.delete().catch(function(){});}catch(e){}
        throw error('STALE_CONTEXT','De gezinscontext veranderde tijdens het uploaden. Probeer opnieuw.');
      }
      return{
        type:'upload',storagePath:path,
        contentType:prepared.contentType||prepared.blob.type||'image/webp',
        width:Number(prepared.width||0),height:Number(prepared.height||0),bytes:Number(prepared.blob.size||0),uploadedAt:Date.now(),
        focalX:.5,focalY:.5,overlayStyle:'violet-night',overlayStrength:.34
      };
    });
  }

  function resolvePath(path,uploadedAt){
    var c=context(),token=capture(),s=storage(),cleanPath=clean(path);
    if(!c||!c.ready||!c.householdId||!token)return Promise.reject(error('NO_CONTEXT','Geen actieve gezinscontext.'));
    if(!pathBelongsToHousehold(cleanPath,c.householdId))return Promise.reject(error('OUTSIDE_HOUSEHOLD','Afbeeldingspad hoort niet bij dit gezin.'));
    if(!s)return Promise.reject(error('STORAGE_UNAVAILABLE','Firebase Storage is niet beschikbaar.'));
    if(resolvedUrlCache[cleanPath])return Promise.resolve(resolvedUrlCache[cleanPath]);
    if(resolving[cleanPath])return resolving[cleanPath];
    resolving[cleanPath]=s.ref().child(cleanPath).getDownloadURL().then(function(url){
      if(!isCurrent(token))throw error('STALE_CONTEXT','De gezinscontext veranderde tijdens het laden.');
      var v=String(url||'');
      if(uploadedAt)v+=(v.indexOf('?')>=0?'&':'?')+'familyapp_v='+encodeURIComponent(String(uploadedAt));
      resolvedUrlCache[cleanPath]=v;return v;
    }).finally(function(){delete resolving[cleanPath];});
    return resolving[cleanPath];
  }

  function resolveConfig(config){
    config=config&&typeof config==='object'?config:{};
    if(config.type!=='upload')return Promise.resolve(config);
    if(config.imageUrl)return Promise.resolve(config);
    if(!config.storagePath)return Promise.reject(error('UPLOAD_PATH_MISSING','Uploadachtergrond heeft geen opslagpad.'));
    return resolvePath(config.storagePath,config.uploadedAt).then(function(url){return Object.assign({},config,{imageUrl:url,thumbnailUrl:url});});
  }

  function deletePath(uid,path){
    if(!own(uid))return Promise.reject(error('NOT_OWN_PROFILE','Je kunt alleen je eigen hero-achtergrond verwijderen.'));
    var c=context(),s=storage(),cleanPath=clean(path);
    if(!c||!c.householdId)return Promise.reject(error('NO_CONTEXT','Geen actieve gezinscontext.'));
    if(!pathBelongsToMember(cleanPath,c.householdId,String(uid)))return Promise.reject(error('INVALID_DELETE_PATH','Dit afbeeldingspad hoort niet bij jouw profiel.'));
    if(!s)return Promise.reject(error('STORAGE_UNAVAILABLE','Firebase Storage is niet beschikbaar.'));
    return s.ref().child(cleanPath).delete().then(function(){delete resolvedUrlCache[cleanPath];}).catch(function(err){
      if(err&&err.code==='storage/object-not-found'){delete resolvedUrlCache[cleanPath];return;}
      throw err;
    });
  }

  function clearCache(){resolvedUrlCache=Object.create(null);resolving=Object.create(null);}
  try{if(window.HouseholdContext&&typeof HouseholdContext.subscribe==='function')HouseholdContext.subscribe(function(s,reason){if(reason==='identity-change')clearCache();});}catch(e){}

  window.HeroBackdropUploadService={
    version:VERSION,prepare:prepare,upload:upload,dispose:dispose,resolveConfig:resolveConfig,resolvePath:resolvePath,deletePath:deletePath,canUpload:own,
    limits:Object.freeze({maxSourceBytes:MAX_SOURCE_BYTES,maxEdge:MAX_EDGE,maxOutputBytes:MAX_OUTPUT_BYTES}),
    storagePrefix:function(uid){var c=context();return c&&c.householdId?ownPrefix(c.householdId,String(uid||c.uid||'')):'';}
  };
})();
