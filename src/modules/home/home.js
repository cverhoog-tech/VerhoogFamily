'use strict';
// ============================================================
// HOME
// ============================================================

var HOME_CLEANING_FALLBACK_IMAGE='familieapp_white_assets/tasks_background.png';

function homeT(key, fallback, params) {
  if (window.FamilyI18n && typeof window.FamilyI18n.t === 'function') {
    var value = window.FamilyI18n.t(key, params || {});
    if (value && value !== key) return value;
  }
  if (params && params.name) return String(fallback).replace('{{name}}', params.name);
  return fallback;
}

function setHomeText(selector, key, fallback) {
  var node=document.querySelector(selector);
  if(node) node.textContent=homeT(key,fallback);
}

function applyHomeStaticTranslations(){
  setHomeText('#screen-home .tasks-card .card-label','home.cards.tasks','taken');
  setHomeText('#screen-home .shop-card .card-label','home.cards.shop','boodschappen');
  setHomeText('#screen-home .cleaning-card .card-label','home.cards.cleaning','schoonmaken');

  setHomeText('#screen-home .recipes-slide .slide-title','home.carousel.recipes.title','Recepten');
  setHomeText('#screen-home .recipes-slide .slide-tagline','home.carousel.recipes.tagline','Ontdek heerlijke recepten voor elke gelegenheid');
  var recipesButton=document.querySelector('#screen-home .recipes-slide .slide-button');
  if(recipesButton) recipesButton.innerHTML=homeT('home.carousel.recipes.button','Bekijk recepten')+'<span class="arrow">→</span>';

  setHomeText('#screen-home .agenda-slide .slide-title','home.carousel.calendar.title','Agenda');
  setHomeText('#screen-home .agenda-slide .slide-tagline','home.carousel.calendar.tagline','Houd je afspraken bij en blijf georganiseerd');
  var calendarButton=document.querySelector('#screen-home .agenda-slide .slide-button');
  if(calendarButton) calendarButton.innerHTML=homeT('home.carousel.calendar.button','Bekijk agenda')+'<span class="arrow">→</span>';

  setHomeText('#screen-home .meals-slide .slide-title','home.carousel.meals.title','Maaltijden');
  setHomeText('#screen-home .meals-slide .slide-tagline','home.carousel.meals.tagline','Plan je maaltijden met het gezin');
  var mealsButton=document.querySelector('#screen-home .meals-slide .slide-button');
  if(mealsButton) mealsButton.innerHTML=homeT('home.carousel.meals.button','Bekijk maaltijden')+'<span class="arrow">→</span>';

  setHomeText('#screen-home .home-section-label','home.activity','Activiteit');
  var musicButton=document.querySelector('#screen-home .home-activity-section button[onclick="openYouTubeMusic()"]');
  if(musicButton){
    var svg=musicButton.querySelector('svg');
    musicButton.textContent='';
    if(svg) musicButton.appendChild(svg);
    musicButton.appendChild(document.createTextNode(homeT('home.music','Muziek')));
  }

  var prev=document.getElementById('home-prev');
  if(prev) prev.setAttribute('aria-label',homeT('common.previous','Vorige'));
  var next=document.getElementById('home-next');
  if(next) next.setAttribute('aria-label',homeT('common.next','Volgende'));
}

function ensureHomeControls() {
  var hero=document.querySelector('#screen-home .home-hero');
  if(hero&&!document.getElementById('home-dark-toggle')){
    var btn=document.createElement('button');
    btn.id='home-dark-toggle';
    btn.type='button';
    btn.className='home-dark-toggle';
    btn.setAttribute('aria-label',homeT('home.theme.toggle','Wissel lichte en donkere modus'));
    btn.style.cssText='width:38px;height:38px;border-radius:13px;border:1px solid var(--c-border);background:color-mix(in srgb,var(--c-surface) 86%,transparent);color:var(--c-text);display:grid;place-items:center;padding:0;cursor:pointer;box-shadow:0 5px 18px rgba(20,20,40,.08);backdrop-filter:blur(10px);flex:0 0 auto';
    btn.onclick=function(e){e.stopPropagation();if(typeof window.toggleDark==='function')window.toggleDark();};
    var avatar=hero.querySelector('.home-hero-avatar');
    if(avatar)hero.insertBefore(btn,avatar);else hero.appendChild(btn);
  }
  if(typeof window.updateDarkToggleUI==='function')window.updateDarkToggleUI();
}

// The original third Home hero card is still present in the static shell for
// backwards compatibility. Turn it into the Cleaning entry point at runtime so
// the card follows the live cleaning workload without adding a second Home DOM
// owner or risking a large shell rewrite.
function ensureHomeCleaningCard(){
  var card=document.querySelector('#screen-home .cleaning-card, #screen-home .feed-card');
  if(!card)return;
  card.classList.add('cleaning-card');
  card.setAttribute('aria-label',homeT('nav.cleaning','Schoonmaken'));
  card.onclick=function(){if(typeof window.showScreen==='function')window.showScreen('cleaning');};
  var count=card.querySelector('.card-number');
  if(count)count.id='stat-cleaning';
  var label=card.querySelector('.card-label');
  if(label)label.textContent=homeT('home.cards.cleaning','schoonmaken');
  var icon=card.querySelector('.card-icon .icon');
  if(icon&&!window.FamilyIcons)icon.textContent='🧹';

  // Round 4 owns the actual approved photo. Keep the old local household-work
  // image only as a no-network fallback for the tiny window before round 4 is
  // available, never as a competing steady-state image owner.
  card.style.setProperty('--card-color','#47745a','important');
  if(!window.FamilyAppFeedbackRound4){
    card.style.backgroundImage="linear-gradient(rgba(63,127,47,.24),rgba(63,127,47,.24)),url('"+HOME_CLEANING_FALLBACK_IMAGE+"')";
  }else{
    card.style.removeProperty('background-image');
  }
  var inner=card.querySelector('.card-inner');
  if(inner){inner.style.setProperty('background','transparent','important');inner.style.setProperty('background-image','none','important');}
}

function applyHomeIconSet(){
  if(!window.FamilyIcons||typeof FamilyIcons.svg!=='function')return;
  var map=[['.tasks-card .card-icon .icon','tasks'],['.shop-card .card-icon .icon','cart'],['.cleaning-card .card-icon .icon','cleaning'],['.recipes-slide .slide-icon','recipes'],['.agenda-slide .slide-icon','calendar'],['.meals-slide .slide-icon','meals']];
  map.forEach(function(x){var el=document.querySelector('#screen-home '+x[0]);if(el){el.innerHTML=FamilyIcons.svg(x[1],22);el.setAttribute('aria-hidden','true');}});
  var bell=document.querySelector('.app-header .header-notif');
  if(bell){
    var dot=bell.querySelector('.notif-dot');
    bell.innerHTML=FamilyIcons.svg('bell',20);
    if(dot)bell.appendChild(dot);
    bell.setAttribute('aria-label',homeT('nav.notifications','Meldingen'));
  }
}

function renderHome() {
  updateHomeXP();
  var h = new Date().getHours();
  var greetKey;
  var greetFallback;
  if(h<12){ greetKey='home.greeting.morning'; greetFallback='Goedemorgen, {{name}}'; }
  else if(h<17){ greetKey='home.greeting.afternoon'; greetFallback='Goedemiddag, {{name}}'; }
  else { greetKey='home.greeting.evening'; greetFallback='Goedenavond, {{name}}'; }
  var el=document.getElementById('home-greeting');
  if(el) el.textContent=homeT(greetKey,greetFallback,{name:myName});
  var days=['Zondag','Maandag','Dinsdag','Woensdag','Donderdag','Vrijdag','Zaterdag'];
  var months=['jan','feb','mrt','apr','mei','jun','jul','aug','sep','okt','nov','dec'];
  var now=new Date();
  var sub=document.getElementById('home-sub');
  if(sub){
    if(window.FamilyI18n && window.FamilyI18n.getLanguage && window.FamilyI18n.getLanguage()!=='nl'){
      var localized=window.FamilyI18n.formatDate(now,{weekday:'long',day:'numeric',month:'short'});
      sub.textContent=localized.charAt(0).toUpperCase()+localized.slice(1);
    }else{
      sub.textContent=days[now.getDay()]+' · '+now.getDate()+' '+months[now.getMonth()];
    }
  }
  renderHomeBg(currentTheme);
  ensureHomeControls();
  ensureHomeCleaningCard();
  applyHomeIconSet();
  applyHomeStaticTranslations();
  updateStats();
  renderActivityList();
  if(window.FamilyAppFeedbackRound4&&typeof window.FamilyAppFeedbackRound4.refreshHome==='function')window.FamilyAppFeedbackRound4.refreshHome();
  setTimeout(initCarousel, 60);
}

// ── CARROUSEL ──
var _carouselIndex = 0;
var _carouselTotal = 3;

function initCarousel() {
  var track = document.getElementById('home-carousel-track');
  var prev  = document.getElementById('home-prev');
  var next  = document.getElementById('home-next');
  var dotsEl = document.getElementById('home-dots');
  if (!track || !prev || !next) return;

  function goTo(index) {
    _carouselIndex = ((index % _carouselTotal) + _carouselTotal) % _carouselTotal;
    track.style.transform = 'translateX(-' + (_carouselIndex * 100) + '%)';
    if (dotsEl) {
      dotsEl.querySelectorAll('button').forEach(function(btn, i) {
        btn.classList.toggle('active', i === _carouselIndex);
      });
    }
  }

  // Home can rerender many times while keeping the same carousel DOM nodes.
  // Bind once per actual track element so taps never accumulate duplicate listeners.
  if (track.dataset.carouselBound !== '1') {
    track.dataset.carouselBound = '1';
    prev.addEventListener('click', function(e) { e.stopPropagation(); goTo(_carouselIndex - 1); });
    next.addEventListener('click', function(e) { e.stopPropagation(); goTo(_carouselIndex + 1); });

    if (dotsEl) {
      dotsEl.querySelectorAll('button').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
          e.stopPropagation();
          goTo(parseInt(btn.dataset.index,10) || 0);
        });
      });
    }

    var touchStartX = 0;
    track.addEventListener('touchstart', function(e) {
      if(e.touches&&e.touches[0]) touchStartX = e.touches[0].clientX;
    }, { passive: true });
    track.addEventListener('touchend', function(e) {
      if(!e.changedTouches||!e.changedTouches[0]) return;
      var delta = touchStartX - e.changedTouches[0].clientX;
      if (Math.abs(delta) > 40) goTo(_carouselIndex + (delta > 0 ? 1 : -1));
    }, { passive: true });
  }

  goTo(_carouselIndex);
}

function renderActivityList() {
  var el=document.getElementById('activity-list');if(!el)return;
  el.innerHTML=activityData.slice(0,10).map(function(a){
    return '<div class="activity-item">'
      +'<div class="activity-icon" style="background:'+a.bg+'">' +a.icon+'</div>'
      +'<div style="flex:1"><div style="font-size:13px;color:var(--c-text)">'+a.text+'</div>'
      +'<div style="font-size:11px;color:var(--c-text3)">'+a.time+'</div></div>'
      +'</div>';
  }).join('');
}


window.addEventListener('familyapp:language-changed', function(){
  if(typeof _currentScreen !== 'undefined' && _currentScreen === 'home') renderHome();
});
