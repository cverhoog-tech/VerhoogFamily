'use strict';
(function(){
  if(window.TaskCompletionFeedbackV1)return;
  var STYLE_ID='task-completion-feedback-v1-style';

  function injectStyle(){
    if(document.getElementById(STYLE_ID))return;
    var style=document.createElement('style');style.id=STYLE_ID;
    style.textContent=''
      +'.tv3d-complete{touch-action:manipulation;-webkit-tap-highlight-color:transparent;transition:transform .08s ease,filter .10s ease,background-color .12s ease,box-shadow .12s ease!important}'
      +'.tv3d-complete.is-touching{transform:scale(.985)!important;filter:brightness(1.06)}'
      +'.tv3d-complete.is-completing-now{transform:scale(.992);background:linear-gradient(180deg,#2e8a58,#236d47)!important;box-shadow:0 8px 20px rgba(35,109,71,.24),inset 0 1px 0 rgba(255,255,255,.10)!important}'
      +'.tv3d-complete.is-reopening-now{transform:scale(.992);filter:brightness(1.05)}'
      +'.tv3d-complete.is-completing-now span,.tv3d-complete.is-reopening-now span{transition:none!important}';
    document.head.appendChild(style);
  }

  function buttonFrom(target){return target&&target.closest?target.closest('[data-tv3-complete]'):null;}
  function textNode(btn){return btn&&btn.querySelector?btn.querySelector('span'):null;}

  document.addEventListener('pointerdown',function(event){
    var btn=buttonFrom(event.target);if(!btn||btn.disabled)return;
    injectStyle();btn.classList.add('is-touching');
  },true);
  ['pointerup','pointercancel'].forEach(function(type){document.addEventListener(type,function(event){var btn=buttonFrom(event.target);if(btn)btn.classList.remove('is-touching');},true);});

  document.addEventListener('click',function(event){
    var btn=buttonFrom(event.target);if(!btn||btn.disabled)return;
    injectStyle();
    var reopening=btn.classList.contains('is-done');
    btn.classList.remove('is-touching');
    btn.classList.toggle('is-completing-now',!reopening);
    btn.classList.toggle('is-reopening-now',reopening);
    var copy=textNode(btn);
    if(copy)copy.textContent=reopening?'Heropend':'Klaar ✓';
    // Keep the canonical toggleTask handler fully in charge. This layer only
    // removes perceived latency between the tap and the existing 90 ms rerender.
    setTimeout(function(){
      if(btn&&btn.isConnected){btn.classList.remove('is-completing-now','is-reopening-now');}
    },260);
  },true);

  injectStyle();
  window.TaskCompletionFeedbackV1={version:'1.0.0'};
})();
