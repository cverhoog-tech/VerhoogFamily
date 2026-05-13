(() => {
  if (window.__familyAppTaskCreateSubmitGuardV4) return;
  window.__familyAppTaskCreateSubmitGuardV4 = true;

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
  const RESUME_KEY = 'familyapp-resume-tasks-after-save-v1';
  let lastTaskSaveAt = 0;

  function markTaskSave() {
    lastTaskSaveAt = Date.now();
    try {
      localStorage.setItem(RESUME_KEY, String(lastTaskSaveAt));
    } catch (error) {}
  }

  function wasRecentTaskSave() {
    return Date.now() - lastTaskSaveAt < 2500;
  }

  function hasRecentResumeRequest() {
    const stamp = Number(localStorage.getItem(RESUME_KEY) || 0);
    return stamp && Date.now() - stamp < 45000;
  }

  function clearResumeRequest() {
    localStorage.removeItem(RESUME_KEY);
  }

  function textOf(node) {
    return String(node && node.textContent || '').replace(/\s+/g, ' ').trim();
  }

  function findClickableByText(pattern) {
    return Array.from(document.querySelectorAll('button, a, [role="button"], input[type="button"], input[type="submit"]')).find((el) => {
      const text = `${textOf(el)} ${el.value || ''} ${el.getAttribute('aria-label') || ''}`;
      return pattern.test(text);
    });
  }

  function looksLikeLoginScreen() {
    const bodyText = textOf(document.body).toLowerCase();
    return /inloggen met google|e-mail inloggen|registreren|offline gebruiken/.test(bodyText);
  }

  function looksLikeTasksScreen() {
    const header = document.querySelector('.header-title');
    return /taken|tasks/i.test(textOf(header)) || !!document.querySelector('#task-content, .task-content, .task-tabs');
  }

  function clickTasksNav() {
    const target = findClickableByText(/taken|tasks/i);
    if (!target) return false;
    target.click();
    return true;
  }

  function recoverAfterAuthReset() {
    if (!hasRecentResumeRequest()) return;

    if (looksLikeTasksScreen()) {
      clearResumeRequest();
      return;
    }

    if (looksLikeLoginScreen()) {
      const offline = findClickableByText(/offline gebruiken/i);
      if (offline) {
        offline.click();
        setTimeout(clickTasksNav, 250);
        setTimeout(clickTasksNav, 750);
        setTimeout(() => {
          if (looksLikeTasksScreen()) clearResumeRequest();
        }, 1400);
      }
      return;
    }

    clickTasksNav();
    setTimeout(() => {
      if (looksLikeTasksScreen()) clearResumeRequest();
    }, 800);
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
    [200, 700, 1500, 2800].forEach((delay) => setTimeout(recoverAfterAuthReset, delay));
  });
})();
