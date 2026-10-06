'use strict';
// FamilyApp Google authentication owner v4.
// Owns the public signInWithGoogle command and keeps provider-popup lifecycle
// errors isolated from the manual e-mail registration flow.
(function(){
  if(window.FamilyAppGoogleAuthV4){
    window.signInWithGoogle=window.FamilyAppGoogleAuthV4.signIn;
    return;
  }

  var VERSION='4.0.0';
  function tr(key,fallback,params){try{if(window.FamilyI18n&&typeof window.FamilyI18n.t==='function'){var value=window.FamilyI18n.t(key,params||{});if(value&&value!==key)return value;}}catch(error){}return fallback;}
  var activeAttempt=0;
  function legacyButton(){return '<svg width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg> '+tr('auth.google','Doorgaan met Google');}

  function button(){
    return document.getElementById('flv7-google')||document.getElementById('google-btn');
  }
  function mode(){
    return window._loginTab==='register'?'register':'login';
  }
  function setBusy(busy,labelText){
    var b=button();
    if(!b)return;
    b.disabled=!!busy;
    var label=b.querySelector&&b.querySelector('.flv7-provider-label');
    if(label){
      label.textContent=labelText||(busy?tr('auth.google.opening','Google openen…'):tr('auth.google','Doorgaan met Google'));
      return;
    }
    b.innerHTML=busy?(labelText||tr('auth.google.opening','Google openen…')):legacyButton();
  }
  function reset(){
    setBusy(false);
  }
  function clearError(){
    if(window.FamilyAppLoginBrandV7&&typeof window.FamilyAppLoginBrandV7.showError==='function'){
      window.FamilyAppLoginBrandV7.showError('');
      return;
    }
    var e=document.getElementById('auth-error');
    if(e){e.textContent='';e.style.display='none';}
  }
  function emitError(message){
    if(window.FamilyAppLoginBrandV7&&typeof window.FamilyAppLoginBrandV7.showError==='function'){
      window.FamilyAppLoginBrandV7.showError(message);
      return;
    }
    if(typeof window.showAuthError==='function'){
      window.showAuthError(message);
      return;
    }
    var e=document.getElementById('auth-error');
    if(e){e.textContent=message||'';e.style.display=message?'block':'none';}
  }
  function isPopupLifecycleError(code){
    return code==='auth/popup-closed-by-user'||code==='auth/cancelled-popup-request'||code==='auth/popup-blocked';
  }
  function showError(error,attemptId,startedMode){
    reset();
    if(attemptId!==activeAttempt)return;
    var code=error&&error.code||'';

    // A popup can reject slightly after the user has already switched to manual
    // registration. That late provider error must never contaminate the form.
    if(startedMode!=='register'&&mode()==='register'&&isPopupLifecycleError(code))return;

    var message=code==='auth/popup-closed-by-user'||code==='auth/cancelled-popup-request'
      ?tr('auth.google.cancelled','Google-login is geannuleerd. Probeer opnieuw.')
      :code==='auth/popup-blocked'
        ?tr('auth.google.popupBlocked','Safari kon het Google-venster niet openen. Tik nogmaals op “Doorgaan met Google”.')
        :code==='auth/unauthorized-domain'
          ?tr('auth.urlUnauthorized','Deze URL is nog niet toegestaan in Firebase Authentication.')
          :(typeof window.translateFbError==='function'
            ?window.translateFbError(error)
            :(error&&error.message||'Google-login mislukt'));
    emitError(message);
  }
  function auth(){
    try{return window.fbAuth||(window.firebase&&firebase.auth&&firebase.auth());}
    catch(error){return null;}
  }
  function handoff(result,attemptId){
    if(attemptId!==activeAttempt)return Promise.resolve(result||null);
    var user=result&&result.user;
    setBusy(true,tr('auth.loadingHousehold','Gezin laden…'));
    var controller=window.AuthenticatedSessionController;
    if(!user||!controller||typeof controller.acceptAuthenticatedUser!=='function'){
      reset();
      return Promise.resolve(result||null);
    }
    return Promise.resolve(controller.acceptAuthenticatedUser(user)).then(function(){
      var status=typeof controller.status==='function'?controller.status():null;
      if(status&&status.state==='recoverableError')reset();
      return result||null;
    });
  }
  function signIn(){
    var a=auth();
    if(!a){
      emitError(tr('auth.firebaseNotReady','Firebase is nog niet klaar. Probeer opnieuw.'));
      return Promise.resolve(null);
    }

    var attemptId=++activeAttempt;
    var startedMode=mode();
    clearError();
    setBusy(true,tr('auth.google.opening','Google openen…'));

    var provider=new firebase.auth.GoogleAuthProvider();
    provider.addScope('profile');
    provider.addScope('email');
    provider.setCustomParameters({prompt:'select_account'});

    var request;
    try{request=a.signInWithPopup(provider);}
    catch(error){
      showError(error,attemptId,startedMode);
      return Promise.resolve(null);
    }

    return Promise.resolve(request)
      .then(function(result){return handoff(result,attemptId);})
      .catch(function(error){showError(error,attemptId,startedMode);return null;});
  }
  function cancelPending(){
    activeAttempt+=1;
    reset();
  }
  function install(){
    window.signInWithGoogle=signIn;
  }

  window.addEventListener('familyapp:auth-mode-change',function(event){
    var next=event&&event.detail&&event.detail.mode;
    if(next==='register')cancelPending();
  });
  window.addEventListener('familyapp:login-brand-ready',install);
  window.addEventListener('familyapp:language-changed',function(){if(!button()||button().disabled)return;reset();});

  window.FamilyAppGoogleAuthV4=Object.freeze({
    version:VERSION,
    signIn:signIn,
    cancelPending:cancelPending
  });
  install();
})();