'use strict';
(function(){
  if(window.__familyLoginShellGuardV1)return;
  window.__familyLoginShellGuardV1=true;

  function login(){return document.getElementById('login-screen');}
  function visible(){
    var el=login();
    if(!el)return false;
    var cs=window.getComputedStyle?getComputedStyle(el):null;
    return el.style.display!=='none'&&(!cs||cs.display!=='none');
  }
  function sync(){
    var on=visible();
    document.documentElement.classList.toggle('family-login-visible',on);
    document.body&&document.body.classList.toggle('family-login-visible',on);
    var el=login();
    if(el){
      el.setAttribute('aria-hidden',on?'false':'true');
      if(on)el.style.pointerEvents='auto';
    }
  }
  function boot(){
    sync();
    var el=login();
    if(el){
      new MutationObserver(sync).observe(el,{attributes:true,attributeFilter:['style','class']});
    }
    window.addEventListener('familyapp:session-state',function(){setTimeout(sync,0);});
    window.addEventListener('pageshow',sync);
    window.addEventListener('focus',sync);
  }
  window.FamilyLoginShellGuard={sync:sync,visible:visible};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
