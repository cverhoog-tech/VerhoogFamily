'use strict';
(function(){
  if(window.FamilyAppAppleAuth)return;

  var VERSION='1.0.0';
  var BUTTON_ID='apple-btn';
  var BUTTON_HTML='<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 12.54c-.03-3.05 2.49-4.52 2.6-4.59-1.43-2.08-3.64-2.36-4.42-2.38-1.86-.2-3.67 1.12-4.62 1.12-.97 0-2.43-1.1-4.01-1.07-2.03.03-3.93 1.21-4.97 3.03-2.14 3.71-.54 9.16 1.51 12.16 1.03 1.47 2.23 3.11 3.8 3.05 1.54-.06 2.12-.98 3.98-.98 1.84 0 2.39.98 4 .94 1.65-.03 2.69-1.47 3.68-2.95 1.19-1.69 1.67-3.35 1.69-3.44-.04-.01-3.2-1.22-3.24-4.89ZM14.01 3.6C14.83 2.58 15.39 1.18 15.23-.22c-1.19.05-2.68.82-3.54 1.82-.76.88-1.44 2.34-1.25 3.68 1.34.1 2.72-.68 3.57-1.68Z"/></svg><span>Inloggen met Apple</span>';

  function cfg(){return window.FamilyAppAuthProviders||{};}
  function enabled(){return cfg().apple===true;}
  function auth(){try{return window.fbAuth||(window.firebase&&firebase.auth&&firebase.auth());}catch(e){return null;}}
  function isMobile(){return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent||'')||window.matchMedia&&window.matchMedia('(max-width: 820px)').matches;}
  function button(){return document.getElementById(BUTTON_ID);}
  function clearError(){var e=document.getElementById('auth-error');if(e){e.textContent='';e.style.display='none';}}
  function showError(err){
    var b=button();if(b){b.innerHTML=BUTTON_HTML;b.disabled=false;}
    var code=err&&err.code||'';
    var msg='Apple-login mislukt. Probeer opnieuw.';
    if(code==='auth/popup-closed-by-user'||code==='auth/cancelled-popup-request')msg='Apple-login is geannuleerd. Probeer opnieuw.';
    else if(code==='auth/popup-blocked')msg='Safari kon het Apple-inlogvenster niet openen. Tik nogmaals op “Inloggen met Apple”.';
    else if(code==='auth/unauthorized-domain')msg='Dit domein is nog niet toegestaan voor Firebase Authentication.';
    else if(code==='auth/operation-not-allowed')msg='Apple-login is nog niet geactiveerd in Firebase Authentication.';
    else if(code==='auth/account-exists-with-different-credential')msg='Er bestaat al een account met hetzelfde e-mailadres. Log eerst in met je bestaande methode; daarna kunnen we Apple veilig koppelen.';
    else if(err&&err.message)msg=err.message;
    if(typeof window.showAuthError==='function')window.showAuthError(msg+(code?' ['+code+']':''));
    else {var e=document.getElementById('auth-error');if(e){e.textContent=msg;e.style.display='block';}}
  }
  function provider(){
    if(!window.firebase||!firebase.auth||!firebase.auth.OAuthProvider)throw new Error('Firebase Apple OAuth provider is niet beschikbaar');
    var p=new firebase.auth.OAuthProvider('apple.com');
    p.addScope('email');
    p.addScope('name');
    p.setCustomParameters({locale:'nl_NL'});
    return p;
  }
  function ensureButton(){
    var existing=button();
    if(!enabled()){if(existing)existing.remove();return null;}
    if(existing)return existing;
    var google=document.getElementById('google-btn');
    if(!google||!google.parentNode)return null;
    var b=document.createElement('button');
    b.id=BUTTON_ID;b.type='button';b.setAttribute('aria-label','Inloggen met Apple');
    b.style.cssText='width:100%;background:#000;color:#fff;border:1.5px solid #000;border-radius:12px;padding:13px 16px;font-size:15px;font-weight:650;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:10px;margin:-4px 0 14px;box-shadow:0 1px 4px rgba(0,0,0,.12);transition:opacity .15s,transform .15s';
    b.innerHTML=BUTTON_HTML;
    b.onclick=signIn;
    google.insertAdjacentElement('afterend',b);
    return b;
  }
  function signIn(){
    if(!enabled())return;
    var a=auth();if(!a){showError(new Error('Firebase is nog niet klaar. Probeer opnieuw.'));return;}
    clearError();
    var b=ensureButton();if(b){b.textContent='Apple openen...';b.disabled=true;}
    var p;try{
      var pr=provider();
      if(isMobile()&&typeof a.signInWithRedirect==='function'){
        p=a.signInWithRedirect(pr);
      }else{
        p=a.signInWithPopup(pr);
      }
    }catch(e){showError(e);return;}
    Promise.resolve(p).catch(showError);
  }
  function handleRedirectResult(){
    if(!enabled())return Promise.resolve(null);
    var a=auth();if(!a||typeof a.getRedirectResult!=='function')return Promise.resolve(null);
    return a.getRedirectResult().then(function(result){return result||null;}).catch(function(err){showError(err);return null;});
  }
  function readiness(){
    var a=auth(),firebaseReady=!!(window.firebase&&firebase.auth&&firebase.auth.OAuthProvider);
    return {version:VERSION,enabled:enabled(),firebaseReady:firebaseReady,authReady:!!a,authDomain:(window.firebase&&firebase.app&&firebase.apps&&firebase.apps[0]&&firebase.apps[0].options&&firebase.apps[0].options.authDomain)||null,buttonVisible:!!button()};
  }
  function boot(){ensureButton();handleRedirectResult();}

  window.FamilyAppAppleAuth={version:VERSION,signIn:signIn,ensureButton:ensureButton,readiness:readiness,handleRedirectResult:handleRedirectResult};
  window.signInWithApple=signIn;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
