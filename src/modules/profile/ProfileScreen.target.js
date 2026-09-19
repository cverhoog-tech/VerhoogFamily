import {
  animeAvatarCollection,
  avatarMetaForId,
  avatarUrlForId,
  getCurrentAvatarId,
  getCurrentAvatarUrl,
  getPartnerName,
  getProfileName,
  setProfileNames,
  setPresetAvatar,
  setUploadedAvatar,
} from './avatarStore.js?v=profile2';

const activeCategoryKey = 'familyapp-avatar-category-v1';

function getActiveCategory() {
  return localStorage.getItem(activeCategoryKey) || 'Alle';
}

function setActiveCategory(category) {
  localStorage.setItem(activeCategoryKey, category);
}

function categories() {
  return ['Alle', ...Array.from(new Set(animeAvatarCollection.map((avatar) => avatar.category)))];
}

function escapeAttribute(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function toast(message) {
  let el = document.querySelector('.profile-toast');
  if (!el) {
    el = document.createElement('div');
    el.className = 'profile-toast';
    document.body.appendChild(el);
  }
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(el._timer);
  el._timer = setTimeout(() => el.classList.remove('show'), 1700);
}

function getUiScale() {
  return window.FamilyUiScale ? window.FamilyUiScale.get() : 100;
}

function getInstallState() {
  return window.FamilyAppInstall
    ? window.FamilyAppInstall.getState()
    : { status: 'browser', installed: false, ios: false, canPrompt: false };
}

function getActiveAuthEmail() {
  try {
    const directUser = window.fbAuth && window.fbAuth.currentUser;
    const fallbackAuth = !directUser && window.firebase && firebase.auth ? firebase.auth() : null;
    const user = directUser || (fallbackAuth && fallbackAuth.currentUser) || null;
    return user && user.email ? String(user.email).trim() : '';
  } catch (error) {
    return '';
  }
}

function installCardMarkup(state) {
  if (state.installed) {
    return `
      <section class="profile-card" style="padding:16px">
        <div style="display:flex;align-items:center;gap:12px">
          <img src="/apple-touch-icon.png?v=hq2" alt="FamilyApp" style="width:48px;height:48px;border-radius:12px;flex-shrink:0">
          <div style="flex:1;min-width:0">
            <h2 style="margin:0 0 3px">FamilyApp geïnstalleerd</h2>
            <p style="margin:0;color:var(--c-text2);font-size:12px;line-height:1.45">Je gebruikt FamilyApp al vanaf je beginscherm.</p>
          </div>
          <span style="font-size:18px;color:var(--c-primary);font-weight:900">✓</span>
        </div>
      </section>`;
  }

  const copy = state.ios
    ? 'Zet FamilyApp op je beginscherm voor een app-achtige ervaring zonder browserbalk.'
    : 'Installeer FamilyApp op je telefoon en open hem voortaan direct vanaf je beginscherm.';

  return `
    <section class="profile-card" style="padding:16px">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:13px">
        <img src="/apple-touch-icon.png?v=hq2" alt="FamilyApp" style="width:52px;height:52px;border-radius:13px;flex-shrink:0;box-shadow:0 4px 14px rgba(0,0,0,.10)">
        <div style="min-width:0">
          <h2 style="margin:0 0 4px">FamilyApp op beginscherm</h2>
          <p style="margin:0;color:var(--c-text2);font-size:12px;line-height:1.45">${copy}</p>
        </div>
      </div>
      <button type="button" data-install-familyapp style="width:100%;min-height:44px;border:0;border-radius:13px;background:var(--c-primary);color:#fff;font-size:13px;font-weight:800;padding:11px 14px">${state.ios ? 'Hoe zet ik hem op mijn beginscherm?' : 'Installeer FamilyApp'}</button>
    </section>`;
}

function instructionModalMarkup(state) {
  const shareIcon = `
    <span aria-label="iOS deelknop" style="width:34px;height:34px;border-radius:9px;border:1px solid var(--c-border);background:var(--c-surface2);display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;margin-left:6px;vertical-align:middle">
      <svg width="21" height="21" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 15V3M12 3L8.5 6.5M12 3l3.5 3.5" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M8 9H6.5A2.5 2.5 0 0 0 4 11.5v7A2.5 2.5 0 0 0 6.5 21h11a2.5 2.5 0 0 0 2.5-2.5v-7A2.5 2.5 0 0 0 17.5 9H16" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </span>`;

  const iosSteps = `
    <div style="display:grid;gap:10px;margin-top:14px">
      <div style="display:flex;gap:10px;align-items:flex-start">
        <strong style="width:24px;height:24px;border-radius:50%;background:var(--c-primary-light);color:var(--c-primary);display:flex;align-items:center;justify-content:center;flex-shrink:0">1</strong>
        <span style="line-height:1.5">Tik onderin Safari op de <b>deelknop</b> ${shareIcon}<br><small style="color:var(--c-text2);font-size:11px">Dit is het vierkantje met het pijltje omhoog.</small></span>
      </div>
      <div style="display:flex;gap:10px;align-items:flex-start"><strong style="width:24px;height:24px;border-radius:50%;background:var(--c-primary-light);color:var(--c-primary);display:flex;align-items:center;justify-content:center;flex-shrink:0">2</strong><span>Kies <b>Zet op beginscherm</b>.</span></div>
      <div style="display:flex;gap:10px;align-items:flex-start"><strong style="width:24px;height:24px;border-radius:50%;background:var(--c-primary-light);color:var(--c-primary);display:flex;align-items:center;justify-content:center;flex-shrink:0">3</strong><span>Tik op <b>Voeg toe</b>. Daarna opent FamilyApp als losse app.</span></div>
    </div>`;

  const browserSteps = `
    <p style="margin:12px 0 0;color:var(--c-text2);font-size:13px;line-height:1.55">De automatische installatieprompt is in deze browser nog niet beschikbaar. Open het browsermenu en kies <b>App installeren</b> of <b>Toevoegen aan beginscherm</b>.</p>`;

  return `
    <div class="profile-install-overlay" data-install-overlay style="position:fixed;inset:0;z-index:10020;background:rgba(15,23,42,.42);display:flex;align-items:flex-end;justify-content:center;padding:0">
      <div style="width:100%;max-width:480px;background:var(--c-surface);border-radius:24px 24px 0 0;padding:18px 18px calc(22px + env(safe-area-inset-bottom));box-shadow:0 -12px 40px rgba(0,0,0,.2)">
        <div style="width:42px;height:4px;border-radius:999px;background:var(--c-border);margin:0 auto 16px"></div>
        <div style="display:flex;align-items:center;gap:12px">
          <img src="/apple-touch-icon.png?v=hq2" alt="FamilyApp" style="width:52px;height:52px;border-radius:13px">
          <div><h2 style="margin:0 0 3px;font-size:18px">Zet FamilyApp op je beginscherm</h2><p style="margin:0;color:var(--c-text2);font-size:12px">Eenmalig instellen, daarna open je hem als app.</p></div>
        </div>
        ${state.ios ? iosSteps : browserSteps}
        <button type="button" data-close-install-overlay style="width:100%;margin-top:18px;min-height:44px;border:0;border-radius:13px;background:var(--c-primary);color:#fff;font-size:14px;font-weight:800">Begrepen</button>
      </div>
    </div>`;
}

function showInstallInstructions(state) {
  const existing = document.querySelector('[data-install-overlay]');
  if (existing) existing.remove();
  document.body.insertAdjacentHTML('beforeend', instructionModalMarkup(state));
  const overlay = document.querySelector('[data-install-overlay]');
  const close = overlay && overlay.querySelector('[data-close-install-overlay]');
  if (close) close.onclick = () => overlay.remove();
  if (overlay) overlay.onclick = (event) => { if (event.target === overlay) overlay.remove(); };
}

function bindProfileActions(container) {
  const nameInput = container.querySelector('[data-profile-name]');
  const partnerInput = container.querySelector('[data-partner-name]');
  const fileInput = container.querySelector('.profile-upload-input');

  const saveButton = container.querySelector('[data-save-profile]');
  if (saveButton) {
    saveButton.onclick = () => {
      setProfileNames(nameInput.value.trim(), partnerInput.value.trim());
      renderProfileScreen(container);
      toast('Profiel opgeslagen');
    };
  }

  const logoutButton = container.querySelector('[data-profile-logout]');
  if (logoutButton) {
    logoutButton.onclick = async () => {
      if (!window.FamilySessionActions || typeof window.FamilySessionActions.signOut !== 'function') {
        toast('Uitloggen is tijdelijk niet beschikbaar');
        return;
      }
      logoutButton.disabled = true;
      try {
        await window.FamilySessionActions.signOut();
      } catch (error) {
        logoutButton.disabled = false;
      }
    };
  }

  container.querySelectorAll('[data-ui-scale]').forEach((button) => {
    button.onclick = () => {
      if (!window.FamilyUiScale) return;
      const scale = window.FamilyUiScale.set(button.dataset.uiScale);
      renderProfileScreen(container);
      toast(`UI schaal ingesteld op ${scale}%`);
    };
  });

  const installButton = container.querySelector('[data-install-familyapp]');
  if (installButton) {
    installButton.onclick = async () => {
      const state = getInstallState();
      if (!window.FamilyAppInstall) {
        showInstallInstructions(state);
        return;
      }
      const result = await window.FamilyAppInstall.install();
      if (result.outcome === 'instructions') showInstallInstructions(getInstallState());
      else if (result.outcome === 'accepted') toast('FamilyApp wordt geïnstalleerd');
      else if (result.outcome === 'installed') toast('FamilyApp is al geïnstalleerd');
    };
  }

  const uploadBtn = container.querySelector('[data-upload-avatar]');
  if (uploadBtn) uploadBtn.onclick = () => fileInput.click();

  const cameraBtn = container.querySelector('[data-camera-avatar]');
  if (cameraBtn) cameraBtn.onclick = () => fileInput.click();

  const openAvatarBtn = container.querySelector('[data-open-avatar-popup]');
  if (openAvatarBtn) {
    openAvatarBtn.onclick = () => {
      const popup = container.querySelector('.profile-avatar-popup');
      if (popup) popup.classList.add('show');
    };
  }

  const closeAvatarBtn = container.querySelector('[data-close-avatar-popup]');
  if (closeAvatarBtn) {
    closeAvatarBtn.onclick = () => {
      const popup = container.querySelector('.profile-avatar-popup');
      if (popup) popup.classList.remove('show');
    };
  }

  if (fileInput) {
    fileInput.onchange = (event) => {
      const file = event.target.files && event.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        setUploadedAvatar(reader.result);
        renderProfileScreen(container);
        toast('Avatar bijgewerkt');
      };
      reader.readAsDataURL(file);
    };
  }

  container.querySelectorAll('[data-avatar-category]').forEach((button) => {
    button.onclick = (event) => {
      event.preventDefault();
      event.stopPropagation();
      setActiveCategory(button.dataset.avatarCategory);
      renderProfileScreen(container, { keepAvatarPopupOpen: true });
    };
  });

  container.querySelectorAll('[data-avatar-id]').forEach((button) => {
    button.onclick = (event) => {
      event.preventDefault();
      event.stopPropagation();
      setPresetAvatar(button.dataset.avatarId);
      renderProfileScreen(container, { keepAvatarPopupOpen: true });
      toast('Avatar gekozen');
    };
  });

  container.querySelectorAll('[data-profile-row]').forEach((button) => {
    button.onclick = () => {
      if (button.dataset.profileRow === 'Meldingen') {
        if (typeof window.showScreen === 'function') window.showScreen('notif');
        else toast('Meldingen openen is tijdelijk niet beschikbaar');
        return;
      }
      toast(button.dataset.profileRow + ' openen');
    };
  });
}

function renderAvatarPopup(activeCategory, visibleAvatars, currentAvatarId) {
  return `
    <div class="profile-avatar-popup-inner" role="dialog" aria-modal="true" aria-label="Kies een avatar">
      <button class="profile-avatar-popup-close" data-close-avatar-popup aria-label="Sluiten">✕</button>
      <h3 class="profile-avatar-popup-title">Kies een avatar</h3>
      <div class="profile-avatar-tabs">
        ${categories().map((category) => `<button type="button" class="${category === activeCategory ? 'active' : ''}" data-avatar-category="${category}">${category}</button>`).join('')}
      </div>
      <div class="profile-choice-grid profile-choice-grid-exact">
        ${visibleAvatars.map((item) => {
          const src = avatarUrlForId(item.id);
          const selected = item.id === currentAvatarId ? 'selected' : '';
          const pos = item.objectPosition || '50% 36%';
          return `<button type="button" class="profile-choice profile-choice-exact profile-rarity-${item.rarity} ${selected}" data-avatar-id="${item.id}" aria-pressed="${item.id === currentAvatarId}">
            <img src="${src}" alt="${item.label}" style="object-position:${pos}">
            <span>✓</span>
            <small>${item.label}</small>
          </button>`;
        }).join('')}
      </div>
    </div>
  `;
}

function numberOr(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function profileProgress() {
  const xp = numberOr(window.myXP, numberOr(localStorage.getItem('fam_myxp_v1'), 120));
  let level = 1;
  try {
    if (typeof window.getLevel === 'function') level = numberOr(window.getLevel(xp), 1);
  } catch (error) {}

  let title = '';
  try {
    if (typeof window.getLevelName === 'function') title = String(window.getLevelName(level) || '');
  } catch (error) {}

  const thresholds = Array.isArray(window.LEVEL_XP) ? window.LEVEL_XP : [];
  const previousXp = thresholds.length ? numberOr(thresholds[level - 1], 0) : 0;
  const nextXp = thresholds.length ? numberOr(thresholds[Math.min(level, thresholds.length - 1)], xp + 100) : xp + 100;
  const range = Math.max(1, nextXp - previousXp);
  const progress = Math.max(0, Math.min(100, Math.round(((xp - previousXp) / range) * 100)));
  const remaining = Math.max(0, nextXp - xp);

  return {
    xp,
    level,
    title: title || `Level ${level}`,
    progress,
    remaining,
  };
}

function profileStats() {
  const tasks = Array.isArray(window.taskData)
    ? window.taskData.filter((task) => task && task.done).length
    : null;
  const streak = Array.isArray(window.recurData)
    ? window.recurData.reduce((max, row) => Math.max(max, numberOr(row && row.streak, 0)), 0)
    : null;
  const badges = window.unlockedBadges && typeof window.unlockedBadges === 'object'
    ? Object.keys(window.unlockedBadges).filter((key) => window.unlockedBadges[key]).length
    : null;

  return {
    tasks: tasks == null ? '–' : tasks,
    streak: streak == null ? '–' : streak,
    badges: badges == null ? '–' : badges,
  };
}

export function renderProfileScreen(container, options = {}) {
  const avatar = getCurrentAvatarUrl();
  const avatarId = getCurrentAvatarId();
  const avatarMeta = avatarMetaForId(avatarId);
  const name = getProfileName();
  const partner = getPartnerName();
  const activeEmail = getActiveAuthEmail();
  const activeCategory = getActiveCategory();
  const visibleAvatars = activeCategory === 'Alle'
    ? animeAvatarCollection
    : animeAvatarCollection.filter((item) => item.category === activeCategory);
  const mainObjectPosition = avatarMeta.objectPosition || '50% 36%';
  const uiScale = getUiScale();
  const installState = getInstallState();
  const progress = profileProgress();
  const stats = profileStats();

  const popupHtml = `
    <div class="profile-avatar-popup ${options.keepAvatarPopupOpen ? 'show' : ''}" data-avatar-popup>
      ${renderAvatarPopup(activeCategory, visibleAvatars, avatarId)}
    </div>
  `;

  container.innerHTML = `
    <section class="profile-target">
      <section class="profile-hero-card">
        <div class="profile-hero-top">
          <div class="profile-avatar-wrap">
            <img class="profile-main-avatar" src="${avatar}" alt="${escapeAttribute(name)}" style="object-position:${mainObjectPosition}">
            <button class="profile-camera-btn" type="button" data-camera-avatar aria-label="Avatar wijzigen">📷</button>
          </div>
          <div class="profile-identity-copy">
            <p class="profile-kicker">Jouw profiel</p>
            <h1>${escapeAttribute(name)}</h1>
            <div class="profile-level-pill"><span class="profile-level-dot"></span> Level ${progress.level} · ${escapeAttribute(progress.title)}</div>
          </div>
        </div>

        <div class="profile-progress-panel">
          <div class="profile-progress-head"><span>Voortgang</span><strong>${progress.xp} XP</strong></div>
          <div class="profile-xp-bar" aria-label="${progress.progress}% naar volgend level"><span style="width:${progress.progress}%"></span></div>
          <div class="profile-progress-foot"><span>${progress.progress}% naar level ${progress.level + 1}</span><strong>${progress.remaining} XP te gaan</strong></div>
        </div>

        <div class="profile-stat-grid">
          <div class="profile-stat-item"><span>✓</span><strong>${stats.tasks}</strong><small>Taken klaar</small></div>
          <div class="profile-stat-item"><span>🔥</span><strong>${stats.streak}</strong><small>Max streak</small></div>
          <div class="profile-stat-item"><span>🏅</span><strong>${stats.badges}</strong><small>Badges</small></div>
        </div>
      </section>

      <section class="profile-card profile-names-card">
        <div class="profile-section-head">
          <span class="profile-section-icon">👤</span>
          <div class="profile-section-copy">
            <h2>Persoonlijke gegevens</h2>
            <p>Je naam en gezinsweergave in FamilyApp.</p>
          </div>
        </div>

        <div class="profile-account-row" data-active-auth-email>
          <span class="profile-account-icon" aria-hidden="true">@</span>
          <div class="profile-account-copy">
            <small>Actief account</small>
            <strong>${escapeAttribute(activeEmail || 'E-mailadres niet beschikbaar')}</strong>
          </div>
        </div>

        <div class="profile-fields">
          <div class="profile-field-group">
            <label for="profile-name-input">Mijn naam</label>
            <div class="profile-input-row"><input id="profile-name-input" data-profile-name value="${escapeAttribute(name)}"><span>✎</span></div>
          </div>
          <div class="profile-field-group">
            <label for="profile-partner-input">Partner naam</label>
            <div class="profile-input-row"><input id="profile-partner-input" data-partner-name value="${escapeAttribute(partner)}" placeholder="Optioneel"><span>✎</span></div>
          </div>
        </div>

        <div class="profile-info-note"><span>i</span><div>Je gekozen avatar en naam worden automatisch gebruikt op de plekken waar jij in de app verschijnt.</div></div>
        <button class="profile-save-btn" type="button" data-save-profile>Wijzigingen opslaan</button>
      </section>

      <section class="profile-card profile-avatar-card">
        <div class="profile-section-head">
          <span class="profile-section-icon">✨</span>
          <div class="profile-section-copy">
            <h2>Avatar</h2>
            <p>Maak je profiel herkenbaar voor je gezin.</p>
          </div>
        </div>
        <div class="profile-avatar-current">
          <img src="${avatar}" alt="" style="object-position:${mainObjectPosition}">
          <div><strong>Huidige avatar</strong><small>${escapeAttribute(avatarMeta.label || 'Eigen profielfoto')}</small></div>
        </div>
        <div class="profile-avatar-actions">
          <button type="button" data-open-avatar-popup>✦ Kies avatar</button>
          <button type="button" data-upload-avatar>↑ Upload foto</button>
        </div>
        <input class="profile-upload-input" type="file" accept="image/*" hidden>
      </section>

      ${installCardMarkup(installState)}

      <section class="profile-card">
        <div class="profile-section-head">
          <span class="profile-section-icon">Aa</span>
          <div class="profile-section-copy">
            <h2>UI schaal</h2>
            <p>Pas de grootte van de volledige app aan.</p>
          </div>
          <span class="profile-section-value">${uiScale}%</span>
        </div>
        <div class="profile-scale-grid">
          ${[90,100,110,120].map((scale) => `<button type="button" data-ui-scale="${scale}" class="profile-scale-btn ${scale === uiScale ? 'active' : ''}" aria-pressed="${scale === uiScale}">${scale}%</button>`).join('')}
        </div>
      </section>

      <section class="profile-card profile-settings-card">
        <div class="profile-settings-label">Instellingen</div>
        <button type="button" data-profile-row="Account instellingen">
          <span class="profile-setting-icon">⚙</span>
          <span class="profile-setting-copy"><b>Account instellingen</b><small>Account en aanmeldgegevens</small></span>
          <em>›</em>
        </button>
        <button type="button" data-profile-row="Privacy">
          <span class="profile-setting-icon">⌾</span>
          <span class="profile-setting-copy"><b>Privacy</b><small>Beheer jouw gezinsgegevens</small></span>
          <em>›</em>
        </button>
        <button type="button" data-profile-row="Meldingen">
          <span class="profile-setting-icon">♧</span>
          <span class="profile-setting-copy"><b>Meldingen</b><small>Kies wat je wilt ontvangen</small></span>
          <em>›</em>
        </button>
        <button type="button" class="profile-danger" data-profile-logout>
          <span class="profile-setting-icon">↪</span>
          <span class="profile-setting-copy"><b>Uitloggen</b><small>Uitloggen op dit apparaat</small></span>
          <em>›</em>
        </button>
      </section>
    </section>
    ${popupHtml}
  `;

  const popup = container.querySelector('[data-avatar-popup]');
  if (popup) {
    popup.onclick = (event) => {
      if (event.target === popup) popup.classList.remove('show');
    };
  }

  bindProfileActions(container);
}

window.addEventListener('familyapp:pwa-install-state', () => {
  const container = document.getElementById('screen-profile');
  if (container && container.classList.contains('active')) renderProfileScreen(container);
});
