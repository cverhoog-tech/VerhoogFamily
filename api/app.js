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
  background:#f7faf5 !important;
}
body.groceries-premium::before{
  content:"";
  position:fixed;
  inset:0;
  max-width:480px;
  margin:auto;
  pointer-events:none;
  z-index:-2;
}
body.groceries-premium[data-shop-bg="leaf"]::before{
  background:
    linear-gradient(180deg,rgba(255,255,255,.78),rgba(255,255,255,.88)),
    radial-gradient(circle at 88% 18%,rgba(77,125,62,.12),transparent 30%),
    radial-gradient(circle at 8% 78%,rgba(111,151,96,.12),transparent 28%),
    linear-gradient(135deg,#f8fcf6,#eaf3e8);
}
body.groceries-premium[data-shop-bg="cream"]::before{
  background:
    linear-gradient(180deg,rgba(255,255,255,.80),rgba(255,255,255,.90)),
    radial-gradient(circle at 18% 84%,rgba(233,201,145,.28),transparent 24%),
    linear-gradient(140deg,#fffdf8,#f5ead8);
}
body.groceries-premium[data-shop-bg="beige"]::before{
  background:
    linear-gradient(180deg,rgba(255,255,255,.75),rgba(255,255,255,.88)),
    linear-gradient(180deg,transparent 0 78%,rgba(214,172,113,.20) 78% 88%,rgba(255,255,255,.56) 100%),
    linear-gradient(140deg,#fbf5ea,#eee2d2);
}
body.groceries-premium[data-shop-bg="marble"]::before{
  background:
    linear-gradient(180deg,rgba(255,255,255,.80),rgba(255,255,255,.90)),
    radial-gradient(circle at 88% 18%,rgba(137,178,205,.18),transparent 31%),
    linear-gradient(135deg,#f9fcff,#e8f2f8);
}
body.groceries-premium .app-header,
body.groceries-premium .bottom-nav,
body.groceries-premium .shop-col,
body.groceries-premium .shop-col-head,
body.groceries-premium .shop-item{
  backdrop-filter:blur(18px) saturate(1.15);
  -webkit-backdrop-filter:blur(18px) saturate(1.15);
}
body.groceries-premium .app-header,
body.groceries-premium .bottom-nav{
  background:rgba(255,255,255,.72) !important;
}
body.groceries-premium .shop-item{
  background:rgba(255,255,255,.34);
}
body.groceries-premium .shop-emoji{
  background:rgba(255,255,255,.66) !important;
  box-shadow:0 8px 20px rgba(31,41,51,.05);
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
  background:rgba(255,255,255,.68);
  backdrop-filter:blur(18px);
}
body:not(.groceries-premium) .premium-bg-switcher{display:none!important;}
.premium-bg-dot{
  width:18px;
  height:18px;
  border-radius:50%;
  border:0;
}
.premium-bg-dot.active{outline:2px solid #3f7f2f;outline-offset:2px;}
.premium-bg-dot[data-bg="cream"]{background:linear-gradient(135deg,#fff7e9,#e9d2a8);}
.premium-bg-dot[data-bg="leaf"]{background:linear-gradient(135deg,#f7fff4,#a9caa0);}
.premium-bg-dot[data-bg="beige"]{background:linear-gradient(135deg,#f8ead6,#b89973);}
.premium-bg-dot[data-bg="marble"]{background:linear-gradient(135deg,#f7fbff,#b7d2e3);}
</style>

<script>
(function(){
  if(window.__premiumGroceryBg)return;
  window.__premiumGroceryBg=1;
  var variants=['leaf','cream','beige','marble'];
  function current(){return localStorage.getItem('familyapp-shop-bg')||'leaf'}
  function groceries(){
    var h=document.querySelector('.header-title');
    return h&&/boodschappen/i.test(h.textContent||'');
  }
  function apply(){
    document.body.classList.toggle('groceries-premium',groceries());
    if(groceries()){
      document.body.dataset.shopBg=current();
      switcher();
    }
  }
  function switcher(){
    var s=document.querySelector('.premium-bg-switcher');
    if(!s){
      s=document.createElement('div');
      s.className='premium-bg-switcher';
      variants.forEach(function(v){
        var b=document.createElement('button');
        b.className='premium-bg-dot';
        b.dataset.bg=v;
        b.onclick=function(){localStorage.setItem('familyapp-shop-bg',v);apply()};
        s.appendChild(b);
      });
      document.body.appendChild(s);
    }
    [].forEach.call(s.children,function(el){
      el.classList.toggle('active',el.dataset.bg===current())
    })
  }
  window.addEventListener('load',function(){for(var i=0;i<10;i++)setTimeout(apply,i*160)});
  document.addEventListener('click',function(){setTimeout(apply,120)},true);
  setInterval(apply,800);
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