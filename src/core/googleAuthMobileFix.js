'use strict';
// ============================================================
// GOOGLE AUTH MOBILE FIX v1
// FamilyApp is hosted on Vercel, not Firebase Hosting. Firebase redirect
// auth can fail on Safari/modern browsers that block third-party storage.
// Use a user-initiated popup flow and add a post-auth recovery watchdog.
// ============================================================
(function(){
  if(window.__familyGoogleAuthMobileFix) return;
  window.__familyGoogleAuthMobileFix = true;

  var GOOGLE_BUTTON_HTML = '<svg width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg> Inloggen met Google';

  function btn(){ return document.getElementById('google-btn'); }
  function setButton(html, disabled){
    var b = btn();
    if(!b) return;
    b.innerHTML = html;
    b.disabled = !!disabled;
  }
  function showError(message){
    if(typeof window.showAuthError === 'function') window.showAuthError(message);
    else {
      var e = document.getElementById('auth-error');
      if(e){ e.textContent = message; e.style.display = 'block'; }
    }
  }
  function clearError(){
    var e = document.getElementById('auth-error');
    if(e){ e.textContent = ''; e.style.display = 'none'; }
  }
  function storeGoogleAvatar(user){
    try {
      if(user && user.photoURL) localStorage.setItem('familyapp-current-user-avatar-v1', user.photoURL);
    } catch(e){}
  }
  function withTimeout(promise, ms){
    return Promise.race([
      promise,
      new Promise(function(_, reject){ setTimeout(function(){ reject(new Error('AUTH_FAMILY_LOAD_TIMEOUT')); }, ms); })
    ]);
  }
  function finishAuthenticatedUser(user){
    if(!user) return Promise.reject(new Error('Geen Google gebruiker ontvangen'));
    window.fbUser = user;
    try { fbUser = user; } catch(e){}
    storeGoogleAvatar(user);

    if(typeof window.loadUserFamily !== 'function') {
      if(typeof window.onLoggedIn === 'function') window.onLoggedIn();
      return Promise.resolve();
    }

    return withTimeout(Promise.resolve(window.loadUserFamily()), 8000)
      .then(function(){
        if(typeof window.onLoggedIn === 'function') window.onLoggedIn();
      })
      .catch(function(err){
        // A missing family is a normal first-login state; the user must see setup,
        // never an endless spinner. A timeout also falls back to setup/recovery UI.
        console.warn('[GoogleAuthFix] family load fallback:', err && err.message);
        if(typeof window.showNameSetupStep === 'function') window.showNameSetupStep(user);
        var login = document.getElementById('login-screen');
        if(login) login.style.display = 'flex';
      });
  }
  function authInstance(){
    try {
      if(typeof fbAuth !== 'undefined' && fbAuth) return fbAuth;
      if(window.firebase && firebase.auth) return firebase.auth();
    } catch(e){}
    return null;
  }

  function installOverride(){
    if(!window.firebase || !firebase.auth) return false;

    window.signInWithGoogle = function(){
      var auth = authInstance();
      if(!auth){ showError('Firebase is nog niet klaar. Probeer het opnieuw.'); return; }

      clearError();
      setButton('⏳ Google openen...', true);
      var provider = new firebase.auth.GoogleAuthProvider();
      provider.addScope('profile');
      provider.addScope('email');
      provider.setCustomParameters({ prompt: 'select_account' });

      var persistence = firebase.auth.Auth && firebase.auth.Auth.Persistence
        ? auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
        : Promise.resolve();

      persistence
        .catch(function(){ /* Safari private mode can reject persistence; auth can still continue. */ })
        .then(function(){ return auth.signInWithPopup(provider); })
        .then(function(result){
          if(!result || !result.user) throw new Error('Google login gaf geen gebruiker terug');
          setButton('✅ Ingelogd', true);
          return finishAuthenticatedUser(result.user);
        })
        .catch(function(err){
          console.error('[GoogleAuthFix] popup login:', err);
          setButton(GOOGLE_BUTTON_HTML, false);
          var code = err && err.code || '';
          if(code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
            showError('Google-login is geannuleerd. Probeer opnieuw.');
          } else if(code === 'auth/popup-blocked') {
            showError('Safari blokkeerde het Google-venster. Sta pop-ups voor deze site toe en probeer opnieuw.');
          } else if(code === 'auth/unauthorized-domain') {
            showError('Dit domein is nog niet toegestaan in Firebase Authentication. Voeg verhoog-family.vercel.app toe aan Authorized domains.');
          } else {
            var msg = (typeof window.translateFbError === 'function') ? window.translateFbError(err) : (err && err.message || 'Google-login mislukt');
            showError(msg + (code ? ' [' + code + ']' : ''));
          }
        });
    };
    window.signInWithGoogle.__familyPopupFix = true;
    return true;
  }

  function recoverExistingSession(){
    var auth = authInstance();
    if(!auth || !auth.currentUser) return;
    var login = document.getElementById('login-screen');
    if(!login || login.style.display === 'none') return;
    finishAuthenticatedUser(auth.currentUser).catch(function(){});
  }

  function boot(){
    var tries = 0;
    var timer = setInterval(function(){
      tries++;
      if(installOverride() || tries > 40){
        clearInterval(timer);
        setTimeout(recoverExistingSession, 250);
        setTimeout(recoverExistingSession, 1200);
      }
    }, 100);
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
  window.addEventListener('load', function(){ setTimeout(installOverride, 0); setTimeout(recoverExistingSession, 400); });
})();
