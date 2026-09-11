'use strict';
// FamilyApp Login Brand v6 — presentation + existing auth entrypoints only.
(function(){
  if(window.FamilyAppLoginBrandV6)return;
  var VERSION='6.0.0';
  var screen=null,sheet=null,title=null;

  function providers(){return window.FamilyAppAuthProviders||{};}
  function showError(message){
    if(typeof window.showAuthError==='function'){window.showAuthError(message);return;}
    var err=document.getElementById('auth-error');
    if(err){err.textContent=message;err.style.display='block';}
  }
  function closeSheet(){if(sheet)sheet.classList.remove('is-open');}
  function openSheet(mode){
    var isRegister=mode==='register';
    if(typeof window.showLoginTab==='function')window.showLoginTab(isRegister?'register':'login');
    if(title)title.textContent=isRegister?'Account maken':'Inloggen';
    var copy=sheet&&sheet.querySelector('.flv6-copy');
    if(copy)copy.textContent=isRegister?'Maak je FamilyApp-account aan en verbind daarna je huishouden.':'Log in met je e-mailadres en wachtwoord.';
    if(sheet){sheet.classList.add('is-open');var first=sheet.querySelector(isRegister?'#auth-name':'#auth-email');if(first)setTimeout(function(){try{first.focus({preventScroll:true});}catch(e){try{first.focus();}catch(ignore){}}},0);}
  }
  function google(){
    if(typeof window.signInWithGoogle==='function')window.signInWithGoogle();
    else showError('Google-login is nog niet beschikbaar. Probeer opnieuw.');
  }
  function apple(){
    if(providers().apple===true&&window.FamilyAppAppleAuth&&typeof window.FamilyAppAppleAuth.signIn==='function'){
      window.FamilyAppAppleAuth.signIn();return;
    }
    showError('Apple-login staat visueel klaar, maar is nog niet geactiveerd in Firebase/Apple Developer.');
  }
  function button(cls,label,fn){var b=document.createElement('button');b.type='button';b.className='flv6-hotspot '+cls;b.setAttribute('aria-label',label);b.textContent=label;b.addEventListener('click',fn);return b;}
  function build(){
    screen=document.getElementById('login-screen');if(!screen||screen.dataset.brandV6==='1')return;
    screen.dataset.brandV6='1';screen.classList.add('familyapp-login-v6');
    var legacyStep1=document.getElementById('login-step-1');
    var legacyStep2=document.getElementById('login-step-2');
    if(!legacyStep1)return;

    var visual=document.createElement('img');visual.className='flv6-reference';visual.src='/src/assets/brand/v6/login-reference.jpg?v=6';visual.alt='';visual.setAttribute('aria-hidden','true');visual.decoding='async';visual.fetchPriority='high';
    var actions=document.createElement('div');actions.className='flv6-actions';
    actions.appendChild(button('flv6-login','Inloggen',function(){openSheet('login');}));
    actions.appendChild(button('flv6-register','Account maken',function(){openSheet('register');}));
    actions.appendChild(button('flv6-google','Doorgaan met Google',google));
    actions.appendChild(button('flv6-apple','Doorgaan met Apple',apple));

    sheet=document.createElement('div');sheet.className='flv6-auth-sheet';sheet.setAttribute('role','dialog');sheet.setAttribute('aria-modal','true');sheet.setAttribute('aria-label','FamilyApp account');
    var card=document.createElement('div');card.className='flv6-sheet-card';
    var handle=document.createElement('div');handle.className='flv6-handle';
    var head=document.createElement('div');head.className='flv6-sheet-head';
    title=document.createElement('h2');title.textContent='Inloggen';
    var close=document.createElement('button');close.type='button';close.setAttribute('aria-label','Sluiten');close.textContent='×';close.addEventListener('click',closeSheet);
    head.appendChild(title);head.appendChild(close);
    var copy=document.createElement('p');copy.className='flv6-copy';copy.textContent='Log in met je e-mailadres en wachtwoord.';
    var back=document.createElement('button');back.type='button';back.className='flv6-back';back.textContent='Terug';back.addEventListener('click',closeSheet);

    card.appendChild(handle);card.appendChild(head);card.appendChild(copy);card.appendChild(legacyStep1);card.appendChild(back);sheet.appendChild(card);
    screen.insertBefore(visual,screen.firstChild);screen.insertBefore(actions,visual.nextSibling);screen.insertBefore(sheet,actions.nextSibling);
    if(legacyStep2){legacyStep2.classList.add('flv6-step2');screen.appendChild(legacyStep2);}
    var logo=document.getElementById('login-logo');if(logo)logo.style.display='none';
    Array.prototype.slice.call(screen.children).forEach(function(node){
      if(node===visual||node===actions||node===sheet||node===legacyStep2||node.id==='fb-config-panel-wrap')return;
      if(node.id==='login-card'){
        var step=node.querySelector('#login-step-1');if(step&&step.parentNode===node&&sheet.contains(step))node.style.display='none';
        return;
      }
      if(node.tagName==='DIV'&&node!==legacyStep1&&node!==legacyStep2&&node.id!=='auth-error'){
        var txt=(node.textContent||'').trim();if(txt==='FamilieApp'||txt==='Jouw gezins-app')node.style.display='none';
      }
    });
    sheet.addEventListener('click',function(e){if(e.target===sheet)closeSheet();});
  }
  function boot(){build();}
  window.FamilyAppLoginBrandV6={version:VERSION,boot:boot,openLogin:function(){openSheet('login');},openRegister:function(){openSheet('register');},close:closeSheet};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
