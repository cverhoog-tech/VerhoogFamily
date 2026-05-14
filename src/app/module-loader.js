const loadedAssets = new Set();

export function loadStylesheet(href) {
  if (loadedAssets.has(href)) return;

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  document.head.appendChild(link);
  loadedAssets.add(href);
}

export async function mountModule(container, loader) {
  if (!container) return;

  const module = await loader();
  if (typeof module.mount === 'function') {
    module.mount(container);
    return;
  }

  if (typeof module.renderFeedScreen === 'function') {
    module.renderFeedScreen(container);
  }
}
