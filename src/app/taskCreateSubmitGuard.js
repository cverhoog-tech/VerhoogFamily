(() => {
  if (window.__familyAppTaskCreateSubmitGuardV3) return;
  window.__familyAppTaskCreateSubmitGuardV3 = true;

  const INTERACTIVE_SCOPE = [
    '#fqModal',
    '.fqModal',
    '#fqGQPop',
    '.fqGQPop',
    '.add-sheet',
    '.add-overlay',
    '#task-content',
    '.task-content'
  ].join(',');

  const SAVE_ACTION_SELECTOR = [
    'button',
    'a',
    'input[type="submit"]',
    'input[type="button"]',
    '.sheet-btn',
    '.fqSave',
    '.fqAdd',
    '.fqDone',
    '.fqHelp',
    '.fqSubAdd'
  ].join(',');

  const TASK_STORAGE_KEYS = /^(fam_tasks_v0|fqsub_)/;
  let lastTaskSaveAt = 0;

  function markTaskSave() {
    lastTaskSaveAt = Date.now();
  }

  function wasRecentTaskSave() {
    return Date.now() - lastTaskSaveAt < 2500;
  }

  function isTaskOrQuestScope(target) {
    return !!(target && target.closest && target.closest(INTERACTIVE_SCOPE));
  }

  function isSaveLikeAction(target) {
    if (!target || !target.closest) return false;
    const action = target.closest(SAVE_ACTION_SELECTOR);
    if (!action || !isTaskOrQuestScope(action)) return false;

    const text = `${action.textContent || ''} ${action.value || ''} ${action.getAttribute('aria-label') || ''}`.toLowerCase();
    const className = String(action.className || '').toLowerCase();

    return action.matches('input[type="submit"]')
      || className.includes('fqsave')
      || className.includes('sheet-btn')
      || /opslaan|toevoegen|quest toevoegen|nieuwe quest|save|add quest|create|aanmaken|voltooid|markeer/.test(text);
  }

  function normalizeSubmitButtons(root = document) {
    root.querySelectorAll([
      '#fqModal button:not([type])',
      '.fqModal button:not([type])',
      '#fqGQPop button:not([type])',
      '.fqGQPop button:not([type])',
      '.add-sheet button:not([type])',
      '#task-content button:not([type])',
      '.task-content button:not([type])'
    ].join(',')).forEach((button) => {
      button.setAttribute('type', 'button');
    });
  }

  const originalSetItem = Storage.prototype.setItem;
  Storage.prototype.setItem = function familyAppGuardedSetItem(key, value) {
    const result = originalSetItem.apply(this, arguments);
    try {
      if (TASK_STORAGE_KEYS.test(String(key || ''))) markTaskSave();
    } catch (error) {}
    return result;
  };

  window.addEventListener('beforeunload', (event) => {
    if (!wasRecentTaskSave()) return;
    event.preventDefault();
    event.returnValue = '';
  });

  document.addEventListener('submit', (event) => {
    if (!isTaskOrQuestScope(event.target)) return;
    event.preventDefault();
  }, true);

  document.addEventListener('click', (event) => {
    const action = event.target && event.target.closest ? event.target.closest(SAVE_ACTION_SELECTOR) : null;
    if (!action || !isTaskOrQuestScope(action)) return;

    if (action.tagName === 'BUTTON' && !action.getAttribute('type')) {
      action.setAttribute('type', 'button');
    }

    if (isSaveLikeAction(action)) {
      event.preventDefault();
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
