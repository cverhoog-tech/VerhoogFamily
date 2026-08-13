'use strict';
(function(){
  if(window.__taskCompactAvatarFixV2)return;
  window.__taskCompactAvatarFixV2=true;
  function members(){try{return window.TaskSharedData&&typeof TaskSharedData.members==='function'?TaskSharedData.members()||[]:[];}catch(e){return[];}}
  function esc(v){return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');}
  function initials(name){return String(name||'G').trim().split(/\s+/).map(function(p){return p.charAt(0);}).join('').slice(0,2).toUpperCase()||'G';}
  function avatar(m){if(!m)return'';var name=String(m.displayName||m.name||'').toLowerCase();try{return m.avatar||m.avatarUrl||m.photoURL||m.profilePhoto||localStorage.getItem('fam_avatar_'+name)||'';}catch(e){return m.avatar||m.avatarUrl||m.photoURL||m.profilePhoto||'';}}
  function render(){var host=document.querySelector('.tch-header .tch-party-avatars'),label=document.querySelector('.tch-header .tch-party-label');if(!host)return false;var list=members().slice(0,4);host.innerHTML=list.map(function(m){var src=avatar(m),name=m.displayName||m.name||'Gezinslid';return src?'<img class="tch-party-avatar" src="'+esc(src)+'" alt="'+esc(name)+'">':'<span class="tch-party-avatar" title="'+esc(name)+'">'+esc(initials(name))+'</span>';}).join('');if(label)label.textContent='PARTY · '+members().length;return true;}
  function refresh(){setTimeout(render,0);setTimeout(render,120);}
  window.addEventListener('familyapp:household-identity-synced',refresh);
  window.addEventListener('familyapp:household-members-updated',refresh);
  window.addEventListener('familyapp:avatar-updated',refresh);
  window.addEventListener('familyapp:tasks-updated',refresh);
  var tries=0,t=setInterval(function(){tries++;if(render()&&members().length)clearInterval(t);else if(tries>80)clearInterval(t);},250);
  refresh();
})();
