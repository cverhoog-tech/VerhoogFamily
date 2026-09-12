'use strict';
(function(){
  if(window.__familyAppCleaningMoreMenuIcon)return;
  window.__familyAppCleaningMoreMenuIcon=true;

  var ICON='<svg viewBox="0 0 32 32" width="28" height="28" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">'
    +'<path d="M4.5 15.5h13l-1.2 10H5.8l-1.3-10Z"/>'
    +'<path d="M6.8 15.5c0-4.2 2.2-7 4.2-7s4.2 2.8 4.2 7"/>'
    +'<path d="M23.5 4.5v15.2"/>'
    +'<path d="M20.5 19.7h6l2 6.2h-10l2-6.2Z"/>'
    +'<path d="M20.3 25.9 19 29M23.4 25.9v3.1M26.5 25.9l1.3 3.1"/>'
    +'</svg>';

  function apply(){
    var btn=document.querySelector('[data-goto-more="cleaning"]');
    if(!btn)return;
    var icon=btn.querySelector('span');
    if(!icon)return;
    icon.innerHTML=ICON;
    icon.style.display='grid';
    icon.style.placeItems='center';
    icon.style.width='30px';
    icon.style.height='30px';
    icon.style.margin='0 auto';
    icon.style.color='var(--c-primary)';
  }

  var original=window.renderNav;
  if(typeof original==='function'){
    window.renderNav=function(){
      var result=original.apply(this,arguments);
      apply();
      return result;
    };
  }

  apply();
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});
})();
