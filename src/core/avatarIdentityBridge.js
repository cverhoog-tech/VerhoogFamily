'use strict';
// ============================================================
// FAMILYAPP AVATAR IDENTITY BRIDGE v2
// Presentation-only avatar resolver backed by ProfileContextService.
// No legacy name/browser-storage identity authority and no Firebase writes.
// ============================================================
(function(){
  if(window.__familyAvatarIdentityBridgeV2)return;
  window.__familyAvatarIdentityBridgeV2=true;
  var EXACT_BASE='./src/assets/avatars/exact';
  var EXACT=['01-aiden.webp','02-kai.webp','03-liam.webp','04-asuna.webp','05-elizabeth.webp','06-mila.webp','07-dylan.webp','08-ethan.webp','09-noah.webp','10-sophie.webp','11-luna.webp','12-zara.webp'].map(function(x){return EXACT_BASE+'/'+x;});
  function clean(v){return String(v||'').trim();}
  function members(){try{return window.ProfileContextService&&ProfileContextService.getMembers?ProfileContextService.getMembers()||[]:[];}catch(e){return[];}}
  function current(){try{return window.ProfileContextService&&ProfileContextService.getCurrentMember?ProfileContextService.getCurrentMember():null;}catch(e){return null;}}
  function find(input){if(input&&typeof input==='object')return input;var key=clean(input);return members().find(function(m){return String(m.uid||m.id)===key||clean(m.displayName||m.name)===key;})||null;}
  function initials(input){var m=find(input),name=clean(m&&(m.displayName||m.name)||input);return name.split(/\s+/).filter(Boolean).map(function(p){return p.charAt(0);}).join('').slice(0,2).toUpperCase()||'?';}
  function fallback(input){var m=find(input),seed=clean(m&&(m.uid||m.id||m.displayName||m.name)||input||'member'),h=0;for(var i=0;i<seed.length;i++)h=((h<<5)-h+seed.charCodeAt(i))|0;return EXACT[Math.abs(h)%EXACT.length];}
  function avatar(input){var m=find(input),url=m&&(m.avatar||m.avatarUrl||m.photoURL||m.profilePhoto);return url||fallback(m||input);}
  function setImg(img,input){if(!img)return;var url=avatar(input);if(url&&img.getAttribute('src')!==url)img.setAttribute('src',url);img.classList.add('family-avatar-img');img.onerror=function(){img.onerror=null;img.setAttribute('src',fallback(input));};}
  function inject(el,input){if(!el)return;var img=el.matches&&el.matches('img')?el:el.querySelector('img.family-avatar-img');if(!img){img=document.createElement('img');img.className='family-avatar-img';img.alt=clean((find(input)||{}).displayName||input)||'avatar';el.innerHTML='';el.appendChild(img);}setImg(img,input);}
  function patchHeader(){var m=current(),el=document.getElementById('hdr-avatar');if(el)inject(el,m||'member');}
  function patchHome(){var m=current(),el=document.querySelector('.home-hero-avatar');if(el)inject(el,m||'member');}
  function patchProfile(){var m=current(),img=document.querySelector('.profile-main-avatar');if(img)setImg(img,m||'member');}
  function patchFeed(){var m=current();var compose=document.getElementById('compose-avatar');if(compose)inject(compose,m||'member');document.querySelectorAll('.fs-compose-avatar,.premium-avatar').forEach(function(el){inject(el,m||'member');});}
  function patchPerson(){document.querySelectorAll('[data-member-id],[data-user-id]').forEach(function(el){var id=el.getAttribute('data-member-id')||el.getAttribute('data-user-id');var img=el.matches('img')?el:el.querySelector('img');if(img)setImg(img,id);});}
  function ensureCss(){if(document.getElementById('family-unified-avatar-style'))return;var s=document.createElement('style');s.id='family-unified-avatar-style';s.textContent='.family-avatar-img{width:100%;height:100%;object-fit:cover;display:block;border-radius:inherit}.home-hero-avatar,.fs-compose-avatar,.premium-avatar,#hdr-avatar{overflow:hidden}';document.head.appendChild(s);}
  function refresh(){ensureCss();patchHeader();patchHome();patchProfile();patchFeed();patchPerson();}
  function installIdentityResolvers(){var hi=window.HouseholdIdentity||null;if(!hi)return false;hi.resolveAvatar=avatar;hi.resolveInitials=initials;hi.getActiveAvatar=function(){return avatar(current()||'member');};return true;}
  function boot(){installIdentityResolvers();refresh();var observer=new MutationObserver(function(){clearTimeout(boot._t);boot._t=setTimeout(refresh,40);});if(document.body)observer.observe(document.body,{childList:true,subtree:true});['familyapp:profile-context-updated','familyapp:household-members-updated','familyapp:household-context-changed','familyapp:avatar-updated'].forEach(function(ev){window.addEventListener(ev,refresh);});}
  window.FamilyAvatarIdentity={version:'2.0.0',resolveAvatar:avatar,resolveInitials:initials,refresh:refresh,sync:refresh};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
