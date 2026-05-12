module.exports = async function handler(req, res) {
  const upstreamUrl = 'https://raw.githubusercontent.com/cverhoog-tech/VerhoogFamily/main/index.html';
  const upstream = await fetch(upstreamUrl, { headers: { 'User-Agent': 'FamilieApp-v035' } });
  let html = await upstream.text();

  const css = String.raw`
<style id="v035-background-css">
.v035-bg-settings{margin:16px;padding:16px;border-radius:22px;background:var(--c-surface);box-shadow:0 8px 28px var(--c-card-shadow);border:1px solid var(--c-border)}
.v035-bg-settings h3{font-size:16px;font-weight:800;margin:0 0 6px;color:var(--c-text)}
.v035-bg-settings p{font-size:12px;color:var(--c-text2);line-height:1.4;margin:0 0 12px}
.v035-bg-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.v035-bg-choice{border:2px solid var(--c-border);background:var(--c-surface2);border-radius:16px;overflow:hidden;padding:0;text-align:left;color:var(--c-text)}
.v035-bg-choice.active{border-color:var(--c-primary);box-shadow:0 0 0 3px var(--c-primary-light)}
.v035-bg-choice span{display:block;font-size:11px;font-weight:800;padding:8px;text-align:center}
.v035-bg-thumb{height:52px;background-size:cover;background-position:center;display:block}
.home-epic-cards .epic-card,.home-carousel .home-slide{background-size:cover!important;background-position:center!important}
.home-epic-cards .epic-card img,.home-carousel .home-slide img{transition:opacity .2s ease,filter .2s ease}
</style>`;

  const js = String.raw`
<script id="v035-background-js">
(function(){
  if(window.__v035BackgroundsLoaded) return;
  window.__v035BackgroundsLoaded = true;
  var U = function(id){return 'https://images.unsplash.com/'+id+'?auto=format&fit=crop&w=1200&q=85';};
  var presets = {
    rustig: {
      label:'Rustig',
      preview: U('photo-1441974231531-c6227db76b6e'),
      cards:[
        U('photo-1441974231531-c6227db76b6e'),
        U('photo-1542838132-92c53300491e'),
        U('photo-1497366754035-f200968a6e72')
      ],
      carousel:[
        U('photo-1504674900247-0877df9cc836'),
        U('photo-1473093295043-cdd812d0e601'),
        U('photo-1495521821757-a1efb6729352')
      ]
    },
    familie: {
      label:'Familie',
      preview: U('photo-1503454537195-1dcabb73ffb9'),
      cards:[
        U('photo-1500530855697-b586d89ba3ee'),
        U('photo-1542838132-92c53300491e'),
        U('photo-1516321318423-f06f85e504b3')
      ],
      carousel:[
        U('photo-1551218808-94e220e084d2'),
        U('photo-1546069901-ba9599a7e63c'),
        U('photo-1565299624946-b28f40a0ae38')
      ]
    },
    warm: {
      label:'Warm',
      preview: U('photo-1504674900247-0877df9cc836'),
      cards:[
        U('photo-1519681393784-d120267933ba'),
        U('photo-1512621776951-a57141f2eefd'),
        U('photo-1516321318423-f06f85e504b3')
      ],
      carousel:[
        U('photo-1504674900247-0877df9cc836'),
        U('photo-1565958011703-44f9829ba187'),
        U('photo-1484723091739-30a097e8f929')
      ]
    }
  };
  function currentPreset(){return localStorage.getItem('familieapp-v035-bg-preset') || 'rustig';}
  function setImg(el, src){
    if(!el || !src) return;
    el.style.backgroundImage = 'linear-gradient(rgba(0,0,0,.16),rgba(0,0,0,.28)),url("'+src+'")';
    var img = el.querySelector('img');
    if(img){ img.src = src; img.loading = 'lazy'; img.style.opacity = '1'; img.style.filter = 'brightness(72%) saturate(1.05)'; }
  }
  function applyBackgrounds(){
    var preset = presets[currentPreset()] || presets.rustig;
    document.querySelectorAll('.home-epic-cards .epic-card').forEach(function(card,i){ setImg(card, preset.cards[i % preset.cards.length]); });
    document.querySelectorAll('.home-carousel .home-slide').forEach(function(slide,i){ setImg(slide, preset.carousel[i % preset.carousel.length]); });
    document.querySelectorAll('.home-carousel .home-slide img').forEach(function(img,i){ img.src = preset.carousel[i % preset.carousel.length]; img.loading='lazy'; });
  }
  function renderProfileChooser(){
    var screen = document.getElementById('screen-profile');
    if(!screen || !screen.classList.contains('active')) return;
    if(document.getElementById('v035-bg-settings')) return;
    var box = document.createElement('section');
    box.id = 'v035-bg-settings';
    box.className = 'v035-bg-settings';
    box.innerHTML = '<h3>Achtergronden startscherm</h3><p>Kies welke HQ foto\'s achter je Home-buttons en recepten-carousel staan.</p><div class="v035-bg-grid"></div>';
    var grid = box.querySelector('.v035-bg-grid');
    Object.keys(presets).forEach(function(key){
      var p = presets[key];
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'v035-bg-choice' + (currentPreset()===key ? ' active' : '');
      btn.innerHTML = '<i class="v035-bg-thumb" style="background-image:url('+p.preview+')"></i><span>'+p.label+'</span>';
      btn.onclick = function(){
        localStorage.setItem('familieapp-v035-bg-preset', key);
        document.querySelectorAll('.v035-bg-choice').forEach(function(b){b.classList.remove('active')});
        btn.classList.add('active');
        applyBackgrounds();
      };
      grid.appendChild(btn);
    });
    var anchor = screen.querySelector('.profile-actions,.profile-stats,.profile-banner,.list-header');
    if(anchor && anchor.parentNode) anchor.parentNode.insertBefore(box, anchor.nextSibling);
    else screen.appendChild(box);
  }
  function hook(name, after){
    var tries = 0;
    var t = setInterval(function(){
      tries++;
      if(typeof window[name] === 'function'){
        clearInterval(t);
        var original = window[name];
        window[name] = function(){ var result = original.apply(this, arguments); setTimeout(after, 0); setTimeout(after, 80); return result; };
      } else if(tries > 80) clearInterval(t);
    }, 50);
  }
  hook('renderHome', applyBackgrounds);
  hook('renderProfile', function(){ renderProfileChooser(); applyBackgrounds(); });
  document.addEventListener('DOMContentLoaded', function(){ setTimeout(applyBackgrounds, 100); setTimeout(renderProfileChooser, 100); });
  new MutationObserver(function(){ applyBackgrounds(); renderProfileChooser(); }).observe(document.documentElement,{childList:true,subtree:true});
})();
</script>`;

  if (html.includes('</head>')) html = html.replace('</head>', css + '\n</head>');
  if (html.includes('</body>')) html = html.replace('</body>', js + '\n</body>');
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.status(200).send(html);
};
