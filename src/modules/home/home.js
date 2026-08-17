'use strict';
// ============================================================
// HOME v2.0 - presentation-only consumer of HomeDashboardService
// ============================================================

function ensureHomeControls() {
  var hero=document.querySelector('#screen-home .home-hero');
  if(hero&&!document.getElementById('home-dark-toggle')){
    var btn=document.createElement('button');
    btn.id='home-dark-toggle';btn.type='button';btn.className='home-dark-toggle';
    btn.setAttribute('aria-label','Wissel lichte en donkere modus');
    btn.style.cssText='width:38px;height:38px;border-radius:13px;border:1px solid var(--c-border);background:color-mix(in srgb,var(--c-surface) 86%,transparent);color:var(--c-text);display:grid;place-items:center;padding:0;cursor:pointer;box-shadow:0 5px 18px rgba(20,20,40,.08);backdrop-filter:blur(10px);flex:0 0 auto';
    btn.onclick=function(e){e.stopPropagation();if(typeof window.toggleDark==='function')window.toggleDark();};
    var avatar=hero.querySelector('.home-hero-avatar');if(avatar)hero.insertBefore(btn,avatar);else hero.appendChild(btn);
  }
  if(typeof window.updateDarkToggleUI==='function')window.updateDarkToggleUI();
}

function applyHomeIconSet(){
  if(!window.FamilyIcons||typeof FamilyIcons.svg!=='function')return;
  var map=[['.tasks-card .card-icon .icon','tasks'],['.shop-card .card-icon .icon','cart'],['.feed-card .card-icon .icon','chat'],['.recipes-slide .slide-icon','recipes'],['.agenda-slide .slide-icon','calendar'],['.meals-slide .slide-icon','meals']];
  map.forEach(function(x){var el=document.querySelector('#screen-home '+x[0]);if(el){el.innerHTML=FamilyIcons.svg(x[1],22);el.setAttribute('aria-hidden','true');}});
  var bell=document.querySelector('.app-header .header-notif');if(bell){var dot=bell.querySelector('.notif-dot');bell.innerHTML=FamilyIcons.svg('bell',20);if(dot)bell.appendChild(dot);bell.setAttribute('aria-label','Meldingen');}
}

function homeSnapshot(){
  try{return window.HomeDashboardService&&HomeDashboardService.get?HomeDashboardService.get():null;}catch(e){return null;}
}
function renderHomeProgression(s){
  var p=s&&s.progression||{},profile=s&&s.profile||{};var el;
  el=document.getElementById('home-xp-avatar');if(el)el.textContent=profile.initials||String(profile.name||'G').slice(0,1).toUpperCase();
  el=document.getElementById('home-xp-level');if(el)el.textContent='Level '+(p.level||1)+' · '+(p.title||'Avonturier');
  el=document.getElementById('home-xp-fill');if(el)el.style.width=(Number(p.percent)||0)+'%';
  el=document.getElementById('home-xp-pts');if(el)el.textContent=(Number(p.xp)||0)+' XP';
}
function renderHomeStats(s){var stats=s&&s.stats||{},el;el=document.getElementById('stat-tasks');if(el)el.textContent=Number(stats.tasks)||0;el=document.getElementById('stat-shop');if(el)el.textContent=Number(stats.shopping)||0;el=document.getElementById('stat-feed');if(el)el.textContent=Number(stats.feed)||0;}
function activityText(a){var p=a&&a.payload||{};switch(a&&a.type){case'task.created':return(p.title||'Taak')+' aangemaakt';case'task.completed':return(p.title||'Taak')+' afgerond';case'meal.planned':return(p.mealName||p.title||'Maaltijd')+' gepland';case'grocery.receipt_uploaded':return'Boodschappen gedaan';case'achievement.unlocked':return(p.name||'Achievement')+' vrijgespeeld';default:return'Gezinsactiviteit';}}
function activityIcon(a){switch(a&&a.type){case'task.created':return'📋';case'task.completed':return'✅';case'meal.planned':return'🍽️';case'grocery.receipt_uploaded':return'🛒';case'achievement.unlocked':return'🏆';default:return'✨';}}
function relativeTime(ts){var n=Number(ts||0);if(!n)return'';var m=Math.floor(Math.max(0,Date.now()-n)/60000);if(m<1)return'Zojuist';if(m<60)return m+' min geleden';var h=Math.floor(m/60);if(h<24)return h+' uur geleden';return Math.floor(h/24)+' d geleden';}

function renderHome() {
  var s=homeSnapshot();
  var h=new Date().getHours(),greet=h<12?'Goedemorgen':h<17?'Goedemiddag':'Goedenavond';
  var el=document.getElementById('home-greeting');if(el)el.textContent=greet+', '+((s&&s.profile&&s.profile.name)||'Gezinslid');
  var days=['Zondag','Maandag','Dinsdag','Woensdag','Donderdag','Vrijdag','Zaterdag'],months=['jan','feb','mrt','apr','mei','jun','jul','aug','sep','okt','nov','dec'],now=new Date();
  var sub=document.getElementById('home-sub');if(sub)sub.textContent=days[now.getDay()]+' · '+now.getDate()+' '+months[now.getMonth()];
  try{if(typeof window.renderHomeBg==='function')window.renderHomeBg(window.currentTheme);}catch(e){}
  ensureHomeControls();applyHomeIconSet();renderHomeProgression(s);renderHomeStats(s);renderActivityList(s);
  _carouselBound=false;setTimeout(initCarousel,60);
}

var _carouselIndex=0,_carouselTotal=3,_carouselBound=false;
function initCarousel(){
  var track=document.getElementById('home-carousel-track'),prev=document.getElementById('home-prev'),next=document.getElementById('home-next'),dotsEl=document.getElementById('home-dots');if(!track||!prev||!next||_carouselBound)return;_carouselBound=true;
  function goTo(index){_carouselIndex=((index%_carouselTotal)+_carouselTotal)%_carouselTotal;track.style.transform='translateX(-'+(_carouselIndex*100)+'%)';if(dotsEl)dotsEl.querySelectorAll('button').forEach(function(btn,i){btn.classList.toggle('active',i===_carouselIndex);});}
  prev.addEventListener('click',function(e){e.stopPropagation();goTo(_carouselIndex-1);});next.addEventListener('click',function(e){e.stopPropagation();goTo(_carouselIndex+1);});
  if(dotsEl)dotsEl.querySelectorAll('button').forEach(function(btn){btn.addEventListener('click',function(e){e.stopPropagation();goTo(parseInt(btn.dataset.index)||0);});});
  var x=0;track.addEventListener('touchstart',function(e){x=e.touches[0].clientX;},{passive:true});track.addEventListener('touchend',function(e){var d=x-e.changedTouches[0].clientX;if(Math.abs(d)>40)goTo(_carouselIndex+(d>0?1:-1));},{passive:true});goTo(0);
}

function renderActivityList(snapshot){
  var el=document.getElementById('activity-list');if(!el)return;var rows=(snapshot||homeSnapshot()||{}).activity||[];
  if(!rows.length){el.innerHTML='<div class="activity-item"><div style="font-size:12px;color:var(--c-text3)">Nog geen recente gezinsactiviteit.</div></div>';return;}
  el.innerHTML=rows.slice(0,10).map(function(a){return '<div class="activity-item"><div class="activity-icon">'+activityIcon(a)+'</div><div style="flex:1"><div style="font-size:13px;color:var(--c-text)">'+activityText(a)+'</div><div style="font-size:11px;color:var(--c-text3)">'+relativeTime(a.occurredAt||a.createdAt)+'</div></div></div>';}).join('');
}

window.addEventListener('familyapp:home-dashboard-updated',function(){if(window._currentScreen==='home')renderHome();});
