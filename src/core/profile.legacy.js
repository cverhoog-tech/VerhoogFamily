'use strict';
// ============================================================
// PROFIEL BRIDGE
// Koppelt de oude renderProfile()-aanroep vanuit navigation.js
// aan de nieuwe ProfileScreen.target.js module.
// Also bootstraps shared account progression and premium Person UI layers.
// ============================================================

var _profileMounted = false;

(function bootstrapSharedIdentityAndProgression(){
  var loaded={};
  function load(src,done){
    if(loaded[src]){if(done)done();return;}
    var existing=[].slice.call(document.scripts||[]).find(function(s){return (s.getAttribute('src')||'').split('?')[0]===src.split('?')[0];});
    if(existing){loaded[src]=true;if(done)done();return;}
    var s=document.createElement('script');s.src=src;s.async=false;
    s.onload=function(){loaded[src]=true;if(done)done();};
    s.onerror=function(){console.warn('[FamilyBootstrap] Kon script niet laden:',src);if(done)done();};
    document.head.appendChild(s);
  }
  function series(items,done){var i=0;function next(){if(i>=items.length){if(done)done();return;}load(items[i++],next);}next();}

  series(['/src/core/householdIdentity.js','/src/core/avatarIdentityBridge.js'],function(){
    if(window.FamilyAvatarIdentity&&typeof FamilyAvatarIdentity.sync==='function')FamilyAvatarIdentity.sync();
  });

  series([
    '/src/core/householdRepository.js?v=progression-bootstrap-1',
    '/src/core/familyDataStore.js?v=progression-bootstrap-1',
    '/src/core/progressionEngine.js?v=12',
    '/src/core/progressionUnlocks.js?v=2',
    '/src/modules/skills/skillsProgressionBridge.js?v=3',
    '/src/modules/tasks/taskMutationRepositoryBridge.js?v=336',
    '/src/modules/tasks/personHeroFantasyPolish.js?v=1'
  ],function(){
    try{if(window.SkillsProgressionBridge&&typeof SkillsProgressionBridge.repair==='function')SkillsProgressionBridge.repair();}catch(e){}
    try{if(window.TaskMutationRepositoryBridge&&typeof TaskMutationRepositoryBridge.boot==='function')TaskMutationRepositoryBridge.boot();}catch(e){}
    try{if(window.PersonHeroFantasyPolish&&typeof PersonHeroFantasyPolish.refresh==='function')PersonHeroFantasyPolish.refresh();}catch(e){}
  });
})();

function renderProfile() {
  var container = document.getElementById('screen-profile');
  if (!container) return;

  if (!document.querySelector('link[href*="profile.target.css"]')) {
    var link = document.createElement('link');
    link.rel  = 'stylesheet';
    link.href = '/src/modules/profile/profile.target.css';
    document.head.appendChild(link);
  }

  import('/src/modules/profile/ProfileScreen.target.js')
    .then(function(mod) {
      mod.renderProfileScreen(container);
      _profileMounted = true;
      if(window.FamilyAvatarIdentity) window.FamilyAvatarIdentity.sync();
    })
    .catch(function(err) {
      console.error('[ProfileBridge] Kon nieuwe profielmodule niet laden:', err);
    });
}

function updateHeaderAvatar() {
  var av = document.getElementById('hdr-avatar');
  if (!av) return;

  if(window.HouseholdIdentity && typeof window.HouseholdIdentity.getActiveAvatar === 'function') {
    var centralUrl = window.HouseholdIdentity.getActiveAvatar();
    if(centralUrl) {
      av.innerHTML = '<img src="' + centralUrl + '" style="width:100%;height:100%;object-fit:cover;border-radius:50%" onerror="this.style.display=\'none\'">';
      return;
    }
  }

  import('/src/modules/profile/avatarStore.js')
    .then(function(store) {
      var url = store.getCurrentAvatarUrl();
      if (url) {
        av.innerHTML = '<img src="' + url + '" style="width:100%;height:100%;object-fit:cover;border-radius:50%">';
      } else {
        av.textContent = (typeof myInitials !== 'undefined') ? myInitials : '?';
      }
    })
    .catch(function() {
      av.textContent = (typeof myInitials !== 'undefined') ? myInitials : '?';
    });
}

window.addEventListener('familyapp:avatar-updated', function() {
  updateHeaderAvatar();
  if(window.FamilyAvatarIdentity) window.FamilyAvatarIdentity.sync();
  if(window.SkillsProgressionBridge&&typeof SkillsProgressionBridge.repair==='function')SkillsProgressionBridge.repair();
  if(window.PersonHeroFantasyPolish&&typeof PersonHeroFantasyPolish.refresh==='function')PersonHeroFantasyPolish.refresh();
  if (_profileMounted) {
    var container = document.getElementById('screen-profile');
    if (container && container.classList.contains('active')) {
      import('/src/modules/profile/ProfileScreen.target.js')
        .then(function(mod) { mod.renderProfileScreen(container); });
    }
  }
});
