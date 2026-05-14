'use strict';
// ============================================================
// HOME
// ============================================================

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
  updateStats();
  renderActivityList();
  _carouselBound = false;
  setTimeout(initCarousel, 60);
}

// ── CARROUSEL ──
var _carouselIndex = 0;
var _carouselTotal = 3;
var _carouselBound = false;

function initCarousel() {
  var track = document.getElementById('home-carousel-track');
  var prev  = document.getElementById('home-prev');
  var next  = document.getElementById('home-next');
  var dotsEl = document.getElementById('home-dots');
  if (!track || !prev || !next || _carouselBound) return;
  _carouselBound = true;

  function goTo(index) {
    _carouselIndex = ((index % _carouselTotal) + _carouselTotal) % _carouselTotal;
    track.style.transform = 'translateX(-' + (_carouselIndex * 100) + '%)';
    if (dotsEl) {
      dotsEl.querySelectorAll('button').forEach(function(btn, i) {
        btn.classList.toggle('active', i === _carouselIndex);
      });
    }
  }

  prev.addEventListener('click', function(e) { e.stopPropagation(); goTo(_carouselIndex - 1); });
  next.addEventListener('click', function(e) { e.stopPropagation(); goTo(_carouselIndex + 1); });

  if (dotsEl) {
    dotsEl.querySelectorAll('button').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        goTo(parseInt(btn.dataset.index) || 0);
      });
    });
  }

  var _touchStartX = 0;
  track.addEventListener('touchstart', function(e) {
    _touchStartX = e.touches[0].clientX;
  }, { passive: true });
  track.addEventListener('touchend', function(e) {
    var delta = _touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(delta) > 40) goTo(_carouselIndex + (delta > 0 ? 1 : -1));
  }, { passive: true });

  goTo(0);
}

function renderActivityList() {
  var el=document.getElementById('activity-list');if(!el)return;
  el.innerHTML=activityData.slice(0,10).map(function(a){
    return '<div class="activity-item">'
      +'<div class="activity-icon" style="background:'+a.bg+'">' +a.icon+'</div>'
      +'<div style="flex:1"><div style="font-size:13px;color:#333">'+a.text+'</div>'
      +'<div style="font-size:11px;color:#aaa">'+a.time+'</div></div>'
      +'</div>';
  }).join('');
}
