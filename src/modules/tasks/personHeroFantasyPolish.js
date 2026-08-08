'use strict';
// FamilyApp Person tab cinematic hero polish v1.2
(function(){
  if(window.PersonHeroFantasyPolish)return;
  var VERSION='1.2.0',BG='/person-hero-fantasy.png?v=3',busy=false;
  function css(){
    if(document.getElementById('person-hero-fantasy-polish-css'))return;
    var s=document.createElement('style');s.id='person-hero-fantasy-polish-css';s.textContent=`
.task-person-page{padding:10px 24px 116px!important;background:radial-gradient(110% 75% at 50% 0%,#1b143d 0%,#0b0e1a 55%,#07080f 100%)!important}
.member-selector{gap:18px!important;margin:0 0 18px!important;padding:3px 0 8px!important;align-items:flex-start!important}.member-card{width:76px!important}.member-card-avatar,.member-card-avatar-fallback,.member-card-add-icon{width:60px!important;height:60px!important}.member-card-name{font-size:12.5px!important}.member-card-level{font-size:10.5px!important}
.member-hero-card{min-height:430px!important;border-radius:32px!important;padding:24px!important;margin-bottom:22px!important;background-image:linear-gradient(180deg,rgba(4,6,13,.02) 0%,rgba(4,6,13,.08) 42%,rgba(5,6,13,.72) 68%,rgba(5,6,13,.98) 100%),url('${BG}')!important;background-size:100% 100%,205% auto!important;background-position:center center,72% 8%!important;background-repeat:no-repeat!important;box-shadow:0 26px 68px rgba(31,18,79,.54),inset 0 0 0 1px rgba(207,192,255,.20)!important}
.member-hero-card::after{background:radial-gradient(circle at 16% 48%,rgba(139,92,246,.16),transparent 34%)!important}
.member-hero-content{padding-left:126px!important;min-height:145px!important;width:100%!important}.member-hero-profile-avatar{position:absolute;left:24px;bottom:126px;z-index:3;width:112px;height:112px;border-radius:50%;object-fit:cover;background:#171528;border:4px solid rgba(210,193,255,.9);box-shadow:0 14px 34px rgba(0,0,0,.5),0 0 0 4px rgba(124,58,237,.24)}.member-hero-profile-fallback{display:grid;place-items:center;font-size:26px;font-weight:950;color:#fff}
.member-hero-name{font-size:32px!important;line-height:1!important;max-width:250px!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important;text-shadow:0 2px 12px rgba(0,0,0,.55)!important}.member-hero-title{font-size:15px!important;margin-top:8px!important;max-width:250px!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important}.member-hero-lvl-badge{width:68px!important;height:68px!important;top:20px!important;right:20px!important}.member-hero-lvl-num{font-size:23px!important}.member-hero-lvl-eyebrow{font-size:8px!important}
.member-hero-stats-row{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:0!important;margin-top:24px!important;margin-left:-126px!important;width:calc(100% + 126px)!important;padding-top:17px!important;border-top:1px solid rgba(255,255,255,.12)!important}.mh-stat-col{padding:0 15px!important;min-width:0!important;text-align:left!important}.mh-stat-col:first-child{padding-left:0!important}.mh-stat-lbl{font-size:11px!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important}.mh-stat-val{font-size:18px!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important}.mh-stat-sub{display:block!important;font-size:9px!important;line-height:1.15!important;max-width:90px!important}
.member-hero-progress-bar{margin-left:-126px!important;width:calc(100% + 126px)!important;height:11px!important;margin-top:22px!important}.member-hero-progress-caption{margin-left:-126px!important;width:calc(100% + 126px)!important;font-size:12px!important;margin-top:8px!important;text-align:center!important}
.person-stat-grid{gap:12px!important;margin-bottom:26px!important}.person-stat-card{min-height:124px!important;border-radius:22px!important;padding:16px 8px!important;background:linear-gradient(180deg,rgba(255,255,255,.075),rgba(255,255,255,.035))!important;box-shadow:0 12px 30px rgba(0,0,0,.17)}.psc-icon-wrap{width:44px!important;height:44px!important;font-size:20px!important;margin-bottom:9px!important}.psc-val{font-size:22px!important}.psc-lbl{font-size:9px!important;margin-top:7px!important;line-height:1.15!important}
.ptp-label{font-size:16px!important}.ptp-row-header{margin-bottom:12px!important}.ptp-see-all{padding:9px 2px!important;font-size:13px!important}.person-task-list{gap:11px!important}.person-task-card{min-height:82px!important;border-radius:21px!important;padding:15px!important;gap:14px!important}.ptc-icon-sq{width:50px!important;height:50px!important;border-radius:15px!important;font-size:21px!important}.ptc-title{font-size:15.5px!important}.ptc-cat{font-size:12px!important}.ptc-check{width:29px!important;height:29px!important}
@media(max-width:390px){.task-person-page{padding-left:18px!important;padding-right:18px!important}.member-hero-card{min-height:400px!important;padding:20px!important;background-size:100% 100%,220% auto!important;background-position:center center,74% 8%!important}.member-hero-content{padding-left:104px!important}.member-hero-profile-avatar{left:20px;bottom:124px;width:94px;height:94px}.member-hero-name{font-size:28px!important}.member-hero-title{font-size:13px!important}.member-hero-stats-row,.member-hero-progress-bar,.member-hero-progress-caption{margin-left:-104px!important;width:calc(100% + 104px)!important}.mh-stat-col{padding:0 9px!important}.mh-stat-val{font-size:15px!important}.mh-stat-lbl{font-size:9px!important}.person-stat-grid{gap:8px!important}.person-stat-card{min-height:112px!important}.psc-val{font-size:19px!important}}
`;
    document.head.appendChild(s);
  }
  function avatar(){try{if(window.HouseholdIdentity&&HouseholdIdentity.getActiveAvatar)return HouseholdIdentity.getActiveAvatar()||'';}catch(e){}try{return localStorage.getItem('familyapp-current-user-avatar-v1')||'';}catch(e){return '';}}
  function enhance(){
    if(busy)return;busy=true;
    try{
      css();var hero=document.querySelector('.task-person-page .member-hero-card');if(!hero)return;
      hero.style.backgroundImage="linear-gradient(180deg,rgba(4,6,13,.02) 0%,rgba(4,6,13,.08) 42%,rgba(5,6,13,.72) 68%,rgba(5,6,13,.98) 100%),url('"+BG+"')";
      hero.style.backgroundSize='100% 100%,205% auto';hero.style.backgroundPosition='center center,72% 8%';hero.style.backgroundRepeat='no-repeat';
      var portrait=hero.querySelector('.member-hero-profile-avatar'),url=avatar();
      if(!portrait){if(url){portrait=document.createElement('img');portrait.src=url;portrait.alt='';portrait.className='member-hero-profile-avatar';}else{portrait=document.createElement('div');portrait.className='member-hero-profile-avatar member-hero-profile-fallback';portrait.textContent=((window.myName||'Jij').slice(0,2)).toUpperCase();}hero.appendChild(portrait);}else if(url&&portrait.tagName==='IMG'&&portrait.src!==url){portrait.src=url;}
    }finally{busy=false;}
  }
  function boot(){css();enhance();var root=document.getElementById('task-content')||document.body;new MutationObserver(function(){requestAnimationFrame(enhance);}).observe(root,{childList:true,subtree:true});window.addEventListener('familyapp:avatar-updated',enhance);}
  window.PersonHeroFantasyPolish={version:VERSION,refresh:enhance};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
