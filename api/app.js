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

<script type="module" id="modern-feed-bridge-loader">
  import { mountLegacyFeedBridge } from '/src/app/legacy-feed-bridge.js';

  function tryModernFeedMount() {
    try {
      mountLegacyFeedBridge();
    } catch (error) {
      console.warn('Modern feed bridge kon niet laden', error);
    }
  }

  window.addEventListener('load', function () {
    setTimeout(tryModernFeedMount, 120);
    setTimeout(tryModernFeedMount, 450);
    setTimeout(tryModernFeedMount, 900);
  });

  document.addEventListener('click', function () {
    setTimeout(tryModernFeedMount, 120);
    setTimeout(tryModernFeedMount, 420);
  }, true);

  setInterval(tryModernFeedMount, 1200);
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

    if (!html.includes("modern-feed-bridge-loader")) {
      html = html.replace("</head>", injection + "</head>");
    }

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "no-store, max-age=0");
    res.status(200).send(html);
  } catch (error) {
    res.status(500).send("FamilyApp loader error: " + (error && error.message ? error.message : String(error)));
  }
};