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
body.groceries-premium{background:#f8faf6!important;scrollbar-width:none;}
body.groceries-premium::-webkit-scrollbar{display:none;}
body.groceries-premium .screen.active{position:relative;overflow:hidden;background:transparent!important;}
body.groceries-premium .screen.active>*{position:relative;z-index:3;}
body.groceries-premium .screen.active::before,
body.groceries-premium .screen.active::after{content:"";position:fixed;inset:0;max-width:480px;margin:auto;pointer-events:none;z-index:0;background-repeat:no-repeat;}
body.groceries-premium .screen.active::before{background-size:cover;}
body.groceries-premium .screen.active::after{z-index:1;opacity:.9;background-size:100% auto;background-position:center bottom 64px;}

body.groceries-premium[data-shop-bg="cream"] .screen.active::before{background:linear-gradient(180deg,rgba(255,255,255,.72) 0%,rgba(255,250,241,.56) 42%,rgba(255,255,255,.86) 100%),radial-gradient(circle at 22% 72%,rgba(231,211,178,.42),transparent 28%),radial-gradient(circle at 82% 18%,rgba(244,228,197,.38),transparent 34%),linear-gradient(145deg,#fffdf8 0%,#f4ead9 100%);}
body.groceries-premium[data-shop-bg="cream"] .screen.active::after{background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='480' height='560' viewBox='0 0 480 560'%3E%3Cg opacity='.22' fill='none' stroke='%2387a37b' stroke-width='4' stroke-linecap='round'%3E%3Cpath d='M28 470 C78 420 70 350 118 300'/%3E%3Cpath d='M55 435 C34 420 34 392 65 388 C86 392 81 420 55 435Z' fill='%2387a37b' stroke='none'/%3E%3Cpath d='M87 390 C62 372 66 342 98 344 C120 352 113 378 87 390Z' fill='%2387a37b' stroke='none'/%3E%3Cpath d='M102 338 C82 314 96 286 126 298 C144 314 130 336 102 338Z' fill='%2387a37b' stroke='none'/%3E%3C/g%3E%3Cg opacity='.26'%3E%3Cellipse cx='320' cy='430' rx='92' ry='42' fill='%23d8b979'/%3E%3Cellipse cx='322' cy='410' rx='78' ry='30' fill='%23fff7df'/%3E%3Ccircle cx='305' cy='388' r='32' fill='%23ecd27c'/%3E%3Cpath d='M282 391 C292 370 319 362 335 380 C320 396 300 402 282 391Z' fill='%23f3df8e'/%3E%3C/g%3E%3C/svg%3E");}

body.groceries-premium[data-shop-bg="leaf"] .screen.active::before{background:linear-gradient(180deg,rgba(255,255,255,.70) 0%,rgba(241,249,239,.46) 44%,rgba(255,255,255,.82) 100%),radial-gradient(circle at 90% 20%,rgba(79,123,68,.18),transparent 30%),linear-gradient(135deg,#f9fcf7 0%,#e5f1e2 100%);}
body.groceries-premium[data-shop-bg="leaf"] .screen.active::after{background-position:right -34px bottom 82px;background-size:330px auto;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='330' height='560' viewBox='0 0 330 560'%3E%3Cg opacity='.34' fill='none' stroke='%236d8f62' stroke-width='9' stroke-linecap='round'%3E%3Cpath d='M210 520 C185 410 208 300 120 214 C76 170 62 110 88 38'/%3E%3Cpath d='M185 435 C128 420 106 368 152 342 C203 333 219 388 185 435Z' fill='%236d8f62' stroke='none'/%3E%3Cpath d='M222 356 C170 334 158 282 208 264 C256 264 266 320 222 356Z' fill='%236d8f62' stroke='none'/%3E%3Cpath d='M146 270 C92 252 76 202 123 180 C172 174 187 228 146 270Z' fill='%236d8f62' stroke='none'/%3E%3Cpath d='M120 174 C76 144 84 92 133 82 C174 94 160 147 120 174Z' fill='%236d8f62' stroke='none'/%3E%3C/g%3E%3C/svg%3E");filter:blur(3px);}

body.groceries-premium[data-shop-bg="beige"] .screen.active::before{background:linear-gradient(180deg,rgba(255,255,255,.66) 0%,rgba(255,249,239,.42) 47%,rgba(255,255,255,.78) 100%),linear-gradient(180deg,transparent 0 76%,rgba(191,144,86,.30) 76% 88%,rgba(255,255,255,.58) 100%),radial-gradient(circle at 70% 18%,rgba(215,185,138,.30),transparent 30%),linear-gradient(140deg,#fbf4e9 0%,#ead9c1 100%);}
body.groceries-premium[data-shop-bg="beige"] .screen.active::after{background-position:right -36px bottom 72px;background-size:265px auto;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='270' height='560' viewBox='0 0 270 560'%3E%3Cg opacity='.40'%3E%3Cellipse cx='178' cy='510' rx='70' ry='18' fill='%23a98b68'/%3E%3Cpath d='M122 350 C138 322 208 322 224 350 L206 510 L140 510 Z' fill='%23c7aa85'/%3E%3Cpath d='M128 358 C145 342 204 342 218 358 C203 378 146 378 128 358Z' fill='%23efe2cf'/%3E%3C/g%3E%3Cg opacity='.34' fill='none' stroke='%236f8764' stroke-width='5' stroke-linecap='round'%3E%3Cpath d='M172 350 C136 280 146 204 116 136'/%3E%3Cpath d='M152 284 C104 266 92 224 132 208 C170 212 182 256 152 284Z' fill='%236f8764' stroke='none'/%3E%3Cpath d='M184 240 C146 222 140 184 178 172 C214 176 218 218 184 240Z' fill='%236f8764' stroke='none'/%3E%3Cpath d='M128 180 C92 158 94 120 134 112 C166 124 158 162 128 180Z' fill='%236f8764' stroke='none'/%3E%3C/g%3E%3C/svg%3E");filter:blur(1.6px);}

body.groceries-premium[data-shop-bg="marble"] .screen.active::before{background:linear-gradient(180deg,rgba(255,255,255,.68) 0%,rgba(239,248,255,.44) 45%,rgba(255,255,255,.82) 100%),radial-gradient(circle at 90% 20%,rgba(124,168,198,.24),transparent 31%),linear-gradient(135deg,#f9fcff 0%,#dfeef7 100%);}
body.groceries-premium[data-shop-bg="marble"] .screen.active::after{background-position:right -45px bottom 70px;background-size:300px auto;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='310' height='560' viewBox='0 0 310 560'%3E%3Cg opacity='.36'%3E%3Cpath d='M-20 390 C82 350 158 380 270 330' stroke='%238bb1ca' stroke-width='4' fill='none'/%3E%3Cpath d='M15 470 C110 410 190 450 330 378' stroke='%23b4cad9' stroke-width='5' fill='none'/%3E%3Cellipse cx='228' cy='455' rx='82' ry='44' fill='%239fb8c9'/%3E%3Cellipse cx='224' cy='438' rx='74' ry='28' fill='%23e7f0f6'/%3E%3Cpath d='M165 420 C206 392 250 390 288 418 C250 445 205 448 165 420Z' fill='%23cfdde6'/%3E%3C/g%3E%3C/svg%3E");filter:blur(1.5px);}

body.groceries-premium .app-header,body.groceries-premium .bottom-nav{background:rgba(255,255,255,.72)!important;backdrop-filter:blur(22px) saturate(1.25);-webkit-backdrop-filter:blur(22px) saturate(1.25);border-color:rgba(255,255,255,.62)!important;box-shadow:0 12px 34px rgba(31,41,51,.04);}
body.groceries-premium .shop-cols,body.groceries-premium .task-content{background:transparent!important;}
body.groceries-premium .shop-col{background:rgba(255,255,255,.16)!important;border-right-color:rgba(255,255,255,.50)!important;backdrop-filter:blur(3px);-webkit-backdrop-filter:blur(3px);}
body.groceries-premium .shop-col-head{background:rgba(255,255,255,.55)!important;border-bottom-color:rgba(255,255,255,.54)!important;backdrop-filter:blur(16px) saturate(1.16);-webkit-backdrop-filter:blur(16px) saturate(1.16);}
body.groceries-premium .shop-col-head.done-head{background:rgba(236,248,232,.58)!important;}
body.groceries-premium .shop-item{background:rgba(255,255,255,.28)!important;border-bottom-color:rgba(255,255,255,.50)!important;}
body.groceries-premium .shop-emoji{background:rgba(255,255,255,.72)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.88),0 8px 20px rgba(31,41,51,.06);}
body.groceries-premium .add-btn{box-shadow:0 12px 28px rgba(63,127,47,.25),inset 0 1px 0 rgba(255,255,255,.24);}
body.groceries-premium .premium-bg-switcher{position:fixed;right:14px;bottom:120px;z-index:40;display:flex;gap:6px;padding:7px;border-radius:999px;background:rgba(255,255,255,.70);box-shadow:0 14px 34px rgba(30,41,59,.10);backdrop-filter:blur(18px) saturate(1.2);-webkit-backdrop-filter:blur(18px) saturate(1.2);}
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