'use strict';
// ============================================================
// FAMILYAPP AUTH SERVICE v1
// Centralized Firebase Authentication facade for email/password,
// Google, Apple and Microsoft. Firebase UID remains canonical identity.
// ============================================================
(function () {
  if (window.FamilyAuth) return;

  var PENDING_LINK_KEY = 'familyapp-pending-auth-link-v1';
  var PROVIDER_LABELS = {
    'password': 'e-mail en wachtwoord',
    'google.com': 'Google',
    'apple.com': 'Apple',
    'microsoft.com': 'Microsoft'
  };

  function auth() {
    return window.fbAuth || (window.firebase && firebase.auth ? firebase.auth() : null);
  }

  function clearError() {
    var el = document.getElementById('auth-error');
    if (el) { el.textContent = ''; el.style.display = 'none'; }
  }

  function showError(message) {
    var el = document.getElementById('auth-error');
    if (el) { el.textContent = message; el.style.display = 'block'; }
    else console.error('[FamilyAuth]', message);
  }

  function translateError(error) {
    var code = error && error.code;
    var messages = {
      'auth/user-not-found': 'Geen account gevonden met dit e-mailadres.',
      'auth/wrong-password': 'Het wachtwoord is onjuist.',
      'auth/invalid-login-credentials': 'E-mailadres of wachtwoord is onjuist.',
      'auth/email-already-in-use': 'Er bestaat al een account met dit e-mailadres. Log in en koppel daarna een andere aanmeldmethode.',
      'auth/weak-password': 'Gebruik een wachtwoord van minimaal 6 tekens.',
      'auth/invalid-email': 'Vul een geldig e-mailadres in.',
      'auth/network-request-failed': 'Geen internetverbinding. Controleer je verbinding en probeer opnieuw.',
      'auth/operation-not-allowed': 'Deze aanmeldmethode is nog niet geactiveerd voor FamilyApp.',
      'auth/popup-closed-by-user': 'Het aanmeldvenster is gesloten voordat het inloggen klaar was.',
      'auth/cancelled-popup-request': 'Er staat al een aanmeldvenster open.',
      'auth/popup-blocked': 'De browser heeft het aanmeldvenster geblokkeerd. Sta pop-ups toe en probeer opnieuw.',
      'auth/unauthorized-domain': 'Dit domein is nog niet toegestaan voor aanmelden in Firebase.',
      'auth/account-exists-with-different-credential': 'Er bestaat al een FamilyApp-account met dit e-mailadres via een andere aanmeldmethode.'
    };
    return messages[code] || 'Aanmelden is niet gelukt. Probeer het opnieuw.';
  }

  function setButtonBusy(button, busy, idleHtml) {
    if (!button) return;
    if (busy) {
      if (!button.dataset.idleHtml) button.dataset.idleHtml = button.innerHTML;
      button.innerHTML = '<span aria-hidden="true">⏳</span> Bezig...';
      button.disabled = true;
    } else {
      button.innerHTML = idleHtml || button.dataset.idleHtml || button.innerHTML;
      button.disabled = false;
    }
  }

  function isMobile() {
    return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent || '');
  }

  function providerFor(id) {
    if (!window.firebase || !firebase.auth) throw new Error('Firebase Auth is niet geladen');
    if (id === 'google.com') {
      var google = new firebase.auth.GoogleAuthProvider();
      google.addScope('profile');
      google.addScope('email');
      return google;
    }
    var provider = new firebase.auth.OAuthProvider(id);
    if (id === 'microsoft.com') {
      provider.addScope('openid');
      provider.addScope('profile');
      provider.addScope('email');
      provider.setCustomParameters({ prompt: 'select_account' });
    }
    if (id === 'apple.com') {
      provider.addScope('email');
      provider.addScope('name');
    }
    return provider;
  }

  function providerIdsForUser(user) {
    return (user && user.providerData || []).map(function (p) { return p && p.providerId; }).filter(Boolean);
  }

  function persistPendingLink(error) {
    try {
      if (!error || !error.credential) return;
      window.__familyAuthPendingCredential = error.credential;
      sessionStorage.setItem(PENDING_LINK_KEY, JSON.stringify({
        providerId: error.credential.providerId || '',
        email: error.email || '',
        createdAt: Date.now()
      }));
    } catch (e) {}
  }

  function clearPendingLink() {
    window.__familyAuthPendingCredential = null;
    try { sessionStorage.removeItem(PENDING_LINK_KEY); } catch (e) {}
  }

  function linkPendingCredential(user) {
    var credential = window.__familyAuthPendingCredential;
    if (!credential || !user || !user.linkWithCredential) return Promise.resolve(user);
    return user.linkWithCredential(credential).then(function () {
      clearPendingLink();
      return user;
    }).catch(function (error) {
      if (error && error.code === 'auth/provider-already-linked') {
        clearPendingLink();
        return user;
      }
      throw error;
    });
  }

  function routeAuthenticatedUser(user) {
    window.fbUser = user;
    return linkPendingCredential(user).then(function () {
      if (typeof window.loadUserFamily !== 'function') {
        if (typeof window.onLoggedIn === 'function') window.onLoggedIn();
        return;
      }
      return window.loadUserFamily().then(function () {
        if (typeof window.onLoggedIn === 'function') window.onLoggedIn();
      }).catch(function () {
        if (typeof window.showNameSetupStep === 'function') window.showNameSetupStep(user);
      });
    });
  }

  function handleDifferentCredential(error) {
    persistPendingLink(error);
    var a = auth();
    if (!a || !error || !error.email || !a.fetchSignInMethodsForEmail) {
      showError(translateError(error));
      return Promise.reject(error);
    }
    return a.fetchSignInMethodsForEmail(error.email).then(function (methods) {
      var method = methods && methods[0];
      var label = PROVIDER_LABELS[method] || 'je bestaande aanmeldmethode';
      showError('Dit e-mailadres hoort al bij een FamilyApp-account. Log eerst in met ' + label + '; daarna kunnen de accounts veilig worden gekoppeld.');
      return Promise.reject(error);
    });
  }

  function signInProvider(providerId, buttonId) {
    clearError();
    var a = auth();
    if (!a) { showError('Firebase is nog niet beschikbaar.'); return Promise.reject(new Error('auth unavailable')); }
    var button = document.getElementById(buttonId);
    setButtonBusy(button, true);
    var provider;
    try { provider = providerFor(providerId); }
    catch (e) { setButtonBusy(button, false); showError(e.message); return Promise.reject(e); }

    if (isMobile()) {
      return a.signInWithRedirect(provider).catch(function (error) {
        setButtonBusy(button, false);
        if (error && error.code === 'auth/account-exists-with-different-credential') return handleDifferentCredential(error);
        showError(translateError(error));
        throw error;
      });
    }

    return a.signInWithPopup(provider).then(function (result) {
      setButtonBusy(button, false);
      return routeAuthenticatedUser(result.user);
    }).catch(function (error) {
      setButtonBusy(button, false);
      if (error && error.code === 'auth/account-exists-with-different-credential') return handleDifferentCredential(error);
      showError(translateError(error));
      throw error;
    });
  }

  function bootstrapNewFamily(user, name, partner) {
    if (!window.fbDb || !user || !user.uid) return Promise.reject(new Error('Firebase database niet beschikbaar'));
    var uid = user.uid;
    var now = Date.now();
    var updates = {};
    updates['users/' + uid] = {
      familyId: uid,
      name: name,
      partner: partner,
      email: user.email || null,
      createdAt: now,
      authProviders: providerIdsForUser(user)
    };
    updates['families/' + uid + '/meta'] = {
      ownerUid: uid,
      createdAt: now,
      schemaVersion: 1
    };
    updates['families/' + uid + '/members/' + uid] = {
      name: name,
      color: '#2d5a27',
      partner: partner,
      xp: 0,
      joined: now,
      role: 'owner'
    };

    window.fbFamilyId = uid;
    window.myName = name;
    window.partnerName = partner;
    window.myInitials = name.substring(0, 2).toUpperCase();

    return window.fbDb.ref().update(updates).then(function () {
      try {
        localStorage.setItem('familyapp-profile-name-v1', name);
        localStorage.setItem('familyapp-partner-name-v1', partner);
      } catch (e) {}
    });
  }

  function submitEmail() {
    clearError();
    var a = auth();
    var email = ((document.getElementById('auth-email') || {}).value || '').trim();
    var pass = ((document.getElementById('auth-password') || {}).value || '').trim();
    var button = document.getElementById('auth-submit-btn');
    var isRegister = window._loginTab === 'register';
    var idle = isRegister ? 'Account aanmaken' : 'Inloggen';

    if (!email || !pass) { showError('Vul e-mail en wachtwoord in.'); return Promise.resolve(); }
    if (!a) { showError('Firebase is nog niet beschikbaar.'); return Promise.resolve(); }

    if (isRegister) {
      var name = ((document.getElementById('auth-name') || {}).value || '').trim();
      var partner = ((document.getElementById('auth-partner') || {}).value || '').trim();
      if (!name || !partner) { showError('Vul ook jouw naam en partnernaam in.'); return Promise.resolve(); }
      setButtonBusy(button, true);
      return a.createUserWithEmailAndPassword(email, pass)
        .then(function (result) {
          window.fbUser = result.user;
          return result.user.updateProfile({ displayName: name }).then(function () { return result.user; });
        })
        .then(function (user) { return bootstrapNewFamily(user, name, partner).then(function () { return user; }); })
        .then(function () {
          setButtonBusy(button, false, idle);
          if (typeof window.onLoggedIn === 'function') window.onLoggedIn();
        })
        .catch(function (error) {
          setButtonBusy(button, false, idle);
          showError(translateError(error));
        });
    }

    setButtonBusy(button, true);
    return a.signInWithEmailAndPassword(email, pass)
      .then(function (result) { return routeAuthenticatedUser(result.user); })
      .then(function () { setButtonBusy(button, false, idle); })
      .catch(function (error) {
        setButtonBusy(button, false, idle);
        showError(translateError(error));
      });
  }

  function finishSetup() {
    clearError();
    var name = ((document.getElementById('step2-name') || {}).value || '').trim();
    var partner = ((document.getElementById('step2-partner') || {}).value || '').trim();
    var error = document.getElementById('step2-error');
    if (!name) { if (error) { error.textContent = 'Vul jouw naam in.'; error.style.display = 'block'; } return; }
    if (!partner) { if (error) { error.textContent = 'Vul de naam van je partner in.'; error.style.display = 'block'; } return; }
    if (!window.fbUser) { if (error) { error.textContent = 'Aanmeldsessie ontbreekt. Log opnieuw in.'; error.style.display = 'block'; } return; }

    var button = document.querySelector('#login-step-2 button');
    setButtonBusy(button, true);
    window.fbUser.updateProfile({ displayName: name }).catch(function () {}).then(function () {
      return bootstrapNewFamily(window.fbUser, name, partner);
    }).then(function () {
      setButtonBusy(button, false);
      if (typeof window.onLoggedIn === 'function') window.onLoggedIn();
    }).catch(function (e) {
      setButtonBusy(button, false);
      if (error) { error.textContent = 'Account instellen is niet gelukt. Probeer opnieuw.'; error.style.display = 'block'; }
    });
  }

  function injectProviderButtons() {
    var google = document.getElementById('google-btn');
    if (!google || document.getElementById('apple-btn')) return;
    google.style.marginBottom = '10px';

    var apple = document.createElement('button');
    apple.id = 'apple-btn';
    apple.type = 'button';
    apple.setAttribute('aria-label', 'Doorgaan met Apple');
    apple.style.cssText = 'width:100%;background:#000;color:#fff;border:1.5px solid #000;border-radius:12px;padding:13px 16px;font-size:15px;font-weight:650;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:10px;margin-bottom:10px;min-height:48px';
    apple.innerHTML = '<span aria-hidden="true" style="font-size:22px;line-height:18px"></span><span>Doorgaan met Apple</span>';
    apple.onclick = function () { signInProvider('apple.com', 'apple-btn'); };

    var microsoft = document.createElement('button');
    microsoft.id = 'microsoft-btn';
    microsoft.type = 'button';
    microsoft.setAttribute('aria-label', 'Doorgaan met Microsoft');
    microsoft.style.cssText = 'width:100%;background:#fff;color:#1f1f1f;border:1.5px solid #dadce0;border-radius:12px;padding:13px 16px;font-size:15px;font-weight:650;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:10px;margin-bottom:14px;min-height:48px;box-shadow:0 1px 4px rgba(0,0,0,.08)';
    microsoft.innerHTML = '<span aria-hidden="true" style="display:grid;grid-template-columns:8px 8px;grid-template-rows:8px 8px;gap:2px"><i style="background:#f25022"></i><i style="background:#7fba00"></i><i style="background:#00a4ef"></i><i style="background:#ffb900"></i></span><span>Doorgaan met Microsoft</span>';
    microsoft.onclick = function () { signInProvider('microsoft.com', 'microsoft-btn'); };

    google.insertAdjacentElement('afterend', microsoft);
    google.insertAdjacentElement('afterend', apple);
  }

  var previousShowLoginTab = window.showLoginTab;
  window.showLoginTab = function (tab) {
    window._loginTab = tab;
    window.loginTab = tab;
    if (typeof previousShowLoginTab === 'function') previousShowLoginTab(tab);
  };

  window.submitAuth = submitEmail;
  window.signInWithGoogle = function () { return signInProvider('google.com', 'google-btn'); };
  window.signInWithApple = function () { return signInProvider('apple.com', 'apple-btn'); };
  window.signInWithMicrosoft = function () { return signInProvider('microsoft.com', 'microsoft-btn'); };
  window.finishGoogleSetup = finishSetup;
  window.completeSetup = finishSetup;
  window.translateFbError = translateError;
  window.showAuthError = showError;

  window.FamilyAuth = {
    version: '1.0.0',
    submitEmail: submitEmail,
    signInProvider: signInProvider,
    bootstrapNewFamily: bootstrapNewFamily,
    translateError: translateError
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', injectProviderButtons);
  else injectProviderButtons();
})();
