'use strict';
// ============================================================
// FAMILYAPP STEP 12 — PROFILE / PRESENCE / AVATARS
// Rebuild-v2 compatibility layer. Firebase member identity stays authoritative;
// existing UID-scoped profile/avatar storage remains the local projection/cache.
// ============================================================
(function(){
  if(window.__familyProfileIdentitySyncStep12) return;
  window.__familyProfileIdentitySyncStep12 = true;

  var NAME_BASE='familyapp-profile-name-v2';
  var patchTimer=null;

  function bridge(){return window.HouseholdIdentityFirebaseBridge||null;}
  function uid(){var b=bridge();try{return b&&typeof b.getCurrentUid==='function'?b.getCurrentUid():null;}catch(e){return null;}}
  function clean(v){return String(v||'').trim();}
  function member(){
    var b=bridge(),id=uid();if(!b||!id||typeof b.getMembers!=='function')return null;
    try{return (b.getMembers()||[]).find(function(m){return m&&String(m.uid||m.id)===String(id);})||null;}catch(e){return null;}
  }
  function scopedNameKey(id){return NAME_BASE+':'+id;}
  function escapeHtml(v){return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');}
  function areaLabel(area){
    var labels={home:'Home',tasks:'Taken',feed:'Feed',notes:'Notities',shop:'Boodschappen',cal:'Agenda',finance:'Financiën',notif:'Meldingen',achievements:'Achievements',profile:'Profiel',recipes:'Recepten',skills:'Skills',meals:'Maaltijden',templates:'Templates'};
    return labels[area]||'';
  }
  function lastSeenLabel(value){
    var ts=Number(value||0);if(!ts)return'Offline';
    var diff=Math.max(0,Date.now()-ts);
    if(diff<60000)return'Net actief';
    if(diff<3600000)return Math.max(1,Math.floor(diff/60000))+' min geleden';
    if(diff<86400000)return Math.max(1,Math.floor(diff/3600000))+' uur geleden';
    try{return'Laatst actief '+new Date(ts).toLocaleDateString('nl-NL',{day:'numeric',month:'short'});}catch(e){return'Offline';}
  }
  function ensureCss(){
    if(document.getElementById('family-step12-profile-css'))return;
    var s=document.createElement('style');s.id='family-step12-profile-css';s.textContent=[
      '.profile-presence-pill{display:inline-flex;align-items:center;justify-content:center;gap:7px;margin:-2px auto 10px;padding:7px 11px;border-radius:999px;background:rgba(255,255,255,.68);color:#536174;font-size:12px;font-weight:800;line-height:1;backdrop-filter:blur(10px);box-shadow:0 6px 18px rgba(31,41,51,.08)}',
      '.profile-presence-pill[data-online="true"]{background:rgba(235,249,232,.92);color:#256d31}',
      '.profile-presence-dot{width:8px;height:8px;border-radius:50%;background:#98a2b3;box-shadow:0 0 0 3px rgba(152,162,179,.13)}',
      '.profile-presence-pill[data-online="true"] .profile-presence-dot{background:#34a853;box-shadow:0 0 0 3px rgba(52,168,83,.15)}',
      '.profile-save-btn[aria-busy="true"]{opacity:.62;pointer-events:none}',
      '[data-theme="dark"] .profile-presence-pill,[data-theme="night"] .profile-presence-pill{background:rgba(18,25,35,.72);color:#c7cdd7}',
      '[data-theme="dark"] .profile-presence-pill[data-online="true"],[data-theme="night"] .profile-presence-pill[data-online="true"]{background:rgba(35,80,45,.75);color:#c5f3cd}'
    ].join('\n');document.head.appendChild(s);
  }
  function mirrorAuthoritativeName(m){
    var id=uid(),name=clean(m&&(m.displayName||m.name));if(!id||!name)return;
    try{if(localStorage.getItem(scopedNameKey(id))!==name)localStorage.setItem(scopedNameKey(id),name);}catch(e){}
    try{window.myName=name;window.myInitials=name.substring(0,2).toUpperCase();}catch(e){}
  }
  function patchProfile(){
    ensureCss();var container=document.getElementById('screen-profile');if(!container||!container.querySelector('.profile-target'))return;
    var m=member();if(m)mirrorAuthoritativeName(m);
    var hero=container.querySelector('.profile-hero-card');if(!hero)return;
    var pill=hero.querySelector('.profile-presence-pill');
    if(!pill){pill=document.createElement('div');pill.className='profile-presence-pill';var heading=hero.querySelector('h1');if(heading)heading.insertAdjacentElement('afterend',pill);else hero.appendChild(pill);}
    var online=!!(m&&m.online),area=online&&m?areaLabel(m.area):'',label=online?('Online'+(area?' · '+area:'')):lastSeenLabel(m&&m.lastSeen);
    pill.dataset.online=online?'true':'false';pill.innerHTML='<span class="profile-presence-dot" aria-hidden="true"></span><span>'+escapeHtml(label)+'</span>';
    if(m){
      var name=clean(m.displayName||m.name),heading=hero.querySelector('h1'),input=container.querySelector('[data-profile-name]');
      if(heading&&name&&heading.textContent!==name)heading.textContent=name;
      if(input&&name&&document.activeElement!==input&&input.value!==name)input.value=name;
      var avatar=clean(m.avatar||m.avatarUrl||m.photoURL),img=container.querySelector('.profile-main-avatar');
      if(img&&avatar&&img.getAttribute('src')!==avatar)img.setAttribute('src',avatar);
    }
  }
  function queuePatch(){clearTimeout(patchTimer);patchTimer=setTimeout(patchProfile,35);}
  function toast(message){
    var el=document.querySelector('.profile-toast');if(!el){el=document.createElement('div');el.className='profile-toast';document.body.appendChild(el);}el.textContent=message;el.classList.add('show');clearTimeout(el._step12Timer);el._step12Timer=setTimeout(function(){el.classList.remove('show');},1900);
  }
  function persistName(name,button){
    var b=bridge();if(!b||typeof b.updateOwnMemberProfile!=='function'||!name)return;
    if(button)button.setAttribute('aria-busy','true');
    Promise.resolve(b.updateOwnMemberProfile({name:name})).then(function(ok){if(ok&&typeof b.sync==='function')b.sync();queuePatch();}).catch(function(err){console.warn('[STEP12 ProfileIdentitySync] profile save failed',err);toast('Lokaal opgeslagen · cloud-sync mislukt');}).finally(function(){if(button&&button.isConnected)button.removeAttribute('aria-busy');});
  }
  function captureSave(e){
    var button=e.target&&e.target.closest?e.target.closest('[data-save-profile]'):null;if(!button)return;
    var container=button.closest('#screen-profile')||document.getElementById('screen-profile'),input=container&&container.querySelector('[data-profile-name]'),name=clean(input&&input.value);if(!name)return;
    // Existing rebuild-v2 handler keeps its UID-scoped local cache and rerender behaviour.
    // STEP 12 only adds the authoritative Firebase write.
    setTimeout(function(){persistName(name,button);},0);
  }
  function boot(){
    ensureCss();document.addEventListener('click',captureSave,true);
    window.addEventListener('familyapp:household-identity-synced',function(e){var d=e&&e.detail,members=d&&d.members,id=uid();if(id&&Array.isArray(members)){var mine=members.find(function(x){return x&&String(x.uid||x.id)===String(id);});if(mine)mirrorAuthoritativeName(mine);}queuePatch();});
    window.addEventListener('familyapp:household-members-updated',queuePatch);window.addEventListener('familyapp:avatar-updated',queuePatch);window.addEventListener('focus',queuePatch);
    var target=document.getElementById('screen-profile')||document.body;if(target&&window.MutationObserver)new MutationObserver(queuePatch).observe(target,{childList:true,subtree:true});
    queuePatch();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
