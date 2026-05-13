'use strict';
// ============================================================
// THEMA & DARK MODE
// ============================================================

var THEMES = [
  {id:'nature',  label:'🌿 Natuur',  base:'',       colors:['#2d5a27','#4a8a42','#e8f5e3']},
  {id:'kawaii',  label:'🌸 Kawaii',  base:'kawaii', colors:['#e05c9a','#f472b6','#fce4f1']},
  {id:'winter',  label:'❄️ Winter',  base:'winter', colors:['#1a6fa8','#38bdf8','#dbeafe']},
  {id:'autumn',  label:'🍂 Herfst',  base:'autumn', colors:['#b45309','#f59e0b','#fff7ed']},
  {id:'modern',  label:'⚡ Modern',  base:'modern', colors:['#6366f1','#8b5cf6','#eef2ff']},
  {id:'summer',  label:'☀️ Zomer',  base:'summer', colors:['#059669','#10b981','#d1fae5']}
];

// SVG background illustrations per theme
var THEME_BGS = {
  nature: '<svg viewBox="0 0 480 280" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice"><ellipse cx="400" cy="40" rx="120" ry="120" fill="#2d5a27" opacity=".06"/><ellipse cx="60" cy="200" rx="80" ry="80" fill="#4a8a42" opacity=".05"/><circle cx="320" cy="220" r="60" fill="#2d5a27" opacity=".04"/><text x="350" y="120" font-size="48" opacity=".12">🌿</text><text x="30" y="80" font-size="32" opacity=".1">🍃</text><text x="200" y="240" font-size="28" opacity=".09">✨</text></svg>',
  kawaii: '<svg viewBox="0 0 480 280" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice"><circle cx="420" cy="50" r="90" fill="#f472b6" opacity=".08"/><circle cx="80" cy="180" r="60" fill="#e05c9a" opacity=".06"/><circle cx="260" cy="230" r="50" fill="#f9a8d4" opacity=".07"/><text x="340" y="130" font-size="52" opacity=".18">🐱</text><text x="40" y="90" font-size="28" opacity=".15">🌸</text><text x="170" y="60" font-size="22" opacity=".13">💕</text><text x="60" y="240" font-size="22" opacity=".12">⭐</text><text x="400" y="230" font-size="18" opacity=".12">🌷</text></svg>',
  winter: '<svg viewBox="0 0 480 280" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice"><circle cx="380" cy="60" r="100" fill="#38bdf8" opacity=".07"/><circle cx="100" cy="200" r="70" fill="#1a6fa8" opacity=".06"/><text x="340" y="120" font-size="48" opacity=".14">❄️</text><text x="60" y="80" font-size="30" opacity=".12">🌨</text><text x="200" y="250" font-size="26" opacity=".11">⛄</text><text x="410" y="220" font-size="22" opacity=".11">✨</text></svg>',
  autumn: '<svg viewBox="0 0 480 280" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice"><ellipse cx="400" cy="40" rx="110" ry="100" fill="#f59e0b" opacity=".08"/><ellipse cx="70" cy="210" rx="75" ry="65" fill="#b45309" opacity=".06"/><text x="340" y="120" font-size="48" opacity=".15">🍂</text><text x="55" y="80" font-size="30" opacity=".13">🍁</text><text x="190" y="250" font-size="26" opacity=".12">🎃</text><text x="405" y="230" font-size="22" opacity=".11">🌰</text></svg>',
  modern: '<svg viewBox="0 0 480 280" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice"><rect x="330" y="-20" width="180" height="180" rx="40" fill="#8b5cf6" opacity=".07" transform="rotate(20 420 70)"/><circle cx="80" cy="220" r="70" fill="#6366f1" opacity=".06"/><rect x="180" y="200" width="100" height="100" rx="20" fill="#c4b5fd" opacity=".06" transform="rotate(-15 230 250)"/><text x="350" y="120" font-size="44" opacity=".13">⚡</text><text x="55" y="85" font-size="28" opacity=".12">🔷</text><text x="200" y="240" font-size="22" opacity=".1">💫</text></svg>',
  summer: '<svg viewBox="0 0 480 280" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice"><circle cx="400" cy="50" r="100" fill="#10b981" opacity=".07"/><circle cx="80" cy="190" r="65" fill="#059669" opacity=".06"/><text x="340" y="120" font-size="48" opacity=".14">☀️</text><text x="55" y="80" font-size="30" opacity=".12">🌺</text><text x="195" y="248" font-size="26" opacity=".11">🌊</text><text x="405" y="225" font-size="22" opacity=".11">🐚</text></svg>'
};

var currentTheme = 'nature';
// White style is the default; keep the app light unless the user explicitly toggles dark mode.
var isDark = (function(){
  var saved = localStorage.getItem('familie_theme_dark');
  if(saved !== null) return saved === '1';
  return false;
})();
// Track system preference changes
if(window.matchMedia){
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change',function(e){
    if(localStorage.getItem('familie_theme_dark')===null){ isDark=e.matches; applyTheme(currentTheme,isDark); }
  });
}

function applyTheme(themeId, dark) {
  currentTheme = themeId;
  isDark = dark;
  var theme = THEMES.find(function(t){return t.id===themeId;}) || THEMES[0];
  var attr = '';
  if(themeId === 'nature') attr = dark ? 'dark' : '';
  else attr = themeId + (dark ? '-dark' : '');
  document.documentElement.setAttribute('data-theme', attr);
  updateDarkToggleUI();
  updateThemeGridUI();
  renderHomeBg(themeId);
}

// ── APP ICOON ──
var appIconEmoji = localStorage.getItem('familie_icon_emoji') || '🏠';
var appIconColor = localStorage.getItem('familie_icon_color') || '#2d5a27';
var appIconPhotoData = localStorage.getItem('familie_icon_photo') || null;

function buildIconSvg(emoji, color) {
  var enc = encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">'
    +'<rect width="100" height="100" rx="22" fill="'+color+'"/>'
    +'<text y="68" x="50" text-anchor="middle" font-size="58">'+emoji+'</text>'
    +'</svg>'
  );
  return 'data:image/svg+xml,' + enc;
}

function applyAppIcon() {
  var src;
  if(appIconPhotoData) {
    src = appIconPhotoData;
  } else if(typeof BUILTIN_VISUALS !== 'undefined' && BUILTIN_VISUALS.appIcon) {
    src = BUILTIN_VISUALS.appIcon;
  } else {
    src = buildIconSvg(appIconEmoji, appIconColor);
  }
  var ati = document.getElementById('apple-touch-icon');
  var fav = document.getElementById('favicon');
  if(ati) ati.href = src;
  if(fav) fav.href = src;

  // Update preview
  var prev = document.getElementById('icon-preview');
  if(prev) {
    if(appIconPhotoData) {
      prev.innerHTML = '<img src="'+appIconPhotoData+'" style="width:100%;height:100%;object-fit:cover">';
    } else {
      prev.style.background = appIconColor;
      prev.textContent = appIconEmoji;
    }
  }
}

function setAppIcon(type, value) {
  if(type === 'emoji') {
    appIconEmoji = value;
    appIconPhotoData = null;
    localStorage.removeItem('familie_icon_photo');
    // Highlight selected
    document.querySelectorAll('.icon-pick-btn').forEach(function(b){
      b.classList.toggle('selected', b.textContent === value);
    });
  }
  applyAppIcon();
}

function setIconColor(color) {
  appIconColor = color;
  appIconPhotoData = null;
  localStorage.removeItem('familie_icon_photo');
  localStorage.setItem('familie_icon_color', color);
  // Highlight selected color
  document.querySelectorAll('.icon-color-btn').forEach(function(b){
    b.style.borderColor = b.style.background === color ? '#333' : 'transparent';
  });
  applyAppIcon();
}

function saveAppIconToLink() {
  localStorage.setItem('familie_icon_emoji', appIconEmoji);
  localStorage.setItem('familie_icon_color', appIconColor);
  applyAppIcon();
  var st = document.getElementById('icon-save-status');
  if(st) st.innerHTML = '<span style="color:#16a34a">✓ Opgeslagen! Voeg de app toe aan je beginscherm om het nieuwe icoon te zien.</span>';
  showToast('App icoon opgeslagen ✓');
}

// Wire photo upload for icon
(function(){
  var savedEmoji = localStorage.getItem('familie_icon_emoji');
  var savedColor = localStorage.getItem('familie_icon_color');
  var savedPhoto = localStorage.getItem('familie_icon_photo');
  if(savedEmoji) appIconEmoji = savedEmoji;
  if(savedColor) appIconColor = savedColor;
  if(savedPhoto) appIconPhotoData = savedPhoto;
  // Apply on load
  setTimeout(applyAppIcon, 100);
})();


// Store per theme: {photo: dataUrl, blur: 8, opacity: 20}
var customBgs = {}; // {themeId: {photo, blur, opacity}}
var bgEditTheme = null; // which theme we're currently editing in profile

// Built-in visuals generated for the refreshed white FamilyApp style.
var BUILTIN_VISUALS = {
  whiteDashboard: 'familieapp_white_assets/familyapp_white_dashboard.webp',
  whiteDashboardMobile: 'familieapp_white_assets/familyapp_white_dashboard_mobile.webp',
  appIcon: 'familieapp_white_assets/familyapp_app_icon.png',
  iconSheet: 'familieapp_white_assets/familyapp_icon_sheet.webp'
};

// Load from localStorage on start
(function(){
  try {
    var saved = localStorage.getItem('familie_custom_bgs');
    if(saved) customBgs = JSON.parse(saved);
  } catch(e){}
})();

function saveCustomBgs() {
  try { localStorage.setItem('familie_custom_bgs', JSON.stringify(customBgs)); } catch(e){}
}

function renderHomeBg(themeId) {
  var bg = document.getElementById('home-bg');
  if(!bg) return;

  var custom = customBgs[themeId];
  if(custom && custom.photo) {
    // Custom uploaded photo — show as blurred, faded background
    var blur = custom.blur !== undefined ? custom.blur : 8;
    var opacity = custom.opacity !== undefined ? custom.opacity / 100 : 0.20;
    bg.innerHTML = '';
    bg.style.backgroundImage = 'url('+custom.photo+')';
    bg.style.backgroundSize  = 'cover';
    bg.style.backgroundPosition = 'center top';
    bg.style.filter = 'blur('+blur+'px)';
    bg.style.opacity = opacity;
    bg.style.transform = 'scale(1.08)'; // prevent blur edges
  } else {
    // Default white-style visual
    bg.style.filter = '';
    bg.style.opacity = '1';
    bg.style.transform = '';
    if(themeId === 'nature' && typeof BUILTIN_VISUALS !== 'undefined') {
      bg.innerHTML = '';
      bg.style.backgroundImage = 'linear-gradient(180deg, rgba(255,255,255,.18), rgba(255,255,255,.88)), url('+BUILTIN_VISUALS.whiteDashboardMobile+')';
      bg.style.backgroundSize  = 'cover';
      bg.style.backgroundPosition = 'center 8%';
    } else {
      bg.style.backgroundImage = '';
      var svg = THEME_BGS[themeId] || THEME_BGS.nature;
      bg.innerHTML = svg;
    }
  }
}

function renderBgEditor() {
  // Tab bar — one tab per theme
  var tabsEl = document.getElementById('bg-theme-tabs');
  if(!tabsEl) return;
  bgEditTheme = bgEditTheme || currentTheme;

  tabsEl.innerHTML = THEMES.map(function(t){
    var hasCustBg = !!(customBgs[t.id] && customBgs[t.id].photo);
    var isActive = bgEditTheme === t.id;
    return '<button data-bgtheme="'+t.id+'" style="'
      +'padding:6px 12px;border-radius:20px;border:1.5px solid '+(isActive?'var(--c-primary)':'var(--c-border)')+';'
      +'background:'+(isActive?'var(--c-primary)':'var(--c-surface)')+';'
      +'color:'+(isActive?'#fff':'var(--c-text2)')+';'
      +'font-size:11px;font-weight:700;cursor:pointer;'
      +'position:relative">'
      + t.label.split(' ').slice(1).join(' ')
      +(hasCustBg?'<span style="position:absolute;top:-4px;right:-4px;width:8px;height:8px;background:var(--c-primary);border-radius:50%;border:1.5px solid var(--c-surface)"></span>':'')
      +'</button>';
  }).join('');

  // Attach tab events
  tabsEl.querySelectorAll('[data-bgtheme]').forEach(function(btn){
    btn.onclick = function(){
      bgEditTheme = btn.dataset.bgtheme;
      renderBgEditor();
    };
  });

  // Show current theme's settings
  var custom = customBgs[bgEditTheme];
  var previewWrap = document.getElementById('bg-preview-wrap');
  var emptyWrap   = document.getElementById('bg-empty-wrap');
  var previewImg  = document.getElementById('bg-preview-img');
  var blurInp     = document.getElementById('bg-blur');
  var opacityInp  = document.getElementById('bg-opacity');
  var blurVal     = document.getElementById('bg-blur-val');
  var opacityVal  = document.getElementById('bg-opacity-val');

  if(custom && custom.photo) {
    if(previewWrap) previewWrap.style.display = 'block';
    if(emptyWrap)   emptyWrap.style.display   = 'none';
    if(previewImg)  previewImg.src = custom.photo;
    var bl = custom.blur !== undefined ? custom.blur : 8;
    var op = custom.opacity !== undefined ? custom.opacity : 20;
    if(blurInp)    blurInp.value    = bl;
    if(opacityInp) opacityInp.value = op;
    if(blurVal)    blurVal.textContent    = bl+'px';
    if(opacityVal) opacityVal.textContent = op+'%';
  } else {
    if(previewWrap) previewWrap.style.display = 'none';
    if(emptyWrap)   emptyWrap.style.display   = 'flex';
    if(blurInp)    blurInp.value    = 8;
    if(opacityInp) opacityInp.value = 20;
    if(blurVal)    blurVal.textContent    = '8px';
    if(opacityVal) opacityVal.textContent = '20%';
  }

  // Re-attach file input handler (fresh each render)
  var fileInp = document.getElementById('bg-file-inp');
  if(fileInp) {
    fileInp.onchange = function(e){
      var file = e.target.files[0];
      if(!file) return;
      var reader = new FileReader();
      reader.onload = function(ev){
        if(!customBgs[bgEditTheme]) customBgs[bgEditTheme] = {};
        customBgs[bgEditTheme].photo   = ev.target.result;
        customBgs[bgEditTheme].blur    = parseInt(document.getElementById('bg-blur').value)||8;
        customBgs[bgEditTheme].opacity = parseInt(document.getElementById('bg-opacity').value)||20;
        renderBgEditor();
        // Live preview on home if this is the current theme
        if(bgEditTheme === currentTheme) renderHomeBg(currentTheme);
        document.getElementById('bg-save-status').innerHTML =
          '<span style="color:#d97706">📸 Foto geladen — tik Opslaan om te bewaren</span>';
      };
      reader.readAsDataURL(file);
      fileInp.value = '';
    };
  }
}

function updateBgBlur(val) {
  var el = document.getElementById('bg-blur-val');
  if(el) el.textContent = val+'px';
  // Live preview
  if(customBgs[bgEditTheme] && customBgs[bgEditTheme].photo) {
    customBgs[bgEditTheme].blur = parseInt(val);
    if(bgEditTheme === currentTheme) renderHomeBg(currentTheme);
  }
}

function updateBgOpacity(val) {
  var el = document.getElementById('bg-opacity-val');
  if(el) el.textContent = val+'%';
  if(customBgs[bgEditTheme] && customBgs[bgEditTheme].photo) {
    customBgs[bgEditTheme].opacity = parseInt(val);
    if(bgEditTheme === currentTheme) renderHomeBg(currentTheme);
  }
}

function saveBgPhoto() {
  var custom = customBgs[bgEditTheme];
  if(!custom || !custom.photo) {
    document.getElementById('bg-save-status').innerHTML =
      '<span style="color:#dc2626">Upload eerst een foto</span>';
    return;
  }
  custom.blur    = parseInt(document.getElementById('bg-blur').value)||8;
  custom.opacity = parseInt(document.getElementById('bg-opacity').value)||20;
  saveCustomBgs();
  if(bgEditTheme === currentTheme) renderHomeBg(currentTheme);
  renderBgEditor();
  var t = THEMES.find(function(x){return x.id===bgEditTheme;});
  document.getElementById('bg-save-status').innerHTML =
    '<span style="color:#16a34a">✓ Opgeslagen voor thema '+(t?t.label:bgEditTheme)+'</span>';
  showToast('Achtergrond opgeslagen ✓');
}

function removeBgPhoto() {
  if(customBgs[bgEditTheme]) {
    customBgs[bgEditTheme] = {};
    saveCustomBgs();
    if(bgEditTheme === currentTheme) renderHomeBg(currentTheme);
    renderBgEditor();
    document.getElementById('bg-save-status').innerHTML =
      '<span style="color:var(--c-text2)">Achtergrond verwijderd</span>';
  }
}



function toggleDark() {
  isDark = !isDark;
  localStorage.setItem('familie_theme_dark', isDark?'1':'0');
  applyTheme(currentTheme, isDark);
}

function updateDarkToggleUI() {
  var btn = document.getElementById('dark-toggle');
  var knob = document.getElementById('dark-knob');
  if(!btn || !knob) return;
  btn.style.background = isDark ? 'var(--c-primary)' : 'var(--c-border)';
  knob.style.transform = isDark ? 'translateX(22px)' : 'translateX(0)';
  knob.textContent = isDark ? '🌙' : '☀️';
}

function renderThemeGrid() {
  var grid = document.getElementById('theme-grid');
  if(!grid) return;
  grid.innerHTML = THEMES.map(function(t) {
    var active = currentTheme === t.id;
    return '<button onclick="applyTheme(\''+t.id+'\',isDark)" style="'
      +'background:'+(active?'var(--c-primary)':'var(--c-surface)')+';'
      +'border:2px solid '+(active?'var(--c-primary)':'var(--c-border)')+';'
      +'border-radius:14px;padding:10px 6px;cursor:pointer;transition:all .2s;'
      +'display:flex;flex-direction:column;align-items:center;gap:6px">'
      +'<div style="display:flex;gap:3px">'
      +t.colors.map(function(c){return '<div style="width:14px;height:14px;border-radius:50%;background:'+c+'"></div>';}).join('')
      +'</div>'
      +'<div style="font-size:11px;font-weight:700;color:'+(active?'#fff':'var(--c-text2)')+'">'+t.label+'</div>'
      +'</button>';
  }).join('');
}

function updateThemeGridUI() {
  renderThemeGrid();
}

// ── THEME-AWARE PARTICLES ──
function themeParticles(el) {
  if(currentTheme === 'kawaii') {
    spawnKawaiiParticles(el);
  } else {
    spawnParticles(el);
  }
}

function spawnKawaiiParticles(el) {
  if(!el) return;
  var rect = el.getBoundingClientRect();
  var cx = rect.left + rect.width/2;
  var cy = rect.top + rect.height/2;
  var emojis = ['💕','🌸','✨','💖','⭐','🩷','🌷'];
  for(var i=0;i<5;i++){
    (function(j){
      var p = document.createElement('div');
      p.className = j%2===0 ? 'kawaii-heart' : 'kawaii-star';
      p.textContent = emojis[j % emojis.length];
      p.style.left = (cx + (Math.random()-.5)*50) + 'px';
      p.style.top = cy + 'px';
      p.style.animationDelay = (j * .08) + 's';
      document.body.appendChild(p);
      setTimeout(function(){p.remove();}, 1000);
    })(i);
  }
}





function renderProfile(){
  updateHomeXP();
  var lv=getLevel(myXP);
  var nextXP=LEVEL_XP[Math.min(lv,LEVEL_XP.length-1)]||LEVEL_XP[LEVEL_XP.length-1];
  var prevXP=LEVEL_XP[lv-1]||0;
  var pct=nextXP>prevXP?Math.round((myXP-prevXP)/(nextXP-prevXP)*100):100;
  var av=document.getElementById('prof-avatar');if(av)av.textContent=myInitials;
  var pn=document.getElementById('prof-name');if(pn)pn.textContent=myName;
  var pl=document.getElementById('prof-level');if(pl)pl.textContent='Level '+lv+' · '+getLevelName(lv);
  var xf=document.getElementById('xp-fill');if(xf)xf.style.width=pct+'%';
  var xt=document.getElementById('xp-text');if(xt)xt.textContent=myXP+' XP';
  var ni=document.getElementById('prof-name-inp');if(ni)ni.value=myName;
  var pi=document.getElementById('prof-partner-inp');if(pi)pi.value=partnerName;
  var ki=document.getElementById('api-key-inp');
  if(ki) ki.value=GEMINI_API_KEY||'';
  var ks=document.getElementById('api-key-status');
  if(ks) ks.innerHTML=GEMINI_API_KEY
    ? '<span style="color:#16a34a">✓ Gemini key ingesteld ('+GEMINI_API_KEY.substring(0,8)+'...)</span>'
    : '<span style="color:#d97706">⚠️ Geen API key — AI werkt niet. Zie instructies hieronder.</span>';
  renderThemeGrid();
  updateDarkToggleUI();
  renderBgEditor();

  // Wire icon photo upload
  var iconInp = document.getElementById('icon-photo-inp');
  if(iconInp && !iconInp._wired) {
    iconInp._wired = true;
    iconInp.onchange = function(e) {
      var file = e.target.files[0]; if(!file) return;
      var reader = new FileReader();
      reader.onload = function(ev) {
        appIconPhotoData = ev.target.result;
        localStorage.setItem('familie_icon_photo', ev.target.result);
        applyAppIcon();
        var st = document.getElementById('icon-save-status');
        if(st) st.innerHTML = '<span style="color:#d97706">📸 Foto geladen — tik Opslaan om te bewaren</span>';
      };
      reader.readAsDataURL(file);
      iconInp.value = '';
    };
  }

  // Show current icon selection
  applyAppIcon();
  document.querySelectorAll('.icon-pick-btn').forEach(function(b){
    b.classList.toggle('selected', b.textContent === appIconEmoji);
  });
  document.querySelectorAll('.icon-color-btn').forEach(function(b){
    b.style.borderColor = b.style.background === appIconColor ? '#333' : 'transparent';
  });
}

function saveName(){
  var v=document.getElementById('prof-name-inp').value.trim();
  if(v){myName=v;myInitials=v.substring(0,2).toUpperCase();}
  renderProfile();updateHeaderAvatar();showToast('Naam opgeslagen ✓');
}
function savePartner(){
  var v=document.getElementById('prof-partner-inp').value.trim();
  if(v)partnerName=v;
  showToast('Partner naam opgeslagen ✓');
}

function saveApiKey() {
  var v = (document.getElementById('api-key-inp')||{}).value||'';
  v = v.trim();
  if(!v) { showToast('Vul een API key in'); return; }
  if(!v.startsWith('AIza')) {
    var s=document.getElementById('api-key-status');
    if(s)s.innerHTML='<span style="color:#dc2626">❌ Gemini key begint met AIza...</span>';
    return;
  }
  GEMINI_API_KEY = v;
  localStorage.setItem('familie_gemini_key', v);
  var s=document.getElementById('api-key-status');
  if(s)s.innerHTML='<span style="color:#16a34a">✓ Opgeslagen!</span>';
  showToast('Gemini API key opgeslagen ✓');
}

function toggleApiKeyVis() {
  var inp = document.getElementById('api-key-inp');
  if(inp) inp.type = inp.type==='password' ? 'text' : 'password';
}

function testApiKey() {
  var s = document.getElementById('api-key-status');
  if(!GEMINI_API_KEY) {
    if(s)s.innerHTML='<span style="color:#dc2626">❌ Geen key ingesteld</span>';
    return;
  }
  if(s)s.innerHTML='<span style="color:var(--c-text2)">⏳ Testen...</span>';
  callGemini('Zeg alleen: Hallo FamilieApp!', null, 30)
  .then(function(text){
    if(s)s.innerHTML='<span style="color:#16a34a">✅ Werkt! Gemini zegt: "'+text.trim()+'"</span>';
  })
  .catch(function(e){
    if(s)s.innerHTML='<span style="color:#dc2626">❌ '+(e.message==='NO_KEY'?'Geen key ingesteld':e.message||'Verbindingsfout')+'</span>';
  });
}

function updateHeaderAvatar(){
  var av=document.getElementById('hdr-avatar');
  if(av)av.textContent=myInitials;
}

