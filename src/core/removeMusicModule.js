'use strict';
// ============================================================
// REMOVE MUSIC MODULE v0.331
// Removes legacy music / YouTube Music UI from the app shell.
// This prevents hidden floating music layers from appearing above headers.
// ============================================================

(function(){
  var STYLE_ID = 'remove-music-module-v0331';
  var MUSIC_SELECTORS = [
    '#yt-bar',
    '#yt-thumb',
    '#yt-title',
    '#yt-artist',
    '#yt-visualizer',
    '.yt-bar',
    '.yt-thumb',
    '.yt-info',
    '.yt-title',
    '.yt-artist',
    '.yt-controls',
    '.yt-btn',
    '.yt-play-btn',
    '.yt-visualizer',
    '[onclick*="openYouTubeMusic"]',
    '[onclick*="ytTogglePlay"]',
    '[onclick*="ytNext"]',
    '[onclick*="ytPrev"]',
    '[onclick*="closeYtBar"]'
  ];

  function injectStyles(){
    var old = document.getElementById(STYLE_ID);
    if(old) old.remove();
    var style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = [
      MUSIC_SELECTORS.join(',') + '{display:none!important;visibility:hidden!important;pointer-events:none!important;opacity:0!important;width:0!important;height:0!important;max-width:0!important;max-height:0!important;overflow:hidden!important;position:absolute!important;z-index:-1!important}',
      'body{overscroll-behavior-y:none!important}',
      '.app-header{z-index:80!important;background:var(--c-header-bg,#fff)!important}'
    ].join('\n');
    document.head.appendChild(style);
  }

  function removeMusicNodes(){
    MUSIC_SELECTORS.forEach(function(selector){
      document.querySelectorAll(selector).forEach(function(node){
        if(node && node.parentNode){
          node.parentNode.removeChild(node);
        }
      });
    });

    // Remove remaining buttons that visibly mention music.
    document.querySelectorAll('button, a, div').forEach(function(node){
      var text = (node.textContent || '').trim().toLowerCase();
      var onclick = String(node.getAttribute && node.getAttribute('onclick') || '').toLowerCase();
      if(text === 'muziek' || text.indexOf('youtube music') >= 0 || onclick.indexOf('youtube') >= 0 || onclick.indexOf('yt') === 0){
        if(node.parentNode) node.parentNode.removeChild(node);
      }
    });
  }

  function neutralizeGlobals(){
    var noop = function(){ return false; };
    [
      'openYouTubeMusic',
      'ytPrev',
      'ytNext',
      'ytTogglePlay',
      'closeYtBar',
      'initYouTubeMusic',
      'renderYouTubeMusic',
      'startYtVisualizer',
      'stopYtVisualizer'
    ].forEach(function(name){
      try { window[name] = noop; } catch(e) {}
    });
  }

  function boot(){
    injectStyles();
    neutralizeGlobals();
    removeMusicNodes();
    [100, 300, 700, 1500].forEach(function(delay){
      setTimeout(function(){
        injectStyles();
        neutralizeGlobals();
        removeMusicNodes();
      }, delay);
    });
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
