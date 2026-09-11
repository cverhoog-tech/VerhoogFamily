'use strict';
// FamilyApp Login Brand v7 — native DOM/CSS surface. No screenshot-as-UI.
(function(){
  if(window.FamilyAppLoginBrandV7)return;
  var VERSION='7.0.0';
  var screen=null,sheet=null,mode='login',messageTimer=null;

  function providers(){return window.FamilyAppAuthProviders||{};}
  function q(sel){return screen?screen.querySelector(sel):null;}
  function setMessage(text){
    var el=q('#flv7-message');
    if(!el)return;
    el.textContent=text||'';
    el.hidden=!text;
    if(messageTimer)clearTimeout(messageTimer);
    if(text)messageTimer=setTimeout(function(){el.hidden=true;el.textContent='';},4200);
  }
  function showError(message){
    var err=q('#auth-error');
    if(err){err.textContent=message||'';err.style.display=message?'block':'none';}
    if(message&&!sheet.classList.contains('is-open'))setMessage(message);
  }
  function logoSvg(){
    return '<svg viewBox="0 0 180 160" role="img" aria-label="FamilyApp">'
      +'<defs><linearGradient id="flv7House" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff9ea"/><stop offset="1" stop-color="#ead7b3"/></linearGradient><radialGradient id="flv7Glow" cx="50%" cy="78%" r="46%"><stop offset="0" stop-color="#fff6c7"/><stop offset=".45" stop-color="#f4c360"/><stop offset="1" stop-color="#b87818"/></radialGradient></defs>'
      +'<path d="M90 10 22 62v71c0 9 7 16 16 16h29v-52c0-18 10-32 23-32s23 14 23 32v52h29c9 0 16-7 16-16V62L90 10Z" fill="url(#flv7House)"/>'
      +'<path d="M90 66c14 0 24 14 24 31v39H66V97c0-17 10-31 24-31Z" fill="url(#flv7Glow)"/>'
      +'<path d="M88 104c-10 8-24 13-33 24-8 9-12 21-13 32 18-16 39-19 52-28 12-8 18-18 16-29-4 8-11 14-22 20 16 5 31 15 46 37-15-32-25-45-46-56Z" fill="#fff8e6" opacity=".98"/>'
      +'</svg>';
  }
  function googleSvg(){
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.4-.18-2.05H12v3.88h5.38a4.6 4.6 0 0 1-2 3.02v2.52h3.24c1.9-1.75 2.98-4.33 2.98-7.37Z"/><path fill="#34A853" d="M12 22c2.7 0 4.98-.9 6.64-2.4l-3.24-2.52c-.9.6-2.05.96-3.4.96-2.6 0-4.8-1.75-5.6-4.11H3.07v2.59A10 10 0 0 0 12 22Z"/><path fill="#FBBC05" d="M6.4 13.93A6 6 0 0 1 6.08 12c0-.67.12-1.32.32-1.93V7.48H3.07A10 10 0 0 0 2 12c0 1.61.39 3.14 1.07 4.52l3.33-2.59Z"/><path fill="#EA4335" d="M12 5.96c1.48 0 2.79.51 3.84 1.5l2.87-2.87A9.65 9.65 0 0 0 12 2a10 10 0 0 0-8.93 5.48l3.33 2.59C7.2 7.71 9.4 5.96 12 5.96Z"/></svg>';
  }
  function featureSvg(kind){
    var map={
      people:'<svg viewBox="0 0 32 32"><circle cx="11" cy="10" r="4"/><circle cx="22" cy="11" r="3.5"/><path d="M4 25c0-5 3-8 7-8s7 3 7 8M17 24c.4-4 2.6-6 5.5-6 3.2 0 5.5 2.5 5.5 6.5"/></svg>',
      places:'<svg viewBox="0 0 32 32"><path d="M6 25 14 9l5 9 3-5 5 12"/><path d="M3 25h26"/></svg>',
      grow:'<svg viewBox="0 0 32 32"><path d="M16 27V14"/><path d="M16 18c-6 0-9-3-9-8 6 0 9 3 9 8ZM16 16c0-6 3-9 9-9 0 6-3 9-9 9Z"/></svg>',
      sun:'<svg viewBox="0 0 32 32"><path d="M5 24h22"/><path d="M9 24a7 7 0 0 1 14 0"/><path d="M16 5v5M5 15l4 2M27 15l-4 2M9 8l3 4M23 8l-3 4"/></svg>'
    };
    return map[kind]||'';
  }
  function nativeMarkup(){
    return ''
      +'<div class="flv7-photo" aria-hidden="true"></div>'
      +'<div class="flv7-shade" aria-hidden="true"></div>'
      +'<main class="flv7-layout">'
      +'<section class="flv7-hero">'
      +'<div class="flv7-brand"><div class="flv7-mark">'+logoSvg()+'</div><div class="flv7-wordmark">FamilyApp</div><div class="flv7-subtitle">SAMEN RUST EN OVERZICHT</div></div>'
      +'<div class="flv7-tagline"><span>EEN</span><span>LICHTERE</span><span>MORGEN</span><span>SAMEN</span><i></i></div>'
      +'</section>'
      +'<section class="flv7-panel" aria-label="Inloggen bij FamilyApp">'
      +'<div id="flv7-message" class="flv7-message" hidden></div>'
      +'<button type="button" id="flv7-login" class="flv7-btn flv7-primary"><span>Inloggen</span><b aria-hidden="true">→</b></button>'
      +'<button type="button" id="flv7-register" class="flv7-btn flv7-secondary">Account maken</button>'
      +'<div class="flv7-divider"><span></span><em>OF</em><span></span></div>'
      +'<button type="button" id="flv7-google" class="flv7-btn flv7-social"><i class="flv7-provider-icon">'+googleSvg()+'</i><span>Doorgaan met Google</span></button>'
      +'<button type="button" id="flv7-apple" class="flv7-btn flv7-social"><i class="flv7-provider-icon flv7-apple-icon"></i><span>Doorgaan met Apple</span></button>'
      +'<div class="flv7-values" aria-label="FamilyApp waarden">'
      +'<div><i>'+featureSvg('people')+'</i><span>MENSEN</span></div>'
      +'<div><i>'+featureSvg('places')+'</i><span>PLEKKEN</span></div>'
      +'<div><i>'+featureSvg('grow')+'</i><span>GROEI</span></div>'
      +'<div><i>'+featureSvg('sun')+'</i><span>LICHTERE<br>MORGENS</span></div>'
      +'</div>'
      +'</section>'
      +'</main>'
      +'<div id="flv7-auth-sheet" class="flv7-auth-sheet" aria-hidden="true">'
      +'<div class="flv7-sheet-backdrop" data-flv7-close="1"></div>'
      +'<section class="flv7-sheet-card" role="dialog" aria-modal="true" aria-labelledby="flv7-sheet-title">'
      +'<div class="flv7-sheet-handle"></div>'
      +'<header><div><p>FAMILYAPP</p><h2 id="flv7-sheet-title">Inloggen</h2></div><button type="button" id="flv7-close" aria-label="Sluiten">×</button></header>'
      +'<p id="flv7-sheet-copy" class="flv7-sheet-copy">Log in met je e-mailadres en wachtwoord.</p>'
      +'<div id="login-step-1" class="flv7-auth-form">'
      +'<div id="login-tabs" hidden></div>'
      +'<div id="login-form">'
      +'<label for="auth-email">E-mailadres</label><input id="auth-email" type="email" autocomplete="email" placeholder="naam@voorbeeld.nl">'
      +'<label for="auth-password">Wachtwoord</label><input id="auth-password" type="password" autocomplete="current-password" placeholder="Wachtwoord">'
      +'<div id="register-extra" class="flv7-register-extra" style="display:none">'
      +'<label for="auth-name">Jouw naam</label><input id="auth-name" autocomplete="name" placeholder="Jouw voornaam">'
      +'<label for="auth-partner">Naam gezinslid</label><input id="auth-partner" placeholder="Bijv. partner of gezinslid">'
      +'</div>'
      +'<div id="auth-error" role="alert"></div>'
      +'<button id="auth-submit-btn" type="button">Inloggen</button>'
      +'</div></div>'
      +'<div id="login-step-2" style="display:none"></div>'
      +'</section></div>';
  }
  function setMode(next){
    mode=next==='register'?'register':'login';
    if(typeof window.showLoginTab==='function')window.showLoginTab(mode);
    else window._loginTab=mode;
    var title=q('#flv7-sheet-title'),copy=q('#flv7-sheet-copy'),pass=q('#auth-password');
    if(title)title.textContent=mode==='register'?'Account maken':'Inloggen';
    if(copy)copy.textContent=mode==='register'?'Maak je FamilyApp-account aan. Daarna stel je je huishouden in.':'Log in met je e-mailadres en wachtwoord.';
    if(pass)pass.setAttribute('autocomplete',mode==='register'?'new-password':'current-password');
  }
  function openSheet(next){
    setMode(next);
    showError('');
    sheet=q('#flv7-auth-sheet');
    if(!sheet)return;
    sheet.classList.add('is-open');sheet.setAttribute('aria-hidden','false');
    document.documentElement.classList.add('familyapp-auth-sheet-open');
    setTimeout(function(){var target=q(mode==='register'?'#auth-name':'#auth-email');if(target)try{target.focus({preventScroll:true});}catch(e){target.focus();}},40);
  }
  function closeSheet(){
    sheet=q('#flv7-auth-sheet');
    if(!sheet)return;
    sheet.classList.remove('is-open');sheet.setAttribute('aria-hidden','true');
    document.documentElement.classList.remove('familyapp-auth-sheet-open');
  }
  function google(){
    showError('');
    if(typeof window.signInWithGoogle==='function')window.signInWithGoogle();
    else setMessage('Google-login is nog niet beschikbaar.');
  }
  function apple(){
    if(providers().apple===true&&window.FamilyAppAppleAuth&&typeof window.FamilyAppAppleAuth.signIn==='function'){
      window.FamilyAppAppleAuth.signIn();return;
    }
    setMessage('Apple-login staat klaar, maar moet nog worden geactiveerd.');
  }
  function submit(){
    if(typeof window.submitAuth==='function')window.submitAuth();
    else showError('Inloggen is nog niet beschikbaar.');
  }
  function bind(){
    q('#flv7-login').addEventListener('click',function(){openSheet('login');});
    q('#flv7-register').addEventListener('click',function(){openSheet('register');});
    q('#flv7-google').addEventListener('click',google);
    q('#flv7-apple').addEventListener('click',apple);
    q('#flv7-close').addEventListener('click',closeSheet);
    q('.flv7-sheet-backdrop').addEventListener('click',closeSheet);
    q('#auth-submit-btn').addEventListener('click',submit);
    q('#login-form').addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();submit();}});
    document.addEventListener('keydown',function(e){if(e.key==='Escape')closeSheet();});
  }
  function build(){
    screen=document.getElementById('login-screen');
    if(!screen||screen.dataset.brandV7==='1')return;
    screen.dataset.brandV7='1';
    screen.removeAttribute('style');
    screen.className='familyapp-login-v7';
    screen.innerHTML=nativeMarkup();
    bind();
    setMode('login');
    window.dispatchEvent(new CustomEvent('familyapp:login-brand-ready',{detail:{version:VERSION}}));
  }
  function boot(){build();}
  window.FamilyAppLoginBrandV7={version:VERSION,boot:boot,openLogin:function(){openSheet('login');},openRegister:function(){openSheet('register');},close:closeSheet};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
