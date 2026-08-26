'use strict';
// ============================================================
// FAMILYAPP LEGACY PROFILE UID BRIDGE v1.0.0
// Keeps the remaining v1 local profile/avatar compatibility keys aligned to
// the currently authenticated UID. Firebase/HouseholdContext stay authority;
// the unscoped keys are only a compatibility projection for legacy screens.
// ============================================================
(function(){
  if(window.FamilyLegacyProfileUidBridge)return;

  var LEGACY={
    name:'familyapp-profile-name-v1',
    partner:'familyapp-partner-name-v1',
    avatar:'familyapp-current-user-avatar-v1',
    avatarId:'familyapp-current-user-avatar-id-v1'
  };
  var SCOPED={
    name:'familyapp-profile-name-v2',
    partner:'familyapp-partner-name-v2',
    avatar:'familyapp-current-user-avatar-v2',
    avatarId:'familyapp-current-user-avatar-id-v2'
  };
  var BACKUP_KEY='familyapp-legacy-profile-backup-v1';
  var activeUid=null;
  var refreshTimer=null;

  function get(key){try{return localStorage.getItem(key)||'';}catch(e){return '';}}
  function set(key,value){try{if(value)localStorage.setItem(key,String(value));else localStorage.removeItem(key);}catch(e){}}
  function scoped(base,uid){return base+':'+uid;}
  function clean(value){return String(value||'').trim();}
  function norm(value){return clean(value).toLowerCase();}
  function initials(name){return clean(name).split(/\s+/).filter(Boolean).map(function(part){return part[0];}).join('').slice(0,2).toUpperCase()||'?';}

  function authUser(){
    try{if(window.fbAuth&&window.fbAuth.currentUser)return window.fbAuth.currentUser;}catch(e){}
    try{if(window.fbUser&&window.fbUser.uid)return window.fbUser;}catch(e){}
    try{if(window.firebase&&typeof window.firebase.auth==='function')return window.firebase.auth().currentUser||null;}catch(e){}
    return null;
  }

  function context(){
    try{return window.HouseholdContext&&typeof HouseholdContext.snapshot==='function'?HouseholdContext.snapshot():null;}catch(e){return null;}
  }

  function members(){
    try{return window.HouseholdIdentity&&typeof HouseholdIdentity.getMembers==='function'?HouseholdIdentity.getMembers():[];}catch(e){return [];}
  }

  function memberByUid(uid){
    if(!uid)return null;
    try{
      if(window.HouseholdIdentity&&typeof HouseholdIdentity.getMember==='function'){
        var direct=HouseholdIdentity.getMember(uid);
        if(direct)return direct;
      }
    }catch(e){}
    return members().find(function(member){return String(member&&((member.uid||member.id)))===String(uid);})||null;
  }

  function snapshotLegacy(){
    return {
      name:get(LEGACY.name),
      partner:get(LEGACY.partner),
      avatar:get(LEGACY.avatar),
      avatarId:get(LEGACY.avatarId)
    };
  }

  function backupLegacyOnce(){
    try{
      if(localStorage.getItem(BACKUP_KEY))return;
      var snap=snapshotLegacy();
      if(!snap.name&&!snap.partner&&!snap.avatar&&!snap.avatarId)return;
      localStorage.setItem(BACKUP_KEY,JSON.stringify(snap));
    }catch(e){}
  }

  function inferLegacyOwnerUid(){
    var legacyName=norm(get(LEGACY.name));
    if(!legacyName)return '';
    var matches=members().filter(function(member){
      return legacyName===norm(member&&(member.name||member.displayName));
    });
    return matches.length===1?String(matches[0].uid||matches[0].id||''):'';
  }

  function preserveLegacyForUid(uid){
    if(!uid)return;
    var snap=snapshotLegacy();
    if(snap.name)set(scoped(SCOPED.name,uid),snap.name);
    if(snap.partner)set(scoped(SCOPED.partner,uid),snap.partner);
    if(snap.avatar)set(scoped(SCOPED.avatar,uid),snap.avatar);
    if(snap.avatarId)set(scoped(SCOPED.avatarId,uid),snap.avatarId);
  }

  function preserveOutgoing(){
    backupLegacyOnce();
    if(activeUid){preserveLegacyForUid(activeUid);return;}
    var inferred=inferLegacyOwnerUid();
    if(inferred)preserveLegacyForUid(inferred);
  }

  function identityFor(uid){
    var member=memberByUid(uid);
    var user=authUser();
    var userMatches=user&&String(user.uid||'')===String(uid||'');
    var storedName=get(scoped(SCOPED.name,uid));
    var storedPartner=get(scoped(SCOPED.partner,uid));
    var storedAvatar=get(scoped(SCOPED.avatar,uid));
    var storedAvatarId=get(scoped(SCOPED.avatarId,uid));
    var memberName=clean(member&&(member.displayName||member.name));
    var authName=userMatches?clean(user.displayName):'';
    var emailName=userMatches&&user.email?clean(String(user.email).split('@')[0]):'';
    var memberAvatar=clean(member&&(member.avatar||member.avatarUrl||member.photoURL));
    var authAvatar=userMatches?clean(user.photoURL):'';
    return {
      name:clean(storedName||memberName||authName||emailName||'Gezinslid'),
      partner:clean(storedPartner),
      avatar:clean(memberAvatar||storedAvatar||authAvatar),
      avatarId:clean(storedAvatarId)
    };
  }

  function scheduleLegacyRefresh(){
    clearTimeout(refreshTimer);
    refreshTimer=setTimeout(function(){
      try{if(window.FamilyAvatarIdentity&&typeof FamilyAvatarIdentity.refresh==='function')FamilyAvatarIdentity.refresh();}catch(e){}
      try{if(typeof window.updateHeaderAvatar==='function')window.updateHeaderAvatar();}catch(e){}
    },60);
  }

  function applyUid(uid,reason){
    uid=uid?String(uid):null;
    if(uid!==activeUid){
      preserveOutgoing();
      activeUid=uid;
    }
    if(!uid){
      scheduleLegacyRefresh();
      return false;
    }
    var profile=identityFor(uid);
    set(LEGACY.name,profile.name);
    set(LEGACY.partner,profile.partner);
    set(LEGACY.avatar,profile.avatar);
    set(LEGACY.avatarId,profile.avatarId);
    try{window.myName=profile.name;if(typeof myName!=='undefined')myName=profile.name;}catch(e){}
    try{window.myInitials=initials(profile.name);if(typeof myInitials!=='undefined')myInitials=window.myInitials;}catch(e){}
    scheduleLegacyRefresh();
    try{window.dispatchEvent(new CustomEvent('familyapp:legacy-profile-uid-synced',{detail:{uid:uid,reason:reason||'sync'}}));}catch(e){}
    return true;
  }

  function activeContextUid(){
    var ctx=context();
    if(ctx&&ctx.uid)return String(ctx.uid);
    var user=authUser();
    return user&&user.uid?String(user.uid):null;
  }

  window.addEventListener('familyapp:household-context',function(event){
    var ctx=event&&event.detail&&event.detail.context;
    applyUid(ctx&&ctx.uid?ctx.uid:null,event&&event.detail&&event.detail.reason||'context');
  });

  window.addEventListener('familyapp:household-identity-synced',function(){
    var uid=activeContextUid();
    if(uid)applyUid(uid,'identity-synced');
  });

  window.addEventListener('familyapp:avatar-updated',function(event){
    var detail=event&&event.detail||{};
    var uid=detail.uid||activeContextUid()||activeUid;
    if(!uid)return;
    uid=String(uid);
    var url=clean(detail.url||get(LEGACY.avatar));
    var id=clean(detail.id||get(LEGACY.avatarId));
    if(url)set(scoped(SCOPED.avatar,uid),url);
    if(id)set(scoped(SCOPED.avatarId,uid),id);
    if(uid===activeUid)scheduleLegacyRefresh();
  });

  window.addEventListener('familyapp:profile-updated',function(event){
    var detail=event&&event.detail||{};
    var uid=detail.uid||activeContextUid()||activeUid;
    if(!uid||String(uid)!==String(activeUid||uid))return;
    if(Object.prototype.hasOwnProperty.call(detail,'name'))set(LEGACY.name,clean(detail.name));
    if(Object.prototype.hasOwnProperty.call(detail,'partner'))set(LEGACY.partner,clean(detail.partner));
    scheduleLegacyRefresh();
  });

  window.FamilyLegacyProfileUidBridge={
    version:'1.0.0',
    sync:function(){return applyUid(activeContextUid(),'manual');},
    getActiveUid:function(){return activeUid;},
    getScopedAvatar:function(uid){return uid?get(scoped(SCOPED.avatar,String(uid))):'';},
    status:function(){return{uid:activeUid,legacy:snapshotLegacy()};}
  };

  var initial=activeContextUid();
  if(initial)applyUid(initial,'bootstrap');
})();
