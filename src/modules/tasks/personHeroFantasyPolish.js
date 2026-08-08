'use strict';
// FamilyApp Person tab reference rebuild v2.0
(function(){
  if(window.PersonHeroFantasyPolish)return;
  var VERSION='2.0.0',BG='/person-hero-fantasy.png?v=4',busy=false;

  function esc(v){return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
  function txt(root,sel,fallback){var n=root.querySelector(sel);return n&&n.textContent?n.textContent.trim():(fallback||'');}
  function avatar(){
    try{var active=document.querySelector('.member-card-active .member-card-avatar');if(active&&active.src)return active.src;}catch(e){}
    try{if(window.HouseholdIdentity&&HouseholdIdentity.getActiveAvatar)return HouseholdIdentity.getActiveAvatar()||'';}catch(e){}
    try{return localStorage.getItem('familyapp-current-user-avatar-v1')||'';}catch(e){return '';}
  }
  function css(){
    var old=document.getElementById('person-hero-fantasy-polish-css');if(old)old.remove();
    var s=document.createElement('style');s.id='person-hero-fantasy-polish-css';s.textContent=`
.task-person-page{padding:12px 20px 116px!important;background:radial-gradient(110% 80% at 50% 0%,#1a1239 0%,#0a0d18 58%,#07080f 100%)!important}
.member-selector{gap:18px!important;margin:0 0 20px!important;padding:3px 0 6px!important}.member-card{width:76px!important}.member-card-avatar,.member-card-avatar-fallback,.member-card-add-icon{width:60px!important;height:60px!important}.member-card-name{font-size:12.5px!important}.member-card-level{font-size:10.5px!important}
.member-hero-card.ptp2-hero{display:block!important;position:relative!important;min-height:0!important;height:auto!important;border-radius:30px!important;overflow:hidden!important;padding:0!important;margin:0 0 18px!important;background:none!important;box-shadow:0 24px 64px rgba(32,18,82,.50),inset 0 0 0 1px rgba(207,192,255,.16)!important}
.member-hero-card.ptp2-hero::after{display:none!important}.ptp2-landscape{position:relative;min-height:312px;background-image:linear-gradient(180deg,rgba(4,6,13,.03) 0%,rgba(4,6,13,.10) 42%,rgba(5,6,13,.58) 70%,rgba(5,6,13,.96) 100%),url('${BG}');background-size:100% 100%,205% auto;background-position:center center,72% 8%;background-repeat:no-repeat;padding:28px 24px 22px;display:flex;align-items:flex-end}
.ptp2-profile{width:100%;display:grid;grid-template-columns:112px minmax(0,1fr) 66px;gap:18px;align-items:end}.ptp2-avatar{width:112px;height:112px;border-radius:50%;object-fit:cover;background:#171528;border:4px solid rgba(222,208,255,.94);box-shadow:0 14px 34px rgba(0,0,0,.5),0 0 0 4px rgba(124,58,237,.22)}.ptp2-avatar-fallback{display:grid;place-items:center;font-weight:950;font-size:26px;color:#fff}.ptp2-copy{min-width:0;padding-bottom:4px}.ptp2-name{font-size:31px;font-weight:950;line-height:1;color:#fff;letter-spacing:-.55px;text-shadow:0 2px 14px rgba(0,0,0,.55);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.ptp2-title{font-size:14px;font-weight:800;color:#d8ccff;margin-top:7px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.ptp2-level{width:66px;height:66px;clip-path:polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%);background:linear-gradient(160deg,#2d194f,#5a3297);display:flex;flex-direction:column;align-items:center;justify-content:center;box-shadow:inset 0 0 0 2px rgba(253,230,138,.55)}.ptp2-level span{font-size:8px;font-weight:900;letter-spacing:.12em;color:#fde68a;text-transform:uppercase}.ptp2-level strong{font-size:22px;color:#fde68a;line-height:1.05}
.ptp2-lower{background:linear-gradient(180deg,rgba(9,10,20,.97),rgba(8,9,17,.995));padding:18px 22px 20px;border-top:1px solid rgba(255,255,255,.07)}.ptp2-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));margin-bottom:17px}.ptp2-stat{min-width:0;padding:0 13px}.ptp2-stat:first-child{padding-left:0}.ptp2-stat+.ptp2-stat{border-left:1px solid rgba(255,255,255,.13)}.ptp2-stat-label{font-size:10px;font-weight:750;color:rgba(255,255,255,.58);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.ptp2-stat-value{font-size:17px;font-weight:950;color:#fff;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.ptp2-stat-sub{font-size:9px;color:rgba(255,255,255,.45);margin-top:2px}.ptp2-progress{height:10px;border-radius:999px;background:rgba(255,255,255,.16);overflow:hidden}.ptp2-progress-fill{height:100%;border-radius:999px;background:linear-gradient(90deg,#7c3aed,#c4b5fd);box-shadow:0 0 10px rgba(139,92,246,.55)}.ptp2-progress-caption{font-size:11px;font-weight:750;color:rgba(255,255,255,.58);text-align:center;margin-top:7px}
.person-stat-grid{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:0!important;margin:0 0 25px!important;border:1px solid rgba(255,255,255,.09)!important;border-radius:22px!important;overflow:hidden!important;background:linear-gradient(180deg,rgba(255,255,255,.055),rgba(255,255,255,.025))!important}.person-stat-card{min-height:104px!important;border:0!important;border-radius:0!important;padding:15px 6px 13px!important;background:transparent!important;box-shadow:none!important}.person-stat-card+.person-stat-card{border-left:1px solid rgba(255,255,255,.08)!important}.psc-icon-wrap{width:39px!important;height:39px!important;font-size:18px!important;margin:0 auto 8px!important}.psc-val{font-size:20px!important}.psc-lbl{font-size:8.5px!important;margin-top:6px!important;line-height:1.15!important}
.ptp-label{font-size:16px!important}.ptp-row-header{margin-bottom:12px!important}.ptp-see-all{font-size:13px!important;padding:8px 1px!important}.person-task-list{gap:10px!important}.person-task-card{min-height:78px!important;border-radius:20px!important;padding:14px!important;gap:13px!important}.ptc-icon-sq{width:48px!important;height:48px!important;border-radius:15px!important;font-size:20px!important}.ptc-title{font-size:15px!important}.ptc-cat{font-size:11.5px!important}.ptc-check{width:28px!important;height:28px!important}
@media(max-width:390px){.task-person-page{padding-left:16px!important;padding-right:16px!important}.ptp2-landscape{min-height:288px;padding:24px 18px 18px;background-size:100% 100%,220% auto;background-position:center center,74% 8%}.ptp2-profile{grid-template-columns:92px minmax(0,1fr) 58px;gap:13px}.ptp2-avatar{width:92px;height:92px}.ptp2-name{font-size:27px}.ptp2-title{font-size:12.5px}.ptp2-level{width:58px;height:58px}.ptp2-level strong{font-size:19px}.ptp2-lower{padding:16px 18px 18px}.ptp2-stat{padding:0 8px}.ptp2-stat-label{font-size:9px}.ptp2-stat-value{font-size:14.5px}.person-stat-card{min-height:98px!important}.psc-val{font-size:18px!important}}
`;
    document.head.appendChild(s);
  }
  function rebuild(hero){
    if(!hero||hero.classList.contains('ptp2-hero'))return;
    var name=txt(hero,'.member-hero-name',window.myName||'Jij');
    var title=txt(hero,'.member-hero-title','Avonturier');
    var level=txt(hero,'.member-hero-lvl-num','1');
    var caption=txt(hero,'.member-hero-progress-caption','');
    var oldFill=hero.querySelector('.member-hero-progress-fill');
    var pct=(oldFill&&oldFill.style&&oldFill.style.width)||'0%';
    var cols=[].slice.call(hero.querySelectorAll('.mh-stat-col')).map(function(col){return{label:txt(col,'.mh-stat-lbl',''),value:txt(col,'.mh-stat-val',''),sub:txt(col,'.mh-stat-sub','')};});
    while(cols.length<3)cols.push({label:'',value:'',sub:''});
    var av=avatar();
    var avatarHtml=av?'<img class="ptp2-avatar" src="'+esc(av)+'" alt="">':'<div class="ptp2-avatar ptp2-avatar-fallback">'+esc(name.slice(0,2).toUpperCase())+'</div>';
    var statHtml=cols.slice(0,3).map(function(x){return '<div class="ptp2-stat"><div class="ptp2-stat-label">'+esc(x.label)+'</div><div class="ptp2-stat-value">'+esc(x.value)+'</div>'+(x.sub?'<div class="ptp2-stat-sub">'+esc(x.sub)+'</div>':'')+'</div>';}).join('');
    hero.className='member-hero-card ptp2-hero';
    hero.removeAttribute('style');
    hero.innerHTML='<div class="ptp2-landscape"><div class="ptp2-profile">'+avatarHtml+'<div class="ptp2-copy"><div class="ptp2-name">'+esc(name)+'</div><div class="ptp2-title">'+title+'</div></div><div class="ptp2-level"><span>Level</span><strong>'+esc(level)+'</strong></div></div></div><div class="ptp2-lower"><div class="ptp2-stats">'+statHtml+'</div><div class="ptp2-progress"><div class="ptp2-progress-fill" style="width:'+esc(pct)+'"></div></div><div class="ptp2-progress-caption">'+esc(caption)+'</div></div>';
  }
  function enhance(){
    if(busy)return;busy=true;
    try{css();var hero=document.querySelector('.task-person-page .member-hero-card');if(hero)rebuild(hero);}finally{busy=false;}
  }
  function boot(){
    css();enhance();
    var root=document.getElementById('task-content')||document.body;
    new MutationObserver(function(){requestAnimationFrame(enhance);}).observe(root,{childList:true,subtree:true});
    window.addEventListener('familyapp:avatar-updated',function(){var h=document.querySelector('.ptp2-hero');if(h)h.classList.remove('ptp2-hero');enhance();});
  }
  window.PersonHeroFantasyPolish={version:VERSION,refresh:enhance};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
