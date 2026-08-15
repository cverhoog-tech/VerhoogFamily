'use strict';
(function(){
  if(window.__uiConsistencyPolish20260815)return;
  window.__uiConsistencyPolish20260815=true;

  function installCss(){
    if(document.getElementById('ui-consistency-polish-20260815'))return;
    var s=document.createElement('style');s.id='ui-consistency-polish-20260815';s.textContent=`
      :root{
        --surface-primary:var(--c-surface);
        --surface-secondary:var(--c-surface2);
        --surface-elevated:var(--c-surface);
        --surface-muted:var(--c-surface2);
        --text-primary:var(--c-text);
        --text-secondary:var(--c-text2);
        --text-muted:var(--c-text3);
        --border-subtle:var(--c-border);
        --shadow-card:0 10px 28px rgba(17,24,39,.08);
        --accent-primary:#6d28d9;
        --accent-soft:rgba(109,40,217,.12);
      }
      [data-theme*="dark"]{
        --surface-primary:#11131f;
        --surface-secondary:#181b2a;
        --surface-elevated:#1d2031;
        --surface-muted:#151827;
        --text-primary:#f6f4ff;
        --text-secondary:#b5b3c7;
        --text-muted:#77768c;
        --border-subtle:rgba(255,255,255,.085);
        --shadow-card:0 14px 34px rgba(0,0,0,.28);
        --accent-soft:rgba(139,92,246,.16);
      }

      /* Achievements: same premium family as Taken */
      #screen-achievements{background:linear-gradient(180deg,#f8f7fb,#fff)}
      #screen-achievements #ach-content{padding-bottom:22px}
      #screen-achievements .ach-banner{margin:14px 14px 18px;border-radius:24px;padding:22px 18px;background:radial-gradient(circle at 78% 18%,rgba(196,181,253,.25),transparent 32%),linear-gradient(135deg,#171329,#3a1f64 54%,#151828);box-shadow:0 18px 38px rgba(45,24,76,.22);border:1px solid rgba(255,255,255,.12);text-align:left;min-height:190px}
      #screen-achievements .ach-level-ring{margin:0 0 12px;width:70px;height:70px;background:linear-gradient(180deg,#5b21b6,#2b114f);border:1px solid #f0c96d;box-shadow:0 9px 22px rgba(0,0,0,.24)}
      #screen-achievements .ach-title{font-size:21px;font-weight:950;letter-spacing:-.02em}
      #screen-achievements .ach-subtitle{max-width:330px;font-size:12px;line-height:1.45}
      #screen-achievements .ach-xp-bar{height:8px;border-radius:999px;background:rgba(255,255,255,.14);overflow:hidden;margin-top:15px}
      #screen-achievements .ach-xp-fill{height:100%;border-radius:999px;background:linear-gradient(90deg,#7c3aed,#c084fc,#ede9fe);box-shadow:0 0 12px rgba(192,132,252,.5)}
      #screen-achievements .ach-xp-txt{font-size:10px;color:rgba(255,255,255,.67);margin-top:6px}
      #screen-achievements .ach-section-title{padding:0 16px;margin:20px 0 9px;font-size:12px;font-weight:950;letter-spacing:.075em;text-transform:uppercase;color:#4a4657}
      #screen-achievements .streak-bar{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;padding:0 14px}
      #screen-achievements .streak-card{min-width:0;border-radius:16px;padding:12px 5px;background:linear-gradient(180deg,#fff,#faf9fc);border:1px solid rgba(43,36,58,.08);box-shadow:0 8px 18px rgba(22,18,35,.05)}
      #screen-achievements .streak-fire{font-size:18px}.streak-num{font-weight:950!important}.streak-lbl{font-size:8.5px!important}
      #screen-achievements .lb-item{margin:0 14px 9px;border-radius:16px;border:1px solid rgba(43,36,58,.08);box-shadow:0 7px 18px rgba(22,18,35,.05);background:#fff;padding:11px 12px}
      #screen-achievements .badge-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px;padding:0 14px}
      #screen-achievements .badge-card{min-height:126px;border-radius:17px;padding:13px 8px;background:linear-gradient(180deg,#fff,#faf9fc);border:1px solid rgba(43,36,58,.08);box-shadow:0 8px 18px rgba(22,18,35,.055);position:relative;overflow:hidden}
      #screen-achievements .badge-card.unlocked{border-color:rgba(124,58,237,.20)}
      #screen-achievements .badge-card.locked{filter:none;opacity:.52;background:#f4f3f7}
      #screen-achievements .badge-icon-wrap{width:48px;height:48px;border-radius:14px;margin:0 auto 9px;display:grid;place-items:center;font-size:24px;background:linear-gradient(145deg,#5b248a,#26143d);box-shadow:inset 0 1px 0 rgba(255,255,255,.12)}
      #screen-achievements .badge-card.locked .badge-icon-wrap{filter:grayscale(1);opacity:.55}
      #screen-achievements .badge-name{font-size:10.5px;font-weight:900;line-height:1.2}
      #screen-achievements .badge-rarity{font-size:8px;margin-top:5px;font-weight:800}

      /* Home dark mode: keep depth, no flat black inversion */
      [data-theme*="dark"] #screen-home{background:radial-gradient(80% 35% at 50% 0%,rgba(72,43,117,.17),transparent 70%),#0b0d15;color:var(--text-primary)}
      [data-theme*="dark"] #screen-home .home-hero h1,[data-theme*="dark"] #screen-home .home-day,[data-theme*="dark"] #screen-home .home-section-label{color:var(--text-primary)}
      [data-theme*="dark"] #screen-home .home-day{color:var(--text-secondary)}
      [data-theme*="dark"] #screen-home .home-xp-minimal{background:rgba(17,19,31,.72);border:1px solid var(--border-subtle);border-radius:14px;margin:0 14px 12px;padding:9px 11px}
      [data-theme*="dark"] #screen-home .home-xp-bar-min{background:rgba(255,255,255,.10)}
      [data-theme*="dark"] #screen-home .home-xp-label-min,[data-theme*="dark"] #screen-home .home-xp-pts-min{color:var(--text-secondary)}
      [data-theme*="dark"] #screen-home .epic-card,[data-theme*="dark"] #screen-home .premium-stat-card-v2{border-color:rgba(255,255,255,.10);box-shadow:0 12px 28px rgba(0,0,0,.30)}
      [data-theme*="dark"] #screen-home .card-number,[data-theme*="dark"] #screen-home .card-label,[data-theme*="dark"] #screen-home .premium-stat-number-v2,[data-theme*="dark"] #screen-home .premium-stat-label-v2{color:#fff}
      [data-theme*="dark"] #screen-home .home-activity-section{background:transparent}
      [data-theme*="dark"] #screen-home #activity-list>.activity-item,[data-theme*="dark"] #screen-home #activity-list>.card{background:var(--surface-elevated);border-color:var(--border-subtle);box-shadow:var(--shadow-card)}

      /* Shop dark mode: explicit hierarchy */
      [data-theme*="dark"] #screen-shop{background:#0b0d15;color:var(--text-primary)}
      [data-theme*="dark"] #screen-shop .list-header{background:#0b0d15;border-bottom-color:var(--border-subtle)}
      [data-theme*="dark"] #screen-shop .list-header h2{color:var(--text-primary)}
      [data-theme*="dark"] #screen-shop .shop-cols{background:#0b0d15}
      [data-theme*="dark"] #screen-shop .shop-col{background:var(--surface-primary);border-color:var(--border-subtle);box-shadow:0 10px 28px rgba(0,0,0,.20)}
      [data-theme*="dark"] #screen-shop .shop-col-head{background:var(--surface-secondary);color:var(--text-primary);border-bottom-color:var(--border-subtle)}
      [data-theme*="dark"] #screen-shop .shop-item{background:var(--surface-primary);border-bottom-color:var(--border-subtle)}
      [data-theme*="dark"] #screen-shop .shop-item:hover{background:var(--surface-secondary)}
      [data-theme*="dark"] #screen-shop .shop-emoji{background:linear-gradient(145deg,#25283a,#191b29);border:1px solid rgba(255,255,255,.06)}
      [data-theme*="dark"] #screen-shop .shop-name{color:var(--text-primary)}
      [data-theme*="dark"] #screen-shop .shop-name.done{color:var(--text-muted)}
      [data-theme*="dark"] #screen-shop .shop-qty{color:var(--text-secondary)}
      [data-theme*="dark"] #screen-shop .shop-del,[data-theme*="dark"] #screen-shop .reset-btn{color:var(--text-muted)}
      [data-theme*="dark"] #screen-shop .shop-badge{background:rgba(139,92,246,.16);color:#d8c8ff;border:1px solid rgba(139,92,246,.22)}

      [data-theme*="dark"] #screen-achievements{background:radial-gradient(80% 35% at 50% 0%,rgba(87,43,139,.18),transparent 70%),#090b13}
      [data-theme*="dark"] #screen-achievements .ach-section-title{color:rgba(247,245,255,.72)}
      [data-theme*="dark"] #screen-achievements .streak-card,[data-theme*="dark"] #screen-achievements .lb-item,[data-theme*="dark"] #screen-achievements .badge-card{background:linear-gradient(180deg,#171a29,#10121d);border-color:rgba(255,255,255,.085);box-shadow:0 10px 24px rgba(0,0,0,.22);color:#f7f5ff}
      [data-theme*="dark"] #screen-achievements .badge-card.locked{background:#11131d;opacity:.48}
      [data-theme*="dark"] #screen-achievements .lb-name,[data-theme*="dark"] #screen-achievements .streak-num,[data-theme*="dark"] #screen-achievements .badge-name{color:#f7f5ff}
      [data-theme*="dark"] #screen-achievements .lb-level,[data-theme*="dark"] #screen-achievements .streak-lbl{color:#aaa8bb}
      @media(max-width:370px){#screen-achievements .badge-grid{gap:7px;padding:0 10px}#screen-achievements .streak-bar{gap:6px;padding:0 10px}}
    `;document.head.appendChild(s);
  }

  function markAchievements(){
    var el=document.getElementById('ach-content');if(!el)return;
    el.classList.add('ach-premium-runtime');
    Array.prototype.forEach.call(el.querySelectorAll('.badge-card.locked .badge-rarity'),function(x){if((x.textContent||'').trim()==='???')x.textContent='Vergrendeld';});
  }

  function wrapRenderAch(){
    if(typeof window.renderAch!=='function'||window.renderAch.__premiumWrapped)return;
    var original=window.renderAch;
    var wrapped=function(){var out=original.apply(this,arguments);setTimeout(markAchievements,0);return out;};
    wrapped.__premiumWrapped=true;window.renderAch=wrapped;
  }

  installCss();wrapRenderAch();
  window.addEventListener('load',function(){installCss();wrapRenderAch();setTimeout(markAchievements,300);});
  document.addEventListener('click',function(){setTimeout(function(){wrapRenderAch();markAchievements();},60);},true);
})();
