'use strict';
// ============================================================
// FAMILYAPP PROFILE IDENTITY SYNC v1
// Keeps the visible profile aligned with the authoritative Firebase
// household member, persists profile-name edits, and surfaces presence.
// ============================================================
(function(){
  if(window.__familyProfileIdentitySyncV1) return;
  window.__familyProfileIdentitySyncV1 = true;

  var patchTimer = null;

  function bridge(){ return window.HouseholdIdentityFirebaseBridge || null; }
  function currentMember(){
    var b = bridge();
    if(!b || typeof b.getMembers !== 'function') return null;
    var uid = typeof b.getCurrentUid === 'function' ? b.getCurrentUid() : null;
    if(!uid) return null;
    try {
      return (b.getMembers() || []).find(function(member){ return member && member.uid === uid; }) || null;
    } catch(e){ return null; }
  }
  function clean(value){ return String(value || '').trim(); }
  function areaLabel(area){
    var labels = {
      home:'Home', tasks:'Taken', feed:'Feed', notes:'Notities', shop:'Boodschappen', cal:'Agenda',
      finance:'Financiën', notif:'Meldingen', achievements:'Achievements', profile:'Profiel', recipes:'Recepten',
      skills:'Skills', meals:'Maaltijden', templates:'Templates'
    };
    return labels[area] || '';
  }
  function relativeLastSeen(value){
    var timestamp = Number(value || 0);
    if(!timestamp) return 'Offline';
    var diff = Math.max(0, Date.now() - timestamp);
    if(diff < 60 * 1000) return 'Net actief';
    if(diff < 60 * 60 * 1000) return Math.max(1, Math.floor(diff / 60000)) + ' min geleden';
    if(diff < 24 * 60 * 60 * 1000) return Math.max(1, Math.floor(diff / 3600000)) + ' uur geleden';
    try {
      return 'Laatst actief ' + new Date(timestamp).toLocaleDateString('nl-NL', { day:'numeric', month:'short' });
    } catch(e){ return 'Offline'; }
  }
  function ensureStyles(){
    if(document.getElementById('family-profile-identity-sync-style')) return;
    var style = document.createElement('style');
    style.id = 'family-profile-identity-sync-style';
    style.textContent = [
      '.profile-presence-pill{display:inline-flex;align-items:center;gap:7px;margin:-2px auto 10px;padding:7px 11px;border-radius:999px;font-size:12px;font-weight:800;line-height:1;background:rgba(255,255,255,.62);color:#536174;backdrop-filter:blur(10px);box-shadow:0 6px 18px rgba(31,41,51,.08)}',
      '.profile-presence-pill[data-online="true"]{color:#256d31;background:rgba(235,249,232,.88)}',
      '.profile-presence-dot{width:8px;height:8px;border-radius:50%;background:#98a2b3;box-shadow:0 0 0 3px rgba(152,162,179,.12)}',
      '.profile-presence-pill[data-online="true"] .profile-presence-dot{background:#34a853;box-shadow:0 0 0 3px rgba(52,168,83,.14)}',
      '.profile-save-btn[aria-busy="true"]{opacity:.65;pointer-events:none}',
      '[data-theme="dark"] .profile-presence-pill,[data-theme="night"] .profile-presence-pill{background:rgba(20,27,38,.68);color:#c6ccd6}',
      '[data-theme="dark"] .profile-presence-pill[data-online="true"],[data-theme="night"] .profile-presence-pill[data-online="true"]{background:rgba(34,74,43,.72);color:#b9efc2}'
    ].join('\n');
    document.head.appendChild(style);
  }
  function safeAvatar(url){
    return typeof url === 'string' && !!url && (
      url.indexOf('data:') === 0 || url.indexOf('blob:') === 0 || url.indexOf('http') === 0 ||
      url.indexOf('./') === 0 || url.indexOf('/') === 0
    );
  }
  function patchPresence(hero, member){
    if(!hero) return;
    var pill = hero.querySelector('.profile-presence-pill');
    if(!pill){
      pill = document.createElement('div');
      pill.className = 'profile-presence-pill';
      var title = hero.querySelector('h1');
      if(title && title.nextSibling) hero.insertBefore(pill, title.nextSibling);
      else hero.appendChild(pill);
    }
    var online = !!(member && member.online);
    var location = online && member ? areaLabel(member.area) : '';
    var text = online ? ('Online' + (location ? ' · ' + location : '')) : relativeLastSeen(member && member.lastSeen);
    pill.dataset.online = online ? 'true' : 'false';
    pill.innerHTML = '<span class="profile-presence-dot" aria-hidden="true"></span><span>' + text + '</span>';
  }
  function patchProfile(){
    ensureStyles();
    var container = document.getElementById('screen-profile');
    if(!container || !container.querySelector('.profile-target')) return;
    var member = currentMember();
    var hero = container.querySelector('.profile-hero-card');
    patchPresence(hero, member);
    if(!member) return;

    var name = clean(member.displayName || member.name);
    var heading = hero && hero.querySelector('h1');
    if(heading && name && heading.textContent !== name) heading.textContent = name;

    var nameInput = container.querySelector('[data-profile-name]');
    if(nameInput && name && document.activeElement !== nameInput && nameInput.dataset.profileDirty !== '1'){
      if(nameInput.value !== name) nameInput.value = name;
    }
    if(nameInput && nameInput.dataset.profileDirtyBound !== '1'){
      nameInput.dataset.profileDirtyBound = '1';
      nameInput.addEventListener('input', function(){ nameInput.dataset.profileDirty = '1'; });
    }

    var avatar = member.avatar || '';
    var img = container.querySelector('.profile-main-avatar');
    if(img && safeAvatar(avatar) && img.getAttribute('src') !== avatar) img.setAttribute('src', avatar);
  }
  function queuePatch(){
    clearTimeout(patchTimer);
    patchTimer = setTimeout(patchProfile, 30);
  }
  function toast(message){
    var el = document.querySelector('.profile-toast');
    if(!el){
      el = document.createElement('div');
      el.className = 'profile-toast';
      document.body.appendChild(el);
    }
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(el._familyTimer);
    el._familyTimer = setTimeout(function(){ el.classList.remove('show'); }, 1900);
  }
  function saveProfileName(button, name){
    var b = bridge();
    if(!b || typeof b.updateOwnMemberProfile !== 'function') return;
    button.setAttribute('aria-busy', 'true');
    Promise.resolve(b.updateOwnMemberProfile({ name:name })).then(function(ok){
      if(ok && typeof b.sync === 'function') b.sync();
      queuePatch();
    }).catch(function(err){
      console.warn('[ProfileIdentitySync] Firebase profile save failed', err);
      toast('Naam lokaal opgeslagen · cloud-sync mislukt');
    }).finally(function(){
      if(button && button.isConnected) button.removeAttribute('aria-busy');
    });
  }
  function onDocumentClick(event){
    var button = event.target && event.target.closest ? event.target.closest('[data-save-profile]') : null;
    if(!button) return;
    var container = button.closest('#screen-profile') || document.getElementById('screen-profile');
    var input = container && container.querySelector('[data-profile-name]');
    var name = clean(input && input.value);
    if(!name) return;
    // The legacy profile handler still owns localStorage + rerender. This layer only adds
    // authoritative Firebase persistence and therefore does not create a second UI state.
    setTimeout(function(){ saveProfileName(button, name); }, 0);
  }

  document.addEventListener('click', onDocumentClick, true);
  window.addEventListener('familyapp:household-identity-synced', queuePatch);
  window.addEventListener('familyapp:household-members-updated', queuePatch);
  window.addEventListener('familyapp:avatar-updated', queuePatch);
  window.addEventListener('focus', queuePatch);

  function boot(){
    ensureStyles();
    var target = document.getElementById('screen-profile') || document.body;
    if(target && window.MutationObserver){
      var observer = new MutationObserver(queuePatch);
      observer.observe(target, { childList:true, subtree:true });
    }
    queuePatch();
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
