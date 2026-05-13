import {
  animeAvatarCollection,
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

  container.querySelector('[data-save-profile]').onclick = () => {
    localStorage.setItem(nameKey, nameInput.value.trim() || 'Shane');
    localStorage.setItem(partnerKey, partnerInput.value.trim() || 'Esra');
    renderProfileScreen(container);
    toast('Profiel opgeslagen');
  };

  container.querySelector('[data-upload-avatar]').onclick = () => fileInput.click();
  container.querySelector('[data-camera-avatar]').onclick = () => fileInput.click();

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

  container.querySelectorAll('[data-avatar-category]').forEach((button) => {
    button.onclick = () => {
      setActiveCategory(button.dataset.avatarCategory);
      renderProfileScreen(container);
    };
  });

  container.querySelectorAll('[data-avatar-id]').forEach((button) => {
    button.onclick = () => {
      setPresetAvatar(button.dataset.avatarId);
      renderProfileScreen(container);
      toast('Avatar gekozen');
    };
  });

  container.querySelectorAll('[data-profile-row]').forEach((button) => {
    button.onclick = () => toast(button.dataset.profileRow + ' openen');
  });
}

export function renderProfileScreen(container) {
  const avatar = getCurrentAvatarUrl();
  const avatarId = getCurrentAvatarId();
  const name = getProfileName();
  const partner = getPartnerName();
  const activeCategory = getActiveCategory();
  const visibleAvatars = activeCategory === 'Alle'
    ? animeAvatarCollection
    : animeAvatarCollection.filter((item) => item.category === activeCategory);

  container.innerHTML = `
    <section class="profile-target">
      <section class="profile-hero-card">
        <div class="profile-avatar-wrap">
          <img class="profile-main-avatar" src="${avatar}" alt="${name}">
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
          <button class="active">▧ Kies uit de app</button>
          <button data-upload-avatar>⇧ Upload foto</button>
        </div>
        <input class="profile-upload-input" type="file" accept="image/*" hidden>
        <div class="profile-avatar-tabs">
          ${categories().map((category) => `<button class="${category === activeCategory ? 'active' : ''}" data-avatar-category="${category}">${category}</button>`).join('')}
        </div>
        <div class="profile-choice-grid">
          ${visibleAvatars.map((item) => {
            const src = avatarUrlForId(item.id);
            return `<button class="profile-choice profile-rarity-${item.rarity} ${item.id === avatarId ? 'selected' : ''}" data-avatar-id="${item.id}"><img src="${src}" alt="${item.label}"><span>✓</span><small>${item.label}</small></button>`;
          }).join('')}
        </div>
      </section>

      <section class="profile-card profile-settings-card">
        <button data-profile-row="Account instellingen"><span>♙</span><b>Account instellingen</b><em>›</em></button>
        <button data-profile-row="Privacy"><span>▣</span><b>Privacy</b><em>›</em></button>
        <button data-profile-row="Meldingen"><span>♧</span><b>Meldingen</b><em>›</em></button>
      </section>

      <section class="profile-card profile-api-card">
        <h3>✨ Google Gemini API key</h3>
        <p>Gratis — geen creditcard nodig.<br>Haal je key op via <strong>aistudio.google.com/apikey</strong></p>
      </section>
    </section>
  `;
  bindProfileActions(container);
}
