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

