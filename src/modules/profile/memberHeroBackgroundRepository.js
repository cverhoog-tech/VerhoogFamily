'use strict';
// Canonical persistence boundary for a member's own hero backdrop preference.
(function(){
  if(window.MemberHeroBackgroundRepository)return;
  var VERSION='2.0.0',CLOUD_NAME='rg86slp4',CLOUDINARY_ORIGIN='https://res.cloudinary.com/'+CLOUD_NAME+'/image/upload/';
  function context(){try{return window.HouseholdContext&&HouseholdContext.snapshot?HouseholdContext.snapshot():null;}catch(e){return null;}}
  function db(){try{return window.fbDb||(window.firebase&&firebase.database&&firebase.database())||null;}catch(e){return null;}}
  function own(uid){var c=context();return !!(c&&c.ready&&c.uid&&c.householdId&&String(uid)===String(c.uid));}
  function path(uid){var c=context();if(!c||!c.householdId)throw new Error('Geen actieve household-context.');return 'families/'+c.householdId+'/members/'+uid+'/heroBackground';}
  function stamp(payload){var c=context();return Object.assign({},payload,{updatedAt:Date.now(),updatedByUid:c&&c.uid||''});}
  function number(v,f){var n=Number(v);return isFinite(n)?n:f;}
  function cleanText(v,max){return String(v==null?'':v).slice(0,max||500);}
  function validUrl(v){return String(v||'').indexOf(CLOUDINARY_ORIGIN)===0;}

  function setPreset(uid,presetId){
    if(!own(uid))return Promise.reject(new Error('Je kunt alleen je eigen hero-achtergrond aanpassen.'));
    var catalog=window.HeroBackdropCatalog,preset=catalog&&catalog.getPreset?catalog.getPreset(presetId):null;
    if(!preset)return Promise.reject(new Error('Onbekende achtergrondpreset.'));
    var d=db();if(!d)return Promise.reject(new Error('Firebase is niet beschikbaar.'));
    return d.ref(path(uid)).set(stamp({type:'preset',presetId:preset.id}));
  }

  function setUpload(uid,upload){
    if(!own(uid))return Promise.reject(new Error('Je kunt alleen je eigen hero-achtergrond aanpassen.'));
    upload=upload&&typeof upload==='object'?upload:{};
    if(upload.provider!=='cloudinary'||upload.cloudName!==CLOUD_NAME)return Promise.reject(new Error('Ongeldige afbeeldingsprovider.'));
    if(!validUrl(upload.imageUrl))return Promise.reject(new Error('Ongeldige Cloudinary-afbeeldingsURL.'));
    if(String(upload.contentType||'').indexOf('image/')!==0)return Promise.reject(new Error('Alleen afbeeldingen zijn toegestaan.'));
    if(!upload.assetId||!upload.publicId)return Promise.reject(new Error('Onvolledige Cloudinary uploadmetadata.'));
    var d=db();if(!d)return Promise.reject(new Error('Firebase is niet beschikbaar.'));
    var payload={
      type:'upload',provider:'cloudinary',cloudName:CLOUD_NAME,
      assetId:cleanText(upload.assetId,100),publicId:cleanText(upload.publicId,300),version:Math.max(0,Math.round(number(upload.version,0))),format:cleanText(upload.format,20),
      imageUrl:cleanText(upload.imageUrl,1000),thumbnailUrl:cleanText(upload.thumbnailUrl||upload.imageUrl,1000),contentType:cleanText(upload.contentType,80),
      width:Math.max(0,Math.round(number(upload.width,0))),height:Math.max(0,Math.round(number(upload.height,0))),
      bytes:Math.max(0,Math.round(number(upload.bytes,0))),uploadedAt:Math.max(0,Math.round(number(upload.uploadedAt,Date.now()))),
      focalX:Math.max(0,Math.min(1,number(upload.focalX,.5))),focalY:Math.max(0,Math.min(1,number(upload.focalY,.5))),
      overlayStyle:cleanText(upload.overlayStyle||'violet-night',40),overlayStrength:Math.max(0,Math.min(.9,number(upload.overlayStrength,.34)))
    };
    return d.ref(path(uid)).set(stamp(payload)).then(function(){return payload;});
  }

  function reset(uid){
    if(!own(uid))return Promise.reject(new Error('Je kunt alleen je eigen hero-achtergrond aanpassen.'));
    var d=db();if(!d)return Promise.reject(new Error('Firebase is niet beschikbaar.'));
    return d.ref(path(uid)).remove();
  }

  window.MemberHeroBackgroundRepository={version:VERSION,setPreset:setPreset,setUpload:setUpload,reset:reset,canEdit:own};
})();
