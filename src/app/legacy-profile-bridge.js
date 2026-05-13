import { loadStylesheet } from './module-loader.js';
import { renderProfileScreen } from '../modules/profile/ProfileScreen.target.js';

const PROFILE_SELECTORS = [
  '#profile-content',
  '.profile-content',
  '[data-screen="profile"]',
  '[data-module="profile"]',
];

function findProfileRoot() {
  for (const selector of PROFILE_SELECTORS) {
    const element = document.querySelector(selector);
    if (element) return element;
  }

  const activeScreen = document.querySelector('.screen.active');
  const title = document.querySelector('.header-title');
  const titleText = title ? title.textContent.toLowerCase() : '';

  if (activeScreen && /profiel|profile/.test(titleText)) {
    return activeScreen;
  }

  return null;
}

export function mountLegacyProfileBridge() {
  const root = findProfileRoot();
  if (!root) return false;

  loadStylesheet('/src/modules/profile/profile.target.css');

  if (root.dataset.modernProfile === 'target-v1') {
    return true;
  }

  root.dataset.modernProfile = 'target-v1';
  renderProfileScreen(root);
  return true;
}

window.FamilyAppModernProfile = {
  mount: mountLegacyProfileBridge,
};
