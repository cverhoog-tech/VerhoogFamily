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

<style id="premium-grocery-bg-css">
body.groceries-premium{
  background:#f5f8f2 !important;
  scrollbar-width:none;
}
body.groceries-premium::-webkit-scrollbar{display:none;}
body.groceries-premium .screen.active{
  position:relative;
  overflow:hidden;
  background:transparent !important;
}
body.groceries-premium .screen.active::before{
  content:"";
  position:fixed;
  inset:0;
  max-width:480px;
  margin:auto;
  pointer-events:none;
  z-index:0;
  opacity:1;
}
body.groceries-premium .screen.active::after{
  content:"";
  position:fixed;
  inset:0;
  max-width:480px;
  margin:auto;
  pointer-events:none;
  z-index:0;
  opacity:.72;
  filter:blur(10px);
}
body.groceries-premium .screen.active>*{
  position:relative;
  z-index:1;
}

body.groceries-premium[data-shop-bg="leaf"] .screen.active::before{
  background:
    linear-gradient(180deg,rgba(255,255,255,.62) 0%,rgba(255,255,255,.36) 48%,rgba(255,255,255,.78) 100%),
    radial-gradient(circle at 88% 16%,rgba(72,122,62,.22),transparent 30%),
    radial-gradient(circle at 6% 78%,rgba(98,139,84,.20),transparent 29%),
    linear-gradient(135deg,#f9fcf6 0%,#e4f1e1 100%);
}
body.groceries-premium[data-shop-bg="leaf"] .screen.active::after{
  background:
    radial-gradient(ellipse at 103% 35%,rgba(46,91,44,.42) 0 8%,transparent 24%),
    radial-gradient(ellipse at 104% 51%,rgba(61,107,57,.35) 0 10%,transparent 27%),
    radial-gradient(ellipse at 96% 66%,rgba(83,126,70,.24) 0 9%,transparent 25%),
    radial-gradient(ellipse at -4% 82%,rgba(105,140,90,.24) 0 10%,transparent 26%);
}

body.groceries-premium[data-shop-bg="cream"] .screen.active::before{
  background:
    linear-gradient(180deg,rgba(255,255,255,.62) 0%,rgba(255,255,255,.38) 50%,rgba(255,255,255,.80) 100%),
    radial-gradient(circle at 20% 83%,rgba(226,190,123,.42),transparent 25%),
    radial-gradient(circle at 82% 18%,rgba(239,218,177,.34),transparent 33%),
    linear-gradient(140deg,#fffdf8 0%,#f3e6cf 100%);
}
body.groceries-premium[data-shop-bg="cream"] .screen.active::after{
  background:
    radial-gradient(ellipse at 12% 84%,rgba(120,150,104,.30) 0 7%,transparent 24%),
    radial-gradient(ellipse at 24% 90%,rgba(122,142,97,.20) 0 8%,transparent 25%),
    radial-gradient(ellipse at 74% 86%,rgba(217,178,91,.25) 0 11%,transparent 29%);
}

body.groceries-premium[data-shop-bg="beige"] .screen.active::before{
  background:
    linear-gradient(180deg,rgba(255,255,255,.56) 0%,rgba(255,255,255,.34) 48%,rgba(255,255,255,.76) 100%),
    linear-gradient(180deg,transparent 0 75%,rgba(196,151,92,.32) 75% 88%,rgba(255,255,255,.62) 100%),
    radial-gradient(circle at 72% 18%,rgba(213,175,119,.32),transparent 30%),
    linear-gradient(140deg,#fbf2e4 0%,#ead9c2 100%);
}
body.groceries-premium[data-shop-bg="beige"] .screen.active::after{
  background:
    radial-gradient(ellipse at 86% 69%,rgba(82,111,72,.35) 0 7%,transparent 24%),
    radial-gradient(ellipse at 94% 78%,rgba(82,107,72,.30) 0 8%,transparent 25%),
    radial-gradient(ellipse at 82% 88%,rgba(118,88,58,.22) 0 11%,transparent 29%);
}

body.groceries-premium[data-shop-bg="marble"] .screen.active::before{
  background:
    linear-gradient(180deg,rgba(255,255,255,.62) 0%,rgba(255,255,255,.38) 48%,rgba(255,255,255,.80) 100%),
    radial-gradient(circle at 88% 18%,rgba(124,168,198,.28),transparent 31%),
    radial-gradient(circle at 10% 82%,rgba(146,184,210,.24),transparent 30%),
    linear-gradient(135deg,#f9fcff 0%,#dfeef7 100%);
}
body.groceries-premium[data-shop-bg="marble"] .screen.active::after{
  opacity:.52;
  filter:blur(7px);
  background:
    linear-gradient(123deg,transparent 0 35%,rgba(102,145,176,.28) 36%,transparent 38% 100%),
    linear-gradient(151deg,transparent 0 62%,rgba(159,190,211,.24) 63%,transparent 65% 100%),
    radial-gradient(ellipse at 87% 83%,rgba(94,126,148,.30) 0 10%,transparent 29%);
}

body.groceries-premium .app-header,
body.groceries-premium .bottom-nav{
  background:rgba(255,255,255,.74) !important;
  backdrop-filter:blur(22px) saturate(1.22);
  -webkit-backdrop-filter:blur(22px) saturate(1.22);
  border-color:rgba(255,255,255,.60) !important;
}
body.groceries-premium .shop-cols,
body.groceries-premium .task-content{
  background:transparent !important;
}
body.groceries-premium .shop-col{
  background:rgba(255,255,255,.18) !important;
  border-right-color:rgba(255,255,255,.45) !important;
  backdrop-filter:blur(8px) saturate(1.08);
  -webkit-backdrop-filter:blur(8px) saturate(1.08);
}
body.groceries-premium .shop-col-head{
  background:rgba(255,255,255,.54) !important;
  border-bottom-color:rgba(255,255,255,.52) !important;
  backdrop-filter:blur(18px) saturate(1.16);
  -webkit-backdrop-filter:blur(18px) saturate(1.16);
}
body.groceries-premium .shop-col-head.done-head{
  background:rgba(238,248,232,.60) !important;
}
body.groceries-premium .shop-item{
  background:rgba(255,255,255,.36) !important;
  border-bottom-color:rgba(255,255,255,.48) !important;
}
body.groceries-premium .shop-emoji{
  background:rgba(255,255,255,.70) !important;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.85),0 8px 20px rgba(31,41,51,.06);
}
body.groceries-premium .add-btn{
  box-shadow:0 12px 28px rgba(63,127,47,.25),inset 0 1px 0 rgba(255,255,255,.24);
}
body.groceries-premium .premium-bg-switcher{
  position:fixed;
  right:14px;
  bottom:120px;
  z-index:40;
  display:flex;
  gap:6px;
  padding:7px;
  border-radius:999px;
  background:rgba(255,255,255,.70);
  box-shadow:0 14px 34px rgba(30,41,59,.10);
  backdrop-filter:blur(18px) saturate(1.2);
  -webkit-backdrop-filter:blur(18px) saturate(1.2);
}
body:not(.groceries-premium) .premium-bg-switcher{display:none!important;}
.premium-bg-dot{width:18px;height:18px;border-radius:50%;border:0;box-shadow:inset 0 1px 0 rgba(255,255,255,.6);}
.premium-bg-dot.active{outline:2px solid #3f7f2f;outline-offset:2px;}
.premium-bg-dot[data-bg="leaf"]{background:linear-gradient(135deg,#f7fff4,#a9caa0);}
.premium-bg-dot[data-bg="cream"]{background:linear-gradient(135deg,#fff7e9,#e9d2a8);}
.premium-bg-dot[data-bg="beige"]{background:linear-gradient(135deg,#f8ead6,#b89973);}
.premium-bg-dot[data-bg="marble"]{background:linear-gradient(135deg,#f7fbff,#b7d2e3);}
</style>

<script>
(function(){
  if(window.__premiumGroceryBg)return;
  window.__premiumGroceryBg=1;
  var variants=['leaf','cream','beige','marble'];
  function current(){return localStorage.getItem('familyapp-shop-bg')||'leaf'}
  function groceries(){var h=document.querySelector('.header-title');return h&&/boodschappen/i.test(h.textContent||'')}
  function apply(){
    var on=groceries();
    document.body.classList.toggle('groceries-premium',on);
    if(on){document.body.dataset.shopBg=current();switcher()}else{document.body.removeAttribute('data-shop-bg')}
  }
  function switcher(){
    var s=document.querySelector('.premium-bg-switcher');
    if(!s){
      s=document.createElement('div');s.className='premium-bg-switcher';
      variants.forEach(function(v){var b=document.createElement('button');b.type='button';b.className='premium-bg-dot';b.dataset.bg=v;b.onclick=function(e){e.preventDefault();e.stopPropagation();localStorage.setItem('familyapp-shop-bg',v);apply()};s.appendChild(b)});
      document.body.appendChild(s);
    }
    [].forEach.call(s.children,function(el){el.classList.toggle('active',el.dataset.bg===current())})
  }
  window.addEventListener('load',function(){for(var i=0;i<12;i++)setTimeout(apply,i*160)});
  document.addEventListener('click',function(){setTimeout(apply,80);setTimeout(apply,240)},true);
  setInterval(apply,700);
})();
</script>
`;

    if (!html.includes("premium-grocery-bg-css")) {
      html = html.replace("</head>", injection + "</head>");
    }

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "no-store, max-age=0");
    res.status(200).send(html);
  } catch (error) {
    res.status(500).send("FamilyApp loader error: " + (error && error.message ? error.message : String(error)));
  }
};