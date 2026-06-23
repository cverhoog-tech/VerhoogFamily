'use strict';
// ============================================================
// HERO CARD RENDERER v0.346
// Cinematic calm-ui hero cards for active group quests.
// ============================================================

(function(){
  var VERSION = '0.346';

  var RARITY = {
    common: {
      bg: 'linear-gradient(135deg,#294936 0%,#3f7f2f 60%,#6bb657 100%)',
      glow: 'rgba(63,127,47,.28)'
    },
    rare: {
      bg: 'linear-gradient(135deg,#16345e 0%,#2563eb 55%,#60a5fa 100%)',
      glow: 'rgba(37,99,235,.30)'
    },
    epic: {
      bg: 'linear-gradient(135deg,#3b1361 0%,#7c3aed 58%,#c084fc 100%)',
      glow: 'rgba(124,58,237,.34)'
    },
    legendary: {
      bg: 'linear-gradient(135deg,#4a2408 0%,#f59e0b 55%,#fde68a 100%)',
      glow: 'rgba(245,158,11,.34)'
    }
  };

  function escapeHtml(v){
    return String(v || '')
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/\"/g,'&quot;')
      .replace(/'/g,'&#039;');
  }

  function renderMembers(list){
    return (list || []).slice(0,4).map(function(m, i){
      return '<div style="width:34px;height:34px;border-radius:50%;margin-left:'+(i?'-8px':'0')+';background:rgba(255,255,255,.18);backdrop-filter:blur(10px);border:2px solid rgba(255,255,255,.28);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:900;color:#fff">'+escapeHtml(m)+'</div>';
    }).join('');
  }

  function renderCard(card, index){
    var rarity = RARITY[card.rarity] || RARITY.common;
    var progress = Math.max(0, Math.min(100, Number(card.progress || 0)));

    return '<article class="hero-quest-card rarity-'+escapeHtml(card.rarity)+'" data-hero-card="'+escapeHtml(card.id)+'" style="position:relative;flex:0 0 88%;min-height:240px;border-radius:30px;overflow:hidden;background:'+rarity.bg+';box-shadow:0 18px 45px '+rarity.glow+', inset 0 1px 0 rgba(255,255,255,.18);padding:22px;color:#fff;scroll-snap-align:center">'
      +'<div style="position:absolute;inset:0;background:radial-gradient(circle at top right,rgba(255,255,255,.22),transparent 36%),radial-gradient(circle at bottom left,rgba(255,255,255,.14),transparent 32%)"></div>'
      +'<div style="position:relative;z-index:2;height:100%;display:flex;flex-direction:column">'
      +'<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px">'
      +'<div>'
      +'<div style="display:inline-flex;align-items:center;gap:7px;height:32px;padding:0 13px;border-radius:999px;background:rgba(255,255,255,.16);backdrop-filter:blur(10px);font-size:12px;font-weight:900;letter-spacing:.03em;text-transform:uppercase">'
      +'<span>'+escapeHtml(card.emoji || '⚔️')+'</span>'
      +'<span>'+escapeHtml(card.difficulty || 'Quest')+'</span>'
      +'</div>'
      +'<h2 style="margin:16px 0 8px;font-size:29px;line-height:1.05;font-weight:950;letter-spacing:-.03em;max-width:88%">'+escapeHtml(card.title)+'</h2>'
      +'<p style="margin:0;font-size:14px;line-height:1.45;max-width:92%;color:rgba(255,255,255,.86)">'+escapeHtml(card.subtitle || '')+'</p>'
      +'</div>'
      +'<div style="font-size:58px;line-height:1;filter:drop-shadow(0 8px 18px rgba(0,0,0,.18))">'+escapeHtml(card.emoji || '✨')+'</div>'
      +'</div>'

      +'<div style="margin-top:auto">'
      +'<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:10px">'
      +'<div style="display:flex;align-items:center">'+renderMembers(card.members)+'</div>'
      +'<div style="font-size:12px;font-weight:900;padding:8px 12px;border-radius:999px;background:rgba(255,255,255,.16);backdrop-filter:blur(10px)">'+escapeHtml(card.timeLeft || 'Actief')+'</div>'
      +'</div>'

      +'<div style="height:12px;border-radius:999px;background:rgba(255,255,255,.16);overflow:hidden;backdrop-filter:blur(10px)">'
      +'<div style="height:100%;width:'+progress+'%;border-radius:999px;background:linear-gradient(90deg,rgba(255,255,255,.95),rgba(255,255,255,.72));transition:width .45s ease"></div>'
      +'</div>'

      +'<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:12px">'
      +'<div>'
      +'<div style="font-size:11px;font-weight:800;opacity:.72;text-transform:uppercase;letter-spacing:.06em">Reward</div>'
      +'<div style="margin-top:4px;font-size:16px;font-weight:950">'+escapeHtml(card.reward || '+XP')+'</div>'
      +'</div>'
      +'<button type="button" style="height:46px;padding:0 18px;border:0;border-radius:16px;background:rgba(255,255,255,.16);backdrop-filter:blur(12px);color:#fff;font-size:14px;font-weight:900;box-shadow:inset 0 0 0 1px rgba(255,255,255,.16)">Open Quest</button>'
      +'</div>'
      +'</div>'
      +'</div>'
      +'</article>';
  }

  window.HeroCardRenderer = {
    version: VERSION,
    renderCard: renderCard
  };
})();
