'use strict';
// ============================================================
// CALENDAR MEAL PLAN INTEGRATION v1.2
// Projects MealPlanStore data into Agenda without duplicating records.
// Meal planner remains the source of truth; Agenda reads meals virtually.
//
// ROOT CAUSE FIXED IN THIS VERSION (v1.2):
// calendarSharedLive.js runs a boot() setInterval (every 250ms, up to
// ~60s) that calls patchCalendar(). patchCalendar() re-patches
// window.renderCalEvents any time it finds that function WITHOUT its own
// `__calendarSharedWrapped` marker. Because Firebase auth/family
// attachment (state.attached) can resolve slower than the sequential
// <script> chain in calendar.js, that interval can fire again *after*
// calendarPremiumUi.js and this file have already wrapped
// window.renderCalEvents - silently overwriting our wrapper with
// calendarSharedLive's plain version (no meal cards, generic "Geen
// afspraken op deze dag" placeholder). This is why the bug was
// intermittent: it only shows up when that race is lost, e.g. slower
// network/auth timing.
//
// Fix: a lightweight guard re-asserts our wrapper as
// window.renderCalEvents whenever it detects it has been replaced,
// instead of only wrapping once at load time. This is fully contained
// to this file - calendarSharedLive.js is untouched.
// ============================================================
(function(){
  if(window.CalendarMealPlanIntegration)return;
  var VERSION='1.2.0',STYLE_ID='calendar-meal-plan-integration-style';
  var originalRenderCal=window.renderCal;
  var originalRenderCalEvents=window.renderCalEvents;

  function esc(v){return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
  function meals(){return window.MealPlanStore&&MealPlanStore.list?MealPlanStore.list():(Array.isArray(window.mealPlanData)?window.mealPlanData:[]);}
  function mealLabel(type){return type==='breakfast'?'Ontbijt':type==='lunch'?'Lunch':'Diner';}
  function mealTime(type){return type==='breakfast'?'08:00':type==='lunch'?'12:30':'18:00';}
  function mealIcon(type){return type==='breakfast'?'🌅':type==='lunch'?'🥗':'🍽️';}
  function mealOrder(type){return type==='breakfast'?0:type==='lunch'?1:2;}

  function ensureStyles(){
    if(document.getElementById(STYLE_ID))return;
    var s=document.createElement('style');s.id=STYLE_ID;s.textContent=''
      // --- calendar-grid ribbon (unchanged) ---
      +'.cal-day.has-meal{position:relative;overflow:visible!important}.cal-day.has-meal:after{display:none!important}'
      +'.cal-meal-ribbon{position:absolute;left:50%;bottom:2px;transform:translateX(-50%);min-width:22px;height:13px;padding:0 4px;border-radius:5px;background:linear-gradient(135deg,#d89a31,#b97815);color:#fff;display:flex;align-items:center;justify-content:center;gap:2px;font-size:8px;font-weight:950;line-height:1;box-shadow:0 2px 5px rgba(128,78,10,.22);border:1px solid rgba(255,255,255,.38);pointer-events:none;white-space:nowrap}'
      +'.cal-day.today .cal-meal-ribbon{bottom:1px;background:linear-gradient(135deg,#f0b54c,#c9821d)}'
      +'.cal-day.sel .cal-meal-ribbon{box-shadow:0 2px 6px rgba(128,78,10,.3)}'
      // --- premium meal summary section (below the date, replaces/suppresses empty state) ---
      +'.cal-meal-summary{margin-top:10px;padding:12px 13px 13px;border-radius:18px;border:1px solid rgba(139,163,90,.28);background:linear-gradient(160deg,#fbf8ee,#f4efd9 55%,#f7f1de);box-shadow:0 6px 20px rgba(120,98,30,.08)}'
      +'[data-theme*="dark"] .cal-meal-summary{border-color:rgba(196,168,92,.24);background:linear-gradient(160deg,#241f16,#2b2418 55%,#241f16);box-shadow:0 6px 20px rgba(0,0,0,.25)}'
      +'.cal-meal-summary-title{display:flex;align-items:center;gap:6px;font-size:11.5px;font-weight:900;letter-spacing:.35px;text-transform:uppercase;color:#6b7c3f}'
      +'[data-theme*="dark"] .cal-meal-summary-title{color:#c9d99a}'
      +'.cal-meal-summary-list{display:flex;flex-direction:column;gap:8px;margin-top:9px}'
      +'.cal-meal-summary-card{display:flex;gap:10px;align-items:flex-start;padding:10px 11px;border-radius:14px;background:var(--c-surface,#fff);border:1px solid rgba(139,163,90,.2);box-shadow:0 2px 8px rgba(17,24,39,.05)}'
      +'[data-theme*="dark"] .cal-meal-summary-card{background:rgba(255,255,255,.03);border-color:rgba(196,168,92,.18)}'
      +'.cal-meal-summary-icon{flex:0 0 auto;width:34px;height:34px;border-radius:11px;display:flex;align-items:center;justify-content:center;font-size:17px;background:linear-gradient(145deg,#f1e8c8,#e4d59f);border:1px solid rgba(139,93,18,.14)}'
      +'[data-theme*="dark"] .cal-meal-summary-icon{background:linear-gradient(145deg,#3a3120,#4a3c22)}'
      +'.cal-meal-summary-body{flex:1;min-width:0}'
      +'.cal-meal-summary-name{font-size:13.5px;font-weight:800;letter-spacing:-.1px;color:var(--c-text);line-height:1.25}'
      +'.cal-meal-summary-meta{display:flex;align-items:center;gap:5px;flex-wrap:wrap;margin-top:4px;font-size:10.5px;font-weight:700;color:var(--c-text2)}'
      +'.cal-meal-summary-meta span.cal-meal-summary-type{color:#8b5d12}'
      +'[data-theme*="dark"] .cal-meal-summary-meta span.cal-meal-summary-type{color:#ddae5c}'
      +'.cal-meal-summary-note{font-size:11.5px;color:var(--c-text2);margin-top:5px;line-height:1.4;font-style:italic;overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}'
      +'.cal-meal-summary-actions{display:flex;gap:8px;margin-top:8px}'
      +'.cal-meal-summary-btn{border:0;border-radius:10px;padding:6px 10px;background:rgba(107,124,63,.12);color:#5a6b34;font-size:10.5px;font-weight:850;cursor:pointer}'
      +'[data-theme*="dark"] .cal-meal-summary-btn{background:rgba(196,168,92,.16);color:#ddae5c}';
    document.head.appendChild(s);
  }

  function dayMeals(date){return meals().filter(function(m){return m&&m.date===date;});}

  function markMealDays(){
    var grid=document.getElementById('cal-grid');if(!grid||typeof window.calYear!=='number'||typeof window.calMonth!=='number')return;
    var daysInMonth=new Date(window.calYear,window.calMonth+1,0).getDate();
    var cells=grid.querySelectorAll('.cal-day:not(.other-month)');
    for(var d=1;d<=daysInMonth;d++){
      var date=window.calYear+'-'+(window.calMonth+1<10?'0':'')+(window.calMonth+1)+'-'+(d<10?'0':'')+d;
      var cell=cells[d-1],rows=dayMeals(date);if(!cell||!rows.length)continue;
      cell.classList.add('has-meal');
      var ribbon=document.createElement('span');ribbon.className='cal-meal-ribbon';ribbon.setAttribute('aria-label',rows.length+' geplande maaltijd'+(rows.length===1?'':'en'));ribbon.textContent=rows.length>1?'🍽 '+rows.length:'🍽';cell.appendChild(ribbon);
    }
  }

  function summaryCard(m){
    var type=m.mealType||'dinner',rid=m.recipeId==null?'':String(m.recipeId);
    var recipeBtn=rid?'<button type="button" class="cal-meal-summary-btn" onclick="event.stopPropagation();CalendarMealPlanIntegration.openRecipe(\''+encodeURIComponent(rid)+'\')">Bekijk recept</button>':'';
    var metaParts=['<span class="cal-meal-summary-type">'+esc(mealLabel(type))+'</span>','<span>•</span>','<span>'+esc(mealTime(type))+'</span>'];
    if(m.persons)metaParts.push('<span>•</span>','<span>👥 '+esc(m.persons)+'</span>');
    var note=m.notes?'<div class="cal-meal-summary-note">'+esc(m.notes)+'</div>':'';
    var actions=recipeBtn?'<div class="cal-meal-summary-actions">'+recipeBtn+'</div>':'';
    return '<div class="cal-meal-summary-card">'
      +'<div class="cal-meal-summary-icon">'+mealIcon(type)+'</div>'
      +'<div class="cal-meal-summary-body">'
        +'<div class="cal-meal-summary-name">'+esc(m.title||'Maaltijd')+'</div>'
        +'<div class="cal-meal-summary-meta">'+metaParts.join('')+'</div>'
        +note+actions
      +'</div></div>';
  }

  function summarySection(rows){
    var sorted=rows.slice().sort(function(a,b){return mealOrder(a.mealType)-mealOrder(b.mealType);});
    return '<div class="cal-meal-summary"><div class="cal-meal-summary-title">🍽️ Geplande maaltijd'+(sorted.length===1?'':'en')+'</div>'
      +'<div class="cal-meal-summary-list">'+sorted.map(summaryCard).join('')+'</div></div>';
  }

  function renderEvents(){
    if(typeof originalRenderCalEvents==='function')originalRenderCalEvents();
    var el=document.getElementById('cal-events');if(!el)return;
    var selected=window.calSelDay||null;
    if(!selected)return; // only append the day-summary once a specific date is selected
    var rows=dayMeals(selected);
    if(!rows.length)return; // no meals this day -> leave whatever the base agenda rendered (incl. "Geen afspraken op deze dag") untouched
    var existing=el.innerHTML;
    if(existing.indexOf('Geen afspraken op deze dag')>=0)existing=''; // suppress the generic empty state, meals replace it
    el.innerHTML=existing+summarySection(rows);
  }

  function renderCal(){if(typeof originalRenderCal==='function')originalRenderCal();markMealDays();}

  function openRecipe(encodedId){
    var id=decodeURIComponent(encodedId||'');
    if(typeof window.openRecipeDetail==='function'){if(typeof window.showScreen==='function')window.showScreen('recipes');setTimeout(function(){window.openRecipeDetail(id);},80);return;}
    if(typeof window.showToast==='function')window.showToast('Recept wordt geladen');
  }

  function refresh(){if(typeof window.renderCal==='function')window.renderCal();else renderEvents();}

  // --- self-healing guard (see header comment: fixes the intermittent
  // "Geen afspraken op deze dag" bug caused by calendarSharedLive.js's
  // delayed boot() interval re-patching window.renderCalEvents after we
  // already wrapped it) ---
  var GUARD_INTERVAL_MS=300,GUARD_MAX_TICKS=260; // ~78s, comfortably longer than calendarSharedLive's own 250ms*240 boot window
  var guardTicks=0,guardTimer=setInterval(function(){
    guardTicks++;
    if(window.renderCalEvents!==renderEvents){
      originalRenderCalEvents=window.renderCalEvents;
      window.renderCalEvents=renderEvents;
      // if a day is currently selected, immediately repair the visible list
      if(window.calSelDay)renderEvents();
    }
    if(guardTicks>=GUARD_MAX_TICKS)clearInterval(guardTimer);
  },GUARD_INTERVAL_MS);

  ensureStyles();window.renderCal=renderCal;window.renderCalEvents=renderEvents;window.addEventListener('familyapp:meals:changed',refresh);
  window.CalendarMealPlanIntegration={version:VERSION,refresh:refresh,openRecipe:openRecipe,markMealDays:markMealDays};setTimeout(refresh,80);
})();
