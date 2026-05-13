import { feedItems } from './feed.data.js';

export function renderFeedItems() {
  return feedItems.map((item) => `
    <article class="feed-item surface-card">
      <div class="feed-item-user">${item.user}</div>
      <div class="feed-item-text">${item.text}</div>
      <div class="feed-item-meta">${item.meta}</div>
    </article>
  `).join('');
}
