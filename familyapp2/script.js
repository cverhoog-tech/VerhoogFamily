const quests = [
  {
    type: 'Group Quest',
    title: 'Meal Prep zondag',
    reward: '+250 XP • Teamwork XP',
    action: 'Help',
  },
  {
    type: 'Side Quest',
    title: 'Gele speentje meenemen',
    reward: '+40 XP • Reliability XP',
    action: 'Done',
  },
  {
    type: 'Daily Quest',
    title: 'Badkamer schoonmaken',
    reward: '+120 XP • Cleaning XP',
    action: 'Claim',
  },
];

const activities = [
  'Esra completed Weekly Cleaning +240 XP',
  'Shane accepted Dinner Duty',
  'Household reached Level 8',
  'Budget Quest completed',
];

const app = document.getElementById('app');
const nav = document.getElementById('bottomNav');
const modalBackdrop = document.getElementById('modalBackdrop');
const sheet = document.getElementById('sheet');
const toast = document.getElementById('toast');

function render() {
  app.innerHTML = `
    <header class="topbar">
      <div>
        <div class="badge">Household Lv. 8</div>
      </div>

      <div class="avatar">S</div>
    </header>

    <section class="hero-card">
      <div class="badge">Rested XP Active</div>
      <h1>Level je echte leven samen</h1>
      <p>
        Daily quests, group quests, planning, economy en echte life progression.
      </p>

      <div class="hero-row">
        <div>
          <strong>Player Lv. 12</strong>
        </div>

        <div class="xp-pill">+2x XP</div>
      </div>
    </section>

    <section class="section">
      <div class="section-header">
        <div>
          <h2>Vandaag</h2>
          <span>Daily Hub</span>
        </div>

        <button class="btn btn-secondary" onclick="openQuestModal()">+ Quest</button>
      </div>

      <div class="quest-list">
        ${quests.map((quest, index) => `
          <div class="quest-card">
            <div class="quest-left">
              <div class="quest-type">${quest.type}</div>
              <div class="quest-title">${quest.title}</div>
              <div class="quest-meta">${quest.reward}</div>
            </div>

            <div class="quest-actions">
              <button class="btn btn-primary" onclick="completeQuest(${index})">
                ${quest.action}
              </button>

              <button class="btn btn-secondary" onclick="groupQuest(${index})">
                Group
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    </section>

    <section class="section grid">
      <div class="panel">
        <h3>Economy</h3>
        <div class="badge">€284 over</div>

        <div class="progress-bar">
          <div class="progress"></div>
        </div>

        <p>Boodschappenbudget stabiel.</p>
      </div>

      <div class="panel">
        <h3>Journey</h3>

        <div class="activity-feed">
          <div class="activity-item">Reliability Lv. 14</div>
          <div class="activity-item">Cooking Lv. 8</div>
          <div class="activity-item">Budgeting Lv. 5</div>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="section-header">
        <div>
          <h2>Activity Feed</h2>
          <span>Household Activity</span>
        </div>
      </div>

      <div class="activity-feed">
        ${activities.map(item => `
          <div class="activity-item">${item}</div>
        `).join('')}
      </div>
    </section>
  `;

  nav.innerHTML = `
    <div class="nav-item active">
      <div>🏠</div>
      <span>Vandaag</span>
    </div>

    <div class="nav-item">
      <div>⚔️</div>
      <span>Quests</span>
    </div>

    <div class="nav-item">
      <div>📅</div>
      <span>Planning</span>
    </div>

    <div class="nav-item">
      <div>💰</div>
      <span>Economy</span>
    </div>

    <div class="nav-item">
      <div>✨</div>
      <span>Journey</span>
    </div>
  `;
}

window.completeQuest = function(index) {
  showToast(`${quests[index].title} completed + XP`);
};

window.groupQuest = function(index) {
  showToast(`${quests[index].title} converted to Group Quest`);
};

window.openQuestModal = function() {
  modalBackdrop.classList.remove('hidden');

  sheet.innerHTML = `
    <h2 style="margin-bottom: 18px">Nieuwe Quest</h2>

    <div class="activity-feed">
      <div class="activity-item">⚔️ Side Quest</div>
      <div class="activity-item">👥 Group Quest</div>
      <div class="activity-item">📅 Recurring Quest</div>
      <div class="activity-item">🏆 Main Quest</div>
    </div>

    <button class="btn btn-primary" style="width:100%; margin-top:20px" onclick="closeModal()">
      Sluiten
    </button>
  `;
};

window.closeModal = function() {
  modalBackdrop.classList.add('hidden');
};

function showToast(message) {
  toast.textContent = message;
  toast.classList.remove('hidden');

  setTimeout(() => {
    toast.classList.add('hidden');
  }, 2500);
}

modalBackdrop.addEventListener('click', (e) => {
  if (e.target === modalBackdrop) {
    closeModal();
  }
});

render();