'use strict';
// ============================================================
// FAMILYAPP UNIFIED AVATAR IDENTITY BRIDGE v2
// Firebase UID/household identity is authoritative. Authenticated users never
// read another user's unscoped legacy avatar as their own avatar.
// ============================================================
(function(){
  if(window.__familyAvatarIdentityBridgeV2) return;
  window.__familyAvatarIdentityBridgeV2 = true;

  var LEGACY_AVATAR_KEY = 'familyapp-current-user-avatar-v1';
  var LEGACY_AVATAR_ID_KEY = 'familyapp-current-user-avatar-id-v1';
  var LEGACY_PROFILE_NAME_KEY = 'familyapp-profile-name-v1';
  var SCOPED_AVATAR_BASE = 'familyapp-current-user-avatar-v2';
  var SCOPED_AVATAR_ID_BASE = 'familyapp-current-user-avatar-id-v2';
  var SCOPED_NAME_BASE = 'familyapp-profile-name-v2';
  var EXACT_BASE = './src/assets/avatars/exact';
  var EXACT = {
    aiden: EXACT_BASE + '/01-aiden.webp', kai: EXACT_BASE + '/02-kai.webp', liam: EXACT_BASE + '/03-liam.webp',
    asuna: EXACT_BASE + '/04-asuna.webp', elizabeth: EXACT_BASE + '/05-elizabeth.webp', mila: EXACT_BASE + '/06-mila.webp',
    dylan: EXACT_BASE + '/07-dylan.webp', ethan: EXACT_BASE + '/08-ethan.webp', noah: EXACT_BASE + '/09-noah.webp',
    sophie: EXACT_BASE + '/10-sophie.webp', luna: EXACT_BASE + '/11-luna.webp', zara: EXACT_BASE + '/12-zara.webp'
  };

  function cleanName(v){ return String(v || '').trim(); }
  function lower(v){ return cleanName(v).toLowerCase(); }
  function initials(name){
    return cleanName(name).split(/\s+/).filter(Boolean).map(function(p){return p[0];}).join('').slice(0,2).toUpperCase() || '?';
  }
  function scoped(base, uid){ return base + ':' + uid; }
  function isAvatarValue(v){
    return !!(v && typeof v === 'string' && (v.indexOf('data:') === 0 || v.indexOf('blob:') === 0 || v.indexOf('http') === 0 || v.indexOf('./') === 0 || v.indexOf('/') === 0));
  }
  function presetFor(name){
    var n = lower(name);
    if(n.indexOf('esra') > -1 || n.indexOf('sophie') > -1) return EXACT.sophie;
    if(n.indexOf('emma') > -1) return EXACT.elizabeth;
    if(n.indexOf('mark') > -1) return EXACT.ethan;
    if(n.indexOf('luna') > -1) return EXACT.luna;
    return EXACT.aiden;
  }
  function authUser(){
    try { if(window.fbAuth && window.fbAuth.currentUser) return window.fbAuth.currentUser; } catch(e){}
    try { if(window.fbUser && window.fbUser.uid) return window.fbUser; } catch(e){}
    try { if(window.firebase && typeof window.firebase.auth === 'function') return window.firebase.auth().currentUser || null; } catch(e){}
    return null;
  }
  function activeUid(){
    try {
      var ctx = window.HouseholdContext && typeof HouseholdContext.snapshot === 'function' ? HouseholdContext.snapshot() : null;
      if(ctx && ctx.uid) return String(ctx.uid);
    } catch(e){}
    var user = authUser();
    return user && user.uid ? String(user.uid) : '';
  }
  function identity(){ return window.HouseholdIdentity || null; }
  function memberFor(input){
    var hi = identity();
    if(!hi) return null;
    if(input && typeof input === 'object' && (input.id || input.uid)) return input;
    try { return hi.getMember ? hi.getMember(input) : null; } catch(e){ return null; }
  }
  function activeMember(){
    var uid = activeUid();
    var hi = identity();
    if(uid && hi && typeof hi.getMember === 'function') {
      try { var byUid = hi.getMember(uid); if(byUid) return byUid; } catch(e){}
    }
    try { return hi && hi.getActiveMember ? hi.getActiveMember() : null; } catch(e){ return null; }
  }
  function currentProfileName(){
    var uid = activeUid();
    if(uid){
      try {
        var scopedName = localStorage.getItem(scoped(SCOPED_NAME_BASE, uid));
        if(scopedName && scopedName.trim()) return scopedName.trim();
      } catch(e){}
      var member = activeMember();
      if(member){
        var memberName = cleanName(member.displayName || member.name);
        if(memberName) return memberName;
      }
      var user = authUser();
      if(user && user.displayName && String(user.displayName).trim()) return String(user.displayName).trim();
      if(user && user.email) return String(user.email).split('@')[0] || 'Gezinslid';
      return 'Gezinslid';
    }
    try { return localStorage.getItem(LEGACY_PROFILE_NAME_KEY) || window.myName || 'Gezinslid'; }
    catch(e){ return window.myName || 'Gezinslid'; }
  }
  function scopedOwnAvatar(uid){
    if(!uid) return '';
    try {
      var direct = localStorage.getItem(scoped(SCOPED_AVATAR_BASE, uid));
      return isAvatarValue(direct) ? direct : '';
    } catch(e){ return ''; }
  }
  function ownAvatar(){
    var uid = activeUid();
    if(uid){
      var local = scopedOwnAvatar(uid);
      if(local) return local;
      var member = activeMember();
      var memberUrl = member && (member.avatar || member.avatarUrl || member.photoURL || '');
      if(isAvatarValue(memberUrl)) return memberUrl;
      var user = authUser();
      if(user && String(user.uid || '') === uid && isAvatarValue(user.photoURL)) return user.photoURL;
      return presetFor(currentProfileName());
    }
    try {
      var direct = localStorage.getItem(LEGACY_AVATAR_KEY);
      if(isAvatarValue(direct)) return direct;
      var id = localStorage.getItem(LEGACY_AVATAR_ID_KEY) || 'aiden';
      return EXACT[id] || EXACT.aiden;
    } catch(e){ return EXACT.aiden; }
  }
  function legacyMemberAvatar(name){
    try {
      var v = localStorage.getItem('fam_avatar_' + lower(name));
      return isAvatarValue(v) ? v : '';
    } catch(e){ return ''; }
  }
  function isActiveMember(memberOrName){
    var uid = activeUid();
    var m = memberFor(memberOrName);
    if(uid && m) return String(m.uid || m.id || '') === uid;
    var active = activeMember();
    if(m && active) return String(m.id || m.uid || '') === String(active.id || active.uid || '');
    return lower(m ? (m.name || m.displayName) : memberOrName) === lower(currentProfileName());
  }
  function resolveAvatar(memberOrName){
    var m = memberFor(memberOrName);
    var name = m ? (m.displayName || m.name || m.id) : memberOrName;
    if(isActiveMember(m || name)) return ownAvatar();
    if(m && isAvatarValue(m.avatar)) return m.avatar;
    var legacy = legacyMemberAvatar(name);
    if(legacy) return legacy;
    return presetFor(name);
  }
  function resolveInitials(memberOrName){
    var m = memberFor(memberOrName);
    if(m && m.initials) return m.initials;
    return initials(m ? (m.displayName || m.name || m.id) : memberOrName);
  }
  function syncActiveScopedToIdentity(){
    var uid = activeUid();
    var hi = identity();
    if(!uid || !hi || !hi.getMember || !hi.setMemberAvatar) return;
    try {
      var m = hi.getMember(uid);
      var avatar = scopedOwnAvatar(uid);
      if(m && avatar && m.avatar !== avatar) hi.setMemberAvatar(m.id || uid, avatar);
    } catch(e){}
  }
  function installIdentityResolvers(){
    var hi = identity();
    if(!hi) return false;
    hi.resolveAvatar = resolveAvatar;
    hi.resolveInitials = resolveInitials;
    hi.getActiveAvatar = function(){ return ownAvatar(); };
    return true;
  }

  function ensureCss(){
    if(document.getElementById('family-unified-avatar-style')) return;
    var style = document.createElement('style');
    style.id = 'family-unified-avatar-style';
    style.textContent = [
      '.family-avatar-img{width:100%;height:100%;object-fit:cover;display:block;border-radius:inherit}',
      '.member-hero-card{isolation:isolate}',
      '.member-hero-card>.family-person-hero-img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 30%;display:block;z-index:0;pointer-events:none}',
      '.member-hero-card>.family-person-hero-shade{position:absolute;inset:0;z-index:1;pointer-events:none;background:linear-gradient(180deg,rgba(7,8,15,.02) 0%,rgba(7,8,15,.16) 35%,rgba(9,7,20,.94) 100%)}',
      '.member-hero-card>.member-hero-lvl-badge,.member-hero-card>.member-hero-content{z-index:2}',
      '.member-card-avatar{background:#171827}',
      '.home-hero-avatar,.fs-compose-avatar,.fs-avatar,.feed-avatar,.feed-cmt-avatar,.profile-avatar,.premium-avatar,#hdr-avatar{overflow:hidden}',
      '#screen-tasks .task-person-page{max-width:100%;overflow-x:hidden}',
      '#screen-tasks .member-selector{max-width:100%}'
    ].join('\n');
    document.head.appendChild(style);
  }

  function setImg(img, name, url){
    if(!img) return;
    var target = url || resolveAvatar(name);
    if(!target) return;
    if(img.getAttribute('src') !== target) img.setAttribute('src', target);
    img.classList.add('family-avatar-img');
    img.onerror = function(){
      img.onerror = null;
      var fallback = presetFor(name);
      if(img.getAttribute('src') !== fallback) img.setAttribute('src', fallback);
    };
  }
  function injectIntoCircle(el, name){
    if(!el) return;
    var img = el.querySelector('img.family-avatar-img');
    if(!img){
      img = document.createElement('img');
      img.className = 'family-avatar-img';
      img.alt = cleanName(name) || 'avatar';
      el.innerHTML = '';
      el.appendChild(img);
    }
    setImg(img, name);
  }

  function patchPerson(){
    var page = document.querySelector('.task-person-page');
    if(!page) return;
    page.querySelectorAll('.member-card[data-person]').forEach(function(card){
      var name = card.getAttribute('data-person');
      var img = card.querySelector('.member-card-avatar');
      if(img) setImg(img, name);
      else {
        var fallback = card.querySelector('.member-card-avatar-fallback');
        if(fallback){
          var newImg = document.createElement('img');
          newImg.className = 'member-card-avatar family-avatar-img';
          newImg.alt = name;
          fallback.replaceWith(newImg);
          setImg(newImg, name);
        }
      }
    });
    var selected = window.__personTabSelected || currentProfileName();
    var hero = page.querySelector('.member-hero-card');
    if(hero){
      hero.style.backgroundImage = 'none';
      var img = hero.querySelector(':scope > .family-person-hero-img');
      if(!img){
        img = document.createElement('img');
        img.className = 'family-person-hero-img';
        img.alt = cleanName(selected);
        hero.insertBefore(img, hero.firstChild);
      }
      setImg(img, selected);
      var shade = hero.querySelector(':scope > .family-person-hero-shade');
      if(!shade){
        shade = document.createElement('div');
        shade.className = 'family-person-hero-shade';
        hero.insertBefore(shade, img.nextSibling);
      }
    }
  }
  function patchHome(){
    var avatar = document.querySelector('.home-hero-avatar');
    if(avatar) injectIntoCircle(avatar, currentProfileName());
  }
  function patchHeader(){
    var avatar = document.getElementById('hdr-avatar');
    if(avatar) injectIntoCircle(avatar, currentProfileName());
  }
  function patchProfile(){
    var img = document.querySelector('.profile-main-avatar');
    if(img) setImg(img, currentProfileName(), ownAvatar());
  }
  function patchFeed(){
    if(typeof window.stableAvatarUrl === 'function' && !window.stableAvatarUrl.__familyUnified){
      var resolver = function(name){ return resolveAvatar(name || currentProfileName()); };
      resolver.__familyUnified = true;
      window.stableAvatarUrl = resolver;
    }
    if(typeof window.currentProfileAvatarUrl === 'function') window.currentProfileAvatarUrl = function(){ return ownAvatar(); };
    var compose = document.getElementById('compose-avatar');
    if(compose) injectIntoCircle(compose, currentProfileName());
    document.querySelectorAll('.fs-compose-avatar,.premium-avatar').forEach(function(el){
      if(el.tagName === 'IMG') setImg(el, currentProfileName());
      else injectIntoCircle(el, currentProfileName());
    });
  }
  function patchGenericMemberAvatars(){
    document.querySelectorAll('[data-member-id],[data-user-id],[data-author]').forEach(function(el){
      var name = el.getAttribute('data-member-id') || el.getAttribute('data-user-id') || el.getAttribute('data-author');
      var img = el.matches('img') ? el : el.querySelector('img');
      if(img) setImg(img, name);
    });
  }
  function refresh(){
    installIdentityResolvers();
    ensureCss();
    patchHeader();
    patchProfile();
    patchHome();
    patchFeed();
    patchPerson();
    patchGenericMemberAvatars();
  }

  var refreshTimer = null;
  function queueRefresh(){
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(refresh, 30);
  }
  function boot(){
    installIdentityResolvers();
    syncActiveScopedToIdentity();
    refresh();
    var observer = new MutationObserver(queueRefresh);
    observer.observe(document.body, { childList:true, subtree:true });
    window.addEventListener('familyapp:avatar-updated', function(e){
      var detail = e && e.detail || {};
      var uid = activeUid();
      if(detail.uid && uid && String(detail.uid) !== uid) return;
      var hi = identity();
      try {
        var m = uid && hi && hi.getMember ? hi.getMember(uid) : activeMember();
        var url = detail.url || scopedOwnAvatar(uid);
        if(m && hi.setMemberAvatar && url) hi.setMemberAvatar(m.id || uid, url);
      } catch(err){}
      queueRefresh();
    });
    window.addEventListener('familyapp:household-members-updated', queueRefresh);
    window.addEventListener('familyapp:active-member-updated', queueRefresh);
    window.addEventListener('familyapp:household-identity-synced', queueRefresh);
    window.addEventListener('familyapp:household-context', function(){ syncActiveScopedToIdentity(); queueRefresh(); });
    window.addEventListener('familyapp:legacy-profile-uid-synced', queueRefresh);
    window.addEventListener('storage', function(e){
      if(!e || !e.key || e.key.indexOf('avatar') > -1 || e.key.indexOf('familyapp_household_members') > -1) queueRefresh();
    });
    [100,400,1000,2000].forEach(function(ms){ setTimeout(refresh, ms); });
  }

  window.FamilyAvatarIdentity = {
    version:'2.0.0',
    resolveAvatar: resolveAvatar,
    resolveInitials: resolveInitials,
    refresh: refresh,
    sync: function(){ syncActiveScopedToIdentity(); refresh(); }
  };

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
