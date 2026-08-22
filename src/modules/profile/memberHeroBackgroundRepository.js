'use strict';
// Canonical persistence boundary for a member's own hero backdrop preference.
(function(){
  if(window.MemberHeroBackgroundRepository)return;
  var VERSION='1.1.0';
  function context(){try{return window.HouseholdContext&&HouseholdContext.snapshot?HouseholdContext.snapshot():null;}catch(e){return null;}}
  function db(){try{return window.fbDb||(window.firebase&&firebase.database&&firebase.database())||null;}catch(e){return null;}}
  function own(uid){var c=context();return !!(c&&c.ready&&c.uid&&c.householdId&&String(uid)===String(c.uid));}
  function path(uid){var c=context();if(!c||!c.householdId)throw new Error('Geen actieve household-context.');return 'families/'+c.householdId+'/members/'+uid+'/heroBackground';}
  function stamp(payload){var c=context();return Object.assign({},payload,{updatedAt:Date.now(),updatedByUid:c&&c.uid||''});}
  function clean(v){return String(v==null?'':v).replace(/^\/+|\/+$/g,'');}
  function ownUploadPrefix(uid){var c=context();if(!c||!c.householdId)return'';return 'families/'+clean(c.householdId)+'/members/'+clean(uid)+'/hero-backdrops/';}
  function number(v,f){var n=Number(v);return isFinite(n)?n:f;}

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
    var storagePath=clean(upload.storagePath),prefix=ownUploadPrefix(uid);
    if(!storagePath||!prefix||storagePath.indexOf(prefix)!==0)return Promise.reject(new Error('Ongeldig uploadpad voor deze gebruiker.'));
    if(String(upload.contentType||'').indexOf('image/')!==0)return Promise.reject(new Error('Alleen afbeeldingen zijn toegestaan.'));
    var d=db();if(!d)return Promise.reject(new Error('Firebase is niet beschikbaar.'));
    // Deliberately persist no Firebase download token/URL. The Storage path is
    // resolved in-memory after the household data boundary has granted access.
    var payload={
      type:'upload',storagePath:storagePath,contentType:String(upload.contentType||''),
      width:Math.max(0,Math.round(number(upload.width,0))),height:Math.max(0,Math.round(number(upload.height,0))),
      bytes:Math.max(0,Math.round(number(upload.bytes,0))),uploadedAt:Math.max(0,Math.round(number(upload.uploadedAt,Date.now()))),
      focalX:Math.max(0,Math.min(1,number(upload.focalX,.5))),focalY:Math.max(0,Math.min(1,number(upload.focalY,.5))),
      overlayStyle:String(upload.overlayStyle||'violet-night'),overlayStrength:Math.max(0,Math.min(.9,number(upload.overlayStrength,.34)))
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
