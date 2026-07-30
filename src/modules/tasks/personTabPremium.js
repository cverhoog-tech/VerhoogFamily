'use strict';
// ============================================================
// PERSOON TAB — PREMIUM RPG CHARACTER SHEET (v1)
// Vervangt renderTasksPersoon() met een mobile-first,
// dark-fantasy/RPG "character sheet" weergave per gezinslid.
// Bouwt voort op bestaande data: myXP/partnerXP, getLevel(),
// LEVEL_TITLES, LEVEL_XP, recurData streaks, skillsData,
// en de quest-data uit fam_tasks_v023 (dezelfde bron als de
// bestaande Persoon-tab en de Overzicht-quest-UI).
// ============================================================

(function () {
  var VERSION = '1.0';

  // ── Gradient/glow paletten — zelfde taal als HeroCardRenderer ──
  var PALETTES = [
    { // "Jij" — electric blue
      bg: 'linear-gradient(135deg,#0f2555 0%,#1d4fd8 55%,#5b8dff 100%)',
      glow: 'rgba(37,99,235,.38)',
      accent: '#5b8dff',
      soft: 'rgba(91,141,255,.14)'
    },
    { // Partner — magenta/rose
      bg: 'linear-gradient(135deg,#4a0f38 0%,#c0257a 55%,#ff7fb8 100%)',
      glow: 'rgba(236,72,153,.38)',
      accent: '#ff7fb8',
      soft: 'rgba(255,127,184,.14)'
    },
    { // Extra gezinsleden — amber
      bg: 'linear-gradient(135deg,#4a2408 0%,#d97706 55%,#fbbf6a 100%)',
      glow: 'rgba(217,119,6,.36)',
      accent: '#fbbf6a',
      soft: 'rgba(251,191,106,.14)'
    },
    { // Extra — smaragd
      bg: 'linear-gradient(135deg,#0a3324 0%,#0d9467 55%,#5eead4 100%)',
      glow: 'rgba(13,148,103,.36)',
      accent: '#5eead4',
      soft: 'rgba(94,234,212,.14)'
    }
  ];

  function esc(v) {
    return String(v == null ? '' : v)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }

  // ── CSS injecteren (eenmalig, gescoped onder .task-person-page) ──
  function injectStyles() {
    if (document.getElementById('person-tab-premium-style')) return;
    var css = ''
      + '.task-person-page{background:radial-gradient(120% 140% at 20% -10%,#1a1440 0%,#0b0e1a 55%,#07080f 100%);' +
        'margin:0 -16px;padding:14px 16px 110px;min-height:100%;color:#f4f6ff;position:relative;overflow-x:hidden}'
      + '.task-person-page *{box-sizing:border-box}'
      + '.task-person-page .ptp-eyebrow{font-size:11px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:rgba(244,246,255,.45);margin:2px 2px 10px}'

      // ── Member selector ──
      + '.member-selector{display:flex;gap:10px;overflow-x:auto;padding:2px 2px 6px;margin-bottom:14px;scrollbar-width:none}'
      + '.member-selector::-webkit-scrollbar{display:none}'
      + '.member-card{flex:0 0 auto;width:84px;border-radius:20px;padding:10px 8px 9px;text-align:center;cursor:pointer;'
        + 'background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.08);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);'
        + 'transition:transform .15s,border-color .15s,background .15s}'
      + '.member-card:active{transform:scale(.95)}'
      + '.member-card-avatar{width:44px;height:44px;border-radius:50%;margin:0 auto 6px;object-fit:cover;display:block;'
        + 'border:2px solid rgba(255,255,255,.18)}'
      + '.member-card-avatar-fallback{width:44px;height:44px;border-radius:50%;margin:0 auto 6px;display:flex;align-items:center;justify-content:center;'
        + 'font-size:14px;font-weight:900;color:#0b0e1a}'
      + '.member-card-name{font-size:12px;font-weight:800;color:#f4f6ff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'
      + '.member-card-level{font-size:10px;font-weight:700;color:rgba(244,246,255,.55);margin-top:1px}'
      + '.member-card-active{border-color:var(--ptp-accent,#5b8dff);background:var(--ptp-soft,rgba(91,141,255,.14));'
        + 'box-shadow:0 0 0 1px var(--ptp-accent,#5b8dff),0 8px 22px var(--ptp-glow,rgba(37,99,235,.35))}'
      + '.member-card-add{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;'
        + 'background:rgba(255,255,255,.03);border:1.5px dashed rgba(255,255,255,.18);color:rgba(244,246,255,.5)}'
      + '.member-card-add-icon{width:44px;height:44px;border-radius:50%;border:1.5px dashed rgba(255,255,255,.25);'
        + 'display:flex;align-items:center;justify-content:center;font-size:18px;margin-bottom:2px}'

      // ── Hero card ──
      + '.member-hero-card{position:relative;border-radius:26px;overflow:hidden;padding:20px 18px;margin-bottom:14px;'
        + 'background:var(--ptp-bg);box-shadow:0 20px 46px var(--ptp-glow),inset 0 1px 0 rgba(255,255,255,.16)}'
      + '.member-hero-card::before{content:"";position:absolute;inset:0;pointer-events:none;'
        + 'background:radial-gradient(circle at 85% 0%,rgba(255,255,255,.20),transparent 42%),radial-gradient(circle at 0% 100%,rgba(255,255,255,.10),transparent 38%)}'
      + '.member-hero-top{position:relative;z-index:1;display:flex;align-items:center;gap:14px;margin-bottom:16px}'
      + '.member-hero-avatar-wrap{position:relative;flex-shrink:0}'
      + '.member-hero-avatar{width:66px;height:66px;border-radius:50%;object-fit:cover;display:block;'
        + 'border:3px solid rgba(255,255,255,.35);box-shadow:0 0 0 5px rgba(255,255,255,.08)}'
      + '.member-hero-avatar-fallback{width:66px;height:66px;border-radius:50%;display:flex;align-items:center;justify-content:center;'
        + 'font-size:22px;font-weight:900;color:#fff;border:3px solid rgba(255,255,255,.35);box-shadow:0 0 0 5px rgba(255,255,255,.08)}'
      + '.member-hero-lvl-badge{position:absolute;bottom:-4px;right:-6px;background:#0b0e1a;color:#fde68a;font-size:11px;font-weight:900;'
        + 'border-radius:999px;padding:2px 7px;border:2px solid rgba(255,255,255,.5);box-shadow:0 2px 8px rgba(0,0,0,.4)}'
      + '.member-hero-id{flex:1;min-width:0;position:relative;z-index:1}'
      + '.member-hero-name{font-size:21px;font-weight:950;letter-spacing:-.4px;line-height:1.1;'
        + 'text-shadow:0 2px 10px rgba(0,0,0,.25)}'
      + '.member-hero-title{font-size:12.5px;font-weight:700;color:rgba(255,255,255,.86);margin-top:3px;'
        + 'display:flex;align-items:center;gap:5px}'
      + '.member-hero-stats{position:relative;z-index:1;display:flex;gap:8px;margin-bottom:12px}'
      + '.mh-pill{flex:1;background:rgba(255,255,255,.14);backdrop-filter:blur(10px);border-radius:14px;padding:9px 8px;text-align:center}'
      + '.mh-pill-val{font-size:16px;font-weight:950;line-height:1.05}'
      + '.mh-pill-lbl{font-size:9.5px;font-weight:800;text-transform:uppercase;letter-spacing:.05em;color:rgba(255,255,255,.72);margin-top:2px}'
      + '.member-hero-progress-row{position:relative;z-index:1}'
      + '.mh-progress-labels{display:flex;justify-content:space-between;font-size:11px;font-weight:700;color:rgba(255,255,255,.82);margin-bottom:6px}'
      + '.mh-progress-bar{height:11px;border-radius:999px;background:rgba(255,255,255,.16);overflow:hidden;backdrop-filter:blur(8px)}'
      + '.mh-progress-fill{height:100%;border-radius:999px;background:linear-gradient(90deg,#fde68a,#fff);'
        + 'box-shadow:0 0 12px rgba(255,255,255,.55);transition:width .5s ease}'

      // ── Stat grid ──
      + '.person-stat-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:16px}'
      + '.person-stat-card{background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.08);border-radius:16px;'
        + 'padding:11px 6px;text-align:center;backdrop-filter:blur(10px)}'
      + '.psc-icon{font-size:17px;line-height:1}'
      + '.psc-val{font-size:17px;font-weight:950;color:#f4f6ff;margin-top:4px;line-height:1}'
      + '.psc-lbl{font-size:9.5px;font-weight:700;color:rgba(244,246,255,.5);margin-top:2px;text-transform:uppercase;letter-spacing:.04em}'

      // ── Section headers ──
      + '.ptp-section-title{font-size:13px;font-weight:900;color:rgba(244,246,255,.7);text-transform:uppercase;'
        + 'letter-spacing:.08em;margin:4px 2px 10px;display:flex;align-items:center;gap:6px}'

      // ── Contribution ──
      + '.contribution-card{background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.08);border-radius:20px;'
        + 'padding:14px 14px 12px;margin-bottom:18px;backdrop-filter:blur(10px)}'
      + '.contribution-bars{display:flex;flex-direction:column;gap:12px}'
      + '.contribution-row{display:flex;align-items:center;gap:10px}'
      + '.contribution-avatar{width:30px;height:30px;border-radius:50%;flex-shrink:0;object-fit:cover;border:1.5px solid rgba(255,255,255,.25)}'
      + '.contribution-avatar-fallback{width:30px;height:30px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;'
        + 'font-size:11px;font-weight:900;color:#0b0e1a}'
      + '.contribution-mid{flex:1;min-width:0}'
      + '.contribution-name-row{display:flex;justify-content:space-between;font-size:12.5px;font-weight:800;margin-bottom:5px}'
      + '.contribution-track{height:9px;border-radius:999px;background:rgba(255,255,255,.09);overflow:hidden}'
      + '.contribution-fill{height:100%;border-radius:999px;transition:width .5s ease}'
      + '.contribution-footnote{font-size:11px;color:rgba(244,246,255,.42);margin-top:2px;text-align:center}'

      // ── Task list ──
      + '.person-task-list{display:flex;flex-direction:column;gap:9px;margin-bottom:6px}'
      + '.person-task-card{display:flex;align-items:center;gap:11px;background:rgba(255,255,255,.045);'
        + 'border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:11px 12px;backdrop-filter:blur(10px);cursor:pointer;'
        + 'transition:transform .12s,border-color .12s}'
      + '.person-task-card:active{transform:scale(.98);border-color:rgba(255,255,255,.22)}'
      + '.ptc-check{width:26px;height:26px;border-radius:50%;border:2px solid rgba(255,255,255,.28);flex-shrink:0}'
      + '.ptc-body{flex:1;min-width:0}'
      + '.ptc-title{font-size:14px;font-weight:800;color:#f4f6ff;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}'
      + '.ptc-meta{display:flex;gap:6px;margin-top:4px;flex-wrap:wrap}'
      + '.ptc-tag{font-size:10px;font-weight:800;padding:2px 8px;border-radius:999px;background:rgba(255,255,255,.1);color:rgba(244,246,255,.75)}'
      + '.ptc-tag-xp{background:rgba(253,230,138,.16);color:#fde68a}'
      + '.ptc-arrow{font-size:17px;color:rgba(244,246,255,.35);flex-shrink:0}'
      + '.ptp-empty{text-align:center;padding:22px 10px;color:rgba(244,246,255,.45);font-size:13.5px;font-weight:700;'
        + 'background:rgba(255,255,255,.03);border-radius:16px;border:1px solid rgba(255,255,255,.06)}'

      // ── Skills ──
      + '.person-skills-grid{display:flex;flex-direction:column;gap:9px;margin-bottom:6px}'
      + '.person-skill-row{display:flex;align-items:center;gap:10px;background:rgba(255,255,255,.045);'
        + 'border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:9px 12px;backdrop-filter:blur(10px)}'
      + '.psr-icon{width:32px;height:32px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0}'
      + '.psr-mid{flex:1;min-width:0}'
      + '.psr-name{font-size:12.5px;font-weight:800;color:#f4f6ff}'
      + '.psr-track{height:6px;border-radius:999px;background:rgba(255,255,255,.09);overflow:hidden;margin-top:5px}'
      + '.psr-fill{height:100%;border-radius:999px}'
      + '.psr-pct{font-size:12px;font-weight:900;color:rgba(244,246,255,.7);flex-shrink:0;min-width:34px;text-align:right}'

      // ── Week progress ──
      + '.person-week-progress{display:flex;justify-content:space-between;gap:6px;background:rgba(255,255,255,.045);'
        + 'border:1px solid rgba(255,255,255,.08);border-radius:18px;padding:14px 10px 10px;backdrop-filter:blur(10px)}'
      + '.wp-col{flex:1;display:flex;flex-direction:column;align-items:center;gap:5px;min-width:0}'
      + '.wp-bar-track{width:100%;max-width:22px;height:64px;border-radius:8px;background:rgba(255,255,255,.08);'
        + 'display:flex;align-items:flex-end;overflow:hidden}'
      + '.wp-bar-fill{width:100%;border-radius:8px;background:linear-gradient(180deg,#fde68a,#fbbf24);'
        + 'box-shadow:0 0 10px rgba(251,191,36,.4);transition:height .5s ease}'
      + '.wp-day-label{font-size:9.5px;font-weight:800;color:rgba(244,246,255,.5);text-transform:uppercase}'
      + '.wp-val{font-size:10.5px;font-weight:900;color:#f4f6ff}'

      // ── Badges ──
      + '.person-badges{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:6px}'
      + '.badge-chip{display:flex;align-items:center;gap:6px;background:rgba(255,255,255,.06);'
        + 'border:1px solid rgba(255,255,255,.12);border-radius:999px;padding:8px 13px}'
      + '.badge-chip-icon{font-size:15px;line-height:1}'
      + '.badge-chip-label{font-size:11.5px;font-weight:800;color:#f4f6ff;white-space:nowrap}'

      // ── Divider spacing ──
      + '.ptp-section{margin-bottom:20px}'
      + '@media(min-width:480px){.task-person-page{margin:0}}';

    var styleEl = document.createElement('style');
    styleEl.id = 'person-tab-premium-style';
    styleEl.textContent = css;
    document.head.appendChild(styleEl);
  }

  // ── Helpers die bestaande app-state/logica hergebruiken ──
  function getAvatarFor(name, myNameLocal) {
    try {
      if (name.toLowerCase() === myNameLocal.toLowerCase()) {
        var url = localStorage.getItem('familyapp-current-user-avatar-v1');
        if (url) return url;
      }
      var stored = localStorage.getItem('fam_avatar_' + name.toLowerCase());
      if (stored) return stored;
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
    var totalXP = done.reduce(function (sum, x) { return sum + xpFromString(x[6]); }, 0);
    var weekXP = doneThisWeek.reduce(function (sum, x) { return sum + xpFromString(x[6]); }, 0);

    return {
      tasks: tasks, done: done, open: open,
      doneThisWeek: doneThisWeek,
      totalXP: totalXP, weekXP: weekXP
    };
  }

  // ── Week progress (Ma–Zo XP), gebaseerd op dezelfde quest-databron ──
  function weekXpBreakdownFor(name) {
    var raw = localStorage.getItem('fam_tasks_v023') || localStorage.getItem('fam_tasks_v022') || '[]';
    var allTasks;
    try { allTasks = JSON.parse(raw) || []; } catch (e) { allTasks = []; }

    var tasks = allTasks.filter(function (x) {
      return x[9] && x[5] && (x[5] === 'Beiden' || x[5].indexOf(name) > -1);
    });

    var now = new Date();
    var dow = (now.getDay() + 6) % 7; // 0 = maandag
    var weekStart = new Date(now);
    weekStart.setDate(now.getDate() - dow);
    weekStart.setHours(0, 0, 0, 0);

    var labels = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'];
    var totals = [0, 0, 0, 0, 0, 0, 0];

    tasks.forEach(function (x) {
      var raw2 = x[11] || x[4];
      if (!raw2) return;
      var d = new Date(String(raw2).replace(/^(\d{1,2})[\/\-](\d{1,2})/, '$1-$2'));
      if (isNaN(d.getTime())) return;
      d.setHours(0, 0, 0, 0);
      var diffDays = Math.round((d - weekStart) / 86400000);
      if (diffDays < 0 || diffDays > 6) return;
      totals[diffDays] += xpFromString(x[6]);
    });

    return labels.map(function (l, i) { return { label: l, xp: totals[i] }; });
  }

  function topSkillsFor(name) {
    if (typeof skillsData === 'undefined' || typeof SKILL_DEFS === 'undefined' || !skillsData[name]) return [];
    var rows = SKILL_DEFS.map(function (def) {
      var d = skillsData[name][def.id] || { xp: 0 };
      return { id: def.id, icon: def.icon, name: def.name, color: def.color, xp: d.xp || 0 };
    }).filter(function (r) { return r.xp > 0; });
    var total = rows.reduce(function (s, r) { return s + r.xp; }, 0) || 1;
    rows.forEach(function (r) { r.pct = Math.round(r.xp / total * 100); });
    rows.sort(function (a, b) { return b.xp - a.xp; });
    return rows.slice(0, 4);
  }

  function maxStreakFor(name) {
    if (typeof recurData === 'undefined') return 0;
    return recurData.reduce(function (m, r) {
      if (r.who && r.who.indexOf(name) > -1) return Math.max(m, r.streak || 0);
      return m;
    }, 0);
  }

  // ── Badges — afgeleid van echte voortgangssignalen, geen afrekenlogica ──
  function computeBadges(m) {
    var badges = [];
    if (m.streak >= 3) badges.push({ icon: '🔥', label: 'Streak Keeper' });
    if (m.doneThisWeekCount >= 5) badges.push({ icon: '⚔️', label: 'Quest Finisher' });
    var weekendXP = (m.weekBreakdown[5] ? m.weekBreakdown[5].xp : 0) + (m.weekBreakdown[6] ? m.weekBreakdown[6].xp : 0);
    if (weekendXP > 0) badges.push({ icon: '🏆', label: 'Weekend Hero' });
    if (m.skills && m.skills[0] && m.skills[0].pct >= 40) {
      badges.push({ icon: m.skills[0].icon || '🧠', label: m.skills[0].name + ' Guardian' });
    }
    if (!badges.length) badges.push({ icon: '🌱', label: 'Nieuwe Avonturier' });
    return badges;
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
      var avatar = getAvatarFor(name, meName);
      var palette = PALETTES[i % PALETTES.length];
      var skills = topSkillsFor(name);
      var weekBreakdown = weekXpBreakdownFor(name);

      var member = {
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
        openTasks: qs.open,
        skills: skills,
        weekBreakdown: weekBreakdown
      };
      member.badges = computeBadges(member);
      return member;
    });
  }

  function renderMemberSelector(members, selectedId) {
    var html = '<div class="member-selector">';
    members.forEach(function (m) {
      var active = m.id === selectedId;
      html += '<div class="member-card' + (active ? ' member-card-active' : '') + '" '
        + 'style="' + (active ? '--ptp-accent:' + m.palette.accent + ';--ptp-soft:' + m.palette.soft + ';--ptp-glow:' + m.palette.glow + ';' : '') + '" '
        + 'data-person="' + esc(m.id) + '">';
      if (m.avatar) {
        html += '<img class="member-card-avatar" src="' + esc(m.avatar) + '" onerror="this.style.display=\'none\'">';
      } else {
        html += '<div class="member-card-avatar-fallback" style="background:' + m.palette.accent + '">' + esc(m.initials) + '</div>';
      }
      html += '<div class="member-card-name">' + esc(m.name) + '</div>';
      html += '<div class="member-card-level">Lv ' + m.level + '</div>';
      html += '</div>';
    });
    html += '<div class="member-card member-card-add" onclick="if(window.showToast)showToast(\'👨‍👩‍👧‍👦 Gezinslid toevoegen komt binnenkort\')">'
      + '<div class="member-card-add-icon">+</div><div class="member-card-name">Toevoegen</div></div>';
    html += '</div>';
    return html;
  }

  function renderHeroCard(m) {
    var pct = m.nextXP > m.prevXP ? Math.max(0, Math.min(100, Math.round((m.xp - m.prevXP) / (m.nextXP - m.prevXP) * 100))) : 100;
    var html = '<div class="member-hero-card" style="--ptp-bg:' + m.palette.bg + ';--ptp-glow:' + m.palette.glow + '">';

    html += '<div class="member-hero-top">';
    html += '<div class="member-hero-avatar-wrap">';
    if (m.avatar) {
      html += '<img class="member-hero-avatar" src="' + esc(m.avatar) + '" onerror="this.style.display=\'none\'">';
    } else {
      html += '<div class="member-hero-avatar-fallback" style="background:' + m.palette.accent + '22;color:#fff">' + esc(m.initials) + '</div>';
    }
    html += '<div class="member-hero-lvl-badge">Lv ' + m.level + '</div>';
    html += '</div>';
    html += '<div class="member-hero-id">';
    html += '<div class="member-hero-name">' + esc(m.name) + '</div>';
    html += '<div class="member-hero-title">' + m.title + '</div>';
    html += '</div>';
    html += '</div>';

    html += '<div class="member-hero-stats">';
    html += '<div class="mh-pill"><div class="mh-pill-val">' + m.weekXP + '</div><div class="mh-pill-lbl">XP deze week</div></div>';
    html += '<div class="mh-pill"><div class="mh-pill-val">🔥 ' + m.streak + '</div><div class="mh-pill-lbl">Streak</div></div>';
    html += '<div class="mh-pill"><div class="mh-pill-val">' + m.contributionPercent + '%</div><div class="mh-pill-lbl">Bijdrage</div></div>';
    html += '</div>';

    html += '<div class="member-hero-progress-row">';
    html += '<div class="mh-progress-labels"><span>' + m.xp + ' / ' + m.nextXP + ' XP</span><span>Level ' + (m.level + 1) + ' →</span></div>';
    html += '<div class="mh-progress-bar"><div class="mh-progress-fill" style="width:' + pct + '%"></div></div>';
    html += '</div>';

    html += '</div>';
    return html;
  }

  function renderStatGrid(m) {
    var cards = [
      { icon: '📋', val: m.openCount, lbl: 'Open taken' },
      { icon: '✅', val: m.doneThisWeekCount, lbl: 'Voltooid' },
      { icon: '⭐', val: m.weekXP, lbl: 'XP verdiend' },
      { icon: '🔥', val: m.streak, lbl: 'Streak' }
    ];
    var html = '<div class="person-stat-grid">';
    cards.forEach(function (c) {
      html += '<div class="person-stat-card"><div class="psc-icon">' + c.icon + '</div>'
        + '<div class="psc-val">' + c.val + '</div><div class="psc-lbl">' + c.lbl + '</div></div>';
    });
    html += '</div>';
    return html;
  }

  function renderContribution(members) {
    var html = '<div class="ptp-section">';
    html += '<div class="ptp-section-title">🏆 Bijdrage deze week</div>';
    html += '<div class="contribution-card"><div class="contribution-bars">';
    members.forEach(function (m) {
      html += '<div class="contribution-row">';
      if (m.avatar) {
        html += '<img class="contribution-avatar" src="' + esc(m.avatar) + '" onerror="this.style.display=\'none\'">';
      } else {
        html += '<div class="contribution-avatar-fallback" style="background:' + m.palette.accent + '">' + esc(m.initials) + '</div>';
      }
      html += '<div class="contribution-mid">';
      html += '<div class="contribution-name-row"><span>' + esc(m.name) + '</span><span>' + m.contributionPercent + '%</span></div>';
      html += '<div class="contribution-track"><div class="contribution-fill" style="width:' + m.contributionPercent + '%;background:' + m.palette.accent + '"></div></div>';
      html += '</div></div>';
    });
    html += '</div><div class="contribution-footnote">Huishoud-XP verdeeld over het gezin — samen sterker 💪</div></div>';
    html += '</div>';
    return html;
  }

  function renderOpenQuests(m) {
    var html = '<div class="ptp-section">';
    html += '<div class="ptp-section-title">⚔️ Open quests</div>';
    if (!m.openTasks.length) {
      html += '<div class="ptp-empty">🎉 Alle quests voltooid — top gedaan!</div>';
    } else {
      html += '<div class="person-task-list">';
      m.openTasks.forEach(function (x) {
        var isRaid = x[1] && x[1].indexOf('RAID') > -1;
        var isDung = x[1] && x[1].indexOf('DUNGEON') > -1;
        var cat = x[1] || (isRaid ? 'Raid' : isDung ? 'Dungeon' : 'Quest');
        html += '<div class="person-task-card" onclick="if(window.famDetail)famDetail(\'' + esc(x[0]) + '\')">';
        html += '<div class="ptc-check"></div>';
        html += '<div class="ptc-body"><div class="ptc-title">' + esc(x[2]) + '</div>';
        html += '<div class="ptc-meta"><span class="ptc-tag">' + esc(cat) + '</span>'
          + '<span class="ptc-tag">' + esc(x[11] || x[4] || 'Binnenkort') + '</span>'
          + '<span class="ptc-tag ptc-tag-xp">' + esc(x[6] || '') + '</span></div></div>';
        html += '<div class="ptc-arrow">›</div></div>';
      });
      html += '</div>';
    }
    html += '</div>';
    return html;
  }

  function renderTopSkills(m) {
    if (!m.skills.length) return '';
    var html = '<div class="ptp-section">';
    html += '<div class="ptp-section-title">🧠 Top skills</div>';
    html += '<div class="person-skills-grid">';
    m.skills.forEach(function (s) {
      html += '<div class="person-skill-row">';
      html += '<div class="psr-icon" style="background:' + s.color + '22">' + s.icon + '</div>';
      html += '<div class="psr-mid"><div class="psr-name">' + esc(s.name) + '</div>';
      html += '<div class="psr-track"><div class="psr-fill" style="width:' + s.pct + '%;background:' + s.color + '"></div></div></div>';
      html += '<div class="psr-pct">' + s.pct + '%</div>';
      html += '</div>';
    });
    html += '</div></div>';
    return html;
  }

  function renderWeekProgress(m) {
    var max = Math.max.apply(null, m.weekBreakdown.map(function (d) { return d.xp; })) || 1;
    var html = '<div class="ptp-section">';
    html += '<div class="ptp-section-title">📊 Week progress</div>';
    html += '<div class="person-week-progress">';
    m.weekBreakdown.forEach(function (d) {
      var h = Math.round((d.xp / max) * 100);
      html += '<div class="wp-col">';
      html += '<div class="wp-bar-track"><div class="wp-bar-fill" style="height:' + (d.xp > 0 ? Math.max(h, 6) : 0) + '%"></div></div>';
      html += '<div class="wp-day-label">' + d.label + '</div>';
      html += '<div class="wp-val">' + d.xp + '</div>';
      html += '</div>';
    });
    html += '</div></div>';
    return html;
  }

  function renderBadges(m) {
    var html = '<div class="ptp-section">';
    html += '<div class="ptp-section-title">🎖️ Badges</div>';
    html += '<div class="person-badges">';
    m.badges.forEach(function (b) {
      html += '<div class="badge-chip"><span class="badge-chip-icon">' + b.icon + '</span>'
        + '<span class="badge-chip-label">' + esc(b.label) + '</span></div>';
    });
    html += '</div></div>';
    return html;
  }

  function render(el) {
    if (!el) return;
    injectStyles();

    var members = buildMembers();
    // Contributie t.o.v. elkaar, gebaseerd op deze week voltooide quests
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
    html += renderContribution(members);
    html += renderOpenQuests(selected);
    html += renderTopSkills(selected);
    html += renderWeekProgress(selected);
    html += renderBadges(selected);
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
