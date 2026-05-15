'use strict';
// ============================================================
// MOBILE OVERFLOW GUARD v0.288
// Prevents accidental horizontal page dragging on iOS/mobile while
// keeping intentional horizontal scrollers usable.
// ============================================================

(function(){
  function inject(){
    var old = document.getElementById('mobile-overflow-guard-styles');
    if(old) old.remove();
    var s = document.createElement('style');
    s.id = 'mobile-overflow-guard-styles';
    s.textContent = [
      'html,body{width:100%;max-width:100%;overflow-x:hidden!important;overscroll-behavior-x:none;}',
      'body{position:relative;touch-action:pan-y;}',
      '#app,.app,.screen,.page,#task-content{max-width:100%;overflow-x:hidden!important;box-sizing:border-box;}',
      '*{box-sizing:border-box;}',
      'img,video,canvas,svg{max-width:100%;}',
      '.gqOvScroll,.task-tabs,.home-carousel,.carousel,.stories-row{overflow-x:auto!important;overscroll-behavior-x:contain;-webkit-overflow-scrolling:touch;touch-action:pan-x pan-y;}',
      '.fq,.fqCard,.group-quests-view,.gq-card,.gqePanel,.gqeBody,.gqeSection{max-width:100%;overflow-wrap:anywhere;}',
      '.gqeOverlay{overflow-x:hidden!important;}',
      '.gqeActions{width:100%;max-width:560px;box-sizing:border-box;}',
      '@media(max-width:560px){.gqeActions{left:0!important;right:0!important;max-width:100%!important}.gqOvCard{max-width:88vw}.fqCard{max-width:100%}}'
    ].join('');
    document.head.appendChild(s);
  }

  function clampScrollX(){
    if(window.scrollX && Math.abs(window.scrollX) > 0){
      window.scrollTo(0, window.scrollY || document.documentElement.scrollTop || 0);
    }
  }

  function boot(){
    inject();
    window.addEventListener('scroll', function(){
      if(window.scrollX) requestAnimationFrame(clampScrollX);
    }, { passive: true });
    window.addEventListener('orientationchange', function(){ setTimeout(clampScrollX, 150); }, { passive: true });
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
  setTimeout(boot, 300);
})();
