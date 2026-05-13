(() => {
  if (window.__homePremiumPolishV3) return;
  window.__homePremiumPolishV3 = true;

  const statImages = [
    'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=700&q=80',
    'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=700&q=80',
    'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=700&q=80',
  ];

  const statData = [
    { n: '5', label: 'taken', icon: '📝' },
    { n: '4', label: 'boodschappen', icon: '🛒' },
    { n: '2', label: 'posts', icon: '💬' },
  ];

  const heroSlides = [
    { title: 'Recepten', sub: 'Ontdek heerlijke recepten voor elke gelegenheid', icon: '🌿', cta: 'Bekijk recepten', img: 'https://images.unsplash.com/photo-1543353071-873f17a7a088?auto=format&fit=crop&w=900&q=85' },
    { title: 'Gezinsquests', sub: 'Werk samen aan kleine missies en verdien XP', icon: '⚔️', cta: 'Open quests', img: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=85' },
    { title: 'Momenten', sub: 'Bewaar foto’s, updates en mooie herinneringen', icon: '✨', cta: 'Bekijk feed', img: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=900&q=85' },
  ];

  function isHome() {
    const title = document.querySelector('.header-title');
    return title && /FamilieApp|Home/i.test(title.textContent || '');
  }

  function activeRoot() {
    return document.querySelector('.screen.active') || document.body;
  }

  function scoreStatCandidate(el) {
    const text = (el.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase();
    if (!text) return 0;
    let score = 0;
    if (/\b5\s*taken\b/.test(text) || /\btaken\b/.test(text)) score += 5;
    if (/\b4\s*boodschapp/.test(text) || /boodschapp/.test(text)) score += 5;
    if (/\b2\s*posts?\b/.test(text) || /\bposts?\b/.test(text)) score += 5;
    if (el.offsetWidth >= 70 && el.offsetHeight >= 120) score += 2;
    if (el.querySelector('img') || getComputedStyle(el).backgroundImage !== 'none') score += 1;
    return score;
  }

  function findStatCards(root) {
    const existing = Array.from(root.querySelectorAll('.premium-stat-card, .premium-stat-card-v2'));
    if (existing.length >= 3) return existing.slice(0, 3);

    const nodes = Array.from(root.querySelectorAll('button, a, article, section, .card, div'));
    const matches = nodes
      .map((el) => ({ el, score: scoreStatCandidate(el) }))
      .filter((item) => item.score >= 6)
      .sort((a, b) => b.score - a.score)
      .map((item) => item.el);

    const unique = [];
    matches.forEach((el) => {
      if (unique.length >= 3) return;
      if (unique.some((picked) => picked.contains(el) || el.contains(picked))) return;
      unique.push(el);
    });
    return unique.slice(0, 3);
  }

  function polishStats(root) {
    const cards = findStatCards(root);
    if (cards.length < 3) return;

    cards.forEach((card, index) => {
      if (card.dataset.premiumStatV3 === '1') return;
      const data = statData[index];
      card.dataset.premiumStatV3 = '1';
      card.classList.remove('premium-stat-card');
      card.classList.add('premium-stat-card-v2');
      card.style.setProperty('--premium-img', `url(${statImages[index]})`);
      card.innerHTML = `
        <span class="premium-stat-icon-v2">${data.icon}</span>
        <span class="premium-stat-number-v2">${data.n}</span>
        <span class="premium-stat-label-v2">${data.label}</span>
        <span class="premium-stat-arrow-v2">→</span>
      `;
    });
  }

  function findHero(root) {
    const existing = root.querySelector('.premium-hero-carousel-v2');
    if (existing) return existing;

    const nodes = Array.from(root.querySelectorAll('section, article, div'));
    return nodes.find((el) => {
      const text = (el.textContent || '').toLowerCase();
      return text.includes('recepten') && text.includes('bekijk') && el.offsetWidth > 260 && el.offsetHeight > 170;
    });
  }

  function syncDots(hero) {
    const track = hero.querySelector('.premium-hero-track-v2');
    const dots = Array.from(hero.querySelectorAll('.premium-hero-dots-v2 span'));
    if (!track || !dots.length) return;
    const index = Math.round(track.scrollLeft / Math.max(1, track.clientWidth));
    dots.forEach((dot, i) => dot.classList.toggle('active', i === index));
  }

  function goToSlide(hero, nextIndex) {
    const track = hero.querySelector('.premium-hero-track-v2');
    if (!track) return;
    const total = heroSlides.length;
    const safeIndex = ((nextIndex % total) + total) % total;
    track.scrollTo({ left: safeIndex * track.clientWidth, behavior: 'smooth' });
    setTimeout(() => syncDots(hero), 260);
  }

  function attachCarouselControls(hero) {
    if (hero.dataset.carouselBoundV3 === '1') return;
    hero.dataset.carouselBoundV3 = '1';

    const track = hero.querySelector('.premium-hero-track-v2');
    const prev = hero.querySelector('.premium-hero-prev-v2');
    const next = hero.querySelector('.premium-hero-next-v2');
    const dots = Array.from(hero.querySelectorAll('.premium-hero-dots-v2 span'));
    if (!track || !prev || !next) return;

    const currentIndex = () => Math.round(track.scrollLeft / Math.max(1, track.clientWidth));

    prev.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      goToSlide(hero, currentIndex() - 1);
    });

    next.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      goToSlide(hero, currentIndex() + 1);
    });

    dots.forEach((dot, index) => {
      dot.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        goToSlide(hero, index);
      });
    });

    track.addEventListener('scroll', () => syncDots(hero), { passive: true });

    let startX = 0;
    track.addEventListener('touchstart', (event) => {
      startX = event.touches[0].clientX;
    }, { passive: true });
    track.addEventListener('touchend', (event) => {
      const endX = event.changedTouches[0].clientX;
      const delta = startX - endX;
      if (Math.abs(delta) > 36) goToSlide(hero, currentIndex() + (delta > 0 ? 1 : -1));
    }, { passive: true });
  }

  function buildCarousel(root) {
    const hero = findHero(root);
    if (!hero) return;

    if (hero.dataset.premiumHeroV3 !== '1') {
      hero.dataset.premiumHeroV3 = '1';
      hero.className = 'premium-hero-carousel-v2';
      hero.innerHTML = `
        <button class="premium-hero-nav-v2 premium-hero-prev-v2" type="button" aria-label="Vorige">‹</button>
        <div class="premium-hero-track-v2">
          ${heroSlides.map((slide) => `
            <section class="premium-hero-slide-v2">
              <img class="premium-hero-bg-v2" src="${slide.img}" alt="${slide.title}">
              <div class="premium-hero-content-v2">
                <div class="premium-hero-icon-v2">${slide.icon}</div>
                <div class="premium-hero-title-v2">${slide.title}</div>
                <div class="premium-hero-sub-v2">${slide.sub}</div>
                <button class="premium-hero-cta-v2" type="button">${slide.cta} →</button>
              </div>
            </section>
          `).join('')}
        </div>
        <button class="premium-hero-nav-v2 premium-hero-next-v2" type="button" aria-label="Volgende">›</button>
        <div class="premium-hero-dots-v2">${heroSlides.map((_, i) => `<span class="${i === 0 ? 'active' : ''}"></span>`).join('')}</div>
      `;
    }

    attachCarouselControls(hero);
  }

  function apply() {
    const home = isHome();
    document.body.classList.toggle('home-premium-v2', !!home);
    if (!home) return;
    const root = activeRoot();
    polishStats(root);
    buildCarousel(root);
  }

  window.addEventListener('load', () => [50, 150, 350, 800, 1400, 2400].forEach((delay) => setTimeout(apply, delay)));
  document.addEventListener('click', () => [80, 280, 800].forEach((delay) => setTimeout(apply, delay)), true);
  document.addEventListener('visibilitychange', apply);
  setInterval(apply, 1200);
})();

(() => {
  if (window.__questModalRouteHotfixV1) return;
  window.__questModalRouteHotfixV1 = true;

  const STYLE_ID = 'quest-modal-route-hotfix-style';
  const RETURN_KEY = 'familyapp-return-to-tasks-after-create-v1';
  const ROUTE_KEY = 'familyapp-last-screen-label-v1';

  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .fqDoneWrap .fqDone:not(.reopen),
      #fqDoneBtn:not(.reopen) {
        background: linear-gradient(135deg, #3b82f6 0%, #2563eb 52%, #1d4ed8 100%) !important;
        color: #ffffff !important;
        border: 0 !important;
        box-shadow: 0 16px 38px rgba(37, 99, 235, 0.36), inset 0 1px 0 rgba(255,255,255,.22) !important;
      }
      .fqDoneWrap .fqDone:not(.reopen):active,
      #fqDoneBtn:not(.reopen):active {
        transform: scale(.98) !important;
        box-shadow: 0 10px 24px rgba(37, 99, 235, .28), inset 0 1px 0 rgba(255,255,255,.18) !important;
      }
      .fqDoneWrap .fqDone.reopen,
      #fqDoneBtn.reopen {
        background: rgba(255,255,255,.10) !important;
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

  function rememberActiveRoute() {
    const label = headerText();
    if (label) localStorage.setItem(ROUTE_KEY, label);
  }

  function looksLikeAuthScreen() {
    const text = (document.body.textContent || '').toLowerCase();
    const header = headerText();
    return /inloggen|login|aanmelden|google/i.test(text) && !/taken|tasks/i.test(header);
  }

  function clickTasksNav() {
    const candidates = Array.from(document.querySelectorAll('button, .nav-btn, [role="button"], a'));
    const tasks = candidates.find((button) => /taken|tasks/i.test(button.textContent || ''));
    if (tasks) {
      tasks.click();
      return true;
    }
    return false;
  }

  function markReturnToTasks() {
    localStorage.setItem(RETURN_KEY, String(Date.now()));
    localStorage.setItem(ROUTE_KEY, 'taken');
  }

  function restoreTasksIfNeeded() {
    const stamped = Number(localStorage.getItem(RETURN_KEY) || 0);
    if (!stamped) return;
    if (Date.now() - stamped > 15000) {
      localStorage.removeItem(RETURN_KEY);
      return;
    }

    const header = headerText();
    if (/taken|tasks/i.test(header)) {
      localStorage.removeItem(RETURN_KEY);
      return;
    }

    if (looksLikeAuthScreen() || /familieapp|home|profiel|profile/i.test(header)) {
      clickTasksNav();
    }
  }

  document.addEventListener('click', (event) => {
    rememberActiveRoute();
    const target = event.target && event.target.closest ? event.target.closest('button, .fqSave, .sheet-btn, .fqAdd') : null;
    if (!target) return;
    const text = (target.textContent || '').toLowerCase();
    const isQuestCreate = /quest toevoegen|nieuwe quest|opslaan|toevoegen|save|add quest/i.test(text);
    const isTaskContext = document.querySelector('#task-content, .task-content, .fqModal, .fqAdd, .fqSave') || /taken|tasks/i.test(headerText());
    if (isQuestCreate && isTaskContext) {
      markReturnToTasks();
      setTimeout(restoreTasksIfNeeded, 180);
      setTimeout(restoreTasksIfNeeded, 600);
      setTimeout(restoreTasksIfNeeded, 1400);
      setTimeout(restoreTasksIfNeeded, 2800);
    }
  }, true);

  window.addEventListener('storage', (event) => {
    if (event.key && /fam_tasks_v0|familyapp:.*tasks|tasks/i.test(event.key)) {
      markReturnToTasks();
      setTimeout(restoreTasksIfNeeded, 220);
    }
  });

  window.addEventListener('load', () => {
    injectStyle();
    setTimeout(restoreTasksIfNeeded, 400);
  });
  document.addEventListener('visibilitychange', restoreTasksIfNeeded);
  setInterval(() => {
    injectStyle();
    restoreTasksIfNeeded();
  }, 900);
})();
