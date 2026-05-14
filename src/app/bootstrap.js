import { registerRoute, navigateTo } from './router.js';
import { createBottomNav } from '../components/BottomNav.js';
import { setState } from './store.js';

const navItems = [
  { route: 'feed', label: 'Updates', icon: '🏡' },
  { route: 'tasks', label: 'Taken', icon: '✅' },
  { route: 'notes', label: 'Notities', icon: '📝' },
  { route: 'groceries', label: 'Lijst', icon: '🛒' },
];

export function registerAppRoutes() {
  registerRoute('feed', {
    stylesheet: '/src/modules/feed/feed.styles.css',
    loader: () => import('../modules/feed/FeedScreen.next.js'),
  });
}

export function mountAppShell(root) {
  if (!root) return;

  registerAppRoutes();

  root.classList.add('app-shell');
  root.innerHTML = '<main id="module-root" class="module-root"></main>';

  const moduleRoot = root.querySelector('#module-root');
  const nav = createBottomNav(navItems);

  nav.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-route]');
    if (!button) return;

    const route = button.dataset.route;
    const didNavigate = await navigateTo(route, moduleRoot);

    if (didNavigate) {
      setState({ activeScreen: route });
      nav.querySelectorAll('.bottom-navigation-item').forEach((item) => {
        item.classList.toggle('active', item.dataset.route === route);
      });
    }
  });

  root.appendChild(nav);
  navigateTo('feed', moduleRoot);
}
