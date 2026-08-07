'use strict';
// HOUSEHOLD BETA 1 PROVISIONING v1.1
(function(){
  if(window.HouseholdBeta1Provisioning) return;
  var VERSION='1.1.0';
  function currentUser(){try{return window.fbUser||(typeof fbUser!=='undefined'&&fbUser)||(window.firebase&&firebase.auth&&firebase.auth().currentUser)||null;}catch(e){return null;}}
  function db(){try{return window.fbDb||(typeof fbDb!=='undefined'&&fbDb)||(window.firebase&&firebase.database&&firebase.database())||null;}catch(e){return null;}}
  function makeId(uid){return 'hh_'+uid.slice(0,8)+'_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,7);}
  function createHousehold(name){
    var u=currentUser(),d=db();
    if(!u||!d){var e=new Error('Je Google-account of Firebase is nog niet klaar.');e.code='AUTH_NOT_READY';return Promise.reject(e);}
    var householdId=makeId(u.uid),displayName=(u.displayName||'Gebruiker').trim(),householdName=(name||'Mijn gezin').trim()||'Mijn gezin',now=Date.now();
    var updates={};
    updates['families/'+householdId+'/meta']={id:householdId,name:householdName,ownerUid:u.uid,schemaVersion:2,createdAt:now,updatedAt:now};
    updates['families/'+householdId+'/members/'+u.uid]={uid:u.uid,name:displayName,email:u.email||'',role:'owner',status:'active',joinedAt:now,lastSeenAt:now};
    updates['users/'+u.uid+'/activeHouseholdId']=householdId;
    updates['users/'+u.uid+'/familyId']=householdId;
    updates['users/'+u.uid+'/households/'+householdId]=true;
    updates['users/'+u.uid+'/name']=displayName;
    return d.ref().update(updates).then(function(){
      window.fbFamilyId=householdId;try{fbFamilyId=householdId;}catch(e){}
      window.myName=displayName;try{myName=displayName;}catch(e){}
      try{localStorage.setItem('familyapp-profile-name-v1',displayName);}catch(e){}
      try{if(window.HouseholdRepository&&HouseholdRepository.saveMeta)HouseholdRepository.saveMeta({mode:'firebase',backendProvider:'firebase',householdId:householdId,lastSyncAt:new Date().toISOString()});}catch(e){}
      window.dispatchEvent(new CustomEvent('familyapp:household-created',{detail:{householdId:householdId,name:householdName}}));
      return {id:householdId,name:householdName};
    });
  }
  function install(){
    if(typeof window.setupNewFamily!=='function')return false;
    if(window.setupNewFamily.__beta1Provisioning)return true;
    var replacement=function(name){return createHousehold(name);};
    replacement.__beta1Provisioning=true;
    window.setupNewFamily=replacement;try{setupNewFamily=replacement;}catch(e){}
    return true;
  }
  function boot(){var tries=0,t=setInterval(function(){tries++;if(install()||tries>100)clearInterval(t);},100);}
  window.HouseholdBeta1Provisioning={version:VERSION,create:createHousehold,install:install};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
  window.addEventListener('load',function(){setTimeout(install,0);setTimeout(install,1000);});
})();
