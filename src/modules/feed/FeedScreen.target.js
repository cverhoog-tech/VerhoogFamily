const avatars = {
  shane: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80',
  esra: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80',
  sophie: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&q=80',
  mark: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=120&q=80',
  emma: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&w=120&q=80',
};

const photos = {
  forest: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=240&q=80',
  dog: 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=240&q=80',
  lake: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=240&q=80',
};

const feedKey = 'familyapp-feed-state-v3';
const avatarKey = 'familyapp-current-user-avatar-v1';

function ownAvatar() {
  return localStorage.getItem(avatarKey) || avatars.shane;
}

function seedPosts() {
  return [
    {
      id: 'walk', type: 'photo', author: 'Sophie', avatar: avatars.sophie, time: '2 uur geleden',
      text: 'Heerlijke wandeling gemaakt in het bos vandaag! 🌳🚶', photos: [photos.forest, photos.dog, photos.lake], likes: 12, liked: false,
      comments: [
        { id: 'c1', author: 'Mark', avatar: avatars.mark, text: "Wat een mooie foto's! 🥾", likes: 2, liked: false, replies: [
          { id: 'r1', author: 'Sophie', avatar: avatars.sophie, text: 'Dankjewel! 😊', likes: 0, liked: false }
        ] }
      ]
    },
    { id: 'task', type: 'task', author: 'Shane', avatar: avatars.shane, time: '1u', text: 'heeft een taak afgerond', title: 'Vuilnis buiten zetten', points: '+10 punten', likes: 8, liked: false, comments: [] },
    { id: 'agenda', type: 'agenda', author: 'Esra', avatar: avatars.esra, time: '2u', text: 'heeft een afspraak toegevoegd', title: 'Tandarts - Emma', subtitle: 'Morgen om 14:30', likes: 3, liked: false, comments: [] },
    { id: 'grocery', type: 'grocery', author: 'Boodschappenlijst', avatar: avatars.esra, time: '5u', text: 'is bijgewerkt', title: 'Melk, Bananen, Brood en 2 meer', likes: 4, liked: false, comments: [] },
    { id: 'birthday', type: 'agenda', author: 'Verjaardag', avatar: avatars.emma, time: '1d', text: 'morgen', title: 'Emma', subtitle: '8 jaar! 🎉', likes: 6, liked: false, comments: [] }
  ];
}

function state() {
  try { return JSON.parse(localStorage.getItem(feedKey)) || seedPosts(); }
  catch (e) { return seedPosts(); }
}

function save(next) {
  localStorage.setItem(feedKey, JSON.stringify(next));
}

function escapeHtml(value) {
  return String(value || '').replace(/[&<>"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[char]));
}

function toast(message) {
  let el = document.querySelector('.target-toast');
  if (!el) { el = document.createElement('div'); el.className = 'target-toast'; document.body.appendChild(el); }
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(el._timer);
  el._timer = setTimeout(() => el.classList.remove('show'), 1700);
}

function routeTo(label) {
  const normalized = String(label || '').toLowerCase();
  const aliases = {
    tasks: ['taken', 'task'],
    updates: ['feed', 'update', 'updates'],
    agenda: ['agenda', 'kalender', 'afspraken'],
    groceries: ['boodschappen', 'lijst'],
    notes: ['notities', 'notes'],
  };
  const wanted = aliases[normalized] || [normalized];
  const candidates = Array.from(document.querySelectorAll('.nav-btn, .more-btn, button, [role="button"]'));
  const found = candidates.find((button) => {
    const text = (button.textContent || '').toLowerCase().trim();
    return wanted.some((term) => text.includes(term));
  });
  if (found) {
    requestAnimationFrame(() => found.click());
  } else {
    toast('Open module: ' + label);
  }
}

function icon(type) {
  if (type === 'task') return ['✓', 'task'];
  if (type === 'agenda') return ['▣', 'agenda'];
  if (type === 'photo') return ['▧', 'photo'];
  if (type === 'grocery') return ['▰', 'grocery'];
  return ['✎', 'note'];
}

function renderComments(post) {
  if (!post.comments || !post.comments.length) return '';
  return '<div class="target-comments">' + post.comments.map((comment) => {
    const replies = (comment.replies || []).map((reply) => `
      <div class="target-reply">
        <img src="${reply.avatar}" alt="${escapeHtml(reply.author)}">
        <div><strong>${escapeHtml(reply.author)}</strong><p>${escapeHtml(reply.text)}</p></div>
      </div>
    `).join('');
    return `
      <div class="target-comment" data-comment-id="${comment.id}">
        <img src="${comment.avatar}" alt="${escapeHtml(comment.author)}">
        <div class="target-comment-main">
          <div class="target-comment-bubble"><strong>${escapeHtml(comment.author)}</strong><p>${escapeHtml(comment.text)}</p></div>
          <div class="target-comment-actions"><button data-reply="${post.id}" data-comment="${comment.id}">Beantwoorden</button><button data-comment-like="${post.id}" data-comment="${comment.id}" class="${comment.liked ? 'liked' : ''}">♡ ${comment.likes || 0}</button></div>
          ${replies}
        </div>
      </div>
    `;
  }).join('') + '</div>';
}

function renderPost(post) {
  const [symbol, iconClass] = icon(post.type);
  const photoHtml = post.photos && post.photos.length ? '<div class="target-photo-row">' + post.photos.map((src) => `<button data-open-photo><img src="${src}" alt="Foto"></button>`).join('') + '</div>' : '';
  const mediaHtml = post.image ? `<img class="target-upload-image" src="${post.image}" alt="Upload">` : '';
  const gifHtml = post.gif ? `<img class="target-upload-image" src="${post.gif}" alt="GIF">` : '';
  const detail = post.type === 'agenda' ? `<button class="target-agenda-pill" data-route="agenda"><strong>▣ ${escapeHtml(post.title)}</strong><small>${escapeHtml(post.subtitle)}</small></button>` :
    post.type === 'grocery' ? `<button class="target-grocery-pill" data-route="groceries">🥛 ${escapeHtml(post.title)}</button>` :
    post.type === 'task' ? `<h3>${escapeHtml(post.title)}</h3><b class="target-points">${escapeHtml(post.points)}</b>` :
    post.type === 'birthday' ? `<button class="target-birthday-pill" data-route="agenda"><img src="${avatars.emma}" alt="Emma"><div><strong>${escapeHtml(post.title)}</strong><small>${escapeHtml(post.subtitle)}</small></div></button>` : '';

  return `
    <article class="target-card" data-feed-type="${post.type}" data-post-id="${post.id}">
      <button class="target-type-icon ${iconClass}" data-route="${post.type === 'grocery' ? 'groceries' : post.type === 'task' ? 'tasks' : post.type === 'agenda' ? 'agenda' : 'updates'}">${symbol}</button>
      <div class="target-card-body">
        <div class="target-card-top"><p><strong>${escapeHtml(post.author)}</strong> ${escapeHtml(post.text)}</p><button data-menu>${escapeHtml(post.time)} ···</button></div>
        ${detail}
        ${photoHtml}${mediaHtml}${gifHtml}
        <div class="target-reactions"><button data-like="${post.id}" class="${post.liked ? 'liked' : ''}">♥ ${post.likes || 0}</button><button data-focus-comment="${post.id}">○ ${(post.comments || []).length}</button></div>
        ${renderComments(post)}
        <div class="target-comment-box"><img src="${ownAvatar()}" alt="Jij"><input data-comment-input="${post.id}" placeholder="Schrijf een reactie..."><button data-send-comment="${post.id}">➤</button></div>
      </div>
    </article>
  `;
}

function renderPosts(container) {
  const list = container.querySelector('.target-feed-list');
  if (!list) return;
  list.innerHTML = state().map(renderPost).join('');
  bindPostActions(container);
}

function publish(container) {
  const input = container.querySelector('.target-input-field');
  const photoInput = container.querySelector('.target-photo-input');
  const text = input.value.trim();
  const image = photoInput.dataset.preview || '';
  const gif = input.dataset.gif || '';
  if (!text && !image && !gif) { toast('Schrijf eerst iets of voeg media toe'); return; }
  const posts = state();
  posts.unshift({ id: 'post-' + Date.now(), type: 'note', author: 'Shane', avatar: ownAvatar(), time: 'nu', text, image, gif, likes: 0, liked: false, comments: [] });
  save(posts);
  input.value = ''; input.dataset.gif = ''; photoInput.value = ''; photoInput.dataset.preview = '';
  container.querySelector('.target-media-preview').innerHTML = '';
  renderPosts(container);
  toast('Post geplaatst');
}

function toggleLike(postId) {
  const posts = state();
  const post = posts.find((item) => item.id === postId);
  if (!post) return;
  post.liked = !post.liked;
  post.likes = Math.max(0, (post.likes || 0) + (post.liked ? 1 : -1));
  save(posts);
}

function addComment(postId, text) {
  const posts = state();
  const post = posts.find((item) => item.id === postId);
  if (!post || !text.trim()) return;
  post.comments = post.comments || [];
  post.comments.push({ id: 'comment-' + Date.now(), author: 'Shane', avatar: ownAvatar(), text: text.trim(), likes: 0, liked: false, replies: [] });
  save(posts);
}

function addReply(postId, commentId) {
  const text = prompt('Reageer op deze reactie');
  if (!text) return;
  const posts = state();
  const post = posts.find((item) => item.id === postId);
  const comment = post && (post.comments || []).find((item) => item.id === commentId);
  if (!comment) return;
  comment.replies = comment.replies || [];
  comment.replies.push({ id: 'reply-' + Date.now(), author: 'Shane', avatar: ownAvatar(), text: text.trim(), likes: 0, liked: false });
  save(posts);
}

function bindPostActions(container) {
  container.querySelectorAll('[data-like]').forEach((button) => button.onclick = (event) => { event.stopPropagation(); toggleLike(button.dataset.like); renderPosts(container); });
  container.querySelectorAll('[data-send-comment]').forEach((button) => button.onclick = (event) => { event.stopPropagation(); const input = container.querySelector(`[data-comment-input="${button.dataset.sendComment}"]`); addComment(button.dataset.sendComment, input.value); renderPosts(container); });
  container.querySelectorAll('[data-focus-comment]').forEach((button) => button.onclick = (event) => { event.stopPropagation(); const input = container.querySelector(`[data-comment-input="${button.dataset.focusComment}"]`); if (input) input.focus(); });
  container.querySelectorAll('[data-reply]').forEach((button) => button.onclick = (event) => { event.stopPropagation(); addReply(button.dataset.reply, button.dataset.comment); renderPosts(container); });
  container.querySelectorAll('[data-comment-like]').forEach((button) => button.onclick = (event) => { event.stopPropagation(); toast('Reactie geliked'); });
  container.querySelectorAll('[data-route]').forEach((button) => button.onclick = (event) => { event.stopPropagation(); if (button.dataset.route) routeTo(button.dataset.route); });
}

function bindComposer(container) {
  container.querySelector('[data-action="photo"]').onclick = () => container.querySelector('.target-photo-input').click();
  container.querySelector('[data-action="emoji"]').onclick = () => { const input = container.querySelector('.target-input-field'); input.value += '😊'; input.focus(); };
  container.querySelector('[data-action="gif"]').onclick = () => { const input = container.querySelector('.target-input-field'); input.dataset.gif = 'https://media.giphy.com/media/111ebonMs90YLu/giphy.gif'; container.querySelector('.target-media-preview').innerHTML = `<img src="${input.dataset.gif}" alt="GIF">`; };
  container.querySelectorAll('[data-action="post"]').forEach((button) => { button.onclick = (event) => { event.stopPropagation(); publish(container); }; });
  container.querySelector('.target-input-field').addEventListener('keydown', (event) => { if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') publish(container); });
  container.querySelector('.target-photo-input').onchange = (event) => { const file = event.target.files && event.target.files[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => { event.target.dataset.preview = reader.result; container.querySelector('.target-media-preview').innerHTML = `<img src="${reader.result}" alt="Preview">`; }; reader.readAsDataURL(file); };
}

export function renderFeedScreen(container) {
  container.innerHTML = `
    <section class="target-feed">
      <section class="target-feed-summary">
        <h2>Goedemiddag Shane 👋</h2><p>Dit is er vandaag in het gezin</p>
        <div class="target-stat-grid">
          <button class="target-stat" data-route="tasks"><span class="target-stat-icon green">✓</span><strong>4</strong><small>Taken afgerond</small></button>
          <button class="target-stat" data-route="agenda"><span class="target-stat-icon purple">▣</span><strong>2</strong><small>Afspraken</small></button>
          <button class="target-stat" data-route="groceries"><span class="target-stat-icon orange">▣</span><strong>3</strong><small>Boodschappen</small></button>
          <button class="target-stat" data-route="updates"><span class="target-stat-icon blue">●●</span><strong>5</strong><small>Nieuwe updates</small></button>
        </div>
      </section>
      <section class="target-composer">
        <img class="target-composer-avatar" src="${ownAvatar()}" alt="Jouw foto">
        <div class="target-input-wrap"><textarea class="target-input-field" placeholder="Deel iets met het gezin..."></textarea><button class="target-send-inline" data-action="post" aria-label="Post plaatsen">➤</button></div>
        <div class="target-media-preview"></div>
        <input class="target-photo-input" type="file" accept="image/*" hidden>
        <div class="target-composer-actions"><button data-action="photo">▧</button><button data-action="emoji">😊</button><button data-action="gif">GIF</button><button class="target-post" data-action="post">Posten</button></div>
      </section>
      <nav class="target-tabs"><button class="active" data-filter="all">⌂ Alle updates</button><button data-filter="task">☑ Taken</button><button data-filter="agenda">▣ Agenda</button><button data-filter="photo">▧ Foto's</button><button data-filter="note">▱ Notities</button></nav>
      <section class="target-feed-list"></section>
    </section>
  `;
  container.querySelectorAll('[data-filter]').forEach((button) => button.onclick = () => { container.querySelectorAll('[data-filter]').forEach((item) => item.classList.remove('active')); button.classList.add('active'); const filter = button.dataset.filter; container.querySelectorAll('[data-feed-type]').forEach((card) => { card.hidden = filter !== 'all' && card.dataset.feedType !== filter; }); });
  container.querySelectorAll('[data-route]').forEach((button) => button.onclick = (event) => { event.stopPropagation(); routeTo(button.dataset.route); });
  bindComposer(container);
  renderPosts(container);
}
