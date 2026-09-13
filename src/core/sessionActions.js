'use strict';
// ============================================================
// FAMILYAPP SESSION ACTIONS v1.2.0
// Explicit account actions. Firebase Auth remains the sole auth authority;
// AuthenticatedSessionController owns the one auth-state observer and returns
// the app to the login screen after sign-out.
// ============================================================
(function(){
  if(window.FamilySessionActions)return;

  var busy=false;
  var moreObserver=null;
  var onboardingObserver=null;

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
    addMoreLogoutButton();
    var grid=document.getElementById('more-grid');
    if(!grid||moreObserver)return;
    moreObserver=new MutationObserver(function(){addMoreLogoutButton();});
    moreObserver.observe(grid,{childList:true});
  }

  function ensureOnboardingCancel(){
    var overlay=document.getElementById('household-onboarding');
    if(!overlay||overlay.querySelector('#hh-cancel-login'))return;
    if(!overlay.querySelector('[data-hh="create"]')||!overlay.querySelector('[data-hh="join"]'))return;
    var card=overlay.querySelector('.hh-card');if(!card)return;
    var button=document.createElement('button');
    button.type='button';
    button.className='hh-back';
    button.id='hh-cancel-login';
    button.textContent='Terug naar inloggen';
    button.onclick=function(){
      if(button.disabled)return;
      button.disabled=true;
      signOut().then(function(){
        var current=document.getElementById('household-onboarding');if(current)current.remove();
      }).catch(function(){button.disabled=false;});
    };
    card.appendChild(button);
  }

  function installOnboardingCancel(){
    ensureOnboardingCancel();
    if(onboardingObserver||!document.body)return;
    onboardingObserver=new MutationObserver(function(){ensureOnboardingCancel();});
    onboardingObserver.observe(document.body,{childList:true,subtree:true});
  }

  function installSessionUi(){installMoreLogout();installOnboardingCancel();}

  window.FamilySessionActions={
    version:'1.2.0',
    signOut:signOut,
    isBusy:function(){return busy;},
    ensureMoreLogout:addMoreLogoutButton,
    ensureOnboardingCancel:ensureOnboardingCancel
  };

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',installSessionUi,{once:true});
  else installSessionUi();
})();
