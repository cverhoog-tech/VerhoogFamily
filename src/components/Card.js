export function createCard(content = '') {
  const card = document.createElement('div');
  card.className = 'surface-card';
  card.innerHTML = content;
  return card;
}
