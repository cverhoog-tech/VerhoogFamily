'use strict';
(function(){
  if(window.__familyGoogleAuthCommandV3)return;
  window.__familyGoogleAuthCommandV3=true;
  var BUTTON='<svg width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg> Inloggen met Google';
  function button(){return document.getElementById('google-btn');}
  function reset(){var b=button();if(b){b.innerHTML=BUTTON;b.disabled=false;}}
  function clearError(){var e=document.getElementById('auth-error');if(e){e.textContent='';e.style.display='none';}}
  function showError(err){
    reset();
    var code=err&&err.code||'';
    var msg=code==='auth/popup-closed-by-user'||code==='auth/cancelled-popup-request'?'Google-login is geannuleerd. Probeer opnieuw.':code==='auth/popup-blocked'?'Safari kon het Google-venster niet openen. Tik nogmaals op “Inloggen met Google”.':code==='auth/unauthorized-domain'?'Deze preview-URL is nog niet toegestaan in Firebase Authentication.':(typeof window.translateFbError==='function'?window.translateFbError(err):(err&&err.message||'Google-login mislukt'));
    if(typeof window.showAuthError==='function')window.showAuthError(msg+(code&&msg.indexOf('[')<0?' ['+code+']':''));
  }
  function auth(){try{return window.fbAuth||(window.firebase&&firebase.auth&&firebase.auth());}catch(e){return null;}}
  function T(label){try{if(window.__familyAuthTiming)window.__familyAuthTiming.mark(label);}catch(e){}}
  function handoff(result,b){
    T('T4-popup-user-received');
    var user=result&&result.user;
    if(b){b.textContent='Gezin laden...';b.disabled=true;}
    var controller=window.AuthenticatedSessionController;
    if(!user||!controller||typeof controller.acceptAuthenticatedUser!=='function')return Promise.resolve();
    T('T5-acceptAuthenticatedUser-called');
    return Promise.resolve(controller.acceptAuthenticatedUser(user)).then(function(){
      var status=typeof controller.status==='function'?controller.status():null;
      if(status&&status.state==='recoverableError')reset();
    });
  }
  window.signInWithGoogle=function(){
    try{if(window.__familyAuthTiming)window.__familyAuthTiming.begin('T0-login-tap');}catch(e){}
    var a=auth();
    if(!a){if(typeof window.showAuthError==='function')window.showAuthError('Firebase is nog niet klaar. Probeer opnieuw.');return;}
    clearError();
    var b=button();if(b){b.textContent='Google openen...';b.disabled=true;}
    var provider=new firebase.auth.GoogleAuthProvider();provider.addScope('profile');provider.addScope('email');provider.setCustomParameters({prompt:'select_account'});
    T('T1-before-signInWithPopup');
    var p;try{p=a.signInWithPopup(provider);}catch(e){showError(e);return;}
    T('T2-popup-call-issued(proxy-for-chooser-open)');
    Promise.resolve(p).then(function(result){T('T3-popup-promise-resolved');return handoff(result,b);}).catch(showError);
  };
})();
