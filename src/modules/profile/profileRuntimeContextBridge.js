'use strict';
// ============================================================
// PROFILE RUNTIME CONTEXT BRIDGE v1.0.1
// Keeps the existing ProfileScreen UI while routing name updates through
// ProfileContextService. Avatar persistence remains owned by the canonical
// HouseholdIdentityFirebaseBridge listener; localStorage is compatibility only.
// ============================================================
(function(){
  if(window.ProfileRuntimeContextBridge)return;
  var VERSION='1.0.1';
  function svc(){return window.ProfileContextService||null;}function toast(msg){try{if(typeof window.showToast==='function')showToast(msg);}catch(e){}}
  function current(){try{return svc()&&svc().getCurrentMember?svc().getCurrentMember():null;}catch(e){return null;}}
  function patchGlobals(){var m=current();if(!m)return;try{window.myName=m.displayName||m.name||window.myName;window.myInitials=m.initials||window.myInitials;}catch(e){}}
  function onProfileClick(e){var save=e.target&&e.target.closest?e.target.closest('[data-save-profile]'):null;if(!save)return;var root=save.closest('#screen-profile')||save.closest('.profile-screen')||document;var input=root.querySelector('[data-profile-name]');var name=input&&String(input.value||'').trim();if(!name||!svc())return;var token;try{token=svc().capture();}catch(err){return;}setTimeout(function(){if(!svc().isCurrent(token))return;svc().updateName(name).then(function(){patchGlobals();}).catch(function(err){if(err&&err.code==='PROFILE_CONTEXT_CHANGED')toast('Profiel niet opgeslagen: account of gezin is gewijzigd');else console.warn('[ProfileRuntimeContextBridge] name sync failed',err);});},0);}
  function onContext(){patchGlobals();}
  document.addEventListener('click',onProfileClick,true);window.addEventListener('familyapp:profile-context-updated',onContext);window.addEventListener('familyapp:avatar-updated',onContext);window.addEventListener('familyapp:household-context-changed',onContext);window.addEventListener('familyapp:household-identity-synced',onContext);
  window.ProfileRuntimeContextBridge={version:VERSION,refresh:function(){try{if(svc())svc().refresh();}catch(e){}patchGlobals();},current:current};
})();
