const defaultAvatar = 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80';
const esraAvatar = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80';
const lisaAvatar = 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=120&q=80';
const familyPhotoOne = 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=180&q=80';
const familyPhotoTwo = 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&w=180&q=80';
const familyPhotoThree = 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=180&q=80';
const storageKey = 'familyapp-premium-feed-posts-v1';
const avatarKey = 'familyapp-current-user-avatar-v1';

function getOwnAvatar() {
  return localStorage.getItem(avatarKey) || defaultAvatar;
}

function getSavedPosts() {
  try {
    return JSON.parse(localStorage.getItem(storageKey) || '[]');
  } catch (error) {
    return [];
  }
}

function savePosts(posts) {
  localStorage.setItem(storageKey, JSON.stringify(posts));
}

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

function navigateLegacy(label) {
  const buttons = Array.from(document.querySelectorAll('button, .nav-btn, [role="button"]'));
  const target = buttons.find((button) => (button.textContent || '').toLowerCase().includes(label));
  if (target) {
    target.click();
    return;
  }
  toast('Module openen: ' + label);
}

function makeUserPostHtml(post) {
  const media = post.image ? '<img class="target-upload-image" src="' + post.image + '" alt="Geupload">' : '';
  const gif = post.gif ? '<img class="target-upload-image" src="' + post.gif + '" alt="GIF">' : '';
  const comments = (post.comments || []).map((comment) => '<div class="target-comment"><strong>SK</strong> ' + comment + '</div>').join('');
  return [
    '<article class="target-card user-post-card" data-feed-type="note" data-post-id="' + post.id + '" data-label="Eigen update">',
    '  <button class="target-type-icon note" data-action="note">✎</button>',
    '  <button class="target-photo-button" data-profile="Shane"><img class="target-user-photo" src="' + post.avatar + '" alt="Shane"></button>',
    '  <div class="target-card-body">',
    '    <div class="target-card-top"><p><strong>Shane</strong> plaatste een update</p><button data-action="menu">nu ···</button></div>',
    '    <p class="target-post-text">' + post.text + '</p>',
    media,
    gif,
    '    <div class="target-reactions"><button data-like-post="' + post.id + '">♥ ' + (post.likes || 0) + '</button><button data-comment-post="' + post.id + '">○ ' + (post.comments || []).length + '</button></div>',
    '    <div class="target-comments">' + comments + '</div>',
    '  </div>',
    '</article>',
  ].join('');
}

function renderSavedPosts(container) {
  const list = container.querySelector('.target-feed-list');
  if (!list) return;
  const posts = getSavedPosts();
  list.querySelectorAll('.user-post-card').forEach((node) => node.remove());
  list.insertAdjacentHTML('afterbegin', posts.map(makeUserPostHtml).join(''));
}

function addEmoji(container, emoji) {
  const input = container.querySelector('.target-input-field');
  input.value = (input.value || '') + emoji;
  input.focus();
}

function publishPost(container) {
  const input = container.querySelector('.target-input-field');
  const imageInput = container.querySelector('.target-photo-input');
  const text = (input.value || '').trim();
  const pendingImage = imageInput.dataset.preview || '';
  const pendingGif = input.dataset.gif || '';

  if (!text && !pendingImage && !pendingGif) {
    toast('Schrijf eerst iets of voeg media toe');
    return;
  }

  const posts = getSavedPosts();
  posts.unshift({
    id: 'post-' + Date.now(),
    text: text || 'Nieuwe update',
    image: pendingImage,
    gif: pendingGif,
    avatar: getOwnAvatar(),
    likes: 0,
    comments: [],
  });
  savePosts(posts);
  input.value = '';
  input.dataset.gif = '';
  imageInput.value = '';
  imageInput.dataset.preview = '';
  const preview = container.querySelector('.target-media-preview');
  if (preview) preview.innerHTML = '';
  renderSavedPosts(container);
  bindDynamicPostActions(container);
  toast('Update geplaatst');
}

function bindDynamicPostActions(container) {
  container.querySelectorAll('[data-like-post]').forEach((button) => {
    button.onclick = (event) => {
      event.stopPropagation();
      const posts = getSavedPosts();
      const post = posts.find((item) => item.id === button.dataset.likePost);
      if (post) post.likes = (post.likes || 0) + 1;
      savePosts(posts);
      renderSavedPosts(container);
      bindDynamicPostActions(container);
    };
  });

  container.querySelectorAll('[data-comment-post]').forEach((button) => {
    button.onclick = (event) => {
      event.stopPropagation();
      const text = prompt('Plaats een reactie');
      if (!text) return;
      const posts = getSavedPosts();
      const post = posts.find((item) => item.id === button.dataset.commentPost);
      if (post) post.comments = [...(post.comments || []), text];
      savePosts(posts);
      renderSavedPosts(container);
      bindDynamicPostActions(container);
    };
  });
}

function bindFeedActions(container) {
  container.querySelectorAll('[data-profile]').forEach((el) => {
    el.onclick = (event) => {
      event.stopPropagation();
      openProfile(el.dataset.profile);
    };
  });

  container.querySelectorAll('[data-route]').forEach((button) => {
    button.onclick = (event) => {
      event.stopPropagation();
      navigateLegacy(button.dataset.route);
    };
  });

  container.querySelectorAll('[data-filter]').forEach((button) => {
    button.onclick = () => {
      container.querySelectorAll('[data-filter]').forEach((item) => item.classList.remove('active'));
      button.classList.add('active');
      const filter = button.dataset.filter;
      container.querySelectorAll('[data-feed-type]').forEach((card) => {
        card.hidden = filter !== 'all' && card.dataset.feedType !== filter;
      });
    };
  });

  container.querySelector('[data-action="photo"]').onclick = (event) => {
    event.stopPropagation();
    container.querySelector('.target-photo-input').click();
  };

  container.querySelector('[data-action="avatar-upload"]').onclick = (event) => {
    event.stopPropagation();
    container.querySelector('.target-avatar-input').click();
  };

  container.querySelector('[data-action="emoji"]').onclick = (event) => {
    event.stopPropagation();
    addEmoji(container, '😊');
  };

  container.querySelector('[data-action="gif"]').onclick = (event) => {
    event.stopPropagation();
    const input = container.querySelector('.target-input-field');
    input.dataset.gif = 'https://media.giphy.com/media/111ebonMs90YLu/giphy.gif';
    container.querySelector('.target-media-preview').innerHTML = '<img src="' + input.dataset.gif + '" alt="GIF">';
    toast('GIF toegevoegd');
  };

  container.querySelector('[data-action="post"]').onclick = (event) => {
    event.stopPropagation();
    publishPost(container);
  };

  container.querySelector('.target-photo-input').onchange = (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      event.target.dataset.preview = reader.result;
      container.querySelector('.target-media-preview').innerHTML = '<img src="' + reader.result + '" alt="Preview">';
    };
    reader.readAsDataURL(file);
  };

  container.querySelector('.target-avatar-input').onchange = (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      localStorage.setItem(avatarKey, reader.result);
      container.querySelectorAll('.target-own-avatar-img').forEach((img) => img.src = reader.result);
      toast('Profielfoto opgeslagen');
    };
    reader.readAsDataURL(file);
  };

  container.querySelectorAll('[data-comment-static]').forEach((button) => {
    button.onclick = (event) => {
      event.stopPropagation();
      const text = prompt('Plaats een reactie');
      if (text) toast('Reactie geplaatst');
    };
  });

  container.querySelectorAll('[data-like-static]').forEach((button) => {
    button.onclick = (event) => {
      event.stopPropagation();
      const count = parseInt(button.dataset.count || '0', 10) + 1;
      button.dataset.count = String(count);
      button.textContent = '♥ ' + count;
    };
  });

  container.querySelectorAll('.target-card').forEach((card) => {
    card.onclick = () => toast(card.dataset.label || 'Update openen');
  });

  bindDynamicPostActions(container);
}

export function renderFeedScreen(container) {
  const ownAvatar = getOwnAvatar();
  container.innerHTML = [
    '<section class="target-feed">',
    '  <section class="target-feed-summary">',
    '    <h2>Goedemiddag Shane 👋</h2>',
    '    <p>Dit is er vandaag in het gezin</p>',
    '    <div class="target-stat-grid">',
    '      <button class="target-stat" data-route="taken"><span class="target-stat-icon green">✓</span><strong>4</strong><small>Taken afgerond</small></button>',
    '      <button class="target-stat" data-route="agenda"><span class="target-stat-icon purple">▣</span><strong>2</strong><small>Afspraken</small></button>',
    '      <button class="target-stat" data-route="boodschappen"><span class="target-stat-icon orange">▣</span><strong>3</strong><small>Boodschappen</small></button>',
    '      <button class="target-stat" data-filter="all"><span class="target-stat-icon blue">●●</span><strong>5</strong><small>Nieuwe updates</small></button>',
    '    </div>',
    '  </section>',
    '  <section class="target-composer">',
    '    <button class="target-avatar solid" data-action="avatar-upload"><img class="target-own-avatar-img" src="' + ownAvatar + '" alt="Jouw foto"></button>',
    '    <textarea class="target-input-field" placeholder="Deel iets met het gezin..."></textarea>',
    '    <div class="target-media-preview"></div>',
    '    <input class="target-photo-input" type="file" accept="image/*" hidden>',
    '    <input class="target-avatar-input" type="file" accept="image/*" hidden>',
    '    <div class="target-composer-actions">',
    '      <button data-action="photo" aria-label="Foto toevoegen">▧</button><button data-action="emoji" aria-label="Emoji kiezen">😊</button><button data-action="gif" aria-label="GIF toevoegen">GIF</button><button data-action="post" aria-label="Post plaatsen">☷</button>',
    '      <button class="target-post" data-action="post">Posten</button>',
    '    </div>',
    '  </section>',
    '  <nav class="target-tabs">',
    '    <button class="active" data-filter="all">⌂ Alle updates</button>',
    '    <button data-filter="task">☑ Taken</button>',
    '    <button data-filter="agenda">▣ Agenda</button>',
    "    <button data-filter=\"photo\">▧ Foto's</button>",
    '    <button data-filter="note">▱ Notities</button>',
    '  </nav>',
    '  <section class="target-feed-list">',
    '    <article class="target-card task-card" data-feed-type="task" data-label="Taak: Vuilnis buiten zetten">',
    '      <button class="target-type-icon task" data-route="taken">✓</button>',
    '      <button class="target-photo-button" data-profile="Shane"><img class="target-user-photo" src="' + defaultAvatar + '" alt="Shane"></button>',
    '      <div class="target-card-body"><div class="target-card-top"><p><strong>Shane</strong> heeft een taak afgerond</p><button>1u ···</button></div><h3>Vuilnis buiten zetten</h3><div class="target-card-footer"><b>+10 punten</b><button class="target-mini-avatars" data-like-static data-count="2"><span></span><span></span><span></span><em>+2</em></button></div><div class="target-reactions"><button data-like-static data-count="8">♥ 8</button><button data-comment-static>○ Reageer</button></div></div>',
    '    </article>',
    '    <article class="target-card agenda-card" data-feed-type="agenda" data-label="Afspraak: Tandarts Emma">',
    '      <button class="target-type-icon agenda" data-route="agenda">▣</button><button class="target-photo-button" data-profile="Esra"><img class="target-user-photo" src="' + esraAvatar + '" alt="Esra"></button><div class="target-card-body"><div class="target-card-top"><p><strong>Esra</strong> heeft een afspraak toegevoegd</p><button>2u ···</button></div><button class="target-agenda-pill" data-route="agenda"><strong>▣ Tandarts - Emma</strong><small>Morgen om 14:30</small></button><div class="target-reactions"><button data-like-static data-count="3">♥ 3</button><button data-comment-static>○ Reageer</button></div></div>',
    '    </article>',
    '    <article class="target-card photo-card" data-feed-type="photo" data-label="Foto update van Esra">',
    '      <button class="target-type-icon photo">▧</button><button class="target-photo-button" data-profile="Esra"><img class="target-user-photo" src="' + esraAvatar + '" alt="Esra"></button><div class="target-card-body"><div class="target-card-top"><p><strong>Esra</strong> heeft 3 foto’s toegevoegd</p><button>3u ···</button></div><div class="target-photo-row"><button><img src="' + familyPhotoOne + '" alt="Foto 1"></button><button><img src="' + familyPhotoTwo + '" alt="Foto 2"></button><button><img src="' + familyPhotoThree + '" alt="Foto 3"></button></div><div class="target-reactions"><button data-like-static data-count="8">♥ 8</button><button data-comment-static>○ 2</button></div></div>',
    '    </article>',
    '    <article class="target-card grocery-card" data-feed-type="grocery" data-label="Boodschappenlijst bijgewerkt">',
    '      <button class="target-type-icon grocery" data-route="boodschappen">▰</button><button class="target-photo-button" data-profile="Lisa"><img class="target-user-photo" src="' + lisaAvatar + '" alt="Lisa"></button><div class="target-card-body"><div class="target-card-top"><p><strong>Boodschappenlijst</strong> is bijgewerkt</p><button>5u ···</button></div><button class="target-grocery-pill" data-route="boodschappen">🥛 Melk &nbsp; 🍌 Bananen &nbsp; 🍞 Brood &nbsp; +2 meer</button><div class="target-reactions"><button data-like-static data-count="4">♥ 4</button><button data-comment-static>○ Reageer</button></div></div>',
    '    </article>',
    '    <article class="target-card birthday-card" data-feed-type="agenda" data-label="Verjaardag Emma">',
    '      <button class="target-type-icon birthday" data-route="agenda">♛</button><button class="target-photo-button" data-profile="Lisa"><img class="target-user-photo" src="' + lisaAvatar + '" alt="Lisa"></button><div class="target-card-body"><div class="target-card-top"><p><strong>Verjaardag</strong> morgen</p><button>1d ···</button></div><button class="target-birthday-pill" data-route="agenda"><img src="' + familyPhotoTwo + '" alt="Emma"><div><strong>Emma</strong><small>8 jaar! 🎉</small></div></button><div class="target-reactions"><button data-like-static data-count="6">♥ 6</button><button data-comment-static>○ Reageer</button></div></div>',
    '    </article>',
    '  </section>',
    '</section>'
  ].join('');

  renderSavedPosts(container);
  bindFeedActions(container);
}
