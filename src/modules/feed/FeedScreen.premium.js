import { feedItems } from './feed.data.js';

const typeIcon = {
  'task-complete': '✅',
  'photo-upload': '📸',
  calendar: '📅',
  'grocery-update': '🛒',
  'note-created': '📝',
  achievement: '🏆',
};

function renderActivity(item) {
  const icon = typeIcon[item.type] || '✨';

  return [
    '<article class="premium-feed-card surface-card">',
    '  <div class="premium-feed-icon">' + icon + '</div>',
    '  <div class="premium-feed-body">',
    '    <div class="premium-feed-row">',
    '      <strong>' + item.user + '</strong>',
    '      <span>' + item.meta + '</span>',
    '    </div>',
    '    <p>' + item.text + '</p>',
    '    <div class="premium-feed-reactions">❤️ 👍 💬</div>',
    '  </div>',
    '</article>',
  ].join('');
}

export function mount(container) {
  container.innerHTML = [
    '<section class="premium-feed-screen">',
    '  <header class="premium-feed-hero">',
    '    <div>',
    '      <span class="premium-feed-kicker">Vandaag</span>',
    '      <h1>Gezinsupdates</h1>',
    '      <p>Alles wat vandaag belangrijk is binnen jullie gezin.</p>',
    '    </div>',
    '  </header>',
    '  <section class="premium-feed-dashboard">',
    '    <div class="premium-stat-card surface-card"><strong>4</strong><span>Taken klaar</span></div>',
    '    <div class="premium-stat-card surface-card"><strong>2</strong><span>Afspraken</span></div>',
    '    <div class="premium-stat-card surface-card"><strong>3</strong><span>Updates</span></div>',
    '  </section>',
    '  <section class="premium-feed-composer surface-card">',
    '    <div class="premium-avatar">SH</div>',
    '    <div class="premium-composer-copy">',
    '      <strong>Deel iets met het gezin...</strong>',
    '      <span>Foto, notitie, taak of korte update</span>',
    '    </div>',
    '    <button>+</button>',
    '  </section>',
    '  <nav class="premium-feed-tabs">',
    '    <button class="active">Alles</button>',
    '    <button>Taken</button>',
    '    <button>Agenda</button>',
    '    <button>Foto’s</button>',
    '  </nav>',
    '  <section class="premium-feed-list">',
    feedItems.map(renderActivity).join(''),
    '  </section>',
    '</section>',
  ].join('');
}
