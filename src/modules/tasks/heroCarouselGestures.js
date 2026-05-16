'use strict';
// ============================================================
// HERO CAROUSEL GESTURES v0.347
// Scroll snapping, active-card scaling and focus state for hero carousel.
// ============================================================

(function(){
  var VERSION = '0.347';

  function updateActive(track){
    if(!track) return;
    var cards = Array.prototype.slice.call(track.querySelectorAll('.hero-quest-card'));
    if(!cards.length) return;
    var center = track.scrollLeft + track.clientWidth / 2;
    var best = null;
    var bestDist = Infinity;

    cards.forEach(function(card){
      var cardCenter = card.offsetLeft + card.offsetWidth / 2;
      var dist = Math.abs(center - cardCenter);
      if(dist < bestDist){ bestDist = dist; best = card; }
    });

    cards.forEach(function(card){
      var active = card === best;
      card.classList.toggle('active', active);
      card.style.transform = active ? 'scale(1)' : 'scale(.94)';
      card.style.opacity = active ? '1' : '.72';
    });
  }

  function attach(track){
    if(!track || track.__heroGesturesAttached) return;
    track.__heroGesturesAttached = true;
    var ticking = false;

    function schedule(){
      if(ticking) return;
      ticking = true;
      requestAnimationFrame(function(){
        ticking = false;
        updateActive(track);
      });
    }

    track.addEventListener('scroll', schedule, { passive:true });
    window.addEventListener('resize', schedule);
    setTimeout(schedule, 80);
    setTimeout(schedule, 400);
  }

  window.HeroCarouselGestures = {
    version: VERSION,
    attach: attach,
    updateActive: updateActive
  };
})();
