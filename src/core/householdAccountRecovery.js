'use strict';
// ============================================================
// HOUSEHOLD ACCOUNT RECOVERY v1.1
// Recover only explicit Beta-1/new-style active memberships. Legacy family
// objects no longer block a clean Create / Join onboarding flow.
// ============================================================
(function(){
  if(window.HouseholdAccountRecovery) return;
  var VERSION='1.1.0';

  function authUser(){
    try{return window.fbUser||(typeof fbUser!=='undefined'&&fbUser)||(window.firebase&&firebase.auth&&firebase.auth().currentUser)||null;}catch(e){return null;}
  }
  function database(){
    try{return window.fbDb||(typeof fbDb!=='undefined'&&fbDb)||(window.firebase&&firebase.database&&firebase.database())||null;}catch(e){return null;}
  }
  function uniq(list){var seen={};return list.filter(function(v){if(!v||seen[v])return false;seen[v]=1;return true;});}
  function candidateIds(profile){
    var ids=[];
    if(profile){
      ids.push(profile.activeHouseholdId);
      if(profile.households&&typeof profile.households==='object')Object.keys(profile.households).forEach(function(id){ids.push(id);});
    }
    return uniq(ids);
  }
  function inspectNewStyleFamily(db,id,uid){
    return db.ref('families/'+id).once('value').then(function(s){
      var data=s.val();
      if(!data||!data.meta||!data.meta.id||data.meta.id!==id)return null;
      var member=data.members&&data.members[uid]||null;
      if(!member||member.uid!==uid||member.status!=='active')return null;
      return{id:id,data:data,member:member};
    }).catch(function(){return null;});
  }
  function applyResolved(profile,resolved,user){
    var db=database(),uid=user.uid,id=resolved.id,member=resolved.member||{};
    window.fbFamilyId=id;try{fbFamilyId=id;}catch(e){}
    window.myName=member.name||(profile&&profile.name)||user.displayName||'Gebruiker';try{myName=window.myName;}catch(e){}
    var partner=(profile&&profile.partner)||'Partner';
    if(resolved.data&&resolved.data.members)Object.keys(resolved.data.members).forEach(function(mid){var m=resolved.data.members[mid];if(mid!==uid&&m&&m.status==='active'&&m.name)partner=m.name;});
    window.partnerName=partner;try{partnerName=partner;}catch(e){}
    try{myInitials=String(window.myName).substring(0,2).toUpperCase();}catch(e){}
    var patch={activeHouseholdId:id,familyId:id,name:window.myName,partner:partner};patch['households/'+id]=true;
    return db.ref('users/'+uid).update(patch).catch(function(err){console.warn('[HouseholdRecovery] pointer repair skipped',err&&err.code);}).then(function(){
      try{if(window.HouseholdRepository&&HouseholdRepository.saveMeta)HouseholdRepository.saveMeta({mode:'firebase',backendProvider:'firebase',householdId:id,lastSyncAt:new Date().toISOString()});}catch(e){}
      return resolved;
    });
  }
  function resolve(){
    var user=authUser(),db=database();if(!user||!db){var nr=new Error('AUTH_NOT_READY');nr.code='AUTH_NOT_READY';return Promise.reject(nr);}
    return db.ref('users/'+user.uid).once('value').then(function(s){
      var profile=s.val()||{},ids=candidateIds(profile);
      if(!ids.length){var e0=new Error('NO_ACTIVE_HOUSEHOLD');e0.code='NO_ACTIVE_HOUSEHOLD';throw e0;}
      return Promise.all(ids.map(function(id){return inspectNewStyleFamily(db,id,user.uid);})).then(function(results){
        var valid=results.filter(Boolean);
        if(!valid.length){var e=new Error('NO_ACTIVE_HOUSEHOLD');e.code='NO_ACTIVE_HOUSEHOLD';throw e;}
        var active=valid.filter(function(x){return profile.activeHouseholdId===x.id;})[0]||valid[0];
        return applyResolved(profile,active,user);
      });
    });
  }

  function install(){
    if(typeof window.loadUserFamily==='function'&&!window.loadUserFamily.__householdRecoveryV11){
      var originalLoad=window.loadUserFamily;
      var replacement=function(){
        return resolve().catch(function(err){
          // No new-style active membership: deliberately continue into the
          // existing Create / Join onboarding. Legacy households are ignored.
          if(err&&(err.code==='NO_ACTIVE_HOUSEHOLD'||err.code==='AUTH_NOT_READY'))return Promise.resolve(originalLoad());
          throw err;
        });
      };
      replacement.__householdRecoveryV11=true;
      window.loadUserFamily=replacement;try{loadUserFamily=replacement;}catch(e){}
    }

    if(typeof window.setupNewFamily==='function'&&!window.setupNewFamily.__householdGuardV11){
      var originalCreate=window.setupNewFamily;
      var guarded=function(name,partner){
        return resolve().then(function(existing){
          var e=new Error('Je account heeft al een actief gezin. Dat gezin is geopend.');e.code='HOUSEHOLD_ALREADY_EXISTS';e.resolved=existing;throw e;
        }).catch(function(err){
          if(err&&(err.code==='NO_ACTIVE_HOUSEHOLD'||err.code==='AUTH_NOT_READY'))return originalCreate(name,partner);
          throw err;
        });
      };
      guarded.__householdGuardV11=true;
      window.setupNewFamily=guarded;try{setupNewFamily=guarded;}catch(e){}
    }
  }

  function boot(){var tries=0,t=setInterval(function(){tries++;install();if((window.loadUserFamily&&window.loadUserFamily.__householdRecoveryV11)||tries>60)clearInterval(t);},100);}
  window.HouseholdAccountRecovery={version:VERSION,resolve:resolve,install:install};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
  window.addEventListener('load',function(){setTimeout(install,0);setTimeout(install,1000);});
})();
