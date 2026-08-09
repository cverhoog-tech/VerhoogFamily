'use strict';
// ============================================================
// PERSOON TAB — PREMIUM RPG CHARACTER SHEET (v3.1)
// ============================================================
// Enige authoritative renderer voor de Persoon-tab. Bouwt de DOM
// zelf op (geen CSS/DOM-patchlagen erbovenop) en gebruikt uitsluitend
// bestaande, echte app-data:
//   - myXP / partnerXP, getLevel(), LEVEL_TITLES, LEVEL_XP
//   - recurData (streaks), fam_tasks_v023 (open/voltooide taken)
//   - skillsData[persoon][skillId] + SKILL_DEFS (src/modules/skills/skills.js)
//   - unlockedBadges (src/modules/achievements/achievements.js)
// Geen hardcoded demo-statistieken. Ontbrekende data → nette 0-state.
//
// v3.1 — avatars lopen nu via de centrale unified-avatar-laag i.p.v.
// rechtstreeks localStorage: window.FamilyAvatarIdentity.resolveAvatar()
// → window.HouseholdIdentity.resolveAvatar() → bestaande localStorage-
// fallback → RPG-preset per rol. Broken images vallen netjes terug op
// initialen i.p.v. een lege cirkel, en de tab luistert op
// familyapp:avatar-updated / familyapp:household-members-updated /
// familyapp:active-member-updated om zichzelf te herrenderen.
//
// Achtergrond van de hero-kaart: eerst member/profiel-eigen achtergrond
// (indien ooit toegevoegd), dan een per-gezinslid opgeslagen override in
// localStorage, dan de vaste Shane/Esra fantasy-landschap-fallback
// (window.HERO_BG_SHANE / window.HERO_BG_ESRA, geladen via gewone
// <script>-tags in index.html — synchroon beschikbaar bij eerste render),
// en pas als allerlaatste redmiddel de pure CSS-gradient via --ptp-hero-bg.
// ============================================================

(function () {
  var VERSION = '3.1';

  // ── Paletten per gezinslid (accentkleur voor selector/glow) ──
  var PALETTES = [
    { accent: '#a78bfa', glow: 'rgba(124,58,237,.45)', chip: 'linear-gradient(150deg,#241455,#3d1f7a,#6d3fc9)' },
    { accent: '#ff9fd6', glow: 'rgba(236,72,153,.40)', chip: 'linear-gradient(150deg,#4a0f38,#7a1f5e,#c9439f)' },
    { accent: '#fbbf6a', glow: 'rgba(217,119,6,.40)',  chip: 'linear-gradient(150deg,#3a2408,#7a4f0a,#d9a441)' },
    { accent: '#5eead4', glow: 'rgba(13,148,103,.40)', chip: 'linear-gradient(150deg,#0a3324,#0d5f4a,#3fd9a8)' }
  ];

  // ── Categorie → kleur + icoon voor open-taken vierkantjes ──
  var CATEGORY_STYLE = {
    'Keuken': { bg: '#b9713d', icon: '🍽️' },
    'Wassen': { bg: '#5b6fd8', icon: '🧺' },
    'Organisatie': { bg: '#7a8c4a', icon: '📋' },
    'Boodschappen': { bg: '#3d95c2', icon: '🛒' },
    'RAID': { bg: '#b91c4c', icon: '⚔️' },
    'DUNGEON': { bg: '#6d28d9', icon: '🏰' }
  };
  function catStyleFor(cat) {
    if (!cat) return { bg: '#5b6472', icon: '⭐' };
    if (CATEGORY_STYLE[cat]) return CATEGORY_STYLE[cat];
    if (cat.indexOf('RAID') > -1) return CATEGORY_STYLE.RAID;
    if (cat.indexOf('DUNGEON') > -1) return CATEGORY_STYLE.DUNGEON;
    return { bg: '#5b6472', icon: '⭐' };
  }

  function esc(v) {
    return String(v == null ? '' : v)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }
  function fmtNum(n) {
    n = Number(n) || 0;
    try { return n.toLocaleString('nl-NL'); } catch (e) { return String(n); }
  }

  // ── CSS injecteren (eenmalig) ──
  function injectStyles() {
    if (document.getElementById('person-tab-premium-style')) return;
    var css = ''
      // Puur CSS "landscape" placeholder-achtergrond — geen extern bestand nodig,
      // en later met één regel te overschrijven via --ptp-hero-bg.
      + ':root{--ptp-hero-bg:'
        + 'radial-gradient(120% 85% at 78% 10%,rgba(255,196,120,.30),transparent 46%),'
        + 'radial-gradient(90% 70% at 12% -5%,rgba(140,100,255,.26),transparent 55%),'
        + 'linear-gradient(180deg,#241f4a 0%,#1a1740 30%,#100f28 62%,#08080f 100%)'
        + '}'

      + '.task-person-page{background:radial-gradient(120% 140% at 20% -10%,#1a1440 0%,#0b0e1a 55%,#07080f 100%);'
        + 'margin:0 -16px;padding:14px 16px 118px;min-height:100%;color:#f4f6ff;position:relative;overflow-x:hidden}'
      + '.task-person-page *{box-sizing:border-box}'

      // Tab-balk restylen naar de paarse pil-look — alléén als de Persoon-tab
      // actief is (:has), zodat Overzicht de originele thema-balk behoudt.
      + '#screen-tasks:has(.task-person-page) .task-tabs{background:#0b0e1a;display:flex;align-items:center;gap:4px;padding:10px 12px 6px;overflow-x:auto;scrollbar-width:none}'
      + '#screen-tasks:has(.task-person-page) .task-tabs::-webkit-scrollbar{display:none}'
      + '#screen-tasks:has(.task-person-page) .ttab{background:transparent;border:none;color:rgba(244,246,255,.5);font-size:13px;font-weight:800;'
        + 'padding:9px 14px;border-radius:999px;cursor:pointer;white-space:nowrap;transition:background .15s,color .15s}'
      + '#screen-tasks:has(.task-person-page) .ttab.active{background:linear-gradient(135deg,#6d28d9,#8b5cf6);color:#fff;'
        + 'box-shadow:0 6px 18px rgba(109,40,217,.4)}'
      + '#screen-tasks:has(.task-person-page) .ttab-trade{margin-left:auto;background:rgba(255,255,255,.06)!important;color:#fde68a!important;'
        + 'border-radius:50%!important;width:34px;height:34px;padding:0!important;flex-shrink:0;'
        + 'display:flex;align-items:center;justify-content:center;font-size:15px}'

      // ── Section label + row-header ("titel links / Bekijk alle rechts") ──
      + '.ptp-label{font-size:14.5px;font-weight:800;color:rgba(244,246,255,.82);margin:2px 2px 12px}'
      + '.ptp-row-header{display:flex;align-items:center;justify-content:space-between;margin:0 2px 10px}'
      + '.ptp-row-header .ptp-label{margin:0}'
      + '.ptp-see-all{font-size:12.5px;font-weight:800;color:#b56cff;cursor:pointer;display:flex;align-items:center;gap:2px}'
      + '.ptp-section{margin-bottom:18px}'

      // ── Member selector ──
      + '.member-selector{display:flex;gap:14px;overflow-x:auto;padding:2px 2px 6px;margin-bottom:16px;scrollbar-width:none}'
      + '.member-selector::-webkit-scrollbar{display:none}'
      + '.member-card{flex:0 0 auto;width:68px;text-align:center;cursor:pointer;background:transparent;border:none;transition:transform .15s}'
      + '.member-card:active{transform:scale(.95)}'
      + '.member-card-avatar,.member-card-avatar-fallback{width:58px;height:58px;border-radius:50%;margin:0 auto 6px;'
        + 'object-fit:cover;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:900;color:#fff;'
        + 'border:2.5px solid rgba(255,255,255,.16);transition:border-color .15s,box-shadow .15s}'
      + '.member-card-name{font-size:12px;font-weight:800;color:rgba(244,246,255,.72);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'
      + '.member-card-level{font-size:10.5px;font-weight:700;color:rgba(244,246,255,.42);margin-top:1px}'
      + '.member-card-active .member-card-avatar,.member-card-active .member-card-avatar-fallback{'
        + 'border-color:var(--ptp-accent,#a78bfa);box-shadow:0 0 0 2px #0b0e1a,0 0 16px var(--ptp-glow,rgba(124,58,237,.45))}'
      + '.member-card-active .member-card-name{color:#fff}'
      + '.member-card-add{display:flex;flex-direction:column;align-items:center;gap:0}'
      + '.member-card-add-icon{width:58px;height:58px;border-radius:50%;border:1.5px dashed rgba(255,255,255,.28);'
        + 'display:flex;align-items:center;justify-content:center;font-size:19px;color:rgba(244,246,255,.5);margin-bottom:6px}'

      // ── Hero-kaart: landscape achtergrond + avatar/naam/level/xp overlay ──
      + '.ptp-hero{position:relative;border-radius:26px;overflow:hidden;margin-bottom:9px;'
        + 'border:1px solid rgba(178,138,255,.20);box-shadow:0 20px 46px rgba(17,8,48,.5)}'
      + '.ptp-hero-visual{position:relative;min-height:224px;padding:20px 18px 18px;display:flex;align-items:flex-end;'
        + 'background-image:var(--ptp-hero-bg);background-size:cover;background-position:center}'
      + '.ptp-hero-visual::before{content:"";position:absolute;inset:0;pointer-events:none;'
        + 'background:linear-gradient(180deg,rgba(7,9,18,.03) 0%,rgba(7,8,16,.10) 34%,rgba(5,6,12,.62) 72%,rgba(5,6,12,.95) 100%)}'
      // Silhouet "bergen" laagje voor diepte — puur CSS, geen bestand nodig
      + '.ptp-hero-visual::after{content:"";position:absolute;left:-8%;right:-8%;bottom:20%;height:38%;pointer-events:none;opacity:.85;'
        + 'background:linear-gradient(158deg,transparent 0 36%,rgba(19,24,42,.85) 37% 45%,transparent 46%),'
        + 'linear-gradient(202deg,transparent 0 41%,rgba(11,16,31,.9) 42% 53%,transparent 54%)}'
      + '.ptp-hero-profile{position:relative;z-index:2;display:grid;grid-template-columns:96px minmax(0,1fr);gap:16px;width:100%;align-items:end}'
      + '.ptp-avatar{width:96px;height:96px;border-radius:50%;object-fit:cover;background:#171528;'
        + 'border:4px solid #cdbdff;box-shadow:0 0 0 4px rgba(124,58,237,.22),0 14px 32px rgba(0,0,0,.46)}'
      + '.ptp-avatar-fallback{display:flex;align-items:center;justify-content:center;font-size:26px;font-weight:950;color:#fff}'
      + '.ptp-copy{min-width:0;padding-bottom:4px}'
      + '.ptp-name{font-size:27px;font-weight:950;letter-spacing:-.5px;line-height:1.05;color:#fff;'
        + 'white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-shadow:0 2px 14px rgba(0,0,0,.55)}'
      + '.ptp-title{margin-top:6px;color:#d9ccff;font-size:13px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'
      + '.ptp-meta{display:flex;align-items:center;gap:10px;margin-top:13px;min-width:0}'
      + '.ptp-level{flex:0 0 48px;height:56px;clip-path:polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%);'
        + 'background:linear-gradient(160deg,#35195e,#6c38b6);display:flex;flex-direction:column;align-items:center;justify-content:center;'
        + 'box-shadow:inset 0 0 0 2px rgba(253,230,138,.55)}'
      + '.ptp-level span{font-size:7px;font-weight:950;letter-spacing:.1em;color:#fde68a}'
      + '.ptp-level strong{font-size:18px;line-height:1;color:#fde68a}'
      + '.ptp-xpblock{min-width:0;flex:1}'
      + '.ptp-xplabel{font-size:9px;font-weight:850;color:rgba(255,255,255,.55);text-transform:uppercase;letter-spacing:.06em}'
      + '.ptp-xptext{font-size:13.5px;font-weight:900;color:#fff;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'
      + '.ptp-bar{height:8px;border-radius:999px;background:rgba(255,255,255,.18);overflow:hidden;margin-top:6px}'
      + '.ptp-fill{height:100%;border-radius:999px;background:linear-gradient(90deg,#7c3aed,#d8b4fe);'
        + 'box-shadow:0 0 12px rgba(168,85,247,.45);transition:width .5s ease}'

      // ── Statbalk (los kaartje, direct onder hero) ──
      + '.ptp-statbar{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:0;background:linear-gradient(180deg,#14172a,#0d101c);'
        + 'border:1px solid rgba(255,255,255,.075);border-radius:20px;margin-bottom:18px;overflow:hidden}'
      + '.ptp-statcell{min-width:0;padding:13px 6px 14px;text-align:center}'
      + '.ptp-statcell+.ptp-statcell{border-left:1px solid rgba(255,255,255,.07)}'
      + '.ptp-staticon{width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;'
        + 'margin:0 auto 6px;background:radial-gradient(circle at 35% 30%,rgba(255,255,255,.14),rgba(255,255,255,.04));font-size:15px}'
      + '.ptp-statlabel{font-size:8px;color:rgba(255,255,255,.50);font-weight:800;text-transform:uppercase;letter-spacing:.05em}'
      + '.ptp-statvalue{font-size:15px;font-weight:950;color:#fff;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'

      // ── Skills-kaart ──
      + '.ptp-skills{background:linear-gradient(180deg,rgba(18,20,33,.96),rgba(10,12,21,.98));border:1px solid rgba(255,255,255,.08);'
        + 'border-radius:22px;padding:16px 16px 6px;box-shadow:0 14px 34px rgba(0,0,0,.18)}'
      + '.ptp-skillrow{display:grid;grid-template-columns:38px minmax(0,1fr) auto;gap:10px;align-items:center;padding:10px 0;min-height:52px}'
      + '.ptp-skillrow+.ptp-skillrow{border-top:1px solid rgba(255,255,255,.055)}'
      + '.ptp-skillicon{width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;'
        + 'background:#111523;border:1px solid rgba(255,255,255,.09);font-size:17px}'
      + '.ptp-skillmain{min-width:0}'
      + '.ptp-skilltop{display:flex;align-items:center;gap:7px;min-width:0}'
      + '.ptp-skillname{font-size:13.5px;font-weight:850;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'
      + '.ptp-skilllvl{font-size:9px;font-weight:850;color:#d8b4fe;background:rgba(124,58,237,.18);'
        + 'border:1px solid rgba(168,85,247,.22);border-radius:7px;padding:2px 5px;white-space:nowrap;flex-shrink:0}'
      + '.ptp-skillbar{height:6px;border-radius:999px;background:rgba(255,255,255,.10);overflow:hidden;margin-top:6px}'
      + '.ptp-skillfill{height:100%;border-radius:999px;background:linear-gradient(90deg,#7c3aed,#c084fc)}'
      + '.ptp-skillxp{font-size:10.5px;font-weight:750;color:rgba(255,255,255,.68);white-space:nowrap;text-align:right}'
      + '.ptp-skills-empty{padding:16px 2px 6px;text-align:center;color:rgba(244,246,255,.45);font-size:12.5px;font-weight:700}'

      // ── Open taken lijst ──
      + '.person-task-list{display:flex;flex-direction:column;gap:9px}'
      + '.person-task-card{display:flex;align-items:center;gap:12px;background:rgba(255,255,255,.045);'
        + 'border:1px solid rgba(255,255,255,.08);border-radius:18px;padding:12px 13px;cursor:pointer;'
        + 'transition:transform .12s,border-color .12s;min-height:64px}'
      + '.person-task-card:active{transform:scale(.98);border-color:rgba(255,255,255,.22)}'
      + '.ptc-icon-sq{width:44px;height:44px;border-radius:13px;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0}'
      + '.ptc-body{flex:1;min-width:0}'
      + '.ptc-title{font-size:14.5px;font-weight:800;color:#fff;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}'
      + '.ptc-cat{font-size:11.5px;font-weight:700;color:rgba(244,246,255,.5);margin-top:2px}'
      + '.ptc-side{text-align:right;flex-shrink:0}'
      + '.ptc-xp{font-size:13px;font-weight:900;color:#fbbf24}'
      + '.ptc-day{font-size:10.5px;font-weight:700;color:rgba(251,191,36,.6);margin-top:2px}'
      + '.ptc-check{width:24px;height:24px;border-radius:50%;border:2px solid rgba(255,255,255,.3);flex-shrink:0}'
      + '.ptp-empty{text-align:center;padding:22px 10px;color:rgba(244,246,255,.45);font-size:13.5px;font-weight:700;'
        + 'background:rgba(255,255,255,.03);border-radius:16px;border:1px solid rgba(255,255,255,.06)}'

      // ── Responsive: 360–430px (primair 390px iPhone) ──
      + '@media(max-width:390px){'
        + '.task-person-page{padding-left:14px;padding-right:14px}'
        + '.ptp-hero-visual{min-height:206px;padding:18px 16px 16px}'
        + '.ptp-hero-profile{grid-template-columns:84px minmax(0,1fr);gap:13px}'
        + '.ptp-avatar,.ptp-avatar-fallback{width:84px;height:84px}'
        + '.ptp-name{font-size:23px}'
        + '.ptp-title{font-size:12px}'
        + '.ptp-level{flex-basis:44px;height:50px}'
        + '.ptp-level strong{font-size:16px}'
        + '.ptp-xptext{font-size:12px}'
        + '.ptp-statcell{padding:11px 4px 12px}'
        + '.ptp-staticon{width:30px;height:30px;font-size:14px}'
        + '.ptp-statvalue{font-size:13.5px}'
        + '.ptp-statlabel{font-size:7.5px}'
      + '}'
      + '@media(max-width:360px){'
        + '.ptp-hero-profile{grid-template-columns:74px minmax(0,1fr);gap:11px}'
        + '.ptp-avatar,.ptp-avatar-fallback{width:74px;height:74px}'
        + '.ptp-name{font-size:20px}'
      + '}';

    var styleEl = document.createElement('style');
    styleEl.id = 'person-tab-premium-style';
    styleEl.textContent = css;
    document.head.appendChild(styleEl);
  }

  // ── Data helpers (bestaande app-state) ──

  // Echte household member (indien HouseholdIdentity geladen is) — geeft
  // toegang tot het genormaliseerde member-object i.p.v. alleen de naam.
  function householdMemberFor(name) {
    try {
      if (window.HouseholdIdentity && typeof window.HouseholdIdentity.getMember === 'function') {
        return window.HouseholdIdentity.getMember(name) || null;
      }
    } catch (e) {}
    return null;
  }

  // Laatste redmiddel: RPG-preset per rol (vader/moeder), zoals voorheen.
  function rpgPresetFor(roleFallback) {
    if (roleFallback && typeof window.RPG_PORTRAITS !== 'undefined'
      && window.RPG_PORTRAITS[roleFallback] && window.RPG_PORTRAITS[roleFallback][0]) {
      return window.RPG_PORTRAITS[roleFallback][0];
    }
    return null;
  }

  // Avatar-resolutievolgorde:
  //   1. window.FamilyAvatarIdentity.resolveAvatar(member || naam)  — centrale unified-avatar-laag
  //   2. window.HouseholdIdentity.resolveAvatar(member || naam)     — (wordt door de bridge hierop geïnstalleerd)
  //   3. bestaande localStorage-fallback (eigen avatar / fam_avatar_<naam>)
  //   4. bestaande RPG-preset per rol (vader/moeder)
  function getAvatarFor(name, myNameLocal, roleFallback) {
    var member = householdMemberFor(name);
    var subject = member || name;

    try {
      if (window.FamilyAvatarIdentity && typeof window.FamilyAvatarIdentity.resolveAvatar === 'function') {
        var a1 = window.FamilyAvatarIdentity.resolveAvatar(subject);
        if (a1) return a1;
      }
    } catch (e) {}

    try {
      if (window.HouseholdIdentity && typeof window.HouseholdIdentity.resolveAvatar === 'function') {
        var a2 = window.HouseholdIdentity.resolveAvatar(subject);
        if (a2) return a2;
      }
    } catch (e) {}

    try {
      if (name.toLowerCase() === myNameLocal.toLowerCase()) {
        var url = localStorage.getItem('familyapp-current-user-avatar-v1');
        if (url) return url;
      }
      var stored = localStorage.getItem('fam_avatar_' + name.toLowerCase());
      if (stored) return stored;
    } catch (e) {}

    return rpgPresetFor(roleFallback);
  }

  // ── Hero-achtergrond resolver ──
  // Volgorde: bestaande member/profile hero-achtergrond-property (indien
  // die ooit toegevoegd wordt aan HouseholdIdentity-members) → centraal
  // opgeslagen profiel-achtergrond in app-state → per-lid override in
  // localStorage → vaste Shane/Esra fantasy-landschap-fallback (via
  // window.HERO_BG_SHANE / window.HERO_BG_ESRA, rechtstreeks geladen als
  // <script> in index.html) → null (CSS-gradient blijft dan staan via
  // --ptp-hero-bg). Nooit hardcoded op naam bóven de expliciete overrides.
  function getHeroBackgroundFor(m) {
    var member = householdMemberFor(m.name);
    if (member) {
      var direct = member.heroBackground || member.background || member.bannerUrl
        || member.backgroundUrl || member.profileBackground || member.heroImage;
      if (direct) return direct;
    }
    try {
      if (window.HouseholdIdentity && typeof window.HouseholdIdentity.getHeroBackground === 'function') {
        var fromIdentity = window.HouseholdIdentity.getHeroBackground(m.id);
        if (fromIdentity) return fromIdentity;
      }
    } catch (e) {}
    try {
      var stored = localStorage.getItem('familyapp-hero-bg-' + m.id);
      if (stored) return stored;
    } catch (e) {}
    // Vaste fantasy-landschap-fallback per gezinslid (laatste redmiddel vóór
    // de CSS-gradient). Geladen als gewone <script>-tags in index.html
    // (window.HERO_BG_SHANE / window.HERO_BG_ESRA), vóór dit script — dus
    // altijd synchroon beschikbaar bij de eerste render. Geen AppModules-
    // bridge en geen localStorage-duplicatie nodig.
    try {
      var DEFAULT_HERO_BACKGROUNDS = { shane: window.HERO_BG_SHANE, esra: window.HERO_BG_ESRA };
      var defaultBg = DEFAULT_HERO_BACKGROUNDS[String(m.id).toLowerCase()];
      if (defaultBg) return defaultBg;
    } catch (e) {}
    return null;
  }

  function xpFromString(xpStr) {
    if (!xpStr) return 0;
    var m = String(xpStr).match(/(\d+)/);
    return m ? parseInt(m[1], 10) : 0;
  }

  function isRecentDate(dateLike) {
    if (!dateLike) return false;
    var d = new Date(String(dateLike).replace(/^(\d{1,2})[\/\-](\d{1,2})/, '$1-$2'));
    if (isNaN(d.getTime())) return false;
    var now = new Date();
    var diffDays = (now - d) / 86400000;
    return diffDays >= -1 && diffDays <= 7;
  }

  function questStatsFor(name) {
    var raw = localStorage.getItem('fam_tasks_v023') || localStorage.getItem('fam_tasks_v022') || '[]';
    var allTasks;
    try { allTasks = JSON.parse(raw) || []; } catch (e) { allTasks = []; }
    var tasks = allTasks.filter(function (x) { return x[5] && (x[5] === 'Beiden' || x[5].indexOf(name) > -1); });
    var done = tasks.filter(function (x) { return x[9]; });
    var open = tasks.filter(function (x) { return !x[9]; });
    var doneThisWeek = done.filter(function (x) { return isRecentDate(x[11] || x[4]); });
    var weekXP = doneThisWeek.reduce(function (sum, x) { return sum + xpFromString(x[6]); }, 0);
    return { tasks: tasks, done: done, open: open, doneThisWeek: doneThisWeek, weekXP: weekXP };
  }

  function maxStreakFor(name) {
    if (typeof recurData === 'undefined') return 0;
    return recurData.reduce(function (m, r) {
      if (r.who && r.who.indexOf(name) > -1) return Math.max(m, r.streak || 0);
      return m;
    }, 0);
  }

  function achievementsCount() {
    try {
      if (typeof unlockedBadges !== 'undefined') return Object.keys(unlockedBadges).length;
    } catch (e) {}
    return 0;
  }

  function skillsFor(name) {
    if (typeof skillsData === 'undefined' || typeof SKILL_DEFS === 'undefined' || !skillsData[name]) return [];
    var lvlFn = typeof skillLevelFromXp === 'function' ? skillLevelFromXp : function (xp) { return Math.max(1, Math.floor(xp / 50) + 1); };
    var inLvlFn = typeof skillXpInCurrentLevel === 'function' ? skillXpInCurrentLevel : function (xp) { return xp; };
    var toNextFn = typeof skillXpToNextLevel === 'function' ? skillXpToNextLevel : function () { return 100; };
    return SKILL_DEFS.map(function (def) {
      var sk = skillsData[name][def.id] || { xp: 0 };
      var xp = Number(sk.xp) || 0;
      return {
        def: def, xp: xp, level: lvlFn(xp),
        xpIn: inLvlFn(xp), xpToNext: toNextFn(xp)
      };
    }).sort(function (a, b) { return b.xp - a.xp; }).slice(0, 4);
  }

  function buildMembers() {
    var meName = (typeof myName !== 'undefined' && myName) || 'Jij';
    var partName = (typeof partnerName !== 'undefined' && partnerName) || null;
    var names = partName ? [meName, partName] : [meName];

    return names.map(function (name, i) {
      var isMe = i === 0;
      var xp = isMe
        ? (typeof myXP !== 'undefined' ? myXP : 0)
        : (typeof partnerXP !== 'undefined' ? partnerXP : 0);
      var level = typeof getLevel === 'function' ? getLevel(xp) : Math.max(1, Math.floor(xp / 100) + 1);
      var titleData = (typeof LEVEL_TITLES !== 'undefined')
        ? LEVEL_TITLES[Math.min(level - 1, LEVEL_TITLES.length - 1)] : null;
      var title = titleData ? titleData.title : '';
      var prevXP = (typeof LEVEL_XP !== 'undefined') ? (LEVEL_XP[level - 1] || 0) : 0;
      var nextXP = (typeof LEVEL_XP !== 'undefined')
        ? (LEVEL_XP[Math.min(level, LEVEL_XP.length - 1)] || (prevXP + 200))
        : (prevXP + 200);

      var qs = questStatsFor(name);
      var streak = maxStreakFor(name);
      var roleFallback = i === 0 ? 'vader' : (i === 1 ? 'moeder' : null);
      var avatar = getAvatarFor(name, meName, roleFallback);

      return {
        id: name.toLowerCase(),
        name: name,
        isMe: isMe,
        avatar: avatar,
        initials: name.slice(0, 2).toUpperCase(),
        palette: PALETTES[i % PALETTES.length],
        level: level,
        title: title,
        xp: xp,
        prevXP: prevXP,
        nextXP: nextXP,
        streak: streak,
        openTasks: qs.open,
        skills: skillsFor(name)
      };
    });
  }

  // ── Render: member selector ──
  function renderMemberSelector(members, selectedId) {
    var html = '<div class="ptp-label">Gezinsleden</div><div class="member-selector">';
    members.forEach(function (m) {
      var active = m.id === selectedId;
      html += '<div class="member-card' + (active ? ' member-card-active' : '') + '" '
        + 'style="' + (active ? '--ptp-accent:' + m.palette.accent + ';--ptp-glow:' + m.palette.glow + ';' : '') + '" '
        + 'data-person="' + esc(m.id) + '">';
      html += m.avatar
        ? '<img class="member-card-avatar" data-avatar-name="' + esc(m.name) + '" src="' + esc(m.avatar) + '">'
        : '<div class="member-card-avatar-fallback" style="background:' + m.palette.accent + '">' + esc(m.initials) + '</div>';
      html += '<div class="member-card-name">' + esc(m.name) + '</div>';
      html += '<div class="member-card-level">Level ' + m.level + '</div>';
      html += '</div>';
    });
    html += '</div>';
    return html;
  }

  // ── Render: hero card ──
  function renderHero(m) {
    var pct = m.nextXP > m.prevXP ? Math.max(0, Math.min(100, Math.round((m.xp - m.prevXP) / (m.nextXP - m.prevXP) * 100))) : 100;
    var avatarHtml = m.avatar
      ? '<img class="ptp-avatar" data-avatar-name="' + esc(m.name) + '" src="' + esc(m.avatar) + '" alt="">'
      : '<div class="ptp-avatar ptp-avatar-fallback" style="background:' + m.palette.accent + '">' + esc(m.initials) + '</div>';

    var heroBg = getHeroBackgroundFor(m);
    var heroBgStyle = heroBg ? ' style="background-image:url(' + esc(heroBg) + ')"' : '';

    var html = '<div class="ptp-hero">';
    html += '<div class="ptp-hero-visual"' + heroBgStyle + '>';
    html += '<div class="ptp-hero-profile">';
    html += avatarHtml;
    html += '<div class="ptp-copy">';
    html += '<div class="ptp-name">' + esc(m.name) + '</div>';
    if (m.title) html += '<div class="ptp-title">' + esc(m.title) + '</div>';
    html += '<div class="ptp-meta">';
    html += '<div class="ptp-level"><span>LEVEL</span><strong>' + m.level + '</strong></div>';
    html += '<div class="ptp-xpblock">';
    html += '<div class="ptp-xplabel">Voortgang</div>';
    html += '<div class="ptp-xptext">' + fmtNum(m.xp) + ' / ' + fmtNum(m.nextXP) + ' XP</div>';
    html += '<div class="ptp-bar"><div class="ptp-fill" style="width:' + pct + '%"></div></div>';
    html += '</div></div></div></div></div>';
    html += '</div>';
    return html;
  }

  // ── Render: statbalk (4 segmenten) ──
  function renderStatBar(m, householdSize) {
    var cells = [
      { icon: '✦', bg: 'radial-gradient(circle,#a78bfa,#7c3aed)', label: 'Totale XP', value: fmtNum(m.xp) },
      { icon: '🏆', bg: 'radial-gradient(circle,#fde68a,#d97706)', label: 'Prestaties', value: fmtNum(achievementsCount()) },
      { icon: '🔥', bg: 'radial-gradient(circle,#fca5a5,#dc2626)', label: 'Streak', value: fmtNum(m.streak) + ' dagen' },
      { icon: '👥', bg: 'radial-gradient(circle,#86efac,#16a34a)', label: 'Huishoud', value: fmtNum(householdSize) + ' leden' }
    ];
    var html = '<div class="ptp-statbar">';
    cells.forEach(function (c) {
      html += '<div class="ptp-statcell">'
        + '<div class="ptp-staticon">' + c.icon + '</div>'
        + '<div class="ptp-statlabel">' + esc(c.label) + '</div>'
        + '<div class="ptp-statvalue">' + esc(c.value) + '</div>'
        + '</div>';
    });
    html += '</div>';
    return html;
  }

  // ── Render: skills-kaart ──
  function renderSkillsCard(m) {
    var html = '<div class="ptp-section">';
    html += '<div class="ptp-skills"><div class="ptp-row-header">'
      + '<div class="ptp-label">Mijn vaardigheden</div>'
      + '<div class="ptp-see-all" onclick="if(typeof showScreen===\'function\')showScreen(\'skills\')">Bekijk alle ›</div>'
      + '</div>';
    if (!m.skills.length) {
      html += '<div class="ptp-skills-empty">Nog geen vaardigheden gelogd</div>';
    } else {
      m.skills.forEach(function (s) {
        var pct = s.xpToNext ? Math.max(0, Math.min(100, Math.round((s.xpIn / s.xpToNext) * 100))) : 100;
        html += '<div class="ptp-skillrow">'
          + '<div class="ptp-skillicon">' + esc(s.def.icon || '⭐') + '</div>'
          + '<div class="ptp-skillmain">'
          + '<div class="ptp-skilltop"><div class="ptp-skillname">' + esc(s.def.name || s.def.id) + '</div>'
          + '<div class="ptp-skilllvl">Lv ' + s.level + '</div></div>'
          + '<div class="ptp-skillbar"><div class="ptp-skillfill" style="width:' + pct + '%"></div></div>'
          + '</div>'
          + '<div class="ptp-skillxp">' + fmtNum(s.xpIn) + ' / ' + fmtNum(s.xpToNext) + ' XP</div>'
          + '</div>';
      });
    }
    html += '</div></div>';
    return html;
  }

  // ── Render: open taken ──
  function renderOpenTaken(m) {
    var html = '<div class="ptp-section">';
    html += '<div class="ptp-row-header"><div class="ptp-label">Open taken</div>'
      + '<div class="ptp-see-all" onclick="if(window.showToast)showToast(\'📋 Volledige takenlijst komt binnenkort\')">Bekijk alle ›</div></div>';
    if (!m.openTasks.length) {
      html += '<div class="ptp-empty">🎉 Alle taken voltooid — top gedaan!</div>';
    } else {
      html += '<div class="person-task-list">';
      m.openTasks.forEach(function (x) {
        var catRaw = x[1] || 'Quest';
        var cs = catStyleFor(catRaw);
        html += '<div class="person-task-card" onclick="if(window.famDetail)famDetail(\'' + esc(x[0]) + '\')">';
        html += '<div class="ptc-icon-sq" style="background:' + cs.bg + '">' + cs.icon + '</div>';
        html += '<div class="ptc-body"><div class="ptc-title">' + esc(x[2]) + '</div>'
          + '<div class="ptc-cat">' + esc(catRaw) + '</div></div>';
        html += '<div class="ptc-side"><div class="ptc-xp">' + esc(x[6] || '') + '</div>'
          + '<div class="ptc-day">' + esc(x[11] || x[4] || 'Binnenkort') + '</div></div>';
        html += '<div class="ptc-check"></div>';
        html += '</div>';
      });
      html += '</div>';
    }
    html += '</div>';
    return html;
  }

  // ── Broken-image fallback ──
  // Bij een broken avatar-URL: eerst opnieuw de centrale resolver/preset
  // proberen, en pas als ook dát faalt de <img> vervangen door een
  // zichtbare initialen-cirkel (nooit een lege/onzichtbare cirkel).
  function bindAvatarFallback(img, member) {
    if (!img || img.__ptpFallbackBound) return;
    img.__ptpFallbackBound = true;
    var stage = 0;
    img.addEventListener('error', function onErr() {
      stage++;
      if (stage === 1) {
        var retry = null;
        try {
          if (window.FamilyAvatarIdentity && typeof window.FamilyAvatarIdentity.resolveAvatar === 'function') {
            retry = window.FamilyAvatarIdentity.resolveAvatar(householdMemberFor(member.name) || member.name);
          }
        } catch (e) {}
        if (!retry) retry = rpgPresetFor(member.isMe ? 'vader' : 'moeder');
        if (retry && retry !== img.getAttribute('src')) { img.setAttribute('src', retry); return; }
      }
      // Definitief: vervang de <img> door een zichtbare initialen-cirkel
      var isHero = img.classList.contains('ptp-avatar');
      var fallback = document.createElement('div');
      fallback.className = img.className + ' ptp-avatar-fallback member-card-avatar-fallback';
      fallback.style.background = member.palette.accent;
      fallback.textContent = member.initials;
      if (img.parentNode) img.parentNode.replaceChild(fallback, img);
      void isHero;
    });
  }

  function bindAvatarFallbacks(el, members) {
    var byName = {};
    members.forEach(function (m) { byName[m.name] = m; });
    el.querySelectorAll('img[data-avatar-name]').forEach(function (img) {
      var m = byName[img.getAttribute('data-avatar-name')];
      if (m) bindAvatarFallback(img, m);
    });
  }

  // ── Live avatar-updates ──
  // Herrender de Persoon-tab (of ververs alleen de avatars) zodra de
  // centrale avatarlaag meldt dat er iets gewijzigd is. Listener wordt
  // maar één keer gebonden.
  function bindAvatarEvents() {
    if (window.__ptpAvatarEventsBound) return;
    window.__ptpAvatarEventsBound = true;
    var refresh = function () {
      var page = document.querySelector('.task-person-page');
      var target = document.getElementById('task-content');
      if (page && target) render(target);
    };
    window.addEventListener('familyapp:avatar-updated', refresh);
    window.addEventListener('familyapp:household-members-updated', refresh);
    window.addEventListener('familyapp:active-member-updated', refresh);
  }

  // ── Hoofdrender ──
  function render(el) {
    if (!el) return;
    injectStyles();

    var members = buildMembers();
    if (!members.length) { el.innerHTML = '<div class="task-person-page"><div class="ptp-empty">Geen gezinsleden gevonden</div></div>'; return; }

    if (!window.__personTabSelected || !members.some(function (m) { return m.id === window.__personTabSelected; })) {
      window.__personTabSelected = members[0].id;
    }
    var selected = members.find(function (m) { return m.id === window.__personTabSelected; }) || members[0];

    var html = '<div class="task-person-page">';
    html += renderMemberSelector(members, selected.id);
    html += renderHero(selected);
    html += renderStatBar(selected, members.length);
    html += renderSkillsCard(selected);
    html += renderOpenTaken(selected);
    html += '</div>';

    el.innerHTML = html;

    el.querySelectorAll('.member-card[data-person]').forEach(function (card) {
      card.addEventListener('click', function () {
        window.__personTabSelected = card.getAttribute('data-person');
        render(el);
      });
    });

    bindAvatarFallbacks(el, members);
    bindAvatarEvents();
  }

  // ── Override van de bestaande renderer (tasks.js) ──
  window.renderTasksPersoon = render;
  window.PersonTabPremium = { version: VERSION, render: render };

  // Als de Persoon-tab al actief is wanneer dit script laadt, direct renderen
  if (typeof taskTab !== 'undefined' && taskTab === 'persoon') {
    var target = document.getElementById('task-content');
    if (target) render(target);
  }
})();
