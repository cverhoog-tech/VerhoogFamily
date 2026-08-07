'use strict';
// ============================================================
// NAVIGATION
// ============================================================

// ============================================================
// NAV CONFIG & DYNAMIC NAV
// ============================================================

var ALL_SCREENS = [
  {id:'home',         icon:'🏠', label:'Home'},
  {id:'tasks',        icon:'✅', label:'Taken'},
  {id:'notes',        icon:'📝', label:'Notities'},
  {id:'shop',         icon:'🛒', label:'Boodschappen'},
  {id:'cal',          icon:'📅', label:'Agenda'},
  {id:'finance',      icon:'💰', label:'Financiën'},
  {id:'achievements', icon:'🏆', label:'Achievements'},
  {id:'notif',        icon:'🔔', label:'Meldingen'},
  {id:'profile',      icon:'👤', label:'Profiel'},
  {id:'recipes',       icon:'🍳', label:'Recepten'},
  {id:'skills',        icon:'⚡', label:'Skills'},
  {id:'meals',         icon:'🗓️', label:'Maaltijden'},
  {id:'templates',     icon:'📋', label:'Templates'},
];

var navSlots = ['home','tasks','notes','more'];
var navConfigEditSlot = null;

function renderNav() {
  var nav = document.getElementById('bottom-nav');
  if(!nav) return;
  var currentScreen = _currentScreen || 'home';
  var html = '';

  for(var i=0;i<5;i++){
    if(i===2){
      // Center — Feed
      var active = currentScreen==='feed';
      html += '<button class="nav-btn nav-center'+(active?' active':'')+'" id="nav-feed-btn" onclick="showScreen(\'feed\')">'
        +'<div class="nav-center-inner">'
        +'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.4">'
        +'<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>'
        +'</div>'
        +'<span class="nav-label">Feed</span>'
        +'</button>';
    } else {
      var si = i<2 ? i : i-1;
      var slotId = navSlots[si];
      if(slotId === 'more'){
        html += '<button class="nav-btn" id="nav-more-btn">'
          +'<span class="nav-icon">···</span>'
          +'<span class="nav-label">Meer</span>'
          +'</button>';
      } else {
        var sc = ALL_SCREENS.find(function(s){return s.id===slotId;});
        if(sc){
          var isActive = currentScreen===slotId;
          html += '<button class="nav-btn'+(isActive?' active':'')+'" data-goto="'+slotId+'">'
            +'<span class="nav-icon">'+sc.icon+'</span>'
            +'<span class="nav-label">'+sc.label+'</span>'
            +'</button>';
        }
      }
    }
  }

  nav.innerHTML = html;

  // Attach events
  nav.querySelectorAll('[data-goto]').forEach(function(btn){
    btn.onclick = function(){ showScreen(btn.dataset.goto); };
  });
  var feedBtn = document.getElementById('nav-feed-btn');
  if(feedBtn) feedBtn.onclick = function(){ showScreen('feed'); };
  var moreBtn = document.getElementById('nav-more-btn');
  if(moreBtn) moreBtn.onclick = function(){ toggleMore(); };

  // More menu
  var navIds = navSlots.filter(function(s){return s!=='more';});
  navIds.push('feed');
  var moreScreens = ALL_SCREENS.filter(function(s){return navIds.indexOf(s.id)===-1;});
  var moreGrid = document.getElementById('more-grid');
  if(moreGrid){
    moreGrid.innerHTML = moreScreens.map(function(s){
      return '<button class="more-btn" data-goto-more="'+s.id+'">'
        +'<span style="font-size:22px">'+s.icon+'</span>'
        +'<span>'+s.label+'</span></button>';
    }).join('')
    +'<button class="more-btn" id="nav-config-btn" style="border:1.5px dashed var(--c-border)">'
      +'<span style="font-size:22px">⚙️</span><span>Aanpassen</span></button>';
    moreGrid.querySelectorAll('[data-goto-more]').forEach(function(btn){
      btn.onclick = function(){ showScreenMore(btn.dataset.gotoMore); };
    });
    var cfgBtn = document.getElementById('nav-config-btn');
    if(cfgBtn) cfgBtn.onclick = openNavConfig;
  }
}


function attachNavDelegation() {
  // Now handled directly in renderNav() — this is kept for backwards compat
  renderNav();
}

function attachNavConfigDelegation() {
  document.querySelectorAll('[data-setslot]').forEach(function(el) {
    el.onclick = function() { setNavSlot(el.dataset.setslot); };
  });
  document.querySelectorAll('[data-clearslot]').forEach(function(el) {
    el.onclick = function(e) { e.stopPropagation(); clearNavSlot(parseInt(el.dataset.clearslot)); };
  });
}
function openNavConfig() {
  closeMore();
  navConfigEditSlot=null;
  renderNavConfig();
  setTimeout(attachNavConfigDelegation, 10);
  document.getElementById('nav-config-overlay').classList.add('open');
}
function closeNavConfig() {
  document.getElementById('nav-config-overlay').classList.remove('open');
  navConfigEditSlot=null;
}
function renderNavConfig() {
  var slotsEl=document.getElementById('nav-config-slots');
  if(slotsEl){
    slotsEl.innerHTML='';
    for(var i=0;i<5;i++){
      var div=document.createElement('div');
      if(i===2){
        div.className='nav-slot center-slot';
        div.innerHTML='<div style="font-size:22px">📸</div><div class="nav-slot-lbl" style="color:#fff;opacity:.8">Feed</div>';
      } else {
        var si2=i<2?i:i-1;
        var slotId2=navSlots[si2];
        var sc2=slotId2==='more'?{icon:'···',label:'Meer'}:ALL_SCREENS.find(function(s){return s.id===slotId2;});
        var isEdit=navConfigEditSlot===si2;
        div.className='nav-slot'+(sc2?' filled':'')+(isEdit?' filled':'');
        if(isEdit)div.style.borderColor='var(--c-accent)';
        div.innerHTML='<div class="nav-slot-icon">'+(sc2?sc2.icon:'+')+'</div>'
          +'<div class="nav-slot-lbl">'+(sc2?sc2.label:'Leeg')+'</div>';
        if(sc2&&slotId2!=='more')div.innerHTML+='<div class="nav-slot-rm" data-clearslot="'+si2+'">✕</div>';
        (function(x){div.onclick=function(e){if(!e.target.classList.contains('nav-slot-rm'))selectNavSlot(x);};})(si2);
      }
      slotsEl.appendChild(div);
    }
  }
  var optEl=document.getElementById('nav-options-grid');
  if(optEl&&navConfigEditSlot!==null){
    var usedIds=navSlots.filter(function(s,i){return i!==navConfigEditSlot;});usedIds.push('feed');
    optEl.innerHTML=ALL_SCREENS.map(function(s){
      var used=usedIds.indexOf(s.id)>-1;
      return '<div class="nav-option'+(used?' used':'')+'" data-setslot="'+s.id+'">'
        +'<div>'+s.icon+'</div><div class="nav-option-lbl">'+s.label+'</div></div>';
    }).join('')
    +'<div class="nav-option" data-setslot="more">'
      +'<div>···</div><div class="nav-option-lbl">Meer</div></div>';
  } else if(optEl){
    optEl.innerHTML='<div style="grid-column:1/-1;text-align:center;padding:14px;color:var(--c-text2);font-size:13px">👆 Tik op een vakje om te wijzigen</div>';
  }
}
function selectNavSlot(idx){navConfigEditSlot=idx;renderNavConfig();setTimeout(attachNavConfigDelegation,10);}
function setNavSlot(screenId){if(navConfigEditSlot===null)return;navSlots[navConfigEditSlot]=screenId;navConfigEditSlot=null;renderNavConfig();renderNav();setTimeout(attachNavDelegation,10);setTimeout(attachNavConfigDelegation,10);showToast('Navigatie opgeslagen ✓');}
function clearNavSlot(idx){navSlots[idx]='more';renderNavConfig();renderNav();}

var screenTitles = {home:'FamilieApp 🌿',tasks:'Taken',feed:'Feed',notes:'Notities',shop:'Boodschappen',cal:'Agenda',finance:'Financiën',notif:'Meldingen',achievements:'🏆 Achievements',profile:'Profiel',recipes:'Recepten 🍳',skills:'⚡ Skills',meals:'🗓️ Maaltijdplanner',templates:'📋 Taak Templates'};

// ── NAVIGATION STATE ──
var _currentScreen = 'home';
var _navBusy = false;
var _pendingScreen = null;

function showScreen(id) {
  if(id === _currentScreen && !_navBusy) {
    // Already here — just re-render if needed
    _renderScreen(id);
    return;
  }
  // If a nav is in progress, queue this one
  if(_navBusy) { _pendingScreen = id; return; }

  _navBusy = true;
  _pendingScreen = null;

  var prev = document.getElementById('screen-'+_currentScreen);
  var next = document.getElementById('screen-'+id);
  if(!next) { _navBusy = false; return; }

  // Update header & nav instantly
  document.getElementById('hdr-title').textContent = screenTitles[id]||'FamilieApp';
  closeMore();
  visitedScreens.add(id);
  _currentScreen = id;
  renderNav();

  // Switch screens — show next immediately, hide prev
  document.querySelectorAll('.screen').forEach(function(s){
    s.classList.remove('active');
  });
  next.classList.add('active');

  // Render content via RAF so the CSS paint happens first
  requestAnimationFrame(function(){
    _renderScreen(id);
    _navBusy = false;
    // Handle any queued navigation
    if(_pendingScreen) {
      var queued = _pendingScreen;
      _pendingScreen = null;
      showScreen(queued);
    }
  });

  // AI panel context update
  if(typeof aiPanelOpen !== 'undefined' && aiPanelOpen) {
    aiCurrentScreen = '';
    updateAiContext();
  }
}

function _renderScreen(id) {
  if(id==='home')         renderHome();
  else if(id==='tasks')   {
    // Always reset to overzicht + use v023 UI
    taskTab='overzicht';
    document.querySelectorAll('.ttab').forEach(function(b){b.classList.remove('active');});
    var first=document.querySelector('.ttab');if(first)first.classList.add('active');
    setTimeout(function(){
      var famRenderFn = (typeof render === 'function') ? render : window.famRender;
      if(window.__famV023 && typeof famRenderFn === 'function') {
        var r=document.getElementById('task-content')||document.querySelector('.task-content');
        if(r){r.dataset.v023='';famRenderFn(true);}
      }
    }, 50);
  }
  else if(id==='shop')    renderShop();
  else if(id==='notes')   renderNotes();
  else if(id==='cal')     renderCal();
  else if(id==='finance') renderFinance();
  else if(id==='notif')   renderNotifs();
  else if(id==='achievements') renderAch();
  else if(id==='recipes') renderRecipes();
  else if(id==='profile') renderProfile();
  else if(id==='feed')    renderFeed();
  else if(id==='skills')  renderSkills();
  else if(id==='meals')   renderMeals();
  else if(id==='templates') renderTemplates();
}

function showScreenMore(id){closeMore();showScreen(id);}
function toggleMore(){document.getElementById('more-menu').classList.toggle('open');}
function closeMore(){document.getElementById('more-menu').classList.remove('open');}


