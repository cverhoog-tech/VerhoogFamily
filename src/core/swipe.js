'use strict';
// ============================================================
// SWIPE TO DELETE
// ============================================================
function attachSwipeDelete(el, onDelete) {
  var startX=0,startY=0,dx=0,moving=false,threshold=80;
  var content=el.querySelector('.swipe-content')||el;
  el.addEventListener('touchstart',function(e){startX=e.touches[0].clientX;startY=e.touches[0].clientY;dx=0;moving=false;},{passive:true});
  el.addEventListener('touchmove',function(e){
    dx=e.touches[0].clientX-startX;var dy=e.touches[0].clientY-startY;
    if(!moving&&Math.abs(dy)>Math.abs(dx))return;
    moving=true;if(dx<0)content.style.transform='translateX('+Math.max(dx,-120)+'px)';
  },{passive:true});
  el.addEventListener('touchend',function(){
    if(dx<-threshold){content.style.transform='translateX(-100%)';content.style.transition='transform .2s';setTimeout(onDelete,200);}
    else{content.style.transform='';content.style.transition='transform .15s';setTimeout(function(){content.style.transition='';},160);}
    dx=0;moving=false;
  },{passive:true});
}

// ============================================================
// v0.263 SAFE UI POLISH LOADER
// Isolated here so index.html and the large app.css remain untouched.
// ============================================================
(function installUiPolishV0263(){
  if(window.__uiPolishV0263) return;
  window.__uiPolishV0263=true;

  var link=document.createElement('link');
  link.rel='stylesheet';
  link.href='src/styles/ui-polish-v0263.css';
  link.setAttribute('data-ui-polish-v0263','');
  document.head.appendChild(link);

  var paths={
    home:'<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10.5V20h13v-9.5"/><path d="M9.5 20v-6h5v6"/>',
    tasks:'<rect x="4" y="4" width="16" height="16" rx="4"/><path d="m8 12 2.5 2.5L16.5 9"/>',
    notes:'<path d="M6 3.5h9l3 3V20H6z"/><path d="M14.5 3.5V7H18"/><path d="M9 11h6M9 15h6"/>',
    shop:'<path d="M3 5h2l2 10h9.5l2-7H6"/><circle cx="9" cy="19" r="1.2"/><circle cx="16" cy="19" r="1.2"/>',
    cal:'<rect x="4" y="5" width="16" height="15" rx="3"/><path d="M8 3v4M16 3v4M4 9h16"/>',
    finance:'<path d="M4 7.5h15v11H5.5A2.5 2.5 0 0 1 3 16V7a2 2 0 0 1 2-2h11"/><path d="M15 11h5v4h-5a2 2 0 0 1 0-4Z"/>',
    achievements:'<path d="M8 4h8v4a4 4 0 0 1-8 0Z"/><path d="M8 6H5v2a4 4 0 0 0 4 4M16 6h3v2a4 4 0 0 1-4 4M12 12v4M8.5 20h7M10 16h4"/>',
    notif:'<path d="M6 16h12l-1.5-2V9a4.5 4.5 0 0 0-9 0v5Z"/><path d="M10 19a2.2 2.2 0 0 0 4 0"/>',
    profile:'<circle cx="12" cy="8" r="3.5"/><path d="M5 20a7 7 0 0 1 14 0"/>',
    recipes:'<path d="M8 10a3 3 0 1 1 1-5.8A3.8 3.8 0 0 1 16 5a3 3 0 1 1 0 5H8Z"/><path d="M8 10v8h8v-8M9 14h6"/>',
    skills:'<path d="m13 2-7 11h6l-1 9 7-12h-6Z"/>',
    meals:'<path d="M7 3v7M4.5 3v4a2.5 2.5 0 0 0 5 0V3M7 10v11M16 3v18M16 3c3 2 3 7 0 9"/>',
    templates:'<rect x="5" y="4.5" width="14" height="16" rx="3"/><path d="M9 4.5V3h6v1.5M9 10h6M9 14h6"/>',
    more:'<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
    settings:'<circle cx="12" cy="12" r="3"/><path d="M19 13.5v-3l-2-.6a6 6 0 0 0-.8-1.9l1-1.8-2.1-2.1-1.8 1A6 6 0 0 0 11.5 4L11 2H8l-.6 2a6 6 0 0 0-1.9.8l-1.8-1-2.1 2.1 1 1.8A6 6 0 0 0 2 10v3l2 .6a6 6 0 0 0 .8 1.9l-1 1.8 2.1 2.1 1.8-1a6 6 0 0 0 1.9.8l.6 2h3l.6-2a6 6 0 0 0 1.9-.8l1.8 1 2.1-2.1-1-1.8a6 6 0 0 0 .4-2Z"/>'
  };
  function svg(name){return '<svg viewBox="0 0 24 24" aria-hidden="true">'+(paths[name]||paths.more)+'</svg>';}
  function polishNav(){
    var nav=document.getElementById('bottom-nav');
    if(nav){
      nav.querySelectorAll('[data-goto]').forEach(function(btn){var icon=btn.querySelector('.nav-icon');if(icon)icon.innerHTML=svg(btn.dataset.goto);});
      var more=document.getElementById('nav-more-btn');if(more){var mi=more.querySelector('.nav-icon');if(mi)mi.innerHTML=svg('more');}
    }
    var grid=document.getElementById('more-grid');
    if(grid){
      grid.querySelectorAll('[data-goto-more]').forEach(function(btn){var first=btn.querySelector('span');if(first){first.className='more-icon';first.innerHTML=svg(btn.dataset.gotoMore);}});
      var cfg=document.getElementById('nav-config-btn');if(cfg){var ci=cfg.querySelector('span');if(ci){ci.className='more-icon';ci.innerHTML=svg('settings');}cfg.classList.add('is-config');}
    }
  }
  if(typeof renderNav==='function'){
    var originalRenderNav=renderNav;
    renderNav=function(){var result=originalRenderNav.apply(this,arguments);polishNav();return result;};
  }
  document.addEventListener('DOMContentLoaded',polishNav);
  setTimeout(polishNav,0);
})();
