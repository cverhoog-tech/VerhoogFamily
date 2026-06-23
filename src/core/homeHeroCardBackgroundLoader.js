'use strict';
(function(){
  var ID = 'home-hero-card-backgrounds-css';
  function load(){
    if(document.getElementById(ID)) return;
    var link = document.createElement('link');
    link.id = ID;
    link.rel = 'stylesheet';
    link.href = 'src/styles/homeHeroCardBackgrounds.css';
    document.head.appendChild(link);
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', load);
  else load();
  window.addEventListener('load', load);
})();
