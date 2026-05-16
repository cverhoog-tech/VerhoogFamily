'use strict';
// ============================================================
// GROUP QUEST HERO CAROUSEL LOADER v0.348
// Loads carousel dependencies deterministically and rebuilds on task screen
// activation/render. This fixes the carousel only appearing after navigating.
// ============================================================

(function(){
  var VERSION = '0.348';
  var loading = false;
  var loaded = false;
  var queue = [];
  var scripts = [
    { id:'hero-card-data-adapter-js', src:'src/modules/tasks/heroCardDataAdapter.js', ready:function(){ return !!window.HeroCardDataAdapter; } },
    { id:'hero-card-renderer-js', src:'src/modules/tasks/heroCardRenderer.js', ready:function(){ return !!window.HeroCardRenderer; } },
    { id:'hero-carousel-gestures-js', src:'src/modules/tasks/heroCarouselGestures.js', ready:function(){ return !!window.HeroCarouselGestures; } },
    { id:'group-quest-hero-carousel-js', src:'src/modules/tasks/groupQuestHeroCarousel.js', ready:function(){ return !!window.GroupQuestHeroCarousel; } }
  ];

  function loadScript(item){
    return new Promise(function(resolve){
      if(item.ready()) return resolve();
      if(document.getElementById(item.id)){
        var tries = 0;
        var wait = setInterval(function(){
          tries++;
          if(item.ready() || tries > 40){ clearInterval(wait); resolve(); }
        }, 50);
        return;
      }
      var script = document.createElement('script');
      script.id = item.id;
      script.src = item.src;
      script.onload = function(){ resolve(); };
      script.onerror = function(){ console.warn('[HeroCarouselLoader] failed', item.src); resolve(); };
      document.body.appendChild(script);
    });
  }

  function flush(){
    var fns = queue.slice();
    queue.length = 0;
    fns.forEach(function(fn){ try { fn(); } catch(error) {} });
  }

  function ensure(callback){
    if(loaded){ if(callback) callback(); return; }
    if(callback) queue.push(callback);
    if(loading) return;
    loading = true;
    var chain = Promise.resolve();
    scripts.forEach(function(item){ chain = chain.then(function(){ return loadScript(item); }); });
    chain.then(function(){ loading = false; loaded = true; flush(); });
  }

  function build(){
    ensure(function(){
      if(window.GroupQuestHeroCarousel && typeof window.GroupQuestHeroCarousel.build === 'function'){
        window.GroupQuestHeroCarousel.build();
      }
    });
  }

  function boot(){
    build();
    [80, 250, 700, 1400, 2500].forEach(function(delay){ setTimeout(build, delay); });
    window.addEventListener('familyapp:tasks-render-bridge-refreshed', build);
    window.addEventListener('familyapp:tasks-updated', build);
    window.addEventListener('familyapp:modules:ready', build);
  }

  window.GroupQuestHeroCarouselLoader = {
    version: VERSION,
    ensure: ensure,
    build: build,
    boot: boot
  };

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
