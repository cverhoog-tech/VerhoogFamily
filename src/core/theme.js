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

var THEME_BGS = {
  nature: '<svg viewBox="0 0 480 280" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice"><ellipse cx="400" cy="40" rx="120" ry="120" fill="#2d5a27" opacity=".06"/><ellipse cx="60" cy="200" rx="80" ry="80" fill="#4a8a42" opacity=".05"/><circle cx="320" cy="220" r="60" fill="#2d5a27" opacity=".04"/><text x="350" y="120" font-size="48" opacity=".12">🌿</text><text x="30" y="80" font-size="32" opacity=".1">🍃</text><text x="200" y="240" font-size="28" opacity=".09">✨</text></svg>',
  kawaii: '<svg viewBox="0 0 480 280" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice"><circle cx="420" cy="50" r="90" fill="#f472b6" opacity=".08"/><circle cx="80" cy="180" r="60" fill="#e05c9a" opacity=".06"/><circle cx="260" cy="230" r="50" fill="#f9a8d4" opacity=".07"/><text x="340" y="130" font-size="52" opacity=".18">🐱</text><text x="40" y="90" font-size="28" opacity=".15">🌸</text><text x="170" y="60" font-size="22" opacity=".13">💕</text><text x="60" y="240" font-size="22" opacity=".12">⭐</text><text x="400" y="230" font-size="18" opacity=".12">🌷</text></svg>',
  winter: '<svg viewBox="0 0 480 280" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice"><circle cx="380" cy="60" r="100" fill="#38bdf8" opacity=".07"/><circle cx="100" cy="200" r="70" fill="#1a6fa8" opacity=".06"/><text x="340" y="120" font-size="48" opacity=".14">❄️</text><text x="60" y="80" font-size="30" opacity=".12">🌨</text><text x="200" y="250" font-size="26" opacity=".11">⛄</text><text x="410" y="220" font-size="22" opacity=".11">✨</text></svg>',
  autumn: '<svg viewBox="0 0 480 280" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice"><ellipse cx="400" cy="40" rx="110" ry="100" fill="#f59e0b" opacity=".08"/><ellipse cx="70" cy="210" rx="75" ry="65" fill="#b45309" opacity=".06"/><text x="340" y="120" font-size="48" opacity=".15">🍂</text><text x="55" y="80" font-size="30" opacity=".13">🍁</text><text x="190" y="250" font-size="26" opacity=".12">🎃</text><text x="405" y="230" font-size="22" opacity=".11">🌰</text></svg>',
  modern: '<svg viewBox="0 0 480 280" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice"><rect x="330" y="-20" width="180" height="180" rx="40" fill="#8b5cf6" opacity=".07" transform="rotate(20 420 70)"/><circle cx="80" cy="220" r="70" fill="#6366f1" opacity=".06"/><rect x="180" y="200" width="100" height="100" rx="20" fill="#c4b5fd" opacity=".06" transform="rotate(-15 230 250)"/><text x="350" y="120" font-size="44" opacity=".13">⚡</text><text x="55" y="85" font-size="28" opacity=".12">🔷</text><text x="200" y="240" font-size="22" opacity=".1">💫</text></svg>',
  summer: '<svg viewBox="0 0 480 280" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice"><circle cx="400" cy="50" r="100" fill="#10b981" opacity=".07"/><circle cx="80" cy="190" r="65" fill="#059669" opacity=".06"/><text x="340" y="120" font-size="48" opacity=".14">☀️</text><text x="55" y="80" font-size="30" opacity=".12">🌺</text><text x="195" y="248" font-size="26" opacity=".11">🌊</text><text x="405" y="225" font-size="22" opacity=".11">🐚</text></svg>'
};

var currentTheme = 'nature';
var isDark = (function(){
  var saved = localStorage.getItem('familie_theme_dark');
  if(saved !== null) return saved === '1';
  return false;
})();
var themePreferenceRef = null;
var themePreferenceUid = null;

function themeAuthUser(){try{return window.fbUser||(window.firebase&&firebase.auth&&firebase.auth().currentUser)||null;}catch(e){return null;}}
function themeDb(){try{return window.fbDb||(window.firebase&&firebase.database&&firebase.database())||null;}catch(e){return null;}}
function validThemeId(id){return THEMES.some(function(t){return t.id===id;});}

function cacheThemePreference(){
  try{localStorage.setItem('familie_theme_dark',isDark?'1':'0');}catch(e){}
}
function persistThemePreference(){
  cacheThemePreference();
  var u=themeAuthUser(),d=themeDb();
  if(!u||!d)return Promise.resolve(false);
  var stamp=(window.firebase&&firebase.database&&firebase.database.ServerValue)?firebase.database.ServerValue.TIMESTAMP:Date.now();
  return d.ref('users/'+u.uid+'/preferences/theme').set({themeId:currentTheme,dark:!!isDark,updatedAt:stamp}).then(function(){return true;});
}
function stopThemePreferenceSync(){
  if(themePreferenceRef)try{themePreferenceRef.off();}catch(e){}
  themePreferenceRef=null;themePreferenceUid=null;
}
function syncThemePreference(){
  var u=themeAuthUser(),d=themeDb();
  if(!u||!d)return false;
  if(themePreferenceRef&&themePreferenceUid===u.uid)return true;
  stopThemePreferenceSync();
  themePreferenceUid=u.uid;
  themePreferenceRef=d.ref('users/'+u.uid+'/preferences/theme');
  themePreferenceRef.on('value',function(snap){
    var pref=snap.val();
    if(pref&&typeof pref==='object'){
      var nextTheme=validThemeId(pref.themeId)?pref.themeId:currentTheme;
      var nextDark=typeof pref.dark==='boolean'?pref.dark:isDark;
      // applyTheme() updates the module-level isDark/currentTheme state; the
      // cache write must happen after that so it stores the incoming server
      // preference instead of whatever was set locally before this sync.
      applyTheme(nextTheme,nextDark);
      cacheThemePreference();
      return;
    }
    // One-time migration of the existing local preference. Firebase becomes authoritative afterwards.
    persistThemePreference().catch(function(err){console.warn('[Theme] preference migration failed',err);});
  });
  return true;
}

if(window.matchMedia){
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change',function(e){
    if(localStorage.getItem('familie_theme_dark')===null && !themePreferenceUid){ isDark=e.matches; applyTheme(currentTheme,isDark); }
  });
}

function applyTheme(themeId, dark) {
  currentTheme = validThemeId(themeId)?themeId:'nature';
  isDark = !!dark;
  var attr = '';
  if(currentTheme === 'nature') attr = isDark ? 'dark' : '';
  else attr = currentTheme + (isDark ? '-dark' : '');
  document.documentElement.setAttribute('data-theme', attr);
  updateDarkToggleUI();
  updateThemeGridUI();
  renderHomeBg(currentTheme);
}
function setTheme(themeId){
  applyTheme(themeId,isDark);
  persistThemePreference().catch(function(err){console.warn('[Theme] preference save failed',err);});
}

// App icoon logica → src/core/appIcon.js
var customBgs = {};
var bgEditTheme = null;
var BUILTIN_VISUALS = {
  whiteDashboard: 'familieapp_white_assets/familyapp_white_dashboard.webp',
  whiteDashboardMobile: 'familieapp_white_assets/familyapp_white_dashboard_mobile.webp',
  appIcon: 'familieapp_white_assets/familyapp_app_icon.png',
  iconSheet: 'familieapp_white_assets/familyapp_icon_sheet.webp'
};

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
    var blur = custom.blur !== undefined ? custom.blur : 8;
    var opacity = custom.opacity !== undefined ? custom.opacity / 100 : 0.20;
    bg.innerHTML = '';
    bg.style.backgroundImage = 'url('+custom.photo+')';
    bg.style.backgroundSize  = 'cover';
    bg.style.backgroundPosition = 'center top';
    bg.style.filter = 'blur('+blur+'px)';
    bg.style.opacity = opacity;
    bg.style.transform = 'scale(1.08)';
  } else {
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
      +'font-size:11px;font-weight:700;cursor:pointer;position:relative">'
      + t.label.split(' ').slice(1).join(' ')
      +(hasCustBg?'<span style="position:absolute;top:-4px;right:-4px;width:8px;height:8px;background:var(--c-primary);border-radius:50%;border:1.5px solid var(--c-surface)"></span>':'')
      +'</button>';
  }).join('');
  tabsEl.querySelectorAll('[data-bgtheme]').forEach(function(btn){btn.onclick=function(){bgEditTheme=btn.dataset.bgtheme;renderBgEditor();};});

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
    if(emptyWrap) emptyWrap.style.display = 'none';
    if(previewImg) previewImg.src = custom.photo;
    var bl = custom.blur !== undefined ? custom.blur : 8;
    var op = custom.opacity !== undefined ? custom.opacity : 20;
    if(blurInp) blurInp.value = bl;
    if(opacityInp) opacityInp.value = op;
    if(blurVal) blurVal.textContent = bl+'px';
    if(opacityVal) opacityVal.textContent = op+'%';
  } else {
    if(previewWrap) previewWrap.style.display = 'none';
    if(emptyWrap) emptyWrap.style.display = 'flex';
    if(blurInp) blurInp.value = 8;
    if(opacityInp) opacityInp.value = 20;
    if(blurVal) blurVal.textContent = '8px';
    if(opacityVal) opacityVal.textContent = '20%';
  }
  var fileInp = document.getElementById('bg-file-inp');
  if(fileInp) {
    fileInp.onchange = function(e){
      var file = e.target.files[0];
      if(!file) return;
      var reader = new FileReader();
      reader.onload = function(ev){
        if(!customBgs[bgEditTheme]) customBgs[bgEditTheme] = {};
        customBgs[bgEditTheme].photo = ev.target.result;
        customBgs[bgEditTheme].blur = parseInt(document.getElementById('bg-blur').value)||8;
        customBgs[bgEditTheme].opacity = parseInt(document.getElementById('bg-opacity').value)||20;
        renderBgEditor();
        if(bgEditTheme === currentTheme) renderHomeBg(currentTheme);
        document.getElementById('bg-save-status').innerHTML = '<span style="color:#d97706">📸 Foto geladen — tik Opslaan om te bewaren</span>';
      };
      reader.readAsDataURL(file);
      fileInp.value = '';
    };
  }
}

function updateBgBlur(val) {
  var el = document.getElementById('bg-blur-val');
  if(el) el.textContent = val+'px';
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
    document.getElementById('bg-save-status').innerHTML = '<span style="color:#dc2626">Upload eerst een foto</span>';
    return;
  }
  custom.blur = parseInt(document.getElementById('bg-blur').value)||8;
  custom.opacity = parseInt(document.getElementById('bg-opacity').value)||20;
  saveCustomBgs();
  if(bgEditTheme === currentTheme) renderHomeBg(currentTheme);
  renderBgEditor();
  var t = THEMES.find(function(x){return x.id===bgEditTheme;});
  document.getElementById('bg-save-status').innerHTML = '<span style="color:#16a34a">✓ Opgeslagen voor thema '+(t?t.label:bgEditTheme)+'</span>';
  showToast('Achtergrond opgeslagen ✓');
}
function removeBgPhoto() {
  if(customBgs[bgEditTheme]) {
    customBgs[bgEditTheme] = {};
    saveCustomBgs();
    if(bgEditTheme === currentTheme) renderHomeBg(currentTheme);
    renderBgEditor();
    document.getElementById('bg-save-status').innerHTML = '<span style="color:var(--c-text2)">Achtergrond verwijderd</span>';
  }
}

function toggleDark() {
  applyTheme(currentTheme,!isDark);
  persistThemePreference().catch(function(err){console.warn('[Theme] preference save failed',err);});
}

function updateDarkToggleUI() {
  var btn = document.getElementById('dark-toggle');
  var knob = document.getElementById('dark-knob');
  if(btn&&knob){
    btn.style.background = isDark ? 'var(--c-primary)' : 'var(--c-border)';
    knob.style.transform = isDark ? 'translateX(22px)' : 'translateX(0)';
    knob.textContent = isDark ? '🌙' : '☀️';
  }
  var homeBtn=document.getElementById('home-dark-toggle');
  if(homeBtn){
    homeBtn.setAttribute('aria-pressed',isDark?'true':'false');
    homeBtn.setAttribute('title',isDark?'Lichte modus':'Donkere modus');
    homeBtn.innerHTML=(window.FamilyIcons&&FamilyIcons.svg)?FamilyIcons.svg(isDark?'sun':'moon',18):(isDark?'☀️':'🌙');
  }
}

function renderThemeGrid() {
  var grid = document.getElementById('theme-grid');
  if(!grid) return;
  grid.innerHTML = THEMES.map(function(t) {
    var active = currentTheme === t.id;
    return '<button onclick="setTheme(\''+t.id+'\')" style="'
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
function updateThemeGridUI() { renderThemeGrid(); }

function themeParticles(el) {
  if(currentTheme === 'kawaii') spawnKawaiiParticles(el);
  else spawnParticles(el);
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

window.addEventListener('familyapp:auth-ready',syncThemePreference);
window.addEventListener('familyapp:household-identity-synced',syncThemePreference);
window.addEventListener('familyapp:household-changed',syncThemePreference);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',syncThemePreference);else syncThemePreference();

// Profiel logica → src/core/profile.legacy.js