'use strict';
// ============================================================
// PROFIEL BRIDGE
// Koppelt de oude renderProfile()-aanroep vanuit navigation.js
// aan de nieuwe ProfileScreen.target.js module.
// ============================================================

var _profileMounted = false;

// Identity/avatar bootstrap. HouseholdIdentity remains a compatibility layer;
// Firebase household identity is read through householdIdentityFirebaseBridge.
(function bootstrapAvatarIdentity(){
  function load(src, done){
    var base=src.split('?')[0];
    var existing=[].slice.call(document.scripts||[]).find(function(s){ return (s.getAttribute('src')||'').split('?')[0]===base; });
    if(existing){ if(done) done(); return; }
    var s=document.createElement('script'); s.src=src; s.async=false;
    s.onload=function(){ if(done) done(); };
    s.onerror=function(){ console.warn('[AvatarIdentity] Kon script niet laden:',src); if(done) done(); };
    document.head.appendChild(s);
  }
  function loadFirebaseIdentity(){
    load('/src/core/householdIdentityFirebaseBridge.js?v=2',function(){
      try { if(window.HouseholdIdentityFirebaseBridge) window.HouseholdIdentityFirebaseBridge.sync(); } catch(e){}
    });
  }
  function loadBridge(){ load('/src/core/avatarIdentityBridge.js',loadFirebaseIdentity); }
  if(window.HouseholdIdentity) loadBridge(); else load('/src/core/householdIdentity.js',loadBridge);
})();

function renderProfile(){
  var container=document.getElementById('screen-profile');
  if(!container) return;
  if(!document.querySelector('link[href*="profile.target.css"]')){
    var link=document.createElement('link'); link.rel='stylesheet'; link.href='/src/modules/profile/profile.target.css'; document.head.appendChild(link);
  }
  import('/src/modules/profile/ProfileScreen.target.js').then(function(mod){
    mod.renderProfileScreen(container); _profileMounted=true; if(window.FamilyAvatarIdentity) window.FamilyAvatarIdentity.sync();
  }).catch(function(err){ console.error('[ProfileBridge] Kon nieuwe profielmodule niet laden:',err); });
}

function updateHeaderAvatar(){
  var av=document.getElementById('hdr-avatar'); if(!av) return;
  if(window.HouseholdIdentity && typeof window.HouseholdIdentity.getActiveAvatar === 'function'){
    var centralUrl=window.HouseholdIdentity.getActiveAvatar();
    if(centralUrl){ av.innerHTML='<img src="'+centralUrl+'" style="width:100%;height:100%;object-fit:cover;border-radius:50%" onerror="this.style.display=\'none\'">'; return; }
  }
  import('/src/modules/profile/avatarStore.js').then(function(store){
    var url=store.getCurrentAvatarUrl();
    if(url) av.innerHTML='<img src="'+url+'" style="width:100%;height:100%;object-fit:cover;border-radius:50%">';
    else av.textContent=(typeof myInitials!=='undefined')?myInitials:'?';
  }).catch(function(){ av.textContent=(typeof myInitials!=='undefined')?myInitials:'?'; });
}

window.addEventListener('familyapp:avatar-updated',function(){
  updateHeaderAvatar();
  if(window.FamilyAvatarIdentity) window.FamilyAvatarIdentity.sync();
  if(_profileMounted){
    var container=document.getElementById('screen-profile');
    if(container && container.classList.contains('active')) import('/src/modules/profile/ProfileScreen.target.js').then(function(mod){ mod.renderProfileScreen(container); });
  }
});
