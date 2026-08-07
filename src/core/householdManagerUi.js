'use strict';
(function(){
  if(window.__familyHouseholdManagerUi) return;window.__familyHouseholdManagerUi=true;
  function add(){
    if(!window.FamilyHousehold) return;
    var screen=document.getElementById('screen-profile');if(!screen||document.getElementById('household-manage-card'))return;
    var card=document.createElement('div');card.id='household-manage-card';card.className='profile-section';
    card.innerHTML='<div style="display:flex;align-items:center;gap:12px;margin-bottom:12px"><div style="width:44px;height:44px;border-radius:14px;background:linear-gradient(145deg,#7c3aed,#a855f7);display:grid;place-items:center;font-size:22px;box-shadow:0 8px 22px rgba(124,58,237,.24)">🏰</div><div><div class="profile-label" style="margin:0">Gezin beheren</div><div style="font-size:12px;color:var(--c-text2);margin-top:2px">Leden, uitnodigingen en live verbinding</div></div></div><button id="household-invite-btn" style="width:100%;min-height:48px;border:0;border-radius:15px;background:linear-gradient(135deg,#7c3aed,#a855f7);color:#fff;font-weight:800;font-size:14px">🤝 Gezinslid uitnodigen</button><div id="household-live-state" style="font-size:11px;color:var(--c-text2);margin-top:9px;text-align:center">Realtime synchronisatie actief</div>';
    var first=screen.querySelector('.profile-section');if(first&&first.parentNode)first.parentNode.insertBefore(card,first);else screen.appendChild(card);
    card.querySelector('#household-invite-btn').onclick=function(){window.FamilyHousehold.showInviteManager();};
  }
  var obs=new MutationObserver(add);function boot(){add();if(document.body)obs.observe(document.body,{childList:true,subtree:true});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
