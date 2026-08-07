'use strict';
// ============================================================
// HOUSEHOLD ACCOUNT RECOVERY v1
// Resolves an authenticated account back to an existing household before
// onboarding is allowed to create anything. Never deletes households.
// ============================================================
(function(){
  if(window.HouseholdAccountRecovery) return;
  var VERSION='1.0.0';

  function authUser(){
    try{return window.fbUser||(typeof fbUser!=='undefined'&&fbUser)||(window.firebase&&firebase.auth&&firebase.auth().currentUser)||null;}catch(e){return null;}
  }
  function database(){
    try{return window.fbDb||(typeof fbDb!=='undefined'&&fbDb)||(window.firebase&&firebase.database&&firebase.database())||null;}catch(e){return null;}
  }
  function uniq(list){var seen={};return list.filter(function(v){if(!v||seen[v])return false;seen[v]=1;return true;});}
  function candidateIds(profile,uid){
    var ids=[];
    if(profile){
      ids.push(profile.activeHouseholdId,profile.familyId);
      if(profile.households&&typeof profile.households==='object')Object.keys(profile.households).forEach(function(id){ids.push(id);});
    }
    // Legacy FamilyApp used the owner's uid as family id.
    ids.push(uid);
    return uniq(ids);
  }
  function familyScore(data,member,profile,id){
    if(!data)return -1;
    var score=1;
    if(member)score+=100;
    if(member&&member.status==='active')score+=100;
    if(data.meta&&data.meta.ownerUid)score+=20;
    ['tasks','shop','cal','feed','trans','members','shared'].forEach(function(k){if(data[k]&&Object.keys(data[k]).length)score+=5;});
    if(profile&&profile.activeHouseholdId===id)score+=15;
    if(profile&&profile.familyId===id)score+=10;
    return score;
  }
  function inspectFamily(db,id,uid,profile){
    return db.ref('families/'+id).once('value').then(function(s){
      var data=s.val();if(!data)return null;
      var member=data.members&&data.members[uid]||null;
      // Legacy member rows did not have status. Treat them as valid membership.
      var valid=!!member || !!(data.meta&&data.meta.ownerUid===uid) || id===uid;
      if(!valid)return null;
      return{id:id,data:data,member:member,score:familyScore(data,member,profile,id)};
    }).catch(function(){return null;});
  }
  function chooseBest(results){
    return (results||[]).filter(Boolean).sort(function(a,b){return b.score-a.score;})[0]||null;
  }
  function applyResolved(profile,resolved,user){
    var db=database(),uid=user.uid,id=resolved.id;
    window.fbFamilyId=id;try{fbFamilyId=id;}catch(e){}
    var member=resolved.member||{};
    window.myName=member.name||(profile&&profile.name)||user.displayName||'Gebruiker';
    try{myName=window.myName;}catch(e){}
    var partner=(profile&&profile.partner)||'Partner';
    if(resolved.data&&resolved.data.members){Object.keys(resolved.data.members).forEach(function(mid){var m=resolved.data.members[mid];if(mid!==uid&&m&&m.name)partner=m.name;});}
    window.partnerName=partner;try{partnerName=partner;}catch(e){}
    try{myInitials=String(window.myName).substring(0,2).toUpperCase();}catch(e){}

    // Repair pointers only; do not replace the user record and do not touch
    // any other household. This makes an accidental test household harmless.
    var patch={activeHouseholdId:id,familyId:id,name:window.myName,partner:partner};
    patch['households/'+id]=true;
    return db.ref('users/'+uid).update(patch).catch(function(err){
      console.warn('[HouseholdRecovery] pointer repair skipped',err&&err.code);
    }).then(function(){
      try{if(window.HouseholdRepository&&HouseholdRepository.saveMeta)HouseholdRepository.saveMeta({mode:'firebase',backendProvider:'firebase',householdId:id,lastSyncAt:new Date().toISOString()});}catch(e){}
      try{localStorage.setItem('familyapp-profile-name-v1',window.myName);localStorage.setItem('familyapp-partner-name-v1',partner);}catch(e){}
      return resolved;
    });
  }
  function resolve(){
    var user=authUser(),db=database();
    if(!user||!db)return Promise.reject(new Error('AUTH_NOT_READY'));
    var uid=user.uid;
    return db.ref('users/'+uid).once('value').then(function(s){
      var profile=s.val()||{};
      var ids=candidateIds(profile,uid);
      return Promise.all(ids.map(function(id){return inspectFamily(db,id,uid,profile);})).then(function(results){
        var best=chooseBest(results);
        if(!best){var err=new Error('NO_EXISTING_HOUSEHOLD');err.code='NO_EXISTING_HOUSEHOLD';throw err;}
        return applyResolved(profile,best,user);
      });
    });
  }

  function install(){
    if(typeof window.loadUserFamily==='function'&&!window.loadUserFamily.__householdRecovery){
      var originalLoad=window.loadUserFamily;
      var replacement=function(){
        return resolve().catch(function(err){
          // Only fall back to legacy loader when recovery genuinely cannot find
          // an existing household. Never create one automatically here.
          if(err&&err.code==='NO_EXISTING_HOUSEHOLD')return Promise.resolve(originalLoad()).catch(function(){throw err;});
          throw err;
        });
      };
      replacement.__householdRecovery=true;
      window.loadUserFamily=replacement;try{loadUserFamily=replacement;}catch(e){}
    }

    if(typeof window.setupNewFamily==='function'&&!window.setupNewFamily.__householdGuard){
      var originalCreate=window.setupNewFamily;
      var guarded=function(name,partner){
        // A create action first performs recovery. If anything valid exists,
        // creation is cancelled and the existing household is selected.
        return resolve().then(function(existing){
          var e=new Error('Je account hoort al bij een bestaand gezin. Dat gezin is hersteld.');
          e.code='HOUSEHOLD_ALREADY_EXISTS';e.resolved=existing;throw e;
        }).catch(function(err){
          if(err&&err.code==='NO_EXISTING_HOUSEHOLD')return originalCreate(name,partner);
          throw err;
        });
      };
      guarded.__householdGuard=true;
      window.setupNewFamily=guarded;try{setupNewFamily=guarded;}catch(e){}
    }
  }

  function boot(){var tries=0,t=setInterval(function(){tries++;install();if((window.loadUserFamily&&window.loadUserFamily.__householdRecovery)||tries>60)clearInterval(t);},100);}
  window.HouseholdAccountRecovery={version:VERSION,resolve:resolve,install:install};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
  window.addEventListener('load',function(){setTimeout(install,0);setTimeout(install,1000);});
})();
