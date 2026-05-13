(() => {
  if (window.__homePremiumPolishV2) return;
  window.__homePremiumPolishV2 = true;

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
      const data = statData[index];
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
    const existing = root.querySelector('.premium-hero-carousel, .premium-hero-carousel-v2');
    if (existing) return existing;

    const nodes = Array.from(root.querySelectorAll('section, article, div'));
    return nodes.find((el) => {
      const text = (el.textContent || '').toLowerCase();
      return text.includes('recepten') && text.includes('bekijk') && el.offsetWidth > 260 && el.offsetHeight > 170;
    });
  }

  function buildCarousel(root) {
    const hero = findHero(root);
    if (!hero) return;

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

    const track = hero.querySelector('.premium-hero-track-v2');
    const dots = Array.from(hero.querySelectorAll('.premium-hero-dots-v2 span'));
    const go = (direction) => track.scrollBy({ left: direction * track.clientWidth, behavior: 'smooth' });

    hero.querySelector('.premium-hero-prev-v2').onclick = (event) => { event.stopPropagation(); go(-1); };
    hero.querySelector('.premium-hero-next-v2').onclick = (event) => { event.stopPropagation(); go(1); };
    track.addEventListener('scroll', () => {
      const index = Math.round(track.scrollLeft / Math.max(1, track.clientWidth));
      dots.forEach((dot, i) => dot.classList.toggle('active', i === index));
    }, { passive: true });
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
  setInterval(apply, 900);
})();
