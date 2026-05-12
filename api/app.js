module.exports = async function handler(req, res) {
  const upstreamUrl = 'https://raw.githubusercontent.com/cverhoog-tech/VerhoogFamily/main/index.html';
  const upstream = await fetch(upstreamUrl, { headers: { 'User-Agent': 'FamilieApp-v038-fixed-asset-paths' } });
  let html = await upstream.text();

  const css = String.raw`
<style id="v038-hero-background-css">
  .home-epic-cards .epic-card,
  .home-pills .home-pill,
  .home-card,
  .tasks-card,
  .shop-card,
  .feed-card {
    position: relative !important;
    isolation: isolate !important;
    overflow: hidden !important;
    background-size: cover !important;
    background-position: center !important;
    background-repeat: no-repeat !important;
    box-shadow: 0 18px 42px rgba(17,24,39,.22) !important;
  }
  .home-epic-cards .epic-card::after,
  .home-pills .home-pill::after,
  .home-card::after,
  .tasks-card::after,
  .shop-card::after,
  .feed-card::after {
    content: "";
    position: absolute;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    background: linear-gradient(180deg, rgba(0,0,0,.06) 0%, rgba(0,0,0,.24) 46%, rgba(0,0,0,.72) 100%) !important;
  }
  .home-epic-cards .epic-card > *,
  .home-pills .home-pill > *,
  .home-card > *,
  .tasks-card > *,
  .shop-card > *,
  .feed-card > * {
    position: relative !important;
    z-index: 1 !important;
  }
  .home-carousel .home-slide,
  .home-slide,
  .recipes-slide,
  .agenda-slide,
  .meals-slide {
    position: relative !important;
    isolation: isolate !important;
    background-size: cover !important;
    background-position: center !important;
    background-repeat: no-repeat !important;
  }
  .home-carousel .home-slide::after,
  .home-slide::after,
  .recipes-slide::after,
  .agenda-slide::after,
  .meals-slide::after {
    content: "";
    position: absolute;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    background: linear-gradient(180deg, rgba(0,0,0,.12) 0%, rgba(0,0,0,.30) 45%, rgba(0,0,0,.62) 100%) !important;
  }
  .home-carousel .home-slide > *,
  .home-slide > *,
  .recipes-slide > *,
  .agenda-slide > *,
  .meals-slide > * {
    position: relative !important;
    z-index: 1 !important;
  }
</style>`;

  const js = String.raw`
<script id="v038-hero-background-js">
(function(){
  if (window.__v038FixedHeroAssetPaths) return;
  window.__v038FixedHeroAssetPaths = true;

  var photos = {
    tasks: '/assets/hero/taken_hero.webp',
    shop: '/assets/hero/boodschappen_hero.webp',
    feed: '/assets/hero/posts_hero.webp',
    recipes: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1600&q=95&fm=webp',
    agenda: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&w=1600&q=95&fm=webp',
    meals: 'https://images.unsplash.com/photo-1543353071-10c8ba85a904?auto=format&fit=crop&w=1600&q=95&fm=webp'
  };

  Object.keys(photos).forEach(function(k){ var img = new Image(); img.src = photos[k]; });

  function forceBg(el, url){
    if (!el || !url) return;
    el.style.setProperty('background-image', 'url("' + url + '")', 'important');
    el.style.setProperty('background-size', 'cover', 'important');
    el.style.setProperty('background-position', 'center', 'important');
    el.style.setProperty('background-repeat', 'no-repeat', 'important');
    var img = el.querySelector('img');
    if (img) {
      img.src = url;
      img.loading = 'lazy';
      img.decoding = 'async';
      img.style.setProperty('opacity', '1', 'important');
      img.style.setProperty('filter', 'brightness(74%) saturate(1.18) contrast(1.08)', 'important');
    }
  }

  function q(sel){ return Array.prototype.slice.call(document.querySelectorAll(sel)); }

  function applyHeroBackgrounds(){
    var cards = q('.home-epic-cards .epic-card, .home-pills .home-pill, .home-card');
    if (cards[0]) forceBg(cards[0], photos.tasks);
    if (cards[1]) forceBg(cards[1], photos.shop);
    if (cards[2]) forceBg(cards[2], photos.feed);

    q('.tasks-card, [onclick*="tasks"]').forEach(function(el){
      if ((el.className || '').toString().indexOf('card') !== -1 || el.closest('.home-epic-cards')) forceBg(el, photos.tasks);
    });
    q('.shop-card, [onclick*="shop"]').forEach(function(el){
      if ((el.className || '').toString().indexOf('card') !== -1 || el.closest('.home-epic-cards')) forceBg(el, photos.shop);
    });
    q('.feed-card, [onclick*="feed"]').forEach(function(el){
      if ((el.className || '').toString().indexOf('card') !== -1 || el.closest('.home-epic-cards')) forceBg(el, photos.feed);
    });

    var slides = q('.home-carousel .home-slide, .home-slide');
    if (slides[0]) forceBg(slides[0], photos.recipes);
    if (slides[1]) forceBg(slides[1], photos.agenda);
    if (slides[2]) forceBg(slides[2], photos.meals);
    q('.recipes-slide, [onclick*="recipes"]').forEach(function(el){ if (el.className && (el.className+'').indexOf('slide') !== -1) forceBg(el, photos.recipes); });
    q('.agenda-slide, [onclick*="cal"]').forEach(function(el){ if (el.className && (el.className+'').indexOf('slide') !== -1) forceBg(el, photos.agenda); });
    q('.meals-slide, [onclick*="meals"]').forEach(function(el){ if (el.className && (el.className+'').indexOf('slide') !== -1) forceBg(el, photos.meals); });
  }

  function run(){ applyHeroBackgrounds(); setTimeout(applyHeroBackgrounds, 100); setTimeout(applyHeroBackgrounds, 500); }
  document.addEventListener('DOMContentLoaded', run);
  window.addEventListener('load', run);
  setInterval(applyHeroBackgrounds, 1200);
  new MutationObserver(run).observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style'] });
})();
</script>`;

  html = html.replace('</head>', css + '\n</head>');
  html = html.replace('</body>', js + '\n</body>');

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.status(200).send(html);
};
