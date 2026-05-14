export function createBottomNav(items = []) {
  const nav = document.createElement('nav');
  nav.className = 'bottom-navigation';

  nav.innerHTML = items.map((item) => {
    return `
      <button class="bottom-navigation-item" data-route="${item.route}">
        <span class="bottom-navigation-icon">${item.icon}</span>
        <span class="bottom-navigation-label">${item.label}</span>
      </button>
    `;
  }).join('');

  return nav;
}
