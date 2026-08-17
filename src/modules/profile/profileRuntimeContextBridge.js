'use strict';
// ============================================================
// PROFILE RUNTIME CONTEXT BRIDGE v2.0.0
// Makes ProfileContextService authoritative for current-user identity.
// Legacy profile controls remain presentation-only and cannot write global
// identity keys before the canonical UID-scoped update succeeds.
// ============================================================
(function(){
  if(window.ProfileRuntimeContextBridge&&window.ProfileRuntimeContextBridge.version==='2.0.0')return;
  var VERSION='2.0.0';
  function svc(){return window.ProfileContextService||null;}
  function toast(msg){try{if(typeof window.showToast==='function')showToast(msg);}catch(e){}}
  function current(){try{return svc()&&svc().getCurrentMember?svc().getCurrentMember():null;}catch(e){return null;}}
  function members(){try{return svc()&&svc().getMembers?svc().getMembers()||[]:[];}catch(e){return[];}}
  function patchGlobals(){var m=current();if(!m)return;try{window.myName=m.displayName||m.name||'Gezinslid';window.myInitials=m.initials||String(window.myName).split(/\s+/).map(function(p){return p.charAt(0);}).join('').slice(0,2).toUpperCase();}catch(e){}}
  function patchProfileUi(){
    var root=document.getElementById('screen-profile');if(!root)return;
    var mine=current(),nameInput=root.querySelector('[data-profile-name]');if(nameInput&&mine)nameInput.value=mine.displayName||mine.name||'';
    var partner=root.querySelector('[data-partner-name]');if(partner){var me=mine&&String(mine.uid||mine.id||''),other=members().find(function(m){return String(m.uid||m.id||'')!==me;});partner.value=other?(other.displayName||other.name||''):'';partner.readOnly=true;partner.setAttribute('aria-readonly','true');partner.title='Gezinsleden worden beheerd via household membership';}
  }
  function onProfileClick(e){
    var save=e.target&&e.target.closest?e.target.closest('[data-save-profile]'):null;if(!save)return;
    // Capture before the legacy module's onclick can write global profile keys.
    e.preventDefault();e.stopImmediatePropagation();
    var root=save.closest('#screen-profile')||document,input=root.querySelector('[data-profile-name]'),name=input&&String(input.value||'').trim();
    if(!name||!svc()){toast('Profiel is nog niet beschikbaar');return;}
    var token;try{token=svc().capture();}catch(err){toast('Profiel is nog niet beschikbaar');return;}
    save.disabled=true;
    Promise.resolve(svc().updateName(name)).then(function(){if(!svc().isCurrent(token))return;patchGlobals();patchProfileUi();toast('Profiel opgeslagen');}).catch(function(err){if(err&&err.code==='PROFILE_CONTEXT_CHANGED')toast('Profiel niet opgeslagen: account of gezin is gewijzigd');else{console.warn('[ProfileRuntimeContextBridge] name sync failed',err);toast('Profiel kon niet worden opgeslagen');}}).then(function(){if(svc()&&svc().isCurrent(token))save.disabled=false;});
  }
  function onContext(){patchGlobals();patchProfileUi();}
  document.addEventListener('click',onProfileClick,true);
  ['familyapp:profile-context-updated','familyapp:avatar-updated','familyapp:household-context-changed','familyapp:household-identity-synced'].forEach(function(ev){window.addEventListener(ev,onContext);});
  window.ProfileRuntimeContextBridge={version:VERSION,refresh:function(){try{if(svc())svc().refresh();}catch(e){}onContext();},current:current};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',onContext);else onContext();
})();
