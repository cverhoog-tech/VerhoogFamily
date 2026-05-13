module.exports = async function handler(req, res) {
  try {
    const upstream = await fetch("https://raw.githubusercontent.com/cverhoog-tech/VerhoogFamily/main/index.html", {
      headers: { "User-Agent": "FamilyApp-stable-loader" }
    });

    if (!upstream.ok) {
      res.status(502).send("FamilyApp kon de app-shell niet laden.");
      return;
    }

    let html = await upstream.text();

    const injection = `
<link rel="stylesheet" href="/trade-engine.css">
<script src="/trade-engine.js" defer></script>

<script type="module" id="modern-bridge-loader">
  import { mountLegacyFeedBridge } from '/src/app/legacy-feed-bridge.js';
  import { mountLegacyProfileBridge } from '/src/app/legacy-profile-bridge.js';

  function tryModernMounts() {
    try {
      mountLegacyFeedBridge();
      mountLegacyProfileBridge();
    } catch (error) {
      console.warn('Modern bridges konden niet laden', error);
    }
  }

  function syncOwnAvatarLinks() {
    var avatarUrl = localStorage.getItem('familyapp-current-user-avatar-v1');
    var headerAvatars = document.querySelectorAll('.header-avatar');
    headerAvatars.forEach(function (avatar) {
      avatar.style.cursor = 'pointer';
      avatar.onclick = function () {
        var profileButton = Array.from(document.querySelectorAll('button, .more-btn, [role="button"]')).find(function (button) {
          return /profiel|profile/i.test(button.textContent || '');
        });
        if (profileButton) profileButton.click();
      };
      if (avatarUrl && !avatar.querySelector('img')) {
        avatar.innerHTML = '<img src="' + avatarUrl + '" alt="Profiel" style="width:100%;height:100%;border-radius:50%;object-fit:cover;display:block">';
      }
    });
  }

  window.addEventListener('load', function () {
    [120, 450, 900, 1500].forEach(function (delay) { setTimeout(function(){ tryModernMounts(); syncOwnAvatarLinks(); }, delay); });
  });

  document.addEventListener('click', function () {
    setTimeout(function(){ tryModernMounts(); syncOwnAvatarLinks(); }, 120);
    setTimeout(function(){ tryModernMounts(); syncOwnAvatarLinks(); }, 420);
  }, true);

  setInterval(function(){ tryModernMounts(); syncOwnAvatarLinks(); }, 1200);
</script>

<style id="premium-home-polish-css">
body.home-premium-polish .home-pills,
body.home-premium-polish .home-tiles,
body.home-premium-polish .home-cards,
body.home-premium-polish .home-actions,
body.home-premium-polish [class*="home"][class*="pill"],
body.home-premium-polish [class*="home"][class*="tile"]{
  scrollbar-width:none;
}
body.home-premium-polish .home-pills::-webkit-scrollbar,
body.home-premium-polish .home-tiles::-webkit-scrollbar,
body.home-premium-polish .home-cards::-webkit-scrollbar,
body.home-premium-polish .home-actions::-webkit-scrollbar{display:none;}
body.home-premium-polish .premium-stat-card{
  position:relative!important;
  overflow:hidden!important;
  min-height:210px!important;
  border-radius:24px!important;
  isolation:isolate!important;
  display:flex!important;
  flex-direction:column!important;
  align-items:center!important;
  justify-content:center!important;
  gap:4px!important;
  padding:22px 14px!important;
  color:#fff!important;
  text-align:center!important;
  box-shadow:0 18px 38px rgba(31,41,51,.14)!important;
  transform:translateZ(0)!important;
}
body.home-premium-polish .premium-stat-card:before{content:"";position:absolute;inset:0;z-index:-2;background:var(--premium-img) center/cover no-repeat;transform:scale(1.03);}
body.home-premium-polish .premium-stat-card:after{content:"";position:absolute;inset:0;z-index:-1;background:linear-gradient(180deg,rgba(0,0,0,.22) 0%,rgba(0,0,0,.42) 48%,rgba(0,0,0,.62) 100%);}
body.home-premium-polish .premium-stat-icon{position:absolute!important;top:24px!important;left:50%!important;transform:translateX(-50%)!important;width:58px!important;height:58px!important;border-radius:50%!important;background:rgba(255,255,255,.92)!important;color:#2f7f28!important;display:flex!important;align-items:center!important;justify-content:center!important;font-size:25px!important;box-shadow:0 14px 30px rgba(0,0,0,.18), inset 0 1px 0 rgba(255,255,255,.95)!important;backdrop-filter:blur(14px)!important;-webkit-backdrop-filter:blur(14px)!important;}
body.home-premium-polish .premium-stat-number{display:block!important;margin-top:54px!important;font-size:46px!important;font-weight:900!important;line-height:.9!important;letter-spacing:-.06em!important;color:#fff!important;text-shadow:0 3px 14px rgba(0,0,0,.35)!important;}
body.home-premium-polish .premium-stat-label{display:block!important;max-width:92px!important;margin:4px auto 0!important;font-size:22px!important;font-weight:850!important;line-height:.96!important;letter-spacing:-.035em!important;color:#fff!important;text-shadow:0 3px 14px rgba(0,0,0,.35)!important;overflow-wrap:normal!important;word-break:normal!important;hyphens:none!important;}
body.home-premium-polish .premium-stat-arrow{position:absolute!important;left:22px!important;bottom:22px!important;width:54px!important;height:54px!important;border-radius:50%!important;background:rgba(255,255,255,.94)!important;color:#2f7f28!important;display:flex!important;align-items:center!important;justify-content:center!important;font-size:30px!important;font-weight:900!important;box-shadow:0 12px 28px rgba(0,0,0,.16)!important;}
body.home-premium-polish .premium-stat-card:nth-child(2) .premium-stat-arrow{color:#e57600!important;}
body.home-premium-polish .premium-stat-card:nth-child(3) .premium-stat-arrow{color:#c94f82!important;}
body.home-premium-polish .premium-hero-carousel{position:relative!important;width:calc(100% - 32px)!important;margin:18px 16px 0!important;overflow:hidden!important;border-radius:28px!important;box-shadow:0 20px 44px rgba(31,41,51,.12)!important;background:#111!important;}
body.home-premium-polish .premium-hero-track{display:flex!important;overflow-x:auto!important;scroll-snap-type:x mandatory!important;scroll-behavior:smooth!important;gap:0!important;scrollbar-width:none!important;}
body.home-premium-polish .premium-hero-track::-webkit-scrollbar{display:none!important;}
body.home-premium-polish .premium-hero-slide{position:relative!important;min-width:100%!important;width:100%!important;flex:0 0 100%!important;height:310px!important;border-radius:28px!important;overflow:hidden!important;scroll-snap-align:start!important;color:#fff!important;display:flex!important;align-items:center!important;justify-content:center!important;text-align:center!important;background:#111 center/cover no-repeat!important;}
body.home-premium-polish .premium-hero-slide:after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.18) 0%,rgba(0,0,0,.42) 52%,rgba(0,0,0,.64) 100%);}
body.home-premium-polish .premium-hero-content{position:relative;z-index:2;display:flex;flex-direction:column;align-items:center;gap:10px;padding:34px 24px 22px;}
body.home-premium-polish .premium-hero-icon{width:68px;height:68px;border-radius:50%;background:rgba(255,255,255,.93);color:#3f7f2f;display:flex;align-items:center;justify-content:center;font-size:34px;box-shadow:0 14px 30px rgba(0,0,0,.18);}
body.home-premium-polish .premium-hero-title{font-size:34px;font-weight:900;letter-spacing:-.055em;line-height:1;margin-top:4px;text-shadow:0 4px 18px rgba(0,0,0,.35);}
body.home-premium-polish .premium-hero-sub{font-size:19px;font-weight:650;line-height:1.25;max-width:330px;text-shadow:0 3px 14px rgba(0,0,0,.35);}
body.home-premium-polish .premium-hero-cta{margin-top:8px;border:0;border-radius:999px;background:rgba(255,255,255,.96);color:#2f7f28;font-size:17px;font-weight:850;padding:14px 28px;box-shadow:0 16px 34px rgba(0,0,0,.20);}
body.home-premium-polish .premium-hero-nav{position:absolute;z-index:5;top:50%;transform:translateY(-50%);width:52px;height:52px;border-radius:50%;border:0;background:rgba(255,255,255,.94);color:#111827;font-size:34px;font-weight:900;box-shadow:0 12px 28px rgba(0,0,0,.18);}
body.home-premium-polish .premium-hero-prev{left:18px}.premium-hero-next{right:18px}
body.home-premium-polish .premium-hero-dots{position:absolute;z-index:6;left:0;right:0;bottom:14px;display:flex;justify-content:center;gap:7px;}
body.home-premium-polish .premium-hero-dots span{width:7px;height:7px;border-radius:999px;background:rgba(255,255,255,.54);transition:all .18s ease;}
body.home-premium-polish .premium-hero-dots span.active{width:22px;background:#fff;}
@media(max-width:430px){body.home-premium-polish .premium-stat-card{min-height:196px!important;border-radius:22px!important}body.home-premium-polish .premium-stat-label{font-size:20px!important;max-width:86px!important}body.home-premium-polish .premium-hero-slide{height:300px!important}.premium-hero-title{font-size:31px!important}}
</style>

<script id="premium-home-polish-js">
(function(){
  if(window.__premiumHomePolish)return;window.__premiumHomePolish=1;
  var statImages=[
    'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=500&q=80',
    'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=500&q=80',
    'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=500&q=80'
  ];
  var heroSlides=[
    {title:'Recepten',sub:'Ontdek heerlijke recepten voor elke gelegenheid',icon:'🌿',cta:'Bekijk recepten',img:'https://images.unsplash.com/photo-1543353071-873f17a7a088?auto=format&fit=crop&w=900&q=80'},
    {title:'Gezinsquests',sub:'Werk samen aan kleine missies en verdien XP',icon:'⚔️',cta:'Open quests',img:'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80'},
    {title:'Momenten',sub:'Bewaar foto’s, updates en mooie herinneringen',icon:'✨',cta:'Bekijk feed',img:'https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=900&q=80'}
  ];
  function isHome(){var title=document.querySelector('.header-title');return title&&/FamilieApp|Home/i.test(title.textContent||'')}
  function activeScreen(){return document.querySelector('.screen.active')||document.body}
  function findStatCards(root){
    var nodes=Array.from(root.querySelectorAll('button, a, .card, div'));
    return nodes.filter(function(el){
      var t=(el.textContent||'').replace(/\s+/g,' ').trim().toLowerCase();
      return (/\b\d+\s*taken\b/.test(t)||/\b\d+\s*boodschapp/.test(t)||/\b\d+\s*posts?\b/.test(t))&&el.offsetWidth>70&&el.offsetHeight>90;
    }).slice(0,3);
  }
  function polishStats(root){
    var cards=findStatCards(root); if(cards.length<3)return;
    var data=[{n:'5',label:'taken',icon:'📝'},{n:'4',label:'boodschappen',icon:'🛒'},{n:'2',label:'posts',icon:'💬'}];
    cards.forEach(function(card,i){
      if(card.dataset.premiumStat==='1')return;
      card.dataset.premiumStat='1';
      card.classList.add('premium-stat-card');
      card.style.setProperty('--premium-img','url('+statImages[i]+')');
      card.innerHTML='<span class="premium-stat-icon">'+data[i].icon+'</span><span class="premium-stat-number">'+data[i].n+'</span><span class="premium-stat-label">'+data[i].label+'</span><span class="premium-stat-arrow">→</span>';
    });
  }
  function findHero(root){
    var nodes=Array.from(root.querySelectorAll('section, article, div'));
    return nodes.find(function(el){
      var t=(el.textContent||'').toLowerCase();
      return t.includes('recepten')&&t.includes('bekijk')&&el.offsetHeight>180&&el.offsetWidth>250;
    });
  }
  function buildCarousel(root){
    var old=findHero(root); if(!old||old.dataset.premiumHero==='1')return;
    old.dataset.premiumHero='1';
    old.className=(old.className||'')+' premium-hero-carousel';
    old.innerHTML='<button class="premium-hero-nav premium-hero-prev" type="button">‹</button><div class="premium-hero-track">'+heroSlides.map(function(s){return '<section class="premium-hero-slide" style="background-image:url('+s.img+')"><div class="premium-hero-content"><div class="premium-hero-icon">'+s.icon+'</div><div class="premium-hero-title">'+s.title+'</div><div class="premium-hero-sub">'+s.sub+'</div><button class="premium-hero-cta" type="button">'+s.cta+' →</button></div></section>'}).join('')+'</div><button class="premium-hero-nav premium-hero-next" type="button">›</button><div class="premium-hero-dots">'+heroSlides.map(function(_,i){return '<span class="'+(i===0?'active':'')+'"></span>'}).join('')+'</div>';
    var track=old.querySelector('.premium-hero-track');var dots=Array.from(old.querySelectorAll('.premium-hero-dots span'));
    function go(dir){track.scrollBy({left:dir*track.clientWidth,behavior:'smooth'});}
    old.querySelector('.premium-hero-prev').onclick=function(e){e.stopPropagation();go(-1)};
    old.querySelector('.premium-hero-next').onclick=function(e){e.stopPropagation();go(1)};
    track.addEventListener('scroll',function(){var idx=Math.round(track.scrollLeft/Math.max(1,track.clientWidth));dots.forEach(function(d,i){d.classList.toggle('active',i===idx)});},{passive:true});
  }
  function apply(){
    var on=isHome();document.body.classList.toggle('home-premium-polish',!!on);if(!on)return;
    var root=activeScreen();polishStats(root);buildCarousel(root);
  }
  window.addEventListener('load',function(){[120,350,750,1300,2200].forEach(function(d){setTimeout(apply,d)})});
  document.addEventListener('click',function(){setTimeout(apply,120);setTimeout(apply,500)},true);
  setInterval(apply,1000);
})();
</script>

<style id="premium-grocery-bg-css">
body.groceries-premium{background:#f8faf6!important;scrollbar-width:none;}
body.groceries-premium::-webkit-scrollbar{display:none;}
body.groceries-premium .screen.active{position:relative;overflow:hidden;background:transparent!important;}
body.groceries-premium .screen.active>*{position:relative;z-index:2;}
body.groceries-premium .screen.active::before{content:"";position:fixed;inset:0;max-width:480px;margin:auto;pointer-events:none;z-index:0;background-repeat:no-repeat;background-size:cover;}
body.groceries-premium .screen.active::after{content:"";position:fixed;inset:0;max-width:480px;margin:auto;pointer-events:none;z-index:1;background:linear-gradient(180deg,rgba(255,255,255,.58) 0%,rgba(255,255,255,.42) 42%,rgba(255,255,255,.78) 100%);}
body.groceries-premium[data-shop-bg="leaf"] .screen.active::before{background-image:url('/backgrounds/leaf.webp');background-position:center center;}
body.groceries-premium[data-shop-bg="cream"] .screen.active::before{background-image:url('/backgrounds/cream.webp');background-position:center bottom;}
body.groceries-premium[data-shop-bg="beige"] .screen.active::before{background-image:url('/backgrounds/beige.webp');background-position:center bottom;}
body.groceries-premium[data-shop-bg="marble"] .screen.active::before{background-image:url('/backgrounds/marble.webp');background-position:center center;}
body.groceries-premium[data-shop-bg="cream"] .screen.active::after{background:linear-gradient(180deg,rgba(255,255,255,.50) 0%,rgba(255,255,255,.34) 45%,rgba(255,255,255,.72) 100%);}
body.groceries-premium[data-shop-bg="leaf"] .screen.active::after{background:linear-gradient(180deg,rgba(255,255,255,.56) 0%,rgba(255,255,255,.38) 45%,rgba(255,255,255,.76) 100%);}
body.groceries-premium[data-shop-bg="beige"] .screen.active::after{background:linear-gradient(180deg,rgba(255,255,255,.52) 0%,rgba(255,255,255,.34) 46%,rgba(255,255,255,.74) 100%);}
body.groceries-premium[data-shop-bg="marble"] .screen.active::after{background:linear-gradient(180deg,rgba(255,255,255,.62) 0%,rgba(255,255,255,.46) 45%,rgba(255,255,255,.82) 100%);}
body.groceries-premium .app-header,body.groceries-premium .bottom-nav{background:rgba(255,255,255,.74)!important;backdrop-filter:blur(24px) saturate(1.25);-webkit-backdrop-filter:blur(24px) saturate(1.25);border-color:rgba(255,255,255,.64)!important;box-shadow:0 12px 34px rgba(31,41,51,.045);}
body.groceries-premium .shop-cols,body.groceries-premium .task-content{background:transparent!important;}
body.groceries-premium .shop-col{background:rgba(255,255,255,.18)!important;border-right-color:rgba(255,255,255,.48)!important;backdrop-filter:blur(4px) saturate(1.08);-webkit-backdrop-filter:blur(4px) saturate(1.08);}
body.groceries-premium .shop-col-head{background:rgba(255,255,255,.58)!important;border-bottom-color:rgba(255,255,255,.56)!important;backdrop-filter:blur(18px) saturate(1.18);-webkit-backdrop-filter:blur(18px) saturate(1.18);}
body.groceries-premium .shop-col-head.done-head{background:rgba(236,248,232,.62)!important;}
body.groceries-premium .shop-item{background:rgba(255,255,255,.34)!important;border-bottom-color:rgba(255,255,255,.50)!important;backdrop-filter:blur(10px) saturate(1.08);-webkit-backdrop-filter:blur(10px) saturate(1.08);box-shadow:inset 0 1px 0 rgba(255,255,255,.38);}
body.groceries-premium .shop-emoji{background:rgba(255,255,255,.74)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.9),0 8px 20px rgba(31,41,51,.06);}
body.groceries-premium .add-btn{box-shadow:0 12px 28px rgba(63,127,47,.25),inset 0 1px 0 rgba(255,255,255,.24);}
body.groceries-premium .premium-bg-switcher{position:fixed;right:14px;bottom:120px;z-index:40;display:flex;gap:6px;padding:7px;border-radius:999px;background:rgba(255,255,255,.72);box-shadow:0 14px 34px rgba(30,41,59,.10);backdrop-filter:blur(18px) saturate(1.2);-webkit-backdrop-filter:blur(18px) saturate(1.2);}
body:not(.groceries-premium) .premium-bg-switcher{display:none!important;}
.premium-bg-dot{width:18px;height:18px;border-radius:50%;border:0;box-shadow:inset 0 1px 0 rgba(255,255,255,.6);}
.premium-bg-dot.active{outline:2px solid #3f7f2f;outline-offset:2px;}
.premium-bg-dot[data-bg="cream"]{background:linear-gradient(135deg,#fff7e9,#e9d2a8);}
.premium-bg-dot[data-bg="leaf"]{background:linear-gradient(135deg,#f7fff4,#a9caa0);}
.premium-bg-dot[data-bg="beige"]{background:linear-gradient(135deg,#f8ead6,#b89973);}
.premium-bg-dot[data-bg="marble"]{background:linear-gradient(135deg,#f7fbff,#b7d2e3);}
</style>

<script>
(function(){
  if(window.__premiumGroceryBg)return;window.__premiumGroceryBg=1;
  var variants=['cream','leaf','beige','marble'];
  function current(){return localStorage.getItem('familyapp-shop-bg')||'cream'}
  function groceries(){var h=document.querySelector('.header-title');return h&&/boodschappen/i.test(h.textContent||'')}
  function apply(){var on=groceries();document.body.classList.toggle('groceries-premium',on);if(on){document.body.dataset.shopBg=current();switcher()}else{document.body.removeAttribute('data-shop-bg')}}
  function switcher(){var s=document.querySelector('.premium-bg-switcher');if(!s){s=document.createElement('div');s.className='premium-bg-switcher';variants.forEach(function(v){var b=document.createElement('button');b.type='button';b.className='premium-bg-dot';b.dataset.bg=v;b.onclick=function(e){e.preventDefault();e.stopPropagation();localStorage.setItem('familyapp-shop-bg',v);apply()};s.appendChild(b)});document.body.appendChild(s)}[].forEach.call(s.children,function(el){el.classList.toggle('active',el.dataset.bg===current())})}
  window.addEventListener('load',function(){for(var i=0;i<12;i++)setTimeout(apply,i*160)});
  document.addEventListener('click',function(){setTimeout(apply,80);setTimeout(apply,240)},true);
  setInterval(apply,700);
})();
</script>
`;

    if (!html.includes("modern-bridge-loader")) {
      html = html.replace("</head>", injection + "</head>");
    }

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "no-store, max-age=0");
    res.status(200).send(html);
  } catch (error) {
    res.status(500).send("FamilyApp loader error: " + (error && error.message ? error.message : String(error)));
  }
};