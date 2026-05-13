(() => {
  if (window.__questStabilityHotfixV2) return;
  window.__questStabilityHotfixV2 = true;

  const RETURN_KEY = 'familyapp-return-to-tasks-after-create-v2';
  const STYLE_ID = 'quest-stability-hotfix-style-v2';

  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .fqPage {
        padding-bottom: 150px !important;
      }

      .fqDoneWrap {
        position: fixed !important;
        left: 50% !important;
        right: auto !important;
        bottom: calc(env(safe-area-inset-bottom, 0px) + 12px) !important;
        transform: translateX(-50%) !important;
        width: calc(100% - 28px) !important;
        max-width: 452px !important;
        z-index: 99999 !important;
        padding: 10px !important;
        border-radius: 24px !important;
        background: rgba(255, 255, 255, 0.14) !important;
        backdrop-filter: blur(22px) saturate(1.2) !important;
        -webkit-backdrop-filter: blur(22px) saturate(1.2) !important;
        box-shadow: 0 18px 46px rgba(8, 17, 31, 0.26) !important;
        display: flex !important;
        justify-content: center !important;
        pointer-events: auto !important;
      }

      .fqDoneWrap .fqDone,
      #fqDoneBtn {
        width: 100% !important;
        max-width: none !important;
        min-height: 58px !important;
        border-radius: 18px !important;
        font-size: 17px !important;
        font-weight: 950 !important;
        letter-spacing: -0.02em !important;
      }

      .fqDoneWrap .fqDone:not(.reopen),
      #fqDoneBtn:not(.reopen) {
        background: linear-gradient(135deg, #3b82f6 0%, #2563eb 52%, #1d4ed8 100%) !important;
        color: #ffffff !important;
        border: 0 !important;
        box-shadow: 0 14px 34px rgba(37, 99, 235, 0.34), inset 0 1px 0 rgba(255,255,255,.22) !important;
      }

      .fqDoneWrap .fqDone.reopen,
      #fqDoneBtn.reopen {
        background: rgba(8, 17, 31, 0.78) !important;
        color: #ffffff !important;
        border: 1px solid rgba(255,255,255,.20) !important;
        box-shadow: none !important;
      }
    `;
    document.head.appendChild(style);
  }

  function headerText() {
    const header = document.querySelector('.header-title');
    return (header && header.textContent || '').trim().toLowerCase();
  }

  function isTaskScreenVisible() {
    return /taken|tasks/i.test(headerText()) || !!document.querySelector('#task-content .fq, .task-content .fq, .task-tabs, .ttab');
  }

  function markReturn() {
    localStorage.setItem(RETURN_KEY, String(Date.now()));
    sessionStorage.setItem(RETURN_KEY, String(Date.now()));
  }

  function clickTaskNav() {
    const candidates = Array.from(document.querySelectorAll('button, .nav-btn, [role="button"], a'));
    const taskButton = candidates.find((el) => /taken|tasks/i.test(el.textContent || '') || /task/i.test(el.getAttribute('data-screen') || ''));
    if (taskButton) {
      taskButton.click();
      return true;
    }
    return false;
  }

  function forceTaskScreenActive() {
    const screens = Array.from(document.querySelectorAll('.screen'));
    const taskScreen = screens.find((screen) => /task|taken/i.test(screen.id || '') || !!screen.querySelector('.task-tabs, #task-content, .task-content'));
    if (!taskScreen) return false;

    screens.forEach((screen) => screen.classList.remove('active'));
    taskScreen.classList.add('active');

    const title = document.querySelector('.header-title');
    if (title) title.textContent = 'Taken';

    const navButtons = Array.from(document.querySelectorAll('.nav-btn'));
    navButtons.forEach((btn) => btn.classList.toggle('active', /taken|tasks/i.test(btn.textContent || '')));

    window.dispatchEvent(new CustomEvent('familyapp:route-restored', { detail: { screen: 'tasks' } }));
    return true;
  }

  function restoreAfterCreate() {
    const stamp = Math.max(Number(localStorage.getItem(RETURN_KEY) || 0), Number(sessionStorage.getItem(RETURN_KEY) || 0));
    if (!stamp) return;
    if (Date.now() - stamp > 30000) {
      localStorage.removeItem(RETURN_KEY);
      sessionStorage.removeItem(RETURN_KEY);
      return;
    }

    if (isTaskScreenVisible()) {
      localStorage.removeItem(RETURN_KEY);
      sessionStorage.removeItem(RETURN_KEY);
      return;
    }

    const clicked = clickTaskNav();
    setTimeout(() => {
      if (!isTaskScreenVisible()) forceTaskScreenActive();
    }, clicked ? 160 : 20);
  }

  function closeCreateOverlays() {
    document.querySelectorAll('.add-overlay.open, .nav-config-overlay.open').forEach((el) => el.classList.remove('open'));
    document.querySelectorAll('.add-overlay, .nav-config-overlay').forEach((el) => {
      if (el.style.display === 'block') el.style.display = '';
    });
    document.body.style.overflow = '';
  }

  document.addEventListener('click', (event) => {
    const target = event.target && event.target.closest ? event.target.closest('button, .sheet-btn, .fqSave, input[type="submit"]') : null;
    if (!target) return;
    const text = (target.textContent || target.value || '').toLowerCase();
    const inQuestCreate = !!target.closest('.add-sheet, .fqModal, .task-content, #task-content') || isTaskScreenVisible();
    if (inQuestCreate && /opslaan|toevoegen|quest toevoegen|save|add quest|nieuwe quest/.test(text)) {
      markReturn();
      [80, 220, 520, 1000, 1800, 3200, 5200].forEach((delay) => setTimeout(() => {
        closeCreateOverlays();
        restoreAfterCreate();
      }, delay));
    }
  }, true);

  const originalSetItem = Storage.prototype.setItem;
  Storage.prototype.setItem = function patchedSetItem(key, value) {
    const result = originalSetItem.apply(this, arguments);
    try {
      if (/fam_tasks_v0|tasks/i.test(String(key || ''))) {
        markReturn();
        [120, 360, 900, 1800].forEach((delay) => setTimeout(restoreAfterCreate, delay));
      }
    } catch (error) {}
    return result;
  };

  const observer = new MutationObserver(() => {
    injectStyle();
    restoreAfterCreate();
  });

  window.addEventListener('load', () => {
    injectStyle();
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style'] });
    [200, 700, 1500].forEach((delay) => setTimeout(restoreAfterCreate, delay));
  });

  document.addEventListener('visibilitychange', restoreAfterCreate);
  setInterval(() => {
    injectStyle();
    restoreAfterCreate();
  }, 1200);
})();
