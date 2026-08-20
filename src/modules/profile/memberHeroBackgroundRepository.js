'use strict';
// Canonical persistence boundary for a member's own hero backdrop preference.
(function(){
  if(window.MemberHeroBackgroundRepository)return;
  var VERSION='1.0.0';
  function context(){try{return window.HouseholdContext&&HouseholdContext.snapshot?HouseholdContext.snapshot():null;}catch(e){return null;}}
  function db(){try{return window.fbDb||(window.firebase&&firebase.database&&firebase.database())||null;}catch(e){return null;}}
  function own(uid){var c=context();return !!(c&&c.ready&&c.uid&&c.householdId&&String(uid)===String(c.uid));}
  function path(uid){var c=context();if(!c||!c.householdId)throw new Error('Geen actieve household-context.');return 'families/'+c.householdId+'/members/'+uid+'/heroBackground';}
  function stamp(payload){var c=context();return Object.assign({},payload,{updatedAt:Date.now(),updatedByUid:c&&c.uid||''});}
  function setPreset(uid,presetId){
    if(!own(uid))return Promise.reject(new Error('Je kunt alleen je eigen hero-achtergrond aanpassen.'));
    var catalog=window.HeroBackdropCatalog,preset=catalog&&catalog.getPreset?catalog.getPreset(presetId):null;
    if(!preset)return Promise.reject(new Error('Onbekende achtergrondpreset.'));
    var d=db();if(!d)return Promise.reject(new Error('Firebase is niet beschikbaar.'));
    return d.ref(path(uid)).set(stamp({type:'preset',presetId:preset.id}));
  }
  function reset(uid){
    if(!own(uid))return Promise.reject(new Error('Je kunt alleen je eigen hero-achtergrond aanpassen.'));
    var d=db();if(!d)return Promise.reject(new Error('Firebase is niet beschikbaar.'));
    return d.ref(path(uid)).remove();
  }
  window.MemberHeroBackgroundRepository={version:VERSION,setPreset:setPreset,reset:reset,canEdit:own};
})();
