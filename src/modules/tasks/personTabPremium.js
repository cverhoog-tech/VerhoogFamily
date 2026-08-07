'use strict';
// ============================================================
// PERSOON TAB — PREMIUM RPG CHARACTER SHEET (v2)
// Herbouwd 1:1 op basis van referentiebeeld "IDEE 1":
// grote hero-portret-kaart, hexagon level-badge, 3-koloms
// hero-stats zonder pil-achtergrond, 4-koloms stat-grid met
// icoon-badges, en open-taken rijen met gekleurde categorie-
// iconen + rechts uitgelijnde XP/dag-stack.
// Bouwt voort op bestaande data: myXP/partnerXP, getLevel(),
// LEVEL_TITLES, LEVEL_XP, recurData streaks, en de quest-data
// uit fam_tasks_v023 (dezelfde bron als de Overzicht-quest-UI).
// ============================================================

(function () {
  var VERSION = '2.1';

  // ── Paletten per gezinslid (val terug op gradient als er geen avatarfoto is) ──
  var PALETTES = [
    { // "Jij" — indigo/paars (IDEE 1)
      bg: 'linear-gradient(150deg,#241455 0%,#3d1f7a 55%,#6d3fc9 100%)',
      glow: 'rgba(124,58,237,.45)',
      accent: '#a78bfa',
      soft: 'rgba(167,139,250,.16)'
    },
    { // Partner — magenta/rose
      bg: 'linear-gradient(150deg,#4a0f38 0%,#7a1f5e 55%,#c9439f 100%)',
      glow: 'rgba(236,72,153,.4)',
      accent: '#ff9fd6',
      soft: 'rgba(255,159,214,.16)'
    },
    { // Extra gezinsleden — amber
      bg: 'linear-gradient(150deg,#3a2408 0%,#7a4f0a 55%,#d9a441 100%)',
      glow: 'rgba(217,119,6,.4)',
      accent: '#fbbf6a',
      soft: 'rgba(251,191,106,.16)'
    },
    { // Extra — smaragd
      bg: 'linear-gradient(150deg,#0a3324 0%,#0d5f4a 55%,#3fd9a8 100%)',
      glow: 'rgba(13,148,103,.4)',
      accent: '#5eead4',
      soft: 'rgba(94,234,212,.16)'
    }
  ];

  // ── Categorie → kleur + icoon voor de open-taken vierkantjes ──
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

  // ── CSS injecteren (eenmalig) ──
  function injectStyles() {
    if (document.getElementById('person-tab-premium-style')) return;
    var css = ''
      + '.task-person-page{background:radial-gradient(120% 140% at 20% -10%,#1a1440 0%,#0b0e1a 55%,#07080f 100%);' +
        'margin:0 -16px;padding:14px 16px 110px;min-height:100%;color:#f4f6ff;position:relative;overflow-x:hidden}'
      + '.task-person-page *{box-sizing:border-box}'

      // ── Section label + "Bekijk alle" header rij (matcht IDEE 1 typografie) ──
      + '.ptp-label{font-size:14.5px;font-weight:800;color:rgba(244,246,255,.82);margin:2px 2px 12px}'
      + '.ptp-row-header{display:flex;align-items:center;justify-content:space-between;margin:4px 2px 10px}'
      + '.ptp-row-header .ptp-label{margin:0}'
      + '.ptp-see-all{font-size:12.5px;font-weight:800;color:#fbbf24;cursor:pointer}'
      + '.ptp-section{margin-bottom:20px}'

      // ── Tab-balk restylen naar de paarse pil-look uit de referentie ──
      + '.task-tabs{background:#0b0e1a;display:flex;align-items:center;gap:4px;padding:10px 12px 6px;overflow-x:auto;scrollbar-width:none}'
      + '.task-tabs::-webkit-scrollbar{display:none}'
      + '.ttab{background:transparent;border:none;color:rgba(244,246,255,.5);font-size:13px;font-weight:800;'
        + 'padding:9px 14px;border-radius:999px;cursor:pointer;white-space:nowrap;transition:background .15s,color .15s}'
      + '.ttab.active{background:linear-gradient(135deg,#6d28d9,#8b5cf6);color:#fff;'
        + 'box-shadow:0 6px 18px rgba(109,40,217,.4)}'
      + '.ttab-trade{margin-left:auto;background:rgba(255,255,255,.06)!important;color:#fde68a!important;'
        + 'border-radius:50%!important;width:34px;height:34px;padding:0!important;flex-shrink:0;'
        + 'display:flex;align-items:center;justify-content:center;font-size:15px}'

      // ── Member selector ──
      + '.member-selector{display:flex;gap:14px;overflow-x:auto;padding:2px 2px 6px;margin-bottom:16px;scrollbar-width:none}'
      + '.member-selector::-webkit-scrollbar{display:none}'
      + '.member-card{flex:0 0 auto;width:72px;text-align:center;cursor:pointer;background:transparent;border:none;'
        + 'transition:transform .15s}'
      + '.member-card:active{transform:scale(.95)}'
      + '.member-card-avatar{width:56px;height:56px;border-radius:50%;margin:0 auto 6px;object-fit:cover;display:block;'
        + 'border:2.5px solid rgba(255,255,255,.16);transition:border-color .15s,box-shadow .15s}'
      + '.member-card-avatar-fallback{width:56px;height:56px;border-radius:50%;margin:0 auto 6px;display:flex;align-items:center;'
        + 'justify-content:center;font-size:16px;font-weight:900;color:#fff;'
        + 'border:2.5px solid rgba(255,255,255,.16);transition:border-color .15s,box-shadow .15s}'
      + '.member-card-name{font-size:12.5px;font-weight:800;color:rgba(244,246,255,.75);white-space:nowrap;'
        + 'overflow:hidden;text-overflow:ellipsis}'
      + '.member-card-level{font-size:10.5px;font-weight:700;color:rgba(244,246,255,.45);margin-top:1px}'
      + '.member-card-active .member-card-avatar,.member-card-active .member-card-avatar-fallback{'
        + 'border-color:var(--ptp-accent,#a78bfa);box-shadow:0 0 0 2px rgba(11,14,26,1),0 0 16px var(--ptp-glow,rgba(124,58,237,.45))}'
      + '.member-card-active .member-card-name{color:#fff}'
      + '.member-card-add{display:flex;flex-direction:column;align-items:center;justify-content:flex-start;gap:0}'
      + '.member-card-add-icon{width:56px;height:56px;border-radius:50%;border:1.5px dashed rgba(255,255,255,.28);'
        + 'display:flex;align-items:center;justify-content:center;font-size:19px;color:rgba(244,246,255,.5);margin-bottom:6px}'

      // ── Hero card — het karakterportret zelf is de achtergrond ──
      + '.member-hero-card{position:relative;border-radius:28px;overflow:hidden;min-height:290px;'
        + 'display:flex;flex-direction:column;justify-content:flex-end;padding:20px 18px 18px;margin-bottom:16px;'
        + 'background-size:cover;background-position:center 22%;box-shadow:0 20px 46px var(--ptp-glow)}'
      + '.member-hero-card::after{content:"";position:absolute;inset:0;pointer-events:none;'
        + 'background:linear-gradient(180deg,rgba(7,8,15,0) 0%,rgba(7,8,15,.12) 30%,rgba(9,7,20,.94) 100%)}'
      + '.member-hero-lvl-badge{position:absolute;top:16px;right:16px;z-index:2;width:56px;height:56px;'
        + 'clip-path:polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%);'
        + 'background:linear-gradient(160deg,#2b1a4d,#4c2f86);display:flex;flex-direction:column;'
        + 'align-items:center;justify-content:center;box-shadow:0 6px 16px rgba(0,0,0,.5),inset 0 0 0 2px rgba(253,230,138,.55)}'
      + '.member-hero-lvl-eyebrow{font-size:7px;font-weight:900;letter-spacing:.12em;color:#fde68a;text-transform:uppercase}'
      + '.member-hero-lvl-num{font-size:17px;font-weight:950;color:#fde68a;line-height:1.1}'
      + '.member-hero-content{position:relative;z-index:1}'
      + '.member-hero-name{font-size:23px;font-weight:950;color:#fff;letter-spacing:-.4px;'
        + 'text-shadow:0 2px 12px rgba(0,0,0,.5)}'
      + '.member-hero-title{font-size:13px;font-weight:800;color:#c9b8ff;margin-top:2px;'
        + 'text-shadow:0 1px 8px rgba(0,0,0,.5)}'
      + '.member-hero-stats-row{display:flex;margin-top:16px}'
      + '.mh-stat-col{flex:1;padding:0 10px;min-width:0}'
      + '.mh-stat-col:first-child{padding-left:0}'
      + '.mh-stat-col + .mh-stat-col{border-left:1px solid rgba(255,255,255,.16)}'
      + '.mh-stat-lbl{font-size:11px;font-weight:700;color:rgba(255,255,255,.65);margin-bottom:3px;white-space:nowrap}'
      + '.mh-stat-val{font-size:15.5px;font-weight:950;color:#fff;white-space:nowrap}'
      + '.mh-stat-sub{font-size:9.5px;font-weight:700;color:rgba(255,255,255,.5);margin-top:1px}'
      + '.member-hero-progress-bar{margin-top:16px;height:9px;border-radius:999px;background:rgba(255,255,255,.18);overflow:hidden}'
      + '.member-hero-progress-fill{height:100%;border-radius:999px;background:linear-gradient(90deg,#7c3aed,#c4b5fd);'
        + 'box-shadow:0 0 10px rgba(139,92,246,.65);transition:width .5s ease}'
      + '.member-hero-progress-caption{margin-top:7px;font-size:11px;font-weight:700;color:rgba(255,255,255,.55);text-align:center}'

      // ── Stat grid ──
      + '.person-stat-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:20px}'
      + '.person-stat-card{background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.08);border-radius:16px;'
        + 'padding:12px 6px;text-align:center}'
      + '.psc-icon-wrap{width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;'
        + 'margin:0 auto 6px;font-size:14px}'
      + '.psc-val{font-size:17px;font-weight:950;color:#f4f6ff;line-height:1}'
      + '.psc-lbl{font-size:9.5px;font-weight:700;color:rgba(244,246,255,.5);margin-top:3px;text-transform:uppercase;letter-spacing:.03em}'

      // ── Open taken lijst ──
      + '.person-task-list{display:flex;flex-direction:column;gap:9px}'
      + '.person-task-card{display:flex;align-items:center;gap:12px;background:rgba(255,255,255,.045);'
        + 'border:1px solid rgba(255,255,255,.08);border-radius:18px;padding:12px 13px;cursor:pointer;'
        + 'transition:transform .12s,border-color .12s}'
      + '.person-task-card:active{transform:scale(.98);border-color:rgba(255,255,255,.22)}'
      + '.ptc-icon-sq{width:44px;height:44px;border-radius:13px;display:flex;align-items:center;justify-content:center;'
        + 'font-size:18px;flex-shrink:0}'
      + '.ptc-body{flex:1;min-width:0}'
      + '.ptc-title{font-size:14.5px;font-weight:800;color:#fff;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}'
      + '.ptc-cat{font-size:11.5px;font-weight:700;color:rgba(244,246,255,.5);margin-top:2px}'
      + '.ptc-side{text-align:right;flex-shrink:0}'
      + '.ptc-xp{font-size:13px;font-weight:900;color:#fbbf24}'
      + '.ptc-day{font-size:10.5px;font-weight:700;color:rgba(251,191,36,.6);margin-top:2px}'
      + '.ptc-check{width:24px;height:24px;border-radius:50%;border:2px solid rgba(255,255,255,.3);flex-shrink:0}'
      + '.ptp-empty{text-align:center;padding:22px 10px;color:rgba(244,246,255,.45);font-size:13.5px;font-weight:700;'
        + 'background:rgba(255,255,255,.03);border-radius:16px;border:1px solid rgba(255,255,255,.06)}'

      + '@media(min-width:480px){.task-person-page{margin:0}}';

    var styleEl = document.createElement('style');
    styleEl.id = 'person-tab-premium-style';
    styleEl.textContent = css;
    document.head.appendChild(styleEl);
  }

  // ── Helpers die bestaande app-state/logica hergebruiken ──
  // roleFallback: 'vader' voor jou (index 0), 'moeder' voor partner (index 1) —
  // gebruikt window.RPG_PORTRAITS als er nog geen eigen foto is ingesteld.
  function getAvatarFor(name, myNameLocal, roleFallback) {
    try {
      if (name.toLowerCase() === myNameLocal.toLowerCase()) {
        var url = localStorage.getItem('familyapp-current-user-avatar-v1');
        if (url) return url;
      }
      var stored = localStorage.getItem('fam_avatar_' + name.toLowerCase());
      if (stored) return stored;
    } catch (e) {}
    if (roleFallback && typeof window.RPG_PORTRAITS !== 'undefined'
      && window.RPG_PORTRAITS[roleFallback] && window.RPG_PORTRAITS[roleFallback][0]) {
      return window.RPG_PORTRAITS[roleFallback][0];
    }
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
    var totalXP = done.reduce(function (sum, x) { return sum + xpFromString(x[6]); }, 0);
    var weekXP = doneThisWeek.reduce(function (sum, x) { return sum + xpFromString(x[6]); }, 0);

    return {
      tasks: tasks, done: done, open: open,
      doneThisWeek: doneThisWeek,
      totalXP: totalXP, weekXP: weekXP
    };
  }

  function maxStreakFor(name) {
    if (typeof recurData === 'undefined') return 0;
    return recurData.reduce(function (m, r) {
      if (r.who && r.who.indexOf(name) > -1) return Math.max(m, r.streak || 0);
      return m;
    }, 0);
  }

  function buildMembers() {
    var meName = (typeof myName !== 'undefined' && myName) || 'Shane';
    var partName = (typeof partnerName !== 'undefined' && partnerName) || 'Esra';
    var names = [meName, partName];

    return names.map(function (name, i) {
      var isMe = i === 0;
      var xp = isMe
        ? (typeof myXP !== 'undefined' ? myXP : 0)
        : (typeof partnerXP !== 'undefined' ? partnerXP : 95);
      var level = typeof getLevel === 'function' ? getLevel(xp) : Math.max(1, Math.floor(xp / 100) + 1);
      var titleData = (typeof LEVEL_TITLES !== 'undefined')
        ? LEVEL_TITLES[Math.min(level - 1, LEVEL_TITLES.length - 1)] : null;
      var title = titleData ? titleData.title : '⚔️ Avonturier';
      var prevXP = (typeof LEVEL_XP !== 'undefined') ? (LEVEL_XP[level - 1] || 0) : 0;
      var nextXP = (typeof LEVEL_XP !== 'undefined')
        ? (LEVEL_XP[Math.min(level, LEVEL_XP.length - 1)] || (prevXP + 200))
        : (prevXP + 200);

      var qs = questStatsFor(name);
      var streak = maxStreakFor(name);
      var roleFallback = i === 0 ? 'vader' : (i === 1 ? 'moeder' : null);
      var avatar = getAvatarFor(name, meName, roleFallback);
      var palette = PALETTES[i % PALETTES.length];

      return {
        id: name.toLowerCase(),
        name: name,
        isMe: isMe,
        avatar: avatar,
        initials: name.slice(0, 2).toUpperCase(),
        palette: palette,
        level: level,
        title: title,
        xp: xp,
        prevXP: prevXP,
        nextXP: nextXP,
        openCount: qs.open.length,
        doneThisWeekCount: qs.doneThisWeek.length,
        weekXP: qs.weekXP,
        totalQuestXP: qs.totalXP,
        streak: streak,
        openTasks: qs.open
      };
    });
  }

  function renderMemberSelector(members, selectedId) {
    var html = '<div class="ptp-label">Gezinsleden</div>';
    html += '<div class="member-selector">';
    members.forEach(function (m) {
      var active = m.id === selectedId;
      html += '<div class="member-card' + (active ? ' member-card-active' : '') + '" '
        + 'style="' + (active ? '--ptp-accent:' + m.palette.accent + ';--ptp-glow:' + m.palette.glow + ';' : '') + '" '
        + 'data-person="' + esc(m.id) + '">';
      if (m.avatar) {
        html += '<img class="member-card-avatar" src="' + esc(m.avatar) + '" onerror="this.style.display=\'none\'">';
      } else {
        html += '<div class="member-card-avatar-fallback" style="background:' + m.palette.accent + '">' + esc(m.initials) + '</div>';
      }
      html += '<div class="member-card-name">' + esc(m.name) + '</div>';
      html += '<div class="member-card-level">Level ' + m.level + '</div>';
      html += '</div>';
    });
    html += '<div class="member-card member-card-add" onclick="if(window.showToast)showToast(\'👨‍👩‍👧‍👦 Gezinslid toevoegen komt binnenkort\')">'
      + '<div class="member-card-add-icon">+</div><div class="member-card-name">Toevoegen</div></div>';
    html += '</div>';
    return html;
  }

  function renderHeroCard(m) {
    var pct = m.nextXP > m.prevXP ? Math.max(0, Math.min(100, Math.round((m.xp - m.prevXP) / (m.nextXP - m.prevXP) * 100))) : 100;
    var bgStyle = m.avatar
      ? ('background-image:url(' + esc(m.avatar) + ');')
      : ('background:' + m.palette.bg + ';');

    var html = '<div class="member-hero-card" style="' + bgStyle + '--ptp-glow:' + m.palette.glow + '">';

    html += '<div class="member-hero-lvl-badge">'
      + '<div class="member-hero-lvl-eyebrow">Level</div>'
      + '<div class="member-hero-lvl-num">' + m.level + '</div>'
      + '</div>';

    html += '<div class="member-hero-content">';
    html += '<div class="member-hero-name">' + esc(m.name) + '</div>';
    html += '<div class="member-hero-title">' + m.title + '</div>';

    html += '<div class="member-hero-stats-row">';
    html += '<div class="mh-stat-col"><div class="mh-stat-lbl">XP deze week</div><div class="mh-stat-val">' + m.weekXP + ' XP</div></div>';
    html += '<div class="mh-stat-col"><div class="mh-stat-lbl">Streak</div><div class="mh-stat-val">🔥 ' + m.streak + ' dagen</div></div>';
    html += '<div class="mh-stat-col"><div class="mh-stat-lbl">Bijdrage</div><div class="mh-stat-val">' + m.contributionPercent + '%</div>'
      + '<div class="mh-stat-sub">van huishoudtaken</div></div>';
    html += '</div>';

    html += '<div class="member-hero-progress-bar"><div class="member-hero-progress-fill" style="width:' + pct + '%"></div></div>';
    html += '<div class="member-hero-progress-caption">' + m.xp + ' / ' + m.nextXP + ' XP tot level ' + (m.level + 1) + '</div>';
    html += '</div>';

    html += '</div>';
    return html;
  }

  function renderStatGrid(m) {
    var cards = [
      { icon: '📋', bg: '#3b6fe0', val: m.openCount, lbl: 'Open taken' },
      { icon: '✔', bg: '#22c55e', val: m.doneThisWeekCount, lbl: 'Voltooid' },
      { icon: '⭐', bg: '#d69f1c', val: m.weekXP, lbl: 'XP verdiend' },
      { icon: '🔥', bg: '#f97316', val: m.streak, lbl: 'Streak' }
    ];
    var html = '<div class="person-stat-grid">';
    cards.forEach(function (c) {
      html += '<div class="person-stat-card">'
        + '<div class="psc-icon-wrap" style="background:' + c.bg + '">' + c.icon + '</div>'
        + '<div class="psc-val">' + c.val + '</div><div class="psc-lbl">' + c.lbl + '</div></div>';
    });
    html += '</div>';
    return html;
  }

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

  function render(el) {
    if (!el) return;
    injectStyles();

    var members = buildMembers();
    // Contributie t.o.v. elkaar, gebaseerd op deze week voltooide taken
    var totalDoneWeek = members.reduce(function (s, m) { return s + m.doneThisWeekCount; }, 0);
    members.forEach(function (m) {
      m.contributionPercent = totalDoneWeek > 0 ? Math.round(m.doneThisWeekCount / totalDoneWeek * 100) : Math.round(100 / members.length);
    });

    if (!window.__personTabSelected || !members.some(function (m) { return m.id === window.__personTabSelected; })) {
      window.__personTabSelected = members[0].id;
    }
    var selected = members.find(function (m) { return m.id === window.__personTabSelected; }) || members[0];

    var html = '<div class="task-person-page">';
    html += renderMemberSelector(members, selected.id);
    html += renderHeroCard(selected);
    html += renderStatGrid(selected);
    html += renderOpenTaken(selected);
    html += '</div>';

    el.innerHTML = html;

    el.querySelectorAll('.member-card[data-person]').forEach(function (card) {
      card.addEventListener('click', function () {
        window.__personTabSelected = card.getAttribute('data-person');
        render(el);
      });
    });
  }

  // ── Override van de bestaande renderer (tasks.js) ──
  window.renderTasksPersoon = render;

  // Als de Persoon-tab al actief is wanneer dit script laadt, direct herrenderen
  if (typeof taskTab !== 'undefined' && taskTab === 'persoon') {
    var target = document.getElementById('task-content');
    if (target) render(target);
  }
})();
