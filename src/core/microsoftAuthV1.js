'use strict';
// FamilyApp Microsoft authentication companion v1.
// Keeps the accepted Login Brand V7 presentation intact and swaps only the
// visible Apple social control for Microsoft while Apple remains available for
// a later App Store phase.
(function(){
  if(window.FamilyAppMicrosoftAuth)return;

  var VERSION='1.0.0';
  var MICROSOFT_ID='flv7-microsoft';
  var LEGACY_APPLE_ID='flv7-apple';

  function providers(){return window.FamilyAppAuthProviders||{};}
  function enabled(){return providers().microsoft===true;}
  function auth(){
    try{return window.fbAuth||(window.firebase&&firebase.auth&&firebase.auth());}
    catch(error){return null;}
  }
  function button(){return document.getElementById(MICROSOFT_ID);}
  function label(){var b=button();return b&&b.querySelector('.flv7-provider-label');}
  function microsoftSvg(){
    return '<svg viewBox="0 0 24 24" aria-hidden="true">'
      +'<path fill="#f35325" d="M2 2h9v9H2z"/>'
      +'<path fill="#81bc06" d="M13 2h9v9h-9z"/>'
      +'<path fill="#05a6f0" d="M2 13h9v9H2z"/>'
      +'<path fill="#ffba08" d="M13 13h9v9h-9z"/>'
      +'</svg>';
  }
  function setBusy(busy){
    var b=button(),l=label();
    if(b)b.disabled=!!busy;
    if(l)l.textContent=busy?'Microsoft openen…':'Doorgaan met Microsoft';
  }
  function clearError(){
    var e=document.getElementById('auth-error');
    if(e){e.textContent='';e.style.display='none';}
  }
  function showError(error){
    setBusy(false);
    var code=error&&error.code||'';
    var message='Microsoft-login mislukt. Probeer opnieuw.';
    if(code==='auth/popup-closed-by-user'||code==='auth/cancelled-popup-request')message='Microsoft-login is geannuleerd. Probeer opnieuw.';
    else if(code==='auth/popup-blocked')message='De browser kon het Microsoft-inlogvenster niet openen. Tik nogmaals op “Doorgaan met Microsoft”.';
    else if(code==='auth/unauthorized-domain')message='Dit domein is nog niet toegestaan voor Firebase Authentication.';
    else if(code==='auth/operation-not-allowed')message='Microsoft-login moet nog éénmalig worden geactiveerd in Firebase Authentication.';
    else if(code==='auth/account-exists-with-different-credential')message='Er bestaat al een FamilyApp-account met hetzelfde e-mailadres. Log eerst in met je bestaande methode.';
    else if(code==='auth/network-request-failed')message='Geen verbinding met Microsoft/Firebase. Controleer je internetverbinding en probeer opnieuw.';
    else if(error&&error.message)message=error.message;
    if(window.FamilyAppLoginBrandV7&&typeof window.FamilyAppLoginBrandV7.showError==='function')window.FamilyAppLoginBrandV7.showError(message);
    else if(typeof window.showAuthError==='function')window.showAuthError(message+(code?' ['+code+']':''));
    else {
      var e=document.getElementById('auth-error');
      if(e){e.textContent=message;e.style.display='block';}
    }
  }
  function provider(){
    if(!window.firebase||!firebase.auth||!firebase.auth.OAuthProvider)throw new Error('Firebase Microsoft OAuth provider is niet beschikbaar.');
    var p=new firebase.auth.OAuthProvider('microsoft.com');
    p.setCustomParameters({prompt:'select_account'});
    return p;
  }
  function handoff(result){
    var user=result&&result.user;
    var controller=window.AuthenticatedSessionController;
    if(!user||!controller||typeof controller.acceptAuthenticatedUser!=='function')return Promise.resolve(result||null);
    return Promise.resolve(controller.acceptAuthenticatedUser(user)).then(function(){return result||null;});
  }
  function signIn(){
    if(!enabled()){
      showError({code:'auth/operation-not-allowed'});
      return Promise.resolve(null);
    }
    var a=auth();
    if(!a){showError(new Error('Firebase is nog niet klaar. Probeer opnieuw.'));return Promise.resolve(null);}
    clearError();setBusy(true);
    var p;
    try{p=a.signInWithPopup(provider());}
    catch(error){showError(error);return Promise.resolve(null);}
    return Promise.resolve(p).then(function(result){return handoff(result);}).catch(function(error){showError(error);return null;}).finally(function(){setBusy(false);});
  }
  function installButton(){
    var existing=button();
    if(existing)return existing;
    var apple=document.getElementById(LEGACY_APPLE_ID);
    if(!apple||!apple.parentNode)return null;

    // Clone to remove LoginBrandV7's old Apple click listener without changing
    // that accepted controller. Apple can therefore be restored later cleanly.
    var b=apple.cloneNode(true);
    b.id=MICROSOFT_ID;
    b.type='button';
    b.setAttribute('aria-label','Doorgaan met Microsoft');
    var icon=b.querySelector('.flv7-provider-icon');
    if(icon){icon.classList.remove('flv7-apple-icon');icon.classList.add('flv7-microsoft-icon');icon.innerHTML=microsoftSvg();}
    var text=b.querySelector('.flv7-provider-label');
    if(text)text.textContent='Doorgaan met Microsoft';
    b.addEventListener('click',signIn);
    apple.parentNode.replaceChild(b,apple);
    return b;
  }
  function readiness(){
    var a=auth();
    return {
      version:VERSION,
      enabled:enabled(),
      firebaseReady:!!(window.firebase&&firebase.auth&&firebase.auth.OAuthProvider),
      authReady:!!a,
      buttonVisible:!!button(),
      providerId:'microsoft.com'
    };
  }
  function boot(){installButton();}

  window.addEventListener('familyapp:login-brand-ready',function(){window.setTimeout(installButton,0);});
  window.FamilyAppMicrosoftAuth=Object.freeze({version:VERSION,signIn:signIn,installButton:installButton,readiness:readiness});
  window.signInWithMicrosoft=signIn;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
