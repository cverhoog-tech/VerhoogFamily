'use strict';
// FamilyApp manual e-mail auth recovery v1.
// Companion around the existing canonical submitAuth/loginBrandV7 owners.
(function(){
  if(window.FamilyAppManualAuthRecoveryV1)return;

  var VERSION='1.0.0';
  var boundScreen=null;

  function byId(id){return document.getElementById(id);}
  function clean(value){return String(value==null?'':value).trim();}
  function auth(){
    try{
      if(window.fbAuth)return window.fbAuth;
      if(typeof fbAuth!=='undefined'&&fbAuth)return fbAuth;
    }catch(error){}
    return null;
  }
  function isRegister(){return window._loginTab==='register';}

  function ensureStyle(){
    if(byId('familyapp-manual-auth-recovery-v1-style'))return;
    var style=document.createElement('style');
    style.id='familyapp-manual-auth-recovery-v1-style';
    style.textContent=''
      +'.familyapp-login-v7 .flv7-auth-recovery{display:flex;align-items:center;justify-content:flex-end;gap:10px;flex-wrap:wrap;margin:-2px 2px 12px}'
      +'.familyapp-login-v7 .flv7-auth-recovery button{appearance:none;-webkit-appearance:none;border:0;background:transparent;color:#f0c76f;padding:3px 0;font:inherit;font-size:12px;font-weight:750;line-height:1.25;cursor:pointer;text-decoration:none}'
      +'.familyapp-login-v7 .flv7-auth-recovery button:focus-visible{outline:2px solid #fff5df;outline-offset:3px;border-radius:4px}'
      +'.familyapp-login-v7 .flv7-auth-recovery .flv7-existing-login{color:#f6ead2}'
      +'.familyapp-login-v7 .flv7-recovery-status{margin:-3px 0 11px;padding:10px 12px;border-radius:12px;font-size:12px;line-height:1.4}'
      +'.familyapp-login-v7 .flv7-recovery-status.is-success{display:block;background:rgba(42,130,82,.20);border:1px solid rgba(117,214,151,.28);color:#d8ffe5}'
      +'.familyapp-login-v7 .flv7-recovery-status.is-error{display:block;background:rgba(151,31,22,.21);border:1px solid rgba(255,149,135,.25);color:#ffd7cf}'
      +'.familyapp-login-v7 .flv7-auth-recovery button:disabled{opacity:.55;cursor:default}';
    document.head.appendChild(style);
  }

  function showStatus(message,type){
    var el=byId('flv7-recovery-status');
    if(!el)return;
    el.textContent=message||'';
    el.className='flv7-recovery-status '+(type==='error'?'is-error':'is-success');
    el.hidden=!message;
  }
  function clearStatus(){
    var el=byId('flv7-recovery-status');
    if(el){el.textContent='';el.className='flv7-recovery-status';el.hidden=true;}
  }

  function syncMode(){
    var existing=byId('flv7-existing-login');
    var forgot=byId('flv7-forgot-password');
    if(existing)existing.hidden=!isRegister();
    if(forgot)forgot.textContent=isRegister()?'Wachtwoord herstellen':'Wachtwoord vergeten?';
    clearStatus();
  }

  function requestReset(){
    var emailInput=byId('auth-email');
    var email=clean(emailInput&&emailInput.value);
    var forgot=byId('flv7-forgot-password');
    var a=auth();

    clearStatus();
    if(!email){
      showStatus('Vul eerst het e-mailadres van je account in.','error');
      if(emailInput)emailInput.focus();
      return;
    }
    if(!/^\S+@\S+\.\S+$/.test(email)){
      showStatus('Controleer het e-mailadres en probeer opnieuw.','error');
      if(emailInput)emailInput.focus();
      return;
    }
    if(!a||typeof a.sendPasswordResetEmail!=='function'){
      showStatus('Wachtwoord herstellen is op dit moment niet beschikbaar. Probeer het later opnieuw.','error');
      return;
    }

    if(forgot){forgot.disabled=true;forgot.textContent='Resetmail versturen…';}
    Promise.resolve(a.sendPasswordResetEmail(email)).then(function(){
      // Deliberately generic: do not reveal whether an address exists.
      showStatus('Als dit e-mailadres bij een FamilyApp-account hoort, ontvang je een resetmail. Controleer ook je spammap.','success');
    }).catch(function(error){
      var code=clean(error&&error.code);
      if(code==='auth/user-not-found'){
        showStatus('Als dit e-mailadres bij een FamilyApp-account hoort, ontvang je een resetmail. Controleer ook je spammap.','success');
      }else if(code==='auth/invalid-email'){
        showStatus('Controleer het e-mailadres en probeer opnieuw.','error');
      }else if(code==='auth/too-many-requests'){
        showStatus('Er zijn te veel herstelpogingen gedaan. Wacht even en probeer het later opnieuw.','error');
      }else if(code==='auth/network-request-failed'){
        showStatus('Geen verbinding met de inlogservice. Controleer je internetverbinding en probeer opnieuw.','error');
      }else{
        showStatus('De resetmail kon niet worden verstuurd. Probeer het later opnieuw.','error');
      }
    }).finally(function(){
      if(forgot){forgot.disabled=false;forgot.textContent=isRegister()?'Wachtwoord herstellen':'Wachtwoord vergeten?';}
    });
  }

  function goToLogin(){
    clearStatus();
    if(window.FamilyAppLoginBrandV7&&typeof window.FamilyAppLoginBrandV7.openLogin==='function'){
      window.FamilyAppLoginBrandV7.openLogin();
    }else if(typeof window.showLoginTab==='function'){
      window.showLoginTab('login');
    }else{
      window._loginTab='login';
    }
    window.setTimeout(syncMode,0);
  }

  function improveExistingAuthError(){
    var error=byId('auth-error');
    if(!error||error.style.display==='none')return;
    var value=clean(error.textContent);
    if(/E-mail al in gebruik/i.test(value)){
      error.textContent='Dit e-mailadres heeft al een account. Log in met dat account of herstel je wachtwoord hieronder.';
    }else if(/Verkeerd wachtwoord/i.test(value)){
      error.textContent='Dat wachtwoord klopt niet. Probeer opnieuw of herstel je wachtwoord hieronder.';
    }
  }

  function scheduleErrorAssist(){
    [250,650,1200,2200].forEach(function(delay){window.setTimeout(improveExistingAuthError,delay);});
  }

  function install(){
    ensureStyle();
    var screen=byId('login-screen');
    var form=byId('login-form');
    var error=byId('auth-error');
    if(!screen||!form||!error)return false;

    var row=byId('flv7-auth-recovery');
    if(!row){
      row=document.createElement('div');
      row.id='flv7-auth-recovery';
      row.className='flv7-auth-recovery';
      row.innerHTML='<button type="button" id="flv7-existing-login" class="flv7-existing-login" hidden>Al een account? Inloggen</button><button type="button" id="flv7-forgot-password">Wachtwoord vergeten?</button>';
      form.insertBefore(row,error);

      var status=document.createElement('div');
      status.id='flv7-recovery-status';
      status.className='flv7-recovery-status';
      status.setAttribute('role','status');
      status.setAttribute('aria-live','polite');
      status.hidden=true;
      form.insertBefore(status,error);
    }

    if(screen!==boundScreen){
      boundScreen=screen;
      var forgot=byId('flv7-forgot-password');
      var existing=byId('flv7-existing-login');
      var submit=byId('auth-submit-btn');
      var openLogin=byId('flv7-login');
      var openRegister=byId('flv7-register');
      if(forgot)forgot.addEventListener('click',requestReset);
      if(existing)existing.addEventListener('click',goToLogin);
      if(submit)submit.addEventListener('click',scheduleErrorAssist);
      if(openLogin)openLogin.addEventListener('click',function(){window.setTimeout(syncMode,0);});
      if(openRegister)openRegister.addEventListener('click',function(){window.setTimeout(syncMode,0);});
    }

    syncMode();
    return true;
  }

  function boot(){
    if(install())return;
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){window.setTimeout(install,0);},{once:true});
    else window.setTimeout(install,0);
  }

  window.addEventListener('familyapp:login-brand-ready',function(){window.setTimeout(install,0);});
  window.FamilyAppManualAuthRecoveryV1=Object.freeze({version:VERSION,install:install,requestReset:requestReset});
  boot();
})();
