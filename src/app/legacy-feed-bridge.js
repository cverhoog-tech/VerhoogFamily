import { loadStylesheet } from './module-loader.js';
import { renderFeedScreen } from '../modules/feed/FeedScreen.next.js';

const LEGACY_FEED_SELECTORS = [
  '#feed-content',
  '#updates-content',
  '.feed-content',
  '.updates-content',
  '[data-screen="feed"]',
  '[data-module="feed"]',
];

function findLegacyFeedRoot() {
  for (const selector of LEGACY_FEED_SELECTORS) {
    const element = document.querySelector(selector);
    if (element) return element;
  }

  const activeScreen = document.querySelector('.screen.active');
  const title = document.querySelector('.header-title');
  const titleText = title ? title.textContent.toLowerCase() : '';

  if (activeScreen && /update|feed|gezinsupdates/.test(titleText)) {
    return activeScreen;
  }

  return null;
}

export function mountLegacyFeedBridge() {
  const root = findLegacyFeedRoot();
  if (!root) return false;

  loadStylesheet('/src/styles/tokens.css');
  loadStylesheet('/src/styles/layout.css');
  loadStylesheet('/src/styles/components.css');
  loadStylesheet('/src/modules/feed/feed.styles.css');
  loadStylesheet('/src/modules/feed/feed.motion.css');
  loadStylesheet('/src/modules/feed/feed.premium.css');
  loadStylesheet('/src/modules/feed/feed.polish.css');

  root.dataset.modernFeed = 'true';
  renderFeedScreen(root);

  return true;
}

window.FamilyAppModernFeed = {
  mount: mountLegacyFeedBridge,
};
