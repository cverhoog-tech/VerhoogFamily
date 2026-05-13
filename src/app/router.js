const routes = new Map();
let activeRoute = null;

export function registerRoute(name, config) {
  routes.set(name, config);
}

export function getActiveRoute() {
  return activeRoute;
}

export async function navigateTo(name, container) {
  const route = routes.get(name);
  if (!route || !container) return false;

  activeRoute = name;

  if (route.stylesheet) {
    const { loadStylesheet } = await import('./module-loader.js');
    loadStylesheet(route.stylesheet);
  }

  const module = await route.loader();

  if (typeof module.mount === 'function') {
    module.mount(container);
    return true;
  }

  return false;
}
