'use strict';
// ============================================================
// CALENDAR MEAL PLAN INTEGRATION v1.1
// Projects MealPlanStore data into Agenda without duplicating records.
// Meal planner remains the source of truth.
// ============================================================
(function(){
  if(window.CalendarMealPlanIntegration)return;
  var VERSION='1.1.0',STYLE_ID='calendar-meal-plan-integration-style';
  var originalRenderCal=window.renderCal;
  var originalRenderCalEvents=window.renderCalEvents;

  function esc(v){return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
  function meals(){return window.MealPlanStore&&MealPlanStore.list?MealPlanStore.list():(Array.isArray(window.mealPlanData)?window.mealPlanData:[]);}
  function mealLabel(type){return type==='breakfast'?'Ontbijt':type==='lunch'?'Lunch':'Diner';}
  function mealTime(type){return type==='breakfast'?'08:00':type==='lunch'?'12:30':'18:00';}
  function mealIcon(type){return type==='breakfast'?'🌅':type==='lunch'?'🥗':'🍽️';}
  function ensureStyles(){
    if(document.getElementById(STYLE_ID))return;
    var s=document.createElement('style');s.id=STYLE_ID;s.textContent=''
      +'.cal-event.cal-meal{border-color:rgba(191,128,36,.22);background:linear-gradient(135deg,var(--c-surface,#fff),rgba(255,247,228,.72))}'
      +'[data-theme*="dark"] .cal-event.cal-meal{background:linear-gradient(135deg,var(--c-surface,#211f1b),rgba(67,49,26,.52));border-color:rgba(221,174,92,.24)}'
      +'.cal-meal .cal-premium-mark{background:linear-gradient(145deg,#fff0ca,#f6dd9b);color:#8b5d12;border-color:rgba(139,93,18,.14)}'
      +'.cal-meal-badge{display:inline-flex;align-items:center;gap:4px;border-radius:999px;padding:2px 7px;background:rgba(191,128,36,.1);color:#8b5d12;font-size:9.5px;font-weight:900;letter-spacing:.02em}'
      +'.cal-day.has-meal{position:relative;overflow:visible!important}.cal-day.has-meal:after{display:none!important}'
      +'.cal-meal-ribbon{position:absolute;left:50%;bottom:2px;transform:translateX(-50%);min-width:22px;height:13px;padding:0 4px;border-radius:5px;background:linear-gradient(135deg,#d89a31,#b97815);color:#fff;display:flex;align-items:center;justify-content:center;gap:2px;font-size:8px;font-weight:950;line-height:1;box-shadow:0 2px 5px rgba(128,78,10,.22);border:1px solid rgba(255,255,255,.38);pointer-events:none;white-space:nowrap}'
      +'.cal-day.today .cal-meal-ribbon{bottom:1px;background:linear-gradient(135deg,#f0b54c,#c9821d)}'
      +'.cal-day.sel .cal-meal-ribbon{box-shadow:0 2px 6px rgba(128,78,10,.3)}'
      +'.cal-meal-actions{display:flex;gap:8px;margin-top:8px}.cal-meal-link{border:0;border-radius:10px;padding:6px 9px;background:rgba(59,130,246,.1);color:#2563eb;font-size:10.5px;font-weight:850;cursor:pointer}';
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

  function mealCard(m){
    var type=m.mealType||'dinner',rid=m.recipeId==null?'':String(m.recipeId),recipeBtn=rid?'<button type="button" class="cal-meal-link" onclick="event.stopPropagation();CalendarMealPlanIntegration.openRecipe(\''+encodeURIComponent(rid)+'\')">Bekijk recept</button>':'';
    return '<div class="cal-event cal-premium cal-meal"><div class="cal-premium-mark">'+mealIcon(type)+'</div><div style="flex:1;min-width:0"><div class="cal-premium-title">'+esc(m.title||'Maaltijd')+'</div><div class="cal-premium-meta"><span>'+esc(mealTime(type))+'</span><span>•</span><span>'+esc(mealLabel(type))+'</span>'+(m.persons?'<span>•</span><span>👥 '+esc(m.persons)+'</span>':'')+'</div>'+(m.notes?'<div class="cal-premium-note-preview">'+esc(m.notes)+'</div>':'')+'<div class="cal-meal-actions"><span class="cal-meal-badge">🍴 Maaltijdplanning</span>'+recipeBtn+'</div></div></div>';
  }

  function renderEvents(){
    if(typeof originalRenderCalEvents==='function')originalRenderCalEvents();
    var el=document.getElementById('cal-events');if(!el)return;
    var selected=window.calSelDay||null,rows=selected?dayMeals(selected):meals().slice().sort(function(a,b){return String(a.date||'').localeCompare(String(b.date||''));});
    if(!rows.length)return;
    var existing=el.innerHTML;
    if(existing.indexOf('Geen afspraken op deze dag')>=0||existing.indexOf('Tik op een dag om afspraken te zien')>=0)existing='';
    el.innerHTML=existing+rows.map(mealCard).join('');
  }

  function renderCal(){if(typeof originalRenderCal==='function')originalRenderCal();markMealDays();}

  function openRecipe(encodedId){
    var id=decodeURIComponent(encodedId||'');
    if(typeof window.openRecipeDetail==='function'){if(typeof window.showScreen==='function')window.showScreen('recipes');setTimeout(function(){window.openRecipeDetail(id);},80);return;}
    if(typeof window.showToast==='function')window.showToast('Recept wordt geladen');
  }

  function refresh(){if(typeof window.renderCal==='function')window.renderCal();else renderEvents();}

  ensureStyles();window.renderCal=renderCal;window.renderCalEvents=renderEvents;window.addEventListener('familyapp:meals:changed',refresh);
  window.CalendarMealPlanIntegration={version:VERSION,refresh:refresh,openRecipe:openRecipe,markMealDays:markMealDays};setTimeout(refresh,80);
})();