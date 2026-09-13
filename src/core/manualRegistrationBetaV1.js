'use strict';
// FamilyApp manual registration beta hardening v1.
// Removes the obsolete partner-name requirement from e-mail registration.
// Authentication stays owned by Firebase Auth; household creation/join stays
// owned by FamilyHousehold / AuthenticatedSessionController onboarding.
(function(){
  if(window.FamilyAppManualRegistrationBetaV1)return;

  var VERSION='1.0.0';
  var originalSubmitAuth=typeof window.submitAuth==='function'?window.submitAuth:null;
  var installed=false;

  function byId(id){return document.getElementById(id);}
  function clean(value){return String(value==null?'':value).trim();}
  function auth(){
    try{
      if(window.fbAuth)return window.fbAuth;
      if(typeof fbAuth!=='undefined'&&fbAuth)return fbAuth;
      if(window.firebase&&firebase.auth)return firebase.auth();
    }catch(error){}
    return null;
  }
  function setError(message){
    var el=byId('auth-error');
    if(!el)return;
    el.textContent=message||'';
    el.style.display=message?'block':'none';
  }
  function setBusy(busy){
    var btn=byId('auth-submit-btn');
    if(!btn)return;
    btn.disabled=!!busy;
    btn.textContent=busy?'Account aanmaken…':'Account aanmaken';
  }
  function friendlyError(error){
    var code=clean(error&&error.code);
    if(code==='auth/email-already-in-use')return 'Dit e-mailadres heeft al een account. Kies “Al een account? Inloggen” of herstel je wachtwoord.';
    if(code==='auth/weak-password')return 'Kies een wachtwoord van minimaal 6 tekens.';
    if(code==='auth/invalid-email')return 'Controleer het e-mailadres en probeer opnieuw.';
    if(code==='auth/network-request-failed')return 'Geen verbinding met de inlogservice. Controleer je internetverbinding en probeer opnieuw.';
    if(code==='auth/too-many-requests')return 'Er zijn te veel pogingen gedaan. Wacht even en probeer het later opnieuw.';
    return clean(error&&error.message)||'Account maken is niet gelukt. Probeer opnieuw.';
  }

  function rememberName(user,name){
    try{
      localStorage.setItem('familyapp-profile-name-v1',name);
      // Never carry the obsolete synthetic partner value into a fresh account.
      localStorage.removeItem('familyapp-partner-name-v1');
    }catch(error){}
    if(user&&typeof user.updateProfile==='function'){
      return Promise.resolve(user.updateProfile({displayName:name})).catch(function(){return null;});
    }
    return Promise.resolve(null);
  }

  function continueToHousehold(){
    if(window.AuthenticatedSessionController&&typeof window.AuthenticatedSessionController.resume==='function'){
      return Promise.resolve(window.AuthenticatedSessionController.resume());
    }
    if(window.FamilyHousehold&&typeof window.FamilyHousehold.showOnboarding==='function'){
      window.FamilyHousehold.showOnboarding();
      return Promise.resolve();
    }
    if(typeof window.showHouseholdOnboarding==='function'){
      window.showHouseholdOnboarding();
      return Promise.resolve();
    }
    if(typeof window.loadUserFamily==='function'){
      return Promise.resolve(window.loadUserFamily());
    }
    if(typeof window.onLoggedIn==='function')window.onLoggedIn();
    return Promise.resolve();
  }

  function register(){
    var email=clean((byId('auth-email')||{}).value);
    var pass=clean((byId('auth-password')||{}).value);
    var name=clean((byId('auth-name')||{}).value);
    var a=auth();

    setError('');
    if(!name){setError('Vul jouw naam in.');var n=byId('auth-name');if(n)n.focus();return;}
    if(!email){setError('Vul je e-mailadres in.');var e=byId('auth-email');if(e)e.focus();return;}
    if(!/^\S+@\S+\.\S+$/.test(email)){setError('Controleer het e-mailadres en probeer opnieuw.');return;}
    if(!pass){setError('Kies een wachtwoord.');var p=byId('auth-password');if(p)p.focus();return;}
    if(pass.length<6){setError('Kies een wachtwoord van minimaal 6 tekens.');return;}
    if(!a||typeof a.createUserWithEmailAndPassword!=='function'){
      setError('Account maken is op dit moment niet beschikbaar. Probeer het later opnieuw.');
      return;
    }

    setBusy(true);
    Promise.resolve(a.createUserWithEmailAndPassword(email,pass)).then(function(result){
      var user=result&&result.user;
      if(user)window.fbUser=user;
      return rememberName(user,name).then(function(){return continueToHousehold();});
    }).catch(function(error){
      setError(friendlyError(error));
    }).then(function(){
      setBusy(false);
    });
  }

  function submit(){
    if(window._loginTab==='register')return register();
    if(originalSubmitAuth)return originalSubmitAuth();
    setError('Inloggen is nog niet beschikbaar.');
  }

  function polishRegisterFields(){
    var extra=byId('register-extra');
    if(!extra)return false;
    var partner=byId('auth-partner');
    var partnerLabel=extra.querySelector('label[for="auth-partner"]');
    if(partnerLabel)partnerLabel.remove();
    if(partner)partner.remove();
    if(!byId('flv7-register-household-note')){
      var note=document.createElement('p');
      note.id='flv7-register-household-note';
      note.textContent='Na het aanmaken kies je je huishouden. Gezinsleden nodig je daarna veilig uit.';
      note.style.cssText='margin:-1px 2px 12px;color:#cfc5ae;font-size:11px;line-height:1.45';
      extra.appendChild(note);
    }
    return true;
  }

  function install(){
    if(!originalSubmitAuth&&typeof window.submitAuth==='function')originalSubmitAuth=window.submitAuth;
    if(!polishRegisterFields())return false;
    window.submitAuth=submit;
    installed=true;
    return true;
  }
  function boot(){
    if(install())return;
    window.setTimeout(install,0);
  }

  window.addEventListener('familyapp:login-brand-ready',function(){window.setTimeout(install,0);});
  window.FamilyAppManualRegistrationBetaV1=Object.freeze({version:VERSION,install:install,register:register,isInstalled:function(){return installed;}});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
