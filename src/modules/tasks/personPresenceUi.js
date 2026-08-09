'use strict';
// ============================================================
// PERSON PRESENCE UI v1.0
// ============================================================
// Small compatibility layer for Beta 1: shows Firebase-backed household
// presence in the existing Person tab without changing its renderer/data
// model. HouseholdIdentity is read-only here; FamilyHousehold/Firebase
// remains authoritative for online/lastSeen/area.
// ============================================================
(function(){
  if(window.__personPresenceUiV1) return;
  window.__personPresenceUiV1 = true;

  var VERSION = '1.0';
  var wrapped = false;
  var retryTimer = null;

  function esc(v){
    return String(v == null ? '' : v)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;').replace(/'/g,'&#039;');
  }

  function injectStyles(){
    if(document.getElementById('person-presence-ui-style')) return;
    var style = document.createElement('style');
    style.id = 'person-presence-ui-style';
    style.textContent = ''
      + '.member-card-avatar-wrap{position:relative;width:58px;height:58px;margin:0 auto 6px}'
      + '.member-card-avatar-wrap .member-card-avatar,.member-card-avatar-wrap .member-card-avatar-fallback{margin:0}'
      + '.ptp-presence-dot{position:absolute;right:0;bottom:2px;width:13px;height:13px;border-radius:50%;background:#6b7280;border:2.5px solid #0b0e1a;box-shadow:0 1px 5px rgba(0,0,0,.45)}'
      + '.ptp-presence-dot.is-online{background:#22c55e;box-shadow:0 0 0 2px rgba(34,197,94,.12),0 0 10px rgba(34,197,94,.55)}'
      + '.ptp-presence-status{display:flex;align-items:center;gap:7px;margin-top:7px;font-size:11.5px;font-weight:750;color:rgba(244,246,255,.62);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'
      + '.ptp-presence-status .ptp-presence-mini{width:8px;height:8px;border-radius:50%;background:#6b7280;flex:0 0 8px}'
      + '.ptp-presence-status.is-online{color:#bbf7d0}'
      + '.ptp-presence-status.is-online .ptp-presence-mini{background:#22c55e;box-shadow:0 0 8px rgba(34,197,94,.65)}';
    document.head.appendChild(style);
  }

  function memberFor(name){
    try {
      if(window.HouseholdIdentity && typeof window.HouseholdIdentity.getMember === 'function') {
        return window.HouseholdIdentity.getMember(name) || null;
      }
    } catch(e) {}
    return null;
  }

  function areaLabel(area){
    var map = {
      home:'Home', tasks:'Taken', shop:'Winkelen', recipes:'Recepten', notes:'Notities',
      cal:'Agenda', calendar:'Agenda', finance:'Financien', achievements:'Prestaties',
      skills:'Vaardigheden', meals:'Maaltijden', profile:'Profiel', feed:'Feed'
    };
    var key = String(area || '').toLowerCase();
    return map[key] || (area ? String(area).charAt(0).toUpperCase() + String(area).slice(1) : 'in de app');
  }

  function relativeLastSeen(value){
    var ts = Number(value || 0);
    if(!ts) return 'Offline';
    var diff = Math.max(0, Date.now() - ts);
    var min = Math.floor(diff / 60000);
    if(min < 1) return 'Zojuist actief';
    if(min < 60) return min + ' min geleden actief';
    var hours = Math.floor(min / 60);
    if(hours < 24) return hours + (hours === 1 ? ' uur' : ' uur') + ' geleden actief';
    var days = Math.floor(hours / 24);
    if(days < 7) return days + (days === 1 ? ' dag' : ' dagen') + ' geleden actief';
    return 'Offline';
  }

  function presenceText(member){
    if(!member) return { online:false, text:'Offline' };
    var online = member.onlineStatus === 'online' || member.online === true;
    if(online) return { online:true, text:'Actief · ' + areaLabel(member.area) };
    return { online:false, text:relativeLastSeen(member.lastSeen) };
  }

  function decorate(root){
    root = root || document;
    var page = root.querySelector ? root.querySelector('.task-person-page') : null;
    if(!page) return;
    injectStyles();

    page.querySelectorAll('.member-card[data-person]').forEach(function(card){
      var nameEl = card.querySelector('.member-card-name');
      if(!nameEl) return;
      var member = memberFor(nameEl.textContent.trim());
      var p = presenceText(member);
      var avatar = card.querySelector('.member-card-avatar,.member-card-avatar-fallback');
      if(!avatar) return;
      var wrap = avatar.parentElement && avatar.parentElement.classList.contains('member-card-avatar-wrap') ? avatar.parentElement : null;
      if(!wrap){
        wrap = document.createElement('div');
        wrap.className = 'member-card-avatar-wrap';
        avatar.parentNode.insertBefore(wrap, avatar);
        wrap.appendChild(avatar);
      }
      var dot = wrap.querySelector('.ptp-presence-dot');
      if(!dot){ dot = document.createElement('span'); dot.className = 'ptp-presence-dot'; wrap.appendChild(dot); }
      dot.classList.toggle('is-online', p.online);
      dot.setAttribute('title', p.text);
      dot.setAttribute('aria-label', p.text);
    });

    var heroName = page.querySelector('.ptp-name');
    var copy = page.querySelector('.ptp-copy');
    if(heroName && copy){
      var heroMember = memberFor(heroName.textContent.trim());
      var hp = presenceText(heroMember);
      var old = copy.querySelector('.ptp-presence-status');
      if(old) old.remove();
      var status = document.createElement('div');
      status.className = 'ptp-presence-status' + (hp.online ? ' is-online' : '');
      status.innerHTML = '<span class="ptp-presence-mini"></span><span>' + esc(hp.text) + '</span>';
      var title = copy.querySelector('.ptp-title');
      if(title && title.nextSibling) copy.insertBefore(status, title.nextSibling);
      else if(title) copy.appendChild(status);
      else if(heroName.nextSibling) copy.insertBefore(status, heroName.nextSibling);
      else copy.appendChild(status);
    }
  }

  function installWrapper(){
    if(wrapped) return true;
    if(!window.PersonTabPremium || typeof window.PersonTabPremium.render !== 'function') return false;
    var original = window.PersonTabPremium.render;
    if(original.__presenceWrapped){ wrapped = true; return true; }
    var wrappedRender = function(el){
      var result = original.apply(this, arguments);
      try { decorate(el || document); } catch(e) { console.warn('[PersonPresenceUi] decorate failed', e); }
      return result;
    };
    wrappedRender.__presenceWrapped = true;
    window.PersonTabPremium.render = wrappedRender;
    if(window.renderTasksPersoon === original) window.renderTasksPersoon = wrappedRender;
    wrapped = true;
    setTimeout(function(){ decorate(document); }, 0);
    return true;
  }

  function boot(){
    if(installWrapper()) return;
    var tries = 0;
    retryTimer = setInterval(function(){
      tries++;
      if(installWrapper() || tries > 120){ clearInterval(retryTimer); retryTimer = null; }
    }, 100);
  }

  function refresh(){
    if(!wrapped) installWrapper();
    setTimeout(function(){ decorate(document); }, 0);
  }

  window.addEventListener('familyapp:household-members-updated', refresh);
  window.addEventListener('familyapp:household-identity-synced', refresh);
  window.addEventListener('focus', refresh);

  window.PersonPresenceUi = { version: VERSION, refresh: refresh, decorate: decorate };
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();