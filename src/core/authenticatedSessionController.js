'use strict';
(function(){
  if(window.AuthenticatedSessionController)return;

  var state='idle';
  var generation=0;
  var authUnsubscribe=null;
  var listeners=[];
  var cleanup=[];
  var currentUser=null;
  var lastError=null;
  var startedUid=null;
  var bootstrapPromise=null;
  var bootstrapUid=null;

  function emit(){
    var snap=status();
    listeners.slice().forEach(function(fn){try{fn(snap);}catch(e){console.error('[SessionController] listener',e);}});
    try{window.dispatchEvent(new CustomEvent('familyapp:session-state',{detail:snap}));}catch(e){}
  }
  function setState(next,error){state=next;lastError=error||null;emit();}
  function status(){return{state:state,generation:generation,user:currentUser||null,uid:currentUser&&currentUser.uid||null,householdId:window.fbFamilyId||null,error:lastError||null,ready:state==='ready'};}
  function isCurrent(token,user){return token===generation&&currentUser&&user&&currentUser.uid===user.uid;}
  function addCleanup(fn){if(typeof fn==='function')cleanup.push(fn);return fn;}
  function runCleanup(){var fns=cleanup.splice(0);fns.forEach(function(fn){try{fn();}catch(e){console.warn('[SessionController] cleanup',e);}});}
  function assignUser(user){currentUser=user||null;window.fbUser=user||null;try{fbUser=user||null;}catch(e){}}
  function clearBootstrap(work){if(bootstrapPromise===work){bootstrapPromise=null;bootstrapUid=null;}}

  function loginScreen(show){
    var el=document.getElementById('login-screen');
    if(el)el.style.display=show?'flex':'none';
  }
  function resetLoginUi(){
    var s1=document.getElementById('login-step-1'),s2=document.getElementById('login-step-2');
    if(s1)s1.style.display='block';
    if(s2)s2.style.display='none';
  }
  function revealApp(user){
    if(!user||!isCurrent(generation,user))return;
    if(startedUid===user.uid&&window._appStarted){setState('ready');return;}
    window._appStarted=true;startedUid=user.uid;
    var preloginCss=document.getElementById('prelogin-css');if(preloginCss)preloginCss.remove();
    loginScreen(false);
    if(typeof window.renderNav==='function')window.renderNav();
    if(typeof window.showScreen==='function')window.showScreen('home');
    else if(typeof window.renderHome==='function')window.renderHome();
    if(typeof window.startFirebaseSync==='function')window.startFirebaseSync();
    if(window.NotificationStore&&typeof window.NotificationStore.ensureSubscription==='function')window.NotificationStore.ensureSubscription();
    if(typeof window.setupPushNotifications==='function')window.setupPushNotifications();
    setState('ready');
  }
  function showRecoverable(error,user,token){
    if(!isCurrent(token,user))return;
    setState('recoverableError',error);
    loginScreen(true);
    var err=document.getElementById('auth-error');
    if(err){err.textContent='Opstarten mislukt. Controleer je verbinding en probeer opnieuw.';err.style.display='block';}
  }
  function needsSetup(error){
    var code=String(error&&(error.code||error.name)||'');
    var msg=String(error&&error.message||'');
    return /HOUSEHOLD_REQUIRED|HOUSEHOLD_ACCESS_REQUIRED|Geen gezin gevonden|Geen actief gezin/i.test(code+' '+msg);
  }
  function bootstrap(user){
    var uid=user&&user.uid||null;

    // signInWithPopup and onAuthStateChanged can resolve in either order on iOS/PWA.
    // Reuse the same in-flight bootstrap for the same UID so a late observer callback
    // cannot cancel/restart household resolution that was already started by the popup.
    if(uid&&bootstrapPromise&&bootstrapUid===uid&&currentUser&&currentUser.uid===uid){
      assignUser(user);
      return bootstrapPromise;
    }
    if(uid&&startedUid===uid&&window._appStarted&&state==='ready'){
      assignUser(user);
      return Promise.resolve();
    }

    var token=++generation;
    runCleanup();
    assignUser(user);
    if(!user){
      bootstrapPromise=null;bootstrapUid=null;
      startedUid=null;window._appStarted=false;
      try{window.fbFamilyId=null;fbFamilyId=null;}catch(e){}
      resetLoginUi();loginScreen(true);setState('signedOut');return Promise.resolve();
    }
    setState('authResolved');
    setState('resolvingHousehold');

    var work;
    if(typeof window.loadUserFamily!=='function'){
      work=Promise.reject(new Error('Household resolver niet beschikbaar')).catch(function(err){showRecoverable(err,user,token);});
    }else{
      work=Promise.resolve(window.loadUserFamily()).then(function(){
        if(!isCurrent(token,user))return;
        setState('preparingApp');
        revealApp(user);
      }).catch(function(err){
        if(!isCurrent(token,user))return;
        if(needsSetup(err)&&typeof window.showNameSetupStep==='function'){
          setState('awaitingSetup');
          window.showNameSetupStep(user);loginScreen(true);return;
        }
        showRecoverable(err,user,token);
      });
    }
    bootstrapUid=user.uid;
    bootstrapPromise=work;
    work.then(function(){clearBootstrap(work);},function(){clearBootstrap(work);});
    return work;
  }
  function acceptAuthenticatedUser(user){
    if(!user||!user.uid)return Promise.reject(new Error('Authenticated Firebase gebruiker ontbreekt'));
    return bootstrap(user);
  }
  function resume(){
    var user=currentUser||(window.fbAuth&&window.fbAuth.currentUser)||null;
    if(!user)return Promise.resolve();
    return bootstrap(user);
  }
  function retry(){return resume();}
  function subscribe(fn){if(typeof fn!=='function')return function(){};listeners.push(fn);try{fn(status());}catch(e){}return function(){var i=listeners.indexOf(fn);if(i>=0)listeners.splice(i,1);};}
  function whenAuthenticated(){
    if(currentUser&&currentUser.uid)return Promise.resolve(currentUser);
    return new Promise(function(resolve,reject){var timer=setTimeout(function(){off();reject(new Error('Firebase gebruiker is nog niet beschikbaar'));},6000);var off=subscribe(function(s){if(s.user&&s.user.uid){clearTimeout(timer);off();resolve(s.user);}});});
  }
  function start(){
    if(authUnsubscribe)return;
    var auth=window.fbAuth;
    if(!auth&&window.firebase&&firebase.auth){try{auth=firebase.auth();}catch(e){}}
    if(!auth||typeof auth.onAuthStateChanged!=='function'){setState('recoverableError',new Error('Firebase Auth niet beschikbaar'));loginScreen(true);return;}
    setState('initializing');
    authUnsubscribe=auth.onAuthStateChanged(function(user){bootstrap(user);},function(err){setState('recoverableError',err);loginScreen(true);});
  }
  function stop(){generation++;runCleanup();bootstrapPromise=null;bootstrapUid=null;if(authUnsubscribe){try{authUnsubscribe();}catch(e){}authUnsubscribe=null;}currentUser=null;setState('stopped');}

  window.AuthenticatedSessionController={start:start,stop:stop,retry:retry,resume:resume,status:status,subscribe:subscribe,whenAuthenticated:whenAuthenticated,addCleanup:addCleanup,acceptAuthenticatedUser:acceptAuthenticatedUser};
  window.onLoggedIn=function(){return resume();};
  window.useOfflineMode=function(){if(typeof window.showAuthError==='function')window.showAuthError('Offline openen zonder ingelogd account is niet beschikbaar.');};

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
