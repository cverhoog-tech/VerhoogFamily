'use strict';
// ============================================================
// MOBILE VIEWPORT LOCK v0.303
// App-wide guard against pinch zoom and accidental horizontal page drift.
// Allows vertical scrolling and intentional horizontal scroll containers.
// ============================================================

(function(){
  function ensureViewportMeta(){
    var meta = document.querySelector('meta[name="viewport"]');
    if(!meta){
      meta = document.createElement('meta');
      meta.setAttribute('name', 'viewport');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, minimum-scale=1, user-scalable=no, viewport-fit=cover');
  }

  function injectStyles(){
    var old = document.getElementById('mobile-viewport-lock-styles');
    if(old) old.remove();
    var s = document.createElement('style');
    s.id = 'mobile-viewport-lock-styles';
    s.textContent = [
      'html,body{width:100%!important;max-width:100%!important;overflow-x:hidden!important;overscroll-behavior-x:none!important;}',
      'body{position:relative;touch-action:pan-y;}',
      '#app,.app,.screen,.page,#task-content{max-width:100%!important;overflow-x:hidden!important;box-sizing:border-box;}',
      '*{box-sizing:border-box;-webkit-tap-highlight-color:transparent;}',
      'img,video,canvas,svg{max-width:100%;}',
      'input,textarea,select,button{font-size:16px;}',
      '.task-tabs,.gqOvScroll,.carousel,.home-carousel,.stories-row,[data-horizontal-scroll="true"]{overflow-x:auto!important;overscroll-behavior-x:contain!important;-webkit-overflow-scrolling:touch!important;touch-action:pan-x pan-y!important;}',
      '.gqeOverlay{touch-action:none!important;overflow:hidden!important;}',
      '.gqePanel{touch-action:pan-y!important;overflow-x:hidden!important;}'
    ].join('');
    document.head.appendChild(s);
  }

  function preventGestureZoom(){
    document.addEventListener('gesturestart', function(ev){ ev.preventDefault(); }, { passive:false });
    document.addEventListener('gesturechange', function(ev){ ev.preventDefault(); }, { passive:false });
    document.addEventListener('gestureend', function(ev){ ev.preventDefault(); }, { passive:false });

    document.addEventListener('touchmove', function(ev){
      if(ev.touches && ev.touches.length > 1){
        ev.preventDefault();
      }
    }, { passive:false });

    var lastTouchEnd = 0;
    document.addEventListener('touchend', function(ev){
      var now = Date.now();
      if(now - lastTouchEnd <= 300){
        ev.preventDefault();
      }
      lastTouchEnd = now;
    }, { passive:false });
  }

  function clampHorizontalScroll(){
    if(window.scrollX && Math.abs(window.scrollX) > 0){
      window.scrollTo(0, window.scrollY || document.documentElement.scrollTop || 0);
    }
  }

  function boot(){
    ensureViewportMeta();
    injectStyles();
    preventGestureZoom();
    window.addEventListener('scroll', function(){
      if(window.scrollX) requestAnimationFrame(clampHorizontalScroll);
    }, { passive:true });
    window.addEventListener('orientationchange', function(){
      setTimeout(function(){ ensureViewportMeta(); clampHorizontalScroll(); }, 150);
    }, { passive:true });
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
