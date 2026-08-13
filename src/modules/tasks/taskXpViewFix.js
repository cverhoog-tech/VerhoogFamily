'use strict';
(function(){
  if(window.__taskXpViewFixV1)return;
  window.__taskXpViewFixV1=true;
  function apply(){
    document.querySelectorAll('.tch-reward').forEach(function(el){el.innerHTML='+4<small>XP</small>';});
    document.querySelectorAll('#tdp-overlay .tdp-xp-num').forEach(function(el){el.textContent='+4';});
    document.querySelectorAll('#tdp-overlay .tdp-xp-shield b').forEach(function(el){el.textContent='4';});
    document.querySelectorAll('#party-quest-invite-modal .pqi-row small').forEach(function(el){if(/XP/i.test(el.textContent||''))el.textContent=(el.textContent||'').replace(/\+?\d+\s*XP/i,'+4 XP');});
  }
  document.addEventListener('click',function(){setTimeout(apply,50);},true);
  window.addEventListener('familyapp:tasks-updated',function(){setTimeout(apply,50);});
  setInterval(apply,1000);
})();
