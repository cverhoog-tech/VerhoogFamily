const avatarUrl = 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80';
const esraAvatar = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80';
const familyPhotoOne = 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=180&q=80';
const familyPhotoTwo = 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&w=180&q=80';
const familyPhotoThree = 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=180&q=80';

function toast(message) {
  let el = document.querySelector('.target-toast');
  if (!el) {
    el = document.createElement('div');
    el.className = 'target-toast';
    document.body.appendChild(el);
  }
  el.textContent = message;
  el.classList.add('show');
  window.clearTimeout(el._timer);
  el._timer = window.setTimeout(() => el.classList.remove('show'), 1800);
}

function openProfile(name) {
  toast('Profiel openen: ' + name);
}

function bindFeedActions(container) {
  container.querySelectorAll('[data-profile]').forEach((el) => {
    el.addEventListener('click', (event) => {
      event.stopPropagation();
      openProfile(el.dataset.profile);
    });
  });

  container.querySelectorAll('[data-filter]').forEach((button) => {
    button.addEventListener('click', () => {
      container.querySelectorAll('[data-filter]').forEach((item) => item.classList.remove('active'));
      button.classList.add('active');
      const filter = button.dataset.filter;
      container.querySelectorAll('[data-feed-type]').forEach((card) => {
        card.hidden = filter !== 'all' && card.dataset.feedType !== filter;
      });
    });
  });

  container.querySelectorAll('[data-action]').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      const action = button.dataset.action;
      const labels = {
        photo: 'Foto toevoegen',
        emoji: 'Emoji kiezen',
        location: 'Locatie delen',
        checklist: 'Checklist maken',
        post: 'Update plaatsen',
        comments: 'Reacties openen',
        likes: 'Likes bekijken',
        menu: 'Meer opties',
        task: 'Taak openen',
        agenda: 'Afspraak openen',
        grocery: 'Boodschappenlijst openen',
        birthday: 'Verjaardag openen',
      };
      toast(labels[action] || 'Actie geopend');
    });
  });

  container.querySelectorAll('.target-card').forEach((card) => {
    card.addEventListener('click', () => {
      toast(card.dataset.label || 'Update openen');
    });
  });
}

export function renderFeedScreen(container) {
  container.innerHTML = [
    '<section class="target-feed">',
    '  <section class="target-feed-summary">',
    '    <h2>Goedemiddag Shane 👋</h2>',
    '    <p>Dit is er vandaag in het gezin</p>',
    '    <div class="target-stat-grid">',
    '      <button class="target-stat" data-action="task"><span class="target-stat-icon green">✓</span><strong>4</strong><small>Taken afgerond</small></button>',
    '      <button class="target-stat" data-action="agenda"><span class="target-stat-icon purple">▣</span><strong>2</strong><small>Afspraken</small></button>',
    '      <button class="target-stat" data-action="grocery"><span class="target-stat-icon orange">▣</span><strong>3</strong><small>Boodschappen</small></button>',
    '      <button class="target-stat" data-action="comments"><span class="target-stat-icon blue">●●</span><strong>5</strong><small>Nieuwe updates</small></button>',
    '    </div>',
    '  </section>',
    '',
    '  <section class="target-composer">',
    '    <button class="target-avatar solid" data-profile="Shane">SK</button>',
    '    <div class="target-input" role="button" data-action="post">Deel iets met het gezin...</div>',
    '    <div class="target-composer-actions">',
    '      <button data-action="photo" aria-label="Foto toevoegen">▧</button><button data-action="emoji" aria-label="Emoji kiezen">☺</button><button data-action="location" aria-label="Locatie delen">⌖</button><button data-action="checklist" aria-label="Checklist maken">☷</button>',
    '      <button class="target-post" data-action="post">Posten</button>',
    '    </div>',
    '  </section>',
    '',
    '  <nav class="target-tabs">',
    '    <button class="active" data-filter="all">⌂ Alle updates</button>',
    '    <button data-filter="task">☑ Taken</button>',
    '    <button data-filter="agenda">▣ Agenda</button>',
    "    <button data-filter=\"photo\">▧ Foto's</button>",
    '    <button data-filter="note">▱ Notities</button>',
    '  </nav>',
    '',
    '  <section class="target-feed-list">',
    '    <article class="target-card task-card" data-feed-type="task" data-label="Taak: Vuilnis buiten zetten">',
    '      <button class="target-type-icon task" data-action="task">✓</button>',
    '      <button class="target-photo-button" data-profile="Shane"><img class="target-user-photo" src="' + avatarUrl + '" alt="Shane"></button>',
    '      <div class="target-card-body">',
    '        <div class="target-card-top"><p><strong>Shane</strong> heeft een taak afgerond</p><button data-action="menu">1u ···</button></div>',
    '        <h3>Vuilnis buiten zetten</h3>',
    '        <div class="target-card-footer"><b>+10 punten</b><button class="target-mini-avatars" data-action="likes"><span></span><span></span><span></span><em>+2</em></button></div>',
    '      </div>',
    '    </article>',
    '',
    '    <article class="target-card agenda-card" data-feed-type="agenda" data-label="Afspraak: Tandarts Emma">',
    '      <button class="target-type-icon agenda" data-action="agenda">▣</button>',
    '      <button class="target-photo-button" data-profile="Esra"><img class="target-user-photo" src="' + esraAvatar + '" alt="Esra"></button>',
    '      <div class="target-card-body">',
    '        <div class="target-card-top"><p><strong>Esra</strong> heeft een afspraak toegevoegd</p><button data-action="menu">2u ···</button></div>',
    '        <button class="target-agenda-pill" data-action="agenda"><strong>▣ Tandarts - Emma</strong><small>Morgen om 14:30</small></button>',
    '      </div>',
    '    </article>',
    '',
    '    <article class="target-card photo-card" data-feed-type="photo" data-label="Foto update van Esra">',
    '      <button class="target-type-icon photo" data-action="photo">▧</button>',
    '      <button class="target-photo-button" data-profile="Esra"><img class="target-user-photo" src="' + esraAvatar + '" alt="Esra"></button>',
    '      <div class="target-card-body">',
    '        <div class="target-card-top"><p><strong>Esra</strong> heeft 3 foto’s toegevoegd</p><button data-action="menu">3u ···</button></div>',
    '        <div class="target-photo-row"><button data-action="photo"><img src="' + familyPhotoOne + '" alt="Foto 1"></button><button data-action="photo"><img src="' + familyPhotoTwo + '" alt="Foto 2"></button><button data-action="photo"><img src="' + familyPhotoThree + '" alt="Foto 3"></button></div>',
    '        <div class="target-reactions"><button data-action="likes">♥ 8</button><button data-action="comments">○ 2</button></div>',
    '      </div>',
    '    </article>',
    '',
    '    <article class="target-card grocery-card" data-feed-type="grocery" data-label="Boodschappenlijst bijgewerkt">',
    '      <button class="target-type-icon grocery" data-action="grocery">▰</button>',
    '      <button class="target-photo-button" data-profile="Lisa"><img class="target-user-photo" src="https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=120&q=80" alt="Lisa"></button>',
    '      <div class="target-card-body">',
    '        <div class="target-card-top"><p><strong>Boodschappenlijst</strong> is bijgewerkt</p><button data-action="menu">5u ···</button></div>',
    '        <button class="target-grocery-pill" data-action="grocery">🥛 Melk &nbsp; 🍌 Bananen &nbsp; 🍞 Brood &nbsp; +2 meer</button>',
    '      </div>',
    '    </article>',
    '',
    '    <article class="target-card birthday-card" data-feed-type="agenda" data-label="Verjaardag Emma">',
    '      <button class="target-type-icon birthday" data-action="birthday">♛</button>',
    '      <button class="target-photo-button" data-profile="Lisa"><img class="target-user-photo" src="https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=120&q=80" alt="Lisa"></button>',
    '      <div class="target-card-body">',
    '        <div class="target-card-top"><p><strong>Verjaardag</strong> morgen</p><button data-action="menu">1d ···</button></div>',
    '        <button class="target-birthday-pill" data-action="birthday"><img src="https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&w=80&q=80" alt="Emma"><div><strong>Emma</strong><small>8 jaar! 🎉</small></div></button>',
    '      </div>',
    '    </article>',
    '  </section>',
    '</section>'
  ].join('');

  bindFeedActions(container);
}
