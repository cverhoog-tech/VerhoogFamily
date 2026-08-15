import {
  animeAvatarCollection,
  avatarMetaForId,
  avatarUrlForId,
  getCurrentAvatarId,
  getCurrentAvatarUrl,
  getPartnerName,
  getProfileName,
  nameKey,
  partnerKey,
  setPresetAvatar,
  setUploadedAvatar,
} from './avatarStore.js';

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

function bindProfileActions(container) {
  const nameInput = container.querySelector('[data-profile-name]');
  const partnerInput = container.querySelector('[data-partner-name]');
  const fileInput = container.querySelector('.profile-upload-input');

  const saveButton = container.querySelector('[data-save-profile]');
  if (saveButton) {
    saveButton.onclick = () => {
      localStorage.setItem(nameKey, nameInput.value.trim() || 'Shane');
      localStorage.setItem(partnerKey, partnerInput.value.trim() || 'Esra');
      renderProfileScreen(container);
      toast('Profiel opgeslagen');
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
    button.onclick = () => toast(button.dataset.profileRow + ' openen');
  });
}

function renderAvatarPopup(activeCategory, visibleAvatars, currentAvatarId) {
  return `
    <div class="profile-avatar-popup-inner">
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
          return `<button type="button" class="profile-choice profile-choice-exact profile-rarity-${item.rarity} ${selected}" data-avatar-id="${item.id}">
            <img src="${src}" alt="${item.label}" style="object-position:${pos}">
            <span>✓</span>
            <small>${item.label}</small>
          </button>`;
        }).join('')}
      </div>
    </div>
  `;
}

export function renderProfileScreen(container, options = {}) {
  const avatar = getCurrentAvatarUrl();
  const avatarId = getCurrentAvatarId();
  const avatarMeta = avatarMetaForId(avatarId);
  const name = getProfileName();
  const partner = getPartnerName();
  const activeCategory = getActiveCategory();
  const visibleAvatars = activeCategory === 'Alle'
    ? animeAvatarCollection
    : animeAvatarCollection.filter((item) => item.category === activeCategory);
  const mainObjectPosition = avatarMeta.objectPosition || '50% 36%';

  const popupHtml = `
    <div class="profile-avatar-popup ${options.keepAvatarPopupOpen ? 'show' : ''}">
      ${renderAvatarPopup(activeCategory, visibleAvatars, avatarId)}
    </div>
  `;

  container.innerHTML = `
    <section class="profile-target">
      <section class="profile-hero-card">
        <div class="profile-avatar-wrap">
          <img class="profile-main-avatar" src="${avatar}" alt="${name}" style="object-position:${mainObjectPosition}">
          <button class="profile-camera-btn" data-camera-avatar aria-label="Avatar wijzigen">📷</button>
        </div>
        <h1>${name}</h1>
        <div class="profile-level-pill">Level 2 · Uitgebroed</div>
        <div class="profile-xp-bar"><span></span></div>
        <p>143 XP</p>
      </section>

      <section class="profile-card profile-names-card">
        <label>Mijn naam</label>
        <div class="profile-input-row"><input data-profile-name value="${name}"><span>✎</span></div>
        <label>Partner naam</label>
        <div class="profile-input-row"><input data-partner-name value="${partner}"><span>✎</span></div>
        <div class="profile-info-note"><span>ⓘ</span> Je gekozen avatar wordt direct gebruikt in feed, reacties en profiel.</div>
        <button class="profile-save-btn" data-save-profile>Opslaan</button>
      </section>

      <section class="profile-card profile-avatar-card">
        <h2>Mijn avatar</h2>
        <div class="profile-avatar-actions">
          <button data-open-avatar-popup>▧ Kies uit de app</button>
          <button data-upload-avatar>⇧ Upload foto</button>
        </div>
        <input class="profile-upload-input" type="file" accept="image/*" hidden>
      </section>

      <section class="profile-card profile-settings-card">
        <button data-profile-row="Account instellingen"><span>♙</span><b>Account instellingen</b><em>›</em></button>
        <button data-profile-row="Privacy"><span>▣</span><b>Privacy</b><em>›</em></button>
        <button data-profile-row="Meldingen"><span>♧</span><b>Meldingen</b><em>›</em></button>
      </section>
    </section>
    ${popupHtml}
  `;
  bindProfileActions(container);
}