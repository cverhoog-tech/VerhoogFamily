'use strict';
// ============================================================
// HOME
// ============================================================

function ensureHomeControls() {
  var hero=document.querySelector('#screen-home .home-hero');
  if(hero&&!document.getElementById('home-dark-toggle')){
    var btn=document.createElement('button');
    btn.id='home-dark-toggle';
    btn.type='button';
    btn.className='home-dark-toggle';
    btn.setAttribute('aria-label','Wissel lichte en donkere modus');
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
  card.setAttribute('aria-label','Schoonmaken');
  card.onclick=function(){if(typeof window.showScreen==='function')window.showScreen('cleaning');};
  var count=card.querySelector('.card-number');
  if(count)count.id='stat-cleaning';
  var label=card.querySelector('.card-label');
  if(label)label.textContent='schoonmaken';
  var icon=card.querySelector('.card-icon .icon');
  if(icon&&!window.FamilyIcons)icon.textContent='🧹';

  // The old Posts class remains for shell compatibility. Inline important
  // styling guarantees that its old pink/social background cannot win over
  // the semantic Cleaning treatment, regardless of stylesheet load order.
  var background="linear-gradient(180deg,rgba(34,86,61,.12),rgba(20,33,28,.78)),url('src/styles/familieapp_white_assets/tasks_background.png')";
  card.style.setProperty('--card-color','#47745a','important');
  card.style.setProperty('background-image',background,'important');
  var inner=card.querySelector('.card-inner');
  if(inner)inner.style.setProperty('background-image',background,'important');
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
    bell.setAttribute('aria-label','Meldingen');
  }
}

function renderHome() {
  updateHomeXP();
  var h = new Date().getHours();
  var greet;
  if(h<12) greet='Goedemorgen';
  else if(h<17) greet='Goedemiddag';
  else greet='Goedenavond';
  var el=document.getElementById('home-greeting');
  if(el) el.textContent=greet+', '+myName;
  var days=['Zondag','Maandag','Dinsdag','Woensdag','Donderdag','Vrijdag','Zaterdag'];
  var months=['jan','feb','mrt','apr','mei','jun','jul','aug','sep','okt','nov','dec'];
  var now=new Date();
  var sub=document.getElementById('home-sub');
  if(sub) sub.textContent=days[now.getDay()]+' · '+now.getDate()+' '+months[now.getMonth()];
  renderHomeBg(currentTheme);
  ensureHomeControls();
  ensureHomeCleaningCard();
  applyHomeIconSet();
  updateStats();
  renderActivityList();
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
