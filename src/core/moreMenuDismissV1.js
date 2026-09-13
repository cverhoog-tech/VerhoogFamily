'use strict';
(function(){
  if(window.MoreMenuDismissV1)return;

  var STYLE_ID='familyapp-more-menu-dismiss-v1';
  var BACKDROP_ID='more-menu-backdrop-v1';
  var originalToggle=window.toggleMore;
  var originalClose=window.closeMore;

  function menu(){return document.getElementById('more-menu');}
  function backdrop(){return document.getElementById(BACKDROP_ID);}

  function ensureStyle(){
    if(document.getElementById(STYLE_ID))return;
    var style=document.createElement('style');style.id=STYLE_ID;
    style.textContent='#'+BACKDROP_ID+'{display:none;position:fixed;inset:0;z-index:18;background:rgba(2,8,10,.14);-webkit-tap-highlight-color:transparent;touch-action:manipulation}#'+BACKDROP_ID+'.open{display:block}';
    document.head.appendChild(style);
  }

  function ensureBackdrop(){
    var el=backdrop();if(el)return el;
    ensureStyle();
    el=document.createElement('div');
    el.id=BACKDROP_ID;
    el.setAttribute('aria-hidden','true');
    el.addEventListener('pointerdown',function(event){
      event.preventDefault();
      event.stopPropagation();
      if(typeof window.closeMore==='function')window.closeMore();
    });
    document.body.appendChild(el);
    return el;
  }

  function sync(){
    var m=menu(),b=ensureBackdrop();
    var open=!!(m&&m.classList.contains('open'));
    b.classList.toggle('open',open);
    document.documentElement.classList.toggle('familyapp-more-open',open);
  }

  if(typeof originalToggle==='function'){
    window.toggleMore=function(){
      originalToggle.apply(this,arguments);
      sync();
    };
  }
  if(typeof originalClose==='function'){
    window.closeMore=function(){
      originalClose.apply(this,arguments);
      sync();
    };
  }

  var nav=document.getElementById('bottom-nav');
  if(nav)nav.addEventListener('click',function(){requestAnimationFrame(sync);});

  document.addEventListener('keydown',function(event){
    if(event.key==='Escape'&&menu()&&menu().classList.contains('open')&&typeof window.closeMore==='function')window.closeMore();
  });

  ensureBackdrop();
  sync();
  window.MoreMenuDismissV1={version:'1.0.0',sync:sync};
})();
