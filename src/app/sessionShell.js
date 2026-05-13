(() => {
  if (window.__familyAppSessionShellV1) return;
  window.__familyAppSessionShellV1 = true;

  const SESSION_KEY = 'familyapp-session-v1';
  const ROOT_ID = 'familyapp-session-shell';

  function readSession() {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      return null;
    }
  }

  function writeOfflineSession() {
    const session = {
      mode: 'offline',
      userName: localStorage.getItem('familyapp-profile-name-v1') || 'Shane',
      familyId: 'local-family',
      createdAt: new Date().toISOString(),
    };

    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    window.dispatchEvent(new CustomEvent('familyapp:session-ready', { detail: { session } }));
    return session;
  }

  function hasSession() {
    const session = readSession();
    return !!(session && session.mode && session.familyId);
  }

  function showApp() {
    document.documentElement.classList.add('familyapp-session-ready');
    document.documentElement.classList.remove('familyapp-session-required');
    const root = document.getElementById(ROOT_ID);
    if (root) root.remove();
  }

  function renderShell() {
    if (hasSession()) {
      showApp();
      return;
    }

    document.documentElement.classList.add('familyapp-session-required');
    document.documentElement.classList.remove('familyapp-session-ready');

    let root = document.getElementById(ROOT_ID);
    if (!root) {
      root = document.createElement('div');
      root.id = ROOT_ID;
      document.body.appendChild(root);
    }

    root.innerHTML = `
      <section class="session-shell-card" aria-label="FamilieApp sessie">
        <div class="session-shell-logo">🏡</div>
        <p class="session-shell-eyebrow">FamilieApp</p>
        <h1>Welkom terug</h1>
        <p class="session-shell-copy">Start lokaal zodat de app stabiel blijft terwijl we de nieuwe gezinslogin bouwen.</p>
        <button class="session-shell-primary" type="button" id="familyapp-offline-session-btn">Offline gebruiken</button>
        <p class="session-shell-note">Deze tijdelijke sessie wordt later vervangen door beveiligde gezinslogin.</p>
      </section>
    `;

    document.getElementById('familyapp-offline-session-btn')?.addEventListener('click', () => {
      writeOfflineSession();
      showApp();
    });
  }

  function preserveSessionOnTaskSave(event) {
    if (!event || !event.key) return;
    if (!/^fam_tasks_v0|^fqsub_/.test(String(event.key))) return;
    if (!hasSession()) writeOfflineSession();
  }

  const originalSetItem = Storage.prototype.setItem;
  Storage.prototype.setItem = function familyAppSessionSafeSetItem(key, value) {
    const result = originalSetItem.apply(this, arguments);
    try {
      if (/^fam_tasks_v0|^fqsub_/.test(String(key || '')) && !hasSession()) {
        writeOfflineSession();
      }
    } catch (error) {}
    return result;
  };

  window.addEventListener('storage', preserveSessionOnTaskSave);
  window.addEventListener('load', renderShell);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) renderShell();
  });
})();
