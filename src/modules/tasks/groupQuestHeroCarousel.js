'use strict';
// ============================================================
// GROUP QUEST HERO CAROUSEL v0.349
// Premium cinematic hero carousel positioned inside overview content:
// task nav -> stats cards -> carousel -> task list.
// ============================================================

(function(){
  var VERSION = '0.349';
  var ROOT_ID = 'group-quest-hero-carousel';
  var STYLE_ID = 'group-quest-hero-carousel-style';

  function ensureStyles(){
    var old = document.getElementById(STYLE_ID);
    if(old && old.parentNode) old.parentNode.removeChild(old);

    var style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = [
      '#'+ROOT_ID+'{position:relative!important;z-index:1!important;padding:18px 0 20px!important;margin:0!important;overflow:hidden!important;background:transparent!important;clear:both!important}',
      '#'+ROOT_ID+' .hero-carousel-header{display:flex!important;align-items:center!important;justify-content:space-between!important;padding:0 18px 12px!important}',
      '#'+ROOT_ID+' .hero-carousel-title{font-size:24px!important;font-weight:950!important;letter-spacing:-.04em!important;color:var(--c-text)!important}',
      '#'+ROOT_ID+' .hero-carousel-sub{font-size:13px!important;color:var(--c-text2)!important;margin-top:3px!important;line-height:1.35!important}',
      '#'+ROOT_ID+' .hero-carousel-track{display:flex!important;gap:16px!important;overflow-x:auto!important;overflow-y:hidden!important;padding:4px 18px 8px!important;scroll-snap-type:x mandatory!important;-webkit-overflow-scrolling:touch!important;scrollbar-width:none!important}',
      '#'+ROOT_ID+' .hero-carousel-track::-webkit-scrollbar{display:none!important}',
      '#'+ROOT_ID+' .hero-quest-card{transition:transform .34s cubic-bezier(.2,.8,.2,1),opacity .28s ease,box-shadow .34s ease!important}',
      '#'+ROOT_ID+' .hero-quest-card.active{transform:scale(1)!important;opacity:1!important}',
      '#'+ROOT_ID+' .hero-carousel-fade{position:absolute!important;top:0!important;bottom:0!important;width:28px!important;pointer-events:none!important;z-index:4!important}',
      '#'+ROOT_ID+' .hero-carousel-fade.left{left:0!important;background:linear-gradient(90deg,var(--c-bg),transparent)!important}',
      '#'+ROOT_ID+' .hero-carousel-fade.right{right:0!important;background:linear-gradient(270deg,var(--c-bg),transparent)!important}',
      '@media(max-width:480px){#'+ROOT_ID+'{padding-top:16px!important;padding-bottom:18px!important}#'+ROOT_ID+' .hero-carousel-title{font-size:22px!important}#'+ROOT_ID+' .hero-carousel-track{padding-left:16px!important;padding-right:16px!important}#'+ROOT_ID+' .hero-quest-card{flex-basis:90%!important;min-height:228px!important}}'
    ].join('\n');

    document.head.appendChild(style);
  }

  function getTaskScreen(){
    return document.getElementById('screen-tasks') || document.getElementById('tasks-screen') || document.querySelector('[data-screen="tasks"]');
  }

  function getTaskContent(screen){
    return document.getElementById('task-content') || (screen ? screen.querySelector('.task-content') : null);
  }

  function looksLikeStatsCard(el){
    if(!el || el.nodeType !== 1) return false;
    var txt = (el.textContent || '').toLowerCase();
    return txt.indexOf('level') > -1 || txt.indexOf('streak') > -1 || txt.indexOf('party') > -1;
  }

  function looksLikeSectionTitle(el){
    if(!el || el.nodeType !== 1) return false;
    var txt = (el.textContent || '').toLowerCase();
    return txt.indexOf('vandaag') > -1 || txt.indexOf('volgende week') > -1 || txt.indexOf('next week') > -1 || txt.indexOf('later') > -1;
  }

  function findInsertionPoint(content){
    if(!content) return null;
    var children = Array.prototype.slice.call(content.children || []);
    var firstSection = null;
    children.some(function(child){
      if(looksLikeSectionTitle(child)) { firstSection = child; return true; }
      var nested = Array.prototype.slice.call(child.querySelectorAll('h1,h2,h3,.section-title,.task-section-title'));
      var found = nested.find(looksLikeSectionTitle);
      if(found){ firstSection = child; return true; }
      return false;
    });
    if(firstSection) return firstSection;

    var lastStats = null;
    children.forEach(function(child){ if(looksLikeStatsCard(child)) lastStats = child; });
    if(lastStats && lastStats.nextSibling) return lastStats.nextSibling;
    return content.firstChild;
  }

  function build(){
    var screen = getTaskScreen();
    var content = getTaskContent(screen);
    if(!screen || !content) return;
    if(!window.HeroCardRenderer || !window.HeroCardDataAdapter) return;

    ensureStyles();

    var existing = document.getElementById(ROOT_ID);
    if(existing && existing.parentNode) existing.parentNode.removeChild(existing);

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
    track.innerHTML = cards.map(function(card, index){ return window.HeroCardRenderer.renderCard(card, index); }).join('');

    var insertionPoint = findInsertionPoint(content);
    if(insertionPoint) content.insertBefore(root, insertionPoint);
    else content.appendChild(root);

    if(window.HeroCarouselGestures) window.HeroCarouselGestures.attach(track);
  }

  function boot(){
    build();
    [120, 400, 900, 1600, 2600].forEach(function(delay){ setTimeout(build, delay); });
  }

  window.GroupQuestHeroCarousel = { version: VERSION, build: build, boot: boot };
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
