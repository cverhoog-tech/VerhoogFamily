export function createHeader({ title = '', subtitle = '' } = {}) {
  const header = document.createElement('div');
  header.className = 'module-header';

  header.innerHTML = `
    <div class="module-header-copy">
      <div class="module-header-title">${title}</div>
      ${subtitle ? `<div class="module-header-subtitle">${subtitle}</div>` : ''}
    </div>
  `;

  return header;
}
