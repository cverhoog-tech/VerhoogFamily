(() => {
  if (window.__familyAppTaskCreateSubmitGuardV1) return;
  window.__familyAppTaskCreateSubmitGuardV1 = true;

  const INTERACTIVE_SCOPE = [
    '#fqModal',
    '.fqModal',
    '.add-sheet',
    '.add-overlay',
    '#task-content',
    '.task-content'
  ].join(',');

  function isTaskOrQuestScope(target) {
    return !!(target && target.closest && target.closest(INTERACTIVE_SCOPE));
  }

  function normalizeSubmitButtons(root = document) {
    root.querySelectorAll([
      '#fqModal button:not([type])',
      '.fqModal button:not([type])',
      '.add-sheet button:not([type])',
      '#task-content button:not([type])',
      '.task-content button:not([type])'
    ].join(',')).forEach((button) => {
      button.setAttribute('type', 'button');
    });
  }

  document.addEventListener('submit', (event) => {
    if (!isTaskOrQuestScope(event.target)) return;
    event.preventDefault();
  }, true);

  document.addEventListener('click', (event) => {
    const button = event.target && event.target.closest ? event.target.closest('button, input[type="submit"]') : null;
    if (!button || !isTaskOrQuestScope(button)) return;

    if (button.tagName === 'BUTTON' && !button.getAttribute('type')) {
      button.setAttribute('type', 'button');
    }
  }, true);

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node && node.nodeType === 1) normalizeSubmitButtons(node);
      });
    });
  });

  window.addEventListener('load', () => {
    normalizeSubmitButtons();
    if (document.body) observer.observe(document.body, { childList: true, subtree: true });
  });
})();
