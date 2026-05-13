const avatarKey = 'familyapp-current-user-avatar-v1';
const nameKey = 'familyapp-profile-name-v1';
const partnerKey = 'familyapp-partner-name-v1';

const avatarChoices = [
  'https://api.dicebear.com/8.x/adventurer/svg?seed=Kirito&backgroundColor=e8f5e3',
  'https://api.dicebear.com/8.x/adventurer/svg?seed=Asuna&backgroundColor=f6f2ff',
  'https://api.dicebear.com/8.x/adventurer/svg?seed=Meliodas&backgroundColor=fff1e4',
  'https://api.dicebear.com/8.x/adventurer/svg?seed=Elizabeth&backgroundColor=ffeef8',
  'https://api.dicebear.com/8.x/adventurer/svg?seed=Sinon&backgroundColor=eaf1ff',
  'https://api.dicebear.com/8.x/adventurer/svg?seed=Leafa&backgroundColor=e8fff1',
  'https://api.dicebear.com/8.x/adventurer/svg?seed=Ban&backgroundColor=f7f7f7',
  'https://api.dicebear.com/8.x/adventurer/svg?seed=King&backgroundColor=f1f5ff',
  'https://api.dicebear.com/8.x/adventurer/svg?seed=Merlin&backgroundColor=f3e8ff',
  'https://api.dicebear.com/8.x/adventurer/svg?seed=Alice&backgroundColor=fff4e8',
  'https://api.dicebear.com/8.x/adventurer/svg?seed=Eugeo&backgroundColor=e8f7ff',
  'https://api.dicebear.com/8.x/adventurer/svg?seed=Yui&backgroundColor=fff0f8',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=160&q=80'
];

function getName() { return localStorage.getItem(nameKey) || 'Shane'; }
function getPartnerName() { return localStorage.getItem(partnerKey) || 'Esra'; }
function getAvatar() { return localStorage.getItem(avatarKey) || avatarChoices[0]; }
function setAvatar(src) { localStorage.setItem(avatarKey, src); }

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
      setAvatar(reader.result);
      renderProfileScreen(container);
      toast('Avatar bijgewerkt');
    };
    reader.readAsDataURL(file);
  };

  container.querySelectorAll('[data-avatar-choice]').forEach((button) => {
    button.onclick = () => {
      setAvatar(button.dataset.avatarChoice);
      renderProfileScreen(container);
      toast('Avatar gekozen');
    };
  });

  container.querySelectorAll('[data-profile-row]').forEach((button) => {
    button.onclick = () => toast(button.dataset.profileRow + ' openen');
  });
}

export function renderProfileScreen(container) {
  const avatar = getAvatar();
  const name = getName();
  const partner = getPartnerName();
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
        <div class="profile-info-note"><span>ⓘ</span> Deze namen zijn zichtbaar voor je gezin.</div>
        <button class="profile-save-btn" data-save-profile>Opslaan</button>
      </section>

      <section class="profile-card profile-avatar-card">
        <h2>Mijn avatar</h2>
        <div class="profile-avatar-actions">
          <button class="active">▧ Kies uit de app</button>
          <button data-upload-avatar>⇧ Upload foto</button>
        </div>
        <input class="profile-upload-input" type="file" accept="image/*" hidden>
        <div class="profile-choice-row">
          ${avatarChoices.map((src) => `<button class="profile-choice ${src === avatar ? 'selected' : ''}" data-avatar-choice="${src}"><img src="${src}" alt="Avatar keuze"><span>✓</span></button>`).join('')}
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
