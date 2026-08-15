'use strict';
(function(){
  if(window.__householdIdentityFirebaseBridgeV3) return;
  window.__householdIdentityFirebaseBridgeV3 = true;

  var membersRef = null;
  var presenceRef = null;
  var currentHouseholdId = null;
  var currentUid = null;
  var lastMembers = {};
  var lastPresence = {};
  var bootTimer = null;
  var subscribers = [];
  var migrationInFlight = false;

  function db(){ try { return window.fbDb || (window.firebase && firebase.database && firebase.database()) || null; } catch(e){ return null; } }
  function authUser(){ try { return window.fbUser || (window.firebase && firebase.auth && firebase.auth().currentUser) || null; } catch(e){ return null; } }
  function householdId(){ return window.fbFamilyId || null; }
  function initials(name){ return String(name || '?').split(/\s+/).filter(Boolean).map(function(part){ return part[0]; }).join('').slice(0,2).toUpperCase() || '?'; }

  function notify(members){ subscribers.slice().forEach(function(fn){ try { fn((members||[]).slice()); } catch(e){ console.warn('[HouseholdIdentityFirebaseBridge] subscriber failed', e); } }); }

  function detach(options){
    options=options||{};
    var hadState=!!(membersRef||presenceRef||currentHouseholdId||currentUid||Object.keys(lastMembers||{}).length||Object.keys(lastPresence||{}).length);
    try { if(membersRef) membersRef.off(); } catch(e){}
    try { if(presenceRef) presenceRef.off(); } catch(e){}
    membersRef = null;
    presenceRef = null;
    currentHouseholdId = null;
    currentUid = null;
    lastMembers = {};
    lastPresence = {};
    migrationInFlight=false;
    if(hadState && options.notify !== false) notify([]);
    try {
      if(hadState) window.dispatchEvent(new CustomEvent('familyapp:household-identity-detached',{detail:{reason:options.reason||'context-cleared'}}));
    } catch(e){}
  }

  function normalizedMembers(){
    return Object.keys(lastMembers || {}).map(function(uid){
      var raw = lastMembers[uid];
      if(!raw || raw.status === 'removed' || raw.status === 'inactive') return null;
      var presence = (lastPresence && lastPresence[uid]) || {};
      var name = raw.name || raw.displayName || (raw.email ? raw.email.split('@')[0] : 'Gezinslid');
      return { id:uid, uid:uid, accountId:uid, authUid:uid, name:name, displayName:raw.displayName || name,
        initials:raw.initials || initials(name), avatar:raw.avatar || raw.avatarUrl || raw.photoURL || '', role:raw.role || 'member',
        status:raw.status || 'active', onlineStatus:presence.online ? 'online' : 'offline', online:presence.online === true,
        lastSeen:presence.lastSeen || null, area:presence.area || '', joinedAt:raw.joinedAt || null,
        createdAt:raw.joinedAt || raw.createdAt || null, updatedAt:raw.updatedAt || presence.lastSeen || null };
    }).filter(Boolean).sort(function(a,b){
      var aj = Number(a.joinedAt || 0), bj = Number(b.joinedAt || 0);
      if(aj && bj && aj !== bj) return aj - bj;
      return String(a.name).localeCompare(String(b.name), 'nl');
    });
  }

  function mirrorAuthoritativeOwnProfile(members){
    var u = authUser();
    if(!u) return;
    var mine = (members || []).find(function(member){ return member.uid === u.uid; });
    if(!mine) return;
    try {
      var nameKey='familyapp-profile-v2:'+u.uid+':name';
      var avatarKey='familyapp-profile-v2:'+u.uid+':avatar';
      if(mine.name && localStorage.getItem(nameKey)!==mine.name) localStorage.setItem(nameKey,mine.name);
      if(mine.avatar && localStorage.getItem(avatarKey)!==mine.avatar) localStorage.setItem(avatarKey,mine.avatar);
      // Compatibility mirror only for the currently authenticated UID.
      if(mine.name && localStorage.getItem('familyapp-profile-name-v1') !== mine.name) localStorage.setItem('familyapp-profile-name-v1', mine.name);
      if(mine.avatar && localStorage.getItem('familyapp-current-user-avatar-v1') !== mine.avatar) localStorage.setItem('familyapp-current-user-avatar-v1', mine.avatar);
    } catch(e){}
  }

  function apply(){
    var members = normalizedMembers();
    mirrorAuthoritativeOwnProfile(members);
    // Compatibility only: old screens may still read HouseholdIdentity. Firebase remains authoritative.
    if(window.HouseholdIdentity && typeof window.HouseholdIdentity.saveMembers === 'function' && members.length){
      try { window.HouseholdIdentity.saveMembers(members); } catch(e){}
      var u = authUser();
      if(u && typeof window.HouseholdIdentity.setActiveMember === 'function'){
        var mine = members.find(function(member){ return member.uid === u.uid; });
        if(mine){
          try { window.HouseholdIdentity.setActiveMember(mine.uid); } catch(e){}
          try { window.myName = mine.name; if(typeof myName !== 'undefined') myName = mine.name; window.myInitials = mine.initials; if(typeof myInitials !== 'undefined') myInitials = mine.initials; } catch(e){}
        }
      }
    }
    notify(members);
    try { window.dispatchEvent(new CustomEvent('familyapp:household-identity-synced', { detail:{ householdId:currentHouseholdId, uid:currentUid, members:members } })); } catch(e){}
    return members.length > 0;
  }

  function attach(hid,uid){
    var d = db();
    if(!d || !hid || !uid) return false;
    if(currentHouseholdId === hid && currentUid===uid && membersRef) return true;
    detach({reason:'context-switch'});
    currentHouseholdId = hid;
    currentUid = uid;
    membersRef = d.ref('families/' + hid + '/members');
    presenceRef = d.ref('families/' + hid + '/presence');
    membersRef.on('value', function(snapshot){
      if(householdId()!==hid || !authUser() || authUser().uid!==uid){ detach({reason:'stale-member-callback'}); return; }
      lastMembers = snapshot.val() || {}; apply(); migrateOwnLegacyProfileOnce();
    });
    presenceRef.on('value', function(snapshot){
      if(householdId()!==hid || !authUser() || authUser().uid!==uid){ detach({reason:'stale-presence-callback'}); return; }
      lastPresence = snapshot.val() || {}; apply();
    });
    return true;
  }

  function sync(){
    var d=db(), u=authUser(), hid=householdId();
    if(!d || !u || !hid){
      detach({reason:!u?'auth-missing':(!hid?'household-missing':'database-missing')});
      return false;
    }
    if((currentUid && currentUid!==u.uid) || (currentHouseholdId && currentHouseholdId!==hid)) detach({reason:'context-switch'});
    attach(hid,u.uid);
    apply();
    return true;
  }

  function updateOwnMemberProfile(patch){
    var d=db(), u=authUser(), hid=householdId();
    if(!d || !u || !hid || !patch) return Promise.resolve(false);
    if(currentUid && currentUid!==u.uid) return Promise.resolve(false);
    if(currentHouseholdId && currentHouseholdId!==hid) return Promise.resolve(false);
    var clean = {};
    if(typeof patch.name === 'string' && patch.name.trim()) clean.name = patch.name.trim();
    if(typeof patch.avatar === 'string' && patch.avatar) clean.avatar = patch.avatar;
    if(!Object.keys(clean).length) return Promise.resolve(false);
    clean.updatedAt = (window.firebase && firebase.database && firebase.database.ServerValue) ? firebase.database.ServerValue.TIMESTAMP : Date.now();
    return d.ref('families/' + hid + '/members/' + u.uid).update(clean).then(function(){ return true; });
  }

  function legacyOwnProfile(){
    var result = {},u=authUser();
    if(!u) return result;
    try {
      var uidName=localStorage.getItem('familyapp-profile-v2:'+u.uid+':name');
      var uidAvatar=localStorage.getItem('familyapp-profile-v2:'+u.uid+':avatar');
      var name=uidName||localStorage.getItem('familyapp-profile-name-v1');
      var avatar=uidAvatar||localStorage.getItem('familyapp-current-user-avatar-v1');
      if(name && name.trim()) result.name=name.trim();
      if(avatar) result.avatar=avatar;
    } catch(e){}
    return result;
  }
  function migrationKey(hid,uid){ return 'familyapp-firebase-member-profile-migrated-v2:' + hid + ':' + uid; }
  function migrateOwnLegacyProfileOnce(){
    var u=authUser(), hid=householdId(); if(!u || !hid || migrationInFlight) return;
    if(currentUid!==u.uid || currentHouseholdId!==hid) return;
    var key=migrationKey(hid,u.uid); try { if(localStorage.getItem(key) === '1') return; } catch(e){}
    var legacy=legacyOwnProfile(), server=(lastMembers&&lastMembers[u.uid])||{}, patch={};
    // One-way migration only fills fields that Firebase does not already own.
    // It must never overwrite an avatar/name that another device already synced.
    if(!server.name && legacy.name) patch.name=legacy.name;
    if(!(server.avatar||server.avatarUrl||server.photoURL) && legacy.avatar) patch.avatar=legacy.avatar;
    if(!Object.keys(patch).length){ try { localStorage.setItem(key,'1'); } catch(e){} return; }
    migrationInFlight=true;
    updateOwnMemberProfile(patch).then(function(){ try { localStorage.setItem(key,'1'); } catch(e){} }).catch(function(err){ console.warn('[HouseholdIdentityFirebaseBridge] legacy profile migration failed',err); }).finally(function(){ migrationInFlight=false; });
  }

  function subscribe(fn){
    if(typeof fn !== 'function') return function(){};
    subscribers.push(fn); try { fn(normalizedMembers()); } catch(e){} sync();
    return function(){ var i=subscribers.indexOf(fn); if(i>=0) subscribers.splice(i,1); };
  }

  function boot(){
    if(bootTimer) return;
    var tries=0; bootTimer=setInterval(function(){ tries++; if(sync() || tries>120){ clearInterval(bootTimer); bootTimer=null; } },250); setTimeout(sync,0);
  }

  window.addEventListener('focus',sync);
  window.addEventListener('online',sync);
  window.addEventListener('familyapp:session:cleared',function(){ detach({reason:'session-cleared'}); });
  window.addEventListener('familyapp:avatar-updated',function(e){ var detail=(e&&e.detail)||{}, url=detail.url||''; if(url) updateOwnMemberProfile({avatar:url}).catch(function(err){ console.warn('[HouseholdIdentityFirebaseBridge] avatar sync failed',err); }); });

  window.HouseholdIdentityFirebaseBridge = {
    version:'3.1', sync:sync, apply:apply, detach:detach, getMembers:function(){ return normalizedMembers(); },
    getCurrentUid:function(){ var u=authUser(); return u ? u.uid : null; }, subscribe:subscribe, updateOwnMemberProfile:updateOwnMemberProfile,
    status:function(){ return { householdId:currentHouseholdId, uid:currentUid, attached:!!membersRef, memberCount:Object.keys(lastMembers||{}).length }; }
  };
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded',boot); else boot();
})();
