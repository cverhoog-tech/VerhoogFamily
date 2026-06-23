'use strict';
// ============================================================
// MOBILE OVERFLOW GUARD v0.289
// Safer mobile guard: prevents page-level horizontal drift without
// blocking intentional horizontal carousels or tab scrolling.
// ============================================================

(function(){
  function inject(){
    var old = document.getElementById('mobile-overflow-guard-styles');
    if(old) old.remove();
    var s = document.createElement('style');
    s.id = 'mobile-overflow-guard-styles';
    s.textContent = [
      'html,body{width:100%;max-width:100%;overflow-x:clip;overscroll-behavior-x:none;}',
      'body{position:relative;}',
      '#app,.app,.screen,.page{max-width:100%;box-sizing:border-box;}',
      '*{box-sizing:border-box;}',
      'img,video,canvas,svg{max-width:100%;}',
      '#screen-tasks #task-content{max-width:100%;overflow-x:hidden;box-sizing:border-box;padding-top:14px;}',
      '.task-tabs{display:flex;align-items:stretch;min-height:58px;overflow-x:auto;overflow-y:hidden;-webkit-overflow-scrolling:touch;overscroll-behavior-x:contain;scrollbar-width:none;}',
      '.task-tabs::-webkit-scrollbar{display:none}',
      '.task-tabs .ttab{display:flex!important;align-items:center!important;justify-content:center!important;min-height:58px!important;line-height:1.08!important;text-align:center!important;white-space:nowrap!important;padding:0 18px!important;font-weight:850!important;}',
      '.task-tabs .ttab.gq-tab{min-width:142px!important;}',
      '.gqOvScroll{overflow-x:auto!important;overflow-y:hidden!important;-webkit-overflow-scrolling:touch!important;overscroll-behavior-x:contain!important;touch-action:pan-x!important;scroll-snap-type:x proximity!important;}',
      '.gqOvCard{max-width:86vw;touch-action:pan-x!important;}',
      '.home-carousel,.carousel,.stories-row{overflow-x:auto;-webkit-overflow-scrolling:touch;overscroll-behavior-x:contain;}',
      '.fq,.fqCard,.group-quests-view,.gq-card,.gqePanel,.gqeBody,.gqeSection{max-width:100%;}',
      '.gqeOverlay{overflow-x:hidden!important;}',
      '.gqeActions{width:100%;max-width:560px;box-sizing:border-box;}',
      '@media(max-width:560px){.gqeActions{left:0!important;right:0!important;max-width:100%!important}.fqCard{max-width:100%}#screen-tasks #task-content{padding-top:12px}.task-tabs .ttab{padding:0 16px!important}}'
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
