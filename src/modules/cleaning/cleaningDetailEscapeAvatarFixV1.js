'use strict';
// Cleaning detail UX repair v1.1.
// Reuses the canonical #cleaning-v2-sheet and FamilyAvatarIdentity.
// No second modal owner, no Firebase listener and no MutationObserver.
(function(){
  if(window.CleaningDetailEscapeAvatarFixV1)return;

  var VERSION='1.1.0';
  var state={root:null,bound:false};

  function text(value){return String(value==null?'':value).trim();}
  function initials(name){var parts=text(name).split(/\s+/).filter(Boolean);return((parts[0]||'G').charAt(0)+(parts.length>1?parts[parts.length-1].charAt(0):'')).toUpperCase();}
  function validAvatar(value){return /^(https?:\/\/|\/|\.\/|blob:|data:image\/)/i.test(text(value));}
  function sheet(){return document.getElementById('cleaning-v2-sheet');}
  function repo(){return window.CleaningHouseholdRepository||window.CleaningV2Repository||null;}
  function snapshot(){var r=repo();try{return r&&typeof r.snapshot==='function'?r.snapshot():null;}catch(error){return null;}}
  function members(){try{var bridge=window.HouseholdIdentityFirebaseBridge,rows=bridge&&typeof bridge.getMembers==='function'?bridge.getMembers():[];return Array.isArray(rows)?rows.filter(Boolean):[];}catch(error){return[];}}
  function member(uid){uid=text(uid);return members().find(function(row){return text(row&&(row.uid||row.id))===uid;})||null;}
  function memberName(row){return text(row&&(row.displayName||row.name))||'Gezinslid';}

  function ensureStyle(){
    if(document.getElementById('cleaning-detail-escape-avatar-fix-v1-style'))return;
    var style=document.createElement('style');
    style.id='cleaning-detail-escape-avatar-fix-v1-style';
    style.textContent=''
      +'#cleaning-v2-sheet>.cv2-sheet{position:relative!important}'
      +'#cleaning-v2-sheet .cleaning-detail-close-v1{appearance:none;-webkit-appearance:none;width:42px;height:42px;padding:0;border-radius:50%;border:1px solid rgba(255,255,255,.34);background:rgba(19,24,31,.78);color:#fff;box-shadow:0 7px 20px rgba(0,0,0,.22);font:500 27px/1 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;display:none;place-items:center;touch-action:manipulation;cursor:pointer}'
      +'#cleaning-v2-sheet.is-open .cleaning-detail-close-v1{display:grid!important}'
      +'#cleaning-v2-sheet .fav-turn-hero>.cleaning-detail-close-v1{position:absolute;top:14px;right:14px;z-index:130}'
      +'#cleaning-v2-sheet>.cv2-sheet>.cleaning-detail-close-v1{position:absolute;top:max(14px,calc(env(safe-area-inset-top) + 10px));right:16px;z-index:140}'
      +'#cleaning-v2-sheet .fav-avatar img{width:100%;height:100%;display:block;object-fit:cover;border-radius:inherit}'
      +'[data-theme*="dark"] #cleaning-v2-sheet .cleaning-detail-close-v1{background:rgba(8,13,20,.88);border-color:rgba(255,255,255,.20);box-shadow:0 8px 22px rgba(0,0,0,.38)}';
    document.head.appendChild(style);
  }

  function makeCloseButton(){
    var button=document.createElement('button');
    button.type='button';
    button.className='cleaning-detail-close-v1';
    button.setAttribute('data-cv2-close','');
    button.setAttribute('aria-label','Sluiten');
    button.textContent='×';
    return button;
  }

  function attachSheetListener(s){
    if(!s||s.dataset.cleaningEscapeAvatarBound==='1')return;
    s.dataset.cleaningEscapeAvatarBound='1';
    s.addEventListener('click',scheduleRefresh);
  }

  function ensureCloseButton(){
    var s=sheet();if(!s)return;attachSheetListener(s);
    var host=s.querySelector('.cv2-sheet');if(!host)return;
    var existing=s.querySelector('.cleaning-detail-close-v1');
    if(!s.classList.contains('is-open'))return;
    var hero=s.querySelector('.fav-turn-hero');
    if(hero){
      if(existing&&existing.parentNode!==hero)existing.remove();
      existing=hero.querySelector(':scope > .cleaning-detail-close-v1');
      if(!existing)hero.appendChild(makeCloseButton());
      return;
    }
    if(existing&&existing.parentNode!==host)existing.remove();
    existing=host.querySelector(':scope > .cleaning-detail-close-v1');
    if(!existing)host.appendChild(makeCloseButton());
  }

  function openOccurrenceId(){
    try{var visual=window.CleaningDetailVisualV221,status=visual&&typeof visual.status==='function'?visual.status():null,id=text(status&&status.occurrenceId);if(id)return id;}catch(error){}
    var s=sheet(),marker=s&&s.querySelector('[data-fav-start-cleaning],[data-cv2-complete-all],[data-cv2-supplies]');
    if(!marker)return'';
    return text(marker.getAttribute('data-fav-start-cleaning')||marker.getAttribute('data-cv2-complete-all')||marker.getAttribute('data-cv2-supplies'));
  }

  function occurrence(id){var snap=snapshot(),rows=snap&&snap.data&&snap.data.occurrences||{},row=rows&&rows[id];return row&&typeof row==='object'?row:null;}
  function avatarUrl(row){
    var resolved='';
    try{var identity=window.FamilyAvatarIdentity;if(identity&&typeof identity.resolveAvatar==='function')resolved=text(identity.resolveAvatar(row));}catch(error){}
    if(validAvatar(resolved))return resolved;
    var raw=text(row&&(row.avatar||row.avatarUrl||row.photoURL||row.photoUrl||row.profilePhoto||row.image));
    return validAvatar(raw)?raw:'';
  }

  function patchAssignedAvatar(){
    var s=sheet();if(!s||!s.classList.contains('is-open')||!s.classList.contains('fav-turn-mode'))return;
    var circle=s.querySelector('.fav-person-card .fav-avatar');if(!circle)return;
    var id=openOccurrenceId(),row=occurrence(id);if(!row)return;
    var uids=(Array.isArray(row.assignmentUids)?row.assignmentUids:(Array.isArray(row.assignedToUids)?row.assignedToUids:[])).map(text).filter(Boolean);
    if(!uids.length){var legacy=text(row.assignedUid||row.assigneeUid||row.preferredAssigneeUid);if(legacy)uids=[legacy];}
    var person=uids.length?member(uids[0]):null;if(!person)return;
    var name=memberName(person),url=avatarUrl(person);
    if(!url)return;
    if(circle.dataset.cleaningAvatarUrl===url&&circle.querySelector('img'))return;
    circle.dataset.cleaningAvatarUrl=url;
    circle.innerHTML='';
    var img=document.createElement('img');
    img.src=url;
    img.alt=name;
    img.className='family-avatar-img';
    img.onerror=function(){img.onerror=null;circle.removeAttribute('data-cleaning-avatar-url');circle.innerHTML='<span>'+initials(name)+'</span>';};
    circle.appendChild(img);
  }

  function refresh(){ensureStyle();ensureCloseButton();patchAssignedAvatar();}
  function scheduleRefresh(){
    refresh();
    var raf=window.requestAnimationFrame||function(fn){return window.setTimeout(fn,16);};
    raf(refresh);
    raf(function(){raf(refresh);});
    window.setTimeout(refresh,0);
    window.setTimeout(refresh,60);
    window.setTimeout(refresh,180);
    window.setTimeout(refresh,360);
  }

  function bind(){
    if(state.bound)return true;
    var root=document.getElementById('screen-cleaning');if(!root)return false;
    state.root=root;state.bound=true;
    ensureStyle();refresh();
    root.addEventListener('click',scheduleRefresh,true);
    attachSheetListener(sheet());
    window.addEventListener('familyapp:avatar-updated',scheduleRefresh);
    window.addEventListener('familyapp:household-members-updated',scheduleRefresh);
    window.addEventListener('familyapp:household-identity-synced',scheduleRefresh);
    return true;
  }

  function start(){if(bind())return;if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else window.setTimeout(bind,0);}

  window.CleaningDetailEscapeAvatarFixV1=Object.freeze({version:VERSION,refresh:scheduleRefresh,status:function(){return{version:VERSION,bound:state.bound};}});
  start();
})();

export const CLEANING_DETAIL_ESCAPE_AVATAR_FIX_V1_VERSION='1.1.0';
