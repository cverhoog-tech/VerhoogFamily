'use strict';
// ============================================================
// GROUP QUEST HERO CAROUSEL v0.347
// Premium cinematic hero carousel above task navigation.
// ============================================================

(function(){
  var VERSION = '0.347';
  var ROOT_ID = 'group-quest-hero-carousel';
  var STYLE_ID = 'group-quest-hero-carousel-style';

  function ensureStyles(){
    if(document.getElementById(STYLE_ID)) return;

    var style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = [
      '#'+ROOT_ID+'{position:relative;padding:10px 0 18px;overflow:hidden}',
      '#'+ROOT_ID+' .hero-carousel-header{display:flex;align-items:center;justify-content:space-between;padding:0 18px 12px}',
      '#'+ROOT_ID+' .hero-carousel-title{font-size:24px;font-weight:950;letter-spacing:-.04em;color:var(--c-text)}',
      '#'+ROOT_ID+' .hero-carousel-sub{font-size:13px;color:var(--c-text2);margin-top:3px}',
      '#'+ROOT_ID+' .hero-carousel-track{display:flex;gap:16px;overflow-x:auto;overflow-y:hidden;padding:4px 18px 8px;scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch;scrollbar-width:none}',
      '#'+ROOT_ID+' .hero-carousel-track::-webkit-scrollbar{display:none}',
      '#'+ROOT_ID+' .hero-quest-card{transition:transform .34s cubic-bezier(.2,.8,.2,1),opacity .28s ease,box-shadow .34s ease}',
      '#'+ROOT_ID+' .hero-quest-card.active{transform:scale(1)!important;opacity:1!important}',
      '#'+ROOT_ID+' .hero-carousel-fade{position:absolute;top:0;bottom:0;width:28px;pointer-events:none;z-index:4}',
      '#'+ROOT_ID+' .hero-carousel-fade.left{left:0;background:linear-gradient(90deg,var(--c-bg),transparent)}',
      '#'+ROOT_ID+' .hero-carousel-fade.right{right:0;background:linear-gradient(270deg,var(--c-bg),transparent)}',
      '@media(max-width:480px){#'+ROOT_ID+' .hero-carousel-title{font-size:22px}#'+ROOT_ID+' .hero-carousel-track{padding-left:16px;padding-right:16px}#'+ROOT_ID+' .hero-quest-card{flex-basis:90%!important;min-height:228px!important}}'
    ].join('\n');

    document.head.appendChild(style);
  }

  function getTaskScreen(){
    return document.getElementById('screen-tasks') || document.getElementById('tasks-screen') || document.querySelector('[data-screen="tasks"]');
  }

  function getTaskNav(screen){
    if(!screen) return null;
    return screen.querySelector('.task-top-nav, .tasks-top-nav, .quest-nav, .top-task-tabs, .native-task-nav');
  }

  function build(){
    var screen = getTaskScreen();
    if(!screen) return;
    if(!window.HeroCardRenderer || !window.HeroCardDataAdapter) return;

    ensureStyles();

    var existing = document.getElementById(ROOT_ID);
    if(existing) existing.remove();

    var cards = window.HeroCardDataAdapter.listHeroCards();
    if(!cards || !cards.length) return;

    var root = document.createElement('section');
    root.id = ROOT_ID;

    root.innerHTML = ''
      +'<div class="hero-carousel-header">'
      +'<div>'
      +'<div class="hero-carousel-title">Active Group Quests</div>'
      +'<div class="hero-carousel-sub">Werk samen, versla raids en verdien household rewards.</div>'
      +'</div>'
      +'</div>'
      +'<div class="hero-carousel-fade left"></div>'
      +'<div class="hero-carousel-fade right"></div>'
      +'<div class="hero-carousel-track"></div>';

    var track = root.querySelector('.hero-carousel-track');
    track.innerHTML = cards.map(function(card, index){
      return window.HeroCardRenderer.renderCard(card, index);
    }).join('');

    var nav = getTaskNav(screen);
    if(nav && nav.parentNode){
      nav.parentNode.insertBefore(root, nav);
    } else {
      screen.insertBefore(root, screen.firstChild);
    }

    if(window.HeroCarouselGestures){
      window.HeroCarouselGestures.attach(track);
    }
  }

  function boot(){
    build();
    [120, 400, 900, 1600, 2600].forEach(function(delay){
      setTimeout(build, delay);
    });
  }

  window.GroupQuestHeroCarousel = {
    version: VERSION,
    build: build,
    boot: boot
  };

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
