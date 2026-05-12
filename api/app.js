module.exports = async function handler(req, res) {
  const upstreamUrl = 'https://raw.githubusercontent.com/cverhoog-tech/VerhoogFamily/main/index.html';
  const upstream = await fetch(upstreamUrl, { headers: { 'User-Agent': 'FamilieApp-v040-premium-card-ratio' } });
  let html = await upstream.text();

  const css = String.raw`
<style id="v040-premium-card-ratio-css">
  .home-pills,
  .home-epic-cards {
    display: grid !important;
    grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
    gap: 10px !important;
    padding-left: 16px !important;
    padding-right: 16px !important;
    margin-top: 2px !important;
    margin-bottom: 14px !important;
  }

  .home-pills > *,
  .home-epic-cards > *,
  .home-pill,
  .epic-card,
  .home-card,
  .tasks-card,
  .shop-card,
  .feed-card {
    min-height: 158px !important;
    height: 158px !important;
    border-radius: 24px !important;
    position: relative !important;
    isolation: isolate !important;
    overflow: hidden !important;
    background-size: cover !important;
    background-position: center !important;
    background-repeat: no-repeat !important;
    box-shadow: 0 16px 36px rgba(17,24,39,.18) !important;
  }

  .home-pills > *::after,
  .home-epic-cards > *::after,
  .home-pill::after,
  .epic-card::after,
  .home-card::after,
  .tasks-card::after,
  .shop-card::after,
  .feed-card::after {
    content: "";
    position: absolute;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    background:
      radial-gradient(circle at 50% 0%, rgba(255,255,255,.10), transparent 36%),
      linear-gradient(180deg, rgba(0,0,0,.06) 0%, rgba(0,0,0,.22) 46%, rgba(0,0,0,.70) 100%) !important;
  }

  .home-pills > * > *,
  .home-epic-cards > * > *,
  .home-pill > *,
  .epic-card > *,
  .home-card > *,
  .tasks-card > *,
  .shop-card > *,
  .feed-card > * {
    position: relative !important;
    z-index: 1 !important;
  }

  .home-pills img,
  .home-epic-cards img,
  .home-card img,
  .epic-card img {
    opacity: 1 !important;
    object-fit: cover !important;
    filter: brightness(74%) saturate(1.12) contrast(1.06) !important;
  }

  .home-pills .card-icon,
  .home-epic-cards .card-icon,
  .home-pill .card-icon,
  .epic-card .card-icon,
  .home-card .card-icon,
  .home-pills .pill-icon,
  .home-pill .pill-icon,
  .home-pills .icon,
  .home-epic-cards .icon {
    width: 34px !important;
    height: 34px !important;
    min-width: 34px !important;
    min-height: 34px !important;
    max-width: 34px !important;
    max-height: 34px !important;
    border-radius: 999px !important;
    font-size: 15px !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    background: rgba(255,255,255,.92) !important;
    box-shadow: 0 8px 18px rgba(0,0,0,.16) !important;
    backdrop-filter: blur(8px) !important;
  }

  .home-pills .card-number,
  .home-epic-cards .card-number,
  .home-card .card-number,
  .epic-card .card-number,
  .home-pills .number,
  .home-epic-cards .number {
    font-size: 34px !important;
    line-height: .95 !important;
    font-weight: 950 !important;
    color: #fff !important;
    text-shadow: 0 4px 14px rgba(0,0,0,.58) !important;
  }

  .home-pills .card-label,
  .home-epic-cards .card-label,
  .home-card .card-label,
  .epic-card .card-label,
  .home-pills .label,
  .home-epic-cards .label {
    font-size: 13px !important;
    line-height: 1.05 !important;
    font-weight: 900 !important;
    color: #fff !important;
    text-shadow: 0 4px 14px rgba(0,0,0,.62) !important;
  }

  .home-carousel,
  .recipes-carousel,
  .hero-carousel {
    height: 232px !important;
    border-radius: 28px !important;
    margin-left: 16px !important;
    margin-right: 16px !important;
    margin-top: 6px !important;
    overflow: hidden !important;
    box-shadow: 0 18px 42px rgba(17,24,39,.16) !important;
  }

  @media (max-width: 390px) {
    .home-pills > *,
    .home-epic-cards > *,
    .home-pill,
    .epic-card,
    .home-card,
    .tasks-card,
    .shop-card,
    .feed-card {
      min-height: 150px !important;
      height: 150px !important;
      border-radius: 22px !important;
    }
    .home-pills,
    .home-epic-cards {
      gap: 8px !important;
      padding-left: 14px !important;
      padding-right: 14px !important;
    }
  }
</style>`;

  const js = String.raw`
<script id="v040-premium-card-ratio-js">
(function(){
  if (window.__v040PremiumCardRatio) return;
  window.__v040PremiumCardRatio = true;

  var photos = {
    tasks: 'https://raw.githubusercontent.com/cverhoog-tech/VerhoogFamily/main/public/assets/hero/taken_hero.webp',
    shop: 'https://raw.githubusercontent.com/cverhoog-tech/VerhoogFamily/main/public/assets/hero/boodschappen_hero.webp',
    feed: 'https://raw.githubusercontent.com/cverhoog-tech/VerhoogFamily/main/public/assets/hero/posts_hero.webp',
    recipes: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1600&q=95&fm=webp',
    agenda: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&w=1600&q=95&fm=webp',
    meals: 'https://images.unsplash.com/photo-1543353071-10c8ba85a904?auto=format&fit=crop&w=1600&q=95&fm=webp'
  };

  Object.keys(photos).forEach(function(k){ var img = new Image(); img.src = photos[k]; });

  function q(sel){ return Array.prototype.slice.call(document.querySelectorAll(sel)); }

  function forceBg(el, url){
    if (!el || !url) return;
    el.style.setProperty('background-image', 'url("' + url + '")', 'important');
    el.style.setProperty('background-size', 'cover', 'important');
    el.style.setProperty('background-position', 'center', 'important');
    el.style.setProperty('background-repeat', 'no-repeat', 'important');
    el.style.setProperty('min-height', '158px', 'important');
    el.style.setProperty('height', '158px', 'important');
    el.style.setProperty('border-radius', '24px', 'important');
    var img = el.querySelector('img');
    if (img) {
      img.src = url;
      img.loading = 'eager';
      img.decoding = 'async';
      img.style.setProperty('opacity', '1', 'important');
      img.style.setProperty('object-fit', 'cover', 'important');
      img.style.setProperty('filter', 'brightness(74%) saturate(1.12) contrast(1.06)', 'important');
    }
  }

  function textOf(el){ return (el && el.textContent ? el.textContent : '').toLowerCase(); }
  function looksLikeTopCard(el){
    if (!el) return false;
    var cls = (el.className || '').toString().toLowerCase();
    return cls.indexOf('card') !== -1 || cls.indexOf('pill') !== -1 || el.closest('.home-pills,.home-epic-cards');
  }

  function findCardByText(word){
    var all = q('button, .home-card, .home-pill, .epic-card, .tasks-card, .shop-card, .feed-card, [role="button"]');
    for (var i = 0; i < all.length; i++) {
      if (textOf(all[i]).indexOf(word) !== -1 && looksLikeTopCard(all[i])) return all[i];
    }
    return null;
  }

  function applyHeroBackgrounds(){
    var cards = q('.home-epic-cards .epic-card, .home-pills .home-pill, .home-card, .home-pills > *, .home-epic-cards > *')
      .filter(function(el){ return looksLikeTopCard(el); });

    var taskCard = findCardByText('taken') || cards[0] || q('.tasks-card')[0];
    var shopCard = findCardByText('boodschappen') || cards[1] || q('.shop-card')[0];
    var feedCard = findCardByText('posts') || cards[2] || q('.feed-card')[0];

    forceBg(taskCard, photos.tasks);
    forceBg(shopCard, photos.shop);
    forceBg(feedCard, photos.feed);

    q('.tasks-card').forEach(function(el){ forceBg(el, photos.tasks); });
    q('.shop-card').forEach(function(el){ forceBg(el, photos.shop); });
    q('.feed-card').forEach(function(el){ forceBg(el, photos.feed); });

    var carousels = q('.home-carousel, .recipes-carousel, .hero-carousel');
    carousels.forEach(function(el){
      el.style.setProperty('height', '232px', 'important');
      el.style.setProperty('border-radius', '28px', 'important');
    });

    var slides = q('.home-carousel .home-slide, .home-slide, .recipes-slide, .agenda-slide, .meals-slide');
    if (slides[0]) forceBg(slides[0], photos.recipes);
    if (slides[1]) forceBg(slides[1], photos.agenda);
    if (slides[2]) forceBg(slides[2], photos.meals);
  }

  function run(){ applyHeroBackgrounds(); setTimeout(applyHeroBackgrounds, 80); setTimeout(applyHeroBackgrounds, 300); setTimeout(applyHeroBackgrounds, 800); }
  document.addEventListener('DOMContentLoaded', run);
  window.addEventListener('load', run);
  setInterval(applyHeroBackgrounds, 1000);
  new MutationObserver(run).observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style'] });
})();
</script>`;

  html = html.replace('</head>', css + '\n</head>');
  html = html.replace('</body>', js + '\n</body>');

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.status(200).send(html);
};
