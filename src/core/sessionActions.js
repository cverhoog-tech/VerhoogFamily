'use strict';
// ============================================================
// FAMILYAPP SESSION ACTIONS v1.1.0
// Explicit account actions. Firebase Auth remains the sole auth authority;
// AuthenticatedSessionController owns the one auth-state observer and returns
// the app to the login screen after sign-out.
// ============================================================
(function(){
  if(window.FamilySessionActions)return;

  var busy=false;
  var moreObserver=null;

  function auth(){
    try{if(window.fbAuth)return window.fbAuth;}catch(e){}
    try{if(window.firebase&&typeof window.firebase.auth==='function')return window.firebase.auth();}catch(e){}
    return null;
  }

  function toast(message){
    try{if(typeof window.showToast==='function')window.showToast(message);}catch(e){}
  }

  function signOut(){
    if(busy)return Promise.resolve(false);
    var instance=auth();
    if(!instance||typeof instance.signOut!=='function')return Promise.reject(new Error('FIREBASE_AUTH_REQUIRED'));
    busy=true;
    try{if(typeof window.closeMore==='function')window.closeMore();}catch(e){}
    return Promise.resolve(instance.signOut()).then(function(){
      return true;
    }).catch(function(error){
      toast('Uitloggen mislukt. Probeer opnieuw.');
      throw error;
    }).finally(function(){
      busy=false;
    });
  }

  function addMoreLogoutButton(){
    var grid=document.getElementById('more-grid');
    if(!grid||grid.querySelector('#more-logout-btn'))return;
    var button=document.createElement('button');
    button.className='more-btn';
    button.id='more-logout-btn';
    button.style.border='1.5px solid rgba(220,38,38,.22)';
    button.style.color='#dc2626';
    button.innerHTML='<span style="font-size:22px">↪</span><span>Uitloggen</span>';
    button.onclick=function(){
      try{if(typeof window.closeMore==='function')window.closeMore();}catch(e){}
      signOut().catch(function(){});
    };
    grid.appendChild(button);
  }

  function installMoreLogout(){
    var grid=document.getElementById('more-grid');
    if(!grid)return;
    addMoreLogoutButton();
    if(moreObserver)return;
    moreObserver=new MutationObserver(function(){addMoreLogoutButton();});
    moreObserver.observe(grid,{childList:true});
  }

  window.FamilySessionActions={
    version:'1.1.0',
    signOut:signOut,
    isBusy:function(){return busy;},
    ensureMoreLogout:addMoreLogoutButton
  };

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',installMoreLogout,{once:true});
  else installMoreLogout();
})();
