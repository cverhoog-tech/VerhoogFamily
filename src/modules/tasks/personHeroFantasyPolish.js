'use strict';
// FamilyApp Person tab cinematic hero polish v1.1
(function(){
  if(window.PersonHeroFantasyPolish)return;
  var VERSION='1.1.0',BG='/person-hero-fantasy.png?v=2',busy=false;
  function css(){
    if(document.getElementById('person-hero-fantasy-polish-css'))return;
    var s=document.createElement('style');s.id='person-hero-fantasy-polish-css';s.textContent=`
.task-person-page{padding-left:18px!important;padding-right:18px!important;background:radial-gradient(100% 80% at 50% 0%,#191338 0%,#0b0e1a 55%,#07080f 100%)!important}
.member-selector{gap:16px!important;margin-bottom:20px!important;padding:4px 2px 8px!important}.member-card{width:78px!important}.member-card-avatar,.member-card-avatar-fallback,.member-card-add-icon{width:62px!important;height:62px!important}.member-card-name{font-size:13px!important}.member-card-level{font-size:11px!important}
.member-hero-card{min-height:340px!important;border-radius:28px!important;padding:20px 18px 18px!important;margin-bottom:18px!important;background-image:linear-gradient(180deg,rgba(5,7,15,.04) 0%,rgba(5,7,15,.12) 38%,rgba(6,7,14,.88) 72%,rgba(6,7,14,.98) 100%),url('${BG}')!important;background-size:100% 100%,220% auto!important;background-position:center center,74% 18%!important;background-repeat:no-repeat!important;box-shadow:0 22px 56px rgba(28,18,74,.50),inset 0 0 0 1px rgba(197,177,255,.18)!important}
.member-hero-card::after{background:radial-gradient(circle at 15% 45%,rgba(139,92,246,.12),transparent 32%)!important}
.member-hero-content{padding-left:86px!important;min-height:108px!important;width:100%!important}.member-hero-profile-avatar{position:absolute;left:18px;bottom:98px;z-index:3;width:70px;height:70px;border-radius:22px;object-fit:cover;background:#171528;border:2px solid rgba(255,255,255,.72);box-shadow:0 12px 28px rgba(0,0,0,.46)}.member-hero-profile-fallback{display:grid;place-items:center;font-size:19px;font-weight:950;color:#fff}
.member-hero-name{font-size:25px!important;line-height:1.05!important;max-width:210px!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important}.member-hero-title{font-size:12.5px!important;margin-top:5px!important;max-width:205px!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important}.member-hero-lvl-badge{width:58px!important;height:58px!important;top:16px!important;right:16px!important}.member-hero-lvl-num{font-size:18px!important}
.member-hero-stats-row{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:0!important;margin-top:16px!important;margin-left:-86px!important;width:calc(100% + 86px)!important}.mh-stat-col{padding:0 8px!important;min-width:0!important;text-align:left!important}.mh-stat-col:first-child{padding-left:0!important}.mh-stat-lbl{font-size:9px!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important}.mh-stat-val{font-size:14px!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important}.mh-stat-sub{display:none!important}.member-hero-progress-bar{margin-left:-86px!important;width:calc(100% + 86px)!important;height:9px!important;margin-top:15px!important}.member-hero-progress-caption{margin-left:-86px!important;width:calc(100% + 86px)!important;font-size:10.5px!important;text-align:center!important}
.person-stat-grid{gap:9px!important;margin-bottom:24px!important}.person-stat-card{min-height:106px!important;border-radius:19px!important;padding:14px 6px!important;background:linear-gradient(180deg,rgba(255,255,255,.065),rgba(255,255,255,.035))!important;box-shadow:0 10px 25px rgba(0,0,0,.16)}.psc-icon-wrap{width:38px!important;height:38px!important;font-size:17px!important;margin-bottom:8px!important}.psc-val{font-size:19px!important}.psc-lbl{font-size:8.5px!important;margin-top:6px!important;line-height:1.15!important}
.person-task-card{min-height:74px!important;border-radius:19px!important;padding:13px!important;gap:12px!important}.ptc-icon-sq{width:46px!important;height:46px!important;border-radius:14px!important;font-size:19px!important}.ptc-title{font-size:14.5px!important}.ptc-check{width:27px!important;height:27px!important}.ptp-see-all{padding:8px 2px!important;font-size:13px!important}
@media(max-width:390px){.member-hero-card{min-height:325px!important;background-size:100% 100%,235% auto!important;background-position:center center,75% 17%!important}.member-hero-content{padding-left:78px!important}.member-hero-profile-avatar{width:64px;height:64px;bottom:96px}.member-hero-stats-row,.member-hero-progress-bar,.member-hero-progress-caption{margin-left:-78px!important;width:calc(100% + 78px)!important}.mh-stat-val{font-size:13px!important}.person-stat-grid{gap:7px!important}.person-stat-card{min-height:102px!important}}
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
      hero.style.backgroundImage="linear-gradient(180deg,rgba(5,7,15,.04) 0%,rgba(5,7,15,.12) 38%,rgba(6,7,14,.88) 72%,rgba(6,7,14,.98) 100%),url('"+BG+"')";
      hero.style.backgroundSize='100% 100%,220% auto';
      hero.style.backgroundPosition='center center,74% 18%';
      hero.style.backgroundRepeat='no-repeat';
      var portrait=hero.querySelector('.member-hero-profile-avatar');
      var url=avatar();
      if(!portrait){
        if(url){portrait=document.createElement('img');portrait.src=url;portrait.alt='';portrait.className='member-hero-profile-avatar';}
        else{portrait=document.createElement('div');portrait.className='member-hero-profile-avatar member-hero-profile-fallback';portrait.textContent=((window.myName||'Jij').slice(0,2)).toUpperCase();}
        hero.appendChild(portrait);
      }else if(url&&portrait.tagName==='IMG'&&portrait.src!==url){portrait.src=url;}
    }finally{busy=false;}
  }
  function boot(){css();enhance();var root=document.getElementById('task-content')||document.body;new MutationObserver(function(){requestAnimationFrame(enhance);}).observe(root,{childList:true,subtree:true});window.addEventListener('familyapp:avatar-updated',enhance);}
  window.PersonHeroFantasyPolish={version:VERSION,refresh:enhance};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
