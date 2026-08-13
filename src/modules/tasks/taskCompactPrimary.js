'use strict';
(function(){
  if(window.__taskCompactPrimaryV1)return;
  window.__taskCompactPrimaryV1=true;
  function apply(){
    try{taskTab='compact';}catch(e){}
    var screen=document.getElementById('screen-tasks');if(!screen)return;
    var buttons=Array.prototype.slice.call(screen.querySelectorAll('.task-tabs .ttab'));
    var overview=buttons.find(function(b){return (b.textContent||'').trim()==='Overzicht';});
    var compact=buttons.find(function(b){return (b.textContent||'').trim()==='Compact';});
    if(overview){overview.setAttribute('onclick',"setTaskTab('compact',this)");overview.classList.add('active');}
    if(compact)compact.remove();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply);else apply();
  window.addEventListener('load',apply);
})();
