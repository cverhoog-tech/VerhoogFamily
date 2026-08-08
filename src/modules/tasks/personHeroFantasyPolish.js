'use strict';
// FamilyApp Person tab cinematic hero polish v1
(function(){
  if(window.PersonHeroFantasyPolish)return;
  var VERSION='1.0.0',BG='/person-hero-fantasy.png?v=1',busy=false;
  function css(){
    if(document.getElementById('person-hero-fantasy-polish-css'))return;
    var s=document.createElement('style');s.id='person-hero-fantasy-polish-css';s.textContent=`
.task-person-page{padding-left:18px!important;padding-right:18px!important;background:radial-gradient(100% 80% at 50% 0%,#191338 0%,#0b0e1a 55%,#07080f 100%)!important}
.member-selector{gap:16px!important;margin-bottom:20px!important;padding:4px 2px 8px!important}.member-card{width:78px!important}.member-card-avatar,.member-card-avatar-fallback,.member-card-add-icon{width:62px!important;height:62px!important}.member-card-name{font-size:13px!important}.member-card-level{font-size:11px!important}
.member-hero-card{min-height:390px!important;border-radius:30px!important;padding:22px 20px 20px!important;margin-bottom:18px!important;background-image:linear-gradient(180deg,rgba(5,7,15,.05) 0%,rgba(5,7,15,.14) 35%,rgba(6,7,14,.90) 76%,rgba(6,7,14,.98) 100%),url('${BG}')!important;background-size:cover!important;background-position:center center!important;box-shadow:0 24px 60px rgba(28,18,74,.55),inset 0 0 0 1px rgba(197,177,255,.20)!important}
.member-hero-card::after{background:radial-gradient(circle at 18% 48%,rgba(139,92,246,.12),transparent 34%)!important}
.member-hero-content{padding-left:92px!important;min-height:116px}.member-hero-profile-avatar{position:absolute;left:20px;bottom:112px;z-index:3;width:76px;height:76px;border-radius:24px;object-fit:cover;background:#171528;border:2px solid rgba(255,255,255,.68);box-shadow:0 12px 28px rgba(0,0,0,.48)}.member-hero-profile-fallback{display:grid;place-items:center;font-size:20px;font-weight:950;color:#fff}
.member-hero-name{font-size:28px!important;line-height:1!important}.member-hero-title{font-size:14px!important;margin-top:6px!important}.member-hero-lvl-badge{width:64px!important;height:64px!important;top:18px!important;right:18px!important}.member-hero-lvl-num{font-size:20px!important}
.member-hero-stats-row{margin-top:18px!important;margin-left:-92px!important}.mh-stat-col{padding:0 12px!important}.mh-stat-lbl{font-size:11px!important}.mh-stat-val{font-size:16px!important}.member-hero-progress-bar{margin-left:-92px!important;height:10px!important;margin-top:18px!important}.member-hero-progress-caption{margin-left:-92px!important;font-size:11.5px!important}
.person-stat-grid{gap:10px!important;margin-bottom:24px!important}.person-stat-card{min-height:112px!important;border-radius:20px!important;padding:15px 7px!important;background:linear-gradient(180deg,rgba(255,255,255,.07),rgba(255,255,255,.035))!important;box-shadow:0 10px 25px rgba(0,0,0,.16)}.psc-icon-wrap{width:40px!important;height:40px!important;font-size:18px!important;margin-bottom:9px!important}.psc-val{font-size:20px!important}.psc-lbl{font-size:9px!important;margin-top:6px!important}
.person-task-card{min-height:76px!important;border-radius:20px!important;padding:14px!important;gap:13px!important}.ptc-icon-sq{width:48px!important;height:48px!important;border-radius:15px!important;font-size:20px!important}.ptc-title{font-size:15px!important}.ptc-check{width:28px!important;height:28px!important}.ptp-see-all{padding:8px 2px!important;font-size:13px!important}
@media(max-width:380px){.member-hero-card{min-height:365px!important}.member-hero-content{padding-left:82px!important}.member-hero-profile-avatar{width:68px;height:68px}.person-stat-grid{gap:7px!important}.person-stat-card{min-height:106px!important}}
`;
    document.head.appendChild(s);
  }
  function avatar(){
    try{if(window.HouseholdIdentity&&HouseholdIdentity.getActiveAvatar)return HouseholdIdentity.getActiveAvatar()||'';}catch(e){}
    try{return localStorage.getItem('familyapp-current-user-avatar-v1')||'';}catch(e){return '';}
  }
  function enhance(){
    if(busy)return;busy=true;
    try{
      css();var hero=document.querySelector('.task-person-page .member-hero-card');if(!hero)return;
      // Never use the Google/profile portrait as the large background.
      hero.style.backgroundImage="linear-gradient(180deg,rgba(5,7,15,.05) 0%,rgba(5,7,15,.14) 35%,rgba(6,7,14,.90) 76%,rgba(6,7,14,.98) 100%),url('"+BG+"')";
      if(!hero.querySelector('.member-hero-profile-avatar')){
        var url=avatar(),node;
        if(url){node=document.createElement('img');node.src=url;node.alt='';node.className='member-hero-profile-avatar';}
        else{node=document.createElement('div');node.className='member-hero-profile-avatar member-hero-profile-fallback';node.textContent=((window.myName||'Jij').slice(0,2)).toUpperCase();}
        hero.appendChild(node);
      }
    }finally{busy=false;}
  }
  function boot(){css();enhance();var root=document.getElementById('task-content')||document.body;new MutationObserver(function(){requestAnimationFrame(enhance);}).observe(root,{childList:true,subtree:true});window.addEventListener('familyapp:avatar-updated',enhance);}
  window.PersonHeroFantasyPolish={version:VERSION,refresh:enhance};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
